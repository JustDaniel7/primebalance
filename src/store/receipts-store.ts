// src/store/receipts-store.ts
import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface Receipt {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  transactionId: string | null;
  vendor: string | null;
  amount: number | null;
  date: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  transaction?: {
    id: string;
    description: string;
    amount: number;
  } | null;
}

interface ReceiptsState {
  receipts: Receipt[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Fetch
  fetchReceipts: (unlinkedOnly?: boolean) => Promise<void>;

  // CRUD
  uploadReceipt: (data: Partial<Receipt>) => Promise<Receipt | null>;
  deleteReceipt: (id: string) => Promise<void>;
  linkToTransaction: (receiptId: string, transactionId: string) => Promise<void>;

  // UI
  clearError: () => void;

  // Computed
  getUnlinkedReceipts: () => Receipt[];
  getLinkedReceipts: () => Receipt[];
}

// =============================================================================
// STORE
// =============================================================================

export const useReceiptsStore = create<ReceiptsState>()((set, get) => ({
  receipts: [],
  isLoading: false,
  isInitialized: false,
  error: null,

  // =====================================================================
  // FETCH
  // =====================================================================

  fetchReceipts: async (unlinkedOnly = false) => {
    set({ isLoading: true, error: null });
    try {
      const url = unlinkedOnly ? '/api/receipts?unlinked=true' : '/api/receipts';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch receipts');
      const data = await res.json();
      set({ receipts: data, isLoading: false, isInitialized: true });
    } catch (error) {
      console.error('fetchReceipts error:', error);
      set({ error: (error as Error).message, isLoading: false, isInitialized: true });
    }
  },

  // =====================================================================
  // CRUD
  // =====================================================================

  uploadReceipt: async (data) => {
    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to upload receipt');
      }
      const receipt = await res.json();
      set((state) => ({ receipts: [receipt, ...state.receipts] }));
      return receipt;
    } catch (error) {
      console.error('uploadReceipt error:', error);
      set({ error: (error as Error).message });
      return null;
    }
  },

  deleteReceipt: async (id) => {
    set((state) => ({
      receipts: state.receipts.filter((r) => r.id !== id),
    }));

    try {
      await fetch(`/api/receipts/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('deleteReceipt error:', error);
    }
  },

  linkToTransaction: async (receiptId, transactionId) => {
    set((state) => ({
      receipts: state.receipts.map((r) =>
        r.id === receiptId ? { ...r, transactionId } : r
      ),
    }));

    try {
      await fetch(`/api/receipts/${receiptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      });
    } catch (error) {
      console.error('linkToTransaction error:', error);
    }
  },

  // =====================================================================
  // UI
  // =====================================================================

  clearError: () => set({ error: null }),

  // =====================================================================
  // COMPUTED
  // =====================================================================

  getUnlinkedReceipts: () => {
    return get().receipts.filter((r) => !r.transactionId);
  },

  getLinkedReceipts: () => {
    return get().receipts.filter((r) => r.transactionId);
  },
}));
