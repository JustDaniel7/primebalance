// =============================================================================
// FX MANAGEMENT TYPES
// Currency risk oversight and foreign exchange management interfaces
// =============================================================================

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export type ExposureType = 'transactional' | 'cash' | 'operational' | 'structural';
export type ExposureDirection = 'inflow' | 'outflow' | 'both';
export type TimeHorizon = 'short_term' | 'medium_term' | 'long_term';
export type ConversionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type RateSource = 'ecb' | 'fed' | 'bank' | 'provider' | 'internal' | 'market';
export type FXRiskLevel = 'low' | 'moderate' | 'elevated' | 'high' | 'critical';

export const EXPOSURE_TYPES: { value: ExposureType; label: string }[] = [
    { value: 'transactional', label: 'Transactional' },
    { value: 'cash', label: 'Cash' },
    { value: 'operational', label: 'Operational' },
    { value: 'structural', label: 'Structural' },
];

export const TIME_HORIZONS: { value: TimeHorizon; label: string }[] = [
    { value: 'short_term', label: '0-3 Months' },
    { value: 'medium_term', label: '3-12 Months' },
    { value: 'long_term', label: '12+ Months' },
];

export const RATE_SOURCES: { value: RateSource; label: string }[] = [
    { value: 'ecb', label: 'ECB Reference' },
    { value: 'fed', label: 'Federal Reserve' },
    { value: 'bank', label: 'Bank Rate' },
    { value: 'provider', label: 'FX Provider' },
    { value: 'internal', label: 'Internal Rate' },
    { value: 'market', label: 'Market Rate' },
];

export const MAJOR_CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'CNY', 'INR', 'BRL'];

// =============================================================================
// FX RATES
// =============================================================================

export interface FXRate {
    id: string;
    baseCurrency: string;
    quoteCurrency: string;
    rate: number;
    inverseRate: number;
    source: RateSource;
    timestamp: string;
    validUntil?: string;
    spread?: number;
}

export interface FXRateHistory {
    currency: string;
    baseCurrency: string;
    rates: {
        date: string;
        rate: number;
        high: number;
        low: number;
    }[];
}

// =============================================================================
// EXPOSURE
// =============================================================================

export interface CurrencyExposure {
    id: string;
    currency: string;
    baseCurrency: string;

    // Amounts
    grossExposure: number;
    netExposure: number;
    hedgedAmount: number;
    unhedgedAmount: number;

    // Breakdown
    receivables: number;
    payables: number;
    cashBalance: number;
    operationalInflows: number;
    operationalOutflows: number;
    structuralPositions: number;

    // Classification
    exposureType: ExposureType;
    direction: ExposureDirection;
    timeHorizon: TimeHorizon;

    // Entity
    entityId?: string;
    entityName?: string;

    // Valuation
    spotRate: number;
    baseCurrencyValue: number;
    valuationDate: string;

    // Risk
    riskLevel: FXRiskLevel;
    volatility30d?: number;
    var95?: number; // Value at Risk 95%

    // Meta
    lastUpdated: string;
    dataQuality: 'complete' | 'partial' | 'estimated';
}

export interface ExposureSummary {
    baseCurrency: string;
    totalGrossExposure: number;
    totalNetExposure: number;
    totalHedged: number;
    totalUnhedged: number;
    hedgeRatio: number;
    exposureByCurrency: {
        currency: string;
        amount: number;
        percentOfTotal: number;
    }[];
    exposureByType: {
        type: ExposureType;
        amount: number;
        percentOfTotal: number;
    }[];
    exposureByHorizon: {
        horizon: TimeHorizon;
        amount: number;
        percentOfTotal: number;
    }[];
    topExposures: CurrencyExposure[];
    lastCalculated: string;
}

// =============================================================================
// CONVERSIONS
// =============================================================================

export interface FXConversion {
    id: string;
    conversionNumber: string;

    // Currencies
    sourceCurrency: string;
    targetCurrency: string;

    // Amounts
    sourceAmount: number;
    targetAmount: number;

    // Rate
    appliedRate: number;
    referenceRate?: number;
    rateDeviation?: number;
    rateSource: RateSource;

    // Costs
    spreadCost: number;
    feeCost: number;
    totalCost: number;
    effectiveRate: number;

    // Execution
    executionChannel: string;
    counterparty?: string;

    // Dates
    conversionDate: string;
    valueDate: string;
    settlementDate?: string;

    // Status
    status: ConversionStatus;

    // Reference
    purpose?: string;
    relatedDocuments?: string[];

    // Audit
    initiatedBy?: string;
    approvedBy?: string;
    createdAt: string;
}

export interface ConversionSummary {
    totalConversions: number;
    totalSourceAmount: number;
    totalTargetAmount: number;
    totalCosts: number;
    averageSpread: number;
    periodStart: string;
    periodEnd: string;
    byChannel: {
        channel: string;
        count: number;
        volume: number;
        avgCost: number;
    }[];
    byCurrencyPair: {
        pair: string;
        count: number;
        volume: number;
        avgRate: number;
    }[];
}

// =============================================================================
// FX COSTS & IMPACT
// =============================================================================

export interface FXCost {
    id: string;
    period: string;
    baseCurrency: string;

    // Explicit costs
    spreadCosts: number;
    transactionFees: number;
    bankCharges: number;
    totalExplicitCosts: number;

    // Implicit costs (rate deviation)
    rateDeviationImpact: number;
    timingImpact: number;
    totalImplicitCosts: number;

    // Total
    totalFXCosts: number;
    costAsPercentOfVolume: number;

    // Impact on P&L
    revenueImpact: number;
    costImpact: number;
    cashImpact: number;
    netPnLImpact: number;

    // Comparison
    priorPeriodCosts?: number;
    changeVsPrior?: number;
    changePercentVsPrior?: number;

    // Meta
    calculationMethod: string;
    referenceRateUsed: string;
    lastCalculated: string;
}

export interface FXImpactAnalysis {
    period: string;
    baseCurrency: string;

    // Revenue impact
    revenueInBaseCurrency: number;
    revenueAtBudgetRates: number;
    revenueAtActualRates: number;
    revenueFXVariance: number;
    revenueFXVariancePercent: number;

    // Cost impact
    costsInBaseCurrency: number;
    costsAtBudgetRates: number;
    costsAtActualRates: number;
    costsFXVariance: number;
    costsFXVariancePercent: number;

    // Net impact
    netFXImpact: number;
    netFXImpactPercent: number;

    // By currency
    impactByCurrency: {
        currency: string;
        budgetRate: number;
        actualRate: number;
        rateVariance: number;
        volumeExposed: number;
        fxImpact: number;
    }[];

    lastCalculated: string;
}

// =============================================================================
// PLANNING & FORECASTING
// =============================================================================

export interface FXForecast {
    id: string;
    name: string;
    baseCurrency: string;
    horizonMonths: number;
    createdAt: string;

    // Projected exposures
    projectedExposures: {
        month: string;
        currency: string;
        projectedInflows: number;
        projectedOutflows: number;
        netExposure: number;
        confidence: number;
    }[];

    // Assumptions
    assumptions: string[];

    // Status
    status: 'draft' | 'active' | 'archived';
    isHypothetical: boolean;
}

export interface FXScenario {
    id: string;
    name: string;
    description: string;
    baseCurrency: string;

    // Rate assumptions
    rateAssumptions: {
        currency: string;
        currentRate: number;
        scenarioRate: number;
        changePercent: number;
    }[];

    // Impact
    totalExposureImpact: number;
    revenueImpact: number;
    costImpact: number;
    cashImpact: number;

    // Classification
    scenarioType: 'stress_test' | 'sensitivity' | 'budget' | 'custom';
    severity: 'mild' | 'moderate' | 'severe';
    probability?: number;

    // Meta
    createdAt: string;
    isHypothetical: true; // Always true - scenarios are never real
}

// =============================================================================
// RISK INDICATORS
// =============================================================================

export interface FXRiskIndicator {
    id: string;
    type: 'concentration' | 'volatility' | 'mismatch' | 'unhedged' | 'provider' | 'timing';
    title: string;
    description: string;
    riskLevel: FXRiskLevel;
    metric: number;
    threshold: number;
    breached: boolean;
    currency?: string;
    recommendation?: string; // Only shown if explicitly enabled
    lastAssessed: string;
}

export interface FXRiskSummary {
    overallRiskLevel: FXRiskLevel;
    riskScore: number; // 0-100
    indicators: FXRiskIndicator[];

    // Key metrics
    largestExposure: {
        currency: string;
        amount: number;
        percentOfTotal: number;
    };
    unhedgedExposurePercent: number;
    averageVolatility: number;
    concentrationIndex: number; // Herfindahl index

    // Alerts
    activeAlerts: number;
    criticalAlerts: number;

    lastAssessed: string;
}

// =============================================================================
// AUDIT LOG
// =============================================================================

export interface FXAuditLog {
    id: string;
    timestamp: string;
    action: string;
    category: 'rate' | 'conversion' | 'exposure' | 'scenario' | 'access';
    userId?: string;
    userName?: string;
    details: string;
    oldValue?: string;
    newValue?: string;
    ipAddress?: string;
}

// =============================================================================
// DASHBOARD
// =============================================================================

export interface FXDashboard {
    baseCurrency: string;
    organizationName: string;
    lastDataRefresh: string;

    // Current rates
    currentRates: FXRate[];

    // Exposure
    exposureSummary: ExposureSummary;
    exposures: CurrencyExposure[];

    // Conversions
    conversionSummary: ConversionSummary;
    recentConversions: FXConversion[];

    // Costs
    currentPeriodCosts: FXCost;
    impactAnalysis: FXImpactAnalysis;

    // Risk
    riskSummary: FXRiskSummary;

    // Scenarios
    activeScenarios: FXScenario[];

    // Forecasts
    activeForecast?: FXForecast;

    // Meta
    dataQuality: 'complete' | 'partial' | 'limited';
    disclaimers: string[];
}


//wird geaddet weil baum