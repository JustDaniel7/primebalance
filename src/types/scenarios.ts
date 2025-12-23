// =============================================================================
// SCENARIOS TYPES - PrimeBalance Finance OS
// =============================================================================

// Scenario Classification
export type ScenarioCaseType = 'best_case' | 'expected_case' | 'worst_case' | 'custom';
export type ScenarioStatus = 'draft' | 'reviewed' | 'approved' | 'locked' | 'archived';
export type ScenarioVisibility = 'personal' | 'team' | 'org_wide';

// Stress Test Types
export type StressTestType = 'revenue_shock' | 'demand_drop' | 'cost_spike' | 'delayed_collections' | 'fx_shock' | 'combined';
export type StressIntensity = 'mild' | 'moderate' | 'severe' | 'extreme';
export type StressTestResult = 'pass' | 'warning' | 'fail';

// Assumption Categories
export type AssumptionCategory = 
    | 'growth' 
    | 'pricing' 
    | 'volume' 
    | 'churn' 
    | 'cost_inflation' 
    | 'fx' 
    | 'payment_terms'
    | 'headcount'
    | 'capex'
    | 'other';

// Impact & Attribution
export type ImpactDirection = 'positive' | 'negative' | 'neutral';
export type ImpactMagnitude = 'minimal' | 'moderate' | 'significant' | 'major';

// =============================================================================
// CORE SCENARIO TYPES
// =============================================================================

export interface ScenarioAssumption {
    id: string;
    name: string;
    category: AssumptionCategory;
    baseValue: number;
    currentValue: number;
    unit: 'percentage' | 'amount' | 'days' | 'multiplier' | 'count';
    description?: string;
    isProtected: boolean; // Cannot be edited in predefined scenarios
    isOverridden: boolean;
    minValue?: number;
    maxValue?: number;
    step?: number;
    impactedMetrics: ('revenue' | 'cost' | 'cash' | 'net')[];
    lastModifiedAt?: string;
    lastModifiedBy?: string;
}

export interface ScenarioMetrics {
    revenue: number;
    costs: number;
    cash: number;
    netPosition: number;
    profitMargin: number;
    cashRunwayDays: number;
    
    // Deltas vs expected
    revenueDelta: number;
    costsDelta: number;
    cashDelta: number;
    netDelta: number;
    
    // Percentage changes
    revenueChangePercent: number;
    costsChangePercent: number;
    cashChangePercent: number;
    netChangePercent: number;
}

export interface ScenarioConfidence {
    level: 'low' | 'medium' | 'high';
    score: number; // 0-100
    uncertaintyBandLow: number;
    uncertaintyBandHigh: number;
}

export interface Scenario {
    id: string;
    name: string;
    description?: string;
    caseType: ScenarioCaseType;
    status: ScenarioStatus;
    visibility: ScenarioVisibility;
    
    // Assumptions
    assumptions: ScenarioAssumption[];
    
    // Calculated Metrics
    metrics: ScenarioMetrics;
    confidence: ScenarioConfidence;
    
    // Lineage
    derivedFromId?: string;
    derivedFromName?: string;
    
    // Tags & Organization
    tags: string[];
    
    // Ownership
    ownerId: string;
    ownerName: string;
    sharedWithTeams: string[];
    
    // Audit
    createdAt: string;
    createdBy: string;
    lastModifiedAt: string;
    lastModifiedBy: string;
    lockedAt?: string;
    lockedBy?: string;
    approvedAt?: string;
    approvedBy?: string;
    
    // Versioning
    version: number;
    previousVersionId?: string;
}

// =============================================================================
// STRESS TEST TYPES
// =============================================================================

export interface StressTestParameter {
    id: string;
    name: string;
    type: StressTestType;
    intensity: number; // percentage (e.g., -5, -10, -20)
    description?: string;
}

export interface StressTestThreshold {
    metric: string;
    threshold: number;
    currentValue: number;
    breached: boolean;
    margin: number; // how close to breach
}

export interface StressTest {
    id: string;
    name: string;
    description?: string;
    type: StressTestType;
    isTemplate: boolean;
    
    // Parameters
    parameters: StressTestParameter[];
    intensity: StressIntensity;
    
    // Results
    result: StressTestResult;
    resultMetrics: ScenarioMetrics;
    
    // Threshold Analysis
    thresholds: StressTestThreshold[];
    cashShortfallPoint?: string; // Date when cash goes negative
    covenantBreachPoint?: string;
    marginCollapsePoint?: string;
    
    // Meta
    createdAt: string;
    lastRunAt: string;
}

export interface StressTestTemplate {
    id: string;
    name: string;
    description: string;
    type: StressTestType;
    defaultIntensities: number[];
    defaultParameters: Omit<StressTestParameter, 'id'>[];
}

// =============================================================================
// WHAT-IF SIMULATION
// =============================================================================

export interface SimulationDriver {
    id: string;
    assumptionId: string;
    name: string;
    category: AssumptionCategory;
    baseValue: number;
    currentValue: number;
    minValue: number;
    maxValue: number;
    step: number;
    unit: string;
    isActive: boolean;
}

export interface SimulationState {
    id: string;
    name?: string;
    drivers: SimulationDriver[];
    resultMetrics: ScenarioMetrics;
    comparisonBaselineId: string;
    isPinned: boolean;
    pinnedAsScenarioId?: string;
    createdAt: string;
}

// =============================================================================
// IMPACT EXPLANATION
// =============================================================================

export interface ImpactDriver {
    id: string;
    name: string;
    category: AssumptionCategory;
    contribution: number; // absolute value
    contributionPercent: number;
    direction: ImpactDirection;
    magnitude: ImpactMagnitude;
    explanation?: string;
}

export interface ImpactWaterfall {
    startValue: number;
    endValue: number;
    steps: {
        label: string;
        value: number;
        cumulative: number;
        isPositive: boolean;
    }[];
}

export interface ImpactExplanation {
    scenarioId: string;
    comparedToId: string;
    metric: 'revenue' | 'cost' | 'cash' | 'net';
    
    // Summary
    totalChange: number;
    totalChangePercent: number;
    summaryText: string; // Natural language explanation
    
    // Drivers
    primaryDrivers: ImpactDriver[];
    secondaryDrivers: ImpactDriver[];
    
    // Waterfall
    waterfall: ImpactWaterfall;
    
    // Second-order effects
    secondOrderEffects: {
        trigger: string;
        effect: string;
        impact: number;
    }[];
}

// =============================================================================
// COMPARISON
// =============================================================================

export interface ScenarioComparison {
    scenarios: {
        id: string;
        name: string;
        caseType: ScenarioCaseType;
        metrics: ScenarioMetrics;
    }[];
    
    baselineId: string;
    
    // Deltas for each scenario vs baseline
    deltas: Record<string, {
        revenue: number;
        costs: number;
        cash: number;
        net: number;
    }>;
    
    // Spread analysis
    spread: {
        revenue: { min: number; max: number; range: number };
        costs: { min: number; max: number; range: number };
        cash: { min: number; max: number; range: number };
        net: { min: number; max: number; range: number };
    };
}

// =============================================================================
// COLLABORATION
// =============================================================================

export interface ScenarioComment {
    id: string;
    scenarioId: string;
    content: string;
    authorId: string;
    authorName: string;
    createdAt: string;
    updatedAt?: string;
    parentId?: string; // For threaded comments
    isResolved: boolean;
}

export interface ScenarioDecision {
    id: string;
    scenarioId: string;
    type: 'reviewed' | 'approved' | 'rejected' | 'deferred';
    decision: string;
    rationale?: string;
    decidedBy: string;
    decidedByName: string;
    decidedAt: string;
}

// =============================================================================
// CHANGE HISTORY
// =============================================================================

export interface ScenarioChangeEvent {
    id: string;
    scenarioId: string;
    timestamp: string;
    userId: string;
    userName: string;
    
    changeType: 'created' | 'assumption_changed' | 'status_changed' | 'locked' | 'approved' | 'cloned' | 'archived';
    
    // For assumption changes
    assumptionId?: string;
    assumptionName?: string;
    previousValue?: number;
    newValue?: number;
    
    // For status changes
    previousStatus?: ScenarioStatus;
    newStatus?: ScenarioStatus;
    
    description: string;
}

// =============================================================================
// UI STATE
// =============================================================================

export type ScenarioTab = 'overview' | 'baseline' | 'custom' | 'stress' | 'simulation' | 'compare';

export interface ScenarioViewPreferences {
    showDeltas: boolean;
    showConfidenceBands: boolean;
    comparisonMode: 'absolute' | 'percentage' | 'delta';
    focusMetric: 'all' | 'revenue' | 'costs' | 'cash' | 'net';
    timeHorizon: 'short' | 'medium' | 'long';
}

export interface ScenarioFilter {
    caseType?: ScenarioCaseType[];
    status?: ScenarioStatus[];
    visibility?: ScenarioVisibility[];
    tags?: string[];
    ownerId?: string;
    searchQuery?: string;
}