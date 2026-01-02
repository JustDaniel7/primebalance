// src/app/api/tax/optimize/route.ts
// Tax Optimization Analysis API - Template-based + AI-enhanced modes

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'
import {
  CorporateEntity,
  CorporateStructure,
  EntityType,
  TaxOptimizationSuggestion,
  OptimizationCategory,
} from '@/types/tax'
import {
  analyzeStructureForOptimizations,
  OptimizationContext,
  OptimizationResult,
} from '@/lib/tax-optimization-engine'
import { getJurisdiction } from '@/data/jurisdictions'

// DeepSeek API configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

// Optimization modes
export type OptimizationMode = 'template' | 'ai'

// =============================================================================
// DB ENTITY TO TAX ENGINE CONVERSION
// =============================================================================

interface DBEntity {
  id: string
  name: string
  type: string
  jurisdiction: string
  taxId: string | null
  parentId: string | null
  ownershipPercent: number | null
  revenue: number | null
  expenses: number | null
  taxLiability: number | null
  effectiveTaxRate: number | null
  isActive: boolean
}

function mapDBTypeToEntityType(dbType: string): EntityType {
  const typeMap: Record<string, EntityType> = {
    PARENT: EntityType.PARENT,
    HOLDING: EntityType.HOLDING,
    SUBSIDIARY: EntityType.SUBSIDIARY,
    BRANCH: EntityType.BRANCH,
    PE: EntityType.PERMANENT_ESTABLISHMENT,
    PERMANENT_ESTABLISHMENT: EntityType.PERMANENT_ESTABLISHMENT,
    OPERATING_COMPANY: EntityType.OPERATING_COMPANY,
    IP_HOLDING: EntityType.IP_HOLDING,
    JOINT_VENTURE: EntityType.JOINT_VENTURE,
    CORPORATION: EntityType.CORPORATION,
    REPRESENTATIVE_OFFICE: EntityType.REPRESENTATIVE_OFFICE,
  }
  return typeMap[dbType] || EntityType.SUBSIDIARY
}

function convertDBEntitiesToStructure(entities: DBEntity[]): CorporateStructure | null {
  if (entities.length === 0) return null

  // Find root entity (no parent)
  const rootEntity = entities.find(e => !e.parentId)
  if (!rootEntity) {
    // If no root, use the first entity
    const firstEntity = entities[0]
    if (!firstEntity) return null
  }

  const ultimateParentId = rootEntity?.id || entities[0].id

  // Convert DB entities to CorporateEntity format
  const corporateEntities: CorporateEntity[] = entities.map(e => {
    const jurisdiction = getJurisdiction(e.jurisdiction)

    return {
      id: e.id,
      name: e.name,
      legalName: e.name,
      type: mapDBTypeToEntityType(e.type),
      jurisdictionCode: e.jurisdiction,
      parentEntityId: e.parentId,
      ownershipPercentage: e.ownershipPercent || 100,
      fiscalYearEnd: '12-31',
      functionalCurrency: jurisdiction?.currency || 'USD',
      isConsolidated: true,
      isPermanentEstablishment: e.type === 'PE' || e.type === 'PERMANENT_ESTABLISHMENT',
      peOfEntityId: (e.type === 'PE' || e.type === 'PERMANENT_ESTABLISHMENT') ? e.parentId || undefined : undefined,
      status: e.isActive ? 'ACTIVE' : 'DORMANT',
      taxId: e.taxId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  })

  return {
    id: `structure-${Date.now()}`,
    name: rootEntity?.name || 'Corporate Structure',
    entities: corporateEntities,
    ownershipStakes: [],
    ultimateParentId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// =============================================================================
// ENHANCED DESCRIPTION TEMPLATES
// =============================================================================

interface TemplateContext {
  entityCount: number
  totalRevenue: number
  jurisdictions: string[]
  hasHighTaxEntities: boolean
  hasDividendFlows: boolean
  hasRoyaltyFlows: boolean
  hasIntercompanyTransactions: boolean
}

function enhanceSuggestionDescription(
  suggestion: TaxOptimizationSuggestion,
  context: TemplateContext
): TaxOptimizationSuggestion {
  // Add executive summary based on category
  const executiveSummaries: Record<OptimizationCategory, string> = {
    [OptimizationCategory.HOLDING_STRUCTURE]:
      `Based on your current ${context.entityCount}-entity structure across ${context.jurisdictions.length} jurisdiction(s), restructuring could yield significant withholding tax savings.`,
    [OptimizationCategory.TRANSFER_PRICING]:
      `Your intercompany arrangements may benefit from transfer pricing optimization to ensure arm's length compliance while maximizing tax efficiency.`,
    [OptimizationCategory.DTA_UTILIZATION]:
      `Treaty network analysis suggests potential withholding tax reductions through optimal routing of cross-border payments.`,
    [OptimizationCategory.ENTITY_RESTRUCTURING]:
      `Structural adjustments to your corporate hierarchy could improve operational efficiency and tax outcomes.`,
    [OptimizationCategory.FINANCING_ARRANGEMENT]:
      `Intercompany financing optimization could shift deductible interest expenses to higher-tax jurisdictions.`,
    [OptimizationCategory.IP_PLANNING]:
      `Intellectual property restructuring with appropriate substance could access favorable IP box regimes.`,
    [OptimizationCategory.DIVIDEND_ROUTING]:
      `Dividend flow optimization through treaty-efficient jurisdictions could reduce cash leakage.`,
    [OptimizationCategory.LOSS_UTILIZATION]:
      `Losses within the group may be utilized more efficiently through restructuring or group relief mechanisms.`,
    [OptimizationCategory.TAX_CREDITS]:
      `Available tax credits and incentives in your operating jurisdictions may not be fully utilized.`,
    [OptimizationCategory.INCENTIVE_PROGRAMS]:
      `Government incentive programs in your jurisdictions offer potential benefits for qualifying activities.`,
    [OptimizationCategory.PE_OPTIMIZATION]:
      `Permanent establishment structures may benefit from conversion to subsidiaries or optimization.`,
  }

  const summary = suggestion.category ? executiveSummaries[suggestion.category] : ''

  // Enhanced description with context
  const enhancedDescription = summary
    ? `${summary}\n\n${suggestion.description}`
    : suggestion.description

  return {
    ...suggestion,
    description: enhancedDescription,
  }
}

function generateExecutiveSummary(result: OptimizationResult, context: TemplateContext): string {
  const highPriority = result.suggestions.filter(s => s.priority === 'HIGH').length
  const mediumPriority = result.suggestions.filter(s => s.priority === 'MEDIUM').length

  const parts: string[] = []

  if (result.suggestions.length === 0) {
    return 'No significant optimization opportunities identified at this time. Your current structure appears well-optimized for your operational profile.'
  }

  parts.push(`Analysis identified ${result.suggestions.length} optimization opportunities`)

  if (highPriority > 0) {
    parts.push(`including ${highPriority} high-priority item${highPriority > 1 ? 's' : ''}`)
  }

  if (result.potentialSavings > 0) {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(result.potentialSavings)
    parts.push(`with estimated annual savings potential of ${formatted}`)
  }

  return parts.join(' ') + '.'
}

// =============================================================================
// DEEPSEEK AI ENHANCEMENT
// =============================================================================

interface AIEnhancedSuggestion {
  index: number
  enhancedDescription: string
  keyInsights: string[]
  actionableSteps: string[]
  riskAssessment: string
}

async function enhanceSuggestionsWithAI(
  suggestions: TaxOptimizationSuggestion[],
  context: TemplateContext,
  entities: DBEntity[]
): Promise<TaxOptimizationSuggestion[]> {
  if (!DEEPSEEK_API_KEY || suggestions.length === 0) {
    return suggestions
  }

  // Build context for AI
  const structureSummary = entities.map(e => {
    const j = getJurisdiction(e.jurisdiction)
    return `- ${e.name} (${e.type}) in ${j?.name || e.jurisdiction}${e.revenue ? `, revenue: $${e.revenue.toLocaleString()}` : ''}`
  }).join('\n')

  // Limit to top 5 suggestions for cost efficiency
  const topSuggestions = suggestions.slice(0, 5)

  const suggestionsSummary = topSuggestions.map((s, i) => `
[${i}] ${s.title}
   Category: ${s.category}
   Priority: ${s.priority}
   Estimated Savings: $${(s.estimatedSavingsMin || 0).toLocaleString()} - $${(s.estimatedSavingsMax || 0).toLocaleString()}
   Current Description: ${s.description.substring(0, 200)}...
`).join('\n')

  const systemPrompt = `You are a senior international tax advisor specializing in corporate tax optimization. Your role is to enhance tax optimization suggestions with practical, actionable insights.

Guidelines:
- Be specific and practical, not generic
- Reference actual tax rules and treaties where relevant
- Consider implementation complexity realistically
- Highlight key risks and compliance requirements
- Keep language professional but accessible
- Focus on actionable next steps`

  const userPrompt = `Analyze this corporate structure and enhance the following tax optimization suggestions:

CORPORATE STRUCTURE:
${structureSummary}

Total Revenue: $${context.totalRevenue.toLocaleString()}
Jurisdictions: ${context.jurisdictions.join(', ')}

OPTIMIZATION SUGGESTIONS TO ENHANCE:
${suggestionsSummary}

For each suggestion (use the [index] number provided), provide:
1. An enhanced description (2-3 sentences) that adds specific value beyond the current description
2. 2-3 key insights specific to THIS corporate structure
3. Top 3 actionable next steps the company should take
4. A brief risk assessment (1-2 sentences)

IMPORTANT: You MUST respond with valid JSON in this exact format:
{
  "enhancements": [
    {
      "index": 0,
      "enhancedDescription": "specific enhanced description here",
      "keyInsights": ["insight 1", "insight 2"],
      "actionableSteps": ["step 1", "step 2", "step 3"],
      "riskAssessment": "risk assessment here"
    }
  ],
  "executiveSummary": "A 2-3 sentence executive summary"
}

Use the exact index numbers [0], [1], [2], etc. from the suggestions above.`

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-reasoner',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      console.error('DeepSeek API error:', response.status)
      return suggestions
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return suggestions
    }

    const parsed = JSON.parse(content) as {
      enhancements: AIEnhancedSuggestion[]
      executiveSummary?: string
    }

    console.log('AI response parsed:', JSON.stringify(parsed, null, 2))

    // Create a map of index to enhancement for quick lookup
    const enhancementMap = new Map<number, AIEnhancedSuggestion>()
    for (const e of parsed.enhancements || []) {
      enhancementMap.set(e.index, e)
    }

    // Merge AI enhancements with original suggestions
    return suggestions.map((suggestion, idx) => {
      // Only enhance the top 5 suggestions that were sent to the AI
      const enhancement = idx < 5 ? enhancementMap.get(idx) : undefined

      if (!enhancement) {
        return suggestion
      }

      // Build enhanced description with AI insights
      const aiEnhancedDescription = enhancement.enhancedDescription
        ? `**AI Analysis:** ${enhancement.enhancedDescription}\n\n${suggestion.description}`
        : suggestion.description

      // Add AI insights to the suggestion
      const aiInsights = enhancement.keyInsights?.length
        ? `\n\n**Key Insights:**\n${enhancement.keyInsights.map(i => `• ${i}`).join('\n')}`
        : ''

      // Add risk assessment
      const riskNote = enhancement.riskAssessment
        ? `\n\n**AI Risk Assessment:** ${enhancement.riskAssessment}`
        : ''

      return {
        ...suggestion,
        description: aiEnhancedDescription + aiInsights + riskNote,
        // Add AI-generated actionable steps if available
        ...(enhancement.actionableSteps?.length && {
          aiActionableSteps: enhancement.actionableSteps,
        }),
        ...(enhancement.riskAssessment && {
          aiRiskAssessment: enhancement.riskAssessment,
        }),
      }
    })

  } catch (error) {
    console.error('AI enhancement error:', error)
    return suggestions
  }
}

async function generateAIExecutiveSummary(
  result: OptimizationResult,
  context: TemplateContext,
  entities: DBEntity[]
): Promise<string> {
  if (!DEEPSEEK_API_KEY || result.suggestions.length === 0) {
    return generateExecutiveSummary(result, context)
  }

  const structureSummary = entities.map(e => {
    const j = getJurisdiction(e.jurisdiction)
    return `${e.name} (${j?.name || e.jurisdiction})`
  }).join(', ')

  const topSuggestions = result.suggestions.slice(0, 3).map(s => s.title).join(', ')

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-reasoner',
        messages: [
          {
            role: 'system',
            content: 'You are a tax advisor. Write a brief, professional executive summary.'
          },
          {
            role: 'user',
            content: `Write a 2-3 sentence executive summary for a tax optimization analysis.

Structure: ${structureSummary}
Total potential savings: $${result.potentialSavings.toLocaleString()}
Top opportunities: ${topSuggestions}
Number of suggestions: ${result.suggestions.length}

Be specific, professional, and actionable. Do not use generic phrases.`
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    })

    if (!response.ok) {
      return generateExecutiveSummary(result, context)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || generateExecutiveSummary(result, context)

  } catch {
    return generateExecutiveSummary(result, context)
  }
}

// =============================================================================
// API HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionWithOrg()
    if (!user?.id) return unauthorized()

    // Parse request body for optional overrides
    let body: {
      mode?: OptimizationMode
      annualRevenue?: number
      dividendFlows?: Array<{ fromEntityId: string; toEntityId: string; amount: number }>
      royaltyFlows?: Array<{ fromEntityId: string; toEntityId: string; amount: number }>
      currentEffectiveTaxRate?: number
    } = {}

    try {
      body = await request.json()
    } catch {
      // Empty body is fine, we'll use defaults
    }

    // Fetch entities from database
    const dbEntities = await prisma.corporateEntity.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: 'asc' },
    })

    if (dbEntities.length === 0) {
      return NextResponse.json({
        success: true,
        result: {
          suggestions: [],
          currentTaxBurden: 0,
          optimizedTaxBurden: 0,
          potentialSavings: 0,
          potentialSavingsPercentage: 0,
        },
        summary: 'No corporate entities found. Add entities to your corporate structure to receive optimization suggestions.',
        entityCount: 0,
      })
    }

    // Convert DB entities to format expected by optimization engine
    const entities: DBEntity[] = dbEntities.map(e => ({
      id: e.id,
      name: e.name,
      type: e.type,
      jurisdiction: e.jurisdiction,
      taxId: e.taxId,
      parentId: e.parentId,
      ownershipPercent: e.ownershipPercent ? Number(e.ownershipPercent) : null,
      revenue: e.revenue ? Number(e.revenue) : null,
      expenses: e.expenses ? Number(e.expenses) : null,
      taxLiability: e.taxLiability ? Number(e.taxLiability) : null,
      effectiveTaxRate: e.effectiveTaxRate ? Number(e.effectiveTaxRate) : null,
      isActive: e.isActive,
    }))

    const structure = convertDBEntitiesToStructure(entities)

    if (!structure) {
      return badRequest('Could not build corporate structure from entities')
    }

    // Calculate total revenue from entities or use provided value
    const totalRevenue = body.annualRevenue ||
      entities.reduce((sum, e) => sum + (e.revenue || 0), 0) ||
      1000000 // Default to $1M if no revenue data

    // Get unique jurisdictions
    const jurisdictions = [...new Set(entities.map(e => e.jurisdiction))]

    // Check for high-tax entities (>25%)
    const hasHighTaxEntities = entities.some(e => {
      const j = getJurisdiction(e.jurisdiction)
      return j && j.corporateTax.standardRate > 25
    })

    // Build optimization context
    const context: OptimizationContext = {
      structure,
      annualRevenue: totalRevenue,
      intercompanyTransactions: [], // Would need separate tracking
      dividendFlows: body.dividendFlows || [],
      royaltyFlows: body.royaltyFlows || [],
      currentEffectiveTaxRate: body.currentEffectiveTaxRate || 25,
    }

    // Run optimization analysis
    const result = analyzeStructureForOptimizations(context)

    // Template context for enhanced descriptions
    const templateContext: TemplateContext = {
      entityCount: entities.length,
      totalRevenue,
      jurisdictions,
      hasHighTaxEntities,
      hasDividendFlows: (body.dividendFlows?.length || 0) > 0,
      hasRoyaltyFlows: (body.royaltyFlows?.length || 0) > 0,
      hasIntercompanyTransactions: false,
    }

    // Determine optimization mode (default to 'template' for cost efficiency)
    const mode: OptimizationMode = body.mode || 'template'
    const useAI = mode === 'ai' && !!DEEPSEEK_API_KEY

    let enhancedSuggestions: TaxOptimizationSuggestion[]
    let summary: string

    if (useAI) {
      // AI-enhanced mode: Use DeepSeek to enhance suggestions
      enhancedSuggestions = await enhanceSuggestionsWithAI(
        result.suggestions,
        templateContext,
        entities
      )
      summary = await generateAIExecutiveSummary(
        { ...result, suggestions: enhancedSuggestions },
        templateContext,
        entities
      )
    } else {
      // Template mode: Use rule-based template enhancement
      enhancedSuggestions = result.suggestions.map(s =>
        enhanceSuggestionDescription(s, templateContext)
      )
      summary = generateExecutiveSummary(result, templateContext)
    }

    const enhancedResult: OptimizationResult = {
      ...result,
      suggestions: enhancedSuggestions,
    }

    // Return the actual mode used, not the requested mode
    const actualMode = useAI ? 'ai' : 'template'

    return NextResponse.json({
      success: true,
      result: enhancedResult,
      summary,
      mode: actualMode,
      aiAvailable: !!DEEPSEEK_API_KEY,
      entityCount: entities.length,
      jurisdictions,
      analysisTimestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('POST /api/tax/optimize error:', error)
    return NextResponse.json(
      { error: 'Failed to run optimization analysis' },
      { status: 500 }
    )
  }
}

// GET endpoint to check analysis status / get last result (optional caching)
export async function GET(request: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.id) return unauthorized()

  // For now, just return info that POST is needed
  return NextResponse.json({
    message: 'Use POST to run optimization analysis',
    hint: 'POST with optional body: { annualRevenue, dividendFlows, royaltyFlows, currentEffectiveTaxRate }',
  })
}
