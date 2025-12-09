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

const generateMockTransactions = (): Transaction[] => [
  { id: '1', date: '2025-12-06', description: 'Client Payment - Acme Corp', amount: 15000, currency: 'USD', type: 'income', category: 'Sales Revenue', account: 'Business Checking', status: 'completed', tags: ['client'], tokenized: false, createdAt: '2025-12-06T10:00:00Z', updatedAt: '2025-12-06T10:00:00Z' },
  { id: '2', date: '2025-12-05', description: 'AWS Cloud Services', amount: -2340.50, currency: 'USD', type: 'expense', category: 'Cloud Infrastructure', account: 'Business Checking', status: 'completed', tags: ['infrastructure'], tokenized: true, txHash: '0x1234...5678', createdAt: '2025-12-05T14:30:00Z', updatedAt: '2025-12-05T14:30:00Z' },
  { id: '3', date: '2025-12-04', description: 'Freelancer Payment - Design', amount: -3500, currency: 'USD', type: 'expense', category: 'Professional Services', account: 'Business Checking', status: 'pending', tags: ['contractor'], tokenized: false, createdAt: '2025-12-04T09:15:00Z', updatedAt: '2025-12-04T09:15:00Z' },
  { id: '4', date: '2025-12-03', description: 'Subscription Revenue - December', amount: 8750, currency: 'USD', type: 'income', category: 'Subscription Revenue', account: 'Stripe Account', status: 'completed', tags: ['saas'], tokenized: false, createdAt: '2025-12-03T00:00:00Z', updatedAt: '2025-12-03T00:00:00Z' },
  { id: '5', date: '2025-12-02', description: 'Office Supplies', amount: -234.99, currency: 'USD', type: 'expense', category: 'Office Expenses', account: 'Business Credit Card', status: 'completed', tags: ['supplies'], tokenized: false, createdAt: '2025-12-02T16:45:00Z', updatedAt: '2025-12-02T16:45:00Z' },
  { id: '6', date: '2025-12-01', description: 'ETH to USDC Conversion', amount: 5000, currency: 'USDC', type: 'transfer', category: 'Crypto Exchange', account: 'Crypto Wallet', status: 'completed', tags: ['crypto'], tokenized: true, txHash: '0xabcd...efgh', createdAt: '2025-12-01T11:20:00Z', updatedAt: '2025-12-01T11:20:00Z' },
]

const generateMockAccounts = (): Account[] => [
  { id: '1000', name: 'Assets', accountNumber: '1000', type: 'asset', balance: 245000, currency: 'USD', isActive: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: '1100', name: 'Cash & Bank', accountNumber: '1100', type: 'bank', balance: 125000, currency: 'USD', parentId: '1000', isActive: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: '1110', name: 'Business Checking', accountNumber: '1110', type: 'bank', balance: 87500, currency: 'USD', parentId: '1100', isActive: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: '1150', name: 'Crypto Holdings', accountNumber: '1150', type: 'crypto', balance: 45000, currency: 'USD', parentId: '1000', isActive: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: '2000', name: 'Liabilities', accountNumber: '2000', type: 'liability', balance: 35000, currency: 'USD', isActive: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: '3000', name: 'Equity', accountNumber: '3000', type: 'equity', balance: 210000, currency: 'USD', isActive: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: '4000', name: 'Revenue', accountNumber: '4000', type: 'revenue', balance: 156000, currency: 'USD', isActive: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: '5000', name: 'Expenses', accountNumber: '5000', type: 'expense', balance: 45000, currency: 'USD', isActive: true, createdAt: '2025-01-01T00:00:00Z' },
]

const generateMockMetrics = (): FinancialMetrics => ({
  totalRevenue: 156000, totalExpenses: 45000, netIncome: 111000, grossMargin: 0.72, operatingMargin: 0.65,
  cashFlow: 87500, accountsReceivable: 23500, accountsPayable: 15000, currentRatio: 2.4, quickRatio: 1.8,
  debtToEquity: 0.17, returnOnAssets: 0.45, returnOnEquity: 0.53,
})

const generateMockCryptoTokens = (): CryptoToken[] => [
  { symbol: 'ETH', name: 'Ethereum', balance: 12.5, usdValue: 25000, change24h: 2.5, price: 2000, network: 'ethereum' },
  { symbol: 'USDC', name: 'USD Coin', balance: 15000, usdValue: 15000, change24h: 0, price: 1, network: 'ethereum' },
  { symbol: 'SOL', name: 'Solana', balance: 45, usdValue: 5000, change24h: -1.2, price: 111.11, network: 'solana' },
  { symbol: 'USDT', name: 'Tether', balance: 8000, usdValue: 8000, change24h: 0, price: 1, network: 'ethereum' },
  { symbol: 'BTC', name: 'Bitcoin', balance: 0.15, usdValue: 6750, change24h: 1.8, price: 45000, network: 'ethereum' },
]

interface AppState {
  sidebarOpen: boolean
  activeTab: string
  isLoading: boolean
  transactions: Transaction[]
  accounts: Account[]
  wallets: Wallet[]
  metrics: FinancialMetrics
  cryptoTokens: CryptoToken[]
  tokens: CryptoToken[]
  chatMessages: ChatMessage[]
  aiSuggestions: AISuggestion[]
  aiMessages: ChatMessage[]
  isAIProcessing: boolean
  user: User | null
  setSidebarOpen: (open: boolean) => void
  setActiveTab: (tab: string) => void
  setLoading: (loading: boolean) => void
  addTransaction: (transaction: Transaction) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  addAccount: (account: Account) => void
  updateAccount: (id: string, updates: Partial<Account>) => void
  deleteAccount: (id: string) => void
  addChatMessage: (message: ChatMessage) => void
  clearChat: () => void
  setAIProcessing: (processing: boolean) => void
  connectWallet: (wallet: Wallet) => void
  disconnectWallet: (id: string) => void
}

const mockCryptoTokens = generateMockCryptoTokens()

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      activeTab: 'dashboard',
      isLoading: false,
      transactions: generateMockTransactions(),
      accounts: generateMockAccounts(),
      wallets: [],
      metrics: generateMockMetrics(),
      cryptoTokens: mockCryptoTokens,
      tokens: mockCryptoTokens,
      chatMessages: [{
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m your AI accounting assistant. I can help you with bookkeeping, tax optimization, categorizing transactions, and generating reports. How can I help you today?',
        timestamp: new Date().toISOString(),
        suggestions: ['Categorize my recent transactions', 'Show me tax optimization tips', 'Generate a monthly report'],
      }],
      aiMessages: [],
      aiSuggestions: [
        { id: '1', type: 'tax_optimization', title: 'Tax Deduction Opportunity', description: 'Your home office expenses may qualify for additional deductions.', impact: 'Potential savings: $2,400/year', priority: 'high', actions: [{ type: 'suggestion', label: 'Set up tracking', payload: { category: 'home_office' } }] },
        { id: '2', type: 'categorization', title: 'Uncategorized Transactions', description: '5 transactions from the last week need categorization.', priority: 'medium', actions: [{ type: 'categorize', label: 'Review now', payload: { count: 5 } }] },
      ],
      isAIProcessing: false,
      user: { id: '1', email: 'demo@primebalance.app', name: 'Demo User', role: 'owner', preferences: { language: 'en', timezone: 'Europe/Zurich', currency: 'USD', dateFormat: 'DD.MM.YYYY', theme: 'dark', notifications: { email: true, push: true, transactions: true, reports: true, aiSuggestions: true } }, organization: { id: '1', name: 'Demo Company', country: 'CH', industry: 'Technology', fiscalYearEnd: '12-31', defaultCurrency: 'USD' } },
      
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setLoading: (loading) => set({ isLoading: loading }),
      
      addTransaction: (transaction) => set((state) => ({ transactions: [transaction, ...state.transactions] })),
      updateTransaction: (id, updates) => set((state) => ({ transactions: state.transactions.map((t) => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t) })),
      deleteTransaction: (id) => set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) })),
      
      addAccount: (account) => set((state) => ({ accounts: [...state.accounts, account] })),
      updateAccount: (id, updates) => set((state) => ({ accounts: state.accounts.map((a) => a.id === id ? { ...a, ...updates } : a) })),
      deleteAccount: (id) => set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id && a.parentId !== id) })),
      
      addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
      clearChat: () => set({ chatMessages: [{ id: Date.now().toString(), role: 'assistant', content: 'Chat cleared. How can I help you?', timestamp: new Date().toISOString() }] }),
      setAIProcessing: (processing) => set({ isAIProcessing: processing }),
      
      connectWallet: (wallet) => set((state) => ({ wallets: [...state.wallets, wallet] })),
      disconnectWallet: (id) => set((state) => ({ wallets: state.wallets.filter((w) => w.id !== id) })),
    }),
    { name: 'primebalance-storage', partialize: (state) => ({ sidebarOpen: state.sidebarOpen, user: state.user }) }
  )
)