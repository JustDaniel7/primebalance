'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ChevronLeft,
    ChevronRight,
    Check,
    FileSpreadsheet,
    UserCheck,
    Receipt,
    Package,
    Building2,
    Landmark,
    TrendingUp,
    Wrench,
    Calendar,
    Globe,
    Filter,
    Eye,
    CheckCircle2,
    Save,
    AlertTriangle,
    AlertCircle,
    Info,
    Clock,
    BarChart3,
    PieChart,
    LineChart,
    Table,
    Grid3X3,
    Users2,
    ArrowDownUp,
    Scale,
    Wallet,
    CreditCard,
    Target,
    Shield,
    GitCompare,
    BarChart2,
    PackageCheck,
    ArrowLeftRight,
    Calculator,
    Layers,
    Trash2,
    Minimize2,
    Search,
    Plus,
    Settings,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useReportStore } from '@/store/report-store';
import { ALL_JURISDICTIONS, getJurisdiction } from '@/data/jurisdictions';
import {
    REPORT_CATEGORIES,
    REPORT_TEMPLATES,
    type ReportCategory,
    type ReportType,
    type WizardStep,
    type TimeGrain,
    type CurrencyView,
    type ValidationResult,
} from '@/types/report';

// =============================================================================
// ICON MAPPING
// =============================================================================

const ICON_MAP: Record<string, React.ElementType> = {
    FileSpreadsheet,
    UserCheck,
    Receipt,
    Package,
    Building2,
    Landmark,
    TrendingUp,
    Wrench,
    Clock,
    BarChart3,
    PieChart,
    LineChart,
    Table,
    Grid3X3,
    Users2,
    ArrowDownUp,
    Scale,
    Wallet,
    CreditCard,
    Target,
    Shield,
    GitCompare,
    BarChart2,
    PackageCheck,
    ArrowLeftRight,
    Calculator,
    Layers,
    Trash2,
    Minimize2,
    Users: UserCheck,
    Building: Building2,
};

// =============================================================================
// WIZARD STEP CONFIG
// =============================================================================

const WIZARD_STEPS: { id: WizardStep; label: string; icon: React.ElementType }[] = [
    { id: 'type', label: 'Select Type', icon: FileSpreadsheet },
    { id: 'scope', label: 'Data Scope', icon: Globe },
    { id: 'dimensions', label: 'Dimensions', icon: Grid3X3 },
    { id: 'measures', label: 'Measures', icon: BarChart3 },
    { id: 'filters', label: 'Filters', icon: Filter },
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'validate', label: 'Validate', icon: CheckCircle2 },
    { id: 'save', label: 'Save', icon: Save },
];

// =============================================================================
// REPORTS WIZARD COMPONENT
// =============================================================================

interface ReportsWizardProps {
    onClose: () => void;
}

export function ReportsWizard({ onClose }: ReportsWizardProps) {
    const { t, language } = useThemeStore();
    const {
        wizardState,
        setWizardStep,
        nextStep,
        prevStep,
        updateWizardState,
        selectReportType,
        setEntities,
        setDateRange,
        setTimeGrain,
        setCurrencyView,
        setJurisdiction,
        toggleDimension,
        toggleMeasure,
        addFilter,
        removeFilter,
        validateReport,
        generatePreview,
        saveReport,
    } = useReportStore();

    const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.id === wizardState.currentStep);

    // Get jurisdiction info for display
    const selectedJurisdiction = useMemo(() => {
        return getJurisdiction(wizardState.jurisdiction.primaryJurisdiction);
    }, [wizardState.jurisdiction.primaryJurisdiction]);

    // Check if can proceed to next step
    const canProceed = useMemo(() => {
        switch (wizardState.currentStep) {
            case 'type':
                return wizardState.reportType !== null;
            case 'scope':
                return true; // Date range has defaults
            case 'dimensions':
                return true; // Optional
            case 'measures':
                return true; // Optional
            case 'filters':
                return true; // Optional
            case 'preview':
                return true;
            case 'validate':
                return !wizardState.validationResults?.some((r) => r.type === 'error');
            case 'save':
                return wizardState.reportName.trim().length > 0;
            default:
                return true;
        }
    }, [wizardState]);

    // Handle step change with validation trigger
    const handleNextStep = () => {
        if (wizardState.currentStep === 'preview') {
            validateReport();
        }
        if (wizardState.currentStep === 'filters') {
            generatePreview();
        }
        nextStep();
    };

    const handleSave = () => {
        const report = saveReport();
        if (report) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-5xl max-h-[90vh] bg-white dark:bg-surface-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-surface-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {t('reports.wizard.title') || 'New Report'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {t('reports.wizard.subtitle') || 'Create a new report step by step'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-surface-700 overflow-x-auto">
                    <div className="flex items-center justify-between min-w-max">
                        {WIZARD_STEPS.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = step.id === wizardState.currentStep;
                            const isCompleted = index < currentStepIndex;
                            const isClickable = index <= currentStepIndex || isCompleted;

                            return (
                                <React.Fragment key={step.id}>
                                    <button
                                        onClick={() => isClickable && setWizardStep(step.id)}
                                        disabled={!isClickable}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                                            isActive
                                                ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                                                : isCompleted
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-gray-400 dark:text-gray-500'
                                        } ${isClickable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-surface-800' : 'cursor-not-allowed'}`}
                                    >
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                isCompleted
                                                    ? 'bg-green-500 text-white'
                                                    : isActive
                                                        ? 'bg-[var(--accent-primary)] text-white'
                                                        : 'bg-gray-200 dark:bg-surface-700'
                                            }`}
                                        >
                                            {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                                        </div>
                                        <span className="text-sm font-medium hidden sm:block">{step.label}</span>
                                    </button>
                                    {index < WIZARD_STEPS.length - 1 && (
                                        <div
                                            className={`w-8 h-0.5 mx-1 ${
                                                index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200 dark:bg-surface-700'
                                            }`}
                                        />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Select Report Type */}
                        {wizardState.currentStep === 'type' && (
                            <StepSelectType
                                selectedType={wizardState.reportType}
                                selectedCategory={wizardState.category}
                                onSelect={selectReportType}
                            />
                        )}

                        {/* Step 2: Data Scope */}
                        {wizardState.currentStep === 'scope' && (
                            <StepDataScope
                                scope={wizardState.scope}
                                jurisdiction={wizardState.jurisdiction}
                                onUpdateScope={(updates) => updateWizardState({ scope: { ...wizardState.scope, ...updates } })}
                                onSetJurisdiction={setJurisdiction}
                            />
                        )}

                        {/* Step 3: Dimensions */}
                        {wizardState.currentStep === 'dimensions' && (
                            <StepDimensions
                                reportType={wizardState.reportType}
                                dimensions={wizardState.dimensions}
                                onToggle={toggleDimension}
                            />
                        )}

                        {/* Step 4: Measures */}
                        {wizardState.currentStep === 'measures' && (
                            <StepMeasures
                                reportType={wizardState.reportType}
                                measures={wizardState.measures}
                                onToggle={toggleMeasure}
                            />
                        )}

                        {/* Step 5: Filters */}
                        {wizardState.currentStep === 'filters' && (
                            <StepFilters
                                filters={wizardState.filters}
                                onAdd={addFilter}
                                onRemove={removeFilter}
                            />
                        )}

                        {/* Step 6: Preview */}
                        {wizardState.currentStep === 'preview' && (
                            <StepPreview
                                previewData={wizardState.previewData}
                                loading={wizardState.previewLoading}
                                error={wizardState.previewError}
                                onRefresh={generatePreview}
                            />
                        )}

                        {/* Step 7: Validate */}
                        {wizardState.currentStep === 'validate' && (
                            <StepValidate
                                results={wizardState.validationResults || []}
                                onRevalidate={validateReport}
                            />
                        )}

                        {/* Step 8: Save */}
                        {wizardState.currentStep === 'save' && (
                            <StepSave
                                reportName={wizardState.reportName}
                                reportDescription={wizardState.reportDescription}
                                visibility={wizardState.visibility}
                                tags={wizardState.tags}
                                onUpdate={updateWizardState}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-surface-700">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        {selectedJurisdiction && (
                            <>
                                <span>{selectedJurisdiction.flag}</span>
                                <span>{selectedJurisdiction.name}</span>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <span>{wizardState.jurisdiction.currencyPresentation}</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="secondary"
                            onClick={prevStep}
                            disabled={currentStepIndex === 0}
                            leftIcon={<ChevronLeft size={18} />}
                        >
                            {t('common.back') || 'Back'}
                        </Button>
                        {wizardState.currentStep === 'save' ? (
                            <Button
                                variant="primary"
                                onClick={handleSave}
                                disabled={!canProceed}
                                leftIcon={<Save size={18} />}
                            >
                                {t('reports.wizard.saveReport') || 'Save Report'}
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                onClick={handleNextStep}
                                disabled={!canProceed}
                                rightIcon={<ChevronRight size={18} />}
                            >
                                {t('common.next') || 'Next'}
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// STEP 1: SELECT REPORT TYPE
// =============================================================================

function StepSelectType({
                            selectedType,
                            selectedCategory,
                            onSelect,
                        }: {
    selectedType: ReportType | null;
    selectedCategory: ReportCategory | null;
    onSelect: (type: ReportType, category: ReportCategory) => void;
}) {
    const { t } = useThemeStore();
    const [expandedCategory, setExpandedCategory] = useState<ReportCategory | null>(selectedCategory);

    const categories = Object.entries(REPORT_CATEGORIES) as [ReportCategory, typeof REPORT_CATEGORIES[ReportCategory]][];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('reports.wizard.selectType') || 'Select Report Type'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('reports.wizard.selectTypeDesc') || 'Choose the type of report you want to create'}
                </p>
            </div>

            <div className="space-y-4">
                {categories.map(([categoryKey, category]) => {
                    const CategoryIcon = ICON_MAP[category.icon] || FileSpreadsheet;
                    const isExpanded = expandedCategory === categoryKey;

                    return (
                        <div
                            key={categoryKey}
                            className="border border-gray-200 dark:border-surface-700 rounded-xl overflow-hidden"
                        >
                            <button
                                onClick={() => setExpandedCategory(isExpanded ? null : categoryKey)}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
                                        <CategoryIcon size={20} className="text-[var(--accent-primary)]" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900 dark:text-white">{category.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {category.reportTypes.length} report types
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight
                                    size={20}
                                    className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                />
                            </button>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-gray-200 dark:border-surface-700"
                                    >
                                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {category.reportTypes.map((reportType) => {
                                                const template = REPORT_TEMPLATES[reportType];
                                                const ReportIcon = ICON_MAP[template.icon] || FileSpreadsheet;
                                                const isSelected = selectedType === reportType;

                                                return (
                                                    <button
                                                        key={reportType}
                                                        onClick={() => onSelect(reportType, categoryKey)}
                                                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                                                            isSelected
                                                                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                                                : 'border-gray-200 dark:border-surface-700 hover:border-gray-300 dark:hover:border-surface-600'
                                                        }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <ReportIcon
                                                                size={20}
                                                                className={isSelected ? 'text-[var(--accent-primary)]' : 'text-gray-400'}
                                                            />
                                                            <div>
                                                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                                    {template.name}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                    {template.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}

// =============================================================================
// STEP 2: DATA SCOPE
// =============================================================================

function StepDataScope({
                           scope,
                           jurisdiction,
                           onUpdateScope,
                           onSetJurisdiction,
                       }: {
    scope: any;
    jurisdiction: any;
    onUpdateScope: (updates: any) => void;
    onSetJurisdiction: (settings: any) => void;
}) {
    const { t, language } = useThemeStore();

    const relativePeriods = [
        { value: 'this_week', label: 'This Week' },
        { value: 'this_month', label: 'This Month' },
        { value: 'this_quarter', label: 'This Quarter' },
        { value: 'this_year', label: 'This Year' },
        { value: 'last_month', label: 'Last Month' },
        { value: 'last_quarter', label: 'Last Quarter' },
        { value: 'last_year', label: 'Last Year' },
        { value: 'ytd', label: 'Year to Date' },
        { value: 'custom', label: 'Custom Range' },
    ];

    const timeGrains: { value: TimeGrain; label: string }[] = [
        { value: 'day', label: 'Daily' },
        { value: 'week', label: 'Weekly' },
        { value: 'month', label: 'Monthly' },
        { value: 'quarter', label: 'Quarterly' },
        { value: 'year', label: 'Yearly' },
    ];

    const currencyViews: { value: CurrencyView; label: string }[] = [
        { value: 'native', label: 'Native Currency' },
        { value: 'presentation', label: 'Single Currency' },
        { value: 'multi', label: 'Multi-Currency' },
    ];

    // Group jurisdictions for select
    const jurisdictionGroups = useMemo(() => {
        const groups: { label: string; options: typeof ALL_JURISDICTIONS }[] = [
            { label: 'United States', options: ALL_JURISDICTIONS.filter((j) => j.code.startsWith('US-')) },
            { label: 'Europe', options: ALL_JURISDICTIONS.filter((j) => ['DE', 'GB', 'FR', 'CH', 'NL', 'IE', 'LU'].includes(j.code)) },
            { label: 'Asia-Pacific', options: ALL_JURISDICTIONS.filter((j) => ['SG', 'HK', 'JP', 'CN', 'AU', 'IN', 'KR'].includes(j.code)) },
            { label: 'Other', options: ALL_JURISDICTIONS.filter((j) => !j.code.startsWith('US-') && !['DE', 'GB', 'FR', 'CH', 'NL', 'IE', 'LU', 'SG', 'HK', 'JP', 'CN', 'AU', 'IN', 'KR'].includes(j.code)) },
        ];
        return groups.filter((g) => g.options.length > 0);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('reports.wizard.dataScope') || 'Configure Data Scope'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('reports.wizard.dataScopeDesc') || 'Select the entities, date range, and currency settings'}
                </p>
            </div>

            {/* Jurisdiction Selection */}
            <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Globe className="inline w-4 h-4 mr-1" />
                    Primary Jurisdiction
                </label>
                <select
                    value={jurisdiction.primaryJurisdiction}
                    onChange={(e) => {
                        const j = getJurisdiction(e.target.value);
                        onSetJurisdiction({
                            primaryJurisdiction: e.target.value,
                            currencyPresentation: j?.currency || 'USD',
                        });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-gray-900 dark:text-white"
                >
                    {jurisdictionGroups.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                            {group.options.map((j) => (
                                <option key={j.code} value={j.code}>
                                    {j.flag} {j.name} ({j.corporateTax.standardRate}%)
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
                {getJurisdiction(jurisdiction.primaryJurisdiction)?.corporateTax.notes && (
                    <p className="text-xs text-gray-500 mt-2">
                        {getJurisdiction(jurisdiction.primaryJurisdiction)?.corporateTax.notes}
                    </p>
                )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="inline w-4 h-4 mr-1" />
                        Date Range
                    </label>
                    <select
                        value={scope.dateRange.relativePeriod || 'custom'}
                        onChange={(e) => {
                            if (e.target.value === 'custom') {
                                onUpdateScope({
                                    dateRange: { type: 'absolute', startDate: '', endDate: '' },
                                });
                            } else {
                                onUpdateScope({
                                    dateRange: { type: 'relative', relativePeriod: e.target.value },
                                });
                            }
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700"
                    >
                        {relativePeriods.map((p) => (
                            <option key={p.value} value={p.value}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Clock className="inline w-4 h-4 mr-1" />
                        Time Grain
                    </label>
                    <select
                        value={scope.timeGrain}
                        onChange={(e) => onUpdateScope({ timeGrain: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700"
                    >
                        {timeGrains.map((g) => (
                            <option key={g.value} value={g.value}>
                                {g.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Custom Date Range */}
            {scope.dateRange.type === 'absolute' && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={scope.dateRange.startDate || ''}
                            onChange={(e) =>
                                onUpdateScope({
                                    dateRange: { ...scope.dateRange, startDate: e.target.value },
                                })
                            }
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={scope.dateRange.endDate || ''}
                            onChange={(e) =>
                                onUpdateScope({
                                    dateRange: { ...scope.dateRange, endDate: e.target.value },
                                })
                            }
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700"
                        />
                    </div>
                </div>
            )}

            {/* Currency View */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Currency Display
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {currencyViews.map((cv) => (
                        <button
                            key={cv.value}
                            onClick={() => onUpdateScope({ currencyView: cv.value })}
                            className={`p-3 rounded-xl border-2 text-center transition-all ${
                                scope.currencyView === cv.value
                                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                    : 'border-gray-200 dark:border-surface-700'
                            }`}
                        >
                            <span className="text-sm font-medium">{cv.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Presentation Currency */}
            {scope.currencyView === 'presentation' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Presentation Currency
                    </label>
                    <select
                        value={scope.presentationCurrency}
                        onChange={(e) => onUpdateScope({ presentationCurrency: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700"
                    >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="CHF">CHF - Swiss Franc</option>
                        <option value="JPY">JPY - Japanese Yen</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                        <option value="AUD">AUD - Australian Dollar</option>
                    </select>
                </div>
            )}

            {/* Jurisdiction-Specific Information Panel */}
            <JurisdictionInfoPanel jurisdictionCode={jurisdiction.primaryJurisdiction} />
        </motion.div>
    );
}

// =============================================================================
// JURISDICTION INFO PANEL
// =============================================================================

function JurisdictionInfoPanel({ jurisdictionCode }: { jurisdictionCode: string }) {
    const selectedJurisdiction = useMemo(() => getJurisdiction(jurisdictionCode), [jurisdictionCode]);

    if (!selectedJurisdiction) return null;

    // Determine relevant info based on jurisdiction
    const getJurisdictionInfo = () => {
        const info: { label: string; value: string; type: 'info' | 'warning' | 'success' }[] = [];

        // Corporate tax rate
        info.push({
            label: 'Corporate Tax Rate',
            value: `${selectedJurisdiction.corporateTax.standardRate}%`,
            type: 'info',
        });

        // Filing requirements
        if (selectedJurisdiction.filingRequirements?.length > 0) {
            const mainFiling = selectedJurisdiction.filingRequirements[0];
            info.push({
                label: 'Filing Frequency',
                value: mainFiling.frequency || 'Annual',
                type: 'info',
            });
        }

        // Territorial system
        if (selectedJurisdiction.territorialSystem) {
            info.push({
                label: 'Tax System',
                value: 'Territorial (only local income taxed)',
                type: 'success',
            });
        }

        // Transfer pricing rules
        if (selectedJurisdiction.transferPricingRules?.documentationRequired) {
            info.push({
                label: 'Transfer Pricing',
                value: 'Documentation required',
                type: 'warning',
            });
        }

        // CFC rules
        if (selectedJurisdiction.cfcRules) {
            info.push({
                label: 'CFC Rules',
                value: 'Apply to foreign subsidiaries',
                type: 'warning',
            });
        }

        // Thin capitalization
        if (selectedJurisdiction.thinCapitalizationRules) {
            info.push({
                label: 'Thin Cap Rules',
                value: selectedJurisdiction.debtEquityRatio
                    ? `Debt/Equity limit: ${selectedJurisdiction.debtEquityRatio}:1`
                    : 'Applies',
                type: 'warning',
            });
        }

        return info;
    };

    const jurisdictionInfo = getJurisdictionInfo();

    return (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-900 dark:text-blue-100">
                    {selectedJurisdiction.flag} {selectedJurisdiction.name} - Compliance Information
                </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {jurisdictionInfo.map((item, idx) => (
                    <div
                        key={idx}
                        className={`p-2 rounded-lg ${
                            item.type === 'warning'
                                ? 'bg-amber-100 dark:bg-amber-900/30'
                                : item.type === 'success'
                                    ? 'bg-green-100 dark:bg-green-900/30'
                                    : 'bg-white dark:bg-surface-800'
                        }`}
                    >
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                        <p className={`text-sm font-medium ${
                            item.type === 'warning'
                                ? 'text-amber-700 dark:text-amber-300'
                                : item.type === 'success'
                                    ? 'text-green-700 dark:text-green-300'
                                    : 'text-gray-900 dark:text-white'
                        }`}>
                            {item.value}
                        </p>
                    </div>
                ))}
            </div>
            {selectedJurisdiction.taxIncentives && selectedJurisdiction.taxIncentives.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-2">
                        Available Tax Incentives:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {selectedJurisdiction.taxIncentives.slice(0, 3).map((incentive, idx) => (
                            <span
                                key={idx}
                                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded"
                            >
                                {incentive.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// STEP 3: DIMENSIONS
// =============================================================================

function StepDimensions({
                            reportType,
                            dimensions,
                            onToggle,
                        }: {
    reportType: ReportType | null;
    dimensions: any[];
    onToggle: (field: string) => void;
}) {
    const { t } = useThemeStore();

    const availableDimensions = useMemo(() => {
        const common = [
            { field: 'period', label: 'Period', description: 'Time period grouping' },
            { field: 'account', label: 'Account', description: 'Chart of accounts' },
            { field: 'account_category', label: 'Account Category', description: 'High-level account grouping' },
            { field: 'entity', label: 'Entity', description: 'Legal entity / subsidiary' },
            { field: 'department', label: 'Department', description: 'Cost center / department' },
            { field: 'project', label: 'Project', description: 'Project or job code' },
            { field: 'currency', label: 'Currency', description: 'Transaction currency' },
            { field: 'location', label: 'Location', description: 'Geographic location' },
        ];

        // Add type-specific dimensions
        if (reportType?.includes('receivable') || reportType?.includes('ar_')) {
            common.push(
                { field: 'customer', label: 'Customer', description: 'Customer name' },
                { field: 'aging_bucket', label: 'Aging Bucket', description: '0-30, 31-60, 61-90, 90+' }
            );
        }

        if (reportType?.includes('payable') || reportType?.includes('ap_')) {
            common.push(
                { field: 'vendor', label: 'Vendor', description: 'Vendor / supplier name' },
                { field: 'aging_bucket', label: 'Aging Bucket', description: '0-30, 31-60, 61-90, 90+' }
            );
        }

        if (reportType?.includes('inventory')) {
            common.push(
                { field: 'product', label: 'Product', description: 'Product / SKU' },
                { field: 'product_category', label: 'Category', description: 'Product category' },
                { field: 'warehouse', label: 'Warehouse', description: 'Storage location' }
            );
        }

        if (reportType?.includes('asset')) {
            common.push(
                { field: 'asset_class', label: 'Asset Class', description: 'Type of fixed asset' },
                { field: 'depreciation_method', label: 'Depreciation Method', description: 'SL, DB, etc.' }
            );
        }

        return common;
    }, [reportType]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('reports.wizard.dimensions') || 'Select Dimensions'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('reports.wizard.dimensionsDesc') || 'Choose how to group and break down your data'}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableDimensions.map((dim) => {
                    const isEnabled = dimensions.some((d) => d.field === dim.field && d.enabled);
                    return (
                        <button
                            key={dim.field}
                            onClick={() => onToggle(dim.field)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                                isEnabled
                                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                    : 'border-gray-200 dark:border-surface-700 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{dim.label}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{dim.description}</p>
                                </div>
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        isEnabled ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]' : 'border-gray-300'
                                    }`}
                                >
                                    {isEnabled && <Check size={12} className="text-white" />}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
}

// =============================================================================
// STEP 4: MEASURES
// =============================================================================

function StepMeasures({
                          reportType,
                          measures,
                          onToggle,
                      }: {
    reportType: ReportType | null;
    measures: any[];
    onToggle: (field: string) => void;
}) {
    const { t } = useThemeStore();

    const availableMeasures = useMemo(() => {
        const common = [
            { field: 'amount', label: 'Amount', description: 'Sum of transaction amounts' },
            { field: 'count', label: 'Count', description: 'Number of records' },
            { field: 'balance', label: 'Balance', description: 'Running balance' },
        ];

        if (reportType?.includes('receivable') || reportType?.includes('ar_')) {
            common.push(
                { field: 'amount_due', label: 'Amount Due', description: 'Total outstanding' },
                { field: 'amount_paid', label: 'Amount Paid', description: 'Payments received' },
                { field: 'days_outstanding', label: 'Days Outstanding', description: 'Avg days to collect' }
            );
        }

        if (reportType?.includes('inventory')) {
            common.push(
                { field: 'quantity', label: 'Quantity', description: 'Units on hand' },
                { field: 'value', label: 'Value', description: 'Inventory value' },
                { field: 'cost', label: 'Unit Cost', description: 'Cost per unit' }
            );
        }

        if (reportType?.includes('asset') || reportType?.includes('depreciation')) {
            common.push(
                { field: 'cost', label: 'Original Cost', description: 'Asset acquisition cost' },
                { field: 'accumulated_depreciation', label: 'Accumulated Depreciation', description: 'Total depreciation' },
                { field: 'net_book_value', label: 'Net Book Value', description: 'NBV = Cost - Accum Dep' },
                { field: 'depreciation_expense', label: 'Depreciation Expense', description: 'Period expense' }
            );
        }

        if (reportType?.includes('cash_flow') || reportType?.includes('treasury')) {
            common.push(
                { field: 'cash_in', label: 'Cash Inflows', description: 'Money received' },
                { field: 'cash_out', label: 'Cash Outflows', description: 'Money paid out' },
                { field: 'net_cash', label: 'Net Cash', description: 'Inflows - Outflows' }
            );
        }

        return common;
    }, [reportType]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('reports.wizard.measures') || 'Select Measures'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('reports.wizard.measuresDesc') || 'Choose which values to calculate and display'}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableMeasures.map((measure) => {
                    const isEnabled = measures.some((m) => m.field === measure.field && m.enabled);
                    return (
                        <button
                            key={measure.field}
                            onClick={() => onToggle(measure.field)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                                isEnabled
                                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                    : 'border-gray-200 dark:border-surface-700 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{measure.label}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{measure.description}</p>
                                </div>
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        isEnabled ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]' : 'border-gray-300'
                                    }`}
                                >
                                    {isEnabled && <Check size={12} className="text-white" />}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
}

// =============================================================================
// STEP 5: FILTERS
// =============================================================================

function StepFilters({
                         filters,
                         onAdd,
                         onRemove,
                     }: {
    filters: any[];
    onAdd: (filter: any) => void;
    onRemove: (index: number) => void;
}) {
    const { t } = useThemeStore();
    const [newFilter, setNewFilter] = useState({ field: '', operator: 'eq', value: '' });

    const fields = [
        { value: 'account', label: 'Account' },
        { value: 'department', label: 'Department' },
        { value: 'entity', label: 'Entity' },
        { value: 'customer', label: 'Customer' },
        { value: 'vendor', label: 'Vendor' },
        { value: 'currency', label: 'Currency' },
        { value: 'status', label: 'Status' },
    ];

    const operators = [
        { value: 'eq', label: 'Equals' },
        { value: 'ne', label: 'Not Equals' },
        { value: 'gt', label: 'Greater Than' },
        { value: 'gte', label: 'Greater or Equal' },
        { value: 'lt', label: 'Less Than' },
        { value: 'lte', label: 'Less or Equal' },
        { value: 'contains', label: 'Contains' },
        { value: 'in', label: 'In List' },
    ];

    const handleAdd = () => {
        if (newFilter.field && newFilter.value) {
            onAdd(newFilter);
            setNewFilter({ field: '', operator: 'eq', value: '' });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('reports.wizard.filters') || 'Apply Filters'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('reports.wizard.filtersDesc') || 'Optionally filter the data included in your report'}
                </p>
            </div>

            {/* Existing Filters */}
            {filters.length > 0 && (
                <div className="space-y-2">
                    {filters.map((filter, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-surface-800 rounded-lg"
                        >
                            <div className="flex items-center gap-2 text-sm">
                                <Badge variant="info">{filter.field}</Badge>
                                <span className="text-gray-500">{filter.operator}</span>
                                <span className="font-medium text-gray-900 dark:text-white">{filter.value}</span>
                            </div>
                            <button
                                onClick={() => onRemove(index)}
                                className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add New Filter */}
            <div className="p-4 border-2 border-dashed border-gray-300 dark:border-surface-600 rounded-xl">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Add Filter</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <select
                        value={newFilter.field}
                        onChange={(e) => setNewFilter({ ...newFilter, field: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
                    >
                        <option value="">Select Field</option>
                        {fields.map((f) => (
                            <option key={f.value} value={f.value}>
                                {f.label}
                            </option>
                        ))}
                    </select>
                    <select
                        value={newFilter.operator}
                        onChange={(e) => setNewFilter({ ...newFilter, operator: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
                    >
                        {operators.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="Value"
                        value={newFilter.value}
                        onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
                    />
                    <Button variant="secondary" size="sm" onClick={handleAdd} leftIcon={<Plus size={16} />}>
                        Add
                    </Button>
                </div>
            </div>

            {filters.length === 0 && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                    No filters applied. All data will be included.
                </p>
            )}
        </motion.div>
    );
}

// =============================================================================
// STEP 6: PREVIEW
// =============================================================================

function StepPreview({
                         previewData,
                         loading,
                         error,
                         onRefresh,
                     }: {
    previewData: any;
    loading: boolean;
    error?: string;
    onRefresh: () => void;
}) {
    const { t } = useThemeStore();

    useEffect(() => {
        if (!previewData && !loading && !error) {
            onRefresh();
        }
    }, []);

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12"
            >
                <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Generating preview...</p>
            </motion.div>
        );
    }

    if (error) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12"
            >
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <Button variant="secondary" onClick={onRefresh}>
                    Try Again
                </Button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {t('reports.wizard.preview') || 'Preview Report'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('reports.wizard.previewDesc') || 'Review how your report will look'}
                    </p>
                </div>
                <Button variant="secondary" size="sm" onClick={onRefresh} leftIcon={<Settings size={16} />}>
                    Refresh
                </Button>
            </div>

            {previewData && (
                <div className="border border-gray-200 dark:border-surface-700 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-surface-800">
                            <tr>
                                {previewData.headers?.map((header: string, i: number) => (
                                    <th
                                        key={i}
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-surface-700">
                            {previewData.rows?.map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-surface-800">
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                        {row.category}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right font-mono">
                                        {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: previewData.metadata?.currency || 'USD',
                                        }).format(row.amount)}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-4 py-3 bg-gray-50 dark:bg-surface-800 border-t border-gray-200 dark:border-surface-700 text-xs text-gray-500">
                        {previewData.metadata?.rowCount} rows • Generated {new Date(previewData.metadata?.generatedAt).toLocaleString()}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

// =============================================================================
// STEP 7: VALIDATE
// =============================================================================

function StepValidate({
                          results,
                          onRevalidate,
                      }: {
    results: ValidationResult[];
    onRevalidate: () => void;
}) {
    const { t } = useThemeStore();

    const errors = results.filter((r) => r.type === 'error');
    const warnings = results.filter((r) => r.type === 'warning');
    const infos = results.filter((r) => r.type === 'info');

    const getIcon = (type: string) => {
        switch (type) {
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'info':
                return <Info className="w-5 h-5 text-blue-500" />;
            default:
                return null;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {t('reports.wizard.validate') || 'Validation Results'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('reports.wizard.validateDesc') || 'Review any issues with your report configuration'}
                    </p>
                </div>
                <Button variant="secondary" size="sm" onClick={onRevalidate}>
                    Re-validate
                </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl ${errors.length > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-surface-800'}`}>
                    <div className="flex items-center gap-2">
                        <AlertCircle className={`w-5 h-5 ${errors.length > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{errors.length}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Errors</p>
                </div>
                <div className={`p-4 rounded-xl ${warnings.length > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-50 dark:bg-surface-800'}`}>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-5 h-5 ${warnings.length > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{warnings.length}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Warnings</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-800">
                    <div className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-500" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{infos.length}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Info</p>
                </div>
            </div>

            {/* Results List */}
            {results.length > 0 ? (
                <div className="space-y-3">
                    {results.map((result, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-xl border ${
                                result.type === 'error'
                                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                                    : result.type === 'warning'
                                        ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                                        : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                {getIcon(result.type)}
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">{result.message}</p>
                                    {result.suggestion && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            💡 {result.suggestion}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="neutral" size="sm">
                                            {result.category}
                                        </Badge>
                                        <Badge variant="neutral" size="sm">
                                            {result.code}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white">All validations passed!</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your report configuration is valid.</p>
                </div>
            )}
        </motion.div>
    );
}

// =============================================================================
// STEP 8: SAVE
// =============================================================================

function StepSave({
                      reportName,
                      reportDescription,
                      visibility,
                      tags,
                      onUpdate,
                  }: {
    reportName: string;
    reportDescription: string;
    visibility: string;
    tags: string[];
    onUpdate: (updates: any) => void;
}) {
    const { t } = useThemeStore();
    const [newTag, setNewTag] = useState('');

    const addTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            onUpdate({ tags: [...tags, newTag.trim()] });
            setNewTag('');
        }
    };

    const removeTag = (tag: string) => {
        onUpdate({ tags: tags.filter((t) => t !== tag) });
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('reports.wizard.save') || 'Save Report'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('reports.wizard.saveDesc') || 'Give your report a name and configure sharing settings'}
                </p>
            </div>

            {/* Report Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Report Name *
                </label>
                <input
                    type="text"
                    value={reportName}
                    onChange={(e) => onUpdate({ reportName: e.target.value })}
                    placeholder="e.g., Monthly P&L Report"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700"
                />
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                </label>
                <textarea
                    value={reportDescription}
                    onChange={(e) => onUpdate({ reportDescription: e.target.value })}
                    placeholder="Optional description of this report..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700"
                />
            </div>

            {/* Visibility */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Visibility
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { value: 'private', label: 'Private', desc: 'Only you can see' },
                        { value: 'team', label: 'Team', desc: 'Your team members' },
                        { value: 'org', label: 'Organization', desc: 'Everyone in org' },
                    ].map((v) => (
                        <button
                            key={v.value}
                            onClick={() => onUpdate({ visibility: v.value })}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                                visibility === v.value
                                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                    : 'border-gray-200 dark:border-surface-700'
                            }`}
                        >
                            <p className="font-medium text-sm">{v.label}</p>
                            <p className="text-xs text-gray-500">{v.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tags */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag) => (
                        <Badge key={tag} variant="info" size="sm">
                            {tag}
                            <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500">
                                <X size={12} />
                            </button>
                        </Badge>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        placeholder="Add a tag..."
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
                    />
                    <Button variant="secondary" size="sm" onClick={addTag}>
                        Add
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

export default ReportsWizard;