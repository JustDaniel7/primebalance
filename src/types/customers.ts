// =============================================================================
// CUSTOMER TYPES
// =============================================================================

export type CustomerStatus = 'active' | 'inactive' | 'prospect' | 'churned' | 'suspended';
export type CustomerAccountType = 'individual' | 'business' | 'enterprise' | 'government';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type PaymentBehavior = 'excellent' | 'good' | 'fair' | 'poor' | 'delinquent';
export type CreditStatus = 'approved' | 'pending' | 'under_review' | 'rejected' | 'suspended';

// =============================================================================
// CUSTOMER PROFILE
// =============================================================================

export interface Customer {
    id: string;
    customerNumber: string;

    // Basic Info
    name: string;
    legalName?: string;
    type: CustomerAccountType;
    status: CustomerStatus;

    // Contact
    email?: string;
    phone?: string;
    website?: string;

    // Address
    address?: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };

    // Business Info
    industry?: string;
    taxId?: string;
    vatNumber?: string;
    registrationNumber?: string;
    classification?: string;
    employeeCount?: number;
    annualRevenue?: number;

    // Account Info
    accountManagerId?: string;
    accountManagerName?: string;
    segment?: string;
    tags?: string[];

    // Dates
    customerSince: string;
    lastActivityDate?: string;
    lastPurchaseDate?: string;
    lastOrderDate?: string;
    lastPaymentDate?: string;
    lastContactDate?: string;

    // Financial Summary
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    outstandingBalance: number;
    overdueAmount: number;
    currency: string;

    // Credit
    creditLimit: number;
    creditUsed: number;
    creditAvailable: number;
    creditStatus: CreditStatus | 'good' | 'warning' | 'hold' | 'blocked';
    paymentTerms: string;

    // Risk & Behavior
    riskLevel: RiskLevel;
    riskScore: number;
    paymentBehavior: PaymentBehavior;
    averageDaysToPayment?: number;
    onTimePaymentRate?: number;
    latePaymentCount?: number;

    // Preferences
    preferredPaymentMethod?: string;
    preferredLanguage: string;
    invoiceDelivery: 'email' | 'mail' | 'portal';

    // Notes
    notes?: string;

    createdAt: string;
    updatedAt: string;
}


// =============================================================================
// PAYMENT HISTORY
// =============================================================================

export interface PaymentRecord {
    id: string;
    customerId: string;

    // Payment Info
    invoiceId?: string;
    invoiceNumber?: string;
    amount: number;
    currency: string;

    // Dates
    invoiceDate: string;
    dueDate: string;
    paymentDate?: string;

    // Status
    status: 'pending' | 'paid' | 'partial' | 'overdue' | 'written_off';
    daysToPayment?: number;
    daysOverdue?: number;

    // Payment Details
    paymentMethod?: string;
    referenceNumber?: string;

    createdAt: string;
}

// =============================================================================
// CREDIT HISTORY
// =============================================================================

export interface CreditEvent {
    id: string;
    customerId: string;

    // Event Type
    type: 'limit_increase' | 'limit_decrease' | 'status_change' | 'review' | 'terms_change';

    // Details
    previousValue?: string;
    newValue: string;
    reason: string;

    // User
    changedBy?: string;
    changedByName?: string;

    createdAt: string;
}

// =============================================================================
// REVENUE HISTORY
// =============================================================================

export interface RevenueRecord {
    id: string;
    customerId: string;

    // Period
    period: string; // e.g., "2024-01", "2024-Q1"
    periodType: 'monthly' | 'quarterly' | 'yearly';

    // Amounts
    revenue: number;
    cost?: number;
    profit?: number;
    margin?: number;

    // Breakdown
    productRevenue?: number;
    serviceRevenue?: number;
    otherRevenue?: number;

    // Orders
    orderCount: number;
    averageOrderValue: number;

    createdAt: string;
}

// =============================================================================
// RISK INDICATORS
// =============================================================================

export interface RiskIndicator {
    id: string;
    customerId: string;

    // Indicator
    category: 'payment' | 'credit' | 'activity' | 'financial' | 'external';
    indicator: string;
    description: string;

    // Severity
    severity: RiskLevel;
    score: number; // contribution to overall risk score

    // Status
    status: 'active' | 'resolved' | 'monitoring';
    detectedAt: string;
    resolvedAt?: string;

    // Actions
    recommendedAction?: string;
    actionTaken?: string;

    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// CUSTOMER CONTACT
// =============================================================================

export interface CustomerContact {
    id: string;
    customerId: string;

    // Contact Info
    name: string;
    title?: string;
    email: string;
    phone?: string;

    // Role
    isPrimary: boolean;
    role: 'billing' | 'technical' | 'executive' | 'purchasing' | 'general';

    // Notes
    notes?: string;

    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// ANALYTICS
// =============================================================================

export interface CustomerAnalytics {
    totalCustomers: number;
    activeCustomers: number;
    newCustomersThisMonth: number;
    churnedThisMonth: number;

    totalRevenue: number;
    averageCustomerValue: number;
    totalOutstanding: number;

    riskBreakdown: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };

    paymentBehaviorBreakdown: {
        excellent: number;
        good: number;
        fair: number;
        poor: number;
        delinquent: number;
    };

    topCustomersByRevenue: { id: string; name: string; revenue: number }[];
    atRiskCustomers: { id: string; name: string; riskLevel: RiskLevel; indicators: number }[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const CUSTOMER_STATUSES: { value: CustomerStatus; label: string; color: string }[] = [
    { value: 'active', label: 'Active', color: 'emerald' },
    { value: 'inactive', label: 'Inactive', color: 'gray' },
    { value: 'prospect', label: 'Prospect', color: 'blue' },
    { value: 'churned', label: 'Churned', color: 'red' },
    { value: 'suspended', label: 'Suspended', color: 'amber' },
];

export const CUSTOMER_TYPES: { value: CustomerAccountType; label: string }[] = [
    { value: 'individual', label: 'Individual' },
    { value: 'business', label: 'Business' },
    { value: 'enterprise', label: 'Enterprise' },
    { value: 'government', label: 'Government' },
];

export const RISK_LEVELS: { value: RiskLevel; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'emerald' },
    { value: 'medium', label: 'Medium', color: 'amber' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'critical', label: 'Critical', color: 'red' },
];

export const PAYMENT_BEHAVIORS: { value: PaymentBehavior; label: string; color: string }[] = [
    { value: 'excellent', label: 'Excellent', color: 'emerald' },
    { value: 'good', label: 'Good', color: 'blue' },
    { value: 'fair', label: 'Fair', color: 'amber' },
    { value: 'poor', label: 'Poor', color: 'orange' },
    { value: 'delinquent', label: 'Delinquent', color: 'red' },
];

export const PAYMENT_TERMS = [
    'Due on Receipt',
    'Net 15',
    'Net 30',
    'Net 45',
    'Net 60',
    'Net 90',
    '2/10 Net 30',
];

export const INDUSTRIES = [
    'Technology',
    'Healthcare',
    'Finance',
    'Manufacturing',
    'Retail',
    'Education',
    'Construction',
    'Transportation',
    'Energy',
    'Real Estate',
    'Professional Services',
    'Other',
];