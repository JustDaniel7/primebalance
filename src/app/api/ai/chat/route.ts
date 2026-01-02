// src/app/api/ai/chat/route.ts
// DeepSeek AI Chat API with function calling

import { NextRequest, NextResponse } from 'next/server'
import { getSessionWithOrg, unauthorized, badRequest, withRateLimit, RATE_LIMITS } from '@/lib/api-utils'
import { AI_TOOLS } from '@/lib/ai/tools'
import { executeToolCall } from '@/lib/ai/handlers'
import { captureException } from '@/lib/error-tracking'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

// System prompt for PrimeBalance AI Assistant
const SYSTEM_PROMPT = `You are the PrimeBalance AI Assistant, an intelligent financial management assistant for the PrimeBalance platform. PrimeBalance is a comprehensive financial management and accounting platform for businesses.

Your capabilities include:
- Analyzing transactions, expenses, and income patterns
- Reviewing invoices, receivables, and payment status
- Examining company assets and depreciation
- Tracking customer relationships and revenue
- Monitoring project budgets and financial performance
- Reviewing key performance indicators (KPIs)
- Providing financial insights and recommendations

Guidelines:
- Always use the available tools to fetch real data before answering questions about financial data
- Provide clear, actionable insights based on the data
- Format currency values properly and highlight important figures
- When discussing trends, be specific about timeframes and percentages
- If you don't have enough data to answer a question, ask clarifying questions
- Be concise but thorough - prioritize the most important information
- Proactively suggest relevant follow-up analyses when appropriate
- Always maintain a professional, helpful tone

You have access to tools that can query the organization's financial data. Use them to provide accurate, data-driven responses.`

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  reasoning_content?: string // Required for deepseek-reasoner model
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: { name: string; arguments: string }
  }>
  tool_call_id?: string
}

// Use deepseek-chat for tool calls (reasoner doesn't support tools)
async function callDeepSeekWithTools(messages: ChatMessage[]): Promise<Response> {
  return fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      tools: AI_TOOLS,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 2048
    })
  })
}

// Use deepseek-reasoner for final analysis (better reasoning performance)
async function callDeepSeekReasoner(messages: ChatMessage[]): Promise<Response> {
  // Filter out tool-related fields for reasoner (it doesn't support them)
  const cleanMessages = messages.map(m => {
    if (m.role === 'tool') {
      // Convert tool results to user context
      return { role: 'user' as const, content: `[Data Result]: ${m.content}` }
    }
    // Remove tool_calls from assistant messages
    const { tool_calls, ...rest } = m
    return rest
  })

  return fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-reasoner',
      messages: cleanMessages,
      temperature: 0.7,
      max_tokens: 4096
    })
  })
}

export async function POST(req: NextRequest) {
  // Validate API key is configured
  if (!DEEPSEEK_API_KEY) {
    console.error('DEEPSEEK_API_KEY not configured')
    return NextResponse.json(
      { error: 'AI service not configured' },
      { status: 500 }
    )
  }

  // Get authenticated user and organization
  const user = await getSessionWithOrg()
  if (!user?.organizationId) {
    return unauthorized()
  }

  // Rate limit AI requests (20 per minute)
  const rateLimitResponse = withRateLimit(req, user.organizationId, RATE_LIMITS.ai, 'ai-chat')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await req.json()
    const { messages: clientMessages } = body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
    }

    if (!clientMessages || !Array.isArray(clientMessages) || clientMessages.length === 0) {
      return badRequest('Messages array is required')
    }

    // Build conversation with system prompt
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...clientMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    ]

    // Phase 1: Use deepseek-chat with tools to fetch data
    let response = await callDeepSeekWithTools(messages)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      captureException(new Error(`DeepSeek API error: ${response.status}`), {
        organizationId: user.organizationId,
        endpoint: 'ai-chat',
        extra: { status: response.status, errorData }
      })
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 503 }
      )
    }

    let data = await response.json()
    let assistantMessage = data.choices?.[0]?.message

    // Handle tool calls (function calling loop) with deepseek-chat
    let iterations = 0
    const maxIterations = 5
    let usedTools = false

    while (
      assistantMessage?.tool_calls &&
      assistantMessage.tool_calls.length > 0 &&
      iterations < maxIterations
    ) {
      iterations++
      usedTools = true

      // Add assistant message with tool calls
      messages.push({
        role: 'assistant',
        content: assistantMessage.content || '',
        tool_calls: assistantMessage.tool_calls
      })

      // Execute each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name
        let functionArgs: Record<string, unknown> = {}

        try {
          functionArgs = JSON.parse(toolCall.function.arguments || '{}')
        } catch (e) {
          console.error('Failed to parse function arguments:', toolCall.function.arguments)
        }

        // Execute the tool with organization context
        const result = await executeToolCall(
          functionName,
          functionArgs,
          user.organizationId
        )

        // Add tool result to conversation
        messages.push({
          role: 'tool',
          content: result,
          tool_call_id: toolCall.id
        })
      }

      // Continue with deepseek-chat for more tool calls
      response = await callDeepSeekWithTools(messages)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        captureException(new Error(`DeepSeek API error during tool processing: ${response.status}`), {
          organizationId: user.organizationId,
          endpoint: 'ai-chat',
          action: 'tool-processing',
          extra: { status: response.status, errorData, iteration: iterations }
        })
        return NextResponse.json(
          { error: 'AI service temporarily unavailable' },
          { status: 503 }
        )
      }

      data = await response.json()
      assistantMessage = data.choices?.[0]?.message
    }

    // Phase 2: If tools were used, get final analysis from deepseek-reasoner
    if (usedTools) {
      // Add the chat model's response as context
      if (assistantMessage?.content) {
        messages.push({
          role: 'assistant',
          content: assistantMessage.content
        })
        // Ask reasoner to provide final analysis
        messages.push({
          role: 'user',
          content: 'Based on the data above, provide a thorough analysis with insights and recommendations.'
        })
      }

      response = await callDeepSeekReasoner(messages)

      if (!response.ok) {
        // Fallback to chat model response if reasoner fails
        const content = assistantMessage?.content || 'I apologize, but I was unable to generate a response.'
        return NextResponse.json({ role: 'assistant', content, usage: data.usage })
      }

      data = await response.json()
      assistantMessage = data.choices?.[0]?.message
    }

    // Extract final response
    const content = assistantMessage?.content || 'I apologize, but I was unable to generate a response. Please try again.'

    return NextResponse.json({
      role: 'assistant',
      content,
      reasoning: assistantMessage?.reasoning_content, // Include reasoning if available
      usage: data.usage
    })

  } catch (error) {
    captureException(error, {
      organizationId: user.organizationId,
      endpoint: 'ai-chat',
    })
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}
