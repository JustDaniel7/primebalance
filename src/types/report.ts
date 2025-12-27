// =============================================================================
// REPORTS TYPES - PrimeBalance Finance OS
// =============================================================================

// Report Categories
export type ReportCategory =
    | 'financial_statements'
    | 'receivables'
    | 'payables'
    | 'inventory'
    | 'assets'
    | 'treasury'
    | 'forecast'
    | 'custom';

// Report Types (Mandatory per spec)
export type ReportType =
// Financial Statements
    | 'profit_loss'
    | 'balance_sheet'
    | 'cash_flow_direct'
    | 'cash_flow_indirect'
    // Receivables
    | 'open_receivables'
    | 'ar_aging'
    | 'collections_pipeline'
    // Payables & Liabilities
    | 'open_payables'
    | 'ap_aging'
    | 'debt_schedule'
    | 'credit_utilization'
    // Inventory
    | 'stock_on_hand'
    | 'inventory_available'
    | 'inventory_movements'
    | 'inventory_valuation'
    // Assets
    | 'asset_register'
    | 'depreciation_schedule'
    | 'accumulated_depreciation'
    | 'disposal_gains_losses'
    // Treasury
    | 'cash_position'
    | 'exposure_analysis'
    | 'netting_opportunities'
    | 'liquidity_buffers'
    // Forecast & Variance
    | 'forecast_vs_actual'
    | 'variance_analysis'
    // Custom
    | 'custom_table'
    | 'custom_pivot'
    | 'custom_time_series'
    | 'custom_cohort';

export type ReportStatus = 'draft' | 'active' | 'archived';
export type ReportVisibility = 'private' | 'team' | 'org';
export type TimeGrain = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type CurrencyView = 'native' | 'presentation' | 'multi';
export type ExportFormat = 'pdf' | 'xlsx' | 'csv' | 'json';
export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';

// Aging Buckets
export interface AgingBucket {
    label: string;
    minDays: number;
    maxDays: number | null;
}

export const DEFAULT_AGING_BUCKETS: AgingBucket[] = [
    { label: 'Current', minDays: 0, maxDays: 0 },
    { label: '1-30 Days', minDays: 1, maxDays: 30 },
    { label: '31-60 Days', minDays: 31, maxDays: 60 },
    { label: '61-90 Days', minDays: 61, maxDays: 90 },
    { label: '90+ Days', minDays: 91, maxDays: null },
];

// Filter Types
export interface ReportFilter {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'between';
    value: any;
    label?: string;
}

// Dimension (Group By)
export interface ReportDimension {
    field: string;
    label: string;
    enabled: boolean;
    sortOrder?: 'asc' | 'desc';
}

// Measure (Aggregation)
export interface ReportMeasure {
    field: string;
    label: string;
    aggregation: 'sum' | 'count' | 'avg' | 'min' | 'max';
    format?: 'currency' | 'number' | 'percentage';
    decimals?: number;
    enabled: boolean;
}

// Computed Measure (Derived)
export interface ComputedMeasure {
    id: string;
    name: string;
    expression: string; // e.g., "(revenue - expenses) / revenue * 100"
    format: 'currency' | 'number' | 'percentage';
    decimals: number;
}

// Query Specification
export interface QuerySpec {
    dataSources: string[];
    filters: ReportFilter[];
    dimensions: ReportDimension[];
    measures: ReportMeasure[];
    computedMeasures: ComputedMeasure[];
    timeGrain: TimeGrain;
    dateRange: {
        type: 'relative' | 'absolute';
        relativePeriod?: 'this_week' | 'this_month' | 'this_quarter' | 'this_year' | 'last_month' | 'last_quarter' | 'last_year' | 'ytd' | 'custom';
        startDate?: string;
        endDate?: string;
    };
    sorting: {
        field: string;
        direction: 'asc' | 'desc';
    }[];
    limit?: number;
}

// Formatting Rules
export interface FormattingRules {
    currencyDisplay: 'symbol' | 'code' | 'none';
    decimals: number;
    thousandsSeparator: boolean;
    negativeFormat: 'minus' | 'parentheses' | 'red';
    dateFormat: string;
    roundingMode: 'round' | 'floor' | 'ceil';
}

// Reconciliation Policy
export interface ReconciliationPolicy {
    enabled: boolean;
    tolerance: number; // In presentation currency
    strictMode: boolean;
    balanceValidation: boolean; // For Balance Sheet
    reconcileToLedger: boolean; // For P&L
    reconcileToCash: boolean; // For Cash Flow
}

// Jurisdiction-specific Settings
export interface JurisdictionSettings {
    primaryJurisdiction: string; // Country code
    entities: string[]; // Entity IDs included
    currencyPresentation: string; // Presentation currency
    fxRateType: 'spot' | 'average' | 'period_end';
    fxRateDate?: string;
    taxRateOverride?: number;
    filingFormat?: string; // e.g., 'GAAP', 'IFRS', 'Local'
    consolidationRules?: {
        eliminateIntercompany: boolean;
        proportionalConsolidation: boolean;
        equityMethod: boolean;
    };
}

// Report Definition (Immutable & Versioned)
export interface ReportDefinition {
    id: string;
    name: string;
    description?: string;
    reportType: ReportType;
    category: ReportCategory;
    definitionVersion: number;
    createdBy: string;
    createdAt: string;
    lastModifiedBy: string;
    lastModifiedAt: string;
    status: ReportStatus;
    visibility: ReportVisibility;
    permissionsPolicyId?: string;

    // Query Configuration
    querySpec: QuerySpec;

    // Formatting
    formatting: FormattingRules;

    // Validation
    reconciliation: ReconciliationPolicy;

    // Jurisdiction
    jurisdiction: JurisdictionSettings;

    // Tags for organization
    tags: string[];

    // Official/Certified flag
    isCertified: boolean;
    certifiedBy?: string;
    certifiedAt?: string;
}

// Report Snapshot
export interface ReportSnapshot {
    id: string;
    reportDefinitionId: string;
    definitionVersion: number;
    dataCutoffTimestamp: string;
    fxTableVersion?: string;
    computedOutput: any; // The actual report data
    createdBy: string;
    createdAt: string;
    scheduledRunId?: string;
    metadata: {
        rowCount: number;
        executionTimeMs: number;
        warnings: string[];
    };
}

// Schedule
export interface ReportSchedule {
    id: string;
    reportDefinitionId: string;
    frequency: ScheduleFrequency;
    timezone: string;
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    time: string; // HH:MM
    enabled: boolean;
    runAfterClose?: boolean; // Wait for period close
    distribution: {
        email: string[];
        internalUsers: string[];
        exportFormats: ExportFormat[];
    };
    lastRunAt?: string;
    nextRunAt?: string;
}

// Wizard State
export interface ReportWizardState {
    currentStep: WizardStep;
    reportType: ReportType | null;
    category: ReportCategory | null;

    // Step 1: Type Selection
    selectedTemplate?: string;

    // Step 2: Scope
    scope: {
        entities: string[];
        dateRange: QuerySpec['dateRange'];
        timeGrain: TimeGrain;
        currencyView: CurrencyView;
        presentationCurrency: string;
    };

    // Step 3: Dimensions
    dimensions: ReportDimension[];

    // Step 4: Measures
    measures: ReportMeasure[];
    computedMeasures: ComputedMeasure[];

    // Step 5: Filters
    filters: ReportFilter[];

    // Step 6: Preview (computed)
    previewData?: any;
    previewLoading: boolean;
    previewError?: string;

    // Step 7: Validation
    validationResults?: ValidationResult[];

    // Step 8: Save
    reportName: string;
    reportDescription: string;
    visibility: ReportVisibility;
    tags: string[];

    // Jurisdiction
    jurisdiction: JurisdictionSettings;
}

export type WizardStep =
    | 'type'
    | 'scope'
    | 'dimensions'
    | 'measures'
    | 'filters'
    | 'preview'
    | 'validate'
    | 'save';

// Validation Result
export interface ValidationResult {
    type: 'error' | 'warning' | 'info';
    category: 'structural' | 'accounting' | 'data' | 'permission';
    code: string;
    message: string;
    field?: string;
    suggestion?: string;
}

// Drilldown Request
export interface DrilldownRequest {
    reportId: string;
    snapshotId?: string;
    cell: {
        rowIndex: number;
        columnIndex: number;
        value: any;
    };
    filters?: ReportFilter[];
    limit?: number;
}

// Drilldown Response
export interface DrilldownResponse {
    transactions: {
        id: string;
        date: string;
        description: string;
        amount: number;
        account: string;
        source: string;
        reference?: string;
    }[];
    summary: {
        count: number;
        total: number;
        dateSpan: { from: string; to: string };
        filtersApplied: string[];
    };
    explanation: string;
}

// Report Templates by Type
export const REPORT_TEMPLATES: Record<ReportType, {
    name: string;
    description: string;
    category: ReportCategory;
    icon: string;
    defaultDimensions: string[];
    defaultMeasures: string[];
    requiredValidations: string[];
}> = {
    // Financial Statements
    profit_loss: {
        name: 'Profit & Loss',
        description: 'Income statement showing revenue, expenses, and net profit',
        category: 'financial_statements',
        icon: 'TrendingUp',
        defaultDimensions: ['account_category', 'period'],
        defaultMeasures: ['amount'],
        requiredValidations: ['reconcile_to_ledger'],
    },
    balance_sheet: {
        name: 'Balance Sheet',
        description: 'Statement of financial position showing assets, liabilities, and equity',
        category: 'financial_statements',
        icon: 'Scale',
        defaultDimensions: ['account_category', 'account'],
        defaultMeasures: ['balance'],
        requiredValidations: ['balance_check', 'assets_equals_liabilities_plus_equity'],
    },
    cash_flow_direct: {
        name: 'Cash Flow (Direct)',
        description: 'Cash flow statement using direct method',
        category: 'financial_statements',
        icon: 'ArrowDownUp',
        defaultDimensions: ['cash_flow_category', 'period'],
        defaultMeasures: ['cash_in', 'cash_out', 'net_cash'],
        requiredValidations: ['reconcile_to_cash'],
    },
    cash_flow_indirect: {
        name: 'Cash Flow (Indirect)',
        description: 'Cash flow statement reconciling net income to cash',
        category: 'financial_statements',
        icon: 'ArrowDownUp',
        defaultDimensions: ['adjustment_type', 'period'],
        defaultMeasures: ['amount'],
        requiredValidations: ['reconcile_to_cash', 'reconcile_net_income'],
    },
    // Receivables
    open_receivables: {
        name: 'Open Receivables',
        description: 'List of all outstanding customer receivables',
        category: 'receivables',
        icon: 'Users',
        defaultDimensions: ['customer', 'invoice'],
        defaultMeasures: ['amount_due', 'amount_paid', 'balance'],
        requiredValidations: [],
    },
    ar_aging: {
        name: 'AR Aging Report',
        description: 'Accounts receivable aging analysis by bucket',
        category: 'receivables',
        icon: 'Clock',
        defaultDimensions: ['customer', 'aging_bucket'],
        defaultMeasures: ['amount'],
        requiredValidations: [],
    },
    collections_pipeline: {
        name: 'Collections Pipeline',
        description: 'Status and progress of collections activities',
        category: 'receivables',
        icon: 'Target',
        defaultDimensions: ['customer', 'collection_status'],
        defaultMeasures: ['amount', 'probability'],
        requiredValidations: [],
    },
    // Payables
    open_payables: {
        name: 'Open Payables',
        description: 'List of all outstanding vendor payables',
        category: 'payables',
        icon: 'Building2',
        defaultDimensions: ['vendor', 'invoice'],
        defaultMeasures: ['amount_due', 'amount_paid', 'balance'],
        requiredValidations: [],
    },
    ap_aging: {
        name: 'AP Aging Report',
        description: 'Accounts payable aging analysis by bucket',
        category: 'payables',
        icon: 'Clock',
        defaultDimensions: ['vendor', 'aging_bucket'],
        defaultMeasures: ['amount'],
        requiredValidations: [],
    },
    debt_schedule: {
        name: 'Debt Schedule',
        description: 'Maturity ladder for all debt instruments',
        category: 'payables',
        icon: 'Calendar',
        defaultDimensions: ['debt_instrument', 'maturity_period'],
        defaultMeasures: ['principal', 'interest', 'total_payment'],
        requiredValidations: [],
    },
    credit_utilization: {
        name: 'Credit Facility Utilization',
        description: 'Usage and availability of credit facilities',
        category: 'payables',
        icon: 'CreditCard',
        defaultDimensions: ['facility', 'period'],
        defaultMeasures: ['limit', 'drawn', 'available', 'utilization_pct'],
        requiredValidations: [],
    },
    // Inventory
    stock_on_hand: {
        name: 'Stock on Hand',
        description: 'Current inventory levels by location',
        category: 'inventory',
        icon: 'Package',
        defaultDimensions: ['product', 'location'],
        defaultMeasures: ['quantity', 'value'],
        requiredValidations: [],
    },
    inventory_available: {
        name: 'Available vs Reserved',
        description: 'Inventory availability status',
        category: 'inventory',
        icon: 'PackageCheck',
        defaultDimensions: ['product', 'status'],
        defaultMeasures: ['total', 'available', 'reserved', 'on_order'],
        requiredValidations: [],
    },
    inventory_movements: {
        name: 'Inventory Movements',
        description: 'Track inventory ins and outs',
        category: 'inventory',
        icon: 'ArrowLeftRight',
        defaultDimensions: ['product', 'movement_type', 'period'],
        defaultMeasures: ['quantity_in', 'quantity_out', 'net_change'],
        requiredValidations: [],
    },
    inventory_valuation: {
        name: 'Inventory Valuation Rollforward',
        description: 'Period-over-period inventory value changes',
        category: 'inventory',
        icon: 'Calculator',
        defaultDimensions: ['product_category', 'period'],
        defaultMeasures: ['opening_value', 'additions', 'disposals', 'adjustments', 'closing_value'],
        requiredValidations: [],
    },
    // Assets
    asset_register: {
        name: 'Asset Register',
        description: 'Complete list of fixed assets',
        category: 'assets',
        icon: 'Building',
        defaultDimensions: ['asset_class', 'location'],
        defaultMeasures: ['cost', 'accumulated_depreciation', 'net_book_value'],
        requiredValidations: [],
    },
    depreciation_schedule: {
        name: 'Depreciation Schedule',
        description: 'Planned depreciation by period',
        category: 'assets',
        icon: 'TrendingDown',
        defaultDimensions: ['asset', 'period'],
        defaultMeasures: ['depreciation_expense', 'accumulated', 'remaining_value'],
        requiredValidations: [],
    },
    accumulated_depreciation: {
        name: 'Accumulated Depreciation Rollforward',
        description: 'Period-over-period accumulated depreciation',
        category: 'assets',
        icon: 'Layers',
        defaultDimensions: ['asset_class', 'period'],
        defaultMeasures: ['opening', 'additions', 'disposals', 'closing'],
        requiredValidations: [],
    },
    disposal_gains_losses: {
        name: 'Disposal Gains/Losses',
        description: 'Analysis of asset disposals',
        category: 'assets',
        icon: 'Trash2',
        defaultDimensions: ['asset', 'disposal_type'],
        defaultMeasures: ['cost', 'accumulated_dep', 'nbv', 'proceeds', 'gain_loss'],
        requiredValidations: [],
    },
    // Treasury
    cash_position: {
        name: 'Cash Position',
        description: 'Cash balances by account, currency, and entity',
        category: 'treasury',
        icon: 'Wallet',
        defaultDimensions: ['account', 'currency', 'entity'],
        defaultMeasures: ['balance', 'available', 'restricted'],
        requiredValidations: [],
    },
    exposure_analysis: {
        name: 'Exposure Analysis',
        description: 'Risk exposure by counterparty and currency',
        category: 'treasury',
        icon: 'AlertTriangle',
        defaultDimensions: ['counterparty', 'currency', 'exposure_type'],
        defaultMeasures: ['gross_exposure', 'net_exposure', 'limit', 'utilization'],
        requiredValidations: [],
    },
    netting_opportunities: {
        name: 'Netting Opportunities',
        description: 'Potential netting savings analysis',
        category: 'treasury',
        icon: 'Minimize2',
        defaultDimensions: ['counterparty', 'currency'],
        defaultMeasures: ['gross_payables', 'gross_receivables', 'net_position', 'savings'],
        requiredValidations: [],
    },
    liquidity_buffers: {
        name: 'Liquidity Buffers',
        description: 'Reserve and buffer analysis',
        category: 'treasury',
        icon: 'Shield',
        defaultDimensions: ['buffer_type', 'currency'],
        defaultMeasures: ['target', 'actual', 'surplus_deficit'],
        requiredValidations: [],
    },
    // Forecast
    forecast_vs_actual: {
        name: 'Forecast vs Actual',
        description: 'Compare forecasted vs actual metrics',
        category: 'forecast',
        icon: 'GitCompare',
        defaultDimensions: ['metric', 'period'],
        defaultMeasures: ['forecast', 'actual', 'variance', 'variance_pct'],
        requiredValidations: [],
    },
    variance_analysis: {
        name: 'Variance Analysis',
        description: 'Detailed variance explanation by driver',
        category: 'forecast',
        icon: 'BarChart2',
        defaultDimensions: ['driver_category', 'driver'],
        defaultMeasures: ['impact', 'contribution_pct'],
        requiredValidations: [],
    },
    // Custom
    custom_table: {
        name: 'Custom Table',
        description: 'Flexible table report builder',
        category: 'custom',
        icon: 'Table',
        defaultDimensions: [],
        defaultMeasures: [],
        requiredValidations: [],
    },
    custom_pivot: {
        name: 'Custom Pivot',
        description: 'Pivot table with flexible rows/columns',
        category: 'custom',
        icon: 'Grid3X3',
        defaultDimensions: [],
        defaultMeasures: [],
        requiredValidations: [],
    },
    custom_time_series: {
        name: 'Custom Time Series',
        description: 'Time-based trend analysis',
        category: 'custom',
        icon: 'LineChart',
        defaultDimensions: ['period'],
        defaultMeasures: [],
        requiredValidations: [],
    },
    custom_cohort: {
        name: 'Custom Cohort',
        description: 'Cohort analysis by period and segment',
        category: 'custom',
        icon: 'Users2',
        defaultDimensions: ['cohort_period', 'segment'],
        defaultMeasures: [],
        requiredValidations: [],
    },
};

// Report Category Metadata
// ADD to src/types/report.ts

// Generated Report Data
export interface GeneratedReportData {
    reportId: string
    reportType: ReportType
    generatedAt: string
    period: {
        start: string
        end: string
        label: string
    }
    currency: string
    headers: string[]
    rows: GeneratedReportRow[]
    totals: Record<string, number>
    summary: {
        totalRecords: number
        totalAmount: number
        [key: string]: number
    }
    metadata: Record<string, unknown>
}

export interface GeneratedReportRow {
    id: string
    [key: string]: string | number | null
}

// Download format
export type DownloadFormat = 'pdf' | 'xlsx' | 'csv' | 'json'


export const REPORT_CATEGORIES: Record<ReportCategory, {
    name: string;
    description: string;
    icon: string;
    reportTypes: ReportType[];
}> = {
    financial_statements: {
        name: 'Financial Statements',
        description: 'Standard financial reports (P&L, Balance Sheet, Cash Flow)',
        icon: 'FileSpreadsheet',
        reportTypes: ['profit_loss', 'balance_sheet', 'cash_flow_direct', 'cash_flow_indirect'],
    },
    receivables: {
        name: 'Receivables',
        description: 'Customer receivables and collections',
        icon: 'UserCheck',
        reportTypes: ['open_receivables', 'ar_aging', 'collections_pipeline'],
    },
    payables: {
        name: 'Payables & Liabilities',
        description: 'Vendor payables and debt management',
        icon: 'Receipt',
        reportTypes: ['open_payables', 'ap_aging', 'debt_schedule', 'credit_utilization'],
    },
    inventory: {
        name: 'Inventory',
        description: 'Stock levels, movements, and valuation',
        icon: 'Package',
        reportTypes: ['stock_on_hand', 'inventory_available', 'inventory_movements', 'inventory_valuation'],
    },
    assets: {
        name: 'Fixed Assets',
        description: 'Asset register and depreciation',
        icon: 'Building2',
        reportTypes: ['asset_register', 'depreciation_schedule', 'accumulated_depreciation', 'disposal_gains_losses'],
    },
    treasury: {
        name: 'Treasury',
        description: 'Cash position and risk exposure',
        icon: 'Landmark',
        reportTypes: ['cash_position', 'exposure_analysis', 'netting_opportunities', 'liquidity_buffers'],
    },
    forecast: {
        name: 'Forecast & Variance',
        description: 'Forecasting and variance analysis',
        icon: 'TrendingUp',
        reportTypes: ['forecast_vs_actual', 'variance_analysis'],
    },
    custom: {
        name: 'Custom Reports',
        description: 'Build your own reports',
        icon: 'Wrench',
        reportTypes: ['custom_table', 'custom_pivot', 'custom_time_series', 'custom_cohort'],
    },
    // ADD to src/types/report.ts
};