// =============================================================================
// INVESTOR / BOARD VIEW TYPES
// Executive-grade, read-only financial oversight interfaces
// =============================================================================

// =============================================================================
// PERIOD TYPES
// =============================================================================

export type ReportingPeriod = 'mtd' | 'qtd' | 'ytd' | 'ttm' | 'custom';
export type TrendDirection = 'up' | 'down' | 'flat';
export type InvestorRiskLevel = 'low' | 'moderate' | 'elevated' | 'high' | 'critical';
export type DataQuality = 'complete' | 'partial' | 'limited' | 'unavailable';
export type ScenarioType = 'conservative' | 'base' | 'aggressive';

// =============================================================================
// FINANCIAL METRICS
// =============================================================================

export interface FinancialMetric {
    value: number;
    currency: string;
    period: ReportingPeriod;
    periodStart: string;
    periodEnd: string;
    previousValue?: number;
    changePercent?: number;
    changeDirection?: TrendDirection;
    dataQuality: DataQuality;
    lastUpdated: string;
}

export interface RevenueMetrics {
    mtd: FinancialMetric;
    qtd: FinancialMetric;
    ytd: FinancialMetric;
    ttm: FinancialMetric;
    breakdown?: {
        category: string;
        amount: number;
        percentOfTotal: number;
    }[];
}

export interface CostMetrics {
    totalCosts: FinancialMetric;
    fixedCosts: FinancialMetric;
    variableCosts: FinancialMetric;
    fixedToVariableRatio: number;
    costBreakdown?: {
        category: string;
        amount: number;
        percentOfTotal: number;
        isFixed: boolean;
    }[];
}

export interface MarginMetrics {
    grossMargin: FinancialMetric;
    grossMarginPercent: number;
    contributionMargin?: FinancialMetric;
    contributionMarginPercent?: number;
    operatingMargin?: FinancialMetric;
    operatingMarginPercent?: number;
    ebitda?: FinancialMetric;
    ebitdaMarginPercent?: number;
    netMargin?: FinancialMetric;
    netMarginPercent?: number;
}

// =============================================================================
// FINANCIAL POSITION
// =============================================================================

export interface CashPosition {
    cashAndEquivalents: FinancialMetric;
    restrictedCash?: FinancialMetric;
    totalCash: FinancialMetric;
    bankAccounts?: {
        name: string;
        balance: number;
        currency: string;
        isRestricted: boolean;
    }[];
}

export interface LiabilityPosition {
    shortTermLiabilities: FinancialMetric;
    longTermLiabilities: FinancialMetric;
    totalLiabilities: FinancialMetric;
    currentRatio?: number;
    quickRatio?: number;
}

export interface WorkingCapital {
    currentAssets: FinancialMetric;
    currentLiabilities: FinancialMetric;
    netWorkingCapital: FinancialMetric;
    workingCapitalRatio: number;
    daysReceivablesOutstanding?: number;
    daysPayablesOutstanding?: number;
    cashConversionCycle?: number;
}

// =============================================================================
// EFFICIENCY INDICATORS
// =============================================================================

export interface EfficiencyMetrics {
    revenuePerEmployee: FinancialMetric;
    costPerEmployee: FinancialMetric;
    employeeCount: number;
    burnEfficiency?: number; // burn / revenue delta
    unitEconomics?: {
        cac?: number; // Customer Acquisition Cost
        ltv?: number; // Lifetime Value
        ltvToCacRatio?: number;
        paybackPeriodMonths?: number;
    };
}

// =============================================================================
// BURN & RUNWAY
// =============================================================================

export interface BurnMetrics {
    currentMonthlyBurn: FinancialMetric;
    rollingAverage3Month: FinancialMetric;
    rollingAverage6Month: FinancialMetric;
    rollingAverage12Month: FinancialMetric;
    burnTrend: TrendDirection;
    burnTrendPercent: number;
    monthlyBurnHistory: {
        month: string;
        burn: number;
        revenue: number;
        netBurn: number;
    }[];
}

export interface RunwayScenario {
    type: ScenarioType;
    assumptions: string[];
    monthlyBurnRate: number;
    runwayMonths: number;
    runwayEndDate: string;
    confidenceLevel: number;
}

export interface RunwayAnalysis {
    currentCash: number;
    currency: string;
    scenarios: RunwayScenario[];
    primaryScenario: ScenarioType;
    dataInputs: string[];
    timeHorizon: string;
    projectionBasis: 'historical' | 'scenario-based' | 'forecast-augmented';
    lastCalculated: string;
    warnings?: string[];
}

// =============================================================================
// RISK INDICATORS
// =============================================================================

export interface ConcentrationRisk {
    type: 'revenue' | 'cost' | 'customer' | 'supplier' | 'currency';
    description: string;
    concentrationPercent: number;
    riskLevel: InvestorRiskLevel;
    topItems?: {
        name: string;
        percent: number;
    }[];
}

export interface RiskIndicators {
    overallRiskLevel: InvestorRiskLevel;
    liquidityRisk: InvestorRiskLevel;
    concentrationRisks: ConcentrationRisk[];
    currencyExposure?: {
        currency: string;
        exposure: number;
        percentOfTotal: number;
    }[];
    interestRateExposure?: {
        fixedRateDebt: number;
        variableRateDebt: number;
        percentVariable: number;
    };
}

// =============================================================================
// COMPLIANCE & AUDIT
// =============================================================================

export interface ComplianceSignals {
    dataCompletenessPercent: number;
    dataQuality: DataQuality;
    reconciliationCoverage: number;
    auditTrailAvailable: boolean;
    lastReconciliationDate?: string;
    knownDataGaps: string[];
    lastAuditDate?: string;
    pendingReconciliations: number;
}

// =============================================================================
// BOARD SUMMARY
// =============================================================================

export interface MaterialChange {
    category: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
    magnitude: 'minor' | 'moderate' | 'significant' | 'material';
    changePercent?: number;
    previousValue?: number;
    currentValue?: number;
}

export interface BoardSummary {
    asOfDate: string;
    periodCovered: string;
    financialHealthStatus: 'healthy' | 'stable' | 'cautionary' | 'concerning' | 'critical';
    keyHighlights: string[];
    materialChanges: MaterialChange[];
    liquidityStatus: string;
    sustainabilityOutlook: string;
    riskFactors: string[];
    dataLimitations: string[];
    generatedAt: string;
}

// =============================================================================
// ACCESS LOG
// =============================================================================

export interface AccessLog {
    id: string;
    userId: string;
    userName: string;
    userRole: string;
    action: string;
    section: string;
    timestamp: string;
    ipAddress?: string;
    sessionId?: string;
}

// =============================================================================
// COMPLETE INVESTOR VIEW
// =============================================================================

export interface InvestorDashboard {
    organizationName: string;
    reportingCurrency: string;
    fiscalYearEnd: string;
    lastDataRefresh: string;

    // Financial Performance
    revenue: RevenueMetrics;
    costs: CostMetrics;
    margins: MarginMetrics;

    // Financial Position
    cashPosition: CashPosition;
    liabilities: LiabilityPosition;
    workingCapital: WorkingCapital;

    // Efficiency
    efficiency: EfficiencyMetrics;

    // Burn & Runway
    burn: BurnMetrics;
    runway: RunwayAnalysis;

    // Risk
    risks: RiskIndicators;

    // Compliance
    compliance: ComplianceSignals;

    // Summary
    boardSummary: BoardSummary;

    // Meta
    dataQualityOverall: DataQuality;
    disclaimers: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const REPORTING_PERIODS: { value: ReportingPeriod; label: string }[] = [
    { value: 'mtd', label: 'Month to Date' },
    { value: 'qtd', label: 'Quarter to Date' },
    { value: 'ytd', label: 'Year to Date' },
    { value: 'ttm', label: 'Trailing 12 Months' },
];

export const INVESTOR_RISK_LEVELS: { value: InvestorRiskLevel; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'emerald' },
    { value: 'moderate', label: 'Moderate', color: 'blue' },
    { value: 'elevated', label: 'Elevated', color: 'amber' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'critical', label: 'Critical', color: 'red' },
];

export const DATA_QUALITY_LEVELS: { value: DataQuality; label: string }[] = [
    { value: 'complete', label: 'Complete' },
    { value: 'partial', label: 'Partial' },
    { value: 'limited', label: 'Limited' },
    { value: 'unavailable', label: 'Unavailable' },
];