'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Droplets,
    TrendingUp,
    TrendingDown,
    Minus,
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Info,
    RefreshCw,
    ChevronRight,
    ChevronDown,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    LineChart,
    Shield,
    Eye,
    Layers,
    Target,
    Activity,
    Wallet,
    ArrowRight,
    CircleDot,
    HelpCircle,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useLiquidityStore } from '@/store/liquidity-store';
import type {
    TimelinePeriod,
    CashflowItem,
    LiquidityScenario,
    ConfidenceStatus,
    ScenarioType,
    LiquidityRiskLevel,
    CashflowCategory
} from '@/types/liquidity';
import { TIME_BUCKETS, HORIZON_OPTIONS, SCENARIO_TYPES, CONFIDENCE_STATUSES, CASHFLOW_CATEGORIES } from '@/types/liquidity';

// =============================================================================
// UTILITIES
// =============================================================================

const formatCurrency = (value: number | undefined | null, currency: string = 'USD'): string => {
    if (value === undefined || value === null) return '—';
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (absValue >= 1000000) return `${sign}$${(absValue / 1000000).toFixed(2)}M`;
    if (absValue >= 1000) return `${sign}$${(absValue / 1000).toFixed(0)}K`;
    return `${sign}$${absValue.toLocaleString()}`;
};

const getConfidenceColor = (confidence: ConfidenceStatus): string => {
    const colors: Record<ConfidenceStatus, string> = {
        confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        expected: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        estimated: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return colors[confidence];
};

const getRiskColor = (level: LiquidityRiskLevel): string => {
    const colors: Record<LiquidityRiskLevel, string> = {
        low: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
        moderate: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
        elevated: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
        high: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
        critical: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    };
    return colors[level];
};

const getRiskBadge = (level: LiquidityRiskLevel): string => {
    const colors: Record<LiquidityRiskLevel, string> = {
        low: 'bg-emerald-500',
        moderate: 'bg-blue-500',
        elevated: 'bg-amber-500',
        high: 'bg-orange-500',
        critical: 'bg-red-500',
    };
    return colors[level];
};

// =============================================================================
// POSITION OVERVIEW
// =============================================================================

function PositionOverview() {
    const { dashboard } = useLiquidityStore();

    if (!dashboard) {
        return <div className="p-4 text-gray-500">Loading dashboard...</div>;
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card variant="glass" padding="md">
                <div className="flex items-center gap-2 mb-2">
                    <Wallet size={16} className="text-blue-500" />
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Current Cash</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(dashboard.currentCashBalance)}</p>
                <p className="text-xs text-gray-500 mt-1">As of {new Date(dashboard.dataAsOf).toLocaleDateString()}</p>
            </Card>

            <Card variant="glass" padding="md">
                <div className="flex items-center gap-2 mb-2">
                    <Target size={16} className="text-amber-500" />
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Minimum Buffer</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(dashboard.minimumBuffer)}</p>
                <p className="text-xs text-gray-500 mt-1">Policy requirement</p>
            </Card>

            <Card variant="glass" padding="md">
                <div className="flex items-center gap-2 mb-2">
                    <Activity size={16} className="text-emerald-500" />
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Available Liquidity</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(dashboard.availableLiquidity)}</p>
                <p className="text-xs text-gray-500 mt-1">Above minimum buffer</p>
            </Card>

            <Card variant="glass" padding="md">
                <div className="flex items-center gap-2 mb-2">
                    <Shield size={16} className="text-purple-500" />
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Risk Level</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <div className={`w-3 h-3 rounded-full ${getRiskBadge(dashboard.riskSummary?.overallRisk ?? 'low')}`} />
                    <span className="text-xl font-bold capitalize">{dashboard.riskSummary?.overallRisk ?? 'Unknown'}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Score: {dashboard.riskSummary?.riskScore ?? 0}/100</p>
            </Card>
        </div>
    );
}

// =============================================================================
// SCENARIO SELECTOR
// =============================================================================

function ScenarioSelector() {
    const { selectedScenarioId, selectScenario, dashboard } = useLiquidityStore();
    const [selectedType, setSelectedType] = useState<ScenarioType>('base');

    if (!dashboard) {
        return <div className="p-4 text-gray-500">Loading scenarios...</div>;
    }

    const scenarios = [
        { type: 'base' as ScenarioType, scenario: dashboard.baseScenario },
        { type: 'conservative' as ScenarioType, scenario: dashboard.conservativeScenario },
        { type: 'stress' as ScenarioType, scenario: dashboard.stressScenario },
    ];

    return (
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-surface-800 rounded-xl">
            {scenarios.map(({ type, scenario }) => (
                <button
                    key={type}
                    onClick={() => {
                        setSelectedType(type);
                        if (scenario?.id) selectScenario(scenario.id);
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedType === type
                            ? 'bg-white dark:bg-surface-900 shadow-sm text-gray-900 dark:text-white'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                >
                    <span>{scenario?.name ?? type}</span>
                    {scenario?.varianceVsBase && selectedType !== 'base' && selectedType === type && (
                        <span className={`ml-2 text-xs ${scenario.varianceVsBase.endingBalanceDiff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            ({scenario.varianceVsBase.endingBalanceDiff >= 0 ? '+' : ''}{formatCurrency(scenario.varianceVsBase.endingBalanceDiff)})
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}

// =============================================================================
// TIMELINE CHART
// =============================================================================

function TimelineChart() {
    const { dashboard } = useLiquidityStore();

    if (!dashboard?.baseScenario?.timeline) {
        return <div className="p-4 text-gray-500">Loading timeline...</div>;
    }

    const timeline = dashboard.baseScenario.timeline;

    const maxBalance = Math.max(...timeline.periods.map((p: { closingBalance: number }) => p.closingBalance), timeline.currentCashBalance);
    const minBalance = Math.min(...timeline.periods.map((p: { closingBalance: number }) => p.closingBalance), 0);
    const range = maxBalance - minBalance;

    const getBarHeight = (value: number): number => {
        return ((value - minBalance) / range) * 100;
    };

    return (
        <Card variant="glass" padding="md">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <LineChart size={18} />
                    Cash Balance Timeline
                </h3>
                <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-blue-500" />
                        Closing Balance
                    </span>
                    <span className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-red-300" />
                        Below Buffer
                    </span>
                    <span className="flex items-center gap-1">
                        <div className="w-px h-3 bg-amber-500" style={{ width: 2 }} />
                        Min Buffer
                    </span>
                </div>
            </div>

            {/* Chart */}
            <div className="relative h-64">
                {/* Buffer line */}
                <div
                    className="absolute left-0 right-0 border-t-2 border-dashed border-amber-500 z-10"
                    style={{ bottom: `${getBarHeight(dashboard.minimumBuffer)}%` }}
                >
                    <span className="absolute -top-5 right-0 text-xs text-amber-600 bg-white dark:bg-surface-900 px-1">
                        Min Buffer
                    </span>
                </div>

                {/* Zero line if needed */}
                {minBalance < 0 && (
                    <div
                        className="absolute left-0 right-0 border-t border-red-500 z-10"
                        style={{ bottom: `${getBarHeight(0)}%` }}
                    />
                )}

                {/* Bars */}
                <div className="absolute inset-0 flex items-end gap-1 pb-6">
                    {timeline.periods.map((period, index) => {
                        const height = getBarHeight(period.closingBalance);
                        const isNegative = period.closingBalance < 0;
                        const isBelowBuffer = period.closingBalance < dashboard.minimumBuffer;

                        return (
                            <div key={period.id} className="flex-1 flex flex-col items-center group relative">
                                <div
                                    className={`w-full rounded-t transition-all ${
                                        isNegative ? 'bg-red-500' : isBelowBuffer ? 'bg-red-300' : 'bg-blue-500'
                                    } hover:opacity-80`}
                                    style={{ height: `${Math.max(height, 2)}%` }}
                                />

                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 hidden group-hover:block z-20">
                                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                                        <p className="font-medium">{period.label}</p>
                                        <p>Balance: {formatCurrency(period.closingBalance)}</p>
                                        <p className="text-emerald-400">+{formatCurrency(period.totalInflows)}</p>
                                        <p className="text-red-400">-{formatCurrency(period.totalOutflows)}</p>
                                    </div>
                                </div>

                                {/* Label */}
                                <span className="absolute -bottom-5 text-xs text-gray-500 transform -rotate-45 origin-left whitespace-nowrap">
                                    {period.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-4 mt-8 pt-4 border-t border-gray-200 dark:border-surface-700">
                <div>
                    <p className="text-xs text-gray-500">Total Inflows</p>
                    <p className="font-semibold text-emerald-600">{formatCurrency(timeline.totalInflows)}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Total Outflows</p>
                    <p className="font-semibold text-red-600">{formatCurrency(timeline.totalOutflows)}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Net Change</p>
                    <p className={`font-semibold ${timeline.netChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(timeline.netChange)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Lowest Balance</p>
                    <p className={`font-semibold ${timeline.lowestBalance >= dashboard.minimumBuffer ? 'text-gray-900 dark:text-white' : 'text-red-600'}`}>
                        {formatCurrency(timeline.lowestBalance)}
                    </p>
                </div>
            </div>
        </Card>
    );
}

// =============================================================================
// INFLOWS / OUTFLOWS BREAKDOWN
// =============================================================================

function CashflowBreakdown() {
    const { dashboard, cashflows } = useLiquidityStore();
    const [showDetails, setShowDetails] = useState(false);

    if (!dashboard?.baseScenario?.timeline) {
        return <div className="p-4 text-gray-500">Loading cashflow data...</div>;
    }

    const timeline = dashboard.baseScenario.timeline;

    // Aggregate by category
    const inflowCategories = CASHFLOW_CATEGORIES.filter((c) => c.type === 'inflow');
    const outflowCategories = CASHFLOW_CATEGORIES.filter((c) => c.type === 'outflow');

    const aggregateByCategory = (type: 'inflow' | 'outflow') => {
        const categories = type === 'inflow' ? inflowCategories : outflowCategories;
        return categories.map((cat) => {
            const items = cashflows.filter((i: CashflowItem) => i.category === cat.value);
            const total = items.reduce((sum: number, i: CashflowItem) => sum + i.amount, 0);
            const confirmed = items.filter((i: CashflowItem) => i.confidence === 'confirmed').reduce((sum: number, i: CashflowItem) => sum + i.amount, 0);
            const expected = items.filter((i: CashflowItem) => i.confidence === 'expected').reduce((sum: number, i: CashflowItem) => sum + i.amount, 0);
            const estimated = items.filter((i: CashflowItem) => i.confidence === 'estimated').reduce((sum: number, i: CashflowItem) => sum + i.amount, 0);
            return { ...cat, total, confirmed, expected, estimated, itemCount: items.length };
        }).filter((c) => c.total > 0);
    };

    const inflowData = aggregateByCategory('inflow');
    const outflowData = aggregateByCategory('outflow');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Inflows */}
            <Card variant="glass" padding="md">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <ArrowDownRight size={18} className="text-emerald-500" />
                    Expected Inflows
                    <span className="ml-auto text-emerald-600 font-bold">{formatCurrency(timeline.totalInflows)}</span>
                </h3>

                <div className="space-y-3">
                    {inflowData.map((cat) => (
                        <div key={cat.value} className="p-3 bg-gray-50 dark:bg-surface-800 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{cat.label}</span>
                                <span className="font-semibold text-emerald-600">{formatCurrency(cat.total)}</span>
                            </div>
                            <div className="flex gap-2">
                                {cat.confirmed > 0 && (
                                    <span className={`px-2 py-0.5 rounded text-xs ${getConfidenceColor('confirmed')}`}>
                                        Confirmed: {formatCurrency(cat.confirmed)}
                                    </span>
                                )}
                                {cat.expected > 0 && (
                                    <span className={`px-2 py-0.5 rounded text-xs ${getConfidenceColor('expected')}`}>
                                        Expected: {formatCurrency(cat.expected)}
                                    </span>
                                )}
                                {cat.estimated > 0 && (
                                    <span className={`px-2 py-0.5 rounded text-xs ${getConfidenceColor('estimated')}`}>
                                        Estimated: {formatCurrency(cat.estimated)}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Confidence Summary */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-surface-700">
                    <p className="text-xs text-gray-500 mb-2">Confidence Breakdown</p>
                    <div className="flex gap-2">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden flex">
                            <div className="bg-emerald-500 h-full" style={{ width: `${(timeline.confirmedCashflows / (timeline.totalInflows + timeline.totalOutflows)) * 100}%` }} />
                            <div className="bg-blue-500 h-full" style={{ width: `${(timeline.expectedCashflows / (timeline.totalInflows + timeline.totalOutflows)) * 100}%` }} />
                            <div className="bg-amber-500 h-full" style={{ width: `${(timeline.estimatedCashflows / (timeline.totalInflows + timeline.totalOutflows)) * 100}%` }} />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Outflows */}
            <Card variant="glass" padding="md">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <ArrowUpRight size={18} className="text-red-500" />
                    Expected Outflows
                    <span className="ml-auto text-red-600 font-bold">{formatCurrency(timeline.totalOutflows)}</span>
                </h3>

                <div className="space-y-3">
                    {outflowData.map((cat) => (
                        <div key={cat.value} className="p-3 bg-gray-50 dark:bg-surface-800 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{cat.label}</span>
                                <span className="font-semibold text-red-600">{formatCurrency(cat.total)}</span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {cat.confirmed > 0 && (
                                    <span className={`px-2 py-0.5 rounded text-xs ${getConfidenceColor('confirmed')}`}>
                                        Confirmed: {formatCurrency(cat.confirmed)}
                                    </span>
                                )}
                                {cat.expected > 0 && (
                                    <span className={`px-2 py-0.5 rounded text-xs ${getConfidenceColor('expected')}`}>
                                        Expected: {formatCurrency(cat.expected)}
                                    </span>
                                )}
                                {cat.estimated > 0 && (
                                    <span className={`px-2 py-0.5 rounded text-xs ${getConfidenceColor('estimated')}`}>
                                        Estimated: {formatCurrency(cat.estimated)}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

// =============================================================================
// SCENARIO COMPARISON
// =============================================================================

function ScenarioComparison() {
    const { dashboard } = useLiquidityStore();

    if (!dashboard) {
        return <div className="p-4 text-gray-500">Loading scenario comparison...</div>;
    }

    const scenarios = [
        { name: 'Base Case', data: dashboard.baseScenario, color: 'blue' },
        { name: 'Conservative', data: dashboard.conservativeScenario, color: 'amber' },
        { name: 'Stress Test', data: dashboard.stressScenario, color: 'red' },
    ].filter(s => s.data?.timeline);

    if (scenarios.length === 0) {
        return (
            <Card variant="glass" padding="md">
                <div className="text-center py-8 text-gray-500">No scenario data available</div>
            </Card>
        );
    }

    return (
        <Card variant="glass" padding="md">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Layers size={18} />
                Scenario Comparison
                <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">Hypothetical</span>
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="border-b border-gray-200 dark:border-surface-700">
                        <th className="text-left py-3 px-2">Metric</th>
                        {scenarios.map((s) => (
                            <th key={s.name} className="text-right py-3 px-2">{s.name}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    <tr className="border-b border-gray-100 dark:border-surface-800">
                        <td className="py-3 px-2 text-gray-600">Ending Balance</td>
                        {scenarios.map((s) => (
                            <td key={s.name} className="py-3 px-2 text-right font-medium">
                                {formatCurrency(s.data?.timeline?.endingBalance)}
                            </td>
                        ))}
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-surface-800">
                        <td className="py-3 px-2 text-gray-600">Lowest Balance</td>
                        {scenarios.map((s) => (
                            <td key={s.name} className={`py-3 px-2 text-right font-medium ${(s.data?.timeline?.lowestBalance ?? 0) < dashboard.minimumBuffer ? 'text-red-600' : ''}`}>
                                {formatCurrency(s.data?.timeline?.lowestBalance)}
                            </td>
                        ))}
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-surface-800">
                        <td className="py-3 px-2 text-gray-600">Net Change</td>
                        {scenarios.map((s) => (
                            <td key={s.name} className={`py-3 px-2 text-right font-medium ${(s.data?.timeline?.netChange ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {formatCurrency(s.data?.timeline?.netChange)}
                            </td>
                        ))}
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-surface-800">
                        <td className="py-3 px-2 text-gray-600">Days Below Buffer</td>
                        {scenarios.map((s) => (
                            <td key={s.name} className={`py-3 px-2 text-right font-medium ${(s.data?.timeline?.daysWithGap ?? 0) > 0 ? 'text-red-600' : ''}`}>
                                {s.data?.timeline?.daysWithGap ?? '—'}
                            </td>
                        ))}
                    </tr>
                    <tr>
                        <td className="py-3 px-2 text-gray-600">Variance vs Base</td>
                        <td className="py-3 px-2 text-right text-gray-400">—</td>
                        {[dashboard.conservativeScenario, dashboard.stressScenario].filter(s => s?.id).map((s) => (
                            <td key={s.id} className={`py-3 px-2 text-right font-medium ${(s.varianceVsBase?.endingBalanceDiff || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {s.varianceVsBase ? formatCurrency(s.varianceVsBase.endingBalanceDiff) : '—'}
                            </td>
                        ))}
                    </tr>
                    </tbody>
                </table>
            </div>

            {/* Assumptions */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-surface-700">
                <button
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    onClick={() => {}}
                >
                    <Info size={12} />
                    View scenario assumptions
                </button>
            </div>
        </Card>
    );
}

// =============================================================================
// RISK SIGNALS
// =============================================================================

function RiskSignals() {
    const { dashboard } = useLiquidityStore();

    if (!dashboard?.riskSummary) {
        return <div className="p-4 text-gray-500">Loading risk signals...</div>;
    }

    const { riskSummary } = dashboard;

    return (
        <Card variant="glass" padding="md">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <AlertTriangle size={18} />
                Liquidity Risk Signals
            </h3>

            <div className="space-y-3">
                {riskSummary.signals.map((signal) => (
                    <div key={signal.id} className="p-3 bg-gray-50 dark:bg-surface-800 rounded-lg flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${getRiskBadge(signal.riskLevel)}`} />
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{signal.title}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRiskColor(signal.riskLevel)}`}>
                                    {signal.riskLevel}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{signal.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs">
                                <span className="text-gray-500">
                                    Metric: <span className="font-medium text-gray-700 dark:text-gray-300">{signal.metric?.toFixed(1) ?? '—'}%</span>
                                </span>
                                <span className="text-gray-500">
                                    Threshold: <span className="font-medium text-gray-700 dark:text-gray-300">{signal.threshold ?? '—'}%</span>
                                </span>
                                {signal.breached && <span className="text-red-600 font-medium">⚠ Breached</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {riskSummary.signals.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                    <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
                    <p>No risk signals detected</p>
                </div>
            )}
        </Card>
    );
}

// =============================================================================
// CONFIDENCE BANDS
// =============================================================================

function ConfidenceBandsSection() {
    const { dashboard } = useLiquidityStore();

    if (!dashboard) {
        return <div className="p-4 text-gray-500">Loading confidence bands...</div>;
    }

    return (
        <Card variant="glass" padding="md">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Activity size={18} />
                Confidence Bands
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="border-b border-gray-200 dark:border-surface-700">
                        <th className="text-left py-2 px-2">Period</th>
                        <th className="text-right py-2 px-2">Low Estimate</th>
                        <th className="text-right py-2 px-2">Base Estimate</th>
                        <th className="text-right py-2 px-2">High Estimate</th>
                        <th className="text-center py-2 px-2">Confidence</th>
                    </tr>
                    </thead>
                    <tbody>
                    {dashboard.confidenceBands.slice(0, 8).map((band) => (
                        <tr key={band.periodId} className="border-b border-gray-100 dark:border-surface-800">
                            <td className="py-2 px-2 font-medium">{band.periodLabel}</td>
                            <td className="py-2 px-2 text-right text-red-600">{formatCurrency(band.lowEstimate)}</td>
                            <td className="py-2 px-2 text-right font-medium">{formatCurrency(band.baseEstimate)}</td>
                            <td className="py-2 px-2 text-right text-emerald-600">{formatCurrency(band.highEstimate)}</td>
                            <td className="py-2 px-2 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        band.confidence >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                            band.confidence >= 60 ? 'bg-blue-100 text-blue-700' :
                                                'bg-amber-100 text-amber-700'
                                    }`}>
                                        {band.confidence}%
                                    </span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-gray-500 mt-4">
                Confidence decreases for periods further in the future due to higher uncertainty in estimated cashflows.
            </p>
        </Card>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function LiquidityPage() {
    const { t } = useThemeStore();
    const { dashboard, refreshDashboard, isLoading, timeBucket, setTimeBucket, horizonDays, setHorizonDays, fetchDashboard } = useLiquidityStore();
    const [activeTab, setActiveTab] = useState<'timeline' | 'scenarios' | 'risk'>('timeline');

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    if (!dashboard) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading liquidity dashboard...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-500/20">
                            <Droplets className="w-6 h-6 text-cyan-500" />
                        </div>
                        Liquidity & Cashflow
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Short-term and medium-term liquidity analysis</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <select
                            value={timeBucket}
                            onChange={(e) => setTimeBucket(e.target.value as any)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                        >
                            {TIME_BUCKETS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                        </select>
                        <select
                            value={horizonDays}
                            onChange={(e) => setHorizonDays(Number(e.target.value))}
                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                        >
                            {HORIZON_OPTIONS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Eye size={14} className="text-blue-600" />
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Read-Only</span>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />}
                        onClick={refreshDashboard}
                        disabled={isLoading}
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-surface-800 rounded-lg">
                <Clock size={14} className="text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    Last refresh: {new Date(dashboard.lastRefresh).toLocaleString()} • Data as of: {new Date(dashboard.dataAsOf).toLocaleString()}
                </span>
                <span className="ml-auto px-2 py-0.5 text-xs rounded bg-emerald-100 text-emerald-700">
                    {dashboard.dataCompleteness}% Complete
                </span>
            </div>

            {/* Position Overview */}
            <PositionOverview />

            {/* Scenario Selector */}
            <ScenarioSelector />

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-surface-800 rounded-xl">
                {[
                    { id: 'timeline', label: 'Timeline & Cashflows', icon: LineChart },
                    { id: 'scenarios', label: 'Scenario Analysis', icon: Layers },
                    { id: 'risk', label: 'Risk & Confidence', icon: AlertTriangle },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                            activeTab === tab.id
                                ? 'bg-white dark:bg-surface-900 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                        }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
            >
                {activeTab === 'timeline' && (
                    <>
                        <TimelineChart />
                        <CashflowBreakdown />
                    </>
                )}

                {activeTab === 'scenarios' && (
                    <>
                        <ScenarioComparison />
                        <Card variant="glass" padding="md">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Info size={16} />
                                Scenario Assumptions
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { name: 'Base Case', assumptions: 'Current expectations, no adjustments' },
                                    { name: 'Conservative', assumptions: 'Inflows delayed 7 days, reduced 10%. Outflows accelerated 3 days, increased 5%.' },
                                    { name: 'Stress Test', assumptions: 'Inflows delayed 14 days, reduced 25%. Outflows accelerated 7 days, increased 15%. Estimated items excluded.' },
                                ].map((s) => (
                                    <div key={s.name} className="p-3 bg-gray-50 dark:bg-surface-800 rounded-lg">
                                        <p className="font-medium text-sm mb-1">{s.name}</p>
                                        <p className="text-xs text-gray-500">{s.assumptions}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-4 italic">
                                All scenarios are hypothetical and based on stated assumptions. They do not predict actual outcomes.
                            </p>
                        </Card>
                    </>
                )}

                {activeTab === 'risk' && (
                    <>
                        <RiskSignals />
                        <ConfidenceBandsSection />

                        {/* Known Blind Spots */}
                        <Card variant="glass" padding="md">
                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                                <HelpCircle size={18} />
                                Known Blind Spots
                            </h3>
                            <ul className="space-y-2">
                                {dashboard.knownBlindSpots.map((spot, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <CircleDot size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                        {spot}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </>
                )}
            </motion.div>

            {/* Disclaimers */}
            <Card variant="glass" padding="sm">
                <div className="flex items-start gap-2">
                    <Info size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-500">
                        {dashboard.disclaimers[0]} {dashboard.disclaimers[1]}
                    </p>
                </div>
            </Card>
        </div>
    );
}