// =============================================================================
// LIQUIDITY & CASHFLOW ANALYSIS TYPES
// Short-term and medium-term liquidity visibility
// =============================================================================

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export type TimeBucket = 'daily' | 'weekly' | 'monthly';
export type CashflowType = 'inflow' | 'outflow';
export type CashflowCategory =
    | 'receivables' | 'contractual_income' | 'one_off_inflow' | 'intercompany_in' | 'other_inflow'
    | 'payables' | 'payroll' | 'taxes' | 'debt_service' | 'operating_expenses' | 'one_off_outflow' | 'intercompany_out' | 'other_outflow';
export type ConfidenceStatus = 'confirmed' | 'expected' | 'estimated';
export type ScenarioType = 'base' | 'conservative' | 'stress' | 'custom';
export type LiquidityRiskLevel = 'low' | 'moderate' | 'elevated' | 'high' | 'critical';

export const TIME_BUCKETS: { value: TimeBucket; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
];

export const CASHFLOW_CATEGORIES: { value: CashflowCategory; label: string; type: CashflowType }[] = [
    { value: 'receivables', label: 'Receivables', type: 'inflow' },
    { value: 'contractual_income', label: 'Contractual Income', type: 'inflow' },
    { value: 'one_off_inflow', label: 'One-Off Inflow', type: 'inflow' },
    { value: 'intercompany_in', label: 'Intercompany Transfer In', type: 'inflow' },
    { value: 'other_inflow', label: 'Other Inflow', type: 'inflow' },
    { value: 'payables', label: 'Payables', type: 'outflow' },
    { value: 'payroll', label: 'Payroll', type: 'outflow' },
    { value: 'taxes', label: 'Taxes', type: 'outflow' },
    { value: 'debt_service', label: 'Debt Service', type: 'outflow' },
    { value: 'operating_expenses', label: 'Operating Expenses', type: 'outflow' },
    { value: 'one_off_outflow', label: 'One-Off Outflow', type: 'outflow' },
    { value: 'intercompany_out', label: 'Intercompany Transfer Out', type: 'outflow' },
    { value: 'other_outflow', label: 'Other Outflow', type: 'outflow' },
];

export const CONFIDENCE_STATUSES: { value: ConfidenceStatus; label: string; color: string }[] = [
    { value: 'confirmed', label: 'Confirmed', color: 'emerald' },
    { value: 'expected', label: 'Expected', color: 'blue' },
    { value: 'estimated', label: 'Estimated', color: 'amber' },
];

export const SCENARIO_TYPES: { value: ScenarioType; label: string; description: string }[] = [
    { value: 'base', label: 'Base Case', description: 'Current expectations based on confirmed and expected cashflows' },
    { value: 'conservative', label: 'Conservative', description: 'Delayed inflows, accelerated outflows' },
    { value: 'stress', label: 'Stress Test', description: 'Significant delays and increased outflows' },
    { value: 'custom', label: 'Custom', description: 'User-defined assumptions' },
];

export const HORIZON_OPTIONS = [
    { value: 30, label: '30 Days' },
    { value: 60, label: '60 Days' },
    { value: 90, label: '90 Days' },
    { value: 180, label: '180 Days' },
    { value: 365, label: '1 Year' },
];

// =============================================================================
// CASHFLOW ITEMS
// =============================================================================

export interface CashflowItem {
    id: string;
    type: CashflowType;
    category: CashflowCategory;
    description: string;
    amount: number;
    currency: string;
    expectedDate: string;
    confidence: ConfidenceStatus;

    // Source traceability
    sourceType: 'invoice' | 'contract' | 'schedule' | 'estimate' | 'manual';
    sourceReference?: string;
    sourceDocument?: string;

    // Entity
    counterparty?: string;
    entityId?: string;
    entityName?: string;

    // Recurrence
    isRecurring: boolean;
    recurrencePattern?: string;

    // Notes
    notes?: string;

    // Audit
    createdAt: string;
    updatedAt?: string;
    createdBy?: string;
}

// =============================================================================
// TIMELINE
// =============================================================================

export interface TimelinePeriod {
    id: string;
    periodStart: string;
    periodEnd: string;
    label: string;

    // Balances
    openingBalance: number;
    closingBalance: number;

    // Movements
    totalInflows: number;
    totalOutflows: number;
    netMovement: number;

    // Breakdown
    inflowsByCategory: Record<CashflowCategory, number>;
    outflowsByCategory: Record<CashflowCategory, number>;

    // Confidence
    confirmedInflows: number;
    expectedInflows: number;
    estimatedInflows: number;
    confirmedOutflows: number;
    expectedOutflows: number;
    estimatedOutflows: number;

    // Risk indicators
    isHistorical: boolean;
    hasLiquidityGap: boolean;
    gapAmount?: number;
    belowMinBuffer: boolean;

    // Individual items
    items: CashflowItem[];
}

export interface CashflowTimeline {
    id: string;
    name: string;
    baseCurrency: string;
    timeBucket: TimeBucket;
    horizonDays: number;

    // Starting point
    currentCashBalance: number;
    minimumBuffer: number;

    // Periods
    periods: TimelinePeriod[];

    // Summary
    totalInflows: number;
    totalOutflows: number;
    netChange: number;
    endingBalance: number;

    // Liquidity metrics
    lowestBalance: number;
    lowestBalanceDate: string;
    daysWithGap: number;
    totalGapAmount: number;

    // Confidence breakdown
    confirmedCashflows: number;
    expectedCashflows: number;
    estimatedCashflows: number;
    dataCompleteness: number; // 0-100%

    // Meta
    lastRefresh: string;
    dataAsOf: string;
}

// =============================================================================
// SCENARIOS
// =============================================================================

export interface ScenarioAssumptions {
    inflowDelayDays: number;
    inflowReductionPercent: number;
    outflowAccelerationDays: number;
    outflowIncreasePercent: number;
    confirmedOnly: boolean;
    excludeEstimated: boolean;
    customAdjustments?: {
        category: CashflowCategory;
        adjustmentPercent: number;
    }[];
}

export interface LiquidityScenario {
    id: string;
    type: ScenarioType;
    name: string;
    description: string;

    // Assumptions
    assumptions: ScenarioAssumptions;

    // Resulting timeline
    timeline: CashflowTimeline;

    // Comparison to base
    varianceVsBase?: {
        endingBalanceDiff: number;
        lowestBalanceDiff: number;
        additionalGapDays: number;
    };

    // Meta
    isHypothetical: true; // Always true
    createdAt: string;
    createdBy?: string;
}

// =============================================================================
// LIQUIDITY GAPS
// =============================================================================

export type LiquidityGapStatus = 'projected' | 'confirmed' | 'mitigated' | 'resolved';

export interface LiquidityGap {
    id: string;
    startDate: string;
    endDate: string;
    durationDays: number;

    // Status
    status: LiquidityGapStatus;

    // Gap details
    peakDeficit: number;
    averageDeficit: number;
    totalDeficitDays: number; // deficit * days

    // Causes
    causes: {
        description: string;
        impact: number;
        type: 'delayed_inflow' | 'large_outflow' | 'timing_mismatch' | 'concentration';
    }[];

    // Affected periods
    affectedPeriods: string[];

    // Severity
    severity: LiquidityRiskLevel;

    // Mitigation
    mitigationPlan?: string;
    mitigatedAt?: string;
}

// =============================================================================
// RISK SIGNALS
// =============================================================================

export type LiquidityRiskSignalStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface LiquidityRiskSignal {
    id: string;
    type: 'volatility' | 'concentration' | 'buffer' | 'timing' | 'dependency';
    title: string;
    description: string;
    riskLevel: LiquidityRiskLevel;
    status: LiquidityRiskSignalStatus;

    // Metrics
    metric: number;
    threshold: number;
    breached: boolean;

    // Context
    affectedPeriod?: string;
    relatedItems?: string[];

    // Timestamp
    detectedAt: string;
    resolvedAt?: string;
    dismissedAt?: string;
}

export interface LiquidityRiskSummary {
    overallRisk: LiquidityRiskLevel;
    riskScore: number; // 0-100

    signals: LiquidityRiskSignal[];

    // Key metrics
    currentBuffer: number;
    bufferDays: number;
    concentrationIndex: number;
    volatilityIndex: number;

    // Gaps
    totalGaps: number;
    upcomingGaps: number;

    lastAssessed: string;
}

// =============================================================================
// CONFIDENCE BANDS
// =============================================================================

export interface ConfidenceBand {
    periodId: string;
    periodLabel: string;

    // Balance ranges
    highEstimate: number;
    baseEstimate: number;
    lowEstimate: number;

    // Confidence percentage
    confidence: number; // 0-100

    // Components
    confirmedBalance: number;
    expectedRange: [number, number];
    estimatedRange: [number, number];
}

// =============================================================================
// AUDIT LOG
// =============================================================================

export interface LiquidityAuditLog {
    id: string;
    timestamp: string;
    action: 'view' | 'refresh' | 'scenario_created' | 'scenario_viewed' | 'export' | 'assumption_changed';
    userId?: string;
    userName?: string;
    userRole?: string;
    details: string;
    scenarioId?: string;
    dataReferenced?: string[];
}

// =============================================================================
// DASHBOARD
// =============================================================================

export interface LiquidityDashboard {
    organizationName: string;
    baseCurrency: string;
    lastRefresh: string;
    dataAsOf: string;

    // Current position
    currentCashBalance: number;
    minimumBuffer: number;
    availableLiquidity: number;

    // Scenarios
    baseScenario: LiquidityScenario;
    conservativeScenario: LiquidityScenario;
    stressScenario: LiquidityScenario;
    customScenarios: LiquidityScenario[];

    // Risk
    riskSummary: LiquidityRiskSummary;

    // Gaps
    liquidityGaps: LiquidityGap[];

    // Confidence bands
    confidenceBands: ConfidenceBand[];

    // Data quality
    dataCompleteness: number;
    knownBlindSpots: string[];

    // Disclaimers
    disclaimers: string[];
}