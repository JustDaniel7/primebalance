// =============================================================================
// ARCHIVE MODULE - COMPLETE TYPE SYSTEM (TS Compliant)
// src/types/archive.ts
// =============================================================================

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export enum ArchiveObjectType {
    // Financial Objects (TS Section 2.1)
    INVOICE = 'invoice',
    ORDER = 'order',
    OFFER = 'offer',
    PAYMENT = 'payment',
    CREDIT_NOTE = 'credit_note',
    REFUND = 'refund',
    FX_CONVERSION = 'fx_conversion',
    TREASURY_DECISION = 'treasury_decision',
    CASHFLOW_FORECAST = 'cashflow_forecast',
    VALUATION = 'valuation',
    DEPRECIATION_RUN = 'depreciation_run',
    ASSET_DISPOSAL = 'asset_disposal',
    INTERCOMPANY_TRANSACTION = 'intercompany_transaction',

    // Accounting & Ledger Objects (TS Section 2.2)
    JOURNAL_ENTRY = 'journal_entry',
    LEDGER_SNAPSHOT = 'ledger_snapshot',
    PERIOD_CLOSING = 'period_closing',
    ADJUSTMENT = 'adjustment',
    CORRECTION = 'correction',
    REVERSAL = 'reversal',
    OFF_LEDGER_EVENT = 'off_ledger_event',

    // Compliance & Governance (TS Section 2.3)
    REPORT = 'report',
    TAX_FILING = 'tax_filing',
    AUDIT_TRAIL = 'audit_trail',
    POLICY_RULE = 'policy_rule',
    PRICING_RULE = 'pricing_rule',
    TREASURY_POLICY = 'treasury_policy',
    APPROVAL_DECISION = 'approval_decision',

    // System & User Actions (TS Section 2.4)
    USER_CONFIRMATION = 'user_confirmation',
    MANUAL_OVERRIDE = 'manual_override',
    EXPORT_ACTION = 'export_action',
    SUBMISSION_ACTION = 'submission_action',
    ACCESS_LOG = 'access_log',
}

export enum ArchiveCategory {
    FINANCIAL = 'financial',
    ACCOUNTING = 'accounting',
    COMPLIANCE = 'compliance',
    GOVERNANCE = 'governance',
    SYSTEM = 'system',
    OPERATIONAL = 'operational',
}

export enum ArchiveTriggerType {
    // Mandatory triggers (TS Section 3)
    STATUS_FINALIZATION = 'status_finalization',
    STATE_SUPERSESSION = 'state_supersession',
    PERIOD_CLOSE = 'period_close',
    EXTERNAL_SUBMISSION = 'external_submission',
    LEGAL_TRIGGER = 'legal_trigger',
    USER_ACTION = 'user_action',
    POLICY_REQUIREMENT = 'policy_requirement',
    AUTO_ARCHIVE = 'auto_archive',
    BATCH_JOB = 'batch_job',
    CONFIDENCE_THRESHOLD = 'confidence_threshold',
}

export enum ArchiveStatus {
    ARCHIVED = 'archived',
    ACCESSED = 'accessed',
    EXPORTED = 'exported',
    RETENTION_WARNING = 'retention_warning',
    RETENTION_EXPIRED = 'retention_expired',
    LEGAL_HOLD = 'legal_hold',
}

export enum ArchiveLinkType {
    DERIVES_FROM = 'derives_from',
    GENERATES = 'generates',
    AFFECTS = 'affects',
    REFERENCES = 'references',
    SUPERSEDES = 'supersedes',
    REVERSES = 'reverses',
}

export enum ArchiveLinkDirection {
    INBOUND = 'inbound',
    OUTBOUND = 'outbound',
    BIDIRECTIONAL = 'bidirectional',
}

export enum ValidationMode {
    SOFT = 'soft',
    HARD = 'hard',
}

export enum RetentionStatus {
    ACTIVE = 'active',
    WARNING = 'warning',
    EXPIRED = 'expired',
    EXTENDED = 'extended',
    LEGAL_HOLD = 'legal_hold',
}

export enum ExceptionStatus {
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    RESOLVED = 'resolved',
    ESCALATED = 'escalated',
    AUTO_RESOLVED = 'auto_resolved',
}

export enum ExceptionType {
    VALIDATION_FAILED = 'validation_failed',
    CONFIDENCE_LOW = 'confidence_low',
    RULE_CONFLICT = 'rule_conflict',
    INTEGRITY_ERROR = 'integrity_error',
    MISSING_DATA = 'missing_data',
    DUPLICATE_DETECTED = 'duplicate_detected',
}

export enum ExportFormat {
    PDF = 'pdf',
    XML = 'xml',
    CSV = 'csv',
    JSON = 'json',
    LEGAL_BUNDLE = 'legal_bundle',
}

export enum ExportType {
    FULL = 'full',
    FILTERED = 'filtered',
    SINGLE = 'single',
    BUNDLE = 'bundle',
}

export enum ImportMode {
    DRY_RUN = 'dry_run',
    LIVE = 'live',
    PARTIAL = 'partial',
}

export enum ImportSource {
    LEGACY_SYSTEM = 'legacy_system',
    CSV = 'csv',
    XML = 'xml',
    JSON = 'json',
    API = 'api',
}

export enum AccessType {
    VIEW = 'view',
    SEARCH = 'search',
    EXPORT = 'export',
    DOWNLOAD = 'download',
    API_ACCESS = 'api_access',
}

export enum ActorType {
    USER = 'user',
    SYSTEM = 'system',
    API = 'api',
    AUTOMATION = 'automation',
}

export enum ActorRole {
    ADMIN = 'admin',
    AUDITOR = 'auditor',
    BOARD = 'board',
    INVESTOR = 'investor',
    LEGAL = 'legal',
    USER = 'user',
    API_CONSUMER = 'api_consumer',
}

export enum AutomationAction {
    AUTO_ARCHIVE = 'auto_archive',
    PROPOSE_ARCHIVE = 'propose_archive',
    ROUTE_TO_QUEUE = 'route_to_queue',
}

// =============================================================================
// CORE TYPES
// =============================================================================

export interface ArchiveRecord {
    id: string;

    // Identity (TS Section 4.1)
    archiveRecordId: string;
    originalObjectId: string;
    objectType: ArchiveObjectType | string;
    objectVersion: number;
    parentRecordId?: string;
    legalEntityId?: string;
    partyId?: string;

    // Temporal Metadata (TS Section 4.2)
    createdAt: string;
    archivedAt: string;
    effectiveDate?: string;
    accountingPeriod?: string;
    fiscalYear?: number;
    fiscalPeriod?: string;
    timezone: string;

    // Integrity (TS Section 4.3)
    contentHash: string;
    predecessorHash?: string;
    signature?: string;
    tamperChecksum?: string;
    signatureCount: number;
    integrityVerified: boolean;
    lastVerifiedAt?: string;

    // Context (TS Section 4.4)
    triggerType: ArchiveTriggerType | string;
    triggerReason?: string;
    triggerExplanation?: string;
    initiatingActor?: string;
    initiatingActorName?: string;
    actorType: ActorType | string;
    sourceModule?: string;
    linkedEntityIds: string[];

    // Content
    title: string;
    description?: string;
    content: Record<string, any>;
    contentType: string;
    contentSize?: number;

    // Financial Data
    amount?: number;
    currency: string;
    reportingCurrency?: string;
    fxRateAtArchive?: number;
    amountInReporting?: number;

    // Classification (TS Section 4.5)
    category: ArchiveCategory | string;
    subcategory?: string;
    jurisdictionIds: string[];
    tags: string[];
    systemTags: string[];
    confidenceScore: number;
    validationMode: ValidationMode | string;

    // Localization (TS Section 4.6)
    locale?: string;
    language: string;
    displayFormats?: {
        date?: string;
        number?: string;
        currency?: string;
    };

    // Counterparty
    counterpartyId?: string;
    counterpartyName?: string;
    counterpartyType?: string;

    // Versioning (TS Section 6)
    versionNumber: number;
    isCurrentVersion: boolean;
    supersededBy?: string;
    supersedes?: string;
    versionReason?: string;

    // Retention (TS Section 7)
    retentionPolicyId?: string;
    retentionStartDate?: string;
    retentionEndDate?: string;
    retentionStatus: RetentionStatus | string;
    legalHold: boolean;
    legalHoldReason?: string;
    legalHoldBy?: string;
    legalHoldAt?: string;

    // Status
    status: ArchiveStatus | string;
    accessCount: number;
    lastAccessedAt?: string;
    lastAccessedBy?: string;
    exportCount: number;
    lastExportedAt?: string;

    // Attachments
    attachments?: ArchiveAttachment[];
    documentCount: number;

    // Automation (TS Section 9)
    ruleId?: string;
    ruleVersion?: string;
    explanation?: string;
    proposedBy?: string;
    proposedAt?: string;
    approvedBy?: string;
    approvedAt?: string;

    // Import
    importBatchId?: string;
    importSource?: string;
    importedAt?: string;

    // Relations (populated on request)
    links?: ArchiveLink[];
    linkedBy?: ArchiveLink[];
    versions?: ArchiveVersion[];
    accessLogs?: ArchiveAccessLog[];

    updatedAt: string;
}

// =============================================================================
// LINK TYPES (Netting & Linkage Graph - TS Section 5)
// =============================================================================

export interface ArchiveLink {
    id: string;
    sourceArchiveId: string;
    targetArchiveId: string;
    linkType: ArchiveLinkType | string;
    linkDirection: ArchiveLinkDirection | string;
    linkDescription?: string;
    linkedAt: string;
    linkedBy?: string;
    isImmutable: boolean;
}

export interface LinkageGraph {
    rootId: string;
    nodes: Array<{
        id: string;
        archiveRecordId: string;
        objectType: string;
        title: string;
        archivedAt: string;
    }>;
    edges: Array<{
        sourceId: string;
        targetId: string;
        linkType: string;
        direction: string;
    }>;
    inbound: ArchiveLink[];
    outbound: ArchiveLink[];
}

// =============================================================================
// VERSION TYPES (TS Section 6)
// =============================================================================

export interface ArchiveVersion {
    id: string;
    archiveRecordId: string;
    versionNumber: number;
    versionHash: string;
    previousVersionId?: string;
    contentSnapshot: Record<string, any>;
    changeDescription?: string;
    changedFields: string[];
    createdBy?: string;
    createdByName?: string;
    createdAt: string;
}

export interface VersionChain {
    currentVersion: ArchiveRecord;
    versions: ArchiveVersion[];
    totalVersions: number;
}

// =============================================================================
// ACCESS LOG TYPES (TS Section 11)
// =============================================================================

export interface ArchiveAccessLog {
    id: string;
    archiveRecordId: string;
    accessType: AccessType | string;
    accessReason?: string;
    accessScope?: string;
    actorId: string;
    actorName?: string;
    actorRole?: ActorRole | string;
    actorType: ActorType | string;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    requiredApprovals: number;
    receivedApprovals: number;
    approvers?: Array<{
        approverId: string;
        approverName: string;
        approvedAt: string;
    }>;
    accessGrantedAt: string;
    accessExpiresAt?: string;
    accessGranted: boolean;
    denialReason?: string;
    timestamp: string;
}

// =============================================================================
// RETENTION POLICY TYPES (TS Section 7)
// =============================================================================

export interface ArchiveRetentionPolicy {
    id: string;
    name: string;
    code: string;
    description?: string;
    objectTypes: string[];
    jurisdictions: string[];
    categories: string[];
    retentionYears: number;
    retentionMonths: number;
    retentionStartTrigger: string;
    legalBasis?: string;
    legalReference?: string;
    warningDaysBefore: number;
    autoExtendOnAccess: boolean;
    autoExtendDays: number;
    priority: number;
    isActive: boolean;
    effectiveFrom: string;
    effectiveTo?: string;
    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// EXPORT TYPES (TS Section 15)
// =============================================================================

export interface ArchiveExport {
    id: string;
    exportNumber: string;
    exportType: ExportType | string;
    exportFormat: ExportFormat | string;
    archiveRecordIds: string[];
    recordCount: number;
    filterCriteria?: Record<string, any>;
    fileUrl?: string;
    fileSize?: number;
    fileHash?: string;
    chainOfCustody?: ChainOfCustody;
    integrityProof?: string;
    status: string;
    generatedAt?: string;
    expiresAt?: string;
    downloadCount: number;
    lastDownloadedAt?: string;
    requestedBy: string;
    requestedByName?: string;
    requestPurpose?: string;
    createdAt: string;
}

export interface ChainOfCustody {
    generatedAt: string;
    generatedBy: string;
    generatedByName?: string;
    purpose: string;
    recipients?: string[];
    handoffs?: Array<{
        from: string;
        to: string;
        at: string;
        reason?: string;
    }>;
}

// =============================================================================
// IMPORT TYPES (TS Section 10)
// =============================================================================

export interface ArchiveImportBatch {
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
    objectTypeFilter?: string;
    fieldMapping?: Record<string, string>;
    errors?: ImportError[];
    warnings?: ImportWarning[];
    createdRecordIds: string[];
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
// AUTOMATION TYPES (TS Section 9)
// =============================================================================

export interface ArchiveAutomationRule {
    id: string;
    name: string;
    code: string;
    description?: string;
    triggerType: string;
    triggerConditions: Record<string, any>;
    objectTypes: string[];
    categories: string[];
    action: AutomationAction | string;
    actionConfig?: Record<string, any>;
    confidenceThreshold: number;
    proposalThreshold: number;
    requiresApproval: boolean;
    approverRoles: string[];
    isActive: boolean;
    priority: number;
    lastExecutedAt?: string;
    executionCount: number;
    explanationTemplate?: string;
    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// EXCEPTION QUEUE TYPES (TS Section 9.4)
// =============================================================================

export interface ArchiveException {
    id: string;
    sourceObjectId: string;
    sourceObjectType: string;
    sourceModule?: string;
    exceptionType: ExceptionType | string;
    exceptionCode?: string;
    exceptionMessage: string;
    exceptionDetails?: Record<string, any>;
    validationMode?: ValidationMode | string;
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
    archiveRecordId?: string;
    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// SAVED VIEW TYPES (TS Section 13.2)
// =============================================================================

export interface ArchiveSavedView {
    id: string;
    name: string;
    description?: string;
    filters: ArchiveFilters;
    columns: string[];
    sortBy?: string;
    sortOrder: 'asc' | 'desc';
    groupBy?: string;
    isPublic: boolean;
    sharedWith: string[];
    isScheduled: boolean;
    scheduleFrequency?: string;
    scheduleCron?: string;
    deliveryMethod?: string;
    deliveryTarget?: string;
    lastDeliveredAt?: string;
    createdBy: string;
    createdByName?: string;
    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// ATTACHMENT TYPE
// =============================================================================

export interface ArchiveAttachment {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    hash?: string;
    uploadedAt: string;
    uploadedBy?: string;
}

// =============================================================================
// FILTER & QUERY TYPES
// =============================================================================

export interface ArchiveFilters {
    objectType?: ArchiveObjectType | string;
    objectTypes?: string[];
    category?: ArchiveCategory | string;
    categories?: string[];
    status?: ArchiveStatus | string;
    fiscalYear?: number;
    fiscalPeriod?: string;
    accountingPeriod?: string;
    dateFrom?: string;
    dateTo?: string;
    archivedFrom?: string;
    archivedTo?: string;
    legalEntityId?: string;
    partyId?: string;
    jurisdictionId?: string;
    counterpartyId?: string;
    counterpartyName?: string;
    amountMin?: number;
    amountMax?: number;
    currency?: string;
    tags?: string[];
    systemTags?: string[];
    retentionStatus?: RetentionStatus | string;
    legalHold?: boolean;
    search?: string;
    contentSearch?: string;
    triggerType?: ArchiveTriggerType | string;
    sourceModule?: string;
    includeSuperseded?: boolean;
}

export interface ArchiveSearchRequest {
    query?: string;
    filters?: ArchiveFilters;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeLinks?: boolean;
    includeVersions?: boolean;
}

export interface ArchiveReconstructRequest {
    objectId: string;
    objectType: string;
    asOfDate: string;
    includeLineage?: boolean;
}

// =============================================================================
// STATISTICS TYPES (TS Section 13)
// =============================================================================

export interface ArchiveStatistics {
    totalRecords: number;
    totalSize: number;
    byObjectType: Record<string, number>;
    byCategory: Record<string, number>;
    byFiscalYear: Record<number, number>;
    byStatus: Record<string, number>;
    byRetentionStatus: Record<string, number>;
    recentActivity: {
        archivedLast24h: number;
        archivedLast7d: number;
        archivedLast30d: number;
        accessedLast24h: number;
        exportedLast24h: number;
    };
    retentionSummary: {
        expiringIn30d: number;
        expiringIn90d: number;
        expired: number;
        onLegalHold: number;
    };
    storageByCategory: Record<string, number>;
}

// =============================================================================
// PAGINATION TYPES
// =============================================================================

export interface ArchivePagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

// =============================================================================
// API REQUEST TYPES
// =============================================================================

export interface CreateArchiveRequest {
    originalObjectId: string;
    objectType: ArchiveObjectType | string;
    objectVersion?: number;
    parentRecordId?: string;
    legalEntityId?: string;
    partyId?: string;

    // Temporal
    effectiveDate?: string;
    accountingPeriod?: string;
    fiscalYear?: number;
    fiscalPeriod?: string;

    // Trigger
    triggerType: ArchiveTriggerType | string;
    triggerReason?: string;
    triggerExplanation?: string;

    // Content
    title: string;
    description?: string;
    content: Record<string, any>;

    // Financial
    amount?: number;
    currency?: string;

    // Classification
    category: ArchiveCategory | string;
    subcategory?: string;
    jurisdictionIds?: string[];
    tags?: string[];

    // Counterparty
    counterpartyId?: string;
    counterpartyName?: string;
    counterpartyType?: string;

    // Links
    linkedEntityIds?: string[];
    links?: Array<{
        targetArchiveId: string;
        linkType: ArchiveLinkType | string;
    }>;

    // Attachments
    attachments?: Omit<ArchiveAttachment, 'id'>[];

    // Validation
    validationMode?: ValidationMode | string;

    // Retention
    retentionPolicyId?: string;
}

export interface CreateArchiveLinkRequest {
    sourceArchiveId: string;
    targetArchiveId: string;
    linkType: ArchiveLinkType | string;
    linkDescription?: string;
}

export interface CreateExportRequest {
    exportType: ExportType | string;
    exportFormat: ExportFormat | string;
    archiveRecordIds?: string[];
    filters?: ArchiveFilters;
    purpose?: string;
    includeAttachments?: boolean;
    includeLineage?: boolean;
}

export interface ImportArchiveRequest {
    source: ImportSource | string;
    mode: ImportMode | string;
    data: any[];
    fieldMapping?: Record<string, string>;
    dateFrom?: string;
    dateTo?: string;
    objectTypeFilter?: string;
}

export interface SetLegalHoldRequest {
    archiveRecordId: string;
    reason: string;
}

export interface RemoveLegalHoldRequest {
    archiveRecordId: string;
    reason: string;
    approvedBy?: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ArchiveListResponse {
    records: ArchiveRecord[];
    pagination: ArchivePagination;
    statistics?: ArchiveStatistics;
}

export interface ArchiveDetailResponse {
    record: ArchiveRecord;
    links?: ArchiveLink[];
    versions?: ArchiveVersion[];
    accessLogs?: ArchiveAccessLog[];
    lineage?: LinkageGraph;
}

export interface ReconstructionResponse {
    reconstructedState: Record<string, any>;
    asOfDate: string;
    eventsApplied: number;
    archiveRecordsUsed: string[];
    lineage?: LinkageGraph;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate deterministic archive record ID
 */
export function generateArchiveRecordId(
    organizationId: string,
    objectType: string,
    originalObjectId: string,
    version: number,
    timestamp?: Date
): string {
    const ts = timestamp || new Date();
    return `arc_${organizationId.slice(-6)}_${objectType}_${originalObjectId}_v${version}_${ts.getTime()}`;
}

/**
 * Generate content hash (SHA-256 placeholder - actual implementation uses crypto)
 */
export function generateContentHash(content: Record<string, any>): string {
    // In actual implementation, use crypto.createHash('sha256')
    const str = JSON.stringify(content, Object.keys(content).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `sha256_${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

/**
 * Check if object type is archivable
 */
export function isArchivableObjectType(objectType: string): boolean {
    return Object.values(ArchiveObjectType).includes(objectType as ArchiveObjectType);
}

/**
 * Get default retention years by jurisdiction
 */
export function getDefaultRetentionYears(jurisdiction: string): number {
    const retentionByJurisdiction: Record<string, number> = {
        DE: 10,  // Germany - 10 years
        AT: 7,   // Austria - 7 years
        CH: 10,  // Switzerland - 10 years
        FR: 10,  // France - 10 years
        GB: 6,   // UK - 6 years
        US: 7,   // US - 7 years (varies by state)
        DEFAULT: 10,
    };
    return retentionByJurisdiction[jurisdiction] ?? retentionByJurisdiction.DEFAULT;
}

/**
 * Calculate retention end date
 */
export function calculateRetentionEndDate(
    startDate: Date,
    retentionYears: number,
    retentionMonths: number = 0
): Date {
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + retentionYears);
    endDate.setMonth(endDate.getMonth() + retentionMonths);
    return endDate;
}

/**
 * Check if archive is within retention period
 */
export function isWithinRetention(retentionEndDate: string | Date): boolean {
    const endDate = new Date(retentionEndDate);
    return endDate > new Date();
}

/**
 * Get category from object type
 */
export function getCategoryFromObjectType(objectType: ArchiveObjectType | string): ArchiveCategory {
    const financialTypes = [
        ArchiveObjectType.INVOICE,
        ArchiveObjectType.ORDER,
        ArchiveObjectType.OFFER,
        ArchiveObjectType.PAYMENT,
        ArchiveObjectType.CREDIT_NOTE,
        ArchiveObjectType.REFUND,
        ArchiveObjectType.FX_CONVERSION,
        ArchiveObjectType.TREASURY_DECISION,
        ArchiveObjectType.CASHFLOW_FORECAST,
        ArchiveObjectType.VALUATION,
        ArchiveObjectType.DEPRECIATION_RUN,
        ArchiveObjectType.ASSET_DISPOSAL,
        ArchiveObjectType.INTERCOMPANY_TRANSACTION,
    ];

    const accountingTypes = [
        ArchiveObjectType.JOURNAL_ENTRY,
        ArchiveObjectType.LEDGER_SNAPSHOT,
        ArchiveObjectType.PERIOD_CLOSING,
        ArchiveObjectType.ADJUSTMENT,
        ArchiveObjectType.CORRECTION,
        ArchiveObjectType.REVERSAL,
        ArchiveObjectType.OFF_LEDGER_EVENT,
    ];

    const complianceTypes = [
        ArchiveObjectType.REPORT,
        ArchiveObjectType.TAX_FILING,
        ArchiveObjectType.AUDIT_TRAIL,
    ];

    const governanceTypes = [
        ArchiveObjectType.POLICY_RULE,
        ArchiveObjectType.PRICING_RULE,
        ArchiveObjectType.TREASURY_POLICY,
        ArchiveObjectType.APPROVAL_DECISION,
    ];

    if (financialTypes.includes(objectType as ArchiveObjectType)) {
        return ArchiveCategory.FINANCIAL;
    }
    if (accountingTypes.includes(objectType as ArchiveObjectType)) {
        return ArchiveCategory.ACCOUNTING;
    }
    if (complianceTypes.includes(objectType as ArchiveObjectType)) {
        return ArchiveCategory.COMPLIANCE;
    }
    if (governanceTypes.includes(objectType as ArchiveObjectType)) {
        return ArchiveCategory.GOVERNANCE;
    }

    return ArchiveCategory.SYSTEM;
}

/**
 * Validate archive record integrity
 */
export function validateArchiveIntegrity(record: ArchiveRecord): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Required fields
    if (!record.archiveRecordId) errors.push('Missing archiveRecordId');
    if (!record.originalObjectId) errors.push('Missing originalObjectId');
    if (!record.objectType) errors.push('Missing objectType');
    if (!record.contentHash) errors.push('Missing contentHash');
    if (!record.content) errors.push('Missing content');
    if (!record.triggerType) errors.push('Missing triggerType');

    // Content hash verification would happen here
    // const computedHash = generateContentHash(record.content);
    // if (computedHash !== record.contentHash) errors.push('Content hash mismatch');

    // Chain integrity
    if (record.versionNumber > 1 && !record.predecessorHash) {
        errors.push('Missing predecessorHash for version > 1');
    }

    return { valid: errors.length === 0, errors };
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const ARCHIVE_OBJECT_TYPES = Object.values(ArchiveObjectType);

export const ARCHIVE_CATEGORIES = Object.values(ArchiveCategory);

export const ARCHIVE_TRIGGER_TYPES = Object.values(ArchiveTriggerType);

export const ARCHIVE_LINK_TYPES = Object.values(ArchiveLinkType);

export const ARCHIVE_EXPORT_FORMATS = Object.values(ExportFormat);

export const DEFAULT_RETENTION_YEARS = 10;

export const RETENTION_WARNING_DAYS = 90;

export const MAX_EXPORT_RECORDS = 10000;

export const CONFIDENCE_AUTO_ARCHIVE_THRESHOLD = 0.95;

export const CONFIDENCE_PROPOSAL_THRESHOLD = 0.70;

export const CONFIDENCE_EXCEPTION_THRESHOLD = 0.70;

// Jurisdiction-specific retention periods
export const RETENTION_BY_JURISDICTION: Record<string, { years: number; basis: string }> = {
    DE: { years: 10, basis: 'AO §147, HGB §257' },
    AT: { years: 7, basis: 'BAO §132' },
    CH: { years: 10, basis: 'OR Art. 958f' },
    FR: { years: 10, basis: 'Code de commerce L123-22' },
    GB: { years: 6, basis: 'Companies Act 2006' },
    US: { years: 7, basis: 'IRS requirements' },
    NL: { years: 7, basis: 'Algemene wet inzake rijksbelastingen' },
    BE: { years: 7, basis: 'Code de commerce' },
    ES: { years: 6, basis: 'Código de Comercio' },
    IT: { years: 10, basis: 'Codice civile art. 2220' },
};

// i18n labels
export const ARCHIVE_LABELS = {
    objectTypes: {
        invoice: { en: 'Invoice', de: 'Rechnung', es: 'Factura', fr: 'Facture' },
        order: { en: 'Order', de: 'Bestellung', es: 'Pedido', fr: 'Commande' },
        offer: { en: 'Offer', de: 'Angebot', es: 'Oferta', fr: 'Offre' },
        payment: { en: 'Payment', de: 'Zahlung', es: 'Pago', fr: 'Paiement' },
        journal_entry: { en: 'Journal Entry', de: 'Buchungssatz', es: 'Asiento', fr: 'Écriture' },
        report: { en: 'Report', de: 'Bericht', es: 'Informe', fr: 'Rapport' },
    },
    categories: {
        financial: { en: 'Financial', de: 'Finanzen', es: 'Financiero', fr: 'Financier' },
        accounting: { en: 'Accounting', de: 'Buchhaltung', es: 'Contabilidad', fr: 'Comptabilité' },
        compliance: { en: 'Compliance', de: 'Compliance', es: 'Cumplimiento', fr: 'Conformité' },
        governance: { en: 'Governance', de: 'Governance', es: 'Gobernanza', fr: 'Gouvernance' },
        system: { en: 'System', de: 'System', es: 'Sistema', fr: 'Système' },
    },
    status: {
        archived: { en: 'Archived', de: 'Archiviert', es: 'Archivado', fr: 'Archivé' },
        accessed: { en: 'Accessed', de: 'Zugegriffen', es: 'Accedido', fr: 'Consulté' },
        exported: { en: 'Exported', de: 'Exportiert', es: 'Exportado', fr: 'Exporté' },
        legal_hold: { en: 'Legal Hold', de: 'Rechtliche Sperre', es: 'Retención legal', fr: 'Rétention légale' },
    },
};