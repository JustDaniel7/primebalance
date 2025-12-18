/* import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
    TreasuryPlan,
    TreasuryPlanStep,
    RiskLevel,
    Priority,
    TimeHorizon,
    Jurisdiction,
    VALID_DECISION_TRANSITIONS,
    TERMINAL_STATES,
} from '@/types/treasury';*/

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
    TreasuryPlan,
    TreasuryPlanStep,
    TimeHorizon,
    Jurisdiction,
} from '@/types/treasury';

// RiskLevel aus treasury umbenennen wegen Konflikt
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// =============================================================================
// TREASURY STORE
// =============================================================================

interface TreasuryState {
    // Data
    accounts: BankAccount[];
    cashPosition: CashPosition | null;
    buckets: CapitalBucket[];
    facilities: CreditFacility[];
    decisions: TreasuryDecision[];
    events: TreasuryEvent[];
    riskExposure: RiskExposure | null;
    scenarios: TreasuryScenario[];
    nettingOpportunities: NettingOpportunity[];

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

// Demo Data
const generateDemoAccounts = (): BankAccount[] => [
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
        currentBalance: 425000,
        availableBalance: 425000,
        pendingCredits: 0,
        pendingDebits: 0,
        cashClassification: 'unrestricted',
        dailyTransferLimit: 1000000,
        isActive: true,
        lastSyncAt: new Date().toISOString(),
        jurisdiction: 'US',
        complianceFrameworks: ['SOX'],
    },
    {
        id: 'acc-003',
        name: 'Tax Reserve Account',
        bankName: 'Commerzbank',
        accountNumber: 'DE12500105170648489890',
        iban: 'DE12500105170648489890',
        bic: 'COBADEFF',
        currency: 'EUR',
        country: 'DE',
        entityId: 'entity-001',
        type: 'savings',
        currentBalance: 180000,
        availableBalance: 0,
        pendingCredits: 0,
        pendingDebits: 0,
        cashClassification: 'restricted',
        restrictionReason: 'Tax reserve - Q4 VAT and Corporate Tax',
        isActive: true,
        lastSyncAt: new Date().toISOString(),
        jurisdiction: 'EU',
        complianceFrameworks: ['GDPR'],
    },
    {
        id: 'acc-004',
        name: 'CHF Account',
        bankName: 'UBS',
        accountNumber: 'CH9300762011623852957',
        iban: 'CH9300762011623852957',
        bic: 'UBSWCHZH',
        currency: 'CHF',
        country: 'CH',
        entityId: 'entity-001',
        type: 'checking',
        currentBalance: 125000,
        availableBalance: 125000,
        pendingCredits: 0,
        pendingDebits: 0,
        cashClassification: 'unrestricted',
        isActive: true,
        lastSyncAt: new Date().toISOString(),
        jurisdiction: 'CH',
        complianceFrameworks: ['FINMA'],
    },
];

const generateDemoBuckets = (): CapitalBucket[] => [
    {
        id: 'bucket-001',
        type: 'operating',
        name: 'Operating Capital',
        description: 'Day-to-day operational expenses',
        targetAmount: 500000,
        minimumAmount: 250000,
        currentAmount: 450000,
        fundingRatio: 0.9,
        status: 'funded',
        priority: 1,
        currency: 'EUR',
        timeHorizon: '30d',
        allowedSources: ['acc-001', 'acc-002'],
        autoFundEnabled: true,
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'bucket-002',
        type: 'payroll_reserve',
        name: 'Payroll Reserve',
        description: '3 months payroll coverage',
        targetAmount: 350000,
        minimumAmount: 200000,
        currentAmount: 320000,
        fundingRatio: 0.91,
        status: 'funded',
        priority: 2,
        currency: 'EUR',
        timeHorizon: '90d',
        allowedSources: ['acc-001'],
        autoFundEnabled: true,
        regulatoryRequirement: 'Labor law compliance',
        jurisdiction: 'EU',
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'bucket-003',
        type: 'tax_reserve',
        name: 'Tax Reserve',
        description: 'VAT, Corporate Tax, Payroll Tax',
        targetAmount: 200000,
        minimumAmount: 150000,
        currentAmount: 180000,
        fundingRatio: 0.9,
        status: 'funded',
        priority: 3,
        currency: 'EUR',
        timeHorizon: '90d',
        allowedSources: ['acc-003'],
        autoFundEnabled: true,
        regulatoryRequirement: 'Tax compliance',
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
        currentAmount: 85000,
        fundingRatio: 0.57,
        status: 'underfunded',
        priority: 4,
        currency: 'EUR',
        timeHorizon: '30d',
        allowedSources: ['acc-001'],
        autoFundEnabled: false,
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'bucket-005',
        type: 'excess',
        name: 'Excess Capital',
        description: 'Available for investment or strategic use',
        targetAmount: 0,
        minimumAmount: 0,
        currentAmount: 245000,
        fundingRatio: 1,
        status: 'overfunded',
        priority: 6,
        currency: 'EUR',
        timeHorizon: '1y',
        allowedSources: ['acc-001', 'acc-002', 'acc-004'],
        autoFundEnabled: false,
        updatedAt: new Date().toISOString(),
    },
];

const generateDemoFacilities = (): CreditFacility[] => [
    {
        id: 'fac-001',
        name: 'Revolving Credit Facility',
        type: 'revolving',
        bankId: 'bank-001',
        bankName: 'Deutsche Bank',
        totalLimit: 500000,
        drawnAmount: 0,
        availableAmount: 500000,
        currency: 'EUR',
        interestRate: 4.5,
        interestType: 'variable',
        baseRate: 'EURIBOR',
        spread: 2.0,
        startDate: '2024-01-01',
        maturityDate: '2026-12-31',
        nextReviewDate: '2025-06-01',
        covenants: [
            {
                id: 'cov-001',
                name: 'Debt Service Coverage Ratio',
                type: 'financial',
                metric: 'DSCR',
                threshold: 1.25,
                operator: 'gte',
                currentValue: 1.8,
                status: 'compliant',
                testFrequency: 'quarterly',
                nextTestDate: '2025-03-31',
            },
            {
                id: 'cov-002',
                name: 'Current Ratio',
                type: 'financial',
                metric: 'Current Ratio',
                threshold: 1.5,
                operator: 'gte',
                currentValue: 2.1,
                status: 'compliant',
                testFrequency: 'quarterly',
                nextTestDate: '2025-03-31',
            },
        ],
        covenantStatus: 'compliant',
        minDrawAmount: 50000,
        jurisdiction: 'EU',
        isActive: true,
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'fac-002',
        name: 'USD Credit Line',
        type: 'credit_line',
        bankId: 'bank-002',
        bankName: 'JPMorgan Chase',
        totalLimit: 300000,
        drawnAmount: 50000,
        availableAmount: 250000,
        currency: 'USD',
        interestRate: 6.5,
        interestType: 'variable',
        baseRate: 'SOFR',
        spread: 1.75,
        startDate: '2024-03-01',
        maturityDate: '2025-03-01',
        covenants: [],
        covenantStatus: 'compliant',
        jurisdiction: 'US',
        isActive: true,
        updatedAt: new Date().toISOString(),
    },
];

const generateDemoDecisions = (): TreasuryDecision[] => [
    {
        id: 'dec-001',
        type: 'allocation',
        status: 'awaiting_approval',
        entityId: 'entity-001',
        currency: 'EUR',
        accountIds: ['acc-001'],
        bucketIds: ['bucket-004'],
        timeWindow: '7d',
        createdBy: 'automation',
        priority: 'high',
        riskClass: 'medium',
        executionMode: 'assisted',
        plan: {
            id: 'plan-001',
            decisionId: 'dec-001',
            steps: [
                {
                    id: 'step-001',
                    sequence: 1,
                    action: 'transfer',
                    description: 'Transfer from Operating to Debt Service Reserve',
                    amount: 65000,
                    currency: 'EUR',
                    sourceAccountId: 'acc-001',
                    targetAccountId: 'acc-001',
                    status: 'pending',
                    isReversible: true,
                },
            ],
            expectedLedgerEvents: ['bucket_allocation'],
            expectedCashImpact: { today: 0, '7d': 0, '30d': 0, '90d': 0, '1y': 0 },
            expectedRiskDelta: { concentrationChange: 0, fxExposureChange: {}, covenantImpact: 0, liquidityRiskChange: -5 },
            estimatedCost: 0,
            status: 'validated',
        },
        requiresApproval: true,
        approvalReason: 'Amount exceeds €50,000 threshold',
        rationale: 'Debt Service Reserve is underfunded at 57%. Upcoming loan payment of €75,000 due in 15 days requires immediate action.',
        impactSummary: 'Will increase Debt Service Reserve funding to 100% of target.',
        risksIdentified: ['Reduces operating buffer temporarily'],
        alternativesConsidered: [
            {
                description: 'Draw from credit facility',
                expectedOutcome: 'Same funding achieved',
                reasonNotChosen: 'Higher cost (interest) and unnecessary given available cash',
                estimatedCost: 1500,
            },
        ],
        complianceChecks: [
            { framework: 'SOX', requirement: 'Dual control for transfers > €50k', status: 'passed', details: 'Approval required' },
        ],
        version: 1,
        events: [],
        createdAt: '2024-12-15T10:00:00Z',
        updatedAt: '2024-12-15T10:00:00Z',
    },
];

const generateDemoScenarios = (): TreasuryScenario[] => [
    {
        id: 'scen-001',
        name: 'Base Case',
        type: 'expected',
        description: 'Expected scenario based on current forecasts',
        parameters: {
            receivablesDelayDays: 5,
            receivablesDefaultRate: 0.02,
            revenueChange: 0,
            creditWithdrawal: 0,
            fxShock: {},
            inventoryLockup: 0,
        },
        isActive: true,
        createdAt: '2024-12-01T10:00:00Z',
    },
    {
        id: 'scen-002',
        name: 'Stress Test - Receivables Delay',
        type: 'worst_case',
        description: 'Major customers delay payments by 30 days',
        parameters: {
            receivablesDelayDays: 30,
            receivablesDefaultRate: 0.05,
            revenueChange: -0.1,
            creditWithdrawal: 0,
            fxShock: {},
            inventoryLockup: 0,
        },
        isActive: true,
        createdAt: '2024-12-01T10:00:00Z',
    },
    {
        id: 'scen-003',
        name: 'Credit Crisis',
        type: 'worst_case',
        description: 'Bank withdraws 50% of credit facilities',
        parameters: {
            receivablesDelayDays: 15,
            receivablesDefaultRate: 0.03,
            revenueChange: -0.05,
            creditWithdrawal: 0.5,
            fxShock: { USD: -0.1 },
            inventoryLockup: 0.2,
        },
        isActive: true,
        createdAt: '2024-12-01T10:00:00Z',
    },
];

const generateDemoNetting = (): NettingOpportunity[] => [
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

            addAccount: (accountData) => {
                const newAccount: BankAccount = {
                    ...accountData,
                    id: `acc-${Date.now()}`,
                    lastSyncAt: new Date().toISOString(),
                };
                set((state) => ({ accounts: [...state.accounts, newAccount] }));
                get().recalculateCashPosition();
                return newAccount;
            },

            updateAccount: (id, updates) => {
                set((state) => ({
                    accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
                }));
                get().recalculateCashPosition();
            },

            syncAccountBalance: (id, balance, availableBalance) => {
                set((state) => ({
                    accounts: state.accounts.map((a) =>
                        a.id === id ? { ...a, currentBalance: balance, availableBalance, lastSyncAt: new Date().toISOString() } : a
                    ),
                }));
                get().recalculateCashPosition();
            },

            recalculateCashPosition: () => {
                const { accounts } = get();
                const activeAccounts = accounts.filter((a) => a.isActive);

                let totalCash = 0;
                let unrestricted = 0;
                let restricted = 0;
                let pledged = 0;
                let escrowed = 0;
                let blocked = 0;
                let availableCash = 0;

                const byCurrency: Record<string, number> = {};
                const byEntity: Record<string, number> = {};
                const byBank: Record<string, number> = {};
                const byJurisdiction: Record<string, number> = {};

                activeAccounts.forEach((acc) => {
                    totalCash += acc.currentBalance;

                    switch (acc.cashClassification) {
                        case 'unrestricted':
                            unrestricted += acc.currentBalance;
                            availableCash += acc.availableBalance;
                            break;
                        case 'restricted':
                            restricted += acc.currentBalance;
                            break;
                        case 'pledged':
                            pledged += acc.currentBalance;
                            break;
                        case 'escrowed':
                            escrowed += acc.currentBalance;
                            break;
                        case 'blocked':
                            blocked += acc.currentBalance;
                            break;
                    }

                    byCurrency[acc.currency] = (byCurrency[acc.currency] || 0) + acc.currentBalance;
                    byEntity[acc.entityId] = (byEntity[acc.entityId] || 0) + acc.currentBalance;
                    byBank[acc.bankName] = (byBank[acc.bankName] || 0) + acc.currentBalance;
                    byJurisdiction[acc.jurisdiction] = (byJurisdiction[acc.jurisdiction] || 0) + acc.currentBalance;
                });

                const cashPosition: CashPosition = {
                    id: `pos-${Date.now()}`,
                    date: new Date().toISOString().split('T')[0],
                    totalCash,
                    unrestricted,
                    restricted,
                    pledged,
                    escrowed,
                    blocked,
                    grossCash: totalCash,
                    reservedCash: restricted + pledged + escrowed + blocked,
                    committedCash: 0, // Would be calculated from upcoming obligations
                    availableCash,
                    excessCash: Math.max(0, availableCash - 500000), // Above operating minimum
                    byCurrency,
                    byEntity,
                    byBank,
                    byJurisdiction: byJurisdiction as Record<Jurisdiction, number>,
                    projections: {
                        today: availableCash,
                        day7: availableCash + 50000,
                        day30: availableCash + 120000,
                        day90: availableCash + 280000,
                    },
                    updatedAt: new Date().toISOString(),
                };

                set({ cashPosition });
            },

            /* getCashByClassification: () => {
                const { cashPosition } = get();
                if (!cashPosition) return {};
                return {
                    unrestricted: cashPosition.unrestricted,
                    restricted: cashPosition.restricted,
                    pledged: cashPosition.pledged,
                    escrowed: cashPosition.escrowed,
                    blocked: cashPosition.blocked,
                };
            },*/

            getCashByClassification: (): Record<string, number> => {
                const { cashPosition } = get();
                if (!cashPosition) {
                    return {
                        unrestricted: 0,
                        restricted: 0,
                        pledged: 0,
                        escrowed: 0,
                        blocked: 0,
                    };
                }
                return {
                    unrestricted: cashPosition.unrestricted,
                    restricted: cashPosition.restricted,
                    pledged: cashPosition.pledged,
                    escrowed: cashPosition.escrowed,
                    blocked: cashPosition.blocked,
                };
            },

            //now it works

            updateBucket: (id, updates) => {
                set((state) => ({
                    buckets: state.buckets.map((b) => {
                        if (b.id !== id) return b;
                        const updated = { ...b, ...updates, updatedAt: new Date().toISOString() };
                        updated.fundingRatio = updated.targetAmount > 0 ? updated.currentAmount / updated.targetAmount : 1;
                        if (updated.fundingRatio >= 1) updated.status = 'overfunded';
                        else if (updated.fundingRatio >= 0.8) updated.status = 'funded';
                        else if (updated.fundingRatio >= 0.5) updated.status = 'underfunded';
                        else updated.status = 'critical';
                        return updated;
                    }),
                }));
            },

            allocateToBucket: (bucketId, amount, sourceAccountId) => {
                const { accounts, buckets } = get();
                const account = accounts.find((a) => a.id === sourceAccountId);
                const bucket = buckets.find((b) => b.id === bucketId);

                if (!account || !bucket) return false;
                if (account.availableBalance < amount) return false;
                if (!bucket.allowedSources.includes(sourceAccountId)) return false;

                get().updateAccount(sourceAccountId, {
                    availableBalance: account.availableBalance - amount,
                });

                get().updateBucket(bucketId, {
                    currentAmount: bucket.currentAmount + amount,
                });

                return true;
            },

            rebalanceBuckets: () => {
                // Create allocation decision based on bucket priorities
                const { buckets, accounts } = get();
                const underfunded = buckets
                    .filter((b) => b.status === 'underfunded' || b.status === 'critical')
                    .sort((a, b) => a.priority - b.priority);

                if (underfunded.length === 0) return null;

                const topPriority = underfunded[0];
                const deficit = topPriority.targetAmount - topPriority.currentAmount;

                // Find source with available funds
                const source = accounts.find(
                    (a) => topPriority.allowedSources.includes(a.id) && a.availableBalance >= deficit
                );

                if (!source) return null;

                return get().createDecision({
                    type: 'allocation',
                    entityId: 'entity-001',
                    currency: topPriority.currency,
                    accountIds: [source.id],
                    bucketIds: [topPriority.id],
                    timeWindow: '7d',
                    createdBy: 'automation',
                    priority: topPriority.status === 'critical' ? 'critical' : 'high',
                    riskClass: 'low',
                    executionMode: 'assisted',
                    requiresApproval: deficit > 50000,
                    approvalReason: deficit > 50000 ? `Amount exceeds €50,000 threshold` : undefined,
                    rationale: `${topPriority.name} is ${topPriority.status} at ${Math.round(topPriority.fundingRatio * 100)}%. Allocating ${deficit} ${topPriority.currency} from ${source.name}.`,
                    impactSummary: `Will bring ${topPriority.name} to 100% funding.`,
                    risksIdentified: ['Reduces available operating cash'],
                    alternativesConsidered: [],
                    complianceChecks: [],
                });
            },

            addFacility: (facilityData) => {
                const newFacility: CreditFacility = {
                    ...facilityData,
                    id: `fac-${Date.now()}`,
                    availableAmount: facilityData.totalLimit - facilityData.drawnAmount,
                    updatedAt: new Date().toISOString(),
                };
                set((state) => ({ facilities: [...state.facilities, newFacility] }));
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
                if (!facility || facility.availableAmount < amount) return null;

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
                    requiresApproval: true,
                    approvalReason: 'Credit draw requires approval',
                    rationale: `Draw ${amount} ${facility.currency} from ${facility.name} to increase liquidity.`,
                    impactSummary: `Credit utilization will increase to ${Math.round(((facility.drawnAmount + amount) / facility.totalLimit) * 100)}%.`,
                    risksIdentified: ['Increases interest expense', 'Reduces available credit buffer'],
                    alternativesConsidered: [],
                    complianceChecks: [
                        { framework: 'SOX', requirement: 'Credit draw approval', status: 'passed' },
                    ],
                });
            },

            repayFacility: (facilityId, amount) => {
                const facility = get().facilities.find((f) => f.id === facilityId);
                if (!facility || facility.drawnAmount < amount) return null;

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
                    rationale: `Repay ${amount} ${facility.currency} to ${facility.name} to reduce interest expense.`,
                    impactSummary: `Credit utilization will decrease to ${Math.round(((facility.drawnAmount - amount) / facility.totalLimit) * 100)}%.`,
                    risksIdentified: ['Reduces available cash'],
                    alternativesConsidered: [],
                    complianceChecks: [],
                });
            },

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

                set((state) => ({ decisions: [...state.decisions, newDecision] }));

                get().recordEvent({
                    decisionId: newDecision.id,
                    type: 'decision_created',
                    actor: data.createdBy === 'user' ? 'user' : 'automation',
                    newStatus: 'draft',
                });

                // Auto-validate
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
                        d.id === id ? { ...d, status: newStatus, version: d.version + 1, updatedAt: new Date().toISOString() } : d
                    ),
                }));

                get().recordEvent({
                    decisionId: id,
                    type: `${newStatus === 'approved' ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'decision_updated'}` as TreasuryEventType,
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
                        d.id === id ? { ...d, approvedBy: approverId, approvedAt: new Date().toISOString() } : d
                    ),
                }));

                return get().transitionDecision(id, 'approved', 'user', `Approved by ${approverId}`);
            },

            rejectDecision: (id, reason) => {
                const decision = get().decisions.find((d) => d.id === id);
                if (!decision || decision.status !== 'awaiting_approval') return false;

                set((state) => ({
                    decisions: state.decisions.map((d) =>
                        d.id === id ? { ...d, rejectionReason: reason } : d
                    ),
                }));

                return get().transitionDecision(id, 'rejected', 'user', reason);
            },

            executeDecision: (id) => {
                const decision = get().decisions.find((d) => d.id === id);
                if (!decision || (decision.status !== 'approved' && decision.status !== 'scheduled')) return false;

                get().transitionDecision(id, 'executing', 'system');

                // Simulate execution
                setTimeout(() => {
                    get().transitionDecision(id, 'executed', 'system');
                    set((state) => ({
                        decisions: state.decisions.map((d) =>
                            d.id === id ? { ...d, executedAt: new Date().toISOString() } : d
                        ),
                    }));

                    get().transitionDecision(id, 'reconciling', 'system');
                    get().transitionDecision(id, 'settled', 'system');
                    set((state) => ({
                        decisions: state.decisions.map((d) =>
                            d.id === id ? { ...d, settledAt: new Date().toISOString() } : d
                        ),
                    }));
                }, 1000);

                return true;
            },

            cancelDecision: (id) => {
                const decision = get().decisions.find((d) => d.id === id);
                if (!decision) return false;
                if (TERMINAL_STATES.includes(decision.status)) return false;
                if (decision.status === 'executing') return false;

                return get().transitionDecision(id, 'cancelled', 'user', 'Cancelled by user');
            },

            recordEvent: (eventData) => {
                const newEvent: TreasuryEvent = {
                    ...eventData,
                    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: new Date().toISOString(),
                };
                set((state) => ({ events: [...state.events, newEvent] }));
                return newEvent;
            },

            getEventsByDecision: (decisionId) => {
                return get().events
                    .filter((e) => e.decisionId === decisionId)
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            },

            recalculateRiskExposure: () => {
                const { accounts, facilities } = get();

                const byBank: Record<string, { amount: number; limit: number; utilization: number }> = {};
                const byCurrency: Record<string, { exposure: number; limit: number; hedgedAmount: number }> = {};

                accounts.forEach((acc) => {
                    if (!byBank[acc.bankName]) {
                        byBank[acc.bankName] = { amount: 0, limit: 1000000, utilization: 0 };
                    }
                    byBank[acc.bankName].amount += acc.currentBalance;
                });

                Object.keys(byBank).forEach((bank) => {
                    byBank[bank].utilization = (byBank[bank].amount / byBank[bank].limit) * 100;
                });

                accounts.forEach((acc) => {
                    if (!byCurrency[acc.currency]) {
                        byCurrency[acc.currency] = { exposure: 0, limit: 500000, hedgedAmount: 0 };
                    }
                    byCurrency[acc.currency].exposure += acc.currentBalance;
                });

                const riskExposure: RiskExposure = {
                    id: `risk-${Date.now()}`,
                    date: new Date().toISOString().split('T')[0],
                    byCounterparty: {},
                    byBank,
                    byCurrency,
                    byMaturity: { today: 100000, '7d': 250000, '30d': 400000, '90d': 600000, '1y': 800000 },
                    concentrationRisk: {
                        largestExposure: { name: 'Deutsche Bank', amount: 850000, percentage: 45 },
                        top5Percentage: 92,
                        herfindahlIndex: 0.28,
                    },
                    liquidityStress: {
                        currentRatio: 2.1,
                        quickRatio: 1.8,
                        cashCoverageRatio: 1.5,
                        stressTestResult: 'pass',
                    },
                    breaches: [],
                    updatedAt: new Date().toISOString(),
                };

                set({ riskExposure });
            },

            checkRiskBreaches: () => {
                const breaches: RiskBreach[] = [];
                const { riskExposure, facilities } = get();

                if (!riskExposure) return breaches;

                // Check bank concentration
                Object.entries(riskExposure.byBank).forEach(([bank, data]) => {
                    if (data.utilization > 50) {
                        breaches.push({
                            id: `breach-${Date.now()}`,
                            type: 'bank',
                            entityName: bank,
                            currentValue: data.utilization,
                            threshold: 50,
                            severity: data.utilization > 70 ? 'high' : 'medium',
                            recommendedAction: `Reduce exposure to ${bank} by diversifying across other banks`,
                            createdAt: new Date().toISOString(),
                        });
                    }
                });

                // Check covenant warnings
                facilities.forEach((fac) => {
                    fac.covenants.forEach((cov) => {
                        if (cov.status === 'warning' || cov.status === 'breach') {
                            breaches.push({
                                id: `breach-${Date.now()}`,
                                type: 'concentration',
                                entityName: `${fac.name} - ${cov.name}`,
                                currentValue: cov.currentValue,
                                threshold: cov.threshold,
                                severity: cov.status === 'breach' ? 'critical' : 'high',
                                recommendedAction: `Review and improve ${cov.metric} ratio`,
                                createdAt: new Date().toISOString(),
                            });
                        }
                    });
                });

                return breaches;
            },

            getRiskLevel: () => {
                const breaches = get().checkRiskBreaches();
                if (breaches.some((b) => b.severity === 'critical')) return 'critical';
                if (breaches.some((b) => b.severity === 'high')) return 'high';
                if (breaches.some((b) => b.severity === 'medium')) return 'medium';
                return 'low';
            },

            createScenario: (scenarioData) => {
                const newScenario: TreasuryScenario = {
                    ...scenarioData,
                    id: `scen-${Date.now()}`,
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({ scenarios: [...state.scenarios, newScenario] }));
                return newScenario;
            },

            runScenario: (scenarioId) => {
                const scenario = get().scenarios.find((s) => s.id === scenarioId);
                const { cashPosition, buckets, facilities } = get();

                if (!scenario || !cashPosition) {
                    return {
                        scenarioId,
                        calculatedAt: new Date().toISOString(),
                        cashProjection: { today: 0, '7d': 0, '30d': 0, '90d': 0, '1y': 0 },
                        liquidityGap: 0,
                        impactOnBuckets: {} as Record<CapitalBucketType, number>,
                        impactOnCovenants: [],
                        mitigationActions: [],
                        overallRisk: 'medium' as RiskLevel,
                    };
                }

                const { parameters } = scenario;
                const baseAvailable = cashPosition.availableCash;

                // Calculate stressed cash position
                const receivablesImpact = baseAvailable * (1 - parameters.receivablesDefaultRate);
                const revenueImpact = baseAvailable * (1 + parameters.revenueChange);
                const creditImpact = facilities.reduce((sum, f) => sum + f.availableAmount, 0) * (1 - parameters.creditWithdrawal);

                const stressedCash = Math.min(receivablesImpact, revenueImpact);
                const liquidityGap = Math.max(0, 500000 - stressedCash); // Against minimum operating

                const result: ScenarioResult = {
                    scenarioId,
                    calculatedAt: new Date().toISOString(),
                    cashProjection: {
                        today: stressedCash,
                        '7d': stressedCash * 0.95,
                        '30d': stressedCash * 0.85,
                        '90d': stressedCash * 0.75,
                        '1y': stressedCash * 0.7,
                    },
                    liquidityGap,
                    gapTiming: liquidityGap > 0 ? '30d' : undefined,
                    impactOnBuckets: {
                        operating: -baseAvailable * 0.1,
                        payroll_reserve: 0,
                        tax_reserve: 0,
                        debt_service: -baseAvailable * 0.05,
                        investment: -baseAvailable * 0.15,
                        excess: -baseAvailable * 0.2,
                    },
                    impactOnCovenants: facilities.flatMap((f) =>
                        f.covenants.map((c) => ({
                            name: c.name,
                            projectedValue: c.currentValue * (1 - Math.abs(parameters.revenueChange) * 0.5),
                            status: c.currentValue * 0.9 >= c.threshold ? 'compliant' : 'warning',
                        }))
                    ),
                    mitigationActions: [
                        'Draw on available credit facilities',
                        'Accelerate receivables collection',
                        'Delay non-essential payables',
                        'Reduce discretionary spending',
                    ],
                    overallRisk: liquidityGap > 200000 ? 'critical' : liquidityGap > 100000 ? 'high' : liquidityGap > 0 ? 'medium' : 'low',
                };

                // Store result
                set((state) => ({
                    scenarios: state.scenarios.map((s) => (s.id === scenarioId ? { ...s, results: result } : s)),
                }));

                return result;
            },

            identifyNettingOpportunities: () => {
                // In real implementation, would cross-reference receivables and payables
                return get().nettingOpportunities;
            },

            executeNetting: (opportunityId) => {
                const opportunity = get().nettingOpportunities.find((n) => n.id === opportunityId);
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
                    requiresApproval: opportunity.netAmount > 10000,
                    rationale: `Net ${opportunity.grossReceivable} receivable against ${opportunity.grossPayable} payable with ${opportunity.counterpartyName}. Saves ${opportunity.cashSaved} in cash movement.`,
                    impactSummary: `Net settlement of ${opportunity.netAmount} ${opportunity.currency}.`,
                    risksIdentified: [],
                    alternativesConsidered: [],
                    complianceChecks: [],
                });
            },

            getSummary: () => {
                const { cashPosition, buckets, facilities, decisions, nettingOpportunities } = get();

                const activeBuckets = buckets;
                const underfundedBuckets = activeBuckets.filter((b) => b.status === 'underfunded' || b.status === 'critical');

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
                    bucketsFunded: activeBuckets.filter((b) => b.status === 'funded' || b.status === 'overfunded').length,
                    bucketsUnderfunded: underfundedBuckets.length,
                    totalBucketDeficit: underfundedBuckets.reduce((sum, b) => sum + (b.targetAmount - b.currentAmount), 0),
                    totalCreditAvailable,
                    totalCreditUsed,
                    creditUtilization: totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0,
                    overallRisk: get().getRiskLevel(),
                    activeBreaches: get().checkRiskBreaches().length,
                    covenantStatus: covenantIssues ? 'warning' : 'compliant',
                    pendingDecisions: pendingDecisions.length,
                    pendingApprovals: pendingApprovals.length,
                    nettingOpportunities: nettingOpportunities.filter((n) => n.status === 'identified').length,
                    potentialSavings: nettingOpportunities.reduce((sum, n) => sum + n.cashSaved, 0),
                    expectedCashIn7d: 85000,
                    expectedCashOut7d: 62000,
                    netCashFlow7d: 23000,
                    complianceStatus: 'compliant',
                    lastUpdated: new Date().toISOString(),
                };
            },

            getCashForecast: (days) => {
                const { cashPosition } = get();
                const forecast: { date: string; inflow: number; outflow: number; balance: number }[] = [];
                let balance = cashPosition?.availableCash || 0;

                for (let i = 0; i <= days; i += 7) {
                    const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
                    const inflow = 15000 + Math.random() * 10000;
                    const outflow = 12000 + Math.random() * 8000;
                    balance = balance + inflow - outflow;

                    forecast.push({
                        date: date.toISOString().split('T')[0],
                        inflow: Math.round(inflow),
                        outflow: Math.round(outflow),
                        balance: Math.round(balance),
                    });
                }

                return forecast;
            },

            getPendingApprovals: () => {
                return get().decisions.filter((d) => d.status === 'awaiting_approval');
            },
        }),
        { name: 'primebalance-treasury' }
    )
);