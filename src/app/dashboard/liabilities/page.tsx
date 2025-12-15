'use client';

import React, { useState, useMemo } from 'react';
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
    TrendingUp,
    TrendingDown,
    Calendar,
    Percent,
    X,
    Check,
    Eye,
    Edit,
    Trash2,
    DollarSign,
    Clock,
    PiggyBank,
    BarChart3,
} from 'lucide-react';
import { Card, Button, Badge, Input } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useLiabilitiesStore } from '@/store/liabilities-store';
import type { Liability, LiabilityType, LiabilityAlert } from '@/types/liabilities';

// =============================================================================
// TYPE ICONS & COLORS
// =============================================================================

const typeIcons: Record<LiabilityType, React.ElementType> = {
    loan: Landmark,
    credit_line: CreditCard,
    overdraft: TrendingDown,
    supplier_credit: Truck,
    deferred_payment: FileText,
    lease: Car,
    guarantee: Shield,
    other: HelpCircle,
};

const typeColors: Record<LiabilityType, string> = {
    loan: 'blue',
    credit_line: 'purple',
    overdraft: 'red',
    supplier_credit: 'amber',
    deferred_payment: 'gray',
    lease: 'cyan',
    guarantee: 'rose',
    other: 'gray',
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
    const { liabilities, getSummary, getActiveAlerts, getUpcomingPayments } = useLiabilitiesStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<LiabilityType | 'all'>('all');

    const summary = getSummary();
    const activeAlerts = getActiveAlerts();
    const upcomingPayments = getUpcomingPayments(30);

    const filteredLiabilities = useMemo(() => {
        return liabilities.filter((lib) => {
            if (lib.status !== 'active') return false;
            const matchesSearch =
                lib.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lib.counterparty.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = typeFilter === 'all' || lib.type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [liabilities, searchQuery, typeFilter]);

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US');
    };

    const getRiskBadge = (level: Liability['riskLevel']) => {
        const config = {
            low: { variant: 'success' as const, label: t('liabilities.risk.low') },
            medium: { variant: 'warning' as const, label: t('liabilities.risk.medium') },
            high: { variant: 'danger' as const, label: t('liabilities.risk.high') },
        };
        return <Badge variant={config[level].variant} size="sm">{config[level].label}</Badge>;
    };

    const liabilityTypes: Array<{ value: LiabilityType | 'all'; label: string }> = [
        { value: 'all', label: t('common.all') },
        { value: 'loan', label: t('liabilities.type.loan') },
        { value: 'credit_line', label: t('liabilities.type.credit_line') },
        { value: 'supplier_credit', label: t('liabilities.type.supplier_credit') },
        { value: 'lease', label: t('liabilities.type.lease') },
        { value: 'guarantee', label: t('liabilities.type.guarantee') },
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
            {activeAlerts.length > 0 && (
                <Card variant="glass" padding="md" className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-amber-500 flex-shrink-0" size={20} />
                        <div>
                            <p className="font-medium text-amber-700 dark:text-amber-300">
                                {activeAlerts.length} {t('liabilities.activeAlerts')}
                            </p>
                            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                {activeAlerts[0].message}
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
                                {formatCurrency(summary.totalLiabilities, 'EUR')}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <CreditCard size={20} className="text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('liabilities.availableCredit')}</p>
                            <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(summary.availableCredit, 'EUR')}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <Percent size={20} className="text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('liabilities.utilization')}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">
                                {summary.utilizationPercent.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Calendar size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('liabilities.next30Days')}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">
                                {formatCurrency(summary.upcomingPayments30Days, 'EUR')}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Credit Utilization Bar */}
            <Card variant="glass" padding="md">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-surface-300">{t('liabilities.creditUtilization')}</span>
                    <span className="text-sm text-gray-500 dark:text-surface-400">
            {formatCurrency(summary.totalCreditLimit - summary.availableCredit, 'EUR')} / {formatCurrency(summary.totalCreditLimit, 'EUR')}
          </span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${
                            summary.utilizationPercent >= 90 ? 'bg-red-500' : summary.utilizationPercent >= 80 ? 'bg-amber-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(summary.utilizationPercent, 100)}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-surface-400">
                    <span>0%</span>
                    <span className="text-amber-500">80%</span>
                    <span className="text-red-500">90%</span>
                    <span>100%</span>
                </div>
            </Card>

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
                    {liabilityTypes.map((type) => (
                        <button
                            key={type.value}
                            onClick={() => setTypeFilter(type.value)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                typeFilter === type.value
                                    ? 'bg-[var(--accent-primary)] text-white'
                                    : 'bg-gray-100 dark:bg-surface-800/50 text-gray-600 dark:text-surface-400 hover:bg-gray-200 dark:hover:bg-surface-700/50'
                            }`}
                        >
                            {type.label}
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
                        const Icon = typeIcons[liability.type];
                        const hasAlerts = liability.alerts.some((a) => !a.isRead);

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
                                    className={`cursor-pointer ${hasAlerts ? 'border-l-4 border-amber-500' : ''}`}
                                    onClick={() => onSelectLiability(liability)}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl bg-${typeColors[liability.type]}-500/10 flex items-center justify-center flex-shrink-0`}>
                                                <Icon size={20} className={`text-${typeColors[liability.type]}-500`} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-surface-100 truncate">
                            {liability.name}
                          </span>
                                                    <Badge variant="neutral" size="sm">{t(`liabilities.type.${liability.type}`)}</Badge>
                                                    {hasAlerts && <AlertCircle size={16} className="text-amber-500" />}
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-surface-400 truncate">
                                                    {liability.counterparty.name}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            {/* Credit limit bar for applicable types */}
                                            {liability.creditLimit && (
                                                <div className="hidden md:block w-32">
                                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                        <span>{liability.creditLimit.utilizationPercent.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${
                                                                liability.creditLimit.utilizationPercent >= 90 ? 'bg-red-500' : liability.creditLimit.utilizationPercent >= 80 ? 'bg-amber-500' : 'bg-green-500'
                                                            }`}
                                                            style={{ width: `${liability.creditLimit.utilizationPercent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900 dark:text-surface-100">
                                                    {formatCurrency(liability.currentBalance, liability.currency)}
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
                    <h3 className="font-medium text-gray-700 dark:text-surface-300 mb-4">{t('liabilities.byCounterparty')}</h3>
                    <div className="space-y-3">
                        {Object.entries(summary.byCounterpartyType).map(([type, amount]) => (
                            <div key={type} className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-surface-400">{t(`liabilities.counterparty.${type}`)}</span>
                                <span className="font-medium text-gray-900 dark:text-surface-100">{formatCurrency(amount, 'EUR')}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <h3 className="font-medium text-gray-700 dark:text-surface-300 mb-4">{t('liabilities.byCurrency')}</h3>
                    <div className="space-y-3">
                        {Object.entries(summary.byCurrency).map(([currency, amount]) => (
                            <div key={currency} className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-surface-400">{currency}</span>
                                <span className="font-medium text-gray-900 dark:text-surface-100">{formatCurrency(amount, currency)}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}

// =============================================================================
// LIABILITIES WIZARD
// =============================================================================

function LiabilitiesWizard({
                               onClose,
                               onComplete,
                           }: {
    onClose: () => void;
    onComplete: (liability: Liability) => void;
}) {
    const { t, language } = useThemeStore();
    const { wizardState, updateWizardState, setWizardStep, createLiability, resetWizard } = useLiabilitiesStore();

    const steps = [
        { id: 1, label: t('liabilities.wizard.type'), icon: HelpCircle },
        { id: 2, label: t('liabilities.wizard.counterparty'), icon: Building2 },
        { id: 3, label: t('liabilities.wizard.amount'), icon: DollarSign },
        { id: 4, label: t('liabilities.wizard.terms'), icon: Percent },
        { id: 5, label: t('liabilities.wizard.timing'), icon: Calendar },
        { id: 6, label: t('liabilities.wizard.review'), icon: Check },
    ];

    const currentStep = wizardState.step;

    const goNext = () => currentStep < 6 && setWizardStep(currentStep + 1);
    const goBack = () => currentStep > 1 && setWizardStep(currentStep - 1);

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency }).format(amount);
    };

    const liabilityTypeOptions: Array<{ value: LiabilityType; label: string; description: string; icon: React.ElementType }> = [
        { value: 'loan', label: t('liabilities.type.loan'), description: t('liabilities.typeDesc.loan'), icon: Landmark },
        { value: 'credit_line', label: t('liabilities.type.credit_line'), description: t('liabilities.typeDesc.credit_line'), icon: CreditCard },
        { value: 'overdraft', label: t('liabilities.type.overdraft'), description: t('liabilities.typeDesc.overdraft'), icon: TrendingDown },
        { value: 'supplier_credit', label: t('liabilities.type.supplier_credit'), description: t('liabilities.typeDesc.supplier_credit'), icon: Truck },
        { value: 'lease', label: t('liabilities.type.lease'), description: t('liabilities.typeDesc.lease'), icon: Car },
        { value: 'guarantee', label: t('liabilities.type.guarantee'), description: t('liabilities.typeDesc.guarantee'), icon: Shield },
    ];

    const handleCreate = () => {
        const hasCreditLimit = ['credit_line', 'overdraft', 'supplier_credit'].includes(wizardState.type || '');

        const liability = createLiability({
            type: wizardState.type!,
            status: 'active',
            name: wizardState.name,
            counterparty: wizardState.counterparty as any,
            originalAmount: wizardState.originalAmount,
            currentBalance: wizardState.currentBalance || wizardState.originalAmount,
            currency: wizardState.currency,
            creditLimit: hasCreditLimit ? {
                totalLimit: wizardState.creditLimit.totalLimit || wizardState.originalAmount,
                usedAmount: wizardState.currentBalance || 0,
                availableAmount: (wizardState.creditLimit.totalLimit || wizardState.originalAmount) - (wizardState.currentBalance || 0),
                currency: wizardState.currency,
                utilizationPercent: ((wizardState.currentBalance || 0) / (wizardState.creditLimit.totalLimit || wizardState.originalAmount || 1)) * 100,
                expiryDate: wizardState.creditLimit.expiryDate,
            } : undefined,
            interestTerms: wizardState.interestTerms as any,
            repaymentTerms: wizardState.repaymentTerms as any,
            startDate: wizardState.startDate,
            maturityType: wizardState.maturityType,
            maturityDate: wizardState.maturityDate || undefined,
            collateral: wizardState.hasCollateral ? wizardState.collateral as any : undefined,
            riskLevel: 'low',
            notes: wizardState.notes,
        });

        resetWizard();
        onComplete(liability);
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1: // Type
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('liabilities.wizard.selectType')}
                            </h2>
                            <p className="text-gray-500 dark:text-surface-400 mt-1">{t('liabilities.wizard.selectTypeDesc')}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {liabilityTypeOptions.map((option) => {
                                const Icon = option.icon;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => updateWizardState({ type: option.value })}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                                            wizardState.type === option.value
                                                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                                : 'border-gray-200 dark:border-surface-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <Icon size={24} className={wizardState.type === option.value ? 'text-[var(--accent-primary)]' : 'text-gray-400'} />
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
                                {t('liabilities.wizard.whoIs')}
                            </h2>
                            <p className="text-gray-500 dark:text-surface-400 mt-1">{t('liabilities.wizard.whoIsDesc')}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
                                    {t('liabilities.counterpartyType')}
                                </label>
                                <div className="flex gap-3">
                                    {(['bank', 'supplier', 'leasing', 'other'] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => updateWizardState({ counterparty: { ...wizardState.counterparty, type } })}
                                            className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                                                wizardState.counterparty.type === type
                                                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 text-[var(--accent-primary)]'
                                                    : 'border-gray-200 dark:border-surface-700 text-gray-600 dark:text-surface-400'
                                            }`}
                                        >
                                            {t(`liabilities.counterparty.${type}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Input
                                label={t('liabilities.counterpartyName')}
                                value={wizardState.counterparty.name || ''}
                                onChange={(e) => updateWizardState({ counterparty: { ...wizardState.counterparty, name: e.target.value } })}
                                placeholder="Deutsche Bank"
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                                    {t('liabilities.country')}
                                </label>
                                <select
                                    value={wizardState.counterparty.country || 'DE'}
                                    onChange={(e) => updateWizardState({ counterparty: { ...wizardState.counterparty, country: e.target.value } })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl"
                                >
                                    <option value="DE">Deutschland</option>
                                    <option value="AT">Österreich</option>
                                    <option value="CH">Schweiz</option>
                                    <option value="FR">Frankreich</option>
                                    <option value="NL">Niederlande</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );

            case 3: // Amount
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('liabilities.wizard.amounts')}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t('liabilities.name')}
                                value={wizardState.name}
                                onChange={(e) => updateWizardState({ name: e.target.value })}
                                placeholder={t('liabilities.namePlaceholder')}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                                    {t('invoice.currency')}
                                </label>
                                <select
                                    value={wizardState.currency}
                                    onChange={(e) => updateWizardState({ currency: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl"
                                >
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                    <option value="CHF">CHF</option>
                                    <option value="GBP">GBP</option>
                                </select>
                            </div>
                            <Input
                                label={['credit_line', 'overdraft', 'supplier_credit'].includes(wizardState.type || '')
                                    ? t('liabilities.creditLimit')
                                    : t('liabilities.originalAmount')}
                                type="number"
                                value={wizardState.originalAmount || ''}
                                onChange={(e) => updateWizardState({ originalAmount: Number(e.target.value) })}
                            />
                            <Input
                                label={['credit_line', 'overdraft', 'supplier_credit'].includes(wizardState.type || '')
                                    ? t('liabilities.currentlyUsed')
                                    : t('liabilities.currentBalance')}
                                type="number"
                                value={wizardState.currentBalance || ''}
                                onChange={(e) => updateWizardState({ currentBalance: Number(e.target.value) })}
                            />
                        </div>

                        {['credit_line', 'overdraft', 'supplier_credit'].includes(wizardState.type || '') && wizardState.originalAmount > 0 && (
                            <Card variant="glass" padding="md" className="bg-green-50 dark:bg-green-900/20">
                                <div className="flex items-center justify-between">
                                    <span className="text-green-700 dark:text-green-300">{t('liabilities.available')}</span>
                                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(wizardState.originalAmount - (wizardState.currentBalance || 0), wizardState.currency)}
                  </span>
                                </div>
                            </Card>
                        )}
                    </div>
                );

            case 4: // Terms
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('liabilities.wizard.terms')}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                                    {t('liabilities.interestType')}
                                </label>
                                <select
                                    value={wizardState.interestTerms.type || 'unknown'}
                                    onChange={(e) => updateWizardState({ interestTerms: { ...wizardState.interestTerms, type: e.target.value as any } })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl"
                                >
                                    <option value="fixed">{t('liabilities.interest.fixed')}</option>
                                    <option value="variable">{t('liabilities.interest.variable')}</option>
                                    <option value="none">{t('liabilities.interest.none')}</option>
                                    <option value="unknown">{t('liabilities.interest.unknown')}</option>
                                </select>
                            </div>

                            {(wizardState.interestTerms.type === 'fixed' || wizardState.interestTerms.type === 'variable') && (
                                <Input
                                    label={t('liabilities.interestRate')}
                                    type="number"
                                    step="0.1"
                                    value={wizardState.interestTerms.rate || ''}
                                    onChange={(e) => updateWizardState({ interestTerms: { ...wizardState.interestTerms, rate: Number(e.target.value) } })}
                                    placeholder="4.5"
                                />
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                                    {t('liabilities.repaymentSchedule')}
                                </label>
                                <select
                                    value={wizardState.repaymentTerms.schedule || 'monthly'}
                                    onChange={(e) => updateWizardState({ repaymentTerms: { ...wizardState.repaymentTerms, schedule: e.target.value as any } })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl"
                                >
                                    <option value="monthly">{t('liabilities.schedule.monthly')}</option>
                                    <option value="quarterly">{t('liabilities.schedule.quarterly')}</option>
                                    <option value="annually">{t('liabilities.schedule.annually')}</option>
                                    <option value="on_demand">{t('liabilities.schedule.on_demand')}</option>
                                    <option value="at_maturity">{t('liabilities.schedule.at_maturity')}</option>
                                </select>
                            </div>

                            {wizardState.repaymentTerms.schedule !== 'on_demand' && wizardState.repaymentTerms.schedule !== 'at_maturity' && (
                                <Input
                                    label={t('liabilities.repaymentAmount')}
                                    type="number"
                                    value={wizardState.repaymentTerms.amount || ''}
                                    onChange={(e) => updateWizardState({ repaymentTerms: { ...wizardState.repaymentTerms, amount: Number(e.target.value) } })}
                                />
                            )}
                        </div>
                    </div>
                );

            case 5: // Timing
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('liabilities.wizard.timing')}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t('liabilities.startDate')}
                                type="date"
                                value={wizardState.startDate}
                                onChange={(e) => updateWizardState({ startDate: e.target.value })}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                                    {t('liabilities.maturityType')}
                                </label>
                                <select
                                    value={wizardState.maturityType}
                                    onChange={(e) => updateWizardState({ maturityType: e.target.value as any })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl"
                                >
                                    <option value="fixed">{t('liabilities.maturity.fixed')}</option>
                                    <option value="rolling">{t('liabilities.maturity.rolling')}</option>
                                    <option value="on_demand">{t('liabilities.maturity.on_demand')}</option>
                                    <option value="ongoing">{t('liabilities.maturity.ongoing')}</option>
                                </select>
                            </div>
                            {wizardState.maturityType === 'fixed' && (
                                <Input
                                    label={t('liabilities.maturityDate')}
                                    type="date"
                                    value={wizardState.maturityDate}
                                    onChange={(e) => updateWizardState({ maturityDate: e.target.value })}
                                />
                            )}
                        </div>

                        {/* Collateral */}
                        <div className="border-t border-gray-200 dark:border-surface-700 pt-6">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={wizardState.hasCollateral}
                                    onChange={(e) => updateWizardState({ hasCollateral: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-[var(--accent-primary)]"
                                />
                                <span className="font-medium text-gray-700 dark:text-surface-300">{t('liabilities.hasCollateral')}</span>
                            </label>

                            {wizardState.hasCollateral && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                                            {t('liabilities.collateralType')}
                                        </label>
                                        <select
                                            value={wizardState.collateral.type || 'property'}
                                            onChange={(e) => updateWizardState({ collateral: { ...wizardState.collateral, isSecured: true, type: e.target.value as any } })}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl"
                                        >
                                            <option value="cash">{t('liabilities.collateral.cash')}</option>
                                            <option value="property">{t('liabilities.collateral.property')}</option>
                                            <option value="equipment">{t('liabilities.collateral.equipment')}</option>
                                            <option value="guarantee">{t('liabilities.collateral.guarantee')}</option>
                                        </select>
                                    </div>
                                    <Input
                                        label={t('liabilities.collateralValue')}
                                        type="number"
                                        value={wizardState.collateral.value || ''}
                                        onChange={(e) => updateWizardState({ collateral: { ...wizardState.collateral, value: Number(e.target.value) } })}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 6: // Review
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('liabilities.wizard.review')}
                            </h2>
                            <p className="text-gray-500 dark:text-surface-400 mt-1">{t('liabilities.wizard.reviewDesc')}</p>
                        </div>

                        <Card variant="glass" padding="lg">
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-surface-400">{t('liabilities.type.label')}</span>
                                    <Badge variant="info">{t(`liabilities.type.${wizardState.type}`)}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-surface-400">{t('liabilities.name')}</span>
                                    <span className="font-medium text-gray-900 dark:text-surface-100">{wizardState.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-surface-400">{t('liabilities.counterpartyName')}</span>
                                    <span className="font-medium text-gray-900 dark:text-surface-100">{wizardState.counterparty.name}</span>
                                </div>

                                <div className="border-t border-gray-200 dark:border-surface-700 pt-4">
                                    <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-surface-400">
                      {['credit_line', 'overdraft', 'supplier_credit'].includes(wizardState.type || '')
                          ? t('liabilities.creditLimit')
                          : t('liabilities.originalAmount')}
                    </span>
                                        <span className="font-medium text-gray-900 dark:text-surface-100">
                      {formatCurrency(wizardState.originalAmount, wizardState.currency)}
                    </span>
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <span className="text-gray-500 dark:text-surface-400">{t('liabilities.currentBalance')}</span>
                                        <span className="font-semibold text-[var(--accent-primary)]">
                      {formatCurrency(wizardState.currentBalance || 0, wizardState.currency)}
                    </span>
                                    </div>
                                </div>

                                {wizardState.interestTerms.rate && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-surface-400">{t('liabilities.interestRate')}</span>
                                        <span className="font-medium text-gray-900 dark:text-surface-100">{wizardState.interestTerms.rate}%</span>
                                    </div>
                                )}

                                {wizardState.maturityDate && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-surface-400">{t('liabilities.maturityDate')}</span>
                                        <span className="font-medium text-gray-900 dark:text-surface-100">{wizardState.maturityDate}</span>
                                    </div>
                                )}
                            </div>
                        </Card>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                💡 {t('liabilities.wizard.tip')}
                            </p>
                        </div>
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
                    <h1 className="font-semibold text-gray-900 dark:text-surface-100">{t('liabilities.wizard.title')}</h1>
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
                                onClick={() => step.id < currentStep && setWizardStep(step.id)}
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
                        {currentStep === 6 ? (
                            <Button variant="primary" leftIcon={<Check size={18} />} onClick={handleCreate}>
                                {t('liabilities.save')}
                            </Button>
                        ) : (
                            <Button variant="primary" rightIcon={<ChevronRight size={18} />} onClick={goNext} disabled={currentStep === 1 && !wizardState.type}>
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
// MAIN PAGE
// =============================================================================

export default function LiabilitiesPage() {
    const [showWizard, setShowWizard] = useState(false);
    const [selectedLiability, setSelectedLiability] = useState<Liability | null>(null);
    const { resetWizard } = useLiabilitiesStore();

    const handleCreateNew = () => {
        resetWizard();
        setShowWizard(true);
    };

    if (showWizard) {
        return <LiabilitiesWizard onClose={() => setShowWizard(false)} onComplete={() => setShowWizard(false)} />;
    }

    return (
        <LiabilitiesList
            onCreateNew={handleCreateNew}
            onSelectLiability={setSelectedLiability}
        />
    );
}