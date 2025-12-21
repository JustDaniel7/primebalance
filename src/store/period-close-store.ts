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
    PeriodType,
    ChecklistItemStatus,
    AdjustmentType,
    AdjustmentStatus,
} from '@/types/period-close';
import { DEFAULT_CHECKLIST_TEMPLATES } from '@/types/period-close';

// =============================================================================
// DEMO DATA
// =============================================================================

const generateDemoPeriods = (): AccountingPeriod[] => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return [
        {
            id: 'period-current',
            name: `${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`,
            code: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
            type: 'monthly',
            startDate: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
            endDate: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0],
            fiscalYear: currentYear,
            fiscalMonth: currentMonth + 1,
            status: 'open',
            checklistTotal: 13,
            checklistCompleted: 5,
            checklistProgress: 38,
            hasUnreconciledItems: true,
            hasPendingTransactions: true,
            hasMissingDocuments: true,
            hasUnapprovedAdjustments: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'period-prev',
            name: `${new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })} ${currentYear}`,
            code: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
            type: 'monthly',
            startDate: new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0],
            endDate: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0],
            fiscalYear: currentYear,
            fiscalMonth: currentMonth,
            status: 'closed',
            closedAt: new Date(currentYear, currentMonth, 5).toISOString(),
            closedBy: 'user-1',
            checklistTotal: 13,
            checklistCompleted: 13,
            checklistProgress: 100,
            hasUnreconciledItems: false,
            hasPendingTransactions: false,
            hasMissingDocuments: false,
            hasUnapprovedAdjustments: false,
            totalRevenue: 125000,
            totalExpenses: 98000,
            netIncome: 27000,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];
};

const generateDemoChecklist = (): CloseChecklistItem[] => {
    const template = DEFAULT_CHECKLIST_TEMPLATES[0];
    return template.items.map((item, idx) => ({
        ...item,
        id: `checklist-${idx + 1}`,
        periodId: 'period-current',
        status: idx < 5 ? 'completed' : idx === 5 ? 'in_progress' : 'pending',
        completedAt: idx < 5 ? new Date().toISOString() : undefined,
        completedBy: idx < 5 ? 'user-1' : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    })) as CloseChecklistItem[];
};

const generateDemoMissingItems = (): MissingItem[] => [
    {
        id: 'missing-1',
        periodId: 'period-current',
        type: 'document',
        severity: 'high',
        title: 'Missing vendor invoice #INV-4521',
        description: 'Invoice from ABC Supplies for office equipment purchase',
        reference: 'PO-2024-0892',
        assignedTo: 'user-2',
        assignedToName: 'Jane Doe',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'missing-2',
        periodId: 'period-current',
        type: 'reconciliation',
        severity: 'critical',
        title: 'Unreconciled bank transactions',
        description: '12 transactions totaling $8,450 need to be matched',
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

const generateDemoAdjustments = (): PeriodAdjustment[] => [
    {
        id: 'adj-1',
        adjustmentNumber: 'ADJ-2024-001',
        periodId: 'period-current',
        type: 'accrual',
        status: 'pending_approval',
        description: 'Accrue December utilities expense',
        reason: 'Utility bill not yet received',
        debitAccountName: '6200 - Utilities Expense',
        creditAccountName: '2100 - Accrued Expenses',
        amount: 2500,
        currency: 'USD',
        effectiveDate: new Date().toISOString().split('T')[0],
        isReversing: true,
        reversalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        requestedBy: 'user-1',
        requestedByName: 'John Smith',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

const generateDemoAuditTrail = (): PeriodAuditEntry[] => [
    {
        id: 'audit-1',
        periodId: 'period-current',
        action: 'created',
        description: 'Period created',
        userId: 'user-1',
        userName: 'John Smith',
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'audit-2',
        periodId: 'period-current',
        action: 'checklist_updated',
        description: 'Completed: Bank Reconciliation',
        userId: 'user-1',
        userName: 'John Smith',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

// =============================================================================
// STORE
// =============================================================================

interface PeriodCloseState {
    periods: AccountingPeriod[];
    checklistItems: CloseChecklistItem[];
    missingItems: MissingItem[];
    adjustments: PeriodAdjustment[];
    auditTrail: PeriodAuditEntry[];

    selectedPeriodId: string | null;

    // Periods
    createPeriod: (period: Omit<AccountingPeriod, 'id' | 'createdAt' | 'updatedAt' | 'checklistProgress'>) => AccountingPeriod;
    updatePeriod: (id: string, updates: Partial<AccountingPeriod>) => void;
    startClosing: (id: string) => void;
    closePeriod: (id: string, closedBy: string) => boolean;
    reopenPeriod: (id: string, reopenedBy: string, reason: string) => void;
    lockPeriod: (id: string) => void;

    // Checklist
    updateChecklistItem: (id: string, updates: Partial<CloseChecklistItem>) => void;
    completeChecklistItem: (id: string, completedBy: string) => void;
    skipChecklistItem: (id: string, reason: string) => void;
    resetChecklistItem: (id: string) => void;
    initializeChecklist: (periodId: string, templateId?: string) => void;

    // Missing Items
    createMissingItem: (item: Omit<MissingItem, 'id' | 'createdAt' | 'updatedAt'>) => MissingItem;
    updateMissingItem: (id: string, updates: Partial<MissingItem>) => void;
    resolveMissingItem: (id: string, resolvedBy: string, resolution: string) => void;
    waiveMissingItem: (id: string, reason: string) => void;

    // Adjustments
    createAdjustment: (adjustment: Omit<PeriodAdjustment, 'id' | 'adjustmentNumber' | 'createdAt' | 'updatedAt'>) => PeriodAdjustment;
    updateAdjustment: (id: string, updates: Partial<PeriodAdjustment>) => void;
    approveAdjustment: (id: string, approvedBy: string) => void;
    rejectAdjustment: (id: string, rejectedBy: string, reason: string) => void;
    postAdjustment: (id: string) => void;

    // Audit
    addAuditEntry: (entry: Omit<PeriodAuditEntry, 'id' | 'createdAt'>) => void;

    // Analytics
    getSummary: () => PeriodCloseSummary;
    getCurrentPeriod: () => AccountingPeriod | null;
    getBlockers: (periodId: string) => { checklist: CloseChecklistItem[]; missing: MissingItem[]; adjustments: PeriodAdjustment[] };

    // Selection
    selectPeriod: (id: string | null) => void;
}

export const usePeriodCloseStore = create<PeriodCloseState>()(
    persist(
        (set, get) => ({
            periods: generateDemoPeriods(),
            checklistItems: generateDemoChecklist(),
            missingItems: generateDemoMissingItems(),
            adjustments: generateDemoAdjustments(),
            auditTrail: generateDemoAuditTrail(),
            selectedPeriodId: 'period-current',

            // =========================================================================
            // PERIODS
            // =========================================================================

            createPeriod: (data) => {
                const now = new Date().toISOString();
                const period: AccountingPeriod = {
                    ...data,
                    id: `period-${Date.now()}`,
                    checklistProgress: data.checklistTotal > 0 ? (data.checklistCompleted / data.checklistTotal) * 100 : 0,
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => ({ periods: [...state.periods, period] }));
                get().addAuditEntry({ periodId: period.id, action: 'created', description: 'Period created', userId: 'current-user' });
                return period;
            },

            updatePeriod: (id, updates) => {
                set((state) => ({
                    periods: state.periods.map((p) => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p),
                }));
            },

            startClosing: (id) => {
                const period = get().periods.find((p) => p.id === id);
                if (!period || period.status !== 'open') return;

                set((state) => ({
                    periods: state.periods.map((p) => p.id === id ? { ...p, status: 'closing' as PeriodStatus, updatedAt: new Date().toISOString() } : p),
                }));
                get().addAuditEntry({ periodId: id, action: 'closing_started', description: 'Period close process initiated', userId: 'current-user', previousStatus: 'open', newStatus: 'closing' });
            },

            closePeriod: (id, closedBy) => {
                const blockers = get().getBlockers(id);
                if (blockers.checklist.length > 0 || blockers.missing.length > 0 || blockers.adjustments.length > 0) {
                    return false;
                }

                const now = new Date().toISOString();
                set((state) => ({
                    periods: state.periods.map((p) => p.id === id ? { ...p, status: 'closed' as PeriodStatus, closedAt: now, closedBy, updatedAt: now } : p),
                }));
                get().addAuditEntry({ periodId: id, action: 'closed', description: 'Period closed', userId: closedBy, previousStatus: 'closing', newStatus: 'closed' });
                return true;
            },

            reopenPeriod: (id, reopenedBy, reason) => {
                const period = get().periods.find((p) => p.id === id);
                if (!period || (period.status !== 'closed' && period.status !== 'locked')) return;

                const now = new Date().toISOString();
                set((state) => ({
                    periods: state.periods.map((p) => p.id === id ? { ...p, status: 'reopened' as PeriodStatus, reopenedAt: now, reopenedBy, reopenReason: reason, updatedAt: now } : p),
                }));
                get().addAuditEntry({ periodId: id, action: 'reopened', description: `Period reopened: ${reason}`, userId: reopenedBy, previousStatus: period.status, newStatus: 'reopened', metadata: { reason } });
            },

            lockPeriod: (id) => {
                const period = get().periods.find((p) => p.id === id);
                if (!period || period.status !== 'closed') return;

                set((state) => ({
                    periods: state.periods.map((p) => p.id === id ? { ...p, status: 'locked' as PeriodStatus, updatedAt: new Date().toISOString() } : p),
                }));
                get().addAuditEntry({ periodId: id, action: 'locked', description: 'Period locked', userId: 'current-user', previousStatus: 'closed', newStatus: 'locked' });
            },

            // =========================================================================
            // CHECKLIST
            // =========================================================================

            updateChecklistItem: (id, updates) => {
                set((state) => ({
                    checklistItems: state.checklistItems.map((i) => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i),
                }));
            },

            completeChecklistItem: (id, completedBy) => {
                const item = get().checklistItems.find((i) => i.id === id);
                if (!item) return;

                set((state) => ({
                    checklistItems: state.checklistItems.map((i) => i.id === id ? { ...i, status: 'completed' as ChecklistItemStatus, completedAt: new Date().toISOString(), completedBy, updatedAt: new Date().toISOString() } : i),
                }));

                // Update period progress
                const periodItems = get().checklistItems.filter((i) => i.periodId === item.periodId);
                const completed = periodItems.filter((i) => i.status === 'completed' || i.status === 'skipped').length;
                get().updatePeriod(item.periodId, { checklistCompleted: completed, checklistProgress: (completed / periodItems.length) * 100 });
                get().addAuditEntry({ periodId: item.periodId, action: 'checklist_updated', description: `Completed: ${item.name}`, userId: completedBy });
            },

            skipChecklistItem: (id, reason) => {
                const item = get().checklistItems.find((i) => i.id === id);
                if (!item || item.isCritical) return;

                set((state) => ({
                    checklistItems: state.checklistItems.map((i) => i.id === id ? { ...i, status: 'skipped' as ChecklistItemStatus, notes: reason, updatedAt: new Date().toISOString() } : i),
                }));
            },

            resetChecklistItem: (id) => {
                set((state) => ({
                    checklistItems: state.checklistItems.map((i) => i.id === id ? { ...i, status: 'pending' as ChecklistItemStatus, completedAt: undefined, completedBy: undefined, updatedAt: new Date().toISOString() } : i),
                }));
            },

            initializeChecklist: (periodId, templateId = 'monthly-standard') => {
                const template = DEFAULT_CHECKLIST_TEMPLATES.find((t) => t.id === templateId) || DEFAULT_CHECKLIST_TEMPLATES[0];
                const now = new Date().toISOString();

                const items: CloseChecklistItem[] = template.items.map((item, idx) => ({
                    ...item,
                    id: `checklist-${periodId}-${idx + 1}`,
                    periodId,
                    status: 'pending' as ChecklistItemStatus,
                    createdAt: now,
                    updatedAt: now,
                }));

                set((state) => ({
                    checklistItems: [...state.checklistItems.filter((i) => i.periodId !== periodId), ...items],
                }));
                get().updatePeriod(periodId, { checklistTotal: items.length, checklistCompleted: 0, checklistProgress: 0 });
            },

            // =========================================================================
            // MISSING ITEMS
            // =========================================================================

            createMissingItem: (data) => {
                const now = new Date().toISOString();
                const item: MissingItem = { ...data, id: `missing-${Date.now()}`, createdAt: now, updatedAt: now };
                set((state) => ({ missingItems: [...state.missingItems, item] }));
                get().updatePeriod(data.periodId, { hasMissingDocuments: true });
                return item;
            },

            updateMissingItem: (id, updates) => {
                set((state) => ({
                    missingItems: state.missingItems.map((i) => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i),
                }));
            },

            resolveMissingItem: (id, resolvedBy, resolution) => {
                set((state) => ({
                    missingItems: state.missingItems.map((i) => i.id === id ? { ...i, status: 'resolved', resolvedAt: new Date().toISOString(), resolvedBy, resolution, updatedAt: new Date().toISOString() } : i),
                }));
            },

            waiveMissingItem: (id, reason) => {
                set((state) => ({
                    missingItems: state.missingItems.map((i) => i.id === id ? { ...i, status: 'waived', waivedReason: reason, updatedAt: new Date().toISOString() } : i),
                }));
            },

            // =========================================================================
            // ADJUSTMENTS
            // =========================================================================

            createAdjustment: (data) => {
                const now = new Date().toISOString();
                const count = get().adjustments.length + 1;
                const adjustment: PeriodAdjustment = {
                    ...data,
                    id: `adj-${Date.now()}`,
                    adjustmentNumber: `ADJ-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`,
                    createdAt: now,
                    updatedAt: now,
                };
                set((state) => ({ adjustments: [...state.adjustments, adjustment] }));
                get().updatePeriod(data.periodId, { hasUnapprovedAdjustments: true });
                return adjustment;
            },

            updateAdjustment: (id, updates) => {
                set((state) => ({
                    adjustments: state.adjustments.map((a) => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a),
                }));
            },

            approveAdjustment: (id, approvedBy) => {
                set((state) => ({
                    adjustments: state.adjustments.map((a) => a.id === id ? { ...a, status: 'approved' as AdjustmentStatus, approvedBy, approvedByName: 'Approver', approvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : a),
                }));
            },

            rejectAdjustment: (id, rejectedBy, reason) => {
                set((state) => ({
                    adjustments: state.adjustments.map((a) => a.id === id ? { ...a, status: 'rejected' as AdjustmentStatus, rejectedBy, rejectionReason: reason, updatedAt: new Date().toISOString() } : a),
                }));
            },

            postAdjustment: (id) => {
                const adj = get().adjustments.find((a) => a.id === id);
                if (!adj || adj.status !== 'approved') return;

                set((state) => ({
                    adjustments: state.adjustments.map((a) => a.id === id ? { ...a, status: 'posted' as AdjustmentStatus, postedAt: new Date().toISOString(), journalEntryId: `JE-${Date.now()}`, updatedAt: new Date().toISOString() } : a),
                }));
                get().addAuditEntry({ periodId: adj.periodId, action: 'adjustment_posted', description: `Posted adjustment ${adj.adjustmentNumber}`, userId: 'current-user', metadata: { adjustmentId: id, amount: adj.amount } });
            },

            // =========================================================================
            // AUDIT
            // =========================================================================

            addAuditEntry: (entry) => {
                const auditEntry: PeriodAuditEntry = { ...entry, id: `audit-${Date.now()}`, createdAt: new Date().toISOString() };
                set((state) => ({ auditTrail: [auditEntry, ...state.auditTrail] }));
            },

            // =========================================================================
            // ANALYTICS
            // =========================================================================

            getSummary: () => {
                const { periods, checklistItems, missingItems, adjustments } = get();
                const currentPeriod = get().getCurrentPeriod();

                return {
                    currentPeriod,
                    openPeriods: periods.filter((p) => p.status === 'open' || p.status === 'closing' || p.status === 'reopened').length,
                    closedPeriods: periods.filter((p) => p.status === 'closed').length,
                    lockedPeriods: periods.filter((p) => p.status === 'locked').length,
                    checklistProgress: currentPeriod?.checklistProgress || 0,
                    pendingItems: currentPeriod ? checklistItems.filter((i) => i.periodId === currentPeriod.id && i.status === 'pending').length : 0,
                    criticalBlockers: currentPeriod ? checklistItems.filter((i) => i.periodId === currentPeriod.id && i.isCritical && i.status !== 'completed').length : 0,
                    pendingAdjustments: adjustments.filter((a) => a.status === 'pending_approval').length,
                    totalAdjustmentAmount: adjustments.filter((a) => a.status === 'pending_approval').reduce((sum, a) => sum + a.amount, 0),
                    openMissingItems: missingItems.filter((i) => i.status === 'open' || i.status === 'in_progress').length,
                    criticalMissingItems: missingItems.filter((i) => (i.status === 'open' || i.status === 'in_progress') && i.severity === 'critical').length,
                    averageCloseTime: 5,
                    lastCloseDate: periods.find((p) => p.status === 'closed')?.closedAt,
                    nextCloseDeadline: currentPeriod ? new Date(new Date(currentPeriod.endDate).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString() : undefined,
                };
            },

            getCurrentPeriod: () => {
                return get().periods.find((p) => p.status === 'open' || p.status === 'closing' || p.status === 'reopened') || null;
            },

            getBlockers: (periodId) => {
                const { checklistItems, missingItems, adjustments } = get();
                return {
                    checklist: checklistItems.filter((i) => i.periodId === periodId && i.isCritical && i.status !== 'completed' && i.status !== 'skipped'),
                    missing: missingItems.filter((i) => i.periodId === periodId && i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'waived'),
                    adjustments: adjustments.filter((a) => a.periodId === periodId && (a.status === 'pending_approval' || a.status === 'approved')),
                };
            },

            selectPeriod: (id) => set({ selectedPeriodId: id }),
        }),
        {
            name: 'primebalance-period-close',
            partialize: (state) => ({
                periods: state.periods,
                checklistItems: state.checklistItems,
                missingItems: state.missingItems,
                adjustments: state.adjustments,
                auditTrail: state.auditTrail,
            }),
        }
    )
);