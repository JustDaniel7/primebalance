import { create } from 'zustand';
import type {
    InvestorDashboard,
    ReportingPeriod,
    AccessLog,
    FinancialMetric,
    DataQuality,
} from '@/types/investor';

// =============================================================================
// HELPER: Create Financial Metric
// =============================================================================

const createMetric = (
    value: number,
    currency: string = 'USD',
    period: ReportingPeriod = 'mtd',
    previousValue?: number,
    quality: DataQuality = 'complete'
): FinancialMetric => {
    const changePercent = previousValue ? ((value - previousValue) / previousValue) * 100 : undefined;
    return {
        value,
        currency,
        period,
        periodStart: '2024-01-01',
        periodEnd: '2024-12-31',
        previousValue,
        changePercent,
        changeDirection: changePercent ? (changePercent > 1 ? 'up' : changePercent < -1 ? 'down' : 'flat') : undefined,
        dataQuality: quality,
        lastUpdated: new Date().toISOString(),
    };
};

// =============================================================================
// DEMO DATA
// =============================================================================

const demoDashboard: InvestorDashboard = {
    organizationName: 'PrimeBalance Corp',
    reportingCurrency: 'USD',
    fiscalYearEnd: '12-31',
    lastDataRefresh: new Date().toISOString(),

    // Revenue Metrics
    revenue: {
        mtd: createMetric(847000, 'USD', 'mtd', 812000),
        qtd: createMetric(2541000, 'USD', 'qtd', 2389000),
        ytd: createMetric(9876000, 'USD', 'ytd', 8234000),
        ttm: createMetric(11234000, 'USD', 'ttm', 9876000),
        breakdown: [
            { category: 'Subscriptions', amount: 7654000, percentOfTotal: 68.1 },
            { category: 'Services', amount: 2345000, percentOfTotal: 20.9 },
            { category: 'Licensing', amount: 890000, percentOfTotal: 7.9 },
            { category: 'Other', amount: 345000, percentOfTotal: 3.1 },
        ],
    },

    // Cost Metrics
    costs: {
        totalCosts: createMetric(8234000, 'USD', 'ytd', 7123000),
        fixedCosts: createMetric(4567000, 'USD', 'ytd', 4234000),
        variableCosts: createMetric(3667000, 'USD', 'ytd', 2889000),
        fixedToVariableRatio: 1.25,
        costBreakdown: [
            { category: 'Personnel', amount: 4890000, percentOfTotal: 59.4, isFixed: true },
            { category: 'Infrastructure', amount: 1234000, percentOfTotal: 15.0, isFixed: true },
            { category: 'Marketing', amount: 890000, percentOfTotal: 10.8, isFixed: false },
            { category: 'Operations', amount: 678000, percentOfTotal: 8.2, isFixed: false },
            { category: 'R&D', amount: 345000, percentOfTotal: 4.2, isFixed: false },
            { category: 'Other', amount: 197000, percentOfTotal: 2.4, isFixed: false },
        ],
    },

    // Margin Metrics
    margins: {
        grossMargin: createMetric(6543000, 'USD', 'ytd', 5678000),
        grossMarginPercent: 66.2,
        contributionMargin: createMetric(4123000, 'USD', 'ytd', 3456000),
        contributionMarginPercent: 41.8,
        operatingMargin: createMetric(1642000, 'USD', 'ytd', 1111000),
        operatingMarginPercent: 16.6,
        ebitda: createMetric(2134000, 'USD', 'ytd', 1789000),
        ebitdaMarginPercent: 21.6,
        netMargin: createMetric(1234000, 'USD', 'ytd', 987000),
        netMarginPercent: 12.5,
    },

    // Cash Position
    cashPosition: {
        cashAndEquivalents: createMetric(4567000, 'USD', 'mtd', 4234000),
        restrictedCash: createMetric(234000, 'USD', 'mtd', 234000),
        totalCash: createMetric(4801000, 'USD', 'mtd', 4468000),
        bankAccounts: [
            { name: 'Operating Account', balance: 2345000, currency: 'USD', isRestricted: false },
            { name: 'Reserve Account', balance: 1890000, currency: 'USD', isRestricted: false },
            { name: 'EUR Account', balance: 332000, currency: 'EUR', isRestricted: false },
            { name: 'Escrow', balance: 234000, currency: 'USD', isRestricted: true },
        ],
    },

    // Liabilities
    liabilities: {
        shortTermLiabilities: createMetric(1234000, 'USD', 'mtd', 1156000),
        longTermLiabilities: createMetric(2345000, 'USD', 'mtd', 2345000),
        totalLiabilities: createMetric(3579000, 'USD', 'mtd', 3501000),
        currentRatio: 2.87,
        quickRatio: 2.45,
    },

    // Working Capital
    workingCapital: {
        currentAssets: createMetric(5678000, 'USD', 'mtd', 5234000),
        currentLiabilities: createMetric(1234000, 'USD', 'mtd', 1156000),
        netWorkingCapital: createMetric(4444000, 'USD', 'mtd', 4078000),
        workingCapitalRatio: 4.6,
        daysReceivablesOutstanding: 32,
        daysPayablesOutstanding: 45,
        cashConversionCycle: 28,
    },

    // Efficiency
    efficiency: {
        revenuePerEmployee: createMetric(247350, 'USD', 'ytd', 219267),
        costPerEmployee: createMetric(205850, 'USD', 'ytd', 189533),
        employeeCount: 40,
        burnEfficiency: 0.83,
        unitEconomics: {
            cac: 12500,
            ltv: 45000,
            ltvToCacRatio: 3.6,
            paybackPeriodMonths: 8,
        },
    },

    // Burn Metrics
    burn: {
        currentMonthlyBurn: createMetric(412000, 'USD', 'mtd', 398000),
        rollingAverage3Month: createMetric(405000, 'USD', 'mtd', 387000),
        rollingAverage6Month: createMetric(395000, 'USD', 'mtd', 378000),
        rollingAverage12Month: createMetric(385000, 'USD', 'mtd', 365000),
        burnTrend: 'up',
        burnTrendPercent: 3.5,
        monthlyBurnHistory: [
            { month: '2024-01', burn: 378000, revenue: 756000, netBurn: -378000 },
            { month: '2024-02', burn: 382000, revenue: 789000, netBurn: -407000 },
            { month: '2024-03', burn: 391000, revenue: 823000, netBurn: -432000 },
            { month: '2024-04', burn: 387000, revenue: 812000, netBurn: -425000 },
            { month: '2024-05', burn: 395000, revenue: 834000, netBurn: -439000 },
            { month: '2024-06', burn: 398000, revenue: 847000, netBurn: -449000 },
            { month: '2024-07', burn: 402000, revenue: 856000, netBurn: -454000 },
            { month: '2024-08', burn: 408000, revenue: 867000, netBurn: -459000 },
            { month: '2024-09', burn: 405000, revenue: 878000, netBurn: -473000 },
            { month: '2024-10', burn: 398000, revenue: 889000, netBurn: -491000 },
            { month: '2024-11', burn: 407000, revenue: 901000, netBurn: -494000 },
            { month: '2024-12', burn: 412000, revenue: 847000, netBurn: -435000 },
        ],
    },

    // Runway Analysis
    runway: {
        currentCash: 4567000,
        currency: 'USD',
        scenarios: [
            {
                type: 'conservative',
                assumptions: ['15% burn increase', 'No revenue growth', 'No additional funding'],
                monthlyBurnRate: 474000,
                runwayMonths: 9.6,
                runwayEndDate: '2025-10-15',
                confidenceLevel: 85,
            },
            {
                type: 'base',
                assumptions: ['Current burn rate maintained', '5% revenue growth', 'No additional funding'],
                monthlyBurnRate: 412000,
                runwayMonths: 11.1,
                runwayEndDate: '2025-12-01',
                confidenceLevel: 70,
            },
            {
                type: 'aggressive',
                assumptions: ['10% burn reduction', '15% revenue growth', 'No additional funding'],
                monthlyBurnRate: 371000,
                runwayMonths: 12.3,
                runwayEndDate: '2026-01-15',
                confidenceLevel: 50,
            },
        ],
        primaryScenario: 'base',
        dataInputs: ['Historical burn data (12 months)', 'Current cash balance', 'Revenue trends'],
        timeHorizon: '12 months forward',
        projectionBasis: 'historical',
        lastCalculated: new Date().toISOString(),
        warnings: ['Runway calculations assume no additional capital raise', 'Seasonal variations not fully accounted for'],
    },

    // Risk Indicators
    risks: {
        overallRiskLevel: 'moderate',
        liquidityRisk: 'low',
        concentrationRisks: [
            {
                type: 'customer',
                description: 'Top 3 customers represent significant revenue share',
                concentrationPercent: 42,
                riskLevel: 'elevated',
                topItems: [
                    { name: 'Enterprise Client A', percent: 18 },
                    { name: 'Enterprise Client B', percent: 14 },
                    { name: 'Enterprise Client C', percent: 10 },
                ],
            },
            {
                type: 'revenue',
                description: 'Subscription revenue dominance',
                concentrationPercent: 68,
                riskLevel: 'moderate',
                topItems: [
                    { name: 'Subscriptions', percent: 68 },
                    { name: 'Services', percent: 21 },
                ],
            },
            {
                type: 'currency',
                description: 'USD concentration',
                concentrationPercent: 89,
                riskLevel: 'low',
                topItems: [
                    { name: 'USD', percent: 89 },
                    { name: 'EUR', percent: 8 },
                    { name: 'Other', percent: 3 },
                ],
            },
        ],
        currencyExposure: [
            { currency: 'USD', exposure: 8765000, percentOfTotal: 89 },
            { currency: 'EUR', exposure: 789000, percentOfTotal: 8 },
            { currency: 'GBP', exposure: 295000, percentOfTotal: 3 },
        ],
    },

    // Compliance Signals
    compliance: {
        dataCompletenessPercent: 94,
        dataQuality: 'complete',
        reconciliationCoverage: 98,
        auditTrailAvailable: true,
        lastReconciliationDate: '2024-12-15',
        knownDataGaps: ['Q4 intercompany eliminations pending', 'Deferred revenue reconciliation in progress'],
        lastAuditDate: '2024-09-30',
        pendingReconciliations: 3,
    },

    // Board Summary
    boardSummary: {
        asOfDate: new Date().toISOString().split('T')[0],
        periodCovered: 'FY 2024 YTD',
        financialHealthStatus: 'stable',
        keyHighlights: [
            'Revenue growth of 19.9% YoY demonstrates strong market traction',
            'EBITDA margin improved to 21.6% from 18.2% prior year',
            'Cash position strengthened with 11.1 months runway (base case)',
            'Customer acquisition efficiency improved with LTV/CAC ratio of 3.6x',
        ],
        materialChanges: [
            {
                category: 'Revenue',
                description: 'YTD revenue exceeded prior year by $1.64M',
                impact: 'positive',
                magnitude: 'significant',
                changePercent: 19.9,
                previousValue: 8234000,
                currentValue: 9876000,
            },
            {
                category: 'Operating Margin',
                description: 'Operating margin expanded due to operational efficiencies',
                impact: 'positive',
                magnitude: 'moderate',
                changePercent: 47.8,
                previousValue: 1111000,
                currentValue: 1642000,
            },
            {
                category: 'Burn Rate',
                description: 'Monthly burn increased 3.5% due to headcount growth',
                impact: 'negative',
                magnitude: 'minor',
                changePercent: 3.5,
                previousValue: 398000,
                currentValue: 412000,
            },
        ],
        liquidityStatus: 'Company maintains adequate liquidity with current ratio of 2.87x and 11+ months cash runway under base case assumptions.',
        sustainabilityOutlook: 'Path to profitability visible with current trajectory. Positive unit economics (LTV/CAC 3.6x) support sustainable growth model.',
        riskFactors: [
            'Customer concentration: Top 3 customers represent 42% of revenue',
            'Burn rate trending upward (+3.5% QoQ)',
            'Economic uncertainty may impact enterprise sales cycles',
        ],
        dataLimitations: [
            'Q4 intercompany eliminations pending final review',
            'Deferred revenue recognition subject to ASC 606 interpretation',
        ],
        generatedAt: new Date().toISOString(),
    },

    // Meta
    dataQualityOverall: 'complete',
    disclaimers: [
        'This report is provided for informational purposes only and does not constitute investment, legal, or tax advice.',
        'Forward-looking statements involve risks and uncertainties. Actual results may differ materially.',
        'All financial data is unaudited unless otherwise specified.',
        'Past performance is not indicative of future results.',
    ],
};

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface InvestorState {
    dashboard: InvestorDashboard;
    accessLogs: AccessLog[];
    selectedPeriod: ReportingPeriod;
    isLoading: boolean;
    lastRefresh: string;

    // Actions (Read-only - no write operations)
    setSelectedPeriod: (period: ReportingPeriod) => void;
    refreshDashboard: () => Promise<void>;
    logAccess: (action: string, section: string) => void;
    getAccessLogs: () => AccessLog[];
    exportBoardSummary: () => string;
}

// =============================================================================
// STORE
// =============================================================================

export const useInvestorStore = create<InvestorState>((set, get) => ({
    dashboard: demoDashboard,
    accessLogs: [],
    selectedPeriod: 'ytd',
    isLoading: false,
    lastRefresh: new Date().toISOString(),

    setSelectedPeriod: (period) => {
        set({ selectedPeriod: period });
        get().logAccess('period_change', `Changed to ${period}`);
    },

    refreshDashboard: async () => {
        set({ isLoading: true });
        get().logAccess('refresh', 'Dashboard refresh initiated');

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        set({
            lastRefresh: new Date().toISOString(),
            isLoading: false,
        });
    },

    logAccess: (action, section) => {
        const log: AccessLog = {
            id: `log-${Date.now()}`,
            userId: 'current-user',
            userName: 'Board Member',
            userRole: 'investor',
            action,
            section,
            timestamp: new Date().toISOString(),
        };
        set((state) => ({
            accessLogs: [log, ...state.accessLogs].slice(0, 100), // Keep last 100 logs
        }));
    },

    getAccessLogs: () => get().accessLogs,

    exportBoardSummary: () => {
        const { boardSummary } = get().dashboard;
        get().logAccess('export', 'Board summary exported');
        return JSON.stringify(boardSummary, null, 2);
    },
}));