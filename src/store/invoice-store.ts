import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Invoice, InvoiceItem, InvoiceParty, InvoicePayment, InvoiceTemplate, InvoiceWizardState } from '@/types/invoice';

// =============================================================================
// INVOICE STORE
// =============================================================================

interface InvoiceState {
  invoices: Invoice[];
  templates: InvoiceTemplate[];
  currentInvoice: Invoice | null;
  wizardState: InvoiceWizardState;
  lastInvoiceNumber: number;
  
  // Actions
  createInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  duplicateInvoice: (id: string) => Invoice;
  setCurrentInvoice: (invoice: Invoice | null) => void;
  
  // Wizard
  setWizardStep: (step: number) => void;
  updateWizardState: (updates: Partial<InvoiceWizardState>) => void;
  resetWizard: () => void;
  
  // Templates
  saveTemplate: (template: Omit<InvoiceTemplate, 'id'>) => void;
  deleteTemplate: (id: string) => void;
  applyTemplate: (templateId: string) => void;
  
  // Status
  markAsSent: (id: string, email?: string) => void;
  markAsPaid: (id: string) => void;
  markAsOverdue: (id: string) => void;
  
  // Invoice number
  generateInvoiceNumber: () => string;
  
  // Calculations
  calculateItemTotal: (item: Omit<InvoiceItem, 'total'>) => number;
  calculateInvoiceTotals: (items: InvoiceItem[], taxRate: number, applyTax: boolean) => { subtotal: number; taxAmount: number; total: number };
}

const initialWizardState: InvoiceWizardState = {
  step: 1,
  recipient: {},
  sender: {},
  items: [],
  invoiceDate: new Date().toISOString().split('T')[0],
  invoiceNumber: '',
  serviceDate: new Date().toISOString().split('T')[0],
  applyTax: true,
  taxRate: 19,
  payment: {
    method: 'bank_transfer',
    dueInDays: 14,
  },
  currency: 'EUR',
  notes: '',
  language: 'de',
};

// Demo invoices
const generateDemoInvoices = (): Invoice[] => [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2025-001',
    status: 'paid',
    sender: {
      name: 'Max Mustermann',
      company: 'Mustermann GmbH',
      address: 'Musterstraße 123',
      city: 'München',
      postalCode: '80331',
      country: 'DE',
      email: 'info@mustermann.de',
      taxId: 'DE123456789',
    },
    recipient: {
      name: 'Hans Schmidt',
      company: 'Schmidt & Partner',
      address: 'Hauptstraße 45',
      city: 'Berlin',
      postalCode: '10115',
      country: 'DE',
      email: 'hans@schmidt-partner.de',
    },
    invoiceDate: '2025-11-15',
    dueDate: '2025-11-29',
    serviceDate: '2025-11-01',
    items: [
      { id: '1', description: 'Webdesign Firmenhomepage', quantity: 1, unitPrice: 2500, taxRate: 19, total: 2500 },
      { id: '2', description: 'SEO Optimierung', quantity: 5, unitPrice: 150, taxRate: 19, total: 750 },
    ],
    currency: 'EUR',
    subtotal: 3250,
    taxAmount: 617.50,
    total: 3867.50,
    applyTax: true,
    taxRate: 19,
    payment: {
      method: 'bank_transfer',
      dueInDays: 14,
      bankName: 'Deutsche Bank',
      iban: 'DE89370400440532013000',
      bic: 'DEUTDEDB',
    },
    language: 'de',
    createdAt: '2025-11-15T10:00:00Z',
    updatedAt: '2025-11-15T10:00:00Z',
    sentAt: '2025-11-15T10:30:00Z',
    paidAt: '2025-11-22T14:00:00Z',
    isRecurring: false,
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2025-002',
    status: 'sent',
    sender: {
      name: 'Max Mustermann',
      company: 'Mustermann GmbH',
      address: 'Musterstraße 123',
      city: 'München',
      postalCode: '80331',
      country: 'DE',
      email: 'info@mustermann.de',
      taxId: 'DE123456789',
    },
    recipient: {
      name: 'Marie Dupont',
      company: 'Dupont SARL',
      address: '15 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001',
      country: 'FR',
      email: 'marie@dupont.fr',
    },
    invoiceDate: '2025-12-01',
    dueDate: '2025-12-15',
    serviceDate: '2025-12-01',
    items: [
      { id: '1', description: 'Consulting Services', quantity: 8, unitPrice: 200, taxRate: 0, total: 1600 },
    ],
    currency: 'EUR',
    subtotal: 1600,
    taxAmount: 0,
    total: 1600,
    applyTax: false,
    taxRate: 0,
    taxExemptReason: 'reverse_charge',
    taxExemptNote: 'Reverse Charge - Steuerschuldnerschaft des Leistungsempfängers',
    payment: {
      method: 'bank_transfer',
      dueInDays: 14,
      bankName: 'Deutsche Bank',
      iban: 'DE89370400440532013000',
      bic: 'DEUTDEDB',
    },
    language: 'en',
    createdAt: '2025-12-01T09:00:00Z',
    updatedAt: '2025-12-01T09:00:00Z',
    sentAt: '2025-12-01T09:30:00Z',
    isRecurring: false,
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2025-003',
    status: 'draft',
    sender: {
      name: 'Max Mustermann',
      company: 'Mustermann GmbH',
      address: 'Musterstraße 123',
      city: 'München',
      postalCode: '80331',
      country: 'DE',
      email: 'info@mustermann.de',
      taxId: 'DE123456789',
    },
    recipient: {
      name: 'John Smith',
      company: 'Smith LLC',
      address: '123 Main Street',
      city: 'New York',
      postalCode: '10001',
      country: 'US',
      email: 'john@smithllc.com',
    },
    invoiceDate: '2025-12-10',
    dueDate: '2025-12-24',
    serviceDate: '2025-12-10',
    items: [
      { id: '1', description: 'Software Development', quantity: 40, unitPrice: 100, taxRate: 0, total: 4000 },
    ],
    currency: 'USD',
    subtotal: 4000,
    taxAmount: 0,
    total: 4000,
    applyTax: false,
    taxRate: 0,
    taxExemptReason: 'export',
    payment: {
      method: 'bank_transfer',
      dueInDays: 14,
      bankName: 'Deutsche Bank',
      iban: 'DE89370400440532013000',
      bic: 'DEUTDEDB',
    },
    language: 'en',
    createdAt: '2025-12-10T11:00:00Z',
    updatedAt: '2025-12-10T11:00:00Z',
    isRecurring: false,
  },
];

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set, get) => ({
      invoices: generateDemoInvoices(),
      templates: [],
      currentInvoice: null,
      wizardState: { ...initialWizardState, invoiceNumber: 'INV-2025-004' },
      lastInvoiceNumber: 3,

      createInvoice: (invoiceData) => {
        const now = new Date().toISOString();
        const newInvoice: Invoice = {
          ...invoiceData,
          id: `inv-${Date.now()}`,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          invoices: [...state.invoices, newInvoice],
          lastInvoiceNumber: state.lastInvoiceNumber + 1,
        }));
        return newInvoice;
      },

      updateInvoice: (id, updates) => {
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id
              ? { ...inv, ...updates, updatedAt: new Date().toISOString() }
              : inv
          ),
        }));
      },

      deleteInvoice: (id) => {
        set((state) => ({
          invoices: state.invoices.filter((inv) => inv.id !== id),
        }));
      },

      duplicateInvoice: (id) => {
        const original = get().invoices.find((inv) => inv.id === id);
        if (!original) throw new Error('Invoice not found');
        
        const newNumber = get().generateInvoiceNumber();
        const now = new Date().toISOString();
        const today = new Date().toISOString().split('T')[0];
        
        const duplicate: Invoice = {
          ...original,
          id: `inv-${Date.now()}`,
          invoiceNumber: newNumber,
          status: 'draft',
          invoiceDate: today,
          dueDate: new Date(Date.now() + original.payment.dueInDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdAt: now,
          updatedAt: now,
          sentAt: undefined,
          paidAt: undefined,
        };
        
        set((state) => ({
          invoices: [...state.invoices, duplicate],
          lastInvoiceNumber: state.lastInvoiceNumber + 1,
        }));
        
        return duplicate;
      },

      setCurrentInvoice: (invoice) => {
        set({ currentInvoice: invoice });
      },

      setWizardStep: (step) => {
        set((state) => ({
          wizardState: { ...state.wizardState, step },
        }));
      },

      updateWizardState: (updates) => {
        set((state) => ({
          wizardState: { ...state.wizardState, ...updates },
        }));
      },

      resetWizard: () => {
        const newNumber = get().generateInvoiceNumber();
        set({
          wizardState: {
            ...initialWizardState,
            invoiceNumber: newNumber,
          },
        });
      },

      saveTemplate: (templateData) => {
        const template: InvoiceTemplate = {
          ...templateData,
          id: `tpl-${Date.now()}`,
        };
        set((state) => ({
          templates: [...state.templates, template],
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }));
      },

      applyTemplate: (templateId) => {
        const template = get().templates.find((t) => t.id === templateId);
        if (!template) return;
        
        set((state) => ({
          wizardState: {
            ...state.wizardState,
            sender: template.sender,
            payment: template.payment,
            taxRate: template.defaultTaxRate,
            currency: template.defaultCurrency,
            language: template.defaultLanguage,
          },
        }));
      },

      markAsSent: (id, email) => {
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id
              ? { ...inv, status: 'sent', sentAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : inv
          ),
        }));
      },

      markAsPaid: (id) => {
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id
              ? { ...inv, status: 'paid', paidAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : inv
          ),
        }));
      },

      markAsOverdue: (id) => {
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id
              ? { ...inv, status: 'overdue', updatedAt: new Date().toISOString() }
              : inv
          ),
        }));
      },

      generateInvoiceNumber: () => {
        const year = new Date().getFullYear();
        const nextNum = get().lastInvoiceNumber + 1;
        return `INV-${year}-${String(nextNum).padStart(3, '0')}`;
      },

      calculateItemTotal: (item) => {
        return item.quantity * item.unitPrice;
      },

      calculateInvoiceTotals: (items, taxRate, applyTax) => {
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const taxAmount = applyTax ? subtotal * (taxRate / 100) : 0;
        const total = subtotal + taxAmount;
        return { subtotal, taxAmount, total };
      },
    }),
    {
      name: 'primebalance-invoices',
    }
  )
);
