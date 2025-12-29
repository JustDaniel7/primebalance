// =============================================================================
// CUSTOMER TYPES
// =============================================================================

// =============================================================================
// ENUMS
// =============================================================================

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PROSPECT = 'prospect',
  CHURNED = 'churned',
  SUSPENDED = 'suspended',
}

export enum CustomerAccountType {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
  GOVERNMENT = 'government',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum PaymentBehavior {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  DELINQUENT = 'delinquent',
}

export enum CreditStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
  // Legacy values for backward compatibility
  GOOD = 'good',
  WARNING = 'warning',
  HOLD = 'hold',
  BLOCKED = 'blocked',
}

export enum PaymentRecordStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  OVERDUE = 'overdue',
  WRITTEN_OFF = 'written_off',
}

export enum CreditEventType {
  LIMIT_INCREASE = 'limit_increase',
  LIMIT_DECREASE = 'limit_decrease',
  STATUS_CHANGE = 'status_change',
  REVIEW = 'review',
  TERMS_CHANGE = 'terms_change',
}

export enum RevenuePeriodType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum RiskIndicatorCategory {
  PAYMENT = 'payment',
  CREDIT = 'credit',
  ACTIVITY = 'activity',
  FINANCIAL = 'financial',
  EXTERNAL = 'external',
}

export enum RiskIndicatorStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  MONITORING = 'monitoring',
}

export enum ContactRole {
  BILLING = 'billing',
  TECHNICAL = 'technical',
  EXECUTIVE = 'executive',
  PURCHASING = 'purchasing',
  GENERAL = 'general',
}

export enum InvoiceDelivery {
  EMAIL = 'email',
  MAIL = 'mail',
  PORTAL = 'portal',
}

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
    creditStatus: CreditStatus;
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
    invoiceDelivery: InvoiceDelivery;

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
    status: PaymentRecordStatus;
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
    type: CreditEventType;

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
    periodType: RevenuePeriodType;

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
    category: RiskIndicatorCategory;
    indicator: string;
    description: string;

    // Severity
    severity: RiskLevel;
    score: number; // contribution to overall risk score

    // Status
    status: RiskIndicatorStatus;
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
    role: ContactRole;

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
    { value: CustomerStatus.ACTIVE, label: 'Active', color: 'emerald' },
    { value: CustomerStatus.INACTIVE, label: 'Inactive', color: 'gray' },
    { value: CustomerStatus.PROSPECT, label: 'Prospect', color: 'blue' },
    { value: CustomerStatus.CHURNED, label: 'Churned', color: 'red' },
    { value: CustomerStatus.SUSPENDED, label: 'Suspended', color: 'amber' },
];

export const CUSTOMER_TYPES: { value: CustomerAccountType; label: string }[] = [
    { value: CustomerAccountType.INDIVIDUAL, label: 'Individual' },
    { value: CustomerAccountType.BUSINESS, label: 'Business' },
    { value: CustomerAccountType.ENTERPRISE, label: 'Enterprise' },
    { value: CustomerAccountType.GOVERNMENT, label: 'Government' },
];

export const RISK_LEVELS: { value: RiskLevel; label: string; color: string }[] = [
    { value: RiskLevel.LOW, label: 'Low', color: 'emerald' },
    { value: RiskLevel.MEDIUM, label: 'Medium', color: 'amber' },
    { value: RiskLevel.HIGH, label: 'High', color: 'orange' },
    { value: RiskLevel.CRITICAL, label: 'Critical', color: 'red' },
];

export const PAYMENT_BEHAVIORS: { value: PaymentBehavior; label: string; color: string }[] = [
    { value: PaymentBehavior.EXCELLENT, label: 'Excellent', color: 'emerald' },
    { value: PaymentBehavior.GOOD, label: 'Good', color: 'blue' },
    { value: PaymentBehavior.FAIR, label: 'Fair', color: 'amber' },
    { value: PaymentBehavior.POOR, label: 'Poor', color: 'orange' },
    { value: PaymentBehavior.DELINQUENT, label: 'Delinquent', color: 'red' },
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