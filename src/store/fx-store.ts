import { create } from 'zustand';
import type {
    FXDashboard,
    FXRate,
    CurrencyExposure,
    FXConversion,
    FXScenario,
    FXAuditLog,
    ExposureSummary,
    ConversionSummary,
    FXCost,
    FXImpactAnalysis,
    FXRiskSummary,
    FXRiskIndicator,
    ExposureType,
    TimeHorizon,
    FXRiskLevel,
} from '@/types/fx';

// =============================================================================
// DEMO DATA
// =============================================================================

const demoRates: FXRate[] = [
    { id: 'rate-1', baseCurrency: 'USD', quoteCurrency: 'EUR', rate: 0.9234, inverseRate: 1.0829, source: 'ecb', timestamp: new Date().toISOString(), spread: 0.0015 },
    { id: 'rate-2', baseCurrency: 'USD', quoteCurrency: 'GBP', rate: 0.7891, inverseRate: 1.2673, source: 'ecb', timestamp: new Date().toISOString(), spread: 0.0018 },
    { id: 'rate-3', baseCurrency: 'USD', quoteCurrency: 'CHF', rate: 0.8845, inverseRate: 1.1306, source: 'ecb', timestamp: new Date().toISOString(), spread: 0.0012 },
    { id: 'rate-4', baseCurrency: 'USD', quoteCurrency: 'JPY', rate: 149.52, inverseRate: 0.0067, source: 'ecb', timestamp: new Date().toISOString(), spread: 0.15 },
    { id: 'rate-5', baseCurrency: 'USD', quoteCurrency: 'CAD', rate: 1.3567, inverseRate: 0.7371, source: 'ecb', timestamp: new Date().toISOString(), spread: 0.0020 },
    { id: 'rate-6', baseCurrency: 'USD', quoteCurrency: 'AUD', rate: 1.5234, inverseRate: 0.6564, source: 'ecb', timestamp: new Date().toISOString(), spread: 0.0022 },
    { id: 'rate-7', baseCurrency: 'USD', quoteCurrency: 'CNY', rate: 7.2456, inverseRate: 0.1380, source: 'bank', timestamp: new Date().toISOString(), spread: 0.0150 },
    { id: 'rate-8', baseCurrency: 'USD', quoteCurrency: 'INR', rate: 83.12, inverseRate: 0.0120, source: 'bank', timestamp: new Date().toISOString(), spread: 0.25 },
];

const demoExposures: CurrencyExposure[] = [
    {
        id: 'exp-1', currency: 'EUR', baseCurrency: 'USD', grossExposure: 4567000, netExposure: 2345000,
        hedgedAmount: 1500000, unhedgedAmount: 845000, receivables: 2890000, payables: 1234000,
        cashBalance: 456000, operationalInflows: 890000, operationalOutflows: 657000, structuralPositions: 0,
        exposureType: 'transactional', direction: 'inflow', timeHorizon: 'short_term',
        entityName: 'EU Operations', spotRate: 1.0829, baseCurrencyValue: 2539000, valuationDate: new Date().toISOString(),
        riskLevel: 'moderate', volatility30d: 5.2, var95: 127000, lastUpdated: new Date().toISOString(), dataQuality: 'complete',
    },
    {
        id: 'exp-2', currency: 'GBP', baseCurrency: 'USD', grossExposure: 2345000, netExposure: 1234000,
        hedgedAmount: 800000, unhedgedAmount: 434000, receivables: 1567000, payables: 678000,
        cashBalance: 234000, operationalInflows: 567000, operationalOutflows: 345000, structuralPositions: 0,
        exposureType: 'transactional', direction: 'inflow', timeHorizon: 'short_term',
        entityName: 'UK Operations', spotRate: 1.2673, baseCurrencyValue: 1563000, valuationDate: new Date().toISOString(),
        riskLevel: 'low', volatility30d: 4.8, var95: 78000, lastUpdated: new Date().toISOString(), dataQuality: 'complete',
    },
    {
        id: 'exp-3', currency: 'CHF', baseCurrency: 'USD', grossExposure: 1890000, netExposure: -567000,
        hedgedAmount: 400000, unhedgedAmount: 167000, receivables: 456000, payables: 890000,
        cashBalance: 123000, operationalInflows: 234000, operationalOutflows: 490000, structuralPositions: 0,
        exposureType: 'operational', direction: 'outflow', timeHorizon: 'medium_term',
        entityName: 'Swiss HQ', spotRate: 1.1306, baseCurrencyValue: -641000, valuationDate: new Date().toISOString(),
        riskLevel: 'low', volatility30d: 3.1, var95: 34000, lastUpdated: new Date().toISOString(), dataQuality: 'complete',
    },
    {
        id: 'exp-4', currency: 'JPY', baseCurrency: 'USD', grossExposure: 234500000, netExposure: 89000000,
        hedgedAmount: 50000000, unhedgedAmount: 39000000, receivables: 156000000, payables: 67000000,
        cashBalance: 23000000, operationalInflows: 45000000, operationalOutflows: 34000000, structuralPositions: 0,
        exposureType: 'transactional', direction: 'inflow', timeHorizon: 'short_term',
        entityName: 'Japan Branch', spotRate: 0.0067, baseCurrencyValue: 596300, valuationDate: new Date().toISOString(),
        riskLevel: 'elevated', volatility30d: 8.9, var95: 89000, lastUpdated: new Date().toISOString(), dataQuality: 'partial',
    },
    {
        id: 'exp-5', currency: 'CNY', baseCurrency: 'USD', grossExposure: 12340000, netExposure: 5670000,
        hedgedAmount: 2000000, unhedgedAmount: 3670000, receivables: 8900000, payables: 3230000,
        cashBalance: 1200000, operationalInflows: 3400000, operationalOutflows: 2100000, structuralPositions: 0,
        exposureType: 'operational', direction: 'inflow', timeHorizon: 'medium_term',
        entityName: 'China Operations', spotRate: 0.1380, baseCurrencyValue: 782460, valuationDate: new Date().toISOString(),
        riskLevel: 'high', volatility30d: 2.1, var95: 45000, lastUpdated: new Date().toISOString(), dataQuality: 'partial',
    },
];

const demoConversions: FXConversion[] = [
    {
        id: 'conv-1', conversionNumber: 'FX-2024-0156', sourceCurrency: 'EUR', targetCurrency: 'USD',
        sourceAmount: 250000, targetAmount: 270725, appliedRate: 1.0829, referenceRate: 1.0835, rateDeviation: -0.055,
        rateSource: 'bank', spreadCost: 375, feeCost: 50, totalCost: 425, effectiveRate: 1.0812,
        executionChannel: 'Corporate Bank', counterparty: 'Deutsche Bank', conversionDate: '2024-12-18', valueDate: '2024-12-20',
        status: 'completed', purpose: 'Operating expenses', initiatedBy: 'Treasury', approvedBy: 'CFO', createdAt: '2024-12-18T09:30:00Z',
    },
    {
        id: 'conv-2', conversionNumber: 'FX-2024-0155', sourceCurrency: 'GBP', targetCurrency: 'USD',
        sourceAmount: 150000, targetAmount: 190095, appliedRate: 1.2673, referenceRate: 1.2680, rateDeviation: -0.055,
        rateSource: 'provider', spreadCost: 285, feeCost: 25, totalCost: 310, effectiveRate: 1.2652,
        executionChannel: 'FX Provider', counterparty: 'Wise Business', conversionDate: '2024-12-17', valueDate: '2024-12-18',
        status: 'completed', purpose: 'Supplier payment', initiatedBy: 'AP Team', approvedBy: 'Treasury', createdAt: '2024-12-17T14:15:00Z',
    },
    {
        id: 'conv-3', conversionNumber: 'FX-2024-0154', sourceCurrency: 'USD', targetCurrency: 'CHF',
        sourceAmount: 100000, targetAmount: 88450, appliedRate: 0.8845, referenceRate: 0.8850, rateDeviation: -0.056,
        rateSource: 'bank', spreadCost: 120, feeCost: 35, totalCost: 155, effectiveRate: 0.8830,
        executionChannel: 'Corporate Bank', counterparty: 'UBS', conversionDate: '2024-12-15', valueDate: '2024-12-17',
        status: 'completed', purpose: 'Payroll funding', initiatedBy: 'Treasury', approvedBy: 'CFO', createdAt: '2024-12-15T11:00:00Z',
    },
    {
        id: 'conv-4', conversionNumber: 'FX-2024-0153', sourceCurrency: 'JPY', targetCurrency: 'USD',
        sourceAmount: 15000000, targetAmount: 100320, appliedRate: 0.00669, referenceRate: 0.00670, rateDeviation: -0.15,
        rateSource: 'bank', spreadCost: 150, feeCost: 45, totalCost: 195, effectiveRate: 0.00667,
        executionChannel: 'Corporate Bank', counterparty: 'MUFG', conversionDate: '2024-12-12', valueDate: '2024-12-14',
        status: 'completed', purpose: 'Revenue repatriation', initiatedBy: 'Treasury', approvedBy: 'CFO', createdAt: '2024-12-12T08:45:00Z',
    },
];

const demoExposureSummary: ExposureSummary = {
    baseCurrency: 'USD',
    totalGrossExposure: 8543000,
    totalNetExposure: 4839760,
    totalHedged: 2720000,
    totalUnhedged: 2119760,
    hedgeRatio: 56.2,
    exposureByCurrency: [
        { currency: 'EUR', amount: 2539000, percentOfTotal: 52.5 },
        { currency: 'GBP', amount: 1563000, percentOfTotal: 32.3 },
        { currency: 'CNY', amount: 782460, percentOfTotal: 16.2 },
        { currency: 'JPY', amount: 596300, percentOfTotal: 12.3 },
        { currency: 'CHF', amount: -641000, percentOfTotal: -13.2 },
    ],
    exposureByType: [
        { type: 'transactional', amount: 4698300, percentOfTotal: 55.0 },
        { type: 'operational', amount: 2141460, percentOfTotal: 25.1 },
        { type: 'cash', amount: 1013000, percentOfTotal: 11.9 },
        { type: 'structural', amount: 690240, percentOfTotal: 8.1 },
    ],
    exposureByHorizon: [
        { horizon: 'short_term', amount: 4698300, percentOfTotal: 55.0 },
        { horizon: 'medium_term', amount: 2923760, percentOfTotal: 34.2 },
        { horizon: 'long_term', amount: 921000, percentOfTotal: 10.8 },
    ],
    topExposures: demoExposures.slice(0, 3),
    lastCalculated: new Date().toISOString(),
};

const demoConversionSummary: ConversionSummary = {
    totalConversions: 47,
    totalSourceAmount: 3456000,
    totalTargetAmount: 3567890,
    totalCosts: 4850,
    averageSpread: 0.14,
    periodStart: '2024-12-01',
    periodEnd: '2024-12-20',
    byChannel: [
        { channel: 'Corporate Bank', count: 28, volume: 2345000, avgCost: 0.15 },
        { channel: 'FX Provider', count: 15, volume: 890000, avgCost: 0.11 },
        { channel: 'Internal Transfer', count: 4, volume: 221000, avgCost: 0.05 },
    ],
    byCurrencyPair: [
        { pair: 'EUR/USD', count: 18, volume: 1234000, avgRate: 1.0825 },
        { pair: 'GBP/USD', count: 12, volume: 890000, avgRate: 1.2665 },
        { pair: 'USD/CHF', count: 8, volume: 567000, avgRate: 0.8840 },
        { pair: 'JPY/USD', count: 9, volume: 765000, avgRate: 0.00668 },
    ],
};

const demoCosts: FXCost = {
    id: 'cost-dec-2024',
    period: '2024-12',
    baseCurrency: 'USD',
    spreadCosts: 3450,
    transactionFees: 890,
    bankCharges: 510,
    totalExplicitCosts: 4850,
    rateDeviationImpact: 2340,
    timingImpact: 890,
    totalImplicitCosts: 3230,
    totalFXCosts: 8080,
    costAsPercentOfVolume: 0.23,
    revenueImpact: -45000,
    costImpact: 12000,
    cashImpact: -8500,
    netPnLImpact: -41500,
    priorPeriodCosts: 7650,
    changeVsPrior: 430,
    changePercentVsPrior: 5.6,
    calculationMethod: 'Transaction-weighted average',
    referenceRateUsed: 'ECB daily fixing',
    lastCalculated: new Date().toISOString(),
};

const demoImpactAnalysis: FXImpactAnalysis = {
    period: '2024-Q4',
    baseCurrency: 'USD',
    revenueInBaseCurrency: 2890000,
    revenueAtBudgetRates: 2845000,
    revenueAtActualRates: 2890000,
    revenueFXVariance: 45000,
    revenueFXVariancePercent: 1.58,
    costsInBaseCurrency: 1567000,
    costsAtBudgetRates: 1590000,
    costsAtActualRates: 1567000,
    costsFXVariance: -23000,
    costsFXVariancePercent: -1.45,
    netFXImpact: 68000,
    netFXImpactPercent: 2.36,
    impactByCurrency: [
        { currency: 'EUR', budgetRate: 1.0750, actualRate: 1.0829, rateVariance: 0.73, volumeExposed: 1890000, fxImpact: 28000 },
        { currency: 'GBP', budgetRate: 1.2500, actualRate: 1.2673, rateVariance: 1.38, volumeExposed: 890000, fxImpact: 18000 },
        { currency: 'CHF', budgetRate: 1.1200, actualRate: 1.1306, rateVariance: 0.95, volumeExposed: 456000, fxImpact: 8000 },
        { currency: 'JPY', budgetRate: 0.00680, actualRate: 0.00669, rateVariance: -1.62, volumeExposed: 345000, fxImpact: -6000 },
    ],
    lastCalculated: new Date().toISOString(),
};

const demoRiskIndicators: FXRiskIndicator[] = [
    { id: 'ri-1', type: 'concentration', title: 'EUR Concentration', description: 'EUR exposure represents 52.5% of total FX exposure', riskLevel: 'elevated', metric: 52.5, threshold: 40, breached: true, currency: 'EUR', lastAssessed: new Date().toISOString() },
    { id: 'ri-2', type: 'unhedged', title: 'Unhedged Exposure', description: '43.8% of total exposure remains unhedged', riskLevel: 'moderate', metric: 43.8, threshold: 50, breached: false, lastAssessed: new Date().toISOString() },
    { id: 'ri-3', type: 'volatility', title: 'JPY Volatility', description: 'JPY 30-day volatility at 8.9% exceeds threshold', riskLevel: 'elevated', metric: 8.9, threshold: 7, breached: true, currency: 'JPY', lastAssessed: new Date().toISOString() },
    { id: 'ri-4', type: 'mismatch', title: 'Revenue/Cost Mismatch', description: 'CHF shows net outflow position despite EUR/GBP inflows', riskLevel: 'low', metric: 15, threshold: 25, breached: false, currency: 'CHF', lastAssessed: new Date().toISOString() },
    { id: 'ri-5', type: 'provider', title: 'Provider Concentration', description: 'Single bank handles 60% of FX volume', riskLevel: 'moderate', metric: 60, threshold: 70, breached: false, lastAssessed: new Date().toISOString() },
];

const demoRiskSummary: FXRiskSummary = {
    overallRiskLevel: 'moderate',
    riskScore: 42,
    indicators: demoRiskIndicators,
    largestExposure: { currency: 'EUR', amount: 2539000, percentOfTotal: 52.5 },
    unhedgedExposurePercent: 43.8,
    averageVolatility: 5.6,
    concentrationIndex: 0.32,
    activeAlerts: 3,
    criticalAlerts: 0,
    lastAssessed: new Date().toISOString(),
};

const demoScenarios: FXScenario[] = [
    {
        id: 'scn-1', name: 'EUR Weakening', description: '10% EUR depreciation against USD',
        baseCurrency: 'USD',
        rateAssumptions: [
            { currency: 'EUR', currentRate: 1.0829, scenarioRate: 0.9746, changePercent: -10 },
        ],
        totalExposureImpact: -253900, revenueImpact: -189000, costImpact: 45000, cashImpact: -45600,
        scenarioType: 'sensitivity', severity: 'moderate', probability: 15,
        createdAt: new Date().toISOString(), isHypothetical: true,
    },
    {
        id: 'scn-2', name: 'Global USD Strength', description: '5% USD appreciation across all currencies',
        baseCurrency: 'USD',
        rateAssumptions: [
            { currency: 'EUR', currentRate: 1.0829, scenarioRate: 1.0288, changePercent: -5 },
            { currency: 'GBP', currentRate: 1.2673, scenarioRate: 1.2039, changePercent: -5 },
            { currency: 'CHF', currentRate: 1.1306, scenarioRate: 1.0741, changePercent: -5 },
        ],
        totalExposureImpact: -241988, revenueImpact: -156000, costImpact: 32000, cashImpact: -50650,
        scenarioType: 'stress_test', severity: 'moderate', probability: 25,
        createdAt: new Date().toISOString(), isHypothetical: true,
    },
    {
        id: 'scn-3', name: 'JPY Volatility Spike', description: 'JPY moves 15% against USD',
        baseCurrency: 'USD',
        rateAssumptions: [
            { currency: 'JPY', currentRate: 0.0067, scenarioRate: 0.0057, changePercent: -15 },
        ],
        totalExposureImpact: -89445, revenueImpact: -67000, costImpact: 12000, cashImpact: -15450,
        scenarioType: 'stress_test', severity: 'severe', probability: 10,
        createdAt: new Date().toISOString(), isHypothetical: true,
    },
];

const demoDashboard: FXDashboard = {
    baseCurrency: 'USD',
    organizationName: 'PrimeBalance Corp',
    lastDataRefresh: new Date().toISOString(),
    currentRates: demoRates,
    exposureSummary: demoExposureSummary,
    exposures: demoExposures,
    conversionSummary: demoConversionSummary,
    recentConversions: demoConversions,
    currentPeriodCosts: demoCosts,
    impactAnalysis: demoImpactAnalysis,
    riskSummary: demoRiskSummary,
    activeScenarios: demoScenarios,
    dataQuality: 'complete',
    disclaimers: [
        'FX rates are indicative only and may differ from actual execution rates.',
        'This module provides decision-support information only. No trading or hedging recommendations.',
        'All exposure figures are estimates based on available data. Actual exposures may vary.',
        'Scenario analysis is hypothetical and does not predict future market movements.',
    ],
};

// =============================================================================
// STORE
// =============================================================================

interface FXState {
    dashboard: FXDashboard;
    auditLogs: FXAuditLog[];
    selectedCurrency: string | null;
    selectedTimeHorizon: TimeHorizon | 'all';
    selectedExposureType: ExposureType | 'all';
    isLoading: boolean;

    // Actions (Read-only focus)
    setSelectedCurrency: (currency: string | null) => void;
    setSelectedTimeHorizon: (horizon: TimeHorizon | 'all') => void;
    setSelectedExposureType: (type: ExposureType | 'all') => void;
    refreshDashboard: () => Promise<void>;
    logAccess: (action: string, category: FXAuditLog['category'], details: string) => void;
    getFilteredExposures: () => CurrencyExposure[];
    getExposureByCurrency: (currency: string) => CurrencyExposure | undefined;
    getRateForCurrency: (currency: string) => FXRate | undefined;
}

export const useFXStore = create<FXState>((set, get) => ({
    dashboard: demoDashboard,
    auditLogs: [],
    selectedCurrency: null,
    selectedTimeHorizon: 'all',
    selectedExposureType: 'all',
    isLoading: false,

    setSelectedCurrency: (currency) => {
        set({ selectedCurrency: currency });
        get().logAccess('filter_change', 'exposure', `Currency filter: ${currency || 'All'}`);
    },

    setSelectedTimeHorizon: (horizon) => {
        set({ selectedTimeHorizon: horizon });
        get().logAccess('filter_change', 'exposure', `Time horizon: ${horizon}`);
    },

    setSelectedExposureType: (type) => {
        set({ selectedExposureType: type });
        get().logAccess('filter_change', 'exposure', `Exposure type: ${type}`);
    },

    refreshDashboard: async () => {
        set({ isLoading: true });
        get().logAccess('refresh', 'exposure', 'Dashboard refresh initiated');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        set({ isLoading: false });
    },

    logAccess: (action, category, details) => {
        const log: FXAuditLog = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action,
            category,
            details,
            userName: 'Current User',
        };
        set((state) => ({
            auditLogs: [log, ...state.auditLogs].slice(0, 100),
        }));
    },

    getFilteredExposures: () => {
        const { dashboard, selectedCurrency, selectedTimeHorizon, selectedExposureType } = get();
        return dashboard.exposures.filter((exp) => {
            if (selectedCurrency && exp.currency !== selectedCurrency) return false;
            if (selectedTimeHorizon !== 'all' && exp.timeHorizon !== selectedTimeHorizon) return false;
            if (selectedExposureType !== 'all' && exp.exposureType !== selectedExposureType) return false;
            return true;
        });
    },

    getExposureByCurrency: (currency) => {
        return get().dashboard.exposures.find((exp) => exp.currency === currency);
    },

    getRateForCurrency: (currency) => {
        return get().dashboard.currentRates.find((r) => r.quoteCurrency === currency);
    },
}));