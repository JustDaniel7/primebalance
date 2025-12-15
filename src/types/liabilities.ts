// =============================================================================
// LIABILITIES & OBLIGATIONS TYPES
// =============================================================================

export type LiabilityType =
    | 'loan'
    | 'credit_line'
    | 'overdraft'
    | 'supplier_credit'
    | 'deferred_payment'
    | 'lease'
    | 'guarantee'
    | 'other';

export type LiabilityClassification =
    | 'drawn_debt'
    | 'undrawn_credit'
    | 'contingent'
    | 'short_term'
    | 'long_term';

export type RepaymentSchedule = 'monthly' | 'quarterly' | 'annually' | 'on_demand' | 'at_maturity' | 'custom';
export type InterestType = 'fixed' | 'variable' | 'none' | 'unknown';
export type MaturityType = 'fixed' | 'rolling' | 'on_demand' | 'ongoing';

export interface LiabilityCounterparty {
    name: string;
    type: 'bank' | 'supplier' | 'leasing' | 'government' | 'other';
    country: string;
    contactEmail?: string;
    contactPhone?: string;
    accountNumber?: string;
}

export interface CreditLimit {
    totalLimit: number;
    usedAmount: number;
    availableAmount: number; // auto-calculated
    currency: string;
    expiryDate?: string;
    utilizationPercent: number; // auto-calculated
}

export interface RepaymentTerms {
    schedule: RepaymentSchedule;
    amount?: number;
    nextPaymentDate?: string;
    totalPayments?: number;
    remainingPayments?: number;
}

export interface InterestTerms {
    type: InterestType;
    rate?: number;
    baseRate?: string; // e.g., "EURIBOR", "LIBOR"
    spread?: number;
    calculationBasis?: '360' | '365';
}

export interface Collateral {
    isSecured: boolean;
    type?: 'cash' | 'property' | 'equipment' | 'inventory' | 'receivables' | 'guarantee' | 'other';
    description?: string;
    value?: number;
    currency?: string;
}

export interface Liability {
    id: string;
    type: LiabilityType;
    classifications: LiabilityClassification[];
    status: 'active' | 'paid_off' | 'defaulted' | 'restructured' | 'draft';

    // Basic info
    name: string;
    description?: string;
    reference?: string;

    // Counterparty
    counterparty: LiabilityCounterparty;

    // Amounts
    originalAmount: number;
    currentBalance: number;
    currency: string;

    // Credit limits (for credit lines, overdrafts, supplier credits)
    creditLimit?: CreditLimit;

    // Terms
    interestTerms: InterestTerms;
    repaymentTerms: RepaymentTerms;

    // Timing
    startDate: string;
    maturityType: MaturityType;
    maturityDate?: string;
    reviewDate?: string;

    // Security
    collateral?: Collateral;

    // Covenants & Conditions
    covenants?: string[];
    specialConditions?: string;

    // Risk monitoring
    riskLevel: 'low' | 'medium' | 'high';
    alerts: LiabilityAlert[];

    // Meta
    attachments?: string[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface LiabilityAlert {
    id: string;
    type: 'maturity' | 'payment_due' | 'limit_warning' | 'covenant_breach' | 'review_due';
    severity: 'info' | 'warning' | 'critical';
    message: string;
    dueDate?: string;
    isRead: boolean;
    createdAt: string;
}

export interface LiabilityPayment {
    id: string;
    liabilityId: string;
    date: string;
    amount: number;
    currency: string;
    type: 'principal' | 'interest' | 'fee' | 'combined';
    status: 'scheduled' | 'paid' | 'overdue' | 'cancelled';
    reference?: string;
}

export interface LiabilitySummary {
    totalLiabilities: number;
    shortTermTotal: number;
    longTermTotal: number;
    drawnDebt: number;
    availableCredit: number;
    totalCreditLimit: number;
    utilizationPercent: number;
    byCounterpartyType: Record<string, number>;
    byCurrency: Record<string, number>;
    upcomingPayments30Days: number;
    upcomingMaturities90Days: number;
}

export interface LiabilityWizardState {
    step: number;
    type: LiabilityType | null;
    counterparty: Partial<LiabilityCounterparty>;
    name: string;
    originalAmount: number;
    currentBalance: number;
    currency: string;
    hasCreditLimit: boolean;
    creditLimit: Partial<CreditLimit>;
    interestTerms: Partial<InterestTerms>;
    repaymentTerms: Partial<RepaymentTerms>;
    startDate: string;
    maturityType: MaturityType;
    maturityDate: string;
    hasCollateral: boolean;
    collateral: Partial<Collateral>;
    notes: string;
}

// Thresholds for alerts
export const UTILIZATION_THRESHOLDS = {
    warning: 80,
    critical: 90,
};

export const MATURITY_WARNING_DAYS = 90;
export const PAYMENT_WARNING_DAYS = 14;