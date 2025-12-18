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
    ReceivableEventType,
    EventActor,
    VALID_TRANSITIONS,
} from '@/types/receivables';

// =============================================================================
// RECEIVABLES STORE
// =============================================================================

interface ReceivablesState {
    receivables: Receivable[];
    events: ReceivableEvent[];
    payments: PaymentApplication[];
    collectionActions: CollectionAction[];
    debtors: Debtor[];
    filter: ReceivableFilter;

    // CRUD
    createReceivable: (data: Omit<Receivable, 'id' | 'createdAt' | 'updatedAt' | 'outstandingAmount' | 'paidAmount' | 'disputedAmount' | 'writtenOffAmount' | 'daysOutstanding' | 'agingBucket' | 'status' | 'riskLevel' | 'lastActivityDate'>) => Receivable;
    updateReceivable: (id: string, updates: Partial<Receivable>) => void;

    // Events (append-only)
    recordEvent: (event: Omit<ReceivableEvent, 'id' | 'timestamp'>) => ReceivableEvent;
    getEventsByReceivable: (receivableId: string) => ReceivableEvent[];

    // State transitions
    transitionStatus: (id: string, newStatus: ReceivableStatus, actor: EventActor, notes?: string) => boolean;

    // Payment application
    applyPayment: (receivableId: string, amount: number, type: PaymentApplication['type'], reference?: string) => boolean;

    // Disputes
    openDispute: (receivableId: string, reason: string, disputedAmount?: number) => void;
    resolveDispute: (receivableId: string, resolution: 'accepted' | 'rejected', notes?: string) => void;

    // Collection
    scheduleCollectionAction: (action: Omit<CollectionAction, 'id'>) => CollectionAction;
    completeCollectionAction: (actionId: string, result: string) => void;
    startCollection: (receivableId: string) => void;

    // Write-off
    writeOff: (receivableId: string, amount: number, reason: string) => void;

    // Offset/Netting
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
    sendReminder: (receivableId: string) => void;
}

const initialFilter: ReceivableFilter = {};

// Demo debtors
const generateDemoDebtors = (): Debtor[] => [
    {
        id: 'deb-001',
        name: 'TechCorp Solutions GmbH',
        type: 'customer',
        email: 'billing@techcorp.de',
        country: 'DE',
        vatId: 'DE123456789',
        creditLimit: 100000,
        paymentTermsDays: 30,
        averagePaymentDelayDays: 5,
        totalReceivables: 45000,
        overdueReceivables: 0,
        paymentHistory: 'excellent',
    },
    {
        id: 'deb-002',
        name: 'Digital Dynamics AG',
        type: 'customer',
        email: 'accounts@digitaldynamics.ch',
        country: 'CH',
        vatId: 'CHE-123.456.789',
        creditLimit: 75000,
        paymentTermsDays: 45,
        averagePaymentDelayDays: 12,
        totalReceivables: 28500,
        overdueReceivables: 8500,
        paymentHistory: 'good',
    },
    {
        id: 'deb-003',
        name: 'StartUp Ventures SL',
        type: 'customer',
        email: 'finance@startupventures.es',
        country: 'ES',
        paymentTermsDays: 30,
        averagePaymentDelayDays: 35,
        totalReceivables: 15000,
        overdueReceivables: 15000,
        paymentHistory: 'poor',
    },
    {
        id: 'deb-004',
        name: 'Innovation Labs SARL',
        type: 'partner',
        email: 'comptabilite@innovlabs.fr',
        country: 'FR',
        vatId: 'FR12345678901',
        creditLimit: 50000,
        paymentTermsDays: 60,
        averagePaymentDelayDays: 8,
        totalReceivables: 22000,
        overdueReceivables: 0,
        paymentHistory: 'good',
    },
];

// Demo receivables
const generateDemoReceivables = (): Receivable[] => {
    const now = new Date();
    return [
        {
            id: 'rec-001',
            originType: 'invoice',
            originReferenceId: 'INV-2024-0156',
            creditorEntityId: 'company-001',
            debtorId: 'deb-001',
            currency: 'EUR',
            originalAmount: 25000,
            outstandingAmount: 25000,
            paidAmount: 0,
            disputedAmount: 0,
            writtenOffAmount: 0,
            issueDate: '2024-12-01',
            dueDate: '2024-12-31',
            lastActivityDate: '2024-12-01',
            status: 'open',
            riskLevel: 'low',
            daysOutstanding: 15,
            agingBucket: '0-30',
            isDisputed: false,
            reference: 'Project Alpha - Phase 2',
            autoRemindersEnabled: true,
            createdAt: '2024-12-01T10:00:00Z',
            updatedAt: '2024-12-01T10:00:00Z',
        },
        {
            id: 'rec-002',
            originType: 'invoice',
            originReferenceId: 'INV-2024-0142',
            creditorEntityId: 'company-001',
            debtorId: 'deb-002',
            currency: 'EUR',
            originalAmount: 18500,
            outstandingAmount: 8500,
            paidAmount: 10000,
            disputedAmount: 0,
            writtenOffAmount: 0,
            issueDate: '2024-11-01',
            dueDate: '2024-12-15',
            expectedPaymentDate: '2024-12-20',
            lastActivityDate: '2024-12-10',
            status: 'partially_paid',
            riskLevel: 'medium',
            daysOutstanding: 45,
            agingBucket: '31-60',
            isDisputed: false,
            reference: 'Consulting Services Q4',
            autoRemindersEnabled: true,
            createdAt: '2024-11-01T10:00:00Z',
            updatedAt: '2024-12-10T14:00:00Z',
        },
        {
            id: 'rec-003',
            originType: 'invoice',
            originReferenceId: 'INV-2024-0098',
            creditorEntityId: 'company-001',
            debtorId: 'deb-003',
            currency: 'EUR',
            originalAmount: 15000,
            outstandingAmount: 15000,
            paidAmount: 0,
            disputedAmount: 0,
            writtenOffAmount: 0,
            issueDate: '2024-09-15',
            dueDate: '2024-10-15',
            lastActivityDate: '2024-12-05',
            status: 'overdue',
            riskLevel: 'high',
            daysOutstanding: 92,
            agingBucket: '90+',
            isDisputed: false,
            reference: 'Software License Annual',
            collectionStage: 'reminder_2',
            collectionStartedAt: '2024-11-15',
            autoRemindersEnabled: true,
            nextReminderDate: '2024-12-20',
            createdAt: '2024-09-15T10:00:00Z',
            updatedAt: '2024-12-05T10:00:00Z',
        },
        {
            id: 'rec-004',
            originType: 'contract',
            originReferenceId: 'CONTRACT-2024-015',
            creditorEntityId: 'company-001',
            debtorId: 'deb-004',
            currency: 'EUR',
            originalAmount: 12000,
            outstandingAmount: 12000,
            paidAmount: 0,
            disputedAmount: 5000,
            writtenOffAmount: 0,
            issueDate: '2024-11-15',
            dueDate: '2025-01-15',
            lastActivityDate: '2024-12-08',
            status: 'disputed',
            riskLevel: 'medium',
            daysOutstanding: 31,
            agingBucket: '31-60',
            isDisputed: true,
            disputeReason: 'Scope disagreement on deliverables',
            disputeOpenedAt: '2024-12-08',
            reference: 'Milestone Payment - Sprint 3',
            autoRemindersEnabled: false,
            createdAt: '2024-11-15T10:00:00Z',
            updatedAt: '2024-12-08T15:00:00Z',
        },
        {
            id: 'rec-005',
            originType: 'invoice',
            originReferenceId: 'INV-2024-0165',
            creditorEntityId: 'company-001',
            debtorId: 'deb-001',
            currency: 'EUR',
            originalAmount: 8500,
            outstandingAmount: 0,
            paidAmount: 8500,
            disputedAmount: 0,
            writtenOffAmount: 0,
            issueDate: '2024-11-20',
            dueDate: '2024-12-20',
            lastActivityDate: '2024-12-12',
            status: 'paid',
            riskLevel: 'low',
            daysOutstanding: 0,
            agingBucket: '0-30',
            isDisputed: false,
            reference: 'Hardware Delivery',
            autoRemindersEnabled: false,
            createdAt: '2024-11-20T10:00:00Z',
            updatedAt: '2024-12-12T09:00:00Z',
        },
    ];
};

const generateDemoEvents = (): ReceivableEvent[] => [
    {
        id: 'evt-001',
        receivableId: 'rec-001',
        type: 'receivable_created',
        timestamp: '2024-12-01T10:00:00Z',
        actor: 'system',
        reference: 'INV-2024-0156',
        referenceType: 'document',
        amountImpact: 25000,
        newStatus: 'open',
    },
    {
        id: 'evt-002',
        receivableId: 'rec-002',
        type: 'receivable_created',
        timestamp: '2024-11-01T10:00:00Z',
        actor: 'system',
        reference: 'INV-2024-0142',
        referenceType: 'document',
        amountImpact: 18500,
        newStatus: 'open',
    },
    {
        id: 'evt-003',
        receivableId: 'rec-002',
        type: 'partial_payment_applied',
        timestamp: '2024-12-10T14:00:00Z',
        actor: 'system',
        reference: 'TXN-2024-1234',
        referenceType: 'transaction',
        amountImpact: -10000,
        previousStatus: 'due',
        newStatus: 'partially_paid',
    },
    {
        id: 'evt-004',
        receivableId: 'rec-003',
        type: 'reminder_sent',
        timestamp: '2024-11-20T09:00:00Z',
        actor: 'automation',
        notes: 'First payment reminder sent',
    },
    {
        id: 'evt-005',
        receivableId: 'rec-004',
        type: 'dispute_opened',
        timestamp: '2024-12-08T15:00:00Z',
        actor: 'user',
        notes: 'Scope disagreement on deliverables',
        previousStatus: 'open',
        newStatus: 'disputed',
    },
];

const generateDemoPayments = (): PaymentApplication[] => [
    {
        id: 'pay-001',
        receivableId: 'rec-002',
        transactionId: 'TXN-2024-1234',
        amount: 10000,
        currency: 'EUR',
        appliedAt: '2024-12-10T14:00:00Z',
        type: 'payment',
        reference: 'Bank Transfer',
    },
    {
        id: 'pay-002',
        receivableId: 'rec-005',
        transactionId: 'TXN-2024-1289',
        amount: 8500,
        currency: 'EUR',
        appliedAt: '2024-12-12T09:00:00Z',
        type: 'payment',
        reference: 'Bank Transfer',
    },
];

// Helper: Calculate aging bucket
const calculateAgingBucket = (daysOutstanding: number): AgingBucket => {
    if (daysOutstanding <= 30) return '0-30';
    if (daysOutstanding <= 60) return '31-60';
    if (daysOutstanding <= 90) return '61-90';
    return '90+';
};

// Helper: Calculate days outstanding
const calculateDaysOutstanding = (issueDate: string, status: ReceivableStatus): number => {
    if (status === 'paid' || status === 'written_off' || status === 'settled_via_offset') return 0;
    const issue = new Date(issueDate);
    const now = new Date();
    return Math.floor((now.getTime() - issue.getTime()) / (1000 * 60 * 60 * 24));
};

export const useReceivablesStore = create<ReceivablesState>()(
    persist(
        (set, get) => ({
            receivables: generateDemoReceivables(),
            events: generateDemoEvents(),
            payments: generateDemoPayments(),
            collectionActions: [],
            debtors: generateDemoDebtors(),
            filter: initialFilter,

            createReceivable: (data) => {
                const now = new Date().toISOString();
                const daysOutstanding = calculateDaysOutstanding(data.issueDate, 'open');

                const newReceivable: Receivable = {
                    ...data,
                    id: `rec-${Date.now()}`,
                    outstandingAmount: data.originalAmount,
                    paidAmount: 0,
                    disputedAmount: 0,
                    writtenOffAmount: 0,
                    status: 'open',
                    riskLevel: 'low',
                    daysOutstanding,
                    agingBucket: calculateAgingBucket(daysOutstanding),
                    lastActivityDate: now,
                    isDisputed: false,
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => ({ receivables: [...state.receivables, newReceivable] }));

                // Record creation event
                get().recordEvent({
                    receivableId: newReceivable.id,
                    type: 'receivable_created',
                    actor: 'user',
                    reference: data.originReferenceId,
                    referenceType: 'document',
                    amountImpact: data.originalAmount,
                    newStatus: 'open',
                });

                return newReceivable;
            },

            updateReceivable: (id, updates) => {
                set((state) => ({
                    receivables: state.receivables.map((r) =>
                        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
                    ),
                }));
            },

            recordEvent: (eventData) => {
                const newEvent: ReceivableEvent = {
                    ...eventData,
                    id: `evt-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                };
                set((state) => ({ events: [...state.events, newEvent] }));
                return newEvent;
            },

            getEventsByReceivable: (receivableId) => {
                return get().events
                    .filter((e) => e.receivableId === receivableId)
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            },

            transitionStatus: (id, newStatus, actor, notes) => {
                const receivable = get().receivables.find((r) => r.id === id);
                if (!receivable) return false;

                // Check valid transition
                const validTransitions: Record<ReceivableStatus, ReceivableStatus[]> = {
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

                if (!validTransitions[receivable.status].includes(newStatus)) {
                    console.warn(`Invalid transition from ${receivable.status} to ${newStatus}`);
                    return false;
                }

                const previousStatus = receivable.status;
                get().updateReceivable(id, { status: newStatus, lastActivityDate: new Date().toISOString() });

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

            applyPayment: (receivableId, amount, type, reference) => {
                const receivable = get().receivables.find((r) => r.id === receivableId);
                if (!receivable) return false;
                if (amount <= 0 || amount > receivable.outstandingAmount) return false;

                const newPaidAmount = receivable.paidAmount + amount;
                const newOutstandingAmount = receivable.outstandingAmount - amount;
                const isPaid = newOutstandingAmount === 0;
                const newStatus: ReceivableStatus = isPaid ? 'paid' : 'partially_paid';

                // Create payment record
                const payment: PaymentApplication = {
                    id: `pay-${Date.now()}`,
                    receivableId,
                    amount,
                    currency: receivable.currency,
                    appliedAt: new Date().toISOString(),
                    type,
                    reference,
                };
                set((state) => ({ payments: [...state.payments, payment] }));

                // Update receivable
                get().updateReceivable(receivableId, {
                    paidAmount: newPaidAmount,
                    outstandingAmount: newOutstandingAmount,
                    status: newStatus,
                    lastActivityDate: new Date().toISOString(),
                });

                // Record event
                get().recordEvent({
                    receivableId,
                    type: isPaid ? 'payment_applied' : 'partial_payment_applied',
                    actor: 'user',
                    reference: payment.id,
                    referenceType: 'transaction',
                    amountImpact: -amount,
                    previousStatus: receivable.status,
                    newStatus,
                });

                // Recalculate risk
                const risk = get().calculateRisk(receivableId);
                get().updateReceivable(receivableId, { riskLevel: risk });

                return true;
            },

            openDispute: (receivableId, reason, disputedAmount) => {
                const receivable = get().receivables.find((r) => r.id === receivableId);
                if (!receivable) return;

                const amount = disputedAmount || receivable.outstandingAmount;
                const previousStatus = receivable.status;

                get().updateReceivable(receivableId, {
                    status: 'disputed',
                    isDisputed: true,
                    disputeReason: reason,
                    disputeOpenedAt: new Date().toISOString(),
                    disputedAmount: amount,
                    autoRemindersEnabled: false, // Freeze reminders
                    lastActivityDate: new Date().toISOString(),
                });

                get().recordEvent({
                    receivableId,
                    type: 'dispute_opened',
                    actor: 'user',
                    notes: reason,
                    previousStatus,
                    newStatus: 'disputed',
                });
            },

            resolveDispute: (receivableId, resolution, notes) => {
                const receivable = get().receivables.find((r) => r.id === receivableId);
                if (!receivable || !receivable.isDisputed) return;

                const now = new Date();
                const dueDate = new Date(receivable.dueDate);
                let newStatus: ReceivableStatus = 'open';

                if (receivable.paidAmount > 0) {
                    newStatus = 'partially_paid';
                } else if (now > dueDate) {
                    newStatus = 'overdue';
                }

                get().updateReceivable(receivableId, {
                    status: newStatus,
                    isDisputed: false,
                    disputedAmount: 0,
                    autoRemindersEnabled: true,
                    lastActivityDate: new Date().toISOString(),
                });

                get().recordEvent({
                    receivableId,
                    type: 'dispute_resolved',
                    actor: 'user',
                    notes: `Resolution: ${resolution}. ${notes || ''}`,
                    previousStatus: 'disputed',
                    newStatus,
                });
            },

            scheduleCollectionAction: (actionData) => {
                const newAction: CollectionAction = {
                    ...actionData,
                    id: `col-${Date.now()}`,
                };
                set((state) => ({ collectionActions: [...state.collectionActions, newAction] }));
                return newAction;
            },

            completeCollectionAction: (actionId, result) => {
                set((state) => ({
                    collectionActions: state.collectionActions.map((a) =>
                        a.id === actionId ? { ...a, status: 'completed' as const, completedDate: new Date().toISOString(), result } : a
                    ),
                }));
            },

            startCollection: (receivableId) => {
                const receivable = get().receivables.find((r) => r.id === receivableId);
                if (!receivable) return;

                get().updateReceivable(receivableId, {
                    status: 'in_collection',
                    collectionStage: 'reminder_1',
                    collectionStartedAt: new Date().toISOString(),
                    lastActivityDate: new Date().toISOString(),
                });

                get().recordEvent({
                    receivableId,
                    type: 'collection_action_started',
                    actor: 'user',
                    previousStatus: receivable.status,
                    newStatus: 'in_collection',
                });
            },

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
                set((state) => ({ payments: [...state.payments, payment] }));

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

            recalculateReceivable: (id) => {
                const receivable = get().receivables.find((r) => r.id === id);
                if (!receivable) return;

                const payments = get().payments.filter((p) => p.receivableId === id);
                const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
                const outstanding = receivable.originalAmount - totalPaid - receivable.writtenOffAmount;
                const daysOutstanding = calculateDaysOutstanding(receivable.issueDate, receivable.status);

                get().updateReceivable(id, {
                    paidAmount: totalPaid,
                    outstandingAmount: Math.max(0, outstanding),
                    daysOutstanding,
                    agingBucket: calculateAgingBucket(daysOutstanding),
                });
            },

            updateAging: () => {
                const { receivables } = get();
                const now = new Date();

                receivables.forEach((r) => {
                    if (['paid', 'written_off', 'settled_via_offset'].includes(r.status)) return;

                    const daysOutstanding = calculateDaysOutstanding(r.issueDate, r.status);
                    const agingBucket = calculateAgingBucket(daysOutstanding);
                    const dueDate = new Date(r.dueDate);

                    let newStatus = r.status;
                    if (r.status === 'open' && now >= dueDate) {
                        newStatus = 'due';
                    }
                    if ((r.status === 'open' || r.status === 'due') && now > dueDate) {
                        newStatus = 'overdue';
                    }

                    if (daysOutstanding !== r.daysOutstanding || agingBucket !== r.agingBucket || newStatus !== r.status) {
                        get().updateReceivable(r.id, { daysOutstanding, agingBucket, status: newStatus });
                    }
                });
            },

            calculateRisk: (receivableId) => {
                const receivable = get().receivables.find((r) => r.id === receivableId);
                if (!receivable) return 'low';

                const debtor = get().debtors.find((d) => d.id === receivable.debtorId);

                let riskScore = 0;

                // Days overdue
                const dueDate = new Date(receivable.dueDate);
                const now = new Date();
                const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
                if (daysOverdue > 90) riskScore += 40;
                else if (daysOverdue > 60) riskScore += 30;
                else if (daysOverdue > 30) riskScore += 20;
                else if (daysOverdue > 0) riskScore += 10;

                // Amount
                if (receivable.outstandingAmount > 50000) riskScore += 15;
                else if (receivable.outstandingAmount > 20000) riskScore += 10;

                // Debtor history
                if (debtor) {
                    if (debtor.paymentHistory === 'poor') riskScore += 25;
                    else if (debtor.paymentHistory === 'fair') riskScore += 15;
                    if (debtor.averagePaymentDelayDays > 30) riskScore += 10;
                }

                // Disputed
                if (receivable.isDisputed) riskScore += 15;

                // In collection
                if (receivable.status === 'in_collection') riskScore += 10;

                if (riskScore >= 60) return 'critical';
                if (riskScore >= 40) return 'high';
                if (riskScore >= 20) return 'medium';
                return 'low';
            },

            setFilter: (filter) => set({ filter }),
            resetFilter: () => set({ filter: initialFilter }),

            getFilteredReceivables: () => {
                const { receivables, filter, debtors } = get();

                return receivables.filter((r) => {
                    if (filter.status?.length && !filter.status.includes(r.status)) return false;
                    if (filter.riskLevel?.length && !filter.riskLevel.includes(r.riskLevel)) return false;
                    if (filter.agingBucket?.length && !filter.agingBucket.includes(r.agingBucket)) return false;
                    if (filter.debtorId && r.debtorId !== filter.debtorId) return false;
                    if (filter.currency && r.currency !== filter.currency) return false;
                    if (filter.minAmount && r.outstandingAmount < filter.minAmount) return false;
                    if (filter.maxAmount && r.outstandingAmount > filter.maxAmount) return false;

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
                }).map((r) => ({
                    ...r,
                    debtor: debtors.find((d) => d.id === r.debtorId),
                }));
            },

            getByStatus: (status) => get().receivables.filter((r) => r.status === status),
            getByDebtor: (debtorId) => get().receivables.filter((r) => r.debtorId === debtorId),
            getOverdue: () => get().receivables.filter((r) => r.status === 'overdue' || r.status === 'in_collection'),

            getSummary: () => {
                const { receivables, debtors } = get();
                const active = receivables.filter((r) => !['paid', 'written_off', 'settled_via_offset'].includes(r.status));

                const byStatus: Record<ReceivableStatus, { count: number; amount: number }> = {
                    open: { count: 0, amount: 0 },
                    due: { count: 0, amount: 0 },
                    overdue: { count: 0, amount: 0 },
                    partially_paid: { count: 0, amount: 0 },
                    paid: { count: 0, amount: 0 },
                    disputed: { count: 0, amount: 0 },
                    in_collection: { count: 0, amount: 0 },
                    written_off: { count: 0, amount: 0 },
                    settled_via_offset: { count: 0, amount: 0 },
                };

                const aging: Record<AgingBucket, { count: number; amount: number }> = {
                    '0-30': { count: 0, amount: 0 },
                    '31-60': { count: 0, amount: 0 },
                    '61-90': { count: 0, amount: 0 },
                    '90+': { count: 0, amount: 0 },
                };

                const byRisk: Record<RiskLevel, { count: number; amount: number }> = {
                    low: { count: 0, amount: 0 },
                    medium: { count: 0, amount: 0 },
                    high: { count: 0, amount: 0 },
                    critical: { count: 0, amount: 0 },
                };

                const byCurrency: Record<string, number> = {};
                let totalOutstanding = 0;
                let totalOverdue = 0;
                let totalDisputed = 0;

                receivables.forEach((r) => {
                    byStatus[r.status].count++;
                    byStatus[r.status].amount += r.outstandingAmount;

                    if (!['paid', 'written_off', 'settled_via_offset'].includes(r.status)) {
                        aging[r.agingBucket].count++;
                        aging[r.agingBucket].amount += r.outstandingAmount;
                        byRisk[r.riskLevel].count++;
                        byRisk[r.riskLevel].amount += r.outstandingAmount;
                        byCurrency[r.currency] = (byCurrency[r.currency] || 0) + r.outstandingAmount;
                        totalOutstanding += r.outstandingAmount;
                    }

                    if (r.status === 'overdue' || r.status === 'in_collection') {
                        totalOverdue += r.outstandingAmount;
                    }

                    if (r.isDisputed) {
                        totalDisputed += r.disputedAmount;
                    }
                });

                // DSO calculation (simplified)
                const totalOriginal = receivables.reduce((sum, r) => sum + r.originalAmount, 0);
                const avgDaysOutstanding = active.length > 0
                    ? active.reduce((sum, r) => sum + r.daysOutstanding, 0) / active.length
                    : 0;

                // Collection rate
                const paidOnTime = receivables.filter((r) => r.status === 'paid' && r.daysOutstanding <= 30).length;
                const totalPaid = receivables.filter((r) => r.status === 'paid').length;
                const collectionRate = totalPaid > 0 ? (paidOnTime / totalPaid) * 100 : 100;

                // Forecast (simplified)
                const expectedIn7Days = active
                    .filter((r) => {
                        const due = new Date(r.dueDate);
                        const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                        return due <= in7Days;
                    })
                    .reduce((sum, r) => sum + r.outstandingAmount * 0.7, 0); // 70% probability

                const expectedIn30Days = active
                    .filter((r) => {
                        const due = new Date(r.dueDate);
                        const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                        return due <= in30Days;
                    })
                    .reduce((sum, r) => sum + r.outstandingAmount * 0.6, 0);

                return {
                    totalReceivables: receivables.length,
                    totalOutstanding,
                    totalOverdue,
                    totalDisputed,
                    byStatus,
                    aging,
                    byRisk,
                    byCurrency,
                    dso: Math.round(avgDaysOutstanding),
                    collectionRate: Math.round(collectionRate),
                    overdueRate: totalOutstanding > 0 ? Math.round((totalOverdue / totalOutstanding) * 100) : 0,
                    expectedCashIn7Days: Math.round(expectedIn7Days),
                    expectedCashIn30Days: Math.round(expectedIn30Days),
                };
            },

            getAgingReport: () => {
                const receivables = get().getFilteredReceivables();
                const report: Record<AgingBucket, Receivable[]> = {
                    '0-30': [],
                    '31-60': [],
                    '61-90': [],
                    '90+': [],
                };

                receivables
                    .filter((r) => !['paid', 'written_off', 'settled_via_offset'].includes(r.status))
                    .forEach((r) => {
                        report[r.agingBucket].push(r);
                    });

                return report;
            },

            getCashForecast: (days) => {
                const receivables = get().receivables.filter((r) =>
                    !['paid', 'written_off', 'settled_via_offset'].includes(r.status)
                );
                const forecast: { date: string; expected: number }[] = [];

                for (let i = 0; i <= days; i += 7) {
                    const targetDate = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
                    const dateStr = targetDate.toISOString().split('T')[0];

                    const expected = receivables
                        .filter((r) => new Date(r.expectedPaymentDate || r.dueDate) <= targetDate)
                        .reduce((sum, r) => sum + r.outstandingAmount * 0.65, 0);

                    forecast.push({ date: dateStr, expected: Math.round(expected) });
                }

                return forecast;
            },

            getDebtorExposure: () => {
                const { receivables, debtors } = get();

                return debtors.map((debtor) => {
                    const debtorReceivables = receivables.filter((r) => r.debtorId === debtor.id);
                    const totalOutstanding = debtorReceivables
                        .filter((r) => !['paid', 'written_off', 'settled_via_offset'].includes(r.status))
                        .reduce((sum, r) => sum + r.outstandingAmount, 0);
                    const overdueAmount = debtorReceivables
                        .filter((r) => r.status === 'overdue' || r.status === 'in_collection')
                        .reduce((sum, r) => sum + r.outstandingAmount, 0);

                    return { debtor, totalOutstanding, overdueAmount };
                }).filter((e) => e.totalOutstanding > 0);
            },

            processAutomations: () => {
                const { receivables } = get();
                const now = new Date();

                receivables.forEach((r) => {
                    if (!r.autoRemindersEnabled) return;
                    if (['paid', 'written_off', 'settled_via_offset', 'disputed'].includes(r.status)) return;

                    // Auto-update status based on time
                    get().updateAging();

                    // Check for reminders
                    if (r.nextReminderDate && new Date(r.nextReminderDate) <= now) {
                        get().sendReminder(r.id);
                    }
                });
            },

            sendReminder: (receivableId) => {
                const receivable = get().receivables.find((r) => r.id === receivableId);
                if (!receivable) return;

                // Schedule next reminder in 7 days
                const nextReminder = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

                get().updateReceivable(receivableId, {
                    nextReminderDate: nextReminder,
                    lastActivityDate: new Date().toISOString(),
                });

                get().recordEvent({
                    receivableId,
                    type: 'reminder_sent',
                    actor: 'automation',
                    notes: 'Automated payment reminder sent',
                });
            },
        }),
        { name: 'primebalance-receivables' }
    )
);