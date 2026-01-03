'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Landmark,
    CreditCard,
    Building2,
    Truck,
    FileText,
    Car,
    Shield,
    HelpCircle,
    ChevronRight,
    ChevronLeft,
    AlertTriangle,
    AlertCircle,
    TrendingDown,
    Calendar,
    Percent,
    X,
    Check,
    DollarSign,
} from 'lucide-react';
import { Card, Button, Badge, Input } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useLiabilitiesStore } from '@/store/liabilities-store';
import toast from 'react-hot-toast';
import type {
    Liability,
    LiabilityPrimaryClass,
    LiabilityStatus,
    RiskLevel,
    CreateLiabilityRequest,
} from '@/types/liabilities';

// =============================================================================
// TYPE ICONS & COLORS
// =============================================================================

const primaryClassIcons: Record<string, React.ElementType> = {
    accounts_payable: Truck,
    accrued_expenses: FileText,
    deferred_revenue: DollarSign,
    short_term_debt: CreditCard,
    long_term_debt: Landmark,
    credit_line: CreditCard,
    lease_operating: Car,
    lease_finance: Car,
    tax_liability: FileText,
    payroll_liability: Building2,
    intercompany: Building2,
    contingent: Shield,
    off_balance_sheet: HelpCircle,
};

const primaryClassColors: Record<string, string> = {
    accounts_payable: 'amber',
    accrued_expenses: 'gray',
    deferred_revenue: 'purple',
    short_term_debt: 'red',
    long_term_debt: 'blue',
    credit_line: 'purple',
    lease_operating: 'cyan',
    lease_finance: 'cyan',
    tax_liability: 'rose',
    payroll_liability: 'green',
    intercompany: 'indigo',
    contingent: 'orange',
    off_balance_sheet: 'gray',
};

// =============================================================================
// LIABILITIES LIST
// =============================================================================

function LiabilitiesList({
    onCreateNew,
    onSelectLiability,
}: {
    onCreateNew: () => void;
    onSelectLiability: (liability: Liability) => void;
}) {
    const { t, language } = useThemeStore();
    const {
        liabilities,
        fetchLiabilities,
        isInitialized,
        statistics,
        fetchStatistics,
        getTotalOutstanding,
        getTotalOutstandingByCurrency,
        getLiabilitiesInDefault,
        getLiabilitiesInDispute,
    } = useLiabilitiesStore();

    useEffect(() => {
        if (!isInitialized) {
            fetchLiabilities();
            fetchStatistics();
        }
    }, [fetchLiabilities, fetchStatistics, isInitialized]);

    const [searchQuery, setSearchQuery] = useState('');
    const [primaryClassFilter, setPrimaryClassFilter] = useState<string | 'all'>('all');

    const inDefaultCount = getLiabilitiesInDefault().length;
    const inDisputeCount = getLiabilitiesInDispute().length;
    const totalOutstanding = getTotalOutstanding();
    const outstandingByCurrency = getTotalOutstandingByCurrency();

    const filteredLiabilities = useMemo(() => {
        return liabilities.filter((lib) => {
            // Filter out archived
            if (lib.status === 'archived') return false;
            const matchesSearch =
                lib.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lib.counterpartyName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesClass = primaryClassFilter === 'all' || lib.primaryClass === primaryClassFilter;
            return matchesSearch && matchesClass;
        });
    }, [liabilities, searchQuery, primaryClassFilter]);

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US');
    };

    const getRiskBadge = (level: RiskLevel | string) => {
        const config: Record<string, { variant: 'success' | 'warning' | 'danger' | 'neutral'; label: string }> = {
            low: { variant: 'success', label: t('liabilities.risk.low') },
            medium: { variant: 'warning', label: t('liabilities.risk.medium') },
            high: { variant: 'danger', label: t('liabilities.risk.high') },
            critical: { variant: 'danger', label: t('liabilities.risk.critical') || 'Critical' },
        };
        const cfg = config[level] || config.medium;
        return <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>;
    };

    const primaryClassOptions: Array<{ value: string | 'all'; label: string }> = [
        { value: 'all', label: t('common.all') },
        { value: 'long_term_debt', label: t('liabilities.class.long_term_debt') || 'Long-term Debt' },
        { value: 'short_term_debt', label: t('liabilities.class.short_term_debt') || 'Short-term Debt' },
        { value: 'credit_line', label: t('liabilities.class.credit_line') || 'Credit Line' },
        { value: 'accounts_payable', label: t('liabilities.class.accounts_payable') || 'Accounts Payable' },
        { value: 'lease_operating', label: t('liabilities.class.lease_operating') || 'Operating Lease' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
                        {t('liabilities.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-surface-500 mt-1">{t('liabilities.subtitle')}</p>
                </div>
                <Button variant="primary" leftIcon={<Plus size={18} />} onClick={onCreateNew}>
                    {t('liabilities.add')}
                </Button>
            </div>

            {/* Alerts Banner */}
            {(inDefaultCount > 0 || inDisputeCount > 0) && (
                <Card variant="glass" padding="md" className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-amber-500 flex-shrink-0" size={20} />
                        <div>
                            <p className="font-medium text-amber-700 dark:text-amber-300">
                                {inDefaultCount + inDisputeCount} {t('liabilities.activeAlerts') || 'Active Alerts'}
                            </p>
                            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                {inDefaultCount > 0 && `${inDefaultCount} in default`}
                                {inDefaultCount > 0 && inDisputeCount > 0 && ', '}
                                {inDisputeCount > 0 && `${inDisputeCount} in dispute`}
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <TrendingDown size={20} className="text-red-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('liabilities.totalLiabilities')}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">
                                {formatCurrency(totalOutstanding, 'EUR')}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Landmark size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('liabilities.count') || 'Count'}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">
                                {statistics?.totalCount || liabilities.length}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <AlertCircle size={20} className="text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('liabilities.inDefault') || 'In Default'}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">
                                {inDefaultCount}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <Calendar size={20} className="text-purple-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('liabilities.inDispute') || 'In Dispute'}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">
                                {inDisputeCount}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('liabilities.search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-gray-900 dark:text-surface-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                    {primaryClassOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setPrimaryClassFilter(option.value)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                primaryClassFilter === option.value
                                    ? 'bg-[var(--accent-primary)] text-white'
                                    : 'bg-gray-100 dark:bg-surface-800/50 text-gray-600 dark:text-surface-400 hover:bg-gray-200 dark:hover:bg-surface-700/50'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Liabilities List */}
            {filteredLiabilities.length === 0 ? (
                <Card variant="glass" padding="lg" className="text-center">
                    <Landmark size={48} className="mx-auto text-gray-300 dark:text-surface-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-surface-100">{t('liabilities.noItems')}</h3>
                    <p className="text-gray-500 dark:text-surface-400 mt-1">{t('liabilities.noItemsDesc')}</p>
                    <Button variant="primary" className="mt-4" onClick={onCreateNew}>
                        {t('liabilities.add')}
                    </Button>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredLiabilities.map((liability, index) => {
                        const Icon = primaryClassIcons[liability.primaryClass as string] || HelpCircle;
                        const hasIssues = liability.isInDefault || liability.isDisputed;

                        return (
                            <motion.div
                                key={liability.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <Card
                                    variant="glass"
                                    padding="md"
                                    hover
                                    className={`cursor-pointer ${hasIssues ? 'border-l-4 border-amber-500' : ''}`}
                                    onClick={() => onSelectLiability(liability)}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl bg-${primaryClassColors[liability.primaryClass as string] || 'gray'}-500/10 flex items-center justify-center flex-shrink-0`}>
                                                <Icon size={20} className={`text-${primaryClassColors[liability.primaryClass as string] || 'gray'}-500`} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-900 dark:text-surface-100 truncate">
                                                        {liability.name}
                                                    </span>
                                                    <Badge variant="neutral" size="sm">
                                                        {t(`liabilities.class.${liability.primaryClass}`) || liability.primaryClass}
                                                    </Badge>
                                                    {hasIssues && <AlertCircle size={16} className="text-amber-500" />}
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-surface-400 truncate">
                                                    {liability.counterpartyName}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900 dark:text-surface-100">
                                                    {formatCurrency(liability.totalOutstanding, liability.currency)}
                                                </p>
                                                {liability.maturityDate && (
                                                    <p className="text-sm text-gray-500 dark:text-surface-400">
                                                        {t('liabilities.dueDate')}: {formatDate(liability.maturityDate)}
                                                    </p>
                                                )}
                                            </div>

                                            {getRiskBadge(liability.riskLevel)}
                                            <ChevronRight size={16} className="text-gray-400" />
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Exposure Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card variant="glass" padding="md">
                    <h3 className="font-medium text-gray-700 dark:text-surface-300 mb-4">{t('liabilities.byClass') || 'By Class'}</h3>
                    <div className="space-y-3">
                        {statistics?.byPrimaryClass && Object.entries(statistics.byPrimaryClass).map(([classKey, data]) => (
                            <div key={classKey} className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-surface-400">
                                    {t(`liabilities.class.${classKey}`) || classKey}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-surface-100">
                                    {formatCurrency(data.outstanding, 'EUR')}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <h3 className="font-medium text-gray-700 dark:text-surface-300 mb-4">{t('liabilities.byCurrency')}</h3>
                    <div className="space-y-3">
                        {Object.entries(outstandingByCurrency).map(([currency, amount]) => (
                            <div key={currency} className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-surface-400">{currency}</span>
                                <span className="font-medium text-gray-900 dark:text-surface-100">
                                    {formatCurrency(amount, currency)}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}

// =============================================================================
// LIABILITIES WIZARD (Simplified)
// =============================================================================

interface WizardState {
    step: number;
    primaryClass: LiabilityPrimaryClass | string;
    name: string;
    counterpartyName: string;
    counterpartyType: string;
    currency: string;
    originalPrincipal: number;
    outstandingPrincipal: number;
    inceptionDate: string;
    maturityDate: string;
    interestRate: number;
    isInterestBearing: boolean;
    notes: string;
}

const initialWizardState: WizardState = {
    step: 1,
    primaryClass: '',
    name: '',
    counterpartyName: '',
    counterpartyType: 'bank',
    currency: 'EUR',
    originalPrincipal: 0,
    outstandingPrincipal: 0,
    inceptionDate: new Date().toISOString().split('T')[0],
    maturityDate: '',
    interestRate: 0,
    isInterestBearing: false,
    notes: '',
};

function LiabilitiesWizard({
    onClose,
    onComplete,
}: {
    onClose: () => void;
    onComplete: (liability: Liability) => void;
}) {
    const { t, language } = useThemeStore();
    const { createLiability } = useLiabilitiesStore();
    const [wizardState, setWizardState] = useState<WizardState>(initialWizardState);

    const steps = [
        { id: 1, label: t('liabilities.wizard.type') || 'Type', icon: HelpCircle },
        { id: 2, label: t('liabilities.wizard.counterparty') || 'Counterparty', icon: Building2 },
        { id: 3, label: t('liabilities.wizard.amount') || 'Amount', icon: DollarSign },
        { id: 4, label: t('liabilities.wizard.terms') || 'Terms', icon: Percent },
        { id: 5, label: t('liabilities.wizard.review') || 'Review', icon: Check },
    ];

    const currentStep = wizardState.step;

    const updateState = (updates: Partial<WizardState>) => {
        setWizardState((prev) => ({ ...prev, ...updates }));
    };

    const goNext = () => currentStep < 5 && updateState({ step: currentStep + 1 });
    const goBack = () => currentStep > 1 && updateState({ step: currentStep - 1 });

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency }).format(amount);
    };

    const primaryClassOptions: Array<{ value: string; label: string; description: string; icon: React.ElementType }> = [
        { value: 'long_term_debt', label: t('liabilities.class.long_term_debt') || 'Long-term Debt', description: 'Bank loans, bonds, mortgages', icon: Landmark },
        { value: 'credit_line', label: t('liabilities.class.credit_line') || 'Credit Line', description: 'Revolving credit facilities', icon: CreditCard },
        { value: 'short_term_debt', label: t('liabilities.class.short_term_debt') || 'Short-term Debt', description: 'Due within 12 months', icon: TrendingDown },
        { value: 'accounts_payable', label: t('liabilities.class.accounts_payable') || 'Accounts Payable', description: 'Supplier invoices', icon: Truck },
        { value: 'lease_operating', label: t('liabilities.class.lease_operating') || 'Operating Lease', description: 'Equipment, vehicle leases', icon: Car },
        { value: 'tax_liability', label: t('liabilities.class.tax_liability') || 'Tax Liability', description: 'Taxes owed', icon: Shield },
    ];

    const handleCreate = async () => {
        const request: CreateLiabilityRequest = {
            name: wizardState.name,
            primaryClass: wizardState.primaryClass,
            counterpartyName: wizardState.counterpartyName,
            counterpartyType: wizardState.counterpartyType as any,
            originalPrincipal: wizardState.originalPrincipal,
            outstandingPrincipal: wizardState.outstandingPrincipal || wizardState.originalPrincipal,
            currency: wizardState.currency,
            inceptionDate: wizardState.inceptionDate,
            maturityDate: wizardState.maturityDate || undefined,
            isInterestBearing: wizardState.isInterestBearing,
            interestRate: wizardState.interestRate || undefined,
            notes: wizardState.notes || undefined,
        };

        const liability = await createLiability(request);
        if (liability) {
            onComplete(liability);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1: // Type
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('liabilities.wizard.selectType') || 'Select Liability Type'}
                            </h2>
                            <p className="text-gray-500 dark:text-surface-400 mt-1">
                                {t('liabilities.wizard.selectTypeDesc') || 'Choose the type that best describes this liability'}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {primaryClassOptions.map((option) => {
                                const Icon = option.icon;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => updateState({ primaryClass: option.value })}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                                            wizardState.primaryClass === option.value
                                                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                                : 'border-gray-200 dark:border-surface-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <Icon size={24} className={wizardState.primaryClass === option.value ? 'text-[var(--accent-primary)]' : 'text-gray-400'} />
                                        <p className="font-semibold text-gray-900 dark:text-surface-100 mt-2">{option.label}</p>
                                        <p className="text-sm text-gray-500 dark:text-surface-400 mt-1">{option.description}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );

            case 2: // Counterparty
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('liabilities.wizard.whoIs') || 'Who is the counterparty?'}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
                                    {t('liabilities.counterpartyType') || 'Counterparty Type'}
                                </label>
                                <div className="flex gap-3">
                                    {(['bank', 'supplier', 'investor', 'government', 'other'] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => updateState({ counterpartyType: type })}
                                            className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                                                wizardState.counterpartyType === type
                                                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 text-[var(--accent-primary)]'
                                                    : 'border-gray-200 dark:border-surface-700 text-gray-600 dark:text-surface-400'
                                            }`}
                                        >
                                            {t(`liabilities.counterparty.${type}`) || type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Input
                                label={t('liabilities.counterpartyName') || 'Counterparty Name'}
                                value={wizardState.counterpartyName}
                                onChange={(e) => updateState({ counterpartyName: e.target.value })}
                                placeholder="Deutsche Bank"
                            />
                            <Input
                                label={t('liabilities.name') || 'Liability Name'}
                                value={wizardState.name}
                                onChange={(e) => updateState({ name: e.target.value })}
                                placeholder="Term Loan 2024"
                            />
                        </div>
                    </div>
                );

            case 3: // Amount
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('liabilities.wizard.amounts') || 'Amounts'}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                                    {t('invoice.currency') || 'Currency'}
                                </label>
                                <select
                                    value={wizardState.currency}
                                    onChange={(e) => updateState({ currency: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl"
                                >
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                    <option value="CHF">CHF</option>
                                    <option value="GBP">GBP</option>
                                </select>
                            </div>
                            <Input
                                label={t('liabilities.originalAmount') || 'Original Principal'}
                                type="number"
                                value={wizardState.originalPrincipal || ''}
                                onChange={(e) => updateState({ originalPrincipal: Number(e.target.value) })}
                            />
                            <Input
                                label={t('liabilities.currentBalance') || 'Outstanding Principal'}
                                type="number"
                                value={wizardState.outstandingPrincipal || ''}
                                onChange={(e) => updateState({ outstandingPrincipal: Number(e.target.value) })}
                            />
                        </div>
                    </div>
                );

            case 4: // Terms
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('liabilities.wizard.terms') || 'Terms'}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t('liabilities.startDate') || 'Inception Date'}
                                type="date"
                                value={wizardState.inceptionDate}
                                onChange={(e) => updateState({ inceptionDate: e.target.value })}
                            />
                            <Input
                                label={t('liabilities.maturityDate') || 'Maturity Date'}
                                type="date"
                                value={wizardState.maturityDate}
                                onChange={(e) => updateState({ maturityDate: e.target.value })}
                            />
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={wizardState.isInterestBearing}
                                        onChange={(e) => updateState({ isInterestBearing: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-[var(--accent-primary)]"
                                    />
                                    <span className="font-medium text-gray-700 dark:text-surface-300">
                                        {t('liabilities.isInterestBearing') || 'Interest Bearing'}
                                    </span>
                                </label>
                            </div>
                            {wizardState.isInterestBearing && (
                                <Input
                                    label={t('liabilities.interestRate') || 'Interest Rate (%)'}
                                    type="number"
                                    step="0.1"
                                    value={wizardState.interestRate || ''}
                                    onChange={(e) => updateState({ interestRate: Number(e.target.value) })}
                                    placeholder="4.5"
                                />
                            )}
                        </div>
                    </div>
                );

            case 5: // Review
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('liabilities.wizard.review') || 'Review'}
                            </h2>
                            <p className="text-gray-500 dark:text-surface-400 mt-1">
                                {t('liabilities.wizard.reviewDesc') || 'Review your liability details before creating'}
                            </p>
                        </div>

                        <Card variant="glass" padding="lg">
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-surface-400">{t('liabilities.class.label') || 'Class'}</span>
                                    <Badge variant="info">{t(`liabilities.class.${wizardState.primaryClass}`) || wizardState.primaryClass}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-surface-400">{t('liabilities.name') || 'Name'}</span>
                                    <span className="font-medium text-gray-900 dark:text-surface-100">{wizardState.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-surface-400">{t('liabilities.counterpartyName') || 'Counterparty'}</span>
                                    <span className="font-medium text-gray-900 dark:text-surface-100">{wizardState.counterpartyName}</span>
                                </div>

                                <div className="border-t border-gray-200 dark:border-surface-700 pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-surface-400">{t('liabilities.originalAmount') || 'Original Principal'}</span>
                                        <span className="font-medium text-gray-900 dark:text-surface-100">
                                            {formatCurrency(wizardState.originalPrincipal, wizardState.currency)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <span className="text-gray-500 dark:text-surface-400">{t('liabilities.currentBalance') || 'Outstanding'}</span>
                                        <span className="font-semibold text-[var(--accent-primary)]">
                                            {formatCurrency(wizardState.outstandingPrincipal || wizardState.originalPrincipal, wizardState.currency)}
                                        </span>
                                    </div>
                                </div>

                                {wizardState.interestRate > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-surface-400">{t('liabilities.interestRate') || 'Interest Rate'}</span>
                                        <span className="font-medium text-gray-900 dark:text-surface-100">{wizardState.interestRate}%</span>
                                    </div>
                                )}

                                {wizardState.maturityDate && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-surface-400">{t('liabilities.maturityDate') || 'Maturity'}</span>
                                        <span className="font-medium text-gray-900 dark:text-surface-100">{wizardState.maturityDate}</span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-surface-800 border-b border-gray-200 dark:border-surface-700 px-4 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-700">
                        <X size={20} className="text-gray-500" />
                    </button>
                    <h1 className="font-semibold text-gray-900 dark:text-surface-100">
                        {t('liabilities.wizard.title') || 'Add Liability'}
                    </h1>
                    <div className="w-10" />
                </div>
            </div>

            {/* Steps */}
            <div className="bg-white dark:bg-surface-800 border-b border-gray-200 dark:border-surface-700 px-4 py-3 overflow-x-auto">
                <div className="max-w-4xl mx-auto flex gap-2">
                    {steps.map((step) => {
                        const Icon = step.icon;
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;
                        return (
                            <button
                                key={step.id}
                                onClick={() => step.id < currentStep && updateState({ step: step.id })}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                                    isActive ? 'bg-[var(--accent-primary)] text-white' : isCompleted ? 'bg-green-100 dark:bg-green-900/20 text-green-700' : 'bg-gray-100 dark:bg-surface-700 text-gray-400'
                                }`}
                                disabled={step.id > currentStep}
                            >
                                {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                                <span className="hidden sm:inline">{step.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <AnimatePresence mode="wait">
                    <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        {renderStepContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-surface-800 border-t border-gray-200 dark:border-surface-700 px-4 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Button variant="secondary" leftIcon={<ChevronLeft size={18} />} onClick={goBack} disabled={currentStep === 1}>
                        {t('common.back')}
                    </Button>
                    <div className="flex gap-3">
                        {currentStep === 5 ? (
                            <Button variant="primary" leftIcon={<Check size={18} />} onClick={handleCreate}>
                                {t('liabilities.save') || 'Create Liability'}
                            </Button>
                        ) : (
                            <Button variant="primary" rightIcon={<ChevronRight size={18} />} onClick={goNext} disabled={currentStep === 1 && !wizardState.primaryClass}>
                                {t('common.next')}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// LIABILITY DETAIL MODAL
// =============================================================================

interface LiabilityDetailModalProps {
    liability: Liability;
    onClose: () => void;
    onUpdate: () => void;
}

function LiabilityDetailModal({ liability, onClose, onUpdate }: LiabilityDetailModalProps) {
    const { t, language } = useThemeStore();
    const { updateLiability } = useLiabilitiesStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editData, setEditData] = useState({
        name: liability.name,
        outstandingPrincipal: liability.outstandingPrincipal,
        interestRate: liability.interestRate || 0,
        maturityDate: liability.maturityDate || '',
        notes: liability.notes || '',
    });

    const Icon = primaryClassIcons[liability.primaryClass as string] || HelpCircle;

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US');
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateLiability(liability.id, {
                name: editData.name,
                outstandingPrincipal: editData.outstandingPrincipal,
                interestRate: editData.interestRate,
                maturityDate: editData.maturityDate || undefined,
                notes: editData.notes,
            });
            toast.success(t('liabilities.updateSuccess') || 'Liability updated successfully');
            setIsEditing(false);
            onUpdate();
        } catch {
            toast.error(t('liabilities.updateFailed') || 'Failed to update liability');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-surface-700">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-${primaryClassColors[liability.primaryClass as string] || 'gray'}-500/10 flex items-center justify-center`}>
                            <Icon size={24} className={`text-${primaryClassColors[liability.primaryClass as string] || 'gray'}-500`} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editData.name}
                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                        className="bg-transparent border-b border-gray-300 dark:border-surface-600 focus:outline-none focus:border-[var(--accent-primary)]"
                                    />
                                ) : (
                                    liability.name
                                )}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {liability.counterpartyName}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                                Edit
                            </Button>
                        ) : (
                            <>
                                <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving}>
                                    Cancel
                                </Button>
                                <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? 'Saving...' : 'Save'}
                                </Button>
                            </>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Status & Risk */}
                    <div className="flex items-center gap-3">
                        <Badge variant={liability.status === 'active' ? 'success' : liability.status === 'defaulted' ? 'danger' : 'neutral'}>
                            {t(`liabilities.status.${liability.status}`) || liability.status}
                        </Badge>
                        <Badge variant={liability.riskLevel === 'low' ? 'success' : liability.riskLevel === 'high' ? 'danger' : 'warning'}>
                            {t(`liabilities.risk.${liability.riskLevel}`) || liability.riskLevel} risk
                        </Badge>
                        {liability.isInDefault && <Badge variant="danger">In Default</Badge>}
                        {liability.isDisputed && <Badge variant="warning">Disputed</Badge>}
                    </div>

                    {/* Amounts */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card variant="glass" padding="md">
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('liabilities.originalAmount') || 'Original Principal'}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100 mt-1">
                                {formatCurrency(liability.originalPrincipal, liability.currency)}
                            </p>
                        </Card>
                        <Card variant="glass" padding="md">
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('liabilities.currentBalance') || 'Outstanding'}</p>
                            {isEditing ? (
                                <input
                                    type="number"
                                    value={editData.outstandingPrincipal}
                                    onChange={(e) => setEditData({ ...editData, outstandingPrincipal: Number(e.target.value) })}
                                    className="text-xl font-bold text-[var(--accent-primary)] mt-1 bg-transparent border-b border-gray-300 dark:border-surface-600 w-full focus:outline-none"
                                />
                            ) : (
                                <p className="text-xl font-bold text-[var(--accent-primary)] mt-1">
                                    {formatCurrency(liability.outstandingPrincipal, liability.currency)}
                                </p>
                            )}
                        </Card>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-gray-900 dark:text-white">{t('liabilities.details') || 'Details'}</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500 dark:text-surface-400">{t('liabilities.class.label') || 'Class'}</span>
                                <p className="font-medium text-gray-900 dark:text-surface-100 mt-0.5">
                                    {t(`liabilities.class.${liability.primaryClass}`) || liability.primaryClass}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-surface-400">{t('liabilities.counterpartyType') || 'Counterparty Type'}</span>
                                <p className="font-medium text-gray-900 dark:text-surface-100 mt-0.5 capitalize">
                                    {liability.counterpartyType}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-surface-400">{t('liabilities.startDate') || 'Inception Date'}</span>
                                <p className="font-medium text-gray-900 dark:text-surface-100 mt-0.5">
                                    {formatDate(liability.inceptionDate)}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-surface-400">{t('liabilities.maturityDate') || 'Maturity Date'}</span>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        value={editData.maturityDate}
                                        onChange={(e) => setEditData({ ...editData, maturityDate: e.target.value })}
                                        className="block font-medium text-gray-900 dark:text-surface-100 mt-0.5 bg-transparent border-b border-gray-300 dark:border-surface-600 focus:outline-none"
                                    />
                                ) : (
                                    <p className="font-medium text-gray-900 dark:text-surface-100 mt-0.5">
                                        {liability.maturityDate ? formatDate(liability.maturityDate) : '-'}
                                    </p>
                                )}
                            </div>
                            {liability.isInterestBearing && (
                                <div>
                                    <span className="text-gray-500 dark:text-surface-400">{t('liabilities.interestRate') || 'Interest Rate'}</span>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={editData.interestRate}
                                            onChange={(e) => setEditData({ ...editData, interestRate: Number(e.target.value) })}
                                            className="block font-medium text-gray-900 dark:text-surface-100 mt-0.5 bg-transparent border-b border-gray-300 dark:border-surface-600 focus:outline-none w-20"
                                        />
                                    ) : (
                                        <p className="font-medium text-gray-900 dark:text-surface-100 mt-0.5">
                                            {liability.interestRate}%
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">{t('common.notes') || 'Notes'}</h3>
                        {isEditing ? (
                            <textarea
                                value={editData.notes}
                                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-surface-900/50 border border-gray-200 dark:border-surface-700 rounded-lg text-gray-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                                placeholder="Add notes..."
                            />
                        ) : (
                            <p className="text-gray-600 dark:text-surface-400 bg-gray-50 dark:bg-surface-900/50 p-3 rounded-lg">
                                {liability.notes || 'No notes'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-surface-700">
                    <Button variant="secondary" onClick={onClose}>
                        {t('common.close') || 'Close'}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function LiabilitiesPage() {
    const [showWizard, setShowWizard] = useState(false);
    const [selectedLiability, setSelectedLiability] = useState<Liability | null>(null);
    const { fetchLiabilities } = useLiabilitiesStore();

    const handleCreateNew = () => {
        setShowWizard(true);
    };

    const handleLiabilityUpdate = () => {
        fetchLiabilities();
    };

    if (showWizard) {
        return <LiabilitiesWizard onClose={() => setShowWizard(false)} onComplete={() => setShowWizard(false)} />;
    }

    return (
        <>
            <LiabilitiesList
                onCreateNew={handleCreateNew}
                onSelectLiability={setSelectedLiability}
            />
            <AnimatePresence>
                {selectedLiability && (
                    <LiabilityDetailModal
                        liability={selectedLiability}
                        onClose={() => setSelectedLiability(null)}
                        onUpdate={handleLiabilityUpdate}
                    />
                )}
            </AnimatePresence>
        </>
    );
}