// =============================================================================
// DUNNING & RECEIVABLES ENFORCEMENT - ZUSTAND STORE
// Full API Integration (TS All Sections)
// src/stores/dunningStore.ts
// =============================================================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
    Dunning,
    DunningEvent,
    DunningProposal,
    DunningCommunication,
    DunningInterestAccrual,
    DunningFee,
    DunningDisputeRecord,
    DunningImportBatch,
    DunningAutomationRule,
    DunningException,
    DunningTemplate,
    DunningJurisdictionConfig,
    DunningSavedView,
    DunningFilters,
    DunningPagination,
    DunningStatistics,
    CreateDunningRequest,
    ApproveProposalRequest,
    RejectProposalRequest,
    SendCommunicationRequest,
    InitiateLevel3Request,
    DisputeDunningRequest,
    ResolveDisputeRequest,
    SettleDunningRequest,
    WriteOffDunningRequest,
    CalculateInterestRequest,
    ApplyFeeRequest,
    ImportDunningRequest,
    BulkApproveProposalsRequest,
    ProposalStatus,
    DunningExceptionStatus,
} from '@/types/dunning';

// =============================================================================
// STATE INTERFACE
// =============================================================================

interface DunningState {
    // Data
    dunnings: Dunning[];
    currentDunning: Dunning | null;
    currentDunningEvents: DunningEvent[];
    currentDunningProposals: DunningProposal[];
    currentDunningCommunications: DunningCommunication[];
    currentDunningInterestAccruals: DunningInterestAccrual[];
    currentDunningFees: DunningFee[];
    currentDunningDisputes: DunningDisputeRecord[];

    // Proposals
    proposals: DunningProposal[];
    proposalsPagination: DunningPagination | null;
    proposalsStatistics: any;

    // Exceptions
    exceptions: DunningException[];
    exceptionsPagination: DunningPagination | null;
    exceptionsStatistics: any;
    currentException: DunningException | null;

    // Import
    importBatches: DunningImportBatch[];
    importBatchesPagination: DunningPagination | null;
    currentImportResult: any;

    // Automation
    automationRules: DunningAutomationRule[];
    currentRule: DunningAutomationRule | null;
    automationRunResult: any;

    // Templates
    templates: DunningTemplate[];

    // Jurisdictions
    jurisdictions: DunningJurisdictionConfig[];

    // Saved Views
    savedViews: DunningSavedView[];

    // Pagination & Statistics
    pagination: DunningPagination | null;
    statistics: DunningStatistics | null;

    // Filters
    filters: DunningFilters;

    // UI State
    isLoading: boolean;
    isSubmitting: boolean;
    error: string | null;
    successMessage: string | null;

    // Time Travel
    timeTravelState: any;
    timeTravelDate: string | null;

    // Actions - Core CRUD
    fetchDunnings: (filters?: DunningFilters, page?: number, limit?: number) => Promise<void>;
    fetchDunning: (id: string, options?: { includeEvents?: boolean; includeProposals?: boolean; includeCommunications?: boolean; includeInterest?: boolean; includeFees?: boolean; includeDisputes?: boolean }) => Promise<void>;
    createDunning: (data: CreateDunningRequest) => Promise<Dunning | null>;
    updateDunning: (id: string, data: Partial<Dunning>) => Promise<Dunning | null>;

    // Actions - Time Travel (TS Section 4.2)
    fetchDunningAsOf: (id: string, asOfDate: string) => Promise<void>;
    clearTimeTravel: () => void;

    // Actions - Events
    fetchDunningEvents: (id: string, page?: number, limit?: number) => Promise<void>;

    // Actions - Verification (TS Section 6)
    verifyDunning: (id: string) => Promise<any>;

    // Actions - Proposals (TS Sections 8, 9)
    fetchProposals: (filters?: any, page?: number, limit?: number) => Promise<void>;
    proposeAction: (id: string, options?: { forceLevel?: number; includeInterest?: boolean; includeFees?: boolean }) => Promise<DunningProposal | null>;
    approveProposal: (dunningId: string, proposalId?: string, data?: ApproveProposalRequest) => Promise<DunningProposal | null>;
    rejectProposal: (dunningId: string, proposalId: string, data: RejectProposalRequest) => Promise<DunningProposal | null>;
    bulkApproveProposals: (data: BulkApproveProposalsRequest) => Promise<any>;

    // Actions - Level 3 (TS Section 8.4)
    initiateLevel3: (id: string, data: InitiateLevel3Request) => Promise<DunningProposal | null>;
    approveLevel3: (id: string, notes?: string) => Promise<any>;
    rejectLevel3: (id: string, reason: string) => Promise<any>;

    // Actions - Send Communication (TS Section 12)
    sendCommunication: (id: string, data: SendCommunicationRequest) => Promise<DunningCommunication | null>;

    // Actions - Settlement
    settleDunning: (id: string, data: SettleDunningRequest) => Promise<any>;
    writeOffDunning: (id: string, data: WriteOffDunningRequest) => Promise<any>;

    // Actions - Dispute (TS Section 14)
    openDispute: (id: string, data: DisputeDunningRequest) => Promise<DunningDisputeRecord | null>;
    resolveDispute: (id: string, data: ResolveDisputeRequest) => Promise<any>;
    fetchDisputes: (id: string) => Promise<void>;

    // Actions - Reversal (TS Section 4.3)
    reverseDunning: (id: string, reason: string, reversalType?: string, amount?: number) => Promise<any>;

    // Actions - Interest & Fees (TS Section 11)
    fetchInterestAccruals: (id: string) => Promise<void>;
    calculateInterest: (id: string, data: CalculateInterestRequest) => Promise<any>;
    fetchFees: (id: string) => Promise<void>;
    applyFee: (id: string, data: ApplyFeeRequest) => Promise<DunningFee | null>;
    waiveFee: (id: string, feeId: string, reason: string) => Promise<any>;

    // Actions - Import (TS Section 13)
    fetchImportBatches: (page?: number, limit?: number) => Promise<void>;
    importDunnings: (data: ImportDunningRequest) => Promise<any>;
    rollbackImport: (batchId: string, reason: string) => Promise<any>;

    // Actions - Exceptions (TS Section 9.5)
    fetchExceptions: (filters?: any, page?: number, limit?: number) => Promise<void>;
    fetchException: (id: string) => Promise<void>;
    updateException: (id: string, data: any) => Promise<DunningException | null>;
    resolveException: (id: string, resolution: string, resolutionAction: string) => Promise<any>;
    retryException: (id: string, corrections?: any) => Promise<any>;

    // Actions - Automation (TS Section 9)
    fetchAutomationRules: (isActive?: boolean) => Promise<void>;
    fetchAutomationRule: (id: string) => Promise<void>;
    createAutomationRule: (data: Partial<DunningAutomationRule>) => Promise<DunningAutomationRule | null>;
    updateAutomationRule: (id: string, data: Partial<DunningAutomationRule>) => Promise<DunningAutomationRule | null>;
    deleteAutomationRule: (id: string) => Promise<void>;
    runAutomation: (ruleId?: string, dryRun?: boolean, limit?: number) => Promise<any>;

    // Actions - Templates (TS Section 12.3)
    fetchTemplates: (filters?: any) => Promise<void>;
    createTemplate: (data: Partial<DunningTemplate>) => Promise<DunningTemplate | null>;

    // Actions - Jurisdictions (TS Section 10)
    fetchJurisdictions: () => Promise<void>;
    saveJurisdiction: (data: Partial<DunningJurisdictionConfig>) => Promise<DunningJurisdictionConfig | null>;

    // Actions - Statistics (TS Section 15)
    fetchStatistics: () => Promise<void>;

    // Actions - UI
    setFilters: (filters: DunningFilters) => void;
    clearFilters: () => void;
    clearError: () => void;
    clearSuccess: () => void;
    reset: () => void;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
    dunnings: [],
    currentDunning: null,
    currentDunningEvents: [],
    currentDunningProposals: [],
    currentDunningCommunications: [],
    currentDunningInterestAccruals: [],
    currentDunningFees: [],
    currentDunningDisputes: [],
    proposals: [],
    proposalsPagination: null,
    proposalsStatistics: null,
    exceptions: [],
    exceptionsPagination: null,
    exceptionsStatistics: null,
    currentException: null,
    importBatches: [],
    importBatchesPagination: null,
    currentImportResult: null,
    automationRules: [],
    currentRule: null,
    automationRunResult: null,
    templates: [],
    jurisdictions: [],
    savedViews: [],
    pagination: null,
    statistics: null,
    filters: {},
    isLoading: false,
    isSubmitting: false,
    error: null,
    successMessage: null,
    timeTravelState: null,
    timeTravelDate: null,
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useDunningStore = create<DunningState>()(
    devtools(
        (set, get) => ({
            ...initialState,

            // =========================================================================
            // CORE CRUD
            // =========================================================================

            fetchDunnings: async (filters?: DunningFilters, page = 1, limit = 50) => {
                set({ isLoading: true, error: null });
                try {
                    const params = new URLSearchParams();
                    params.append('page', String(page));
                    params.append('limit', String(limit));

                    const mergedFilters = { ...get().filters, ...filters };

                    if (mergedFilters.status) params.append('status', mergedFilters.status);
                    if (mergedFilters.statuses?.length) params.append('statuses', mergedFilters.statuses.join(','));
                    if (mergedFilters.currentLevel !== undefined) params.append('currentLevel', String(mergedFilters.currentLevel));
                    if (mergedFilters.levels?.length) params.append('levels', mergedFilters.levels.join(','));
                    if (mergedFilters.customerId) params.append('customerId', mergedFilters.customerId);
                    if (mergedFilters.customerName) params.append('customerName', mergedFilters.customerName);
                    if (mergedFilters.invoiceId) params.append('invoiceId', mergedFilters.invoiceId);
                    if (mergedFilters.partyId) params.append('partyId', mergedFilters.partyId);
                    if (mergedFilters.legalEntityId) params.append('legalEntityId', mergedFilters.legalEntityId);
                    if (mergedFilters.jurisdictionId) params.append('jurisdictionId', mergedFilters.jurisdictionId);
                    if (mergedFilters.currency) params.append('currency', mergedFilters.currency);
                    if (mergedFilters.customerType) params.append('customerType', mergedFilters.customerType);
                    if (mergedFilters.isDisputed !== undefined) params.append('isDisputed', String(mergedFilters.isDisputed));
                    if (mergedFilters.hasActiveProposal !== undefined) params.append('hasActiveProposal', String(mergedFilters.hasActiveProposal));
                    if (mergedFilters.daysPastDueMin !== undefined) params.append('daysPastDueMin', String(mergedFilters.daysPastDueMin));
                    if (mergedFilters.daysPastDueMax !== undefined) params.append('daysPastDueMax', String(mergedFilters.daysPastDueMax));
                    if (mergedFilters.amountMin !== undefined) params.append('amountMin', String(mergedFilters.amountMin));
                    if (mergedFilters.amountMax !== undefined) params.append('amountMax', String(mergedFilters.amountMax));
                    if (mergedFilters.dueDateFrom) params.append('dueDateFrom', mergedFilters.dueDateFrom);
                    if (mergedFilters.dueDateTo) params.append('dueDateTo', mergedFilters.dueDateTo);
                    if (mergedFilters.createdFrom) params.append('createdFrom', mergedFilters.createdFrom);
                    if (mergedFilters.createdTo) params.append('createdTo', mergedFilters.createdTo);
                    if (mergedFilters.tags?.length) params.append('tags', mergedFilters.tags.join(','));
                    if (mergedFilters.search) params.append('search', mergedFilters.search);

                    const response = await fetch(`/api/dunning?${params.toString()}`);
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to fetch dunnings');
                    }

                    const data = await response.json();
                    set({
                        dunnings: data.dunnings,
                        pagination: data.pagination,
                        statistics: data.statistics,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            fetchDunning: async (id: string, options = {}) => {
                set({ isLoading: true, error: null });
                try {
                    const params = new URLSearchParams();
                    if (options.includeEvents) params.append('includeEvents', 'true');
                    if (options.includeProposals) params.append('includeProposals', 'true');
                    if (options.includeCommunications) params.append('includeCommunications', 'true');
                    if (options.includeInterest) params.append('includeInterest', 'true');
                    if (options.includeFees) params.append('includeFees', 'true');
                    if (options.includeDisputes) params.append('includeDisputes', 'true');

                    const url = params.toString()
                        ? `/api/dunning/${id}?${params.toString()}`
                        : `/api/dunning/${id}`;

                    const response = await fetch(url);
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to fetch dunning');
                    }

                    const data = await response.json();
                    set({
                        currentDunning: data.dunning,
                        currentDunningEvents: data.events || [],
                        currentDunningProposals: data.proposals || [],
                        currentDunningCommunications: data.communications || [],
                        currentDunningInterestAccruals: data.interestAccruals || [],
                        currentDunningFees: data.fees || [],
                        currentDunningDisputes: data.disputes || [],
                        isLoading: false,
                        timeTravelState: null,
                        timeTravelDate: null,
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            createDunning: async (data: CreateDunningRequest) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch('/api/dunning', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to create dunning');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh list
                    get().fetchDunnings();

                    return result.dunning;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            updateDunning: async (id: string, data: Partial<Dunning>) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to update dunning');
                    }

                    const result = await response.json();
                    set({
                        currentDunning: result.dunning,
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    return result.dunning;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            // =========================================================================
            // TIME TRAVEL (TS Section 4.2)
            // =========================================================================

            fetchDunningAsOf: async (id: string, asOfDate: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${id}?as_of=${encodeURIComponent(asOfDate)}`);
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to fetch dunning state');
                    }

                    const data = await response.json();
                    set({
                        timeTravelState: data.dunning,
                        timeTravelDate: data.asOfDate,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            clearTimeTravel: () => {
                set({ timeTravelState: null, timeTravelDate: null });
            },

            // =========================================================================
            // EVENTS
            // =========================================================================

            fetchDunningEvents: async (id: string, page = 1, limit = 50) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${id}/events?page=${page}&limit=${limit}`);
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to fetch events');
                    }

                    const data = await response.json();
                    set({
                        currentDunningEvents: data.events,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            // =========================================================================
            // VERIFICATION (TS Section 6)
            // =========================================================================

            verifyDunning: async (id: string) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${id}/verify`, {
                        method: 'POST',
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Verification failed');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    return result;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            // =========================================================================
            // PROPOSALS (TS Sections 8, 9)
            // =========================================================================

            fetchProposals: async (filters?: any, page = 1, limit = 50) => {
                set({ isLoading: true, error: null });
                try {
                    const params = new URLSearchParams();
                    params.append('page', String(page));
                    params.append('limit', String(limit));

                    if (filters?.status) params.append('status', filters.status);
                    if (filters?.proposalType) params.append('proposalType', filters.proposalType);
                    if (filters?.proposalLevel) params.append('proposalLevel', String(filters.proposalLevel));
                    if (filters?.priority) params.append('priority', filters.priority);
                    if (filters?.minConfidence) params.append('minConfidence', String(filters.minConfidence));

                    const response = await fetch(`/api/dunning/proposals?${params.toString()}`);
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to fetch proposals');
                    }

                    const data = await response.json();
                    set({
                        proposals: data.proposals,
                        proposalsPagination: data.pagination,
                        proposalsStatistics: data.statistics,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            proposeAction: async (id: string, options = {}) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${id}/propose`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(options),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to create proposal');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh current dunning
                    if (get().currentDunning?.id === id || get().currentDunning?.dunningId === id) {
                        get().fetchDunning(id, { includeProposals: true });
                    }

                    return result.proposal;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            approveProposal: async (dunningId: string, proposalId?: string, data?: ApproveProposalRequest) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${dunningId}/approve`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ proposalId, ...data }),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to approve proposal');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh
                    get().fetchDunning(dunningId, { includeProposals: true });
                    get().fetchProposals({ status: ProposalStatus.PENDING });

                    return result.proposal;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            rejectProposal: async (dunningId: string, proposalId: string, data: RejectProposalRequest) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${dunningId}/approve`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ proposalId, ...data }),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to reject proposal');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh
                    get().fetchDunning(dunningId, { includeProposals: true });
                    get().fetchProposals({ status: ProposalStatus.PENDING });

                    return result.proposal;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            bulkApproveProposals: async (data: BulkApproveProposalsRequest) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch('/api/dunning/proposals/approve-bulk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Bulk approval failed');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh proposals
                    get().fetchProposals({ status: ProposalStatus.PENDING });

                    return result;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            // =========================================================================
            // LEVEL 3 (TS Section 8.4)
            // =========================================================================

            initiateLevel3: async (id: string, data: InitiateLevel3Request) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${id}/initiate-level3`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to initiate Level 3');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh
                    get().fetchDunning(id, { includeProposals: true });

                    return result.proposal;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            approveLevel3: async (id: string, notes?: string) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${id}/approve-level3`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ notes }),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to approve Level 3');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh
                    get().fetchDunning(id, { includeProposals: true });

                    return result;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            rejectLevel3: async (id: string, reason: string) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${id}/approve-level3`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reason }),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to reject Level 3');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh
                    get().fetchDunning(id, { includeProposals: true });

                    return result;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            // =========================================================================
            // COMMUNICATION (TS Section 12)
            // =========================================================================

            sendCommunication: async (id: string, data: SendCommunicationRequest) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${id}/send`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to send communication');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh
                    get().fetchDunning(id, { includeCommunications: true, includeProposals: true });

                    return result.communication;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            // =========================================================================
            // SETTLEMENT
            // =========================================================================

            settleDunning: async (id: string, data: SettleDunningRequest) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${id}/settle`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to settle dunning');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh
                    get().fetchDunning(id);
                    get().fetchDunnings();

                    return result;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            writeOffDunning: async (id: string, data: WriteOffDunningRequest) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${id}/write-off`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to write off dunning');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh
                    get().fetchDunning(id);
                    get().fetchDunnings();

                    return result;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            // =========================================================================
            // DISPUTE (TS Section 14)
            // =========================================================================

            openDispute: async (id: string, data: DisputeDunningRequest) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${id}/dispute`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to open dispute');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh
                    get().fetchDunning(id, { includeDisputes: true });

                    return result.dispute;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            resolveDispute: async (id: string, data: ResolveDisputeRequest) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${id}/resolve`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to resolve dispute');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh
                    get().fetchDunning(id, { includeDisputes: true });

                    return result;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            fetchDisputes: async (id: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${id}/dispute`);
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to fetch disputes');
                    }

                    const data = await response.json();
                    set({
                        currentDunningDisputes: data.disputes,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            // =========================================================================
            // REVERSAL (TS Section 4.3)
            // =========================================================================

            reverseDunning: async (id: string, reason: string, reversalType = 'full', amount?: number) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${id}/reverse`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reason, reversalType, amount }),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to reverse dunning');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh
                    get().fetchDunning(id, { includeEvents: true });

                    return result;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            // =========================================================================
            // INTEREST & FEES (TS Section 11)
            // =========================================================================

            fetchInterestAccruals: async (id: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${id}/interest`);
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to fetch interest accruals');
                    }

                    const data = await response.json();
                    set({
                        currentDunningInterestAccruals: data.accruals,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            calculateInterest: async (id: string, data: CalculateInterestRequest) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${id}/interest`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to calculate interest');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh if applied
                    if (data.apply) {
                        get().fetchDunning(id, { includeInterest: true });
                    }

                    return result;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            fetchFees: async (id: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${id}/fees`);
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to fetch fees');
                    }

                    const data = await response.json();
                    set({
                        currentDunningFees: data.fees,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            applyFee: async (id: string, data: ApplyFeeRequest) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${id}/fees`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to apply fee');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh
                    get().fetchDunning(id, { includeFees: true });

                    return result.fee;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            waiveFee: async (id: string, feeId: string, reason: string) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/${id}/fees/${feeId}/waive`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reason }),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to waive fee');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh
                    get().fetchDunning(id, { includeFees: true });

                    return result;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            // =========================================================================
            // IMPORT (TS Section 13)
            // =========================================================================

            fetchImportBatches: async (page = 1, limit = 20) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/import?page=${page}&limit=${limit}`);
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to fetch import batches');
                    }

                    const data = await response.json();
                    set({
                        importBatches: data.batches,
                        importBatchesPagination: data.pagination,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            importDunnings: async (data: ImportDunningRequest) => {
                set({ isSubmitting: true, error: null, currentImportResult: null });
                try {
                    const response = await fetch('/api/dunning/import', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Import failed');
                    }

                    const result = await response.json();
                    set({
                        currentImportResult: result,
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh batches
                    get().fetchImportBatches();

                    return result;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            rollbackImport: async (batchId: string, reason: string) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/import/${batchId}/rollback`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reason }),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Rollback failed');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh
                    get().fetchImportBatches();
                    get().fetchDunnings();

                    return result;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            // =========================================================================
            // EXCEPTIONS (TS Section 9.5)
            // =========================================================================

            fetchExceptions: async (filters?: any, page = 1, limit = 50) => {
                set({ isLoading: true, error: null });
                try {
                    const params = new URLSearchParams();
                    params.append('page', String(page));
                    params.append('limit', String(limit));

                    if (filters?.status) params.append('status', filters.status);
                    if (filters?.exceptionType) params.append('exceptionType', filters.exceptionType);
                    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);
                    if (filters?.isOverdue) params.append('isOverdue', String(filters.isOverdue));
                    if (filters?.dunningId) params.append('dunningId', filters.dunningId);

                    const response = await fetch(`/api/dunning/exceptions?${params.toString()}`);
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to fetch exceptions');
                    }

                    const data = await response.json();
                    set({
                        exceptions: data.exceptions,
                        exceptionsPagination: data.pagination,
                        exceptionsStatistics: data.statistics,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            fetchException: async (id: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/exceptions/${id}`);
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to fetch exception');
                    }

                    const data = await response.json();
                    set({
                        currentException: data.exception,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            updateException: async (id: string, data: any) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/exceptions/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to update exception');
                    }

                    const result = await response.json();
                    set({
                        currentException: result.exception,
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh list
                    get().fetchExceptions({ status: DunningExceptionStatus.OPEN });

                    return result.exception;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            resolveException: async (id: string, resolution: string, resolutionAction: string) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/exceptions/${id}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ resolution, resolutionAction }),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to resolve exception');
                    }

                    const result = await response.json();
                    set({
                        currentException: result.exception,
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh list
                    get().fetchExceptions({ status: DunningExceptionStatus.OPEN });

                    return result;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            retryException: async (id: string, corrections?: any) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/exceptions/${id}/retry`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ corrections }),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to retry exception');
                    }

                    const result = await response.json();
                    set({
                        currentException: result.exception,
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    return result;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            // =========================================================================
            // AUTOMATION (TS Section 9)
            // =========================================================================

            fetchAutomationRules: async (isActive?: boolean) => {
                set({ isLoading: true, error: null });
                try {
                    const params = new URLSearchParams();
                    if (isActive !== undefined) params.append('isActive', String(isActive));

                    const url = params.toString()
                        ? `/api/dunning/automation/rules?${params.toString()}`
                        : '/api/dunning/automation/rules';

                    const response = await fetch(url);
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to fetch automation rules');
                    }

                    const data = await response.json();
                    set({
                        automationRules: data.rules,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            fetchAutomationRule: async (id: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/automation/rules/${id}`);
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to fetch rule');
                    }

                    const data = await response.json();
                    set({
                        currentRule: data.rule,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            createAutomationRule: async (data: Partial<DunningAutomationRule>) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch('/api/dunning/automation/rules', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to create rule');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh
                    get().fetchAutomationRules();

                    return result.rule;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            updateAutomationRule: async (id: string, data: Partial<DunningAutomationRule>) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/automation/rules/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to update rule');
                    }

                    const result = await response.json();
                    set({
                        currentRule: result.rule,
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh
                    get().fetchAutomationRules();

                    return result.rule;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            deleteAutomationRule: async (id: string) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch(`/api/dunning/automation/rules/${id}`, {
                        method: 'DELETE',
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to delete rule');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh
                    get().fetchAutomationRules();
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                }
            },

            runAutomation: async (ruleId?: string, dryRun = true, limit = 100) => {
                set({ isSubmitting: true, error: null, automationRunResult: null });
                try {
                    const response = await fetch('/api/dunning/automation/run', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ruleId, dryRun, limit }),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Automation run failed');
                    }

                    const result = await response.json();
                    set({
                        automationRunResult: result,
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh dunnings if not dry run
                    if (!dryRun) {
                        get().fetchDunnings();
                        get().fetchProposals({ status: ProposalStatus.PENDING });
                    }

                    return result;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            // =========================================================================
            // TEMPLATES (TS Section 12.3)
            // =========================================================================

            fetchTemplates: async (filters?: any) => {
                set({ isLoading: true, error: null });
                try {
                    const params = new URLSearchParams();
                    if (filters?.dunningLevel) params.append('dunningLevel', String(filters.dunningLevel));
                    if (filters?.language) params.append('language', filters.language);
                    if (filters?.jurisdictionId) params.append('jurisdictionId', filters.jurisdictionId);
                    if (filters?.templateType) params.append('templateType', filters.templateType);
                    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

                    const url = params.toString()
                        ? `/api/dunning/templates?${params.toString()}`
                        : '/api/dunning/templates';

                    const response = await fetch(url);
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to fetch templates');
                    }

                    const data = await response.json();
                    set({
                        templates: data.templates,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            createTemplate: async (data: Partial<DunningTemplate>) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch('/api/dunning/templates', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to create template');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh
                    get().fetchTemplates();

                    return result.template;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            // =========================================================================
            // JURISDICTIONS (TS Section 10)
            // =========================================================================

            fetchJurisdictions: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch('/api/dunning/jurisdictions');
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to fetch jurisdictions');
                    }

                    const data = await response.json();
                    set({
                        jurisdictions: data.jurisdictions,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            saveJurisdiction: async (data: Partial<DunningJurisdictionConfig>) => {
                set({ isSubmitting: true, error: null });
                try {
                    const response = await fetch('/api/dunning/jurisdictions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to save jurisdiction');
                    }

                    const result = await response.json();
                    set({
                        successMessage: result.message,
                        isSubmitting: false,
                    });

                    // Refresh
                    get().fetchJurisdictions();

                    return result.jurisdiction;
                } catch (error: any) {
                    set({ error: error.message, isSubmitting: false });
                    return null;
                }
            },

            // =========================================================================
            // STATISTICS (TS Section 15)
            // =========================================================================

            fetchStatistics: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch('/api/dunning/statistics');
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Failed to fetch statistics');
                    }

                    const data = await response.json();
                    set({
                        statistics: data,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            // =========================================================================
            // UI ACTIONS
            // =========================================================================

            setFilters: (filters: DunningFilters) => {
                set({ filters });
            },

            clearFilters: () => {
                set({ filters: {} });
            },

            clearError: () => {
                set({ error: null });
            },

            clearSuccess: () => {
                set({ successMessage: null });
            },

            reset: () => {
                set(initialState);
            },
        }),
        { name: 'dunning-store' }
    )
);

// =============================================================================
// SELECTORS
// =============================================================================

export const selectDunnings = (state: DunningState) => state.dunnings;
export const selectCurrentDunning = (state: DunningState) => state.currentDunning;
export const selectPagination = (state: DunningState) => state.pagination;
export const selectStatistics = (state: DunningState) => state.statistics;
export const selectFilters = (state: DunningState) => state.filters;
export const selectIsLoading = (state: DunningState) => state.isLoading;
export const selectIsSubmitting = (state: DunningState) => state.isSubmitting;
export const selectError = (state: DunningState) => state.error;
export const selectSuccessMessage = (state: DunningState) => state.successMessage;

// Proposals
export const selectProposals = (state: DunningState) => state.proposals;
export const selectProposalsPagination = (state: DunningState) => state.proposalsPagination;
export const selectProposalsStatistics = (state: DunningState) => state.proposalsStatistics;
export const selectPendingProposals = (state: DunningState) =>
    state.proposals.filter(p => p.status === ProposalStatus.PENDING);
export const selectHighPriorityProposals = (state: DunningState) =>
    state.proposals.filter(p => p.status === ProposalStatus.PENDING && p.priority === 'high');

// Exceptions
export const selectExceptions = (state: DunningState) => state.exceptions;
export const selectExceptionsPagination = (state: DunningState) => state.exceptionsPagination;
export const selectExceptionsStatistics = (state: DunningState) => state.exceptionsStatistics;
export const selectCurrentException = (state: DunningState) => state.currentException;
export const selectOpenExceptions = (state: DunningState) =>
    state.exceptions.filter(e => e.status === DunningExceptionStatus.OPEN);
export const selectOverdueExceptions = (state: DunningState) =>
    state.exceptions.filter(e => e.isOverdue);

// Automation
export const selectAutomationRules = (state: DunningState) => state.automationRules;
export const selectActiveRules = (state: DunningState) =>
    state.automationRules.filter(r => r.isActive);
export const selectCurrentRule = (state: DunningState) => state.currentRule;
export const selectAutomationRunResult = (state: DunningState) => state.automationRunResult;

// Import
export const selectImportBatches = (state: DunningState) => state.importBatches;
export const selectCurrentImportResult = (state: DunningState) => state.currentImportResult;

// Templates & Jurisdictions
export const selectTemplates = (state: DunningState) => state.templates;
export const selectJurisdictions = (state: DunningState) => state.jurisdictions;

// Time Travel
export const selectTimeTravelState = (state: DunningState) => state.timeTravelState;
export const selectTimeTravelDate = (state: DunningState) => state.timeTravelDate;
export const selectIsTimeTravel = (state: DunningState) => state.timeTravelDate !== null;

// Current Dunning Details
export const selectCurrentDunningEvents = (state: DunningState) => state.currentDunningEvents;
export const selectCurrentDunningProposals = (state: DunningState) => state.currentDunningProposals;
export const selectCurrentDunningCommunications = (state: DunningState) => state.currentDunningCommunications;
export const selectCurrentDunningInterestAccruals = (state: DunningState) => state.currentDunningInterestAccruals;
export const selectCurrentDunningFees = (state: DunningState) => state.currentDunningFees;
export const selectCurrentDunningDisputes = (state: DunningState) => state.currentDunningDisputes;

// Computed
export const selectTotalOutstanding = (state: DunningState) =>
    state.dunnings.reduce((sum, d) => sum + d.outstandingAmount, 0);

export const selectOverdueDunnings = (state: DunningState) =>
    state.dunnings.filter(d => d.daysPastDue > 0);

export const selectDisputedDunnings = (state: DunningState) =>
    state.dunnings.filter(d => d.isDisputed);

export const selectDunningsWithActiveProposals = (state: DunningState) =>
    state.dunnings.filter(d => d.hasActiveProposal);

export default useDunningStore;