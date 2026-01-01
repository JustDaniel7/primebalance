// src/app/api/tax/optimize/route.ts
// Tax Optimization Analysis API - Template-based, cost-effective approach

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
// API HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionWithOrg()
    if (!user?.id) return unauthorized()

    // Parse request body for optional overrides
    let body: {
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

    // Enhance suggestions with better descriptions
    const enhancedSuggestions = result.suggestions.map(s =>
      enhanceSuggestionDescription(s, templateContext)
    )

    const enhancedResult: OptimizationResult = {
      ...result,
      suggestions: enhancedSuggestions,
    }

    // Generate executive summary
    const summary = generateExecutiveSummary(enhancedResult, templateContext)

    return NextResponse.json({
      success: true,
      result: enhancedResult,
      summary,
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
