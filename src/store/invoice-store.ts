// =============================================================================
// INVOICE STORE - Zustand State Management
// Implements read-only access for Reports/KPIs and full CRUD for operations
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Invoice,
  InvoiceStatus,
  InvoicePayment,
  InvoiceAccountingEvent,
  InvoiceVersion,
  InvoiceFilters,
  InvoiceStatistics,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  ApplyPaymentRequest,
  InvoiceLineItem,
} from '@/types/invoice';

// =============================================================================
// API MAPPERS
// =============================================================================

function mapApiToInvoice(api: Record<string, unknown>): Invoice {
  return {
    id: api.id as string,
    invoiceNumber: api.invoiceNumber as string,
    status: api.status as InvoiceStatus | string,
    version: (api.version as number) || 1,
    isLatest: (api.isLatest as boolean) ?? true,
    previousVersionId: api.previousVersionId as string | undefined,
    customerId: api.customerId as string | undefined,
    customerName: api.customerName as string | undefined,
    customerEmail: api.customerEmail as string | undefined,
    customerTaxId: api.customerTaxId as string | undefined,
    customerAddress: api.customerAddress as Invoice['customerAddress'],
    sender: api.sender as Invoice['sender'],
    recipient: api.recipient as Invoice['recipient'],
    entityId: api.entityId as string | undefined,
    entityName: api.entityName as string | undefined,
    entityTaxId: api.entityTaxId as string | undefined,
    entityAddress: api.entityAddress as Invoice['entityAddress'],
    invoiceDate: api.invoiceDate as string,
    dueDate: api.dueDate as string,
    serviceDate: api.serviceDate as string | undefined,
    servicePeriodStart: api.servicePeriodStart as string | undefined,
    servicePeriodEnd: api.servicePeriodEnd as string | undefined,
    items: (api.items as InvoiceLineItem[]) || [],
    currency: (api.currency as string) || 'EUR',
    subtotal: Number(api.subtotal) || 0,
    taxAmount: Number(api.taxAmount) || 0,
    taxableAmount: Number(api.taxableAmount) || 0,
    discountAmount: Number(api.discountAmount) || 0,
    discountPercent: Number(api.discountPercent) || 0,
    total: Number(api.total) || 0,
    paidAmount: Number(api.paidAmount) || 0,
    outstandingAmount: Number(api.outstandingAmount) || Number(api.total) || 0,
    applyTax: (api.applyTax as boolean) ?? true,
    taxRate: Number(api.taxRate) || 0,
    taxClassification: api.taxClassification as Invoice['taxClassification'],
    taxExemptReason: api.taxExemptReason as string | undefined,
    taxExemptNote: api.taxExemptNote as string | undefined,
    taxJurisdiction: api.taxJurisdiction as string | undefined,
    fxRateToBase: api.fxRateToBase ? Number(api.fxRateToBase) : undefined,
    fxRateDate: api.fxRateDate as string | undefined,
    baseCurrency: api.baseCurrency as string | undefined,
    totalInBase: api.totalInBase ? Number(api.totalInBase) : undefined,
    fiscalYear: api.fiscalYear as number | undefined,
    fiscalPeriod: api.fiscalPeriod as string | undefined,
    payment: api.payment as Invoice['payment'],
    paymentTerms: api.paymentTerms as Invoice['paymentTerms'],
    bankDetails: api.bankDetails as Invoice['bankDetails'],
    confirmedAt: api.confirmedAt as string | undefined,
    sentAt: api.sentAt as string | undefined,
    paidAt: api.paidAt as string | undefined,
    cancelledAt: api.cancelledAt as string | undefined,
    archivedAt: api.archivedAt as string | undefined,
    createdBy: api.createdBy as string | undefined,
    createdByName: api.createdByName as string | undefined,
    confirmedBy: api.confirmedBy as string | undefined,
    confirmedByName: api.confirmedByName as string | undefined,
    cancelledBy: api.cancelledBy as string | undefined,
    cancelledByName: api.cancelledByName as string | undefined,
    cancellationReason: api.cancellationReason as string | undefined,
    notes: api.notes as string | undefined,
    internalNotes: api.internalNotes as string | undefined,
    language: (api.language as string) || 'en',
    reference: api.reference as string | undefined,
    poNumber: api.poNumber as string | undefined,
    isRecurring: (api.isRecurring as boolean) || false,
    recurringInterval: api.recurringInterval as string | undefined,
    recurringEndDate: api.recurringEndDate as string | undefined,
    nextRecurringDate: api.nextRecurringDate as string | undefined,
    parentInvoiceId: api.parentInvoiceId as string | undefined,
    orderId: api.orderId as string | undefined,
    orderNumber: api.orderNumber as string | undefined,
    projectId: api.projectId as string | undefined,
    costCenterId: api.costCenterId as string | undefined,
    receivableId: api.receivableId as string | undefined,
    versions: api.versions as InvoiceVersion[] | undefined,
    accountingEvents: api.accountingEvents as InvoiceAccountingEvent[] | undefined,
    payments: api.payments as InvoicePayment[] | undefined,
    createdAt: api.createdAt as string,
    updatedAt: api.updatedAt as string,
  };
}

function mapApiToPayment(api: Record<string, unknown>): InvoicePayment {
  return {
    id: api.id as string,
    invoiceId: api.invoiceId as string,
    amount: Number(api.amount) || 0,
    currency: (api.currency as string) || 'EUR',
    paymentDate: api.paymentDate as string,
    paymentMethod: api.paymentMethod as string,
    bankAccount: api.bankAccount as string | undefined,
    transactionRef: api.transactionRef as string | undefined,
    transactionId: api.transactionId as string | undefined,
    reference: api.reference as string | undefined,
    notes: api.notes as string | undefined,
    status: (api.status as InvoicePayment['status']) || 'pending',
    creditNoteId: api.creditNoteId as string | undefined,
    offsetReceivableId: api.offsetReceivableId as string | undefined,
    treasuryMovementId: api.treasuryMovementId as string | undefined,
    appliedBy: api.appliedBy as string | undefined,
    appliedByName: api.appliedByName as string | undefined,
    createdAt: api.createdAt as string,
  };
}

function mapApiToVersion(api: Record<string, unknown>): InvoiceVersion {
  return {
    id: api.id as string,
    invoiceId: api.invoiceId as string,
    version: (api.version as number) || 1,
    snapshot: api.snapshot as Invoice,
    changeType: api.changeType as string,
    changeReason: api.changeReason as string | undefined,
    changedFields: (api.changedFields as string[]) || [],
    createdBy: api.createdBy as string | undefined,
    createdByName: api.createdByName as string | undefined,
    createdAt: api.createdAt as string,
  };
}

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface InvoiceState {
  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------
  invoices: Invoice[];
  currentInvoice: Invoice | null;
  versions: InvoiceVersion[];
  payments: InvoicePayment[];
  accountingEvents: InvoiceAccountingEvent[];
  statistics: InvoiceStatistics | null;

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------
  filters: InvoiceFilters;

  // ---------------------------------------------------------------------------
  // UI State
  // ---------------------------------------------------------------------------
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  selectedIds: string[];

  // Actions - Fetch
  fetchInvoices: (filters?: InvoiceFilters) => Promise<void>;
  fetchInvoice: (id: string, options?: { includeVersions?: boolean; includeEvents?: boolean; includePayments?: boolean }) => Promise<void>;
  fetchStatistics: () => Promise<void>;

  // Actions - CRUD
  createInvoice: (data: CreateInvoiceRequest) => Promise<Invoice | null>;
  updateInvoice: (id: string, data: UpdateInvoiceRequest) => Promise<Invoice | null>;
  deleteInvoice: (id: string) => Promise<boolean>;

  // Actions - Workflow
  confirmInvoice: (id: string, options?: { taxRate?: number; fxRate?: number }) => Promise<boolean>;
  sendInvoice: (id: string) => Promise<boolean>;
  cancelInvoice: (id: string, reason: string) => Promise<boolean>;
  archiveInvoice: (id: string) => Promise<boolean>;

  // Actions - Payment
  applyPayment: (id: string, payment: ApplyPaymentRequest) => Promise<boolean>;

  // Actions - Create from Order
  createFromOrder: (orderId: string, options?: { taxRate?: number; paymentTerms?: string }) => Promise<Invoice | null>;

  // Actions - Filters & Selection
  setFilters: (filters: Partial<InvoiceFilters>) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  selectInvoice: (id: string) => void;
  deselectInvoice: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Actions - UI
  setCurrentInvoice: (invoice: Invoice | null) => void;
  clearError: () => void;

  // Helpers (Read-only for Reports/KPIs)
  getInvoiceById: (id: string) => Invoice | undefined;
  getInvoicesByStatus: (status: InvoiceStatus) => Invoice[];
  getOverdueInvoices: () => Invoice[];
  getInvoicesByCustomer: (customerId: string) => Invoice[];
  getTotalRevenue: () => number;
  getTotalOutstanding: () => number;
  generateInvoiceNumber: () => string;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set, get) => ({
      // Initial State
      invoices: [],
      currentInvoice: null,
      versions: [],
      payments: [],
      accountingEvents: [],
      statistics: null,

      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
      },

      filters: {},

      isLoading: false,
      error: null,
      isInitialized: false,
      selectedIds: [],

  // ==========================================================================
  // FETCH ACTIONS
  // ==========================================================================

  fetchInvoices: async (filters?: InvoiceFilters) => {
    set({ isLoading: true, error: null });

    try {
      const state = get();
      const activeFilters = filters || state.filters;

      const params = new URLSearchParams();
      params.set('page', String(state.pagination.page));
      params.set('limit', String(state.pagination.limit));

      if (activeFilters.status) {
        params.set('status', String(activeFilters.status));
      }
      if (activeFilters.customerId) {
        params.set('customerId', activeFilters.customerId);
      }
      if (activeFilters.dateFrom) {
        params.set('dateFrom', activeFilters.dateFrom);
      }
      if (activeFilters.dateTo) {
        params.set('dateTo', activeFilters.dateTo);
      }
      if (activeFilters.currency) {
        params.set('currency', activeFilters.currency);
      }
      if (activeFilters.overdue) {
        params.set('overdue', 'true');
      }
      if (activeFilters.search) {
        params.set('search', activeFilters.search);
      }

      const response = await fetch(`/api/invoices?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();

      set({
        invoices: data.invoices.map(mapApiToInvoice),
        pagination: data.pagination,
        statistics: data.statistics,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch invoices',
      });
    }
  },

  fetchInvoice: async (id, options = {}) => {
    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams();
      if (options.includeVersions) params.set('includeVersions', 'true');
      if (options.includeEvents) params.set('includeEvents', 'true');
      if (options.includePayments) params.set('includePayments', 'true');

      const response = await fetch(`/api/invoices/${id}?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch invoice');
      }

      const data = await response.json();

      set({
        currentInvoice: data.invoice,
        versions: data.invoice.versions || [],
        payments: data.invoice.payments || [],
        accountingEvents: data.invoice.accountingEvents || [],
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch invoice',
      });
    }
  },

  fetchStatistics: async () => {
    try {
      const response = await fetch('/api/invoices/statistics');

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      set({ statistics: data.statistics });
    } catch (error) {
      console.error('Failed to fetch invoice statistics:', error);
    }
  },

  // ==========================================================================
  // CRUD ACTIONS
  // ==========================================================================

  createInvoice: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create invoice');
      }

      const result = await response.json();

      set((state) => ({
        invoices: [result.invoice, ...state.invoices],
        currentInvoice: result.invoice,
        isLoading: false,
      }));

      return result.invoice;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create invoice',
      });
      return null;
    }
  },

  updateInvoice: async (id, data) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update invoice');
      }

      const result = await response.json();

      set((state) => ({
        invoices: state.invoices.map((inv) =>
            inv.id === id ? result.invoice : inv
        ),
        currentInvoice: state.currentInvoice?.id === id ? result.invoice : state.currentInvoice,
        isLoading: false,
      }));

      return result.invoice;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update invoice',
      });
      return null;
    }
  },

  deleteInvoice: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete invoice');
      }

      set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id),
        currentInvoice: state.currentInvoice?.id === id ? null : state.currentInvoice,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete invoice',
      });
      return false;
    }
  },

  // ==========================================================================
  // WORKFLOW ACTIONS
  // ==========================================================================

  confirmInvoice: async (id, options = {}) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/invoices/${id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to confirm invoice');
      }

      const result = await response.json();

      set((state) => ({
        invoices: state.invoices.map((inv) =>
            inv.id === id ? result.invoice : inv
        ),
        currentInvoice: state.currentInvoice?.id === id ? result.invoice : state.currentInvoice,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to confirm invoice',
      });
      return false;
    }
  },

  sendInvoice: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/invoices/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invoice');
      }

      const result = await response.json();

      set((state) => ({
        invoices: state.invoices.map((inv) =>
            inv.id === id ? result.invoice : inv
        ),
        currentInvoice: state.currentInvoice?.id === id ? result.invoice : state.currentInvoice,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to send invoice',
      });
      return false;
    }
  },

  cancelInvoice: async (id, reason) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/invoices/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel invoice');
      }

      const result = await response.json();

      set((state) => ({
        invoices: state.invoices.map((inv) =>
            inv.id === id ? result.invoice : inv
        ),
        currentInvoice: state.currentInvoice?.id === id ? result.invoice : state.currentInvoice,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to cancel invoice',
      });
      return false;
    }
  },

  archiveInvoice: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/invoices/${id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to archive invoice');
      }

      set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id),
        currentInvoice: state.currentInvoice?.id === id ? null : state.currentInvoice,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to archive invoice',
      });
      return false;
    }
  },

  // ==========================================================================
  // PAYMENT ACTIONS
  // ==========================================================================

  applyPayment: async (id, payment) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/invoices/${id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to apply payment');
      }

      const result = await response.json();

      // Refresh invoice data
      await get().fetchInvoice(id, { includePayments: true });

      // Update invoices list
      set((state) => ({
        invoices: state.invoices.map((inv) =>
            inv.id === id ? { ...inv, ...result.invoice } : inv
        ),
        isLoading: false,
      }));

      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to apply payment',
      });
      return false;
    }
  },

  // ==========================================================================
  // CREATE FROM ORDER
  // ==========================================================================

  createFromOrder: async (orderId, options = {}) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/invoices/from-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, ...options }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create invoice from order');
      }

      const result = await response.json();

      set((state) => ({
        invoices: [result.invoice, ...state.invoices],
        currentInvoice: result.invoice,
        isLoading: false,
      }));

      return result.invoice;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create invoice from order',
      });
      return null;
    }
  },

  // ==========================================================================
  // FILTER & SELECTION ACTIONS
  // ==========================================================================

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 },
    }));
  },

  clearFilters: () => {
    set({
      filters: {},
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
    });
  },

  setPage: (page) => {
    set((state) => ({
      pagination: { ...state.pagination, page },
    }));
  },

  selectInvoice: (id) => {
    set((state) => ({
      selectedIds: [...state.selectedIds, id],
    }));
  },

  deselectInvoice: (id) => {
    set((state) => ({
      selectedIds: state.selectedIds.filter((i) => i !== id),
    }));
  },

  selectAll: () => {
    set((state) => ({
      selectedIds: state.invoices.map((inv) => inv.id),
    }));
  },

  clearSelection: () => {
    set({ selectedIds: [] });
  },

  // ==========================================================================
  // UI ACTIONS
  // ==========================================================================

  setCurrentInvoice: (invoice) => {
    set({ currentInvoice: invoice });
  },

  clearError: () => {
    set({ error: null });
  },

  // ==========================================================================
  // HELPER GETTERS (Read-only for Reports/KPIs - Section 5.4, 5.5)
  // ==========================================================================

  getInvoiceById: (id) => {
    return get().invoices.find((inv) => inv.id === id);
  },

  getInvoicesByStatus: (status) => {
    return get().invoices.filter((inv) => inv.status === status);
  },

  getOverdueInvoices: () => {
    const today = new Date();
    return get().invoices.filter((inv) => {
      const dueDate = new Date(inv.dueDate);
      return (
          dueDate < today &&
          inv.outstandingAmount > 0 &&
          ![InvoiceStatus.PAID, InvoiceStatus.CANCELLED, InvoiceStatus.ARCHIVED].includes(inv.status as InvoiceStatus)
      );
    });
  },

  getInvoicesByCustomer: (customerId) => {
    return get().invoices.filter((inv) => inv.customerId === customerId);
  },

  getTotalRevenue: () => {
    return get().invoices
        .filter((inv) => ![InvoiceStatus.DRAFT, InvoiceStatus.CANCELLED].includes(inv.status as InvoiceStatus))
        .reduce((sum, inv) => sum + inv.total, 0);
  },

  getTotalOutstanding: () => {
    return get().invoices
        .filter((inv) => ![InvoiceStatus.PAID, InvoiceStatus.CANCELLED, InvoiceStatus.ARCHIVED].includes(inv.status as InvoiceStatus))
        .reduce((sum, inv) => sum + inv.outstandingAmount, 0);
  },

  generateInvoiceNumber: () => {
    const year = new Date().getFullYear();
    const invoices = get().invoices;
    const currentYearInvoices = invoices.filter((inv) =>
      inv.invoiceNumber?.startsWith(`INV-${year}`)
    );
    const nextNumber = currentYearInvoices.length + 1;
    return `INV-${year}-${String(nextNumber).padStart(5, '0')}`;
  },
    }),
    {
      name: 'primebalance-invoices',
      partialize: (state) => ({
        selectedIds: state.selectedIds,
        filters: state.filters,
      }),
    }
  )
);