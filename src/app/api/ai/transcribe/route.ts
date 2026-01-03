// src/app/api/ai/transcribe/route.ts
// OpenAI Whisper Speech-to-Text API

import { NextRequest, NextResponse } from 'next/server'
import { getSessionWithOrg, unauthorized, badRequest, withRateLimit, RATE_LIMITS } from '@/lib/api-utils'
import { captureException } from '@/lib/error-tracking'
import OpenAI from 'openai'

// Lazy initialization to avoid build-time errors when API key is not set
let openai: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return openai
}

export async function POST(req: NextRequest) {
  // Validate API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not configured')
    return NextResponse.json(
      { error: 'Speech recognition service not configured' },
      { status: 500 }
    )
  }

  // Get authenticated user and organization
  const user = await getSessionWithOrg()
  if (!user?.organizationId) {
    return unauthorized()
  }

  // Rate limit AI requests (uses same limit as AI chat)
  const rateLimitResponse = withRateLimit(req, user.organizationId, RATE_LIMITS.ai, 'ai-transcribe')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return badRequest('Audio file is required')
    }

    // Validate file size (max 25MB - Whisper limit)
    if (audioFile.size > 25 * 1024 * 1024) {
      return badRequest('Audio file too large. Maximum size is 25MB.')
    }

    // Call OpenAI Whisper API
    const transcription = await getOpenAIClient().audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // Can be made dynamic based on user preferences
    })

    return NextResponse.json({
      text: transcription.text
    })

  } catch (error) {
    captureException(error, {
      organizationId: user.organizationId,
      endpoint: 'ai-transcribe',
    })

    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    )
  }
}
