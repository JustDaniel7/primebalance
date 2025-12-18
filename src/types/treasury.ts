// =============================================================================
// TREASURY & CAPITAL CONTROL TYPES
// =============================================================================

// Decision Lifecycle States
export type TreasuryDecisionStatus =
    | 'draft'
    | 'validating'
    | 'evaluating'
    | 'proposed'
    | 'awaiting_approval'
    | 'approved'
    | 'scheduled'
    | 'executing'
    | 'executed'
    | 'reconciling'
    | 'settled'
    | 'rejected'
    | 'cancelled'
    | 'failed'
    | 'rolled_back'
    | 'expired';

export type TreasuryDecisionType =
    | 'allocation'
    | 'transfer'
    | 'credit_draw'
    | 'credit_repay'
    | 'netting'
    | 'fx_convert'
    | 'invest'
    | 'release_restriction';

export type CashClassification =
    | 'unrestricted'
    | 'restricted'
    | 'pledged'
    | 'escrowed'
    | 'blocked';

export type CapitalBucketType =
    | 'operating'
    | 'payroll_reserve'
    | 'tax_reserve'
    | 'debt_service'
    | 'investment'
    | 'excess';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type ExecutionMode = 'manual' | 'assisted' | 'auto';
export type TimeHorizon = 'today' | '7d' | '30d' | '90d' | '1y';

// Jurisdiction compliance
export type Jurisdiction = 'US' | 'EU' | 'CH' | 'NO' | 'LI' | 'IS' | 'UK' | 'OTHER';
export type ComplianceFramework = 'SOX' | 'MiFID2' | 'PSD2' | 'EMIR' | 'DORA' | 'FINMA' | 'GDPR';

// =============================================================================
// CASH & ACCOUNTS
// =============================================================================

export interface BankAccount {
    id: string;
    name: string;
    bankName: string;
    accountNumber: string;
    iban?: string;
    bic?: string;
    currency: string;
    country: string;
    entityId: string;
    type: 'checking' | 'savings' | 'money_market' | 'custodial' | 'virtual';

    // Balances
    currentBalance: number;
    availableBalance: number;
    pendingCredits: number;
    pendingDebits: number;

    // Classification
    cashClassification: CashClassification;
    restrictionReason?: string;

    // Limits
    overdraftLimit?: number;
    dailyTransferLimit?: number;

    // Status
    isActive: boolean;
    lastSyncAt: string;

    // Compliance
    jurisdiction: Jurisdiction;
    complianceFrameworks: ComplianceFramework[];
}

export interface CashPosition {
    id: string;
    date: string;

    // Aggregated balances
    totalCash: number;
    unrestricted: number;
    restricted: number;
    pledged: number;
    escrowed: number;
    blocked: number;

    // Availability
    grossCash: number;
    reservedCash: number;
    committedCash: number;
    availableCash: number;
    excessCash: number;

    // By dimension
    byCurrency: Record<string, number>;
    byEntity: Record<string, number>;
    byBank: Record<string, number>;
    byJurisdiction: Record<Jurisdiction, number>;

    // Projections
    projections: {
        today: number;
        day7: number;
        day30: number;
        day90: number;
    };

    updatedAt: string;
}

// =============================================================================
// CAPITAL BUCKETS
// =============================================================================

export interface CapitalBucket {
    id: string;
    type: CapitalBucketType;
    name: string;
    description?: string;

    // Targets
    targetAmount: number;
    minimumAmount: number;
    currentAmount: number;

    // Status
    fundingRatio: number; // currentAmount / targetAmount
    status: 'funded' | 'underfunded' | 'overfunded' | 'critical';

    // Rules
    priority: number; // 1 = highest
    currency: string;
    timeHorizon: TimeHorizon;

    // Constraints
    allowedSources: string[]; // account IDs
    autoFundEnabled: boolean;

    // Compliance
    regulatoryRequirement?: string;
    jurisdiction?: Jurisdiction;

    updatedAt: string;
}

// =============================================================================
// CREDIT FACILITIES
// =============================================================================

export interface CreditFacility {
    id: string;
    name: string;
    type: 'credit_line' | 'overdraft' | 'revolving' | 'term_loan' | 'supplier_credit';

    // Counterparty
    bankId: string;
    bankName: string;

    // Amounts
    totalLimit: number;
    drawnAmount: number;
    availableAmount: number;
    currency: string;

    // Terms
    interestRate: number;
    interestType: 'fixed' | 'variable';
    baseRate?: string; // EURIBOR, SOFR, etc.
    spread?: number;

    // Dates
    startDate: string;
    maturityDate: string;
    nextReviewDate?: string;

    // Covenants
    covenants: Covenant[];
    covenantStatus: 'compliant' | 'warning' | 'breach';

    // Draw conditions
    drawConditions?: string[];
    minDrawAmount?: number;
    maxDrawAmount?: number;

    // Compliance
    jurisdiction: Jurisdiction;

    isActive: boolean;
    updatedAt: string;
}

export interface Covenant {
    id: string;
    name: string;
    type: 'financial' | 'operational' | 'reporting';
    metric: string;
    threshold: number;
    operator: 'gte' | 'lte' | 'eq';
    currentValue: number;
    status: 'compliant' | 'warning' | 'breach';
    testFrequency: 'monthly' | 'quarterly' | 'annually';
    nextTestDate: string;
}

// =============================================================================
// TREASURY DECISIONS
// =============================================================================

export interface TreasuryDecision {
    id: string;
    type: TreasuryDecisionType;
    status: TreasuryDecisionStatus;

    // Scope
    entityId: string;
    currency: string;
    accountIds: string[];
    bucketIds?: string[];
    timeWindow: TimeHorizon;

    // Meta
    createdBy: 'user' | 'automation';
    createdById?: string;
    priority: Priority;
    riskClass: RiskLevel;
    executionMode: ExecutionMode;

    // Plan
    plan?: TreasuryPlan;

    // Approval
    requiresApproval: boolean;
    approvalReason?: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;

    // Execution
    scheduledAt?: string;
    executedAt?: string;
    settledAt?: string;

    // Explainability
    rationale: string;
    impactSummary: string;
    risksIdentified: string[];
    alternativesConsidered: AlternativeOption[];

    // Compliance
    complianceChecks: ComplianceCheck[];

    // Audit
    version: number;
    events: TreasuryEvent[];

    createdAt: string;
    updatedAt: string;
}

export interface TreasuryPlan {
    id: string;
    decisionId: string;
    steps: TreasuryPlanStep[];

    // Expected outcomes
    expectedLedgerEvents: string[];
    expectedCashImpact: Record<TimeHorizon, number>;
    expectedRiskDelta: RiskDelta;
    estimatedCost: number;

    status: 'draft' | 'validated' | 'locked' | 'executing' | 'completed' | 'failed';
}

export interface TreasuryPlanStep {
    id: string;
    sequence: number;
    action: string;
    description: string;

    // Amounts
    amount: number;
    currency: string;

    // Accounts
    sourceAccountId?: string;
    targetAccountId?: string;

    // Status
    status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';
    executedAt?: string;
    result?: string;
    errorMessage?: string;

    // Reversibility
    isReversible: boolean;
    compensatingAction?: string;
}

export interface RiskDelta {
    concentrationChange: number;
    fxExposureChange: Record<string, number>;
    covenantImpact: number;
    liquidityRiskChange: number;
}

export interface AlternativeOption {
    description: string;
    expectedOutcome: string;
    reasonNotChosen: string;
    estimatedCost: number;
}

export interface ComplianceCheck {
    framework: ComplianceFramework;
    requirement: string;
    status: 'passed' | 'failed' | 'warning' | 'not_applicable';
    details?: string;
}

// =============================================================================
// EVENTS
// =============================================================================

export type TreasuryEventType =
    | 'decision_created'
    | 'decision_updated'
    | 'validation_started'
    | 'validation_passed'
    | 'validation_failed'
    | 'evaluation_started'
    | 'plan_generated'
    | 'plan_updated'
    | 'approval_required'
    | 'approved'
    | 'rejected'
    | 'scheduled'
    | 'execution_started'
    | 'execution_step_succeeded'
    | 'execution_step_failed'
    | 'execution_completed'
    | 'reconciliation_started'
    | 'reconciled'
    | 'settled'
    | 'cancelled'
    | 'expired'
    | 'rollback_started'
    | 'rollback_completed';

export interface TreasuryEvent {
    id: string;
    decisionId: string;
    type: TreasuryEventType;
    timestamp: string;
    actor: 'system' | 'user' | 'automation';
    actorId?: string;
    previousStatus?: TreasuryDecisionStatus;
    newStatus?: TreasuryDecisionStatus;
    details?: string;
    metadata?: Record<string, any>;
}

// =============================================================================
// RISK & EXPOSURE
// =============================================================================

export interface RiskExposure {
    id: string;
    date: string;

    // Counterparty
    byCounterparty: Record<string, { amount: number; limit: number; utilization: number }>;

    // Bank
    byBank: Record<string, { amount: number; limit: number; utilization: number }>;

    // Currency
    byCurrency: Record<string, { exposure: number; limit: number; hedgedAmount: number }>;

    // Maturity
    byMaturity: Record<TimeHorizon, number>;

    // Concentration
    concentrationRisk: {
        largestExposure: { name: string; amount: number; percentage: number };
        top5Percentage: number;
        herfindahlIndex: number;
    };

    // Liquidity stress
    liquidityStress: {
        currentRatio: number;
        quickRatio: number;
        cashCoverageRatio: number;
        stressTestResult: 'pass' | 'warning' | 'fail';
    };

    // Thresholds
    breaches: RiskBreach[];

    updatedAt: string;
}

export interface RiskBreach {
    id: string;
    type: 'counterparty' | 'bank' | 'currency' | 'concentration' | 'liquidity';
    entityName: string;
    currentValue: number;
    threshold: number;
    severity: RiskLevel;
    recommendedAction: string;
    createdAt: string;
}

// =============================================================================
// SCENARIO & STRESS TESTING
// =============================================================================

export type ScenarioType = 'best_case' | 'expected' | 'worst_case' | 'custom';

export interface TreasuryScenario {
    id: string;
    name: string;
    type: ScenarioType;
    description: string;

    // Parameters
    parameters: {
        receivablesDelayDays: number;
        receivablesDefaultRate: number;
        revenueChange: number;
        creditWithdrawal: number;
        fxShock: Record<string, number>;
        inventoryLockup: number;
    };

    // Results
    results?: ScenarioResult;

    isActive: boolean;
    createdAt: string;
}

export interface ScenarioResult {
    scenarioId: string;
    calculatedAt: string;

    // Projections
    cashProjection: Record<TimeHorizon, number>;
    liquidityGap: number;
    gapTiming?: string;

    // Impacts
    impactOnBuckets: Record<CapitalBucketType, number>;
    impactOnCovenants: { name: string; projectedValue: number; status: string }[];

    // Mitigations
    mitigationActions: string[];

    overallRisk: RiskLevel;
}

// =============================================================================
// NETTING
// =============================================================================

export interface NettingOpportunity {
    id: string;
    type: 'receivable_payable' | 'intercompany' | 'same_counterparty';

    // Parties
    counterpartyId: string;
    counterpartyName: string;

    // Items
    receivableIds: string[];
    payableIds: string[];

    // Amounts
    grossReceivable: number;
    grossPayable: number;
    netAmount: number;
    currency: string;

    // Savings
    cashSaved: number;
    fxSaved: number;

    // Status
    status: 'identified' | 'proposed' | 'approved' | 'executed';

    createdAt: string;
}

// =============================================================================
// TREASURY SUMMARY
// =============================================================================

export interface TreasurySummary {
    // Cash Position
    totalCash: number;
    availableCash: number;
    restrictedCash: number;

    // Buckets
    bucketsFunded: number;
    bucketsUnderfunded: number;
    totalBucketDeficit: number;

    // Credit
    totalCreditAvailable: number;
    totalCreditUsed: number;
    creditUtilization: number;

    // Risk
    overallRisk: RiskLevel;
    activeBreaches: number;
    covenantStatus: 'compliant' | 'warning' | 'breach';

    // Pending
    pendingDecisions: number;
    pendingApprovals: number;

    // Netting
    nettingOpportunities: number;
    potentialSavings: number;

    // Projections
    expectedCashIn7d: number;
    expectedCashOut7d: number;
    netCashFlow7d: number;

    // Compliance
    complianceStatus: 'compliant' | 'review_needed' | 'non_compliant';

    lastUpdated: string;
}

// =============================================================================
// VALID STATE TRANSITIONS
// =============================================================================

export const VALID_DECISION_TRANSITIONS: Record<TreasuryDecisionStatus, TreasuryDecisionStatus[]> = {
    draft: ['validating', 'cancelled'],
    validating: ['evaluating', 'rejected'],
    evaluating: ['proposed', 'failed'],
    proposed: ['awaiting_approval', 'approved', 'cancelled', 'expired'],
    awaiting_approval: ['approved', 'rejected'],
    approved: ['scheduled', 'executing', 'cancelled', 'expired'],
    scheduled: ['executing', 'cancelled', 'expired'],
    executing: ['executed', 'failed'],
    executed: ['reconciling'],
    reconciling: ['settled', 'failed'],
    settled: [],
    rejected: [],
    cancelled: [],
    failed: ['executing', 'rolled_back'], // retry or rollback
    rolled_back: [],
    expired: [],
};

export const TERMINAL_STATES: TreasuryDecisionStatus[] = ['settled', 'rejected', 'cancelled', 'rolled_back', 'expired'];