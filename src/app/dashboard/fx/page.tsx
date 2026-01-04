'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Currency,
    TrendingUp,
    TrendingDown,
    Minus,
    DollarSign,
    ArrowRightLeft,
    PieChart,
    BarChart3,
    Clock,
    AlertTriangle,
    Shield,
    Eye,
    Lock,
    FileText,
    RefreshCw,
    Download,
    Info,
    Globe,
    Banknote,
    Activity,
    Target,
    Percent,
    Calculator,
    LineChart,
    Table,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    XCircle,
    Layers,
    Building2,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useFXStore } from '@/store/fx-store';
import type { FXRiskLevel, ExposureType, TimeHorizon, CurrencyExposure, FXConversion, FXScenario } from '@/types/fx';
import { EXPOSURE_TYPES, TIME_HORIZONS, MAJOR_CURRENCIES } from '@/types/fx';
import {
    runMonteCarloGBM,
    generateScenarioAnalysis,
    getDefaultVolatility,
    type MonteCarloResult,
    type ScenarioAnalysis,
} from '@/lib/monte-carlo';
import toast from 'react-hot-toast';

// =============================================================================
// UTILITIES
// =============================================================================

const formatCurrency = (value: number | undefined | null, currency: string = 'USD'): string => {
    if (value === undefined || value === null) return `${currency} —`;
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (absValue >= 1000000) return `${sign}${currency} ${(absValue / 1000000).toFixed(2)}M`;
    if (absValue >= 1000) return `${sign}${currency} ${(absValue / 1000).toFixed(0)}K`;
    return `${sign}${currency} ${absValue.toLocaleString()}`;
};

const formatRate = (rate: number | undefined | null, decimals: number = 4): string => {
    if (rate === undefined || rate === null) return '—';
    return rate.toFixed(decimals);
};

const formatPercent = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '—';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const getRiskColor = (level: FXRiskLevel): string => {
    const colors: Record<FXRiskLevel, string> = {
        low: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
        moderate: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
        elevated: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
        high: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
        critical: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    };
    return colors[level];
};

const getRiskBadgeColor = (level: FXRiskLevel): string => {
    const colors: Record<FXRiskLevel, string> = {
        low: 'bg-emerald-500',
        moderate: 'bg-blue-500',
        elevated: 'bg-amber-500',
        high: 'bg-orange-500',
        critical: 'bg-red-500',
    };
    return colors[level];
};

// =============================================================================
// SECTION HEADER
// =============================================================================

function SectionHeader({ title, icon: Icon, badge }: { title: string; icon: any; badge?: string }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-surface-800">
                <Icon size={20} className="text-gray-600 dark:text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            {badge && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {badge}
                </span>
            )}
        </div>
    );
}

// =============================================================================
// CURRENT RATES SECTION
// =============================================================================

function CurrentRatesSection() {
    const { dashboard, fetchLiveRates, isSyncingLiveRates } = useFXStore();
    const currentRates = dashboard?.currentRates ?? [];

    const handleFetchLiveRates = async () => {
        const result = await fetchLiveRates(dashboard?.baseCurrency || 'EUR');
        if (result.success) {
            toast.success(`Synced ${result.ratesCount || 'live'} rates successfully`);
        } else {
            toast.error(result.message || 'Failed to fetch live rates');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <SectionHeader title="Current FX Rates" icon={Globe} badge="Live" />
                <Button
                    variant="primary"
                    size="sm"
                    onClick={handleFetchLiveRates}
                    disabled={isSyncingLiveRates}
                    leftIcon={<RefreshCw size={16} className={isSyncingLiveRates ? 'animate-spin' : ''} />}
                >
                    {isSyncingLiveRates ? 'Syncing...' : 'Fetch Live Rates'}
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {currentRates.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                        <Globe size={48} className="mx-auto text-gray-300 dark:text-surface-600 mb-4" />
                        <p className="text-gray-500 dark:text-surface-400">No rates available</p>
                        <p className="text-sm text-gray-400 dark:text-surface-500 mt-1">
                            Click &quot;Fetch Live Rates&quot; to sync current exchange rates
                        </p>
                    </div>
                ) : (
                    currentRates.map((rate) => (
                        <Card key={rate.id} variant="glass" padding="sm" className="text-center">
                            <p className="text-xs text-gray-500 font-medium">{rate.baseCurrency}/{rate.quoteCurrency}</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                                {rate.rate != null ? (rate.rate >= 1 ? rate.rate.toFixed(4) : rate.rate.toFixed(6)) : '—'}
                            </p>
                            {rate.spread != null && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Spread: {(rate.spread * 100).toFixed(2)}%
                                </p>
                            )}
                        </Card>
                    ))
                )}
            </div>

            {currentRates[0]?.timestamp && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={12} />
                    Rates as of {new Date(currentRates[0].timestamp).toLocaleString()} • Source: {currentRates[0]?.source?.toUpperCase() ?? 'N/A'}
                </p>
            )}
        </div>
    );
}

// =============================================================================
// EXPOSURE OVERVIEW SECTION
// =============================================================================

function ExposureOverviewSection() {
    const { dashboard, selectedCurrency, selectedTimeHorizon, selectedExposureType, setSelectedCurrency, setSelectedTimeHorizon, setSelectedExposureType, getFilteredExposures } = useFXStore();
    const exposureSummary = dashboard?.exposureSummary;
    const filteredExposures = getFilteredExposures();

    if (!exposureSummary) return null;

    return (
        <div className="space-y-4">
            <SectionHeader title="FX Exposure Overview" icon={PieChart} />

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Gross Exposure</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(exposureSummary.totalGrossExposure)}</p>
                    <p className="text-xs text-gray-500 mt-1">Total FX positions</p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Net Exposure</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(exposureSummary.totalNetExposure)}</p>
                    <p className="text-xs text-gray-500 mt-1">After netting</p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Hedged</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(exposureSummary.totalHedged)}</p>
                    <p className="text-xs text-gray-500 mt-1">{exposureSummary.hedgeRatio?.toFixed(1) ?? '—'}% hedge ratio</p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Unhedged</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(exposureSummary.totalUnhedged)}</p>
                    <p className="text-xs text-gray-500 mt-1">Open exposure</p>
                </Card>
            </div>

            {/* Filters */}
            <Card variant="glass" padding="md">
                <div className="flex flex-wrap gap-4">
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Currency</label>
                        <select
                            value={selectedCurrency || 'all'}
                            onChange={(e) => setSelectedCurrency(e.target.value === 'all' ? null : e.target.value)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                        >
                            <option value="all">All Currencies</option>
                            {MAJOR_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Time Horizon</label>
                        <select
                            value={selectedTimeHorizon}
                            onChange={(e) => setSelectedTimeHorizon(e.target.value as any)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                        >
                            <option value="all">All Horizons</option>
                            {TIME_HORIZONS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Exposure Type</label>
                        <select
                            value={selectedExposureType}
                            onChange={(e) => setSelectedExposureType(e.target.value as any)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                        >
                            <option value="all">All Types</option>
                            {EXPOSURE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Exposure by Currency */}
            <Card variant="glass" padding="md">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Exposure by Currency</h3>
                <div className="space-y-3">
                    {exposureSummary.exposureByCurrency.map((item) => (
                        <div key={item.currency} className="flex items-center gap-3">
                            <div className="w-12 text-sm font-medium text-gray-700 dark:text-gray-300">{item.currency}</div>
                            <div className="flex-1">
                                <div className="h-6 bg-gray-100 dark:bg-surface-700 rounded-full overflow-hidden relative">
                                    <div
                                        className={`h-full rounded-full transition-all ${item.amount >= 0 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
                                        style={{ width: `${Math.min(Math.abs(item.percentOfTotal), 100)}%` }}
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                                        {formatCurrency(item.amount)}
                                    </span>
                                </div>
                            </div>
                            <div className="w-16 text-right text-sm text-gray-500">{item.percentOfTotal?.toFixed(1) ?? '—'}%</div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Exposure Table */}
            <Card variant="glass" padding="md">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Detailed Exposures</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-gray-200 dark:border-surface-700">
                            <th className="text-left py-2 px-2 text-gray-500 font-medium">Currency</th>
                            <th className="text-right py-2 px-2 text-gray-500 font-medium">Net Exposure</th>
                            <th className="text-right py-2 px-2 text-gray-500 font-medium">Receivables</th>
                            <th className="text-right py-2 px-2 text-gray-500 font-medium">Payables</th>
                            <th className="text-right py-2 px-2 text-gray-500 font-medium">Hedged</th>
                            <th className="text-center py-2 px-2 text-gray-500 font-medium">Risk</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredExposures.map((exp) => (
                            <tr key={exp.id} className="border-b border-gray-100 dark:border-surface-800">
                                <td className="py-2 px-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{exp.currency}</span>
                                        <span className="text-xs text-gray-400">{exp.entityName}</span>
                                    </div>
                                </td>
                                <td className={`py-2 px-2 text-right font-medium ${exp.netExposure >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatCurrency(exp.netExposure, exp.currency)}
                                </td>
                                <td className="py-2 px-2 text-right text-emerald-600">{formatCurrency(exp.receivables, exp.currency)}</td>
                                <td className="py-2 px-2 text-right text-red-600">{formatCurrency(exp.payables, exp.currency)}</td>
                                <td className="py-2 px-2 text-right">{formatCurrency(exp.hedgedAmount, exp.currency)}</td>
                                <td className="py-2 px-2 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRiskColor(exp.riskLevel)}`}>
                                            {exp.riskLevel}
                                        </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

// =============================================================================
// CONVERSIONS SECTION
// =============================================================================

function ConversionsSection() {
    const { dashboard } = useFXStore();
    const conversionSummary = dashboard?.conversionSummary;
    const recentConversions = dashboard?.recentConversions ?? [];

    if (!conversionSummary) return null;

    const getStatusColor = (status: string): string => {
        const colors: Record<string, string> = {
            completed: 'bg-emerald-100 text-emerald-700',
            pending: 'bg-amber-100 text-amber-700',
            failed: 'bg-red-100 text-red-700',
            cancelled: 'bg-gray-100 text-gray-600',
        };
        return colors[status] || 'bg-gray-100 text-gray-600';
    };

    return (
        <div className="space-y-4">
            <SectionHeader title="FX Conversions" icon={ArrowRightLeft} />

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Total Conversions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{conversionSummary.totalConversions}</p>
                    <p className="text-xs text-gray-500 mt-1">This period</p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Total Volume</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(conversionSummary.totalTargetAmount)}</p>
                    <p className="text-xs text-gray-500 mt-1">Converted to USD</p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Total Costs</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(conversionSummary.totalCosts)}</p>
                    <p className="text-xs text-gray-500 mt-1">Spreads + fees</p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Avg Spread</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{conversionSummary.averageSpread?.toFixed(2) ?? '—'}%</p>
                    <p className="text-xs text-gray-500 mt-1">Across all conversions</p>
                </Card>
            </div>

            {/* By Channel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card variant="glass" padding="md">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Volume by Channel</h3>
                    <div className="space-y-3">
                        {conversionSummary.byChannel.map((channel) => (
                            <div key={channel.channel} className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-sm">{channel.channel}</p>
                                    <p className="text-xs text-gray-500">{channel.count} conversions</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">{formatCurrency(channel.volume)}</p>
                                    <p className="text-xs text-gray-500">Avg cost: {channel.avgCost?.toFixed(2) ?? '—'}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Volume by Currency Pair</h3>
                    <div className="space-y-3">
                        {conversionSummary.byCurrencyPair.map((pair) => (
                            <div key={pair.pair} className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-sm">{pair.pair}</p>
                                    <p className="text-xs text-gray-500">{pair.count} conversions</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">{formatCurrency(pair.volume)}</p>
                                    <p className="text-xs text-gray-500">Avg rate: {pair.avgRate?.toFixed(4) ?? '—'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Recent Conversions Table */}
            <Card variant="glass" padding="md">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent Conversions</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-gray-200 dark:border-surface-700">
                            <th className="text-left py-2 px-2 text-gray-500 font-medium">Reference</th>
                            <th className="text-left py-2 px-2 text-gray-500 font-medium">Date</th>
                            <th className="text-right py-2 px-2 text-gray-500 font-medium">Source</th>
                            <th className="text-center py-2 px-2 text-gray-500 font-medium"></th>
                            <th className="text-right py-2 px-2 text-gray-500 font-medium">Target</th>
                            <th className="text-right py-2 px-2 text-gray-500 font-medium">Rate</th>
                            <th className="text-right py-2 px-2 text-gray-500 font-medium">Cost</th>
                            <th className="text-center py-2 px-2 text-gray-500 font-medium">Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {recentConversions.map((conv) => (
                            <tr key={conv.id} className="border-b border-gray-100 dark:border-surface-800">
                                <td className="py-2 px-2">
                                    <span className="font-medium">{conv.conversionNumber}</span>
                                </td>
                                <td className="py-2 px-2 text-gray-600">{new Date(conv.conversionDate).toLocaleDateString()}</td>
                                <td className="py-2 px-2 text-right">
                                    {conv.sourceAmount.toLocaleString()} {conv.sourceCurrency}
                                </td>
                                <td className="py-2 px-2 text-center">
                                    <ArrowRightLeft size={14} className="text-gray-400 mx-auto" />
                                </td>
                                <td className="py-2 px-2 text-right font-medium">
                                    {conv.targetAmount.toLocaleString()} {conv.targetCurrency}
                                </td>
                                <td className="py-2 px-2 text-right">
                                    <div>
                                        <span>{conv.appliedRate?.toFixed(4) ?? '—'}</span>
                                        {conv.rateDeviation != null && (
                                            <span className={`text-xs ml-1 ${conv.rateDeviation < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                    ({conv.rateDeviation > 0 ? '+' : ''}{conv.rateDeviation.toFixed(2)}%)
                                                </span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-2 px-2 text-right text-red-600">${conv.totalCost.toLocaleString()}</td>
                                <td className="py-2 px-2 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(conv.status)}`}>
                                            {conv.status}
                                        </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

// =============================================================================
// COSTS & IMPACT SECTION
// =============================================================================

function CostsImpactSection() {
    const { dashboard } = useFXStore();
    const currentPeriodCosts = dashboard?.currentPeriodCosts;
    const impactAnalysis = dashboard?.impactAnalysis;

    if (!currentPeriodCosts || !impactAnalysis) return null;

    return (
        <div className="space-y-4">
            <SectionHeader title="FX Costs & Impact" icon={Calculator} />

            {/* Cost Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Total FX Costs</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(currentPeriodCosts.totalFXCosts)}</p>
                    <p className="text-xs text-gray-500 mt-1">{currentPeriodCosts.costAsPercentOfVolume?.toFixed(2) ?? '—'}% of volume</p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Explicit Costs</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(currentPeriodCosts.totalExplicitCosts)}</p>
                    <p className="text-xs text-gray-500 mt-1">Spreads + fees</p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Implicit Costs</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(currentPeriodCosts.totalImplicitCosts)}</p>
                    <p className="text-xs text-gray-500 mt-1">Rate deviation</p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Net P&L Impact</p>
                    <p className={`text-2xl font-bold mt-1 ${currentPeriodCosts.netPnLImpact >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(currentPeriodCosts.netPnLImpact)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {currentPeriodCosts.changePercentVsPrior && (
                            <span className={currentPeriodCosts.changePercentVsPrior >= 0 ? 'text-red-500' : 'text-emerald-500'}>
                                {formatPercent(currentPeriodCosts.changePercentVsPrior)} vs prior
                            </span>
                        )}
                    </p>
                </Card>
            </div>

            {/* Cost Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card variant="glass" padding="md">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Cost Breakdown</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-surface-700">
                            <span className="text-gray-600">Spread Costs</span>
                            <span className="font-medium">{formatCurrency(currentPeriodCosts.spreadCosts)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-surface-700">
                            <span className="text-gray-600">Transaction Fees</span>
                            <span className="font-medium">{formatCurrency(currentPeriodCosts.transactionFees)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-surface-700">
                            <span className="text-gray-600">Bank Charges</span>
                            <span className="font-medium">{formatCurrency(currentPeriodCosts.bankCharges)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-surface-700">
                            <span className="text-gray-600">Rate Deviation Impact</span>
                            <span className="font-medium">{formatCurrency(currentPeriodCosts.rateDeviationImpact)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600">Timing Impact</span>
                            <span className="font-medium">{formatCurrency(currentPeriodCosts.timingImpact)}</span>
                        </div>
                    </div>
                </Card>

                <Card variant="glass" padding="md">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">P&L Impact</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-surface-700">
                            <span className="text-gray-600">Revenue Impact</span>
                            <span className={`font-medium ${currentPeriodCosts.revenueImpact >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {formatCurrency(currentPeriodCosts.revenueImpact)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-surface-700">
                            <span className="text-gray-600">Cost Impact</span>
                            <span className={`font-medium ${currentPeriodCosts.costImpact >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {formatCurrency(currentPeriodCosts.costImpact)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600">Cash Impact</span>
                            <span className={`font-medium ${currentPeriodCosts.cashImpact >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {formatCurrency(currentPeriodCosts.cashImpact)}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* FX Variance Analysis */}
            <Card variant="glass" padding="md">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">FX Variance vs Budget ({impactAnalysis.period})</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-gray-200 dark:border-surface-700">
                            <th className="text-left py-2 px-2 text-gray-500 font-medium">Currency</th>
                            <th className="text-right py-2 px-2 text-gray-500 font-medium">Budget Rate</th>
                            <th className="text-right py-2 px-2 text-gray-500 font-medium">Actual Rate</th>
                            <th className="text-right py-2 px-2 text-gray-500 font-medium">Variance</th>
                            <th className="text-right py-2 px-2 text-gray-500 font-medium">Exposure</th>
                            <th className="text-right py-2 px-2 text-gray-500 font-medium">FX Impact</th>
                        </tr>
                        </thead>
                        <tbody>
                        {impactAnalysis.impactByCurrency.map((item) => (
                            <tr key={item.currency} className="border-b border-gray-100 dark:border-surface-800">
                                <td className="py-2 px-2 font-medium">{item.currency}</td>
                                <td className="py-2 px-2 text-right">{item.budgetRate?.toFixed(4) ?? '—'}</td>
                                <td className="py-2 px-2 text-right">{item.actualRate?.toFixed(4) ?? '—'}</td>
                                <td className={`py-2 px-2 text-right ${item.rateVariance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatPercent(item.rateVariance)}
                                </td>
                                <td className="py-2 px-2 text-right">{formatCurrency(item.volumeExposed)}</td>
                                <td className={`py-2 px-2 text-right font-medium ${item.fxImpact >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatCurrency(item.fxImpact)}
                                </td>
                            </tr>
                        ))}
                        <tr className="bg-gray-50 dark:bg-surface-800 font-semibold">
                            <td className="py-2 px-2" colSpan={5}>Total Net FX Impact</td>
                            <td className={`py-2 px-2 text-right ${impactAnalysis.netFXImpact >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {formatCurrency(impactAnalysis.netFXImpact)}
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                    Reference rate: {currentPeriodCosts.referenceRateUsed} • Calculation: {currentPeriodCosts.calculationMethod}
                </p>
            </Card>
        </div>
    );
}

// =============================================================================
// RISK & SCENARIOS SECTION
// =============================================================================

// =============================================================================
// MONTE CARLO SIMULATION SECTION
// =============================================================================

function MonteCarloSection() {
    const { dashboard } = useFXStore();
    const [baseCurrency, setBaseCurrency] = useState('EUR');
    const [quoteCurrency, setQuoteCurrency] = useState('USD');
    const [currentRate, setCurrentRate] = useState(1.08);
    const [timeHorizon, setTimeHorizon] = useState(30);
    const [numSimulations, setNumSimulations] = useState(1000);
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<MonteCarloResult | null>(null);
    const [analysis, setAnalysis] = useState<ScenarioAnalysis | null>(null);

    // Update rate from dashboard if available
    useEffect(() => {
        if (dashboard?.currentRates) {
            const rate = dashboard.currentRates.find(
                r => r.baseCurrency === baseCurrency && r.quoteCurrency === quoteCurrency
            );
            if (rate) setCurrentRate(rate.midRate);
        }
    }, [baseCurrency, quoteCurrency, dashboard?.currentRates]);

    const runSimulation = () => {
        setIsRunning(true);

        // Use setTimeout to allow UI to update
        setTimeout(() => {
            const volatility = getDefaultVolatility(baseCurrency, quoteCurrency);
            const mcResult = runMonteCarloGBM({
                currentRate,
                annualVolatility: volatility,
                annualDrift: 0, // Assume no drift for FX
                timeHorizonDays: timeHorizon,
                numSimulations,
                numSteps: Math.min(timeHorizon, 100),
            });

            const scenarioAnalysis = generateScenarioAnalysis(
                mcResult,
                baseCurrency,
                quoteCurrency,
                currentRate,
                timeHorizon
            );

            setResult(mcResult);
            setAnalysis(scenarioAnalysis);
            setIsRunning(false);
            toast.success('Monte Carlo simulation completed');
        }, 100);
    };

    return (
        <Card variant="glass" padding="md">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity size={16} className="text-purple-500" />
                    Monte Carlo Simulation (GBM)
                </h3>
                <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                    Stochastic Model
                </span>
            </div>

            {/* Configuration */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div>
                    <label className="text-xs text-gray-500 block mb-1">Base Currency</label>
                    <select
                        value={baseCurrency}
                        onChange={(e) => setBaseCurrency(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-lg"
                    >
                        {MAJOR_CURRENCIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-gray-500 block mb-1">Quote Currency</label>
                    <select
                        value={quoteCurrency}
                        onChange={(e) => setQuoteCurrency(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-lg"
                    >
                        {MAJOR_CURRENCIES.filter(c => c !== baseCurrency).map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-gray-500 block mb-1">Current Rate</label>
                    <input
                        type="number"
                        value={currentRate}
                        onChange={(e) => setCurrentRate(parseFloat(e.target.value) || 1)}
                        step="0.0001"
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-lg"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500 block mb-1">Time Horizon (Days)</label>
                    <select
                        value={timeHorizon}
                        onChange={(e) => setTimeHorizon(parseInt(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-lg"
                    >
                        <option value={7}>1 Week</option>
                        <option value={30}>1 Month</option>
                        <option value={90}>3 Months</option>
                        <option value={180}>6 Months</option>
                        <option value={365}>1 Year</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs text-gray-500 block mb-1">Simulations</label>
                    <select
                        value={numSimulations}
                        onChange={(e) => setNumSimulations(parseInt(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-lg"
                    >
                        <option value={100}>100</option>
                        <option value={500}>500</option>
                        <option value={1000}>1,000</option>
                        <option value={5000}>5,000</option>
                        <option value={10000}>10,000</option>
                    </select>
                </div>
            </div>

            <Button
                variant="primary"
                onClick={runSimulation}
                disabled={isRunning}
                leftIcon={isRunning ? <RefreshCw size={16} className="animate-spin" /> : <Activity size={16} />}
            >
                {isRunning ? 'Running Simulation...' : 'Run Monte Carlo'}
            </Button>

            {/* Results */}
            {analysis && result && (
                <div className="mt-4 space-y-4">
                    {/* Scenario Outcomes */}
                    <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                            Projected Rate Scenarios ({analysis.timeHorizon})
                        </h4>
                        <div className="space-y-2">
                            {analysis.scenarios.map((scenario, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-700">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2 h-2 rounded-full ${
                                            scenario.changePercent > 2 ? 'bg-emerald-500' :
                                            scenario.changePercent > 0 ? 'bg-green-400' :
                                            scenario.changePercent > -2 ? 'bg-amber-500' : 'bg-red-500'
                                        }`} />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{scenario.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {scenario.rate.toFixed(4)}
                                        </span>
                                        <span className={`text-sm font-medium ${
                                            scenario.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'
                                        }`}>
                                            {scenario.changePercent >= 0 ? '+' : ''}{scenario.changePercent.toFixed(2)}%
                                        </span>
                                        <span className="text-xs text-gray-500 w-12 text-right">{scenario.probability}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Risk Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wider">VaR (95%)</p>
                            <p className="text-lg font-bold text-red-700 dark:text-red-300">
                                {analysis.riskMetrics.var95.toFixed(4)}
                            </p>
                            <p className="text-xs text-red-500">Max loss 5% chance</p>
                        </div>
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <p className="text-xs text-orange-600 dark:text-orange-400 uppercase tracking-wider">VaR (99%)</p>
                            <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                                {analysis.riskMetrics.var99.toFixed(4)}
                            </p>
                            <p className="text-xs text-orange-500">Max loss 1% chance</p>
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <p className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider">Expected Shortfall</p>
                            <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                                {analysis.riskMetrics.expectedShortfall.toFixed(4)}
                            </p>
                            <p className="text-xs text-purple-500">Avg worst 5%</p>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-surface-800 rounded-lg">
                            <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Max Drawdown</p>
                            <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                                {analysis.riskMetrics.maxDrawdown.toFixed(4)}
                            </p>
                            <p className="text-xs text-gray-500">Worst case drop</p>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Distribution Statistics</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Mean</p>
                                <p className="font-medium text-gray-900 dark:text-white">{result.statistics.mean.toFixed(4)}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Median</p>
                                <p className="font-medium text-gray-900 dark:text-white">{result.statistics.median.toFixed(4)}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Std Dev</p>
                                <p className="font-medium text-gray-900 dark:text-white">{result.statistics.standardDeviation.toFixed(4)}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Range</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {result.statistics.min.toFixed(4)} - {result.statistics.max.toFixed(4)}
                                </p>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-surface-700">
                            <p className="text-xs text-gray-500">
                                95% CI: [{result.confidenceIntervals.ci95[0].toFixed(4)}, {result.confidenceIntervals.ci95[1].toFixed(4)}]
                                &nbsp;|&nbsp;
                                Volatility used: {(getDefaultVolatility(baseCurrency, quoteCurrency) * 100).toFixed(1)}% annual
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {!result && (
                <p className="text-xs text-gray-500 mt-3">
                    Run a simulation to generate probabilistic FX rate forecasts using Geometric Brownian Motion (GBM).
                    Results show potential rate outcomes with associated probabilities and risk metrics.
                </p>
            )}
        </Card>
    );
}

function RiskScenariosSection() {
    const { dashboard } = useFXStore();
    const riskSummary = dashboard?.riskSummary;
    const activeScenarios = dashboard?.activeScenarios ?? [];

    if (!riskSummary) return null;

    return (
        <div className="space-y-4">
            <SectionHeader title="FX Risk & Scenarios" icon={AlertTriangle} />

            {/* Monte Carlo Section */}
            <MonteCarloSection />

            {/* Risk Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Overall Risk</p>
                    <div className="flex items-center gap-2 mt-2">
                        <div className={`w-3 h-3 rounded-full ${getRiskBadgeColor(riskSummary.overallRiskLevel)}`} />
                        <span className="text-xl font-bold capitalize">{riskSummary.overallRiskLevel}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Score: {riskSummary.riskScore}/100</p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Unhedged</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{riskSummary.unhedgedExposurePercent?.toFixed(1) ?? '—'}%</p>
                    <p className="text-xs text-gray-500 mt-1">Of total exposure</p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Avg Volatility</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{riskSummary.averageVolatility?.toFixed(1) ?? '—'}%</p>
                    <p className="text-xs text-gray-500 mt-1">30-day weighted</p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Active Alerts</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{riskSummary.activeAlerts}</p>
                    <p className="text-xs text-gray-500 mt-1">{riskSummary.criticalAlerts} critical</p>
                </Card>
            </div>

            {/* Risk Indicators */}
            <Card variant="glass" padding="md">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Risk Indicators</h3>
                <div className="space-y-3">
                    {riskSummary.indicators.map((indicator) => (
                        <div key={indicator.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-surface-800 rounded-lg">
                            <div className={`w-2 h-2 rounded-full mt-1.5 ${getRiskBadgeColor(indicator.riskLevel)}`} />
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{indicator.title}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRiskColor(indicator.riskLevel)}`}>
                                        {indicator.riskLevel}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{indicator.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs">
                                    <span className="text-gray-500">Metric: <span className="font-medium text-gray-700 dark:text-gray-300">{indicator.metric?.toFixed(1) ?? '—'}%</span></span>
                                    <span className="text-gray-500">Threshold: <span className="font-medium text-gray-700 dark:text-gray-300">{indicator.threshold ?? '—'}%</span></span>
                                    {indicator.breached && <span className="text-red-600 font-medium">⚠ Breached</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Scenarios */}
            <Card variant="glass" padding="md">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Scenario Analysis</h3>
                    <span className="px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-700">Hypothetical</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {activeScenarios.map((scenario) => (
                        <div key={scenario.id} className="p-4 border border-gray-200 dark:border-surface-700 rounded-xl">
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-sm">{scenario.name}</h4>
                                <span className={`px-1.5 py-0.5 text-xs rounded ${
                                    scenario.severity === 'mild' ? 'bg-emerald-100 text-emerald-700' :
                                        scenario.severity === 'moderate' ? 'bg-amber-100 text-amber-700' :
                                            'bg-red-100 text-red-700'
                                }`}>
                                    {scenario.severity}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">{scenario.description}</p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Exposure Impact</span>
                                    <span className={`font-medium ${scenario.totalExposureImpact >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {formatCurrency(scenario.totalExposureImpact)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Revenue Impact</span>
                                    <span className={`font-medium ${scenario.revenueImpact >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {formatCurrency(scenario.revenueImpact)}
                                    </span>
                                </div>
                                {scenario.probability && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Est. Probability</span>
                                        <span className="font-medium">{scenario.probability}%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
                    <Info size={12} />
                    Scenario analysis is hypothetical and does not predict future market movements.
                </p>
            </Card>
        </div>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function FXPage() {
    const { dashboard, refreshDashboard, isLoading, fetchDashboard } = useFXStore();
    const [activeTab, setActiveTab] = useState<'rates' | 'exposure' | 'conversions' | 'costs' | 'risk'>('exposure');

    // Fetch dashboard on mount
    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/10 border border-emerald-500/20">
                            <Globe className="w-6 h-6 text-emerald-500" />
                        </div>
                        FX Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Currency exposure, conversions, and FX risk oversight</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Lock size={14} className="text-blue-600" />
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Read-Only</span>
                    </div>
                    <div className="px-3 py-1.5 bg-gray-100 dark:bg-surface-800 rounded-lg">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Base: {dashboard?.baseCurrency || 'EUR'}</span>
                    </div>
                    <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />} onClick={refreshDashboard} disabled={isLoading}>
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Last Updated */}
            {dashboard && (
                <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-surface-800 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock size={14} />
                        <span>Last data refresh: {new Date(dashboard.lastDataRefresh).toLocaleString()}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        dashboard.dataQuality === 'complete' ? 'bg-emerald-100 text-emerald-700' :
                            dashboard.dataQuality === 'partial' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                    }`}>
                        Data: {dashboard.dataQuality}
                    </span>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-surface-800 rounded-xl overflow-x-auto">
                {[
                    { id: 'rates', label: 'FX Rates', icon: Globe },
                    { id: 'exposure', label: 'Exposure', icon: PieChart },
                    { id: 'conversions', label: 'Conversions', icon: ArrowRightLeft },
                    { id: 'costs', label: 'Costs & Impact', icon: Calculator },
                    { id: 'risk', label: 'Risk & Scenarios', icon: AlertTriangle },
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-white dark:bg-surface-900 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                            }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {activeTab === 'rates' && <CurrentRatesSection />}
                {activeTab === 'exposure' && <ExposureOverviewSection />}
                {activeTab === 'conversions' && <ConversionsSection />}
                {activeTab === 'costs' && <CostsImpactSection />}
                {activeTab === 'risk' && <RiskScenariosSection />}
            </motion.div>

            {/* Disclaimers */}
            <Card variant="glass" padding="sm">
                <div className="flex items-start gap-2">
                    <Info size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-500">
                        {dashboard?.disclaimers?.[0] || ''} This module provides decision-support only. No trading or hedging execution.
                    </p>
                </div>
            </Card>
        </div>
    );
}