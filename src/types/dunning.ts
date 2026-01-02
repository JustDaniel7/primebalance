// =============================================================================
// DUNNING & RECEIVABLES ENFORCEMENT ENGINE - TYPESCRIPT TYPES
// TS Compliance: All 25 Sections
// src/types/dunning.ts
// =============================================================================

// =============================================================================
// ENUMS (TS Sections 7, 4, 8, 9, 10, 12, 14)
// =============================================================================

/**
 * Dunning Status - State Machine (TS Section 7.1)
 */
export enum DunningStatus {
    ISSUED = 'issued',
    DUE = 'due',
    OVERDUE = 'overdue',
    REMINDER_AUTO_PROPOSED = 'reminder_auto_proposed',
    REMINDER_SENT = 'reminder_sent',
    DUNNING_LEVEL1_AUTO_PROPOSED = 'dunning_level1_auto_proposed',
    DUNNING_LEVEL1_SENT = 'dunning_level1_sent',
    DUNNING_LEVEL2_AUTO_PROPOSED = 'dunning_level2_auto_proposed',
    DUNNING_LEVEL2_SENT = 'dunning_level2_sent',
    DUNNING_LEVEL3_PENDING = 'dunning_level3_pending', // Manual initiation required
    DUNNING_LEVEL3_SENT = 'dunning_level3_sent',
    ESCALATION_PREPARED = 'escalation_prepared',
    SETTLED = 'settled',
    WRITTEN_OFF = 'written_off',
    DISPUTED = 'disputed', // Blocker state
}

/**
 * Dunning Event Types (TS Section 4.1)
 */
export enum DunningEventType {
    // Creation & Core
    DUNNING_CREATED = 'DunningCreated',

    // Reminder Level
    REMINDER_AUTO_PROPOSED = 'ReminderAutoProposed',
    REMINDER_APPROVED = 'ReminderApproved',
    REMINDER_SENT = 'ReminderSent',

    // Dunning Level 1
    DUNNING_LEVEL1_AUTO_PROPOSED = 'DunningLevel1AutoProposed',
    DUNNING_LEVEL1_APPROVED = 'DunningLevel1Approved',
    DUNNING_LEVEL1_SENT = 'DunningLevel1Sent',

    // Dunning Level 2
    DUNNING_LEVEL2_AUTO_PROPOSED = 'DunningLevel2AutoProposed',
    DUNNING_LEVEL2_APPROVED = 'DunningLevel2Approved',
    DUNNING_LEVEL2_SENT = 'DunningLevel2Sent',

    // Dunning Level 3 (Manual Only - TS Section 8.4)
    DUNNING_LEVEL3_MANUALLY_INITIATED = 'DunningLevel3ManuallyInitiated',
    DUNNING_LEVEL3_APPROVED = 'DunningLevel3Approved',
    DUNNING_LEVEL3_SENT = 'DunningLevel3Sent',

    // Escalation
    ESCALATION_PREPARED = 'EscalationPrepared',

    // Dispute
    DUNNING_DISPUTED = 'DunningDisputed',
    DISPUTE_RESOLVED = 'DisputeResolved',

    // Settlement & Write-off
    DUNNING_SETTLED = 'DunningSettled',
    DUNNING_PARTIALLY_SETTLED = 'DunningPartiallySettled',
    DUNNING_WRITTEN_OFF = 'DunningWrittenOff',

    // Reversal
    DUNNING_REVERSED = 'DunningReversed',

    // Interest & Fees
    INTEREST_ACCRUED = 'InterestAccrued',
    FEE_APPLIED = 'FeeApplied',
    FEE_WAIVED = 'FeeWaived',

    // Payment Events
    PAYMENT_RECEIVED = 'PaymentReceived',
    PARTIAL_PAYMENT_RECEIVED = 'PartialPaymentReceived',
    PAYMENT_REVERSED = 'PaymentReversed',

    // Data Verification
    DATA_VERIFIED = 'DataVerified',
    VERIFICATION_FAILED = 'VerificationFailed',

    // Communication
    COMMUNICATION_SENT = 'CommunicationSent',
    COMMUNICATION_FAILED = 'CommunicationFailed',
    COMMUNICATION_DELIVERED = 'CommunicationDelivered',

    // Amendment
    DUNNING_AMENDED = 'DunningAmended',
}

/**
 * Dunning Level (TS Section 8)
 */
export enum DunningLevel {
    NONE = 0,
    REMINDER = 1,
    LEVEL_1 = 2,
    LEVEL_2 = 3,
    LEVEL_3 = 4, // Manual only
}

/**
 * Proposal Status
 */
export enum ProposalStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    EXPIRED = 'expired',
    SENT = 'sent',
}

/**
 * Proposal Type
 */
export enum ProposalType {
    REMINDER = 'reminder',
    LEVEL_1 = 'level1',
    LEVEL_2 = 'level2',
    // Note: Level 3 is NEVER auto-proposed (TS Section 8.4)
}

/**
 * Proposal Priority (TS Section 9.4)
 */
export enum ProposalPriority {
    HIGH = 'high',      // confidence >= 0.9
    NORMAL = 'normal',  // confidence 0.7-0.9
    LOW = 'low',        // confidence < 0.7 -> Exception Queue
}

/**
 * Communication Channel (TS Section 12.1)
 */
export enum CommunicationChannel {
    EMAIL = 'email',
    PDF = 'pdf',
    POSTAL = 'postal',
}

/**
 * Communication Status
 */
export enum CommunicationStatus {
    DRAFT = 'draft',
    PENDING = 'pending',
    SENT = 'sent',
    DELIVERED = 'delivered',
    FAILED = 'failed',
    BOUNCED = 'bounced',
}

/**
 * Customer Type (TS Section 10.2)
 */
export enum CustomerType {
    B2B = 'b2b',
    CONSUMER = 'consumer',
}

/**
 * Interest Rate Source (TS Section 11)
 */
export enum InterestRateSource {
    STATUTORY = 'statutory',
    CONTRACTUAL = 'contractual',
    JURISDICTION = 'jurisdiction',
}

/**
 * Fee Type (TS Section 11)
 */
export enum FeeType {
    FLAT_FEE = 'flat_fee',
    PERCENTAGE_FEE = 'percentage_fee',
    PROCESSING_FEE = 'processing_fee',
    LEGAL_FEE = 'legal_fee',
    COLLECTION_FEE = 'collection_fee',
}

/**
 * Fee Source
 */
export enum FeeSource {
    STATUTORY = 'statutory',
    CONTRACTUAL = 'contractual',
    JURISDICTION = 'jurisdiction',
    CUSTOM = 'custom',
}

/**
 * Fee Status
 */
export enum FeeStatus {
    CALCULATED = 'calculated',
    APPLIED = 'applied',
    WAIVED = 'waived',
    REVERSED = 'reversed',
}

/**
 * Dispute Status (TS Section 14)
 */
export enum DisputeStatus {
    OPEN = 'open',
    UNDER_REVIEW = 'under_review',
    RESOLVED = 'resolved',
    ESCALATED = 'escalated',
}

/**
 * Dispute Type
 */
export enum DisputeType {
    AMOUNT = 'amount',
    SERVICE = 'service',
    QUALITY = 'quality',
    BILLING_ERROR = 'billing_error',
    OTHER = 'other',
}

/**
 * Dispute Resolution Type
 */
export enum DisputeResolutionType {
    UPHELD = 'upheld',
    REJECTED = 'rejected',
    PARTIAL = 'partial',
    WITHDRAWN = 'withdrawn',
}

/**
 * Validation Mode (TS Section 7.3)
 */
export enum ValidationMode {
    SOFT = 'soft',   // Warnings logged, transition proceeds, confidence adjusted
    HARD = 'hard',   // Errors block transition, routed to Exception Queue
}

/**
 * Verification Status
 */
export enum VerificationStatus {
    PENDING = 'pending',
    VERIFIED = 'verified',
    FAILED = 'failed',
}

/**
 * Exception Type (TS Section 9.5)
 */
export enum DunningExceptionType {
    VALIDATION_FAILED = 'validation_failed',
    CONFIDENCE_LOW = 'confidence_low',
    RULE_CONFLICT = 'rule_conflict',
    DATA_MISMATCH = 'data_mismatch',
    CUSTOMER_BLOCKED = 'customer_blocked',
    MANUAL_REVIEW = 'manual_review',
    PAYMENT_PENDING = 'payment_pending',
    DISPUTE_ACTIVE = 'dispute_active',
}

/**
 * Exception Status
 */
export enum DunningExceptionStatus {
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    RESOLVED = 'resolved',
    ESCALATED = 'escalated',
    AUTO_RESOLVED = 'auto_resolved',
}

/**
 * Import Source (TS Section 13.1)
 */
export enum DunningImportSource {
    CSV = 'csv',
    QUICKBOOKS = 'quickbooks',
    XERO = 'xero',
    LEGACY_ERP = 'legacy_erp',
    API = 'api',
}

/**
 * Import Mode (TS Section 13.3)
 */
export enum DunningImportMode {
    DRY_RUN = 'dry_run',
    LIVE = 'live',
    PARTIAL = 'partial',
}

/**
 * Automation Trigger Type (TS Section 9)
 */
export enum AutomationTriggerType {
    SCHEDULED = 'scheduled',
    ON_OVERDUE = 'on_overdue',
    ON_EVENT = 'on_event',
    ON_THRESHOLD = 'on_threshold',
}

/**
 * Automation Action Type
 */
export enum AutomationActionType {
    AUTO_PROPOSE = 'auto_propose',
    AUTO_CALCULATE_INTEREST = 'auto_calculate_interest',
    AUTO_CALCULATE_FEE = 'auto_calculate_fee',
    AUTO_FLAG = 'auto_flag',
    NOTIFY = 'notify',
}

/**
 * Template Tone (TS Section 12.2)
 */
export enum TemplateTone {
    FRIENDLY = 'friendly',
    FORMAL = 'formal',
    FIRM = 'firm',
    FINAL = 'final',
}

/**
 * Actor Type
 */
export enum ActorType {
    USER = 'user',
    SYSTEM = 'system',
    AUTOMATION = 'automation',
    API = 'api',
}

/**
 * Day Count Basis
 */
export enum DayCountBasis {
    ACTUAL_360 = 'actual_360',
    ACTUAL_365 = 'actual_365',
    THIRTY_360 = '30_360',
}

/**
 * Payment History Rating
 */
export enum PaymentHistoryRating {
    GOOD = 'good',
    AVERAGE = 'average',
    POOR = 'poor',
}

// =============================================================================
// CORE INTERFACES (TS Section 3)
// =============================================================================

/**
 * Core Dunning Entity (TS Section 3)
 */
export interface Dunning {
    id: string;

    // Identity (TS Section 3.1)
    dunningId: string;
    dunningNumber: string;
    invoiceId?: string;
    customerId?: string;
    customerName?: string;
    partyId?: string;
    legalEntityId?: string;
    jurisdictionId?: string;
    currency: string;
    reportingCurrency: string;

    // Status & State Machine (TS Section 7)
    status: DunningStatus | string;
    previousStatus?: string;
    statusChangedAt?: string;
    statusChangedBy?: string;
    currentLevel: number;

    // Financial Attributes (TS Section 3.2)
    originalAmount: number;
    outstandingAmount: number;
    interestAccrued: number;
    feesAccrued: number;
    totalDue: number;
    fxRateAtCreation?: number;
    amountInReporting?: number;

    // Interest Calculation (TS Section 11)
    interestRateApplied?: number;
    interestRateSource?: string;
    interestStartDate?: string;
    interestLastCalculated?: string;
    interestDayCount?: string;

    // Fee Calculation (TS Section 11)
    flatFeeApplied?: number;
    flatFeeSource?: string;
    customFeesApplied?: number;

    // Temporal Attributes (TS Section 3.3)
    invoiceDueDate: string;
    invoiceIssuedDate?: string;
    daysPastDue: number;
    gracePeriodDays: number;
    effectiveDueDate?: string;

    // Level Timestamps
    reminderProposedAt?: string;
    reminderApprovedAt?: string;
    reminderApprovedBy?: string;
    reminderSentAt?: string;

    dunningLevel1ProposedAt?: string;
    dunningLevel1ApprovedAt?: string;
    dunningLevel1ApprovedBy?: string;
    dunningLevel1SentAt?: string;

    dunningLevel2ProposedAt?: string;
    dunningLevel2ApprovedAt?: string;
    dunningLevel2ApprovedBy?: string;
    dunningLevel2SentAt?: string;

    dunningLevel3InitiatedAt?: string;
    dunningLevel3InitiatedBy?: string;
    dunningLevel3ApprovedAt?: string;
    dunningLevel3ApprovedBy?: string[];
    dunningLevel3SentAt?: string;

    escalationPreparedAt?: string;
    escalationPreparedBy?: string;

    // Settlement & Resolution
    settledAt?: string;
    settledBy?: string;
    settledAmount?: number;
    settlementReference?: string;

    writtenOffAt?: string;
    writtenOffBy?: string;
    writtenOffAmount?: number;
    writeOffReason?: string;
    writeOffReasonCode?: string;

    // Dispute (TS Section 14)
    isDisputed: boolean;
    disputedAt?: string;
    disputedBy?: string;
    disputeReason?: string;
    disputeAmount?: number;
    disputeResolvedAt?: string;
    disputeResolvedBy?: string;
    disputeResolution?: string;

    // Customer Context (TS Section 6.4)
    customerType?: string;
    customerJurisdiction?: string;
    customerLanguage: string;
    customerDunningBlocked: boolean;
    customerPaymentHistory?: string;
    customerRiskScore?: number;

    // Contract Context (TS Section 6.5)
    contractId?: string;
    contractPaymentTerms?: string;
    contractCustomDunningRules?: any;

    // Communication Tracking
    lastCommunicationAt?: string;
    lastCommunicationType?: string;
    communicationCount: number;

    // Automation & Proposals (TS Section 9)
    hasActiveProposal: boolean;
    activeProposalId?: string;
    activeProposalLevel?: string;

    // Data Verification (TS Section 6)
    lastVerificationAt?: string;
    verificationStatus?: string;
    verificationErrors?: any;
    dataSourcesChecked: string[];

    // Metadata & Classification (TS Section 3.4)
    metadata?: any;
    tags: string[];
    systemTags: string[];
    confidenceScore: number;
    validationMode: string;
    locale: string;
    language: string;

    // Explain-Why (TS Section 9.8)
    lastDecisionExplanation?: string;
    lastRuleApplied?: string;
    lastRuleVersion?: string;

    // Event Chain
    version: number;
    eventCount: number;
    lastEventId?: string;

    // Audit
    createdAt: string;
    createdBy?: string;
    updatedAt: string;

    // Archival
    archivedAt?: string;
    archivedBy?: string;
    archiveReason?: string;

    // Organization
    organizationId: string;

    // Relations
    events?: DunningEvent[];
    proposals?: DunningProposal[];
    communications?: DunningCommunication[];
    interestAccruals?: DunningInterestAccrual[];
    fees?: DunningFee[];
    disputes?: DunningDisputeRecord[];
}

/**
 * Dunning Event (TS Section 4)
 */
export interface DunningEvent {
    id: string;
    eventId: string;
    dunningId: string;

    eventType: DunningEventType | string;
    timestamp: string;
    effectiveDate?: string;

    actorId: string;
    actorName?: string;
    actorType: string;

    payload: any;
    previousState?: any;

    previousEventId?: string;
    contentHash?: string;

    // Explain-Why (TS Section 9.8)
    explanation?: string;
    ruleId?: string;
    ruleVersion?: string;
    dataSourcesChecked: string[];
    inputSnapshot?: any;
    decision?: string;

    metadata?: any;

    isReversed: boolean;
    reversedBy?: string;
    reversalOf?: string;
}

/**
 * Dunning Proposal (TS Section 8, 9)
 */
export interface DunningProposal {
    id: string;
    proposalId: string;
    dunningId: string;

    proposalType: ProposalType | string;
    proposalLevel: number;
    status: ProposalStatus | string;
    priority: ProposalPriority | string;

    // Financial
    outstandingAmount: number;
    interestProposed: number;
    feesProposed: number;
    totalProposed: number;
    currency: string;

    // Data Verification (TS Section 6)
    verificationStatus: string;
    verificationChecks: VerificationChecks;
    verificationErrors?: any;
    invoiceVerified: boolean;
    paymentVerified: boolean;
    disputeVerified: boolean;
    customerVerified: boolean;
    contractVerified: boolean;
    priorDunningVerified: boolean;

    // Confidence (TS Section 9.4)
    confidenceScore: number;
    confidenceFactors?: any;

    // Explain-Why (TS Section 9.8)
    ruleId?: string;
    ruleVersion?: string;
    dataSourcesChecked: string[];
    inputSnapshot?: any;
    explanation: string;

    // Template
    templateId?: string;
    templateVersion?: string;
    generatedContent?: any;

    // Deadline
    deadline?: string;
    expiresAt?: string;

    // Resolution
    approvedAt?: string;
    approvedBy?: string;
    rejectedAt?: string;
    rejectedBy?: string;
    rejectionReason?: string;
    sentAt?: string;
    sentBy?: string;

    // Timestamps
    proposedAt: string;
    proposedBy: string;

    organizationId: string;
}

/**
 * Verification Checks Result (TS Section 6)
 */
export interface VerificationChecks {
    invoice: {
        verified: boolean;
        status?: string;
        outstandingAmount?: number;
        dueDate?: string;
        daysPastDue?: number;
        errors?: string[];
    };
    payment: {
        verified: boolean;
        totalPaid?: number;
        lastPaymentDate?: string;
        pendingPayments?: boolean;
        errors?: string[];
    };
    dispute: {
        verified: boolean;
        hasActiveDispute?: boolean;
        disputeDetails?: any;
        errors?: string[];
    };
    customer: {
        verified: boolean;
        jurisdiction?: string;
        language?: string;
        dunningBlocked?: boolean;
        status?: string;
        errors?: string[];
    };
    contract: {
        verified: boolean;
        paymentTerms?: string;
        gracePeriod?: number;
        customRules?: any;
        errors?: string[];
    };
    priorDunning: {
        verified: boolean;
        lastLevel?: number;
        lastSentAt?: string;
        minimumIntervalMet?: boolean;
        errors?: string[];
    };
}

/**
 * Dunning Communication (TS Section 12)
 */
export interface DunningCommunication {
    id: string;
    communicationId: string;
    dunningId: string;
    proposalId?: string;

    communicationType: string;
    level: number;
    channel: CommunicationChannel | string;
    status: CommunicationStatus | string;

    recipientName: string;
    recipientEmail?: string;
    recipientAddress?: any;
    recipientLanguage: string;

    templateId: string;
    templateVersion?: string;
    subject?: string;
    bodyHtml?: string;
    bodyText?: string;
    attachments?: any[];

    outstandingAmount: number;
    interestAmount: number;
    feesAmount: number;
    totalDue: number;
    currency: string;
    paymentDeadline?: string;
    paymentInstructions?: any;

    scheduledAt?: string;
    sentAt?: string;
    sentBy?: string;
    deliveredAt?: string;
    failedAt?: string;
    failureReason?: string;
    retryCount: number;
    lastRetryAt?: string;

    externalMessageId?: string;
    postalTrackingNumber?: string;

    createdAt: string;
    createdBy?: string;

    organizationId: string;
}

/**
 * Dunning Interest Accrual (TS Section 11)
 */
export interface DunningInterestAccrual {
    id: string;
    accrualId: string;
    dunningId: string;

    periodStart: string;
    periodEnd: string;
    daysInPeriod: number;

    principalBase: number;
    interestRate: number;
    rateSource: InterestRateSource | string;
    dayCountBasis: string;

    amount: number;
    currency: string;
    amountInReporting?: number;
    fxRate?: number;

    jurisdictionId?: string;
    statutoryRate?: number;

    status: string;
    appliedAt?: string;
    appliedBy?: string;
    reversedAt?: string;
    reversedBy?: string;

    calculationDetails?: any;
    explanation?: string;

    createdAt: string;
    createdBy?: string;
}

/**
 * Dunning Fee (TS Section 11)
 */
export interface DunningFee {
    id: string;
    feeId: string;
    dunningId: string;

    feeType: FeeType | string;
    feeSource: FeeSource | string;
    description?: string;

    amount: number;
    currency: string;
    amountInReporting?: number;
    fxRate?: number;

    baseAmount?: number;
    percentage?: number;

    jurisdictionId?: string;
    jurisdictionLimit?: number;

    dunningLevel?: number;

    status: FeeStatus | string;
    appliedAt?: string;
    appliedBy?: string;
    waivedAt?: string;
    waivedBy?: string;
    waiverReason?: string;
    reversedAt?: string;
    reversedBy?: string;

    explanation?: string;

    createdAt: string;
    createdBy?: string;
}

/**
 * Dunning Dispute Record (TS Section 14)
 */
export interface DunningDisputeRecord {
    id: string;
    disputeId: string;
    dunningId: string;

    status: DisputeStatus | string;
    disputeType?: string;
    reason: string;
    description?: string;
    disputedAmount?: number;
    currency?: string;

    resolution?: string;
    resolutionType?: string;
    adjustedAmount?: number;
    resolvedAt?: string;
    resolvedBy?: string;

    attachments?: any[];
    comments?: any[];
    escalationNotes?: string;

    escalatedAt?: string;
    escalatedTo?: string;
    escalationLevel: number;

    slaDeadline?: string;
    isOverdue: boolean;

    openedAt: string;
    openedBy: string;
    updatedAt: string;

    organizationId: string;
}

/**
 * Dunning Import Batch (TS Section 13)
 */
export interface DunningImportBatch {
    id: string;
    batchNumber: string;

    source: DunningImportSource | string;
    sourceIdentifier?: string;
    sourceHash?: string;

    totalRecords: number;
    successCount: number;
    errorCount: number;
    warningCount: number;
    skippedCount: number;

    status: string;
    importMode: DunningImportMode | string;

    dateFrom?: string;
    dateTo?: string;
    customerFilter?: string;

    fieldMapping?: any;
    mappingTemplate?: string;

    errors?: any[];
    warnings?: any[];
    createdDunningIds: string[];

    canRollback: boolean;
    rolledBackAt?: string;
    rolledBackBy?: string;

    importedBy: string;
    importedByName?: string;
    startedAt: string;
    completedAt?: string;

    organizationId: string;
}

/**
 * Dunning Automation Rule (TS Section 9)
 */
export interface DunningAutomationRule {
    id: string;
    name: string;
    code: string;
    description?: string;

    triggerType: AutomationTriggerType | string;
    triggerConditions?: any;
    schedule?: string;

    dunningLevels: number[];
    customerTypes: string[];
    jurisdictions: string[];
    invoiceAmountMin?: number;
    invoiceAmountMax?: number;

    // Timing (TS Section 8)
    reminderDaysAfterDue: number;
    level1DaysAfterDue: number;
    level2DaysAfterDue: number;
    minimumIntervalDays: number;

    actionType: AutomationActionType | string;
    actionConfig?: any;

    confidenceThreshold: number;
    proposalThreshold: number;

    requiresApproval: boolean;
    approverRoles: string[];
    multiSignatureRequired: boolean;
    multiSignatureCount: number;

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
    createdBy?: string;
    updatedAt: string;

    organizationId: string;
}

/**
 * Dunning Exception (TS Section 9.5)
 */
export interface DunningException {
    id: string;

    dunningId?: string;
    proposalId?: string;
    sourceObjectId?: string;
    sourceObjectType?: string;
    sourceModule?: string;

    exceptionType: DunningExceptionType | string;
    exceptionCode?: string;
    exceptionMessage: string;
    exceptionDetails?: any;

    validationMode?: string;
    validationErrors?: any;
    confidenceScore?: number;
    dataSourcesChecked: string[];

    assignedTo?: string;
    assignedName?: string;
    assignedAt?: string;

    slaDeadline?: string;
    isOverdue: boolean;

    escalationLevel: number;
    escalatedTo?: string;
    escalatedAt?: string;

    status: DunningExceptionStatus | string;
    resolvedAt?: string;
    resolvedBy?: string;
    resolution?: string;
    resolutionAction?: string;

    retryCount: number;
    maxRetries: number;
    lastRetryAt?: string;
    nextRetryAt?: string;

    createdAt: string;

    organizationId: string;
}

/**
 * Dunning Template (TS Section 12.3)
 */
export interface DunningTemplate {
    id: string;
    code: string;
    name: string;
    description?: string;

    dunningLevel: number;
    templateType: string;
    jurisdictionId?: string;
    language: string;
    customerType?: string;

    subject?: string;
    bodyHtml?: string;
    bodyText?: string;
    headerHtml?: string;
    footerHtml?: string;

    tone: TemplateTone | string;

    availableVariables: string[];
    requiredVariables: string[];

    legalDisclaimer?: string;
    includesInterest: boolean;
    includesFees: boolean;
    includesLegalWarning: boolean;

    version: number;
    isActive: boolean;
    previousVersionId?: string;

    createdAt: string;
    createdBy?: string;
    updatedAt: string;

    organizationId: string;
}

/**
 * Dunning Saved View (TS Section 15.3)
 */
export interface DunningSavedView {
    id: string;
    name: string;
    description?: string;

    filters?: any;
    columns: string[];
    sortBy?: string;
    sortOrder: string;
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

    organizationId: string;
}

/**
 * Dunning Jurisdiction Config (TS Section 10)
 */
export interface DunningJurisdictionConfig {
    id: string;
    jurisdictionId: string;
    jurisdictionName: string;
    country: string;
    region?: string;

    statutoryInterestRateB2B?: number;
    statutoryInterestRateB2C?: number;
    interestRateReference?: string;

    flatFeeAllowedB2B: boolean;
    flatFeeAmountB2B?: number;
    flatFeeAllowedB2C: boolean;
    flatFeeAmountB2C?: number;
    maxFeePercentage?: number;

    defaultGracePeriodDays: number;
    reminderAfterDays: number;
    level1AfterDays: number;
    level2AfterDays: number;
    level3MinDays: number;

    requiresWrittenNotice: boolean;
    requiresRegisteredMail: boolean;
    formalRequirements?: any;

    defaultLanguage: string;
    supportedLanguages: string[];

    defaultToneReminder: string;
    defaultToneLevel1: string;
    defaultToneLevel2: string;
    defaultToneLevel3: string;

    consumerProtectionRules?: any;

    isActive: boolean;
    updatedAt: string;

    organizationId: string;
}

// =============================================================================
// API REQUEST TYPES
// =============================================================================

/**
 * Create Dunning Request
 */
export interface CreateDunningRequest {
    // Required
    invoiceId: string;
    customerId: string;
    customerName: string;
    originalAmount: number;
    outstandingAmount: number;
    currency: string;
    invoiceDueDate: string;

    // Optional Identity
    partyId?: string;
    legalEntityId?: string;
    jurisdictionId?: string;
    reportingCurrency?: string;

    // Optional Financial
    fxRateAtCreation?: number;

    // Optional Customer Context
    customerType?: string;
    customerJurisdiction?: string;
    customerLanguage?: string;
    customerPaymentHistory?: string;
    customerRiskScore?: number;

    // Optional Contract Context
    contractId?: string;
    contractPaymentTerms?: string;
    contractCustomDunningRules?: any;
    gracePeriodDays?: number;

    // Optional Metadata
    metadata?: any;
    tags?: string[];
    validationMode?: string;
    locale?: string;
    language?: string;
}

/**
 * Approve Proposal Request
 */
export interface ApproveProposalRequest {
    notes?: string;
    modifiedInterest?: number;
    modifiedFees?: number;
    deadline?: string;
}

/**
 * Reject Proposal Request
 */
export interface RejectProposalRequest {
    reason: string;
}

/**
 * Send Communication Request
 */
export interface SendCommunicationRequest {
    channel: CommunicationChannel | string;
    recipientEmail?: string;
    recipientAddress?: any;
    templateId?: string;
    customSubject?: string;
    customBody?: string;
    scheduledAt?: string;
}

/**
 * Initiate Level 3 Request (Manual Only - TS Section 8.4)
 */
export interface InitiateLevel3Request {
    reason: string;
    notes?: string;
    deadline?: string;
}

/**
 * Approve Level 3 Request (Multi-Signature)
 */
export interface ApproveLevel3Request {
    notes?: string;
}

/**
 * Dispute Request (TS Section 14)
 */
export interface DisputeDunningRequest {
    reason: string;
    disputeType?: string;
    description?: string;
    disputedAmount?: number;
    attachments?: any[];
}

/**
 * Resolve Dispute Request
 */
export interface ResolveDisputeRequest {
    resolution: string;
    resolutionType: DisputeResolutionType | string;
    adjustedAmount?: number;
    notes?: string;
}

/**
 * Settle Dunning Request
 */
export interface SettleDunningRequest {
    amount: number;
    settlementDate?: string;
    reference?: string;
    notes?: string;
}

/**
 * Write Off Request
 */
export interface WriteOffDunningRequest {
    reason: string;
    reasonCode: string;
    amount?: number;
}

/**
 * Calculate Interest Request
 */
export interface CalculateInterestRequest {
    periodStart?: string;
    periodEnd?: string;
    rate?: number;
    rateSource?: string;
    apply?: boolean;
}

/**
 * Apply Fee Request
 */
export interface ApplyFeeRequest {
    feeType: FeeType | string;
    amount: number;
    description?: string;
    dunningLevel?: number;
}

/**
 * Waive Fee Request
 */
export interface WaiveFeeRequest {
    feeId: string;
    reason: string;
}

/**
 * Import Dunning Request (TS Section 13)
 */
export interface ImportDunningRequest {
    source: DunningImportSource | string;
    mode: DunningImportMode | string;
    data: any[];
    fieldMapping?: Record<string, string>;
    dateFrom?: string;
    dateTo?: string;
    customerFilter?: string;
}

/**
 * Bulk Approve Proposals Request (TS Section 9.7)
 * Note: Level 3 NEVER included in bulk operations
 */
export interface BulkApproveProposalsRequest {
    proposalIds: string[];
    notes?: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Dunning List Response
 */
export interface DunningListResponse {
    dunnings: Dunning[];
    pagination: DunningPagination;
    statistics: DunningStatistics;
}

/**
 * Dunning Detail Response
 */
export interface DunningDetailResponse {
    dunning: Dunning;
    events?: DunningEvent[];
    proposals?: DunningProposal[];
    communications?: DunningCommunication[];
    interestAccruals?: DunningInterestAccrual[];
    fees?: DunningFee[];
    disputes?: DunningDisputeRecord[];
}

/**
 * Time Travel Response (TS Section 4.2)
 */
export interface TimeTravelResponse {
    dunning: Dunning;
    reconstructedFrom: string[];
    eventsApplied: number;
    asOfDate: string;
}

/**
 * Proposals List Response
 */
export interface ProposalsListResponse {
    proposals: DunningProposal[];
    pagination: DunningPagination;
    statistics: {
        pending: number;
        highPriority: number;
        normalPriority: number;
        lowPriority: number;
        byLevel: Record<string, number>;
    };
}

/**
 * Pagination
 */
export interface DunningPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

/**
 * Statistics (TS Section 15.1)
 */
export interface DunningStatistics {
    totalCount: number;
    totalOutstanding: number;
    totalInterest: number;
    totalFees: number;
    totalDue: number;

    byStatus: Record<string, { count: number; outstanding: number }>;
    byLevel: Record<number, { count: number; outstanding: number }>;
    byCurrency: Record<string, { count: number; outstanding: number }>;
    byJurisdiction: Record<string, { count: number; outstanding: number }>;

    // Key Metrics (TS Section 15.1)
    dso?: number; // Days Sales Outstanding
    overdueAging: {
        days1to30: { count: number; amount: number };
        days31to60: { count: number; amount: number };
        days61to90: { count: number; amount: number };
        days90plus: { count: number; amount: number };
    };
    recoveryRate?: number;
    disputeRate?: number;

    // Pending
    pendingProposals: number;
    activeDisputes: number;
}

/**
 * Filters
 */
export interface DunningFilters {
    status?: string;
    statuses?: string[];
    currentLevel?: number;
    levels?: number[];
    customerId?: string;
    customerName?: string;
    invoiceId?: string;
    partyId?: string;
    legalEntityId?: string;
    jurisdictionId?: string;
    currency?: string;
    customerType?: string;
    isDisputed?: boolean;
    hasActiveProposal?: boolean;
    daysPastDueMin?: number;
    daysPastDueMax?: number;
    amountMin?: number;
    amountMax?: number;
    dueDateFrom?: string;
    dueDateTo?: string;
    createdFrom?: string;
    createdTo?: string;
    tags?: string[];
    search?: string;
}

// =============================================================================
// STATE MACHINE (TS Section 7)
// =============================================================================

/**
 * Valid Status Transitions (TS Section 7.2)
 */
export const DUNNING_STATUS_TRANSITIONS: Record<string, string[]> = {
    [DunningStatus.ISSUED]: [
        DunningStatus.DUE,
    ],
    [DunningStatus.DUE]: [
        DunningStatus.OVERDUE,
        DunningStatus.SETTLED,
    ],
    [DunningStatus.OVERDUE]: [
        DunningStatus.REMINDER_AUTO_PROPOSED,
        DunningStatus.SETTLED,
        DunningStatus.DISPUTED,
    ],
    [DunningStatus.REMINDER_AUTO_PROPOSED]: [
        DunningStatus.REMINDER_SENT,
        DunningStatus.SETTLED,
        DunningStatus.DISPUTED,
    ],
    [DunningStatus.REMINDER_SENT]: [
        DunningStatus.DUNNING_LEVEL1_AUTO_PROPOSED,
        DunningStatus.SETTLED,
        DunningStatus.DISPUTED,
    ],
    [DunningStatus.DUNNING_LEVEL1_AUTO_PROPOSED]: [
        DunningStatus.DUNNING_LEVEL1_SENT,
        DunningStatus.SETTLED,
        DunningStatus.DISPUTED,
    ],
    [DunningStatus.DUNNING_LEVEL1_SENT]: [
        DunningStatus.DUNNING_LEVEL2_AUTO_PROPOSED,
        DunningStatus.SETTLED,
        DunningStatus.DISPUTED,
    ],
    [DunningStatus.DUNNING_LEVEL2_AUTO_PROPOSED]: [
        DunningStatus.DUNNING_LEVEL2_SENT,
        DunningStatus.SETTLED,
        DunningStatus.DISPUTED,
    ],
    [DunningStatus.DUNNING_LEVEL2_SENT]: [
        DunningStatus.DUNNING_LEVEL3_PENDING, // Manual initiation only
        DunningStatus.SETTLED,
        DunningStatus.DISPUTED,
    ],
    [DunningStatus.DUNNING_LEVEL3_PENDING]: [
        DunningStatus.DUNNING_LEVEL3_SENT,
        DunningStatus.SETTLED,
        DunningStatus.DISPUTED,
    ],
    [DunningStatus.DUNNING_LEVEL3_SENT]: [
        DunningStatus.ESCALATION_PREPARED,
        DunningStatus.SETTLED,
        DunningStatus.WRITTEN_OFF,
        DunningStatus.DISPUTED,
    ],
    [DunningStatus.ESCALATION_PREPARED]: [
        DunningStatus.SETTLED,
        DunningStatus.WRITTEN_OFF,
    ],
    [DunningStatus.DISPUTED]: [
        // Can return to previous state after resolution
        DunningStatus.OVERDUE,
        DunningStatus.REMINDER_SENT,
        DunningStatus.DUNNING_LEVEL1_SENT,
        DunningStatus.DUNNING_LEVEL2_SENT,
        DunningStatus.DUNNING_LEVEL3_SENT,
        DunningStatus.SETTLED,
        DunningStatus.WRITTEN_OFF,
    ],
    [DunningStatus.SETTLED]: [], // Terminal state
    [DunningStatus.WRITTEN_OFF]: [], // Terminal state
};

/**
 * Check if transition is valid
 */
export function canTransitionTo(currentStatus: string, targetStatus: string): boolean {
    const allowedTransitions = DUNNING_STATUS_TRANSITIONS[currentStatus] || [];
    return allowedTransitions.includes(targetStatus);
}

/**
 * Check if dunning can receive proposals
 */
export function canReceiveProposal(status: string): boolean {
    const proposableStatuses = [
        DunningStatus.OVERDUE,
        DunningStatus.REMINDER_SENT,
        DunningStatus.DUNNING_LEVEL1_SENT,
        DunningStatus.DUNNING_LEVEL2_SENT,
    ];
    return proposableStatuses.includes(status as DunningStatus);
}

/**
 * Check if dunning can be disputed
 */
export function canBeDisputed(status: string): boolean {
    const disputableStatuses = [
        DunningStatus.OVERDUE,
        DunningStatus.REMINDER_AUTO_PROPOSED,
        DunningStatus.REMINDER_SENT,
        DunningStatus.DUNNING_LEVEL1_AUTO_PROPOSED,
        DunningStatus.DUNNING_LEVEL1_SENT,
        DunningStatus.DUNNING_LEVEL2_AUTO_PROPOSED,
        DunningStatus.DUNNING_LEVEL2_SENT,
        DunningStatus.DUNNING_LEVEL3_PENDING,
        DunningStatus.DUNNING_LEVEL3_SENT,
    ];
    return disputableStatuses.includes(status as DunningStatus);
}

/**
 * Check if dunning can be settled
 */
export function canBeSettled(status: string): boolean {
    const settlableStatuses = [
        DunningStatus.DUE,
        DunningStatus.OVERDUE,
        DunningStatus.REMINDER_AUTO_PROPOSED,
        DunningStatus.REMINDER_SENT,
        DunningStatus.DUNNING_LEVEL1_AUTO_PROPOSED,
        DunningStatus.DUNNING_LEVEL1_SENT,
        DunningStatus.DUNNING_LEVEL2_AUTO_PROPOSED,
        DunningStatus.DUNNING_LEVEL2_SENT,
        DunningStatus.DUNNING_LEVEL3_PENDING,
        DunningStatus.DUNNING_LEVEL3_SENT,
        DunningStatus.ESCALATION_PREPARED,
        DunningStatus.DISPUTED,
    ];
    return settlableStatuses.includes(status as DunningStatus);
}

/**
 * Check if Level 3 can be initiated (Manual Only - TS Section 8.4)
 */
export function canInitiateLevel3(status: string): boolean {
    return status === DunningStatus.DUNNING_LEVEL2_SENT;
}

// =============================================================================
// ID GENERATION
// =============================================================================

/**
 * Generate deterministic Dunning ID
 */
export function generateDunningId(
    organizationId: string,
    invoiceId: string,
    createdAt: Date
): string {
    const year = createdAt.getFullYear();
    const month = String(createdAt.getMonth() + 1).padStart(2, '0');
    const hash = simpleHash(`${organizationId}-${invoiceId}-${createdAt.getTime()}`);
    return `DUN-${year}${month}-${hash.substring(0, 8).toUpperCase()}`;
}

/**
 * Generate human-readable dunning number
 */
export function generateDunningNumber(
    jurisdictionId: string,
    sequence: number,
    year: number
): string {
    const prefix = jurisdictionId ? jurisdictionId.substring(0, 2).toUpperCase() : 'XX';
    const seq = String(sequence).padStart(6, '0');
    return `${prefix}-${year}-${seq}`;
}

/**
 * Generate Event ID (deterministic, content-hash based)
 */
export function generateEventId(
    dunningId: string,
    eventType: string,
    timestamp: Date
): string {
    const hash = simpleHash(`${dunningId}-${eventType}-${timestamp.getTime()}`);
    return `evt_${dunningId.replace(/[^a-zA-Z0-9]/g, '')}_${eventType.toLowerCase()}_${hash.substring(0, 8)}`;
}

/**
 * Generate Proposal ID
 */
export function generateProposalId(
    dunningId: string,
    level: number,
    timestamp: Date
): string {
    return `PROP-${dunningId}-L${level}-${timestamp.getTime()}`;
}

/**
 * Simple hash function for ID generation
 */
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}

// =============================================================================
// CALCULATION HELPERS (TS Section 11)
// =============================================================================

/**
 * Calculate late payment interest
 */
export function calculateInterest(
    principal: number,
    annualRate: number,
    days: number,
    dayCountBasis: DayCountBasis = DayCountBasis.ACTUAL_365
): number {
    const daysInYear = dayCountBasis === DayCountBasis.ACTUAL_360 ? 360 : 365;
    return (principal * annualRate * days) / daysInYear;
}

/**
 * Calculate days past due
 */
export function calculateDaysPastDue(
    dueDate: Date,
    currentDate: Date = new Date(),
    gracePeriodDays: number = 0
): number {
    const effectiveDueDate = new Date(dueDate);
    effectiveDueDate.setDate(effectiveDueDate.getDate() + gracePeriodDays);

    const diffTime = currentDate.getTime() - effectiveDueDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
}

/**
 * Calculate total due
 */
export function calculateTotalDue(
    outstanding: number,
    interest: number,
    fees: number
): number {
    return outstanding + interest + fees;
}

/**
 * Determine proposal priority based on confidence (TS Section 9.4)
 */
export function determineProposalPriority(confidenceScore: number): ProposalPriority {
    if (confidenceScore >= 0.9) return ProposalPriority.HIGH;
    if (confidenceScore >= 0.7) return ProposalPriority.NORMAL;
    return ProposalPriority.LOW;
}

/**
 * Check if proposal should go to exception queue
 */
export function shouldRouteToExceptionQueue(confidenceScore: number): boolean {
    return confidenceScore < 0.7;
}

/**
 * Get next dunning level
 */
export function getNextDunningLevel(currentLevel: number): number | null {
    if (currentLevel >= DunningLevel.LEVEL_3) return null;
    return currentLevel + 1;
}

/**
 * Check if level can be auto-proposed (TS Section 8.5)
 */
export function canAutoPropose(level: number): boolean {
    // Level 3 is NEVER auto-proposed
    return level < DunningLevel.LEVEL_3;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const ALL_DUNNING_STATUSES = Object.values(DunningStatus);
export const ALL_DUNNING_EVENT_TYPES = Object.values(DunningEventType);
export const ALL_DUNNING_LEVELS = Object.values(DunningLevel);
export const ALL_PROPOSAL_TYPES = Object.values(ProposalType);
export const ALL_FEE_TYPES = Object.values(FeeType);
export const ALL_DISPUTE_TYPES = Object.values(DisputeType);

/**
 * Confidence Thresholds (TS Section 9.4)
 */
export const CONFIDENCE_AUTO_THRESHOLD = 0.95;
export const CONFIDENCE_PROPOSAL_THRESHOLD = 0.70;
export const CONFIDENCE_EXCEPTION_THRESHOLD = 0.70;

/**
 * Default Timing (TS Section 8)
 */
export const DEFAULT_REMINDER_DAYS = 3;
export const DEFAULT_LEVEL1_DAYS = 14;
export const DEFAULT_LEVEL2_DAYS = 30;
export const DEFAULT_LEVEL3_MIN_DAYS = 45;
export const DEFAULT_MINIMUM_INTERVAL_DAYS = 7;

/**
 * Data Sources to Check (TS Section 5.1)
 */
export const DATA_SOURCES = [
    'invoices',
    'payments',
    'receivables',
    'customers',
    'contracts',
    'treasury',
    'fx',
    'tax_rules',
] as const;

// =============================================================================
// i18n LABELS (TS Section 16)
// =============================================================================

export const DUNNING_LABELS = {
    status: {
        en: {
            [DunningStatus.ISSUED]: 'Issued',
            [DunningStatus.DUE]: 'Due',
            [DunningStatus.OVERDUE]: 'Overdue',
            [DunningStatus.REMINDER_AUTO_PROPOSED]: 'Reminder Proposed',
            [DunningStatus.REMINDER_SENT]: 'Reminder Sent',
            [DunningStatus.DUNNING_LEVEL1_AUTO_PROPOSED]: 'Level 1 Proposed',
            [DunningStatus.DUNNING_LEVEL1_SENT]: 'Level 1 Sent',
            [DunningStatus.DUNNING_LEVEL2_AUTO_PROPOSED]: 'Level 2 Proposed',
            [DunningStatus.DUNNING_LEVEL2_SENT]: 'Level 2 Sent',
            [DunningStatus.DUNNING_LEVEL3_PENDING]: 'Level 3 Pending',
            [DunningStatus.DUNNING_LEVEL3_SENT]: 'Level 3 Sent',
            [DunningStatus.ESCALATION_PREPARED]: 'Escalation Prepared',
            [DunningStatus.SETTLED]: 'Settled',
            [DunningStatus.WRITTEN_OFF]: 'Written Off',
            [DunningStatus.DISPUTED]: 'Disputed',
        },
        de: {
            [DunningStatus.ISSUED]: 'Erstellt',
            [DunningStatus.DUE]: 'Fällig',
            [DunningStatus.OVERDUE]: 'Überfällig',
            [DunningStatus.REMINDER_AUTO_PROPOSED]: 'Zahlungserinnerung vorgeschlagen',
            [DunningStatus.REMINDER_SENT]: 'Zahlungserinnerung versendet',
            [DunningStatus.DUNNING_LEVEL1_AUTO_PROPOSED]: 'Mahnung 1 vorgeschlagen',
            [DunningStatus.DUNNING_LEVEL1_SENT]: 'Mahnung 1 versendet',
            [DunningStatus.DUNNING_LEVEL2_AUTO_PROPOSED]: 'Mahnung 2 vorgeschlagen',
            [DunningStatus.DUNNING_LEVEL2_SENT]: 'Mahnung 2 versendet',
            [DunningStatus.DUNNING_LEVEL3_PENDING]: 'Mahnung 3 ausstehend',
            [DunningStatus.DUNNING_LEVEL3_SENT]: 'Mahnung 3 versendet',
            [DunningStatus.ESCALATION_PREPARED]: 'Eskalation vorbereitet',
            [DunningStatus.SETTLED]: 'Beglichen',
            [DunningStatus.WRITTEN_OFF]: 'Abgeschrieben',
            [DunningStatus.DISPUTED]: 'Strittig',
        },
        es: {
            [DunningStatus.ISSUED]: 'Emitido',
            [DunningStatus.DUE]: 'Vencido',
            [DunningStatus.OVERDUE]: 'Atrasado',
            [DunningStatus.REMINDER_AUTO_PROPOSED]: 'Recordatorio propuesto',
            [DunningStatus.REMINDER_SENT]: 'Recordatorio enviado',
            [DunningStatus.DUNNING_LEVEL1_AUTO_PROPOSED]: 'Nivel 1 propuesto',
            [DunningStatus.DUNNING_LEVEL1_SENT]: 'Nivel 1 enviado',
            [DunningStatus.DUNNING_LEVEL2_AUTO_PROPOSED]: 'Nivel 2 propuesto',
            [DunningStatus.DUNNING_LEVEL2_SENT]: 'Nivel 2 enviado',
            [DunningStatus.DUNNING_LEVEL3_PENDING]: 'Nivel 3 pendiente',
            [DunningStatus.DUNNING_LEVEL3_SENT]: 'Nivel 3 enviado',
            [DunningStatus.ESCALATION_PREPARED]: 'Escalación preparada',
            [DunningStatus.SETTLED]: 'Liquidado',
            [DunningStatus.WRITTEN_OFF]: 'Cancelado',
            [DunningStatus.DISPUTED]: 'En disputa',
        },
        fr: {
            [DunningStatus.ISSUED]: 'Émis',
            [DunningStatus.DUE]: 'Dû',
            [DunningStatus.OVERDUE]: 'En retard',
            [DunningStatus.REMINDER_AUTO_PROPOSED]: 'Rappel proposé',
            [DunningStatus.REMINDER_SENT]: 'Rappel envoyé',
            [DunningStatus.DUNNING_LEVEL1_AUTO_PROPOSED]: 'Niveau 1 proposé',
            [DunningStatus.DUNNING_LEVEL1_SENT]: 'Niveau 1 envoyé',
            [DunningStatus.DUNNING_LEVEL2_AUTO_PROPOSED]: 'Niveau 2 proposé',
            [DunningStatus.DUNNING_LEVEL2_SENT]: 'Niveau 2 envoyé',
            [DunningStatus.DUNNING_LEVEL3_PENDING]: 'Niveau 3 en attente',
            [DunningStatus.DUNNING_LEVEL3_SENT]: 'Niveau 3 envoyé',
            [DunningStatus.ESCALATION_PREPARED]: 'Escalade préparée',
            [DunningStatus.SETTLED]: 'Réglé',
            [DunningStatus.WRITTEN_OFF]: 'Passé en pertes',
            [DunningStatus.DISPUTED]: 'Contesté',
        },
    },
    level: {
        en: {
            [DunningLevel.NONE]: 'None',
            [DunningLevel.REMINDER]: 'Payment Reminder',
            [DunningLevel.LEVEL_1]: 'Dunning Level 1',
            [DunningLevel.LEVEL_2]: 'Dunning Level 2',
            [DunningLevel.LEVEL_3]: 'Dunning Level 3 (Final)',
        },
        de: {
            [DunningLevel.NONE]: 'Keine',
            [DunningLevel.REMINDER]: 'Zahlungserinnerung',
            [DunningLevel.LEVEL_1]: 'Erste Mahnung',
            [DunningLevel.LEVEL_2]: 'Zweite Mahnung',
            [DunningLevel.LEVEL_3]: 'Dritte Mahnung (Letzte)',
        },
        es: {
            [DunningLevel.NONE]: 'Ninguno',
            [DunningLevel.REMINDER]: 'Recordatorio de pago',
            [DunningLevel.LEVEL_1]: 'Aviso de cobro 1',
            [DunningLevel.LEVEL_2]: 'Aviso de cobro 2',
            [DunningLevel.LEVEL_3]: 'Aviso de cobro 3 (Final)',
        },
        fr: {
            [DunningLevel.NONE]: 'Aucun',
            [DunningLevel.REMINDER]: 'Rappel de paiement',
            [DunningLevel.LEVEL_1]: 'Relance niveau 1',
            [DunningLevel.LEVEL_2]: 'Relance niveau 2',
            [DunningLevel.LEVEL_3]: 'Relance niveau 3 (Finale)',
        },
    },
    tone: {
        en: {
            [TemplateTone.FRIENDLY]: 'Friendly',
            [TemplateTone.FORMAL]: 'Formal',
            [TemplateTone.FIRM]: 'Firm',
            [TemplateTone.FINAL]: 'Final Notice',
        },
        de: {
            [TemplateTone.FRIENDLY]: 'Freundlich',
            [TemplateTone.FORMAL]: 'Förmlich',
            [TemplateTone.FIRM]: 'Bestimmt',
            [TemplateTone.FINAL]: 'Letzte Mahnung',
        },
        es: {
            [TemplateTone.FRIENDLY]: 'Amigable',
            [TemplateTone.FORMAL]: 'Formal',
            [TemplateTone.FIRM]: 'Firme',
            [TemplateTone.FINAL]: 'Aviso final',
        },
        fr: {
            [TemplateTone.FRIENDLY]: 'Amical',
            [TemplateTone.FORMAL]: 'Formel',
            [TemplateTone.FIRM]: 'Ferme',
            [TemplateTone.FINAL]: 'Dernier avis',
        },
    },
};

// =============================================================================
// TEMPLATE VARIABLES (TS Section 12.4)
// =============================================================================

export const TEMPLATE_VARIABLES = [
    // Customer
    '{{customer_name}}',
    '{{customer_address}}',
    '{{customer_email}}',

    // Invoice
    '{{invoice_number}}',
    '{{invoice_date}}',
    '{{invoice_due_date}}',

    // Amounts
    '{{original_amount}}',
    '{{outstanding_amount}}',
    '{{interest_amount}}',
    '{{fees_amount}}',
    '{{total_due}}',
    '{{currency}}',

    // Dunning
    '{{dunning_number}}',
    '{{dunning_level}}',
    '{{days_past_due}}',
    '{{payment_deadline}}',

    // Payment
    '{{bank_name}}',
    '{{iban}}',
    '{{bic}}',
    '{{payment_reference}}',

    // Company
    '{{company_name}}',
    '{{company_address}}',
    '{{company_email}}',
    '{{company_phone}}',

    // Dates
    '{{current_date}}',
    '{{deadline_date}}',
];

// =============================================================================
// WEBHOOK EVENTS (TS Section 19.2)
// =============================================================================

export const WEBHOOK_EVENTS = [
    'dunning.created',
    'dunning.reminder_proposed',
    'dunning.reminder_sent',
    'dunning.level1_proposed',
    'dunning.level1_sent',
    'dunning.level2_proposed',
    'dunning.level2_sent',
    'dunning.level3_initiated',
    'dunning.level3_sent',
    'dunning.disputed',
    'dunning.resolved',
    'dunning.settled',
    'dunning.written_off',
    'payment.received',
] as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[number];