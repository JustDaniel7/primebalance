// =============================================================================
// ARCHIVE STORE - Full TS Compliant (API Connected)
// src/store/archive-store.ts
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    ArchiveRecord,
    ArchiveFilters,
    ArchiveStatistics,
    ArchivePagination,
    ArchiveLink,
    ArchiveVersion,
    ArchiveAccessLog,
    ArchiveException,
    ArchiveExport,
    ArchiveImportBatch,
    ArchiveRetentionPolicy,
    ArchiveSavedView,
    LinkageGraph,
    CreateArchiveRequest,
    CreateExportRequest,
    ImportArchiveRequest,
    ArchiveSearchRequest,
    ArchiveReconstructRequest,
    ReconstructionResponse,
} from '@/types/archive';

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface ArchiveState {
    // Data
    records: ArchiveRecord[];
    currentRecord: ArchiveRecord | null;
    links: ArchiveLink[];
    versions: ArchiveVersion[];
    accessLogs: ArchiveAccessLog[];
    lineage: LinkageGraph | null;

    // Exceptions
    exceptions: ArchiveException[];

    // Exports
    exports: ArchiveExport[];

    // Imports
    importBatches: ArchiveImportBatch[];

    // Retention Policies
    retentionPolicies: ArchiveRetentionPolicy[];

    // Saved Views
    savedViews: ArchiveSavedView[];
    currentView: ArchiveSavedView | null;

    // UI State
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;

    // Pagination & Filters
    pagination: ArchivePagination;
    filters: ArchiveFilters;
    statistics: ArchiveStatistics | null;

    // ==========================================================================
    // API Actions - Core CRUD
    // ==========================================================================

    fetchRecords: (filters?: ArchiveFilters) => Promise<void>;
    fetchRecord: (id: string, options?: {
        includeLinks?: boolean;
        includeVersions?: boolean;
        includeAccessLogs?: boolean;
        includeLineage?: boolean;
    }) => Promise<ArchiveRecord | null>;
    createArchive: (data: CreateArchiveRequest) => Promise<ArchiveRecord | null>;
    restoreArchive: (id: string) => Promise<{ success: boolean; restoredTo?: string } | null>;
    deleteArchive: (id: string) => Promise<boolean>;

    // ==========================================================================
    // API Actions - Search & Reconstruction
    // ==========================================================================

    searchArchive: (request: ArchiveSearchRequest) => Promise<void>;
    reconstructState: (request: ArchiveReconstructRequest) => Promise<ReconstructionResponse | null>;

    // ==========================================================================
    // API Actions - Versions & Lineage
    // ==========================================================================

    fetchVersionChain: (id: string) => Promise<void>;
    fetchLineage: (id: string, options?: {
        direction?: 'inbound' | 'outbound' | 'both';
        maxDepth?: number;
    }) => Promise<LinkageGraph | null>;
    createLink: (sourceId: string, targetId: string, linkType: string, description?: string) => Promise<ArchiveLink | null>;

    // ==========================================================================
    // API Actions - Legal Hold
    // ==========================================================================

    setLegalHold: (id: string, reason: string) => Promise<boolean>;
    removeLegalHold: (id: string, reason: string) => Promise<boolean>;

    // ==========================================================================
    // API Actions - Export
    // ==========================================================================

    createExport: (request: CreateExportRequest) => Promise<ArchiveExport | null>;
    fetchExports: () => Promise<void>;

    // ==========================================================================
    // API Actions - Import
    // ==========================================================================

    importArchives: (request: ImportArchiveRequest) => Promise<{
        successCount: number;
        errorCount: number;
        batchId: string;
    } | null>;
    fetchImportBatches: () => Promise<void>;
    rollbackImport: (batchId: string) => Promise<boolean>;

    // ==========================================================================
    // API Actions - Exceptions
    // ==========================================================================

    fetchExceptions: (filters?: { status?: string; assignedTo?: string }) => Promise<void>;
    resolveException: (id: string, resolution: string, action?: string) => Promise<boolean>;

    // ==========================================================================
    // API Actions - Retention Policies
    // ==========================================================================

    fetchRetentionPolicies: () => Promise<void>;
    createRetentionPolicy: (policy: Partial<ArchiveRetentionPolicy>) => Promise<ArchiveRetentionPolicy | null>;

    // ==========================================================================
    // API Actions - Statistics
    // ==========================================================================

    fetchStatistics: () => Promise<void>;

    // ==========================================================================
    // Local Actions
    // ==========================================================================

    setCurrentRecord: (record: ArchiveRecord | null) => void;
    setFilters: (filters: ArchiveFilters) => void;
    clearFilters: () => void;
    setCurrentView: (view: ArchiveSavedView | null) => void;

    // ==========================================================================
    // Utility Functions
    // ==========================================================================

    getRecordsByObjectType: (objectType: string) => ArchiveRecord[];
    getRecordsByCategory: (category: string) => ArchiveRecord[];
    getRecordsByFiscalYear: (year: number) => ArchiveRecord[];
    getRecordsOnLegalHold: () => ArchiveRecord[];
    getExpiringRecords: (daysAhead: number) => ArchiveRecord[];
    validateIntegrity: (record: ArchiveRecord) => { valid: boolean; errors: string[] };
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialPagination: ArchivePagination = {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
};

const initialFilters: ArchiveFilters = {};

// =============================================================================
// API HELPERS
// =============================================================================

async function apiRequest<T>(
    url: string,
    options?: RequestInit
): Promise<{ data?: T; error?: string }> {
    try {
        const response = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            ...options,
        });

        const data = await response.json();

        if (!response.ok) {
            return { error: data.error || `Request failed with status ${response.status}` };
        }

        return { data };
    } catch (error: any) {
        return { error: error.message || 'Network error' };
    }
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useArchiveStore = create<ArchiveState>()(
    persist(
        (set, get) => ({
            // Initial state
            records: [],
            currentRecord: null,
            links: [],
            versions: [],
            accessLogs: [],
            lineage: null,
            exceptions: [],
            exports: [],
            importBatches: [],
            retentionPolicies: [],
            savedViews: [],
            currentView: null,
            isLoading: false,
            error: null,
            isInitialized: false,
            pagination: initialPagination,
            filters: initialFilters,
            statistics: null,

            // ========================================================================
            // Core CRUD
            // ========================================================================

            fetchRecords: async (filters?: ArchiveFilters) => {
                set({ isLoading: true, error: null });

                const params = new URLSearchParams();
                if (filters?.objectType) params.append('objectType', filters.objectType);
                if (filters?.objectTypes?.length) params.append('objectTypes', filters.objectTypes.join(','));
                if (filters?.category) params.append('category', filters.category);
                if (filters?.categories?.length) params.append('categories', filters.categories.join(','));
                if (filters?.status) params.append('status', filters.status);
                if (filters?.fiscalYear) params.append('fiscalYear', String(filters.fiscalYear));
                if (filters?.accountingPeriod) params.append('accountingPeriod', filters.accountingPeriod);
                if (filters?.legalEntityId) params.append('legalEntityId', filters.legalEntityId);
                if (filters?.partyId) params.append('partyId', filters.partyId);
                if (filters?.counterpartyName) params.append('counterpartyName', filters.counterpartyName);
                if (filters?.retentionStatus) params.append('retentionStatus', filters.retentionStatus);
                if (filters?.legalHold !== undefined) params.append('legalHold', String(filters.legalHold));
                if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
                if (filters?.dateTo) params.append('dateTo', filters.dateTo);
                if (filters?.archivedFrom) params.append('archivedFrom', filters.archivedFrom);
                if (filters?.archivedTo) params.append('archivedTo', filters.archivedTo);
                if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
                if (filters?.search) params.append('search', filters.search);
                if (filters?.includeSuperseded) params.append('includeSuperseded', 'true');

                const { data, error } = await apiRequest<{
                    records: ArchiveRecord[];
                    pagination: ArchivePagination;
                    statistics: ArchiveStatistics;
                }>(`/api/archive?${params.toString()}`);

                if (error) {
                    set({ isLoading: false, error });
                    return;
                }

                set({
                    records: data?.records || [],
                    pagination: data?.pagination || initialPagination,
                    statistics: data?.statistics || null,
                    isLoading: false,
                    isInitialized: true,
                    filters: filters || {},
                });
            },

            fetchRecord: async (id, options = {}) => {
                set({ isLoading: true, error: null });

                const params = new URLSearchParams();
                if (options.includeLinks) params.append('includeLinks', 'true');
                if (options.includeVersions) params.append('includeVersions', 'true');
                if (options.includeAccessLogs) params.append('includeAccessLogs', 'true');
                if (options.includeLineage) params.append('includeLineage', 'true');

                const { data, error } = await apiRequest<{
                    record: ArchiveRecord;
                    links?: ArchiveLink[];
                    linkedBy?: ArchiveLink[];
                    versions?: ArchiveVersion[];
                    accessLogs?: ArchiveAccessLog[];
                    lineage?: LinkageGraph;
                }>(`/api/archive/${id}?${params.toString()}`);

                if (error) {
                    set({ isLoading: false, error });
                    return null;
                }

                set({
                    currentRecord: data?.record || null,
                    links: [...(data?.links || []), ...(data?.linkedBy || [])],
                    versions: data?.versions || [],
                    accessLogs: data?.accessLogs || [],
                    lineage: data?.lineage || null,
                    isLoading: false,
                });

                return data?.record || null;
            },

            createArchive: async (archiveData) => {
                set({ isLoading: true, error: null });

                const { data, error } = await apiRequest<{ record: ArchiveRecord }>('/api/archive', {
                    method: 'POST',
                    body: JSON.stringify(archiveData),
                });

                if (error) {
                    set({ isLoading: false, error });
                    return null;
                }

                const newRecord = data?.record;
                if (newRecord) {
                    set((state) => ({
                        records: [newRecord, ...state.records],
                        currentRecord: newRecord,
                        isLoading: false,
                    }));
                }

                return newRecord || null;
            },

            restoreArchive: async (id) => {
                set({ isLoading: true, error: null });

                const { data, error } = await apiRequest<{ success: boolean; restoredTo?: string }>(
                    `/api/archive/${id}/restore`,
                    { method: 'POST' }
                );

                if (error) {
                    set({ isLoading: false, error });
                    return null;
                }

                if (data?.success) {
                    // Remove from records list since it's restored
                    set((state) => ({
                        records: state.records.filter((r) => r.id !== id),
                        currentRecord: state.currentRecord?.id === id ? null : state.currentRecord,
                        isLoading: false,
                    }));
                }

                return data || null;
            },

            deleteArchive: async (id) => {
                set({ isLoading: true, error: null });

                // Note: Archives are generally immutable, but we can mark them for deletion
                // if they're not on legal hold and retention has expired
                const { data, error } = await apiRequest<{ success: boolean }>(
                    `/api/archive/${id}/delete`,
                    { method: 'POST' }
                );

                if (error) {
                    set({ isLoading: false, error });
                    return false;
                }

                if (data?.success) {
                    set((state) => ({
                        records: state.records.filter((r) => r.id !== id),
                        currentRecord: state.currentRecord?.id === id ? null : state.currentRecord,
                        isLoading: false,
                    }));
                }

                return data?.success || false;
            },

            // ========================================================================
            // Search & Reconstruction
            // ========================================================================

            searchArchive: async (request) => {
                set({ isLoading: true, error: null });

                const { data, error } = await apiRequest<{
                    records: ArchiveRecord[];
                    pagination: ArchivePagination;
                    aggregations?: Record<string, any>;
                }>('/api/archive/search', {
                    method: 'POST',
                    body: JSON.stringify(request),
                });

                if (error) {
                    set({ isLoading: false, error });
                    return;
                }

                set({
                    records: data?.records || [],
                    pagination: data?.pagination || initialPagination,
                    isLoading: false,
                });
            },

            reconstructState: async (request) => {
                set({ isLoading: true, error: null });

                const { data, error } = await apiRequest<ReconstructionResponse>('/api/archive/reconstruct', {
                    method: 'POST',
                    body: JSON.stringify(request),
                });

                if (error) {
                    set({ isLoading: false, error });
                    return null;
                }

                set({ isLoading: false });
                return data || null;
            },

            // ========================================================================
            // Versions & Lineage
            // ========================================================================

            fetchVersionChain: async (id) => {
                set({ isLoading: true, error: null });

                const { data, error } = await apiRequest<{
                    versions: any[];
                    versionDetails: ArchiveVersion[];
                }>(`/api/archive/${id}/versions`);

                if (error) {
                    set({ isLoading: false, error });
                    return;
                }

                set({
                    versions: data?.versionDetails || [],
                    isLoading: false,
                });
            },

            fetchLineage: async (id, options = {}) => {
                set({ isLoading: true, error: null });

                const params = new URLSearchParams();
                if (options.direction) params.append('direction', options.direction);
                if (options.maxDepth) params.append('maxDepth', String(options.maxDepth));

                const { data, error } = await apiRequest<LinkageGraph>(
                    `/api/archive/${id}/lineage?${params.toString()}`
                );

                if (error) {
                    set({ isLoading: false, error });
                    return null;
                }

                set({
                    lineage: data || null,
                    isLoading: false,
                });

                return data || null;
            },

            createLink: async (sourceId, targetId, linkType, description) => {
                set({ isLoading: true, error: null });

                const { data, error } = await apiRequest<{ link: ArchiveLink }>('/api/archive/links', {
                    method: 'POST',
                    body: JSON.stringify({
                        sourceArchiveId: sourceId,
                        targetArchiveId: targetId,
                        linkType,
                        linkDescription: description,
                    }),
                });

                if (error) {
                    set({ isLoading: false, error });
                    return null;
                }

                const newLink = data?.link;
                if (newLink) {
                    set((state) => ({
                        links: [...state.links, newLink],
                        isLoading: false,
                    }));
                }

                return newLink || null;
            },

            // ========================================================================
            // Legal Hold
            // ========================================================================

            setLegalHold: async (id, reason) => {
                set({ isLoading: true, error: null });

                const { data, error } = await apiRequest<{ record: ArchiveRecord }>(
                    `/api/archive/${id}/legal-hold`,
                    {
                        method: 'POST',
                        body: JSON.stringify({ reason }),
                    }
                );

                if (error) {
                    set({ isLoading: false, error });
                    return false;
                }

                if (data?.record) {
                    set((state) => ({
                        records: state.records.map((r) => (r.id === id ? data.record : r)),
                        currentRecord: state.currentRecord?.id === id ? data.record : state.currentRecord,
                        isLoading: false,
                    }));
                }

                return true;
            },

            removeLegalHold: async (id, reason) => {
                set({ isLoading: true, error: null });

                const { data, error } = await apiRequest<{ record: ArchiveRecord }>(
                    `/api/archive/${id}/legal-hold`,
                    {
                        method: 'DELETE',
                        body: JSON.stringify({ reason }),
                    }
                );

                if (error) {
                    set({ isLoading: false, error });
                    return false;
                }

                if (data?.record) {
                    set((state) => ({
                        records: state.records.map((r) => (r.id === id ? data.record : r)),
                        currentRecord: state.currentRecord?.id === id ? data.record : state.currentRecord,
                        isLoading: false,
                    }));
                }

                return true;
            },

            // ========================================================================
            // Export
            // ========================================================================

            createExport: async (request) => {
                set({ isLoading: true, error: null });

                const { data, error } = await apiRequest<{ export: ArchiveExport }>('/api/archive/export', {
                    method: 'POST',
                    body: JSON.stringify(request),
                });

                if (error) {
                    set({ isLoading: false, error });
                    return null;
                }

                const newExport = data?.export;
                if (newExport) {
                    set((state) => ({
                        exports: [newExport, ...state.exports],
                        isLoading: false,
                    }));
                }

                return newExport || null;
            },

            fetchExports: async () => {
                set({ isLoading: true, error: null });

                const { data, error } = await apiRequest<{ exports: ArchiveExport[] }>('/api/archive/export');

                if (error) {
                    set({ isLoading: false, error });
                    return;
                }

                set({
                    exports: data?.exports || [],
                    isLoading: false,
                });
            },

            // ========================================================================
            // Import
            // ========================================================================

            importArchives: async (request) => {
                set({ isLoading: true, error: null });

                const { data, error } = await apiRequest<{
                    batchId: string;
                    results: { successCount: number; errorCount: number };
                }>('/api/archive/import', {
                    method: 'POST',
                    body: JSON.stringify(request),
                });

                if (error) {
                    set({ isLoading: false, error });
                    return null;
                }

                // Refresh records if live import
                if (request.mode === 'live' && data?.results.successCount) {
                    await get().fetchRecords();
                }

                set({ isLoading: false });

                return data ? {
                    successCount: data.results.successCount,
                    errorCount: data.results.errorCount,
                    batchId: data.batchId,
                } : null;
            },

            fetchImportBatches: async () => {
                set({ isLoading: true, error: null });

                const { data, error } = await apiRequest<{ batches: ArchiveImportBatch[] }>('/api/archive/import');

                if (error) {
                    set({ isLoading: false, error });
                    return;
                }

                set({
                    importBatches: data?.batches || [],
                    isLoading: false,
                });
            },

            rollbackImport: async (batchId) => {
                set({ isLoading: true, error: null });

                const { error } = await apiRequest(`/api/archive/import/${batchId}/rollback`, {
                    method: 'POST',
                });

                if (error) {
                    set({ isLoading: false, error });
                    return false;
                }

                // Refresh records and batches
                await Promise.all([
                    get().fetchRecords(),
                    get().fetchImportBatches(),
                ]);

                set({ isLoading: false });
                return true;
            },

            // ========================================================================
            // Exceptions
            // ========================================================================

            fetchExceptions: async (filters) => {
                set({ isLoading: true, error: null });

                const params = new URLSearchParams();
                if (filters?.status) params.append('status', filters.status);
                if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);

                const { data, error } = await apiRequest<{ exceptions: ArchiveException[] }>(
                    `/api/archive/exceptions?${params.toString()}`
                );

                if (error) {
                    set({ isLoading: false, error });
                    return;
                }

                set({
                    exceptions: data?.exceptions || [],
                    isLoading: false,
                });
            },

            resolveException: async (id, resolution, action) => {
                set({ isLoading: true, error: null });

                const { error } = await apiRequest(`/api/archive/exceptions/${id}/resolve`, {
                    method: 'POST',
                    body: JSON.stringify({ resolution, resolutionAction: action }),
                });

                if (error) {
                    set({ isLoading: false, error });
                    return false;
                }

                // Refresh exceptions
                await get().fetchExceptions();
                set({ isLoading: false });
                return true;
            },

            // ========================================================================
            // Retention Policies
            // ========================================================================

            fetchRetentionPolicies: async () => {
                set({ isLoading: true, error: null });

                const { data, error } = await apiRequest<{ policies: ArchiveRetentionPolicy[] }>(
                    '/api/archive/retention-policies'
                );

                if (error) {
                    set({ isLoading: false, error });
                    return;
                }

                set({
                    retentionPolicies: data?.policies || [],
                    isLoading: false,
                });
            },

            createRetentionPolicy: async (policy) => {
                set({ isLoading: true, error: null });

                const { data, error } = await apiRequest<{ policy: ArchiveRetentionPolicy }>(
                    '/api/archive/retention-policies',
                    {
                        method: 'POST',
                        body: JSON.stringify(policy),
                    }
                );

                if (error) {
                    set({ isLoading: false, error });
                    return null;
                }

                const newPolicy = data?.policy;
                if (newPolicy) {
                    set((state) => ({
                        retentionPolicies: [...state.retentionPolicies, newPolicy],
                        isLoading: false,
                    }));
                }

                return newPolicy || null;
            },

            // ========================================================================
            // Statistics
            // ========================================================================

            fetchStatistics: async () => {
                set({ isLoading: true, error: null });

                const { data, error } = await apiRequest<{ statistics: ArchiveStatistics }>(
                    '/api/archive/statistics'
                );

                if (error) {
                    set({ isLoading: false, error });
                    return;
                }

                set({
                    statistics: data?.statistics || null,
                    isLoading: false,
                });
            },

            // ========================================================================
            // Local Actions
            // ========================================================================

            setCurrentRecord: (record) => set({ currentRecord: record }),

            setFilters: (filters) => set({ filters }),

            clearFilters: () => set({ filters: initialFilters }),

            setCurrentView: (view) => set({ currentView: view }),

            // ========================================================================
            // Utility Functions
            // ========================================================================

            getRecordsByObjectType: (objectType) => {
                return get().records.filter((r) => r.objectType === objectType);
            },

            getRecordsByCategory: (category) => {
                return get().records.filter((r) => r.category === category);
            },

            getRecordsByFiscalYear: (year) => {
                return get().records.filter((r) => r.fiscalYear === year);
            },

            getRecordsOnLegalHold: () => {
                return get().records.filter((r) => r.legalHold);
            },

            getExpiringRecords: (daysAhead) => {
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() + daysAhead);

                return get().records.filter((r) => {
                    if (!r.retentionEndDate || r.legalHold) return false;
                    const endDate = new Date(r.retentionEndDate);
                    return endDate <= cutoff && endDate > new Date();
                });
            },

            validateIntegrity: (record) => {
                const errors: string[] = [];

                // Required fields
                if (!record.archiveRecordId) errors.push('Missing archiveRecordId');
                if (!record.originalObjectId) errors.push('Missing originalObjectId');
                if (!record.objectType) errors.push('Missing objectType');
                if (!record.contentHash) errors.push('Missing contentHash');
                if (!record.content) errors.push('Missing content');
                if (!record.triggerType) errors.push('Missing triggerType');

                // Chain integrity
                if (record.versionNumber > 1 && !record.predecessorHash) {
                    errors.push('Missing predecessorHash for version > 1');
                }

                // Retention check
                if (record.retentionEndDate) {
                    const endDate = new Date(record.retentionEndDate);
                    if (endDate < new Date() && !record.legalHold) {
                        errors.push('Retention period has expired');
                    }
                }

                return { valid: errors.length === 0, errors };
            },
        }),
        {
            name: 'primebalance-archive-v2',
            partialize: (state) => ({
                // Only persist filters and view preferences
                filters: state.filters,
                currentView: state.currentView,
            }),
        }
    )
);