// =============================================================================
// ORDER & FAKTURIERUNG TYPES
// =============================================================================

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
];