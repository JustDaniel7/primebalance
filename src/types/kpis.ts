// =============================================================================
// KPIS & PERFORMANCE TYPES - PrimeBalance Finance OS
// =============================================================================

// Time Horizons
export type KPITimeHorizon = 'month' | 'quarter' | 'year' | 'trailing_12m' | 'trailing_6m' | 'trailing_3m';

// Status & Trends
export type KPIStatus = 'on_track' | 'watch' | 'off_track';
export type KPITrendDirection = 'improving' | 'stable' | 'deteriorating';
export type TrendMomentum = 'accelerating' | 'steady' | 'decelerating';

// Categories
export type KPICategory = 'margins' | 'burn_runway' | 'cash_conversion' | 'unit_economics' | 'growth' | 'efficiency';

// Alert Severity
export type KPIAlertSeverity = 'info' | 'warning' | 'critical';

// =============================================================================
// CORE KPI TYPES
// =============================================================================

export interface KPIValue {
    current: number;
    previous: number;
    target?: number;
    
    // Deltas
    deltaVsPrior: number;
    deltaVsPriorPercent: number;
    deltaVsTarget?: number;
    deltaVsTargetPercent?: number;
    
    // Status
    status: KPIStatus;
    trend: KPITrendDirection;
    momentum: TrendMomentum;
}

export interface KPIThreshold {
    softMin?: number;
    softMax?: number;
    hardMin?: number;
    hardMax?: number;
    targetMin?: number;
    targetMax?: number;
}

export interface KPIDefinition {
    id: string;
    name: string;
    shortName?: string;
    description: string;
    category: KPICategory;
    unit: 'percentage' | 'currency' | 'days' | 'ratio' | 'months' | 'number';
    format: string; // e.g., "0.0%", "€0,0", "0.0x"
    higherIsBetter: boolean;
    calculationLogic: string;
    dataSources: string[];
    thresholds: KPIThreshold;
}

export interface KPIHistoricalPoint {
    period: string;
    periodLabel: string;
    value: number;
    target?: number;
    isAnomaly?: boolean;
    annotation?: string;
}

export interface KPI {
    id: string;
    definition: KPIDefinition;
    value: KPIValue;
    history: KPIHistoricalPoint[];
    rollingAverage: number;
    seasonalityFactor?: number;
    lastUpdatedAt: string;
    dataFreshness: 'fresh' | 'stale' | 'outdated';
}

// =============================================================================
// MARGIN TYPES
// =============================================================================

export interface MarginBreakdown {
    segment: string;
    segmentType: 'product' | 'service' | 'customer' | 'region';
    grossMargin: number;
    contributionMargin: number;
    operatingMargin: number;
    revenue: number;
    trend: KPITrendDirection;
}

export interface MarginDriver {
    id: string;
    name: string;
    category: 'pricing' | 'discounts' | 'cogs' | 'variable_cost' | 'fixed_cost' | 'mix';
    impact: number;
    impactPercent: number;
    direction: 'positive' | 'negative';
    description?: string;
}

export interface KPIMarginMetrics {
    grossMargin: KPIValue;
    contributionMargin: KPIValue;
    operatingMargin: KPIValue;
    ebitdaMargin: KPIValue;
    netMargin: KPIValue;
    
    // Breakdowns
    byProduct: MarginBreakdown[];
    bySegment: MarginBreakdown[];
    byRegion: MarginBreakdown[];
    
    // Drivers
    marginDrivers: MarginDriver[];
    
    // Alerts
    hasErosionAlert: boolean;
    erosionThreshold: number;
}

// =============================================================================
// BURN & RUNWAY TYPES
// =============================================================================

export interface BurnBreakdown {
    category: 'operational' | 'discretionary' | 'one_time';
    label: string;
    amount: number;
    percentOfTotal: number;
    trend: KPITrendDirection;
}

export interface KPIRunwayScenario {
    id: string;
    name: string;
    type: 'current' | 'stressed' | 'optimistic';
    runwayMonths: number;
    runwayDate: string;
    burnRate: number;
    assumptions: string[];
}

export interface BurnRunwayMetrics {
    // Burn
    netBurnMonthly: KPIValue;
    netBurnRolling3M: number;
    netBurnRolling6M: number;
    grossBurn: number;
    
    // Breakdown
    burnBreakdown: BurnBreakdown[];
    
    // Runway
    currentRunwayMonths: number;
    currentRunwayDate: string;
    runwayScenarios: KPIRunwayScenario[];
    
    // Cash
    currentCash: number;
    
    // Alerts
    burnAccelerating: boolean;
    runwayBelowThreshold: boolean;
    runwayThresholdMonths: number;
    
    // Cliff
    cliffDate?: string;
    monthsToCliff?: number;
}

// =============================================================================
// CASH CONVERSION CYCLE TYPES
// =============================================================================

export interface CCCComponent {
    metric: 'dso' | 'dpo' | 'dio';
    name: string;
    value: number;
    previousValue: number;
    target: number;
    benchmark?: number;
    trend: KPITrendDirection;
    drivers: string[];
}

export interface CCCMetrics {
    // Core Metrics
    dso: KPIValue; // Days Sales Outstanding
    dpo: KPIValue; // Days Payables Outstanding
    dio: KPIValue; // Days Inventory Outstanding
    netCCC: KPIValue; // Net Cash Conversion Cycle
    
    // Components
    components: CCCComponent[];
    
    // Benchmarks
    internalTarget: number;
    industryBenchmark?: number;
    peerRangeMin?: number;
    peerRangeMax?: number;
    
    // Working Capital
    workingCapital: number;
    workingCapitalDays: number;
    workingCapitalEfficiency: KPITrendDirection;
    
    // Alerts
    hasDeteriorationAlert: boolean;
    deteriorationThreshold: number;
}

// =============================================================================
// UNIT ECONOMICS TYPES
// =============================================================================

export interface UnitMetric {
    id: string;
    name: string;
    value: number;
    previousValue: number;
    target?: number;
    unit: string;
    trend: KPITrendDirection;
    percentile?: number;
}

export interface CohortMetrics {
    cohortId: string;
    cohortName: string;
    cohortDate: string;
    cac: number;
    ltv: number;
    ltvCacRatio: number;
    paybackMonths: number;
    isUnprofitable: boolean;
    trend: KPITrendDirection;
}

export interface UnitDistribution {
    metric: string;
    average: number;
    median: number;
    p25: number;
    p75: number;
    p10: number;
    p90: number;
    min: number;
    max: number;
}

export interface UnitEconomicsMetrics {
    // Core Unit Metrics
    revenuePerUnit: KPIValue;
    variableCostPerUnit: KPIValue;
    contributionPerUnit: KPIValue;
    marginPerUnit: KPIValue;
    
    // Customer Metrics (if applicable)
    cac: KPIValue;
    ltv: KPIValue;
    ltvCacRatio: KPIValue;
    paybackPeriod: KPIValue;
    
    // Cohort Analysis
    cohorts: CohortMetrics[];
    
    // Distribution
    distributions: UnitDistribution[];
    
    // Unprofitable Units
    unprofitableUnits: number;
    unprofitablePercent: number;
    unprofitableSegments: string[];
    
    // Sensitivity
    breakEvenPrice: number;
    breakEvenVolume: number;
}

// =============================================================================
// TREND & ANALYSIS TYPES
// =============================================================================

export interface TrendAnalysis {
    kpiId: string;
    direction: KPITrendDirection;
    momentum: TrendMomentum;
    rateOfChange: number; // percentage change per period
    rollingAvg3M: number;
    rollingAvg6M: number;
    rollingAvg12M: number;
    volatility: number; // standard deviation
    seasonalityIndex?: number;
    trendBreakDetected: boolean;
    trendBreakDate?: string;
    anomalies: {
        date: string;
        value: number;
        expectedValue: number;
        deviation: number;
    }[];
}

// =============================================================================
// ALERT TYPES
// =============================================================================

export type KPIAlertType = 
    | 'margin_compression'
    | 'runway_low'
    | 'burn_acceleration'
    | 'ccc_deterioration'
    | 'unit_economics_negative'
    | 'threshold_breach'
    | 'trend_break'
    | 'target_divergence';

export interface KPIAlert {
    id: string;
    type: KPIAlertType;
    severity: KPIAlertSeverity;
    kpiId: string;
    kpiName: string;
    title: string;
    message: string;
    currentValue: number;
    threshold?: number;
    triggeredAt: string;
    isRead: boolean;
    isDismissed: boolean;
    suggestedAction?: string;
}

// =============================================================================
// EXPLANATION & ATTRIBUTION
// =============================================================================

export interface KPIExplanation {
    kpiId: string;
    kpiName: string;
    currentValue: number;
    previousValue: number;
    calculationLogic: string;
    dataSources: string[];
    
    // Attribution
    drivers: {
        name: string;
        contribution: number;
        contributionPercent: number;
        isPositive: boolean;
        explanation: string;
    }[];
    
    // Waterfall
    waterfall: {
        startValue: number;
        endValue: number;
        steps: {
            label: string;
            value: number;
            cumulative: number;
        }[];
    };
    
    // Natural Language
    summary: string;
}

// =============================================================================
// SUMMARY & DASHBOARD
// =============================================================================

export interface KPISummary {
    // Status Counts
    onTrackCount: number;
    watchCount: number;
    offTrackCount: number;
    totalCount: number;
    
    // Key Metrics
    grossMargin: number;
    operatingMargin: number;
    netBurnRate: number;
    runwayMonths: number;
    cashConversionCycle: number;
    ltvCacRatio: number;
    
    // Trends
    improvingCount: number;
    stableCount: number;
    deterioratingCount: number;
    
    // Alerts
    activeAlerts: number;
    criticalAlerts: number;
    
    // Data Quality
    lastUpdatedAt: string;
    dataFreshness: 'fresh' | 'stale' | 'outdated';
}

// =============================================================================
// UI STATE
// =============================================================================

export type KPITab = 'overview' | 'margins' | 'burn' | 'ccc' | 'unit_economics' | 'trends';

export interface KPIViewPreferences {
    timeHorizon: KPITimeHorizon;
    showTargets: boolean;
    showBenchmarks: boolean;
    showTrends: boolean;
    compactView: boolean;
}

export interface KPIFilter {
    category?: KPICategory[];
    status?: KPIStatus[];
    trend?: KPITrendDirection[];
    searchQuery?: string;
}