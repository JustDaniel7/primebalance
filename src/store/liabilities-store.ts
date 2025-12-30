// =============================================================================
// LIABILITIES ENGINE - ZUSTAND STORE (Full API Integration)
// src/store/liabilities-store.ts
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    Liability,
    LiabilityEvent,
    LiabilityPayment,
    LiabilitySettlement,
    LiabilityAccrual,
    LiabilityCovenantCheck,
    LiabilityException,
    LiabilityImportBatch,
    LiabilitySavedView,
    LiabilityFilters,
    LiabilityPagination,
    LiabilityStatistics,
    CreateLiabilityRequest,
    SettleLiabilityRequest,
    SchedulePaymentRequest,
    AccrueInterestRequest,
    ApplyFeeRequest,
    CheckCovenantRequest,
    ImportLiabilitiesRequest,
    LiabilityPrimaryClass,
    LiabilityStatus,
    RiskLevel,
} from '@/types/liabilities';

// =============================================================================
// STATE INTERFACE
// =============================================================================

interface LiabilitiesState {
    // Core data
    liabilities: Liability[];
    currentLiability: Liability | null;

    // Related data for current liability
    events: LiabilityEvent[];
    payments: LiabilityPayment[];
    settlements: LiabilitySettlement[];
    accruals: LiabilityAccrual[];
    covenantChecks: LiabilityCovenantCheck[];

    // Exception queue
    exceptions: LiabilityException[];

    // Import batches
    importBatches: LiabilityImportBatch[];

    // Saved views
    savedViews: LiabilitySavedView[];

    // UI State
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;

    // Pagination & Filters
    pagination: LiabilityPagination;
    filters: LiabilityFilters;
    currentView: string | null;

    // Statistics
    statistics: LiabilityStatistics | null;

    // ==========================================================================
    // API ACTIONS - CRUD
    // ==========================================================================

    fetchLiabilities: (filters?: LiabilityFilters, page?: number, limit?: number) => Promise<void>;
    fetchLiability: (id: string, options?: {
        includeEvents?: boolean;
        includePayments?: boolean;
        includeSettlements?: boolean;
        includeAccruals?: boolean;
        includeCovenantChecks?: boolean;
    }) => Promise<Liability | null>;
    fetchLiabilityAsOf: (id: string, asOfDate: string) => Promise<any>;
    createLiability: (data: CreateLiabilityRequest) => Promise<Liability | null>;
    updateLiability: (id: string, updates: Partial<Liability>) => Promise<Liability | null>;

    // ==========================================================================
    // API ACTIONS - STATE TRANSITIONS
    // ==========================================================================

    recognizeLiability: (id: string, data?: { recognitionDate?: string; notes?: string }) => Promise<boolean>;
    activateLiability: (id: string, data?: { activationDate?: string; notes?: string }) => Promise<boolean>;
    settleLiability: (id: string, data: SettleLiabilityRequest) => Promise<boolean>;
    reverseLiability: (id: string, data: { reason: string; reversalType?: 'full' | 'partial'; amount?: number }) => Promise<boolean>;
    disputeLiability: (id: string, data: { reason: string; disputeAmount?: number }) => Promise<boolean>;
    resolveDispute: (id: string, data: { resolution: string; adjustedAmount?: number }) => Promise<boolean>;
    defaultLiability: (id: string, data: { reason: string; defaultDate?: string }) => Promise<boolean>;
    writeOffLiability: (id: string, data: { reason: string; reasonCode: string; amount?: number }) => Promise<boolean>;
    restructureLiability: (id: string, data: { reason: string; newTerms: any }) => Promise<boolean>;
    archiveLiability: (id: string, data?: { reason?: string }) => Promise<boolean>;

    // ==========================================================================
    // API ACTIONS - PAYMENTS
    // ==========================================================================

    fetchPayments: (liabilityId: string) => Promise<void>;
    schedulePayment: (liabilityId: string, data: SchedulePaymentRequest) => Promise<boolean>;
    executePayment: (paymentId: string, data?: { paymentMethod?: string; bankReference?: string }) => Promise<boolean>;
    approvePayment: (paymentId: string, comments?: string) => Promise<boolean>;
    rejectPayment: (paymentId: string, reason: string) => Promise<boolean>;

    // ==========================================================================
    // API ACTIONS - INTEREST & FEES
    // ==========================================================================

    accrueInterest: (liabilityId: string, data?: AccrueInterestRequest) => Promise<boolean>;
    applyFee: (liabilityId: string, data: ApplyFeeRequest) => Promise<boolean>;
    fetchAccruals: (liabilityId: string) => Promise<void>;

    // ==========================================================================
    // API ACTIONS - FX
    // ==========================================================================

    revalueFx: (liabilityId: string, data: { newFxRate: number; fxSource?: string }) => Promise<boolean>;

    // ==========================================================================
    // API ACTIONS - COVENANTS
    // ==========================================================================

    fetchCovenantChecks: (liabilityId: string) => Promise<void>;
    checkCovenant: (liabilityId: string, data: CheckCovenantRequest) => Promise<boolean>;

    // ==========================================================================
    // API ACTIONS - EVENTS
    // ==========================================================================

    fetchEvents: (liabilityId: string, options?: { eventType?: string; limit?: number }) => Promise<void>;

    // ==========================================================================
    // API ACTIONS - IMPORT/EXPORT
    // ==========================================================================

    importLiabilities: (data: ImportLiabilitiesRequest) => Promise<{ batchNumber: string; results: any } | null>;
    fetchImportBatches: () => Promise<void>;
    rollbackImport: (batchId: string) => Promise<boolean>;

    // ==========================================================================
    // API ACTIONS - EXCEPTIONS
    // ==========================================================================

    fetchExceptions: (filters?: { status?: string; type?: string }) => Promise<void>;
    resolveException: (id: string, data: { resolution: string; resolutionAction?: string }) => Promise<boolean>;

    // ==========================================================================
    // API ACTIONS - STATISTICS
    // ==========================================================================

    fetchStatistics: () => Promise<void>;

    // ==========================================================================
    // API ACTIONS - BATCH
    // ==========================================================================

    batchOperation: (operation: string, liabilityIds: string[], params?: any) => Promise<any>;

    // ==========================================================================
    // LOCAL ACTIONS
    // ==========================================================================

    setCurrentLiability: (liability: Liability | null) => void;
    setFilters: (filters: Partial<LiabilityFilters>) => void;
    clearFilters: () => void;
    setCurrentView: (viewId: string | null) => void;
    clearError: () => void;
    reset: () => void;

    // ==========================================================================
    // COMPUTED / GETTERS
    // ==========================================================================

    getLiabilityById: (id: string) => Liability | undefined;
    getLiabilitiesByStatus: (status: LiabilityStatus | string) => Liability[];
    getLiabilitiesByPrimaryClass: (primaryClass: LiabilityPrimaryClass | string) => Liability[];
    getLiabilitiesByRiskLevel: (riskLevel: RiskLevel | string) => Liability[];
    getLiabilitiesInDefault: () => Liability[];
    getLiabilitiesInDispute: () => Liability[];
    getOverdueLiabilities: () => Liability[];
    getUpcomingPayments: (days: number) => LiabilityPayment[];
    getUpcomingMaturities: (days: number) => Liability[];
    getTotalOutstanding: () => number;
    getTotalOutstandingByCurrency: () => Record<string, number>;
    getSummary: () => {
        totalLiabilities: number;
        shortTermTotal: number;
        longTermTotal: number;
        totalCreditLimit: number;
        availableCredit: number;
        drawnDebt: number;
        utilizationPercent: number;
        upcomingPayments30Days: number;
        upcomingMaturities90Days: number;
    };
    getActiveAlerts: () => Array<{
        id: string;
        type: string;
        message: string;
        severity: 'warning' | 'critical';
        liabilityId?: string;
    }>;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialFilters: LiabilityFilters = {};

const initialPagination: LiabilityPagination = {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useLiabilitiesStore = create<LiabilitiesState>()(
    persist(
        (set, get) => ({
            // Initial state
            liabilities: [],
            currentLiability: null,
            events: [],
            payments: [],
            settlements: [],
            accruals: [],
            covenantChecks: [],
            exceptions: [],
            importBatches: [],
            savedViews: [],
            isLoading: false,
            error: null,
            isInitialized: false,
            pagination: initialPagination,
            filters: initialFilters,
            currentView: null,
            statistics: null,

            // ========================================================================
            // FETCH LIABILITIES
            // ========================================================================

            fetchLiabilities: async (filters?: LiabilityFilters, page = 1, limit = 50) => {
                set({ isLoading: true, error: null });
                try {
                    const params = new URLSearchParams();
                    params.set('page', String(page));
                    params.set('limit', String(limit));

                    const activeFilters = filters || get().filters;

                    if (activeFilters.primaryClass) params.set('primaryClass', activeFilters.primaryClass);
                    if (activeFilters.primaryClasses?.length) params.set('primaryClasses', activeFilters.primaryClasses.join(','));
                    if (activeFilters.status) params.set('status', activeFilters.status);
                    if (activeFilters.statuses?.length) params.set('statuses', activeFilters.statuses.join(','));
                    if (activeFilters.counterpartyId) params.set('counterpartyId', activeFilters.counterpartyId);
                    if (activeFilters.counterpartyName) params.set('counterpartyName', activeFilters.counterpartyName);
                    if (activeFilters.counterpartyType) params.set('counterpartyType', activeFilters.counterpartyType);
                    if (activeFilters.partyId) params.set('partyId', activeFilters.partyId);
                    if (activeFilters.legalEntityId) params.set('legalEntityId', activeFilters.legalEntityId);
                    if (activeFilters.currency) params.set('currency', activeFilters.currency);
                    if (activeFilters.riskLevel) params.set('riskLevel', activeFilters.riskLevel);
                    if (activeFilters.riskLevels?.length) params.set('riskLevels', activeFilters.riskLevels.join(','));
                    if (activeFilters.isInDefault !== undefined) params.set('isInDefault', String(activeFilters.isInDefault));
                    if (activeFilters.isDisputed !== undefined) params.set('isDisputed', String(activeFilters.isDisputed));
                    if (activeFilters.isHedged !== undefined) params.set('isHedged', String(activeFilters.isHedged));
                    if (activeFilters.isInterestBearing !== undefined) params.set('isInterestBearing', String(activeFilters.isInterestBearing));
                    if (activeFilters.isSecured !== undefined) params.set('isSecured', String(activeFilters.isSecured));
                    if (activeFilters.maturityFrom) params.set('maturityFrom', activeFilters.maturityFrom);
                    if (activeFilters.maturityTo) params.set('maturityTo', activeFilters.maturityTo);
                    if (activeFilters.inceptionFrom) params.set('inceptionFrom', activeFilters.inceptionFrom);
                    if (activeFilters.inceptionTo) params.set('inceptionTo', activeFilters.inceptionTo);
                    if (activeFilters.amountMin !== undefined) params.set('amountMin', String(activeFilters.amountMin));
                    if (activeFilters.amountMax !== undefined) params.set('amountMax', String(activeFilters.amountMax));
                    if (activeFilters.tags?.length) params.set('tags', activeFilters.tags.join(','));
                    if (activeFilters.sourceType) params.set('sourceType', activeFilters.sourceType);
                    if (activeFilters.search) params.set('search', activeFilters.search);

                    const response = await fetch(`/api/liabilities?${params.toString()}`);
                    if (!response.ok) throw new Error('Failed to fetch liabilities');

                    const data = await response.json();

                    set({
                        liabilities: data.liabilities,
                        pagination: data.pagination,
                        statistics: data.statistics,
                        isLoading: false,
                        isInitialized: true,
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            // ========================================================================
            // FETCH SINGLE LIABILITY
            // ========================================================================

            fetchLiability: async (id, options = {}) => {
                set({ isLoading: true, error: null });
                try {
                    const params = new URLSearchParams();
                    if (options.includeEvents) params.set('includeEvents', 'true');
                    if (options.includePayments) params.set('includePayments', 'true');
                    if (options.includeSettlements) params.set('includeSettlements', 'true');
                    if (options.includeAccruals) params.set('includeAccruals', 'true');
                    if (options.includeCovenantChecks) params.set('includeCovenantChecks', 'true');

                    const url = params.toString()
                        ? `/api/liabilities/${id}?${params.toString()}`
                        : `/api/liabilities/${id}`;

                    const response = await fetch(url);
                    if (!response.ok) {
                        if (response.status === 404) {
                            set({ currentLiability: null, isLoading: false });
                            return null;
                        }
                        throw new Error('Failed to fetch liability');
                    }

                    const data = await response.json();

                    set({
                        currentLiability: data.liability,
                        events: data.events || [],
                        payments: data.payments || [],
                        settlements: data.settlements || [],
                        accruals: data.accruals || [],
                        covenantChecks: data.covenantChecks || [],
                        isLoading: false,
                    });

                    return data.liability;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return null;
                }
            },

            // ========================================================================
            // FETCH LIABILITY AS OF (Time-Travel)
            // ========================================================================

            fetchLiabilityAsOf: async (id, asOfDate) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/${id}?as_of=${encodeURIComponent(asOfDate)}`);
                    if (!response.ok) throw new Error('Failed to fetch historical state');

                    const data = await response.json();
                    set({ isLoading: false });
                    return data;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return null;
                }
            },

            // ========================================================================
            // CREATE LIABILITY
            // ========================================================================

            createLiability: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch('/api/liabilities', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to create liability');
                    }

                    const result = await response.json();

                    // Add to list
                    set((state) => ({
                        liabilities: [result.liability, ...state.liabilities],
                        currentLiability: result.liability,
                        isLoading: false,
                    }));

                    return result.liability;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return null;
                }
            },

            // ========================================================================
            // UPDATE LIABILITY (Draft only)
            // ========================================================================

            updateLiability: async (id, updates) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updates),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to update liability');
                    }

                    const result = await response.json();

                    // Update in list
                    set((state) => ({
                        liabilities: state.liabilities.map((l) =>
                            l.id === result.liability.id ? result.liability : l
                        ),
                        currentLiability: state.currentLiability?.id === result.liability.id
                            ? result.liability
                            : state.currentLiability,
                        isLoading: false,
                    }));

                    return result.liability;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return null;
                }
            },

            // ========================================================================
            // STATE TRANSITIONS
            // ========================================================================

            recognizeLiability: async (id, data = {}) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/${id}/recognize`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to recognize liability');
                    }

                    const result = await response.json();

                    set((state) => ({
                        liabilities: state.liabilities.map((l) =>
                            l.id === result.liability.id ? result.liability : l
                        ),
                        currentLiability: state.currentLiability?.id === result.liability.id
                            ? result.liability
                            : state.currentLiability,
                        isLoading: false,
                    }));

                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            activateLiability: async (id, data = {}) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/${id}/activate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to activate liability');
                    }

                    const result = await response.json();

                    set((state) => ({
                        liabilities: state.liabilities.map((l) =>
                            l.id === result.liability.id ? result.liability : l
                        ),
                        currentLiability: state.currentLiability?.id === result.liability.id
                            ? result.liability
                            : state.currentLiability,
                        isLoading: false,
                    }));

                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            settleLiability: async (id, data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/${id}/settle`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to settle liability');
                    }

                    const result = await response.json();

                    set((state) => ({
                        liabilities: state.liabilities.map((l) =>
                            l.id === result.liability.id ? result.liability : l
                        ),
                        currentLiability: state.currentLiability?.id === result.liability.id
                            ? result.liability
                            : state.currentLiability,
                        settlements: state.currentLiability?.id === result.liability.id
                            ? [result.settlement, ...state.settlements]
                            : state.settlements,
                        isLoading: false,
                    }));

                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            reverseLiability: async (id, data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/${id}/reverse`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to reverse liability');
                    }

                    const result = await response.json();

                    set((state) => ({
                        liabilities: state.liabilities.map((l) =>
                            l.id === result.liability.id ? result.liability : l
                        ),
                        currentLiability: state.currentLiability?.id === result.liability.id
                            ? result.liability
                            : state.currentLiability,
                        isLoading: false,
                    }));

                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            disputeLiability: async (id, data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/${id}/dispute`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to dispute liability');
                    }

                    const result = await response.json();

                    set((state) => ({
                        liabilities: state.liabilities.map((l) =>
                            l.id === result.liability.id ? result.liability : l
                        ),
                        currentLiability: state.currentLiability?.id === result.liability.id
                            ? result.liability
                            : state.currentLiability,
                        isLoading: false,
                    }));

                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            resolveDispute: async (id, data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/${id}/dispute`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to resolve dispute');
                    }

                    const result = await response.json();

                    set((state) => ({
                        liabilities: state.liabilities.map((l) =>
                            l.id === result.liability.id ? result.liability : l
                        ),
                        currentLiability: state.currentLiability?.id === result.liability.id
                            ? result.liability
                            : state.currentLiability,
                        isLoading: false,
                    }));

                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            defaultLiability: async (id, data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/${id}/default`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to mark as default');
                    }

                    const result = await response.json();

                    set((state) => ({
                        liabilities: state.liabilities.map((l) =>
                            l.id === result.liability.id ? result.liability : l
                        ),
                        currentLiability: state.currentLiability?.id === result.liability.id
                            ? result.liability
                            : state.currentLiability,
                        isLoading: false,
                    }));

                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            writeOffLiability: async (id, data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/${id}/write-off`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to write off liability');
                    }

                    const result = await response.json();

                    set((state) => ({
                        liabilities: state.liabilities.map((l) =>
                            l.id === result.liability.id ? result.liability : l
                        ),
                        currentLiability: state.currentLiability?.id === result.liability.id
                            ? result.liability
                            : state.currentLiability,
                        isLoading: false,
                    }));

                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            restructureLiability: async (id, data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/${id}/restructure`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to restructure liability');
                    }

                    const result = await response.json();

                    set((state) => ({
                        liabilities: state.liabilities.map((l) =>
                            l.id === result.liability.id ? result.liability : l
                        ),
                        currentLiability: state.currentLiability?.id === result.liability.id
                            ? result.liability
                            : state.currentLiability,
                        isLoading: false,
                    }));

                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            archiveLiability: async (id, data = {}) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/${id}/archive`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to archive liability');
                    }

                    const result = await response.json();

                    set((state) => ({
                        liabilities: state.liabilities.map((l) =>
                            l.id === result.liability.id ? result.liability : l
                        ),
                        currentLiability: state.currentLiability?.id === result.liability.id
                            ? result.liability
                            : state.currentLiability,
                        isLoading: false,
                    }));

                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            // ========================================================================
            // PAYMENTS
            // ========================================================================

            fetchPayments: async (liabilityId) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/${liabilityId}/payments`);
                    if (!response.ok) throw new Error('Failed to fetch payments');

                    const data = await response.json();
                    set({ payments: data.payments, isLoading: false });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            schedulePayment: async (liabilityId, data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/${liabilityId}/payments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to schedule payment');
                    }

                    const result = await response.json();

                    set((state) => ({
                        payments: [result.payment, ...state.payments],
                        isLoading: false,
                    }));

                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            executePayment: async (paymentId, data = {}) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/payments/${paymentId}/execute`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to execute payment');
                    }

                    const result = await response.json();

                    set((state) => ({
                        payments: state.payments.map((p) =>
                            p.id === result.payment.id ? result.payment : p
                        ),
                        liabilities: state.liabilities.map((l) =>
                            l.id === result.liability.id
                                ? { ...l, ...result.liability }
                                : l
                        ),
                        currentLiability: state.currentLiability?.id === result.liability.id
                            ? { ...state.currentLiability, ...result.liability }
                            : state.currentLiability,
                        isLoading: false,
                    }));

                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            approvePayment: async (paymentId, comments) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/payments/${paymentId}/approve`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ comments }),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to approve payment');
                    }

                    const result = await response.json();

                    set((state) => ({
                        payments: state.payments.map((p) =>
                            p.id === result.payment.id ? result.payment : p
                        ),
                        isLoading: false,
                    }));

                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            rejectPayment: async (paymentId, reason) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/payments/${paymentId}/approve`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reason }),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to reject payment');
                    }

                    const result = await response.json();

                    set((state) => ({
                        payments: state.payments.map((p) =>
                            p.id === result.payment.id ? result.payment : p
                        ),
                        isLoading: false,
                    }));

                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            // ========================================================================
            // INTEREST & FEES
            // ========================================================================

            accrueInterest: async (liabilityId, data = {}) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/${liabilityId}/accrue`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to accrue interest');
                    }

                    const result = await response.json();

                    set((state) => ({
                        accruals: [result.accrual, ...state.accruals],
                        liabilities: state.liabilities.map((l) =>
                            l.liabilityId === result.liability.liabilityId
                                ? { ...l, ...result.liability }
                                : l
                        ),
                        currentLiability: state.currentLiability?.liabilityId === result.liability.liabilityId
                            ? { ...state.currentLiability, ...result.liability }
                            : state.currentLiability,
                        isLoading: false,
                    }));

                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            applyFee: async (liabilityId, data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/${liabilityId}/fees`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to apply fee');
                    }

                    const result = await response.json();

                    set((state) => ({
                        accruals: [result.accrual, ...state.accruals],
                        liabilities: state.liabilities.map((l) =>
                            l.liabilityId === result.liability.liabilityId
                                ? { ...l, ...result.liability }
                                : l
                        ),
                        currentLiability: state.currentLiability?.liabilityId === result.liability.liabilityId
                            ? { ...state.currentLiability, ...result.liability }
                            : state.currentLiability,
                        isLoading: false,
                    }));

                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            fetchAccruals: async (liabilityId) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/${liabilityId}/fees`);
                    if (!response.ok) throw new Error('Failed to fetch accruals');

                    const data = await response.json();
                    set({ accruals: data.accruals, isLoading: false });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            // ========================================================================
            // FX REVALUATION
            // ========================================================================

            revalueFx: async (liabilityId, data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/${liabilityId}/fx-revalue`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to revalue FX');
                    }

                    const result = await response.json();

                    set((state) => ({
                        liabilities: state.liabilities.map((l) =>
                            l.liabilityId === result.liability.liabilityId
                                ? { ...l, ...result.liability }
                                : l
                        ),
                        currentLiability: state.currentLiability?.liabilityId === result.liability.liabilityId
                            ? { ...state.currentLiability, ...result.liability }
                            : state.currentLiability,
                        isLoading: false,
                    }));

                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            // ========================================================================
            // COVENANTS
            // ========================================================================

            fetchCovenantChecks: async (liabilityId) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/${liabilityId}/covenants`);
                    if (!response.ok) throw new Error('Failed to fetch covenant checks');

                    const data = await response.json();
                    set({ covenantChecks: data.checks, isLoading: false });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            checkCovenant: async (liabilityId, data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/${liabilityId}/covenants`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to check covenant');
                    }

                    const result = await response.json();

                    set((state) => ({
                        covenantChecks: [result.check, ...state.covenantChecks],
                        isLoading: false,
                    }));

                    // Refresh liability if breach occurred
                    if (result.isBreached) {
                        get().fetchLiability(liabilityId);
                    }

                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            // ========================================================================
            // EVENTS
            // ========================================================================

            fetchEvents: async (liabilityId, options = {}) => {
                set({ isLoading: true, error: null });
                try {
                    const params = new URLSearchParams();
                    if (options.eventType) params.set('eventType', options.eventType);
                    if (options.limit) params.set('limit', String(options.limit));

                    const url = params.toString()
                        ? `/api/liabilities/${liabilityId}/events?${params.toString()}`
                        : `/api/liabilities/${liabilityId}/events`;

                    const response = await fetch(url);
                    if (!response.ok) throw new Error('Failed to fetch events');

                    const data = await response.json();
                    set({ events: data.events, isLoading: false });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            // ========================================================================
            // IMPORT/EXPORT
            // ========================================================================

            importLiabilities: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch('/api/liabilities/import', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to import liabilities');
                    }

                    const result = await response.json();

                    // Refresh liabilities list
                    get().fetchLiabilities();
                    get().fetchImportBatches();

                    set({ isLoading: false });
                    return { batchNumber: result.batchNumber, results: result.results };
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return null;
                }
            },

            fetchImportBatches: async () => {
                try {
                    const response = await fetch('/api/liabilities/import');
                    if (!response.ok) throw new Error('Failed to fetch import batches');

                    const data = await response.json();
                    set({ importBatches: data.batches });
                } catch (error: any) {
                    set({ error: error.message });
                }
            },

            rollbackImport: async (batchId) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/import/${batchId}/rollback`, {
                        method: 'POST',
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to rollback import');
                    }

                    // Refresh data
                    get().fetchLiabilities();
                    get().fetchImportBatches();

                    set({ isLoading: false });
                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            // ========================================================================
            // EXCEPTIONS
            // ========================================================================

            fetchExceptions: async (filters = {}) => {
                set({ isLoading: true, error: null });
                try {
                    const params = new URLSearchParams();
                    if (filters.status) params.set('status', filters.status);
                    if (filters.type) params.set('type', filters.type);

                    const url = params.toString()
                        ? `/api/liabilities/exceptions?${params.toString()}`
                        : '/api/liabilities/exceptions';

                    const response = await fetch(url);
                    if (!response.ok) throw new Error('Failed to fetch exceptions');

                    const data = await response.json();
                    set({ exceptions: data.exceptions, isLoading: false });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            resolveException: async (id, data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/liabilities/exceptions/${id}/resolve`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to resolve exception');
                    }

                    const result = await response.json();

                    set((state) => ({
                        exceptions: state.exceptions.map((e) =>
                            e.id === result.exception.id ? result.exception : e
                        ),
                        isLoading: false,
                    }));

                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            // ========================================================================
            // STATISTICS
            // ========================================================================

            fetchStatistics: async () => {
                try {
                    const response = await fetch('/api/liabilities/statistics');
                    if (!response.ok) throw new Error('Failed to fetch statistics');

                    const data = await response.json();
                    set({ statistics: data });
                } catch (error: any) {
                    set({ error: error.message });
                }
            },

            // ========================================================================
            // BATCH OPERATIONS
            // ========================================================================

            batchOperation: async (operation, liabilityIds, params = {}) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch('/api/liabilities/batch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ operation, liabilityIds, params }),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to execute batch operation');
                    }

                    const result = await response.json();

                    // Refresh liabilities
                    get().fetchLiabilities();

                    set({ isLoading: false });
                    return result;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return null;
                }
            },

            // ========================================================================
            // LOCAL ACTIONS
            // ========================================================================

            setCurrentLiability: (liability) => set({ currentLiability: liability }),

            setFilters: (filters) => set((state) => ({
                filters: { ...state.filters, ...filters },
            })),

            clearFilters: () => set({ filters: initialFilters }),

            setCurrentView: (viewId) => set({ currentView: viewId }),

            clearError: () => set({ error: null }),

            reset: () => set({
                liabilities: [],
                currentLiability: null,
                events: [],
                payments: [],
                settlements: [],
                accruals: [],
                covenantChecks: [],
                exceptions: [],
                importBatches: [],
                isLoading: false,
                error: null,
                isInitialized: false,
                pagination: initialPagination,
                filters: initialFilters,
                statistics: null,
            }),

            // ========================================================================
            // GETTERS / COMPUTED
            // ========================================================================

            getLiabilityById: (id) => {
                return get().liabilities.find((l) => l.id === id || l.liabilityId === id);
            },

            getLiabilitiesByStatus: (status) => {
                return get().liabilities.filter((l) => l.status === status);
            },

            getLiabilitiesByPrimaryClass: (primaryClass) => {
                return get().liabilities.filter((l) => l.primaryClass === primaryClass);
            },

            getLiabilitiesByRiskLevel: (riskLevel) => {
                return get().liabilities.filter((l) => l.riskLevel === riskLevel);
            },

            getLiabilitiesInDefault: () => {
                return get().liabilities.filter((l) => l.isInDefault);
            },

            getLiabilitiesInDispute: () => {
                return get().liabilities.filter((l) => l.isDisputed);
            },

            getOverdueLiabilities: () => {
                return get().liabilities.filter((l) => l.daysOverdue > 0);
            },

            getUpcomingPayments: (days) => {
                const now = new Date();
                const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
                return get().payments.filter((p) => {
                    if (!p.scheduledDate) return false;
                    const scheduled = new Date(p.scheduledDate);
                    return scheduled >= now && scheduled <= futureDate && p.status === 'scheduled';
                });
            },

            getUpcomingMaturities: (days) => {
                const now = new Date();
                const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
                return get().liabilities.filter((l) => {
                    if (!l.maturityDate) return false;
                    const maturity = new Date(l.maturityDate);
                    return maturity >= now && maturity <= futureDate;
                });
            },

            getTotalOutstanding: () => {
                return get().liabilities.reduce((sum, l) => sum + (l.totalOutstanding || 0), 0);
            },

            getTotalOutstandingByCurrency: () => {
                return get().liabilities.reduce((acc, l) => {
                    const currency = l.currency || 'EUR';
                    acc[currency] = (acc[currency] || 0) + (l.totalOutstanding || 0);
                    return acc;
                }, {} as Record<string, number>);
            },

            getSummary: () => {
                const liabilities = get().liabilities;
                const payments = get().payments;
                const now = new Date();
                const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

                const shortTermClasses = ['accounts_payable', 'accrued_expenses', 'short_term_debt', 'tax_liability', 'payroll_liability'];
                const longTermClasses = ['long_term_debt', 'lease_finance', 'lease_operating'];

                const shortTermTotal = liabilities
                    .filter((l) => shortTermClasses.includes(l.primaryClass as string))
                    .reduce((sum, l) => sum + (l.totalOutstanding || 0), 0);

                const longTermTotal = liabilities
                    .filter((l) => longTermClasses.includes(l.primaryClass as string))
                    .reduce((sum, l) => sum + (l.totalOutstanding || 0), 0);

                const totalLiabilities = liabilities.reduce((sum, l) => sum + (l.totalOutstanding || 0), 0);

                const totalCreditLimit = liabilities
                    .filter((l) => l.creditLimit && l.creditLimit > 0)
                    .reduce((sum, l) => sum + (l.creditLimit || 0), 0);

                const drawnDebt = liabilities
                    .filter((l) => l.creditLimit && l.creditLimit > 0)
                    .reduce((sum, l) => sum + (l.totalOutstanding || 0), 0);

                const availableCredit = totalCreditLimit - drawnDebt;
                const utilizationPercent = totalCreditLimit > 0 ? (drawnDebt / totalCreditLimit) * 100 : 0;

                const upcomingPayments30Days = payments
                    .filter((p) => {
                        if (!p.scheduledDate) return false;
                        const scheduled = new Date(p.scheduledDate);
                        return scheduled >= now && scheduled <= in30Days && p.status === 'scheduled';
                    })
                    .reduce((sum, p) => sum + (p.amount || 0), 0);

                const upcomingMaturities90Days = liabilities.filter((l) => {
                    if (!l.maturityDate) return false;
                    const maturity = new Date(l.maturityDate);
                    return maturity >= now && maturity <= in90Days;
                }).length;

                return {
                    totalLiabilities,
                    shortTermTotal,
                    longTermTotal,
                    totalCreditLimit,
                    availableCredit,
                    drawnDebt,
                    utilizationPercent,
                    upcomingPayments30Days,
                    upcomingMaturities90Days,
                };
            },

            getActiveAlerts: () => {
                const liabilities = get().liabilities;
                const alerts: Array<{
                    id: string;
                    type: string;
                    message: string;
                    severity: 'warning' | 'critical';
                    liabilityId?: string;
                }> = [];

                // Check for liabilities in default
                liabilities.filter((l) => l.isInDefault).forEach((l) => {
                    alerts.push({
                        id: `default-${l.id}`,
                        type: 'default',
                        message: `${l.name} is in default`,
                        severity: 'critical',
                        liabilityId: l.id,
                    });
                });

                // Check for covenant breaches
                liabilities.filter((l) => l.covenantBreaches > 0).forEach((l) => {
                    alerts.push({
                        id: `covenant-${l.id}`,
                        type: 'covenant_breach',
                        message: `${l.name} has ${l.covenantBreaches} covenant breach(es)`,
                        severity: 'critical',
                        liabilityId: l.id,
                    });
                });

                // Check for overdue liabilities
                liabilities.filter((l) => l.daysOverdue > 0).forEach((l) => {
                    alerts.push({
                        id: `overdue-${l.id}`,
                        type: 'overdue',
                        message: `${l.name} is ${l.daysOverdue} days overdue`,
                        severity: l.daysOverdue > 30 ? 'critical' : 'warning',
                        liabilityId: l.id,
                    });
                });

                // Check for disputed liabilities
                liabilities.filter((l) => l.isDisputed).forEach((l) => {
                    alerts.push({
                        id: `dispute-${l.id}`,
                        type: 'dispute',
                        message: `${l.name} is under dispute`,
                        severity: 'warning',
                        liabilityId: l.id,
                    });
                });

                return alerts;
            },
        }),
        {
            name: 'primebalance-liabilities-v2',
            partialize: (state) => ({
                filters: state.filters,
                currentView: state.currentView,
            }),
        }
    )
);

// =============================================================================
// SELECTOR HOOKS (Performance optimization)
// =============================================================================

export const useLiabilitiesList = () => useLiabilitiesStore((state) => state.liabilities);
export const useCurrentLiability = () => useLiabilitiesStore((state) => state.currentLiability);
export const useLiabilitiesLoading = () => useLiabilitiesStore((state) => state.isLoading);
export const useLiabilitiesError = () => useLiabilitiesStore((state) => state.error);
export const useLiabilitiesPagination = () => useLiabilitiesStore((state) => state.pagination);
export const useLiabilitiesFilters = () => useLiabilitiesStore((state) => state.filters);
export const useLiabilitiesStatistics = () => useLiabilitiesStore((state) => state.statistics);
export const useLiabilityEvents = () => useLiabilitiesStore((state) => state.events);
export const useLiabilityPayments = () => useLiabilitiesStore((state) => state.payments);
export const useLiabilitySettlements = () => useLiabilitiesStore((state) => state.settlements);
export const useLiabilityAccruals = () => useLiabilitiesStore((state) => state.accruals);
export const useLiabilityCovenantChecks = () => useLiabilitiesStore((state) => state.covenantChecks);
export const useLiabilityExceptions = () => useLiabilitiesStore((state) => state.exceptions);