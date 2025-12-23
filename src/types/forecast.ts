// =============================================================================
// FORECASTS TYPES - PrimeBalance Finance OS
// =============================================================================

// Time & Granularity
export type TimeHorizon = 'month' | 'quarter' | 'year';
export type TimeGranularity = 'weekly' | 'monthly' | 'quarterly';
export type ForecastVersion = 'baseline' | 'latest' | 'locked' | 'scenario';

// Confidence & Risk
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type ForecastRiskLevel = 'low' | 'medium' | 'high' | 'critical';

// Scenario Types
export type ScenarioType = 'base' | 'optimistic' | 'pessimistic' | 'custom';

// Cost Categories
export type CostCategory = 'fixed' | 'variable' | 'discretionary' | 'one_time';

// Revenue Types
export type RevenueType = 'contract' | 'usage_based' | 'one_time' | 'recurring';

// Variance Attribution
export type VarianceDriver = 'volume' | 'price' | 'timing' | 'scope' | 'one_off' | 'fx' | 'other';

// =============================================================================
// CORE VALUE TYPES
// =============================================================================

export interface ForecastValue {
    expected: number;
    bestCase: number;
    worstCase: number;
    confidence: ConfidenceLevel;
    confidenceScore: number; // 0-100
}

export interface VarianceData {
    forecasted: number;
    actual: number;
    absoluteVariance: number;
    percentageVariance: number;
    attribution: VarianceAttribution[];
}

export interface VarianceAttribution {
    driver: VarianceDriver;
    amount: number;
    percentage: number;
    description?: string;
}

export interface TimePeriod {
    id: string;
    label: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    isLocked: boolean;
}

// =============================================================================
// REVENUE FORECAST
// =============================================================================

export interface RevenueLineItem {
    id: string;
    name: string;
    category: 'product' | 'service' | 'subscription' | 'other';
    type: RevenueType;
    segment?: string;
    region?: string;
    customerId?: string;
    customerName?: string;
    
    // Values per period
    periods: Record<string, ForecastValue>;
    
    // Flags
    isCommitted: boolean;
    isAtRisk: boolean;
    isRenewal: boolean;
    hasUpsell: boolean;
    hasDownsell: boolean;
    highUncertainty: boolean;
    
    // Drivers & Notes
    drivers: string[];
    annotations: ForecastAnnotation[];
    
    // Confidence
    confidence: ConfidenceLevel;
    confidenceScore: number;
}

export interface RevenueForecast {
    id: string;
    version: ForecastVersion;
    scenarioId?: string;
    timeHorizon: TimeHorizon;
    granularity: TimeGranularity;
    currency: string;
    
    // Summary
    totalExpected: number;
    totalBestCase: number;
    totalWorstCase: number;
    committedRevenue: number;
    projectedRevenue: number;
    atRiskRevenue: number;
    
    // Line Items
    lineItems: RevenueLineItem[];
    
    // By Dimension
    byProduct: Record<string, number>;
    bySegment: Record<string, number>;
    byRegion: Record<string, number>;
    byType: Record<RevenueType, number>;
    
    // Meta
    lastUpdatedAt: string;
    lastUpdatedBy?: string;
    dataSource: string;
    confidence: ConfidenceLevel;
}

// =============================================================================
// COST FORECAST
// =============================================================================

export interface CostLineItem {
    id: string;
    name: string;
    category: CostCategory;
    department?: string;
    costCenter?: string;
    vendorId?: string;
    vendorName?: string;
    projectId?: string;
    projectName?: string;
    
    // Values per period
    periods: Record<string, ForecastValue>;
    
    // Flags
    isCommitted: boolean;
    isContractual: boolean;
    hasStepChange: boolean;
    stepChangeDescription?: string;
    isOverrun: boolean;
    isUnplanned: boolean;
    
    // Drivers & Notes
    drivers: string[];
    annotations: ForecastAnnotation[];
    
    // Scenario adjustments
    scenarioImpact?: string; // e.g., "+10% volume growth impact"
    
    // Confidence
    confidence: ConfidenceLevel;
    confidenceScore: number;
}

export interface CostForecast {
    id: string;
    version: ForecastVersion;
    scenarioId?: string;
    timeHorizon: TimeHorizon;
    granularity: TimeGranularity;
    currency: string;
    
    // Summary
    totalExpected: number;
    totalBestCase: number;
    totalWorstCase: number;
    committedCosts: number;
    estimatedCosts: number;
    
    // Line Items
    lineItems: CostLineItem[];
    
    // By Dimension
    byCategory: Record<CostCategory, number>;
    byDepartment: Record<string, number>;
    byVendor: Record<string, number>;
    byProject: Record<string, number>;
    
    // Alerts
    overrunCount: number;
    unplannedSpendTotal: number;
    
    // Meta
    lastUpdatedAt: string;
    lastUpdatedBy?: string;
    dataSource: string;
    confidence: ConfidenceLevel;
}

// =============================================================================
// CASH FORECAST
// =============================================================================

export interface CashPeriod {
    periodId: string;
    periodLabel: string;
    startDate: string;
    endDate: string;
    
    // Balances
    openingBalance: number;
    closingBalance: number;
    netCashFlow: number;
    
    // Cash In
    cashIn: ForecastValue;
    cashInBreakdown: {
        collections: number;
        otherReceipts: number;
        financing: number;
    };
    
    // Cash Out
    cashOut: ForecastValue;
    cashOutBreakdown: {
        payroll: number;
        vendors: number;
        taxes: number;
        debtService: number;
        capex: number;
        other: number;
    };
    
    // Flags
    isNegative: boolean;
    isCritical: boolean;
    breachesMinimum: boolean;
    breachesCovenant: boolean;
    
    // Confidence
    confidence: ConfidenceLevel;
}

export interface CashForecast {
    id: string;
    version: ForecastVersion;
    scenarioId?: string;
    timeHorizon: TimeHorizon;
    granularity: TimeGranularity;
    currency: string;
    
    // Current Position
    currentCashBalance: number;
    
    // Periods
    periods: CashPeriod[];
    
    // Key Metrics
    minimumCashRunway: number; // days
    covenantThreshold: number;
    projectedMinimumBalance: number;
    projectedMinimumDate: string;
    
    // Drivers
    avgCollectionDays: number;
    avgPaymentTerms: number;
    delayedReceivables: number;
    
    // Stress Scenarios
    stressScenarios: StressScenario[];
    
    // Flags
    hasNegativePeriods: boolean;
    hasCriticalPeriods: boolean;
    covenantAtRisk: boolean;
    
    // Meta
    lastUpdatedAt: string;
    lastUpdatedBy?: string;
    dataSource: string;
    confidence: ConfidenceLevel;
}

export interface StressScenario {
    id: string;
    name: string;
    description: string;
    type: 'late_payments' | 'revenue_shortfall' | 'cost_overrun' | 'combined';
    impactOnCash: number;
    runwayImpactDays: number;
    probability: ConfidenceLevel;
}

// =============================================================================
// FORECAST VS ACTUAL
// =============================================================================

export interface ForecastActualComparison {
    periodId: string;
    periodLabel: string;
    
    // Revenue
    revenueForecast: number;
    revenueActual: number;
    revenueVariance: VarianceData;
    
    // Costs
    costForecast: number;
    costActual: number;
    costVariance: VarianceData;
    
    // Cash
    cashForecast: number;
    cashActual: number;
    cashVariance: VarianceData;
    
    // Net
    netForecast: number;
    netActual: number;
    netVariance: VarianceData;
    
    // Flags
    hasMaterialVariance: boolean;
    varianceThresholdBreached: boolean;
}

export interface ForecastAccuracyTrend {
    periodId: string;
    periodLabel: string;
    revenueAccuracy: number; // percentage
    costAccuracy: number;
    cashAccuracy: number;
    overallAccuracy: number;
}

// =============================================================================
// SCENARIOS & ASSUMPTIONS
// =============================================================================

export interface ForecastAssumption {
    id: string;
    name: string;
    category: 'growth' | 'churn' | 'inflation' | 'fx' | 'payment' | 'volume' | 'pricing' | 'other';
    value: number;
    unit: 'percentage' | 'amount' | 'days' | 'multiplier';
    description?: string;
    impactedForecasts: ('revenue' | 'cost' | 'cash')[];
    isEditable: boolean;
    lastUpdatedAt: string;
    lastUpdatedBy?: string;
}

export interface ForecastScenario {
    id: string;
    name: string;
    type: ScenarioType;
    description?: string;
    
    // Assumptions
    assumptions: ForecastAssumption[];
    
    // Scenario Results
    revenueForecastId?: string;
    costForecastId?: string;
    cashForecastId?: string;
    
    // Summary Deltas vs Base
    revenueVsBase: number;
    costVsBase: number;
    cashVsBase: number;
    netVsBase: number;
    
    // Status
    isLocked: boolean;
    isActive: boolean;
    
    // Meta
    createdAt: string;
    createdBy?: string;
    lastUpdatedAt: string;
    lastUpdatedBy?: string;
}

// =============================================================================
// ANNOTATIONS & COMMENTS
// =============================================================================

export interface ForecastAnnotation {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    createdAt: string;
    updatedAt?: string;
    lineItemId?: string;
    periodId?: string;
}

// =============================================================================
// ALERTS
// =============================================================================

export type ForecastAlertType = 
    | 'revenue_shortfall'
    | 'cost_overrun'
    | 'cash_runway_breach'
    | 'covenant_breach'
    | 'negative_cash'
    | 'material_variance'
    | 'stale_assumption'
    | 'missing_input'
    | 'confidence_low';

export interface ForecastAlert {
    id: string;
    type: ForecastAlertType;
    severity: ForecastRiskLevel;
    title: string;
    message: string;
    forecastType: 'revenue' | 'cost' | 'cash' | 'all';
    periodId?: string;
    lineItemId?: string;
    threshold?: number;
    currentValue?: number;
    isRead: boolean;
    isDismissed: boolean;
    createdAt: string;
}

// =============================================================================
// SUMMARY & DASHBOARD
// =============================================================================

export interface ForecastSummary {
    // Revenue
    totalRevenue: ForecastValue;
    revenueGrowthRate: number;
    committedRevenuePercent: number;
    atRiskRevenuePercent: number;
    
    // Costs
    totalCosts: ForecastValue;
    costGrowthRate: number;
    fixedCostsPercent: number;
    variableCostsPercent: number;
    
    // Cash
    currentCash: number;
    projectedCash: ForecastValue;
    cashRunwayDays: number;
    
    // Net
    netPosition: ForecastValue;
    profitMargin: number;
    
    // Confidence
    overallConfidence: ConfidenceLevel;
    overallConfidenceScore: number;
    
    // Data Quality
    dataFreshness: 'fresh' | 'stale' | 'outdated';
    lastUpdatedAt: string;
    dataCompleteness: number; // percentage
    
    // Alerts
    alertCount: number;
    criticalAlertCount: number;
}

// =============================================================================
// UI STATE
// =============================================================================

export type ForecastTab = 'overview' | 'revenue' | 'costs' | 'cash' | 'variance' | 'scenarios';

export interface ForecastViewPreferences {
    timeHorizon: TimeHorizon;
    granularity: TimeGranularity;
    activeScenarioId: string | null;
    showBestWorstCase: boolean;
    showConfidenceIndicators: boolean;
    showAnnotations: boolean;
    comparisonMode: 'side_by_side' | 'delta' | 'percentage';
    varianceThreshold: number; // percentage for highlighting
}

export interface ForecastFilter {
    department?: string[];
    costCenter?: string[];
    product?: string[];
    segment?: string[];
    region?: string[];
    vendor?: string[];
    category?: CostCategory[];
    revenueType?: RevenueType[];
    confidenceLevel?: ConfidenceLevel[];
    showAtRisk?: boolean;
    showOverruns?: boolean;
    searchQuery?: string;
}

// =============================================================================
// EXPORT TYPES
// =============================================================================

export interface ForecastExportOptions {
    format: 'pdf' | 'xlsx' | 'csv';
    includeAssumptions: boolean;
    includeAnnotations: boolean;
    includeScenarioComparison: boolean;
    dateRange: {
        start: string;
        end: string;
    };
}