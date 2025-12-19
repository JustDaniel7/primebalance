import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    ReportDefinition,
    ReportSnapshot,
    ReportSchedule,
    ReportWizardState,
    WizardStep,
    ReportType,
    ReportCategory,
    ValidationResult,
    QuerySpec,
    ReportFilter,
    ReportDimension,
    ReportMeasure,
    ComputedMeasure,
    TimeGrain,
    CurrencyView,
    ReportVisibility,
    JurisdictionSettings,
    REPORT_TEMPLATES,
} from '@/types/report';

// =============================================================================
// INITIAL STATES
// =============================================================================

const initialWizardState: ReportWizardState = {
    currentStep: 'type',
    reportType: null,
    category: null,
    scope: {
        entities: [],
        dateRange: {
            type: 'relative',
            relativePeriod: 'this_month',
        },
        timeGrain: 'month',
        currencyView: 'native',
        presentationCurrency: 'USD',
    },
    dimensions: [],
    measures: [],
    computedMeasures: [],
    filters: [],
    previewLoading: false,
    reportName: '',
    reportDescription: '',
    visibility: 'private',
    tags: [],
    jurisdiction: {
        primaryJurisdiction: 'US-FED',
        entities: [],
        currencyPresentation: 'USD',
        fxRateType: 'spot',
    },
};

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface ReportState {
    // Saved Reports
    reports: ReportDefinition[];
    snapshots: ReportSnapshot[];
    schedules: ReportSchedule[];

    // Wizard State
    wizardState: ReportWizardState;
    wizardOpen: boolean;

    // Selected Report (for viewing/editing)
    selectedReportId: string | null;

    // CRUD Operations
    createReport: (report: Omit<ReportDefinition, 'id' | 'createdAt' | 'lastModifiedAt' | 'definitionVersion'>) => ReportDefinition;
    updateReport: (id: string, updates: Partial<ReportDefinition>) => void;
    deleteReport: (id: string) => void;
    duplicateReport: (id: string, newName: string) => ReportDefinition;

    // Wizard Operations
    openWizard: (editReport?: ReportDefinition) => void;
    closeWizard: () => void;
    setWizardStep: (step: WizardStep) => void;
    nextStep: () => void;
    prevStep: () => void;
    updateWizardState: (updates: Partial<ReportWizardState>) => void;
    resetWizard: () => void;

    // Type Selection
    selectReportType: (type: ReportType, category: ReportCategory) => void;

    // Scope Configuration
    setEntities: (entities: string[]) => void;
    setDateRange: (dateRange: QuerySpec['dateRange']) => void;
    setTimeGrain: (grain: TimeGrain) => void;
    setCurrencyView: (view: CurrencyView, presentationCurrency?: string) => void;

    // Dimensions & Measures
    toggleDimension: (field: string) => void;
    toggleMeasure: (field: string) => void;
    addComputedMeasure: (measure: ComputedMeasure) => void;
    removeComputedMeasure: (id: string) => void;

    // Filters
    addFilter: (filter: ReportFilter) => void;
    updateFilter: (index: number, filter: ReportFilter) => void;
    removeFilter: (index: number) => void;
    clearFilters: () => void;

    // Jurisdiction
    setJurisdiction: (settings: Partial<JurisdictionSettings>) => void;

    // Validation
    validateReport: () => ValidationResult[];

    // Preview
    generatePreview: () => Promise<void>;

    // Save
    saveReport: () => ReportDefinition | null;

    // Snapshots
    createSnapshot: (reportId: string) => Promise<ReportSnapshot>;

    // Schedules
    createSchedule: (schedule: Omit<ReportSchedule, 'id'>) => ReportSchedule;
    updateSchedule: (id: string, updates: Partial<ReportSchedule>) => void;
    deleteSchedule: (id: string) => void;

    // Helpers
    getReportById: (id: string) => ReportDefinition | undefined;
    getReportsByCategory: (category: ReportCategory) => ReportDefinition[];
    getFavoriteReports: () => ReportDefinition[];
    searchReports: (query: string) => ReportDefinition[];
}

// =============================================================================
// WIZARD STEPS ORDER
// =============================================================================

const WIZARD_STEPS: WizardStep[] = [
    'type',
    'scope',
    'dimensions',
    'measures',
    'filters',
    'preview',
    'validate',
    'save',
];

// =============================================================================
// DEMO REPORTS
// =============================================================================

const generateDemoReports = (): ReportDefinition[] => [
    {
        id: 'rpt-001',
        name: 'Monthly P&L',
        description: 'Standard monthly profit and loss statement',
        reportType: 'profit_loss',
        category: 'financial_statements',
        definitionVersion: 1,
        createdBy: 'system',
        createdAt: '2024-01-01T00:00:00Z',
        lastModifiedBy: 'system',
        lastModifiedAt: '2024-01-01T00:00:00Z',
        status: 'active',
        visibility: 'org',
        querySpec: {
            dataSources: ['ledger'],
            filters: [],
            dimensions: [
                { field: 'account_category', label: 'Category', enabled: true },
                { field: 'period', label: 'Period', enabled: true },
            ],
            measures: [
                { field: 'amount', label: 'Amount', aggregation: 'sum', format: 'currency', enabled: true },
            ],
            computedMeasures: [],
            timeGrain: 'month',
            dateRange: { type: 'relative', relativePeriod: 'this_month' },
            sorting: [{ field: 'account_category', direction: 'asc' }],
        },
        formatting: {
            currencyDisplay: 'symbol',
            decimals: 2,
            thousandsSeparator: true,
            negativeFormat: 'parentheses',
            dateFormat: 'MMM yyyy',
            roundingMode: 'round',
        },
        reconciliation: {
            enabled: true,
            tolerance: 0.01,
            strictMode: true,
            balanceValidation: false,
            reconcileToLedger: true,
            reconcileToCash: false,
        },
        jurisdiction: {
            primaryJurisdiction: 'US-FED',
            entities: [],
            currencyPresentation: 'USD',
            fxRateType: 'average',
        },
        tags: ['monthly', 'standard'],
        isCertified: true,
        certifiedBy: 'system',
        certifiedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 'rpt-002',
        name: 'AR Aging Summary',
        description: 'Accounts receivable aging by customer',
        reportType: 'ar_aging',
        category: 'receivables',
        definitionVersion: 1,
        createdBy: 'system',
        createdAt: '2024-01-01T00:00:00Z',
        lastModifiedBy: 'system',
        lastModifiedAt: '2024-01-01T00:00:00Z',
        status: 'active',
        visibility: 'team',
        querySpec: {
            dataSources: ['receivables'],
            filters: [],
            dimensions: [
                { field: 'customer', label: 'Customer', enabled: true },
                { field: 'aging_bucket', label: 'Aging Bucket', enabled: true },
            ],
            measures: [
                { field: 'amount', label: 'Amount', aggregation: 'sum', format: 'currency', enabled: true },
            ],
            computedMeasures: [],
            timeGrain: 'month',
            dateRange: { type: 'relative', relativePeriod: 'this_month' },
            sorting: [{ field: 'customer', direction: 'asc' }],
        },
        formatting: {
            currencyDisplay: 'symbol',
            decimals: 2,
            thousandsSeparator: true,
            negativeFormat: 'minus',
            dateFormat: 'MMM dd, yyyy',
            roundingMode: 'round',
        },
        reconciliation: {
            enabled: false,
            tolerance: 0,
            strictMode: false,
            balanceValidation: false,
            reconcileToLedger: false,
            reconcileToCash: false,
        },
        jurisdiction: {
            primaryJurisdiction: 'US-FED',
            entities: [],
            currencyPresentation: 'USD',
            fxRateType: 'spot',
        },
        tags: ['receivables', 'aging'],
        isCertified: false,
    },
];

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useReportStore = create<ReportState>()(
    persist(
        (set, get) => ({
            // Initial State
            reports: generateDemoReports(),
            snapshots: [],
            schedules: [],
            wizardState: initialWizardState,
            wizardOpen: false,
            selectedReportId: null,

            // CRUD Operations
            createReport: (reportData) => {
                const now = new Date().toISOString();
                const newReport: ReportDefinition = {
                    ...reportData,
                    id: `rpt-${Date.now()}`,
                    definitionVersion: 1,
                    createdAt: now,
                    lastModifiedAt: now,
                };
                set((state) => ({
                    reports: [...state.reports, newReport],
                }));
                return newReport;
            },

            updateReport: (id, updates) => {
                set((state) => ({
                    reports: state.reports.map((r) =>
                        r.id === id
                            ? {
                                ...r,
                                ...updates,
                                definitionVersion: r.definitionVersion + 1,
                                lastModifiedAt: new Date().toISOString(),
                            }
                            : r
                    ),
                }));
            },

            deleteReport: (id) => {
                set((state) => ({
                    reports: state.reports.filter((r) => r.id !== id),
                    snapshots: state.snapshots.filter((s) => s.reportDefinitionId !== id),
                    schedules: state.schedules.filter((s) => s.reportDefinitionId !== id),
                }));
            },

            duplicateReport: (id, newName) => {
                const original = get().reports.find((r) => r.id === id);
                if (!original) throw new Error('Report not found');

                const now = new Date().toISOString();
                const duplicate: ReportDefinition = {
                    ...original,
                    id: `rpt-${Date.now()}`,
                    name: newName,
                    definitionVersion: 1,
                    createdAt: now,
                    lastModifiedAt: now,
                    status: 'draft',
                    isCertified: false,
                    certifiedBy: undefined,
                    certifiedAt: undefined,
                };
                set((state) => ({
                    reports: [...state.reports, duplicate],
                }));
                return duplicate;
            },

            // Wizard Operations
            openWizard: (editReport) => {
                if (editReport) {
                    set({
                        wizardOpen: true,
                        wizardState: {
                            ...initialWizardState,
                            currentStep: 'type',
                            reportType: editReport.reportType,
                            category: editReport.category,
                            reportName: editReport.name,
                            reportDescription: editReport.description || '',
                            visibility: editReport.visibility,
                            tags: editReport.tags,
                            scope: {
                                entities: editReport.jurisdiction.entities,
                                dateRange: editReport.querySpec.dateRange,
                                timeGrain: editReport.querySpec.timeGrain,
                                currencyView: 'native',
                                presentationCurrency: editReport.jurisdiction.currencyPresentation,
                            },
                            dimensions: editReport.querySpec.dimensions,
                            measures: editReport.querySpec.measures,
                            computedMeasures: editReport.querySpec.computedMeasures,
                            filters: editReport.querySpec.filters,
                            jurisdiction: editReport.jurisdiction,
                        },
                    });
                } else {
                    set({
                        wizardOpen: true,
                        wizardState: initialWizardState,
                    });
                }
            },

            closeWizard: () => {
                set({
                    wizardOpen: false,
                    wizardState: initialWizardState,
                });
            },

            setWizardStep: (step) => {
                set((state) => ({
                    wizardState: { ...state.wizardState, currentStep: step },
                }));
            },

            nextStep: () => {
                const currentIndex = WIZARD_STEPS.indexOf(get().wizardState.currentStep);
                if (currentIndex < WIZARD_STEPS.length - 1) {
                    set((state) => ({
                        wizardState: {
                            ...state.wizardState,
                            currentStep: WIZARD_STEPS[currentIndex + 1],
                        },
                    }));
                }
            },

            prevStep: () => {
                const currentIndex = WIZARD_STEPS.indexOf(get().wizardState.currentStep);
                if (currentIndex > 0) {
                    set((state) => ({
                        wizardState: {
                            ...state.wizardState,
                            currentStep: WIZARD_STEPS[currentIndex - 1],
                        },
                    }));
                }
            },

            updateWizardState: (updates) => {
                set((state) => ({
                    wizardState: { ...state.wizardState, ...updates },
                }));
            },

            resetWizard: () => {
                set({ wizardState: initialWizardState });
            },

            // Type Selection
            selectReportType: (type, category) => {
                set((state) => ({
                    wizardState: {
                        ...state.wizardState,
                        reportType: type,
                        category: category,
                    },
                }));
            },

            // Scope Configuration
            setEntities: (entities) => {
                set((state) => ({
                    wizardState: {
                        ...state.wizardState,
                        scope: { ...state.wizardState.scope, entities },
                        jurisdiction: { ...state.wizardState.jurisdiction, entities },
                    },
                }));
            },

            setDateRange: (dateRange) => {
                set((state) => ({
                    wizardState: {
                        ...state.wizardState,
                        scope: { ...state.wizardState.scope, dateRange },
                    },
                }));
            },

            setTimeGrain: (grain) => {
                set((state) => ({
                    wizardState: {
                        ...state.wizardState,
                        scope: { ...state.wizardState.scope, timeGrain: grain },
                    },
                }));
            },

            setCurrencyView: (view, presentationCurrency) => {
                set((state) => ({
                    wizardState: {
                        ...state.wizardState,
                        scope: {
                            ...state.wizardState.scope,
                            currencyView: view,
                            presentationCurrency: presentationCurrency || state.wizardState.scope.presentationCurrency,
                        },
                    },
                }));
            },

            // Dimensions & Measures
            toggleDimension: (field) => {
                set((state) => {
                    const existing = state.wizardState.dimensions.find((d) => d.field === field);
                    if (existing) {
                        return {
                            wizardState: {
                                ...state.wizardState,
                                dimensions: state.wizardState.dimensions.map((d) =>
                                    d.field === field ? { ...d, enabled: !d.enabled } : d
                                ),
                            },
                        };
                    }
                    return {
                        wizardState: {
                            ...state.wizardState,
                            dimensions: [
                                ...state.wizardState.dimensions,
                                { field, label: field, enabled: true },
                            ],
                        },
                    };
                });
            },

            toggleMeasure: (field) => {
                set((state) => {
                    const existing = state.wizardState.measures.find((m) => m.field === field);
                    if (existing) {
                        return {
                            wizardState: {
                                ...state.wizardState,
                                measures: state.wizardState.measures.map((m) =>
                                    m.field === field ? { ...m, enabled: !m.enabled } : m
                                ),
                            },
                        };
                    }
                    return {
                        wizardState: {
                            ...state.wizardState,
                            measures: [
                                ...state.wizardState.measures,
                                { field, label: field, aggregation: 'sum', format: 'currency', enabled: true },
                            ],
                        },
                    };
                });
            },

            addComputedMeasure: (measure) => {
                set((state) => ({
                    wizardState: {
                        ...state.wizardState,
                        computedMeasures: [...state.wizardState.computedMeasures, measure],
                    },
                }));
            },

            removeComputedMeasure: (id) => {
                set((state) => ({
                    wizardState: {
                        ...state.wizardState,
                        computedMeasures: state.wizardState.computedMeasures.filter((m) => m.id !== id),
                    },
                }));
            },

            // Filters
            addFilter: (filter) => {
                set((state) => ({
                    wizardState: {
                        ...state.wizardState,
                        filters: [...state.wizardState.filters, filter],
                    },
                }));
            },

            updateFilter: (index, filter) => {
                set((state) => ({
                    wizardState: {
                        ...state.wizardState,
                        filters: state.wizardState.filters.map((f, i) => (i === index ? filter : f)),
                    },
                }));
            },

            removeFilter: (index) => {
                set((state) => ({
                    wizardState: {
                        ...state.wizardState,
                        filters: state.wizardState.filters.filter((_, i) => i !== index),
                    },
                }));
            },

            clearFilters: () => {
                set((state) => ({
                    wizardState: { ...state.wizardState, filters: [] },
                }));
            },

            // Jurisdiction
            setJurisdiction: (settings) => {
                set((state) => ({
                    wizardState: {
                        ...state.wizardState,
                        jurisdiction: { ...state.wizardState.jurisdiction, ...settings },
                    },
                }));
            },

            // Validation
            validateReport: () => {
                const { wizardState } = get();
                const results: ValidationResult[] = [];

                // Structural Validation
                if (!wizardState.reportType) {
                    results.push({
                        type: 'error',
                        category: 'structural',
                        code: 'MISSING_TYPE',
                        message: 'Report type is required',
                        suggestion: 'Select a report type in step 1',
                    });
                }

                if (!wizardState.reportName.trim()) {
                    results.push({
                        type: 'error',
                        category: 'structural',
                        code: 'MISSING_NAME',
                        message: 'Report name is required',
                        field: 'reportName',
                        suggestion: 'Enter a name for your report',
                    });
                }

                if (wizardState.dimensions.filter((d) => d.enabled).length === 0) {
                    results.push({
                        type: 'warning',
                        category: 'structural',
                        code: 'NO_DIMENSIONS',
                        message: 'No dimensions selected',
                        suggestion: 'Select at least one dimension to group your data',
                    });
                }

                if (wizardState.measures.filter((m) => m.enabled).length === 0) {
                    results.push({
                        type: 'warning',
                        category: 'structural',
                        code: 'NO_MEASURES',
                        message: 'No measures selected',
                        suggestion: 'Select at least one measure to aggregate',
                    });
                }

                // Date range validation
                if (wizardState.scope.dateRange.type === 'absolute') {
                    if (!wizardState.scope.dateRange.startDate || !wizardState.scope.dateRange.endDate) {
                        results.push({
                            type: 'error',
                            category: 'structural',
                            code: 'INVALID_DATE_RANGE',
                            message: 'Start and end dates are required for absolute date range',
                            suggestion: 'Select both start and end dates',
                        });
                    } else if (wizardState.scope.dateRange.startDate > wizardState.scope.dateRange.endDate) {
                        results.push({
                            type: 'error',
                            category: 'structural',
                            code: 'DATE_RANGE_INVERTED',
                            message: 'Start date cannot be after end date',
                            suggestion: 'Correct the date range',
                        });
                    }
                }

                // =========================================================
                // JURISDICTION-SPECIFIC VALIDATION
                // =========================================================
                const jurisdictionCode = wizardState.jurisdiction.primaryJurisdiction;

                // Fiscal Year Validation by Jurisdiction
                const fiscalYearJurisdictions: Record<string, { start: string; end: string; note: string }> = {
                    'GB': { start: '04-06', end: '04-05', note: 'UK fiscal year runs April 6 - April 5' },
                    'AU': { start: '07-01', end: '06-30', note: 'Australian fiscal year runs July 1 - June 30' },
                    'IN': { start: '04-01', end: '03-31', note: 'Indian fiscal year runs April 1 - March 31' },
                    'JP': { start: '04-01', end: '03-31', note: 'Japanese fiscal year typically runs April 1 - March 31' },
                };

                if (fiscalYearJurisdictions[jurisdictionCode] && wizardState.scope.dateRange.relativePeriod === 'this_year') {
                    results.push({
                        type: 'info',
                        category: 'accounting',
                        code: 'FISCAL_YEAR_NOTE',
                        message: fiscalYearJurisdictions[jurisdictionCode].note,
                        suggestion: 'Verify date range aligns with local fiscal year requirements',
                    });
                }

                // Multi-currency warning for certain jurisdictions
                if (wizardState.scope.currencyView === 'multi') {
                    const strictCurrencyJurisdictions = ['CN', 'IN', 'BR', 'RU'];
                    if (strictCurrencyJurisdictions.includes(jurisdictionCode)) {
                        results.push({
                            type: 'warning',
                            category: 'accounting',
                            code: 'FX_CONTROLS',
                            message: `${jurisdictionCode} has foreign exchange controls`,
                            suggestion: 'Ensure FX rates comply with local central bank regulations',
                        });
                    }
                }

                // Transfer Pricing Documentation Warning
                if (wizardState.jurisdiction.entities.length > 1) {
                    results.push({
                        type: 'info',
                        category: 'accounting',
                        code: 'TRANSFER_PRICING',
                        message: 'Multi-entity report may require transfer pricing documentation',
                        suggestion: 'Ensure intercompany transactions are at arm\'s length',
                    });
                }

                // US State-specific validations
                if (jurisdictionCode.startsWith('US-') && jurisdictionCode !== 'US-FED') {
                    results.push({
                        type: 'info',
                        category: 'accounting',
                        code: 'STATE_NEXUS',
                        message: `Report includes ${jurisdictionCode} state data`,
                        suggestion: 'Verify nexus requirements and apportionment rules apply',
                    });
                }

                // EU VAT Requirements
                const euCountries = ['DE', 'FR', 'NL', 'IE', 'LU', 'IT', 'ES', 'BE', 'AT', 'PT', 'GR', 'FI', 'SE', 'DK', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV', 'EE', 'CY', 'MT'];
                if (euCountries.includes(jurisdictionCode)) {
                    if (['ar_aging', 'open_receivables', 'ap_aging', 'open_payables'].includes(wizardState.reportType || '')) {
                        results.push({
                            type: 'info',
                            category: 'accounting',
                            code: 'EU_VAT',
                            message: 'EU invoices must comply with VAT Directive requirements',
                            suggestion: 'Ensure invoice details include VAT numbers and rates',
                        });
                    }
                }

                // Territorial Tax System Warning
                const territorialJurisdictions = ['SG', 'HK', 'MY', 'PA'];
                if (territorialJurisdictions.includes(jurisdictionCode)) {
                    results.push({
                        type: 'info',
                        category: 'accounting',
                        code: 'TERRITORIAL_SYSTEM',
                        message: `${jurisdictionCode} uses territorial taxation`,
                        suggestion: 'Only locally-sourced income is typically taxable',
                    });
                }

                // Cash Flow Statement Method by Jurisdiction
                if (wizardState.reportType === 'cash_flow_indirect') {
                    const directMethodRequired = ['BR']; // Brazil requires direct method
                    if (directMethodRequired.includes(jurisdictionCode)) {
                        results.push({
                            type: 'warning',
                            category: 'accounting',
                            code: 'CASH_FLOW_METHOD',
                            message: `${jurisdictionCode} may require direct method cash flow statement`,
                            suggestion: 'Consider using direct method for regulatory compliance',
                        });
                    }
                }

                // IFRS vs Local GAAP Warning
                const localGAAPCountries: Record<string, string> = {
                    'US-FED': 'US GAAP',
                    'CN': 'Chinese GAAP (ASBE)',
                    'JP': 'J-GAAP',
                    'IN': 'Ind AS / Indian GAAP',
                    'BR': 'BR GAAP',
                };
                if (localGAAPCountries[jurisdictionCode]) {
                    results.push({
                        type: 'info',
                        category: 'accounting',
                        code: 'ACCOUNTING_STANDARD',
                        message: `Primary standard: ${localGAAPCountries[jurisdictionCode]}`,
                        suggestion: 'Verify report format complies with local accounting standards',
                    });
                }

                // =========================================================
                // ACCOUNTING VALIDATION (for financial statements)
                // =========================================================
                if (wizardState.reportType === 'balance_sheet') {
                    results.push({
                        type: 'info',
                        category: 'accounting',
                        code: 'BALANCE_CHECK_PENDING',
                        message: 'Balance sheet will be validated after preview',
                        suggestion: 'Assets must equal Liabilities + Equity',
                    });
                }

                if (wizardState.reportType === 'profit_loss') {
                    results.push({
                        type: 'info',
                        category: 'accounting',
                        code: 'PL_RECONCILE_PENDING',
                        message: 'P&L will be reconciled to ledger totals',
                        suggestion: 'Ensure all accounts are properly mapped',
                    });
                }

                if (wizardState.reportType === 'cash_flow_direct' || wizardState.reportType === 'cash_flow_indirect') {
                    results.push({
                        type: 'info',
                        category: 'accounting',
                        code: 'CASH_RECONCILE_PENDING',
                        message: 'Cash flow will reconcile to change in cash accounts',
                        suggestion: 'Ensure cash account balances are accurate',
                    });
                }

                set((state) => ({
                    wizardState: { ...state.wizardState, validationResults: results },
                }));

                return results;
            },

            // Preview
            generatePreview: async () => {
                set((state) => ({
                    wizardState: { ...state.wizardState, previewLoading: true, previewError: undefined },
                }));

                try {
                    // Simulate API call
                    await new Promise((resolve) => setTimeout(resolve, 1000));

                    // Generate mock preview data based on report type
                    const mockData = {
                        headers: ['Category', 'Amount'],
                        rows: [
                            { category: 'Revenue', amount: 125000 },
                            { category: 'Cost of Goods', amount: -45000 },
                            { category: 'Operating Expenses', amount: -35000 },
                            { category: 'Net Income', amount: 45000 },
                        ],
                        totals: { amount: 45000 },
                        metadata: {
                            generatedAt: new Date().toISOString(),
                            rowCount: 4,
                            currency: 'USD',
                        },
                    };

                    set((state) => ({
                        wizardState: {
                            ...state.wizardState,
                            previewData: mockData,
                            previewLoading: false,
                        },
                    }));
                } catch (error) {
                    set((state) => ({
                        wizardState: {
                            ...state.wizardState,
                            previewLoading: false,
                            previewError: 'Failed to generate preview',
                        },
                    }));
                }
            },

            // Save
            saveReport: () => {
                const { wizardState } = get();

                if (!wizardState.reportType || !wizardState.category || !wizardState.reportName.trim()) {
                    return null;
                }

                const now = new Date().toISOString();
                const newReport: ReportDefinition = {
                    id: `rpt-${Date.now()}`,
                    name: wizardState.reportName.trim(),
                    description: wizardState.reportDescription,
                    reportType: wizardState.reportType,
                    category: wizardState.category,
                    definitionVersion: 1,
                    createdBy: 'user', // Would come from auth
                    createdAt: now,
                    lastModifiedBy: 'user',
                    lastModifiedAt: now,
                    status: 'draft',
                    visibility: wizardState.visibility,
                    querySpec: {
                        dataSources: [wizardState.category],
                        filters: wizardState.filters,
                        dimensions: wizardState.dimensions,
                        measures: wizardState.measures,
                        computedMeasures: wizardState.computedMeasures,
                        timeGrain: wizardState.scope.timeGrain,
                        dateRange: wizardState.scope.dateRange,
                        sorting: [],
                    },
                    formatting: {
                        currencyDisplay: 'symbol',
                        decimals: 2,
                        thousandsSeparator: true,
                        negativeFormat: 'parentheses',
                        dateFormat: 'MMM yyyy',
                        roundingMode: 'round',
                    },
                    reconciliation: {
                        enabled: ['profit_loss', 'balance_sheet', 'cash_flow_direct', 'cash_flow_indirect'].includes(wizardState.reportType),
                        tolerance: 0.01,
                        strictMode: true,
                        balanceValidation: wizardState.reportType === 'balance_sheet',
                        reconcileToLedger: wizardState.reportType === 'profit_loss',
                        reconcileToCash: ['cash_flow_direct', 'cash_flow_indirect'].includes(wizardState.reportType),
                    },
                    jurisdiction: wizardState.jurisdiction,
                    tags: wizardState.tags,
                    isCertified: false,
                };

                set((state) => ({
                    reports: [...state.reports, newReport],
                    wizardOpen: false,
                    wizardState: initialWizardState,
                }));

                return newReport;
            },

            // Snapshots
            createSnapshot: async (reportId) => {
                const report = get().reports.find((r) => r.id === reportId);
                if (!report) throw new Error('Report not found');

                // Simulate generating snapshot
                await new Promise((resolve) => setTimeout(resolve, 500));

                const snapshot: ReportSnapshot = {
                    id: `snap-${Date.now()}`,
                    reportDefinitionId: reportId,
                    definitionVersion: report.definitionVersion,
                    dataCutoffTimestamp: new Date().toISOString(),
                    computedOutput: { /* Would be actual data */ },
                    createdBy: 'user',
                    createdAt: new Date().toISOString(),
                    metadata: {
                        rowCount: 100,
                        executionTimeMs: 450,
                        warnings: [],
                    },
                };

                set((state) => ({
                    snapshots: [...state.snapshots, snapshot],
                }));

                return snapshot;
            },

            // Schedules
            createSchedule: (scheduleData) => {
                const schedule: ReportSchedule = {
                    ...scheduleData,
                    id: `sched-${Date.now()}`,
                };
                set((state) => ({
                    schedules: [...state.schedules, schedule],
                }));
                return schedule;
            },

            updateSchedule: (id, updates) => {
                set((state) => ({
                    schedules: state.schedules.map((s) => (s.id === id ? { ...s, ...updates } : s)),
                }));
            },

            deleteSchedule: (id) => {
                set((state) => ({
                    schedules: state.schedules.filter((s) => s.id !== id),
                }));
            },

            // Helpers
            getReportById: (id) => {
                return get().reports.find((r) => r.id === id);
            },

            getReportsByCategory: (category) => {
                return get().reports.filter((r) => r.category === category);
            },

            getFavoriteReports: () => {
                return get().reports.filter((r) => r.tags.includes('favorite'));
            },

            searchReports: (query) => {
                const lowerQuery = query.toLowerCase();
                return get().reports.filter(
                    (r) =>
                        r.name.toLowerCase().includes(lowerQuery) ||
                        r.description?.toLowerCase().includes(lowerQuery) ||
                        r.tags.some((t) => t.toLowerCase().includes(lowerQuery))
                );
            },
        }),
        {
            name: 'primebalance-reports',
            partialize: (state) => ({
                reports: state.reports,
                snapshots: state.snapshots,
                schedules: state.schedules,
            }),
        }
    )
);