// =============================================================================
// INVOICE TYPES - Complete Type System
// src/types/invoice.ts
// =============================================================================

// =============================================================================
// ENUMS
// =============================================================================

export enum InvoiceStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  SENT = 'sent',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  DIRECT_DEBIT = 'direct_debit',
  CASH = 'cash',
  CHECK = 'check',
  PAYPAL = 'paypal',
  OTHER = 'other',
}

export enum PaymentTerms {
  DUE_ON_RECEIPT = 'due_on_receipt',
  NET_7 = 'net_7',
  NET_14 = 'net_14',
  NET_30 = 'net_30',
  NET_45 = 'net_45',
  NET_60 = 'net_60',
  NET_90 = 'net_90',
}

export enum TaxClassification {
  STANDARD = 'standard',
  REDUCED = 'reduced',
  ZERO = 'zero',
  EXEMPT = 'exempt',
  REVERSE_CHARGE = 'reverse_charge',
}

export enum InvoiceEventType {
  REVENUE_RECOGNITION = 'revenue_recognition',
  RECEIVABLE_CREATED = 'receivable_created',
  TAX_LIABILITY = 'tax_liability',
  PAYMENT_RECEIVED = 'payment_received',
  WRITE_OFF = 'write_off',
  REVERSAL = 'reversal',
  DISCOUNT_APPLIED = 'discount_applied',
}

export enum InvoiceChangeType {
  CREATED = 'created',
  UPDATED = 'updated',
  CONFIRMED = 'confirmed',
  SENT = 'sent',
  PAYMENT_APPLIED = 'payment_applied',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived',
}

// =============================================================================
// CORE TYPES
// =============================================================================

export interface InvoiceParty {
  name: string;
  company?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  vatId?: string;
}

export interface InvoiceAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// Alias for backward compatibility
export type Address = InvoiceAddress;

export interface InvoiceLineItem {
  id: string;
  position: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  discountPercent?: number;
  discountAmount?: number;
  productId?: string;
  productCode?: string;
}

// Alias for backward compatibility
export type InvoiceItem = InvoiceLineItem;

export interface InvoicePaymentInfo {
  method: PaymentMethod | string;
  dueInDays?: number;
  bankName?: string;
  accountName?: string;
  iban?: string;
  bic?: string;
  paypalEmail?: string;
  notes?: string;
}

export interface BankDetails {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  iban?: string;
  bic?: string;
  routingNumber?: string;
}

// =============================================================================
// INVOICE MODEL
// =============================================================================

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus | string;

  // Versioning
  version: number;
  isLatest: boolean;
  previousVersionId?: string;

  // Customer Info
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerTaxId?: string;
  customerAddress?: InvoiceAddress;

  // Legacy Parties (still supported)
  sender?: InvoiceParty;
  recipient?: InvoiceParty;

  // Entity Info
  entityId?: string;
  entityName?: string;
  entityTaxId?: string;
  entityAddress?: InvoiceAddress;

  // Dates
  invoiceDate: string;
  dueDate: string;
  serviceDate?: string;
  servicePeriodStart?: string;
  servicePeriodEnd?: string;

  // Items
  items: InvoiceLineItem[];
  currency: string;

  // Totals
  subtotal: number;
  taxAmount: number;
  taxableAmount: number;
  discountAmount: number;
  discountPercent: number;
  total: number;

  // Payment Tracking
  paidAmount: number;
  outstandingAmount: number;

  // Tax
  applyTax: boolean;
  taxRate: number;
  taxClassification?: TaxClassification | string;
  taxExemptReason?: string;
  taxExemptNote?: string;
  taxJurisdiction?: string;

  // FX Tracking
  fxRateToBase?: number;
  fxRateDate?: string;
  baseCurrency?: string;
  totalInBase?: number;

  // Fiscal Period
  fiscalYear?: number;
  fiscalPeriod?: string;

  // Payment Terms
  payment?: InvoicePaymentInfo;
  paymentTerms?: PaymentTerms | string;
  bankDetails?: BankDetails;

  // Lifecycle Timestamps
  confirmedAt?: string;
  sentAt?: string;
  paidAt?: string;
  cancelledAt?: string;
  archivedAt?: string;

  // Audit
  createdBy?: string;
  createdByName?: string;
  confirmedBy?: string;
  confirmedByName?: string;
  cancelledBy?: string;
  cancelledByName?: string;
  cancellationReason?: string;

  // Meta
  notes?: string;
  internalNotes?: string;
  language: string;
  reference?: string;
  poNumber?: string;

  // Recurring
  isRecurring: boolean;
  recurringInterval?: string;
  recurringEndDate?: string;
  nextRecurringDate?: string;
  parentInvoiceId?: string;

  // Source References
  orderId?: string;
  orderNumber?: string;
  projectId?: string;
  costCenterId?: string;

  // Outbound Links
  receivableId?: string;

  // Related Records (populated on request)
  versions?: InvoiceVersion[];
  accountingEvents?: InvoiceAccountingEvent[];
  payments?: InvoicePayment[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// RELATED MODELS
// =============================================================================

export interface InvoiceVersion {
  id: string;
  invoiceId: string;
  version: number;
  snapshot: Invoice;
  changeType: InvoiceChangeType | string;
  changeReason?: string;
  changedFields: string[];
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
}

export interface InvoiceAccountingEvent {
  id: string;
  eventId: string;
  invoiceId: string;
  eventType: InvoiceEventType | string;

  // Double-entry
  debitAccountId?: string;
  debitAccountCode: string;
  debitAccountName: string;
  creditAccountId?: string;
  creditAccountCode: string;
  creditAccountName: string;

  amount: number;
  currency: string;

  // Fiscal
  fiscalYear: number;
  fiscalPeriod: string;
  effectiveDate: string;

  // Status
  status: 'posted' | 'reversed' | 'pending';
  reversedAt?: string;
  reversalEventId?: string;

  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: PaymentMethod | string;

  // Bank details
  bankAccount?: string;
  transactionRef?: string;
  transactionId?: string;

  // Reference
  reference?: string;
  notes?: string;

  // Status
  status: 'pending' | 'completed' | 'failed' | 'reversed';

  // Links
  creditNoteId?: string;
  offsetReceivableId?: string;
  treasuryMovementId?: string;

  // Audit
  appliedBy?: string;
  appliedByName?: string;

  createdAt: string;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

export interface CreateInvoiceRequest {
  // Customer (new format preferred)
  customerName?: string;
  customerEmail?: string;
  customerTaxId?: string;
  customerAddress?: InvoiceAddress;
  customerId?: string;

  // Legacy format (still supported)
  sender?: Partial<InvoiceParty>;
  recipient?: Partial<InvoiceParty>;

  // Dates
  invoiceDate: string;
  dueDate: string;
  serviceDate?: string;
  servicePeriodStart?: string;
  servicePeriodEnd?: string;

  // Items
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    unit?: string;
    taxRate?: number;
    discountPercent?: number;
    productId?: string;
  }>;

  currency?: string;

  // Tax
  applyTax?: boolean;
  taxRate?: number;
  taxClassification?: TaxClassification | string;
  taxExemptReason?: string;

  // FX
  fxRateToBase?: number;
  baseCurrency?: string;

  // Payment
  paymentTerms?: PaymentTerms | string;
  payment?: Partial<InvoicePaymentInfo>;
  bankDetails?: BankDetails;

  // Meta
  notes?: string;
  internalNotes?: string;
  language?: string;
  reference?: string;
  poNumber?: string;

  // From Order
  orderId?: string;

  // Project/Cost Center
  projectId?: string;
  costCenterId?: string;
}

export interface UpdateInvoiceRequest {
  // Customer
  customerName?: string;
  customerEmail?: string;
  customerAddress?: InvoiceAddress;
  recipient?: Partial<InvoiceParty>;

  // Dates
  invoiceDate?: string;
  dueDate?: string;
  serviceDate?: string;

  // Items
  items?: Array<{
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    unit?: string;
    taxRate?: number;
  }>;

  // Tax
  taxRate?: number;
  applyTax?: boolean;

  // Meta
  notes?: string;
  internalNotes?: string;
  payment?: Partial<InvoicePaymentInfo>;
  bankDetails?: BankDetails;

  // Change tracking
  changeReason?: string;
}

export interface ConfirmInvoiceRequest {
  taxRate?: number;
  fxRateToBase?: number;
  fxRateDate?: string;
}

export interface ApplyPaymentRequest {
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod | string;
  reference?: string;
  bankAccount?: string;
  transactionRef?: string;
  transactionId?: string;
  notes?: string;
}

export interface CancelInvoiceRequest {
  reason: string;
}

export interface CreateFromOrderRequest {
  orderId: string;
  includeAllItems?: boolean;
  selectedItemIds?: string[];
}

// =============================================================================
// STORE TYPES
// =============================================================================

export interface InvoiceFilters {
  status?: InvoiceStatus | string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  currency?: string;
  overdue?: boolean;
  search?: string;
}

export interface InvoiceStatistics {
  totalRevenue: number;
  totalPaid: number;
  totalOutstanding: number;
  count: number;
  byStatus?: Record<string, number>;
  byCurrency?: Record<string, number>;
}

export interface InvoicePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// =============================================================================
// WIZARD TYPES (Legacy support)
// =============================================================================

export interface InvoiceWizardState {
  step: number;
  recipient: Partial<InvoiceParty>;
  sender: Partial<InvoiceParty>;
  items: InvoiceLineItem[];
  invoiceDate: string;
  invoiceNumber: string;
  serviceDate: string;
  applyTax: boolean;
  taxRate: number;
  taxExemptReason?: string;
  payment: Partial<InvoicePaymentInfo>;
  currency: string;
  notes: string;
  language: string;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  sender: InvoiceParty;
  payment: InvoicePaymentInfo;
  defaultItems?: Partial<InvoiceLineItem>[];
  defaultTaxRate: number;
  defaultCurrency: string;
  defaultLanguage: string;
  bankDetails?: BankDetails;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Status transition rules
 */
const STATUS_TRANSITIONS: Record<string, string[]> = {
  [InvoiceStatus.DRAFT]: [InvoiceStatus.CONFIRMED, InvoiceStatus.CANCELLED],
  [InvoiceStatus.CONFIRMED]: [InvoiceStatus.SENT, InvoiceStatus.CANCELLED, InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID],
  [InvoiceStatus.SENT]: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE, InvoiceStatus.CANCELLED],
  [InvoiceStatus.PARTIALLY_PAID]: [InvoiceStatus.PAID, InvoiceStatus.OVERDUE, InvoiceStatus.CANCELLED],
  [InvoiceStatus.OVERDUE]: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.CANCELLED],
  [InvoiceStatus.PAID]: [InvoiceStatus.ARCHIVED],
  [InvoiceStatus.CANCELLED]: [InvoiceStatus.ARCHIVED],
  [InvoiceStatus.ARCHIVED]: [],
};

/**
 * Check if invoice can transition to target status
 */
export function canTransitionTo(currentStatus: string, targetStatus: string): boolean {
  return STATUS_TRANSITIONS[currentStatus]?.includes(targetStatus) ?? false;
}

/**
 * Check if invoice can accept payment
 */
export function canAcceptPayment(status: string): boolean {
  return [
    InvoiceStatus.CONFIRMED,
    InvoiceStatus.SENT,
    InvoiceStatus.PARTIALLY_PAID,
    InvoiceStatus.OVERDUE,
  ].includes(status as InvoiceStatus);
}

/**
 * Check if invoice is editable (only DRAFT)
 */
export function isEditable(status: string): boolean {
  return status === InvoiceStatus.DRAFT;
}

/**
 * Check if invoice is deletable (only DRAFT)
 */
export function isDeletable(status: string): boolean {
  return status === InvoiceStatus.DRAFT;
}

/**
 * Check if invoice is archivable
 */
export function isArchivable(status: string): boolean {
  return [InvoiceStatus.PAID, InvoiceStatus.CANCELLED].includes(status as InvoiceStatus);
}

/**
 * Generate deterministic event ID for idempotency
 */
export function generateEventId(
    invoiceId: string,
    eventType: string,
    timestamp?: Date
): string {
  const ts = timestamp || new Date();
  const dateStr = ts.toISOString().split('T')[0];
  return `${invoiceId}_${eventType}_${dateStr}_${ts.getTime()}`;
}

/**
 * Get fiscal period from date (M01-M12)
 */
export function getFiscalPeriod(date: Date): { fiscalYear: number; fiscalPeriod: string } {
  return {
    fiscalYear: date.getFullYear(),
    fiscalPeriod: `M${String(date.getMonth() + 1).padStart(2, '0')}`,
  };
}

/**
 * Calculate line item totals
 */
export function calculateLineItem(
    quantity: number,
    unitPrice: number,
    taxRate: number,
    discountPercent: number = 0
): { subtotal: number; taxAmount: number; total: number; discountAmount: number } {
  const grossSubtotal = quantity * unitPrice;
  const discountAmount = grossSubtotal * (discountPercent / 100);
  const subtotal = grossSubtotal - discountAmount;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  return { subtotal, taxAmount, total, discountAmount };
}

/**
 * Calculate invoice totals from line items
 */
export function calculateInvoiceTotals(
    items: InvoiceLineItem[],
    globalDiscountPercent: number = 0
): { subtotal: number; taxAmount: number; discountAmount: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const taxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
  const lineDiscounts = items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);

  const globalDiscount = subtotal * (globalDiscountPercent / 100);
  const discountAmount = lineDiscounts + globalDiscount;

  const total = subtotal + taxAmount - globalDiscount;

  return { subtotal, taxAmount, discountAmount, total };
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'CHF', symbol: 'CHF' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CNY', symbol: '¥' },
  { code: 'INR', symbol: '₹' },
  { code: 'BRL', symbol: 'R$' },
  { code: 'MXN', symbol: '$' },
  { code: 'KRW', symbol: '₩' },
  { code: 'SGD', symbol: 'S$' },
  { code: 'HKD', symbol: 'HK$' },
  { code: 'NOK', symbol: 'kr' },
  { code: 'SEK', symbol: 'kr' },
  { code: 'DKK', symbol: 'kr' },
  { code: 'NZD', symbol: 'NZ$' },
  { code: 'ZAR', symbol: 'R' },
  { code: 'AED', symbol: 'د.إ' },
];

export const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'KR', name: 'South Korea' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'IE', name: 'Ireland' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'PT', name: 'Portugal' },
  { code: 'PL', name: 'Poland' },
  { code: 'IL', name: 'Israel' },
];