'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet,
    Building2,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    AlertCircle,
    Shield,
    CreditCard,
    ArrowRightLeft,
    PiggyBank,
    Landmark,
    CheckCircle,
    XCircle,
    Clock,
    ChevronRight,
    RefreshCw,
    Eye,
    Play,
    X,
    FileText,
    BarChart3,
    Target,
    Percent,
    Calendar,
    Globe,
    Lock,
    Unlock,
    Scale,
    Layers,
    Zap,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useTreasuryStore } from '@/store/treasury-store';
import type {
    TreasuryDecision,
    CapitalBucket,
    CreditFacility,
    TreasuryScenario,
    NettingOpportunity,
    RiskLevel,
    TreasuryDecisionStatus,
} from '@/types/treasury';

// =============================================================================
// HELPERS
// =============================================================================

const statusColors: Record<TreasuryDecisionStatus, string> = {
    draft: 'gray',
    validating: 'blue',
    evaluating: 'blue',
    proposed: 'purple',
    awaiting_approval: 'amber',
    approved: 'green',
    scheduled: 'cyan',
    executing: 'blue',
    executed: 'green',
    reconciling: 'purple',
    settled: 'green',
    rejected: 'red',
    cancelled: 'gray',
    failed: 'red',
    rolled_back: 'orange',
    expired: 'gray',
};

const riskColors: Record<RiskLevel, string> = {
    low: 'green',
    medium: 'amber',
    high: 'orange',
    critical: 'red',
};

const bucketIcons: Record<string, React.ElementType> = {
    operating: Wallet,
    payroll_reserve: Building2,
    tax_reserve: Landmark,
    debt_service: CreditCard,
    investment: TrendingUp,
    excess: PiggyBank,
};

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function TreasuryPage() {
    const { t, language } = useThemeStore();
    const {
        accounts,
        cashPosition,
        buckets,
        facilities,
        decisions,
        scenarios,
        nettingOpportunities,
        getSummary,
        recalculateCashPosition,
        recalculateRiskExposure,
        getPendingApprovals,
        approveDecision,
        rejectDecision,
        executeDecision,
        runScenario,
        rebalanceBuckets,
        fetchTreasury,
        isInitialized,
        isLoading,
    } = useTreasuryStore();
    useEffect(() => {
  if (!isInitialized) {
    fetchTreasury();
  }
}, [fetchTreasury, isInitialized]);
    const [activeTab, setActiveTab] = useState<'overview' | 'buckets' | 'facilities' | 'decisions' | 'scenarios'>('overview');
    const [selectedDecision, setSelectedDecision] = useState<TreasuryDecision | null>(null);
    const [selectedScenario, setSelectedScenario] = useState<TreasuryScenario | null>(null);

    useEffect(() => {
        recalculateCashPosition();
        recalculateRiskExposure();
    }, []);

    const summary = getSummary();
    const pendingApprovals = getPendingApprovals();

    const formatCurrency = (amount: number, currency: string = 'EUR') => {
        return new Intl.NumberFormat(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatPercent = (value: number) => `${value.toFixed(1)}%`;

    const getRiskBadge = (risk: RiskLevel) => (
        <Badge variant={risk === 'low' ? 'success' : risk === 'medium' ? 'warning' : 'danger'} size="sm">
            {t(`treasury.risk.${risk}`)}
        </Badge>
    );

    const getStatusBadge = (status: TreasuryDecisionStatus) => (
        <Badge
            variant={
                status === 'settled' || status === 'approved' || status === 'executed' ? 'success' :
                    status === 'rejected' || status === 'failed' ? 'danger' :
                        status === 'awaiting_approval' ? 'warning' : 'neutral'
            }
            size="sm"
        >
            {t(`treasury.status.${status}`)}
        </Badge>
    );

    const tabs = [
        { id: 'overview', label: t('treasury.tabs.overview'), icon: BarChart3 },
        { id: 'buckets', label: t('treasury.tabs.buckets'), icon: Layers },
        { id: 'facilities', label: t('treasury.tabs.facilities'), icon: CreditCard },
        { id: 'decisions', label: t('treasury.tabs.decisions'), icon: Zap, badge: pendingApprovals.length },
        { id: 'scenarios', label: t('treasury.tabs.scenarios'), icon: Target },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
                        {t('treasury.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-surface-500 mt-1">{t('treasury.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" leftIcon={<RefreshCw size={18} />} onClick={() => recalculateCashPosition()}>
                        {t('treasury.sync')}
                    </Button>
                    <Button variant="primary" leftIcon={<Scale size={18} />} onClick={() => rebalanceBuckets()}>
                        {t('treasury.rebalance')}
                    </Button>
                </div>
            </div>

            {/* Alerts */}
            {pendingApprovals.length > 0 && (
                <Card variant="glass" padding="md" className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="text-amber-500" size={20} />
                            <div>
                                <p className="font-medium text-amber-700 dark:text-amber-300">
                                    {pendingApprovals.length} {t('treasury.pendingApprovals')}
                                </p>
                                <p className="text-sm text-amber-600 dark:text-amber-400">{t('treasury.pendingApprovalsDesc')}</p>
                            </div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setActiveTab('decisions')}>
                            {t('treasury.review')}
                        </Button>
                    </div>
                </Card>
            )}

            {summary.bucketsUnderfunded > 0 && (
                <Card variant="glass" padding="md" className="border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="text-red-500" size={20} />
                        <div>
                            <p className="font-medium text-red-700 dark:text-red-300">
                                {summary.bucketsUnderfunded} {t('treasury.bucketsUnderfunded')}
                            </p>
                            <p className="text-sm text-red-600 dark:text-red-400">
                                {t('treasury.deficit')}: {formatCurrency(summary.totalBucketDeficit)}
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <Wallet size={20} className="text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('treasury.availableCash')}</p>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(summary.availableCash)}</p>
                        </div>
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <Lock size={20} className="text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('treasury.restrictedCash')}</p>
                            <p className="text-xl font-bold text-amber-600">{formatCurrency(summary.restrictedCash)}</p>
                        </div>
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <CreditCard size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('treasury.creditAvailable')}</p>
                            <p className="text-xl font-bold text-blue-600">{formatCurrency(summary.totalCreditAvailable)}</p>
                        </div>
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <ArrowRightLeft size={20} className="text-purple-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('treasury.netCashFlow7d')}</p>
                            <p className={`text-xl font-bold ${summary.netCashFlow7d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {summary.netCashFlow7d >= 0 ? '+' : ''}{formatCurrency(summary.netCashFlow7d)}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-${riskColors[summary.overallRisk]}-500/10 flex items-center justify-center`}>
                            <Shield size={20} className={`text-${riskColors[summary.overallRisk]}-500`} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('treasury.riskLevel')}</p>
                            {getRiskBadge(summary.overallRisk)}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto border-b border-gray-200 dark:border-surface-700 pb-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                activeTab === tab.id
                                    ? 'bg-[var(--accent-primary)] text-white'
                                    : 'text-gray-600 dark:text-surface-400 hover:bg-gray-100 dark:hover:bg-surface-800'
                            }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                            {tab.badge && tab.badge > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">{tab.badge}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Cash by Classification */}
                            <Card variant="glass" padding="md">
                                <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">{t('treasury.cashByClassification')}</h3>
                                <div className="space-y-3">
                                    {cashPosition && Object.entries({
                                        unrestricted: { amount: cashPosition.unrestricted, icon: Unlock, color: 'green' },
                                        restricted: { amount: cashPosition.restricted, icon: Lock, color: 'amber' },
                                        pledged: { amount: cashPosition.pledged, icon: Shield, color: 'blue' },
                                        escrowed: { amount: cashPosition.escrowed, icon: Scale, color: 'purple' },
                                        blocked: { amount: cashPosition.blocked, icon: XCircle, color: 'red' },
                                    }).filter(([_, data]) => data.amount > 0).map(([key, data]) => {
                                        const Icon = data.icon;
                                        const percentage = cashPosition.totalCash > 0 ? (data.amount / cashPosition.totalCash) * 100 : 0;
                                        return (
                                            <div key={key} className="flex items-center gap-3">
                                                <Icon size={18} className={`text-${data.color}-500`} />
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-600 dark:text-surface-400">{t(`treasury.classification.${key}`)}</span>
                                                        <span className="font-medium text-gray-900 dark:text-surface-100">{formatCurrency(data.amount)}</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-gray-200 dark:bg-surface-700 rounded-full">
                                                        <div className={`h-full bg-${data.color}-500 rounded-full`} style={{ width: `${percentage}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>

                            {/* Cash by Currency */}
                            <Card variant="glass" padding="md">
                                <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">{t('treasury.cashByCurrency')}</h3>
                                <div className="space-y-3">
                                    {cashPosition && Object.entries(cashPosition.byCurrency).map(([currency, amount]) => (
                                        <div key={currency} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-surface-700/30 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                <Globe size={18} className="text-gray-400" />
                                                <span className="font-medium text-gray-900 dark:text-surface-100">{currency}</span>
                                            </div>
                                            <span className="font-semibold text-gray-900 dark:text-surface-100">{formatCurrency(amount, currency)}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Netting Opportunities */}
                            {nettingOpportunities.length > 0 && (
                                <Card variant="glass" padding="md" className="lg:col-span-2">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-gray-900 dark:text-surface-100">{t('treasury.nettingOpportunities')}</h3>
                                        <Badge variant="info" size="sm">{formatCurrency(summary.potentialSavings)} {t('treasury.potentialSavings')}</Badge>
                                    </div>
                                    <div className="space-y-3">
                                        {nettingOpportunities.map((opp) => (
                                            <div key={opp.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-surface-700/30 rounded-xl">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-surface-100">{opp.counterpartyName}</p>
                                                    <p className="text-sm text-gray-500 dark:text-surface-400">
                                                        {t('treasury.net')}: {formatCurrency(opp.netAmount, opp.currency)} ({t('treasury.saves')} {formatCurrency(opp.cashSaved, opp.currency)})
                                                    </p>
                                                </div>
                                                <Button variant="secondary" size="sm">{t('treasury.execute')}</Button>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {/* Compliance Status */}
                            <Card variant="glass" padding="md" className="lg:col-span-2">
                                <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">{t('treasury.compliance')}</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { framework: 'SOX', region: 'US', status: 'compliant' },
                                        { framework: 'PSD2', region: 'EU', status: 'compliant' },
                                        { framework: 'MiFID II', region: 'EU', status: 'compliant' },
                                        { framework: 'FINMA', region: 'CH', status: 'compliant' },
                                    ].map((item) => (
                                        <div key={item.framework} className="p-3 bg-gray-50 dark:bg-surface-700/30 rounded-xl">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CheckCircle size={16} className="text-green-500" />
                                                <span className="font-medium text-gray-900 dark:text-surface-100">{item.framework}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-surface-400">{item.region}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'buckets' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {buckets.map((bucket) => {
                                const Icon = bucketIcons[bucket.type] || PiggyBank;
                                return (
                                    <Card key={bucket.id} variant="glass" padding="md" className={bucket.status === 'critical' ? 'border-l-4 border-red-500' : bucket.status === 'underfunded' ? 'border-l-4 border-amber-500' : ''}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl bg-${bucket.status === 'funded' || bucket.status === 'overfunded' ? 'green' : bucket.status === 'underfunded' ? 'amber' : 'red'}-500/10 flex items-center justify-center`}>
                                                    <Icon size={20} className={`text-${bucket.status === 'funded' || bucket.status === 'overfunded' ? 'green' : bucket.status === 'underfunded' ? 'amber' : 'red'}-500`} />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 dark:text-surface-100">{bucket.name}</h4>
                                                    <p className="text-xs text-gray-500 dark:text-surface-400">{t(`treasury.horizon.${bucket.timeHorizon}`)}</p>
                                                </div>
                                            </div>
                                            <Badge variant={bucket.status === 'funded' || bucket.status === 'overfunded' ? 'success' : bucket.status === 'underfunded' ? 'warning' : 'danger'} size="sm">
                                                {t(`treasury.bucketStatus.${bucket.status}`)}
                                            </Badge>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-500 dark:text-surface-400">{t('treasury.funding')}</span>
                                                    <span className="font-medium">{formatPercent(bucket.fundingRatio * 100)}</span>
                                                </div>
                                                <div className="w-full h-3 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${bucket.fundingRatio >= 1 ? 'bg-green-500' : bucket.fundingRatio >= 0.8 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                        style={{ width: `${Math.min(bucket.fundingRatio * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <p className="text-gray-500 dark:text-surface-400">{t('treasury.current')}</p>
                                                    <p className="font-semibold text-gray-900 dark:text-surface-100">{formatCurrency(bucket.currentAmount, bucket.currency)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 dark:text-surface-400">{t('treasury.target')}</p>
                                                    <p className="font-semibold text-gray-900 dark:text-surface-100">{formatCurrency(bucket.targetAmount, bucket.currency)}</p>
                                                </div>
                                            </div>

                                            {bucket.status === 'underfunded' || bucket.status === 'critical' ? (
                                                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                    <p className="text-sm text-red-600 dark:text-red-400">
                                                        {t('treasury.deficit')}: {formatCurrency(bucket.targetAmount - bucket.currentAmount, bucket.currency)}
                                                    </p>
                                                </div>
                                            ) : null}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'facilities' && (
                        <div className="space-y-4">
                            {facilities.map((facility) => (
                                <Card key={facility.id} variant="glass" padding="md">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-surface-100">{facility.name}</h4>
                                            <p className="text-sm text-gray-500 dark:text-surface-400">{facility.bankName}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={facility.covenantStatus === 'compliant' ? 'success' : 'warning'} size="sm">
                                                {t(`treasury.covenant.${facility.covenantStatus}`)}
                                            </Badge>
                                            <Badge variant="neutral" size="sm">{facility.currency}</Badge>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('treasury.limit')}</p>
                                            <p className="font-semibold text-gray-900 dark:text-surface-100">{formatCurrency(facility.totalLimit, facility.currency)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('treasury.drawn')}</p>
                                            <p className="font-semibold text-gray-900 dark:text-surface-100">{formatCurrency(facility.drawnAmount, facility.currency)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('treasury.available')}</p>
                                            <p className="font-semibold text-green-600">{formatCurrency(facility.availableAmount, facility.currency)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-surface-400">{t('treasury.rate')}</p>
                                            <p className="font-semibold text-gray-900 dark:text-surface-100">
                                                {facility.baseRate ? `${facility.baseRate} + ` : ''}{facility.spread || facility.interestRate}%
                                            </p>
                                        </div>
                                    </div>

                                    {/* Utilization bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-500 dark:text-surface-400">{t('treasury.utilization')}</span>
                                            <span>{formatPercent((facility.drawnAmount / facility.totalLimit) * 100)}</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-200 dark:bg-surface-700 rounded-full">
                                            <div
                                                className="h-full bg-blue-500 rounded-full"
                                                style={{ width: `${(facility.drawnAmount / facility.totalLimit) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Covenants */}
                                    {facility.covenants.length > 0 && (
                                        <div className="border-t border-gray-200 dark:border-surface-700 pt-4">
                                            <p className="text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">{t('treasury.covenants')}</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {facility.covenants.map((cov) => (
                                                    <div key={cov.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-surface-700/30 rounded-lg text-sm">
                                                        <span className="text-gray-600 dark:text-surface-400">{cov.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{cov.currentValue.toFixed(2)}</span>
                                                            {cov.status === 'compliant' ? (
                                                                <CheckCircle size={14} className="text-green-500" />
                                                            ) : (
                                                                <AlertCircle size={14} className="text-amber-500" />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}

                    {activeTab === 'decisions' && (
                        <div className="space-y-4">
                            {decisions.length === 0 ? (
                                <Card variant="glass" padding="lg" className="text-center">
                                    <Zap size={48} className="mx-auto text-gray-300 dark:text-surface-600 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-surface-100">{t('treasury.noDecisions')}</h3>
                                    <p className="text-gray-500 dark:text-surface-400 mt-1">{t('treasury.noDecisionsDesc')}</p>
                                </Card>
                            ) : (
                                decisions.map((decision) => (
                                    <Card
                                        key={decision.id}
                                        variant="glass"
                                        padding="md"
                                        hover
                                        className={`cursor-pointer ${decision.status === 'awaiting_approval' ? 'border-l-4 border-amber-500' : ''}`}
                                        onClick={() => setSelectedDecision(decision)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl bg-${statusColors[decision.status]}-500/10 flex items-center justify-center`}>
                                                    {decision.status === 'awaiting_approval' ? (
                                                        <Clock size={20} className="text-amber-500" />
                                                    ) : decision.status === 'settled' ? (
                                                        <CheckCircle size={20} className="text-green-500" />
                                                    ) : decision.status === 'rejected' || decision.status === 'failed' ? (
                                                        <XCircle size={20} className="text-red-500" />
                                                    ) : (
                                                        <Zap size={20} className="text-blue-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-surface-100">
                              {t(`treasury.decisionType.${decision.type}`)}
                            </span>
                                                        {getStatusBadge(decision.status)}
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-surface-400 line-clamp-1">{decision.rationale}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {getRiskBadge(decision.riskClass)}
                                                {decision.status === 'awaiting_approval' && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            leftIcon={<CheckCircle size={14} />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                approveDecision(decision.id, 'user-001');
                                                            }}
                                                        >
                                                            {t('treasury.approve')}
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            leftIcon={<XCircle size={14} />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                rejectDecision(decision.id, 'Rejected by user');
                                                            }}
                                                        >
                                                            {t('treasury.reject')}
                                                        </Button>
                                                    </div>
                                                )}
                                                {decision.status === 'approved' && (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        leftIcon={<Play size={14} />}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            executeDecision(decision.id);
                                                        }}
                                                    >
                                                        {t('treasury.execute')}
                                                    </Button>
                                                )}
                                                <ChevronRight size={16} className="text-gray-400" />
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'scenarios' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {scenarios.map((scenario) => (
                                <Card key={scenario.id} variant="glass" padding="md" hover className="cursor-pointer" onClick={() => setSelectedScenario(scenario)}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-surface-100">{scenario.name}</h4>
                                            <Badge variant={scenario.type === 'expected' ? 'success' : scenario.type === 'worst_case' ? 'danger' : 'neutral'} size="sm">
                                                {t(`treasury.scenarioType.${scenario.type}`)}
                                            </Badge>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            leftIcon={<Play size={14} />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                runScenario(scenario.id);
                                            }}
                                        >
                                            {t('treasury.run')}
                                        </Button>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-surface-400 mb-4">{scenario.description}</p>

                                    {scenario.results && (
                                        <div className="p-3 bg-gray-50 dark:bg-surface-700/30 rounded-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-gray-500 dark:text-surface-400">{t('treasury.liquidityGap')}</span>
                                                <span className={`font-semibold ${scenario.results.liquidityGap > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {scenario.results.liquidityGap > 0 ? formatCurrency(scenario.results.liquidityGap) : t('treasury.noGap')}
                        </span>
                                            </div>
                                            {getRiskBadge(scenario.results.overallRisk)}
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Decision Detail Modal */}
            {selectedDecision && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-surface-700">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                                    {t(`treasury.decisionType.${selectedDecision.type}`)}
                                </h2>
                                {getStatusBadge(selectedDecision.status)}
                            </div>
                            <button onClick={() => setSelectedDecision(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-700">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto max-h-[calc(90vh-150px)]">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-surface-400 mb-1">{t('treasury.rationale')}</h3>
                                    <p className="text-gray-900 dark:text-surface-100">{selectedDecision.rationale}</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-surface-400 mb-1">{t('treasury.impact')}</h3>
                                    <p className="text-gray-900 dark:text-surface-100">{selectedDecision.impactSummary}</p>
                                </div>

                                {selectedDecision.risksIdentified.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-surface-400 mb-1">{t('treasury.risks')}</h3>
                                        <ul className="list-disc list-inside text-gray-900 dark:text-surface-100">
                                            {selectedDecision.risksIdentified.map((risk, i) => (
                                                <li key={i}>{risk}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {selectedDecision.alternativesConsidered.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-surface-400 mb-2">{t('treasury.alternatives')}</h3>
                                        {selectedDecision.alternativesConsidered.map((alt, i) => (
                                            <div key={i} className="p-3 bg-gray-50 dark:bg-surface-700/30 rounded-xl mb-2">
                                                <p className="font-medium text-gray-900 dark:text-surface-100">{alt.description}</p>
                                                <p className="text-sm text-gray-500 dark:text-surface-400">{alt.reasonNotChosen}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {selectedDecision.plan && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-surface-400 mb-2">{t('treasury.planSteps')}</h3>
                                        {selectedDecision.plan.steps.map((step) => (
                                            <div key={step.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-surface-700/30 rounded-xl mb-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-sm font-medium text-blue-600">
                                                    {step.sequence}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 dark:text-surface-100">{step.description}</p>
                                                    <p className="text-sm text-gray-500 dark:text-surface-400">
                                                        {formatCurrency(step.amount, step.currency)}
                                                    </p>
                                                </div>
                                                <Badge variant={step.status === 'completed' ? 'success' : step.status === 'failed' ? 'danger' : 'neutral'} size="sm">
                                                    {t(`treasury.stepStatus.${step.status}`)}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}