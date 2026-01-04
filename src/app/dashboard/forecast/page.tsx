'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Wallet,
    PiggyBank,
    BarChart3,
    LineChart,
    PieChart,
    Calendar,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    AlertCircle,
    AlertOctagon,
    CheckCircle2,
    Clock,
    RefreshCw,
    Download,
    Upload,
    Filter,
    Search,
    SlidersHorizontal,
    Layers,
    GitBranch,
    Lock,
    Unlock,
    Eye,
    EyeOff,
    Info,
    HelpCircle,
    MessageSquare,
    Plus,
    X,
    MoreVertical,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Target,
    Gauge,
    Zap,
    Building2,
    Users,
    Package,
    Globe,
    FileText,
    Settings,
    Bell,
    BellOff,
    Copy,
    ExternalLink,
    RotateCcw,
} from 'lucide-react';
import { Card, Button, Badge, ExportModal, convertToFormat, downloadFile, type ExportFormat } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useForecastStore } from '@/store/forecast-store';
import toast from 'react-hot-toast';
import type {
    ForecastTab,
    TimeHorizon,
    TimeGranularity,
    RevenueLineItem,
    CostLineItem,
    CashPeriod,
    ForecastScenario,
    ForecastAlert,
    ForecastActualComparison,
    ConfidenceLevel,
    CostCategory,
    RevenueType,
} from '@/types/forecast';

// =============================================================================
// CONSTANTS & HELPERS
// =============================================================================

const formatCurrency = (value: number, currency: string = 'EUR', compact: boolean = false): string => {
    if (compact && Math.abs(value) >= 1000000) {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency,
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(value);
    }
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const formatPercent = (value: number, decimals: number = 1): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

const getConfidenceColor = (level: ConfidenceLevel): string => {
    switch (level) {
        case 'high': return 'text-green-500';
        case 'medium': return 'text-amber-500';
        case 'low': return 'text-red-500';
        default: return 'text-gray-500';
    }
};

const getConfidenceBg = (level: ConfidenceLevel): string => {
    switch (level) {
        case 'high': return 'bg-green-500/10';
        case 'medium': return 'bg-amber-500/10';
        case 'low': return 'bg-red-500/10';
        default: return 'bg-gray-500/10';
    }
};

const getVarianceColor = (variance: number): string => {
    if (variance > 5) return 'text-green-500';
    if (variance < -5) return 'text-red-500';
    return 'text-gray-500';
};

const costCategoryLabels: Record<CostCategory, string> = {
    fixed: 'Fixed',
    variable: 'Variable',
    discretionary: 'Discretionary',
    one_time: 'One-Time',
};

const revenueTypeLabels: Record<RevenueType, string> = {
    contract: 'Contract',
    usage_based: 'Usage-Based',
    one_time: 'One-Time',
    recurring: 'Recurring',
};

// =============================================================================
// CONFIDENCE INDICATOR COMPONENT
// =============================================================================

function ConfidenceIndicator({ level, score, showLabel = true }: { level: ConfidenceLevel; score?: number; showLabel?: boolean }) {
    return (
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${getConfidenceBg(level)}`}>
            <div className="flex gap-0.5">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={`w-1.5 h-3 rounded-sm ${
                            (level === 'high' && i <= 3) ||
                            (level === 'medium' && i <= 2) ||
                            (level === 'low' && i <= 1)
                                ? level === 'high'
                                    ? 'bg-green-500'
                                    : level === 'medium'
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                                : 'bg-gray-300 dark:bg-surface-600'
                        }`}
                    />
                ))}
            </div>
            {showLabel && (
                <span className={`text-xs font-medium capitalize ${getConfidenceColor(level)}`}>
                    {level}
                </span>
            )}
            {score !== undefined && (
                <span className="text-xs text-gray-500">({score}%)</span>
            )}
        </div>
    );
}

// =============================================================================
// VARIANCE BADGE COMPONENT
// =============================================================================

function VarianceBadge({ value, threshold = 5 }: { value: number; threshold?: number }) {
    const isPositive = value > 0;
    const isMaterial = Math.abs(value) >= threshold;
    
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                isMaterial
                    ? isPositive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-surface-700 dark:text-surface-400'
            }`}
        >
            {isPositive ? <ArrowUpRight size={12} /> : value < 0 ? <ArrowDownRight size={12} /> : <Minus size={12} />}
            {formatPercent(value)}
        </span>
    );
}

// =============================================================================
// OVERVIEW TAB
// =============================================================================

function OverviewTab() {
    const { language } = useThemeStore();
    const {
        getSummary,
        revenueForecast,
        costForecast,
        cashForecast,
        scenarios,
        alerts,
        viewPreferences,
        getActiveScenario,
        setActiveTab,
        dismissAlert,
        markAlertRead,
    } = useForecastStore();

    const summary = getSummary();
    const activeScenario = getActiveScenario();
    const activeAlerts = alerts.filter((a) => !a.isDismissed);

    const summaryCards = [
        {
            title: 'Revenue Forecast',
            value: summary.totalRevenue.expected,
            bestCase: summary.totalRevenue.bestCase,
            worstCase: summary.totalRevenue.worstCase,
            trend: summary.revenueGrowthRate,
            confidence: summary.totalRevenue.confidence,
            icon: TrendingUp,
            color: 'green',
            onClick: () => setActiveTab('revenue'),
        },
        {
            title: 'Cost Forecast',
            value: summary.totalCosts.expected,
            bestCase: summary.totalCosts.bestCase,
            worstCase: summary.totalCosts.worstCase,
            trend: summary.costGrowthRate,
            confidence: summary.totalCosts.confidence,
            icon: TrendingDown,
            color: 'orange',
            onClick: () => setActiveTab('costs'),
        },
        {
            title: 'Cash Position',
            value: summary.projectedCash.expected,
            bestCase: summary.projectedCash.bestCase,
            worstCase: summary.projectedCash.worstCase,
            trend: null,
            confidence: summary.projectedCash.confidence,
            icon: Wallet,
            color: 'blue',
            subtitle: `${summary.cashRunwayDays} days runway`,
            onClick: () => setActiveTab('cash'),
        },
        {
            title: 'Net Position',
            value: summary.netPosition.expected,
            bestCase: summary.netPosition.bestCase,
            worstCase: summary.netPosition.worstCase,
            trend: summary.profitMargin,
            confidence: summary.netPosition.confidence,
            icon: Target,
            color: summary.netPosition.expected >= 0 ? 'green' : 'red',
            subtitle: `${summary.profitMargin.toFixed(1)}% margin`,
            onClick: () => {},
        },
    ];

    return (
        <div className="space-y-6">
            {/* Data Freshness Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-surface-800/50 rounded-xl">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                            summary.dataFreshness === 'fresh' ? 'bg-green-500' :
                            summary.dataFreshness === 'stale' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm text-gray-600 dark:text-surface-400">
                            Data {summary.dataFreshness}
                        </span>
                    </div>
                    <span className="text-sm text-gray-500">
                        Last updated: {new Date(summary.lastUpdatedAt).toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">
                        Completeness: {summary.dataCompleteness}%
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <ConfidenceIndicator level={summary.overallConfidence} score={summary.overallConfidenceScore} />
                    <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg">
                        <RefreshCw size={16} className="text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Active Scenario Banner */}
            {activeScenario && (
                <div className="flex items-center justify-between px-4 py-3 bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20 rounded-xl">
                    <div className="flex items-center gap-3">
                        <GitBranch size={18} className="text-[var(--accent-primary)]" />
                        <span className="font-medium text-gray-900 dark:text-surface-100">
                            Viewing: {activeScenario.name}
                        </span>
                        <Badge variant={activeScenario.type === 'base' ? 'info' : activeScenario.type === 'optimistic' ? 'success' : 'warning'} size="sm">
                            {activeScenario.type}
                        </Badge>
                        {activeScenario.isLocked && <Lock size={14} className="text-gray-400" />}
                    </div>
                    <button
                        onClick={() => setActiveTab('scenarios')}
                        className="text-sm text-[var(--accent-primary)] hover:underline"
                    >
                        Change scenario →
                    </button>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card
                            key={card.title}
                            variant="glass"
                            padding="lg"
                            className="cursor-pointer hover:scale-[1.02] transition-transform"
                            onClick={card.onClick}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    card.color === 'green' ? 'bg-green-500/10' :
                                    card.color === 'orange' ? 'bg-orange-500/10' :
                                    card.color === 'blue' ? 'bg-blue-500/10' :
                                    'bg-red-500/10'
                                }`}>
                                    <Icon size={20} className={
                                        card.color === 'green' ? 'text-green-500' :
                                        card.color === 'orange' ? 'text-orange-500' :
                                        card.color === 'blue' ? 'text-blue-500' :
                                        'text-red-500'
                                    } />
                                </div>
                                <ConfidenceIndicator level={card.confidence} showLabel={false} />
                            </div>
                            
                            <p className="text-sm text-gray-500 dark:text-surface-400 mb-1">{card.title}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-surface-100 mb-2">
                                {formatCurrency(card.value, 'EUR', true)}
                            </p>
                            
                            {viewPreferences.showBestWorstCase && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                    <span className="text-green-500">↑ {formatCurrency(card.bestCase, 'EUR', true)}</span>
                                    <span>|</span>
                                    <span className="text-red-500">↓ {formatCurrency(card.worstCase, 'EUR', true)}</span>
                                </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                                {card.trend !== null ? (
                                    <span className={`text-sm flex items-center gap-1 ${
                                        card.trend >= 0 ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                        {card.trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {formatPercent(card.trend)} YoY
                                    </span>
                                ) : card.subtitle ? (
                                    <span className="text-sm text-gray-500">{card.subtitle}</span>
                                ) : null}
                                <ChevronRight size={16} className="text-gray-400" />
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Alerts Section */}
            {activeAlerts.length > 0 && (
                <Card variant="glass" padding="lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-surface-100 flex items-center gap-2">
                            <Bell size={18} className="text-amber-500" />
                            Alerts & Warnings
                        </h3>
                        <span className="text-xs text-gray-500">{activeAlerts.length} active</span>
                    </div>
                    <div className="space-y-2">
                        {activeAlerts.slice(0, 5).map((alert) => (
                            <div
                                key={alert.id}
                                className={`flex items-start gap-3 p-3 rounded-xl ${
                                    alert.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20' :
                                    alert.severity === 'high' ? 'bg-orange-50 dark:bg-orange-900/20' :
                                    'bg-amber-50 dark:bg-amber-900/20'
                                }`}
                            >
                                {alert.severity === 'critical' ? (
                                    <AlertOctagon size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                                ) : alert.severity === 'high' ? (
                                    <AlertTriangle size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-surface-100 text-sm">
                                        {alert.title}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-surface-400 mt-0.5">
                                        {alert.message}
                                    </p>
                                </div>
                                <button
                                    onClick={() => dismissAlert(alert.id)}
                                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">Committed Revenue</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                        {summary.committedRevenuePercent.toFixed(0)}%
                    </p>
                    <div className="h-1.5 bg-gray-200 dark:bg-surface-700 rounded-full mt-2">
                        <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${summary.committedRevenuePercent}%` }}
                        />
                    </div>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">At-Risk Revenue</p>
                    <p className="text-lg font-semibold text-red-500">
                        {summary.atRiskRevenuePercent.toFixed(0)}%
                    </p>
                    <div className="h-1.5 bg-gray-200 dark:bg-surface-700 rounded-full mt-2">
                        <div
                            className="h-full bg-red-500 rounded-full"
                            style={{ width: `${summary.atRiskRevenuePercent}%` }}
                        />
                    </div>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">Fixed Costs</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                        {summary.fixedCostsPercent}%
                    </p>
                    <div className="h-1.5 bg-gray-200 dark:bg-surface-700 rounded-full mt-2">
                        <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${summary.fixedCostsPercent}%` }}
                        />
                    </div>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">Variable Costs</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                        {summary.variableCostsPercent}%
                    </p>
                    <div className="h-1.5 bg-gray-200 dark:bg-surface-700 rounded-full mt-2">
                        <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${summary.variableCostsPercent}%` }}
                        />
                    </div>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">Cash Runway</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                        {summary.cashRunwayDays} days
                    </p>
                    <p className="text-xs text-green-500 mt-1">Healthy</p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">Profit Margin</p>
                    <p className={`text-lg font-semibold ${summary.profitMargin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.profitMargin.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">of revenue</p>
                </Card>
            </div>

            {/* Scenario Comparison Preview */}
            <Card variant="glass" padding="lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-surface-100 flex items-center gap-2">
                        <GitBranch size={18} />
                        Scenario Comparison
                    </h3>
                    <button
                        onClick={() => setActiveTab('scenarios')}
                        className="text-sm text-[var(--accent-primary)] hover:underline"
                    >
                        Manage scenarios →
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {scenarios.slice(0, 3).map((scenario) => (
                        <div
                            key={scenario.id}
                            className={`p-4 rounded-xl border-2 transition-colors ${
                                scenario.isActive
                                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                    : 'border-gray-200 dark:border-surface-700'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900 dark:text-surface-100">
                                    {scenario.name}
                                </span>
                                <Badge
                                    variant={
                                        scenario.type === 'base' ? 'info' :
                                        scenario.type === 'optimistic' ? 'success' :
                                        'warning'
                                    }
                                    size="sm"
                                >
                                    {scenario.type}
                                </Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Revenue vs Base</span>
                                    <span className={scenario.revenueVsBase >= 0 ? 'text-green-500' : 'text-red-500'}>
                                        {formatCurrency(scenario.revenueVsBase, 'EUR', true)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Cost vs Base</span>
                                    <span className={scenario.costVsBase <= 0 ? 'text-green-500' : 'text-red-500'}>
                                        {formatCurrency(scenario.costVsBase, 'EUR', true)}
                                    </span>
                                </div>
                                <div className="flex justify-between font-medium">
                                    <span className="text-gray-700 dark:text-surface-300">Net vs Base</span>
                                    <span className={scenario.netVsBase >= 0 ? 'text-green-500' : 'text-red-500'}>
                                        {formatCurrency(scenario.netVsBase, 'EUR', true)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

// =============================================================================
// REVENUE TAB
// =============================================================================

function RevenueTab() {
    const { revenueForecast, getFilteredRevenueItems, viewPreferences, filter, setFilter, resetFilter } = useForecastStore();
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);

    const items = getFilteredRevenueItems();
    const periodKeys = Object.keys(items[0]?.periods || {});

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedItems(newSet);
    };

    if (!revenueForecast) {
        return (
            <Card variant="glass" padding="lg">
                <div className="text-center py-12">
                    <TrendingUp size={48} className="mx-auto mb-4 text-gray-300 dark:text-surface-600" />
                    <p className="text-gray-500">No revenue forecast data available</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">Total Expected</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-surface-100">
                        {formatCurrency(revenueForecast.totalExpected, 'EUR', true)}
                    </p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">Committed</p>
                    <p className="text-xl font-bold text-green-500">
                        {formatCurrency(revenueForecast.committedRevenue, 'EUR', true)}
                    </p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">Projected</p>
                    <p className="text-xl font-bold text-blue-500">
                        {formatCurrency(revenueForecast.projectedRevenue, 'EUR', true)}
                    </p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">At Risk</p>
                    <p className="text-xl font-bold text-red-500">
                        {formatCurrency(revenueForecast.atRiskRevenue, 'EUR', true)}
                    </p>
                </Card>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search revenue items..."
                            value={filter.searchQuery || ''}
                            onChange={(e) => setFilter({ searchQuery: e.target.value })}
                            className="pl-10 pr-4 py-2 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-sm"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-xl border ${
                            showFilters ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]' : 'border-gray-200 dark:border-surface-700'
                        }`}
                    >
                        <SlidersHorizontal size={18} />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" leftIcon={<Download size={16} />}>
                        Export
                    </Button>
                </div>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <Card variant="glass" padding="md">
                            <div className="flex flex-wrap gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Type</label>
                                    <div className="flex gap-1">
                                        {(['recurring', 'contract', 'usage_based', 'one_time'] as RevenueType[]).map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => {
                                                    const current = filter.revenueType || [];
                                                    setFilter({
                                                        revenueType: current.includes(type)
                                                            ? current.filter((t) => t !== type)
                                                            : [...current, type],
                                                    });
                                                }}
                                                className={`px-2 py-1 text-xs rounded-lg border ${
                                                    filter.revenueType?.includes(type)
                                                        ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]'
                                                        : 'border-gray-200 dark:border-surface-700'
                                                }`}
                                            >
                                                {revenueTypeLabels[type]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Confidence</label>
                                    <div className="flex gap-1">
                                        {(['high', 'medium', 'low'] as ConfidenceLevel[]).map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => {
                                                    const current = filter.confidenceLevel || [];
                                                    setFilter({
                                                        confidenceLevel: current.includes(level)
                                                            ? current.filter((l) => l !== level)
                                                            : [...current, level],
                                                    });
                                                }}
                                                className={`px-2 py-1 text-xs rounded-lg border capitalize ${
                                                    filter.confidenceLevel?.includes(level)
                                                        ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]'
                                                        : 'border-gray-200 dark:border-surface-700'
                                                }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Flags</label>
                                    <button
                                        onClick={() => setFilter({ showAtRisk: !filter.showAtRisk })}
                                        className={`px-2 py-1 text-xs rounded-lg border ${
                                            filter.showAtRisk ? 'bg-red-500/10 border-red-500 text-red-500' : 'border-gray-200 dark:border-surface-700'
                                        }`}
                                    >
                                        At Risk Only
                                    </button>
                                </div>
                                <div className="ml-auto flex items-end">
                                    <button onClick={resetFilter} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                                        <RotateCcw size={12} />
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Revenue Items Table */}
            <Card variant="glass" padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-surface-700">
                                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Item
                                </th>
                                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                {periodKeys.map((period) => (
                                    <th key={period} className="text-right p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {period.replace('period-', 'M')}
                                    </th>
                                ))}
                                <th className="text-right p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="text-center p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Confidence
                                </th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => {
                                const total = Object.values(item.periods).reduce((sum, p) => sum + p.expected, 0);
                                const isExpanded = expandedItems.has(item.id);
                                
                                return (
                                    <React.Fragment key={item.id}>
                                        <tr
                                            className={`border-b border-gray-100 dark:border-surface-800 hover:bg-gray-50 dark:hover:bg-surface-800/50 cursor-pointer ${
                                                item.isAtRisk ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                                            }`}
                                            onClick={() => toggleExpand(item.id)}
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <ChevronRight
                                                        size={16}
                                                        className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                    />
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-surface-100">
                                                            {item.name}
                                                        </p>
                                                        {item.customerName && (
                                                            <p className="text-xs text-gray-500">{item.customerName}</p>
                                                        )}
                                                    </div>
                                                    {item.isAtRisk && (
                                                        <Badge variant="danger" size="sm">At Risk</Badge>
                                                    )}
                                                    {item.isRenewal && (
                                                        <Badge variant="info" size="sm">Renewal</Badge>
                                                    )}
                                                    {item.isCommitted && (
                                                        <Badge variant="success" size="sm">Committed</Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm text-gray-600 dark:text-surface-400 capitalize">
                                                    {revenueTypeLabels[item.type]}
                                                </span>
                                            </td>
                                            {periodKeys.map((period) => (
                                                <td key={period} className="p-4 text-right">
                                                    <span className="font-medium text-gray-900 dark:text-surface-100">
                                                        {formatCurrency(item.periods[period]?.expected || 0, 'EUR', true)}
                                                    </span>
                                                </td>
                                            ))}
                                            <td className="p-4 text-right">
                                                <span className="font-semibold text-gray-900 dark:text-surface-100">
                                                    {formatCurrency(total, 'EUR', true)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-center">
                                                    <ConfidenceIndicator level={item.confidence} score={item.confidenceScore} showLabel={false} />
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <button className="p-1 hover:bg-gray-100 dark:hover:bg-surface-700 rounded">
                                                    <MoreVertical size={16} className="text-gray-400" />
                                                </button>
                                            </td>
                                        </tr>
                                        {/* Expanded Details */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={periodKeys.length + 5} className="p-0">
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="bg-gray-50 dark:bg-surface-800/30 px-8 py-4"
                                                        >
                                                            <div className="grid grid-cols-3 gap-6">
                                                                <div>
                                                                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Details</h4>
                                                                    <div className="space-y-1 text-sm">
                                                                        <p><span className="text-gray-500">Segment:</span> {item.segment || 'N/A'}</p>
                                                                        <p><span className="text-gray-500">Region:</span> {item.region || 'N/A'}</p>
                                                                        <p><span className="text-gray-500">Category:</span> {item.category}</p>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Drivers</h4>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {item.drivers.map((driver, idx) => (
                                                                            <span key={idx} className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-surface-700 rounded">
                                                                                {driver}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Range</h4>
                                                                    {periodKeys.slice(0, 1).map((period) => (
                                                                        <div key={period} className="text-sm">
                                                                            <p className="text-green-500">Best: {formatCurrency(item.periods[period]?.bestCase || 0)}</p>
                                                                            <p className="text-red-500">Worst: {formatCurrency(item.periods[period]?.worstCase || 0)}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {item.annotations.length > 0 && (
                                                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-surface-700">
                                                                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Notes</h4>
                                                                    {item.annotations.map((ann) => (
                                                                        <div key={ann.id} className="flex items-start gap-2 text-sm">
                                                                            <MessageSquare size={14} className="text-gray-400 mt-0.5" />
                                                                            <div>
                                                                                <p className="text-gray-700 dark:text-surface-300">{ann.content}</p>
                                                                                <p className="text-xs text-gray-500">— {ann.authorName}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-50 dark:bg-surface-800/50 font-semibold">
                                <td colSpan={2} className="p-4 text-gray-900 dark:text-surface-100">
                                    Total Revenue
                                </td>
                                {periodKeys.map((period) => {
                                    const periodTotal = items.reduce((sum, item) => sum + (item.periods[period]?.expected || 0), 0);
                                    return (
                                        <td key={period} className="p-4 text-right text-gray-900 dark:text-surface-100">
                                            {formatCurrency(periodTotal, 'EUR', true)}
                                        </td>
                                    );
                                })}
                                <td className="p-4 text-right text-gray-900 dark:text-surface-100">
                                    {formatCurrency(revenueForecast.totalExpected, 'EUR', true)}
                                </td>
                                <td colSpan={2}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </Card>
        </div>
    );
}

// =============================================================================
// COSTS TAB
// =============================================================================

function CostsTab() {
    const { costForecast, getFilteredCostItems, filter, setFilter, resetFilter } = useForecastStore();
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);

    const items = getFilteredCostItems();
    const periodKeys = Object.keys(items[0]?.periods || {});

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedItems(newSet);
    };

    if (!costForecast) {
        return (
            <Card variant="glass" padding="lg">
                <div className="text-center py-12">
                    <TrendingDown size={48} className="mx-auto mb-4 text-gray-300 dark:text-surface-600" />
                    <p className="text-gray-500">No cost forecast data available</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">Total Expected</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-surface-100">
                        {formatCurrency(costForecast.totalExpected, 'EUR', true)}
                    </p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">Committed</p>
                    <p className="text-xl font-bold text-orange-500">
                        {formatCurrency(costForecast.committedCosts, 'EUR', true)}
                    </p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">Estimated</p>
                    <p className="text-xl font-bold text-blue-500">
                        {formatCurrency(costForecast.estimatedCosts, 'EUR', true)}
                    </p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">Overruns</p>
                    <p className="text-xl font-bold text-red-500">
                        {costForecast.overrunCount}
                    </p>
                    <p className="text-xs text-gray-500">items over budget</p>
                </Card>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search cost items..."
                            value={filter.searchQuery || ''}
                            onChange={(e) => setFilter({ searchQuery: e.target.value })}
                            className="pl-10 pr-4 py-2 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-sm"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-xl border ${
                            showFilters ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]' : 'border-gray-200 dark:border-surface-700'
                        }`}
                    >
                        <SlidersHorizontal size={18} />
                    </button>
                </div>
                <Button variant="secondary" size="sm" leftIcon={<Download size={16} />}>
                    Export
                </Button>
            </div>

            {/* Filters */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <Card variant="glass" padding="md">
                            <div className="flex flex-wrap gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Category</label>
                                    <div className="flex gap-1">
                                        {(['fixed', 'variable', 'discretionary', 'one_time'] as CostCategory[]).map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => {
                                                    const current = filter.category || [];
                                                    setFilter({
                                                        category: current.includes(cat)
                                                            ? current.filter((c) => c !== cat)
                                                            : [...current, cat],
                                                    });
                                                }}
                                                className={`px-2 py-1 text-xs rounded-lg border ${
                                                    filter.category?.includes(cat)
                                                        ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]'
                                                        : 'border-gray-200 dark:border-surface-700'
                                                }`}
                                            >
                                                {costCategoryLabels[cat]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Flags</label>
                                    <button
                                        onClick={() => setFilter({ showOverruns: !filter.showOverruns })}
                                        className={`px-2 py-1 text-xs rounded-lg border ${
                                            filter.showOverruns ? 'bg-red-500/10 border-red-500 text-red-500' : 'border-gray-200 dark:border-surface-700'
                                        }`}
                                    >
                                        Overruns Only
                                    </button>
                                </div>
                                <div className="ml-auto flex items-end">
                                    <button onClick={resetFilter} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                                        <RotateCcw size={12} />
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cost Items Table */}
            <Card variant="glass" padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-surface-700">
                                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Dept</th>
                                {periodKeys.map((period) => (
                                    <th key={period} className="text-right p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {period.replace('period-', 'M')}
                                    </th>
                                ))}
                                <th className="text-right p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="text-center p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => {
                                const total = Object.values(item.periods).reduce((sum, p) => sum + p.expected, 0);
                                const isExpanded = expandedItems.has(item.id);
                                
                                return (
                                    <React.Fragment key={item.id}>
                                        <tr
                                            className={`border-b border-gray-100 dark:border-surface-800 hover:bg-gray-50 dark:hover:bg-surface-800/50 cursor-pointer ${
                                                item.isOverrun ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                                            }`}
                                            onClick={() => toggleExpand(item.id)}
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <ChevronRight
                                                        size={16}
                                                        className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                    />
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-surface-100">{item.name}</p>
                                                        {item.vendorName && (
                                                            <p className="text-xs text-gray-500">{item.vendorName}</p>
                                                        )}
                                                    </div>
                                                    {item.isOverrun && <Badge variant="danger" size="sm">Overrun</Badge>}
                                                    {item.isUnplanned && <Badge variant="warning" size="sm">Unplanned</Badge>}
                                                    {item.hasStepChange && <Badge variant="info" size="sm">Step Change</Badge>}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm text-gray-600 dark:text-surface-400">
                                                    {costCategoryLabels[item.category]}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm text-gray-600 dark:text-surface-400">
                                                    {item.department || 'N/A'}
                                                </span>
                                            </td>
                                            {periodKeys.map((period) => (
                                                <td key={period} className="p-4 text-right">
                                                    <span className="font-medium text-gray-900 dark:text-surface-100">
                                                        {formatCurrency(item.periods[period]?.expected || 0, 'EUR', true)}
                                                    </span>
                                                </td>
                                            ))}
                                            <td className="p-4 text-right">
                                                <span className="font-semibold text-gray-900 dark:text-surface-100">
                                                    {formatCurrency(total, 'EUR', true)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-center">
                                                    <ConfidenceIndicator level={item.confidence} showLabel={false} />
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Expanded Details */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={periodKeys.length + 5} className="p-0">
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="bg-gray-50 dark:bg-surface-800/30 px-8 py-4"
                                                        >
                                                            <div className="grid grid-cols-3 gap-6">
                                                                <div>
                                                                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Details</h4>
                                                                    <div className="space-y-1 text-sm">
                                                                        <p><span className="text-gray-500">Cost Center:</span> {item.costCenter || 'N/A'}</p>
                                                                        <p><span className="text-gray-500">Committed:</span> {item.isCommitted ? 'Yes' : 'No'}</p>
                                                                        <p><span className="text-gray-500">Contractual:</span> {item.isContractual ? 'Yes' : 'No'}</p>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Drivers</h4>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {item.drivers.map((driver, idx) => (
                                                                            <span key={idx} className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-surface-700 rounded">
                                                                                {driver}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                    {item.scenarioImpact && (
                                                                        <p className="text-xs text-amber-600 mt-2">{item.scenarioImpact}</p>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    {item.hasStepChange && item.stepChangeDescription && (
                                                                        <>
                                                                            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Step Change</h4>
                                                                            <p className="text-sm text-gray-700 dark:text-surface-300">
                                                                                {item.stepChangeDescription}
                                                                            </p>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-50 dark:bg-surface-800/50 font-semibold">
                                <td colSpan={3} className="p-4 text-gray-900 dark:text-surface-100">Total Costs</td>
                                {periodKeys.map((period) => {
                                    const periodTotal = items.reduce((sum, item) => sum + (item.periods[period]?.expected || 0), 0);
                                    return (
                                        <td key={period} className="p-4 text-right text-gray-900 dark:text-surface-100">
                                            {formatCurrency(periodTotal, 'EUR', true)}
                                        </td>
                                    );
                                })}
                                <td className="p-4 text-right text-gray-900 dark:text-surface-100">
                                    {formatCurrency(costForecast.totalExpected, 'EUR', true)}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </Card>
        </div>
    );
}

// =============================================================================
// CASH TAB
// =============================================================================

function CashTab() {
    const { cashForecast } = useForecastStore();

    if (!cashForecast) {
        return (
            <Card variant="glass" padding="lg">
                <div className="text-center py-12">
                    <Wallet size={48} className="mx-auto mb-4 text-gray-300 dark:text-surface-600" />
                    <p className="text-gray-500">No cash forecast data available</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">Current Balance</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-surface-100">
                        {formatCurrency(cashForecast.currentCashBalance, 'EUR', true)}
                    </p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">Projected Minimum</p>
                    <p className="text-xl font-bold text-amber-500">
                        {formatCurrency(cashForecast.projectedMinimumBalance, 'EUR', true)}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(cashForecast.projectedMinimumDate).toLocaleDateString()}</p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">Cash Runway</p>
                    <p className="text-xl font-bold text-green-500">{cashForecast.minimumCashRunway} days</p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">Covenant Threshold</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-surface-100">
                        {formatCurrency(cashForecast.covenantThreshold, 'EUR', true)}
                    </p>
                    <p className={`text-xs ${cashForecast.covenantAtRisk ? 'text-red-500' : 'text-green-500'}`}>
                        {cashForecast.covenantAtRisk ? 'At Risk' : 'Healthy'}
                    </p>
                </Card>
            </div>

            {/* Cash Flow Periods */}
            <Card variant="glass" padding="lg">
                <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">Cash Flow by Period</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-surface-700">
                                <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Period</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Opening</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Cash In</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Cash Out</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Net Flow</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Closing</th>
                                <th className="text-center p-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cashForecast.periods.map((period) => (
                                <tr
                                    key={period.periodId}
                                    className={`border-b border-gray-100 dark:border-surface-800 ${
                                        period.isCritical ? 'bg-red-50 dark:bg-red-900/10' :
                                        period.breachesMinimum ? 'bg-amber-50 dark:bg-amber-900/10' : ''
                                    }`}
                                >
                                    <td className="p-3 font-medium text-gray-900 dark:text-surface-100">
                                        {period.periodLabel}
                                    </td>
                                    <td className="p-3 text-right text-gray-600 dark:text-surface-400">
                                        {formatCurrency(period.openingBalance, 'EUR', true)}
                                    </td>
                                    <td className="p-3 text-right text-green-600">
                                        +{formatCurrency(period.cashIn.expected, 'EUR', true)}
                                    </td>
                                    <td className="p-3 text-right text-red-600">
                                        -{formatCurrency(period.cashOut.expected, 'EUR', true)}
                                    </td>
                                    <td className={`p-3 text-right font-medium ${
                                        period.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {period.netCashFlow >= 0 ? '+' : ''}{formatCurrency(period.netCashFlow, 'EUR', true)}
                                    </td>
                                    <td className="p-3 text-right font-semibold text-gray-900 dark:text-surface-100">
                                        {formatCurrency(period.closingBalance, 'EUR', true)}
                                    </td>
                                    <td className="p-3 text-center">
                                        {period.isCritical ? (
                                            <Badge variant="danger" size="sm">Critical</Badge>
                                        ) : period.breachesMinimum ? (
                                            <Badge variant="warning" size="sm">Below Min</Badge>
                                        ) : period.isNegative ? (
                                            <Badge variant="danger" size="sm">Negative</Badge>
                                        ) : (
                                            <Badge variant="success" size="sm">OK</Badge>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Cash Flow Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cash In Breakdown */}
                <Card variant="glass" padding="lg">
                    <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-green-500" />
                        Cash Inflows
                    </h3>
                    <div className="space-y-3">
                        {cashForecast.periods[0] && Object.entries(cashForecast.periods[0].cashInBreakdown).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-surface-400 capitalize">
                                    {key.replace(/_/g, ' ')}
                                </span>
                                <span className="font-medium text-green-600">
                                    {formatCurrency(value, 'EUR', true)}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Cash Out Breakdown */}
                <Card variant="glass" padding="lg">
                    <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4 flex items-center gap-2">
                        <TrendingDown size={18} className="text-red-500" />
                        Cash Outflows
                    </h3>
                    <div className="space-y-3">
                        {cashForecast.periods[0] && Object.entries(cashForecast.periods[0].cashOutBreakdown).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-surface-400 capitalize">
                                    {key.replace(/_/g, ' ')}
                                </span>
                                <span className="font-medium text-red-600">
                                    {formatCurrency(value, 'EUR', true)}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Stress Scenarios */}
            <Card variant="glass" padding="lg">
                <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-500" />
                    Stress Scenarios
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cashForecast.stressScenarios.map((scenario) => (
                        <div
                            key={scenario.id}
                            className="p-4 rounded-xl border border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-800/50"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-gray-900 dark:text-surface-100">{scenario.name}</h4>
                                <Badge
                                    variant={scenario.probability === 'high' ? 'danger' : scenario.probability === 'medium' ? 'warning' : 'success'}
                                    size="sm"
                                >
                                    {scenario.probability} prob.
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-surface-400 mb-3">{scenario.description}</p>
                            <div className="flex gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Cash Impact:</span>
                                    <span className="ml-1 font-medium text-red-600">
                                        {formatCurrency(scenario.impactOnCash, 'EUR', true)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Runway Impact:</span>
                                    <span className="ml-1 font-medium text-red-600">
                                        {scenario.runwayImpactDays} days
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

// =============================================================================
// VARIANCE TAB
// =============================================================================

function VarianceTab() {
    const { varianceData, viewPreferences } = useForecastStore();

    if (varianceData.length === 0) {
        return (
            <Card variant="glass" padding="lg">
                <div className="text-center py-12">
                    <BarChart3 size={48} className="mx-auto mb-4 text-gray-300 dark:text-surface-600" />
                    <p className="text-gray-500">No variance data available yet</p>
                    <p className="text-sm text-gray-400 mt-1">Variance analysis will appear after actuals are recorded</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Variance Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {varianceData.slice(0, 1).map((data) => (
                    <React.Fragment key={data.periodId}>
                        <Card variant="glass" padding="md">
                            <p className="text-xs text-gray-500 dark:text-surface-400">Revenue Variance</p>
                            <p className={`text-xl font-bold ${data.revenueVariance.absoluteVariance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {formatCurrency(data.revenueVariance.absoluteVariance)}
                            </p>
                            <VarianceBadge value={data.revenueVariance.percentageVariance} threshold={viewPreferences.varianceThreshold} />
                        </Card>
                        <Card variant="glass" padding="md">
                            <p className="text-xs text-gray-500 dark:text-surface-400">Cost Variance</p>
                            <p className={`text-xl font-bold ${data.costVariance.absoluteVariance <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {formatCurrency(data.costVariance.absoluteVariance)}
                            </p>
                            <VarianceBadge value={data.costVariance.percentageVariance} threshold={viewPreferences.varianceThreshold} />
                        </Card>
                        <Card variant="glass" padding="md">
                            <p className="text-xs text-gray-500 dark:text-surface-400">Cash Variance</p>
                            <p className={`text-xl font-bold ${data.cashVariance.absoluteVariance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {formatCurrency(data.cashVariance.absoluteVariance)}
                            </p>
                            <VarianceBadge value={data.cashVariance.percentageVariance} threshold={viewPreferences.varianceThreshold} />
                        </Card>
                        <Card variant="glass" padding="md">
                            <p className="text-xs text-gray-500 dark:text-surface-400">Net Variance</p>
                            <p className={`text-xl font-bold ${data.netVariance.absoluteVariance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {formatCurrency(data.netVariance.absoluteVariance)}
                            </p>
                            <VarianceBadge value={data.netVariance.percentageVariance} threshold={viewPreferences.varianceThreshold} />
                        </Card>
                    </React.Fragment>
                ))}
            </div>

            {/* Forecast vs Actual Table */}
            <Card variant="glass" padding="lg">
                <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">Forecast vs Actual</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-surface-700">
                                <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Period</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Forecast</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Actual</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Variance</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">%</th>
                                <th className="text-center p-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {varianceData.map((data) => (
                                <React.Fragment key={data.periodId}>
                                    <tr className="bg-gray-50 dark:bg-surface-800/30">
                                        <td colSpan={6} className="p-2 text-xs font-semibold text-gray-700 dark:text-surface-300">
                                            {data.periodLabel}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100 dark:border-surface-800">
                                        <td className="p-3 pl-6 text-gray-600 dark:text-surface-400">Revenue</td>
                                        <td className="p-3 text-right">{formatCurrency(data.revenueForecast)}</td>
                                        <td className="p-3 text-right">{formatCurrency(data.revenueActual)}</td>
                                        <td className={`p-3 text-right ${data.revenueVariance.absoluteVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(data.revenueVariance.absoluteVariance)}
                                        </td>
                                        <td className="p-3 text-right">
                                            <VarianceBadge value={data.revenueVariance.percentageVariance} />
                                        </td>
                                        <td className="p-3 text-center">
                                            {data.hasMaterialVariance ? (
                                                <AlertTriangle size={16} className="inline text-amber-500" />
                                            ) : (
                                                <CheckCircle2 size={16} className="inline text-green-500" />
                                            )}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-100 dark:border-surface-800">
                                        <td className="p-3 pl-6 text-gray-600 dark:text-surface-400">Costs</td>
                                        <td className="p-3 text-right">{formatCurrency(data.costForecast)}</td>
                                        <td className="p-3 text-right">{formatCurrency(data.costActual)}</td>
                                        <td className={`p-3 text-right ${data.costVariance.absoluteVariance <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(data.costVariance.absoluteVariance)}
                                        </td>
                                        <td className="p-3 text-right">
                                            <VarianceBadge value={data.costVariance.percentageVariance} />
                                        </td>
                                        <td className="p-3 text-center">
                                            {Math.abs(data.costVariance.percentageVariance) > 5 ? (
                                                <AlertTriangle size={16} className="inline text-amber-500" />
                                            ) : (
                                                <CheckCircle2 size={16} className="inline text-green-500" />
                                            )}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-gray-200 dark:border-surface-700">
                                        <td className="p-3 pl-6 font-medium text-gray-900 dark:text-surface-100">Net</td>
                                        <td className="p-3 text-right font-medium">{formatCurrency(data.netForecast)}</td>
                                        <td className="p-3 text-right font-medium">{formatCurrency(data.netActual)}</td>
                                        <td className={`p-3 text-right font-medium ${data.netVariance.absoluteVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(data.netVariance.absoluteVariance)}
                                        </td>
                                        <td className="p-3 text-right">
                                            <VarianceBadge value={data.netVariance.percentageVariance} />
                                        </td>
                                        <td></td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Variance Attribution */}
            <Card variant="glass" padding="lg">
                <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">Variance Attribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {varianceData.slice(0, 1).map((data) => (
                        <React.Fragment key={data.periodId}>
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-surface-300 mb-3">Revenue Drivers</h4>
                                <div className="space-y-2">
                                    {data.revenueVariance.attribution.map((attr, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-600 dark:text-surface-400 capitalize">{attr.driver}</span>
                                                    <span className={attr.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {formatCurrency(attr.amount)}
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${attr.amount >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                                        style={{ width: `${attr.percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-500 w-12">{attr.percentage}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-surface-300 mb-3">Cost Drivers</h4>
                                <div className="space-y-2">
                                    {data.costVariance.attribution.map((attr, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-600 dark:text-surface-400 capitalize">{attr.driver}</span>
                                                    <span className={attr.amount <= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {formatCurrency(attr.amount)}
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${attr.amount <= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                                        style={{ width: `${attr.percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-500 w-12">{attr.percentage}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </Card>
        </div>
    );
}

// =============================================================================
// SCENARIOS TAB
// =============================================================================

function ScenariosTab() {
    const { scenarios, viewPreferences, setActiveScenario, lockScenario, updateAssumption } = useForecastStore();
    const [selectedScenario, setSelectedScenario] = useState<string | null>(scenarios[0]?.id || null);

    const currentScenario = scenarios.find((s) => s.id === selectedScenario);

    return (
        <div className="space-y-6">
            {/* Scenario Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scenarios.map((scenario) => (
                    <Card
                        key={scenario.id}
                        variant="glass"
                        padding="lg"
                        className={`cursor-pointer transition-all ${
                            selectedScenario === scenario.id
                                ? 'ring-2 ring-[var(--accent-primary)]'
                                : 'hover:border-[var(--accent-primary)]'
                        } ${viewPreferences.activeScenarioId === scenario.id ? 'bg-[var(--accent-primary)]/5' : ''}`}
                        onClick={() => setSelectedScenario(scenario.id)}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-surface-100">{scenario.name}</h3>
                                <Badge
                                    variant={
                                        scenario.type === 'base' ? 'info' :
                                        scenario.type === 'optimistic' ? 'success' :
                                        scenario.type === 'pessimistic' ? 'warning' : 'neutral'
                                    }
                                    size="sm"
                                    className="mt-1"
                                >
                                    {scenario.type}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                                {scenario.isLocked && <Lock size={14} className="text-gray-400" />}
                                {viewPreferences.activeScenarioId === scenario.id && (
                                    <Badge variant="success" size="sm">Active</Badge>
                                )}
                            </div>
                        </div>
                        
                        {scenario.description && (
                            <p className="text-sm text-gray-600 dark:text-surface-400 mb-3">{scenario.description}</p>
                        )}
                        
                        <div className="space-y-2 text-sm border-t border-gray-200 dark:border-surface-700 pt-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Revenue vs Base</span>
                                <span className={scenario.revenueVsBase >= 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                                    {scenario.revenueVsBase >= 0 ? '+' : ''}{formatCurrency(scenario.revenueVsBase, 'EUR', true)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Cost vs Base</span>
                                <span className={scenario.costVsBase <= 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                                    {scenario.costVsBase >= 0 ? '+' : ''}{formatCurrency(scenario.costVsBase, 'EUR', true)}
                                </span>
                            </div>
                            <div className="flex justify-between font-semibold">
                                <span className="text-gray-700 dark:text-surface-300">Net Impact</span>
                                <span className={scenario.netVsBase >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {scenario.netVsBase >= 0 ? '+' : ''}{formatCurrency(scenario.netVsBase, 'EUR', true)}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                            {viewPreferences.activeScenarioId !== scenario.id && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveScenario(scenario.id);
                                        toast.success('Scenario set as active');
                                    }}
                                >
                                    Set Active
                                </Button>
                            )}
                            {!scenario.isLocked && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        lockScenario(scenario.id);
                                        toast.success('Scenario locked');
                                    }}
                                >
                                    <Lock size={14} />
                                </Button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Assumptions Editor */}
            {currentScenario && (
                <Card variant="glass" padding="lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-surface-100">
                            Assumptions: {currentScenario.name}
                        </h3>
                        {currentScenario.isLocked && (
                            <Badge variant="neutral" size="sm" className="flex items-center gap-1">
                                <Lock size={12} />
                                Locked
                            </Badge>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {currentScenario.assumptions.map((assumption) => (
                            <div
                                key={assumption.id}
                                className="p-4 rounded-xl border border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-800/50"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700 dark:text-surface-300">
                                        {assumption.name}
                                    </span>
                                    <Badge variant="info" size="sm">{assumption.category}</Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={assumption.value}
                                        onChange={(e) => updateAssumption(currentScenario.id, assumption.id, parseFloat(e.target.value))}
                                        disabled={currentScenario.isLocked || !assumption.isEditable}
                                        className="flex-1 px-3 py-2 bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-lg text-right font-medium disabled:opacity-50"
                                    />
                                    <span className="text-sm text-gray-500 w-12">
                                        {assumption.unit === 'percentage' ? '%' :
                                         assumption.unit === 'days' ? 'days' :
                                         assumption.unit === 'multiplier' ? 'x' : ''}
                                    </span>
                                </div>
                                <div className="flex gap-1 mt-2">
                                    {assumption.impactedForecasts.map((f) => (
                                        <span key={f} className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-surface-700 rounded capitalize">
                                            {f}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Scenario Comparison Chart Placeholder */}
            <Card variant="glass" padding="lg">
                <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">Scenario Comparison</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-surface-800/50 rounded-xl">
                    <div className="text-center">
                        <BarChart3 size={48} className="mx-auto mb-2 text-gray-300 dark:text-surface-600" />
                        <p className="text-gray-500">Chart visualization would go here</p>
                        <p className="text-xs text-gray-400">Comparing revenue, costs, and net across scenarios</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function ForecastsPage() {
    const { t } = useThemeStore();
    const {
        activeTab,
        setActiveTab,
        isLoading,
        fetchForecasts,
        getUnreadAlertCount,
        viewPreferences,
        setTimeHorizon,
        setGranularity,
        setViewPreferences,
        revenueForecast,
        costForecast,
        cashForecast,
    } = useForecastStore();

    const unreadAlerts = getUnreadAlertCount();
    const [showExportModal, setShowExportModal] = useState(false);

    useEffect(() => {
        fetchForecasts();
    }, [fetchForecasts]);

    const getExportData = () => ({
        exportedAt: new Date().toISOString(),
        timeHorizon: viewPreferences.timeHorizon,
        granularity: viewPreferences.granularity,
        revenueForecast: revenueForecast ? {
            totalExpected: revenueForecast.totalExpected,
            totalBestCase: revenueForecast.totalBestCase,
            totalWorstCase: revenueForecast.totalWorstCase,
            committedRevenue: revenueForecast.committedRevenue,
            projectedRevenue: revenueForecast.projectedRevenue,
            atRiskRevenue: revenueForecast.atRiskRevenue,
            lineItemCount: revenueForecast.lineItems?.length || 0,
        } : null,
        costForecast: costForecast ? {
            totalExpected: costForecast.totalExpected,
            totalBestCase: costForecast.totalBestCase,
            totalWorstCase: costForecast.totalWorstCase,
            committedCosts: costForecast.committedCosts,
            estimatedCosts: costForecast.estimatedCosts,
            lineItemCount: costForecast.lineItems?.length || 0,
        } : null,
        cashForecast: cashForecast ? {
            currentCashBalance: cashForecast.currentCashBalance,
            minimumCashRunway: cashForecast.minimumCashRunway,
            projectedMinimumBalance: cashForecast.projectedMinimumBalance,
            projectedMinimumDate: cashForecast.projectedMinimumDate,
        } : null,
    });

    const handleExport = async (format: ExportFormat) => {
        const exportData = getExportData();
        const fileName = `forecasts-export-${new Date().toISOString().split('T')[0]}`;
        const result = convertToFormat(exportData, format, 'forecasts');
        const isDocx = (result as any).isDocx === true;
        await downloadFile(result.content, `${fileName}.${result.extension}`, result.mimeType, isDocx);
        toast.success(`Forecasts exported as ${format.toUpperCase()}`);
    };

    const tabs: { id: ForecastTab; label: string; icon: React.ElementType; badge?: number }[] = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'revenue', label: 'Revenue', icon: TrendingUp },
        { id: 'costs', label: 'Costs', icon: TrendingDown },
        { id: 'cash', label: 'Cash', icon: Wallet },
        { id: 'variance', label: 'Variance', icon: LineChart },
        { id: 'scenarios', label: 'Scenarios', icon: GitBranch },
    ];

    const renderTab = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab />;
            case 'revenue': return <RevenueTab />;
            case 'costs': return <CostsTab />;
            case 'cash': return <CashTab />;
            case 'variance': return <VarianceTab />;
            case 'scenarios': return <ScenariosTab />;
            default: return <OverviewTab />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
                        Forecasts
                    </h1>
                    <p className="text-gray-500 dark:text-surface-500 mt-1">
                        Financial forecasting and scenario analysis
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    {/* Time Horizon */}
                    <select
                        value={viewPreferences.timeHorizon}
                        onChange={(e) => setTimeHorizon(e.target.value as TimeHorizon)}
                        className="px-3 py-2 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-sm"
                    >
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                    </select>
                    
                    {/* Granularity */}
                    <select
                        value={viewPreferences.granularity}
                        onChange={(e) => setGranularity(e.target.value as TimeGranularity)}
                        className="px-3 py-2 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-sm"
                    >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                    </select>
                    
                    {/* View Options */}
                    <div className="flex items-center gap-2 border-l border-gray-200 dark:border-surface-700 pl-3">
                        <button
                            onClick={() => setViewPreferences({ showBestWorstCase: !viewPreferences.showBestWorstCase })}
                            className={`p-2 rounded-lg border ${
                                viewPreferences.showBestWorstCase
                                    ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                    : 'border-gray-200 dark:border-surface-700 text-gray-500'
                            }`}
                            title="Show range"
                        >
                            <Layers size={16} />
                        </button>
                        <button
                            onClick={() => setViewPreferences({ showConfidenceIndicators: !viewPreferences.showConfidenceIndicators })}
                            className={`p-2 rounded-lg border ${
                                viewPreferences.showConfidenceIndicators
                                    ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                    : 'border-gray-200 dark:border-surface-700 text-gray-500'
                            }`}
                            title="Show confidence"
                        >
                            <Gauge size={16} />
                        </button>
                    </div>
                    
                    {/* Alerts */}
                    <button className="relative p-2 rounded-xl bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700">
                        <Bell size={18} className="text-gray-600 dark:text-surface-400" />
                        {unreadAlerts > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {unreadAlerts}
                            </span>
                        )}
                    </button>
                    
                    <Button variant="secondary" leftIcon={<Download size={16} />} onClick={() => setShowExportModal(true)}>
                        Export
                    </Button>
                </div>
            </div>

            {/* Export Modal */}
            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                onExport={handleExport}
                title={t('forecast.exportTitle') || 'Export Forecasts'}
                fileName="forecasts"
            />

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-surface-800/50 rounded-xl overflow-x-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-white dark:bg-surface-700 text-gray-900 dark:text-surface-100 shadow-sm'
                                    : 'text-gray-600 dark:text-surface-400 hover:text-gray-900 dark:hover:text-surface-100'
                            }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                            {tab.badge !== undefined && tab.badge > 0 && (
                                <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            {isLoading ? (
                <Card variant="glass" padding="lg">
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw size={32} className="animate-spin text-gray-400" />
                    </div>
                </Card>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderTab()}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
}