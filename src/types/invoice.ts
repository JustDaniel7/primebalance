// =============================================================================
// INVOICE TYPES
// =============================================================================

export interface InvoiceParty {
  name: string;
  company?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  email?: string;
  phone?: string;
  taxId?: string;
  vatId?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface InvoicePayment {
  method: 'bank_transfer' | 'cash' | 'paypal' | 'credit_card' | 'other';
  dueInDays: number;
  bankName?: string;
  iban?: string;
  bic?: string;
  paypalEmail?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  
  // Parties
  sender: InvoiceParty;
  recipient: InvoiceParty;
  
  // Dates
  invoiceDate: string;
  dueDate: string;
  serviceDate?: string;
  servicePeriodStart?: string;
  servicePeriodEnd?: string;
  
  // Items
  items: InvoiceItem[];
  currency: string;
  
  // Totals
  subtotal: number;
  taxAmount: number;
  total: number;
  
  // Tax
  applyTax: boolean;
  taxRate: number;
  taxExemptReason?: 'small_business' | 'reverse_charge' | 'export' | 'other';
  taxExemptNote?: string;
  
  // Payment
  payment: InvoicePayment;
  
  // Meta
  notes?: string;
  internalNotes?: string;
  language: 'en' | 'de' | 'es' | 'fr';
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  paidAt?: string;
  
  // Recurring
  isRecurring: boolean;
  recurringInterval?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextRecurringDate?: string;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  sender: InvoiceParty;
  payment: InvoicePayment;
  defaultItems?: Partial<InvoiceItem>[];
  defaultTaxRate: number;
  defaultCurrency: string;
  defaultLanguage: 'en' | 'de' | 'es' | 'fr';
}

export interface InvoiceWizardState {
  step: number;
  recipient: Partial<InvoiceParty>;
  sender: Partial<InvoiceParty>;
  items: InvoiceItem[];
  invoiceDate: string;
  invoiceNumber: string;
  serviceDate: string;
  applyTax: boolean;
  taxRate: number;
  taxExemptReason?: 'small_business' | 'reverse_charge' | 'export' | 'other';
  payment: Partial<InvoicePayment>;
  currency: string;
  notes: string;
  language: 'en' | 'de' | 'es' | 'fr';
}

// Tax rates by country
export const DEFAULT_TAX_RATES: Record<string, number> = {
  DE: 19,
  AT: 20,
  CH: 7.7,
  FR: 20,
  ES: 21,
  IT: 22,
  NL: 21,
  BE: 21,
  GB: 20,
  US: 0, // Varies by state
  CA: 5, // GST, varies by province
};

export const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

export const COUNTRIES = [
  { code: 'DE', name: { en: 'Germany', de: 'Deutschland', es: 'Alemania', fr: 'Allemagne' } },
  { code: 'AT', name: { en: 'Austria', de: 'Österreich', es: 'Austria', fr: 'Autriche' } },
  { code: 'CH', name: { en: 'Switzerland', de: 'Schweiz', es: 'Suiza', fr: 'Suisse' } },
  { code: 'FR', name: { en: 'France', de: 'Frankreich', es: 'Francia', fr: 'France' } },
  { code: 'ES', name: { en: 'Spain', de: 'Spanien', es: 'España', fr: 'Espagne' } },
  { code: 'IT', name: { en: 'Italy', de: 'Italien', es: 'Italia', fr: 'Italie' } },
  { code: 'NL', name: { en: 'Netherlands', de: 'Niederlande', es: 'Países Bajos', fr: 'Pays-Bas' } },
  { code: 'BE', name: { en: 'Belgium', de: 'Belgien', es: 'Bélgica', fr: 'Belgique' } },
  { code: 'GB', name: { en: 'United Kingdom', de: 'Vereinigtes Königreich', es: 'Reino Unido', fr: 'Royaume-Uni' } },
  { code: 'US', name: { en: 'United States', de: 'Vereinigte Staaten', es: 'Estados Unidos', fr: 'États-Unis' } },
  { code: 'CA', name: { en: 'Canada', de: 'Kanada', es: 'Canadá', fr: 'Canada' } },
  { code: 'AU', name: { en: 'Australia', de: 'Australien', es: 'Australia', fr: 'Australie' } },
  { code: 'JP', name: { en: 'Japan', de: 'Japan', es: 'Japón', fr: 'Japon' } },
];
