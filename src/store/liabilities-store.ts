import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    Liability,
    LiabilityType,
    LiabilityPayment,
    LiabilitySummary,
    LiabilityWizardState,
    LiabilityAlert,
    LiabilityClassification,
    LiabilityCounterparty,
    CreditLimit,
    InterestTerms,
    RepaymentTerms,
    Collateral,
} from '@/types/liabilities';

// =============================================================================
// LIABILITIES STORE - API CONNECTED
// =============================================================================

interface LiabilitiesState {
    liabilities: Liability[];
    payments: LiabilityPayment[];
    wizardState: LiabilityWizardState;
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;

    // API Actions
    fetchLiabilities: () => Promise<void>;

    // CRUD
    createLiability: (liability: Omit<Liability, 'id' | 'createdAt' | 'updatedAt' | 'alerts' | 'classifications'>) => Liability;
    updateLiability: (id: string, updates: Partial<Liability>) => void;
    deleteLiability: (id: string) => void;

    // Payments
    addPayment: (payment: Omit<LiabilityPayment, 'id'>) => void;
    updatePayment: (id: string, updates: Partial<LiabilityPayment>) => void;

    // Credit limits
    updateCreditUsage: (id: string, usedAmount: number) => void;
    drawFromCreditLine: (id: string, amount: number) => void;
    repayToCreditLine: (id: string, amount: number) => void;

    // Wizard
    setWizardStep: (step: number) => void;
    updateWizardState: (updates: Partial<LiabilityWizardState>) => void;
    resetWizard: () => void;

    // Analytics
    getSummary: () => LiabilitySummary;
    getByType: (type: LiabilityType) => Liability[];
    getActiveAlerts: () => LiabilityAlert[];
    getUpcomingPayments: (days: number) => LiabilityPayment[];
    getUpcomingMaturities: (days: number) => Liability[];

    // Risk
    checkUtilization: (id: string) => { level: 'ok' | 'warning' | 'critical'; percent: number };
    generateAlerts: () => void;
    markAlertRead: (liabilityId: string, alertId: string) => void;

    // Classification
    classifyLiability: (liability: Partial<Liability>) => LiabilityClassification[];
}

const initialWizardState: LiabilityWizardState = {
    step: 1,
    type: null,
    counterparty: {},
    name: '',
    originalAmount: 0,
    currentBalance: 0,
    currency: 'EUR',
    hasCreditLimit: false,
    creditLimit: {},
    interestTerms: { type: 'fixed' },
    repaymentTerms: { schedule: 'monthly' },
    startDate: new Date().toISOString().split('T')[0],
    maturityType: 'fixed',
    maturityDate: '',
    hasCollateral: false,
    collateral: {},
    notes: '',
};

function mapApiToLiability(api: any): Liability {
    return {
        id: api.id,
        type: api.type,
        classifications: api.classifications || [],
        status: api.status,
        name: api.name,
        description: api.description,
        reference: api.reference,
        counterparty: api.counterparty || {
            name: api.counterpartyName || '',
            type: api.counterpartyType || 'other',
            country: api.counterpartyCountry || '',
        },
        originalAmount: Number(api.originalAmount || api.principalAmount) || 0,
        currentBalance: Number(api.currentBalance || api.outstandingAmount) || 0,
        currency: api.currency || 'EUR',
        creditLimit: api.creditLimit ? {
            totalLimit: Number(api.creditLimit.totalLimit || api.creditLimit) || 0,
            usedAmount: Number(api.creditLimit.usedAmount) || 0,
            availableAmount: Number(api.creditLimit.availableAmount || api.availableCredit) || 0,
            currency: api.currency || 'EUR',
            expiryDate: api.creditLimit.expiryDate,
            utilizationPercent: Number(api.creditLimit.utilizationPercent || api.utilizationRate) || 0,
        } : undefined,
        interestTerms: api.interestTerms || {
            type: api.interestType || 'fixed',
            rate: api.interestRate ? Number(api.interestRate) : undefined,
        },
        repaymentTerms: api.repaymentTerms || {
            schedule: api.paymentFrequency || 'monthly',
            amount: api.paymentAmount ? Number(api.paymentAmount) : undefined,
            nextPaymentDate: api.nextPaymentDate?.split('T')[0],
        },
        startDate: api.startDate?.split('T')[0] || api.startDate,
        maturityType: api.maturityType || 'fixed',
        maturityDate: api.maturityDate?.split('T')[0],
        reviewDate: api.reviewDate?.split('T')[0],
        collateral: api.collateral || (api.isSecured ? {
            isSecured: true,
            description: api.collateralDescription,
            value: api.collateralValue ? Number(api.collateralValue) : undefined,
        } : undefined),
        covenants: api.covenants,
        specialConditions: api.specialConditions,
        riskLevel: api.riskLevel || 'low',
        alerts: api.alerts || [],
        attachments: api.attachments,
        notes: api.notes,
        createdAt: api.createdAt,
        updatedAt: api.updatedAt,
    };
}

export const useLiabilitiesStore = create<LiabilitiesState>()(
    persist(
        (set, get) => ({
            liabilities: [],
            payments: [],
            wizardState: initialWizardState,
            isLoading: false,
            error: null,
            isInitialized: false,

            fetchLiabilities: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch('/api/liabilities');
                    if (!response.ok) throw new Error('Failed to fetch liabilities');
                    const data = await response.json();
                    const liabilities = (data.liabilities || data || []).map(mapApiToLiability);
                    set({ liabilities, isLoading: false, isInitialized: true });
                } catch (error) {
                    console.error('Failed to fetch liabilities:', error);
                    set({ error: (error as Error).message, isLoading: false, isInitialized: true });
                }
            },

            createLiability: (liabilityData) => {
                const now = new Date().toISOString();
                const classifications = get().classifyLiability(liabilityData);
                const newLiability: Liability = {
                    ...liabilityData,
                    id: `lib-${Date.now()}`,
                    classifications,
                    alerts: [],
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => ({ liabilities: [...state.liabilities, newLiability] }));

                fetch('/api/liabilities', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: liabilityData.type,
                        name: liabilityData.name,
                        description: liabilityData.description,
                        counterpartyName: liabilityData.counterparty.name,
                        counterpartyType: liabilityData.counterparty.type,
                        currency: liabilityData.currency,
                        principalAmount: liabilityData.originalAmount,
                        outstandingAmount: liabilityData.currentBalance,
                        creditLimit: liabilityData.creditLimit?.totalLimit,
                        interestRate: liabilityData.interestTerms.rate,
                        interestType: liabilityData.interestTerms.type,
                        startDate: liabilityData.startDate,
                        maturityDate: liabilityData.maturityDate,
                        paymentFrequency: liabilityData.repaymentTerms.schedule,
                        paymentAmount: liabilityData.repaymentTerms.amount,
                        isSecured: liabilityData.collateral?.isSecured,
                        riskLevel: liabilityData.riskLevel,
                        notes: liabilityData.notes,
                    }),
                }).catch(console.error);

                return newLiability;
            },

            updateLiability: (id, updates) => {
                set((state) => ({
                    liabilities: state.liabilities.map((l) =>
                        l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
                    ),
                }));

                fetch(`/api/liabilities/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates),
                }).catch(console.error);
            },

            deleteLiability: (id) => {
                set((state) => ({
                    liabilities: state.liabilities.filter((l) => l.id !== id),
                }));

                fetch(`/api/liabilities/${id}`, { method: 'DELETE' }).catch(console.error);
            },

            addPayment: (paymentData) => {
                const payment: LiabilityPayment = { ...paymentData, id: `pay-${Date.now()}` };
                set((state) => ({ payments: [...state.payments, payment] }));
            },

            updatePayment: (id, updates) => {
                set((state) => ({
                    payments: state.payments.map((p) => p.id === id ? { ...p, ...updates } : p),
                }));
            },

            updateCreditUsage: (id, usedAmount) => {
                set((state) => ({
                    liabilities: state.liabilities.map((l) => {
                        if (l.id !== id || !l.creditLimit) return l;
                        const availableAmount = l.creditLimit.totalLimit - usedAmount;
                        const utilizationPercent = (usedAmount / l.creditLimit.totalLimit) * 100;
                        return {
                            ...l,
                            creditLimit: { ...l.creditLimit, usedAmount, availableAmount, utilizationPercent },
                            currentBalance: usedAmount,
                        };
                    }),
                }));
            },

            drawFromCreditLine: (id, amount) => {
                const lib = get().liabilities.find((l) => l.id === id);
                if (!lib?.creditLimit) return;
                get().updateCreditUsage(id, lib.creditLimit.usedAmount + amount);
            },

            repayToCreditLine: (id, amount) => {
                const lib = get().liabilities.find((l) => l.id === id);
                if (!lib?.creditLimit) return;
                get().updateCreditUsage(id, Math.max(0, lib.creditLimit.usedAmount - amount));
            },

            setWizardStep: (step) => set((state) => ({ wizardState: { ...state.wizardState, step } })),

            updateWizardState: (updates) => set((state) => ({ wizardState: { ...state.wizardState, ...updates } })),

            resetWizard: () => set({ wizardState: initialWizardState }),

            getSummary: () => {
                const { liabilities, payments } = get();
                const active = liabilities.filter((l) => l.status === 'active');
                const today = new Date();
                const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
                const in90Days = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

                let totalLiabilities = 0, shortTermTotal = 0, longTermTotal = 0, drawnDebt = 0;
                let availableCredit = 0, totalCreditLimit = 0;
                const byCounterpartyType: Record<string, number> = {};
                const byCurrency: Record<string, number> = {};

                active.forEach((lib) => {
                    totalLiabilities += lib.currentBalance;
                    if (lib.classifications.includes('short_term')) shortTermTotal += lib.currentBalance;
                    else if (lib.classifications.includes('long_term')) longTermTotal += lib.currentBalance;
                    if (lib.classifications.includes('drawn_debt')) drawnDebt += lib.currentBalance;
                    if (lib.creditLimit) {
                        availableCredit += lib.creditLimit.availableAmount;
                        totalCreditLimit += lib.creditLimit.totalLimit;
                    }
                    const cType = lib.counterparty.type;
                    byCounterpartyType[cType] = (byCounterpartyType[cType] || 0) + lib.currentBalance;
                    byCurrency[lib.currency] = (byCurrency[lib.currency] || 0) + lib.currentBalance;
                });

                const upcomingPayments30Days = payments
                    .filter((p) => p.status === 'scheduled' && new Date(p.date) <= in30Days)
                    .reduce((sum, p) => sum + p.amount, 0);

                const upcomingMaturities90Days = liabilities.filter(
                    (l) => l.maturityDate && new Date(l.maturityDate) <= in90Days
                ).length;

                return {
                    totalLiabilities,
                    shortTermTotal,
                    longTermTotal,
                    drawnDebt,
                    availableCredit,
                    totalCreditLimit,
                    utilizationPercent: totalCreditLimit > 0 ? ((totalCreditLimit - availableCredit) / totalCreditLimit) * 100 : 0,
                    byCounterpartyType,
                    byCurrency,
                    upcomingPayments30Days,
                    upcomingMaturities90Days,
                };
            },

            getByType: (type) => get().liabilities.filter((l) => l.type === type),

            getActiveAlerts: () => get().liabilities.flatMap((l) => l.alerts.filter((a) => !a.isRead)),

            getUpcomingPayments: (days) => {
                const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
                return get().payments.filter((p) => p.status === 'scheduled' && new Date(p.date) <= cutoff);
            },

            getUpcomingMaturities: (days) => {
                const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
                return get().liabilities.filter(
                    (l) => l.status === 'active' && l.maturityDate && new Date(l.maturityDate) <= cutoff
                );
            },

            checkUtilization: (id) => {
                const lib = get().liabilities.find((l) => l.id === id);
                if (!lib?.creditLimit) return { level: 'ok' as const, percent: 0 };
                const percent = lib.creditLimit.utilizationPercent;
                if (percent >= 90) return { level: 'critical' as const, percent };
                if (percent >= 80) return { level: 'warning' as const, percent };
                return { level: 'ok' as const, percent };
            },

            generateAlerts: () => {
                // Placeholder for alert generation logic
            },

            markAlertRead: (liabilityId, alertId) => {
                set((state) => ({
                    liabilities: state.liabilities.map((l) => {
                        if (l.id !== liabilityId) return l;
                        return {
                            ...l,
                            alerts: l.alerts.map((a) => a.id === alertId ? { ...a, isRead: true } : a),
                        };
                    }),
                }));
            },

            classifyLiability: (liability) => {
                const classifications: LiabilityClassification[] = [];
                const hasCreditLimit = ['credit_line', 'overdraft', 'supplier_credit'].includes(liability.type || '');

                if (hasCreditLimit && liability.creditLimit && (liability.creditLimit as CreditLimit).usedAmount > 0) {
                    classifications.push('drawn_debt');
                }
                if (hasCreditLimit && liability.creditLimit && (liability.creditLimit as CreditLimit).availableAmount > 0) {
                    classifications.push('undrawn_credit');
                }
                if (liability.type === 'guarantee') {
                    classifications.push('contingent');
                }
                if (liability.maturityDate) {
                    const months = (new Date(liability.maturityDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
                    if (months <= 12) classifications.push('short_term');
                    else classifications.push('long_term');
                }
                return classifications;
            },
        }),
        {
            name: 'primebalance-liabilities',
            partialize: (state) => ({
                liabilities: state.liabilities,
                payments: state.payments,
            }),
        }
    )
);