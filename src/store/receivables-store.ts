import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    Receivable,
    ReceivableEvent,
    ReceivableStatus,
    ReceivablesSummary,
    ReceivableFilter,
    PaymentApplication,
    CollectionAction,
    Debtor,
    RiskLevel,
    AgingBucket,
    EventActor,
} from '@/types/receivables';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const VALID_TRANSITIONS: Record<ReceivableStatus, ReceivableStatus[]> = {
    open: ['due', 'partially_paid', 'paid', 'disputed', 'written_off', 'settled_via_offset'],
    due: ['overdue', 'partially_paid', 'paid', 'disputed', 'written_off', 'settled_via_offset'],
    overdue: ['partially_paid', 'paid', 'disputed', 'in_collection', 'written_off', 'settled_via_offset'],
    partially_paid: ['paid', 'overdue', 'disputed', 'in_collection', 'written_off', 'settled_via_offset'],
    paid: [],
    disputed: ['open', 'due', 'overdue', 'partially_paid', 'paid', 'written_off'],
    in_collection: ['partially_paid', 'paid', 'written_off', 'settled_via_offset'],
    written_off: [],
    settled_via_offset: [],
};

function calculateAgingBucket(days: number): AgingBucket {
    if (days <= 30) return '0-30';
    if (days <= 60) return '31-60';
    if (days <= 90) return '61-90';
    return '90+';
}

function calculateDaysOutstanding(issueDate: string, status: ReceivableStatus): number {
    if (['paid', 'written_off', 'settled_via_offset'].includes(status)) return 0;
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((Date.now() - new Date(issueDate).getTime()) / msPerDay);
}

const VALID_RECEIVABLE_STATUSES: ReceivableStatus[] = [
    'open', 'due', 'overdue', 'partially_paid', 'paid', 
    'disputed', 'in_collection', 'written_off', 'settled_via_offset'
];

const VALID_RISK_LEVELS: RiskLevel[] = ['low', 'medium', 'high', 'critical'];

function normalizeReceivableStatus(status: string | undefined): ReceivableStatus {
    if (!status) return 'open';
    const lower = status.toLowerCase() as ReceivableStatus;
    return VALID_RECEIVABLE_STATUSES.includes(lower) ? lower : 'open';
}

function normalizeRiskLevel(level: string | undefined): RiskLevel {
    if (!level) return 'low';
    const lower = level.toLowerCase() as RiskLevel;
    return VALID_RISK_LEVELS.includes(lower) ? lower : 'low';
}

function mapApiToReceivable(api: any): Receivable {
    const status = normalizeReceivableStatus(api.status);
    const days = api.daysOutstanding ?? calculateDaysOutstanding(api.issueDate, status);
    return {
        id: api.id,
        originType: api.originType || 'invoice',
        originReferenceId: api.originReferenceId,
        creditorEntityId: api.creditorEntityId || 'company-001',
        debtorId: api.debtorId,
        debtor: api.debtor,
        currency: api.currency || 'EUR',
        originalAmount: Number(api.originalAmount) || 0,
        outstandingAmount: Number(api.outstandingAmount) || 0,
        paidAmount: Number(api.paidAmount) || 0,
        disputedAmount: Number(api.disputedAmount) || 0,
        writtenOffAmount: Number(api.writtenOffAmount) || 0,
        issueDate: api.issueDate?.split('T')[0] || api.issueDate,
        dueDate: api.dueDate?.split('T')[0] || api.dueDate,
        expectedPaymentDate: api.expectedPaymentDate?.split('T')[0],
        lastActivityDate: api.lastActivityDate || new Date().toISOString(),
        status,
        riskLevel: normalizeRiskLevel(api.riskLevel),
        daysOutstanding: days,
        agingBucket: api.agingBucket || calculateAgingBucket(days),
        isDisputed: api.isDisputed || false,
        disputeReason: api.disputeReason,
        disputeOpenedAt: api.disputeOpenedAt,
        collectionStage: api.collectionStage,
        collectionStartedAt: api.collectionStartedAt,
        reference: api.reference,
        description: api.description,
        notes: api.notes,
        tags: api.tags || [],
        autoRemindersEnabled: api.autoRemindersEnabled ?? true,
        nextReminderDate: api.nextReminderDate,
        createdAt: api.createdAt,
        updatedAt: api.updatedAt,
    };
}

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface ReceivablesState {
    receivables: Receivable[];
    events: ReceivableEvent[];
    payments: PaymentApplication[];
    collectionActions: CollectionAction[];
    debtors: Debtor[];
    filter: ReceivableFilter;
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;

    // API
    fetchReceivables: () => Promise<void>;

    // CRUD
    createReceivable: (data: Omit<Receivable, 'id' | 'createdAt' | 'updatedAt' | 'outstandingAmount' | 'paidAmount' | 'disputedAmount' | 'writtenOffAmount' | 'daysOutstanding' | 'agingBucket' | 'status' | 'riskLevel' | 'lastActivityDate'>) => Receivable;
    updateReceivable: (id: string, updates: Partial<Receivable>) => void;

    // Events
    recordEvent: (event: Omit<ReceivableEvent, 'id' | 'timestamp'>) => ReceivableEvent;
    getEventsByReceivable: (receivableId: string) => ReceivableEvent[];

    // State transitions
    transitionStatus: (id: string, newStatus: ReceivableStatus, actor: EventActor, notes?: string) => boolean;

    // Payment
    applyPayment: (receivableId: string, amount: number, type: PaymentApplication['type'], reference?: string) => boolean;

    // Disputes
    openDispute: (receivableId: string, reason: string, disputedAmount?: number) => void;
    resolveDispute: (receivableId: string, resolution: 'accepted' | 'rejected', notes?: string) => void;

    // Collection
    scheduleCollectionAction: (action: Omit<CollectionAction, 'id'>) => CollectionAction;
    completeCollectionAction: (actionId: string, result: string) => void;
    startCollection: (receivableId: string) => void;

    // Write-off & Offset
    writeOff: (receivableId: string, amount: number, reason: string) => void;
    applyOffset: (receivableId: string, amount: number, contraReference: string) => void;

    // Calculations
    recalculateReceivable: (id: string) => void;
    updateAging: () => void;
    calculateRisk: (receivableId: string) => RiskLevel;

    // Filter & Query
    setFilter: (filter: ReceivableFilter) => void;
    resetFilter: () => void;
    getFilteredReceivables: () => Receivable[];
    getByStatus: (status: ReceivableStatus) => Receivable[];
    getByDebtor: (debtorId: string) => Receivable[];
    getOverdue: () => Receivable[];

    // Analytics
    getSummary: () => ReceivablesSummary;
    getAgingReport: () => Record<AgingBucket, Receivable[]>;
    getCashForecast: (days: number) => { date: string; expected: number }[];
    getDebtorExposure: () => { debtor: Debtor; totalOutstanding: number; overdueAmount: number }[];

    // Automation
    processAutomations: () => void;
    sendReminder: (receivableId: string) => Promise<{ success: boolean; sentTo?: string; messageId?: string; error?: string }>;
}

const initialFilter: ReceivableFilter = {};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useReceivablesStore = create<ReceivablesState>()(
    persist(
        (set, get) => ({
            receivables: [],
            events: [],
            payments: [],
            collectionActions: [],
            debtors: [],
            filter: initialFilter,
            isLoading: false,
            error: null,
            isInitialized: false,

            // =================================================================
            // API
            // =================================================================

            fetchReceivables: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch('/api/receivables');
                    if (!response.ok) throw new Error('Failed to fetch receivables');
                    const data = await response.json();
                    const receivables = (data.receivables || data || []).map(mapApiToReceivable);
                    set({ receivables, isLoading: false, isInitialized: true });
                } catch (error) {
                    console.error('Failed to fetch receivables:', error);
                    set({ error: (error as Error).message, isLoading: false, isInitialized: true });
                }
            },

            // =================================================================
            // CRUD
            // =================================================================

            createReceivable: (data) => {
                const now = new Date().toISOString();
                const days = calculateDaysOutstanding(data.issueDate, 'open');

                const newReceivable: Receivable = {
                    ...data,
                    id: `rec-${Date.now()}`,
                    outstandingAmount: data.originalAmount,
                    paidAmount: 0,
                    disputedAmount: 0,
                    writtenOffAmount: 0,
                    status: 'open',
                    riskLevel: 'low',
                    daysOutstanding: days,
                    agingBucket: calculateAgingBucket(days),
                    lastActivityDate: now,
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => ({
                    receivables: [...state.receivables, newReceivable],
                }));

                get().recordEvent({
                    receivableId: newReceivable.id,
                    type: 'receivable_created',
                    actor: 'user',
                    reference: data.originReferenceId,
                    referenceType: 'document',
                    amountImpact: data.originalAmount,
                    newStatus: 'open',
                });

                // Background API sync
                fetch('/api/receivables', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                }).catch(console.error);

                return newReceivable;
            },

            updateReceivable: (id, updates) => {
                set((state) => ({
                    receivables: state.receivables.map((r) =>
                        r.id === id
                            ? { ...r, ...updates, updatedAt: new Date().toISOString() }
                            : r
                    ),
                }));

                // Background API sync
                fetch(`/api/receivables/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates),
                }).catch(console.error);
            },

            // =================================================================
            // EVENTS
            // =================================================================

            recordEvent: (eventData) => {
                const newEvent: ReceivableEvent = {
                    ...eventData,
                    id: `evt-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                };
                set((state) => ({
                    events: [...state.events, newEvent],
                }));
                return newEvent;
            },

            getEventsByReceivable: (receivableId) => {
                return get()
                    .events.filter((e) => e.receivableId === receivableId)
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            },

            // =================================================================
            // STATE TRANSITIONS
            // =================================================================

            transitionStatus: (id, newStatus, actor, notes) => {
                const receivable = get().receivables.find((r) => r.id === id);
                if (!receivable) return false;

                const validTransitions = VALID_TRANSITIONS[receivable.status];
                if (!validTransitions.includes(newStatus)) {
                    console.warn(`Invalid transition from ${receivable.status} to ${newStatus}`);
                    return false;
                }

                const previousStatus = receivable.status;
                get().updateReceivable(id, {
                    status: newStatus,
                    lastActivityDate: new Date().toISOString(),
                });

                get().recordEvent({
                    receivableId: id,
                    type: 'receivable_closed',
                    actor,
                    previousStatus,
                    newStatus,
                    notes,
                });

                return true;
            },

            // =================================================================
            // PAYMENT APPLICATION
            // =================================================================

            applyPayment: (receivableId, amount, type, reference) => {
                const receivable = get().receivables.find((r) => r.id === receivableId);
                if (!receivable) return false;
                if (amount <= 0 || amount > receivable.outstandingAmount) return false;

                const newPaidAmount = receivable.paidAmount + amount;
                const newOutstandingAmount = receivable.outstandingAmount - amount;
                const isPaid = newOutstandingAmount === 0;
                const newStatus: ReceivableStatus = isPaid ? 'paid' : 'partially_paid';

                const payment: PaymentApplication = {
                    id: `pay-${Date.now()}`,
                    receivableId,
                    amount,
                    currency: receivable.currency,
                    appliedAt: new Date().toISOString(),
                    type,
                    reference,
                };

                set((state) => ({
                    payments: [...state.payments, payment],
                }));

                get().updateReceivable(receivableId, {
                    paidAmount: newPaidAmount,
                    outstandingAmount: newOutstandingAmount,
                    status: newStatus,
                    lastActivityDate: new Date().toISOString(),
                });

                get().recordEvent({
                    receivableId,
                    type: isPaid ? 'payment_applied' : 'partial_payment_applied',
                    actor: 'user',
                    reference,
                    referenceType: 'transaction',
                    amountImpact: -amount,
                    previousStatus: receivable.status,
                    newStatus,
                });

                return true;
            },

            // =================================================================
            // DISPUTES
            // =================================================================

            openDispute: (receivableId, reason, disputedAmount) => {
                const receivable = get().receivables.find((r) => r.id === receivableId);
                if (!receivable) return;

                const now = new Date().toISOString();
                const amount = disputedAmount || receivable.outstandingAmount;

                get().updateReceivable(receivableId, {
                    status: 'disputed',
                    isDisputed: true,
                    disputeReason: reason,
                    disputeOpenedAt: now,
                    disputedAmount: amount,
                    lastActivityDate: now,
                });

                get().recordEvent({
                    receivableId,
                    type: 'dispute_opened',
                    actor: 'user',
                    previousStatus: receivable.status,
                    newStatus: 'disputed',
                    notes: reason,
                    amountImpact: amount,
                });
            },

            resolveDispute: (receivableId, resolution, notes) => {
                const receivable = get().receivables.find((r) => r.id === receivableId);
                if (!receivable) return;

                const newStatus: ReceivableStatus = resolution === 'accepted' ? 'open' : 'disputed';

                get().updateReceivable(receivableId, {
                    status: newStatus,
                    isDisputed: resolution !== 'accepted',
                    disputedAmount: resolution === 'accepted' ? 0 : receivable.disputedAmount,
                    lastActivityDate: new Date().toISOString(),
                });

                get().recordEvent({
                    receivableId,
                    type: 'dispute_resolved',
                    actor: 'user',
                    previousStatus: 'disputed',
                    newStatus,
                    notes: `Resolution: ${resolution}. ${notes || ''}`,
                });
            },

            // =================================================================
            // COLLECTION
            // =================================================================

            scheduleCollectionAction: (actionData) => {
                const newAction: CollectionAction = {
                    ...actionData,
                    id: `col-${Date.now()}`,
                };
                set((state) => ({
                    collectionActions: [...state.collectionActions, newAction],
                }));
                return newAction;
            },

            completeCollectionAction: (actionId, result) => {
                set((state) => ({
                    collectionActions: state.collectionActions.map((a) =>
                        a.id === actionId
                            ? {
                                  ...a,
                                  status: 'completed' as const,
                                  completedDate: new Date().toISOString(),
                                  result,
                              }
                            : a
                    ),
                }));
            },

            startCollection: (receivableId) => {
                const receivable = get().receivables.find((r) => r.id === receivableId);
                if (!receivable) return;

                const now = new Date().toISOString();

                get().updateReceivable(receivableId, {
                    status: 'in_collection',
                    collectionStage: 'reminder_1',
                    collectionStartedAt: now,
                    lastActivityDate: now,
                });

                get().recordEvent({
                    receivableId,
                    type: 'collection_action_started',
                    actor: 'user',
                    previousStatus: receivable.status,
                    newStatus: 'in_collection',
                });
            },

            // =================================================================
            // WRITE-OFF & OFFSET
            // =================================================================

            writeOff: (receivableId, amount, reason) => {
                const receivable = get().receivables.find((r) => r.id === receivableId);
                if (!receivable) return;

                const newWrittenOffAmount = receivable.writtenOffAmount + amount;
                const newOutstandingAmount = receivable.outstandingAmount - amount;
                const isFullWriteOff = newOutstandingAmount === 0;

                get().updateReceivable(receivableId, {
                    writtenOffAmount: newWrittenOffAmount,
                    outstandingAmount: newOutstandingAmount,
                    status: isFullWriteOff ? 'written_off' : receivable.status,
                    lastActivityDate: new Date().toISOString(),
                });

                get().recordEvent({
                    receivableId,
                    type: 'write_off_applied',
                    actor: 'user',
                    amountImpact: -amount,
                    notes: reason,
                    newStatus: isFullWriteOff ? 'written_off' : undefined,
                });
            },

            applyOffset: (receivableId, amount, contraReference) => {
                const receivable = get().receivables.find((r) => r.id === receivableId);
                if (!receivable) return;

                const newOutstandingAmount = Math.max(0, receivable.outstandingAmount - amount);
                const isSettled = newOutstandingAmount === 0;

                const payment: PaymentApplication = {
                    id: `pay-${Date.now()}`,
                    receivableId,
                    amount,
                    currency: receivable.currency,
                    appliedAt: new Date().toISOString(),
                    type: 'offset',
                    reference: contraReference,
                };

                set((state) => ({
                    payments: [...state.payments, payment],
                }));

                get().updateReceivable(receivableId, {
                    paidAmount: receivable.paidAmount + amount,
                    outstandingAmount: newOutstandingAmount,
                    status: isSettled ? 'settled_via_offset' : receivable.status,
                    lastActivityDate: new Date().toISOString(),
                });

                get().recordEvent({
                    receivableId,
                    type: 'offset_applied',
                    actor: 'user',
                    reference: contraReference,
                    amountImpact: -amount,
                    newStatus: isSettled ? 'settled_via_offset' : undefined,
                });
            },

            // =================================================================
            // CALCULATIONS
            // =================================================================

            recalculateReceivable: (id) => {
                const receivable = get().receivables.find((r) => r.id === id);
                if (!receivable) return;

                const daysOutstanding = calculateDaysOutstanding(receivable.issueDate, receivable.status);
                const agingBucket = calculateAgingBucket(daysOutstanding);
                const riskLevel = get().calculateRisk(id);

                get().updateReceivable(id, {
                    daysOutstanding,
                    agingBucket,
                    riskLevel,
                });
            },

            updateAging: () => {
                const { receivables } = get();
                receivables.forEach((r) => {
                    if (!['paid', 'written_off', 'settled_via_offset'].includes(r.status)) {
                        get().recalculateReceivable(r.id);
                    }
                });
            },

            calculateRisk: (receivableId) => {
                const receivable = get().receivables.find((r) => r.id === receivableId);
                if (!receivable) return 'low';

                const debtor = get().debtors.find((d) => d.id === receivable.debtorId);
                let riskScore = 0;

                // Days overdue calculation
                const dueDate = new Date(receivable.dueDate);
                const now = new Date();
                const msPerDay = 1000 * 60 * 60 * 24;
                const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / msPerDay));

                if (daysOverdue > 90) riskScore += 40;
                else if (daysOverdue > 60) riskScore += 30;
                else if (daysOverdue > 30) riskScore += 20;
                else if (daysOverdue > 0) riskScore += 10;

                // Amount risk
                if (receivable.outstandingAmount > 50000) riskScore += 15;
                else if (receivable.outstandingAmount > 20000) riskScore += 10;

                // Debtor history risk
                if (debtor) {
                    if (debtor.paymentHistory === 'poor') riskScore += 25;
                    else if (debtor.paymentHistory === 'fair') riskScore += 15;
                    if (debtor.averagePaymentDelayDays > 30) riskScore += 10;
                }

                // Disputed risk
                if (receivable.isDisputed) riskScore += 15;

                // Collection risk
                if (receivable.status === 'in_collection') riskScore += 10;

                if (riskScore >= 60) return 'critical';
                if (riskScore >= 40) return 'high';
                if (riskScore >= 20) return 'medium';
                return 'low';
            },

            // =================================================================
            // FILTER & QUERY
            // =================================================================

            setFilter: (filter) => set({ filter }),
            resetFilter: () => set({ filter: initialFilter }),

            getFilteredReceivables: () => {
                const { receivables, filter, debtors } = get();

                return receivables
                    .filter((r) => {
                        if (filter.status?.length && !filter.status.includes(r.status)) {
                            return false;
                        }
                        if (filter.riskLevel?.length && !filter.riskLevel.includes(r.riskLevel)) {
                            return false;
                        }
                        if (filter.agingBucket?.length && !filter.agingBucket.includes(r.agingBucket)) {
                            return false;
                        }
                        if (filter.debtorId && r.debtorId !== filter.debtorId) {
                            return false;
                        }
                        if (filter.currency && r.currency !== filter.currency) {
                            return false;
                        }
                        if (filter.minAmount && r.outstandingAmount < filter.minAmount) {
                            return false;
                        }
                        if (filter.maxAmount && r.outstandingAmount > filter.maxAmount) {
                            return false;
                        }
                        if (filter.search) {
                            const searchLower = filter.search.toLowerCase();
                            const debtor = debtors.find((d) => d.id === r.debtorId);
                            const matchesSearch =
                                r.reference?.toLowerCase().includes(searchLower) ||
                                r.originReferenceId?.toLowerCase().includes(searchLower) ||
                                debtor?.name.toLowerCase().includes(searchLower);
                            if (!matchesSearch) return false;
                        }
                        return true;
                    })
                    .map((r) => ({
                        ...r,
                        debtor: debtors.find((d) => d.id === r.debtorId),
                    }));
            },

            getByStatus: (status) => {
                return get().receivables.filter((r) => r.status === status);
            },

            getByDebtor: (debtorId) => {
                return get().receivables.filter((r) => r.debtorId === debtorId);
            },

            getOverdue: () => {
                return get().receivables.filter(
                    (r) => r.status === 'overdue' || r.status === 'in_collection'
                );
            },

            // =================================================================
            // ANALYTICS
            // =================================================================

            getSummary: (): ReceivablesSummary => {
                const { receivables } = get();
                const terminalStatuses = ['paid', 'written_off', 'settled_via_offset'];
                const active = receivables.filter((r) => !terminalStatuses.includes(r.status));

                const totalOutstanding = active.reduce((sum, r) => sum + Number(r.outstandingAmount || 0), 0);
                const overdueStatuses = ['overdue', 'in_collection'];
                const totalOverdue = active
                    .filter((r) => overdueStatuses.includes(r.status))
                    .reduce((sum, r) => sum + Number(r.outstandingAmount || 0), 0);
                const totalDisputed = active
                    .filter((r) => r.isDisputed)
                    .reduce((sum, r) => sum + Number(r.disputedAmount || 0), 0);

                // By status
                const byStatus = {} as Record<ReceivableStatus, { count: number; amount: number }>;
                active.forEach((r) => {
                    if (!byStatus[r.status]) {
                        byStatus[r.status] = { count: 0, amount: 0 };
                    }
                    byStatus[r.status].count += 1;
                    byStatus[r.status].amount += Number(r.outstandingAmount || 0);
                });

                // Aging
                const agingBuckets: AgingBucket[] = ['0-30', '31-60', '61-90', '90+'];
                const aging = {} as Record<AgingBucket, { count: number; amount: number }>;
                agingBuckets.forEach((bucket) => {
                    const items = active.filter((r) => r.agingBucket === bucket);
                    aging[bucket] = {
                        count: items.length,
                        amount: items.reduce((sum, r) => sum + Number(r.outstandingAmount || 0), 0),
                    };
                });

                // By risk
                const riskLevels: RiskLevel[] = ['low', 'medium', 'high', 'critical'];
                const byRisk = {} as Record<RiskLevel, { count: number; amount: number }>;
                riskLevels.forEach((level) => {
                    const items = active.filter((r) => r.riskLevel === level);
                    byRisk[level] = {
                        count: items.length,
                        amount: items.reduce((sum, r) => sum + Number(r.outstandingAmount || 0), 0),
                    };
                });

                // By currency
                const byCurrency = {} as Record<string, number>;
                active.forEach((r) => {
                    byCurrency[r.currency] = (byCurrency[r.currency] || 0) + Number(r.outstandingAmount || 0);
                });

                // DSO
                const avgDays =
                    active.length > 0
                        ? active.reduce((sum, r) => sum + Number(r.daysOutstanding || 0), 0) / active.length
                        : 0;

                return {
                    totalReceivables: active.length,
                    totalOutstanding,
                    totalOverdue,
                    totalDisputed,
                    byStatus,
                    aging,
                    byRisk,
                    byCurrency,
                    dso: Math.round(avgDays * 10) / 10,
                    collectionRate: 0,
                    overdueRate: totalOutstanding > 0 ? Math.round((totalOverdue / totalOutstanding) * 1000) / 10 : 0,
                    expectedCashIn7Days: 0,
                    expectedCashIn30Days: 0,
                };
            },

            getAgingReport: () => {
                const { receivables } = get();
                const report = {} as Record<AgingBucket, Receivable[]>;
                const buckets: AgingBucket[] = ['0-30', '31-60', '61-90', '90+'];

                buckets.forEach((bucket) => {
                    report[bucket] = receivables.filter(
                        (r) => r.agingBucket === bucket && !['paid', 'written_off'].includes(r.status)
                    );
                });

                return report;
            },

            getCashForecast: (days) => {
                const forecast: { date: string; expected: number }[] = [];
                const { receivables } = get();
                const today = new Date();
                const msPerDay = 1000 * 60 * 60 * 24;

                for (let i = 0; i <= days; i++) {
                    const date = new Date(today.getTime() + i * msPerDay);
                    const dateStr = date.toISOString().split('T')[0];
                    const expected = receivables
                        .filter(
                            (r) =>
                                r.dueDate === dateStr && !['paid', 'written_off'].includes(r.status)
                        )
                        .reduce((sum, r) => sum + Number(r.outstandingAmount || 0), 0);
                    forecast.push({ date: dateStr, expected });
                }

                return forecast;
            },

            getDebtorExposure: () => {
                const { receivables, debtors } = get();

                return debtors
                    .map((debtor) => {
                        const debtorReceivables = receivables.filter(
                            (r) =>
                                r.debtorId === debtor.id &&
                                !['paid', 'written_off'].includes(r.status)
                        );
                        const totalOutstanding = debtorReceivables.reduce(
                            (sum, r) => sum + Number(r.outstandingAmount || 0),
                            0
                        );
                        const overdueAmount = debtorReceivables
                            .filter((r) => ['overdue', 'in_collection'].includes(r.status))
                            .reduce((sum, r) => sum + Number(r.outstandingAmount || 0), 0);

                        return {
                            debtor,
                            totalOutstanding,
                            overdueAmount,
                        };
                    })
                    .filter((e) => e.totalOutstanding > 0)
                    .sort((a, b) => b.totalOutstanding - a.totalOutstanding);
            },

            // =================================================================
            // AUTOMATION
            // =================================================================

            processAutomations: () => {
                // Placeholder for automation processing
            },

            sendReminder: async (receivableId) => {
                const receivable = get().receivables.find((r) => r.id === receivableId);
                if (!receivable) return { success: false, error: 'Receivable not found' };

                try {
                    const res = await fetch(`/api/receivables/${receivableId}/send-reminder`, {
                        method: 'POST',
                    });

                    if (!res.ok) {
                        const errorData = await res.json();
                        return { success: false, error: errorData.error || 'Failed to send reminder' };
                    }

                    const data = await res.json();

                    // Update local state
                    get().updateReceivable(receivableId, {
                        lastActivityDate: new Date().toISOString(),
                    });

                    get().recordEvent({
                        receivableId,
                        type: 'reminder_sent',
                        actor: 'user',
                    });

                    return { success: true, sentTo: data.sentTo, messageId: data.messageId };
                } catch (error) {
                    console.error('Failed to send reminder:', error);
                    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
                }
            },
        }),
        {
            name: 'primebalance-receivables',
            partialize: (state) => ({
                receivables: state.receivables,
                events: state.events,
                payments: state.payments,
                collectionActions: state.collectionActions,
                debtors: state.debtors,
            }),
        }
    )
);