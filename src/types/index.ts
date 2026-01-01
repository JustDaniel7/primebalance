export interface Merchant {
  id: string
  name: string
  category?: string
  taxId?: string
  address?: string
  city?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

// Transaction types
export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  currency: string
  type: 'income' | 'expense' | 'transfer'
  category: string | 'uncategorized'
  accountId: string
  account?: Account
  status: 'pending' | 'completed' | 'failed'
  tags: string[]
  receipt?: Receipt
  tokenized?: boolean
  txHash?: string
  createdAt: string
  updatedAt: string
  merchant?: Merchant | null
  organizationId: string
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

export interface TeamChatMessage {
  id: string
  content: string
  channelId: string
  userId: string
  user: {
    id: string
    name: string | null
    image: string | null
  }
  createdAt: string
  updatedAt: string
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

// export order members at top level
export * from './order'

// export receivables under a namespace to avoid duplicate top-level symbols like EventActor
export * as Receivables from './receivables'

// Archive module - explicit exports to avoid conflicts with liabilities
export {
  // Enums
  ArchiveObjectType,
  ArchiveCategory,
  ArchiveTriggerType,
  ArchiveStatus,
  ArchiveLinkType,
  ArchiveLinkDirection,
  ValidationMode as ArchiveValidationMode,
  RetentionStatus,
  ExceptionStatus as ArchiveExceptionStatus,
  ExceptionType as ArchiveExceptionType,
  ExportFormat as ArchiveExportFormat,
  ExportType as ArchiveExportType,
  ImportMode as ArchiveImportMode,
  ImportSource as ArchiveImportSource,
  AccessType,
  ActorType,
  ActorRole,
  AutomationAction,
  // Interfaces
  type ArchiveRecord,
  type ArchiveLink,
  type LinkageGraph,
  type ArchiveVersion,
  type VersionChain,
  type ArchiveAccessLog,
  type ArchiveRetentionPolicy,
  type ArchiveExport,
  type ChainOfCustody,
  type ArchiveImportBatch,
  type ImportError as ArchiveImportError,
  type ImportWarning as ArchiveImportWarning,
  type ArchiveAutomationRule,
  type ArchiveException,
  type ArchiveSavedView,
  type ArchiveAttachment,
  type ArchiveFilters,
  type ArchiveSearchRequest,
  type ArchiveReconstructRequest,
  type ArchiveStatistics,
  type ArchivePagination,
  type CreateArchiveRequest,
  type CreateArchiveLinkRequest,
  type CreateExportRequest,
  type ImportArchiveRequest,
  type SetLegalHoldRequest,
  type RemoveLegalHoldRequest,
  type ArchiveListResponse,
  type ArchiveDetailResponse,
  type ReconstructionResponse,
  // Functions
  generateArchiveRecordId,
  generateContentHash,
  isArchivableObjectType,
  getDefaultRetentionYears,
  calculateRetentionEndDate,
  isWithinRetention,
  getCategoryFromObjectType,
  validateArchiveIntegrity,
  // Constants
  ARCHIVE_OBJECT_TYPES,
  ARCHIVE_CATEGORIES,
  ARCHIVE_TRIGGER_TYPES,
  ARCHIVE_LINK_TYPES,
  ARCHIVE_EXPORT_FORMATS,
  DEFAULT_RETENTION_YEARS,
  RETENTION_WARNING_DAYS,
  MAX_EXPORT_RECORDS,
  CONFIDENCE_AUTO_ARCHIVE_THRESHOLD,
  CONFIDENCE_PROPOSAL_THRESHOLD as ARCHIVE_CONFIDENCE_PROPOSAL_THRESHOLD,
  CONFIDENCE_EXCEPTION_THRESHOLD as ARCHIVE_CONFIDENCE_EXCEPTION_THRESHOLD,
  RETENTION_BY_JURISDICTION,
  ARCHIVE_LABELS,
} from './archive'

// Liabilities module - explicit exports to avoid conflicts with archive
export {
  // Enums
  LiabilityPrimaryClass,
  LiabilityStatus,
  LiabilityEventType,
  PaymentStatus,
  InterestType,
  InterestCompounding,
  DayCountBasis,
  AmortizationMethod,
  PaymentFrequency,
  CounterpartyType,
  RiskLevel,
  CovenantType,
  CovenantStatus,
  SettlementType,
  AccrualType,
  ValidationMode as LiabilityValidationMode,
  SourceType,
  ImportSource as LiabilityImportSource,
  ImportMode as LiabilityImportMode,
  ExceptionType as LiabilityExceptionType,
  ExceptionStatus as LiabilityExceptionStatus,
  AutomationActionType,
  // Interfaces
  type Liability,
  type FxRateSnapshot,
  type InterestScheduleEntry,
  type PaymentScheduleEntry,
  type Covenant as LiabilityCovenant,
  type ApprovalChainEntry,
  type Attachment as LiabilityAttachment,
  type LiabilityEvent,
  type LiabilityPayment,
  type LiabilitySettlement,
  type LiabilityAccrual,
  type LiabilityCovenantCheck,
  type LiabilityImportBatch,
  type ImportError as LiabilityImportError,
  type ImportWarning as LiabilityImportWarning,
  type LiabilityAutomationRule,
  type LiabilityException,
  type LiabilitySavedView,
  type LiabilityFilters,
  type LiabilityPagination,
  type LiabilityStatistics,
  type CreateLiabilityRequest,
  type RecognizeLiabilityRequest,
  type ActivateLiabilityRequest,
  type SettleLiabilityRequest,
  type ReverseLiabilityRequest,
  type DisputeLiabilityRequest,
  type ResolveDisputeRequest,
  type DefaultLiabilityRequest,
  type WriteOffLiabilityRequest,
  type RestructureLiabilityRequest,
  type AccrueInterestRequest,
  type ApplyFeeRequest,
  type SchedulePaymentRequest,
  type ExecutePaymentRequest,
  type ApprovePaymentRequest,
  type CheckCovenantRequest,
  type ImportLiabilitiesRequest,
  type LiabilityListResponse,
  type LiabilityDetailResponse,
  type TimeTravResponse,
  // Functions
  canTransitionTo,
  isLiabilityEditable,
  isLiabilitySettleable,
  isLiabilityDisputable,
  isLiabilityWriteOffable,
  generateLiabilityId,
  generateEventId,
  calculateInterest,
  calculateTotalOutstanding,
  getAgingBucket,
  calculateRiskLevel,
  // Constants
  LIABILITY_STATUS_TRANSITIONS,
  LIABILITY_PRIMARY_CLASSES,
  LIABILITY_STATUSES,
  LIABILITY_EVENT_TYPES,
  PAYMENT_STATUSES,
  RISK_LEVELS,
  INTEREST_TYPES,
  PAYMENT_FREQUENCIES,
  DEFAULT_INTEREST_DAY_COUNT,
  DEFAULT_INTEREST_COMPOUNDING,
  CONFIDENCE_AUTO_THRESHOLD,
  CONFIDENCE_PROPOSAL_THRESHOLD as LIABILITY_CONFIDENCE_PROPOSAL_THRESHOLD,
  CONFIDENCE_EXCEPTION_THRESHOLD as LIABILITY_CONFIDENCE_EXCEPTION_THRESHOLD,
  LIABILITY_LABELS,
} from './liabilities'
export * from './inventory'

// Note: removed `type ReportType` here to avoid conflict with the local ReportType declared above
export {
  type ReportCategory,
  type ReportStatus,
  type ReportVisibility,
  type TimeGrain,
  type CurrencyView,
  type ExportFormat,
  type ScheduleFrequency,
  type ReportFilter,
  type ReportDimension,
  type ReportMeasure,
  type ComputedMeasure,
  type QuerySpec,
  type FormattingRules,
  type ReconciliationPolicy,
  type JurisdictionSettings,
  type ReportDefinition,
  type ReportSnapshot,
  type ReportSchedule,
  type ReportWizardState,
  type WizardStep,
  type ValidationResult,
  type DrilldownRequest,
  type DrilldownResponse,
  DEFAULT_AGING_BUCKETS,
  REPORT_TEMPLATES,
  REPORT_CATEGORIES,
} from './report'

export {
  type TreasuryDecisionStatus,
  type TreasuryDecisionType,
  type CashClassification,
  type CapitalBucketType,
  type RiskLevel as TreasuryRiskLevel,
  type Priority,
  type ExecutionMode,
  type TimeHorizon,
  type Jurisdiction,
  type ComplianceFramework,
  type BankAccount,
  type CashPosition,
  type CapitalBucket,
  type CreditFacility,
  type Covenant,
  type TreasuryDecision,
  type TreasuryPlan,
  type TreasuryPlanStep,
  type RiskDelta,
  type AlternativeOption,
  type ComplianceCheck,
  type TreasuryEventType,
  type TreasuryEvent,
  type RiskExposure,
  type RiskBreach,
  type ScenarioType,
  type TreasuryScenario,
  type ScenarioResult,
  type NettingOpportunity,
  type TreasurySummary,
  VALID_DECISION_TRANSITIONS,
  TERMINAL_STATES,
} from './treasury'
export * from './project'
export * from './period-close'
export * from './suppliers';
export * from './customers';
export * from './netting';
export * from './investor';
export * from './fx';
export * from './offers';
export * from './liquidity';
export * from './taskcenter';
export * from './forecast';
export * from './scenarios';
export * from './kpis';

// Receipt module types - use ReceiptModule namespace to avoid conflict with inline Receipt
export * as ReceiptModule from './receipt';