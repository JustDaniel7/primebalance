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
// DEMO DATA GENERATORS
// =============================================================================

function generateDemoAccounts(): BankAccount[] {
    return [
        {
            id: 'acc-001',
            name: 'Operating Account EUR',
            bankName: 'Deutsche Bank',
            accountNumber: 'DE89370400440532013000',
            iban: 'DE89370400440532013000',
            bic: 'DEUTDEDB',
            currency: 'EUR',
            country: 'DE',
            entityId: 'entity-001',
            type: 'checking',
            currentBalance: 850000,
            availableBalance: 820000,
            pendingCredits: 45000,
            pendingDebits: 15000,
            cashClassification: 'unrestricted',
            overdraftLimit: 100000,
            dailyTransferLimit: 500000,
            isActive: true,
            lastSyncAt: new Date().toISOString(),
            jurisdiction: 'EU',
            complianceFrameworks: ['PSD2', 'GDPR'],
        },
        {
            id: 'acc-002',
            name: 'Operating Account USD',
            bankName: 'JPMorgan Chase',
            accountNumber: '123456789012',
            currency: 'USD',
            country: 'US',
            entityId: 'entity-001',
            type: 'checking',
            currentBalance: 450000,
            availableBalance: 430000,
            pendingCredits: 25000,
            pendingDebits: 5000,
            cashClassification: 'unrestricted',
            dailyTransferLimit: 250000,
            isActive: true,
            lastSyncAt: new Date().toISOString(),
            jurisdiction: 'US',
            complianceFrameworks: ['SOX'],
        },
        {
            id: 'acc-003',
            name: 'Tax Reserve Account',
            bankName: 'Deutsche Bank',
            accountNumber: 'DE89370400440532013001',
            iban: 'DE89370400440532013001',
            currency: 'EUR',
            country: 'DE',
            entityId: 'entity-001',
            type: 'savings',
            currentBalance: 250000,
            availableBalance: 250000,
            pendingCredits: 0,
            pendingDebits: 0,
            cashClassification: 'restricted',
            restrictionReason: 'Reserved for quarterly tax payments',
            isActive: true,
            lastSyncAt: new Date().toISOString(),
            jurisdiction: 'EU',
            complianceFrameworks: ['PSD2', 'GDPR'],
        },
    ];
}

function generateDemoBuckets(): CapitalBucket[] {
    return [
        {
            id: 'bucket-001',
            type: 'operating',
            name: 'Operating Cash',
            description: 'Day-to-day operational expenses',
            targetAmount: 500000,
            minimumAmount: 200000,
            currentAmount: 450000,
            fundingRatio: 0.9,
            status: 'funded',
            priority: 1,
            currency: 'EUR',
            timeHorizon: 'today',
            allowedSources: ['acc-001', 'acc-002'],
            autoFundEnabled: true,
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'bucket-002',
            type: 'payroll_reserve',
            name: 'Payroll Reserve',
            description: 'Monthly payroll obligations',
            targetAmount: 300000,
            minimumAmount: 280000,
            currentAmount: 300000,
            fundingRatio: 1.0,
            status: 'funded',
            priority: 1,
            currency: 'EUR',
            timeHorizon: '30d',
            allowedSources: ['acc-001'],
            autoFundEnabled: true,
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'bucket-003',
            type: 'tax_reserve',
            name: 'Tax Reserve',
            description: 'Quarterly tax payments',
            targetAmount: 250000,
            minimumAmount: 200000,
            currentAmount: 250000,
            fundingRatio: 1.0,
            status: 'funded',
            priority: 2,
            currency: 'EUR',
            timeHorizon: '90d',
            allowedSources: ['acc-003'],
            autoFundEnabled: false,
            regulatoryRequirement: 'Quarterly VAT and corporate tax',
            jurisdiction: 'EU',
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'bucket-004',
            type: 'debt_service',
            name: 'Debt Service Reserve',
            description: 'Loan repayments and interest',
            targetAmount: 150000,
            minimumAmount: 100000,
            currentAmount: 80000,
            fundingRatio: 0.53,
            status: 'underfunded',
            priority: 2,
            currency: 'EUR',
            timeHorizon: '30d',
            allowedSources: ['acc-001'],
            autoFundEnabled: true,
            updatedAt: new Date().toISOString(),
        },
    ];
}

function generateDemoFacilities(): CreditFacility[] {
    return [
        {
            id: 'fac-001',
            name: 'Revolving Credit Facility',
            type: 'revolving',
            bankId: 'bank-001',
            bankName: 'Deutsche Bank',
            totalLimit: 500000,
            drawnAmount: 100000,
            availableAmount: 400000,
            currency: 'EUR',
            interestRate: 4.5,
            interestType: 'variable',
            baseRate: 'EURIBOR',
            spread: 2.0,
            startDate: '2024-01-01',
            maturityDate: '2026-12-31',
            nextReviewDate: '2025-06-30',
            covenants: [
                {
                    id: 'cov-001',
                    name: 'Current Ratio',
                    type: 'financial',
                    metric: 'current_ratio',
                    threshold: 1.5,
                    operator: 'gte',
                    currentValue: 2.1,
                    status: 'compliant',
                    testFrequency: 'quarterly',
                    nextTestDate: '2025-03-31',
                },
                {
                    id: 'cov-002',
                    name: 'Debt-to-EBITDA',
                    type: 'financial',
                    metric: 'debt_to_ebitda',
                    threshold: 3.0,
                    operator: 'lte',
                    currentValue: 1.8,
                    status: 'compliant',
                    testFrequency: 'quarterly',
                    nextTestDate: '2025-03-31',
                },
            ],
            covenantStatus: 'compliant',
            minDrawAmount: 10000,
            jurisdiction: 'EU',
            isActive: true,
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'fac-002',
            name: 'Overdraft Facility',
            type: 'overdraft',
            bankId: 'bank-001',
            bankName: 'Deutsche Bank',
            totalLimit: 100000,
            drawnAmount: 0,
            availableAmount: 100000,
            currency: 'EUR',
            interestRate: 8.0,
            interestType: 'variable',
            startDate: '2024-01-01',
            maturityDate: '2025-12-31',
            covenants: [],
            covenantStatus: 'compliant',
            jurisdiction: 'EU',
            isActive: true,
            updatedAt: new Date().toISOString(),
        },
    ];
}

function generateDemoDecisions(): TreasuryDecision[] {
    return [
        {
            id: 'dec-001',
            type: 'allocation',
            status: 'awaiting_approval',
            entityId: 'entity-001',
            currency: 'EUR',
            accountIds: ['acc-001'],
            bucketIds: ['bucket-004'],
            timeWindow: 'today',
            createdBy: 'automation',
            priority: 'high',
            riskClass: 'low',
            executionMode: 'assisted',
            requiresApproval: true,
            approvalReason: 'Amount exceeds auto-approval threshold',
            rationale: 'Debt service bucket is underfunded. Allocate 70,000 EUR to meet minimum reserve.',
            impactSummary: 'Brings debt service reserve to 100% of minimum requirement.',
            risksIdentified: ['Reduces operating cash flexibility'],
            alternativesConsidered: [
                {
                    description: 'Draw from credit facility',
                    expectedOutcome: 'Maintain operating cash',
                    reasonNotChosen: 'Higher cost due to interest',
                    estimatedCost: 3150,
                },
            ],
            complianceChecks: [],
            version: 1,
            events: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];
}

function generateDemoScenarios(): TreasuryScenario[] {
    return [
        {
            id: 'scenario-001',
            name: 'Base Case',
            type: 'expected',
            description: 'Normal operating conditions',
            parameters: {
                receivablesDelayDays: 5,
                receivablesDefaultRate: 0.02,
                revenueChange: 0,
                creditWithdrawal: 0,
                fxShock: {},
                inventoryLockup: 0,
            },
            isActive: true,
            createdAt: new Date().toISOString(),
        },
        {
            id: 'scenario-002',
            name: 'Stress Test - Recession',
            type: 'worst_case',
            description: 'Economic downturn scenario',
            parameters: {
                receivablesDelayDays: 30,
                receivablesDefaultRate: 0.15,
                revenueChange: -0.25,
                creditWithdrawal: 0.5,
                fxShock: { USD: -0.1 },
                inventoryLockup: 60,
            },
            isActive: true,
            createdAt: new Date().toISOString(),
        },
    ];
}

function generateDemoNetting(): NettingOpportunity[] {
    return [
        {
            id: 'net-001',
            type: 'receivable_payable',
            counterpartyId: 'cp-001',
            counterpartyName: 'TechCorp Solutions GmbH',
            receivableIds: ['rec-001'],
            payableIds: ['pay-001'],
            grossReceivable: 25000,
            grossPayable: 8500,
            netAmount: 16500,
            currency: 'EUR',
            cashSaved: 8500,
            fxSaved: 0,
            status: 'identified',
            createdAt: new Date().toISOString(),
        },
    ];
}

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
            accounts: generateDemoAccounts(),
            cashPosition: null,
            buckets: generateDemoBuckets(),
            facilities: generateDemoFacilities(),
            decisions: generateDemoDecisions(),
            events: [],
            riskExposure: null,
            scenarios: generateDemoScenarios(),
            nettingOpportunities: generateDemoNetting(),
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
                        buckets: data.buckets || get().buckets,
                        facilities: data.facilities || get().facilities,
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

                const totalCash = activeAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
                const unrestricted = activeAccounts
                    .filter((a) => a.cashClassification === 'unrestricted')
                    .reduce((sum, a) => sum + a.currentBalance, 0);
                const restricted = activeAccounts
                    .filter((a) => a.cashClassification === 'restricted')
                    .reduce((sum, a) => sum + a.currentBalance, 0);
                const pledged = activeAccounts
                    .filter((a) => a.cashClassification === 'pledged')
                    .reduce((sum, a) => sum + a.currentBalance, 0);

                const byCurrency: Record<string, number> = {};
                const byEntity: Record<string, number> = {};
                const byBank: Record<string, number> = {};

                activeAccounts.forEach((a) => {
                    byCurrency[a.currency] = (byCurrency[a.currency] || 0) + a.currentBalance;
                    byEntity[a.entityId] = (byEntity[a.entityId] || 0) + a.currentBalance;
                    byBank[a.bankName] = (byBank[a.bankName] || 0) + a.currentBalance;
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

                const totalCreditAvailable = facilities.reduce((sum, f) => sum + f.availableAmount, 0);
                const totalCreditUsed = facilities.reduce((sum, f) => sum + f.drawnAmount, 0);
                const totalCreditLimit = facilities.reduce((sum, f) => sum + f.totalLimit, 0);

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
                        (sum, b) => sum + (b.targetAmount - b.currentAmount),
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
                        .reduce((sum, o) => sum + o.cashSaved, 0),
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