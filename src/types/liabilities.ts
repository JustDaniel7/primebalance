// =============================================================================
// LIABILITIES ENGINE - COMPLETE TYPE SYSTEM (TS Compliant)
// src/types/liabilities.ts
// =============================================================================

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export enum LiabilityPrimaryClass {
    // TS Section 2.1
    ACCOUNTS_PAYABLE = 'accounts_payable',
    ACCRUED_EXPENSES = 'accrued_expenses',
    DEFERRED_REVENUE = 'deferred_revenue',
    SHORT_TERM_DEBT = 'short_term_debt',
    LONG_TERM_DEBT = 'long_term_debt',
    CREDIT_LINE = 'credit_line',
    LEASE_OPERATING = 'lease_operating',
    LEASE_FINANCE = 'lease_finance',
    TAX_LIABILITY = 'tax_liability',
    PAYROLL_LIABILITY = 'payroll_liability',
    INTERCOMPANY = 'intercompany',
    CONTINGENT = 'contingent',
    OFF_BALANCE_SHEET = 'off_balance_sheet',
}

export enum LiabilityStatus {
    // TS Section 5.1
    DRAFT = 'draft',
    RECOGNIZED = 'recognized',
    ACTIVE = 'active',
    PARTIALLY_SETTLED = 'partially_settled',
    RESTRUCTURED = 'restructured',
    IN_DISPUTE = 'in_dispute',
    IN_DEFAULT = 'in_default',
    FULLY_SETTLED = 'fully_settled',
    WRITTEN_OFF = 'written_off',
    ARCHIVED = 'archived',
}

export enum LiabilityEventType {
    // TS Section 4.1
    LIABILITY_CREATED = 'LiabilityCreated',
    LIABILITY_RECOGNIZED = 'LiabilityRecognized',
    LIABILITY_ACTIVATED = 'LiabilityActivated',
    LIABILITY_PARTIALLY_SETTLED = 'LiabilityPartiallySettled',
    LIABILITY_RESTRUCTURED = 'LiabilityRestructured',
    LIABILITY_DISPUTED = 'LiabilityDisputed',
    LIABILITY_DEFAULTED = 'LiabilityDefaulted',
    LIABILITY_FULLY_SETTLED = 'LiabilityFullySettled',
    LIABILITY_WRITTEN_OFF = 'LiabilityWrittenOff',
    LIABILITY_ARCHIVED = 'LiabilityArchived',
    LIABILITY_REVERSED = 'LiabilityReversed',
    LIABILITY_AMENDED = 'LiabilityAmended',
    INTEREST_ACCRUED = 'InterestAccrued',
    FEE_APPLIED = 'FeeApplied',
    FX_REVALUED = 'FXRevalued',
    PAYMENT_SCHEDULED = 'PaymentScheduled',
    PAYMENT_EXECUTED = 'PaymentExecuted',
    PAYMENT_FAILED = 'PaymentFailed',
    PAYMENT_REVERSED = 'PaymentReversed',
    COVENANT_CHECKED = 'CovenantChecked',
    COVENANT_BREACHED = 'CovenantBreached',
}

export enum PaymentStatus {
    // TS Section 15.1
    SCHEDULED = 'scheduled',
    PENDING_APPROVAL = 'pending_approval',
    APPROVED = 'approved',
    INITIATED = 'initiated',
    EXECUTED = 'executed',
    FAILED = 'failed',
    REVERSED = 'reversed',
    CANCELLED = 'cancelled',
}

export enum InterestType {
    FIXED = 'fixed',
    VARIABLE = 'variable',
    ZERO = 'zero',
    STEP_UP = 'step_up',
    STEP_DOWN = 'step_down',
}

export enum InterestCompounding {
    SIMPLE = 'simple',
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
    ANNUALLY = 'annually',
    CONTINUOUS = 'continuous',
}

export enum DayCountBasis {
    ACTUAL_360 = 'actual_360',
    ACTUAL_365 = 'actual_365',
    THIRTY_360 = '30_360',
}

export enum AmortizationMethod {
    STRAIGHT_LINE = 'straight_line',
    EFFECTIVE_INTEREST = 'effective_interest',
    DECLINING_BALANCE = 'declining_balance',
    BULLET = 'bullet',
}

export enum PaymentFrequency {
    WEEKLY = 'weekly',
    BI_WEEKLY = 'bi_weekly',
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
    SEMI_ANNUALLY = 'semi_annually',
    ANNUALLY = 'annually',
    BULLET = 'bullet',
    CUSTOM = 'custom',
}

export enum CounterpartyType {
    BANK = 'bank',
    SUPPLIER = 'supplier',
    INVESTOR = 'investor',
    GOVERNMENT = 'government',
    LESSEE = 'lessee',
    INTERCOMPANY = 'intercompany',
    OTHER = 'other',
}

export enum RiskLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

export enum CovenantType {
    DEBT_TO_EQUITY = 'debt_to_equity',
    INTEREST_COVERAGE = 'interest_coverage',
    CURRENT_RATIO = 'current_ratio',
    MINIMUM_CASH = 'minimum_cash',
    MAXIMUM_LEVERAGE = 'maximum_leverage',
    CUSTOM = 'custom',
}

export enum CovenantStatus {
    COMPLIANT = 'compliant',
    WARNING = 'warning',
    BREACHED = 'breached',
}

export enum SettlementType {
    PARTIAL = 'partial',
    FULL = 'full',
    EARLY = 'early',
    RESTRUCTURED = 'restructured',
    WRITE_OFF = 'write_off',
    OFFSET = 'offset',
}

export enum AccrualType {
    INTEREST = 'interest',
    COMMITMENT_FEE = 'commitment_fee',
    ORIGINATION_FEE = 'origination_fee',
    PENALTY = 'penalty',
    LEGAL_FEE = 'legal_fee',
    OTHER_FEE = 'other_fee',
}

export enum ValidationMode {
    SOFT = 'soft',
    HARD = 'hard',
}

export enum SourceType {
    MANUAL = 'manual',
    INVOICE = 'invoice',
    ORDER = 'order',
    PAYROLL = 'payroll',
    TAX = 'tax',
    LEASE = 'lease',
    LOAN = 'loan',
    IMPORT = 'import',
    INTERCOMPANY = 'intercompany',
    JOURNAL_ENTRY = 'journal_entry',
}

export enum ImportSource {
    CSV = 'csv',
    QUICKBOOKS = 'quickbooks',
    XERO = 'xero',
    LEGACY_ERP = 'legacy_erp',
    MT940 = 'mt940',
    CAMT = 'camt',
    API = 'api',
}

export enum ImportMode {
    DRY_RUN = 'dry_run',
    LIVE = 'live',
    PARTIAL = 'partial',
}

export enum ExceptionType {
    VALIDATION_FAILED = 'validation_failed',
    CONFIDENCE_LOW = 'confidence_low',
    RULE_CONFLICT = 'rule_conflict',
    PAYMENT_FAILED = 'payment_failed',
    COVENANT_BREACH = 'covenant_breach',
    FX_MISMATCH = 'fx_mismatch',
    OVERPAYMENT = 'overpayment',
    DOUBLE_RECOGNITION = 'double_recognition',
}

export enum ExceptionStatus {
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    RESOLVED = 'resolved',
    ESCALATED = 'escalated',
    AUTO_RESOLVED = 'auto_resolved',
}

export enum AutomationActionType {
    AUTO_RECOGNIZE = 'auto_recognize',
    AUTO_ACCRUE = 'auto_accrue',
    AUTO_FEE = 'auto_fee',
    AUTO_FLAG = 'auto_flag',
    AUTO_NOTIFY = 'auto_notify',
    PROPOSE_SETTLEMENT = 'propose_settlement',
    PROPOSE_REFINANCE = 'propose_refinance',
}

// =============================================================================
// CORE INTERFACES
// =============================================================================

export interface Liability {
    id: string;

    // Identity (TS Section 3.1)
    liabilityId: string;
    legalReference?: string;
    counterpartyId?: string;
    counterpartyName: string;
    counterpartyType?: CounterpartyType | string;
    partyId?: string;
    legalEntityId?: string;
    jurisdictionIds: string[];

    // Classification (TS Section 2)
    primaryClass: LiabilityPrimaryClass | string;
    isInterestBearing: boolean;
    isSecured: boolean;
    isFixed: boolean;
    isGuaranteed: boolean;
    guarantorId?: string;
    guarantorName?: string;

    // Status & State Machine (TS Section 5)
    status: LiabilityStatus | string;
    previousStatus?: string;
    statusChangedAt?: string;
    statusChangedBy?: string;

    // Financial Attributes (TS Section 3.2)
    originalPrincipal: number;
    outstandingPrincipal: number;
    accruedInterest: number;
    feesPenalties: number;
    totalOutstanding: number;
    totalSettled: number;

    // Currency
    currency: string;
    reportingCurrency?: string;
    fxSource?: string;
    fxRateAtRecognition?: number;
    fxRateAtSettlement?: number;
    fxRateHistory?: FxRateSnapshot[];
    amountInReporting?: number;
    unrealizedFxGainLoss: number;

    // Credit Facilities
    creditLimit?: number;
    availableCredit?: number;
    utilizationRate?: number;

    // Amortization
    amortizationMethod?: AmortizationMethod | string;

    // Confidence
    confidenceScore: number;

    // Temporal Attributes (TS Section 3.3)
    inceptionDate: string;
    recognitionDate?: string;
    activationDate?: string;
    maturityDate?: string;
    nextPaymentDate?: string;
    lastPaymentDate?: string;
    settledDate?: string;

    // Grace periods
    gracePeriodDays: number;
    graceEndDate?: string;

    // Early repayment
    earlyRepaymentAllowed: boolean;
    earlyRepaymentPenalty?: number;
    earlyRepaymentConditions?: string;

    // Interest Engine (TS Section 8)
    interestType?: InterestType | string;
    interestRate?: number;
    interestIndex?: string;
    interestSpread?: number;
    interestCompounding?: InterestCompounding | string;
    interestDayCount?: DayCountBasis | string;
    interestAccrualStart?: string;
    lastInterestAccrual?: string;
    nextInterestAccrual?: string;
    interestSchedule?: InterestScheduleEntry[];

    // Fees & Penalties (TS Section 8.2)
    originationFee?: number;
    originationFeeRate?: number;
    commitmentFee?: number;
    commitmentFeeRate?: number;
    penaltiesAccrued: number;
    legalFeesAccrued: number;
    otherFeesAccrued: number;

    // Payment Schedule (TS Section 6)
    paymentFrequency?: PaymentFrequency | string;
    regularPaymentAmount?: number;
    paymentSchedule?: PaymentScheduleEntry[];
    totalPaymentsExpected: number;
    paymentsCompleted: number;
    paymentsMissed: number;

    // Cashflow Integration (TS Section 7)
    expectedCashImpact?: number;
    earliestCashImpact?: number;
    worstCaseCashImpact?: number;
    nextCashOutflow?: string;
    cashflowProbability: number;

    // Collateral & Security
    collateralDescription?: string;
    collateralValue?: number;
    collateralCurrency?: string;
    collateralType?: string;
    collateralValuationDate?: string;

    // Risk & Covenants (TS Section 10)
    riskLevel: RiskLevel | string;
    riskScore?: number;
    defaultProbability?: number;
    covenants?: Covenant[];
    covenantBreaches: number;
    lastCovenantCheck?: string;
    nextCovenantCheck?: string;

    // Default tracking
    isInDefault: boolean;
    defaultDate?: string;
    defaultReason?: string;
    daysOverdue: number;

    // Dispute
    isDisputed: boolean;
    disputeReason?: string;
    disputeAmount?: number;
    disputeOpenedAt?: string;
    disputeResolvedAt?: string;
    disputeResolution?: string;

    // Restructuring
    isRestructured: boolean;
    restructuredDate?: string;
    restructuredReason?: string;
    originalLiabilityId?: string;
    restructuredTerms?: Record<string, any>;

    // Write-off
    isWrittenOff: boolean;
    writeOffDate?: string;
    writeOffAmount?: number;
    writeOffReason?: string;
    writeOffApprovedBy?: string;
    writeOffReasonCode?: string;

    // Approval & Authorization (TS Section 16)
    requiresApproval: boolean;
    approvalThreshold?: number;
    approvalStatus?: string;
    approvedBy?: string;
    approvedAt?: string;
    approvalChain?: ApprovalChainEntry[];

    // FX Hedging (TS Section 9)
    isHedged: boolean;
    hedgeId?: string;
    hedgePercentage?: number;

    // Metadata (TS Section 3.4)
    name: string;
    description?: string;
    reference?: string;
    internalReference?: string;
    tags: string[];
    systemTags: string[];
    metadata?: Record<string, any>;
    attachments?: Attachment[];
    notes?: string;
    internalNotes?: string;

    // Validation
    validationMode: ValidationMode | string;

    // Localization (TS Section 14)
    locale?: string;
    language: string;

    // Source & Origin
    sourceType: SourceType | string;
    sourceId?: string;
    sourceModule?: string;
    importBatchId?: string;

    // Version & Audit
    version: number;
    eventCount: number;
    lastEventId?: string;

    // Archival
    archivedAt?: string;
    archivedBy?: string;
    archiveReason?: string;

    // Relations (populated on request)
    events?: LiabilityEvent[];
    payments?: LiabilityPayment[];
    settlements?: LiabilitySettlement[];
    accruals?: LiabilityAccrual[];
    covenantChecks?: LiabilityCovenantCheck[];

    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// SUPPORTING TYPES
// =============================================================================

export interface FxRateSnapshot {
    date: string;
    rate: number;
    source: string;
    currency: string;
    reportingCurrency: string;
}

export interface InterestScheduleEntry {
    effectiveDate: string;
    rate: number;
    index?: string;
    spread?: number;
    description?: string;
}

export interface PaymentScheduleEntry {
    sequenceNumber: number;
    dueDate: string;
    principal: number;
    interest: number;
    fees: number;
    total: number;
    status: string;
    paidDate?: string;
    paidAmount?: number;
    balance?: number;
}

export interface Covenant {
    name: string;
    type: CovenantType | string;
    description?: string;
    threshold: number;
    thresholdType: 'minimum' | 'maximum' | 'range';
    thresholdMin?: number;
    thresholdMax?: number;
    currentValue?: number;
    status: CovenantStatus | string;
    lastChecked?: string;
    nextCheck?: string;
    frequency?: string;
}

export interface ApprovalChainEntry {
    level: number;
    role: string;
    approverId?: string;
    approverName?: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedAt?: string;
    comments?: string;
}

export interface Attachment {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    uploadedAt: string;
    uploadedBy?: string;
}

// =============================================================================
// EVENT TYPES (TS Section 4)
// =============================================================================

export interface LiabilityEvent {
    id: string;
    eventId: string;
    liabilityId: string;
    eventType: LiabilityEventType | string;
    timestamp: string;
    effectiveDate?: string;
    actorId?: string;
    actorName?: string;
    actorType: string;
    payload: Record<string, any>;
    previousState?: Record<string, any>;
    previousEventId?: string;
    contentHash?: string;
    explanation?: string;
    ruleId?: string;
    ruleVersion?: string;
    metadata?: Record<string, any>;
    isReversed: boolean;
    reversedBy?: string;
    reversalOf?: string;
}

// =============================================================================
// PAYMENT TYPES (TS Section 15)
// =============================================================================

export interface LiabilityPayment {
    id: string;
    liabilityId: string;
    paymentId: string;

    // Amounts
    amount: number;
    principalAmount: number;
    interestAmount: number;
    feesAmount: number;
    penaltyAmount: number;

    // Currency
    currency: string;
    fxRate?: number;
    amountInReporting?: number;

    // Dates
    scheduledDate?: string;
    dueDate?: string;
    paymentDate?: string;
    executedAt?: string;

    // Status
    status: PaymentStatus | string;

    // Approval
    requiresApproval: boolean;
    approvalThreshold?: number;
    approvalStatus?: string;
    approvalChain?: ApprovalChainEntry[];
    approvedBy?: string;
    approvedAt?: string;

    // Execution
    executedBy?: string;
    paymentMethod?: string;
    bankReference?: string;
    transactionId?: string;

    // Failure
    failureReason?: string;
    failureCode?: string;
    retryCount: number;
    nextRetryAt?: string;

    // Reversal
    isReversed: boolean;
    reversedAt?: string;
    reversedBy?: string;
    reversalReason?: string;

    // Reference
    reference?: string;
    description?: string;
    notes?: string;

    // Intercompany
    isIntercompany: boolean;
    counterpartyLegalEntityId?: string;
    nettingId?: string;

    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// SETTLEMENT TYPES
// =============================================================================

export interface LiabilitySettlement {
    id: string;
    liabilityId: string;
    settlementId: string;
    settlementType: SettlementType | string;

    // Amounts
    amount: number;
    principalSettled: number;
    interestSettled: number;
    feesSettled: number;
    penaltiesWaived: number;

    // Currency
    currency: string;
    fxRate?: number;
    fxGainLoss: number;

    // Before/After
    outstandingBefore: number;
    outstandingAfter: number;

    // Dates
    settlementDate: string;
    effectiveDate?: string;

    // Actor
    settledBy?: string;
    approvedBy?: string;

    // Reference
    paymentId?: string;
    reference?: string;
    notes?: string;

    // Offset/Netting
    isOffset: boolean;
    offsetReceivableId?: string;
    nettingBatchId?: string;

    createdAt: string;
}

// =============================================================================
// ACCRUAL TYPES (TS Section 8)
// =============================================================================

export interface LiabilityAccrual {
    id: string;
    liabilityId: string;
    accrualId: string;
    accrualType: AccrualType | string;

    // Period
    periodStart: string;
    periodEnd: string;

    // Calculation
    principalBase: number;
    rate?: number;
    dayCount?: number;
    dayCountBasis?: DayCountBasis | string;

    // Amount
    amount: number;
    currency: string;
    amountInReporting?: number;
    fxRate?: number;

    // Status
    status: string;

    // Posting
    postedAt?: string;
    postedBy?: string;
    journalEntryId?: string;

    // Reversal
    isReversed: boolean;
    reversedAt?: string;
    reversedBy?: string;

    // Explain-Why
    explanation?: string;
    calculationDetails?: Record<string, any>;

    createdAt: string;
}

// =============================================================================
// COVENANT CHECK TYPES (TS Section 10)
// =============================================================================

export interface LiabilityCovenantCheck {
    id: string;
    liabilityId: string;
    covenantName: string;
    covenantType: CovenantType | string;

    // Check details
    checkDate: string;
    periodEnd?: string;

    // Threshold
    threshold: number;
    thresholdType: string;
    thresholdMin?: number;
    thresholdMax?: number;

    // Actual value
    actualValue: number;

    // Result
    status: CovenantStatus | string;
    variance?: number;
    variancePercent?: number;

    // Breach handling
    isBreached: boolean;
    breachSeverity?: string;
    breachNotified: boolean;
    notifiedAt?: string;
    notifiedTo: string[];

    // Waiver
    isWaived: boolean;
    waiverApprovedBy?: string;
    waiverApprovedAt?: string;
    waiverReason?: string;

    // Evidence
    calculationDetails?: Record<string, any>;
    supportingDocuments?: Attachment[];

    // Actor
    checkedBy?: string;

    createdAt: string;
}

// =============================================================================
// IMPORT TYPES (TS Section 12)
// =============================================================================

export interface LiabilityImportBatch {
    id: string;
    batchNumber: string;
    source: ImportSource | string;
    sourceIdentifier?: string;
    sourceHash?: string;
    totalRecords: number;
    successCount: number;
    errorCount: number;
    warningCount: number;
    skippedCount: number;
    status: string;
    importMode: ImportMode | string;
    dateFrom?: string;
    dateTo?: string;
    counterpartyFilter?: string;
    typeFilter?: string;
    fieldMapping?: Record<string, string>;
    mappingTemplate?: string;
    errors?: ImportError[];
    warnings?: ImportWarning[];
    createdLiabilityIds: string[];
    canRollback: boolean;
    rolledBackAt?: string;
    rolledBackBy?: string;
    importedBy: string;
    importedByName?: string;
    startedAt: string;
    completedAt?: string;
}

export interface ImportError {
    row?: number;
    field?: string;
    code: string;
    message: string;
    data?: Record<string, any>;
}

export interface ImportWarning {
    row?: number;
    field?: string;
    code: string;
    message: string;
}

// =============================================================================
// AUTOMATION TYPES (TS Section 11)
// =============================================================================

export interface LiabilityAutomationRule {
    id: string;
    name: string;
    code: string;
    description?: string;
    triggerType: string;
    triggerConditions: Record<string, any>;
    schedule?: string;
    liabilityTypes: string[];
    primaryClasses: string[];
    counterpartyTypes: string[];
    actionType: AutomationActionType | string;
    actionConfig?: Record<string, any>;
    confidenceThreshold: number;
    proposalThreshold: number;
    requiresApproval: boolean;
    approverRoles: string[];
    amountThreshold?: number;
    riskThreshold?: string;
    maturityDaysThreshold?: number;
    fallbackRuleId?: string;
    fallbackBehavior?: string;
    explanationTemplate?: string;
    isActive: boolean;
    priority: number;
    lastExecutedAt?: string;
    executionCount: number;
    successCount: number;
    failureCount: number;
    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// EXCEPTION TYPES (TS Section 11.5)
// =============================================================================

export interface LiabilityException {
    id: string;
    liabilityId?: string;
    sourceObjectId?: string;
    sourceObjectType?: string;
    sourceModule?: string;
    exceptionType: ExceptionType | string;
    exceptionCode?: string;
    exceptionMessage: string;
    exceptionDetails?: Record<string, any>;
    validationMode?: string;
    validationErrors?: Array<{ code: string; message: string; field?: string }>;
    confidenceScore?: number;
    assignedTo?: string;
    assignedToName?: string;
    assignedAt?: string;
    slaDeadline?: string;
    isOverdue: boolean;
    escalationLevel: number;
    escalatedTo?: string;
    escalatedAt?: string;
    status: ExceptionStatus | string;
    resolvedAt?: string;
    resolvedBy?: string;
    resolution?: string;
    resolutionAction?: string;
    retryCount: number;
    maxRetries: number;
    lastRetryAt?: string;
    nextRetryAt?: string;
    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// SAVED VIEW TYPES (TS Section 13.3)
// =============================================================================

export interface LiabilitySavedView {
    id: string;
    name: string;
    description?: string;
    filters: LiabilityFilters;
    columns: string[];
    sortBy?: string;
    sortOrder: 'asc' | 'desc';
    groupBy?: string;
    includeAggregations: boolean;
    aggregationFields: string[];
    isPublic: boolean;
    sharedWith: string[];
    isScheduled: boolean;
    scheduleFrequency?: string;
    scheduleCron?: string;
    deliveryMethod?: string;
    deliveryTarget?: string;
    lastDeliveredAt?: string;
    defaultExportFormat: string;
    createdBy: string;
    createdByName?: string;
    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// FILTER & QUERY TYPES
// =============================================================================

export interface LiabilityFilters {
    primaryClass?: LiabilityPrimaryClass | string;
    primaryClasses?: string[];
    status?: LiabilityStatus | string;
    statuses?: string[];
    counterpartyId?: string;
    counterpartyName?: string;
    counterpartyType?: string;
    partyId?: string;
    legalEntityId?: string;
    currency?: string;
    riskLevel?: RiskLevel | string;
    riskLevels?: string[];
    isInterestBearing?: boolean;
    isSecured?: boolean;
    isInDefault?: boolean;
    isDisputed?: boolean;
    isHedged?: boolean;
    maturityFrom?: string;
    maturityTo?: string;
    inceptionFrom?: string;
    inceptionTo?: string;
    amountMin?: number;
    amountMax?: number;
    tags?: string[];
    sourceType?: SourceType | string;
    search?: string;
}

export interface LiabilityPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

// =============================================================================
// STATISTICS TYPES (TS Section 13)
// =============================================================================

export interface LiabilityStatistics {
    totalCount: number;
    totalOutstanding: number;
    totalOriginalPrincipal: number;
    totalAccruedInterest: number;
    totalFeesPenalties: number;

    byPrimaryClass: Record<string, { count: number; outstanding: number }>;
    byStatus: Record<string, { count: number; outstanding: number }>;
    byCurrency: Record<string, { count: number; outstanding: number }>;
    byCounterpartyType: Record<string, { count: number; outstanding: number }>;
    byRiskLevel: Record<string, { count: number; outstanding: number }>;

    maturityProfile: {
        within30Days: { count: number; amount: number };
        within90Days: { count: number; amount: number };
        within1Year: { count: number; amount: number };
        over1Year: { count: number; amount: number };
        noMaturity: { count: number; amount: number };
    };

    riskSummary: {
        inDefault: number;
        inDispute: number;
        covenantBreaches: number;
        overdue: number;
    };

    cashflowSummary: {
        next7Days: number;
        next30Days: number;
        next90Days: number;
        next12Months: number;
    };
}

// =============================================================================
// API REQUEST TYPES
// =============================================================================

export interface CreateLiabilityRequest {
    // Required fields
    name: string;
    primaryClass: LiabilityPrimaryClass | string;
    counterpartyName: string;
    originalPrincipal: number;
    currency: string;
    inceptionDate: string;

    // Optional fields
    legalReference?: string;
    counterpartyId?: string;
    counterpartyType?: CounterpartyType | string;
    partyId?: string;
    legalEntityId?: string;
    jurisdictionIds?: string[];

    // Classification
    isInterestBearing?: boolean;
    isSecured?: boolean;
    isFixed?: boolean;
    isGuaranteed?: boolean;
    guarantorId?: string;
    guarantorName?: string;

    // Financial
    outstandingPrincipal?: number;
    reportingCurrency?: string;
    creditLimit?: number;
    amortizationMethod?: AmortizationMethod | string;
    confidenceScore?: number;

    // Temporal
    maturityDate?: string;
    gracePeriodDays?: number;
    earlyRepaymentAllowed?: boolean;
    earlyRepaymentPenalty?: number;

    // Interest
    interestType?: InterestType | string;
    interestRate?: number;
    interestIndex?: string;
    interestSpread?: number;
    interestCompounding?: InterestCompounding | string;
    interestDayCount?: DayCountBasis | string;

    // Fees
    originationFee?: number;
    originationFeeRate?: number;
    commitmentFee?: number;
    commitmentFeeRate?: number;

    // Payment
    paymentFrequency?: PaymentFrequency | string;
    regularPaymentAmount?: number;
    paymentSchedule?: PaymentScheduleEntry[];

    // Collateral
    collateralDescription?: string;
    collateralValue?: number;
    collateralCurrency?: string;
    collateralType?: string;

    // Risk & Covenants
    riskLevel?: RiskLevel | string;
    covenants?: Covenant[];

    // FX Hedging
    isHedged?: boolean;
    hedgeId?: string;
    hedgePercentage?: number;

    // Metadata
    description?: string;
    reference?: string;
    internalReference?: string;
    tags?: string[];
    metadata?: Record<string, any>;
    notes?: string;

    // Validation
    validationMode?: ValidationMode | string;

    // Approval
    requiresApproval?: boolean;
    approvalThreshold?: number;

    // Source
    sourceType?: SourceType | string;
    sourceId?: string;
}

export interface RecognizeLiabilityRequest {
    recognitionDate?: string;
    effectiveDate?: string;
    notes?: string;
}

export interface ActivateLiabilityRequest {
    activationDate?: string;
    notes?: string;
}

export interface SettleLiabilityRequest {
    amount: number;
    settlementType?: SettlementType | string;
    settlementDate?: string;
    principalAmount?: number;
    interestAmount?: number;
    feesAmount?: number;
    penaltiesWaived?: number;
    paymentId?: string;
    reference?: string;
    notes?: string;
    fxRate?: number;
    isOffset?: boolean;
    offsetReceivableId?: string;
}

export interface ReverseLiabilityRequest {
    reason: string;
    effectiveDate?: string;
    reversalType?: 'full' | 'partial';
    amount?: number;
}

export interface DisputeLiabilityRequest {
    reason: string;
    disputeAmount?: number;
    effectiveDate?: string;
    notes?: string;
}

export interface ResolveDisputeRequest {
    resolution: string;
    adjustedAmount?: number;
    notes?: string;
}

export interface DefaultLiabilityRequest {
    reason: string;
    defaultDate?: string;
}

export interface WriteOffLiabilityRequest {
    reason: string;
    reasonCode: string;
    amount?: number;
    approvedBy?: string;
    notes?: string;
}

export interface RestructureLiabilityRequest {
    reason: string;
    newTerms: {
        maturityDate?: string;
        interestRate?: number;
        paymentFrequency?: string;
        regularPaymentAmount?: number;
        paymentSchedule?: PaymentScheduleEntry[];
    };
    effectiveDate?: string;
    notes?: string;
}

export interface AccrueInterestRequest {
    periodStart?: string;
    periodEnd?: string;
    amount?: number;
    rate?: number;
    explanation?: string;
}

export interface ApplyFeeRequest {
    feeType: AccrualType | string;
    amount: number;
    description?: string;
    effectiveDate?: string;
}

export interface SchedulePaymentRequest {
    scheduledDate: string;
    amount: number;
    principalAmount?: number;
    interestAmount?: number;
    feesAmount?: number;
    reference?: string;
    notes?: string;
}

export interface ExecutePaymentRequest {
    paymentId: string;
    executionDate?: string;
    paymentMethod?: string;
    bankReference?: string;
    notes?: string;
}

export interface ApprovePaymentRequest {
    paymentId: string;
    comments?: string;
}

export interface CheckCovenantRequest {
    covenantName: string;
    actualValue: number;
    periodEnd?: string;
    calculationDetails?: Record<string, any>;
    notes?: string;
}

export interface ImportLiabilitiesRequest {
    source: ImportSource | string;
    mode: ImportMode | string;
    data: any[];
    fieldMapping?: Record<string, string>;
    dateFrom?: string;
    dateTo?: string;
    counterpartyFilter?: string;
    typeFilter?: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface LiabilityListResponse {
    liabilities: Liability[];
    pagination: LiabilityPagination;
    statistics?: LiabilityStatistics;
}

export interface LiabilityDetailResponse {
    liability: Liability;
    events?: LiabilityEvent[];
    payments?: LiabilityPayment[];
    settlements?: LiabilitySettlement[];
    accruals?: LiabilityAccrual[];
    covenantChecks?: LiabilityCovenantCheck[];
}

export interface TimeTravResponse {
    liability: Liability;
    asOfDate: string;
    eventsApplied: number;
    reconstructedFrom: string[];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * State transition rules (TS Section 5)
 */
export const LIABILITY_STATUS_TRANSITIONS: Record<string, string[]> = {
    [LiabilityStatus.DRAFT]: [
        LiabilityStatus.RECOGNIZED,
        LiabilityStatus.ARCHIVED, // Can archive without recognizing
    ],
    [LiabilityStatus.RECOGNIZED]: [
        LiabilityStatus.ACTIVE,
        LiabilityStatus.IN_DISPUTE,
        LiabilityStatus.ARCHIVED,
    ],
    [LiabilityStatus.ACTIVE]: [
        LiabilityStatus.PARTIALLY_SETTLED,
        LiabilityStatus.FULLY_SETTLED,
        LiabilityStatus.IN_DISPUTE,
        LiabilityStatus.IN_DEFAULT,
        LiabilityStatus.RESTRUCTURED,
    ],
    [LiabilityStatus.PARTIALLY_SETTLED]: [
        LiabilityStatus.FULLY_SETTLED,
        LiabilityStatus.IN_DISPUTE,
        LiabilityStatus.IN_DEFAULT,
        LiabilityStatus.RESTRUCTURED,
        LiabilityStatus.WRITTEN_OFF,
    ],
    [LiabilityStatus.RESTRUCTURED]: [
        LiabilityStatus.ACTIVE,
        LiabilityStatus.PARTIALLY_SETTLED,
        LiabilityStatus.FULLY_SETTLED,
        LiabilityStatus.IN_DEFAULT,
    ],
    [LiabilityStatus.IN_DISPUTE]: [
        LiabilityStatus.ACTIVE,
        LiabilityStatus.PARTIALLY_SETTLED,
        LiabilityStatus.FULLY_SETTLED,
        LiabilityStatus.WRITTEN_OFF,
    ],
    [LiabilityStatus.IN_DEFAULT]: [
        LiabilityStatus.RESTRUCTURED,
        LiabilityStatus.WRITTEN_OFF,
        LiabilityStatus.FULLY_SETTLED,
    ],
    [LiabilityStatus.FULLY_SETTLED]: [
        LiabilityStatus.ARCHIVED,
    ],
    [LiabilityStatus.WRITTEN_OFF]: [
        LiabilityStatus.ARCHIVED,
    ],
    [LiabilityStatus.ARCHIVED]: [], // Terminal state
};

/**
 * Check if status transition is valid
 */
export function canTransitionTo(currentStatus: string, targetStatus: string): boolean {
    const allowedTransitions = LIABILITY_STATUS_TRANSITIONS[currentStatus];
    return allowedTransitions?.includes(targetStatus) ?? false;
}

/**
 * Check if liability is editable (draft only)
 */
export function isLiabilityEditable(status: string): boolean {
    return status === LiabilityStatus.DRAFT;
}

/**
 * Check if liability can be settled
 */
export function isLiabilitySettleable(status: string): boolean {
    return [
        LiabilityStatus.ACTIVE,
        LiabilityStatus.PARTIALLY_SETTLED,
        LiabilityStatus.RESTRUCTURED,
        LiabilityStatus.IN_DEFAULT,
    ].includes(status as LiabilityStatus);
}

/**
 * Check if liability can be disputed
 */
export function isLiabilityDisputable(status: string): boolean {
    return [
        LiabilityStatus.RECOGNIZED,
        LiabilityStatus.ACTIVE,
        LiabilityStatus.PARTIALLY_SETTLED,
    ].includes(status as LiabilityStatus);
}

/**
 * Check if liability can be written off
 */
export function isLiabilityWriteOffable(status: string): boolean {
    return [
        LiabilityStatus.ACTIVE,
        LiabilityStatus.PARTIALLY_SETTLED,
        LiabilityStatus.IN_DISPUTE,
        LiabilityStatus.IN_DEFAULT,
    ].includes(status as LiabilityStatus);
}

/**
 * Generate deterministic liability ID
 */
export function generateLiabilityId(
    organizationId: string,
    primaryClass: string,
    sequence: number,
    timestamp?: Date
): string {
    const ts = timestamp || new Date();
    const year = ts.getFullYear();
    const seq = String(sequence).padStart(5, '0');
    return `LIA-${year}-${primaryClass.toUpperCase().slice(0, 3)}-${seq}`;
}

/**
 * Generate event ID
 */
export function generateEventId(
    liabilityId: string,
    eventType: string,
    timestamp?: Date
): string {
    const ts = timestamp || new Date();
    return `evt_${liabilityId}_${eventType}_${ts.getTime()}`;
}

/**
 * Calculate interest for period
 */
export function calculateInterest(
    principal: number,
    annualRate: number,
    days: number,
    dayCountBasis: DayCountBasis = DayCountBasis.ACTUAL_360
): number {
    let divisor = 360;
    if (dayCountBasis === DayCountBasis.ACTUAL_365) divisor = 365;

    return (principal * annualRate * days) / divisor;
}

/**
 * Calculate total outstanding
 */
export function calculateTotalOutstanding(
    outstandingPrincipal: number,
    accruedInterest: number,
    feesPenalties: number
): number {
    return outstandingPrincipal + accruedInterest + feesPenalties;
}

/**
 * Get aging bucket for overdue days
 */
export function getAgingBucket(daysOverdue: number): string {
    if (daysOverdue <= 0) return 'current';
    if (daysOverdue <= 30) return '1-30';
    if (daysOverdue <= 60) return '31-60';
    if (daysOverdue <= 90) return '61-90';
    return '90+';
}

/**
 * Determine risk level based on factors
 */
export function calculateRiskLevel(
    daysOverdue: number,
    covenantBreaches: number,
    utilizationRate?: number
): RiskLevel {
    if (daysOverdue > 90 || covenantBreaches >= 2) return RiskLevel.CRITICAL;
    if (daysOverdue > 60 || covenantBreaches >= 1 || (utilizationRate && utilizationRate > 0.9)) {
        return RiskLevel.HIGH;
    }
    if (daysOverdue > 30 || (utilizationRate && utilizationRate > 0.75)) {
        return RiskLevel.MEDIUM;
    }
    return RiskLevel.LOW;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const LIABILITY_PRIMARY_CLASSES = Object.values(LiabilityPrimaryClass);

export const LIABILITY_STATUSES = Object.values(LiabilityStatus);

export const LIABILITY_EVENT_TYPES = Object.values(LiabilityEventType);

export const PAYMENT_STATUSES = Object.values(PaymentStatus);

export const RISK_LEVELS = Object.values(RiskLevel);

export const INTEREST_TYPES = Object.values(InterestType);

export const PAYMENT_FREQUENCIES = Object.values(PaymentFrequency);

export const DEFAULT_INTEREST_DAY_COUNT = DayCountBasis.ACTUAL_360;

export const DEFAULT_INTEREST_COMPOUNDING = InterestCompounding.MONTHLY;

export const CONFIDENCE_AUTO_THRESHOLD = 0.95;

export const CONFIDENCE_PROPOSAL_THRESHOLD = 0.70;

export const CONFIDENCE_EXCEPTION_THRESHOLD = 0.70;

// i18n labels
export const LIABILITY_LABELS = {
    primaryClass: {
        accounts_payable: { en: 'Accounts Payable', de: 'Verbindlichkeiten aus L+L', es: 'Cuentas por Pagar', fr: 'Comptes Fournisseurs' },
        accrued_expenses: { en: 'Accrued Expenses', de: 'Rückstellungen', es: 'Gastos Devengados', fr: 'Charges à Payer' },
        deferred_revenue: { en: 'Deferred Revenue', de: 'Abgrenzungsposten', es: 'Ingresos Diferidos', fr: 'Produits Différés' },
        short_term_debt: { en: 'Short-term Debt', de: 'Kurzfristige Verbindlichkeiten', es: 'Deuda a Corto Plazo', fr: 'Dette à Court Terme' },
        long_term_debt: { en: 'Long-term Debt', de: 'Langfristige Verbindlichkeiten', es: 'Deuda a Largo Plazo', fr: 'Dette à Long Terme' },
        credit_line: { en: 'Credit Line', de: 'Kreditlinie', es: 'Línea de Crédito', fr: 'Ligne de Crédit' },
        lease_operating: { en: 'Operating Lease', de: 'Operating Lease', es: 'Arrendamiento Operativo', fr: 'Location Simple' },
        lease_finance: { en: 'Finance Lease', de: 'Finanzierungsleasing', es: 'Arrendamiento Financiero', fr: 'Crédit-Bail' },
        tax_liability: { en: 'Tax Liability', de: 'Steuerverbindlichkeit', es: 'Pasivo Fiscal', fr: 'Passif Fiscal' },
        payroll_liability: { en: 'Payroll Liability', de: 'Lohnverbindlichkeit', es: 'Pasivo de Nómina', fr: 'Passif Social' },
        intercompany: { en: 'Intercompany', de: 'Konzernverbindlichkeit', es: 'Intercompañía', fr: 'Interentreprise' },
        contingent: { en: 'Contingent', de: 'Eventualverbindlichkeit', es: 'Contingente', fr: 'Passif Éventuel' },
        off_balance_sheet: { en: 'Off-Balance Sheet', de: 'Außerbilanziell', es: 'Fuera de Balance', fr: 'Hors Bilan' },
    },
    status: {
        draft: { en: 'Draft', de: 'Entwurf', es: 'Borrador', fr: 'Brouillon' },
        recognized: { en: 'Recognized', de: 'Erfasst', es: 'Reconocido', fr: 'Reconnu' },
        active: { en: 'Active', de: 'Aktiv', es: 'Activo', fr: 'Actif' },
        partially_settled: { en: 'Partially Settled', de: 'Teilweise beglichen', es: 'Parcialmente Liquidado', fr: 'Partiellement Réglé' },
        restructured: { en: 'Restructured', de: 'Restrukturiert', es: 'Reestructurado', fr: 'Restructuré' },
        in_dispute: { en: 'In Dispute', de: 'Im Streit', es: 'En Disputa', fr: 'En Litige' },
        in_default: { en: 'In Default', de: 'Im Verzug', es: 'En Mora', fr: 'En Défaut' },
        fully_settled: { en: 'Fully Settled', de: 'Vollständig beglichen', es: 'Totalmente Liquidado', fr: 'Entièrement Réglé' },
        written_off: { en: 'Written Off', de: 'Abgeschrieben', es: 'Dado de Baja', fr: 'Passé en Pertes' },
        archived: { en: 'Archived', de: 'Archiviert', es: 'Archivado', fr: 'Archivé' },
    },
};