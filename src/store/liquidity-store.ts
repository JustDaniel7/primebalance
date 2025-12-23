import { create } from 'zustand';
import {
    type LiquidityDashboard,
    type CashflowTimeline,
    type TimelinePeriod,
    type CashflowItem,
    type LiquidityScenario,
    type ScenarioAssumptions,
    type LiquidityGap,
    type LiquidityRiskSignal,
    type LiquidityRiskSummary,
    type ConfidenceBand,
    type LiquidityAuditLog,
    type TimeBucket,
    type CashflowCategory,
    type ConfidenceStatus,
    type ScenarioType,
    type LiquidityRiskLevel,
    SCENARIO_TYPES,
} from '@/types/liquidity';

// =============================================================================
// HELPERS
// =============================================================================

const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const formatDate = (date: Date): string => date.toISOString().split('T')[0];

const generatePeriods = (
    startDate: Date,
    horizonDays: number,
    bucket: TimeBucket,
    openingBalance: number,
    items: CashflowItem[],
    minimumBuffer: number
): TimelinePeriod[] => {
    const periods: TimelinePeriod[] = [];
    let currentDate = new Date(startDate);
    const endDate = addDays(startDate, horizonDays);
    let runningBalance = openingBalance;
    let periodIndex = 0;

    while (currentDate < endDate) {
        let periodEnd: Date;
        let label: string;

        if (bucket === 'daily') {
            periodEnd = addDays(currentDate, 1);
            label = formatDate(currentDate);
        } else if (bucket === 'weekly') {
            periodEnd = addDays(currentDate, 7);
            label = `Week ${periodIndex + 1}`;
        } else {
            periodEnd = new Date(currentDate);
            periodEnd.setMonth(periodEnd.getMonth() + 1);
            label = currentDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        }

        // Filter items for this period
        const periodItems = items.filter((item) => {
            const itemDate = new Date(item.expectedDate);
            return itemDate >= currentDate && itemDate < periodEnd;
        });

        // Calculate totals
        const inflowsByCategory: Record<CashflowCategory, number> = {} as any;
        const outflowsByCategory: Record<CashflowCategory, number> = {} as any;
        let totalInflows = 0;
        let totalOutflows = 0;
        let confirmedInflows = 0, expectedInflows = 0, estimatedInflows = 0;
        let confirmedOutflows = 0, expectedOutflows = 0, estimatedOutflows = 0;

        periodItems.forEach((item) => {
            if (item.type === 'inflow') {
                totalInflows += item.amount;
                inflowsByCategory[item.category] = (inflowsByCategory[item.category] || 0) + item.amount;
                if (item.confidence === 'confirmed') confirmedInflows += item.amount;
                else if (item.confidence === 'expected') expectedInflows += item.amount;
                else estimatedInflows += item.amount;
            } else {
                totalOutflows += item.amount;
                outflowsByCategory[item.category] = (outflowsByCategory[item.category] || 0) + item.amount;
                if (item.confidence === 'confirmed') confirmedOutflows += item.amount;
                else if (item.confidence === 'expected') expectedOutflows += item.amount;
                else estimatedOutflows += item.amount;
            }
        });

        const netMovement = totalInflows - totalOutflows;
        const closingBalance = runningBalance + netMovement;
        const hasLiquidityGap = closingBalance < 0;
        const belowMinBuffer = closingBalance < minimumBuffer;

        periods.push({
            id: `period-${periodIndex}`,
            periodStart: formatDate(currentDate),
            periodEnd: formatDate(periodEnd),
            label,
            openingBalance: runningBalance,
            closingBalance,
            totalInflows,
            totalOutflows,
            netMovement,
            inflowsByCategory,
            outflowsByCategory,
            confirmedInflows,
            expectedInflows,
            estimatedInflows,
            confirmedOutflows,
            expectedOutflows,
            estimatedOutflows,
            isHistorical: currentDate < new Date(),
            hasLiquidityGap,
            gapAmount: hasLiquidityGap ? Math.abs(closingBalance) : undefined,
            belowMinBuffer,
            items: periodItems,
        });

        runningBalance = closingBalance;
        currentDate = periodEnd;
        periodIndex++;
    }

    return periods;
};

// =============================================================================
// DEMO DATA
// =============================================================================

const generateDemoCashflowItems = (): CashflowItem[] => {
    const items: CashflowItem[] = [];
    const today = new Date();

    // Confirmed receivables
    items.push(
        { id: 'cf-1', type: 'inflow', category: 'receivables', description: 'Invoice INV-2024-0891 - Acme Corp', amount: 125000, currency: 'USD', expectedDate: formatDate(addDays(today, 5)), confidence: 'confirmed', sourceType: 'invoice', sourceReference: 'INV-2024-0891', counterparty: 'Acme Corp', isRecurring: false, createdAt: new Date().toISOString() },
        { id: 'cf-2', type: 'inflow', category: 'receivables', description: 'Invoice INV-2024-0892 - TechStart', amount: 87500, currency: 'USD', expectedDate: formatDate(addDays(today, 12)), confidence: 'confirmed', sourceType: 'invoice', sourceReference: 'INV-2024-0892', counterparty: 'TechStart GmbH', isRecurring: false, createdAt: new Date().toISOString() },
        { id: 'cf-3', type: 'inflow', category: 'receivables', description: 'Invoice INV-2024-0893 - Global Industries', amount: 234000, currency: 'USD', expectedDate: formatDate(addDays(today, 18)), confidence: 'expected', sourceType: 'invoice', sourceReference: 'INV-2024-0893', counterparty: 'Global Industries', isRecurring: false, createdAt: new Date().toISOString() },
    );

    // Contractual income
    items.push(
        { id: 'cf-4', type: 'inflow', category: 'contractual_income', description: 'Monthly subscription revenue', amount: 456000, currency: 'USD', expectedDate: formatDate(addDays(today, 1)), confidence: 'confirmed', sourceType: 'contract', sourceReference: 'Subscription Billing', isRecurring: true, recurrencePattern: 'Monthly', createdAt: new Date().toISOString() },
        { id: 'cf-5', type: 'inflow', category: 'contractual_income', description: 'Quarterly license fees', amount: 180000, currency: 'USD', expectedDate: formatDate(addDays(today, 25)), confidence: 'expected', sourceType: 'contract', sourceReference: 'License Agreement', isRecurring: true, recurrencePattern: 'Quarterly', createdAt: new Date().toISOString() },
    );

    // Expected receivables
    items.push(
        { id: 'cf-6', type: 'inflow', category: 'receivables', description: 'Expected payment - NewCo deal', amount: 150000, currency: 'USD', expectedDate: formatDate(addDays(today, 35)), confidence: 'expected', sourceType: 'estimate', counterparty: 'NewCo Inc', isRecurring: false, createdAt: new Date().toISOString() },
        { id: 'cf-7', type: 'inflow', category: 'receivables', description: 'Estimated Q1 collections', amount: 320000, currency: 'USD', expectedDate: formatDate(addDays(today, 45)), confidence: 'estimated', sourceType: 'estimate', isRecurring: false, createdAt: new Date().toISOString() },
    );

    // Payroll
    items.push(
        { id: 'cf-10', type: 'outflow', category: 'payroll', description: 'Bi-weekly payroll', amount: 245000, currency: 'USD', expectedDate: formatDate(addDays(today, 3)), confidence: 'confirmed', sourceType: 'schedule', sourceReference: 'Payroll Schedule', isRecurring: true, recurrencePattern: 'Bi-weekly', createdAt: new Date().toISOString() },
        { id: 'cf-11', type: 'outflow', category: 'payroll', description: 'Bi-weekly payroll', amount: 245000, currency: 'USD', expectedDate: formatDate(addDays(today, 17)), confidence: 'confirmed', sourceType: 'schedule', sourceReference: 'Payroll Schedule', isRecurring: true, recurrencePattern: 'Bi-weekly', createdAt: new Date().toISOString() },
        { id: 'cf-12', type: 'outflow', category: 'payroll', description: 'Bi-weekly payroll', amount: 245000, currency: 'USD', expectedDate: formatDate(addDays(today, 31)), confidence: 'expected', sourceType: 'schedule', isRecurring: true, recurrencePattern: 'Bi-weekly', createdAt: new Date().toISOString() },
    );

    // Payables
    items.push(
        { id: 'cf-13', type: 'outflow', category: 'payables', description: 'Vendor payment - Cloud Services', amount: 89000, currency: 'USD', expectedDate: formatDate(addDays(today, 7)), confidence: 'confirmed', sourceType: 'invoice', sourceReference: 'AWS-DEC-2024', counterparty: 'AWS', isRecurring: true, createdAt: new Date().toISOString() },
        { id: 'cf-14', type: 'outflow', category: 'payables', description: 'Vendor payment - Software licenses', amount: 45000, currency: 'USD', expectedDate: formatDate(addDays(today, 10)), confidence: 'confirmed', sourceType: 'invoice', counterparty: 'Microsoft', isRecurring: false, createdAt: new Date().toISOString() },
        { id: 'cf-15', type: 'outflow', category: 'payables', description: 'Office rent', amount: 78000, currency: 'USD', expectedDate: formatDate(addDays(today, 1)), confidence: 'confirmed', sourceType: 'contract', counterparty: 'Property Management', isRecurring: true, recurrencePattern: 'Monthly', createdAt: new Date().toISOString() },
    );

    // Taxes
    items.push(
        { id: 'cf-16', type: 'outflow', category: 'taxes', description: 'Quarterly tax payment (estimated)', amount: 156000, currency: 'USD', expectedDate: formatDate(addDays(today, 15)), confidence: 'expected', sourceType: 'estimate', sourceReference: 'Q4 Tax Estimate', isRecurring: true, recurrencePattern: 'Quarterly', createdAt: new Date().toISOString() },
    );

    // Debt service
    items.push(
        { id: 'cf-17', type: 'outflow', category: 'debt_service', description: 'Term loan payment', amount: 125000, currency: 'USD', expectedDate: formatDate(addDays(today, 20)), confidence: 'confirmed', sourceType: 'contract', sourceReference: 'Loan Agreement', counterparty: 'First National Bank', isRecurring: true, recurrencePattern: 'Monthly', createdAt: new Date().toISOString() },
    );

    // Operating expenses
    items.push(
        { id: 'cf-18', type: 'outflow', category: 'operating_expenses', description: 'Insurance premium', amount: 34000, currency: 'USD', expectedDate: formatDate(addDays(today, 8)), confidence: 'confirmed', sourceType: 'contract', isRecurring: true, recurrencePattern: 'Monthly', createdAt: new Date().toISOString() },
        { id: 'cf-19', type: 'outflow', category: 'operating_expenses', description: 'Marketing spend', amount: 65000, currency: 'USD', expectedDate: formatDate(addDays(today, 12)), confidence: 'expected', sourceType: 'estimate', isRecurring: true, createdAt: new Date().toISOString() },
        { id: 'cf-20', type: 'outflow', category: 'operating_expenses', description: 'Professional services', amount: 42000, currency: 'USD', expectedDate: formatDate(addDays(today, 22)), confidence: 'expected', sourceType: 'estimate', isRecurring: false, createdAt: new Date().toISOString() },
    );

    // One-off outflows
    items.push(
        { id: 'cf-21', type: 'outflow', category: 'one_off_outflow', description: 'Equipment purchase', amount: 89000, currency: 'USD', expectedDate: formatDate(addDays(today, 28)), confidence: 'expected', sourceType: 'manual', isRecurring: false, createdAt: new Date().toISOString() },
    );

    // Future periods
    items.push(
        { id: 'cf-22', type: 'inflow', category: 'contractual_income', description: 'Monthly subscription revenue', amount: 468000, currency: 'USD', expectedDate: formatDate(addDays(today, 32)), confidence: 'expected', sourceType: 'contract', isRecurring: true, createdAt: new Date().toISOString() },
        { id: 'cf-23', type: 'outflow', category: 'payroll', description: 'Bi-weekly payroll', amount: 248000, currency: 'USD', expectedDate: formatDate(addDays(today, 45)), confidence: 'estimated', sourceType: 'schedule', isRecurring: true, createdAt: new Date().toISOString() },
        { id: 'cf-24', type: 'outflow', category: 'operating_expenses', description: 'Estimated monthly OpEx', amount: 180000, currency: 'USD', expectedDate: formatDate(addDays(today, 40)), confidence: 'estimated', sourceType: 'estimate', isRecurring: true, createdAt: new Date().toISOString() },
    );

    return items;
};

const createScenario = (
    type: ScenarioType,
    items: CashflowItem[],
    openingBalance: number,
    minimumBuffer: number,
    assumptions: ScenarioAssumptions
): LiquidityScenario => {
    // Adjust items based on assumptions
    const adjustedItems = items.map((item) => {
        let adjustedAmount = item.amount;
        let adjustedDate = new Date(item.expectedDate);

        // Skip confirmed-only filter if not set
        if (assumptions.confirmedOnly && item.confidence !== 'confirmed') {
            return null;
        }
        if (assumptions.excludeEstimated && item.confidence === 'estimated') {
            return null;
        }

        if (item.type === 'inflow') {
            // Delay inflows
            adjustedDate = addDays(adjustedDate, assumptions.inflowDelayDays);
            // Reduce inflows
            adjustedAmount = adjustedAmount * (1 - assumptions.inflowReductionPercent / 100);
        } else {
            // Accelerate outflows
            adjustedDate = addDays(adjustedDate, -assumptions.outflowAccelerationDays);
            // Increase outflows
            adjustedAmount = adjustedAmount * (1 + assumptions.outflowIncreasePercent / 100);
        }

        // Apply custom adjustments
        if (assumptions.customAdjustments) {
            const customAdj = assumptions.customAdjustments.find((a) => a.category === item.category);
            if (customAdj) {
                adjustedAmount = adjustedAmount * (1 + customAdj.adjustmentPercent / 100);
            }
        }

        return {
            ...item,
            amount: adjustedAmount,
            expectedDate: formatDate(adjustedDate),
        };
    }).filter(Boolean) as CashflowItem[];

    const periods = generatePeriods(new Date(), 90, 'weekly', openingBalance, adjustedItems, minimumBuffer);

    const totalInflows = periods.reduce((sum, p) => sum + p.totalInflows, 0);
    const totalOutflows = periods.reduce((sum, p) => sum + p.totalOutflows, 0);
    const lowestBalancePeriod = periods.reduce((min, p) => p.closingBalance < min.closingBalance ? p : min, periods[0]);
    const gapPeriods = periods.filter((p) => p.hasLiquidityGap);

    const timeline: CashflowTimeline = {
        id: `timeline-${type}`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Case`,
        baseCurrency: 'USD',
        timeBucket: 'weekly',
        horizonDays: 90,
        currentCashBalance: openingBalance,
        minimumBuffer,
        periods,
        totalInflows,
        totalOutflows,
        netChange: totalInflows - totalOutflows,
        endingBalance: periods[periods.length - 1]?.closingBalance || openingBalance,
        lowestBalance: lowestBalancePeriod?.closingBalance || openingBalance,
        lowestBalanceDate: lowestBalancePeriod?.periodStart || formatDate(new Date()),
        daysWithGap: gapPeriods.length * 7, // Approximation for weekly buckets
        totalGapAmount: gapPeriods.reduce((sum, p) => sum + (p.gapAmount || 0), 0),
        confirmedCashflows: adjustedItems.filter((i) => i.confidence === 'confirmed').reduce((sum, i) => sum + i.amount, 0),
        expectedCashflows: adjustedItems.filter((i) => i.confidence === 'expected').reduce((sum, i) => sum + i.amount, 0),
        estimatedCashflows: adjustedItems.filter((i) => i.confidence === 'estimated').reduce((sum, i) => sum + i.amount, 0),
        dataCompleteness: 85,
        lastRefresh: new Date().toISOString(),
        dataAsOf: new Date().toISOString(),
    };

    const scenario: LiquidityScenario = {
        id: `scenario-${type}`,
        type,
        name: SCENARIO_TYPES.find((s) => s.value === type)?.label || type,
        description: SCENARIO_TYPES.find((s) => s.value === type)?.description || '',
        assumptions,
        timeline,
        isHypothetical: true,
        createdAt: new Date().toISOString(),
    };

    return scenario;
};

const demoItems = generateDemoCashflowItems();
const openingBalance = 2450000;
const minimumBuffer = 500000;

const baseAssumptions: ScenarioAssumptions = {
    inflowDelayDays: 0,
    inflowReductionPercent: 0,
    outflowAccelerationDays: 0,
    outflowIncreasePercent: 0,
    confirmedOnly: false,
    excludeEstimated: false,
};

const conservativeAssumptions: ScenarioAssumptions = {
    inflowDelayDays: 7,
    inflowReductionPercent: 10,
    outflowAccelerationDays: 3,
    outflowIncreasePercent: 5,
    confirmedOnly: false,
    excludeEstimated: false,
};

const stressAssumptions: ScenarioAssumptions = {
    inflowDelayDays: 14,
    inflowReductionPercent: 25,
    outflowAccelerationDays: 7,
    outflowIncreasePercent: 15,
    confirmedOnly: false,
    excludeEstimated: true,
};

const baseScenario = createScenario('base', demoItems, openingBalance, minimumBuffer, baseAssumptions);
const conservativeScenario = createScenario('conservative', demoItems, openingBalance, minimumBuffer, conservativeAssumptions);
const stressScenario = createScenario('stress', demoItems, openingBalance, minimumBuffer, stressAssumptions);

// Add variance vs base
conservativeScenario.varianceVsBase = {
    endingBalanceDiff: conservativeScenario.timeline.endingBalance - baseScenario.timeline.endingBalance,
    lowestBalanceDiff: conservativeScenario.timeline.lowestBalance - baseScenario.timeline.lowestBalance,
    additionalGapDays: conservativeScenario.timeline.daysWithGap - baseScenario.timeline.daysWithGap,
};

stressScenario.varianceVsBase = {
    endingBalanceDiff: stressScenario.timeline.endingBalance - baseScenario.timeline.endingBalance,
    lowestBalanceDiff: stressScenario.timeline.lowestBalance - baseScenario.timeline.lowestBalance,
    additionalGapDays: stressScenario.timeline.daysWithGap - baseScenario.timeline.daysWithGap,
};

const demoRiskSignals: LiquidityRiskSignal[] = [
    { id: 'rs-1', type: 'concentration', title: 'Inflow Concentration', description: 'Top 3 expected inflows represent 68% of total projected inflows', riskLevel: 'moderate', metric: 68, threshold: 50, breached: true, detectedAt: new Date().toISOString() },
    { id: 'rs-2', type: 'timing', title: 'Payroll Timing Mismatch', description: 'Large payroll outflows precede major inflow dates by 5-7 days', riskLevel: 'low', metric: 6, threshold: 10, breached: false, detectedAt: new Date().toISOString() },
    { id: 'rs-3', type: 'buffer', title: 'Buffer Adequacy', description: 'Minimum buffer covers 12 days of average outflows', riskLevel: 'low', metric: 12, threshold: 7, breached: false, detectedAt: new Date().toISOString() },
    { id: 'rs-4', type: 'dependency', title: 'Single Customer Dependency', description: 'Expected payment from Global Industries represents 15% of 30-day inflows', riskLevel: 'moderate', metric: 15, threshold: 20, breached: false, detectedAt: new Date().toISOString() },
];

const demoRiskSummary: LiquidityRiskSummary = {
    overallRisk: 'low',
    riskScore: 28,
    signals: demoRiskSignals,
    currentBuffer: openingBalance - minimumBuffer,
    bufferDays: 12,
    concentrationIndex: 0.42,
    volatilityIndex: 0.18,
    totalGaps: baseScenario.timeline.daysWithGap > 0 ? 1 : 0,
    upcomingGaps: 0,
    lastAssessed: new Date().toISOString(),
};

const demoConfidenceBands: ConfidenceBand[] = baseScenario.timeline.periods.slice(0, 12).map((period, index) => ({
    periodId: period.id,
    periodLabel: period.label,
    highEstimate: period.closingBalance * 1.15,
    baseEstimate: period.closingBalance,
    lowEstimate: period.closingBalance * 0.85,
    confidence: Math.max(95 - index * 5, 50),
    confirmedBalance: period.openingBalance + period.confirmedInflows - period.confirmedOutflows,
    expectedRange: [period.closingBalance * 0.9, period.closingBalance * 1.1],
    estimatedRange: [period.closingBalance * 0.8, period.closingBalance * 1.2],
}));

const demoDashboard: LiquidityDashboard = {
    organizationName: 'PrimeBalance Corp',
    baseCurrency: 'USD',
    lastRefresh: new Date().toISOString(),
    dataAsOf: new Date().toISOString(),
    currentCashBalance: openingBalance,
    minimumBuffer,
    availableLiquidity: openingBalance - minimumBuffer,
    baseScenario,
    conservativeScenario,
    stressScenario,
    customScenarios: [],
    riskSummary: demoRiskSummary,
    liquidityGaps: [],
    confidenceBands: demoConfidenceBands,
    dataCompleteness: 85,
    knownBlindSpots: [
        'Customer payment behavior may vary from historical patterns',
        'Estimated items beyond 60 days have higher uncertainty',
        'FX impact on foreign currency cashflows not modeled',
    ],
    disclaimers: [
        'Projections are informational only and do not guarantee outcomes.',
        'This module provides decision support, not treasury execution.',
        'All scenarios are hypothetical and based on stated assumptions.',
        'Human oversight and professional judgment remain essential.',
    ],
};

// =============================================================================
// STORE
// =============================================================================

interface LiquidityState {
    dashboard: LiquidityDashboard;
    cashflowItems: CashflowItem[];
    auditLogs: LiquidityAuditLog[];
    selectedScenario: ScenarioType;
    timeBucket: TimeBucket;
    horizonDays: number;
    isLoading: boolean;

    // Actions
    setSelectedScenario: (scenario: ScenarioType) => void;
    setTimeBucket: (bucket: TimeBucket) => void;
    setHorizonDays: (days: number) => void;
    refreshData: () => Promise<void>;

    // Getters
    getActiveTimeline: () => CashflowTimeline;
    getScenario: (type: ScenarioType) => LiquidityScenario | undefined;
    getItemsByCategory: (category: CashflowCategory) => CashflowItem[];
    getUpcomingItems: (days: number) => CashflowItem[];

    // Audit
    logAction: (action: LiquidityAuditLog['action'], details: string, extra?: Partial<LiquidityAuditLog>) => void;
}

export const useLiquidityStore = create<LiquidityState>((set, get) => ({
    dashboard: demoDashboard,
    cashflowItems: demoItems,
    auditLogs: [],
    selectedScenario: 'base',
    timeBucket: 'weekly',
    horizonDays: 90,
    isLoading: false,

    setSelectedScenario: (scenario) => {
        set({ selectedScenario: scenario });
        get().logAction('scenario_viewed', `Switched to ${scenario} scenario`);
    },

    setTimeBucket: (bucket) => {
        set({ timeBucket: bucket });
        get().logAction('view', `Changed time bucket to ${bucket}`);
    },

    setHorizonDays: (days) => {
        set({ horizonDays: days });
        get().logAction('view', `Changed horizon to ${days} days`);
    },

    refreshData: async () => {
        set({ isLoading: true });
        get().logAction('refresh', 'Dashboard data refresh initiated');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        set({ isLoading: false });
    },

    getActiveTimeline: () => {
        const { dashboard, selectedScenario } = get();
        switch (selectedScenario) {
            case 'conservative':
                return dashboard.conservativeScenario.timeline;
            case 'stress':
                return dashboard.stressScenario.timeline;
            default:
                return dashboard.baseScenario.timeline;
        }
    },

    getScenario: (type) => {
        const { dashboard } = get();
        switch (type) {
            case 'base':
                return dashboard.baseScenario;
            case 'conservative':
                return dashboard.conservativeScenario;
            case 'stress':
                return dashboard.stressScenario;
            default:
                return dashboard.customScenarios.find((s) => s.type === type);
        }
    },

    getItemsByCategory: (category) => {
        return get().cashflowItems.filter((item) => item.category === category);
    },

    getUpcomingItems: (days) => {
        const cutoff = addDays(new Date(), days);
        return get().cashflowItems.filter((item) => new Date(item.expectedDate) <= cutoff);
    },

    logAction: (action, details, extra = {}) => {
        const log: LiquidityAuditLog = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action,
            details,
            userName: 'Current User',
            userRole: 'Treasury',
            ...extra,
        };

        set((state) => ({
            auditLogs: [log, ...state.auditLogs].slice(0, 200),
        }));
    },
}));