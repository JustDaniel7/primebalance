import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Invoice, InvoiceItem, InvoiceParty, InvoicePayment, InvoiceTemplate, InvoiceWizardState } from '@/types/invoice';

// =============================================================================
// INVOICE STORE - API CONNECTED
// =============================================================================

interface InvoiceState {
  invoices: Invoice[];
  templates: InvoiceTemplate[];
  currentInvoice: Invoice | null;
  wizardState: InvoiceWizardState;
  lastInvoiceNumber: number;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // API Actions
  fetchInvoices: () => Promise<void>;

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

function mapApiToInvoice(api: any): Invoice {
  return {
    id: api.id,
    invoiceNumber: api.invoiceNumber,
    status: api.status,
    sender: api.sender || {},
    recipient: api.recipient || {},
    invoiceDate: api.invoiceDate?.split('T')[0] || api.invoiceDate,
    dueDate: api.dueDate?.split('T')[0] || api.dueDate,
    serviceDate: api.serviceDate?.split('T')[0],
    servicePeriodStart: api.servicePeriodStart?.split('T')[0],
    servicePeriodEnd: api.servicePeriodEnd?.split('T')[0],
    items: api.items || [],
    currency: api.currency || 'EUR',
    subtotal: Number(api.subtotal) || 0,
    taxAmount: Number(api.taxAmount) || 0,
    total: Number(api.total) || 0,
    applyTax: api.applyTax ?? true,
    taxRate: Number(api.taxRate) || 19,
    taxExemptReason: api.taxExemptReason,
    taxExemptNote: api.taxExemptNote,
    payment: api.payment || { method: 'bank_transfer', dueInDays: 14 },
    notes: api.notes,
    internalNotes: api.internalNotes,
    language: api.language || 'de',
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
    sentAt: api.sentAt,
    paidAt: api.paidAt,
    isRecurring: api.isRecurring || false,
    recurringInterval: api.recurringInterval,
    nextRecurringDate: api.nextRecurringDate,
  };
}

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set, get) => ({
      invoices: [],
      templates: [],
      currentInvoice: null,
      wizardState: initialWizardState,
      lastInvoiceNumber: 0,
      isLoading: false,
      error: null,
      isInitialized: false,

      fetchInvoices: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/invoices');
          if (!response.ok) throw new Error('Failed to fetch invoices');
          const data = await response.json();
          const invoices = (data.invoices || data || []).map(mapApiToInvoice);
          const maxNumber = invoices.reduce((max: number, inv: Invoice) => {
            const num = parseInt(inv.invoiceNumber.replace(/\D/g, '')) || 0;
            return num > max ? num : max;
          }, 0);
          set({ invoices, lastInvoiceNumber: maxNumber, isLoading: false, isInitialized: true });
        } catch (error) {
          console.error('Failed to fetch invoices:', error);
          set({ error: (error as Error).message, isLoading: false, isInitialized: true });
        }
      },

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

        fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invoiceData),
        }).catch(console.error);

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

        fetch(`/api/invoices/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }).catch(console.error);
      },

      deleteInvoice: (id) => {
        set((state) => ({
          invoices: state.invoices.filter((inv) => inv.id !== id),
        }));

        fetch(`/api/invoices/${id}`, { method: 'DELETE' }).catch(console.error);
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

      setCurrentInvoice: (invoice) => set({ currentInvoice: invoice }),

      setWizardStep: (step) => set((state) => ({ wizardState: { ...state.wizardState, step } })),

      updateWizardState: (updates) => set((state) => ({ wizardState: { ...state.wizardState, ...updates } })),

      resetWizard: () => {
        const newNumber = get().generateInvoiceNumber();
        set({ wizardState: { ...initialWizardState, invoiceNumber: newNumber } });
      },

      saveTemplate: (templateData) => {
        const template: InvoiceTemplate = { ...templateData, id: `tpl-${Date.now()}` };
        set((state) => ({ templates: [...state.templates, template] }));
      },

      deleteTemplate: (id) => set((state) => ({ templates: state.templates.filter((t) => t.id !== id) })),

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

      markAsSent: (id, email) => get().updateInvoice(id, { status: 'sent', sentAt: new Date().toISOString() }),
      markAsPaid: (id) => get().updateInvoice(id, { status: 'paid', paidAt: new Date().toISOString() }),
      markAsOverdue: (id) => get().updateInvoice(id, { status: 'overdue' }),

      generateInvoiceNumber: () => {
        const year = new Date().getFullYear();
        const nextNum = get().lastInvoiceNumber + 1;
        return `INV-${year}-${nextNum.toString().padStart(3, '0')}`;
      },

      calculateItemTotal: (item) => item.quantity * item.unitPrice,

      calculateInvoiceTotals: (items, taxRate, applyTax) => {
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const taxAmount = applyTax ? subtotal * (taxRate / 100) : 0;
        return { subtotal, taxAmount, total: subtotal + taxAmount };
      },
    }),
    {
      name: 'primebalance-invoices',
      partialize: (state) => ({
        invoices: state.invoices,
        templates: state.templates,
        lastInvoiceNumber: state.lastInvoiceNumber,
      }),
    }
  )
);