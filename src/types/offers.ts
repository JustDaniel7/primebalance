// =============================================================================
// OFFERS & QUOTES TYPES
// Pre-contractual commercial offer management
// =============================================================================

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export type OfferStatus = 'draft' | 'sent' | 'revised' | 'accepted' | 'rejected' | 'expired' | 'converted';
export type OfferLineType = 'product' | 'service' | 'subscription' | 'one_time' | 'discount';
export type AcceptanceMethod = 'email' | 'signature' | 'click' | 'verbal' | 'written';
export type OffersDiscountType = 'percentage' | 'fixed' | 'volume';

export const OFFER_STATUSES: { value: OfferStatus; label: string; color: string }[] = [
    { value: 'draft', label: 'Draft', color: 'gray' },
    { value: 'sent', label: 'Sent', color: 'blue' },
    { value: 'revised', label: 'Revised', color: 'amber' },
    { value: 'accepted', label: 'Accepted', color: 'emerald' },
    { value: 'rejected', label: 'Rejected', color: 'red' },
    { value: 'expired', label: 'Expired', color: 'gray' },
    { value: 'converted', label: 'Converted to Order', color: 'purple' },
];

export const LINE_TYPES: { value: OfferLineType; label: string }[] = [
    { value: 'product', label: 'Product' },
    { value: 'service', label: 'Service' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'one_time', label: 'One-Time Fee' },
    { value: 'discount', label: 'Discount' },
];

export const OFFERS_PAYMENT_TERMS = [
    { value: 'net_7', label: 'Net 7 Days' },
    { value: 'net_15', label: 'Net 15 Days' },
    { value: 'net_30', label: 'Net 30 Days' },
    { value: 'net_45', label: 'Net 45 Days' },
    { value: 'net_60', label: 'Net 60 Days' },
    { value: 'due_on_receipt', label: 'Due on Receipt' },
    { value: 'advance', label: '100% Advance' },
    { value: 'milestone', label: 'Milestone-Based' },
];

export const VALIDITY_PERIODS = [
    { value: 7, label: '7 Days' },
    { value: 14, label: '14 Days' },
    { value: 30, label: '30 Days' },
    { value: 45, label: '45 Days' },
    { value: 60, label: '60 Days' },
    { value: 90, label: '90 Days' },
];

// =============================================================================
// COUNTERPARTY
// =============================================================================

export interface OfferCounterparty {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
    contactPerson?: string;
}

// =============================================================================
// LINE ITEMS
// =============================================================================

export interface OfferLineItem {
    id: string;
    lineNumber: number;
    type: OfferLineType;
    description: string;
    sku?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    currency: string;

    // Discount
    discountType?: OffersDiscountType;
    discountValue?: number;
    discountReason?: string;

    // Calculated
    subtotal: number;
    discountAmount: number;
    netAmount: number;

    // Margin (for internal preview)
    costPrice?: number;
    marginAmount?: number;
    marginPercent?: number;

    // Tax (display only)
    taxRate?: number;
    taxAmount?: number;

    notes?: string;
}

// =============================================================================
// OFFER
// =============================================================================

export interface Offer {
    id: string;
    offerNumber: string;
    version: number;

    // Status
    status: OfferStatus;

    // Counterparty
    counterparty: OfferCounterparty;

    // Dates
    offerDate: string;
    validityDays: number;
    expiryDate: string;
    sentAt?: string;
    acceptedAt?: string;
    rejectedAt?: string;
    convertedAt?: string;

    // Terms
    currency: string;
    paymentTerms: string;
    deliveryTerms?: string;

    // Line Items
    lineItems: OfferLineItem[];

    // Totals
    subtotal: number;
    totalDiscount: number;
    taxTotal: number;
    grandTotal: number;

    // Margin Preview (internal)
    totalCost?: number;
    grossMargin?: number;
    grossMarginPercent?: number;

    // Notes & Terms
    internalNotes?: string;
    customerNotes?: string;
    termsAndConditions?: string;

    // Non-binding disclaimer
    disclaimer: string;

    // Acceptance
    acceptanceMethod?: AcceptanceMethod;
    rejectionReason?: string;

    // Conversion
    convertedOrderId?: string;
    convertedOrderNumber?: string;

    // Template
    templateId?: string;
    templateName?: string;

    // Previous version
    previousVersionId?: string;

    // Audit
    createdBy: string;
    createdAt: string;
    updatedBy?: string;
    updatedAt?: string;
    sentBy?: string;
    approvedBy?: string;

    // Organization
    organizationId?: string;
}

// =============================================================================
// VERSION HISTORY
// =============================================================================

export interface OfferVersion {
    id: string;
    offerId: string;
    version: number;
    changes: string[];
    revisionNotes?: string;
    snapshotData: Partial<Offer>;
    createdBy: string;
    createdAt: string;
}

// =============================================================================
// TEMPLATES
// =============================================================================

export interface OfferTemplate {
    id: string;
    name: string;
    description?: string;
    category?: string;

    // Default values
    defaultCurrency: string;
    defaultValidityDays: number;
    defaultPaymentTerms: string;
    defaultDeliveryTerms?: string;
    defaultTermsAndConditions?: string;
    defaultDisclaimer: string;

    // Default line items
    defaultLineItems: Partial<OfferLineItem>[];

    // Branding
    headerText?: string;
    footerText?: string;

    // Usage stats
    usageCount: number;
    lastUsedAt?: string;

    // Meta
    createdBy: string;
    createdAt: string;
    isActive: boolean;
}

// =============================================================================
// PRICING RULES
// =============================================================================

export interface PricingRule {
    id: string;
    name: string;
    type: 'volume_discount' | 'customer_tier' | 'promotional' | 'bundle';
    conditions: {
        minQuantity?: number;
        maxQuantity?: number;
        customerTier?: string;
        validFrom?: string;
        validTo?: string;
    };
    discount: {
        type: OffersDiscountType;
        value: number;
    };
    requiresApproval: boolean;
    isActive: boolean;
}

// =============================================================================
// MARGIN PREVIEW
// =============================================================================

export interface MarginPreview {
    lineItems: {
        lineId: string;
        description: string;
        revenue: number;
        cost: number;
        margin: number;
        marginPercent: number;
    }[];
    totals: {
        totalRevenue: number;
        totalCost: number;
        grossMargin: number;
        grossMarginPercent: number;
        discountImpact: number;
        netMargin: number;
        netMarginPercent: number;
    };
    assumptions: string[];
    warnings: string[];
}

// =============================================================================
// AUDIT LOG
// =============================================================================

export interface OfferAuditLog {
    id: string;
    offerId: string;
    offerNumber: string;
    action: 'created' | 'edited' | 'sent' | 'revised' | 'accepted' | 'rejected' | 'expired' | 'converted' | 'viewed';
    details: string;
    previousStatus?: OfferStatus;
    newStatus?: OfferStatus;
    userId: string;
    userName: string;
    userRole: string;
    timestamp: string;
    ipAddress?: string;
    metadata?: Record<string, any>;
}

// =============================================================================
// DASHBOARD STATS
// =============================================================================

export interface OfferStats {
    totalOffers: number;
    byStatus: Record<OfferStatus, number>;
    totalValue: number;
    acceptedValue: number;
    conversionRate: number;
    averageValue: number;
    averageValidityDays: number;
    expiringIn7Days: number;
    thisMonth: {
        created: number;
        sent: number;
        accepted: number;
        rejected: number;
    };
}

// =============================================================================
// STATE TRANSITIONS
// =============================================================================

export const VALID_TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
    draft: ['sent'],
    sent: ['revised', 'accepted', 'rejected', 'expired'],
    revised: ['sent', 'accepted', 'rejected', 'expired'],
    accepted: ['converted'],
    rejected: [],
    expired: [],
    converted: [],
};

export const STATUS_ACTIONS: Record<OfferStatus, string[]> = {
    draft: ['edit', 'send', 'delete'],
    sent: ['revise', 'mark_accepted', 'mark_rejected', 'mark_expired'],
    revised: ['edit', 'send'],
    accepted: ['convert_to_order', 'view'],
    rejected: ['view', 'duplicate'],
    expired: ['view', 'duplicate'],
    converted: ['view'],
};