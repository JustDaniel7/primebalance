import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    KPI,
    KPIDefinition,
    KPIValue,
    KPIHistoricalPoint,
    KPIThreshold,
    KPISummary,
    KPIAlert,
    KPIAlertType,
    KPIAlertSeverity,
    KPIExplanation,
    KPIMarginMetrics,
    MarginBreakdown,
    MarginDriver,
    BurnRunwayMetrics,
    BurnBreakdown,
    KPIRunwayScenario,
    CCCMetrics,
    CCCComponent,
    UnitEconomicsMetrics,
    CohortMetrics,
    UnitDistribution,
    TrendAnalysis,
    KPITab,
    KPIViewPreferences,
    KPIFilter,
    KPITimeHorizon,
    KPIStatus,
    KPITrendDirection,
    TrendMomentum,
    KPICategory,
} from '@/types/kpis';

// =============================================================================
// INITIAL STATES
// =============================================================================

const initialViewPreferences: KPIViewPreferences = {
    timeHorizon: 'quarter',
    showTargets: true,
    showBenchmarks: true,
    showTrends: true,
    compactView: false,
};

const initialFilter: KPIFilter = {};

// =============================================================================
// HELPERS
// =============================================================================

const generateTrend = (current: number, target: number | undefined, higherIsBetter: boolean): KPITrendDirection => {
    if (!target) return 'stable';
    const ratio = current / target;
    if (higherIsBetter) {
        return ratio >= 1.02 ? 'improving' : ratio <= 0.98 ? 'deteriorating' : 'stable';
    }
    return ratio <= 0.98 ? 'improving' : ratio >= 1.02 ? 'deteriorating' : 'stable';
};

const generateStatus = (current: number, target: number | undefined, higherIsBetter: boolean): KPIStatus => {
    if (!target) return 'on_track';
    const ratio = current / target;
    if (higherIsBetter) {
        return ratio >= 0.95 ? 'on_track' : ratio >= 0.85 ? 'watch' : 'off_track';
    }
    return ratio <= 1.05 ? 'on_track' : ratio <= 1.15 ? 'watch' : 'off_track';
};

const generateHistory = (baseValue: number, periods: number, volatility: number = 0.05): KPIHistoricalPoint[] => {
    const history: KPIHistoricalPoint[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    for (let i = periods - 1; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const variance = 1 + (Math.random() - 0.5) * volatility * 2;
        const trendFactor = 1 + (periods - i) * 0.01;
        history.push({
            period: `2024-${String(monthIndex + 1).padStart(2, '0')}`,
            periodLabel: months[monthIndex],
            value: Math.round(baseValue * variance * trendFactor * 100) / 100,
            target: baseValue,
        });
    }
    return history;
};

// =============================================================================
// DEMO DATA GENERATORS
// =============================================================================

const generateMarginMetrics = (): KPIMarginMetrics => ({
    grossMargin: {
        current: 68.5,
        previous: 66.2,
        target: 70,
        deltaVsPrior: 2.3,
        deltaVsPriorPercent: 3.5,
        deltaVsTarget: -1.5,
        deltaVsTargetPercent: -2.1,
        status: 'watch',
        trend: 'improving',
        momentum: 'accelerating',
    },
    contributionMargin: {
        current: 52.3,
        previous: 50.8,
        target: 55,
        deltaVsPrior: 1.5,
        deltaVsPriorPercent: 3.0,
        deltaVsTarget: -2.7,
        deltaVsTargetPercent: -4.9,
        status: 'watch',
        trend: 'improving',
        momentum: 'steady',
    },
    operatingMargin: {
        current: 18.2,
        previous: 16.5,
        target: 20,
        deltaVsPrior: 1.7,
        deltaVsPriorPercent: 10.3,
        deltaVsTarget: -1.8,
        deltaVsTargetPercent: -9.0,
        status: 'watch',
        trend: 'improving',
        momentum: 'accelerating',
    },
    ebitdaMargin: {
        current: 22.5,
        previous: 20.1,
        target: 25,
        deltaVsPrior: 2.4,
        deltaVsPriorPercent: 11.9,
        deltaVsTarget: -2.5,
        deltaVsTargetPercent: -10.0,
        status: 'watch',
        trend: 'improving',
        momentum: 'steady',
    },
    netMargin: {
        current: 12.8,
        previous: 11.2,
        target: 15,
        deltaVsPrior: 1.6,
        deltaVsPriorPercent: 14.3,
        deltaVsTarget: -2.2,
        deltaVsTargetPercent: -14.7,
        status: 'watch',
        trend: 'improving',
        momentum: 'steady',
    },
    byProduct: [
        { segment: 'SaaS Platform', segmentType: 'product', grossMargin: 78.5, contributionMargin: 62.3, operatingMargin: 28.5, revenue: 1450000, trend: 'improving' },
        { segment: 'Professional Services', segmentType: 'service', grossMargin: 45.2, contributionMargin: 32.1, operatingMargin: 8.5, revenue: 320000, trend: 'stable' },
        { segment: 'API Usage', segmentType: 'product', grossMargin: 82.1, contributionMargin: 71.5, operatingMargin: 35.2, revenue: 215000, trend: 'improving' },
        { segment: 'Support & Training', segmentType: 'service', grossMargin: 52.3, contributionMargin: 38.7, operatingMargin: 12.1, revenue: 95000, trend: 'deteriorating' },
    ],
    bySegment: [
        { segment: 'Enterprise', segmentType: 'customer', grossMargin: 72.5, contributionMargin: 58.2, operatingMargin: 24.5, revenue: 1250000, trend: 'improving' },
        { segment: 'Mid-Market', segmentType: 'customer', grossMargin: 65.8, contributionMargin: 48.5, operatingMargin: 15.2, revenue: 580000, trend: 'stable' },
        { segment: 'SMB', segmentType: 'customer', grossMargin: 58.2, contributionMargin: 42.1, operatingMargin: 8.5, revenue: 250000, trend: 'deteriorating' },
    ],
    byRegion: [
        { segment: 'EMEA', segmentType: 'region', grossMargin: 70.2, contributionMargin: 55.8, operatingMargin: 21.5, revenue: 1100000, trend: 'improving' },
        { segment: 'North America', segmentType: 'region', grossMargin: 68.5, contributionMargin: 52.3, operatingMargin: 18.2, revenue: 720000, trend: 'stable' },
        { segment: 'APAC', segmentType: 'region', grossMargin: 62.1, contributionMargin: 45.2, operatingMargin: 12.5, revenue: 260000, trend: 'improving' },
    ],
    marginDrivers: [
        { id: 'd1', name: 'Product Mix Shift', category: 'mix', impact: 1.2, impactPercent: 52, direction: 'positive', description: 'Higher SaaS revenue share' },
        { id: 'd2', name: 'Pricing Optimization', category: 'pricing', impact: 0.8, impactPercent: 35, direction: 'positive', description: 'Q1 price increases' },
        { id: 'd3', name: 'Discount Reduction', category: 'discounts', impact: 0.3, impactPercent: 13, direction: 'positive', description: 'Stricter discount controls' },
    ],
    hasErosionAlert: false,
    erosionThreshold: 5,
});

const generateBurnRunwayMetrics = (): BurnRunwayMetrics => ({
    netBurnMonthly: {
        current: 125000,
        previous: 142000,
        target: 100000,
        deltaVsPrior: -17000,
        deltaVsPriorPercent: -12.0,
        deltaVsTarget: 25000,
        deltaVsTargetPercent: 25.0,
        status: 'watch',
        trend: 'improving',
        momentum: 'steady',
    },
    netBurnRolling3M: 135000,
    netBurnRolling6M: 148000,
    grossBurn: 485000,
    burnBreakdown: [
        { category: 'operational', label: 'Payroll & Benefits', amount: 320000, percentOfTotal: 66, trend: 'stable' },
        { category: 'operational', label: 'Infrastructure', amount: 85000, percentOfTotal: 17.5, trend: 'improving' },
        { category: 'discretionary', label: 'Marketing', amount: 45000, percentOfTotal: 9.3, trend: 'deteriorating' },
        { category: 'one_time', label: 'Legal & Audit', amount: 35000, percentOfTotal: 7.2, trend: 'stable' },
    ],
    currentRunwayMonths: 20,
    currentRunwayDate: '2026-08-15',
    runwayScenarios: [
        { id: 'rs1', name: 'Current Trajectory', type: 'current', runwayMonths: 20, runwayDate: '2026-08-15', burnRate: 125000, assumptions: ['Current burn rate', 'No additional funding'] },
        { id: 'rs2', name: 'Stressed', type: 'stressed', runwayMonths: 14, runwayDate: '2026-02-28', burnRate: 175000, assumptions: ['20% revenue miss', 'Delayed collections'] },
        { id: 'rs3', name: 'Optimistic', type: 'optimistic', runwayMonths: 28, runwayDate: '2027-04-30', burnRate: 85000, assumptions: ['Revenue growth +15%', 'Cost optimization'] },
    ],
    currentCash: 2500000,
    burnAccelerating: false,
    runwayBelowThreshold: false,
    runwayThresholdMonths: 12,
    cliffDate: '2026-08-15',
    monthsToCliff: 20,
});

const generateCCCMetrics = (): CCCMetrics => ({
    dso: {
        current: 45,
        previous: 48,
        target: 40,
        deltaVsPrior: -3,
        deltaVsPriorPercent: -6.3,
        deltaVsTarget: 5,
        deltaVsTargetPercent: 12.5,
        status: 'watch',
        trend: 'improving',
        momentum: 'steady',
    },
    dpo: {
        current: 32,
        previous: 30,
        target: 35,
        deltaVsPrior: 2,
        deltaVsPriorPercent: 6.7,
        deltaVsTarget: -3,
        deltaVsTargetPercent: -8.6,
        status: 'watch',
        trend: 'improving',
        momentum: 'steady',
    },
    dio: {
        current: 28,
        previous: 25,
        target: 25,
        deltaVsPrior: 3,
        deltaVsPriorPercent: 12.0,
        deltaVsTarget: 3,
        deltaVsTargetPercent: 12.0,
        status: 'watch',
        trend: 'deteriorating',
        momentum: 'steady',
    },
    netCCC: {
        current: 41,
        previous: 43,
        target: 30,
        deltaVsPrior: -2,
        deltaVsPriorPercent: -4.7,
        deltaVsTarget: 11,
        deltaVsTargetPercent: 36.7,
        status: 'off_track',
        trend: 'improving',
        momentum: 'steady',
    },
    components: [
        { metric: 'dso', name: 'Days Sales Outstanding', value: 45, previousValue: 48, target: 40, benchmark: 42, trend: 'improving', drivers: ['Collections process', 'Customer payment terms', 'Invoice accuracy'] },
        { metric: 'dpo', name: 'Days Payables Outstanding', value: 32, previousValue: 30, target: 35, benchmark: 38, trend: 'improving', drivers: ['Vendor terms', 'Payment scheduling', 'Cash flow planning'] },
        { metric: 'dio', name: 'Days Inventory Outstanding', value: 28, previousValue: 25, target: 25, benchmark: 22, trend: 'deteriorating', drivers: ['Inventory turns', 'Supply chain', 'Demand forecasting'] },
    ],
    internalTarget: 30,
    industryBenchmark: 35,
    peerRangeMin: 28,
    peerRangeMax: 45,
    workingCapital: 850000,
    workingCapitalDays: 41,
    workingCapitalEfficiency: 'improving',
    hasDeteriorationAlert: true,
    deteriorationThreshold: 10,
});

const generateUnitEconomicsMetrics = (): UnitEconomicsMetrics => ({
    revenuePerUnit: {
        current: 2450,
        previous: 2320,
        target: 2500,
        deltaVsPrior: 130,
        deltaVsPriorPercent: 5.6,
        deltaVsTarget: -50,
        deltaVsTargetPercent: -2.0,
        status: 'on_track',
        trend: 'improving',
        momentum: 'steady',
    },
    variableCostPerUnit: {
        current: 780,
        previous: 820,
        target: 750,
        deltaVsPrior: -40,
        deltaVsPriorPercent: -4.9,
        deltaVsTarget: 30,
        deltaVsTargetPercent: 4.0,
        status: 'watch',
        trend: 'improving',
        momentum: 'steady',
    },
    contributionPerUnit: {
        current: 1670,
        previous: 1500,
        target: 1750,
        deltaVsPrior: 170,
        deltaVsPriorPercent: 11.3,
        deltaVsTarget: -80,
        deltaVsTargetPercent: -4.6,
        status: 'on_track',
        trend: 'improving',
        momentum: 'accelerating',
    },
    marginPerUnit: {
        current: 68.2,
        previous: 64.7,
        target: 70,
        deltaVsPrior: 3.5,
        deltaVsPriorPercent: 5.4,
        deltaVsTarget: -1.8,
        deltaVsTargetPercent: -2.6,
        status: 'on_track',
        trend: 'improving',
        momentum: 'steady',
    },
    cac: {
        current: 3200,
        previous: 3500,
        target: 3000,
        deltaVsPrior: -300,
        deltaVsPriorPercent: -8.6,
        deltaVsTarget: 200,
        deltaVsTargetPercent: 6.7,
        status: 'watch',
        trend: 'improving',
        momentum: 'steady',
    },
    ltv: {
        current: 28500,
        previous: 26000,
        target: 30000,
        deltaVsPrior: 2500,
        deltaVsPriorPercent: 9.6,
        deltaVsTarget: -1500,
        deltaVsTargetPercent: -5.0,
        status: 'on_track',
        trend: 'improving',
        momentum: 'accelerating',
    },
    ltvCacRatio: {
        current: 8.9,
        previous: 7.4,
        target: 10,
        deltaVsPrior: 1.5,
        deltaVsPriorPercent: 20.3,
        deltaVsTarget: -1.1,
        deltaVsTargetPercent: -11.0,
        status: 'on_track',
        trend: 'improving',
        momentum: 'accelerating',
    },
    paybackPeriod: {
        current: 14,
        previous: 16,
        target: 12,
        deltaVsPrior: -2,
        deltaVsPriorPercent: -12.5,
        deltaVsTarget: 2,
        deltaVsTargetPercent: 16.7,
        status: 'watch',
        trend: 'improving',
        momentum: 'steady',
    },
    cohorts: [
        { cohortId: 'c1', cohortName: 'Q4 2023', cohortDate: '2023-10-01', cac: 3100, ltv: 29500, ltvCacRatio: 9.5, paybackMonths: 13, isUnprofitable: false, trend: 'stable' },
        { cohortId: 'c2', cohortName: 'Q1 2024', cohortDate: '2024-01-01', cac: 3400, ltv: 27800, ltvCacRatio: 8.2, paybackMonths: 15, isUnprofitable: false, trend: 'improving' },
        { cohortId: 'c3', cohortName: 'Q2 2024', cohortDate: '2024-04-01', cac: 3200, ltv: 28500, ltvCacRatio: 8.9, paybackMonths: 14, isUnprofitable: false, trend: 'improving' },
        { cohortId: 'c4', cohortName: 'Q3 2024 (Partial)', cohortDate: '2024-07-01', cac: 2900, ltv: 25000, ltvCacRatio: 8.6, paybackMonths: 14, isUnprofitable: false, trend: 'improving' },
    ],
    distributions: [
        { metric: 'Revenue per Unit', average: 2450, median: 2200, p25: 1500, p75: 3200, p10: 800, p90: 4500, min: 200, max: 12000 },
        { metric: 'Contribution per Unit', average: 1670, median: 1500, p25: 900, p75: 2300, p10: 400, p90: 3200, min: -200, max: 8500 },
    ],
    unprofitableUnits: 12,
    unprofitablePercent: 3.2,
    unprofitableSegments: ['SMB Trial', 'Free Tier Heavy Users'],
    breakEvenPrice: 780,
    breakEvenVolume: 145,
});

const generateDemoAlerts = (): KPIAlert[] => [
    {
        id: 'alert-1',
        type: 'ccc_deterioration',
        severity: 'warning',
        kpiId: 'net-ccc',
        kpiName: 'Cash Conversion Cycle',
        title: 'CCC Above Target',
        message: 'Cash conversion cycle is 11 days above target (41 vs 30 days). Consider reviewing collection processes.',
        currentValue: 41,
        threshold: 30,
        triggeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isRead: false,
        isDismissed: false,
        suggestedAction: 'Review AR aging report and follow up on overdue invoices',
    },
    {
        id: 'alert-2',
        type: 'margin_compression',
        severity: 'info',
        kpiId: 'operating-margin',
        kpiName: 'Operating Margin',
        title: 'Margin Below Target',
        message: 'Operating margin at 18.2% is 1.8 points below 20% target, but trending positively.',
        currentValue: 18.2,
        threshold: 20,
        triggeredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        isRead: true,
        isDismissed: false,
        suggestedAction: 'Continue cost optimization initiatives',
    },
    {
        id: 'alert-3',
        type: 'unit_economics_negative',
        severity: 'warning',
        kpiId: 'unprofitable-units',
        kpiName: 'Unprofitable Units',
        title: 'Unprofitable Segments Detected',
        message: '3.2% of units (12 total) are contribution-negative. SMB Trial segment requires review.',
        currentValue: 12,
        triggeredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        isRead: false,
        isDismissed: false,
        suggestedAction: 'Evaluate pricing or sunset unprofitable segments',
    },
];

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface KPIState {
    // Data
    marginMetrics: KPIMarginMetrics;
    burnRunwayMetrics: BurnRunwayMetrics;
    cccMetrics: CCCMetrics;
    unitEconomicsMetrics: UnitEconomicsMetrics;
    alerts: KPIAlert[];
    
    // UI State
    activeTab: KPITab;
    viewPreferences: KPIViewPreferences;
    filter: KPIFilter;
    selectedKPIId: string | null;
    isLoading: boolean;
    error: string | null;
    
    // Actions
    fetchKPIs: () => Promise<void>;
    setActiveTab: (tab: KPITab) => void;
    setViewPreferences: (prefs: Partial<KPIViewPreferences>) => void;
    setTimeHorizon: (horizon: KPITimeHorizon) => void;
    setFilter: (filter: Partial<KPIFilter>) => void;
    resetFilter: () => void;
    selectKPI: (id: string | null) => void;
    
    // Alerts
    markAlertRead: (id: string) => void;
    dismissAlert: (id: string) => void;
    
    // Computed
    getSummary: () => KPISummary;
    getExplanation: (kpiId: string) => KPIExplanation;
    getTrendAnalysis: (kpiId: string) => TrendAnalysis;
    getActiveAlerts: () => KPIAlert[];
    getMarginHistory: (margin: 'gross' | 'contribution' | 'operating') => KPIHistoricalPoint[];
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useKPIStore = create<KPIState>()(
    persist(
        (set, get) => ({
            // Initial Data
            marginMetrics: generateMarginMetrics(),
            burnRunwayMetrics: generateBurnRunwayMetrics(),
            cccMetrics: generateCCCMetrics(),
            unitEconomicsMetrics: generateUnitEconomicsMetrics(),
            alerts: generateDemoAlerts(),
            
            // UI State
            activeTab: 'overview',
            viewPreferences: initialViewPreferences,
            filter: initialFilter,
            selectedKPIId: null,
            isLoading: false,
            error: null,
            
            // Actions
            fetchKPIs: async () => {
                set({ isLoading: true });
                // API call would go here
                set({ isLoading: false });
            },
            
            setActiveTab: (tab) => set({ activeTab: tab }),
            
            setViewPreferences: (prefs) => set((state) => ({
                viewPreferences: { ...state.viewPreferences, ...prefs },
            })),
            
            setTimeHorizon: (horizon) => set((state) => ({
                viewPreferences: { ...state.viewPreferences, timeHorizon: horizon },
            })),
            
            setFilter: (filter) => set((state) => ({
                filter: { ...state.filter, ...filter },
            })),
            
            resetFilter: () => set({ filter: initialFilter }),
            
            selectKPI: (id) => set({ selectedKPIId: id }),
            
            // Alerts
            markAlertRead: (id) => set((state) => ({
                alerts: state.alerts.map((a) => a.id === id ? { ...a, isRead: true } : a),
            })),
            
            dismissAlert: (id) => set((state) => ({
                alerts: state.alerts.map((a) => a.id === id ? { ...a, isDismissed: true } : a),
            })),
            
            // Computed
            getSummary: (): KPISummary => {
                const { marginMetrics, burnRunwayMetrics, cccMetrics, unitEconomicsMetrics, alerts } = get();
                
                const allStatuses = [
                    marginMetrics.grossMargin.status,
                    marginMetrics.operatingMargin.status,
                    burnRunwayMetrics.netBurnMonthly.status,
                    cccMetrics.netCCC.status,
                    unitEconomicsMetrics.ltvCacRatio.status,
                ];
                
                const allTrends = [
                    marginMetrics.grossMargin.trend,
                    marginMetrics.operatingMargin.trend,
                    burnRunwayMetrics.netBurnMonthly.trend,
                    cccMetrics.netCCC.trend,
                    unitEconomicsMetrics.ltvCacRatio.trend,
                ];
                
                return {
                    onTrackCount: allStatuses.filter((s) => s === 'on_track').length,
                    watchCount: allStatuses.filter((s) => s === 'watch').length,
                    offTrackCount: allStatuses.filter((s) => s === 'off_track').length,
                    totalCount: allStatuses.length,
                    grossMargin: marginMetrics.grossMargin.current,
                    operatingMargin: marginMetrics.operatingMargin.current,
                    netBurnRate: burnRunwayMetrics.netBurnMonthly.current,
                    runwayMonths: burnRunwayMetrics.currentRunwayMonths,
                    cashConversionCycle: cccMetrics.netCCC.current,
                    ltvCacRatio: unitEconomicsMetrics.ltvCacRatio.current,
                    improvingCount: allTrends.filter((t) => t === 'improving').length,
                    stableCount: allTrends.filter((t) => t === 'stable').length,
                    deterioratingCount: allTrends.filter((t) => t === 'deteriorating').length,
                    activeAlerts: alerts.filter((a) => !a.isDismissed).length,
                    criticalAlerts: alerts.filter((a) => !a.isDismissed && a.severity === 'critical').length,
                    lastUpdatedAt: new Date().toISOString(),
                    dataFreshness: 'fresh',
                };
            },
            
            getExplanation: (kpiId): KPIExplanation => {
                const { marginMetrics } = get();
                
                // Return margin explanation as example
                if (kpiId === 'gross-margin' || kpiId === 'operating-margin') {
                    const metric = kpiId === 'gross-margin' ? marginMetrics.grossMargin : marginMetrics.operatingMargin;
                    
                    return {
                        kpiId,
                        kpiName: kpiId === 'gross-margin' ? 'Gross Margin' : 'Operating Margin',
                        currentValue: metric.current,
                        previousValue: metric.previous,
                        calculationLogic: kpiId === 'gross-margin' 
                            ? '(Revenue - COGS) / Revenue × 100'
                            : '(Revenue - COGS - Operating Expenses) / Revenue × 100',
                        dataSources: ['Revenue from Sales', 'Cost of Goods Sold', 'Operating Expenses'],
                        drivers: marginMetrics.marginDrivers.map((d) => ({
                            name: d.name,
                            contribution: d.impact,
                            contributionPercent: d.impactPercent,
                            isPositive: d.direction === 'positive',
                            explanation: d.description || '',
                        })),
                        waterfall: {
                            startValue: metric.previous,
                            endValue: metric.current,
                            steps: marginMetrics.marginDrivers.map((d, i) => ({
                                label: d.name,
                                value: d.impact,
                                cumulative: metric.previous + marginMetrics.marginDrivers.slice(0, i + 1).reduce((sum, dd) => sum + dd.impact, 0),
                            })),
                        },
                        summary: `${kpiId === 'gross-margin' ? 'Gross' : 'Operating'} margin improved by ${metric.deltaVsPrior.toFixed(1)} percentage points, primarily driven by ${marginMetrics.marginDrivers[0]?.name.toLowerCase() || 'mix improvements'}.`,
                    };
                }
                
                return {
                    kpiId,
                    kpiName: 'Unknown KPI',
                    currentValue: 0,
                    previousValue: 0,
                    calculationLogic: '',
                    dataSources: [],
                    drivers: [],
                    waterfall: { startValue: 0, endValue: 0, steps: [] },
                    summary: '',
                };
            },
            
            getTrendAnalysis: (kpiId): TrendAnalysis => ({
                kpiId,
                direction: 'improving',
                momentum: 'steady',
                rateOfChange: 3.5,
                rollingAvg3M: 67.2,
                rollingAvg6M: 65.8,
                rollingAvg12M: 64.1,
                volatility: 2.3,
                seasonalityIndex: 1.02,
                trendBreakDetected: false,
                anomalies: [],
            }),
            
            getActiveAlerts: () => get().alerts.filter((a) => !a.isDismissed),
            
            getMarginHistory: (margin): KPIHistoricalPoint[] => {
                const { marginMetrics } = get();
                const baseValue = margin === 'gross' 
                    ? marginMetrics.grossMargin.current 
                    : margin === 'contribution'
                    ? marginMetrics.contributionMargin.current
                    : marginMetrics.operatingMargin.current;
                return generateHistory(baseValue, 12, 0.08);
            },
        }),
        {
            name: 'primebalance-kpis',
            partialize: (state) => ({
                viewPreferences: state.viewPreferences,
                filter: state.filter,
                activeTab: state.activeTab,
            }),
        }
    )
);