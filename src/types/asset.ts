// =============================================================================
// PRIMEBALANCE - FIXED ASSETS & DEPRECIATION TYPES
// =============================================================================

// -----------------------------------------------------------------------------
// ENUMS
// -----------------------------------------------------------------------------

export enum AssetStatus {
    PLANNED = 'PLANNED',
    ACQUIRED = 'ACQUIRED',
    CAPITALIZED = 'CAPITALIZED',
    IN_USE = 'IN_USE',
    FULLY_DEPRECIATED = 'FULLY_DEPRECIATED',
    IMPAIRED = 'IMPAIRED',
    HELD_FOR_SALE = 'HELD_FOR_SALE',
    DISPOSED = 'DISPOSED',
    SOLD = 'SOLD',
    WRITTEN_OFF = 'WRITTEN_OFF',
}

export enum AssetType {
    TANGIBLE = 'TANGIBLE',
    INTANGIBLE = 'INTANGIBLE',
}

export enum DepreciationMethod {
    STRAIGHT_LINE = 'STRAIGHT_LINE',
    DECLINING_BALANCE = 'DECLINING_BALANCE',
    DOUBLE_DECLINING_BALANCE = 'DOUBLE_DECLINING_BALANCE',
    UNITS_OF_PRODUCTION = 'UNITS_OF_PRODUCTION',
    SUM_OF_YEARS_DIGITS = 'SUM_OF_YEARS_DIGITS',
    CUSTOM = 'CUSTOM',
}

export enum AssetEventType {
    ASSET_CREATED = 'ASSET_CREATED',
    ASSET_ACQUIRED = 'ASSET_ACQUIRED',
    ASSET_CAPITALIZED = 'ASSET_CAPITALIZED',
    DEPRECIATION_POSTED = 'DEPRECIATION_POSTED',
    IMPAIRMENT_RECORDED = 'IMPAIRMENT_RECORDED',
    REVALUATION_RECORDED = 'REVALUATION_RECORDED',
    ASSET_TRANSFERRED = 'ASSET_TRANSFERRED',
    ASSET_HELD_FOR_SALE = 'ASSET_HELD_FOR_SALE',
    ASSET_DISPOSED = 'ASSET_DISPOSED',
    ASSET_SOLD = 'ASSET_SOLD',
    ASSET_WRITTEN_OFF = 'ASSET_WRITTEN_OFF',
    COMPONENT_ADDED = 'COMPONENT_ADDED',
    COMPONENT_REMOVED = 'COMPONENT_REMOVED',
    USEFUL_LIFE_CHANGED = 'USEFUL_LIFE_CHANGED',
    METHOD_CHANGED = 'METHOD_CHANGED',
}

export enum AssetCategory {
    BUILDINGS = 'BUILDINGS',
    MACHINERY = 'MACHINERY',
    VEHICLES = 'VEHICLES',
    IT_EQUIPMENT = 'IT_EQUIPMENT',
    FURNITURE = 'FURNITURE',
    INTANGIBLE_ASSETS = 'INTANGIBLE_ASSETS',
    CAPITALIZED_SOFTWARE = 'CAPITALIZED_SOFTWARE',
    LEASEHOLD_IMPROVEMENTS = 'LEASEHOLD_IMPROVEMENTS',
    LAND = 'LAND',
    CONSTRUCTION_IN_PROGRESS = 'CONSTRUCTION_IN_PROGRESS',
    RIGHT_OF_USE = 'RIGHT_OF_USE',
}

export enum BookType {
    STATUTORY = 'STATUTORY',
    TAX = 'TAX',
    MANAGEMENT = 'MANAGEMENT',
}

// -----------------------------------------------------------------------------
// CORE ASSET INTERFACE
// -----------------------------------------------------------------------------

export interface Asset {
    id: string;
    assetNumber: string;
    name: string;
    description?: string;
    assetType: AssetType;
    category: AssetCategory;
    internalReference?: string;

    // Ownership & Structure
    legalEntityId?: string;
    costCenterId?: string;
    projectId?: string;
    location?: string;
    responsibleParty?: string;

    // Financial Attributes
    currency: string;
    acquisitionCost: number;
    capitalizedCost: number;
    salvageValue: number;
    usefulLifeMonths: number;
    depreciationMethod: DepreciationMethod;
    depreciationStartDate?: string;

    // Units of Production specific
    totalUnits?: number;
    unitsProduced?: number;

    // Custom depreciation formula
    customFormula?: string;

    // Status
    status: AssetStatus;
    isActive: boolean;

    // Component accounting
    parentAssetId?: string;
    isComponent: boolean;

    // Acquisition details
    supplierId?: string;
    supplierInvoiceId?: string;
    purchaseOrderId?: string;
    acquisitionDate?: string;

    // Disposal details
    disposalDate?: string;
    disposalReason?: string;
    salePrice?: number;
    buyerReference?: string;

    // Lease asset (ROU)
    isLeaseAsset: boolean;
    leaseId?: string;

    // CIP / WIP
    isCIP: boolean;
    cipStartDate?: string;
    cipCompletionDate?: string;

    // Metadata
    tags?: string[];
    notes?: string;
    attachments?: AssetAttachment[];

    // Timestamps
    createdAt: string;
    updatedAt: string;
}

export interface AssetAttachment {
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: string;
}

// -----------------------------------------------------------------------------
// MULTI-BOOK SUPPORT
// -----------------------------------------------------------------------------

export interface AssetBook {
    id: string;
    assetId: string;
    bookType: BookType;
    depreciationMethod: DepreciationMethod;
    usefulLifeMonths: number;
    salvageValue: number;
    acquisitionCost: number;
    accumulatedDepreciation: number;
    impairmentLosses: number;
    revaluationSurplus: number;
    netBookValue: number;
    lastDepreciationDate?: string;
    isActive: boolean;
}

// -----------------------------------------------------------------------------
// DEPRECIATION SCHEDULE
// -----------------------------------------------------------------------------

export interface DepreciationScheduleEntry {
    id: string;
    assetId: string;
    bookType: BookType;
    periodNumber: number;
    periodStartDate: string;
    periodEndDate: string;
    openingBookValue: number;
    depreciationAmount: number;
    accumulatedDepreciation: number;
    closingBookValue: number;
    isPosted: boolean;
    postedAt?: string;
    ledgerEntryId?: string;
}

export interface DepreciationSchedule {
    assetId: string;
    bookType: BookType;
    entries: DepreciationScheduleEntry[];
    totalDepreciation: number;
    totalPeriods: number;
    generatedAt: string;
}

// -----------------------------------------------------------------------------
// ASSET EVENTS (APPEND-ONLY)
// -----------------------------------------------------------------------------

export interface AssetEvent {
    id: string;
    assetId: string;
    eventType: AssetEventType;
    timestamp: string;
    actor: string;
    reason?: string;

    // Event-specific data
    previousStatus?: AssetStatus;
    newStatus?: AssetStatus;
    previousValue?: number;
    newValue?: number;
    amount?: number;

    // Transfer details
    fromEntityId?: string;
    toEntityId?: string;
    fromCostCenterId?: string;
    toCostCenterId?: string;
    fromLocation?: string;
    toLocation?: string;

    // Ledger reference
    ledgerEntryIds?: string[];

    // Additional context
    metadata?: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// IMPAIRMENT & REVALUATION
// -----------------------------------------------------------------------------

export interface ImpairmentRecord {
    id: string;
    assetId: string;
    bookType: BookType;
    impairmentDate: string;
    previousCarryingAmount: number;
    recoverableAmount: number;
    impairmentLoss: number;
    reason: string;
    approvedBy?: string;
    approvedAt?: string;
    ledgerEntryId?: string;
    eventId: string;
}

export interface RevaluationRecord {
    id: string;
    assetId: string;
    bookType: BookType;
    revaluationDate: string;
    previousCarryingAmount: number;
    fairValue: number;
    revaluationAmount: number;
    isIncrease: boolean;
    reason: string;
    valuerId?: string;
    approvedBy?: string;
    approvedAt?: string;
    ledgerEntryId?: string;
    eventId: string;
}

// -----------------------------------------------------------------------------
// ASSET CLASS CONFIGURATION
// -----------------------------------------------------------------------------

export interface AssetClassConfig {
    category: AssetCategory;
    label: string;
    icon: string;
    defaultDepreciationMethod: DepreciationMethod;
    defaultUsefulLifeMonths: number;
    defaultSalvageValuePercent: number;
    capitalizationThreshold: number;
    taxTreatment?: string;
    allowComponents: boolean;
    allowRevaluation: boolean;
    isDepreciable: boolean;
}

// -----------------------------------------------------------------------------
// CAPEX TRACKING
// -----------------------------------------------------------------------------

export interface CapExBudget {
    id: string;
    name: string;
    fiscalYear: string;
    entityId?: string;
    projectId?: string;
    budgetAmount: number;
    committedAmount: number;
    spentAmount: number;
    remainingAmount: number;
    currency: string;
    createdAt: string;
    updatedAt: string;
}

export interface CapExItem {
    id: string;
    budgetId: string;
    assetId?: string;
    description: string;
    estimatedAmount: number;
    actualAmount?: number;
    status: 'PLANNED' | 'APPROVED' | 'COMMITTED' | 'SPENT' | 'CANCELLED';
    classification: 'CAPEX' | 'OPEX' | 'BORDERLINE';
    classificationReason?: string;
    approvedBy?: string;
    approvedAt?: string;
}

// -----------------------------------------------------------------------------
// ASSET TRANSFER
// -----------------------------------------------------------------------------

export interface AssetTransfer {
    id: string;
    assetId: string;
    transferDate: string;
    transferType: 'COST_CENTER' | 'LOCATION' | 'ENTITY' | 'RESPONSIBILITY';
    fromEntityId?: string;
    toEntityId?: string;
    fromCostCenterId?: string;
    toCostCenterId?: string;
    fromLocation?: string;
    toLocation?: string;
    fromResponsibleParty?: string;
    toResponsibleParty?: string;
    reason?: string;
    approvedBy?: string;
    approvedAt?: string;
    eventId: string;
}

// -----------------------------------------------------------------------------
// DISPOSAL & SALE
// -----------------------------------------------------------------------------

export interface AssetDisposal {
    id: string;
    assetId: string;
    disposalDate: string;
    disposalType: 'SALE' | 'SCRAP' | 'DONATION' | 'THEFT' | 'DESTRUCTION' | 'OTHER';

    // Sale details
    salePrice?: number;
    buyerName?: string;
    buyerReference?: string;
    invoiceId?: string;

    // Calculation
    carryingAmount: number;
    accumulatedDepreciation: number;
    gainOrLoss: number;
    isGain: boolean;

    // Tax
    taxAmount?: number;
    taxTreatment?: string;

    // Approval
    reason: string;
    approvedBy?: string;
    approvedAt?: string;

    // Ledger
    ledgerEntryIds?: string[];
    eventId: string;
}

// -----------------------------------------------------------------------------
// REPORTING VIEWS
// -----------------------------------------------------------------------------

export interface AssetRegisterEntry {
    asset: Asset;
    acquisitionCost: number;
    accumulatedDepreciation: number;
    impairmentLosses: number;
    netBookValue: number;
    monthlyDepreciation: number;
    remainingLifeMonths: number;
    percentDepreciated: number;
}

export interface AssetMovementReport {
    periodStart: string;
    periodEnd: string;
    openingBalance: number;
    additions: number;
    disposals: number;
    transfers: number;
    depreciation: number;
    impairments: number;
    revaluations: number;
    closingBalance: number;
    assetCount: number;
}

export interface DepreciationForecast {
    assetId: string;
    periods: Array<{
        periodStart: string;
        periodEnd: string;
        depreciationAmount: number;
        closingBookValue: number;
    }>;
    totalFutureDepreciation: number;
}

// -----------------------------------------------------------------------------
// DASHBOARD STATE
// -----------------------------------------------------------------------------

export interface AssetDashboardState {
    activeTab: 'register' | 'depreciation' | 'disposals' | 'capex' | 'reports';
    selectedAssetId: string | null;
    filters: {
        status: AssetStatus | 'ALL';
        category: AssetCategory | 'ALL';
        entityId: string | null;
        costCenterId: string | null;
        searchQuery: string;
    };
    dateRange: {
        start: string;
        end: string;
    };
    bookType: BookType;
}

// -----------------------------------------------------------------------------
// VALIDATION & NOTIFICATIONS
// -----------------------------------------------------------------------------

export interface AssetValidationError {
    field: string;
    message: string;
    code: string;
}

export interface AssetNotification {
    id: string;
    type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
    category: 'DEPRECIATION' | 'DISPOSAL' | 'IMPAIRMENT' | 'COMPLIANCE' | 'MAINTENANCE';
    title: string;
    message: string;
    assetId?: string;
    actionRequired: boolean;
    dueDate?: string;
    createdAt: string;
    readAt?: string;
}