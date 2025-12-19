// =============================================================================
// ORDER & FAKTURIERUNG TYPES
// =============================================================================
/*
export type OrderStatus = 'draft' | 'confirmed' | 'in_progress' | 'partially_completed' | 'completed' | 'cancelled';
export type InvoiceType = 'final' | 'partial' | 'advance' | 'periodic' | 'consolidated';
export type CustomerType = 'b2b' | 'b2c';

export interface OrderParty {
    name: string;
    company?: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    email?: string;
    vatId?: string;
}

export interface OrderItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    unit: string; // 'piece' | 'hour' | 'day' | 'month' | 'flat'
    taxRate: number;
    total: number;
    // Invoicing tracking
    quantityInvoiced: number;
    quantityRemaining: number;
    amountInvoiced: number;
    amountRemaining: number;
}

export interface Order {
    id: string;
    orderNumber: string;
    status: OrderStatus;

    // Parties
    customer: OrderParty;
    seller: OrderParty;
    customerType: CustomerType;
    isCrossBorder: boolean;

    // Content
    items: OrderItem[];
    currency: string;

    // Totals
    subtotal: number;
    taxAmount: number;
    total: number;

    // Invoicing progress
    amountInvoiced: number;
    amountRemaining: number;
    invoiceIds: string[]; // linked invoices

    // Dates
    orderDate: string;
    deliveryDate?: string;
    servicePeriodStart?: string;
    servicePeriodEnd?: string;

    // Recurring
    isRecurring: boolean;
    recurringInterval?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';

    // Meta
    reference?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface InvoiceFromOrder {
    orderId: string;
    invoiceType: InvoiceType;
    scope: {
        percentage?: number;
        items?: Array<{ itemId: string; quantity: number }>;
        periodStart?: string;
        periodEnd?: string;
    };
    previouslyInvoiced: number;
    currentAmount: number;
    remainingAfter: number;
}

export interface FakturierungWizardState {
    step: number;
    selectedOrderId: string | null;
    invoiceType: InvoiceType;
    scope: InvoiceFromOrder['scope'];
    applyTax: boolean;
    taxRate: number;
    taxExemptReason?: string;
    invoiceDate: string;
    paymentDays: number;
    notes: string;
}

// Unit options with translations
export const UNITS = [
    { value: 'piece', labels: { en: 'Piece', de: 'Stück', es: 'Pieza', fr: 'Pièce' } },
    { value: 'hour', labels: { en: 'Hour', de: 'Stunde', es: 'Hora', fr: 'Heure' } },
    { value: 'day', labels: { en: 'Day', de: 'Tag', es: 'Día', fr: 'Jour' } },
    { value: 'month', labels: { en: 'Month', de: 'Monat', es: 'Mes', fr: 'Mois' } },
    { value: 'flat', labels: { en: 'Flat Rate', de: 'Pauschal', es: 'Tarifa Plana', fr: 'Forfait' } },
];*/

// =============================================================================
// PRIMEBALANCE - ORDERS MODULE TYPES (Enhanced per TS)
// =============================================================================
// Implements the Order portion of Offer → Order → Invoice continuity chain
// =============================================================================

// =============================================================================
// ORDER LIFECYCLE STATE MACHINE
// =============================================================================

export type OrderStatus =
    | 'draft'                    // Initial creation
    | 'pending_approval'         // Awaiting internal approval
    | 'approved'                 // Approved, ready to confirm
    | 'confirmed'                // Confirmed with customer
    | 'in_progress'              // Execution started
    | 'partially_fulfilled'      // Some items delivered/completed
    | 'fulfilled'                // All items delivered/completed
    | 'partially_invoiced'       // Some items invoiced
    | 'fully_invoiced'           // All items invoiced
    | 'completed'                // Fully executed and invoiced
    | 'on_hold'                  // Temporarily paused
    | 'cancelled'                // Cancelled (terminal)
    | 'disputed';                // Under dispute

// =============================================================================
// ORDER EVENT TYPES (Append-Only Audit Trail)
// =============================================================================

export type OrderEventType =
    | 'order_created'
    | 'order_created_from_offer'
    | 'order_submitted_for_approval'
    | 'order_approved'
    | 'order_rejected'
    | 'order_confirmed'
    | 'order_modified'
    | 'order_item_added'
    | 'order_item_removed'
    | 'order_item_modified'
    | 'fulfillment_started'
    | 'item_partially_fulfilled'
    | 'item_fully_fulfilled'
    | 'order_partially_fulfilled'
    | 'order_fully_fulfilled'
    | 'invoice_generated'
    | 'partial_invoice_generated'
    | 'invoice_linked'
    | 'payment_received'
    | 'order_completed'
    | 'order_put_on_hold'
    | 'order_resumed'
    | 'order_cancelled'
    | 'order_disputed'
    | 'dispute_resolved'
    | 'amendment_created'
    | 'note_added';

export type EventActor = 'user' | 'system' | 'customer' | 'automation';

export interface OrderEvent {
    id: string;
    orderId: string;
    type: OrderEventType;
    timestamp: string;
    actor: EventActor;
    actorId?: string;
    actorName?: string;

    // Change tracking
    previousValue?: any;
    newValue?: any;
    affectedFields?: string[];

    // References
    reference?: string;
    referenceType?: 'offer' | 'invoice' | 'payment' | 'document' | 'amendment';

    // Context
    reason?: string;
    notes?: string;
    metadata?: Record<string, any>;
}

// =============================================================================
// PRICING & COMMERCIAL TERMS
// =============================================================================

export type PricingModel =
    | 'fixed'           // Fixed price
    | 'unit_based'      // Per unit pricing
    | 'time_based'      // Hourly/daily rates
    | 'milestone'       // Milestone-based
    | 'subscription'    // Recurring subscription
    | 'usage_based';    // Usage/consumption based

export type DiscountType = 'percentage' | 'absolute' | 'tiered' | 'conditional';

export interface Discount {
    id: string;
    type: DiscountType;
    description: string;
    value: number;                    // Percentage or absolute amount
    appliesTo: 'order' | 'line';      // Order-level or line-level
    lineItemIds?: string[];           // If line-level
    conditions?: DiscountCondition[];
    approvalRequired: boolean;
    approvedBy?: string;
    approvedAt?: string;
}

export interface DiscountCondition {
    type: 'min_quantity' | 'min_amount' | 'early_payment' | 'volume' | 'customer_tier';
    threshold?: number;
    value?: string;
}

// =============================================================================
// PARTY INFORMATION
// =============================================================================

export interface OrderParty {
    id?: string;
    name: string;
    company?: string;
    address: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;           // ISO 3166-1 alpha-2
    email?: string;
    phone?: string;
    vatId?: string;
    taxId?: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
}

export type CustomerType = 'b2b' | 'b2c' | 'government' | 'nonprofit';

// =============================================================================
// ORDER LINE ITEMS
// =============================================================================

export type UnitType = 'piece' | 'hour' | 'day' | 'week' | 'month' | 'year' | 'kg' | 'liter' | 'meter' | 'flat' | 'license' | 'user';

export interface OrderLineItem {
    id: string;
    lineNumber: number;

    // Origin tracking (for continuity)
    originOfferId?: string;
    originOfferVersion?: number;
    originLineId?: string;

    // Product/Service reference
    productId?: string;
    serviceId?: string;
    sku?: string;

    // Description
    description: string;
    detailedDescription?: string;

    // Quantity & Pricing
    quantity: number;
    unit: UnitType;
    unitPrice: number;

    // Line-level discounts
    discountPercent?: number;
    discountAmount?: number;
    discountReason?: string;

    // Tax
    taxRate: number;
    taxAmount: number;
    taxExempt: boolean;
    taxExemptReason?: string;

    // Totals
    subtotal: number;           // quantity * unitPrice - discounts
    total: number;              // subtotal + taxAmount

    // Cost & Margin (internal, may be hidden)
    costPerUnit?: number;
    totalCost?: number;
    margin?: number;
    marginPercent?: number;

    // Fulfillment tracking
    quantityFulfilled: number;
    quantityRemaining: number;
    fulfillmentStatus: 'pending' | 'partial' | 'complete';

    // Invoice tracking
    quantityInvoiced: number;
    amountInvoiced: number;
    quantityToInvoice: number;
    amountToInvoice: number;

    // Delivery
    expectedDeliveryDate?: string;
    actualDeliveryDate?: string;

    // Notes
    internalNotes?: string;
    customerNotes?: string;
}

// =============================================================================
// TAX SNAPSHOT (Locked at Conversion)
// =============================================================================

export interface TaxSnapshot {
    determinedAt: string;
    taxJurisdiction: string;
    taxRules: TaxRule[];
    exemptions: TaxExemption[];
    totalTaxRate: number;
    isReverseCharge: boolean;
    reverseChargeReason?: string;
}

export interface TaxRule {
    ruleId: string;
    description: string;
    rate: number;
    appliesTo: 'goods' | 'services' | 'both';
}

export interface TaxExemption {
    exemptionId: string;
    reason: string;
    certificate?: string;
    validUntil?: string;
}

// =============================================================================
// FX SNAPSHOT (Locked at Conversion)
// =============================================================================

export interface FxSnapshot {
    baseCurrency: string;
    orderCurrency: string;
    fxRate: number;
    fxRateSource: string;
    fxRateTimestamp: string;
    fxValidUntil?: string;
}

// =============================================================================
// PAYMENT TERMS
// =============================================================================

export interface PaymentTerms {
    termsDays: number;              // Net 30, Net 60, etc.
    earlyPaymentDiscount?: {
        discountPercent: number;
        withinDays: number;
    };
    latePenalty?: {
        penaltyPercent: number;
        afterDays: number;
    };
    paymentMethods: string[];       // bank_transfer, credit_card, etc.
    customTerms?: string;
}

// =============================================================================
// DELIVERY TERMS
// =============================================================================

export type DeliveryIncoterm =
    | 'EXW' | 'FCA' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP'  // Any mode
    | 'FAS' | 'FOB' | 'CFR' | 'CIF';                          // Sea/Waterway

export interface DeliveryTerms {
    incoterm?: DeliveryIncoterm;
    incotermLocation?: string;
    shippingMethod?: string;
    estimatedDeliveryDate?: string;
    deliveryInstructions?: string;
    trackingRequired: boolean;
    insuranceRequired: boolean;
    insuranceValue?: number;
}

// =============================================================================
// APPROVAL WORKFLOW
// =============================================================================

export type ApprovalStatus = 'not_required' | 'pending' | 'approved' | 'rejected';

export interface ApprovalRecord {
    id: string;
    requiredAt: string;
    requiredReason: string;
    requiredBy?: string;
    status: ApprovalStatus;
    approverRole?: string;
    approverId?: string;
    approverName?: string;
    approvedAt?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    notes?: string;
}

// =============================================================================
// AMENDMENT TRACKING
// =============================================================================

export interface OrderAmendment {
    id: string;
    orderId: string;
    amendmentNumber: number;
    createdAt: string;
    createdBy: string;
    reason: string;

    // What changed
    changedFields: string[];
    previousValues: Record<string, any>;
    newValues: Record<string, any>;

    // Approval
    requiresApproval: boolean;
    approvalStatus: ApprovalStatus;
    approvedBy?: string;
    approvedAt?: string;

    // Customer acknowledgment
    requiresCustomerAck: boolean;
    customerAckAt?: string;

    // Downstream impact
    requiresOfferRevision: boolean;
    affectsInvoices: boolean;
    affectsForecast: boolean;
}

// =============================================================================
// INVOICE LINKAGE
// =============================================================================

export type InvoiceType = 'final' | 'partial' | 'advance' | 'periodic' | 'credit_note' | 'proforma';

export interface LinkedInvoice {
    invoiceId: string;
    invoiceNumber: string;
    invoiceType: InvoiceType;
    invoiceDate: string;
    amount: number;
    taxAmount: number;
    total: number;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    linkedLineItems: Array<{
        orderLineId: string;
        quantity: number;
        amount: number;
    }>;
}

// =============================================================================
// FULFILLMENT TRACKING
// =============================================================================

export interface FulfillmentRecord {
    id: string;
    orderId: string;
    lineItemId: string;
    quantity: number;
    fulfilledAt: string;
    fulfilledBy?: string;

    // Delivery details
    deliveryMethod?: string;
    trackingNumber?: string;
    carrier?: string;

    // For inventory items
    warehouseId?: string;
    batchNumber?: string;
    serialNumbers?: string[];

    // Confirmation
    customerConfirmed: boolean;
    customerConfirmedAt?: string;

    notes?: string;
}

// =============================================================================
// MAIN ORDER ENTITY
// =============================================================================

export interface Order {
    // Identity
    id: string;
    orderNumber: string;
    version: number;

    // Origin (Continuity Chain)
    originType: 'manual' | 'offer' | 'subscription' | 'recurring';
    originOfferId?: string;
    originOfferVersion?: number;
    originOfferNumber?: string;

    // Status
    status: OrderStatus;
    previousStatus?: OrderStatus;
    statusChangedAt?: string;

    // Parties
    seller: OrderParty;
    customer: OrderParty;
    customerType: CustomerType;
    customerId?: string;

    // Cross-border
    isCrossBorder: boolean;
    isIntraEU?: boolean;

    // Commercial Terms
    pricingModel: PricingModel;
    currency: string;

    // Line Items
    items: OrderLineItem[];

    // Discounts
    orderDiscounts: Discount[];

    // Financials (Calculated)
    subtotal: number;
    totalDiscounts: number;
    taxableAmount: number;
    taxAmount: number;
    total: number;

    // Cost & Margin (Internal)
    totalCost?: number;
    expectedMargin?: number;
    expectedMarginPercent?: number;

    // Snapshots (Locked from Offer)
    taxSnapshot?: TaxSnapshot;
    fxSnapshot?: FxSnapshot;

    // Terms
    paymentTerms: PaymentTerms;
    deliveryTerms?: DeliveryTerms;

    // Dates
    orderDate: string;
    expectedDeliveryDate?: string;
    actualDeliveryDate?: string;
    servicePeriodStart?: string;
    servicePeriodEnd?: string;
    expirationDate?: string;

    // Recurring
    isRecurring: boolean;
    recurringInterval?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
    recurringEndDate?: string;
    recurringSourceOrderId?: string;

    // Fulfillment Summary
    fulfillmentStatus: 'pending' | 'partial' | 'complete';
    fulfillmentPercentage: number;
    fulfillmentRecords: FulfillmentRecord[];

    // Invoice Summary
    invoicingStatus: 'pending' | 'partial' | 'complete';
    amountInvoiced: number;
    amountRemaining: number;
    invoicePercentage: number;
    linkedInvoices: LinkedInvoice[];

    // Approval
    approvalStatus: ApprovalStatus;
    approvalRecords: ApprovalRecord[];

    // Amendments
    amendments: OrderAmendment[];
    currentAmendmentNumber: number;

    // Documents
    attachedDocuments?: Array<{
        id: string;
        name: string;
        type: string;
        url: string;
        uploadedAt: string;
    }>;

    // Notes
    internalNotes?: string;
    customerNotes?: string;
    termsAndConditions?: string;

    // References
    customerPONumber?: string;
    projectReference?: string;
    contractReference?: string;

    // Audit
    events: OrderEvent[];
    createdAt: string;
    createdBy?: string;
    updatedAt: string;
    updatedBy?: string;
}

// =============================================================================
// ORDER CREATION FROM OFFER
// =============================================================================

export interface OfferToOrderConversion {
    offerId: string;
    offerVersion: number;
    offerNumber: string;
    convertedAt: string;
    convertedBy: string;

    // Preserve exact values
    preservedPrices: boolean;
    preservedDiscounts: boolean;
    preservedTaxes: boolean;
    preservedTerms: boolean;

    // Any adjustments (should be rare and approved)
    adjustments?: Array<{
        field: string;
        reason: string;
        approvedBy: string;
    }>;
}

// =============================================================================
// WIZARD STATE
// =============================================================================

export interface OrderWizardState {
    step: number;
    mode: 'create' | 'edit' | 'from_offer' | 'duplicate';

    // Source
    sourceOfferId?: string;
    sourceOrderId?: string;

    // Party selection
    customerId?: string;
    customerData?: OrderParty;
    customerType: CustomerType;

    // Items
    items: Partial<OrderLineItem>[];

    // Terms
    pricingModel: PricingModel;
    currency: string;
    paymentTermsDays: number;

    // Dates
    orderDate: string;
    expectedDeliveryDate?: string;
    servicePeriodStart?: string;
    servicePeriodEnd?: string;

    // Recurring
    isRecurring: boolean;
    recurringInterval?: string;

    // Notes
    internalNotes: string;
    customerNotes: string;

    // Validation
    isValid: boolean;
    validationErrors: string[];
}

// =============================================================================
// INVOICING WIZARD STATE (From Order)
// =============================================================================

export interface OrderInvoicingWizardState {
    step: number;
    orderId: string;
    orderNumber: string;

    // Invoice type
    invoiceType: InvoiceType;

    // Scope
    scopeType: 'full' | 'partial' | 'by_items' | 'by_period';
    selectedItems: Array<{
        lineItemId: string;
        quantity: number;
        amount: number;
    }>;
    percentage?: number;
    periodStart?: string;
    periodEnd?: string;

    // Amounts
    previouslyInvoiced: number;
    currentInvoiceAmount: number;
    remainingAfterInvoice: number;

    // Tax handling
    applyTax: boolean;
    taxRate: number;
    taxExemptReason?: string;

    // Invoice details
    invoiceDate: string;
    dueDate: string;
    paymentTermsDays: number;

    // Notes
    notes: string;

    // Validation
    isValid: boolean;
    validationErrors: string[];
    doubleInvoicingWarning?: string;
}

// =============================================================================
// REPORTING TYPES
// =============================================================================

export interface OrderSummary {
    totalOrders: number;
    totalValue: number;
    byStatus: Record<OrderStatus, { count: number; value: number }>;
    byCustomerType: Record<CustomerType, { count: number; value: number }>;
    averageOrderValue: number;
    fulfillmentRate: number;
    invoicingRate: number;
}

export interface OrderPipeline {
    draft: { count: number; value: number };
    confirmed: { count: number; value: number };
    inProgress: { count: number; value: number };
    awaitingInvoice: { count: number; value: number };
    completed: { count: number; value: number };
}

// =============================================================================
// FILTER & SORT OPTIONS
// =============================================================================

export interface OrderFilters {
    status?: OrderStatus[];
    customerType?: CustomerType[];
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
    amountMin?: number;
    amountMax?: number;
    currency?: string;
    fulfillmentStatus?: ('pending' | 'partial' | 'complete')[];
    invoicingStatus?: ('pending' | 'partial' | 'complete')[];
    hasOffer?: boolean;
    isRecurring?: boolean;
    searchQuery?: string;
}

export type OrderSortField =
    | 'orderNumber'
    | 'orderDate'
    | 'customer'
    | 'total'
    | 'status'
    | 'fulfillmentStatus'
    | 'invoicingStatus'
    | 'createdAt'
    | 'updatedAt';

export type SortDirection = 'asc' | 'desc';