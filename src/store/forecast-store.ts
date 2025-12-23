import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    RevenueForecast,
    RevenueLineItem,
    CostForecast,
    CostLineItem,
    CashForecast,
    CashPeriod,
    ForecastSummary,
    ForecastScenario,
    ForecastAssumption,
    ForecastAlert,
    ForecastActualComparison,
    ForecastAccuracyTrend,
    ForecastViewPreferences,
    ForecastFilter,
    ForecastTab,
    ForecastValue,
    TimeHorizon,
    TimeGranularity,
    ScenarioType,
    ConfidenceLevel,
    CostCategory,
    RevenueType,
    TimePeriod,
    StressScenario,
} from '@/types/forecast';

// =============================================================================
// INITIAL STATES
// =============================================================================

const initialViewPreferences: ForecastViewPreferences = {
    timeHorizon: 'quarter',
    granularity: 'monthly',
    activeScenarioId: null,
    showBestWorstCase: true,
    showConfidenceIndicators: true,
    showAnnotations: false,
    comparisonMode: 'side_by_side',
    varianceThreshold: 5,
};

const initialFilter: ForecastFilter = {};

// =============================================================================
// DEMO DATA GENERATORS
// =============================================================================

const generatePeriods = (horizon: TimeHorizon, granularity: TimeGranularity): TimePeriod[] => {
    const periods: TimePeriod[] = [];
    const now = new Date();
    const count = horizon === 'month' ? 4 : horizon === 'quarter' ? 3 : 4;
    
    for (let i = 0; i < count; i++) {
        const date = new Date(now);
        if (granularity === 'monthly') {
            date.setMonth(date.getMonth() + i);
        } else if (granularity === 'quarterly') {
            date.setMonth(date.getMonth() + i * 3);
        } else {
            date.setDate(date.getDate() + i * 7);
        }
        
        periods.push({
            id: `period-${i}`,
            label: granularity === 'monthly' 
                ? date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : granularity === 'quarterly'
                ? `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`
                : `Week ${i + 1}`,
            startDate: date.toISOString().split('T')[0],
            endDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isCurrent: i === 0,
            isLocked: false,
        });
    }
    return periods;
};

const generateForecastValue = (base: number, variance: number = 0.15): ForecastValue => ({
    expected: base,
    bestCase: Math.round(base * (1 + variance)),
    worstCase: Math.round(base * (1 - variance)),
    confidence: base > 100000 ? 'high' : base > 50000 ? 'medium' : 'low',
    confidenceScore: Math.round(70 + Math.random() * 25),
});

const generateDemoRevenueForecast = (): RevenueForecast => {
    const periods = generatePeriods('quarter', 'monthly');
    
    const lineItems: RevenueLineItem[] = [
        {
            id: 'rev-1',
            name: 'Enterprise SaaS Subscriptions',
            category: 'subscription',
            type: 'recurring',
            segment: 'Enterprise',
            region: 'EMEA',
            periods: {
                'period-0': generateForecastValue(450000),
                'period-1': generateForecastValue(465000),
                'period-2': generateForecastValue(480000),
            },
            isCommitted: true,
            isAtRisk: false,
            isRenewal: false,
            hasUpsell: true,
            hasDownsell: false,
            highUncertainty: false,
            drivers: ['Contract renewals', 'Seat expansion'],
            annotations: [],
            confidence: 'high',
            confidenceScore: 85,
        },
        {
            id: 'rev-2',
            name: 'SMB Monthly Plans',
            category: 'subscription',
            type: 'recurring',
            segment: 'SMB',
            region: 'NA',
            periods: {
                'period-0': generateForecastValue(180000),
                'period-1': generateForecastValue(195000),
                'period-2': generateForecastValue(210000),
            },
            isCommitted: false,
            isAtRisk: false,
            isRenewal: false,
            hasUpsell: false,
            hasDownsell: false,
            highUncertainty: false,
            drivers: ['New customer acquisition', 'Churn rate'],
            annotations: [],
            confidence: 'medium',
            confidenceScore: 72,
        },
        {
            id: 'rev-3',
            name: 'Professional Services',
            category: 'service',
            type: 'one_time',
            segment: 'Enterprise',
            region: 'Global',
            periods: {
                'period-0': generateForecastValue(85000),
                'period-1': generateForecastValue(120000),
                'period-2': generateForecastValue(95000),
            },
            isCommitted: false,
            isAtRisk: true,
            isRenewal: false,
            hasUpsell: false,
            hasDownsell: false,
            highUncertainty: true,
            drivers: ['Implementation projects', 'Consulting pipeline'],
            annotations: [{
                id: 'ann-1',
                content: 'Q2 project pipeline uncertain - awaiting client decisions',
                authorId: 'user-1',
                authorName: 'Finance Team',
                createdAt: new Date().toISOString(),
            }],
            confidence: 'low',
            confidenceScore: 55,
        },
        {
            id: 'rev-4',
            name: 'API Usage Fees',
            category: 'product',
            type: 'usage_based',
            segment: 'All',
            region: 'Global',
            periods: {
                'period-0': generateForecastValue(65000),
                'period-1': generateForecastValue(72000),
                'period-2': generateForecastValue(78000),
            },
            isCommitted: false,
            isAtRisk: false,
            isRenewal: false,
            hasUpsell: false,
            hasDownsell: false,
            highUncertainty: false,
            drivers: ['API call volume', 'New integrations'],
            annotations: [],
            confidence: 'medium',
            confidenceScore: 68,
        },
        {
            id: 'rev-5',
            name: 'Enterprise Renewal - TechCorp',
            category: 'subscription',
            type: 'contract',
            segment: 'Enterprise',
            region: 'NA',
            customerId: 'cust-1',
            customerName: 'TechCorp Inc.',
            periods: {
                'period-0': generateForecastValue(0),
                'period-1': generateForecastValue(250000),
                'period-2': generateForecastValue(250000),
            },
            isCommitted: false,
            isAtRisk: true,
            isRenewal: true,
            hasUpsell: false,
            hasDownsell: true,
            highUncertainty: true,
            drivers: ['Contract negotiation', 'Competitor pressure'],
            annotations: [{
                id: 'ann-2',
                content: 'Renewal at risk - competitor offering 20% discount',
                authorId: 'user-2',
                authorName: 'Sales',
                createdAt: new Date().toISOString(),
            }],
            confidence: 'low',
            confidenceScore: 45,
        },
    ];

    const totalExpected = lineItems.reduce((sum, item) => 
        sum + Object.values(item.periods).reduce((s, p) => s + p.expected, 0), 0);

    return {
        id: 'rev-forecast-1',
        version: 'latest',
        timeHorizon: 'quarter',
        granularity: 'monthly',
        currency: 'EUR',
        totalExpected,
        totalBestCase: Math.round(totalExpected * 1.12),
        totalWorstCase: Math.round(totalExpected * 0.88),
        committedRevenue: 450000 * 3,
        projectedRevenue: totalExpected - 450000 * 3,
        atRiskRevenue: 250000 * 2 + 85000 * 3,
        lineItems,
        byProduct: { 'SaaS': 1395000, 'Services': 300000, 'API': 215000 },
        bySegment: { 'Enterprise': 1560000, 'SMB': 585000 },
        byRegion: { 'EMEA': 1395000, 'NA': 930000, 'Global': 520000 },
        byType: { 'recurring': 1680000, 'usage_based': 215000, 'one_time': 300000, 'contract': 500000 },
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedBy: 'Finance Team',
        dataSource: 'CRM + Contracts',
        confidence: 'medium',
    };
};

const generateDemoCostForecast = (): CostForecast => {
    const lineItems: CostLineItem[] = [
        {
            id: 'cost-1',
            name: 'Payroll & Benefits',
            category: 'fixed',
            department: 'All',
            costCenter: 'HR',
            periods: {
                'period-0': generateForecastValue(320000, 0.02),
                'period-1': generateForecastValue(320000, 0.02),
                'period-2': generateForecastValue(340000, 0.02),
            },
            isCommitted: true,
            isContractual: true,
            hasStepChange: true,
            stepChangeDescription: '2 new hires starting in Month 3',
            isOverrun: false,
            isUnplanned: false,
            drivers: ['Headcount', 'Benefits costs'],
            annotations: [],
            confidence: 'high',
            confidenceScore: 92,
        },
        {
            id: 'cost-2',
            name: 'Cloud Infrastructure',
            category: 'variable',
            department: 'Engineering',
            costCenter: 'Infrastructure',
            vendorId: 'vendor-1',
            vendorName: 'AWS',
            periods: {
                'period-0': generateForecastValue(85000, 0.1),
                'period-1': generateForecastValue(92000, 0.1),
                'period-2': generateForecastValue(98000, 0.1),
            },
            isCommitted: false,
            isContractual: false,
            hasStepChange: false,
            isOverrun: false,
            isUnplanned: false,
            drivers: ['Usage growth', 'New services'],
            annotations: [],
            scenarioImpact: '+15% if customer growth exceeds plan',
            confidence: 'medium',
            confidenceScore: 75,
        },
        {
            id: 'cost-3',
            name: 'Marketing Campaigns',
            category: 'discretionary',
            department: 'Marketing',
            costCenter: 'Marketing',
            periods: {
                'period-0': generateForecastValue(65000, 0.2),
                'period-1': generateForecastValue(80000, 0.2),
                'period-2': generateForecastValue(55000, 0.2),
            },
            isCommitted: false,
            isContractual: false,
            hasStepChange: false,
            isOverrun: true,
            isUnplanned: false,
            drivers: ['Campaign calendar', 'Event sponsorships'],
            annotations: [{
                id: 'ann-3',
                content: 'Q2 conference sponsorship added - €15k over budget',
                authorId: 'user-3',
                authorName: 'Marketing',
                createdAt: new Date().toISOString(),
            }],
            confidence: 'medium',
            confidenceScore: 65,
        },
        {
            id: 'cost-4',
            name: 'Office & Facilities',
            category: 'fixed',
            department: 'Operations',
            costCenter: 'Facilities',
            periods: {
                'period-0': generateForecastValue(45000, 0.05),
                'period-1': generateForecastValue(45000, 0.05),
                'period-2': generateForecastValue(45000, 0.05),
            },
            isCommitted: true,
            isContractual: true,
            hasStepChange: false,
            isOverrun: false,
            isUnplanned: false,
            drivers: ['Lease agreement', 'Utilities'],
            annotations: [],
            confidence: 'high',
            confidenceScore: 95,
        },
        {
            id: 'cost-5',
            name: 'Software Licenses',
            category: 'fixed',
            department: 'All',
            costCenter: 'IT',
            periods: {
                'period-0': generateForecastValue(28000, 0.05),
                'period-1': generateForecastValue(28000, 0.05),
                'period-2': generateForecastValue(32000, 0.05),
            },
            isCommitted: true,
            isContractual: true,
            hasStepChange: true,
            stepChangeDescription: 'Annual renewal with price increase',
            isOverrun: false,
            isUnplanned: false,
            drivers: ['License count', 'Vendor pricing'],
            annotations: [],
            confidence: 'high',
            confidenceScore: 88,
        },
        {
            id: 'cost-6',
            name: 'Professional Fees',
            category: 'one_time',
            department: 'Finance',
            costCenter: 'Legal/Audit',
            periods: {
                'period-0': generateForecastValue(15000, 0.3),
                'period-1': generateForecastValue(45000, 0.3),
                'period-2': generateForecastValue(12000, 0.3),
            },
            isCommitted: false,
            isContractual: false,
            hasStepChange: false,
            isOverrun: false,
            isUnplanned: true,
            drivers: ['Audit schedule', 'Legal matters'],
            annotations: [{
                id: 'ann-4',
                content: 'Q2 includes annual audit fees',
                authorId: 'user-1',
                authorName: 'Finance',
                createdAt: new Date().toISOString(),
            }],
            confidence: 'medium',
            confidenceScore: 70,
        },
    ];

    const totalExpected = lineItems.reduce((sum, item) => 
        sum + Object.values(item.periods).reduce((s, p) => s + p.expected, 0), 0);

    return {
        id: 'cost-forecast-1',
        version: 'latest',
        timeHorizon: 'quarter',
        granularity: 'monthly',
        currency: 'EUR',
        totalExpected,
        totalBestCase: Math.round(totalExpected * 0.92),
        totalWorstCase: Math.round(totalExpected * 1.08),
        committedCosts: (320000 * 3 + 340000 - 320000) + (45000 * 3) + (28000 * 2 + 32000),
        estimatedCosts: totalExpected - ((320000 * 3 + 340000 - 320000) + (45000 * 3) + (28000 * 2 + 32000)),
        lineItems,
        byCategory: { 'fixed': 1323000, 'variable': 275000, 'discretionary': 200000, 'one_time': 72000 },
        byDepartment: { 'All': 1068000, 'Engineering': 275000, 'Marketing': 200000, 'Operations': 135000, 'Finance': 72000 },
        byVendor: { 'AWS': 275000, 'Other': 1595000 },
        byProject: {},
        overrunCount: 1,
        unplannedSpendTotal: 72000,
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedBy: 'Finance Team',
        dataSource: 'ERP + Contracts',
        confidence: 'medium',
    };
};

const generateDemoCashForecast = (): CashForecast => {
    const periods: CashPeriod[] = [
        {
            periodId: 'period-0',
            periodLabel: 'Jan 2025',
            startDate: '2025-01-01',
            endDate: '2025-01-31',
            openingBalance: 2500000,
            closingBalance: 2650000,
            netCashFlow: 150000,
            cashIn: generateForecastValue(780000),
            cashInBreakdown: { collections: 720000, otherReceipts: 50000, financing: 10000 },
            cashOut: generateForecastValue(630000),
            cashOutBreakdown: { payroll: 320000, vendors: 180000, taxes: 45000, debtService: 25000, capex: 40000, other: 20000 },
            isNegative: false,
            isCritical: false,
            breachesMinimum: false,
            breachesCovenant: false,
            confidence: 'high',
        },
        {
            periodId: 'period-1',
            periodLabel: 'Feb 2025',
            startDate: '2025-02-01',
            endDate: '2025-02-28',
            openingBalance: 2650000,
            closingBalance: 2580000,
            netCashFlow: -70000,
            cashIn: generateForecastValue(720000),
            cashInBreakdown: { collections: 680000, otherReceipts: 30000, financing: 10000 },
            cashOut: generateForecastValue(790000),
            cashOutBreakdown: { payroll: 320000, vendors: 220000, taxes: 120000, debtService: 25000, capex: 85000, other: 20000 },
            isNegative: false,
            isCritical: false,
            breachesMinimum: false,
            breachesCovenant: false,
            confidence: 'medium',
        },
        {
            periodId: 'period-2',
            periodLabel: 'Mar 2025',
            startDate: '2025-03-01',
            endDate: '2025-03-31',
            openingBalance: 2580000,
            closingBalance: 2720000,
            netCashFlow: 140000,
            cashIn: generateForecastValue(850000),
            cashInBreakdown: { collections: 800000, otherReceipts: 40000, financing: 10000 },
            cashOut: generateForecastValue(710000),
            cashOutBreakdown: { payroll: 340000, vendors: 200000, taxes: 50000, debtService: 25000, capex: 75000, other: 20000 },
            isNegative: false,
            isCritical: false,
            breachesMinimum: false,
            breachesCovenant: false,
            confidence: 'medium',
        },
    ];

    const stressScenarios: StressScenario[] = [
        {
            id: 'stress-1',
            name: 'Delayed Collections',
            description: '30% of receivables delayed by 30 days',
            type: 'late_payments',
            impactOnCash: -420000,
            runwayImpactDays: -15,
            probability: 'medium',
        },
        {
            id: 'stress-2',
            name: 'Revenue Shortfall',
            description: '20% revenue miss in Q1',
            type: 'revenue_shortfall',
            impactOnCash: -380000,
            runwayImpactDays: -12,
            probability: 'low',
        },
    ];

    return {
        id: 'cash-forecast-1',
        version: 'latest',
        timeHorizon: 'quarter',
        granularity: 'monthly',
        currency: 'EUR',
        currentCashBalance: 2500000,
        periods,
        minimumCashRunway: 180,
        covenantThreshold: 1500000,
        projectedMinimumBalance: 2580000,
        projectedMinimumDate: '2025-02-28',
        avgCollectionDays: 45,
        avgPaymentTerms: 30,
        delayedReceivables: 125000,
        stressScenarios,
        hasNegativePeriods: false,
        hasCriticalPeriods: false,
        covenantAtRisk: false,
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedBy: 'Treasury',
        dataSource: 'Bank + AR/AP',
        confidence: 'medium',
    };
};

const generateDemoScenarios = (): ForecastScenario[] => [
    {
        id: 'scenario-base',
        name: 'Base Case',
        type: 'base',
        description: 'Expected performance based on current pipeline and commitments',
        assumptions: [
            { id: 'a1', name: 'Revenue Growth', category: 'growth', value: 8, unit: 'percentage', impactedForecasts: ['revenue'], isEditable: true, lastUpdatedAt: new Date().toISOString() },
            { id: 'a2', name: 'Churn Rate', category: 'churn', value: 5, unit: 'percentage', impactedForecasts: ['revenue'], isEditable: true, lastUpdatedAt: new Date().toISOString() },
            { id: 'a3', name: 'Cost Inflation', category: 'inflation', value: 3, unit: 'percentage', impactedForecasts: ['cost'], isEditable: true, lastUpdatedAt: new Date().toISOString() },
            { id: 'a4', name: 'Collection Days', category: 'payment', value: 45, unit: 'days', impactedForecasts: ['cash'], isEditable: true, lastUpdatedAt: new Date().toISOString() },
        ],
        revenueVsBase: 0,
        costVsBase: 0,
        cashVsBase: 0,
        netVsBase: 0,
        isLocked: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
    },
    {
        id: 'scenario-optimistic',
        name: 'Optimistic',
        type: 'optimistic',
        description: 'Strong execution with favorable market conditions',
        assumptions: [
            { id: 'a5', name: 'Revenue Growth', category: 'growth', value: 15, unit: 'percentage', impactedForecasts: ['revenue'], isEditable: true, lastUpdatedAt: new Date().toISOString() },
            { id: 'a6', name: 'Churn Rate', category: 'churn', value: 3, unit: 'percentage', impactedForecasts: ['revenue'], isEditable: true, lastUpdatedAt: new Date().toISOString() },
            { id: 'a7', name: 'Cost Inflation', category: 'inflation', value: 2, unit: 'percentage', impactedForecasts: ['cost'], isEditable: true, lastUpdatedAt: new Date().toISOString() },
            { id: 'a8', name: 'Collection Days', category: 'payment', value: 35, unit: 'days', impactedForecasts: ['cash'], isEditable: true, lastUpdatedAt: new Date().toISOString() },
        ],
        revenueVsBase: 285000,
        costVsBase: -45000,
        cashVsBase: 180000,
        netVsBase: 330000,
        isLocked: false,
        isActive: false,
        createdAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
    },
    {
        id: 'scenario-pessimistic',
        name: 'Pessimistic',
        type: 'pessimistic',
        description: 'Economic headwinds and increased competition',
        assumptions: [
            { id: 'a9', name: 'Revenue Growth', category: 'growth', value: 2, unit: 'percentage', impactedForecasts: ['revenue'], isEditable: true, lastUpdatedAt: new Date().toISOString() },
            { id: 'a10', name: 'Churn Rate', category: 'churn', value: 8, unit: 'percentage', impactedForecasts: ['revenue'], isEditable: true, lastUpdatedAt: new Date().toISOString() },
            { id: 'a11', name: 'Cost Inflation', category: 'inflation', value: 5, unit: 'percentage', impactedForecasts: ['cost'], isEditable: true, lastUpdatedAt: new Date().toISOString() },
            { id: 'a12', name: 'Collection Days', category: 'payment', value: 60, unit: 'days', impactedForecasts: ['cash'], isEditable: true, lastUpdatedAt: new Date().toISOString() },
        ],
        revenueVsBase: -320000,
        costVsBase: 85000,
        cashVsBase: -250000,
        netVsBase: -405000,
        isLocked: false,
        isActive: false,
        createdAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
    },
];

const generateDemoAlerts = (): ForecastAlert[] => [
    {
        id: 'alert-1',
        type: 'revenue_shortfall',
        severity: 'high',
        title: 'At-Risk Revenue Warning',
        message: '€595K in revenue flagged as at-risk for Q1. Review renewal pipeline.',
        forecastType: 'revenue',
        threshold: 500000,
        currentValue: 595000,
        isRead: false,
        isDismissed: false,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'alert-2',
        type: 'cost_overrun',
        severity: 'medium',
        title: 'Marketing Budget Overrun',
        message: 'Marketing forecast exceeds budget by €15K due to unplanned conference sponsorship.',
        forecastType: 'cost',
        lineItemId: 'cost-3',
        threshold: 180000,
        currentValue: 200000,
        isRead: false,
        isDismissed: false,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'alert-3',
        type: 'confidence_low',
        severity: 'medium',
        title: 'Low Confidence Items',
        message: '3 forecast line items have confidence scores below 60%. Review assumptions.',
        forecastType: 'all',
        isRead: true,
        isDismissed: false,
        createdAt: new Date().toISOString(),
    },
];

const generateDemoVarianceData = (): ForecastActualComparison[] => [
    {
        periodId: 'prev-1',
        periodLabel: 'Dec 2024',
        revenueForecast: 720000,
        revenueActual: 695000,
        revenueVariance: {
            forecasted: 720000,
            actual: 695000,
            absoluteVariance: -25000,
            percentageVariance: -3.5,
            attribution: [
                { driver: 'timing', amount: -15000, percentage: 60, description: 'Delayed contract signing' },
                { driver: 'volume', amount: -10000, percentage: 40, description: 'Lower usage than expected' },
            ],
        },
        costForecast: 540000,
        costActual: 555000,
        costVariance: {
            forecasted: 540000,
            actual: 555000,
            absoluteVariance: 15000,
            percentageVariance: 2.8,
            attribution: [
                { driver: 'price', amount: 10000, percentage: 67, description: 'Vendor price increase' },
                { driver: 'volume', amount: 5000, percentage: 33, description: 'Higher cloud usage' },
            ],
        },
        cashForecast: 2400000,
        cashActual: 2500000,
        cashVariance: {
            forecasted: 2400000,
            actual: 2500000,
            absoluteVariance: 100000,
            percentageVariance: 4.2,
            attribution: [
                { driver: 'timing', amount: 100000, percentage: 100, description: 'Early customer payments' },
            ],
        },
        netForecast: 180000,
        netActual: 140000,
        netVariance: {
            forecasted: 180000,
            actual: 140000,
            absoluteVariance: -40000,
            percentageVariance: -22.2,
            attribution: [
                { driver: 'volume', amount: -25000, percentage: 63 },
                { driver: 'price', amount: -15000, percentage: 37 },
            ],
        },
        hasMaterialVariance: true,
        varianceThresholdBreached: true,
    },
];

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface ForecastState {
    // Data
    revenueForecast: RevenueForecast | null;
    costForecast: CostForecast | null;
    cashForecast: CashForecast | null;
    scenarios: ForecastScenario[];
    alerts: ForecastAlert[];
    varianceData: ForecastActualComparison[];
    accuracyTrend: ForecastAccuracyTrend[];
    
    // UI State
    activeTab: ForecastTab;
    viewPreferences: ForecastViewPreferences;
    filter: ForecastFilter;
    selectedLineItemId: string | null;
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;
    
    // API Actions
    fetchForecasts: () => Promise<void>;
    
    // Tab Navigation
    setActiveTab: (tab: ForecastTab) => void;
    
    // View Preferences
    setViewPreferences: (prefs: Partial<ForecastViewPreferences>) => void;
    setTimeHorizon: (horizon: TimeHorizon) => void;
    setGranularity: (granularity: TimeGranularity) => void;
    setActiveScenario: (scenarioId: string | null) => void;
    
    // Filters
    setFilter: (filter: Partial<ForecastFilter>) => void;
    resetFilter: () => void;
    
    // Selection
    setSelectedLineItem: (id: string | null) => void;
    
    // Alerts
    markAlertRead: (id: string) => void;
    dismissAlert: (id: string) => void;
    
    // Scenarios
    createScenario: (scenario: Omit<ForecastScenario, 'id' | 'createdAt' | 'lastUpdatedAt'>) => void;
    updateScenario: (id: string, updates: Partial<ForecastScenario>) => void;
    deleteScenario: (id: string) => void;
    lockScenario: (id: string) => void;
    
    // Assumptions
    updateAssumption: (scenarioId: string, assumptionId: string, value: number) => void;
    
    // Computed
    getSummary: () => ForecastSummary;
    getFilteredRevenueItems: () => RevenueLineItem[];
    getFilteredCostItems: () => CostLineItem[];
    getUnreadAlertCount: () => number;
    getActiveScenario: () => ForecastScenario | null;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useForecastStore = create<ForecastState>()(
    persist(
        (set, get) => ({
            // Initial Data
            revenueForecast: generateDemoRevenueForecast(),
            costForecast: generateDemoCostForecast(),
            cashForecast: generateDemoCashForecast(),
            scenarios: generateDemoScenarios(),
            alerts: generateDemoAlerts(),
            varianceData: generateDemoVarianceData(),
            accuracyTrend: [],
            
            // UI State
            activeTab: 'overview',
            viewPreferences: initialViewPreferences,
            filter: initialFilter,
            selectedLineItemId: null,
            isLoading: false,
            error: null,
            isInitialized: true,
            
            // API Actions
            fetchForecasts: async () => {
                set({ isLoading: true, error: null });
                try {
                    // API call would go here
                    // For now, use demo data
                    set({ isInitialized: true });
                } catch (error) {
                    console.error('Failed to fetch forecasts:', error);
                } finally {
                    set({ isLoading: false });
                }
            },
            
            // Tab Navigation
            setActiveTab: (tab) => set({ activeTab: tab }),
            
            // View Preferences
            setViewPreferences: (prefs) => set((state) => ({
                viewPreferences: { ...state.viewPreferences, ...prefs },
            })),
            
            setTimeHorizon: (horizon) => set((state) => ({
                viewPreferences: { ...state.viewPreferences, timeHorizon: horizon },
            })),
            
            setGranularity: (granularity) => set((state) => ({
                viewPreferences: { ...state.viewPreferences, granularity },
            })),
            
            setActiveScenario: (scenarioId) => set((state) => ({
                viewPreferences: { ...state.viewPreferences, activeScenarioId: scenarioId },
            })),
            
            // Filters
            setFilter: (filter) => set((state) => ({
                filter: { ...state.filter, ...filter },
            })),
            
            resetFilter: () => set({ filter: initialFilter }),
            
            // Selection
            setSelectedLineItem: (id) => set({ selectedLineItemId: id }),
            
            // Alerts
            markAlertRead: (id) => set((state) => ({
                alerts: state.alerts.map((a) => a.id === id ? { ...a, isRead: true } : a),
            })),
            
            dismissAlert: (id) => set((state) => ({
                alerts: state.alerts.map((a) => a.id === id ? { ...a, isDismissed: true } : a),
            })),
            
            // Scenarios
            createScenario: (scenario) => {
                const newScenario: ForecastScenario = {
                    ...scenario,
                    id: `scenario-${Date.now()}`,
                    createdAt: new Date().toISOString(),
                    lastUpdatedAt: new Date().toISOString(),
                };
                set((state) => ({
                    scenarios: [...state.scenarios, newScenario],
                }));
            },
            
            updateScenario: (id, updates) => set((state) => ({
                scenarios: state.scenarios.map((s) =>
                    s.id === id ? { ...s, ...updates, lastUpdatedAt: new Date().toISOString() } : s
                ),
            })),
            
            deleteScenario: (id) => set((state) => ({
                scenarios: state.scenarios.filter((s) => s.id !== id),
            })),
            
            lockScenario: (id) => set((state) => ({
                scenarios: state.scenarios.map((s) =>
                    s.id === id ? { ...s, isLocked: true, lastUpdatedAt: new Date().toISOString() } : s
                ),
            })),
            
            // Assumptions
            updateAssumption: (scenarioId, assumptionId, value) => set((state) => ({
                scenarios: state.scenarios.map((s) => {
                    if (s.id !== scenarioId) return s;
                    return {
                        ...s,
                        assumptions: s.assumptions.map((a) =>
                            a.id === assumptionId ? { ...a, value, lastUpdatedAt: new Date().toISOString() } : a
                        ),
                        lastUpdatedAt: new Date().toISOString(),
                    };
                }),
            })),
            
            // Computed - Summary
            getSummary: (): ForecastSummary => {
                const { revenueForecast, costForecast, cashForecast, alerts } = get();
                
                const totalRevenue: ForecastValue = {
                    expected: revenueForecast?.totalExpected || 0,
                    bestCase: revenueForecast?.totalBestCase || 0,
                    worstCase: revenueForecast?.totalWorstCase || 0,
                    confidence: revenueForecast?.confidence || 'medium',
                    confidenceScore: 75,
                };
                
                const totalCosts: ForecastValue = {
                    expected: costForecast?.totalExpected || 0,
                    bestCase: costForecast?.totalBestCase || 0,
                    worstCase: costForecast?.totalWorstCase || 0,
                    confidence: costForecast?.confidence || 'medium',
                    confidenceScore: 78,
                };
                
                const projectedCash: ForecastValue = {
                    expected: cashForecast?.periods[cashForecast.periods.length - 1]?.closingBalance || 0,
                    bestCase: (cashForecast?.periods[cashForecast.periods.length - 1]?.closingBalance || 0) * 1.1,
                    worstCase: (cashForecast?.periods[cashForecast.periods.length - 1]?.closingBalance || 0) * 0.85,
                    confidence: cashForecast?.confidence || 'medium',
                    confidenceScore: 72,
                };
                
                const netExpected = totalRevenue.expected - totalCosts.expected;
                const netPosition: ForecastValue = {
                    expected: netExpected,
                    bestCase: totalRevenue.bestCase - totalCosts.bestCase,
                    worstCase: totalRevenue.worstCase - totalCosts.worstCase,
                    confidence: 'medium',
                    confidenceScore: 70,
                };
                
                return {
                    totalRevenue,
                    revenueGrowthRate: 8.5,
                    committedRevenuePercent: revenueForecast ? (revenueForecast.committedRevenue / revenueForecast.totalExpected) * 100 : 0,
                    atRiskRevenuePercent: revenueForecast ? (revenueForecast.atRiskRevenue / revenueForecast.totalExpected) * 100 : 0,
                    totalCosts,
                    costGrowthRate: 5.2,
                    fixedCostsPercent: 65,
                    variableCostsPercent: 35,
                    currentCash: cashForecast?.currentCashBalance || 0,
                    projectedCash,
                    cashRunwayDays: cashForecast?.minimumCashRunway || 0,
                    netPosition,
                    profitMargin: totalRevenue.expected > 0 ? (netExpected / totalRevenue.expected) * 100 : 0,
                    overallConfidence: 'medium',
                    overallConfidenceScore: 73,
                    dataFreshness: 'fresh',
                    lastUpdatedAt: revenueForecast?.lastUpdatedAt || new Date().toISOString(),
                    dataCompleteness: 92,
                    alertCount: alerts.filter((a) => !a.isDismissed).length,
                    criticalAlertCount: alerts.filter((a) => !a.isDismissed && a.severity === 'critical').length,
                };
            },
            
            // Computed - Filtered Items
            getFilteredRevenueItems: (): RevenueLineItem[] => {
                const { revenueForecast, filter } = get();
                if (!revenueForecast) return [];
                
                let items = [...revenueForecast.lineItems];
                
                if (filter.segment?.length) {
                    items = items.filter((i) => i.segment && filter.segment!.includes(i.segment));
                }
                if (filter.region?.length) {
                    items = items.filter((i) => i.region && filter.region!.includes(i.region));
                }
                if (filter.revenueType?.length) {
                    items = items.filter((i) => filter.revenueType!.includes(i.type));
                }
                if (filter.confidenceLevel?.length) {
                    items = items.filter((i) => filter.confidenceLevel!.includes(i.confidence));
                }
                if (filter.showAtRisk) {
                    items = items.filter((i) => i.isAtRisk);
                }
                if (filter.searchQuery) {
                    const q = filter.searchQuery.toLowerCase();
                    items = items.filter((i) =>
                        i.name.toLowerCase().includes(q) ||
                        i.customerName?.toLowerCase().includes(q)
                    );
                }
                
                return items;
            },
            
            getFilteredCostItems: (): CostLineItem[] => {
                const { costForecast, filter } = get();
                if (!costForecast) return [];
                
                let items = [...costForecast.lineItems];
                
                if (filter.department?.length) {
                    items = items.filter((i) => i.department && filter.department!.includes(i.department));
                }
                if (filter.category?.length) {
                    items = items.filter((i) => filter.category!.includes(i.category));
                }
                if (filter.vendor?.length) {
                    items = items.filter((i) => i.vendorName && filter.vendor!.includes(i.vendorName));
                }
                if (filter.confidenceLevel?.length) {
                    items = items.filter((i) => filter.confidenceLevel!.includes(i.confidence));
                }
                if (filter.showOverruns) {
                    items = items.filter((i) => i.isOverrun);
                }
                if (filter.searchQuery) {
                    const q = filter.searchQuery.toLowerCase();
                    items = items.filter((i) =>
                        i.name.toLowerCase().includes(q) ||
                        i.vendorName?.toLowerCase().includes(q)
                    );
                }
                
                return items;
            },
            
            getUnreadAlertCount: (): number => {
                const { alerts } = get();
                return alerts.filter((a) => !a.isRead && !a.isDismissed).length;
            },
            
            getActiveScenario: (): ForecastScenario | null => {
                const { scenarios, viewPreferences } = get();
                if (!viewPreferences.activeScenarioId) {
                    return scenarios.find((s) => s.type === 'base') || null;
                }
                return scenarios.find((s) => s.id === viewPreferences.activeScenarioId) || null;
            },
        }),
        {
            name: 'primebalance-forecasts',
            partialize: (state) => ({
                viewPreferences: state.viewPreferences,
                filter: state.filter,
                activeTab: state.activeTab,
            }),
        }
    )
);