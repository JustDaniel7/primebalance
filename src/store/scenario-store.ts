import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    Scenario,
    ScenarioAssumption,
    ScenarioMetrics,
    ScenarioCaseType,
    ScenarioStatus,
    ScenarioVisibility,
    StressTest,
    StressTestTemplate,
    StressTestType,
    StressIntensity,
    StressTestResult,
    SimulationState,
    SimulationDriver,
    ImpactExplanation,
    ImpactDriver,
    ScenarioComparison,
    ScenarioComment,
    ScenarioDecision,
    ScenarioChangeEvent,
    ScenarioTab,
    ScenarioViewPreferences,
    ScenarioFilter,
    AssumptionCategory,
} from '@/types/scenarios';

// =============================================================================
// INITIAL STATES
// =============================================================================

const initialViewPreferences: ScenarioViewPreferences = {
    showDeltas: true,
    showConfidenceBands: true,
    comparisonMode: 'delta',
    focusMetric: 'all',
    timeHorizon: 'medium',
};

const initialFilter: ScenarioFilter = {};

// =============================================================================
// DEMO DATA GENERATORS
// =============================================================================

const generateBaseAssumptions = (): ScenarioAssumption[] => [
    {
        id: 'growth-rate',
        name: 'Revenue Growth Rate',
        category: 'growth',
        baseValue: 8,
        currentValue: 8,
        unit: 'percentage',
        description: 'Year-over-year revenue growth',
        isProtected: false,
        isOverridden: false,
        minValue: -20,
        maxValue: 50,
        step: 1,
        impactedMetrics: ['revenue', 'cash', 'net'],
    },
    {
        id: 'churn-rate',
        name: 'Customer Churn Rate',
        category: 'churn',
        baseValue: 5,
        currentValue: 5,
        unit: 'percentage',
        description: 'Annual customer churn percentage',
        isProtected: false,
        isOverridden: false,
        minValue: 0,
        maxValue: 30,
        step: 0.5,
        impactedMetrics: ['revenue', 'net'],
    },
    {
        id: 'price-change',
        name: 'Average Price Change',
        category: 'pricing',
        baseValue: 3,
        currentValue: 3,
        unit: 'percentage',
        description: 'Year-over-year price adjustment',
        isProtected: false,
        isOverridden: false,
        minValue: -10,
        maxValue: 20,
        step: 0.5,
        impactedMetrics: ['revenue', 'net'],
    },
    {
        id: 'cost-inflation',
        name: 'Cost Inflation',
        category: 'cost_inflation',
        baseValue: 4,
        currentValue: 4,
        unit: 'percentage',
        description: 'Overall cost increase rate',
        isProtected: false,
        isOverridden: false,
        minValue: 0,
        maxValue: 20,
        step: 0.5,
        impactedMetrics: ['cost', 'net'],
    },
    {
        id: 'headcount-growth',
        name: 'Headcount Growth',
        category: 'headcount',
        baseValue: 10,
        currentValue: 10,
        unit: 'percentage',
        description: 'Planned headcount increase',
        isProtected: false,
        isOverridden: false,
        minValue: -10,
        maxValue: 50,
        step: 1,
        impactedMetrics: ['cost', 'cash', 'net'],
    },
    {
        id: 'payment-days',
        name: 'Average Collection Days',
        category: 'payment_terms',
        baseValue: 45,
        currentValue: 45,
        unit: 'days',
        description: 'Days to collect receivables',
        isProtected: false,
        isOverridden: false,
        minValue: 15,
        maxValue: 90,
        step: 5,
        impactedMetrics: ['cash'],
    },
    {
        id: 'fx-rate',
        name: 'EUR/USD Rate Change',
        category: 'fx',
        baseValue: 0,
        currentValue: 0,
        unit: 'percentage',
        description: 'Expected FX rate movement',
        isProtected: false,
        isOverridden: false,
        minValue: -15,
        maxValue: 15,
        step: 1,
        impactedMetrics: ['revenue', 'cost', 'net'],
    },
    {
        id: 'capex',
        name: 'CapEx Budget',
        category: 'capex',
        baseValue: 500000,
        currentValue: 500000,
        unit: 'amount',
        description: 'Annual capital expenditure',
        isProtected: false,
        isOverridden: false,
        minValue: 0,
        maxValue: 2000000,
        step: 50000,
        impactedMetrics: ['cash'],
    },
];

const calculateMetrics = (assumptions: ScenarioAssumption[], baseMetrics: ScenarioMetrics): ScenarioMetrics => {
    const getAssumption = (id: string) => assumptions.find(a => a.id === id);
    
    const growthRate = getAssumption('growth-rate')?.currentValue || 8;
    const churnRate = getAssumption('churn-rate')?.currentValue || 5;
    const priceChange = getAssumption('price-change')?.currentValue || 3;
    const costInflation = getAssumption('cost-inflation')?.currentValue || 4;
    const headcountGrowth = getAssumption('headcount-growth')?.currentValue || 10;
    
    const revenueMultiplier = (1 + growthRate/100) * (1 - churnRate/100 + 0.05) * (1 + priceChange/100);
    const costMultiplier = (1 + costInflation/100) * (1 + headcountGrowth/100 * 0.6);
    
    const revenue = Math.round(2400000 * revenueMultiplier);
    const costs = Math.round(1800000 * costMultiplier);
    const netPosition = revenue - costs;
    const cash = Math.round(2500000 + netPosition * 0.7);
    
    return {
        revenue,
        costs,
        cash,
        netPosition,
        profitMargin: (netPosition / revenue) * 100,
        cashRunwayDays: Math.round(cash / (costs / 365)),
        revenueDelta: revenue - baseMetrics.revenue,
        costsDelta: costs - baseMetrics.costs,
        cashDelta: cash - baseMetrics.cash,
        netDelta: netPosition - baseMetrics.netPosition,
        revenueChangePercent: ((revenue - baseMetrics.revenue) / baseMetrics.revenue) * 100,
        costsChangePercent: ((costs - baseMetrics.costs) / baseMetrics.costs) * 100,
        cashChangePercent: ((cash - baseMetrics.cash) / baseMetrics.cash) * 100,
        netChangePercent: baseMetrics.netPosition !== 0 
            ? ((netPosition - baseMetrics.netPosition) / Math.abs(baseMetrics.netPosition)) * 100 
            : 0,
    };
};

const expectedMetrics: ScenarioMetrics = {
    revenue: 2592000,
    costs: 1944000,
    cash: 2953600,
    netPosition: 648000,
    profitMargin: 25,
    cashRunwayDays: 555,
    revenueDelta: 0,
    costsDelta: 0,
    cashDelta: 0,
    netDelta: 0,
    revenueChangePercent: 0,
    costsChangePercent: 0,
    cashChangePercent: 0,
    netChangePercent: 0,
};

const generateDemoScenarios = (): Scenario[] => {
    const baseAssumptions = generateBaseAssumptions();
    
    // Best Case
    const bestCaseAssumptions = baseAssumptions.map(a => ({
        ...a,
        currentValue: a.id === 'growth-rate' ? 15 :
                      a.id === 'churn-rate' ? 3 :
                      a.id === 'price-change' ? 5 :
                      a.id === 'cost-inflation' ? 2 :
                      a.id === 'payment-days' ? 35 :
                      a.currentValue,
        isOverridden: ['growth-rate', 'churn-rate', 'price-change', 'cost-inflation', 'payment-days'].includes(a.id),
    }));
    
    // Worst Case
    const worstCaseAssumptions = baseAssumptions.map(a => ({
        ...a,
        currentValue: a.id === 'growth-rate' ? 2 :
                      a.id === 'churn-rate' ? 10 :
                      a.id === 'price-change' ? 0 :
                      a.id === 'cost-inflation' ? 6 :
                      a.id === 'payment-days' ? 60 :
                      a.currentValue,
        isOverridden: ['growth-rate', 'churn-rate', 'price-change', 'cost-inflation', 'payment-days'].includes(a.id),
    }));
    
    // Custom - Expansion Scenario
    const expansionAssumptions = baseAssumptions.map(a => ({
        ...a,
        currentValue: a.id === 'growth-rate' ? 25 :
                      a.id === 'headcount-growth' ? 30 :
                      a.id === 'capex' ? 800000 :
                      a.id === 'cost-inflation' ? 5 :
                      a.currentValue,
        isOverridden: ['growth-rate', 'headcount-growth', 'capex', 'cost-inflation'].includes(a.id),
    }));

    return [
        {
            id: 'expected-case',
            name: 'Expected Case',
            description: 'Baseline forecast based on current trends and committed pipeline',
            caseType: 'expected_case',
            status: 'approved',
            visibility: 'org_wide',
            assumptions: baseAssumptions,
            metrics: expectedMetrics,
            confidence: { level: 'high', score: 82, uncertaintyBandLow: -8, uncertaintyBandHigh: 12 },
            tags: ['Baseline', 'Q1 Planning'],
            ownerId: 'user-1',
            ownerName: 'Finance Team',
            sharedWithTeams: ['finance', 'exec'],
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: 'Finance Team',
            lastModifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            lastModifiedBy: 'CFO',
            approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            approvedBy: 'CFO',
            version: 3,
        },
        {
            id: 'best-case',
            name: 'Best Case',
            description: 'Optimistic scenario with strong market conditions and execution',
            caseType: 'best_case',
            status: 'approved',
            visibility: 'org_wide',
            assumptions: bestCaseAssumptions,
            metrics: calculateMetrics(bestCaseAssumptions, expectedMetrics),
            confidence: { level: 'medium', score: 65, uncertaintyBandLow: -5, uncertaintyBandHigh: 20 },
            tags: ['Baseline', 'Q1 Planning'],
            ownerId: 'user-1',
            ownerName: 'Finance Team',
            sharedWithTeams: ['finance', 'exec'],
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: 'Finance Team',
            lastModifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            lastModifiedBy: 'Finance Team',
            version: 2,
        },
        {
            id: 'worst-case',
            name: 'Worst Case',
            description: 'Conservative scenario accounting for economic headwinds',
            caseType: 'worst_case',
            status: 'approved',
            visibility: 'org_wide',
            assumptions: worstCaseAssumptions,
            metrics: calculateMetrics(worstCaseAssumptions, expectedMetrics),
            confidence: { level: 'medium', score: 70, uncertaintyBandLow: -15, uncertaintyBandHigh: 5 },
            tags: ['Baseline', 'Q1 Planning', 'Risk'],
            ownerId: 'user-1',
            ownerName: 'Finance Team',
            sharedWithTeams: ['finance', 'exec'],
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: 'Finance Team',
            lastModifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            lastModifiedBy: 'Finance Team',
            version: 2,
        },
        {
            id: 'expansion-2025',
            name: 'Market Expansion 2025',
            description: 'Aggressive growth scenario for APAC market entry',
            caseType: 'custom',
            status: 'reviewed',
            visibility: 'team',
            assumptions: expansionAssumptions,
            metrics: calculateMetrics(expansionAssumptions, expectedMetrics),
            confidence: { level: 'low', score: 55, uncertaintyBandLow: -20, uncertaintyBandHigh: 35 },
            derivedFromId: 'expected-case',
            derivedFromName: 'Expected Case',
            tags: ['Expansion', 'APAC', 'Board Review'],
            ownerId: 'user-2',
            ownerName: 'Strategy Team',
            sharedWithTeams: ['strategy', 'exec'],
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: 'Strategy Lead',
            lastModifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            lastModifiedBy: 'Strategy Lead',
            version: 5,
        },
        {
            id: 'downturn-planning',
            name: 'Downturn Planning',
            description: 'Contingency scenario for economic recession',
            caseType: 'custom',
            status: 'draft',
            visibility: 'personal',
            assumptions: worstCaseAssumptions.map(a => ({
                ...a,
                currentValue: a.id === 'growth-rate' ? -5 :
                              a.id === 'churn-rate' ? 15 :
                              a.id === 'headcount-growth' ? -10 :
                              a.currentValue,
            })),
            metrics: calculateMetrics(worstCaseAssumptions.map(a => ({
                ...a,
                currentValue: a.id === 'growth-rate' ? -5 :
                              a.id === 'churn-rate' ? 15 :
                              a.id === 'headcount-growth' ? -10 :
                              a.currentValue,
            })), expectedMetrics),
            confidence: { level: 'low', score: 45, uncertaintyBandLow: -25, uncertaintyBandHigh: 10 },
            derivedFromId: 'worst-case',
            derivedFromName: 'Worst Case',
            tags: ['Contingency', 'Downturn', 'Draft'],
            ownerId: 'user-1',
            ownerName: 'Finance Team',
            sharedWithTeams: [],
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: 'Finance Team',
            lastModifiedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            lastModifiedBy: 'Finance Team',
            version: 1,
        },
    ];
};

const generateStressTestTemplates = (): StressTestTemplate[] => [
    {
        id: 'template-revenue-shock',
        name: 'Revenue Shock',
        description: 'Sudden drop in revenue due to market conditions or lost customers',
        type: 'revenue_shock',
        defaultIntensities: [-5, -10, -20, -30],
        defaultParameters: [
            { name: 'Revenue Drop', type: 'revenue_shock', intensity: -10, description: 'Immediate revenue reduction' },
        ],
    },
    {
        id: 'template-demand-drop',
        name: 'Demand Drop',
        description: 'Gradual decline in customer demand',
        type: 'demand_drop',
        defaultIntensities: [-10, -20, -30, -50],
        defaultParameters: [
            { name: 'New Sales Decline', type: 'demand_drop', intensity: -20, description: 'Reduction in new business' },
            { name: 'Churn Increase', type: 'demand_drop', intensity: 5, description: 'Additional churn percentage points' },
        ],
    },
    {
        id: 'template-cost-spike',
        name: 'Cost Spike',
        description: 'Unexpected increase in operating costs',
        type: 'cost_spike',
        defaultIntensities: [5, 10, 15, 25],
        defaultParameters: [
            { name: 'Cost Increase', type: 'cost_spike', intensity: 10, description: 'Across-the-board cost increase' },
        ],
    },
    {
        id: 'template-delayed-collections',
        name: 'Delayed Collections',
        description: 'Customers taking longer to pay',
        type: 'delayed_collections',
        defaultIntensities: [15, 30, 45, 60],
        defaultParameters: [
            { name: 'Additional Collection Days', type: 'delayed_collections', intensity: 30, description: 'Extra days to collect' },
        ],
    },
    {
        id: 'template-fx-shock',
        name: 'FX Shock',
        description: 'Sudden currency movement',
        type: 'fx_shock',
        defaultIntensities: [-5, -10, -15, -20],
        defaultParameters: [
            { name: 'Currency Depreciation', type: 'fx_shock', intensity: -10, description: 'EUR weakening vs USD' },
        ],
    },
];

const generateDemoStressTests = (): StressTest[] => [
    {
        id: 'stress-1',
        name: 'Moderate Revenue Shock',
        description: '15% revenue decline stress test',
        type: 'revenue_shock',
        isTemplate: false,
        parameters: [
            { id: 'p1', name: 'Revenue Drop', type: 'revenue_shock', intensity: -15, description: 'Immediate revenue reduction' },
        ],
        intensity: 'moderate',
        result: 'warning',
        resultMetrics: {
            ...expectedMetrics,
            revenue: Math.round(expectedMetrics.revenue * 0.85),
            netPosition: Math.round(expectedMetrics.revenue * 0.85) - expectedMetrics.costs,
            cash: Math.round(expectedMetrics.cash * 0.9),
            revenueDelta: Math.round(expectedMetrics.revenue * -0.15),
            revenueChangePercent: -15,
        },
        thresholds: [
            { metric: 'Cash Runway', threshold: 90, currentValue: 145, breached: false, margin: 55 },
            { metric: 'Profit Margin', threshold: 10, currentValue: 8.5, breached: true, margin: -1.5 },
            { metric: 'Covenant Ratio', threshold: 1.5, currentValue: 1.8, breached: false, margin: 0.3 },
        ],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastRunAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'stress-2',
        name: 'Severe Combined Shock',
        description: 'Revenue drop + cost spike + delayed collections',
        type: 'combined',
        isTemplate: false,
        parameters: [
            { id: 'p2a', name: 'Revenue Drop', type: 'revenue_shock', intensity: -10 },
            { id: 'p2b', name: 'Cost Increase', type: 'cost_spike', intensity: 8 },
            { id: 'p2c', name: 'Collection Delay', type: 'delayed_collections', intensity: 20 },
        ],
        intensity: 'severe',
        result: 'fail',
        resultMetrics: {
            ...expectedMetrics,
            revenue: Math.round(expectedMetrics.revenue * 0.9),
            costs: Math.round(expectedMetrics.costs * 1.08),
            netPosition: Math.round(expectedMetrics.revenue * 0.9) - Math.round(expectedMetrics.costs * 1.08),
            cash: Math.round(expectedMetrics.cash * 0.75),
            revenueDelta: Math.round(expectedMetrics.revenue * -0.1),
            costsDelta: Math.round(expectedMetrics.costs * 0.08),
        },
        thresholds: [
            { metric: 'Cash Runway', threshold: 90, currentValue: 78, breached: true, margin: -12 },
            { metric: 'Profit Margin', threshold: 10, currentValue: 2.1, breached: true, margin: -7.9 },
            { metric: 'Covenant Ratio', threshold: 1.5, currentValue: 1.3, breached: true, margin: -0.2 },
        ],
        cashShortfallPoint: '2025-08-15',
        covenantBreachPoint: '2025-06-30',
        marginCollapsePoint: '2025-05-15',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        lastRunAt: new Date().toISOString(),
    },
];

const generateDemoComments = (): ScenarioComment[] => [
    {
        id: 'comment-1',
        scenarioId: 'expansion-2025',
        content: 'We should revisit the APAC headcount assumptions after Q1 results',
        authorId: 'user-3',
        authorName: 'Regional Director',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        isResolved: false,
    },
    {
        id: 'comment-2',
        scenarioId: 'expansion-2025',
        content: 'Agreed. I\'ve flagged this for the April planning cycle.',
        authorId: 'user-2',
        authorName: 'Strategy Lead',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        parentId: 'comment-1',
        isResolved: false,
    },
    {
        id: 'comment-3',
        scenarioId: 'expected-case',
        content: 'CFO approved for Q1 planning. Locking this version.',
        authorId: 'user-1',
        authorName: 'Finance Team',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        isResolved: true,
    },
];

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface ScenarioState {
    // Data
    scenarios: Scenario[];
    stressTests: StressTest[];
    stressTestTemplates: StressTestTemplate[];
    comments: ScenarioComment[];
    decisions: ScenarioDecision[];
    changeHistory: ScenarioChangeEvent[];
    
    // Simulation State
    activeSimulation: SimulationState | null;
    
    // UI State
    activeTab: ScenarioTab;
    viewPreferences: ScenarioViewPreferences;
    filter: ScenarioFilter;
    selectedScenarioId: string | null;
    comparisonScenarioIds: string[];
    isLoading: boolean;
    isSimulating: boolean;
    error: string | null;
    
    // Actions
    fetchScenarios: () => Promise<void>;
    setActiveTab: (tab: ScenarioTab) => void;
    setViewPreferences: (prefs: Partial<ScenarioViewPreferences>) => void;
    setFilter: (filter: Partial<ScenarioFilter>) => void;
    resetFilter: () => void;
    
    // Scenario CRUD
    selectScenario: (id: string | null) => void;
    createScenario: (scenario: Partial<Scenario>) => string;
    updateScenario: (id: string, updates: Partial<Scenario>) => void;
    cloneScenario: (id: string, newName: string) => string;
    deleteScenario: (id: string) => void;
    archiveScenario: (id: string) => void;
    lockScenario: (id: string) => void;
    approveScenario: (id: string, approverName: string) => void;
    
    // Assumptions
    updateAssumption: (scenarioId: string, assumptionId: string, value: number) => void;
    resetAssumption: (scenarioId: string, assumptionId: string) => void;
    resetAllAssumptions: (scenarioId: string) => void;
    
    // Comparison
    addToComparison: (id: string) => void;
    removeFromComparison: (id: string) => void;
    clearComparison: () => void;
    getComparison: () => ScenarioComparison | null;
    
    // Stress Tests
    runStressTest: (templateId: string, intensity: number) => void;
    deleteStressTest: (id: string) => void;
    
    // Simulation
    startSimulation: (baseScenarioId: string) => void;
    updateSimulationDriver: (driverId: string, value: number) => void;
    resetSimulation: () => void;
    pinSimulation: (name: string) => string;
    
    // Impact Explanation
    getImpactExplanation: (scenarioId: string, comparedToId: string, metric: 'revenue' | 'cost' | 'cash' | 'net') => ImpactExplanation;
    
    // Comments
    addComment: (scenarioId: string, content: string, parentId?: string) => void;
    resolveComment: (commentId: string) => void;
    
    // Computed
    getFilteredScenarios: () => Scenario[];
    getScenarioById: (id: string) => Scenario | undefined;
    getBaselineScenarios: () => Scenario[];
    getCustomScenarios: () => Scenario[];
    getScenarioComments: (scenarioId: string) => ScenarioComment[];
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useScenarioStore = create<ScenarioState>()(
    persist(
        (set, get) => ({
            // Initial Data
            scenarios: generateDemoScenarios(),
            stressTests: generateDemoStressTests(),
            stressTestTemplates: generateStressTestTemplates(),
            comments: generateDemoComments(),
            decisions: [],
            changeHistory: [],
            
            // Simulation
            activeSimulation: null,
            
            // UI State
            activeTab: 'overview',
            viewPreferences: initialViewPreferences,
            filter: initialFilter,
            selectedScenarioId: null,
            comparisonScenarioIds: ['expected-case', 'best-case', 'worst-case'],
            isLoading: false,
            isSimulating: false,
            error: null,
            
            // Actions
            fetchScenarios: async () => {
                set({ isLoading: true });
                // API call would go here
                set({ isLoading: false });
            },
            
            setActiveTab: (tab) => set({ activeTab: tab }),
            
            setViewPreferences: (prefs) => set((state) => ({
                viewPreferences: { ...state.viewPreferences, ...prefs },
            })),
            
            setFilter: (filter) => set((state) => ({
                filter: { ...state.filter, ...filter },
            })),
            
            resetFilter: () => set({ filter: initialFilter }),
            
            // Scenario CRUD
            selectScenario: (id) => set({ selectedScenarioId: id }),
            
            createScenario: (scenario) => {
                const id = `scenario-${Date.now()}`;
                const baseAssumptions = generateBaseAssumptions();
                const newScenario: Scenario = {
                    id,
                    name: scenario.name || 'New Scenario',
                    description: scenario.description,
                    caseType: scenario.caseType || 'custom',
                    status: 'draft',
                    visibility: scenario.visibility || 'personal',
                    assumptions: scenario.assumptions || baseAssumptions,
                    metrics: scenario.metrics || expectedMetrics,
                    confidence: { level: 'low', score: 50, uncertaintyBandLow: -20, uncertaintyBandHigh: 20 },
                    tags: scenario.tags || [],
                    ownerId: 'user-1',
                    ownerName: 'Current User',
                    sharedWithTeams: [],
                    createdAt: new Date().toISOString(),
                    createdBy: 'Current User',
                    lastModifiedAt: new Date().toISOString(),
                    lastModifiedBy: 'Current User',
                    version: 1,
                    ...scenario,
                };
                set((state) => ({
                    scenarios: [...state.scenarios, newScenario],
                    selectedScenarioId: id,
                }));
                return id;
            },
            
            updateScenario: (id, updates) => set((state) => ({
                scenarios: state.scenarios.map((s) =>
                    s.id === id
                        ? { ...s, ...updates, lastModifiedAt: new Date().toISOString(), version: s.version + 1 }
                        : s
                ),
            })),
            
            cloneScenario: (id, newName) => {
                const { scenarios } = get();
                const source = scenarios.find((s) => s.id === id);
                if (!source) return '';
                
                const newId = `scenario-${Date.now()}`;
                const cloned: Scenario = {
                    ...source,
                    id: newId,
                    name: newName,
                    status: 'draft',
                    derivedFromId: source.id,
                    derivedFromName: source.name,
                    createdAt: new Date().toISOString(),
                    lastModifiedAt: new Date().toISOString(),
                    version: 1,
                    lockedAt: undefined,
                    lockedBy: undefined,
                    approvedAt: undefined,
                    approvedBy: undefined,
                };
                
                set((state) => ({
                    scenarios: [...state.scenarios, cloned],
                    selectedScenarioId: newId,
                }));
                return newId;
            },
            
            deleteScenario: (id) => set((state) => ({
                scenarios: state.scenarios.filter((s) => s.id !== id),
                selectedScenarioId: state.selectedScenarioId === id ? null : state.selectedScenarioId,
            })),
            
            archiveScenario: (id) => set((state) => ({
                scenarios: state.scenarios.map((s) =>
                    s.id === id ? { ...s, status: 'archived' as ScenarioStatus } : s
                ),
            })),
            
            lockScenario: (id) => set((state) => ({
                scenarios: state.scenarios.map((s) =>
                    s.id === id
                        ? { ...s, status: 'locked' as ScenarioStatus, lockedAt: new Date().toISOString(), lockedBy: 'Current User' }
                        : s
                ),
            })),
            
            approveScenario: (id, approverName) => set((state) => ({
                scenarios: state.scenarios.map((s) =>
                    s.id === id
                        ? { ...s, status: 'approved' as ScenarioStatus, approvedAt: new Date().toISOString(), approvedBy: approverName }
                        : s
                ),
            })),
            
            // Assumptions
            updateAssumption: (scenarioId, assumptionId, value) => {
                set((state) => {
                    const scenario = state.scenarios.find((s) => s.id === scenarioId);
                    if (!scenario || scenario.status === 'locked') return state;
                    
                    const updatedAssumptions = scenario.assumptions.map((a) =>
                        a.id === assumptionId ? { ...a, currentValue: value, isOverridden: value !== a.baseValue } : a
                    );
                    
                    const updatedMetrics = calculateMetrics(updatedAssumptions, expectedMetrics);
                    
                    return {
                        scenarios: state.scenarios.map((s) =>
                            s.id === scenarioId
                                ? {
                                    ...s,
                                    assumptions: updatedAssumptions,
                                    metrics: updatedMetrics,
                                    lastModifiedAt: new Date().toISOString(),
                                }
                                : s
                        ),
                    };
                });
            },
            
            resetAssumption: (scenarioId, assumptionId) => {
                const { scenarios } = get();
                const scenario = scenarios.find((s) => s.id === scenarioId);
                if (!scenario) return;
                
                const assumption = scenario.assumptions.find((a) => a.id === assumptionId);
                if (!assumption) return;
                
                get().updateAssumption(scenarioId, assumptionId, assumption.baseValue);
            },
            
            resetAllAssumptions: (scenarioId) => {
                const { scenarios } = get();
                const scenario = scenarios.find((s) => s.id === scenarioId);
                if (!scenario) return;
                
                scenario.assumptions.forEach((a) => {
                    get().updateAssumption(scenarioId, a.id, a.baseValue);
                });
            },
            
            // Comparison
            addToComparison: (id) => set((state) => ({
                comparisonScenarioIds: state.comparisonScenarioIds.includes(id)
                    ? state.comparisonScenarioIds
                    : [...state.comparisonScenarioIds, id],
            })),
            
            removeFromComparison: (id) => set((state) => ({
                comparisonScenarioIds: state.comparisonScenarioIds.filter((sid) => sid !== id),
            })),
            
            clearComparison: () => set({ comparisonScenarioIds: [] }),
            
            getComparison: (): ScenarioComparison | null => {
                const { scenarios, comparisonScenarioIds } = get();
                if (comparisonScenarioIds.length < 2) return null;
                
                const comparedScenarios = scenarios.filter((s) => comparisonScenarioIds.includes(s.id));
                const baseline = comparedScenarios.find((s) => s.caseType === 'expected_case') || comparedScenarios[0];
                
                const deltas: Record<string, { revenue: number; costs: number; cash: number; net: number }> = {};
                comparedScenarios.forEach((s) => {
                    deltas[s.id] = {
                        revenue: s.metrics.revenue - baseline.metrics.revenue,
                        costs: s.metrics.costs - baseline.metrics.costs,
                        cash: s.metrics.cash - baseline.metrics.cash,
                        net: s.metrics.netPosition - baseline.metrics.netPosition,
                    };
                });
                
                const revenues = comparedScenarios.map((s) => s.metrics.revenue);
                const costs = comparedScenarios.map((s) => s.metrics.costs);
                const cashes = comparedScenarios.map((s) => s.metrics.cash);
                const nets = comparedScenarios.map((s) => s.metrics.netPosition);
                
                return {
                    scenarios: comparedScenarios.map((s) => ({
                        id: s.id,
                        name: s.name,
                        caseType: s.caseType,
                        metrics: s.metrics,
                    })),
                    baselineId: baseline.id,
                    deltas,
                    spread: {
                        revenue: { min: Math.min(...revenues), max: Math.max(...revenues), range: Math.max(...revenues) - Math.min(...revenues) },
                        costs: { min: Math.min(...costs), max: Math.max(...costs), range: Math.max(...costs) - Math.min(...costs) },
                        cash: { min: Math.min(...cashes), max: Math.max(...cashes), range: Math.max(...cashes) - Math.min(...cashes) },
                        net: { min: Math.min(...nets), max: Math.max(...nets), range: Math.max(...nets) - Math.min(...nets) },
                    },
                };
            },
            
            // Stress Tests
            runStressTest: (templateId, intensity) => {
                const template = get().stressTestTemplates.find((t) => t.id === templateId);
                if (!template) return;
                
                const newTest: StressTest = {
                    id: `stress-${Date.now()}`,
                    name: `${template.name} (${intensity}%)`,
                    type: template.type,
                    isTemplate: false,
                    parameters: template.defaultParameters.map((p, i) => ({
                        ...p,
                        id: `p-${Date.now()}-${i}`,
                        intensity: intensity,
                    })),
                    intensity: Math.abs(intensity) <= 5 ? 'mild' : Math.abs(intensity) <= 15 ? 'moderate' : Math.abs(intensity) <= 25 ? 'severe' : 'extreme',
                    result: Math.abs(intensity) <= 10 ? 'pass' : Math.abs(intensity) <= 20 ? 'warning' : 'fail',
                    resultMetrics: {
                        ...expectedMetrics,
                        revenue: Math.round(expectedMetrics.revenue * (1 + intensity / 100)),
                    },
                    thresholds: [],
                    createdAt: new Date().toISOString(),
                    lastRunAt: new Date().toISOString(),
                };
                
                set((state) => ({
                    stressTests: [...state.stressTests, newTest],
                }));
            },
            
            deleteStressTest: (id) => set((state) => ({
                stressTests: state.stressTests.filter((t) => t.id !== id),
            })),
            
            // Simulation
            startSimulation: (baseScenarioId) => {
                const scenario = get().scenarios.find((s) => s.id === baseScenarioId);
                if (!scenario) return;
                
                const drivers: SimulationDriver[] = scenario.assumptions.map((a) => ({
                    id: `driver-${a.id}`,
                    assumptionId: a.id,
                    name: a.name,
                    category: a.category,
                    baseValue: a.baseValue,
                    currentValue: a.currentValue,
                    minValue: a.minValue || 0,
                    maxValue: a.maxValue || 100,
                    step: a.step || 1,
                    unit: a.unit,
                    isActive: true,
                }));
                
                set({
                    activeSimulation: {
                        id: `sim-${Date.now()}`,
                        drivers,
                        resultMetrics: scenario.metrics,
                        comparisonBaselineId: baseScenarioId,
                        isPinned: false,
                        createdAt: new Date().toISOString(),
                    },
                    isSimulating: true,
                });
            },
            
            updateSimulationDriver: (driverId, value) => {
                set((state) => {
                    if (!state.activeSimulation) return state;
                    
                    const updatedDrivers = state.activeSimulation.drivers.map((d) =>
                        d.id === driverId ? { ...d, currentValue: value } : d
                    );
                    
                    // Recalculate metrics based on driver changes
                    const assumptions: ScenarioAssumption[] = updatedDrivers.map((d) => ({
                        id: d.assumptionId,
                        name: d.name,
                        category: d.category,
                        baseValue: d.baseValue,
                        currentValue: d.currentValue,
                        unit: d.unit as ScenarioAssumption['unit'],
                        isProtected: false,
                        isOverridden: d.currentValue !== d.baseValue,
                        impactedMetrics: ['revenue', 'cost', 'cash', 'net'],
                    }));
                    
                    const resultMetrics = calculateMetrics(assumptions, expectedMetrics);
                    
                    return {
                        activeSimulation: {
                            ...state.activeSimulation,
                            drivers: updatedDrivers,
                            resultMetrics,
                        },
                    };
                });
            },
            
            resetSimulation: () => {
                set((state) => {
                    if (!state.activeSimulation) return state;
                    
                    const resetDrivers = state.activeSimulation.drivers.map((d) => ({
                        ...d,
                        currentValue: d.baseValue,
                    }));
                    
                    return {
                        activeSimulation: {
                            ...state.activeSimulation,
                            drivers: resetDrivers,
                            resultMetrics: expectedMetrics,
                        },
                    };
                });
            },
            
            pinSimulation: (name) => {
                const { activeSimulation } = get();
                if (!activeSimulation) return '';
                
                const assumptions: ScenarioAssumption[] = activeSimulation.drivers.map((d) => ({
                    id: d.assumptionId,
                    name: d.name,
                    category: d.category,
                    baseValue: d.baseValue,
                    currentValue: d.currentValue,
                    unit: d.unit as ScenarioAssumption['unit'],
                    isProtected: false,
                    isOverridden: d.currentValue !== d.baseValue,
                    impactedMetrics: ['revenue', 'cost', 'cash', 'net'],
                }));
                
                const id = get().createScenario({
                    name,
                    caseType: 'custom',
                    assumptions,
                    metrics: activeSimulation.resultMetrics,
                    tags: ['From Simulation'],
                    derivedFromId: activeSimulation.comparisonBaselineId,
                });
                
                set({
                    activeSimulation: { ...activeSimulation, isPinned: true, pinnedAsScenarioId: id },
                    isSimulating: false,
                });
                
                return id;
            },
            
            // Impact Explanation
            getImpactExplanation: (scenarioId, comparedToId, metric): ImpactExplanation => {
                const { scenarios } = get();
                const scenario = scenarios.find((s) => s.id === scenarioId);
                const baseline = scenarios.find((s) => s.id === comparedToId);
                
                if (!scenario || !baseline) {
                    return {
                        scenarioId,
                        comparedToId,
                        metric,
                        totalChange: 0,
                        totalChangePercent: 0,
                        summaryText: 'Unable to generate explanation',
                        primaryDrivers: [],
                        secondaryDrivers: [],
                        waterfall: { startValue: 0, endValue: 0, steps: [] },
                        secondOrderEffects: [],
                    };
                }
                
                const metricKey = metric === 'cost' ? 'costs' : metric === 'net' ? 'netPosition' : metric;
                const scenarioValue = scenario.metrics[metricKey as keyof ScenarioMetrics] as number;
                const baselineValue = baseline.metrics[metricKey as keyof ScenarioMetrics] as number;
                const totalChange = scenarioValue - baselineValue;
                const totalChangePercent = baselineValue !== 0 ? (totalChange / baselineValue) * 100 : 0;
                
                // Generate drivers based on assumption differences
                const primaryDrivers: ImpactDriver[] = [];
                scenario.assumptions.forEach((a) => {
                    const baseAssumption = baseline.assumptions.find((ba) => ba.id === a.id);
                    if (baseAssumption && a.currentValue !== baseAssumption.currentValue) {
                        const diff = a.currentValue - baseAssumption.currentValue;
                        const contribution = diff * (totalChange / 100) * (a.impactedMetrics.includes(metric) ? 1 : 0.3);
                        if (Math.abs(contribution) > 1000) {
                            primaryDrivers.push({
                                id: a.id,
                                name: a.name,
                                category: a.category,
                                contribution: Math.round(contribution),
                                contributionPercent: totalChange !== 0 ? Math.round((contribution / totalChange) * 100) : 0,
                                direction: contribution >= 0 ? 'positive' : 'negative',
                                magnitude: Math.abs(contribution) > 50000 ? 'major' : Math.abs(contribution) > 20000 ? 'significant' : 'moderate',
                                explanation: `${a.name} changed from ${baseAssumption.currentValue} to ${a.currentValue}`,
                            });
                        }
                    }
                });
                
                // Sort by absolute contribution
                primaryDrivers.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
                
                // Generate summary text
                const topDriver = primaryDrivers[0];
                const summaryText = topDriver
                    ? `${metric.charAt(0).toUpperCase() + metric.slice(1)} ${totalChange >= 0 ? 'increases' : 'decreases'} by ${Math.abs(totalChangePercent).toFixed(1)}%, primarily due to ${topDriver.name.toLowerCase()}${primaryDrivers.length > 1 ? `, partially offset by ${primaryDrivers[1]?.name.toLowerCase()}` : ''}.`
                    : 'No significant drivers identified for this change.';
                
                return {
                    scenarioId,
                    comparedToId,
                    metric,
                    totalChange,
                    totalChangePercent,
                    summaryText,
                    primaryDrivers: primaryDrivers.slice(0, 3),
                    secondaryDrivers: primaryDrivers.slice(3),
                    waterfall: {
                        startValue: baselineValue,
                        endValue: scenarioValue,
                        steps: primaryDrivers.map((d, i) => ({
                            label: d.name,
                            value: d.contribution,
                            cumulative: baselineValue + primaryDrivers.slice(0, i + 1).reduce((sum, pd) => sum + pd.contribution, 0),
                            isPositive: d.contribution >= 0,
                        })),
                    },
                    secondOrderEffects: totalChange < 0 ? [
                        { trigger: 'Revenue decline', effect: 'Reduced cash runway', impact: Math.round(totalChange * 0.3) },
                    ] : [],
                };
            },
            
            // Comments
            addComment: (scenarioId, content, parentId) => {
                const newComment: ScenarioComment = {
                    id: `comment-${Date.now()}`,
                    scenarioId,
                    content,
                    authorId: 'user-1',
                    authorName: 'Current User',
                    createdAt: new Date().toISOString(),
                    parentId,
                    isResolved: false,
                };
                set((state) => ({
                    comments: [...state.comments, newComment],
                }));
            },
            
            resolveComment: (commentId) => set((state) => ({
                comments: state.comments.map((c) =>
                    c.id === commentId ? { ...c, isResolved: true } : c
                ),
            })),
            
            // Computed
            getFilteredScenarios: () => {
                const { scenarios, filter } = get();
                let filtered = [...scenarios];
                
                if (filter.caseType?.length) {
                    filtered = filtered.filter((s) => filter.caseType!.includes(s.caseType));
                }
                if (filter.status?.length) {
                    filtered = filtered.filter((s) => filter.status!.includes(s.status));
                }
                if (filter.visibility?.length) {
                    filtered = filtered.filter((s) => filter.visibility!.includes(s.visibility));
                }
                if (filter.tags?.length) {
                    filtered = filtered.filter((s) => s.tags.some((t) => filter.tags!.includes(t)));
                }
                if (filter.searchQuery) {
                    const q = filter.searchQuery.toLowerCase();
                    filtered = filtered.filter(
                        (s) => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
                    );
                }
                
                return filtered.filter((s) => s.status !== 'archived');
            },
            
            getScenarioById: (id) => get().scenarios.find((s) => s.id === id),
            
            getBaselineScenarios: () => get().scenarios.filter((s) =>
                ['best_case', 'expected_case', 'worst_case'].includes(s.caseType) && s.status !== 'archived'
            ),
            
            getCustomScenarios: () => get().scenarios.filter((s) =>
                s.caseType === 'custom' && s.status !== 'archived'
            ),
            
            getScenarioComments: (scenarioId) => get().comments.filter((c) => c.scenarioId === scenarioId),
        }),
        {
            name: 'primebalance-scenarios',
            partialize: (state) => ({
                viewPreferences: state.viewPreferences,
                filter: state.filter,
                activeTab: state.activeTab,
                comparisonScenarioIds: state.comparisonScenarioIds,
            }),
        }
    )
);