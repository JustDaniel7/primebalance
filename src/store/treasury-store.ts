import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    VALID_DECISION_TRANSITIONS,
    TERMINAL_STATES,
} from '@/types/treasury';
import type {
    TreasuryDecision,
    TreasuryDecisionStatus,
    TreasuryDecisionType,
    TreasuryEvent,
    TreasuryEventType,
    TreasurySummary,
    BankAccount,
    CashPosition,
    CapitalBucket,
    CapitalBucketType,
    CreditFacility,
    RiskExposure,
    RiskBreach,
    TreasuryScenario,
    ScenarioResult,
    NettingOpportunity,
    TimeHorizon,
    Jurisdiction,
    CashClassification,
    Priority,
    ExecutionMode,
} from '@/types/treasury';

// =============================================================================
// LOCAL TYPE ALIAS
// =============================================================================

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// =============================================================================
// API MAPPING
// =============================================================================

function mapApiToAccount(api: any): BankAccount {
    return {
        id: api.id,
        name: api.name,
        bankName: api.bankName,
        accountNumber: api.accountNumber,
        iban: api.iban,
        bic: api.bic,
        currency: api.currency || 'EUR',
        country: api.country || 'DE',
        entityId: api.entityId || api.organizationId,
        type: api.type || 'checking',
        currentBalance: Number(api.currentBalance) || 0,
        availableBalance: Number(api.availableBalance) || 0,
        pendingCredits: Number(api.pendingCredits) || 0,
        pendingDebits: Number(api.pendingDebits) || 0,
        cashClassification: api.cashClassification || 'unrestricted',
        restrictionReason: api.restrictionReason,
        overdraftLimit: api.overdraftLimit,
        dailyTransferLimit: api.dailyTransferLimit,
        isActive: api.isActive ?? true,
        lastSyncAt: api.lastSyncAt || api.updatedAt || new Date().toISOString(),
        jurisdiction: api.jurisdiction || 'EU',
        complianceFrameworks: api.complianceFrameworks || [],
    };
}

function mapApiToBucket(api: any): CapitalBucket {
    const currentAmount = Number(api.currentAmount) || 0;
    const targetAmount = Number(api.targetAmount) || 1; // Prevent division by zero
    const fundingRatio = targetAmount > 0 ? currentAmount / targetAmount : 0;

    return {
        id: api.id,
        name: api.name,
        type: api.type || 'operating',
        description: api.description,
        currency: api.currency || 'EUR',
        targetAmount,
        currentAmount,
        minimumAmount: Number(api.minimumAmount) || 0,
        status: api.fundingStatus || (fundingRatio >= 1 ? 'funded' : fundingRatio >= 0.5 ? 'underfunded' : 'critical'),
        fundingRatio,
        priority: api.priority || 5,
        timeHorizon: api.timeHorizon || '30d',
        allowedSources: api.allowedSources || [],
        autoFundEnabled: api.autoFund ?? api.autoFundEnabled ?? false,
        regulatoryRequirement: api.regulatoryRequirement,
        jurisdiction: api.jurisdiction,
        updatedAt: api.updatedAt || new Date().toISOString(),
    };
}

function mapApiToFacility(api: any): CreditFacility {
    const totalLimit = Number(api.facilityLimit || api.totalLimit) || 0;
    const drawnAmount = Number(api.drawnAmount) || 0;
    const availableAmount = Number(api.availableAmount) || (totalLimit - drawnAmount);

    return {
        id: api.id,
        name: api.name,
        type: api.type || 'revolving',
        bankId: api.bankId || api.id,
        bankName: api.bankName || api.lenderName || 'Unknown Bank',
        currency: api.currency || 'EUR',
        totalLimit,
        drawnAmount,
        availableAmount,
        interestRate: Number(api.interestRate) || 0,
        interestType: api.interestType || 'fixed',
        baseRate: api.baseRate,
        spread: api.spread,
        startDate: api.startDate || api.createdAt || new Date().toISOString(),
        maturityDate: api.maturityDate || api.expiryDate || new Date().toISOString(),
        nextReviewDate: api.nextReviewDate,
        covenantStatus: api.covenantStatus || 'compliant',
        covenants: api.covenants || [],
        jurisdiction: api.jurisdiction || 'EU',
        isActive: api.isActive ?? (api.status === 'active'),
        updatedAt: api.updatedAt || new Date().toISOString(),
    };
}

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface TreasuryState {
    accounts: BankAccount[];
    cashPosition: CashPosition | null;
    buckets: CapitalBucket[];
    facilities: CreditFacility[];
    decisions: TreasuryDecision[];
    events: TreasuryEvent[];
    riskExposure: RiskExposure | null;
    scenarios: TreasuryScenario[];
    nettingOpportunities: NettingOpportunity[];
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;

    // API
    fetchTreasury: () => Promise<void>;
    fetchAccounts: () => Promise<void>;

    // Account Management
    addAccount: (account: Omit<BankAccount, 'id' | 'lastSyncAt'>) => BankAccount;
    updateAccount: (id: string, updates: Partial<BankAccount>) => void;
    syncAccountBalance: (id: string, balance: number, availableBalance: number) => void;

    // Cash Position
    recalculateCashPosition: () => void;
    getCashByClassification: () => Record<string, number>;

    // Capital Buckets
    updateBucket: (id: string, updates: Partial<CapitalBucket>) => void;
    allocateToBucket: (bucketId: string, amount: number, sourceAccountId: string) => boolean;
    rebalanceBuckets: () => TreasuryDecision | null;

    // Credit Facilities
    addFacility: (facility: Omit<CreditFacility, 'id' | 'availableAmount' | 'updatedAt'>) => CreditFacility;
    updateFacility: (id: string, updates: Partial<CreditFacility>) => void;
    drawFromFacility: (facilityId: string, amount: number) => TreasuryDecision | null;
    repayFacility: (facilityId: string, amount: number) => TreasuryDecision | null;

    // Treasury Decisions
    createDecision: (data: Omit<TreasuryDecision, 'id' | 'status' | 'version' | 'events' | 'createdAt' | 'updatedAt'>) => TreasuryDecision;
    transitionDecision: (id: string, newStatus: TreasuryDecisionStatus, actor: 'user' | 'system' | 'automation', details?: string) => boolean;
    approveDecision: (id: string, approverId: string) => boolean;
    rejectDecision: (id: string, reason: string) => boolean;
    executeDecision: (id: string) => boolean;
    cancelDecision: (id: string) => boolean;

    // Events
    recordEvent: (event: Omit<TreasuryEvent, 'id' | 'timestamp'>) => TreasuryEvent;
    getEventsByDecision: (decisionId: string) => TreasuryEvent[];

    // Risk
    recalculateRiskExposure: () => void;
    checkRiskBreaches: () => RiskBreach[];
    getRiskLevel: () => RiskLevel;

    // Scenarios
    createScenario: (scenario: Omit<TreasuryScenario, 'id' | 'createdAt'>) => TreasuryScenario;
    runScenario: (scenarioId: string) => ScenarioResult;

    // Netting
    identifyNettingOpportunities: () => NettingOpportunity[];
    executeNetting: (opportunityId: string) => TreasuryDecision | null;

    // Analytics
    getSummary: () => TreasurySummary;
    getCashForecast: (days: number) => { date: string; inflow: number; outflow: number; balance: number }[];
    getPendingApprovals: () => TreasuryDecision[];
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useTreasuryStore = create<TreasuryState>()(
    persist(
        (set, get) => ({
            accounts: [],
            cashPosition: null,
            buckets: [],
            facilities: [],
            decisions: [],
            events: [],
            riskExposure: null,
            scenarios: [],
            nettingOpportunities: [],
            isLoading: false,
            error: null,
            isInitialized: false,

            // =================================================================
            // API
            // =================================================================

            fetchTreasury: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch('/api/treasury');
                    if (!response.ok) throw new Error('Failed to fetch treasury data');
                    const data = await response.json();

                    set({
                        accounts: (data.accounts || []).map(mapApiToAccount),
                        buckets: (data.buckets || []).map(mapApiToBucket),
                        facilities: (data.facilities || []).map(mapApiToFacility),
                        decisions: data.decisions || get().decisions,
                        isLoading: false,
                        isInitialized: true,
                    });

                    get().recalculateCashPosition();
                } catch (error) {
                    console.error('Failed to fetch treasury:', error);
                    set({ error: (error as Error).message, isLoading: false, isInitialized: true });
                }
            },

            fetchAccounts: async () => {
                try {
                    const response = await fetch('/api/treasury/accounts');
                    if (!response.ok) return;
                    const data = await response.json();
                    set({ accounts: (data.accounts || data || []).map(mapApiToAccount) });
                    get().recalculateCashPosition();
                } catch (error) {
                    console.error('Failed to fetch accounts:', error);
                }
            },

            // =================================================================
            // ACCOUNT MANAGEMENT
            // =================================================================

            addAccount: (accountData) => {
                const newAccount: BankAccount = {
                    ...accountData,
                    id: `acc-${Date.now()}`,
                    lastSyncAt: new Date().toISOString(),
                };
                set((state) => ({
                    accounts: [...state.accounts, newAccount],
                }));
                get().recalculateCashPosition();

                fetch('/api/treasury/accounts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(accountData),
                }).catch(console.error);

                return newAccount;
            },

            updateAccount: (id, updates) => {
                set((state) => ({
                    accounts: state.accounts.map((a) =>
                        a.id === id ? { ...a, ...updates } : a
                    ),
                }));
                get().recalculateCashPosition();

                fetch(`/api/treasury/accounts/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates),
                }).catch(console.error);
            },

            syncAccountBalance: (id, balance, availableBalance) => {
                set((state) => ({
                    accounts: state.accounts.map((a) =>
                        a.id === id
                            ? {
                                  ...a,
                                  currentBalance: balance,
                                  availableBalance,
                                  lastSyncAt: new Date().toISOString(),
                              }
                            : a
                    ),
                }));
                get().recalculateCashPosition();
            },

            // =================================================================
            // CASH POSITION
            // =================================================================

            recalculateCashPosition: () => {
                const { accounts } = get();
                const activeAccounts = accounts.filter((a) => a.isActive);

                const totalCash = activeAccounts.reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
                const unrestricted = activeAccounts
                    .filter((a) => a.cashClassification === 'unrestricted')
                    .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
                const restricted = activeAccounts
                    .filter((a) => a.cashClassification === 'restricted')
                    .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
                const pledged = activeAccounts
                    .filter((a) => a.cashClassification === 'pledged')
                    .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);

                const byCurrency: Record<string, number> = {};
                const byEntity: Record<string, number> = {};
                const byBank: Record<string, number> = {};

                activeAccounts.forEach((a) => {
                    byCurrency[a.currency] = (byCurrency[a.currency] || 0) + Number(a.currentBalance || 0);
                    byEntity[a.entityId] = (byEntity[a.entityId] || 0) + Number(a.currentBalance || 0);
                    byBank[a.bankName] = (byBank[a.bankName] || 0) + Number(a.currentBalance || 0);
                });

                const cashPosition: CashPosition = {
                    id: 'cp-current',
                    date: new Date().toISOString().split('T')[0],
                    totalCash,
                    unrestricted,
                    restricted,
                    pledged,
                    escrowed: 0,
                    blocked: 0,
                    grossCash: totalCash,
                    reservedCash: restricted + pledged,
                    committedCash: 0,
                    availableCash: unrestricted,
                    excessCash: Math.max(0, unrestricted - 500000),
                    byCurrency,
                    byEntity,
                    byBank,
                    byJurisdiction: {} as Record<Jurisdiction, number>,
                    projections: {
                        today: totalCash,
                        day7: totalCash,
                        day30: totalCash,
                        day90: totalCash,
                    },
                    updatedAt: new Date().toISOString(),
                };

                set({ cashPosition });
            },

            getCashByClassification: () => {
                const { accounts } = get();
                const result: Record<string, number> = {};

                accounts.filter((a) => a.isActive).forEach((a) => {
                    result[a.cashClassification] =
                        (result[a.cashClassification] || 0) + a.currentBalance;
                });

                return result;
            },

            // =================================================================
            // CAPITAL BUCKETS
            // =================================================================

            updateBucket: (id, updates) => {
                set((state) => ({
                    buckets: state.buckets.map((b) => {
                        if (b.id !== id) return b;
                        const updated = { ...b, ...updates, updatedAt: new Date().toISOString() };
                        updated.fundingRatio = updated.currentAmount / updated.targetAmount;
                        if (updated.fundingRatio >= 1) updated.status = 'funded';
                        else if (updated.fundingRatio < updated.minimumAmount / updated.targetAmount)
                            updated.status = 'critical';
                        else updated.status = 'underfunded';
                        return updated;
                    }),
                }));
            },

            allocateToBucket: (bucketId, amount, sourceAccountId) => {
                const bucket = get().buckets.find((b) => b.id === bucketId);
                const account = get().accounts.find((a) => a.id === sourceAccountId);

                if (!bucket || !account) return false;
                if (account.availableBalance < amount) return false;

                get().updateAccount(sourceAccountId, {
                    currentBalance: account.currentBalance - amount,
                    availableBalance: account.availableBalance - amount,
                });

                get().updateBucket(bucketId, {
                    currentAmount: bucket.currentAmount + amount,
                });

                return true;
            },

            rebalanceBuckets: () => {
                const underfunded = get().buckets.filter(
                    (b) => b.status === 'underfunded' || b.status === 'critical'
                );
                if (underfunded.length === 0) return null;

                const highestPriority = underfunded.sort((a, b) => a.priority - b.priority)[0];
                const deficit = highestPriority.targetAmount - highestPriority.currentAmount;

                return get().createDecision({
                    type: 'allocation',
                    entityId: 'entity-001',
                    currency: 'EUR',
                    accountIds: highestPriority.allowedSources,
                    bucketIds: [highestPriority.id],
                    timeWindow: 'today',
                    createdBy: 'automation',
                    priority: highestPriority.status === 'critical' ? 'critical' : 'high',
                    riskClass: 'low',
                    executionMode: 'assisted',
                    requiresApproval: deficit > 50000,
                    rationale: `${highestPriority.name} is ${highestPriority.status}. Need to allocate ${deficit} EUR.`,
                    impactSummary: `Will bring ${highestPriority.name} to full funding.`,
                    risksIdentified: ['Reduces operating cash'],
                    alternativesConsidered: [],
                    complianceChecks: [],
                });
            },

            // =================================================================
            // CREDIT FACILITIES
            // =================================================================

            addFacility: (facilityData) => {
                const newFacility: CreditFacility = {
                    ...facilityData,
                    id: `fac-${Date.now()}`,
                    availableAmount: facilityData.totalLimit - facilityData.drawnAmount,
                    updatedAt: new Date().toISOString(),
                };
                set((state) => ({
                    facilities: [...state.facilities, newFacility],
                }));
                return newFacility;
            },

            updateFacility: (id, updates) => {
                set((state) => ({
                    facilities: state.facilities.map((f) => {
                        if (f.id !== id) return f;
                        const updated = { ...f, ...updates, updatedAt: new Date().toISOString() };
                        updated.availableAmount = updated.totalLimit - updated.drawnAmount;
                        return updated;
                    }),
                }));
            },

            drawFromFacility: (facilityId, amount) => {
                const facility = get().facilities.find((f) => f.id === facilityId);
                if (!facility || amount > facility.availableAmount) return null;

                return get().createDecision({
                    type: 'credit_draw',
                    entityId: 'entity-001',
                    currency: facility.currency,
                    accountIds: [],
                    timeWindow: 'today',
                    createdBy: 'user',
                    priority: 'medium',
                    riskClass: 'medium',
                    executionMode: 'manual',
                    requiresApproval: amount > 100000,
                    rationale: `Draw ${amount} ${facility.currency} from ${facility.name}.`,
                    impactSummary: `Credit utilization will increase to ${Math.round(((facility.drawnAmount + amount) / facility.totalLimit) * 100)}%.`,
                    risksIdentified: ['Increases interest expense', 'Reduces credit headroom'],
                    alternativesConsidered: [],
                    complianceChecks: [],
                });
            },

            repayFacility: (facilityId, amount) => {
                const facility = get().facilities.find((f) => f.id === facilityId);
                if (!facility || amount > facility.drawnAmount) return null;

                return get().createDecision({
                    type: 'credit_repay',
                    entityId: 'entity-001',
                    currency: facility.currency,
                    accountIds: [],
                    timeWindow: 'today',
                    createdBy: 'user',
                    priority: 'medium',
                    riskClass: 'low',
                    executionMode: 'manual',
                    requiresApproval: amount > 100000,
                    rationale: `Repay ${amount} ${facility.currency} to ${facility.name}.`,
                    impactSummary: `Credit utilization will decrease to ${Math.round(((facility.drawnAmount - amount) / facility.totalLimit) * 100)}%.`,
                    risksIdentified: ['Reduces available cash'],
                    alternativesConsidered: [],
                    complianceChecks: [],
                });
            },

            // =================================================================
            // TREASURY DECISIONS
            // =================================================================

            createDecision: (data) => {
                const now = new Date().toISOString();
                const newDecision: TreasuryDecision = {
                    ...data,
                    id: `dec-${Date.now()}`,
                    status: 'draft',
                    version: 1,
                    events: [],
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => ({
                    decisions: [...state.decisions, newDecision],
                }));

                get().recordEvent({
                    decisionId: newDecision.id,
                    type: 'decision_created',
                    actor: data.createdBy === 'user' ? 'user' : 'automation',
                    newStatus: 'draft',
                });

                // Auto-advance through validation
                get().transitionDecision(newDecision.id, 'validating', 'system');
                get().transitionDecision(newDecision.id, 'evaluating', 'system');
                get().transitionDecision(newDecision.id, 'proposed', 'system');

                if (data.requiresApproval) {
                    get().transitionDecision(newDecision.id, 'awaiting_approval', 'system');
                }

                return get().decisions.find((d) => d.id === newDecision.id)!;
            },

            transitionDecision: (id, newStatus, actor, details) => {
                const decision = get().decisions.find((d) => d.id === id);
                if (!decision) return false;

                const validTransitions = VALID_DECISION_TRANSITIONS[decision.status];
                if (!validTransitions.includes(newStatus)) {
                    console.warn(`Invalid transition from ${decision.status} to ${newStatus}`);
                    return false;
                }

                const previousStatus = decision.status;

                set((state) => ({
                    decisions: state.decisions.map((d) =>
                        d.id === id
                            ? {
                                  ...d,
                                  status: newStatus,
                                  version: d.version + 1,
                                  updatedAt: new Date().toISOString(),
                              }
                            : d
                    ),
                }));

                get().recordEvent({
                    decisionId: id,
                    type: 'decision_updated',
                    actor,
                    previousStatus,
                    newStatus,
                    details,
                });

                return true;
            },

            approveDecision: (id, approverId) => {
                const decision = get().decisions.find((d) => d.id === id);
                if (!decision || decision.status !== 'awaiting_approval') return false;

                set((state) => ({
                    decisions: state.decisions.map((d) =>
                        d.id === id
                            ? {
                                  ...d,
                                  approvedBy: approverId,
                                  approvedAt: new Date().toISOString(),
                              }
                            : d
                    ),
                }));

                get().transitionDecision(id, 'approved', 'user', `Approved by ${approverId}`);
                return true;
            },

            rejectDecision: (id, reason) => {
                const decision = get().decisions.find((d) => d.id === id);
                if (!decision || decision.status !== 'awaiting_approval') return false;

                set((state) => ({
                    decisions: state.decisions.map((d) =>
                        d.id === id ? { ...d, rejectionReason: reason } : d
                    ),
                }));

                get().transitionDecision(id, 'rejected', 'user', reason);
                return true;
            },

            executeDecision: (id) => {
                const decision = get().decisions.find((d) => d.id === id);
                if (!decision || decision.status !== 'approved') return false;

                get().transitionDecision(id, 'executing', 'system');
                get().transitionDecision(id, 'executed', 'system');

                set((state) => ({
                    decisions: state.decisions.map((d) =>
                        d.id === id ? { ...d, executedAt: new Date().toISOString() } : d
                    ),
                }));

                return true;
            },

            cancelDecision: (id) => {
                return get().transitionDecision(id, 'cancelled', 'user', 'Cancelled by user');
            },

            // =================================================================
            // EVENTS
            // =================================================================

            recordEvent: (eventData) => {
                const newEvent: TreasuryEvent = {
                    ...eventData,
                    id: `evt-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                };
                set((state) => ({
                    events: [...state.events, newEvent],
                }));
                return newEvent;
            },

            getEventsByDecision: (decisionId) => {
                return get()
                    .events.filter((e) => e.decisionId === decisionId)
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            },

            // =================================================================
            // RISK
            // =================================================================

            recalculateRiskExposure: () => {
                // Placeholder for risk calculation
            },

            checkRiskBreaches: () => {
                const breaches: RiskBreach[] = [];
                const { facilities } = get();

                facilities.forEach((f) => {
                    const utilization = f.drawnAmount / f.totalLimit;
                    if (utilization > 0.9) {
                        breaches.push({
                            id: `breach-${f.id}`,
                            type: 'concentration',
                            entityName: f.name,
                            currentValue: utilization * 100,
                            threshold: 90,
                            severity: utilization > 0.95 ? 'critical' : 'high',
                            recommendedAction: 'Reduce credit utilization',
                            createdAt: new Date().toISOString(),
                        });
                    }
                });

                return breaches;
            },

            getRiskLevel: (): RiskLevel => {
                const breaches = get().checkRiskBreaches();
                if (breaches.some((b) => b.severity === 'critical')) return 'critical';
                if (breaches.some((b) => b.severity === 'high')) return 'high';
                if (breaches.length > 0) return 'medium';
                return 'low';
            },

            // =================================================================
            // SCENARIOS
            // =================================================================

            createScenario: (scenarioData) => {
                const newScenario: TreasuryScenario = {
                    ...scenarioData,
                    id: `scenario-${Date.now()}`,
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({
                    scenarios: [...state.scenarios, newScenario],
                }));
                return newScenario;
            },

            runScenario: (scenarioId) => {
                const scenario = get().scenarios.find((s) => s.id === scenarioId);
                const { cashPosition } = get();

                const baseAmount = cashPosition?.totalCash || 1000000;

                const result: ScenarioResult = {
                    scenarioId,
                    calculatedAt: new Date().toISOString(),
                    cashProjection: {
                        today: baseAmount,
                        '7d': baseAmount * (1 + (scenario?.parameters.revenueChange || 0) * 0.02),
                        '30d': baseAmount * (1 + (scenario?.parameters.revenueChange || 0) * 0.1),
                        '90d': baseAmount * (1 + (scenario?.parameters.revenueChange || 0) * 0.25),
                        '1y': baseAmount * (1 + (scenario?.parameters.revenueChange || 0)),
                    },
                    liquidityGap: 0,
                    impactOnBuckets: {} as Record<CapitalBucketType, number>,
                    impactOnCovenants: [],
                    mitigationActions: [],
                    overallRisk: 'low',
                };

                return result;
            },

            // =================================================================
            // NETTING
            // =================================================================

            identifyNettingOpportunities: () => {
                return get().nettingOpportunities;
            },

            executeNetting: (opportunityId) => {
                const opportunity = get().nettingOpportunities.find((o) => o.id === opportunityId);
                if (!opportunity) return null;

                return get().createDecision({
                    type: 'netting',
                    entityId: 'entity-001',
                    currency: opportunity.currency,
                    accountIds: [],
                    timeWindow: 'today',
                    createdBy: 'user',
                    priority: 'medium',
                    riskClass: 'low',
                    executionMode: 'manual',
                    requiresApproval: opportunity.netAmount > 50000,
                    rationale: `Net ${opportunity.counterpartyName}. Saves ${opportunity.cashSaved} in cash.`,
                    impactSummary: `Net settlement of ${opportunity.netAmount} ${opportunity.currency}.`,
                    risksIdentified: [],
                    alternativesConsidered: [],
                    complianceChecks: [],
                });
            },

            // =================================================================
            // ANALYTICS
            // =================================================================

            getSummary: (): TreasurySummary => {
                const { cashPosition, buckets, facilities, decisions, nettingOpportunities } = get();

                const underfundedBuckets = buckets.filter(
                    (b) => b.status === 'underfunded' || b.status === 'critical'
                );

                const totalCreditAvailable = facilities.reduce((sum, f) => sum + Number(f.availableAmount || 0), 0);
                const totalCreditUsed = facilities.reduce((sum, f) => sum + Number(f.drawnAmount || 0), 0);
                const totalCreditLimit = facilities.reduce((sum, f) => sum + Number(f.totalLimit || 0), 0);

                const pendingDecisions = decisions.filter((d) => !TERMINAL_STATES.includes(d.status));
                const pendingApprovals = decisions.filter((d) => d.status === 'awaiting_approval');

                const covenantIssues = facilities.some((f) => f.covenantStatus !== 'compliant');

                return {
                    totalCash: cashPosition?.totalCash || 0,
                    availableCash: cashPosition?.availableCash || 0,
                    restrictedCash: cashPosition?.restricted || 0,
                    bucketsFunded: buckets.filter((b) => b.status === 'funded' || b.status === 'overfunded').length,
                    bucketsUnderfunded: underfundedBuckets.length,
                    totalBucketDeficit: underfundedBuckets.reduce(
                        (sum, b) => sum + (Number(b.targetAmount || 0) - Number(b.currentAmount || 0)),
                        0
                    ),
                    totalCreditAvailable,
                    totalCreditUsed,
                    creditUtilization: totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0,
                    overallRisk: get().getRiskLevel(),
                    activeBreaches: get().checkRiskBreaches().length,
                    covenantStatus: covenantIssues ? 'warning' : 'compliant',
                    pendingDecisions: pendingDecisions.length,
                    pendingApprovals: pendingApprovals.length,
                    nettingOpportunities: nettingOpportunities.filter((o) => o.status === 'identified').length,
                    potentialSavings: nettingOpportunities
                        .filter((o) => o.status === 'identified')
                        .reduce((sum, o) => sum + Number(o.cashSaved || 0), 0),
                    expectedCashIn7d: 0,
                    expectedCashOut7d: 0,
                    netCashFlow7d: 0,
                    complianceStatus: 'compliant',
                    lastUpdated: new Date().toISOString(),
                };
            },

            getCashForecast: (days) => {
                const { cashPosition } = get();
                const forecast: { date: string; inflow: number; outflow: number; balance: number }[] = [];
                const baseBalance = cashPosition?.totalCash || 0;
                const msPerDay = 1000 * 60 * 60 * 24;

                for (let i = 0; i <= days; i++) {
                    const date = new Date(Date.now() + i * msPerDay);
                    forecast.push({
                        date: date.toISOString().split('T')[0],
                        inflow: 0,
                        outflow: 0,
                        balance: baseBalance,
                    });
                }

                return forecast;
            },

            getPendingApprovals: () => {
                return get().decisions.filter((d) => d.status === 'awaiting_approval');
            },
        }),
        {
            name: 'primebalance-treasury',
            partialize: (state) => ({
                accounts: state.accounts,
                buckets: state.buckets,
                facilities: state.facilities,
                decisions: state.decisions,
                events: state.events,
                scenarios: state.scenarios,
                nettingOpportunities: state.nettingOpportunities,
            }),
        }
    )
);