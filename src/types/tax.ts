// =============================================================================
// PRIMEBALANCE - COMPREHENSIVE TAX SYSTEM TYPES
// =============================================================================

// -----------------------------------------------------------------------------
// ENUMS
// -----------------------------------------------------------------------------

export enum EntityType {
  PARENT = 'PARENT',
  HOLDING = 'HOLDING',
  OPERATING_COMPANY = 'OPERATING_COMPANY',
  SUBSIDIARY = 'SUBSIDIARY',
  PERMANENT_ESTABLISHMENT = 'PERMANENT_ESTABLISHMENT',
  BRANCH = 'BRANCH',
  REPRESENTATIVE_OFFICE = 'REPRESENTATIVE_OFFICE',
  JOINT_VENTURE = 'JOINT_VENTURE',
  // Additional types for corporate-structure compatibility
  CORPORATION = 'CORPORATION',
  IP_HOLDING = 'IP_HOLDING',
}

export enum EntityFunction {
  MANAGEMENT = 'MANAGEMENT',
  SALES = 'SALES',
  MARKETING = 'MARKETING',
  DISTRIBUTION = 'DISTRIBUTION',
  RD = 'RD',
  MANUFACTURING = 'MANUFACTURING',
  SHARED_SERVICES = 'SHARED_SERVICES',
  IP_LICENSING = 'IP_LICENSING',
  IP_DEVELOPMENT = 'IP_DEVELOPMENT',
  FINANCING = 'FINANCING',
  PROCUREMENT = 'PROCUREMENT',
}

export enum EntityRisk {
  MARKET_RISK = 'MARKET_RISK',
  OPERATIONAL_RISK = 'OPERATIONAL_RISK',
  INVENTORY_RISK = 'INVENTORY_RISK',
  CREDIT_RISK = 'CREDIT_RISK',
  CURRENCY_RISK = 'CURRENCY_RISK',
  DEVELOPMENT_RISK = 'DEVELOPMENT_RISK',
  WARRANTY_RISK = 'WARRANTY_RISK',
  FINANCIAL_RISK = 'FINANCIAL_RISK',
}

export enum EntityAssetType {
  TANGIBLE_ASSETS = 'TANGIBLE_ASSETS',
  RECEIVABLES = 'RECEIVABLES',
  INVENTORY = 'INVENTORY',
  IP_SOFTWARE = 'IP_SOFTWARE',
  IP_PATENTS = 'IP_PATENTS',
  IP_TRADEMARKS = 'IP_TRADEMARKS',
  IP_KNOW_HOW = 'IP_KNOW_HOW',
  FINANCIAL_ASSETS = 'FINANCIAL_ASSETS',
}

export enum OptimizationType {
  HOLDING_COMPANY = 'HOLDING_COMPANY',
  IP_MIGRATION = 'IP_MIGRATION',
  STRUCTURE_REORGANIZATION = 'STRUCTURE_REORGANIZATION',
  WITHHOLDING_REDUCTION = 'WITHHOLDING_REDUCTION',
  TRANSFER_PRICING = 'TRANSFER_PRICING',
  FINANCING = 'FINANCING',
  TREATY_SHOPPING = 'TREATY_SHOPPING',
}

export enum PEType {
  FIXED_PLACE = 'FIXED_PLACE',
  SERVICE_PE = 'SERVICE_PE',
  AGENCY_PE = 'AGENCY_PE',
  CONSTRUCTION_PE = 'CONSTRUCTION_PE',
}

export enum TransactionType {
  REGULAR = 'REGULAR',
  INTERCOMPANY = 'INTERCOMPANY',
  DIVIDEND = 'DIVIDEND',
  ROYALTY = 'ROYALTY',
  INTEREST = 'INTEREST',
  SERVICE_FEE = 'SERVICE_FEE',
  MANAGEMENT_FEE = 'MANAGEMENT_FEE',
  LICENSE_FEE = 'LICENSE_FEE',
}

export enum IncomeType {
  BUSINESS_INCOME = 'BUSINESS_INCOME',
  PASSIVE_INCOME = 'PASSIVE_INCOME',
  CAPITAL_GAINS = 'CAPITAL_GAINS',
  DIVIDENDS = 'DIVIDENDS',
  INTEREST = 'INTEREST',
  ROYALTIES = 'ROYALTIES',
  RENTAL_INCOME = 'RENTAL_INCOME',
}

export enum TransferPricingMethod {
  CUP = 'CUP', // Comparable Uncontrolled Price
  RPM = 'RPM', // Resale Price Method
  CPM = 'CPM', // Cost Plus Method
  TNMM = 'TNMM', // Transactional Net Margin Method
  PSM = 'PSM', // Profit Split Method
}

export enum FilingFrequency {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUALLY = 'SEMI_ANNUALLY',
  ANNUALLY = 'ANNUALLY',
}

export enum JurisdictionType {
  US_STATE = 'US_STATE',
  US_TERRITORY = 'US_TERRITORY',
  US_FEDERAL = 'US_FEDERAL',
  COUNTRY = 'COUNTRY',
  SPECIAL_ZONE = 'SPECIAL_ZONE',
  SWISS_CANTON = 'SWISS_CANTON',
}

// -----------------------------------------------------------------------------
// CORPORATE STRUCTURE TYPES
// -----------------------------------------------------------------------------

export interface OwnershipStake {
  id: string;
  parentEntityId: string;
  childEntityId: string;
  ownershipPercentage: number; // 0-100
  votingRightsPercentage: number; // 0-100
  acquisitionDate: string;
  acquisitionCost?: number;
  currency: string;
}

export interface CorporateEntity {
  id: string;
  name: string;
  legalName: string;
  type: EntityType;
  jurisdictionCode: string;
  registrationNumber?: string;
  taxId?: string;
  vatId?: string;
  incorporationDate?: string;
  fiscalYearEnd: string; // MM-DD format
  functionalCurrency: string;
  parentEntityId?: string | null;
  ownershipPercentage?: number; // Direct ownership by parent
  votingRights?: number;
  isConsolidated: boolean;
  isPermanentEstablishment: boolean;
  peOfEntityId?: string; // If PE, which entity is it a PE of
  address?: EntityAddress;
  contacts?: EntityContact[];
  bankAccounts?: string[]; // Account IDs
  status: 'ACTIVE' | 'DORMANT' | 'LIQUIDATING' | 'DISSOLVED';
  createdAt: string;
  updatedAt: string;
  
  // Additional fields for corporate structure management
  annualRevenue?: number;
  annualProfit?: number;
  employees?: number;
  assets?: number;
  functions?: string[]; // EntityFunction values as strings
  risks?: string[]; // EntityRisk values as strings
  assetTypes?: string[]; // EntityAssetType values as strings
  isHoldingCompany?: boolean;
  isProfitCenter?: boolean;
  isActive?: boolean;
}

export interface EntityAddress {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface EntityContact {
  name: string;
  role: string;
  email: string;
  phone?: string;
}

export interface CorporateStructure {
  id: string;
  name: string;
  entities: CorporateEntity[];
  ownershipStakes: OwnershipStake[];
  ultimateParentId: string;
  createdAt: string;
  updatedAt: string;
}

// Permanent Establishment interface for corporate-structure store
export interface PermanentEstablishment {
  id: string;
  entityId: string;
  name: string;
  jurisdiction: string;
  type: PEType | string;
  startDate: string;
  endDate?: string;
  activities: string[];
  employees?: number;
  profitAttributionMethod?: 'AOA' | 'FORMULA' | 'OTHER';
  attributedProfit?: number;
  isActive: boolean;
}

// Tax Calculation interface for entity-level tax computations
export interface TaxCalculation {
  entityId: string;
  jurisdictionCode: string;
  fiscalYear: string;
  grossRevenue: number;
  deductions: TaxDeduction[];
  taxableIncome: number;
  corporateTax: number;
  localTaxes: number;
  withholdingTaxes: number;
  totalTax: number;
  effectiveTaxRate: number;
  foreignTaxCredits: number;
  otherCredits: number;
  netTaxPayable: number;
  status: 'estimated' | 'filed' | 'assessed' | 'paid';
  calculatedAt: string;
}

export interface TaxDeduction {
  type: string;
  description: string;
  amount: number;
  limitApplied?: boolean;
  limitAmount?: number;
}

// -----------------------------------------------------------------------------
// TAX JURISDICTION TYPES
// -----------------------------------------------------------------------------

export interface TaxBracket {
  minIncome: number;
  maxIncome?: number | null; // null or undefined = unlimited
  rate: number; // Percentage
  fixedAmount?: number; // Some jurisdictions have fixed + percentage
  description?: string; // Optional description
}

export interface CorporateTaxRate {
  standardRate: number;
  brackets?: TaxBracket[];
  smallBusinessRate?: number;
  smallBusinessThreshold?: number;
  qualifiedDividendRate?: number;
  capitalGainsRate?: number;
  effectiveDate: string;
  notes?: string;
}

export interface WithholdingTaxRates {
  dividends: number;
  interest: number;
  royalties: number;
  technicalServices?: number;
  managementFees?: number;
  otherServices?: number;
}

export interface DTAPartner {
  partnerJurisdictionCode: string;
  partnerJurisdictionName: string;
  treatyYear: number;
  dividendsRate: number;
  dividendsParticipationRate?: number; // Reduced rate for substantial holdings
  participationThreshold?: number; // % ownership required for reduced rate
  interestRate: number;
  royaltiesRate: number;
  technicalServicesRate?: number;
  capitalGainsExempt?: boolean;
  peDefinition?: string;
  limitationOnBenefits?: boolean;
  mliBeneficiary?: boolean; // Multilateral Instrument
  isMLIBeneficiary?: boolean; // Alias for mliBeneficiary
  notes?: string;
}

export interface TransferPricingRules {
  hasRules?: boolean; // Whether the jurisdiction has TP rules
  documentationRequired: boolean;
  documentationThreshold?: number; // Revenue threshold for documentation
  masterFileRequired: boolean;
  localFileRequired: boolean;
  cbcReportingRequired: boolean; // Country-by-Country Reporting
  cbcThreshold?: number;
  preferredMethods: TransferPricingMethod[];
  advancePricingAgreements: boolean;
  penaltyRate?: number; // Penalty for non-compliance
  notes?: string;
}

export interface FilingRequirement {
  filingType?: string;
  type?: string; // Alias for filingType
  frequency: FilingFrequency;
  dueDate: string; // Description like "15th of following month"
  dueDaysAfterYearEnd?: number;
  extensionAvailable?: boolean;
  extensionDays?: number;
  electronicFilingRequired?: boolean;
  estimatedPaymentsRequired?: boolean;
  estimatedPaymentSchedule?: string;
  // Additional fields for flexibility
  sinceDate?: string;
  sinceAmount?: number;
  sinceTransactionCount?: number;
  sinceDocumentCount?: number;
  sinceNotes?: string;
  sinceAttachments?: string[];
  sinceLinks?: string[];
  sinceTags?: string[];
}

export interface TaxJurisdictionFull {
  code: string;
  name: string;
  shortName?: string;
  type: JurisdictionType;
  parentJurisdiction?: string; // e.g., US-CA has parent US-FED
  currency: string;
  language: string | string[];
  flag?: string;
  
  // Tax Rates
  corporateTax: CorporateTaxRate;
  withholdingTax: WithholdingTaxRates;
  
  // International
  dtaPartners: DTAPartner[];
  transferPricingRules: TransferPricingRules;
  
  // Compliance
  filingRequirements: FilingRequirement[];
  
  // Special Features
  noIncomeTax?: boolean;
  territorialSystem?: boolean; // Only taxes domestic income
  cfcRules?: boolean; // Controlled Foreign Corporation rules
  thinCapitalizationRules?: boolean;
  debtEquityRatio?: number;
  interestDeductionLimit?: number; // EBITDA percentage
  
  // Incentives
  taxIncentives?: TaxIncentive[];
  freeTradeZones?: string[];
  
  // Special Provisions (for offshore jurisdictions)
  specialProvisions?: {
    cfcRules?: boolean;
    thinCapitalization?: boolean;
    interestDeductionLimits?: boolean;
    interestDeductionLimit?: number;
    interestDeductionBase?: string;
    antiAvoidanceRules?: boolean;
    gaarApplies?: boolean;
  };
  
  // Metadata
  lastUpdated?: string;
  effectiveDate?: string;
  source?: string;
  notes?: string;
}

export interface TaxIncentive {
  name: string;
  description: string;
  rateReduction?: number;
  exemptionYears?: number;
  eligibilityCriteria: string[];
  applicationProcess?: string;
  expirationDate?: string;
}

// -----------------------------------------------------------------------------
// TAX OPTIMIZATION TYPES
// -----------------------------------------------------------------------------

export interface TaxOptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  
  // Type classification (both formats supported)
  type?: OptimizationType | string;
  category?: OptimizationCategory;
  
  // Priority (multiple formats for compatibility)
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'critical' | 'high' | 'medium' | 'low';
  
  // Savings estimates (new format)
  currentTaxBurden?: number;
  optimizedTaxBurden?: number;
  savingsAmount?: number;
  savingsPercentage?: [number, number]; // [min, max] range
  
  // Savings estimates (legacy format)
  estimatedSavingsMin?: number;
  estimatedSavingsMax?: number;
  estimatedSavingsPercentageMin?: number;
  estimatedSavingsPercentageMax?: number;
  
  // Implementation details
  complexity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'low' | 'medium' | 'high';
  timeframe?: string;
  timeToImplement?: string;
  estimatedCost?: number;
  implementationSteps?: ImplementationStep[];
  requirements?: string[];
  risks?: string[];
  
  // Relationships
  applicableEntities?: string[];
  affectedJurisdictions?: string[];
  relatedJurisdictions?: string[];
  relatedEntities?: string[];
  
  // Status tracking
  status?: 'suggested' | 'under_review' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  confidence?: number; // 0-100
  
  // Metadata
  applicableToStructure?: boolean;
  requiredChanges?: RequiredChange[];
  legalConsiderations?: string[];
  createdAt: string;
  updatedAt?: string;
}

export enum OptimizationCategory {
  HOLDING_STRUCTURE = 'HOLDING_STRUCTURE',
  TRANSFER_PRICING = 'TRANSFER_PRICING',
  DTA_UTILIZATION = 'DTA_UTILIZATION',
  ENTITY_RESTRUCTURING = 'ENTITY_RESTRUCTURING',
  FINANCING_ARRANGEMENT = 'FINANCING_ARRANGEMENT',
  IP_PLANNING = 'IP_PLANNING',
  DIVIDEND_ROUTING = 'DIVIDEND_ROUTING',
  LOSS_UTILIZATION = 'LOSS_UTILIZATION',
  TAX_CREDITS = 'TAX_CREDITS',
  INCENTIVE_PROGRAMS = 'INCENTIVE_PROGRAMS',
  PE_OPTIMIZATION = 'PE_OPTIMIZATION',
}

export interface ImplementationStep {
  order: number;
  title: string;
  description: string;
  estimatedDuration?: string;
  responsibleParty?: string;
  dependencies?: number[]; // Order numbers of dependent steps
  documentationRequired?: string[];
  estimatedCost?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

export interface RequiredChange {
  changeType: 'NEW_ENTITY' | 'RESTRUCTURE' | 'CONTRACT' | 'TRANSACTION_FLOW' | 'DOCUMENTATION';
  description: string;
  affectedEntities?: string[];
  jurisdiction?: string;
}

// -----------------------------------------------------------------------------
// TRANSACTION TAX TYPES
// -----------------------------------------------------------------------------

export interface TaxTransaction {
  id: string;
  originalTransactionId: string;
  transactionType: TransactionType;
  isIntercompany: boolean;
  sourceEntityId?: string;
  destinationEntityId?: string;
  sourceJurisdiction: string;
  destinationJurisdiction?: string;
  amount: number;
  currency: string;
  withholdingTaxApplicable: boolean;
  withholdingTaxRate?: number;
  withholdingTaxAmount?: number;
  dtaApplied?: string; // DTA code if applicable
  dtaReducedRate?: number;
  transferPricingRelevant: boolean;
  transferPricingMethod?: TransferPricingMethod;
  armLengthVerified?: boolean;
  taxDeductible: boolean;
  deductionJurisdiction?: string;
  notes?: string;
  createdAt: string;
}

export interface IntercompanyTransaction extends TaxTransaction {
  isIntercompany: true;
  sourceEntityId: string;
  destinationEntityId: string;
  serviceDescription?: string;
  contractReference?: string;
  benchmarkingCompleted?: boolean;
  comparableTransactions?: ComparableTransaction[];
}

export interface ComparableTransaction {
  description: string;
  source: string;
  priceRange: {
    min: number;
    max: number;
  };
  margin?: number;
}

// -----------------------------------------------------------------------------
// TAX NOTIFICATION TYPES
// -----------------------------------------------------------------------------

export interface TaxNotification {
  id: string;
  type: TaxNotificationType | string;
  title: string;
  message: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | 'urgent' | 'high' | 'medium' | 'low';
  category?: 'DEADLINE' | 'OPTIMIZATION' | 'COMPLIANCE' | 'RATE_CHANGE' | 'DTA_UPDATE';
  relatedEntityId?: string;
  relatedJurisdiction?: string;
  optimizationId?: string;
  actionRequired?: boolean;
  actionUrl?: string;
  actionLabel?: string;
  dueDate?: string;
  optimizationSuggestionId?: string;
  
  // Status tracking - support both boolean and timestamp formats
  read?: boolean;
  dismissed?: boolean;
  readAt?: string;
  dismissedAt?: string;
  
  createdAt: string;
}

export enum TaxNotificationType {
  FILING_DEADLINE = 'FILING_DEADLINE',
  PAYMENT_DUE = 'PAYMENT_DUE',
  OPTIMIZATION_FOUND = 'OPTIMIZATION_FOUND',
  RATE_CHANGE = 'RATE_CHANGE',
  DTA_UPDATE = 'DTA_UPDATE',
  COMPLIANCE_WARNING = 'COMPLIANCE_WARNING',
  TRANSFER_PRICING_ALERT = 'TRANSFER_PRICING_ALERT',
  WITHHOLDING_REMINDER = 'WITHHOLDING_REMINDER',
}

// -----------------------------------------------------------------------------
// REPORTING TYPES
// -----------------------------------------------------------------------------

export interface TaxSummary {
  entityId: string;
  jurisdictionCode: string;
  fiscalYear: string;
  totalRevenue: number;
  taxableIncome: number;
  corporateTaxLiability: number;
  effectiveTaxRate: number;
  withholdingTaxPaid: number;
  withholdingTaxReceived: number;
  taxCreditsAvailable: number;
  taxCreditsUtilized: number;
  estimatedPaymentsMade: number;
  balanceDue: number;
  filingStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'FILED' | 'AMENDED';
}

export interface ConsolidatedTaxReport {
  structureId: string;
  fiscalYear: string;
  totalGroupRevenue: number;
  totalGroupTaxLiability: number;
  groupEffectiveTaxRate: number;
  entitySummaries: TaxSummary[];
  intercompanyEliminations: number;
  consolidatedTaxableIncome: number;
  generatedAt: string;
}

// -----------------------------------------------------------------------------
// UI STATE TYPES
// -----------------------------------------------------------------------------

export interface TaxDashboardState {
  selectedStructureId: string | null;
  selectedEntityId: string | null;
  selectedJurisdiction: string | null;
  viewMode: 'OVERVIEW' | 'STRUCTURE' | 'JURISDICTION' | 'OPTIMIZATION' | 'COMPLIANCE';
  timeRange: 'YTD' | 'LAST_YEAR' | 'CUSTOM';
  customDateRange?: { start: string; end: string };
  filters: TaxFilters;
}

export interface TaxFilters {
  entityTypes: EntityType[];
  jurisdictionTypes: JurisdictionType[];
  transactionTypes: TransactionType[];
  showIntercompanyOnly: boolean;
  showOptimizationsOnly: boolean;
  minAmount?: number;
  maxAmount?: number;
}

// -----------------------------------------------------------------------------
// CALCULATION HELPERS
// -----------------------------------------------------------------------------

export interface TaxCalculationInput {
  entityId: string;
  jurisdictionCode: string;
  incomeType: IncomeType;
  grossAmount: number;
  currency: string;
  recipientJurisdiction?: string;
  dtaApplicable?: boolean;
  ownershipPercentage?: number;
}

export interface TaxCalculationResult {
  grossAmount: number;
  applicableRate: number;
  taxAmount: number;
  netAmount: number;
  dtaApplied: boolean;
  dtaBenefit?: number;
  effectiveRate: number;
  breakdown: TaxBreakdownItem[];
}

export interface TaxBreakdownItem {
  description: string;
  rate: number;
  amount: number;
  isCredit: boolean;
}
