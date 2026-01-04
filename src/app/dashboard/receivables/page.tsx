'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    DollarSign,
    Clock,
    AlertTriangle,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    ChevronRight,
    ChevronLeft,
    X,
    Check,
    FileText,
    Users,
    Calendar,
    CreditCard,
    Shield,
    Ban,
    RefreshCw,
    Send,
    Phone,
    Mail,
    BarChart3,
    PieChart,
    Eye,
    Filter,
    Download,
    Loader2,
} from 'lucide-react';
import { Card, Button, Badge, Input } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useReceivablesStore } from '@/store/receivables-store';
import toast from 'react-hot-toast';
import type { Receivable, ReceivableStatus, RiskLevel, AgingBucket } from '@/types/receivables';

// =============================================================================
// CONSTANTS
// =============================================================================

const statusConfig: Record<ReceivableStatus, { color: string; icon: React.ElementType }> = {
    open: { color: 'blue', icon: FileText },
    due: { color: 'amber', icon: Clock },
    overdue: { color: 'red', icon: AlertTriangle },
    partially_paid: { color: 'purple', icon: CreditCard },
    paid: { color: 'green', icon: Check },
    disputed: { color: 'rose', icon: Shield },
    in_collection: { color: 'orange', icon: Phone },
    written_off: { color: 'gray', icon: Ban },
    settled_via_offset: { color: 'cyan', icon: RefreshCw },
};

const riskColors: Record<RiskLevel, string> = {
    low: 'green',
    medium: 'amber',
    high: 'orange',
    critical: 'red',
};

// =============================================================================
// RECEIVABLES LIST
// =============================================================================

function ReceivablesList({
                             onCreateNew,
                             onSelectReceivable,
                         }: {
    onCreateNew: () => void;
    onSelectReceivable: (receivable: Receivable) => void;
}) {
    const { t, language } = useThemeStore();
    const {
        getFilteredReceivables,
        getSummary,
        getAgingReport,
        getDebtorExposure,
        debtors,
        filter,
        setFilter,
        resetFilter,
        fetchReceivables,
        receivables,
        isInitialized,
        isLoading
    } = useReceivablesStore();
    useEffect(() => {
  if (!isInitialized) {
    fetchReceivables();
  }
}, [fetchReceivables, isInitialized]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<ReceivableStatus | 'all'>('all');
    const [showAgingReport, setShowAgingReport] = useState(false);

    const summary = getSummary();
    const agingReport = getAgingReport();
    const debtorExposure = getDebtorExposure();

    

    const filteredReceivables = useMemo(() => {
        let receivables = getFilteredReceivables();

        if (searchQuery) {
            const search = searchQuery.toLowerCase();
            receivables = receivables.filter((r) =>
                r.reference?.toLowerCase().includes(search) ||
                r.originReferenceId?.toLowerCase().includes(search) ||
                r.debtor?.name.toLowerCase().includes(search)
            );
        }

        if (statusFilter !== 'all') {
            receivables = receivables.filter((r) => r.status === statusFilter);
        }

        return receivables.sort((a, b) => {
            // Sort by risk (critical first), then by amount
            const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
                return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
            }
            return b.outstandingAmount - a.outstandingAmount;
        });
    }, [getFilteredReceivables, searchQuery, statusFilter]);

    const formatCurrency = (amount: number, currency: string = 'EUR') => {
        return new Intl.NumberFormat(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US');
    };

    const getStatusBadge = (status: ReceivableStatus) => {
        const config = statusConfig[status];
        const Icon = config.icon;
        return (
            <Badge variant={status === 'paid' ? 'success' : status === 'overdue' || status === 'in_collection' ? 'danger' : status === 'disputed' ? 'warning' : 'neutral'} size="sm">
                <Icon size={12} className="mr-1" />
                {t(`receivables.status.${status}`)}
            </Badge>
        );
    };

    const getRiskBadge = (risk: RiskLevel) => {
        return (
            <Badge
                variant={risk === 'critical' || risk === 'high' ? 'danger' : risk === 'medium' ? 'warning' : 'success'}
                size="sm"
            >
                {t(`receivables.risk.${risk}`)}
            </Badge>
        );
    };

    const statusFilters: Array<{ value: ReceivableStatus | 'all'; label: string }> = [
        { value: 'all', label: t('common.all') },
        { value: 'open', label: t('receivables.status.open') },
        { value: 'due', label: t('receivables.status.due') },
        { value: 'overdue', label: t('receivables.status.overdue') },
        { value: 'partially_paid', label: t('receivables.status.partially_paid') },
        { value: 'disputed', label: t('receivables.status.disputed') },
    ];

    // Add this:
    if (isLoading || !isInitialized) {
    return (
        <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
    );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
                        {t('receivables.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-surface-500 mt-1">{t('receivables.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" leftIcon={<BarChart3 size={18} />} onClick={() => setShowAgingReport(!showAgingReport)}>
                        {t('receivables.agingReport')}
                    </Button>
                    <Button variant="primary" leftIcon={<Plus size={18} />} onClick={onCreateNew}>
                        {t('receivables.create')}
                    </Button>
                </div>
            </div>

            {/* Alerts */}
            {summary.totalOverdue > 0 && (
                <Card variant="glass" padding="md" className="border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
                        <div>
                            <p className="font-medium text-red-700 dark:text-red-300">
                                {formatCurrency(summary.totalOverdue)} {t('receivables.overdueAlert')}
                            </p>
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                {(summary.byStatus?.overdue?.count || 0) + (summary.byStatus?.in_collection?.count || 0)} {t('receivables.invoicesOverdue')}
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <DollarSign size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('receivables.totalOutstanding')}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">
                                {formatCurrency(summary.totalOutstanding)}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle size={20} className="text-red-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('receivables.overdue')}</p>
                            <p className="text-xl font-bold text-red-600">{formatCurrency(summary.totalOverdue)}</p>
                        </div>
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <Clock size={20} className="text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('receivables.dso')}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">{summary.dso} {t('receivables.days')}</p>
                        </div>
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <TrendingUp size={20} className="text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('receivables.collectionRate')}</p>
                            <p className="text-xl font-bold text-green-600">{summary.collectionRate}%</p>
                        </div>
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <Calendar size={20} className="text-purple-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('receivables.expected30d')}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">
                                {formatCurrency(summary.expectedCashIn30Days)}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Aging Report (collapsible) */}
            <AnimatePresence>
                {showAgingReport && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <Card variant="glass" padding="md">
                            <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">{t('receivables.agingReport')}</h3>
                            <div className="grid grid-cols-4 gap-4">
                                {(['0-30', '31-60', '61-90', '90+'] as AgingBucket[]).map((bucket) => {
                                    const data = summary.aging[bucket];
                                    const percentage = summary.totalOutstanding > 0
                                        ? (data.amount / summary.totalOutstanding) * 100
                                        : 0;
                                    return (
                                        <div key={bucket} className="text-center">
                                            <p className="text-sm text-gray-500 dark:text-surface-400 mb-2">{bucket} {t('receivables.days')}</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-surface-100">
                                                {formatCurrency(data.amount)}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-surface-400">{data.count} {t('receivables.items')}</p>
                                            <div className="w-full h-2 bg-gray-200 dark:bg-surface-700 rounded-full mt-2">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        bucket === '0-30' ? 'bg-green-500' :
                                                            bucket === '31-60' ? 'bg-amber-500' :
                                                                bucket === '61-90' ? 'bg-orange-500' : 'bg-red-500'
                                                    }`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('receivables.search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-gray-900 dark:text-surface-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                    {statusFilters.map((sf) => (
                        <button
                            key={sf.value}
                            onClick={() => setStatusFilter(sf.value)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                statusFilter === sf.value
                                    ? 'bg-[var(--accent-primary)] text-white'
                                    : 'bg-gray-100 dark:bg-surface-800/50 text-gray-600 dark:text-surface-400 hover:bg-gray-200'
                            }`}
                        >
                            {sf.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Receivables List */}
            {filteredReceivables.length === 0 ? (
                <Card variant="glass" padding="lg" className="text-center">
                    <DollarSign size={48} className="mx-auto text-gray-300 dark:text-surface-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-surface-100">{t('receivables.noItems')}</h3>
                    <p className="text-gray-500 dark:text-surface-400 mt-1">{t('receivables.noItemsDesc')}</p>
                    <Button variant="primary" className="mt-4" onClick={onCreateNew}>
                        {t('receivables.create')}
                    </Button>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredReceivables.map((receivable, index) => {
                        const StatusIcon = statusConfig[receivable.status].icon;
                        const isOverdue = receivable.status === 'overdue' || receivable.status === 'in_collection';

                        return (
                            <motion.div
                                key={receivable.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <Card
                                    variant="glass"
                                    padding="md"
                                    hover
                                    className={`cursor-pointer ${isOverdue ? 'border-l-4 border-red-500' : ''} ${receivable.isDisputed ? 'border-l-4 border-amber-500' : ''}`}
                                    onClick={() => onSelectReceivable(receivable)}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`w-12 h-12 rounded-xl bg-${statusConfig[receivable.status].color}-500/10 flex items-center justify-center flex-shrink-0`}>
                                                <StatusIcon size={24} className={`text-${statusConfig[receivable.status].color}-500`} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-surface-100 truncate">
                            {receivable.debtor?.name || 'Unknown'}
                          </span>
                                                    {receivable.originReferenceId && (
                                                        <span className="text-xs text-gray-400 dark:text-surface-500 font-mono">
                              {receivable.originReferenceId}
                            </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-surface-400 truncate">
                                                    {receivable.reference || t(`receivables.origin.${receivable.originType}`)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            {/* Days outstanding */}
                                            <div className="hidden md:block text-center">
                                                <p className="text-xs text-gray-500 dark:text-surface-400">{t('receivables.daysOut')}</p>
                                                <p className={`font-semibold ${receivable.daysOutstanding > 60 ? 'text-red-500' : receivable.daysOutstanding > 30 ? 'text-amber-500' : 'text-gray-900 dark:text-surface-100'}`}>
                                                    {receivable.daysOutstanding}
                                                </p>
                                            </div>

                                            {/* Due date */}
                                            <div className="hidden lg:block text-center">
                                                <p className="text-xs text-gray-500 dark:text-surface-400">{t('receivables.dueDate')}</p>
                                                <p className="font-medium text-gray-900 dark:text-surface-100">{formatDate(receivable.dueDate)}</p>
                                            </div>

                                            {/* Amount */}
                                            <div className="text-right min-w-[120px]">
                                                <p className="text-xl font-bold text-gray-900 dark:text-surface-100">
                                                    {formatCurrency(receivable.outstandingAmount, receivable.currency)}
                                                </p>
                                                {receivable.paidAmount > 0 && (
                                                    <p className="text-xs text-green-600">
                                                        {formatCurrency(receivable.paidAmount, receivable.currency)} {t('receivables.paid')}
                                                    </p>
                                                )}
                                            </div>

                                            {getStatusBadge(receivable.status)}
                                            {getRiskBadge(receivable.riskLevel)}
                                            <ChevronRight size={16} className="text-gray-400" />
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Debtor Exposure */}
            {debtorExposure.length > 0 && (
                <Card variant="glass" padding="md">
                    <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">{t('receivables.debtorExposure')}</h3>
                    <div className="space-y-3">
                        {debtorExposure.slice(0, 5).map((exposure) => (
                            <div key={exposure.debtor.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-surface-800/30 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center">
                                        <Users size={20} className="text-[var(--accent-primary)]" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-surface-100">{exposure.debtor.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-surface-400">
                                            {t(`receivables.paymentHistory.${exposure.debtor.paymentHistory}`)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900 dark:text-surface-100">{formatCurrency(exposure.totalOutstanding)}</p>
                                    {exposure.overdueAmount > 0 && (
                                        <p className="text-sm text-red-500">{formatCurrency(exposure.overdueAmount)} {t('receivables.overdue')}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}

// =============================================================================
// CREATE RECEIVABLE WIZARD
// =============================================================================

function CreateReceivableWizard({
                                    onClose,
                                    onComplete,
                                }: {
    onClose: () => void;
    onComplete: (receivable: Receivable) => void;
}) {
    const { t, language } = useThemeStore();
    const { createReceivable, debtors } = useReceivablesStore();

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        originType: 'invoice' as const,
        originReferenceId: '',
        debtorId: '',
        currency: 'EUR',
        originalAmount: 0,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        reference: '',
        description: '',
        autoRemindersEnabled: true,
    });

    const steps = [
        { id: 1, label: t('receivables.wizard.debtor'), icon: Users },
        { id: 2, label: t('receivables.wizard.amount'), icon: DollarSign },
        { id: 3, label: t('receivables.wizard.dates'), icon: Calendar },
        { id: 4, label: t('receivables.wizard.review'), icon: Check },
    ];

    const goNext = () => step < 4 && setStep(step + 1);
    const goBack = () => step > 1 && setStep(step - 1);

    const handleCreate = () => {
        const receivable = createReceivable({
            originType: formData.originType,
            originReferenceId: formData.originReferenceId || undefined,
            creditorEntityId: 'company-001',
            debtorId: formData.debtorId,
            currency: formData.currency,
            originalAmount: formData.originalAmount,
            issueDate: formData.issueDate,
            dueDate: formData.dueDate,
            reference: formData.reference || undefined,
            description: formData.description || undefined,
            autoRemindersEnabled: formData.autoRemindersEnabled,
            isDisputed: false,
        });
        onComplete(receivable);
    };

    const selectedDebtor = debtors.find((d) => d.id === formData.debtorId);

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency }).format(amount);
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('receivables.wizard.selectDebtor')}
                            </h2>
                            <p className="text-gray-500 dark:text-surface-400 mt-1">{t('receivables.wizard.selectDebtorDesc')}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
                                {t('receivables.origin.label')}
                            </label>
                            <div className="flex gap-3">
                                {(['invoice', 'order', 'contract', 'manual'] as const).map((type) => (
                                    <button
                                        key={type}
                                        className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                                            formData.originType === type
                                                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 text-[var(--accent-primary)]'
                                                : 'border-gray-200 dark:border-surface-700 text-gray-600 dark:text-surface-400'
                                        }`}
                                    >
                                        {t(`receivables.origin.${type}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Input
                            label={t('receivables.referenceNumber')}
                            value={formData.originReferenceId}
                            onChange={(e) => setFormData({ ...formData, originReferenceId: e.target.value })}
                            placeholder="INV-2024-001"
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
                                {t('receivables.debtor')}
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {debtors.map((debtor) => (
                                    <button
                                        key={debtor.id}
                                        onClick={() => setFormData({ ...formData, debtorId: debtor.id })}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                                            formData.debtorId === debtor.id
                                                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                                : 'border-gray-200 dark:border-surface-700'
                                        }`}
                                    >
                                        <p className="font-semibold text-gray-900 dark:text-surface-100">{debtor.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-surface-400">{debtor.country}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge
                                                variant={debtor.paymentHistory === 'excellent' || debtor.paymentHistory === 'good' ? 'success' : debtor.paymentHistory === 'fair' ? 'warning' : 'danger'}
                                                size="sm"
                                            >
                                                {t(`receivables.paymentHistory.${debtor.paymentHistory}`)}
                                            </Badge>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('receivables.wizard.enterAmount')}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t('receivables.amount')}
                                type="number"
                                value={formData.originalAmount || ''}
                                onChange={(e) => setFormData({ ...formData, originalAmount: Number(e.target.value) })}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                                    {t('invoice.currency')}
                                </label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl"
                                >
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                    <option value="CHF">CHF</option>
                                    <option value="GBP">GBP</option>
                                </select>
                            </div>
                        </div>
                        <Input
                            label={t('receivables.reference')}
                            value={formData.reference}
                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                            placeholder={t('receivables.referencePlaceholder')}
                        />
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('receivables.wizard.setDates')}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t('receivables.issueDate')}
                                type="date"
                                value={formData.issueDate}
                                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                            />
                            <Input
                                label={t('receivables.dueDate')}
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>

                        <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-surface-800/30 rounded-xl cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.autoRemindersEnabled}
                                onChange={(e) => setFormData({ ...formData, autoRemindersEnabled: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-[var(--accent-primary)]"
                            />
                            <div>
                                <p className="font-medium text-gray-700 dark:text-surface-300">{t('receivables.autoReminders')}</p>
                                <p className="text-sm text-gray-500 dark:text-surface-400">{t('receivables.autoRemindersDesc')}</p>
                            </div>
                        </label>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('receivables.wizard.review')}
                            </h2>
                        </div>
                        <Card variant="glass" padding="lg">
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-surface-400">{t('receivables.debtor')}</span>
                                    <span className="font-medium text-gray-900 dark:text-surface-100">{selectedDebtor?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-surface-400">{t('receivables.origin.label')}</span>
                                    <Badge variant="info">{t(`receivables.origin.${formData.originType}`)}</Badge>
                                </div>
                                {formData.originReferenceId && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-surface-400">{t('receivables.referenceNumber')}</span>
                                        <span className="font-mono text-gray-900 dark:text-surface-100">{formData.originReferenceId}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-200 dark:border-surface-700 pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-surface-400">{t('receivables.amount')}</span>
                                        <span className="text-2xl font-bold text-[var(--accent-primary)]">
                      {formatCurrency(formData.originalAmount, formData.currency)}
                    </span>
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-surface-400">{t('receivables.dueDate')}</span>
                                    <span className="font-medium text-gray-900 dark:text-surface-100">{formData.dueDate}</span>
                                </div>
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
                    <h1 className="font-semibold text-gray-900 dark:text-surface-100">{t('receivables.wizard.title')}</h1>
                    <div className="w-10" />
                </div>
            </div>

            {/* Steps */}
            <div className="bg-white dark:bg-surface-800 border-b border-gray-200 dark:border-surface-700 px-4 py-3">
                <div className="max-w-4xl mx-auto flex gap-2">
                    {steps.map((s) => {
                        const Icon = s.icon;
                        const isActive = s.id === step;
                        const isCompleted = s.id < step;
                        return (
                            <button
                                key={s.id}
                                onClick={() => s.id < step && setStep(s.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                                    isActive ? 'bg-[var(--accent-primary)] text-white' : isCompleted ? 'bg-green-100 dark:bg-green-900/20 text-green-700' : 'bg-gray-100 dark:bg-surface-700 text-gray-400'
                                }`}
                                disabled={s.id > step}
                            >
                                {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                                <span className="hidden sm:inline">{s.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <AnimatePresence mode="wait">
                    <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        {renderStepContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-surface-800 border-t border-gray-200 dark:border-surface-700 px-4 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Button variant="secondary" leftIcon={<ChevronLeft size={18} />} onClick={goBack} disabled={step === 1}>
                        {t('common.back')}
                    </Button>
                    <div className="flex gap-3">
                        {step === 4 ? (
                            <Button
                                variant="primary"
                                leftIcon={<Check size={18} />}
                                onClick={handleCreate}
                                disabled={!formData.debtorId || !formData.originalAmount || !formData.dueDate}
                            >
                                {t('receivables.save')}
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                rightIcon={<ChevronRight size={18} />}
                                onClick={goNext}
                                disabled={step === 1 && !formData.debtorId}
                            >
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
// RECEIVABLE DETAIL MODAL
// =============================================================================

function ReceivableDetail({
                              receivable,
                              onClose,
                          }: {
    receivable: Receivable;
    onClose: () => void;
}) {
    const { t, language } = useThemeStore();
    const {
        applyPayment,
        openDispute,
        resolveDispute,
        startCollection,
        writeOff,
        sendReminder,
        getEventsByReceivable,
        debtors,
    } = useReceivablesStore();

    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [showDisputeForm, setShowDisputeForm] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(receivable.outstandingAmount);
    const [disputeReason, setDisputeReason] = useState('');

    const events = getEventsByReceivable(receivable.id);
    const debtor = debtors.find((d) => d.id === receivable.debtorId);

    const formatCurrency = (amount: number, currency: string = 'EUR') => {
        return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US');
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString(language === 'de' ? 'de-DE' : 'en-US');
    };

    const handleApplyPayment = () => {
        if (paymentAmount > 0 && paymentAmount <= receivable.outstandingAmount) {
            applyPayment(receivable.id, paymentAmount, 'payment');
            setShowPaymentForm(false);
            toast.success(t('receivables.paymentApplied') || 'Payment applied successfully');
            onClose();
        }
    };

    const handleOpenDispute = () => {
        if (disputeReason) {
            openDispute(receivable.id, disputeReason);
            setShowDisputeForm(false);
            toast.success(t('receivables.disputeOpened') || 'Dispute opened');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-surface-700">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                            {receivable.originReferenceId || `REC-${receivable.id.slice(-6)}`}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-surface-400">{debtor?.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-700">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Amount Summary */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-gray-50 dark:bg-surface-700/30 rounded-xl">
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('receivables.original')}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-surface-100">
                                {formatCurrency(receivable.originalAmount, receivable.currency)}
                            </p>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                            <p className="text-sm text-green-600 dark:text-green-400">{t('receivables.paid')}</p>
                            <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(receivable.paidAmount, receivable.currency)}
                            </p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <p className="text-sm text-blue-600 dark:text-blue-400">{t('receivables.outstanding')}</p>
                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                {formatCurrency(receivable.outstandingAmount, receivable.currency)}
                            </p>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-surface-400">{t('receivables.status.label')}</span>
                            <Badge variant={receivable.status === 'paid' ? 'success' : receivable.status === 'overdue' ? 'danger' : 'neutral'}>
                                {t(`receivables.status.${receivable.status}`)}
                            </Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-surface-400">{t('receivables.risk.label')}</span>
                            <Badge variant={receivable.riskLevel === 'critical' || receivable.riskLevel === 'high' ? 'danger' : receivable.riskLevel === 'medium' ? 'warning' : 'success'}>
                                {t(`receivables.risk.${receivable.riskLevel}`)}
                            </Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-surface-400">{t('receivables.issueDate')}</span>
                            <span className="text-gray-900 dark:text-surface-100">{formatDate(receivable.issueDate)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-surface-400">{t('receivables.dueDate')}</span>
                            <span className="text-gray-900 dark:text-surface-100">{formatDate(receivable.dueDate)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-surface-400">{t('receivables.daysOut')}</span>
                            <span className={`font-medium ${receivable.daysOutstanding > 60 ? 'text-red-500' : 'text-gray-900 dark:text-surface-100'}`}>
                {receivable.daysOutstanding} {t('receivables.days')}
              </span>
                        </div>
                    </div>

                    {/* Payment Form */}
                    {showPaymentForm && (
                        <Card variant="glass" padding="md" className="mb-6">
                            <h3 className="font-medium text-gray-900 dark:text-surface-100 mb-4">{t('receivables.applyPayment')}</h3>
                            <Input
                                label={t('receivables.paymentAmount')}
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                max={receivable.outstandingAmount}
                            />
                            <div className="flex gap-2 mt-4">
                                <Button variant="secondary" onClick={() => setShowPaymentForm(false)}>{t('common.cancel')}</Button>
                                <Button variant="primary" onClick={handleApplyPayment}>{t('receivables.apply')}</Button>
                            </div>
                        </Card>
                    )}

                    {/* Dispute Form */}
                    {showDisputeForm && (
                        <Card variant="glass" padding="md" className="mb-6">
                            <h3 className="font-medium text-gray-900 dark:text-surface-100 mb-4">{t('receivables.openDispute')}</h3>
                            <textarea
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                                placeholder={t('receivables.disputeReasonPlaceholder')}
                                rows={3}
                                className="w-full px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl resize-none"
                            />
                            <div className="flex gap-2 mt-4">
                                <Button variant="secondary" onClick={() => setShowDisputeForm(false)}>{t('common.cancel')}</Button>
                                <Button variant="secondary" onClick={handleOpenDispute}>{t('receivables.openDispute')}</Button>
                            </div>
                        </Card>
                    )}

                    {/* Events Timeline */}
                    <div>
                        <h3 className="font-medium text-gray-900 dark:text-surface-100 mb-4">{t('receivables.history')}</h3>
                        <div className="space-y-3">
                            {events.slice(0, 10).map((event) => (
                                <div key={event.id} className="flex gap-3 p-3 bg-gray-50 dark:bg-surface-700/30 rounded-xl">
                                    <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center flex-shrink-0">
                                        <Clock size={14} className="text-[var(--accent-primary)]" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-surface-100">
                                            {t(`receivables.event.${event.type}`)}
                                        </p>
                                        {event.notes && (
                                            <p className="text-sm text-gray-500 dark:text-surface-400">{event.notes}</p>
                                        )}
                                        <p className="text-xs text-gray-400 dark:text-surface-500 mt-1">{formatDateTime(event.timestamp)}</p>
                                    </div>
                                    {event.amountImpact && (
                                        <span className={`text-sm font-medium ${event.amountImpact < 0 ? 'text-green-600' : 'text-blue-600'}`}>
                      {event.amountImpact < 0 ? '' : '+'}{formatCurrency(event.amountImpact, receivable.currency)}
                    </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {receivable.status !== 'paid' && receivable.status !== 'written_off' && (
                    <div className="p-4 border-t border-gray-200 dark:border-surface-700 flex gap-2 flex-wrap">
                        {!showPaymentForm && !showDisputeForm && (
                            <>
                                <Button variant="primary" leftIcon={<CreditCard size={16} />} onClick={() => setShowPaymentForm(true)}>
                                    {t('receivables.recordPayment')}
                                </Button>
                                <Button variant="secondary" leftIcon={<Send size={16} />} onClick={async () => {
                                    const result = await sendReminder(receivable.id);
                                    if (result?.success) {
                                        toast.success(t('receivables.reminderSent') || `Payment reminder sent to ${result.sentTo}`);
                                    } else {
                                        toast.error(result?.error || 'Failed to send reminder');
                                    }
                                }}>
                                    {t('receivables.sendReminder')}
                                </Button>
                                {!receivable.isDisputed && (
                                    <Button variant="secondary" leftIcon={<Shield size={16} />} onClick={() => setShowDisputeForm(true)}>
                                        {t('receivables.dispute')}
                                    </Button>
                                )}
                                {receivable.isDisputed && (
                                    <Button variant="primary" leftIcon={<Check size={16} />} onClick={() => resolveDispute(receivable.id, 'accepted')}>
                                        {t('receivables.resolveDispute')}
                                    </Button>
                                )}
                                {receivable.status === 'overdue' && (
                                    <Button variant="danger" leftIcon={<Phone size={16} />} onClick={() => startCollection(receivable.id)}>
                                        {t('receivables.startCollection')}
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function ReceivablesPage() {
    const [showWizard, setShowWizard] = useState(false);
    const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);

    if (showWizard) {
        return <CreateReceivableWizard onClose={() => setShowWizard(false)} onComplete={() => setShowWizard(false)} />;
    }

    return (
        <>
            <ReceivablesList
                onCreateNew={() => setShowWizard(true)}
                onSelectReceivable={setSelectedReceivable}
            />
            {selectedReceivable && (
                <ReceivableDetail
                    receivable={selectedReceivable}
                    onClose={() => setSelectedReceivable(null)}
                />
            )}
        </>
    );
}

// HAB IN ZEILE 538 WAS entfernt:
// Hier die komplette Original-Funktion falls es stresst

/* function CreateReceivableWizard({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (receivable: Receivable) => void;
}) {
  const { t, language } = useThemeStore();
  const { createReceivable, debtors } = useReceivablesStore();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    originType: 'invoice' as const,
    originReferenceId: '',
    debtorId: '',
    currency: 'EUR',
    originalAmount: 0,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    reference: '',
    description: '',
    autoRemindersEnabled: true,
  });

  const steps = [
    { id: 1, label: t('receivables.wizard.debtor'), icon: Users },
    { id: 2, label: t('receivables.wizard.amount'), icon: DollarSign },
    { id: 3, label: t('receivables.wizard.dates'), icon: Calendar },
    { id: 4, label: t('receivables.wizard.review'), icon: Check },
  ];

  const goNext = () => step < 4 && setStep(step + 1);
  const goBack = () => step > 1 && setStep(step - 1);

  const handleCreate = () => {
    const receivable = createReceivable({
      originType: formData.originType,
      originReferenceId: formData.originReferenceId || undefined,
      creditorEntityId: 'company-001',
      debtorId: formData.debtorId,
      currency: formData.currency,
      originalAmount: formData.originalAmount,
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      reference: formData.reference || undefined,
      description: formData.description || undefined,
      autoRemindersEnabled: formData.autoRemindersEnabled,
      isDisputed: false,
    });
    onComplete(receivable);
  };

  const selectedDebtor = debtors.find((d) => d.id === formData.debtorId);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency }).format(amount);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                {t('receivables.wizard.selectDebtor')}
              </h2>
              <p className="text-gray-500 dark:text-surface-400 mt-1">{t('receivables.wizard.selectDebtorDesc')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
                {t('receivables.origin.label')}
              </label>
              <div className="flex gap-3">
                {(['invoice', 'order', 'contract', 'manual'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, originType: type })}
                    className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      formData.originType === type
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 text-[var(--accent-primary)]'
                        : 'border-gray-200 dark:border-surface-700 text-gray-600 dark:text-surface-400'
                    }`}
                  >
                    {t(`receivables.origin.${type}`)}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label={t('receivables.referenceNumber')}
              value={formData.originReferenceId}
              onChange={(e) => setFormData({ ...formData, originReferenceId: e.target.value })}
              placeholder="INV-2024-001"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
                {t('receivables.debtor')}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {debtors.map((debtor) => (
                  <button
                    key={debtor.id}
                    onClick={() => setFormData({ ...formData, debtorId: debtor.id })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.debtorId === debtor.id
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                        : 'border-gray-200 dark:border-surface-700'
                    }`}
                  >
                    <p className="font-semibold text-gray-900 dark:text-surface-100">{debtor.name}</p>
                    <p className="text-sm text-gray-500 dark:text-surface-400">{debtor.country}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={debtor.paymentHistory === 'excellent' || debtor.paymentHistory === 'good' ? 'success' : debtor.paymentHistory === 'fair' ? 'warning' : 'danger'}
                        size="sm"
                      >
                        {t(`receivables.paymentHistory.${debtor.paymentHistory}`)}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                {t('receivables.wizard.enterAmount')}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('receivables.amount')}
                type="number"
                value={formData.originalAmount || ''}
                onChange={(e) => setFormData({ ...formData, originalAmount: Number(e.target.value) })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                  {t('invoice.currency')}
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="CHF">CHF</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
            <Input
              label={t('receivables.reference')}
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder={t('receivables.referencePlaceholder')}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                {t('receivables.wizard.setDates')}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('receivables.issueDate')}
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
              />
              <Input
                label={t('receivables.dueDate')}
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-surface-800/30 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoRemindersEnabled}
                onChange={(e) => setFormData({ ...formData, autoRemindersEnabled: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-[var(--accent-primary)]"
              />
              <div>
                <p className="font-medium text-gray-700 dark:text-surface-300">{t('receivables.autoReminders')}</p>
                <p className="text-sm text-gray-500 dark:text-surface-400">{t('receivables.autoRemindersDesc')}</p>
              </div>
            </label>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                {t('receivables.wizard.review')}
              </h2>
            </div>
            <Card variant="glass" padding="lg">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-surface-400">{t('receivables.debtor')}</span>
                  <span className="font-medium text-gray-900 dark:text-surface-100">{selectedDebtor?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-surface-400">{t('receivables.origin.label')}</span>
                  <Badge variant="info">{t(`receivables.origin.${formData.originType}`)}</Badge>
                </div>
                {formData.originReferenceId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-surface-400">{t('receivables.referenceNumber')}</span>
                    <span className="font-mono text-gray-900 dark:text-surface-100">{formData.originReferenceId}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-surface-700 pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-surface-400">{t('receivables.amount')}</span>
                    <span className="text-2xl font-bold text-[var(--accent-primary)]">
                      {formatCurrency(formData.originalAmount, formData.currency)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-surface-400">{t('receivables.dueDate')}</span>
                  <span className="font-medium text-gray-900 dark:text-surface-100">{formData.dueDate}</span>
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  }; */