export interface Merchant {
  id: string;
  name?: string;
  // ...other fields
}

// Transaction types
export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  currency: Currency
  type: 'income' | 'expense' | 'transfer'
  category: string
  account: string
  status: 'pending' | 'completed' | 'failed'
  tags: string[]
  receipt?: Receipt
  tokenized?: boolean
  txHash?: string
  createdAt: string
  updatedAt: string
    merchant?: Merchant | null; // Add this
}

export interface Receipt {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  uploadedAt: string
  ocrData?: OCRData
  verified: boolean
}

export interface OCRData {
  vendor: string
  date: string
  total: number
  currency: string
  items: ReceiptItem[]
  taxAmount?: number
  confidence: number
}

export interface ReceiptItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

// Account types
export interface Account {
  id: string
  name: string
  accountNumber: string
  type: AccountType
  balance: number
  currency: Currency
  parentId?: string
  children?: Account[]
  isActive: boolean
  description?: string
  createdAt: string
}

export type AccountType = 
  | 'asset' 
  | 'liability' 
  | 'equity' 
  | 'revenue' 
  | 'expense' 
  | 'bank' 
  | 'crypto'

// Currency types
export type Currency = 
  | 'USD' 
  | 'EUR' 
  | 'GBP' 
  | 'CHF' 
  | 'BTC' 
  | 'ETH' 
  | 'USDC' 
  | 'USDT' 
  | 'SOL'

export interface CryptoToken {
  symbol: string
  name: string
  balance: number
  usdValue: number
  change24h: number
  price?: number
  address?: string
  network: 'ethereum' | 'polygon' | 'solana' | 'arbitrum'
}

// Wallet types
export interface Wallet {
  id: string
  name: string
  address: string
  network: 'ethereum' | 'polygon' | 'solana' | 'arbitrum'
  balance: number
  tokens: CryptoToken[]
  isConnected: boolean
  provider?: string
}

// Financial metrics
export interface FinancialMetrics {
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  grossMargin: number
  operatingMargin: number
  cashFlow: number
  accountsReceivable: number
  accountsPayable: number
  currentRatio: number
  quickRatio: number
  debtToEquity: number
  returnOnAssets: number
  returnOnEquity: number
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
    fill?: boolean
  }[]
}

// AI Assistant types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  suggestions?: string[]
  actions?: AIAction[]
}

export interface AIAction {
  type: 'create_transaction' | 'categorize' | 'report' | 'suggestion'
  label: string
  payload: Record<string, unknown>
}

export interface AISuggestion {
  id: string
  type: 'tax_optimization' | 'categorization' | 'anomaly' | 'structure'
  title: string
  description: string
  impact?: string
  priority: 'low' | 'medium' | 'high'
  actions: AIAction[]
}

// User & Settings types
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'owner' | 'admin' | 'accountant' | 'viewer'
  preferences: UserPreferences
  organization: Organization
}

export interface UserPreferences {
  language: string
  timezone: string
  currency: Currency
  dateFormat: string
  theme: 'light' | 'dark' | 'auto'
  notifications: NotificationSettings
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  transactions: boolean
  reports: boolean
  aiSuggestions: boolean
}

export interface Organization {
  id: string
  name: string
  logo?: string
  country: string
  taxId?: string
  industry: string
  fiscalYearEnd: string
  defaultCurrency: Currency
}

// Tax types
export interface TaxJurisdiction {
  id: string
  country: string
  state?: string
  taxRates: TaxRate[]
  filingDeadlines: FilingDeadline[]
}

export interface TaxRate {
  type: 'income' | 'sales' | 'vat' | 'corporate' | 'capital_gains'
  rate: number
  bracket?: { min: number; max: number }
  effectiveDate: string
}

export interface FilingDeadline {
  type: string
  date: string
  description: string
  status: 'upcoming' | 'due_soon' | 'overdue' | 'filed'
}

// Team & Chat types
export interface TeamMember {
  id: string
  user: User
  joinedAt: string
  permissions: string[]
}

export interface ChatRoom {
  id: string
  name: string
  type: 'direct' | 'group' | 'channel'
  participants: User[]
  lastMessage?: ChatMessage
  unreadCount: number
  createdAt: string
}

// Report types
export interface Report {
  id: string
  name: string
  type: ReportType
  period: { start: string; end: string }
  generatedAt: string
  status: 'draft' | 'final'
  downloadUrl?: string
}

export type ReportType = 
  | 'balance_sheet'
  | 'income_statement'
  | 'cash_flow'
  | 'trial_balance'
  | 'general_ledger'
  | 'tax_summary'
  | 'custom'

// Integration types
export interface Integration {
  id: string
  name: string
  type: 'quickbooks' | 'xero' | 'stripe' | 'bank' | 'crypto_exchange'
  status: 'connected' | 'disconnected' | 'error'
  lastSync?: string
  config: Record<string, unknown>
}