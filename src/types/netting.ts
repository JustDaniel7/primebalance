// =============================================================================
// NETTING & OFFSETS TYPES
// =============================================================================

export type NettingType = 'counterparty' | 'intercompany' | 'multilateral';
export type NettingStatus = 'draft' | 'pending_approval' | 'approved' | 'settled' | 'cancelled' | 'rejected';
export type SettlementMethod = 'wire' | 'ach' | 'internal_transfer' | 'netting_center' | 'other';
export type PartyType = 'customer' | 'supplier' | 'subsidiary' | 'affiliate' | 'joint_venture';

// =============================================================================
// NETTING AGREEMENT
// =============================================================================

export interface NettingAgreement {
    id: string;
    agreementNumber: string;

    // Basic Info
    name: string;
    type: NettingType;
    status: 'active' | 'inactive' | 'expired';

    // Parties
    parties: NettingParty[];

    // Terms
    nettingFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
    settlementDays: number; // days after netting date
    baseCurrency: string;

    // Thresholds
    minimumNettingAmount?: number;
    maximumNettingAmount?: number;

    // Dates
    effectiveDate: string;
    expiryDate?: string;
    lastNettingDate?: string;
    nextNettingDate?: string;

    // Notes
    notes?: string;

    createdAt: string;
    updatedAt: string;
}

export interface NettingParty {
    id: string;
    partyId: string;
    partyName: string;
    partyType: PartyType;

    // Account Info
    accountNumber?: string;
    bankName?: string;

    // Role
    isNettingCenter: boolean;

    createdAt: string;
}

// =============================================================================
// NETTING SESSION
// =============================================================================

export interface NettingSession {
    id: string;
    sessionNumber: string;
    agreementId: string;
    agreementName: string;

    // Type
    type: NettingType;
    status: NettingStatus;

    // Period
    periodStart: string;
    periodEnd: string;
    nettingDate: string;
    settlementDate: string;

    // Currency
    baseCurrency: string;

    // Totals
    totalReceivables: number;
    totalPayables: number;
    grossAmount: number;
    netAmount: number;
    savingsAmount: number;
    savingsPercentage: number;

    // Positions
    positions: NettingPosition[];

    // Settlement
    settlements: SettlementInstruction[];

    // Approval
    createdBy?: string;
    createdByName?: string;
    approvedBy?: string;
    approvedByName?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedReason?: string;

    // Notes
    notes?: string;

    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// NETTING POSITION
// =============================================================================

export interface NettingPosition {
    id: string;
    sessionId: string;

    // Party
    partyId: string;
    partyName: string;
    partyType: PartyType;

    // Amounts
    receivables: number;
    payables: number;
    grossPosition: number; // receivables - payables (positive = net receiver)
    netPosition: number; // after netting

    // Transactions
    receivableCount: number;
    payableCount: number;
    transactions: NettingTransaction[];

    // Settlement
    settlementDirection: 'receive' | 'pay' | 'none';
    settlementAmount: number;

    createdAt: string;
}

// =============================================================================
// NETTING TRANSACTION
// =============================================================================

export interface NettingTransaction {
    id: string;
    positionId: string;

    // Reference
    documentType: 'invoice' | 'credit_note' | 'debit_note' | 'payment' | 'advance';
    documentNumber: string;
    documentDate: string;
    dueDate: string;

    // Counterparty
    counterpartyId: string;
    counterpartyName: string;

    // Amount
    originalCurrency: string;
    originalAmount: number;
    baseCurrencyAmount: number;
    exchangeRate: number;

    // Direction
    direction: 'receivable' | 'payable';

    // Status
    included: boolean;
    excludedReason?: string;

    createdAt: string;
}

// =============================================================================
// SETTLEMENT INSTRUCTION
// =============================================================================

export interface SettlementInstruction {
    id: string;
    sessionId: string;

    // Instruction Number
    instructionNumber: string;

    // Parties
    payerId: string;
    payerName: string;
    receiverId: string;
    receiverName: string;

    // Amount
    amount: number;
    currency: string;

    // Method
    settlementMethod: SettlementMethod;

    // Bank Details
    payerBankAccount?: string;
    receiverBankAccount?: string;

    // Status
    status: 'pending' | 'processing' | 'completed' | 'failed';

    // Dates
    valueDate: string;
    processedAt?: string;

    // Reference
    paymentReference?: string;

    createdAt: string;
}

// =============================================================================
// OFFSET ENTRY
// =============================================================================

export interface OffsetEntry {
    id: string;

    // Reference
    offsetNumber: string;

    // Type
    type: 'ar_ap' | 'intercompany' | 'advance' | 'credit_application';
    status: 'draft' | 'pending' | 'approved' | 'applied' | 'reversed';

    // Parties
    partyId: string;
    partyName: string;
    partyType: PartyType;

    // Offset Details
    sourceDocumentType: string;
    sourceDocumentNumber: string;
    sourceAmount: number;

    targetDocumentType: string;
    targetDocumentNumber: string;
    targetAmount: number;

    offsetAmount: number;
    currency: string;

    // Dates
    offsetDate: string;
    effectiveDate: string;

    // Approval
    approvedBy?: string;
    approvedAt?: string;

    // Notes
    notes?: string;

    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// ANALYTICS
// =============================================================================

export interface NettingAnalytics {
    totalSessions: number;
    settledSessions: number;
    pendingSessions: number;

    totalGrossAmount: number;
    totalNetAmount: number;
    totalSavings: number;
    avgSavingsPercentage: number;

    byType: {
        counterparty: { sessions: number; savings: number };
        intercompany: { sessions: number; savings: number };
        multilateral: { sessions: number; savings: number };
    };

    recentSessions: { id: string; sessionNumber: string; netAmount: number; savings: number; status: NettingStatus }[];
    topCounterparties: { id: string; name: string; netAmount: number; sessions: number }[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const NETTING_TYPES: { value: NettingType; label: string }[] = [
    { value: 'counterparty', label: 'Counterparty Netting' },
    { value: 'intercompany', label: 'Intercompany Netting' },
    { value: 'multilateral', label: 'Multilateral Netting' },
];

export const NETTING_STATUSES: { value: NettingStatus; label: string; color: string }[] = [
    { value: 'draft', label: 'Draft', color: 'gray' },
    { value: 'pending_approval', label: 'Pending Approval', color: 'amber' },
    { value: 'approved', label: 'Approved', color: 'blue' },
    { value: 'settled', label: 'Settled', color: 'emerald' },
    { value: 'cancelled', label: 'Cancelled', color: 'gray' },
    { value: 'rejected', label: 'Rejected', color: 'red' },
];

export const PARTY_TYPES: { value: PartyType; label: string }[] = [
    { value: 'customer', label: 'Customer' },
    { value: 'supplier', label: 'Supplier' },
    { value: 'subsidiary', label: 'Subsidiary' },
    { value: 'affiliate', label: 'Affiliate' },
    { value: 'joint_venture', label: 'Joint Venture' },
];

export const SETTLEMENT_METHODS: { value: SettlementMethod; label: string }[] = [
    { value: 'wire', label: 'Wire Transfer' },
    { value: 'ach', label: 'ACH' },
    { value: 'internal_transfer', label: 'Internal Transfer' },
    { value: 'netting_center', label: 'Netting Center' },
    { value: 'other', label: 'Other' },
];

export const NETTING_FREQUENCIES = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
];