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
    UTILIZATION_THRESHOLDS,
    MATURITY_WARNING_DAYS,
    PAYMENT_WARNING_DAYS
} from '@/types/liabilities';

// =============================================================================
// LIABILITIES STORE
// =============================================================================

interface LiabilitiesState {
    liabilities: Liability[];
    payments: LiabilityPayment[];
    wizardState: LiabilityWizardState;

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
    interestTerms: { type: 'unknown' },
    repaymentTerms: { schedule: 'monthly' },
    startDate: new Date().toISOString().split('T')[0],
    maturityType: 'fixed',
    maturityDate: '',
    hasCollateral: false,
    collateral: {},
    notes: '',
};

// Demo liabilities
const generateDemoLiabilities = (): Liability[] => [
    {
        id: 'lib-001',
        type: 'loan',
        classifications: ['drawn_debt', 'long_term'],
        status: 'active',
        name: 'Betriebsmittelkredit',
        description: 'Langfristiger Kredit für Betriebsmittel',
        reference: 'KR-2023-001',
        counterparty: {
            name: 'Deutsche Bank',
            type: 'bank',
            country: 'DE',
            accountNumber: 'DE89370400440532013000',
        },
        originalAmount: 500000,
        currentBalance: 375000,
        currency: 'EUR',
        interestTerms: {
            type: 'fixed',
            rate: 4.5,
        },
        repaymentTerms: {
            schedule: 'monthly',
            amount: 12500,
            nextPaymentDate: '2025-01-15',
            totalPayments: 48,
            remainingPayments: 30,
        },
        startDate: '2023-06-01',
        maturityType: 'fixed',
        maturityDate: '2027-06-01',
        collateral: {
            isSecured: true,
            type: 'property',
            description: 'Grundschuld auf Betriebsgebäude',
            value: 750000,
            currency: 'EUR',
        },
        riskLevel: 'low',
        alerts: [],
        createdAt: '2023-06-01T10:00:00Z',
        updatedAt: '2024-12-01T10:00:00Z',
    },
    {
        id: 'lib-002',
        type: 'credit_line',
        classifications: ['undrawn_credit', 'short_term'],
        status: 'active',
        name: 'Kontokorrentkredit',
        description: 'Flexible Kreditlinie für Liquidität',
        reference: 'KK-2024-001',
        counterparty: {
            name: 'Commerzbank',
            type: 'bank',
            country: 'DE',
        },
        originalAmount: 200000,
        currentBalance: 45000,
        currency: 'EUR',
        creditLimit: {
            totalLimit: 200000,
            usedAmount: 45000,
            availableAmount: 155000,
            currency: 'EUR',
            expiryDate: '2025-12-31',
            utilizationPercent: 22.5,
        },
        interestTerms: {
            type: 'variable',
            baseRate: 'EURIBOR',
            spread: 2.5,
        },
        repaymentTerms: {
            schedule: 'on_demand',
        },
        startDate: '2024-01-01',
        maturityType: 'rolling',
        reviewDate: '2025-06-01',
        riskLevel: 'low',
        alerts: [],
        createdAt: '2024-01-01T09:00:00Z',
        updatedAt: '2024-12-10T14:00:00Z',
    },
    {
        id: 'lib-003',
        type: 'supplier_credit',
        classifications: ['drawn_debt', 'short_term'],
        status: 'active',
        name: 'Lieferantenkredit Tech Supplies',
        counterparty: {
            name: 'Tech Supplies GmbH',
            type: 'supplier',
            country: 'DE',
        },
        originalAmount: 50000,
        currentBalance: 35000,
        currency: 'EUR',
        creditLimit: {
            totalLimit: 50000,
            usedAmount: 35000,
            availableAmount: 15000,
            currency: 'EUR',
            utilizationPercent: 70,
        },
        interestTerms: {
            type: 'none',
        },
        repaymentTerms: {
            schedule: 'monthly',
            nextPaymentDate: '2025-01-05',
        },
        startDate: '2024-06-01',
        maturityType: 'ongoing',
        riskLevel: 'medium',
        alerts: [
            {
                id: 'alert-001',
                type: 'limit_warning',
                severity: 'warning',
                message: 'Kreditlimit zu 70% ausgeschöpft',
                isRead: false,
                createdAt: '2024-12-10T10:00:00Z',
            },
        ],
        createdAt: '2024-06-01T08:00:00Z',
        updatedAt: '2024-12-10T10:00:00Z',
    },
    {
        id: 'lib-004',
        type: 'lease',
        classifications: ['drawn_debt', 'long_term'],
        status: 'active',
        name: 'Fahrzeugleasing Fuhrpark',
        description: '5 Firmenfahrzeuge',
        counterparty: {
            name: 'BMW Financial Services',
            type: 'leasing',
            country: 'DE',
        },
        originalAmount: 180000,
        currentBalance: 120000,
        currency: 'EUR',
        interestTerms: {
            type: 'fixed',
            rate: 3.9,
        },
        repaymentTerms: {
            schedule: 'monthly',
            amount: 3750,
            nextPaymentDate: '2025-01-01',
            totalPayments: 48,
            remainingPayments: 32,
        },
        startDate: '2023-05-01',
        maturityType: 'fixed',
        maturityDate: '2027-05-01',
        riskLevel: 'low',
        alerts: [],
        createdAt: '2023-05-01T10:00:00Z',
        updatedAt: '2024-12-01T10:00:00Z',
    },
    {
        id: 'lib-005',
        type: 'guarantee',
        classifications: ['contingent'],
        status: 'active',
        name: 'Mietbürgschaft Büro Berlin',
        counterparty: {
            name: 'Berliner Sparkasse',
            type: 'bank',
            country: 'DE',
        },
        originalAmount: 36000,
        currentBalance: 36000,
        currency: 'EUR',
        interestTerms: {
            type: 'fixed',
            rate: 1.5,
        },
        repaymentTerms: {
            schedule: 'annually',
            amount: 540,
        },
        startDate: '2022-01-01',
        maturityType: 'ongoing',
        collateral: {
            isSecured: true,
            type: 'cash',
            description: 'Festgeld als Sicherheit',
            value: 36000,
            currency: 'EUR',
        },
        riskLevel: 'low',
        alerts: [],
        createdAt: '2022-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
    },
];

const generateDemoPayments = (): LiabilityPayment[] => [
    {
        id: 'pay-001',
        liabilityId: 'lib-001',
        date: '2025-01-15',
        amount: 12500,
        currency: 'EUR',
        type: 'combined',
        status: 'scheduled',
    },
    {
        id: 'pay-002',
        liabilityId: 'lib-004',
        date: '2025-01-01',
        amount: 3750,
        currency: 'EUR',
        type: 'combined',
        status: 'scheduled',
    },
    {
        id: 'pay-003',
        liabilityId: 'lib-003',
        date: '2025-01-05',
        amount: 15000,
        currency: 'EUR',
        type: 'principal',
        status: 'scheduled',
    },
];

export const useLiabilitiesStore = create<LiabilitiesState>()(
    persist(
        (set, get) => ({
            liabilities: generateDemoLiabilities(),
            payments: generateDemoPayments(),
            wizardState: initialWizardState,

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
                } as Liability;

                // Calculate credit limit if applicable
                if (newLiability.creditLimit) {
                    newLiability.creditLimit.availableAmount =
                        newLiability.creditLimit.totalLimit - newLiability.creditLimit.usedAmount;
                    newLiability.creditLimit.utilizationPercent =
                        (newLiability.creditLimit.usedAmount / newLiability.creditLimit.totalLimit) * 100;
                }

                set((state) => ({ liabilities: [...state.liabilities, newLiability] }));
                get().generateAlerts();
                return newLiability;
            },

            updateLiability: (id, updates) => {
                set((state) => ({
                    liabilities: state.liabilities.map((lib) =>
                        lib.id === id ? { ...lib, ...updates, updatedAt: new Date().toISOString() } : lib
                    ),
                }));
                get().generateAlerts();
            },

            deleteLiability: (id) => {
                set((state) => ({
                    liabilities: state.liabilities.filter((lib) => lib.id !== id),
                    payments: state.payments.filter((pay) => pay.liabilityId !== id),
                }));
            },

            addPayment: (payment) => {
                const newPayment = { ...payment, id: `pay-${Date.now()}` };
                set((state) => ({ payments: [...state.payments, newPayment] }));
            },

            updatePayment: (id, updates) => {
                set((state) => ({
                    payments: state.payments.map((pay) => (pay.id === id ? { ...pay, ...updates } : pay)),
                }));
            },

            updateCreditUsage: (id, usedAmount) => {
                set((state) => ({
                    liabilities: state.liabilities.map((lib) => {
                        if (lib.id !== id || !lib.creditLimit) return lib;
                        const availableAmount = lib.creditLimit.totalLimit - usedAmount;
                        const utilizationPercent = (usedAmount / lib.creditLimit.totalLimit) * 100;
                        return {
                            ...lib,
                            currentBalance: usedAmount,
                            creditLimit: { ...lib.creditLimit, usedAmount, availableAmount, utilizationPercent },
                            updatedAt: new Date().toISOString(),
                        };
                    }),
                }));
                get().generateAlerts();
            },

            drawFromCreditLine: (id, amount) => {
                const lib = get().liabilities.find((l) => l.id === id);
                if (!lib?.creditLimit) return;
                const newUsed = lib.creditLimit.usedAmount + amount;
                if (newUsed > lib.creditLimit.totalLimit) return;
                get().updateCreditUsage(id, newUsed);
            },

            repayToCreditLine: (id, amount) => {
                const lib = get().liabilities.find((l) => l.id === id);
                if (!lib?.creditLimit) return;
                const newUsed = Math.max(0, lib.creditLimit.usedAmount - amount);
                get().updateCreditUsage(id, newUsed);
            },

            setWizardStep: (step) => {
                set((state) => ({ wizardState: { ...state.wizardState, step } }));
            },

            updateWizardState: (updates) => {
                set((state) => ({ wizardState: { ...state.wizardState, ...updates } }));
            },

            resetWizard: () => set({ wizardState: initialWizardState }),

            getSummary: () => {
                const liabilities = get().liabilities.filter((l) => l.status === 'active');
                const payments = get().payments.filter((p) => p.status === 'scheduled');

                const now = new Date();
                const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

                let totalLiabilities = 0;
                let shortTermTotal = 0;
                let longTermTotal = 0;
                let drawnDebt = 0;
                let availableCredit = 0;
                let totalCreditLimit = 0;
                const byCounterpartyType: Record<string, number> = {};
                const byCurrency: Record<string, number> = {};

                liabilities.forEach((lib) => {
                    totalLiabilities += lib.currentBalance;

                    if (lib.classifications.includes('short_term')) {
                        shortTermTotal += lib.currentBalance;
                    } else if (lib.classifications.includes('long_term')) {
                        longTermTotal += lib.currentBalance;
                    }

                    if (lib.classifications.includes('drawn_debt')) {
                        drawnDebt += lib.currentBalance;
                    }

                    if (lib.creditLimit) {
                        availableCredit += lib.creditLimit.availableAmount;
                        totalCreditLimit += lib.creditLimit.totalLimit;
                    }

                    const cType = lib.counterparty.type;
                    byCounterpartyType[cType] = (byCounterpartyType[cType] || 0) + lib.currentBalance;
                    byCurrency[lib.currency] = (byCurrency[lib.currency] || 0) + lib.currentBalance;
                });

                const upcomingPayments30Days = payments
                    .filter((p) => new Date(p.date) <= in30Days)
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

            getActiveAlerts: () => {
                return get().liabilities.flatMap((l) => l.alerts.filter((a) => !a.isRead));
            },

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
                if (percent >= 90) return { level: 'critical', percent };
                if (percent >= 80) return { level: 'warning', percent };
                return { level: 'ok', percent };
            },

            generateAlerts: () => {
                const now = new Date();

                set((state) => ({
                    liabilities: state.liabilities.map((lib) => {
                        const newAlerts: LiabilityAlert[] = [];

                        // Credit utilization alerts
                        if (lib.creditLimit) {
                            const util = lib.creditLimit.utilizationPercent;
                            if (util >= 90) {
                                newAlerts.push({
                                    id: `alert-util-${lib.id}`,
                                    type: 'limit_warning',
                                    severity: 'critical',
                                    message: `Kreditlimit zu ${util.toFixed(0)}% ausgeschöpft`,
                                    isRead: false,
                                    createdAt: now.toISOString(),
                                });
                            } else if (util >= 80) {
                                newAlerts.push({
                                    id: `alert-util-${lib.id}`,
                                    type: 'limit_warning',
                                    severity: 'warning',
                                    message: `Kreditlimit zu ${util.toFixed(0)}% ausgeschöpft`,
                                    isRead: false,
                                    createdAt: now.toISOString(),
                                });
                            }
                        }

                        // Maturity alerts
                        if (lib.maturityDate) {
                            const maturity = new Date(lib.maturityDate);
                            const daysUntil = Math.ceil((maturity.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
                            if (daysUntil <= 90 && daysUntil > 0) {
                                newAlerts.push({
                                    id: `alert-mat-${lib.id}`,
                                    type: 'maturity',
                                    severity: daysUntil <= 30 ? 'critical' : 'warning',
                                    message: `Fälligkeit in ${daysUntil} Tagen`,
                                    dueDate: lib.maturityDate,
                                    isRead: false,
                                    createdAt: now.toISOString(),
                                });
                            }
                        }

                        return { ...lib, alerts: newAlerts };
                    }),
                }));
            },

            markAlertRead: (liabilityId, alertId) => {
                set((state) => ({
                    liabilities: state.liabilities.map((lib) =>
                        lib.id === liabilityId
                            ? { ...lib, alerts: lib.alerts.map((a) => (a.id === alertId ? { ...a, isRead: true } : a)) }
                            : lib
                    ),
                }));
            },

            classifyLiability: (liability) => {
                const classifications: LiabilityClassification[] = [];

                // Drawn vs undrawn
                if (liability.type === 'credit_line' || liability.type === 'overdraft') {
                    if (liability.currentBalance && liability.currentBalance > 0) {
                        classifications.push('drawn_debt');
                    }
                    classifications.push('undrawn_credit');
                } else if (liability.type === 'guarantee') {
                    classifications.push('contingent');
                } else {
                    classifications.push('drawn_debt');
                }

                // Short vs long term
                if (liability.maturityDate) {
                    const months = (new Date(liability.maturityDate).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000);
                    if (months <= 12) {
                        classifications.push('short_term');
                    } else {
                        classifications.push('long_term');
                    }
                } else if (liability.maturityType === 'on_demand' || liability.type === 'overdraft') {
                    classifications.push('short_term');
                } else {
                    classifications.push('long_term');
                }

                return classifications;
            },
        }),
        { name: 'primebalance-liabilities' }
    )
);