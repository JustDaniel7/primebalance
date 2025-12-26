'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Minus,
    Target,
    Gauge,
    Wallet,
    Clock,
    Activity,
    PieChart,
    LineChart,
    ArrowUpRight,
    ArrowDownRight,
    ArrowRight,
    AlertTriangle,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Info,
    HelpCircle,
    ChevronRight,
    ChevronDown,
    RefreshCw,
    Download,
    Settings,
    Filter,
    Search,
    Eye,
    EyeOff,
    Calendar,
    Bell,
    X,
    MoreVertical,
    Zap,
    DollarSign,
    Percent,
    Users,
    Package,
    Layers,
    GitBranch,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useKPIStore } from '@/store/kpi-store';
import type {
    KPITab,
    KPITimeHorizon,
    KPIStatus,
    KPITrendDirection,
    KPIValue,
    MarginBreakdown,
    BurnBreakdown,
    CCCComponent,
    CohortMetrics,
    KPIAlert,
} from '@/types/kpis';

// =============================================================================
// HELPERS
// =============================================================================

const formatCurrency = (value: number, compact: boolean = false): string => {
    if (compact && Math.abs(value) >= 1000000) {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(value);
    }
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const formatPercent = (value: number, showSign: boolean = true): string => {
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
};

const formatDays = (value: number): string => `${value} days`;

const getStatusColor = (status: KPIStatus): string => {
    switch (status) {
        case 'on_track': return 'text-green-500';
        case 'watch': return 'text-amber-500';
        case 'off_track': return 'text-red-500';
    }
};

const getStatusBg = (status: KPIStatus): string => {
    switch (status) {
        case 'on_track': return 'bg-green-500/10';
        case 'watch': return 'bg-amber-500/10';
        case 'off_track': return 'bg-red-500/10';
    }
};

const getStatusLabel = (status: KPIStatus): string => {
    switch (status) {
        case 'on_track': return 'On Track';
        case 'watch': return 'Watch';
        case 'off_track': return 'Off Track';
    }
};

const getTrendIcon = (trend: KPITrendDirection, size: number = 16) => {
    switch (trend) {
        case 'improving': return <TrendingUp size={size} className="text-green-500" />;
        case 'deteriorating': return <TrendingDown size={size} className="text-red-500" />;
        case 'stable': return <Minus size={size} className="text-gray-400" />;
    }
};

const getTrendLabel = (trend: KPITrendDirection): string => {
    switch (trend) {
        case 'improving': return 'Improving';
        case 'deteriorating': return 'Deteriorating';
        case 'stable': return 'Stable';
    }
};

// =============================================================================
// STATUS INDICATOR COMPONENT
// =============================================================================

function StatusIndicator({ status, showLabel = true }: { status: KPIStatus; showLabel?: boolean }) {
    return (
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${getStatusBg(status)}`}>
            {status === 'on_track' ? (
                <CheckCircle2 size={14} className="text-green-500" />
            ) : status === 'watch' ? (
                <AlertCircle size={14} className="text-amber-500" />
            ) : (
                <XCircle size={14} className="text-red-500" />
            )}
            {showLabel && (
                <span className={`text-xs font-medium ${getStatusColor(status)}`}>
                    {getStatusLabel(status)}
                </span>
            )}
        </div>
    );
}

// =============================================================================
// KPI CARD COMPONENT
// =============================================================================

function KPICard({
    title,
    value,
    format,
    kpiValue,
    icon: Icon,
    color,
    onClick,
    showTarget = true,
}: {
    title: string;
    value: number;
    format: 'percent' | 'currency' | 'days' | 'ratio' | 'months';
    kpiValue: KPIValue;
    icon: React.ElementType;
    color: string;
    onClick?: () => void;
    showTarget?: boolean;
}) {
    const formattedValue = format === 'percent' ? `${value.toFixed(1)}%`
        : format === 'currency' ? formatCurrency(value, true)
        : format === 'days' ? `${value} days`
        : format === 'months' ? `${value} months`
        : `${value.toFixed(1)}x`;

    const deltaColor = kpiValue.deltaVsPrior >= 0 ? 'text-green-500' : 'text-red-500';

    return (
        <Card
            variant="glass"
            padding="lg"
            className={`cursor-pointer hover:scale-[1.02] transition-transform ${onClick ? '' : 'cursor-default'}`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    color === 'green' ? 'bg-green-500/10' :
                    color === 'blue' ? 'bg-blue-500/10' :
                    color === 'purple' ? 'bg-purple-500/10' :
                    color === 'orange' ? 'bg-orange-500/10' :
                    'bg-gray-500/10'
                }`}>
                    <Icon size={20} className={
                        color === 'green' ? 'text-green-500' :
                        color === 'blue' ? 'text-blue-500' :
                        color === 'purple' ? 'text-purple-500' :
                        color === 'orange' ? 'text-orange-500' :
                        'text-gray-500'
                    } />
                </div>
                <StatusIndicator status={kpiValue.status} showLabel={false} />
            </div>
            
            <p className="text-sm text-gray-500 dark:text-surface-400 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-surface-100 mb-2">
                {formattedValue}
            </p>
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {getTrendIcon(kpiValue.trend, 14)}
                    <span className={`text-sm ${deltaColor}`}>
                        {formatPercent(kpiValue.deltaVsPriorPercent)} vs prior
                    </span>
                </div>
                {showTarget && kpiValue.target !== undefined && (
                    <span className="text-xs text-gray-500">
                        Target: {format === 'percent' ? `${kpiValue.target}%` : 
                                 format === 'currency' ? formatCurrency(kpiValue.target, true) :
                                 format === 'days' ? `${kpiValue.target}d` :
                                 format === 'months' ? `${kpiValue.target}mo` :
                                 `${kpiValue.target}x`}
                    </span>
                )}
            </div>
        </Card>
    );
}

// =============================================================================
// OVERVIEW TAB
// =============================================================================

function OverviewTab() {
    const {
        marginMetrics,
        burnRunwayMetrics,
        cccMetrics,
        unitEconomicsMetrics,
        summary,
        alerts,
        setActiveTab,
        dismissAlert,
    } = useKPIStore();

    const activeAlerts = alerts.filter(a => !a.isDismissed);

    if (!summary || !marginMetrics || !burnRunwayMetrics || !cccMetrics || !unitEconomicsMetrics) return null;

    return (
        <div className="space-y-6">
            {/* Status Summary */}
            <div className="grid grid-cols-3 gap-4">
                <Card variant="glass" padding="md" className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle2 size={20} className="text-green-500" />
                        <span className="text-2xl font-bold text-green-500">{summary.onTrackCount}</span>
                    </div>
                    <p className="text-sm text-gray-500">On Track</p>
                </Card>
                <Card variant="glass" padding="md" className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <AlertCircle size={20} className="text-amber-500" />
                        <span className="text-2xl font-bold text-amber-500">{summary.watchCount}</span>
                    </div>
                    <p className="text-sm text-gray-500">Watch</p>
                </Card>
                <Card variant="glass" padding="md" className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <XCircle size={20} className="text-red-500" />
                        <span className="text-2xl font-bold text-red-500">{summary.offTrackCount}</span>
                    </div>
                    <p className="text-sm text-gray-500">Off Track</p>
                </Card>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Gross Margin"
                    value={marginMetrics.grossMargin.current}
                    format="percent"
                    kpiValue={marginMetrics.grossMargin}
                    icon={Percent}
                    color="green"
                    onClick={() => setActiveTab('margins')}
                />
                <KPICard
                    title="Net Burn Rate"
                    value={burnRunwayMetrics.netBurnMonthly.current}
                    format="currency"
                    kpiValue={burnRunwayMetrics.netBurnMonthly}
                    icon={Activity}
                    color="orange"
                    onClick={() => setActiveTab('burn')}
                />
                <KPICard
                    title="Cash Runway"
                    value={burnRunwayMetrics.currentRunwayMonths}
                    format="months"
                    kpiValue={{ ...burnRunwayMetrics.netBurnMonthly, current: burnRunwayMetrics.currentRunwayMonths, target: 18 }}
                    icon={Clock}
                    color="blue"
                    onClick={() => setActiveTab('burn')}
                />
                <KPICard
                    title="LTV/CAC Ratio"
                    value={unitEconomicsMetrics.ltvCacRatio.current}
                    format="ratio"
                    kpiValue={unitEconomicsMetrics.ltvCacRatio}
                    icon={Target}
                    color="purple"
                    onClick={() => setActiveTab('unit_economics')}
                />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">Operating Margin</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                        {marginMetrics.operatingMargin.current.toFixed(1)}%
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                        {getTrendIcon(marginMetrics.operatingMargin.trend, 12)}
                        <span className="text-xs text-gray-500">{getTrendLabel(marginMetrics.operatingMargin.trend)}</span>
                    </div>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">Cash Conversion</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                        {cccMetrics.netCCC.current} days
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                        {getTrendIcon(cccMetrics.netCCC.trend, 12)}
                        <span className="text-xs text-gray-500">{getTrendLabel(cccMetrics.netCCC.trend)}</span>
                    </div>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">DSO</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                        {cccMetrics.dso.current} days
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                        {getTrendIcon(cccMetrics.dso.trend, 12)}
                        <span className="text-xs text-gray-500">Target: {cccMetrics.dso.target}d</span>
                    </div>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">CAC</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                        {formatCurrency(unitEconomicsMetrics.cac.current, true)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                        {getTrendIcon(unitEconomicsMetrics.cac.trend, 12)}
                        <span className="text-xs text-gray-500">{getTrendLabel(unitEconomicsMetrics.cac.trend)}</span>
                    </div>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">LTV</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                        {formatCurrency(unitEconomicsMetrics.ltv.current, true)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                        {getTrendIcon(unitEconomicsMetrics.ltv.trend, 12)}
                        <span className="text-xs text-gray-500">{getTrendLabel(unitEconomicsMetrics.ltv.trend)}</span>
                    </div>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-xs text-gray-500 dark:text-surface-400">Payback Period</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                        {unitEconomicsMetrics.paybackPeriod.current} mo
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                        {getTrendIcon(unitEconomicsMetrics.paybackPeriod.trend, 12)}
                        <span className="text-xs text-gray-500">Target: {unitEconomicsMetrics.paybackPeriod.target}mo</span>
                    </div>
                </Card>
            </div>

            {/* Alerts */}
            {activeAlerts.length > 0 && (
                <Card variant="glass" padding="lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-surface-100 flex items-center gap-2">
                            <Bell size={18} className="text-amber-500" />
                            Active Alerts
                        </h3>
                        <span className="text-xs text-gray-500">{activeAlerts.length} alerts</span>
                    </div>
                    <div className="space-y-2">
                        {activeAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`flex items-start gap-3 p-3 rounded-xl ${
                                    alert.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20' :
                                    alert.severity === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20' :
                                    'bg-blue-50 dark:bg-blue-900/20'
                                }`}
                            >
                                {alert.severity === 'critical' ? (
                                    <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                                ) : alert.severity === 'warning' ? (
                                    <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-surface-100 text-sm">
                                        {alert.title}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-surface-400 mt-0.5">
                                        {alert.message}
                                    </p>
                                    {alert.suggestedAction && (
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                            → {alert.suggestedAction}
                                        </p>
                                    )}
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

            {/* Trend Summary */}
            <Card variant="glass" padding="lg">
                <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">Trend Summary</h3>
                <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <TrendingUp size={24} className="text-green-500" />
                            <span className="text-3xl font-bold text-green-500">{summary.improvingCount}</span>
                        </div>
                        <p className="text-sm text-gray-500">Improving</p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Minus size={24} className="text-gray-400" />
                            <span className="text-3xl font-bold text-gray-500">{summary.stableCount}</span>
                        </div>
                        <p className="text-sm text-gray-500">Stable</p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <TrendingDown size={24} className="text-red-500" />
                            <span className="text-3xl font-bold text-red-500">{summary.deterioratingCount}</span>
                        </div>
                        <p className="text-sm text-gray-500">Deteriorating</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}

// =============================================================================
// MARGINS TAB
// =============================================================================

function MarginsTab() {
    const { marginMetrics, viewPreferences } = useKPIStore();
    const [selectedMargin, setSelectedMargin] = useState<'gross' | 'contribution' | 'operating'>('gross');
    const [showExplanation, setShowExplanation] = useState(false);

    // Mock history and explanation data since methods don't exist in store
    const history: { period: string; value: number; periodLabel: string }[] = [];
    const explanation = 'Margin analysis based on current financial data';

    if (!marginMetrics) {
        return <div className="p-4 text-gray-500">Loading margin metrics...</div>;
    }

    const marginTypes = [
        { key: 'gross' as const, label: 'Gross Margin', value: marginMetrics.grossMargin },
        { key: 'contribution' as const, label: 'Contribution Margin', value: marginMetrics.contributionMargin },
        { key: 'operating' as const, label: 'Operating Margin', value: marginMetrics.operatingMargin },
    ];

    return (
        <div className="space-y-6">
            {/* Margin Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {marginTypes.map((m) => (
                    <Card
                        key={m.key}
                        variant="glass"
                        padding="lg"
                        className={`cursor-pointer transition-all ${
                            selectedMargin === m.key ? 'ring-2 ring-[var(--accent-primary)]' : ''
                        }`}
                        onClick={() => setSelectedMargin(m.key)}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <p className="text-sm text-gray-500 dark:text-surface-400">{m.label}</p>
                            <StatusIndicator status={m.value.status} showLabel={false} />
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-surface-100 mb-2">
                            {m.value.current.toFixed(1)}%
                        </p>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1">
                                {getTrendIcon(m.value.trend, 14)}
                                <span className={m.value.deltaVsPrior >= 0 ? 'text-green-500' : 'text-red-500'}>
                                    {formatPercent(m.value.deltaVsPriorPercent)}
                                </span>
                            </div>
                            <span className="text-gray-500">Target: {m.value.target}%</span>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Additional Margins */}
            <div className="grid grid-cols-2 gap-4">
                <Card variant="glass" padding="md">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-500">EBITDA Margin</p>
                            <p className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {marginMetrics.ebitdaMargin.current.toFixed(1)}%
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            {getTrendIcon(marginMetrics.ebitdaMargin.trend, 14)}
                            <span className={`text-sm ${marginMetrics.ebitdaMargin.deltaVsPrior >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {formatPercent(marginMetrics.ebitdaMargin.deltaVsPriorPercent)}
                            </span>
                        </div>
                    </div>
                </Card>
                <Card variant="glass" padding="md">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-500">Net Margin</p>
                            <p className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {marginMetrics.netMargin.current.toFixed(1)}%
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            {getTrendIcon(marginMetrics.netMargin.trend, 14)}
                            <span className={`text-sm ${marginMetrics.netMargin.deltaVsPrior >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {formatPercent(marginMetrics.netMargin.deltaVsPriorPercent)}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Margin Drivers */}
            <Card variant="glass" padding="lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-surface-100">Margin Drivers</h3>
                    <button
                        onClick={() => setShowExplanation(!showExplanation)}
                        className="text-sm text-[var(--accent-primary)] flex items-center gap-1"
                    >
                        <HelpCircle size={14} />
                        Explain
                    </button>
                </div>
                <div className="space-y-4">
                    {marginMetrics.marginDrivers.map((driver) => (
                        <div key={driver.id} className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700 dark:text-surface-300">{driver.name}</span>
                                    <span className={driver.direction === 'positive' ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                                        {driver.direction === 'positive' ? '+' : '-'}{driver.impact.toFixed(1)}pp
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-surface-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${driver.direction === 'positive' ? 'bg-green-500' : 'bg-red-500'}`}
                                        style={{ width: `${driver.impactPercent}%` }}
                                    />
                                </div>
                            </div>
                            <span className="text-xs text-gray-500 w-12">{driver.impactPercent}%</span>
                        </div>
                    ))}
                </div>

                {showExplanation && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-surface-700">
                        <p className="text-sm text-gray-600 dark:text-surface-400">{explanation}</p>
                    </div>
                )}
            </Card>

            {/* Breakdown by Segment */}
            <Card variant="glass" padding="lg">
                <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">Margin by Product</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-surface-700">
                                <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Gross</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Contribution</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Operating</th>
                                <th className="text-center p-3 text-xs font-medium text-gray-500 uppercase">Trend</th>
                            </tr>
                        </thead>
                        <tbody>
                            {marginMetrics.byProduct.map((item) => (
                                <tr key={item.segment} className="border-b border-gray-100 dark:border-surface-800">
                                    <td className="p-3 font-medium text-gray-900 dark:text-surface-100">{item.segment}</td>
                                    <td className="p-3 text-right text-gray-600 dark:text-surface-400">
                                        {formatCurrency(item.revenue, true)}
                                    </td>
                                    <td className="p-3 text-right font-medium text-gray-900 dark:text-surface-100">
                                        {item.grossMargin.toFixed(1)}%
                                    </td>
                                    <td className="p-3 text-right text-gray-600 dark:text-surface-400">
                                        {item.contributionMargin.toFixed(1)}%
                                    </td>
                                    <td className="p-3 text-right text-gray-600 dark:text-surface-400">
                                        {item.operatingMargin.toFixed(1)}%
                                    </td>
                                    <td className="p-3 text-center">{getTrendIcon(item.trend, 16)}</td>
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
// BURN & RUNWAY TAB
// =============================================================================

function BurnTab() {
    const { burnRunwayMetrics } = useKPIStore();

    if (!burnRunwayMetrics) {
        return <div className="p-4 text-gray-500">Loading burn metrics...</div>;
    }

    const runwayProgress = Math.min((burnRunwayMetrics.currentRunwayMonths / 24) * 100, 100);
    const isRunwayHealthy = burnRunwayMetrics.currentRunwayMonths >= 18;

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card variant="glass" padding="lg">
                    <div className="flex items-start justify-between mb-2">
                        <p className="text-sm text-gray-500">Net Burn (Monthly)</p>
                        <StatusIndicator status={burnRunwayMetrics.netBurnMonthly.status} showLabel={false} />
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-surface-100 mb-2">
                        {formatCurrency(burnRunwayMetrics.netBurnMonthly.current, true)}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                        {getTrendIcon(burnRunwayMetrics.netBurnMonthly.trend, 14)}
                        <span className={burnRunwayMetrics.netBurnMonthly.deltaVsPrior <= 0 ? 'text-green-500' : 'text-red-500'}>
                            {formatPercent(burnRunwayMetrics.netBurnMonthly.deltaVsPriorPercent)} vs prior
                        </span>
                    </div>
                </Card>
                <Card variant="glass" padding="lg">
                    <p className="text-sm text-gray-500 mb-2">Cash Runway</p>
                    <p className={`text-3xl font-bold mb-2 ${isRunwayHealthy ? 'text-green-500' : 'text-amber-500'}`}>
                        {burnRunwayMetrics.currentRunwayMonths} months
                    </p>
                    <p className="text-sm text-gray-500">
                        Until {new Date(burnRunwayMetrics.currentRunwayDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                    <div className="mt-3 h-2 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${isRunwayHealthy ? 'bg-green-500' : 'bg-amber-500'}`}
                            style={{ width: `${runwayProgress}%` }}
                        />
                    </div>
                </Card>
                <Card variant="glass" padding="lg">
                    <p className="text-sm text-gray-500 mb-2">Current Cash</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-surface-100 mb-2">
                        {formatCurrency(burnRunwayMetrics.currentCash, true)}
                    </p>
                    <p className="text-sm text-gray-500">
                        Gross burn: {formatCurrency(burnRunwayMetrics.grossBurn, true)}/mo
                    </p>
                </Card>
            </div>

            {/* Burn Breakdown */}
            <Card variant="glass" padding="lg">
                <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">Burn Breakdown</h3>
                <div className="space-y-4">
                    {burnRunwayMetrics.burnBreakdown.map((item) => (
                        <div key={item.label} className="flex items-center gap-4">
                            <div className="w-32 flex items-center gap-2">
                                <Badge
                                    variant={item.category === 'operational' ? 'info' : item.category === 'discretionary' ? 'warning' : 'neutral'}
                                    size="sm"
                                >
                                    {item.category}
                                </Badge>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700 dark:text-surface-300">{item.label}</span>
                                    <span className="font-medium text-gray-900 dark:text-surface-100">
                                        {formatCurrency(item.amount, true)}
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-surface-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${
                                            item.category === 'operational' ? 'bg-blue-500' :
                                            item.category === 'discretionary' ? 'bg-amber-500' : 'bg-gray-500'
                                        }`}
                                        style={{ width: `${item.percentOfTotal}%` }}
                                    />
                                </div>
                            </div>
                            <div className="w-20 text-right">
                                <span className="text-sm text-gray-500">{item.percentOfTotal.toFixed(1)}%</span>
                            </div>
                            <div className="w-16 text-center">{getTrendIcon(item.trend, 16)}</div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Runway Scenarios */}
            <Card variant="glass" padding="lg">
                <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">Runway Scenarios</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {burnRunwayMetrics.runwayScenarios.map((scenario) => (
                        <div
                            key={scenario.id}
                            className={`p-4 rounded-xl border-2 ${
                                scenario.type === 'current' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' :
                                scenario.type === 'stressed' ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10' :
                                'border-green-500 bg-green-50/50 dark:bg-green-900/10'
                            }`}
                        >
                            <h4 className="font-medium text-gray-900 dark:text-surface-100 mb-2">{scenario.name}</h4>
                            <p className={`text-2xl font-bold mb-2 ${
                                scenario.type === 'current' ? 'text-blue-600' :
                                scenario.type === 'stressed' ? 'text-red-600' : 'text-green-600'
                            }`}>
                                {scenario.runwayMonths} months
                            </p>
                            <p className="text-sm text-gray-500 mb-3">
                                Until {new Date(scenario.runwayDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                            <div className="text-xs text-gray-500 space-y-1">
                                {scenario.assumptions.map((a, i) => (
                                    <p key={i}>• {a}</p>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Runway Cliff Visualization */}
            <Card variant="glass" padding="lg">
                <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">Runway Timeline</h3>
                <div className="relative h-16 bg-gradient-to-r from-green-500 via-amber-500 to-red-500 rounded-xl overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-between px-4">
                        <span className="text-white text-sm font-medium">Today</span>
                        <span className="text-white text-sm font-medium">
                            {new Date(burnRunwayMetrics.cliffDate || '').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                    {/* 18-month marker */}
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white/50"
                        style={{ left: `${(18 / burnRunwayMetrics.currentRunwayMonths) * 100}%` }}
                    >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
                            18mo threshold
                        </div>
                    </div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>0 months</span>
                    <span>{burnRunwayMetrics.currentRunwayMonths} months</span>
                </div>
            </Card>
        </div>
    );
}

// =============================================================================
// CASH CONVERSION CYCLE TAB
// =============================================================================

function CCCTab() {
    const { cccMetrics } = useKPIStore();

    if (!cccMetrics) {
        return <div className="p-4 text-gray-500">Loading CCC metrics...</div>;
    }

    return (
        <div className="space-y-6">
            {/* CCC Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card variant="glass" padding="lg" className="md:col-span-1">
                    <div className="flex items-start justify-between mb-2">
                        <p className="text-sm text-gray-500">Net CCC</p>
                        <StatusIndicator status={cccMetrics.netCCC.status} showLabel={false} />
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-surface-100 mb-2">
                        {cccMetrics.netCCC.current} days
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                        {getTrendIcon(cccMetrics.netCCC.trend, 14)}
                        <span className={cccMetrics.netCCC.deltaVsPrior <= 0 ? 'text-green-500' : 'text-red-500'}>
                            {cccMetrics.netCCC.deltaVsPrior <= 0 ? '' : '+'}{cccMetrics.netCCC.deltaVsPrior} days
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Target: {cccMetrics.internalTarget} days
                    </p>
                </Card>
                
                {cccMetrics.components.map((comp) => (
                    <Card key={comp.metric} variant="glass" padding="lg">
                        <div className="flex items-start justify-between mb-2">
                            <p className="text-sm text-gray-500">{comp.name}</p>
                            {getTrendIcon(comp.trend, 14)}
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-surface-100 mb-1">
                            {comp.value} days
                        </p>
                        <p className="text-xs text-gray-500">
                            Target: {comp.target}d | Benchmark: {comp.benchmark}d
                        </p>
                        <div className="mt-3 h-1.5 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${
                                    comp.metric === 'dso' || comp.metric === 'dio'
                                        ? comp.value <= comp.target ? 'bg-green-500' : 'bg-amber-500'
                                        : comp.value >= comp.target ? 'bg-green-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min((comp.value / (comp.target * 1.5)) * 100, 100)}%` }}
                            />
                        </div>
                    </Card>
                ))}
            </div>

            {/* CCC Visualization */}
            <Card variant="glass" padding="lg">
                <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">Cash Conversion Formula</h3>
                <div className="flex items-center justify-center gap-4 py-8">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">DSO</p>
                        <p className="text-2xl font-bold text-blue-600">{cccMetrics.dso.current}</p>
                    </div>
                    <span className="text-2xl text-gray-400">+</span>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">DIO</p>
                        <p className="text-2xl font-bold text-purple-600">{cccMetrics.dio.current}</p>
                    </div>
                    <span className="text-2xl text-gray-400">−</span>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">DPO</p>
                        <p className="text-2xl font-bold text-green-600">{cccMetrics.dpo.current}</p>
                    </div>
                    <span className="text-2xl text-gray-400">=</span>
                    <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border-2 border-amber-500">
                        <p className="text-sm text-gray-500 mb-1">CCC</p>
                        <p className="text-2xl font-bold text-amber-600">{cccMetrics.netCCC.current}</p>
                    </div>
                </div>
            </Card>

            {/* Drivers & Benchmarks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card variant="glass" padding="lg">
                    <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">Component Drivers</h3>
                    <div className="space-y-4">
                        {cccMetrics.components.map((comp) => (
                            <div key={comp.metric}>
                                <p className="text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
                                    {comp.name}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {comp.drivers.map((driver, i) => (
                                        <span
                                            key={i}
                                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-surface-700 rounded"
                                        >
                                            {driver}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card variant="glass" padding="lg">
                    <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">Benchmark Comparison</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-surface-800/50 rounded-lg">
                            <span className="text-sm text-gray-600 dark:text-surface-400">Your CCC</span>
                            <span className="font-semibold text-gray-900 dark:text-surface-100">{cccMetrics.netCCC.current} days</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-surface-800/50 rounded-lg">
                            <span className="text-sm text-gray-600 dark:text-surface-400">Internal Target</span>
                            <span className="font-semibold text-green-600">{cccMetrics.internalTarget} days</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-surface-800/50 rounded-lg">
                            <span className="text-sm text-gray-600 dark:text-surface-400">Industry Benchmark</span>
                            <span className="font-semibold text-blue-600">{cccMetrics.industryBenchmark} days</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-surface-800/50 rounded-lg">
                            <span className="text-sm text-gray-600 dark:text-surface-400">Peer Range</span>
                            <span className="font-semibold text-gray-600">{cccMetrics.peerRangeMin} - {cccMetrics.peerRangeMax} days</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Working Capital */}
            <Card variant="glass" padding="lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-surface-100">Working Capital</h3>
                        <p className="text-sm text-gray-500">Net working capital tied up in operations</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 dark:text-surface-100">
                            {formatCurrency(cccMetrics.workingCapital)}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                            {getTrendIcon(cccMetrics.workingCapitalEfficiency, 14)}
                            <span className="text-sm text-gray-500">
                                {cccMetrics.workingCapitalDays} days equivalent
                            </span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

// =============================================================================
// UNIT ECONOMICS TAB
// =============================================================================

function UnitEconomicsTab() {
    const { unitEconomicsMetrics } = useKPIStore();

    if (!unitEconomicsMetrics) {
        return <div className="p-4 text-gray-500">Loading unit economics...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Core Unit Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                    title="Revenue / Unit"
                    value={unitEconomicsMetrics.revenuePerUnit.current}
                    format="currency"
                    kpiValue={unitEconomicsMetrics.revenuePerUnit}
                    icon={DollarSign}
                    color="green"
                />
                <KPICard
                    title="Variable Cost / Unit"
                    value={unitEconomicsMetrics.variableCostPerUnit.current}
                    format="currency"
                    kpiValue={unitEconomicsMetrics.variableCostPerUnit}
                    icon={Activity}
                    color="orange"
                />
                <KPICard
                    title="Contribution / Unit"
                    value={unitEconomicsMetrics.contributionPerUnit.current}
                    format="currency"
                    kpiValue={unitEconomicsMetrics.contributionPerUnit}
                    icon={TrendingUp}
                    color="blue"
                />
                <KPICard
                    title="Margin / Unit"
                    value={unitEconomicsMetrics.marginPerUnit.current}
                    format="percent"
                    kpiValue={unitEconomicsMetrics.marginPerUnit}
                    icon={Percent}
                    color="purple"
                />
            </div>

            {/* Customer Economics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                    title="CAC"
                    value={unitEconomicsMetrics.cac.current}
                    format="currency"
                    kpiValue={unitEconomicsMetrics.cac}
                    icon={Users}
                    color="orange"
                />
                <KPICard
                    title="LTV"
                    value={unitEconomicsMetrics.ltv.current}
                    format="currency"
                    kpiValue={unitEconomicsMetrics.ltv}
                    icon={Target}
                    color="green"
                />
                <KPICard
                    title="LTV/CAC Ratio"
                    value={unitEconomicsMetrics.ltvCacRatio.current}
                    format="ratio"
                    kpiValue={unitEconomicsMetrics.ltvCacRatio}
                    icon={Gauge}
                    color="blue"
                />
                <KPICard
                    title="Payback Period"
                    value={unitEconomicsMetrics.paybackPeriod.current}
                    format="months"
                    kpiValue={unitEconomicsMetrics.paybackPeriod}
                    icon={Clock}
                    color="purple"
                />
            </div>

            {/* Cohort Analysis */}
            <Card variant="glass" padding="lg">
                <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">Cohort Analysis</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-surface-700">
                                <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Cohort</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">CAC</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">LTV</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">LTV/CAC</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Payback</th>
                                <th className="text-center p-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="text-center p-3 text-xs font-medium text-gray-500 uppercase">Trend</th>
                            </tr>
                        </thead>
                        <tbody>
                            {unitEconomicsMetrics.cohorts.map((cohort) => (
                                <tr key={cohort.cohortId} className="border-b border-gray-100 dark:border-surface-800">
                                    <td className="p-3">
                                        <p className="font-medium text-gray-900 dark:text-surface-100">{cohort.cohortName}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(cohort.cohortDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                        </p>
                                    </td>
                                    <td className="p-3 text-right text-gray-600 dark:text-surface-400">
                                        {formatCurrency(cohort.cac)}
                                    </td>
                                    <td className="p-3 text-right text-gray-600 dark:text-surface-400">
                                        {formatCurrency(cohort.ltv)}
                                    </td>
                                    <td className="p-3 text-right font-medium text-gray-900 dark:text-surface-100">
                                        {cohort.ltvCacRatio.toFixed(1)}x
                                    </td>
                                    <td className="p-3 text-right text-gray-600 dark:text-surface-400">
                                        {cohort.paybackMonths} mo
                                    </td>
                                    <td className="p-3 text-center">
                                        {cohort.isUnprofitable ? (
                                            <Badge variant="danger" size="sm">Unprofitable</Badge>
                                        ) : (
                                            <Badge variant="success" size="sm">Profitable</Badge>
                                        )}
                                    </td>
                                    <td className="p-3 text-center">{getTrendIcon(cohort.trend, 16)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Distribution & Unprofitable Units */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card variant="glass" padding="lg">
                    <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">Contribution Distribution</h3>
                    {unitEconomicsMetrics.distributions.map((dist) => (
                        <div key={dist.metric} className="mb-4">
                            <p className="text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">{dist.metric}</p>
                            <div className="relative h-8 bg-gray-100 dark:bg-surface-700 rounded-lg overflow-hidden">
                                {/* P10-P90 range */}
                                <div
                                    className="absolute top-0 bottom-0 bg-blue-200 dark:bg-blue-800/50"
                                    style={{
                                        left: `${((dist.p10 - dist.min) / (dist.max - dist.min)) * 100}%`,
                                        right: `${100 - ((dist.p90 - dist.min) / (dist.max - dist.min)) * 100}%`,
                                    }}
                                />
                                {/* P25-P75 range */}
                                <div
                                    className="absolute top-1 bottom-1 bg-blue-400 dark:bg-blue-600 rounded"
                                    style={{
                                        left: `${((dist.p25 - dist.min) / (dist.max - dist.min)) * 100}%`,
                                        right: `${100 - ((dist.p75 - dist.min) / (dist.max - dist.min)) * 100}%`,
                                    }}
                                />
                                {/* Median line */}
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-blue-600 dark:bg-blue-400"
                                    style={{ left: `${((dist.median - dist.min) / (dist.max - dist.min)) * 100}%` }}
                                />
                                {/* Average marker */}
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                                    style={{ left: `calc(${((dist.average - dist.min) / (dist.max - dist.min)) * 100}% - 6px)` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>{formatCurrency(dist.min)}</span>
                                <span>Avg: {formatCurrency(dist.average)} | Med: {formatCurrency(dist.median)}</span>
                                <span>{formatCurrency(dist.max)}</span>
                            </div>
                        </div>
                    ))}
                </Card>

                <Card variant="glass" padding="lg">
                    <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">Unprofitable Analysis</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-surface-400">Unprofitable Units</p>
                                <p className="text-2xl font-bold text-red-600">{unitEconomicsMetrics.unprofitableUnits}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">of total</p>
                                <p className="text-lg font-semibold text-red-600">{unitEconomicsMetrics.unprofitablePercent}%</p>
                            </div>
                        </div>
                        
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">Affected Segments</p>
                            <div className="flex flex-wrap gap-2">
                                {unitEconomicsMetrics.unprofitableSegments.map((seg, i) => (
                                    <Badge key={i} variant="danger" size="sm">{seg}</Badge>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-surface-700">
                            <p className="text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">Break-Even Analysis</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 dark:bg-surface-800/50 rounded-lg">
                                    <p className="text-xs text-gray-500">Break-Even Price</p>
                                    <p className="font-semibold text-gray-900 dark:text-surface-100">
                                        {formatCurrency(unitEconomicsMetrics.breakEvenPrice)}
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-surface-800/50 rounded-lg">
                                    <p className="text-xs text-gray-500">Break-Even Volume</p>
                                    <p className="font-semibold text-gray-900 dark:text-surface-100">
                                        {unitEconomicsMetrics.breakEvenVolume} units
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

// =============================================================================
// TRENDS TAB
// =============================================================================

function TrendsTab() {
    const { marginMetrics, burnRunwayMetrics, cccMetrics, unitEconomicsMetrics } = useKPIStore();

    if (!marginMetrics || !burnRunwayMetrics || !cccMetrics || !unitEconomicsMetrics) {
        return <div className="p-4 text-gray-500">Loading metrics...</div>;
    }

    const allKPIs = [
        { id: 'gross-margin', name: 'Gross Margin', value: marginMetrics.grossMargin, history: [] as { period: string; value: number; periodLabel: string }[] },
        { id: 'operating-margin', name: 'Operating Margin', value: marginMetrics.operatingMargin, history: [] as { period: string; value: number; periodLabel: string }[] },
        { id: 'net-burn', name: 'Net Burn', value: burnRunwayMetrics.netBurnMonthly, history: [] as { period: string; value: number; periodLabel: string }[] },
        { id: 'ccc', name: 'Cash Conversion Cycle', value: cccMetrics.netCCC, history: [] as { period: string; value: number; periodLabel: string }[] },
        { id: 'ltv-cac', name: 'LTV/CAC Ratio', value: unitEconomicsMetrics.ltvCacRatio, history: [] as { period: string; value: number; periodLabel: string }[] },
    ];

    return (
        <div className="space-y-6">
            {/* Trend Summary */}
            <Card variant="glass" padding="lg">
                <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">KPI Trend Summary</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-surface-700">
                                <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">KPI</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Current</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Previous</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Target</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Δ Prior</th>
                                <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Δ Target</th>
                                <th className="text-center p-3 text-xs font-medium text-gray-500 uppercase">Trend</th>
                                <th className="text-center p-3 text-xs font-medium text-gray-500 uppercase">Momentum</th>
                                <th className="text-center p-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allKPIs.map((kpi) => (
                                <tr key={kpi.id} className="border-b border-gray-100 dark:border-surface-800">
                                    <td className="p-3 font-medium text-gray-900 dark:text-surface-100">{kpi.name}</td>
                                    <td className="p-3 text-right font-medium">{kpi.value.current.toFixed(1)}</td>
                                    <td className="p-3 text-right text-gray-500">{kpi.value.previous.toFixed(1)}</td>
                                    <td className="p-3 text-right text-gray-500">{kpi.value.target?.toFixed(1) || '—'}</td>
                                    <td className={`p-3 text-right ${kpi.value.deltaVsPrior >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {formatPercent(kpi.value.deltaVsPriorPercent)}
                                    </td>
                                    <td className={`p-3 text-right ${(kpi.value.deltaVsTargetPercent || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {kpi.value.deltaVsTargetPercent !== undefined ? formatPercent(kpi.value.deltaVsTargetPercent) : '—'}
                                    </td>
                                    <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            {getTrendIcon(kpi.value.trend, 14)}
                                            <span className="text-xs text-gray-500 capitalize">{kpi.value.trend}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                            kpi.value.momentum === 'accelerating' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            kpi.value.momentum === 'decelerating' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                            'bg-gray-100 text-gray-700 dark:bg-surface-700 dark:text-surface-400'
                                        }`}>
                                            {kpi.value.momentum}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center">
                                        <StatusIndicator status={kpi.value.status} showLabel={false} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Trend Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {allKPIs.slice(0, 4).map((kpi) => (
                    <Card key={kpi.id} variant="glass" padding="lg">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-surface-100">{kpi.name}</h4>
                            {getTrendIcon(kpi.value.trend, 18)}
                        </div>
                        <div className="h-32 flex items-end justify-between gap-1 px-2">
                            {kpi.history.length > 0 ? (
                                kpi.history.map((point, i) => {
                                    const maxVal = Math.max(...kpi.history.map((h) => h.value));
                                    const height = (point.value / maxVal) * 100;
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center">
                                            <div
                                                className="w-full bg-[var(--accent-primary)] rounded-t"
                                                style={{ height: `${height}%` }}
                                            />
                                            <span className="text-xs text-gray-500 mt-1">{point.periodLabel}</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <p className="text-sm text-gray-400">Chart visualization</p>
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function KPIsPage() {
    const { t } = useThemeStore();
    const {
        activeTab,
        setActiveTab,
        isLoading,
        fetchKPIs,
        fetchSummary,
        fetchAlerts,
        viewPreferences,
        setViewPreferences,
        alerts,
    } = useKPIStore();

    const activeAlerts = alerts.filter(a => !a.isDismissed);

    useEffect(() => {
        fetchKPIs();
        fetchSummary();
        fetchAlerts();
    }, [fetchKPIs, fetchSummary, fetchAlerts]);

    const tabs: { id: KPITab; label: string; icon: React.ElementType }[] = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'margins', label: 'Margins', icon: Percent },
        { id: 'burn', label: 'Burn & Runway', icon: Activity },
        { id: 'ccc', label: 'Cash Conversion', icon: Clock },
        { id: 'unit_economics', label: 'Unit Economics', icon: Target },
        { id: 'trends', label: 'Trends', icon: LineChart },
    ];

    const renderTab = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab />;
            case 'margins': return <MarginsTab />;
            case 'burn': return <BurnTab />;
            case 'ccc': return <CCCTab />;
            case 'unit_economics': return <UnitEconomicsTab />;
            case 'trends': return <TrendsTab />;
            default: return <OverviewTab />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
                        KPIs & Performance
                    </h1>
                    <p className="text-gray-500 dark:text-surface-500 mt-1">
                        Track key performance indicators and business health metrics
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    {/* Time Horizon */}
                    <select
                        value={viewPreferences.timeHorizon}
                        onChange={(e) => setViewPreferences({ timeHorizon: e.target.value as KPITimeHorizon })}
                        className="px-3 py-2 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-sm"
                    >
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                        <option value="trailing_3m">Trailing 3M</option>
                        <option value="trailing_6m">Trailing 6M</option>
                        <option value="trailing_12m">Trailing 12M</option>
                    </select>
                    
                    {/* View Options */}
                    <div className="flex items-center gap-2 border-l border-gray-200 dark:border-surface-700 pl-3">
                        <button
                            onClick={() => setViewPreferences({ showTargets: !viewPreferences.showTargets })}
                            className={`p-2 rounded-lg border ${
                                viewPreferences.showTargets
                                    ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                    : 'border-gray-200 dark:border-surface-700 text-gray-500'
                            }`}
                            title="Show targets"
                        >
                            <Target size={16} />
                        </button>
                        <button
                            onClick={() => setViewPreferences({ showTrends: !viewPreferences.showTrends })}
                            className={`p-2 rounded-lg border ${
                                viewPreferences.showTrends
                                    ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                    : 'border-gray-200 dark:border-surface-700 text-gray-500'
                            }`}
                            title="Show trends"
                        >
                            <TrendingUp size={16} />
                        </button>
                    </div>
                    
                    {/* Alerts */}
                    <button className="relative p-2 rounded-xl bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700">
                        <Bell size={18} className="text-gray-600 dark:text-surface-400" />
                        {activeAlerts.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {activeAlerts.length}
                            </span>
                        )}
                    </button>
                    
                    <Button variant="secondary" leftIcon={<Download size={16} />}>
                        Export
                    </Button>
                </div>
            </div>

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