// =============================================================================
// INVOICE STORE - Zustand State Management
// Implements read-only access for Reports/KPIs and full CRUD for operations
// =============================================================================

import { create } from 'zustand';
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
// TYPES
// =============================================================================

interface InvoiceState {
  // Data
  invoices: Invoice[];
  currentInvoice: Invoice | null;
  versions: InvoiceVersion[];
  payments: InvoicePayment[];
  accountingEvents: InvoiceAccountingEvent[];
  statistics: InvoiceStatistics | null;

  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // Filters
  filters: InvoiceFilters;

  // UI State
  loading: boolean;
  error: string | null;
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

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
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

  loading: false,
  error: null,
  selectedIds: [],

  // ==========================================================================
  // FETCH ACTIONS
  // ==========================================================================

  fetchInvoices: async (filters?: InvoiceFilters) => {
    set({ loading: true, error: null });

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
        invoices: data.invoices,
        pagination: data.pagination,
        statistics: data.statistics,
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch invoices',
      });
    }
  },

  fetchInvoice: async (id, options = {}) => {
    set({ loading: true, error: null });

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
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
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
    set({ loading: true, error: null });

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
        loading: false,
      }));

      return result.invoice;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to create invoice',
      });
      return null;
    }
  },

  updateInvoice: async (id, data) => {
    set({ loading: true, error: null });

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
        loading: false,
      }));

      return result.invoice;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to update invoice',
      });
      return null;
    }
  },

  deleteInvoice: async (id) => {
    set({ loading: true, error: null });

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
        loading: false,
      }));

      return true;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to delete invoice',
      });
      return false;
    }
  },

  // ==========================================================================
  // WORKFLOW ACTIONS
  // ==========================================================================

  confirmInvoice: async (id, options = {}) => {
    set({ loading: true, error: null });

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
        loading: false,
      }));

      return true;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to confirm invoice',
      });
      return false;
    }
  },

  sendInvoice: async (id) => {
    set({ loading: true, error: null });

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
        loading: false,
      }));

      return true;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to send invoice',
      });
      return false;
    }
  },

  cancelInvoice: async (id, reason) => {
    set({ loading: true, error: null });

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
        loading: false,
      }));

      return true;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to cancel invoice',
      });
      return false;
    }
  },

  archiveInvoice: async (id) => {
    set({ loading: true, error: null });

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
        loading: false,
      }));

      return true;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to archive invoice',
      });
      return false;
    }
  },

  // ==========================================================================
  // PAYMENT ACTIONS
  // ==========================================================================

  applyPayment: async (id, payment) => {
    set({ loading: true, error: null });

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
        loading: false,
      }));

      return true;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to apply payment',
      });
      return false;
    }
  },

  // ==========================================================================
  // CREATE FROM ORDER
  // ==========================================================================

  createFromOrder: async (orderId, options = {}) => {
    set({ loading: true, error: null });

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
        loading: false,
      }));

      return result.invoice;
    } catch (error) {
      set({
        loading: false,
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
}));