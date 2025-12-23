// src/store/index.ts
// CHANGE: Complete rewrite - API-backed instead of mock data

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { 
  Transaction, 
  Account, 
  Wallet, 
  ChatMessage, 
  User, 
  FinancialMetrics,
  AISuggestion,
  CryptoToken
} from '@/types'

// =============================================================================
// API HELPERS
// =============================================================================

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }
  return res.json()
}

// =============================================================================
// TYPES
// =============================================================================

interface ChatChannel {
  id: string
  name: string
  description?: string
  type: string
  _count?: { messages: number }
}

interface AppState {
  // UI State
  sidebarOpen: boolean
  activeTab: string
  isLoading: boolean
  error: string | null
  
  // Data
  transactions: Transaction[]
  accounts: Account[]
  wallets: Wallet[]
  metrics: FinancialMetrics | null
  cryptoTokens: CryptoToken[]
  
  // Chat
  chatChannels: ChatChannel[]
  activeChannelId: string | null
  channelMessages: Record<string, ChatMessage[]>
  
  // AI Assistant
  aiChatMessages: ChatMessage[]
  aiSuggestions: AISuggestion[]
  isAIProcessing: boolean
  
  // User
  user: User | null
  
  // UI Actions
  setSidebarOpen: (open: boolean) => void
  setActiveTab: (tab: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Transaction actions
  fetchTransactions: () => Promise<void>
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  
  // Account actions
  fetchAccounts: () => Promise<void>
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Promise<Account>
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  
  // Chat channel actions
  fetchChannels: () => Promise<void>
  setActiveChannel: (id: string | null) => void
  createChannel: (name: string, description?: string) => Promise<ChatChannel>
  fetchChannelMessages: (channelId: string) => Promise<void>
  sendChannelMessage: (channelId: string, content: string) => Promise<void>
  
  // AI Chat actions (local, calls AI API separately)
  addAIChatMessage: (message: ChatMessage) => void
  clearAIChat: () => void
  setAIProcessing: (processing: boolean) => void
  
  // Wallet actions (local for now, crypto integration later)
  connectWallet: (wallet: Wallet) => void
  disconnectWallet: (id: string) => void
  
  // Initialize
  initializeStore: () => Promise<void>
}

// =============================================================================
// STORE
// =============================================================================

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ---------------------------------------------------------------------
      // Initial State
      // ---------------------------------------------------------------------
      sidebarOpen: true,
      activeTab: 'dashboard',
      isLoading: false,
      error: null,
      
      transactions: [],
      accounts: [],
      wallets: [],
      metrics: null,
      cryptoTokens: [],
      
      chatChannels: [],
      activeChannelId: null,
      channelMessages: {},
      
      aiChatMessages: [
        {
          id: '1',
          role: 'assistant',
          content: "Hello! I'm your AI accounting assistant. I can help you with bookkeeping, tax optimization, categorizing transactions, and generating reports. How can I help you today?",
          timestamp: new Date().toISOString(),
          suggestions: [
            'Categorize my recent transactions',
            'Show me tax optimization tips',
            'Generate a monthly report',
          ],
        },
      ],
      aiSuggestions: [],
      isAIProcessing: false,
      
      user: null,

      // ---------------------------------------------------------------------
      // UI Actions
      // ---------------------------------------------------------------------
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // ---------------------------------------------------------------------
      // Transaction Actions
      // ---------------------------------------------------------------------
      fetchTransactions: async () => {
        try {
          set({ isLoading: true, error: null })
          const data = await api<{ transactions: Transaction[] }>('/api/transactions')
          set({ transactions: data.transactions })
        } catch (e: any) {
          set({ error: e.message })
        } finally {
          set({ isLoading: false })
        }
      },

      addTransaction: async (transaction) => {
        set({ isLoading: true, error: null })
        try {
          const created = await api<Transaction>('/api/transactions', {
            method: 'POST',
            body: JSON.stringify(transaction),
          })
          set((state) => ({ transactions: [created, ...state.transactions] }))
          return created
        } catch (e: any) {
          set({ error: e.message })
          throw e
        } finally {
          set({ isLoading: false })
        }
      },

      updateTransaction: async (id, updates) => {
        set({ isLoading: true, error: null })
        try {
          const updated = await api<Transaction>(`/api/transactions/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
          })
          set((state) => ({
            transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...updated } : t)),
          }))
        } catch (e: any) {
          set({ error: e.message })
          throw e
        } finally {
          set({ isLoading: false })
        }
      },

      deleteTransaction: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await api(`/api/transactions/${id}`, { method: 'DELETE' })
          set((state) => ({
            transactions: state.transactions.filter((t) => t.id !== id),
          }))
        } catch (e: any) {
          set({ error: e.message })
          throw e
        } finally {
          set({ isLoading: false })
        }
      },

      // ---------------------------------------------------------------------
      // Account Actions
      // ---------------------------------------------------------------------
      fetchAccounts: async () => {
        try {
          set({ isLoading: true, error: null })
          const accounts = await api<Account[]>('/api/accounts')
          set({ accounts })
        } catch (e: any) {
          set({ error: e.message })
        } finally {
          set({ isLoading: false })
        }
      },

      addAccount: async (account) => {
        set({ isLoading: true, error: null })
        try {
          const created = await api<Account>('/api/accounts', {
            method: 'POST',
            body: JSON.stringify(account),
          })
          set((state) => ({ accounts: [...state.accounts, created] }))
          return created
        } catch (e: any) {
          set({ error: e.message })
          throw e
        } finally {
          set({ isLoading: false })
        }
      },

      updateAccount: async (id, updates) => {
        set({ isLoading: true, error: null })
        try {
          const updated = await api<Account>(`/api/accounts/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
          })
          set((state) => ({
            accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...updated } : a)),
          }))
        } catch (e: any) {
          set({ error: e.message })
          throw e
        } finally {
          set({ isLoading: false })
        }
      },

      deleteAccount: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await api(`/api/accounts/${id}`, { method: 'DELETE' })
          set((state) => ({
            accounts: state.accounts.filter((a) => a.id !== id && a.parentId !== id),
          }))
        } catch (e: any) {
          set({ error: e.message })
          throw e
        } finally {
          set({ isLoading: false })
        }
      },

      // ---------------------------------------------------------------------
      // Chat Channel Actions
      // ---------------------------------------------------------------------
      fetchChannels: async () => {
        try {
          const channels = await api<ChatChannel[]>('/api/chat/channels')
          set({ chatChannels: channels })
          // Set first channel as active if none selected
          if (channels.length > 0 && !get().activeChannelId) {
            set({ activeChannelId: channels[0].id })
          }
        } catch (e: any) {
          set({ error: e.message })
        }
      },

      setActiveChannel: (id) => {
        set({ activeChannelId: id })
        if (id) get().fetchChannelMessages(id)
      },

      createChannel: async (name, description) => {
        try {
          const channel = await api<ChatChannel>('/api/chat/channels', {
            method: 'POST',
            body: JSON.stringify({ name, description }),
          })
          set((state) => ({ chatChannels: [...state.chatChannels, channel] }))
          return channel
        } catch (e: any) {
          set({ error: e.message })
          throw e
        }
      },

      fetchChannelMessages: async (channelId) => {
        try {
          const messages = await api<ChatMessage[]>(`/api/chat/channels/${channelId}/messages`)
          set((state) => ({
            channelMessages: { ...state.channelMessages, [channelId]: messages },
          }))
        } catch (e: any) {
          set({ error: e.message })
        }
      },

      sendChannelMessage: async (channelId, content) => {
        try {
          const message = await api<ChatMessage>(`/api/chat/channels/${channelId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content }),
          })
          set((state) => ({
            channelMessages: {
              ...state.channelMessages,
              [channelId]: [...(state.channelMessages[channelId] || []), message],
            },
          }))
        } catch (e: any) {
          set({ error: e.message })
          throw e
        }
      },

      // ---------------------------------------------------------------------
      // AI Chat Actions (local state, AI calls handled separately)
      // ---------------------------------------------------------------------
      addAIChatMessage: (message) =>
        set((state) => ({ aiChatMessages: [...state.aiChatMessages, message] })),

      clearAIChat: () =>
        set({
          aiChatMessages: [
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: 'Chat cleared. How can I help you?',
              timestamp: new Date().toISOString(),
            },
          ],
        }),

      setAIProcessing: (processing) => set({ isAIProcessing: processing }),

      // ---------------------------------------------------------------------
      // Wallet Actions (local for now)
      // ---------------------------------------------------------------------
      connectWallet: (wallet) =>
        set((state) => ({ wallets: [...state.wallets, wallet] })),

      disconnectWallet: (id) =>
        set((state) => ({ wallets: state.wallets.filter((w) => w.id !== id) })),

      // ---------------------------------------------------------------------
      // Initialize Store
      // ---------------------------------------------------------------------
      initializeStore: async () => {
        const { fetchTransactions, fetchAccounts, fetchChannels } = get()
        set({ isLoading: true })
        try {
          await Promise.all([
            fetchTransactions(),
            fetchAccounts(),
            fetchChannels(),
          ])
        } catch (e: any) {
          set({ error: e.message })
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'primebalance-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        activeChannelId: state.activeChannelId,
      }),
    }
  )
)

// =============================================================================
// COMPUTED SELECTORS
// =============================================================================

export const useTransactions = () => useStore((s) => s.transactions)
export const useAccounts = () => useStore((s) => s.accounts)
export const useActiveChannelMessages = () => {
  const activeChannelId = useStore((s) => s.activeChannelId)
  const channelMessages = useStore((s) => s.channelMessages)
  return activeChannelId ? channelMessages[activeChannelId] || [] : []
}

export { useOrderStore } from './order-store'
export { useArchiveStore } from './archive-store'
export { useLiabilitiesStore } from './liabilities-store'
export { useInventoryStore } from './inventory-store'
export { useReceivablesStore } from './receivables-store'
export { useTreasuryStore } from './treasury-store'
export { useReportStore } from './report-store'
export { usePeriodCloseStore } from './period-close-store'
export { useCustomersStore } from './customers-store';
export { useSuppliersStore } from './suppliers-store';
export { useNettingStore } from './netting-store';
export * from './netting-store';
export * from './investor-store';
export * from './fx-store';