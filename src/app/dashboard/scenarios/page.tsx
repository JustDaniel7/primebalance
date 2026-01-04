'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GitBranch,
    TrendingUp,
    TrendingDown,
    Target,
    Wallet,
    BarChart3,
    LineChart,
    PieChart,
    Layers,
    Plus,
    Copy,
    Trash2,
    Archive,
    Lock,
    Unlock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    AlertCircle,
    AlertOctagon,
    Clock,
    RefreshCw,
    Download,
    Upload,
    Filter,
    Search,
    SlidersHorizontal,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    X,
    MoreVertical,
    Eye,
    EyeOff,
    Edit3,
    Play,
    Pause,
    RotateCcw,
    Bookmark,
    Tag,
    Users,
    User,
    Building2,
    Globe,
    MessageSquare,
    Send,
    Check,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Zap,
    Shield,
    Activity,
    Sliders,
    Info,
    HelpCircle,
    ExternalLink,
} from 'lucide-react';
import { Card, Button, Badge, ExportModal, convertToFormat, downloadFile, type ExportFormat } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useScenarioStore } from '@/store/scenario-store';
import toast from 'react-hot-toast';
import type {
    Scenario,
    ScenarioTab,
    ScenarioCaseType,
    ScenarioStatus,
    ScenarioVisibility,
    StressTest,
    StressTestTemplate,
    ScenarioAssumption,
    ScenarioComment,
    AssumptionCategory,
} from '@/types/scenarios';

// =============================================================================
// HELPERS
// =============================================================================

const formatCurrency = (value: number | undefined | null, compact: boolean = false): string => {
    if (value === undefined || value === null) return '—';
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

const formatPercent = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '—';
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

const getCaseTypeColor = (type: ScenarioCaseType): string => {
    switch (type) {
        case 'best_case': return 'green';
        case 'expected_case': return 'blue';
        case 'worst_case': return 'red';
        case 'custom': return 'purple';
    }
};

const getCaseTypeLabel = (type: ScenarioCaseType): string => {
    switch (type) {
        case 'best_case': return 'Best Case';
        case 'expected_case': return 'Expected';
        case 'worst_case': return 'Worst Case';
        case 'custom': return 'Custom';
    }
};

const getStatusColor = (status: ScenarioStatus): string => {
    switch (status) {
        case 'draft': return 'gray';
        case 'reviewed': return 'blue';
        case 'approved': return 'green';
        case 'locked': return 'amber';
        case 'archived': return 'slate';
    }
};

const getStatusBadgeVariant = (status: ScenarioStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
    switch (status) {
        case 'approved': return 'success';
        case 'locked': return 'warning';
        case 'archived': return 'neutral';
        case 'reviewed': return 'info';
        default: return 'neutral';
    }
};

const getVisibilityIcon = (visibility: ScenarioVisibility) => {
    switch (visibility) {
        case 'personal': return User;
        case 'team': return Users;
        case 'org_wide': return Globe;
    }
};

// =============================================================================
// OVERVIEW TAB
// =============================================================================

function OverviewTab() {
    const {
        scenarios,
        getComparison,
        selectScenario,
        setActiveTab,
        addToComparison,
    } = useScenarioStore();

    const baselineScenarios = scenarios.filter((s: Scenario) => s.caseType === 'expected_case' || s.caseType === 'best_case' || s.caseType === 'worst_case');
    const customScenarios = scenarios.filter((s: Scenario) => s.caseType === 'custom');
    const comparison = getComparison();

    const expectedCase = scenarios.find((s) => s.caseType === 'expected_case');

    return (
        <div className="space-y-6">
            {/* Baseline Scenarios */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-surface-100">Baseline Scenarios</h3>
                    <button
                        onClick={() => setActiveTab('baseline')}
                        className="text-sm text-[var(--accent-primary)] hover:underline"
                    >
                        View details →
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {baselineScenarios.map((scenario) => {
                        const isExpected = scenario.caseType === 'expected_case';
                        const delta = isExpected ? null : {
                            revenue: scenario.metrics.revenueDelta,
                            net: scenario.metrics.netDelta,
                        };
                        
                        return (
                            <Card
                                key={scenario.id}
                                variant="glass"
                                padding="lg"
                                className={`cursor-pointer hover:scale-[1.02] transition-transform ${
                                    isExpected ? 'ring-2 ring-[var(--accent-primary)]' : ''
                                }`}
                                onClick={() => selectScenario(scenario.id)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-surface-100">
                                            {scenario.name}
                                        </h4>
                                        <Badge
                                            variant={
                                                scenario.caseType === 'best_case' ? 'success' :
                                                scenario.caseType === 'worst_case' ? 'danger' : 'info'
                                            }
                                            size="sm"
                                            className="mt-1"
                                        >
                                            {getCaseTypeLabel(scenario.caseType)}
                                        </Badge>
                                    </div>
                                    <Badge variant={getStatusBadgeVariant(scenario.status)} size="sm">
                                        {scenario.status}
                                    </Badge>
                                </div>
                                
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Revenue</span>
                                        <div className="text-right">
                                            <span className="font-medium text-gray-900 dark:text-surface-100">
                                                {formatCurrency(scenario.metrics.revenue, true)}
                                            </span>
                                            {delta && (
                                                <span className={`ml-2 text-xs ${delta.revenue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {formatPercent(scenario.metrics.revenueChangePercent)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Net Position</span>
                                        <div className="text-right">
                                            <span className={`font-medium ${scenario.metrics.netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(scenario.metrics.netPosition, true)}
                                            </span>
                                            {delta && (
                                                <span className={`ml-2 text-xs ${delta.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {formatPercent(scenario.metrics.netChangePercent)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Cash</span>
                                        <span className="font-medium text-gray-900 dark:text-surface-100">
                                            {formatCurrency(scenario.metrics.cash, true)}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200 dark:border-surface-700">
                                    <span>Confidence: {scenario.confidence?.level ?? '—'}</span>
                                    <span suppressHydrationWarning>{new Date(scenario.lastModifiedAt).toLocaleDateString()}</span>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Spread Analysis */}
            {comparison && (
                <Card variant="glass" padding="lg">
                    <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">Scenario Spread</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {(['revenue', 'costs', 'cash', 'net'] as const).map((metric) => {
                            const spread = comparison.spread[metric];
                            const range = spread.max - spread.min;
                            const expectedValue = expectedCase?.metrics[metric === 'net' ? 'netPosition' : metric] || 0;
                            const position = range > 0 ? ((expectedValue - spread.min) / range) * 100 : 50;
                            
                            return (
                                <div key={metric}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-500 capitalize">{metric}</span>
                                        <span className="text-gray-400">Range: {formatCurrency(range, true)}</span>
                                    </div>
                                    <div className="relative h-8 bg-gradient-to-r from-red-100 via-amber-100 to-green-100 dark:from-red-900/30 dark:via-amber-900/30 dark:to-green-900/30 rounded-lg">
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-3 h-6 bg-blue-500 rounded shadow-lg"
                                            style={{ left: `calc(${position}% - 6px)` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>{formatCurrency(spread.min, true)}</span>
                                        <span>{formatCurrency(spread.max, true)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Custom Scenarios */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-surface-100">Custom Scenarios</h3>
                    <button
                        onClick={() => setActiveTab('custom')}
                        className="text-sm text-[var(--accent-primary)] hover:underline"
                    >
                        Manage →
                    </button>
                </div>
                {customScenarios.length === 0 ? (
                    <Card variant="glass" padding="lg">
                        <div className="text-center py-8">
                            <GitBranch size={32} className="mx-auto mb-2 text-gray-300 dark:text-surface-600" />
                            <p className="text-gray-500">No custom scenarios yet</p>
                            <Button
                                variant="primary"
                                size="sm"
                                leftIcon={<Plus size={16} />}
                                className="mt-3"
                                onClick={() => setActiveTab('custom')}
                            >
                                Create Scenario
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customScenarios.slice(0, 3).map((scenario) => {
                            const VisIcon = getVisibilityIcon(scenario.visibility);
                            return (
                                <Card
                                    key={scenario.id}
                                    variant="glass"
                                    padding="md"
                                    className="cursor-pointer hover:border-[var(--accent-primary)] transition-colors"
                                    onClick={() => selectScenario(scenario.id)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 dark:text-surface-100 truncate">
                                                {scenario.name}
                                            </h4>
                                            {scenario.derivedFromName && (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Based on: {scenario.derivedFromName}
                                                </p>
                                            )}
                                        </div>
                                        <VisIcon size={14} className="text-gray-400 flex-shrink-0" />
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge variant={getStatusBadgeVariant(scenario.status)} size="sm">
                                            {scenario.status}
                                        </Badge>
                                        {scenario.tags.slice(0, 2).map((tag) => (
                                            <span key={tag} className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-surface-700 rounded">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Net vs Expected</span>
                                        <span className={scenario.metrics.netDelta >= 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                                            {formatCurrency(scenario.metrics.netDelta, true)}
                                        </span>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                    onClick={() => setActiveTab('stress')}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 hover:border-[var(--accent-primary)] transition-colors"
                >
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <Zap size={20} className="text-red-500" />
                    </div>
                    <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-surface-100">Stress Tests</p>
                        <p className="text-xs text-gray-500">Run scenario stress tests</p>
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('simulation')}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 hover:border-[var(--accent-primary)] transition-colors"
                >
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Sliders size={20} className="text-purple-500" />
                    </div>
                    <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-surface-100">What-If</p>
                        <p className="text-xs text-gray-500">Interactive simulation</p>
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('compare')}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 hover:border-[var(--accent-primary)] transition-colors"
                >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Layers size={20} className="text-blue-500" />
                    </div>
                    <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-surface-100">Compare</p>
                        <p className="text-xs text-gray-500">Side-by-side analysis</p>
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('custom')}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 hover:border-[var(--accent-primary)] transition-colors"
                >
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <Plus size={20} className="text-green-500" />
                    </div>
                    <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-surface-100">New Scenario</p>
                        <p className="text-xs text-gray-500">Create custom scenario</p>
                    </div>
                </button>
            </div>
        </div>
    );
}

// =============================================================================
// BASELINE TAB
// =============================================================================

function BaselineTab() {
    const { scenarios, selectScenario, selectedScenarioId, getImpactExplanation } = useScenarioStore();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const baselineScenarios = scenarios.filter((s: Scenario) => s.caseType === 'expected_case' || s.caseType === 'best_case' || s.caseType === 'worst_case');
    const expectedCase = baselineScenarios.find((s: Scenario) => s.caseType === 'expected_case');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-surface-100">Baseline Scenarios</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Protected scenarios representing best, expected, and worst case outcomes
                    </p>
                </div>
            </div>

            {/* Comparison Table */}
            <Card variant="glass" padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-surface-700">
                                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Metric</th>
                                {baselineScenarios.map((s) => (
                                    <th key={s.id} className="text-right p-4 text-xs font-medium text-gray-500 uppercase">
                                        <div className="flex items-center justify-end gap-2">
                                            {s.name}
                                            {s.status === 'locked' && <Lock size={12} />}
                                        </div>
                                    </th>
                                ))}
                                <th className="text-right p-4 text-xs font-medium text-gray-500 uppercase">Spread</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { key: 'revenue', label: 'Revenue' },
                                { key: 'costs', label: 'Costs' },
                                { key: 'netPosition', label: 'Net Position' },
                                { key: 'cash', label: 'Cash' },
                                { key: 'profitMargin', label: 'Profit Margin', isPercent: true },
                                { key: 'cashRunwayDays', label: 'Cash Runway', suffix: ' days' },
                            ].map((row) => {
                                const values = baselineScenarios.map((s) => {
                                    const val = s.metrics[row.key as keyof typeof s.metrics];
                                    return typeof val === 'number' ? val : 0;
                                });
                                const min = Math.min(...values);
                                const max = Math.max(...values);
                                const spread = max - min;
                                
                                return (
                                    <tr key={row.key} className="border-b border-gray-100 dark:border-surface-800">
                                        <td className="p-4 font-medium text-gray-700 dark:text-surface-300">
                                            {row.label}
                                        </td>
                                        {baselineScenarios.map((s) => {
                                            const val = s.metrics[row.key as keyof typeof s.metrics];
                                            const numVal = typeof val === 'number' ? val : 0;
                                            const isExpected = s.caseType === 'expected_case';
                                            
                                            return (
                                                <td key={s.id} className={`p-4 text-right ${isExpected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                                    <span className="font-medium text-gray-900 dark:text-surface-100">
                                                        {row.isPercent
                                                            ? `${numVal?.toFixed(1) ?? '—'}%`
                                                            : row.suffix
                                                            ? `${numVal ?? '—'}${row.suffix}`
                                                            : formatCurrency(numVal, true)}
                                                    </span>
                                                </td>
                                            );
                                        })}
                                        <td className="p-4 text-right text-gray-500">
                                            {row.isPercent
                                                ? `${spread?.toFixed(1) ?? '—'}%`
                                                : row.suffix
                                                ? `${spread ?? '—'}${row.suffix}`
                                                : formatCurrency(spread, true)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Assumption Differences */}
            <Card variant="glass" padding="lg">
                <h4 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">
                    Key Assumption Differences
                </h4>
                <div className="space-y-4">
                    {expectedCase?.assumptions.slice(0, 5).map((assumption) => {
                        const bestVal = baselineScenarios.find((s) => s.caseType === 'best_case')?.assumptions.find((a) => a.id === assumption.id)?.currentValue || assumption.baseValue;
                        const worstVal = baselineScenarios.find((s) => s.caseType === 'worst_case')?.assumptions.find((a) => a.id === assumption.id)?.currentValue || assumption.baseValue;
                        const expectedVal = assumption.currentValue;
                        
                        const min = Math.min(bestVal, worstVal, expectedVal);
                        const max = Math.max(bestVal, worstVal, expectedVal);
                        const range = max - min || 1;
                        
                        return (
                            <div key={assumption.id}>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-700 dark:text-surface-300">{assumption.name}</span>
                                    <span className="text-gray-500">
                                        {assumption.unit === 'percentage' ? `${min}% - ${max}%` :
                                         assumption.unit === 'days' ? `${min} - ${max} days` :
                                         `${formatCurrency(min, true)} - ${formatCurrency(max, true)}`}
                                    </span>
                                </div>
                                <div className="relative h-6 bg-gray-100 dark:bg-surface-700 rounded-full">
                                    {/* Worst case marker */}
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-surface-800"
                                        style={{ left: `calc(${((worstVal - min) / range) * 100}% - 6px)` }}
                                        title={`Worst: ${worstVal}`}
                                    />
                                    {/* Expected case marker */}
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-surface-800 z-10"
                                        style={{ left: `calc(${((expectedVal - min) / range) * 100}% - 8px)` }}
                                        title={`Expected: ${expectedVal}`}
                                    />
                                    {/* Best case marker */}
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-surface-800"
                                        style={{ left: `calc(${((bestVal - min) / range) * 100}% - 6px)` }}
                                        title={`Best: ${bestVal}`}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-surface-700">
                    <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span className="text-gray-500">Best Case</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <div className="w-4 h-4 bg-blue-500 rounded-full" />
                        <span className="text-gray-500">Expected</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        <span className="text-gray-500">Worst Case</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}

// =============================================================================
// CUSTOM SCENARIOS TAB
// =============================================================================

function CustomTab() {
    const {
        scenarios,
        comments: allComments,
        selectScenario,
        selectedScenarioId,
        createScenario,
        cloneScenario,
        deleteScenario,
        archiveScenario,
        lockScenario,
        approveScenario,
        updateAssumption,
        addComment,
        filter,
        setFilter,
    } = useScenarioStore();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newScenarioName, setNewScenarioName] = useState('');
    const [baseScenarioId, setBaseScenarioId] = useState('expected-case');
    const [commentText, setCommentText] = useState('');

    const customScenarios = scenarios.filter((s: Scenario) => s.caseType === 'custom');
    const baselineScenarios = scenarios.filter((s: Scenario) => s.caseType === 'expected_case' || s.caseType === 'best_case' || s.caseType === 'worst_case');
    const selectedScenario = customScenarios.find((s: Scenario) => s.id === selectedScenarioId) ||
                             baselineScenarios.find((s: Scenario) => s.id === selectedScenarioId);
    const comments = selectedScenario ? allComments.filter((c: ScenarioComment) => c.scenarioId === selectedScenario.id) : [];

    const handleCreate = () => {
        if (!newScenarioName.trim()) return;
        cloneScenario(baseScenarioId, newScenarioName);
        setNewScenarioName('');
        setShowCreateModal(false);
        toast.success('Scenario created successfully');
    };

    const handleAddComment = () => {
        if (!commentText.trim() || !selectedScenario) return;
        addComment(selectedScenario.id, commentText);
        setCommentText('');
        toast.success('Comment added');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-surface-100">Custom Scenarios</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Create and manage custom scenarios for planning and analysis
                    </p>
                </div>
                <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
                    New Scenario
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Scenario List */}
                <div className="lg:col-span-1 space-y-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search scenarios..."
                            value={filter.searchQuery || ''}
                            onChange={(e) => setFilter({ searchQuery: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-sm"
                        />
                    </div>

                    {/* List */}
                    {customScenarios.length === 0 ? (
                        <Card variant="glass" padding="lg">
                            <div className="text-center py-4">
                                <GitBranch size={24} className="mx-auto mb-2 text-gray-300" />
                                <p className="text-sm text-gray-500">No custom scenarios</p>
                            </div>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {customScenarios.map((scenario) => {
                                const VisIcon = getVisibilityIcon(scenario.visibility);
                                const isSelected = selectedScenarioId === scenario.id;
                                
                                return (
                                    <div
                                        key={scenario.id}
                                        onClick={() => selectScenario(scenario.id)}
                                        className={`p-3 rounded-xl cursor-pointer transition-colors ${
                                            isSelected
                                                ? 'bg-[var(--accent-primary)]/10 border-2 border-[var(--accent-primary)]'
                                                : 'bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 hover:border-[var(--accent-primary)]'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900 dark:text-surface-100 truncate">
                                                    {scenario.name}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant={getStatusBadgeVariant(scenario.status)} size="sm">
                                                        {scenario.status}
                                                    </Badge>
                                                    <VisIcon size={12} className="text-gray-400" />
                                                </div>
                                            </div>
                                            <span className={`text-sm font-medium ${
                                                scenario.metrics.netDelta >= 0 ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                                {formatCurrency(scenario.metrics.netDelta, true)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Scenario Detail */}
                <div className="lg:col-span-2">
                    {selectedScenario ? (
                        <Card variant="glass" padding="lg">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                                        {selectedScenario.name}
                                    </h3>
                                    {selectedScenario.description && (
                                        <p className="text-sm text-gray-500 mt-1">{selectedScenario.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant={getStatusBadgeVariant(selectedScenario.status)} size="sm">
                                            {selectedScenario.status}
                                        </Badge>
                                        {selectedScenario.tags.map((tag) => (
                                            <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-surface-700 rounded">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedScenario.status !== 'locked' && (
                                        <>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                leftIcon={<Copy size={14} />}
                                                onClick={() => {
                                                    setBaseScenarioId(selectedScenario.id);
                                                    setShowCreateModal(true);
                                                }}
                                            >
                                                Clone
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                leftIcon={<Lock size={14} />}
                                                onClick={() => {
                                                    lockScenario(selectedScenario.id);
                                                    toast.success('Scenario locked');
                                                }}
                                            >
                                                Lock
                                            </Button>
                                        </>
                                    )}
                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg">
                                        <MoreVertical size={16} className="text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Metrics Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="p-3 bg-gray-50 dark:bg-surface-800/50 rounded-xl">
                                    <p className="text-xs text-gray-500">Revenue</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                                        {formatCurrency(selectedScenario.metrics.revenue, true)}
                                    </p>
                                    <p className={`text-xs ${selectedScenario.metrics.revenueDelta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {formatPercent(selectedScenario.metrics.revenueChangePercent)} vs expected
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-surface-800/50 rounded-xl">
                                    <p className="text-xs text-gray-500">Costs</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                                        {formatCurrency(selectedScenario.metrics.costs, true)}
                                    </p>
                                    <p className={`text-xs ${selectedScenario.metrics.costsDelta <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {formatPercent(selectedScenario.metrics.costsChangePercent)} vs expected
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-surface-800/50 rounded-xl">
                                    <p className="text-xs text-gray-500">Net Position</p>
                                    <p className={`text-lg font-semibold ${selectedScenario.metrics.netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(selectedScenario.metrics.netPosition, true)}
                                    </p>
                                    <p className={`text-xs ${selectedScenario.metrics.netDelta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {formatCurrency(selectedScenario.metrics.netDelta, true)} vs expected
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-surface-800/50 rounded-xl">
                                    <p className="text-xs text-gray-500">Cash</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                                        {formatCurrency(selectedScenario.metrics.cash, true)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {selectedScenario.metrics.cashRunwayDays} days runway
                                    </p>
                                </div>
                            </div>

                            {/* Assumptions */}
                            <div className="mb-6">
                                <h4 className="font-medium text-gray-900 dark:text-surface-100 mb-3">Assumptions</h4>
                                <div className="space-y-3">
                                    {selectedScenario.assumptions.filter((a) => a.isOverridden).map((assumption) => (
                                        <div
                                            key={assumption.id}
                                            className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/30"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-surface-100 text-sm">
                                                    {assumption.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Base: {assumption.baseValue}{assumption.unit === 'percentage' ? '%' : assumption.unit === 'days' ? ' days' : ''}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-amber-700 dark:text-amber-400">
                                                    {assumption.currentValue}{assumption.unit === 'percentage' ? '%' : assumption.unit === 'days' ? ' days' : ''}
                                                </p>
                                                <p className="text-xs text-amber-600">Modified</p>
                                            </div>
                                        </div>
                                    ))}
                                    {selectedScenario.assumptions.filter((a) => !a.isOverridden).length > 0 && (
                                        <p className="text-xs text-gray-500">
                                            + {selectedScenario.assumptions.filter((a) => !a.isOverridden).length} unchanged assumptions
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Comments */}
                            <div className="border-t border-gray-200 dark:border-surface-700 pt-4">
                                <h4 className="font-medium text-gray-900 dark:text-surface-100 mb-3">
                                    Comments ({comments.length})
                                </h4>
                                <div className="space-y-3 mb-4">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className={`p-3 rounded-lg ${comment.parentId ? 'ml-6' : ''} bg-gray-50 dark:bg-surface-800/50`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-900 dark:text-surface-100">
                                                    {comment.authorName}
                                                </span>
                                                <span className="text-xs text-gray-500" suppressHydrationWarning>
                                                    {new Date(comment.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-surface-400">{comment.content}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add a comment..."
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                        className="flex-1 px-3 py-2 bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-lg text-sm"
                                    />
                                    <Button variant="primary" size="sm" onClick={handleAddComment}>
                                        <Send size={16} />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card variant="glass" padding="lg">
                            <div className="text-center py-12">
                                <GitBranch size={48} className="mx-auto mb-4 text-gray-300 dark:text-surface-600" />
                                <p className="text-gray-500">Select a scenario to view details</p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100 mb-4">
                                Create New Scenario
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">
                                        Scenario Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newScenarioName}
                                        onChange={(e) => setNewScenarioName(e.target.value)}
                                        placeholder="e.g., Q2 Expansion Plan"
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">
                                        Base On
                                    </label>
                                    <select
                                        value={baseScenarioId}
                                        onChange={(e) => setBaseScenarioId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800"
                                    >
                                        {[...baselineScenarios, ...customScenarios].map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </Button>
                                <Button variant="primary" onClick={handleCreate} disabled={!newScenarioName.trim()}>
                                    Create
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// =============================================================================
// STRESS TESTS TAB
// =============================================================================

function StressTab() {
    const { stressTests, stressTestTemplates, runStressTest, deleteStressTest } = useScenarioStore();
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [intensity, setIntensity] = useState(-10);

    const handleRunTest = () => {
        if (!selectedTemplate) return;
        runStressTest(selectedTemplate, String(intensity));
        setSelectedTemplate(null);
        toast.success('Stress test completed');
    };

    const getResultIcon = (result: string) => {
        switch (result) {
            case 'pass': return <CheckCircle2 className="text-green-500" size={20} />;
            case 'warning': return <AlertTriangle className="text-amber-500" size={20} />;
            case 'fail': return <XCircle className="text-red-500" size={20} />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Templates */}
            <Card variant="glass" padding="lg">
                <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">Stress Test Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stressTestTemplates.map((template) => (
                        <div
                            key={template.id}
                            onClick={() => setSelectedTemplate(template.id)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                selectedTemplate === template.id
                                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                    : 'border-gray-200 dark:border-surface-700 hover:border-[var(--accent-primary)]'
                            }`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                    <Zap size={20} className="text-red-500" />
                                </div>
                                <h4 className="font-medium text-gray-900 dark:text-surface-100">{template.name}</h4>
                            </div>
                            <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                            <div className="flex gap-1">
                                {template.defaultIntensities.map((i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-surface-700 rounded">
                                        {i}%
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {selectedTemplate && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-surface-700">
                        <div className="flex items-center gap-6">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
                                    Intensity: {intensity}%
                                </label>
                                <input
                                    type="range"
                                    min={-50}
                                    max={0}
                                    step={5}
                                    value={intensity}
                                    onChange={(e) => setIntensity(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                            <Button variant="primary" leftIcon={<Play size={16} />} onClick={handleRunTest}>
                                Run Test
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Results */}
            <Card variant="glass" padding="lg">
                <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">Test Results</h3>
                {stressTests.length === 0 ? (
                    <div className="text-center py-8">
                        <Activity size={32} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-gray-500">No stress tests run yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {stressTests.map((test) => (
                            <div
                                key={test.id}
                                className={`p-4 rounded-xl border ${
                                    test.result === 'pass' ? 'border-green-200 bg-green-50 dark:border-green-800/30 dark:bg-green-900/10' :
                                    test.result === 'warning' ? 'border-amber-200 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-900/10' :
                                    'border-red-200 bg-red-50 dark:border-red-800/30 dark:bg-red-900/10'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        {getResultIcon(test.result)}
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-surface-100">{test.name}</h4>
                                            <p className="text-sm text-gray-500 mt-0.5">{test.description}</p>
                                            <div className="flex items-center gap-4 mt-2 text-sm">
                                                <span>Intensity: <strong>{test.intensity}</strong></span>
                                                <span>Result: <strong className="capitalize">{test.result}</strong></span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteStressTest(test.id)}
                                        className="p-1 hover:bg-white/50 rounded"
                                    >
                                        <Trash2 size={16} className="text-gray-400" />
                                    </button>
                                </div>

                                {/* Thresholds */}
                                {test.thresholds.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-surface-700/50">
                                        <p className="text-xs font-medium text-gray-500 mb-2">THRESHOLD ANALYSIS</p>
                                        <div className="grid grid-cols-3 gap-4">
                                            {test.thresholds.map((t, idx) => (
                                                <div key={idx}>
                                                    <p className="text-sm text-gray-600 dark:text-surface-400">{t.metric}</p>
                                                    <p className={`font-medium ${t.breached ? 'text-red-600' : 'text-green-600'}`}>
                                                        {t.currentValue?.toFixed(1) ?? '—'} / {t.threshold ?? '—'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {t.breached ? 'BREACHED' : `Margin: ${t.margin?.toFixed(1) ?? '—'}`}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Critical Points */}
                                {(test.cashShortfallPoint || test.covenantBreachPoint || test.marginCollapsePoint) && (
                                    <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-surface-700/50">
                                        <p className="text-xs font-medium text-gray-500 mb-2">CRITICAL DATES</p>
                                        <div className="flex gap-6 text-sm">
                                            {test.cashShortfallPoint && (
                                                <div>
                                                    <p className="text-gray-500">Cash Shortfall</p>
                                                    <p className="font-medium text-red-600" suppressHydrationWarning>{new Date(test.cashShortfallPoint).toLocaleDateString()}</p>
                                                </div>
                                            )}
                                            {test.covenantBreachPoint && (
                                                <div>
                                                    <p className="text-gray-500">Covenant Breach</p>
                                                    <p className="font-medium text-red-600" suppressHydrationWarning>{new Date(test.covenantBreachPoint).toLocaleDateString()}</p>
                                                </div>
                                            )}
                                            {test.marginCollapsePoint && (
                                                <div>
                                                    <p className="text-gray-500">Margin Collapse</p>
                                                    <p className="font-medium text-red-600" suppressHydrationWarning>{new Date(test.marginCollapsePoint).toLocaleDateString()}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}

// =============================================================================
// SIMULATION TAB
// =============================================================================

function SimulationTab() {
    const {
        scenarios,
        activeSimulation,
        isSimulating,
        startSimulation,
        updateSimulationDriver,
        resetSimulation,
        pinSimulation,
    } = useScenarioStore();

    const [baseScenarioId, setBaseScenarioId] = useState('expected-case');
    const [pinName, setPinName] = useState('');
    const [showPinModal, setShowPinModal] = useState(false);

    const handleStart = () => {
        startSimulation(baseScenarioId);
    };

    const handlePin = () => {
        if (!pinName.trim()) return;
        pinSimulation(pinName);
        setPinName('');
        setShowPinModal(false);
        toast.success('Simulation saved as scenario');
    };

    const baseScenario = scenarios.find((s) => s.id === baseScenarioId);

    return (
        <div className="space-y-6">
            {!activeSimulation ? (
                <Card variant="glass" padding="lg">
                    <div className="text-center py-12">
                        <Sliders size={48} className="mx-auto mb-4 text-gray-300 dark:text-surface-600" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-surface-100 mb-2">
                            What-If Simulation
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            Interactively adjust assumptions and see the impact on your forecasts in real-time
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <select
                                value={baseScenarioId}
                                onChange={(e) => setBaseScenarioId(e.target.value)}
                                className="px-3 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800"
                            >
                                {scenarios.filter((s) => s.status !== 'archived').map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <Button variant="primary" leftIcon={<Play size={16} />} onClick={handleStart}>
                                Start Simulation
                            </Button>
                        </div>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Toolbar */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Badge variant="info">Simulating</Badge>
                            <span className="text-sm text-gray-500">
                                Based on: {baseScenario?.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" leftIcon={<RotateCcw size={16} />} onClick={resetSimulation}>
                                Reset
                            </Button>
                            <Button variant="primary" leftIcon={<Bookmark size={16} />} onClick={() => setShowPinModal(true)}>
                                Save as Scenario
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Drivers */}
                        <Card variant="glass" padding="lg">
                            <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">Adjust Drivers</h3>
                            <div className="space-y-6">
                                {activeSimulation.drivers.map((driver) => {
                                    const hasChanged = driver.currentValue !== driver.baseValue;
                                    return (
                                        <div key={driver.id}>
                                            <div className="flex justify-between mb-2">
                                                <label className="text-sm font-medium text-gray-700 dark:text-surface-300">
                                                    {driver.name}
                                                </label>
                                                <span className={`text-sm font-medium ${hasChanged ? 'text-amber-600' : 'text-gray-500'}`}>
                                                    {driver.currentValue}
                                                    {driver.unit === 'percentage' ? '%' : driver.unit === 'days' ? ' days' : ''}
                                                    {hasChanged && (
                                                        <span className="text-xs text-gray-400 ml-1">
                                                            (base: {driver.baseValue})
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min={driver.minValue}
                                                max={driver.maxValue}
                                                step={driver.step}
                                                value={driver.currentValue}
                                                onChange={(e) => updateSimulationDriver(driver.id, parseFloat(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                <span>{driver.minValue}{driver.unit === 'percentage' ? '%' : ''}</span>
                                                <span>{driver.maxValue}{driver.unit === 'percentage' ? '%' : ''}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* Results */}
                        <Card variant="glass" padding="lg">
                            <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-4">Simulation Results</h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Revenue', value: activeSimulation.resultMetrics.revenue, delta: activeSimulation.resultMetrics.revenueDelta, percent: activeSimulation.resultMetrics.revenueChangePercent },
                                    { label: 'Costs', value: activeSimulation.resultMetrics.costs, delta: activeSimulation.resultMetrics.costsDelta, percent: activeSimulation.resultMetrics.costsChangePercent, invert: true },
                                    { label: 'Net Position', value: activeSimulation.resultMetrics.netPosition, delta: activeSimulation.resultMetrics.netDelta, percent: activeSimulation.resultMetrics.netChangePercent },
                                    { label: 'Cash', value: activeSimulation.resultMetrics.cash, delta: activeSimulation.resultMetrics.cashDelta, percent: activeSimulation.resultMetrics.cashChangePercent },
                                ].map((metric) => {
                                    const isPositive = metric.invert ? metric.delta <= 0 : metric.delta >= 0;
                                    return (
                                        <div key={metric.label} className="p-4 bg-gray-50 dark:bg-surface-800/50 rounded-xl">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm text-gray-500">{metric.label}</p>
                                                    <p className="text-2xl font-bold text-gray-900 dark:text-surface-100">
                                                        {formatCurrency(metric.value, true)}
                                                    </p>
                                                </div>
                                                <div className={`text-right ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                                    <p className="text-lg font-semibold">
                                                        {metric.delta >= 0 ? '+' : ''}{formatCurrency(metric.delta, true)}
                                                    </p>
                                                    <p className="text-sm">
                                                        {formatPercent(metric.percent)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    <Info size={14} className="inline mr-1" />
                                    Results update instantly as you adjust the sliders. Save as a scenario to preserve these settings.
                                </p>
                            </div>
                        </Card>
                    </div>

                    {/* Pin Modal */}
                    <AnimatePresence>
                        {showPinModal && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                                onClick={() => setShowPinModal(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    className="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-md"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100 mb-4">
                                        Save Simulation as Scenario
                                    </h3>
                                    <input
                                        type="text"
                                        value={pinName}
                                        onChange={(e) => setPinName(e.target.value)}
                                        placeholder="Scenario name"
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 mb-4"
                                    />
                                    <div className="flex justify-end gap-3">
                                        <Button variant="secondary" onClick={() => setShowPinModal(false)}>
                                            Cancel
                                        </Button>
                                        <Button variant="primary" onClick={handlePin} disabled={!pinName.trim()}>
                                            Save
                                        </Button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
}

// =============================================================================
// COMPARE TAB
// =============================================================================

function CompareTab() {
    const {
        scenarios,
        comparisonScenarioIds,
        addToComparison,
        removeFromComparison,
        clearComparison,
        getComparison,
        getImpactExplanation,
        viewPreferences,
        setViewPreferences,
    } = useScenarioStore();

    const comparison = getComparison();
    const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'cost' | 'cash' | 'net'>('net');
    const [showExplanation, setShowExplanation] = useState(false);

    const availableScenarios = scenarios.filter((s) => s.status !== 'archived' && !comparisonScenarioIds.includes(s.id));
    const selectedScenarios = scenarios.filter((s) => comparisonScenarioIds.includes(s.id));

    const baseline = comparison?.scenarios.find((s) => s.id === comparison.baselineId);

    return (
        <div className="space-y-6">
            {/* Scenario Selection */}
            <Card variant="glass" padding="md">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-surface-100">Compare Scenarios</h4>
                    <Button variant="secondary" size="sm" onClick={clearComparison}>
                        Clear
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {selectedScenarios.map((s) => (
                        <span
                            key={s.id}
                            className="px-3 py-1.5 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-lg text-sm flex items-center gap-2"
                        >
                            {s.name}
                            <button onClick={() => removeFromComparison(s.id)}>
                                <X size={14} />
                            </button>
                        </span>
                    ))}
                    {availableScenarios.length > 0 && (
                        <select
                            onChange={(e) => {
                                if (e.target.value) addToComparison(e.target.value);
                                e.target.value = '';
                            }}
                            className="px-3 py-1.5 border border-dashed border-gray-300 dark:border-surface-600 rounded-lg text-sm bg-transparent"
                        >
                            <option value="">+ Add scenario</option>
                            {availableScenarios.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </Card>

            {comparison && comparison.scenarios.length >= 2 ? (
                <>
                    {/* Comparison Mode */}
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">View:</span>
                        <div className="flex rounded-lg border border-gray-200 dark:border-surface-700 overflow-hidden">
                            {(['delta', 'absolute', 'percentage'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewPreferences({ comparisonMode: mode })}
                                    className={`px-3 py-1.5 text-sm capitalize ${
                                        viewPreferences.comparisonMode === mode
                                            ? 'bg-[var(--accent-primary)] text-white'
                                            : 'text-gray-600 dark:text-surface-400'
                                    }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comparison Table */}
                    <Card variant="glass" padding="none">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-surface-700">
                                        <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Metric</th>
                                        {comparison.scenarios.map((s) => (
                                            <th key={s.id} className="text-right p-4 text-xs font-medium text-gray-500 uppercase">
                                                <div className="flex items-center justify-end gap-2">
                                                    {s.name}
                                                    {s.id === comparison.baselineId && (
                                                        <Badge variant="info" size="sm">Baseline</Badge>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { key: 'revenue', label: 'Revenue' },
                                        { key: 'costs', label: 'Costs' },
                                        { key: 'netPosition', label: 'Net Position' },
                                        { key: 'cash', label: 'Cash' },
                                        { key: 'profitMargin', label: 'Profit Margin', isPercent: true },
                                    ].map((row) => (
                                        <tr key={row.key} className="border-b border-gray-100 dark:border-surface-800">
                                            <td className="p-4 font-medium text-gray-700 dark:text-surface-300">
                                                {row.label}
                                            </td>
                                            {comparison.scenarios.map((s) => {
                                                const val = s.metrics[row.key as keyof typeof s.metrics];
                                                const numVal = typeof val === 'number' ? val : 0;
                                                const delta = comparison.deltas[s.id]?.[row.key === 'netPosition' ? 'net' : row.key as 'revenue' | 'costs' | 'cash'] || 0;
                                                const isBaseline = s.id === comparison.baselineId;
                                                const baseVal = baseline?.metrics[row.key as keyof typeof baseline.metrics];
                                                const baseNum = typeof baseVal === 'number' ? baseVal : 0;
                                                const percentChange = baseNum !== 0 ? (delta / Math.abs(baseNum)) * 100 : 0;

                                                return (
                                                    <td
                                                        key={s.id}
                                                        className={`p-4 text-right ${isBaseline ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                                    >
                                                        {viewPreferences.comparisonMode === 'absolute' ? (
                                                            <span className="font-medium text-gray-900 dark:text-surface-100">
                                                                {row.isPercent ? `${numVal.toFixed(1)}%` : formatCurrency(numVal, true)}
                                                            </span>
                                                        ) : viewPreferences.comparisonMode === 'delta' ? (
                                                            isBaseline ? (
                                                                <span className="text-gray-400">—</span>
                                                            ) : (
                                                                <span className={delta >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                                                    {delta >= 0 ? '+' : ''}{formatCurrency(delta, true)}
                                                                </span>
                                                            )
                                                        ) : (
                                                            isBaseline ? (
                                                                <span className="text-gray-400">—</span>
                                                            ) : (
                                                                <span className={percentChange >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                                                    {formatPercent(percentChange)}
                                                                </span>
                                                            )
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Spread Visualization */}
                    <Card variant="glass" padding="lg">
                        <h4 className="font-medium text-gray-900 dark:text-surface-100 mb-4">Outcome Spread</h4>
                        <div className="space-y-6">
                            {(['revenue', 'costs', 'cash', 'net'] as const).map((metric) => {
                                const spread = comparison.spread[metric];
                                const range = spread.max - spread.min || 1;
                                
                                return (
                                    <div key={metric}>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-700 dark:text-surface-300 capitalize font-medium">
                                                {metric === 'net' ? 'Net Position' : metric}
                                            </span>
                                            <span className="text-gray-500">
                                                Range: {formatCurrency(spread.range, true)}
                                            </span>
                                        </div>
                                        <div className="relative h-8 bg-gray-100 dark:bg-surface-700 rounded-lg">
                                            {comparison.scenarios.map((s) => {
                                                const val = s.metrics[metric === 'net' ? 'netPosition' : metric];
                                                const numVal = typeof val === 'number' ? val : 0;
                                                const position = ((numVal - spread.min) / range) * 100;
                                                const color = s.caseType === 'best_case' ? 'bg-green-500' :
                                                              s.caseType === 'worst_case' ? 'bg-red-500' :
                                                              s.caseType === 'expected_case' ? 'bg-blue-500' : 'bg-purple-500';
                                                
                                                return (
                                                    <div
                                                        key={s.id}
                                                        className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 ${color} rounded-full border-2 border-white dark:border-surface-800 shadow`}
                                                        style={{ left: `calc(${position}% - 8px)` }}
                                                        title={`${s.name}: ${formatCurrency(numVal, true)}`}
                                                    />
                                                );
                                            })}
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>{formatCurrency(spread.min, true)}</span>
                                            <span>{formatCurrency(spread.max, true)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </>
            ) : (
                <Card variant="glass" padding="lg">
                    <div className="text-center py-12">
                        <Layers size={48} className="mx-auto mb-4 text-gray-300 dark:text-surface-600" />
                        <p className="text-gray-500">Select at least 2 scenarios to compare</p>
                    </div>
                </Card>
            )}
        </div>
    );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function ScenariosPage() {
    const { t } = useThemeStore();
    const { activeTab, setActiveTab, isLoading, fetchScenarios, scenarios } = useScenarioStore();
    const [showExportModal, setShowExportModal] = useState(false);

    useEffect(() => {
        fetchScenarios();
    }, [fetchScenarios]);

    const getExportData = () => ({
        exportedAt: new Date().toISOString(),
        scenarios: scenarios.map((s) => ({
            name: s.name,
            description: s.description,
            caseType: s.caseType,
            status: s.status,
            revenue: s.metrics?.revenue,
            costs: s.metrics?.costs,
            cash: s.metrics?.cash,
            netPosition: s.metrics?.netPosition,
            profitMargin: s.metrics?.profitMargin,
            confidence: s.confidence?.level,
            createdAt: s.createdAt,
        })),
    });

    const handleExport = async (format: ExportFormat) => {
        const exportData = getExportData();
        const fileName = `scenarios-export-${new Date().toISOString().split('T')[0]}`;
        const result = convertToFormat(exportData, format, 'scenarios');
        const isDocx = (result as any).isDocx === true;
        await downloadFile(result.content, `${fileName}.${result.extension}`, result.mimeType, isDocx);
        toast.success(`Scenarios exported as ${format.toUpperCase()}`);
    };

    const tabs: { id: ScenarioTab; label: string; icon: React.ElementType }[] = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'baseline', label: 'Baseline', icon: Target },
        { id: 'custom', label: 'Custom', icon: GitBranch },
        { id: 'stress', label: 'Stress Tests', icon: Zap },
        { id: 'simulation', label: 'What-If', icon: Sliders },
        { id: 'compare', label: 'Compare', icon: Layers },
    ];

    const renderTab = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab />;
            case 'baseline': return <BaselineTab />;
            case 'custom': return <CustomTab />;
            case 'stress': return <StressTab />;
            case 'simulation': return <SimulationTab />;
            case 'compare': return <CompareTab />;
            default: return <OverviewTab />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
                        Scenarios
                    </h1>
                    <p className="text-gray-500 dark:text-surface-500 mt-1">
                        Model outcomes, run stress tests, and explore what-if simulations
                    </p>
                </div>
                <div className="flex items-center gap-3">
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
                title={t('scenarios.exportTitle') || 'Export Scenarios'}
                fileName="scenarios"
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