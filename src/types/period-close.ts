// =============================================================================
// PERIOD CLOSE TYPES
// =============================================================================

export type PeriodType = 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type PeriodStatus = 'open' | 'closing' | 'closed' | 'locked' | 'reopened';
export type ChecklistItemStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'blocked';
export type AdjustmentType = 'accrual' | 'deferral' | 'reclassification' | 'correction' | 'reversal' | 'provision';
export type AdjustmentStatus = 'draft' | 'pending_approval' | 'approved' | 'posted' | 'rejected';

// =============================================================================
// ACCOUNTING PERIOD
// =============================================================================

export interface AccountingPeriod {
    id: string;
    name: string;
    code: string; // e.g., "2024-01", "2024-Q1", "2024"

    // Type & Dates
    type: PeriodType;
    startDate: string;
    endDate: string;
    fiscalYear: number;
    fiscalQuarter?: number;
    fiscalMonth?: number;

    // Status
    status: PeriodStatus;
    closedAt?: string;
    closedBy?: string;
    reopenedAt?: string;
    reopenedBy?: string;
    reopenReason?: string;

    // Checklist Progress
    checklistTotal: number;
    checklistCompleted: number;
    checklistProgress: number; // percentage

    // Flags
    hasUnreconciledItems: boolean;
    hasPendingTransactions: boolean;
    hasMissingDocuments: boolean;
    hasUnapprovedAdjustments: boolean;

    // Financials (snapshot at close)
    totalRevenue?: number;
    totalExpenses?: number;
    netIncome?: number;
    totalAssets?: number;
    totalLiabilities?: number;

    // Meta
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// CLOSE CHECKLIST
// =============================================================================

export interface CloseChecklistItem {
    id: string;
    periodId: string;

    // Item Details
    name: string;
    description?: string;
    category: 'reconciliation' | 'review' | 'adjustment' | 'approval' | 'documentation' | 'system';
    order: number;

    // Status
    status: ChecklistItemStatus;
    completedAt?: string;
    completedBy?: string;

    // Requirements
    isRequired: boolean;
    isCritical: boolean; // blocks close if not complete
    dependsOn?: string[]; // other checklist item IDs

    // Automation
    isAutomated: boolean;
    automationRule?: string;
    lastAutoCheck?: string;
    autoCheckResult?: 'pass' | 'fail' | 'warning';

    // Evidence
    attachments?: string[];
    notes?: string;

    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// MISSING ITEMS
// =============================================================================

export interface MissingItem {
    id: string;
    periodId: string;

    // Item Type
    type: 'document' | 'reconciliation' | 'approval' | 'transaction' | 'entry';
    severity: 'low' | 'medium' | 'high' | 'critical';

    // Details
    title: string;
    description: string;
    reference?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;

    // Assignment
    assignedTo?: string;
    assignedToName?: string;
    dueDate?: string;

    // Resolution
    status: 'open' | 'in_progress' | 'resolved' | 'waived';
    resolvedAt?: string;
    resolvedBy?: string;
    resolution?: string;
    waivedReason?: string;

    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// PERIOD ADJUSTMENTS
// =============================================================================

export interface PeriodAdjustment {
    id: string;
    adjustmentNumber: string;
    periodId: string;

    // Type
    type: AdjustmentType;
    status: AdjustmentStatus;

    // Details
    description: string;
    reason: string;

    // Amounts
    debitAccountId?: string;
    debitAccountName?: string;
    creditAccountId?: string;
    creditAccountName?: string;
    amount: number;
    currency: string;

    // Effective Date
    effectiveDate: string;

    // Reversal (for accruals)
    isReversing: boolean;
    reversalDate?: string;
    reversalPeriodId?: string;
    originalAdjustmentId?: string;

    // Approval
    requestedBy?: string;
    requestedByName?: string;
    approvedBy?: string;
    approvedByName?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectionReason?: string;

    // Posting
    postedAt?: string;
    journalEntryId?: string;

    // Documentation
    supportingDocuments?: string[];
    notes?: string;

    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// AUDIT TRAIL
// =============================================================================

export interface PeriodAuditEntry {
    id: string;
    periodId: string;

    // Action
    action: 'created' | 'opened' | 'checklist_updated' | 'adjustment_posted' | 'closing_started' | 'closed' | 'reopened' | 'locked';
    description: string;

    // User
    userId: string;
    userName?: string;

    // Details
    previousStatus?: PeriodStatus;
    newStatus?: PeriodStatus;
    metadata?: Record<string, any>;

    // IP/Session
    ipAddress?: string;
    userAgent?: string;

    createdAt: string;
}

// =============================================================================
// ANALYTICS
// =============================================================================

export interface PeriodCloseSummary {
    currentPeriod: AccountingPeriod | null;
    openPeriods: number;
    closedPeriods: number;
    lockedPeriods: number;

    // Current Period Progress
    checklistProgress: number;
    pendingItems: number;
    criticalBlockers: number;

    // Adjustments
    pendingAdjustments: number;
    totalAdjustmentAmount: number;

    // Missing Items
    openMissingItems: number;
    criticalMissingItems: number;

    // Timeline
    averageCloseTime: number; // days
    lastCloseDate?: string;
    nextCloseDeadline?: string;
}

// =============================================================================
// CHECKLIST TEMPLATES
// =============================================================================

export interface ChecklistTemplate {
    id: string;
    name: string;
    periodType: PeriodType;
    items: Omit<CloseChecklistItem, 'id' | 'periodId' | 'status' | 'completedAt' | 'completedBy' | 'createdAt' | 'updatedAt'>[];
}

export const DEFAULT_CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
    {
        id: 'monthly-standard',
        name: 'Standard Monthly Close',
        periodType: 'monthly',
        items: [
            { name: 'Bank Reconciliation', category: 'reconciliation', order: 1, isRequired: true, isCritical: true, isAutomated: false },
            { name: 'Credit Card Reconciliation', category: 'reconciliation', order: 2, isRequired: true, isCritical: false, isAutomated: false },
            { name: 'Accounts Receivable Aging Review', category: 'review', order: 3, isRequired: true, isCritical: false, isAutomated: true },
            { name: 'Accounts Payable Review', category: 'review', order: 4, isRequired: true, isCritical: false, isAutomated: true },
            { name: 'Inventory Count Verification', category: 'reconciliation', order: 5, isRequired: false, isCritical: false, isAutomated: false },
            { name: 'Prepaid Expenses Amortization', category: 'adjustment', order: 6, isRequired: true, isCritical: false, isAutomated: true },
            { name: 'Depreciation Entry', category: 'adjustment', order: 7, isRequired: true, isCritical: false, isAutomated: true },
            { name: 'Accrued Expenses Review', category: 'adjustment', order: 8, isRequired: true, isCritical: false, isAutomated: false },
            { name: 'Revenue Recognition Review', category: 'review', order: 9, isRequired: true, isCritical: true, isAutomated: false },
            { name: 'Intercompany Reconciliation', category: 'reconciliation', order: 10, isRequired: false, isCritical: false, isAutomated: false },
            { name: 'Trial Balance Review', category: 'review', order: 11, isRequired: true, isCritical: true, isAutomated: true },
            { name: 'Financial Statements Generation', category: 'system', order: 12, isRequired: true, isCritical: true, isAutomated: true },
            { name: 'Management Approval', category: 'approval', order: 13, isRequired: true, isCritical: true, isAutomated: false },
        ],
    },
];

// =============================================================================
// CONSTANTS
// =============================================================================

export const PERIOD_STATUSES: { value: PeriodStatus; label: string; color: string }[] = [
    { value: 'open', label: 'Open', color: 'emerald' },
    { value: 'closing', label: 'Closing', color: 'amber' },
    { value: 'closed', label: 'Closed', color: 'blue' },
    { value: 'locked', label: 'Locked', color: 'gray' },
    { value: 'reopened', label: 'Reopened', color: 'violet' },
];

export const CHECKLIST_CATEGORIES: { value: string; label: string }[] = [
    { value: 'reconciliation', label: 'Reconciliation' },
    { value: 'review', label: 'Review' },
    { value: 'adjustment', label: 'Adjustment' },
    { value: 'approval', label: 'Approval' },
    { value: 'documentation', label: 'Documentation' },
    { value: 'system', label: 'System' },
];

export const ADJUSTMENT_TYPES: { value: AdjustmentType; label: string; description: string }[] = [
    { value: 'accrual', label: 'Accrual', description: 'Record expenses/revenue earned but not yet recorded' },
    { value: 'deferral', label: 'Deferral', description: 'Defer recognition to future period' },
    { value: 'reclassification', label: 'Reclassification', description: 'Move amounts between accounts' },
    { value: 'correction', label: 'Correction', description: 'Fix errors from prior entries' },
    { value: 'reversal', label: 'Reversal', description: 'Reverse a prior period entry' },
    { value: 'provision', label: 'Provision', description: 'Record estimated liabilities' },
];