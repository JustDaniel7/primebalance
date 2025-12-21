// =============================================================================
// SUPPLIER TYPES
// =============================================================================

export type SupplierStatus = 'active' | 'inactive' | 'pending' | 'blocked' | 'preferred';
export type SupplierCategory = 'goods' | 'services' | 'raw_materials' | 'equipment' | 'utilities' | 'logistics' | 'professional' | 'other';
export type ReliabilityRating = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
export type DependencyLevel = 'low' | 'medium' | 'high' | 'critical';
export type PaymentMethod = 'wire' | 'ach' | 'check' | 'card' | 'cash' | 'other';

// =============================================================================
// SUPPLIER PROFILE
// =============================================================================

export interface Supplier {
    id: string;
    supplierNumber: string;

    // Basic Info
    name: string;
    legalName?: string;
    status: SupplierStatus;
    category: SupplierCategory;

    // Contact
    email: string;
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
    taxId?: string;
    registrationNumber?: string;
    founded?: number;
    employeeCount?: number;

    // Account Info
    accountManagerId?: string;
    accountManagerName?: string;
    tags?: string[];

    // Dates
    supplierSince: string;
    lastOrderDate?: string;
    lastPaymentDate?: string;
    contractExpiryDate?: string;

    // Financial Summary
    totalSpend: number;
    totalOrders: number;
    averageOrderValue: number;
    outstandingBalance: number;

    // Payment Terms
    paymentTerms: string;
    preferredPaymentMethod: PaymentMethod;
    earlyPaymentDiscount?: number; // percentage

    // Reliability
    reliabilityRating: ReliabilityRating;
    reliabilityScore: number; // 0-100
    onTimeDeliveryRate: number; // percentage
    qualityScore: number; // 0-100
    defectRate: number; // percentage
    avgLeadTime: number; // days

    // Dependency
    dependencyLevel: DependencyLevel;
    dependencyScore: number; // 0-100
    spendPercentage: number; // percentage of total procurement
    alternativeSuppliers: number;
    criticalItems: number;

    // Notes
    notes?: string;

    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// SUPPLIER BALANCE
// =============================================================================

export interface SupplierBalance {
    id: string;
    supplierId: string;

    // Amounts
    totalOutstanding: number;
    currentDue: number;
    overdue30: number;
    overdue60: number;
    overdue90Plus: number;

    // Credits
    availableCredits: number;
    pendingCredits: number;

    // Payment Info
    lastPaymentAmount?: number;
    lastPaymentDate?: string;
    nextPaymentDue?: string;
    nextPaymentAmount?: number;

    // YTD
    ytdPayments: number;
    ytdPurchases: number;

    updatedAt: string;
}

// =============================================================================
// PAYMENT RECORD
// =============================================================================

export interface SupplierPayment {
    id: string;
    supplierId: string;

    // Payment Info
    paymentNumber: string;
    invoiceIds: string[];
    amount: number;
    currency: string;

    // Dates
    paymentDate: string;
    dueDate?: string;

    // Method
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
    bankAccount?: string;

    // Status
    status: 'scheduled' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

    // Discounts
    discountTaken?: number;
    discountType?: string;

    // Notes
    notes?: string;

    createdAt: string;
}

// =============================================================================
// RELIABILITY RECORD
// =============================================================================

export interface ReliabilityRecord {
    id: string;
    supplierId: string;

    // Order Info
    orderId: string;
    orderNumber: string;
    orderDate: string;

    // Delivery
    expectedDeliveryDate: string;
    actualDeliveryDate?: string;
    daysVariance: number; // negative = early, positive = late

    // Quality
    itemsOrdered: number;
    itemsReceived: number;
    itemsDefective: number;
    qualityScore: number;

    // Issues
    hasIssues: boolean;
    issueType?: 'late_delivery' | 'partial_delivery' | 'quality_issue' | 'wrong_items' | 'damaged' | 'documentation';
    issueDescription?: string;
    issueResolved: boolean;

    createdAt: string;
}

// =============================================================================
// SPEND RECORD
// =============================================================================

export interface SpendRecord {
    id: string;
    supplierId: string;

    // Period
    period: string;
    periodType: 'monthly' | 'quarterly' | 'yearly';

    // Amounts
    totalSpend: number;
    directSpend: number;
    indirectSpend: number;

    // Breakdown by Category
    goodsSpend?: number;
    servicesSpend?: number;

    // Orders
    orderCount: number;
    averageOrderValue: number;

    // Comparison
    previousPeriodSpend?: number;
    changePercentage?: number;
    budgetAmount?: number;
    budgetVariance?: number;

    createdAt: string;
}

// =============================================================================
// DEPENDENCY RISK
// =============================================================================

export interface DependencyRisk {
    id: string;
    supplierId: string;

    // Risk Type
    riskType: 'single_source' | 'high_spend' | 'critical_component' | 'geographic' | 'financial' | 'operational' | 'compliance';

    // Details
    title: string;
    description: string;
    severity: DependencyLevel;

    // Impact
    impactScore: number; // 1-10
    probabilityScore: number; // 1-10
    overallRiskScore: number; // impact * probability

    // Mitigation
    mitigationPlan?: string;
    mitigationStatus: 'not_started' | 'in_progress' | 'completed' | 'monitoring';

    // Status
    status: 'identified' | 'assessed' | 'mitigating' | 'resolved' | 'accepted';
    identifiedAt: string;
    resolvedAt?: string;

    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// SUPPLIER CONTACT
// =============================================================================

export interface SupplierContact {
    id: string;
    supplierId: string;

    name: string;
    title?: string;
    email: string;
    phone?: string;

    isPrimary: boolean;
    role: 'sales' | 'account' | 'support' | 'billing' | 'executive' | 'general';

    notes?: string;

    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// ANALYTICS
// =============================================================================

export interface SupplierAnalytics {
    totalSuppliers: number;
    activeSuppliers: number;
    preferredSuppliers: number;
    newSuppliersThisMonth: number;

    totalSpendYTD: number;
    totalOutstanding: number;
    avgPaymentDays: number;

    reliabilityBreakdown: {
        excellent: number;
        good: number;
        fair: number;
        poor: number;
        critical: number;
    };

    dependencyBreakdown: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };

    topSuppliersBySpend: { id: string; name: string; spend: number }[];
    highRiskSuppliers: { id: string; name: string; riskCount: number; dependencyLevel: DependencyLevel }[];

    categorySpend: { category: SupplierCategory; spend: number; percentage: number }[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const SUPPLIER_STATUSES: { value: SupplierStatus; label: string; color: string }[] = [
    { value: 'active', label: 'Active', color: 'emerald' },
    { value: 'inactive', label: 'Inactive', color: 'gray' },
    { value: 'pending', label: 'Pending', color: 'blue' },
    { value: 'blocked', label: 'Blocked', color: 'red' },
    { value: 'preferred', label: 'Preferred', color: 'purple' },
];

export const SUPPLIER_CATEGORIES: { value: SupplierCategory; label: string }[] = [
    { value: 'goods', label: 'Goods' },
    { value: 'services', label: 'Services' },
    { value: 'raw_materials', label: 'Raw Materials' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'logistics', label: 'Logistics' },
    { value: 'professional', label: 'Professional Services' },
    { value: 'other', label: 'Other' },
];

export const RELIABILITY_RATINGS: { value: ReliabilityRating; label: string; color: string }[] = [
    { value: 'excellent', label: 'Excellent', color: 'emerald' },
    { value: 'good', label: 'Good', color: 'blue' },
    { value: 'fair', label: 'Fair', color: 'amber' },
    { value: 'poor', label: 'Poor', color: 'orange' },
    { value: 'critical', label: 'Critical', color: 'red' },
];

export const DEPENDENCY_LEVELS: { value: DependencyLevel; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'emerald' },
    { value: 'medium', label: 'Medium', color: 'amber' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'critical', label: 'Critical', color: 'red' },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
    { value: 'wire', label: 'Wire Transfer' },
    { value: 'ach', label: 'ACH' },
    { value: 'check', label: 'Check' },
    { value: 'card', label: 'Credit Card' },
    { value: 'cash', label: 'Cash' },
    { value: 'other', label: 'Other' },
];

export const SUPPLIER_PAYMENT_TERMS = [
    'Due on Receipt',
    'Net 15',
    'Net 30',
    'Net 45',
    'Net 60',
    'Net 90',
    '2/10 Net 30',
    '1/10 Net 30',
];