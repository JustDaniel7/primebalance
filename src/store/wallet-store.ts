// src/store/wallet-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface Wallet {
  id: string;
  name: string;
  address: string;
  network: string;
  provider?: string;
  isActive: boolean;
  isWatching: boolean;
  walletType: string;
  purpose: string;
  nativeBalance: number;
  nativeSymbol: string;
  totalValueUsd: number;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  ens?: string;
  avatar?: string;
  notes?: string;
  tags: string[];
  isDefault: boolean;
  tokens: WalletToken[];
  _count?: { transactions: number };
  createdAt: string;
  updatedAt: string;
}

export interface WalletToken {
  id: string;
  contractAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
  balance: number;
  balanceUsd: number;
  priceUsd: number;
  price24hChange?: number;
  tokenType: string;
  isHidden: boolean;
  isSpam: boolean;
}

export interface WalletTransaction {
  id: string;
  hash: string;
  blockNumber?: number;
  network: string;
  type: string;
  status: string;
  fromAddress: string;
  toAddress?: string;
  isIncoming: boolean;
  value: number;
  valueUsd?: number;
  tokenSymbol?: string;
  tokenAddress?: string;
  gasUsed?: number;
  gasPrice?: number;
  gasCostUsd?: number;
  timestamp: string;
  methodName?: string;
  description?: string;
  notes?: string;
  tags: string[];
}

export interface WalletSummary {
  totalWallets: number;
  totalValueUsd: number;
  byNetwork: Record<string, number>;
  byPurpose: Record<string, number>;
  topTokens: Array<{ symbol: string; balanceUsd: number; network: string }>;
  recentTransactions: WalletTransaction[];
}

interface WalletState {
  wallets: Wallet[];
  selectedWalletId: string | null;
  summary: WalletSummary | null;
  isLoading: boolean;
  isSyncing: string | null; // wallet id being synced
  error: string | null;
  isInitialized: boolean;

  // Network filter
  networkFilter: string | null;

  // Fetch
  fetchWallets: () => Promise<void>;
  fetchWallet: (id: string) => Promise<Wallet | null>;
  fetchSummary: () => Promise<void>;
  fetchTransactions: (walletId: string) => Promise<WalletTransaction[]>;

  // CRUD
  addWallet: (data: Partial<Wallet>) => Promise<Wallet | null>;
  updateWallet: (id: string, updates: Partial<Wallet>) => Promise<void>;
  removeWallet: (id: string) => Promise<void>;

  // Sync
  syncWallet: (id: string) => Promise<void>;
  syncAllWallets: () => Promise<void>;

  // Actions
  setDefault: (id: string) => Promise<void>;
  hideToken: (walletId: string, tokenAddress: string) => Promise<void>;

  // UI
  selectWallet: (id: string | null) => void;
  setNetworkFilter: (network: string | null) => void;
  clearError: () => void;

  // Computed
  getWalletsByNetwork: (network: string) => Wallet[];
  getDefaultWallet: () => Wallet | undefined;
  getTotalValueUsd: () => number;
}

// =============================================================================
// STORE
// =============================================================================

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallets: [],
      selectedWalletId: null,
      summary: null,
      isLoading: false,
      isSyncing: null,
      error: null,
      isInitialized: false,
      networkFilter: null,

      // =====================================================================
      // FETCH
      // =====================================================================

      fetchWallets: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/wallets');
          if (!res.ok) throw new Error('Failed to fetch wallets');
          const data = await res.json();
          set({
            wallets: data.wallets || [],
            isLoading: false,
            isInitialized: true,
          });
        } catch (error) {
          console.error('fetchWallets error:', error);
          set({ error: (error as Error).message, isLoading: false, isInitialized: true });
        }
      },

      fetchWallet: async (id) => {
        try {
          const res = await fetch(`/api/wallets/${id}`);
          if (!res.ok) return null;
          const wallet = await res.json();
          set((state) => ({
            wallets: state.wallets.map((w) => (w.id === id ? wallet : w)),
          }));
          return wallet;
        } catch (error) {
          console.error('fetchWallet error:', error);
          return null;
        }
      },

      fetchSummary: async () => {
        try {
          const res = await fetch('/api/wallets/summary');
          if (!res.ok) throw new Error('Failed to fetch summary');
          const summary = await res.json();
          set({ summary });
        } catch (error) {
          console.error('fetchSummary error:', error);
        }
      },

      fetchTransactions: async (walletId) => {
        try {
          const res = await fetch(`/api/wallets/${walletId}/transactions`);
          if (!res.ok) return [];
          const data = await res.json();
          return data.transactions || [];
        } catch (error) {
          console.error('fetchTransactions error:', error);
          return [];
        }
      },

      // =====================================================================
      // CRUD
      // =====================================================================

      addWallet: async (data) => {
        try {
          const res = await fetch('/api/wallets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to add wallet');
          }
          const wallet = await res.json();
          set((state) => ({ wallets: [...state.wallets, { ...wallet, tokens: [] }] }));
          return wallet;
        } catch (error) {
          console.error('addWallet error:', error);
          set({ error: (error as Error).message });
          return null;
        }
      },

      updateWallet: async (id, updates) => {
        // Optimistic update
        set((state) => ({
          wallets: state.wallets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        }));

        try {
          await fetch(`/api/wallets/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
        } catch (error) {
          console.error('updateWallet error:', error);
        }
      },

      removeWallet: async (id) => {
        set((state) => ({
          wallets: state.wallets.filter((w) => w.id !== id),
          selectedWalletId: state.selectedWalletId === id ? null : state.selectedWalletId,
        }));

        try {
          await fetch(`/api/wallets/${id}`, { method: 'DELETE' });
        } catch (error) {
          console.error('removeWallet error:', error);
        }
      },

      // =====================================================================
      // SYNC
      // =====================================================================

      syncWallet: async (id) => {
        set({ isSyncing: id });
        try {
          const res = await fetch(`/api/wallets/${id}/sync`, { method: 'POST' });
          if (!res.ok) throw new Error('Sync failed');
          const wallet = await res.json();
          set((state) => ({
            wallets: state.wallets.map((w) => (w.id === id ? wallet : w)),
            isSyncing: null,
          }));
        } catch (error) {
          console.error('syncWallet error:', error);
          set({ isSyncing: null, error: (error as Error).message });
        }
      },

      syncAllWallets: async () => {
        const { wallets, syncWallet } = get();
        for (const wallet of wallets.filter((w) => w.isActive)) {
          await syncWallet(wallet.id);
        }
      },

      // =====================================================================
      // ACTIONS
      // =====================================================================

      setDefault: async (id) => {
        set((state) => ({
          wallets: state.wallets.map((w) => ({
            ...w,
            isDefault: w.id === id,
          })),
        }));

        await fetch(`/api/wallets/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isDefault: true }),
        });
      },

      hideToken: async (walletId, tokenAddress) => {
        set((state) => ({
          wallets: state.wallets.map((w) =>
            w.id === walletId
              ? {
                  ...w,
                  tokens: w.tokens.map((t) =>
                    t.contractAddress === tokenAddress ? { ...t, isHidden: true } : t
                  ),
                }
              : w
          ),
        }));
      },

      // =====================================================================
      // UI
      // =====================================================================

      selectWallet: (id) => set({ selectedWalletId: id }),
      setNetworkFilter: (network) => set({ networkFilter: network }),
      clearError: () => set({ error: null }),

      // =====================================================================
      // COMPUTED
      // =====================================================================

      getWalletsByNetwork: (network) => {
        return get().wallets.filter((w) => w.network === network);
      },

      getDefaultWallet: () => {
        return get().wallets.find((w) => w.isDefault);
      },

      getTotalValueUsd: () => {
        return get().wallets.reduce((sum, w) => sum + (w.totalValueUsd || 0), 0);
      },
    }),
    {
      name: 'wallet-store',
      partialize: (state) => ({
        selectedWalletId: state.selectedWalletId,
        networkFilter: state.networkFilter,
      }),
    }
  )
);