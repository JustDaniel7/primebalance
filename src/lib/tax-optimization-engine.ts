// =============================================================================
// PRIMEBALANCE - TAX OPTIMIZATION ENGINE
// =============================================================================

import {
  CorporateEntity,
  CorporateStructure,
  EntityType,
  TaxOptimizationSuggestion,
  OptimizationCategory,
  ImplementationStep,
  RequiredChange,
  TaxTransaction,
  TransactionType,
} from '@/types/tax';
import {
  getJurisdiction,
  calculateCorporateTax,
  calculateWithholdingTax,
  findOptimalDTARoute,
  getLowTaxJurisdictions,
  getJurisdictionsWithFeatures,
} from '@/data/jurisdictions';

// =============================================================================
// OPTIMIZATION ANALYZER
// =============================================================================

export interface OptimizationContext {
  structure: CorporateStructure;
  annualRevenue: number;
  intercompanyTransactions: TaxTransaction[];
  dividendFlows: { fromEntityId: string; toEntityId: string; amount: number }[];
  royaltyFlows: { fromEntityId: string; toEntityId: string; amount: number }[];
  currentEffectiveTaxRate: number;
}

export interface OptimizationResult {
  suggestions: TaxOptimizationSuggestion[];
  currentTaxBurden: number;
  optimizedTaxBurden: number;
  potentialSavings: number;
  potentialSavingsPercentage: number;
}

/**
 * Main optimization function - analyzes structure and generates suggestions
 */
export function analyzeStructureForOptimizations(
  context: OptimizationContext
): OptimizationResult {
  const suggestions: TaxOptimizationSuggestion[] = [];
  
  // Run all optimization analyzers
  suggestions.push(...analyzeHoldingStructure(context));
  suggestions.push(...analyzeDTAOptimizations(context));
  suggestions.push(...analyzeTransferPricing(context));
  suggestions.push(...analyzeFinancingArrangements(context));
  suggestions.push(...analyzeIPPlanning(context));
  suggestions.push(...analyzePEOptimizations(context));
  suggestions.push(...analyzeIncentivePrograms(context));
  suggestions.push(...analyzeLossUtilization(context));
  
  // Calculate totals
  const currentTaxBurden = calculateCurrentTaxBurden(context);
  const totalPotentialSavingsMin = suggestions.reduce((sum, s) => sum + (s.estimatedSavingsMin || 0), 0);
  const totalPotentialSavingsMax = suggestions.reduce((sum, s) => sum + (s.estimatedSavingsMax || 0), 0);
  
  // Sort by potential savings
  suggestions.sort((a, b) => (b.estimatedSavingsMax || 0) - (a.estimatedSavingsMax || 0));
  
  return {
    suggestions,
    currentTaxBurden,
    optimizedTaxBurden: currentTaxBurden - totalPotentialSavingsMax,
    potentialSavings: (totalPotentialSavingsMin + totalPotentialSavingsMax) / 2,
    potentialSavingsPercentage: currentTaxBurden > 0 
      ? ((totalPotentialSavingsMin + totalPotentialSavingsMax) / 2 / currentTaxBurden) * 100 
      : 0,
  };
}

// =============================================================================
// HOLDING STRUCTURE OPTIMIZATION
// =============================================================================

function analyzeHoldingStructure(context: OptimizationContext): TaxOptimizationSuggestion[] {
  const suggestions: TaxOptimizationSuggestion[] = [];
  const { structure, annualRevenue, dividendFlows } = context;
  
  // Check if there's a holding company structure
  const hasHolding = structure.entities.some(e => e.type === EntityType.HOLDING);
  const parentEntity = structure.entities.find(e => e.id === structure.ultimateParentId);
  
  if (!hasHolding && parentEntity && dividendFlows.length > 0) {
    // Check if adding a holding company would be beneficial
    const holdingJurisdictions = [
      { code: 'NL', name: 'Netherlands', benefit: 'Participation exemption, extensive treaty network' },
      { code: 'LU', name: 'Luxembourg', benefit: 'Participation exemption, IP regime' },
      { code: 'IE', name: 'Ireland', benefit: 'Low tax rate, holding regime' },
      { code: 'CH', name: 'Switzerland', benefit: 'Participation exemption, stability' },
      { code: 'SG', name: 'Singapore', benefit: 'Territorial system, treaty network' },
    ];
    
    for (const holding of holdingJurisdictions) {
      const jurisdiction = getJurisdiction(holding.code);
      if (!jurisdiction) continue;
      
      // Calculate potential savings from participation exemption
      const totalDividends = dividendFlows.reduce((sum, f) => sum + f.amount, 0);
      const currentWithholding = calculateCurrentDividendWithholding(context);
      
      // Estimate savings (simplified - actual would depend on specific structure)
      const estimatedSavingsMin = totalDividends * 0.02; // Conservative 2%
      const estimatedSavingsMax = totalDividends * 0.10; // Optimistic 10%
      
      if (estimatedSavingsMax > 10000) { // Only suggest if meaningful savings
        suggestions.push({
          id: `holding-${holding.code}-${Date.now()}`,
          title: `Establish ${holding.name} Holding Company`,
          description: `Interposing a ${holding.name} holding company between your parent and operating subsidiaries could reduce withholding taxes on dividend distributions. ${holding.benefit}.`,
          category: OptimizationCategory.HOLDING_STRUCTURE,
          priority: estimatedSavingsMax > 100000 ? 'HIGH' : 'MEDIUM',
          estimatedSavingsMin,
          estimatedSavingsMax,
          estimatedSavingsPercentageMin: (estimatedSavingsMin / annualRevenue) * 100,
          estimatedSavingsPercentageMax: (estimatedSavingsMax / annualRevenue) * 100,
          implementationSteps: [
            {
              order: 1,
              title: 'Feasibility Analysis',
              description: `Conduct detailed analysis of ${holding.name} holding structure including substance requirements and treaty benefits.`,
              estimatedDuration: '2-4 weeks',
              responsibleParty: 'Tax Advisor',
            },
            {
              order: 2,
              title: 'Entity Incorporation',
              description: `Incorporate holding company in ${holding.name} with appropriate share capital and directors.`,
              estimatedDuration: '4-8 weeks',
              responsibleParty: 'Legal Counsel',
              dependencies: [1],
              documentationRequired: ['Articles of Association', 'Shareholder Resolutions', 'Director Appointments'],
              estimatedCost: 15000,
            },
            {
              order: 3,
              title: 'Share Transfer',
              description: 'Transfer shares of operating subsidiaries to the new holding company.',
              estimatedDuration: '4-6 weeks',
              responsibleParty: 'Legal Counsel',
              dependencies: [2],
              documentationRequired: ['Share Transfer Agreements', 'Board Resolutions', 'Tax Clearances'],
            },
            {
              order: 4,
              title: 'Substance Setup',
              description: `Establish required substance in ${holding.name} including local directors, office, and decision-making processes.`,
              estimatedDuration: '4-8 weeks',
              responsibleParty: 'Operations',
              dependencies: [2],
              estimatedCost: 50000,
            },
            {
              order: 5,
              title: 'Intercompany Agreements',
              description: 'Draft and execute new intercompany agreements reflecting the holding structure.',
              estimatedDuration: '2-4 weeks',
              responsibleParty: 'Legal/Tax',
              dependencies: [3],
            },
          ],
          requiredChanges: [
            {
              changeType: 'NEW_ENTITY',
              description: `New holding company in ${holding.name}`,
              jurisdiction: holding.code,
            },
            {
              changeType: 'RESTRUCTURE',
              description: 'Share transfers to holding company',
              affectedEntities: structure.entities.filter(e => e.type === EntityType.SUBSIDIARY).map(e => e.id),
            },
          ],
          risks: [
            'Anti-avoidance rules may apply if primary purpose is tax reduction',
            'Substance requirements must be met to claim treaty benefits',
            'Potential exit taxes on share transfers',
            'Ongoing compliance and reporting obligations',
          ],
          legalConsiderations: [
            `${holding.name} substance requirements`,
            'Principal Purpose Test under MLI',
            'Controlled Foreign Corporation (CFC) rules in parent jurisdiction',
            'Exit taxation in current jurisdiction',
          ],
          timeToImplement: '4-6 months',
          complexity: 'HIGH',
          relatedJurisdictions: [holding.code, parentEntity.jurisdictionCode],
          applicableToStructure: true,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }
  
  // Check for Delaware holding structure for US entities
  const usEntities = structure.entities.filter(e => e.jurisdictionCode.startsWith('US-') && e.jurisdictionCode !== 'US-DE');
  if (usEntities.length > 1 && parentEntity?.jurisdictionCode.startsWith('US-')) {
    const delawareJurisdiction = getJurisdiction('US-DE');
    if (delawareJurisdiction) {
      suggestions.push({
        id: `delaware-holding-${Date.now()}`,
        title: 'Delaware Holding Company Structure',
        description: 'Establishing a Delaware holding company can provide benefits including no state tax on out-of-state income, strong corporate law protections, and privacy benefits.',
        category: OptimizationCategory.HOLDING_STRUCTURE,
        priority: 'MEDIUM',
        estimatedSavingsMin: annualRevenue * 0.005,
        estimatedSavingsMax: annualRevenue * 0.02,
        estimatedSavingsPercentageMin: 0.5,
        estimatedSavingsPercentageMax: 2,
        implementationSteps: [
          {
            order: 1,
            title: 'Delaware Entity Formation',
            description: 'Form Delaware LLC or Corporation to serve as holding entity.',
            estimatedDuration: '1-2 weeks',
            estimatedCost: 2000,
          },
          {
            order: 2,
            title: 'Asset Transfer',
            description: 'Transfer intangible assets or subsidiary interests to Delaware entity.',
            estimatedDuration: '2-4 weeks',
            dependencies: [1],
          },
          {
            order: 3,
            title: 'Intercompany Agreements',
            description: 'Establish licensing or management agreements with operating entities.',
            estimatedDuration: '2-3 weeks',
            dependencies: [2],
          },
        ],
        requiredChanges: [
          {
            changeType: 'NEW_ENTITY',
            description: 'Delaware holding company',
            jurisdiction: 'US-DE',
          },
        ],
        risks: [
          'Some states have enacted addback statutes targeting Delaware holding companies',
          'Economic substance requirements',
          'IRS scrutiny of arrangements without business purpose',
        ],
        legalConsiderations: [
          'State nexus rules',
          'IRC Section 482 compliance',
          'Economic substance doctrine',
        ],
        timeToImplement: '1-2 months',
        complexity: 'MEDIUM',
        relatedJurisdictions: ['US-DE', parentEntity.jurisdictionCode],
        applicableToStructure: true,
        createdAt: new Date().toISOString(),
      });
    }
  }
  
  return suggestions;
}

// =============================================================================
// DTA OPTIMIZATION
// =============================================================================

function analyzeDTAOptimizations(context: OptimizationContext): TaxOptimizationSuggestion[] {
  const suggestions: TaxOptimizationSuggestion[] = [];
  const { structure, dividendFlows, royaltyFlows } = context;
  
  // Analyze each dividend flow for DTA optimization
  for (const flow of dividendFlows) {
    const sourceEntity = structure.entities.find(e => e.id === flow.fromEntityId);
    const targetEntity = structure.entities.find(e => e.id === flow.toEntityId);
    
    if (!sourceEntity || !targetEntity) continue;
    
    const optimalRoute = findOptimalDTARoute(
      sourceEntity.jurisdictionCode,
      targetEntity.jurisdictionCode,
      'dividends'
    );
    
    if (optimalRoute.savings > 0 && optimalRoute.intermediary) {
      const intermediaryJurisdiction = getJurisdiction(optimalRoute.intermediary);
      const savingsAmount = flow.amount * (optimalRoute.savings / 100);
      
      if (savingsAmount > 5000) {
        suggestions.push({
          id: `dta-dividend-${sourceEntity.id}-${targetEntity.id}-${Date.now()}`,
          title: `Optimize Dividend Route via ${intermediaryJurisdiction?.name || optimalRoute.intermediary}`,
          description: `Routing dividends from ${sourceEntity.name} to ${targetEntity.name} through ${intermediaryJurisdiction?.name} could reduce withholding tax from ${optimalRoute.totalRate + optimalRoute.savings}% to ${optimalRoute.totalRate}%.`,
          category: OptimizationCategory.DTA_UTILIZATION,
          priority: savingsAmount > 50000 ? 'HIGH' : 'MEDIUM',
          estimatedSavingsMin: savingsAmount * 0.8,
          estimatedSavingsMax: savingsAmount,
          estimatedSavingsPercentageMin: optimalRoute.savings * 0.8,
          estimatedSavingsPercentageMax: optimalRoute.savings,
          implementationSteps: [
            {
              order: 1,
              title: 'Treaty Benefit Analysis',
              description: `Verify eligibility for treaty benefits under ${intermediaryJurisdiction?.name}-${getJurisdiction(sourceEntity.jurisdictionCode)?.name} and ${intermediaryJurisdiction?.name}-${getJurisdiction(targetEntity.jurisdictionCode)?.name} treaties.`,
              estimatedDuration: '2-3 weeks',
              responsibleParty: 'Tax Advisor',
            },
            {
              order: 2,
              title: 'Establish Intermediary Entity',
              description: `Incorporate holding entity in ${intermediaryJurisdiction?.name} with appropriate substance.`,
              estimatedDuration: '6-8 weeks',
              dependencies: [1],
              estimatedCost: 20000,
            },
            {
              order: 3,
              title: 'Restructure Ownership',
              description: 'Transfer shares to establish the new ownership chain.',
              estimatedDuration: '4-6 weeks',
              dependencies: [2],
            },
          ],
          requiredChanges: [
            {
              changeType: 'NEW_ENTITY',
              description: `Intermediary holding in ${intermediaryJurisdiction?.name}`,
              jurisdiction: optimalRoute.intermediary,
            },
            {
              changeType: 'RESTRUCTURE',
              description: 'Ownership restructuring',
              affectedEntities: [sourceEntity.id, targetEntity.id],
            },
          ],
          risks: [
            'Principal Purpose Test may deny treaty benefits',
            'Beneficial ownership requirements',
            'Anti-treaty shopping provisions',
          ],
          legalConsiderations: [
            'MLI Principal Purpose Test',
            'Limitation on Benefits clauses',
            'Beneficial ownership requirements',
          ],
          timeToImplement: '3-4 months',
          complexity: 'HIGH',
          relatedJurisdictions: [sourceEntity.jurisdictionCode, optimalRoute.intermediary, targetEntity.jurisdictionCode],
          relatedEntities: [sourceEntity.id, targetEntity.id],
          applicableToStructure: true,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }
  
  // Similar analysis for royalty flows
  for (const flow of royaltyFlows) {
    const sourceEntity = structure.entities.find(e => e.id === flow.fromEntityId);
    const targetEntity = structure.entities.find(e => e.id === flow.toEntityId);
    
    if (!sourceEntity || !targetEntity) continue;
    
    const optimalRoute = findOptimalDTARoute(
      sourceEntity.jurisdictionCode,
      targetEntity.jurisdictionCode,
      'royalties'
    );
    
    if (optimalRoute.savings > 0 && optimalRoute.intermediary) {
      const savingsAmount = flow.amount * (optimalRoute.savings / 100);
      
      if (savingsAmount > 5000) {
        suggestions.push({
          id: `dta-royalty-${sourceEntity.id}-${targetEntity.id}-${Date.now()}`,
          title: `Optimize Royalty Flow Structure`,
          description: `Current royalty payments from ${sourceEntity.name} to ${targetEntity.name} may benefit from treaty optimization through an IP holding structure.`,
          category: OptimizationCategory.DTA_UTILIZATION,
          priority: 'MEDIUM',
          estimatedSavingsMin: savingsAmount * 0.7,
          estimatedSavingsMax: savingsAmount,
          estimatedSavingsPercentageMin: optimalRoute.savings * 0.7,
          estimatedSavingsPercentageMax: optimalRoute.savings,
          implementationSteps: [
            {
              order: 1,
              title: 'IP Holding Structure Analysis',
              description: 'Analyze optimal IP holding location considering DEMPE functions and transfer pricing.',
              estimatedDuration: '3-4 weeks',
            },
            {
              order: 2,
              title: 'IP Migration',
              description: 'Transfer IP rights to optimized structure with proper valuation.',
              estimatedDuration: '8-12 weeks',
              dependencies: [1],
            },
          ],
          requiredChanges: [
            {
              changeType: 'RESTRUCTURE',
              description: 'IP ownership restructuring',
              affectedEntities: [sourceEntity.id, targetEntity.id],
            },
          ],
          risks: [
            'Transfer pricing challenges',
            'DEMPE substance requirements',
            'Exit taxation on IP transfer',
          ],
          legalConsiderations: [
            'OECD Transfer Pricing Guidelines Chapter VI',
            'DEMPE analysis requirements',
            'IP valuation methodology',
          ],
          timeToImplement: '4-6 months',
          complexity: 'HIGH',
          relatedJurisdictions: [sourceEntity.jurisdictionCode, targetEntity.jurisdictionCode],
          relatedEntities: [sourceEntity.id, targetEntity.id],
          applicableToStructure: true,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }
  
  return suggestions;
}

// =============================================================================
// TRANSFER PRICING OPTIMIZATION
// =============================================================================

function analyzeTransferPricing(context: OptimizationContext): TaxOptimizationSuggestion[] {
  const suggestions: TaxOptimizationSuggestion[] = [];
  const { structure, intercompanyTransactions, annualRevenue } = context;
  
  // Check for intercompany service arrangements
  const serviceTransactions = intercompanyTransactions.filter(t => 
    t.transactionType === TransactionType.SERVICE_FEE ||
    t.transactionType === TransactionType.MANAGEMENT_FEE
  );
  
  if (serviceTransactions.length > 0) {
    const totalServiceFees = serviceTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Suggest cost-plus arrangement optimization
    suggestions.push({
      id: `tp-services-${Date.now()}`,
      title: 'Optimize Intercompany Service Arrangements',
      description: 'Review and optimize markup percentages on intercompany services to ensure arm\'s length pricing while maximizing tax efficiency.',
      category: OptimizationCategory.TRANSFER_PRICING,
      priority: totalServiceFees > annualRevenue * 0.1 ? 'HIGH' : 'MEDIUM',
      estimatedSavingsMin: totalServiceFees * 0.01,
      estimatedSavingsMax: totalServiceFees * 0.05,
      estimatedSavingsPercentageMin: 1,
      estimatedSavingsPercentageMax: 5,
      implementationSteps: [
        {
          order: 1,
          title: 'Benchmarking Study',
          description: 'Conduct transfer pricing benchmarking study to determine arm\'s length range.',
          estimatedDuration: '4-6 weeks',
          responsibleParty: 'Transfer Pricing Specialist',
          estimatedCost: 25000,
        },
        {
          order: 2,
          title: 'Policy Update',
          description: 'Update intercompany service agreements with optimized pricing.',
          estimatedDuration: '2-3 weeks',
          dependencies: [1],
        },
        {
          order: 3,
          title: 'Documentation',
          description: 'Prepare contemporaneous transfer pricing documentation.',
          estimatedDuration: '3-4 weeks',
          dependencies: [2],
        },
      ],
      requiredChanges: [
        {
          changeType: 'CONTRACT',
          description: 'Updated intercompany service agreements',
        },
        {
          changeType: 'DOCUMENTATION',
          description: 'Transfer pricing documentation',
        },
      ],
      risks: [
        'Tax authority challenges if pricing is aggressive',
        'Double taxation risk if not aligned globally',
      ],
      legalConsiderations: [
        'OECD Transfer Pricing Guidelines',
        'Local documentation requirements',
        'Arm\'s length standard',
      ],
      timeToImplement: '2-3 months',
      complexity: 'MEDIUM',
      relatedJurisdictions: Array.from(new Set(serviceTransactions.map(t => t.sourceJurisdiction))),
      applicableToStructure: true,
      createdAt: new Date().toISOString(),
    });
  }
  
  // Check for APA opportunity
  if (intercompanyTransactions.length > 10 || 
      intercompanyTransactions.reduce((sum, t) => sum + t.amount, 0) > 10000000) {
    suggestions.push({
      id: `tp-apa-${Date.now()}`,
      title: 'Consider Advance Pricing Agreement (APA)',
      description: 'Given the volume of intercompany transactions, an APA could provide certainty and reduce audit risk.',
      category: OptimizationCategory.TRANSFER_PRICING,
      priority: 'MEDIUM',
      estimatedSavingsMin: 0,
      estimatedSavingsMax: annualRevenue * 0.02,
      estimatedSavingsPercentageMin: 0,
      estimatedSavingsPercentageMax: 2,
      implementationSteps: [
        {
          order: 1,
          title: 'APA Feasibility Assessment',
          description: 'Assess suitability for unilateral, bilateral, or multilateral APA.',
          estimatedDuration: '4-6 weeks',
          estimatedCost: 15000,
        },
        {
          order: 2,
          title: 'Pre-filing Conference',
          description: 'Meet with tax authorities to discuss APA approach.',
          estimatedDuration: '2-4 weeks',
          dependencies: [1],
        },
        {
          order: 3,
          title: 'APA Application',
          description: 'Prepare and submit formal APA application.',
          estimatedDuration: '8-12 weeks',
          dependencies: [2],
          estimatedCost: 75000,
        },
      ],
      requiredChanges: [
        {
          changeType: 'DOCUMENTATION',
          description: 'APA application and supporting analysis',
        },
      ],
      risks: [
        'Process can take 2-4 years',
        'No guarantee of favorable outcome',
        'Disclosure of sensitive information',
      ],
      legalConsiderations: [
        'Revenue Procedure 2015-41 (US)',
        'Bilateral APA competent authority process',
      ],
      timeToImplement: '2-4 years',
      complexity: 'HIGH',
      relatedJurisdictions: Array.from(new Set(intercompanyTransactions.map(t => t.sourceJurisdiction))),
      applicableToStructure: true,
      createdAt: new Date().toISOString(),
    });
  }
  
  return suggestions;
}

// =============================================================================
// FINANCING ARRANGEMENTS
// =============================================================================

function analyzeFinancingArrangements(context: OptimizationContext): TaxOptimizationSuggestion[] {
  const suggestions: TaxOptimizationSuggestion[] = [];
  const { structure, annualRevenue } = context;
  
  // Check for opportunities in high-tax jurisdictions
  const highTaxEntities = structure.entities.filter(e => {
    const j = getJurisdiction(e.jurisdictionCode);
    return j && j.corporateTax.standardRate > 25;
  });
  
  if (highTaxEntities.length > 0) {
    // Suggest intercompany financing
    suggestions.push({
      id: `financing-intercompany-${Date.now()}`,
      title: 'Intercompany Financing Optimization',
      description: 'Implement tax-efficient intercompany financing arrangements to shift profits from high-tax to low-tax jurisdictions through interest deductions.',
      category: OptimizationCategory.FINANCING_ARRANGEMENT,
      priority: 'MEDIUM',
      estimatedSavingsMin: annualRevenue * 0.005,
      estimatedSavingsMax: annualRevenue * 0.025,
      estimatedSavingsPercentageMin: 0.5,
      estimatedSavingsPercentageMax: 2.5,
      implementationSteps: [
        {
          order: 1,
          title: 'Thin Capitalization Analysis',
          description: 'Analyze debt capacity in each jurisdiction considering thin cap rules and interest deduction limits.',
          estimatedDuration: '3-4 weeks',
        },
        {
          order: 2,
          title: 'Financing Structure Design',
          description: 'Design optimal intercompany loan structure considering withholding taxes and interest rates.',
          estimatedDuration: '2-3 weeks',
          dependencies: [1],
        },
        {
          order: 3,
          title: 'Documentation',
          description: 'Prepare loan agreements with arm\'s length terms.',
          estimatedDuration: '2-3 weeks',
          dependencies: [2],
        },
        {
          order: 4,
          title: 'Implementation',
          description: 'Execute loans and establish cash flow processes.',
          estimatedDuration: '2-4 weeks',
          dependencies: [3],
        },
      ],
      requiredChanges: [
        {
          changeType: 'CONTRACT',
          description: 'Intercompany loan agreements',
          affectedEntities: highTaxEntities.map(e => e.id),
        },
        {
          changeType: 'TRANSACTION_FLOW',
          description: 'Interest payment flows',
        },
      ],
      risks: [
        'Interest deduction limitations (e.g., 30% EBITDA cap)',
        'Thin capitalization rule breaches',
        'Transfer pricing challenges on interest rates',
        'Hybrid mismatch rules',
      ],
      legalConsiderations: [
        'ATAD interest limitation rules (EU)',
        'Section 163(j) limitation (US)',
        'Thin capitalization rules by jurisdiction',
        'BEPS Action 4 recommendations',
      ],
      timeToImplement: '2-3 months',
      complexity: 'MEDIUM',
      relatedJurisdictions: highTaxEntities.map(e => e.jurisdictionCode),
      relatedEntities: highTaxEntities.map(e => e.id),
      applicableToStructure: true,
      createdAt: new Date().toISOString(),
    });
  }
  
  return suggestions;
}

// =============================================================================
// IP PLANNING
// =============================================================================

function analyzeIPPlanning(context: OptimizationContext): TaxOptimizationSuggestion[] {
  const suggestions: TaxOptimizationSuggestion[] = [];
  const { structure, royaltyFlows, annualRevenue } = context;
  
  // Check for IP-related optimization opportunities
  if (royaltyFlows.length > 0) {
    const totalRoyalties = royaltyFlows.reduce((sum, f) => sum + f.amount, 0);
    
    // Check for IP box regimes
    const ipBoxJurisdictions = [
      { code: 'NL', name: 'Netherlands Innovation Box', rate: 9 },
      { code: 'IE', name: 'Ireland Knowledge Development Box', rate: 6.25 },
      { code: 'LU', name: 'Luxembourg IP Regime', rate: 5.2 },
      { code: 'CH', name: 'Switzerland Patent Box', rate: 8.8 },
      { code: 'GB', name: 'UK Patent Box', rate: 10 },
    ];
    
    for (const ipBox of ipBoxJurisdictions) {
      const hasEntityInJurisdiction = structure.entities.some(e => e.jurisdictionCode === ipBox.code);
      
      if (!hasEntityInJurisdiction) {
        const potentialSavings = totalRoyalties * 0.15; // Simplified estimate
        
        if (potentialSavings > 20000) {
          suggestions.push({
            id: `ip-box-${ipBox.code}-${Date.now()}`,
            title: `Utilize ${ipBox.name}`,
            description: `Relocating qualifying IP to ${ipBox.name.split(' ')[0]} could benefit from the ${ipBox.rate}% IP box rate instead of standard corporate tax rates.`,
            category: OptimizationCategory.IP_PLANNING,
            priority: potentialSavings > 100000 ? 'HIGH' : 'MEDIUM',
            estimatedSavingsMin: potentialSavings * 0.6,
            estimatedSavingsMax: potentialSavings,
            estimatedSavingsPercentageMin: (potentialSavings * 0.6 / annualRevenue) * 100,
            estimatedSavingsPercentageMax: (potentialSavings / annualRevenue) * 100,
            implementationSteps: [
              {
                order: 1,
                title: 'IP Qualification Analysis',
                description: 'Determine which IP assets qualify for the regime (patents, copyrighted software, etc.).',
                estimatedDuration: '3-4 weeks',
              },
              {
                order: 2,
                title: 'Nexus Calculation',
                description: 'Calculate qualifying income based on nexus ratio (R&D expenditure).',
                estimatedDuration: '2-3 weeks',
                dependencies: [1],
              },
              {
                order: 3,
                title: 'Entity Setup',
                description: `Establish IP holding entity in ${ipBox.name.split(' ')[0]} with appropriate substance.`,
                estimatedDuration: '6-8 weeks',
                dependencies: [2],
                estimatedCost: 25000,
              },
              {
                order: 4,
                title: 'IP Transfer',
                description: 'Transfer qualifying IP with appropriate valuation and documentation.',
                estimatedDuration: '4-8 weeks',
                dependencies: [3],
              },
              {
                order: 5,
                title: 'R&D Function Alignment',
                description: 'Ensure DEMPE functions are aligned with IP ownership.',
                estimatedDuration: '4-6 weeks',
                dependencies: [4],
              },
            ],
            requiredChanges: [
              {
                changeType: 'NEW_ENTITY',
                description: `IP holding entity in ${ipBox.name.split(' ')[0]}`,
                jurisdiction: ipBox.code,
              },
              {
                changeType: 'RESTRUCTURE',
                description: 'IP ownership transfer',
              },
            ],
            risks: [
              'Exit taxes on IP transfer',
              'Nexus ratio may limit benefits',
              'Substance requirements',
              'DEMPE analysis challenges',
            ],
            legalConsiderations: [
              'OECD BEPS Action 5 (nexus approach)',
              'DEMPE framework',
              'Exit taxation rules',
              'Transfer pricing for IP',
            ],
            timeToImplement: '6-9 months',
            complexity: 'HIGH',
            relatedJurisdictions: [ipBox.code],
            applicableToStructure: true,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  }
  
  return suggestions;
}

// =============================================================================
// PE OPTIMIZATION
// =============================================================================

function analyzePEOptimizations(context: OptimizationContext): TaxOptimizationSuggestion[] {
  const suggestions: TaxOptimizationSuggestion[] = [];
  const { structure, annualRevenue } = context;
  
  // Check for PE vs subsidiary optimization
  const pes = structure.entities.filter(e => e.isPermanentEstablishment);
  
  for (const pe of pes) {
    const parentEntity = structure.entities.find(e => e.id === pe.peOfEntityId);
    if (!parentEntity) continue;
    
    const peJurisdiction = getJurisdiction(pe.jurisdictionCode);
    const parentJurisdiction = getJurisdiction(parentEntity.jurisdictionCode);
    
    if (peJurisdiction && parentJurisdiction) {
      // Check if converting to subsidiary would be beneficial
      if (peJurisdiction.corporateTax.standardRate < parentJurisdiction.corporateTax.standardRate) {
        const rateDiff = parentJurisdiction.corporateTax.standardRate - peJurisdiction.corporateTax.standardRate;
        const estimatedPEIncome = annualRevenue * 0.1; // Assume 10% attributable to PE
        const potentialSavings = estimatedPEIncome * (rateDiff / 100);
        
        if (potentialSavings > 10000) {
          suggestions.push({
            id: `pe-to-sub-${pe.id}-${Date.now()}`,
            title: `Convert ${pe.name} PE to Subsidiary`,
            description: `Converting the ${peJurisdiction.name} permanent establishment to a subsidiary could provide tax benefits and operational flexibility.`,
            category: OptimizationCategory.PE_OPTIMIZATION,
            priority: 'MEDIUM',
            estimatedSavingsMin: potentialSavings * 0.5,
            estimatedSavingsMax: potentialSavings,
            estimatedSavingsPercentageMin: (potentialSavings * 0.5 / annualRevenue) * 100,
            estimatedSavingsPercentageMax: (potentialSavings / annualRevenue) * 100,
            implementationSteps: [
              {
                order: 1,
                title: 'Conversion Analysis',
                description: 'Analyze tax implications of PE to subsidiary conversion.',
                estimatedDuration: '3-4 weeks',
              },
              {
                order: 2,
                title: 'Subsidiary Formation',
                description: `Incorporate subsidiary in ${peJurisdiction.name}.`,
                estimatedDuration: '4-6 weeks',
                dependencies: [1],
              },
              {
                order: 3,
                title: 'Asset Transfer',
                description: 'Transfer PE assets and liabilities to subsidiary.',
                estimatedDuration: '4-8 weeks',
                dependencies: [2],
              },
            ],
            requiredChanges: [
              {
                changeType: 'NEW_ENTITY',
                description: `Subsidiary in ${peJurisdiction.name}`,
                jurisdiction: pe.jurisdictionCode,
              },
              {
                changeType: 'RESTRUCTURE',
                description: 'PE dissolution and asset transfer',
                affectedEntities: [pe.id],
              },
            ],
            risks: [
              'Exit taxation on PE dissolution',
              'Employee transfer considerations',
              'Contract novation requirements',
            ],
            legalConsiderations: [
              'PE attribution rules',
              'Exit taxation',
              'Labor law implications',
            ],
            timeToImplement: '3-6 months',
            complexity: 'MEDIUM',
            relatedJurisdictions: [pe.jurisdictionCode, parentEntity.jurisdictionCode],
            relatedEntities: [pe.id, parentEntity.id],
            applicableToStructure: true,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  }
  
  return suggestions;
}

// =============================================================================
// INCENTIVE PROGRAMS
// =============================================================================

function analyzeIncentivePrograms(context: OptimizationContext): TaxOptimizationSuggestion[] {
  const suggestions: TaxOptimizationSuggestion[] = [];
  const { structure, annualRevenue } = context;
  
  // Check each entity's jurisdiction for available incentives
  for (const entity of structure.entities) {
    const jurisdiction = getJurisdiction(entity.jurisdictionCode);
    if (!jurisdiction?.taxIncentives) continue;
    
    for (const incentive of jurisdiction.taxIncentives) {
      const potentialBenefit = incentive.rateReduction 
        ? annualRevenue * 0.1 * (incentive.rateReduction / 100)
        : annualRevenue * 0.02;
      
      if (potentialBenefit > 5000) {
        suggestions.push({
          id: `incentive-${entity.id}-${incentive.name.replace(/\s+/g, '-')}-${Date.now()}`,
          title: `Apply for ${incentive.name}`,
          description: `${entity.name} may qualify for the ${incentive.name} in ${jurisdiction.name}. ${incentive.description}`,
          category: OptimizationCategory.INCENTIVE_PROGRAMS,
          priority: potentialBenefit > 50000 ? 'HIGH' : 'MEDIUM',
          estimatedSavingsMin: potentialBenefit * 0.5,
          estimatedSavingsMax: potentialBenefit,
          estimatedSavingsPercentageMin: (potentialBenefit * 0.5 / annualRevenue) * 100,
          estimatedSavingsPercentageMax: (potentialBenefit / annualRevenue) * 100,
          implementationSteps: [
            {
              order: 1,
              title: 'Eligibility Assessment',
              description: `Verify ${entity.name} meets all eligibility criteria for ${incentive.name}.`,
              estimatedDuration: '2-3 weeks',
            },
            {
              order: 2,
              title: 'Application Preparation',
              description: 'Prepare application with required documentation.',
              estimatedDuration: '3-4 weeks',
              dependencies: [1],
            },
            {
              order: 3,
              title: 'Submit Application',
              description: `Submit application to ${jurisdiction.name} tax authority.`,
              estimatedDuration: '1 week',
              dependencies: [2],
            },
          ],
          requiredChanges: [
            {
              changeType: 'DOCUMENTATION',
              description: 'Incentive application and supporting documents',
              affectedEntities: [entity.id],
            },
          ],
          risks: [
            'Application may be denied',
            'Ongoing compliance requirements',
            'Clawback provisions may apply',
          ],
          legalConsiderations: incentive.eligibilityCriteria,
          timeToImplement: '2-4 months',
          complexity: 'LOW',
          relatedJurisdictions: [entity.jurisdictionCode],
          relatedEntities: [entity.id],
          applicableToStructure: true,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }
  
  return suggestions;
}

// =============================================================================
// LOSS UTILIZATION
// =============================================================================

function analyzeLossUtilization(context: OptimizationContext): TaxOptimizationSuggestion[] {
  const suggestions: TaxOptimizationSuggestion[] = [];
  // This would analyze loss carryforwards/carrybacks across the structure
  // Simplified implementation - would need actual financial data
  
  return suggestions;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateCurrentTaxBurden(context: OptimizationContext): number {
  let totalTax = 0;
  const { structure, annualRevenue } = context;
  
  // Simplified calculation - allocate revenue proportionally
  const entityCount = structure.entities.filter(e => e.type !== EntityType.HOLDING).length;
  const revenuePerEntity = annualRevenue / Math.max(entityCount, 1);
  
  for (const entity of structure.entities) {
    if (entity.type === EntityType.HOLDING) continue;
    
    const calc = calculateCorporateTax(entity.jurisdictionCode, revenuePerEntity);
    totalTax += calc.taxAmount;
  }
  
  return totalTax;
}

function calculateCurrentDividendWithholding(context: OptimizationContext): number {
  let totalWithholding = 0;
  const { structure, dividendFlows } = context;
  
  for (const flow of dividendFlows) {
    const source = structure.entities.find(e => e.id === flow.fromEntityId);
    const target = structure.entities.find(e => e.id === flow.toEntityId);
    
    if (source && target) {
      const result = calculateWithholdingTax(
        source.jurisdictionCode,
        target.jurisdictionCode,
        flow.amount,
        'dividends'
      );
      totalWithholding += result.withholdingAmount;
    }
  }
  
  return totalWithholding;
}

// =============================================================================
// EXPORT
// =============================================================================

export {
  analyzeHoldingStructure,
  analyzeDTAOptimizations,
  analyzeTransferPricing,
  analyzeFinancingArrangements,
  analyzeIPPlanning,
  analyzePEOptimizations,
  analyzeIncentivePrograms,
  calculateCurrentTaxBurden,
};
