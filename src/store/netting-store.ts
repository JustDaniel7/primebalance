import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    NettingAgreement,
    NettingSession,
    NettingPosition,
    NettingTransaction,
    SettlementInstruction,
    OffsetEntry,
    NettingAnalytics,
    NettingType,
    NettingStatus,
    PartyType,
} from '@/types/netting';

// =============================================================================
// DEMO DATA
// =============================================================================

const generateDemoAgreements = (): NettingAgreement[] => {
    const now = new Date();
    return [
        {
            id: 'agree-1',
            agreementNumber: 'NA-2024-001',
            name: 'Global Suppliers Netting',
            type: 'counterparty',
            status: 'active',
            parties: [
                { id: 'party-1', partyId: 'sup-1', partyName: 'Global Materials Inc', partyType: 'supplier', isNettingCenter: false, createdAt: now.toISOString() },
                { id: 'party-2', partyId: 'sup-2', partyName: 'TechParts Solutions', partyType: 'supplier', isNettingCenter: false, createdAt: now.toISOString() },
            ],
            nettingFrequency: 'monthly',
            settlementDays: 5,
            baseCurrency: 'USD',
            minimumNettingAmount: 10000,
            effectiveDate: '2024-01-01',
            expiryDate: '2025-12-31',
            lastNettingDate: '2024-11-30',
            nextNettingDate: '2024-12-31',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: now.toISOString(),
        },
        {
            id: 'agree-2',
            agreementNumber: 'NA-2024-002',
            name: 'Intercompany Netting - EMEA',
            type: 'intercompany',
            status: 'active',
            parties: [
                { id: 'party-3', partyId: 'sub-1', partyName: 'Company UK Ltd', partyType: 'subsidiary', isNettingCenter: false, createdAt: now.toISOString() },
                { id: 'party-4', partyId: 'sub-2', partyName: 'Company DE GmbH', partyType: 'subsidiary', isNettingCenter: false, createdAt: now.toISOString() },
                { id: 'party-5', partyId: 'sub-3', partyName: 'Company FR SAS', partyType: 'subsidiary', isNettingCenter: false, createdAt: now.toISOString() },
                { id: 'party-6', partyId: 'hq', partyName: 'HQ Treasury', partyType: 'affiliate', isNettingCenter: true, createdAt: now.toISOString() },
            ],
            nettingFrequency: 'monthly',
            settlementDays: 3,
            baseCurrency: 'EUR',
            effectiveDate: '2024-01-01',
            lastNettingDate: '2024-11-30',
            nextNettingDate: '2024-12-31',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: now.toISOString(),
        },
    ];
};

const generateDemoSessions = (): NettingSession[] => {
    const now = new Date();
    return [
        {
            id: 'sess-1',
            sessionNumber: 'NS-2024-011',
            agreementId: 'agree-1',
            agreementName: 'Global Suppliers Netting',
            type: 'counterparty',
            status: 'settled',
            periodStart: '2024-11-01',
            periodEnd: '2024-11-30',
            nettingDate: '2024-11-30',
            settlementDate: '2024-12-05',
            baseCurrency: 'USD',
            totalReceivables: 450000,
            totalPayables: 380000,
            grossAmount: 830000,
            netAmount: 70000,
            savingsAmount: 760000,
            savingsPercentage: 91.6,
            positions: [],
            settlements: [],
            approvedBy: 'user-1',
            approvedByName: 'John Smith',
            approvedAt: '2024-12-01T10:00:00Z',
            createdAt: '2024-11-30T00:00:00Z',
            updatedAt: now.toISOString(),
        },
        {
            id: 'sess-2',
            sessionNumber: 'NS-2024-012',
            agreementId: 'agree-1',
            agreementName: 'Global Suppliers Netting',
            type: 'counterparty',
            status: 'pending_approval',
            periodStart: '2024-12-01',
            periodEnd: '2024-12-31',
            nettingDate: '2024-12-31',
            settlementDate: '2025-01-05',
            baseCurrency: 'USD',
            totalReceivables: 520000,
            totalPayables: 485000,
            grossAmount: 1005000,
            netAmount: 35000,
            savingsAmount: 970000,
            savingsPercentage: 96.5,
            positions: [
                {
                    id: 'pos-1',
                    sessionId: 'sess-2',
                    partyId: 'sup-1',
                    partyName: 'Global Materials Inc',
                    partyType: 'supplier',
                    receivables: 320000,
                    payables: 285000,
                    grossPosition: 35000,
                    netPosition: 35000,
                    receivableCount: 8,
                    payableCount: 12,
                    transactions: [],
                    settlementDirection: 'receive',
                    settlementAmount: 35000,
                    createdAt: now.toISOString(),
                },
                {
                    id: 'pos-2',
                    sessionId: 'sess-2',
                    partyId: 'sup-2',
                    partyName: 'TechParts Solutions',
                    partyType: 'supplier',
                    receivables: 200000,
                    payables: 200000,
                    grossPosition: 0,
                    netPosition: 0,
                    receivableCount: 5,
                    payableCount: 8,
                    transactions: [],
                    settlementDirection: 'none',
                    settlementAmount: 0,
                    createdAt: now.toISOString(),
                },
            ],
            settlements: [
                {
                    id: 'settle-1',
                    sessionId: 'sess-2',
                    instructionNumber: 'SI-2024-001',
                    payerId: 'sup-1',
                    payerName: 'Global Materials Inc',
                    receiverId: 'company',
                    receiverName: 'Our Company',
                    amount: 35000,
                    currency: 'USD',
                    settlementMethod: 'wire',
                    status: 'pending',
                    valueDate: '2025-01-05',
                    createdAt: now.toISOString(),
                },
            ],
            createdAt: '2024-12-15T00:00:00Z',
            updatedAt: now.toISOString(),
        },
        {
            id: 'sess-3',
            sessionNumber: 'NS-2024-IC-006',
            agreementId: 'agree-2',
            agreementName: 'Intercompany Netting - EMEA',
            type: 'intercompany',
            status: 'approved',
            periodStart: '2024-12-01',
            periodEnd: '2024-12-31',
            nettingDate: '2024-12-31',
            settlementDate: '2025-01-03',
            baseCurrency: 'EUR',
            totalReceivables: 2800000,
            totalPayables: 2800000,
            grossAmount: 5600000,
            netAmount: 450000,
            savingsAmount: 5150000,
            savingsPercentage: 92.0,
            positions: [
                {
                    id: 'pos-3',
                    sessionId: 'sess-3',
                    partyId: 'sub-1',
                    partyName: 'Company UK Ltd',
                    partyType: 'subsidiary',
                    receivables: 850000,
                    payables: 720000,
                    grossPosition: 130000,
                    netPosition: 130000,
                    receivableCount: 15,
                    payableCount: 12,
                    transactions: [],
                    settlementDirection: 'receive',
                    settlementAmount: 130000,
                    createdAt: now.toISOString(),
                },
                {
                    id: 'pos-4',
                    sessionId: 'sess-3',
                    partyId: 'sub-2',
                    partyName: 'Company DE GmbH',
                    partyType: 'subsidiary',
                    receivables: 1200000,
                    payables: 1380000,
                    grossPosition: -180000,
                    netPosition: -180000,
                    receivableCount: 22,
                    payableCount: 28,
                    transactions: [],
                    settlementDirection: 'pay',
                    settlementAmount: 180000,
                    createdAt: now.toISOString(),
                },
                {
                    id: 'pos-5',
                    sessionId: 'sess-3',
                    partyId: 'sub-3',
                    partyName: 'Company FR SAS',
                    partyType: 'subsidiary',
                    receivables: 750000,
                    payables: 700000,
                    grossPosition: 50000,
                    netPosition: 50000,
                    receivableCount: 10,
                    payableCount: 8,
                    transactions: [],
                    settlementDirection: 'receive',
                    settlementAmount: 50000,
                    createdAt: now.toISOString(),
                },
            ],
            settlements: [],
            approvedBy: 'user-2',
            approvedByName: 'Treasury Manager',
            approvedAt: '2024-12-20T14:00:00Z',
            createdAt: '2024-12-15T00:00:00Z',
            updatedAt: now.toISOString(),
        },
    ];
};

const generateDemoOffsets = (): OffsetEntry[] => {
    const now = new Date();
    return [
        {
            id: 'offset-1',
            offsetNumber: 'OFF-2024-001',
            type: 'ar_ap',
            status: 'applied',
            partyId: 'cust-1',
            partyName: 'Acme Corporation',
            partyType: 'customer',
            sourceDocumentType: 'Credit Note',
            sourceDocumentNumber: 'CN-2024-0045',
            sourceAmount: 15000,
            targetDocumentType: 'Invoice',
            targetDocumentNumber: 'INV-2024-0892',
            targetAmount: 45000,
            offsetAmount: 15000,
            currency: 'USD',
            offsetDate: '2024-12-10',
            effectiveDate: '2024-12-10',
            approvedBy: 'user-1',
            approvedAt: '2024-12-10T09:00:00Z',
            createdAt: '2024-12-10T08:00:00Z',
            updatedAt: now.toISOString(),
        },
        {
            id: 'offset-2',
            offsetNumber: 'OFF-2024-002',
            type: 'intercompany',
            status: 'pending',
            partyId: 'sub-1',
            partyName: 'Company UK Ltd',
            partyType: 'subsidiary',
            sourceDocumentType: 'Intercompany Receivable',
            sourceDocumentNumber: 'IC-AR-2024-089',
            sourceAmount: 250000,
            targetDocumentType: 'Intercompany Payable',
            targetDocumentNumber: 'IC-AP-2024-076',
            targetAmount: 250000,
            offsetAmount: 250000,
            currency: 'EUR',
            offsetDate: '2024-12-15',
            effectiveDate: '2024-12-15',
            createdAt: '2024-12-15T10:00:00Z',
            updatedAt: now.toISOString(),
        },
    ];
};

// =============================================================================
// STORE
// =============================================================================

interface NettingState {
    agreements: NettingAgreement[];
    sessions: NettingSession[];
    offsets: OffsetEntry[];

    selectedSessionId: string | null;
    selectedAgreementId: string | null;

    // Agreements
    createAgreement: (agreement: Omit<NettingAgreement, 'id' | 'agreementNumber' | 'createdAt' | 'updatedAt'>) => NettingAgreement;
    updateAgreement: (id: string, updates: Partial<NettingAgreement>) => void;
    deleteAgreement: (id: string) => void;

    // Sessions
    createSession: (session: Omit<NettingSession, 'id' | 'sessionNumber' | 'createdAt' | 'updatedAt'>) => NettingSession;
    updateSession: (id: string, updates: Partial<NettingSession>) => void;
    approveSession: (id: string, approverName: string) => void;
    rejectSession: (id: string, reason: string) => void;
    settleSession: (id: string) => void;
    cancelSession: (id: string) => void;

    // Offsets
    createOffset: (offset: Omit<OffsetEntry, 'id' | 'offsetNumber' | 'createdAt' | 'updatedAt'>) => OffsetEntry;
    approveOffset: (id: string, approverName: string) => void;
    applyOffset: (id: string) => void;
    reverseOffset: (id: string) => void;

    // Analytics
    getAnalytics: () => NettingAnalytics;
    getSessionPositions: (sessionId: string) => NettingPosition[];
    getSessionSettlements: (sessionId: string) => SettlementInstruction[];

    // Selection
    selectSession: (id: string | null) => void;
    selectAgreement: (id: string | null) => void;
}

export const useNettingStore = create<NettingState>()(
    persist(
        (set, get) => ({
            agreements: generateDemoAgreements(),
            sessions: generateDemoSessions(),
            offsets: generateDemoOffsets(),
            selectedSessionId: null,
            selectedAgreementId: null,

            // =========================================================================
            // AGREEMENTS
            // =========================================================================

            createAgreement: (data) => {
                const now = new Date().toISOString();
                const count = get().agreements.length + 1;
                const agreement: NettingAgreement = {
                    ...data,
                    id: `agree-${Date.now()}`,
                    agreementNumber: `NA-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`,
                    createdAt: now,
                    updatedAt: now,
                };
                set((state) => ({ agreements: [...state.agreements, agreement] }));
                return agreement;
            },

            updateAgreement: (id, updates) => {
                set((state) => ({
                    agreements: state.agreements.map((a) => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a),
                }));
            },

            deleteAgreement: (id) => {
                set((state) => ({ agreements: state.agreements.filter((a) => a.id !== id) }));
            },

            // =========================================================================
            // SESSIONS
            // =========================================================================

            createSession: (data) => {
                const now = new Date().toISOString();
                const count = get().sessions.length + 1;
                const prefix = data.type === 'intercompany' ? 'IC-' : '';
                const session: NettingSession = {
                    ...data,
                    id: `sess-${Date.now()}`,
                    sessionNumber: `NS-${new Date().getFullYear()}-${prefix}${String(count).padStart(3, '0')}`,
                    createdAt: now,
                    updatedAt: now,
                };
                set((state) => ({ sessions: [...state.sessions, session] }));
                return session;
            },

            updateSession: (id, updates) => {
                set((state) => ({
                    sessions: state.sessions.map((s) => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s),
                }));
            },

            approveSession: (id, approverName) => {
                set((state) => ({
                    sessions: state.sessions.map((s) => s.id === id ? {
                        ...s,
                        status: 'approved',
                        approvedByName: approverName,
                        approvedAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    } : s),
                }));
            },

            rejectSession: (id, reason) => {
                set((state) => ({
                    sessions: state.sessions.map((s) => s.id === id ? {
                        ...s,
                        status: 'rejected',
                        rejectedReason: reason,
                        updatedAt: new Date().toISOString(),
                    } : s),
                }));
            },

            settleSession: (id) => {
                set((state) => ({
                    sessions: state.sessions.map((s) => s.id === id ? { ...s, status: 'settled', updatedAt: new Date().toISOString() } : s),
                }));
            },

            cancelSession: (id) => {
                set((state) => ({
                    sessions: state.sessions.map((s) => s.id === id ? { ...s, status: 'cancelled', updatedAt: new Date().toISOString() } : s),
                }));
            },

            // =========================================================================
            // OFFSETS
            // =========================================================================

            createOffset: (data) => {
                const now = new Date().toISOString();
                const count = get().offsets.length + 1;
                const offset: OffsetEntry = {
                    ...data,
                    id: `offset-${Date.now()}`,
                    offsetNumber: `OFF-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`,
                    createdAt: now,
                    updatedAt: now,
                };
                set((state) => ({ offsets: [...state.offsets, offset] }));
                return offset;
            },

            approveOffset: (id, approverName) => {
                set((state) => ({
                    offsets: state.offsets.map((o) => o.id === id ? {
                        ...o,
                        status: 'approved',
                        approvedBy: approverName,
                        approvedAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    } : o),
                }));
            },

            applyOffset: (id) => {
                set((state) => ({
                    offsets: state.offsets.map((o) => o.id === id ? { ...o, status: 'applied', updatedAt: new Date().toISOString() } : o),
                }));
            },

            reverseOffset: (id) => {
                set((state) => ({
                    offsets: state.offsets.map((o) => o.id === id ? { ...o, status: 'reversed', updatedAt: new Date().toISOString() } : o),
                }));
            },

            // =========================================================================
            // ANALYTICS
            // =========================================================================

            getAnalytics: () => {
                const { sessions } = get();
                const settledSessions = sessions.filter((s) => s.status === 'settled');

                const totalGross = sessions.reduce((sum, s) => sum + s.grossAmount, 0);
                const totalNet = sessions.reduce((sum, s) => sum + s.netAmount, 0);
                const totalSavings = sessions.reduce((sum, s) => sum + s.savingsAmount, 0);

                return {
                    totalSessions: sessions.length,
                    settledSessions: settledSessions.length,
                    pendingSessions: sessions.filter((s) => s.status === 'pending_approval' || s.status === 'approved').length,
                    totalGrossAmount: totalGross,
                    totalNetAmount: totalNet,
                    totalSavings,
                    avgSavingsPercentage: sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.savingsPercentage, 0) / sessions.length : 0,
                    byType: {
                        counterparty: {
                            sessions: sessions.filter((s) => s.type === 'counterparty').length,
                            savings: sessions.filter((s) => s.type === 'counterparty').reduce((sum, s) => sum + s.savingsAmount, 0),
                        },
                        intercompany: {
                            sessions: sessions.filter((s) => s.type === 'intercompany').length,
                            savings: sessions.filter((s) => s.type === 'intercompany').reduce((sum, s) => sum + s.savingsAmount, 0),
                        },
                        multilateral: {
                            sessions: sessions.filter((s) => s.type === 'multilateral').length,
                            savings: sessions.filter((s) => s.type === 'multilateral').reduce((sum, s) => sum + s.savingsAmount, 0),
                        },
                    },
                    recentSessions: sessions.slice(0, 5).map((s) => ({ id: s.id, sessionNumber: s.sessionNumber, netAmount: s.netAmount, savings: s.savingsAmount, status: s.status })),
                    topCounterparties: [],
                };
            },

            getSessionPositions: (sessionId) => {
                const session = get().sessions.find((s) => s.id === sessionId);
                return session?.positions || [];
            },

            getSessionSettlements: (sessionId) => {
                const session = get().sessions.find((s) => s.id === sessionId);
                return session?.settlements || [];
            },

            selectSession: (id) => set({ selectedSessionId: id }),
            selectAgreement: (id) => set({ selectedAgreementId: id }),
        }),
        {
            name: 'primebalance-netting',
            partialize: (state) => ({
                agreements: state.agreements,
                sessions: state.sessions,
                offsets: state.offsets,
            }),
        }
    )
);