// =============================================================================
// RECEIVABLES & CASH COLLECTION TYPES
// =============================================================================

// State Machine - A receivable MUST be in exactly one state
export type ReceivableStatus =
    | 'open'
    | 'due'
    | 'overdue'
    | 'partially_paid'
    | 'paid'
    | 'disputed'
    | 'in_collection'
    | 'written_off'
    | 'settled_via_offset';

export type ReceivableOrigin = 'invoice' | 'order' | 'contract' | 'manual';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type EventActor = 'system' | 'user' | 'automation';

// Aging buckets
export type AgingBucket = '0-30' | '31-60' | '61-90' | '90+';

// Event types (append-only)
export type ReceivableEventType =
    | 'receivable_created'
    | 'payment_applied'
    | 'partial_payment_applied'
    | 'credit_note_applied'
    | 'offset_applied'
    | 'dispute_opened'
    | 'dispute_resolved'
    | 'due_date_changed'
    | 'collection_action_started'
    | 'collection_action_completed'
    | 'write_off_applied'
    | 'receivable_closed'
    | 'reminder_sent'
    | 'escalation_triggered';

export interface ReceivableEvent {
    id: string;
    receivableId: string;
    type: ReceivableEventType;
    timestamp: string;
    actor: EventActor;
    actorId?: string;
    reference?: string;
    referenceType?: 'transaction' | 'document' | 'note' | 'credit_note';
    amountImpact?: number;
    previousStatus?: ReceivableStatus;
    newStatus?: ReceivableStatus;
    notes?: string;
    metadata?: Record<string, any>;
}

export interface Debtor {
    id: string;
    name: string;
    type: 'customer' | 'partner' | 'intercompany' | 'other';
    email?: string;
    phone?: string;
    country: string;
    vatId?: string;
    creditLimit?: number;
    paymentTermsDays: number;
    // Behavior scoring
    averagePaymentDelayDays: number;
    totalReceivables: number;
    overdueReceivables: number;
    paymentHistory: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface Receivable {
    id: string;

    // Origin
    originType: ReceivableOrigin;
    originReferenceId?: string;

    // Parties
    creditorEntityId: string;
    debtorId: string;
    debtor?: Debtor;

    // Amounts (original is fixed, others are derived)
    currency: string;
    originalAmount: number;
    outstandingAmount: number; // derived
    paidAmount: number; // derived
    disputedAmount: number; // derived
    writtenOffAmount: number; // derived

    // Dates
    issueDate: string;
    dueDate: string;
    expectedPaymentDate?: string; // dynamic prediction
    lastActivityDate: string;

    // State
    status: ReceivableStatus;
    riskLevel: RiskLevel;

    // Aging
    daysOutstanding: number; // derived
    agingBucket: AgingBucket; // derived

    // Dispute
    isDisputed: boolean;
    disputeReason?: string;
    disputeOpenedAt?: string;

    // Collection
    collectionStage?: 'reminder_1' | 'reminder_2' | 'final_notice' | 'external_collection';
    collectionStartedAt?: string;

    // Meta
    reference?: string;
    description?: string;
    notes?: string;
    tags?: string[];

    // Automation
    autoRemindersEnabled: boolean;
    nextReminderDate?: string;

    createdAt: string;
    updatedAt: string;
}

export interface PaymentApplication {
    id: string;
    receivableId: string;
    transactionId?: string;
    amount: number;
    currency: string;
    appliedAt: string;
    type: 'payment' | 'credit_note' | 'offset' | 'write_off';
    reference?: string;
    notes?: string;
}

export interface CollectionAction {
    id: string;
    receivableId: string;
    type: 'reminder' | 'phone_call' | 'email' | 'letter' | 'escalation' | 'external_collection';
    status: 'scheduled' | 'completed' | 'cancelled';
    scheduledDate: string;
    completedDate?: string;
    notes?: string;
    result?: string;
}

export interface ReceivablesSummary {
    totalReceivables: number;
    totalOutstanding: number;
    totalOverdue: number;
    totalDisputed: number;

    // By status
    byStatus: Record<ReceivableStatus, { count: number; amount: number }>;

    // Aging
    aging: Record<AgingBucket, { count: number; amount: number }>;

    // Risk
    byRisk: Record<RiskLevel, { count: number; amount: number }>;

    // Currency
    byCurrency: Record<string, number>;

    // KPIs
    dso: number; // Days Sales Outstanding
    collectionRate: number; // % collected on time
    overdueRate: number; // % overdue

    // Forecast
    expectedCashIn7Days: number;
    expectedCashIn30Days: number;
}

export interface ReceivableFilter {
    status?: ReceivableStatus[];
    riskLevel?: RiskLevel[];
    agingBucket?: AgingBucket[];
    debtorId?: string;
    currency?: string;
    dateRange?: { from: string; to: string };
    minAmount?: number;
    maxAmount?: number;
    search?: string;
}

// Valid state transitions
export const VALID_TRANSITIONS: Record<ReceivableStatus, ReceivableStatus[]> = {
    open: ['due', 'partially_paid', 'paid', 'disputed', 'written_off', 'settled_via_offset'],
    due: ['overdue', 'partially_paid', 'paid', 'disputed', 'written_off', 'settled_via_offset'],
    overdue: ['partially_paid', 'paid', 'disputed', 'in_collection', 'written_off', 'settled_via_offset'],
    partially_paid: ['paid', 'overdue', 'disputed', 'in_collection', 'written_off', 'settled_via_offset'],
    paid: [], // Terminal state
    disputed: ['open', 'due', 'overdue', 'partially_paid', 'paid', 'written_off'],
    in_collection: ['partially_paid', 'paid', 'written_off', 'settled_via_offset'],
    written_off: [], // Terminal state
    settled_via_offset: [], // Terminal state
};