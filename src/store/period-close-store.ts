// src/store/period-close-store.ts
// Period Close Store - API-connected version
// REPLACE: src/store/period-close-store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    AccountingPeriod,
    CloseChecklistItem,
    MissingItem,
    PeriodAdjustment,
    PeriodAuditEntry,
    PeriodCloseSummary,
    PeriodStatus,
    ChecklistItemStatus,
} from '@/types/period-close';

// =============================================================================
// API MAPPERS
// =============================================================================

function mapApiToPeriod(api: Record<string, unknown>): AccountingPeriod {
    return {
        id: api.id as string,
        name: api.name as string,
        code: api.code as string,
        type: (api.type as AccountingPeriod['type']) || 'monthly',
        startDate: (api.startDate as string)?.split('T')[0] || '',
        endDate: (api.endDate as string)?.split('T')[0] || '',
        fiscalYear: api.fiscalYear as number,
        fiscalQuarter: api.fiscalQuarter as number | undefined,
        fiscalMonth: api.fiscalMonth as number | undefined,
        status: (api.status as PeriodStatus) || 'open',
        closedAt: api.closedAt as string | undefined,
        closedBy: api.closedBy as string | undefined,
        reopenedAt: api.reopenedAt as string | undefined,
        reopenedBy: api.reopenedBy as string | undefined,
        reopenReason: api.reopenReason as string | undefined,
        checklistTotal: (api.checklistTotal as number) || 0,
        checklistCompleted: (api.checklistCompleted as number) || 0,
        checklistProgress: Number(api.checklistProgress) || 0,
        hasUnreconciledItems: (api.hasUnreconciledItems as boolean) || false,
        hasPendingTransactions: (api.hasPendingTransactions as boolean) || false,
        hasMissingDocuments: (api.hasMissingDocuments as boolean) || false,
        hasUnapprovedAdjustments: (api.hasUnapprovedAdjustments as boolean) || false,
        totalRevenue: api.totalRevenue ? Number(api.totalRevenue) : undefined,
        totalExpenses: api.totalExpenses ? Number(api.totalExpenses) : undefined,
        netIncome: api.netIncome ? Number(api.netIncome) : undefined,
        totalAssets: api.totalAssets ? Number(api.totalAssets) : undefined,
        totalLiabilities: api.totalLiabilities ? Number(api.totalLiabilities) : undefined,
        notes: api.notes as string | undefined,
        createdAt: api.createdAt as string,
        updatedAt: api.updatedAt as string,
    };
}

function mapApiToChecklistItem(api: Record<string, unknown>): CloseChecklistItem {
    return {
        id: api.id as string,
        periodId: api.periodId as string,
        name: api.name as string,
        description: api.description as string | undefined,
        category: api.category as CloseChecklistItem['category'],
        order: (api.orderIndex as number) || 0,
        status: (api.status as ChecklistItemStatus) || 'pending',
        completedAt: api.completedAt as string | undefined,
        completedBy: api.completedBy as string | undefined,
        isRequired: (api.isRequired as boolean) ?? true,
        isCritical: (api.isCritical as boolean) || false,
        dependsOn: (api.dependsOn as string[]) || [],
        isAutomated: (api.isAutomated as boolean) || false,
        automationRule: api.automationRule as string | undefined,
        lastAutoCheck: api.lastAutoCheck as string | undefined,
        autoCheckResult: api.autoCheckResult as CloseChecklistItem['autoCheckResult'],
        attachments: (api.attachments as string[]) || [],
        notes: api.notes as string | undefined,
        createdAt: api.createdAt as string,
        updatedAt: api.updatedAt as string,
    };
}

function mapApiToMissingItem(api: Record<string, unknown>): MissingItem {
    return {
        id: api.id as string,
        periodId: api.periodId as string,
        type: api.type as MissingItem['type'],
        severity: (api.severity as MissingItem['severity']) || 'medium',
        title: api.title as string,
        description: api.description as string,
        reference: api.reference as string | undefined,
        relatedEntityType: api.relatedEntityType as string | undefined,
        relatedEntityId: api.relatedEntityId as string | undefined,
        assignedTo: api.assignedTo as string | undefined,
        assignedToName: api.assignedToName as string | undefined,
        dueDate: (api.dueDate as string)?.split('T')[0],
        status: (api.status as MissingItem['status']) || 'open',
        resolvedAt: api.resolvedAt as string | undefined,
        resolvedBy: api.resolvedBy as string | undefined,
        resolution: api.resolution as string | undefined,
        waivedReason: api.waivedReason as string | undefined,
        createdAt: api.createdAt as string,
        updatedAt: api.updatedAt as string,
    };
}

function mapApiToAdjustment(api: Record<string, unknown>): PeriodAdjustment {
    return {
        id: api.id as string,
        adjustmentNumber: api.adjustmentNumber as string,
        periodId: api.periodId as string,
        type: api.type as PeriodAdjustment['type'],
        status: api.status as PeriodAdjustment['status'],
        description: api.description as string,
        reason: api.reason as string,
        debitAccountId: api.debitAccountId as string | undefined,
        debitAccountName: api.debitAccountName as string | undefined,
        creditAccountId: api.creditAccountId as string | undefined,
        creditAccountName: api.creditAccountName as string | undefined,
        amount: Number(api.amount) || 0,
        currency: (api.currency as string) || 'EUR',
        effectiveDate: (api.effectiveDate as string)?.split('T')[0] || '',
        isReversing: (api.isReversing as boolean) || false,
        reversalDate: (api.reversalDate as string)?.split('T')[0],
        reversalPeriodId: api.reversalPeriodId as string | undefined,
        originalAdjustmentId: api.originalAdjustmentId as string | undefined,
        requestedBy: api.requestedBy as string | undefined,
        requestedByName: api.requestedByName as string | undefined,
        approvedBy: api.approvedBy as string | undefined,
        approvedByName: api.approvedByName as string | undefined,
        approvedAt: api.approvedAt as string | undefined,
        rejectedBy: api.rejectedBy as string | undefined,
        rejectionReason: api.rejectionReason as string | undefined,
        postedAt: api.postedAt as string | undefined,
        journalEntryId: api.journalEntryId as string | undefined,
        supportingDocuments: (api.supportingDocuments as string[]) || [],
        notes: api.notes as string | undefined,
        createdAt: api.createdAt as string,
        updatedAt: api.updatedAt as string,
    };
}

function mapApiToAuditEntry(api: Record<string, unknown>): PeriodAuditEntry {
    return {
        id: api.id as string,
        periodId: api.periodId as string,
        action: api.action as PeriodAuditEntry['action'],
        description: api.description as string,
        userId: api.userId as string,
        userName: api.userName as string | undefined,
        previousStatus: api.previousStatus as PeriodStatus | undefined,
        newStatus: api.newStatus as PeriodStatus | undefined,
        metadata: api.metadata as Record<string, unknown> | undefined,
        ipAddress: api.ipAddress as string | undefined,
        userAgent: api.userAgent as string | undefined,
        createdAt: api.createdAt as string,
    };
}

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface PeriodCloseState {
    periods: AccountingPeriod[];
    checklistItems: CloseChecklistItem[];
    missingItems: MissingItem[];
    adjustments: PeriodAdjustment[];
    auditTrail: PeriodAuditEntry[];
    selectedPeriodId: string | null;
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;

    // API
    fetchPeriods: () => Promise<void>;
    fetchPeriod: (id: string) => Promise<void>;

    // Periods
    createPeriod: (period: Omit<AccountingPeriod, 'id' | 'createdAt' | 'updatedAt' | 'checklistProgress'>) => Promise<AccountingPeriod | null>;
    updatePeriod: (id: string, updates: Partial<AccountingPeriod>) => Promise<void>;
    startClosing: (id: string) => Promise<void>;
    closePeriod: (id: string, closedBy: string) => Promise<boolean>;
    reopenPeriod: (id: string, reopenedBy: string, reason: string) => Promise<void>;
    lockPeriod: (id: string) => Promise<void>;

    // Checklist
    updateChecklistItem: (id: string, updates: Partial<CloseChecklistItem>) => Promise<void>;
    completeChecklistItem: (id: string, completedBy: string) => Promise<void>;
    skipChecklistItem: (id: string, reason: string) => Promise<void>;
    resetChecklistItem: (id: string) => Promise<void>;
    initializeChecklist: (periodId: string, templateId?: string) => Promise<void>;

    // Missing Items
    createMissingItem: (item: Omit<MissingItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<MissingItem | null>;
    updateMissingItem: (id: string, updates: Partial<MissingItem>) => Promise<void>;
    resolveMissingItem: (id: string, resolvedBy: string, resolution: string) => Promise<void>;
    waiveMissingItem: (id: string, reason: string) => Promise<void>;

    // Adjustments
    createAdjustment: (adjustment: Omit<PeriodAdjustment, 'id' | 'adjustmentNumber' | 'createdAt' | 'updatedAt'>) => Promise<PeriodAdjustment | null>;
    updateAdjustment: (id: string, updates: Partial<PeriodAdjustment>) => Promise<void>;
    approveAdjustment: (id: string, approvedBy: string) => Promise<void>;
    rejectAdjustment: (id: string, rejectedBy: string, reason: string) => Promise<void>;
    postAdjustment: (id: string) => Promise<void>;

    // Analytics
    getSummary: () => PeriodCloseSummary;
    getCurrentPeriod: () => AccountingPeriod | null;
    getBlockers: (periodId: string) => { checklist: CloseChecklistItem[]; missing: MissingItem[]; adjustments: PeriodAdjustment[] };

    // Selection
    selectPeriod: (id: string | null) => void;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const usePeriodCloseStore = create<PeriodCloseState>()(
    persist(
        (set, get) => ({
            periods: [],
            checklistItems: [],
            missingItems: [],
            adjustments: [],
            auditTrail: [],
            selectedPeriodId: null,
            isLoading: false,
            error: null,
            isInitialized: false,

            // =================================================================
            // API
            // =================================================================

            fetchPeriods: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch('/api/period-close');
                    if (!response.ok) throw new Error('Failed to fetch periods');
                    const data = await response.json();

                    const periods = (data.periods || []).map(mapApiToPeriod);
                    const checklistItems: CloseChecklistItem[] = [];
                    const missingItems: MissingItem[] = [];
                    const adjustments: PeriodAdjustment[] = [];
                    const auditTrail: PeriodAuditEntry[] = [];

                    for (const p of data.periods || []) {
                        if (p.checklistItems) {
                            checklistItems.push(...p.checklistItems.map(mapApiToChecklistItem));
                        }
                        if (p.missingItems) {
                            missingItems.push(...p.missingItems.map(mapApiToMissingItem));
                        }
                        if (p.adjustments) {
                            adjustments.push(...p.adjustments.map(mapApiToAdjustment));
                        }
                        if (p.auditEntries) {
                            auditTrail.push(...p.auditEntries.map(mapApiToAuditEntry));
                        }
                    }

                    set({
                        periods,
                        checklistItems,
                        missingItems,
                        adjustments,
                        auditTrail,
                        isLoading: false,
                        isInitialized: true,
                        selectedPeriodId: get().selectedPeriodId || (periods.find((p: AccountingPeriod) => p.status === 'open')?.id || null),
                    });
                } catch (error) {
                    console.error('Failed to fetch periods:', error);
                    set({ error: (error as Error).message, isLoading: false, isInitialized: true });
                }
            },

            fetchPeriod: async (id: string) => {
                try {
                    const response = await fetch(`/api/period-close/${id}`);
                    if (!response.ok) return;
                    const data = await response.json();

                    const period = mapApiToPeriod(data);
                    const checklistItems = (data.checklistItems || []).map(mapApiToChecklistItem);
                    const missingItems = (data.missingItems || []).map(mapApiToMissingItem);
                    const adjustments = (data.adjustments || []).map(mapApiToAdjustment);
                    const auditEntries = (data.auditEntries || []).map(mapApiToAuditEntry);

                    set((state) => ({
                        periods: state.periods.map((p) => (p.id === id ? period : p)),
                        checklistItems: [
                            ...state.checklistItems.filter((i) => i.periodId !== id),
                            ...checklistItems,
                        ],
                        missingItems: [
                            ...state.missingItems.filter((i) => i.periodId !== id),
                            ...missingItems,
                        ],
                        adjustments: [
                            ...state.adjustments.filter((a) => a.periodId !== id),
                            ...adjustments,
                        ],
                        auditTrail: [
                            ...state.auditTrail.filter((e) => e.periodId !== id),
                            ...auditEntries,
                        ],
                    }));
                } catch (error) {
                    console.error('Failed to fetch period:', error);
                }
            },

            // =================================================================
            // PERIODS
            // =================================================================

            createPeriod: async (data) => {
                try {
                    const response = await fetch('/api/period-close', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                    if (!response.ok) throw new Error('Failed to create period');
                    const created = await response.json();
                    const period = mapApiToPeriod(created);

                    set((state) => ({ periods: [...state.periods, period] }));
                    return period;
                } catch (error) {
                    console.error('Failed to create period:', error);
                    return null;
                }
            },

            updatePeriod: async (id, updates) => {
                // Optimistic update
                set((state) => ({
                    periods: state.periods.map((p) =>
                        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
                    ),
                }));

                fetch(`/api/period-close/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates),
                }).catch(console.error);
            },

            startClosing: async (id) => {
                const period = get().periods.find((p) => p.id === id);
                if (!period || period.status !== 'open') return;

                set((state) => ({
                    periods: state.periods.map((p) =>
                        p.id === id ? { ...p, status: 'closing' as PeriodStatus } : p
                    ),
                }));

                fetch(`/api/period-close/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'closing' }),
                }).catch(console.error);
            },

            closePeriod: async (id, closedBy) => {
                const blockers = get().getBlockers(id);
                if (blockers.checklist.length > 0 || blockers.missing.length > 0) {
                    return false;
                }

                const now = new Date().toISOString();
                set((state) => ({
                    periods: state.periods.map((p) =>
                        p.id === id ? { ...p, status: 'closed' as PeriodStatus, closedAt: now, closedBy } : p
                    ),
                }));

                fetch(`/api/period-close/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'closed' }),
                }).catch(console.error);

                return true;
            },

            reopenPeriod: async (id, reopenedBy, reason) => {
                const now = new Date().toISOString();
                set((state) => ({
                    periods: state.periods.map((p) =>
                        p.id === id
                            ? { ...p, status: 'reopened' as PeriodStatus, reopenedAt: now, reopenedBy, reopenReason: reason }
                            : p
                    ),
                }));

                fetch(`/api/period-close/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'reopened', reopenReason: reason }),
                }).catch(console.error);
            },

            lockPeriod: async (id) => {
                set((state) => ({
                    periods: state.periods.map((p) =>
                        p.id === id ? { ...p, status: 'locked' as PeriodStatus } : p
                    ),
                }));

                fetch(`/api/period-close/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'locked' }),
                }).catch(console.error);
            },

            // =================================================================
            // CHECKLIST
            // =================================================================

            updateChecklistItem: async (id, updates) => {
                const item = get().checklistItems.find((i) => i.id === id);
                if (!item) return;

                set((state) => ({
                    checklistItems: state.checklistItems.map((i) =>
                        i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
                    ),
                }));

                fetch(`/api/period-close/${item.periodId}/checklist/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates),
                })
                    .then(() => get().fetchPeriod(item.periodId))
                    .catch(console.error);
            },

            completeChecklistItem: async (id, completedBy) => {
                const item = get().checklistItems.find((i) => i.id === id);
                if (!item) return;

                const now = new Date().toISOString();
                set((state) => ({
                    checklistItems: state.checklistItems.map((i) =>
                        i.id === id ? { ...i, status: 'completed' as ChecklistItemStatus, completedAt: now, completedBy } : i
                    ),
                }));

                fetch(`/api/period-close/${item.periodId}/checklist/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'completed' }),
                })
                    .then(() => get().fetchPeriod(item.periodId))
                    .catch(console.error);
            },

            skipChecklistItem: async (id, reason) => {
                const item = get().checklistItems.find((i) => i.id === id);
                if (!item) return;

                set((state) => ({
                    checklistItems: state.checklistItems.map((i) =>
                        i.id === id ? { ...i, status: 'skipped' as ChecklistItemStatus, notes: reason } : i
                    ),
                }));

                fetch(`/api/period-close/${item.periodId}/checklist/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'skipped', notes: reason }),
                })
                    .then(() => get().fetchPeriod(item.periodId))
                    .catch(console.error);
            },

            resetChecklistItem: async (id) => {
                const item = get().checklistItems.find((i) => i.id === id);
                if (!item) return;

                set((state) => ({
                    checklistItems: state.checklistItems.map((i) =>
                        i.id === id ? { ...i, status: 'pending' as ChecklistItemStatus, completedAt: undefined, completedBy: undefined } : i
                    ),
                }));

                fetch(`/api/period-close/${item.periodId}/checklist/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'pending' }),
                })
                    .then(() => get().fetchPeriod(item.periodId))
                    .catch(console.error);
            },

            initializeChecklist: async (periodId, templateId = 'monthly-standard') => {
                try {
                    await fetch(`/api/period-close/${periodId}/checklist`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ template: templateId }),
                    });
                    await get().fetchPeriod(periodId);
                } catch (error) {
                    console.error('Failed to initialize checklist:', error);
                }
            },

            // =================================================================
            // MISSING ITEMS
            // =================================================================

            createMissingItem: async (data) => {
                try {
                    const response = await fetch(`/api/period-close/${data.periodId}/missing`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                    if (!response.ok) throw new Error('Failed to create missing item');
                    const created = await response.json();
                    const item = mapApiToMissingItem(created);

                    set((state) => ({ missingItems: [...state.missingItems, item] }));
                    return item;
                } catch (error) {
                    console.error('Failed to create missing item:', error);
                    return null;
                }
            },

            updateMissingItem: async (id, updates) => {
                const item = get().missingItems.find((i) => i.id === id);
                if (!item) return;

                set((state) => ({
                    missingItems: state.missingItems.map((i) =>
                        i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
                    ),
                }));

                fetch(`/api/period-close/${item.periodId}/missing/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates),
                }).catch(console.error);
            },

            resolveMissingItem: async (id, resolvedBy, resolution) => {
                const item = get().missingItems.find((i) => i.id === id);
                if (!item) return;

                const now = new Date().toISOString();
                set((state) => ({
                    missingItems: state.missingItems.map((i) =>
                        i.id === id ? { ...i, status: 'resolved', resolvedAt: now, resolvedBy, resolution } : i
                    ),
                }));

                fetch(`/api/period-close/${item.periodId}/missing/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'resolved', resolution }),
                }).catch(console.error);
            },

            waiveMissingItem: async (id, reason) => {
                const item = get().missingItems.find((i) => i.id === id);
                if (!item) return;

                set((state) => ({
                    missingItems: state.missingItems.map((i) =>
                        i.id === id ? { ...i, status: 'waived', waivedReason: reason } : i
                    ),
                }));

                fetch(`/api/period-close/${item.periodId}/missing/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'waived', waivedReason: reason }),
                }).catch(console.error);
            },

            // =================================================================
            // ADJUSTMENTS
            // =================================================================

            createAdjustment: async (data) => {
                try {
                    const response = await fetch('/api/period-close/adjustments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                    if (!response.ok) throw new Error('Failed to create adjustment');
                    const created = await response.json();
                    const adjustment = mapApiToAdjustment(created);

                    set((state) => ({ adjustments: [...state.adjustments, adjustment] }));
                    return adjustment;
                } catch (error) {
                    console.error('Failed to create adjustment:', error);
                    return null;
                }
            },

            updateAdjustment: async (id, updates) => {
                set((state) => ({
                    adjustments: state.adjustments.map((a) =>
                        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
                    ),
                }));

                fetch(`/api/period-close/adjustments/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates),
                }).catch(console.error);
            },

            approveAdjustment: async (id, approvedBy) => {
                const now = new Date().toISOString();
                set((state) => ({
                    adjustments: state.adjustments.map((a) =>
                        a.id === id ? { ...a, status: 'approved', approvedBy, approvedAt: now } : a
                    ),
                }));

                fetch(`/api/period-close/adjustments/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'approved' }),
                }).catch(console.error);
            },

            rejectAdjustment: async (id, rejectedBy, reason) => {
                set((state) => ({
                    adjustments: state.adjustments.map((a) =>
                        a.id === id ? { ...a, status: 'rejected', rejectedBy, rejectionReason: reason } : a
                    ),
                }));

                fetch(`/api/period-close/adjustments/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'rejected', rejectionReason: reason }),
                }).catch(console.error);
            },

            postAdjustment: async (id) => {
                const now = new Date().toISOString();
                set((state) => ({
                    adjustments: state.adjustments.map((a) =>
                        a.id === id ? { ...a, status: 'posted', postedAt: now, journalEntryId: `JE-${Date.now()}` } : a
                    ),
                }));

                fetch(`/api/period-close/adjustments/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'posted' }),
                }).catch(console.error);
            },

            // =================================================================
            // ANALYTICS
            // =================================================================

            getSummary: () => {
                const { periods, checklistItems, missingItems, adjustments } = get();
                const currentPeriod = periods.find((p) => p.status === 'open' || p.status === 'closing' || p.status === 'reopened') || null;

                return {
                    currentPeriod,
                    openPeriods: periods.filter((p) => p.status === 'open' || p.status === 'reopened').length,
                    closedPeriods: periods.filter((p) => p.status === 'closed').length,
                    lockedPeriods: periods.filter((p) => p.status === 'locked').length,
                    checklistProgress: currentPeriod?.checklistProgress || 0,
                    pendingItems: currentPeriod
                        ? checklistItems.filter((i) => i.periodId === currentPeriod.id && i.status === 'pending').length
                        : 0,
                    criticalBlockers: currentPeriod
                        ? checklistItems.filter((i) => i.periodId === currentPeriod.id && i.isCritical && i.status !== 'completed').length
                        : 0,
                    pendingAdjustments: adjustments.filter((a) => a.status === 'pending_approval').length,
                    totalAdjustmentAmount: adjustments
                        .filter((a) => a.status === 'pending_approval')
                        .reduce((sum, a) => sum + a.amount, 0),
                    openMissingItems: missingItems.filter((i) => i.status === 'open' || i.status === 'in_progress').length,
                    criticalMissingItems: missingItems.filter(
                        (i) => (i.status === 'open' || i.status === 'in_progress') && i.severity === 'critical'
                    ).length,
                    averageCloseTime: 5,
                    lastCloseDate: periods.find((p) => p.status === 'closed')?.closedAt,
                    nextCloseDeadline: currentPeriod
                        ? new Date(new Date(currentPeriod.endDate).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
                        : undefined,
                };
            },

            getCurrentPeriod: () => {
                return get().periods.find((p) => p.status === 'open' || p.status === 'closing' || p.status === 'reopened') || null;
            },

            getBlockers: (periodId) => {
                const { checklistItems, missingItems, adjustments } = get();
                return {
                    checklist: checklistItems.filter(
                        (i) => i.periodId === periodId && i.isCritical && i.status !== 'completed' && i.status !== 'skipped'
                    ),
                    missing: missingItems.filter(
                        (i) => i.periodId === periodId && i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'waived'
                    ),
                    adjustments: adjustments.filter(
                        (a) => a.periodId === periodId && (a.status === 'pending_approval' || a.status === 'approved')
                    ),
                };
            },

            selectPeriod: (id) => set({ selectedPeriodId: id }),
        }),
        {
            name: 'primebalance-period-close',
            partialize: (state) => ({
                selectedPeriodId: state.selectedPeriodId,
            }),
        }
    )
);