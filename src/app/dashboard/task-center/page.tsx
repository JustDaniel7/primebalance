'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    AlertTriangle,
    AlertCircle,
    AlertOctagon,
    ChevronRight,
    ChevronDown,
    X,
    MoreVertical,
    Calendar,
    User,
    Tag,
    Link2,
    MessageSquare,
    Paperclip,
    Bell,
    BellOff,
    Play,
    Pause,
    RotateCcw,
    ArrowUpRight,
    Target,
    Shield,
    Zap,
    Layers,
    LayoutGrid,
    List,
    SlidersHorizontal,
    Star,
    Bookmark,
    ExternalLink,
    CheckSquare,
    Square,
    MinusSquare,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    Users,
    FileText,
    Package,
    Wallet,
    Landmark,
    Boxes,
    Receipt,
    Building2,
    Eye,
    EyeOff,
    RefreshCw,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useTaskStore } from '@/store/taskcenter-store';
import type {
    Task,
    Risk,
    TaskStatus,
    TaskPriority,
    RiskSeverity,
    RiskStatus,
    SourceSystem,
    TaskGroupBy,
    RiskGroupBy,
} from '@/types/taskcenter';

// =============================================================================
// CONSTANTS & HELPERS
// =============================================================================

const priorityConfig: Record<TaskPriority, { label: string; color: string; icon: React.ElementType }> = {
    critical: { label: 'Critical', color: 'red', icon: AlertOctagon },
    high: { label: 'High', color: 'orange', icon: AlertTriangle },
    medium: { label: 'Medium', color: 'amber', icon: AlertCircle },
    low: { label: 'Low', color: 'gray', icon: Clock },
};

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
    open: { label: 'Open', color: 'blue' },
    in_progress: { label: 'In Progress', color: 'cyan' },
    blocked: { label: 'Blocked', color: 'red' },
    awaiting_review: { label: 'Awaiting Review', color: 'purple' },
    completed: { label: 'Completed', color: 'green' },
    cancelled: { label: 'Cancelled', color: 'gray' },
    snoozed: { label: 'Snoozed', color: 'slate' },
};

const riskSeverityConfig: Record<RiskSeverity, { label: string; color: string }> = {
    critical: { label: 'Critical', color: 'red' },
    high: { label: 'High', color: 'orange' },
    medium: { label: 'Medium', color: 'amber' },
    low: { label: 'Low', color: 'green' },
};

const riskStatusConfig: Record<RiskStatus, { label: string; color: string }> = {
    identified: { label: 'Identified', color: 'blue' },
    assessing: { label: 'Assessing', color: 'cyan' },
    mitigating: { label: 'Mitigating', color: 'purple' },
    monitoring: { label: 'Monitoring', color: 'amber' },
    resolved: { label: 'Resolved', color: 'green' },
    accepted: { label: 'Accepted', color: 'slate' },
    escalated: { label: 'Escalated', color: 'red' },
};

const sourceSystemIcons: Record<SourceSystem, React.ElementType> = {
    invoices: FileText,
    orders: Package,
    receivables: Wallet,
    liabilities: Landmark,
    treasury: Building2,
    inventory: Boxes,
    assets: Boxes,
    tax: Receipt,
    manual: CheckSquare,
};

const getBadgeVariant = (color: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
    switch (color) {
        case 'green':
            return 'success';
        case 'amber':
        case 'orange':
            return 'warning';
        case 'red':
            return 'danger';
        case 'blue':
        case 'cyan':
        case 'purple':
            return 'info';
        default:
            return 'neutral';
    }
};

// =============================================================================
// TODAY OVERVIEW TAB
// =============================================================================

function TodayOverview() {
    const { t, language } = useThemeStore();
    const {
        tasks,
        risks,
        getTaskSummary,
        getRiskSummary,
        completeTask,
        setActiveTab,
        setTaskFilter,
    } = useTaskStore();
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    const taskSummary = getTaskSummary();
    const riskSummary = getRiskSummary();

    // Filter tasks for today, overdue, due soon, and blocked
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter((t: Task) => t.dueDate?.startsWith(today) && t.status !== 'completed');
    const overdueTasks = tasks.filter((t: Task) => t.dueDate && t.dueDate < today && t.status !== 'completed');
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dueSoonTasks = tasks.filter((t: Task) => t.dueDate && t.dueDate > today && t.dueDate <= nextWeek && t.status !== 'completed');
    const blockedTasks = tasks.filter((t: Task) => t.isBlocked && t.status !== 'completed');
    const criticalRisks = risks.filter((r: Risk) => r.severity === 'critical' && r.status !== 'resolved');

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(
            language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US',
            { weekday: 'short', month: 'short', day: 'numeric' }
        );
    };

    const summaryCards = [
        {
            label: 'Due Today',
            value: taskSummary.dueToday,
            icon: Calendar,
            color: 'blue',
            onClick: () => {
                setActiveTab('tasks');
                setTaskFilter({ dueDateFrom: new Date().toISOString().split('T')[0], dueDateTo: new Date().toISOString().split('T')[0] });
            },
        },
        {
            label: 'Overdue',
            value: taskSummary.overdue,
            icon: AlertTriangle,
            color: 'red',
            onClick: () => {
                setActiveTab('tasks');
                setTaskFilter({ isOverdue: true });
            },
        },
        {
            label: 'Blocked',
            value: taskSummary.blocked,
            icon: Pause,
            color: 'orange',
            onClick: () => {
                setActiveTab('tasks');
                setTaskFilter({ isBlocked: true });
            },
        },
        {
            label: 'Needs Review',
            value: taskSummary.needsReview,
            icon: Eye,
            color: 'purple',
            onClick: () => {
                setActiveTab('tasks');
                setTaskFilter({ status: ['awaiting_review'] });
            },
        },
        {
            label: 'Critical Risks',
            value: riskSummary.criticalCount,
            icon: Shield,
            color: 'red',
            onClick: () => setActiveTab('risks'),
        },
        {
            label: 'Completed Today',
            value: taskSummary.completedToday,
            icon: CheckCircle2,
            color: 'green',
            onClick: () => {},
        },
    ];

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {summaryCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card
                            key={card.label}
                            variant="glass"
                            padding="md"
                            className={`cursor-pointer hover:scale-[1.02] transition-transform ${
                                card.value > 0 && card.color === 'red' ? 'border-l-4 border-red-500' : ''
                            }`}
                            onClick={card.onClick}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        card.color === 'red'
                                            ? 'bg-red-500/10'
                                            : card.color === 'orange'
                                            ? 'bg-orange-500/10'
                                            : card.color === 'purple'
                                            ? 'bg-purple-500/10'
                                            : card.color === 'green'
                                            ? 'bg-green-500/10'
                                            : 'bg-blue-500/10'
                                    }`}
                                >
                                    <Icon
                                        size={20}
                                        className={
                                            card.color === 'red'
                                                ? 'text-red-500'
                                                : card.color === 'orange'
                                                ? 'text-orange-500'
                                                : card.color === 'purple'
                                                ? 'text-purple-500'
                                                : card.color === 'green'
                                                ? 'text-green-500'
                                                : 'text-blue-500'
                                        }
                                    />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-surface-100">{card.value}</p>
                                    <p className="text-xs text-gray-500 dark:text-surface-400">{card.label}</p>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Priority Tasks Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Overdue & Today */}
                <Card variant="glass" padding="lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-surface-100 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-red-500" />
                            Requires Attention
                        </h3>
                        <span className="text-xs text-gray-500">{overdueTasks.length + todayTasks.length} items</span>
                    </div>

                    {overdueTasks.length === 0 && todayTasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-surface-400">
                            <CheckCircle2 size={32} className="mx-auto mb-2 text-green-500" />
                            <p>All caught up! No urgent tasks.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {[...overdueTasks, ...todayTasks].slice(0, 5).map((task) => {
                                const priorityConf = priorityConfig[task.priority] || priorityConfig.medium;
                                const PriorityIcon = priorityConf.icon;
                                const isOverdue = task.dueDate && task.dueDate < new Date().toISOString().split('T')[0];
                                return (
                                    <div
                                        key={task.id}
                                        onClick={() => setSelectedTaskId(task.id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                                            isOverdue
                                                ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                                                : 'bg-gray-50 dark:bg-surface-800/50 hover:bg-gray-100 dark:hover:bg-surface-800'
                                        }`}
                                    >
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                completeTask(task.id);
                                            }}
                                            className="flex-shrink-0"
                                        >
                                            <Square size={18} className="text-gray-400 hover:text-green-500" />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-surface-100 truncate">
                                                {task.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant={getBadgeVariant(priorityConf.color)} size="sm">
                                                    {task.priority}
                                                </Badge>
                                                {task.dueDate && (
                                                    <span className={`text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                                                        {isOverdue ? 'Overdue: ' : ''}{formatDate(task.dueDate)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                                    </div>
                                );
                            })}
                            {overdueTasks.length + todayTasks.length > 5 && (
                                <button
                                    onClick={() => setActiveTab('tasks')}
                                    className="w-full text-center py-2 text-sm text-[var(--accent-primary)] hover:underline"
                                >
                                    View all {overdueTasks.length + todayTasks.length} tasks →
                                </button>
                            )}
                        </div>
                    )}
                </Card>

                {/* Critical Risks */}
                <Card variant="glass" padding="lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-surface-100 flex items-center gap-2">
                            <Shield size={18} className="text-red-500" />
                            Critical Risks
                        </h3>
                        <span className="text-xs text-gray-500">{criticalRisks.length} risks</span>
                    </div>

                    {criticalRisks.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-surface-400">
                            <Shield size={32} className="mx-auto mb-2 text-green-500" />
                            <p>No critical risks at this time.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {criticalRisks.slice(0, 5).map((risk) => (
                                <div
                                    key={risk.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 cursor-pointer transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                        <AlertOctagon size={16} className="text-red-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-surface-100 truncate">
                                            {risk.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="danger" size="sm">{risk.severity}</Badge>
                                            <span className="text-xs text-gray-500">
                                                {risk.mitigationProgress}% mitigated
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Blocked Tasks & Due Soon */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Blocked Tasks */}
                <Card variant="glass" padding="lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-surface-100 flex items-center gap-2">
                            <Pause size={18} className="text-orange-500" />
                            Blocked Tasks
                        </h3>
                        <span className="text-xs text-gray-500">{blockedTasks.length} blocked</span>
                    </div>

                    {blockedTasks.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 dark:text-surface-400">
                            <Play size={24} className="mx-auto mb-2 text-green-500" />
                            <p className="text-sm">No blocked tasks</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {blockedTasks.slice(0, 3).map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20"
                                >
                                    <Pause size={16} className="text-orange-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-surface-100 truncate text-sm">
                                            {task.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Blocked by {task.blockedByTaskIds?.length || 0} task(s)
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Due Soon */}
                <Card variant="glass" padding="lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-surface-100 flex items-center gap-2">
                            <Clock size={18} className="text-blue-500" />
                            Due This Week
                        </h3>
                        <span className="text-xs text-gray-500">{dueSoonTasks.length} upcoming</span>
                    </div>

                    {dueSoonTasks.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 dark:text-surface-400">
                            <Calendar size={24} className="mx-auto mb-2" />
                            <p className="text-sm">No tasks due this week</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {dueSoonTasks.slice(0, 3).map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20"
                                >
                                    <Calendar size={16} className="text-blue-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-surface-100 truncate text-sm">
                                            {task.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {task.dueDate && formatDate(task.dueDate)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

// =============================================================================
// TASKS TAB
// =============================================================================

function TasksTab() {
    const { t, language } = useThemeStore();
    const {
        getFilteredTasks,
        getGroupedTasks,
        taskFilter,
        setTaskFilter,
        resetTaskFilter,
        taskViewPreferences,
        setTaskViewPreferences,
        completeTask,
        snoozeTask,
        openTaskWizard,
    } = useTaskStore();

    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    const filteredTasks = getFilteredTasks();
    const groupedTasks = getGroupedTasks();

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(
            language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US',
            { month: 'short', day: 'numeric' }
        );
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setTaskFilter({ searchQuery: query });
    };

    const groupByOptions: { value: TaskGroupBy; label: string }[] = [
        { value: 'dueDate', label: 'Due Date' },
        { value: 'priority', label: 'Priority' },
        { value: 'status', label: 'Status' },
        { value: 'owner', label: 'Owner' },
        { value: 'sourceSystem', label: 'Source' },
        { value: 'none', label: 'None' },
    ];

    const priorityOptions: TaskPriority[] = ['critical', 'high', 'medium', 'low'];
    const statusOptions: TaskStatus[] = ['open', 'in_progress', 'blocked', 'awaiting_review', 'snoozed'];

    // Group order for due date grouping
    const groupOrder = ['Overdue', 'Today', 'Tomorrow', 'This Week', 'Later', 'No Due Date'];

    const sortedGroups = Object.entries(groupedTasks).sort(([a], [b]) => {
        if (taskViewPreferences.groupBy === 'dueDate') {
            return groupOrder.indexOf(a) - groupOrder.indexOf(b);
        }
        return a.localeCompare(b);
    });

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1 flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-gray-900 dark:text-surface-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2.5 rounded-xl border transition-colors ${
                            showFilters
                                ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                : 'bg-white dark:bg-surface-800/50 border-gray-200 dark:border-surface-700 text-gray-600 dark:text-surface-400'
                        }`}
                    >
                        <SlidersHorizontal size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Group By */}
                    <select
                        value={taskViewPreferences.groupBy}
                        onChange={(e) => setTaskViewPreferences({ groupBy: e.target.value as TaskGroupBy })}
                        className="px-3 py-2 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-sm text-gray-700 dark:text-surface-300"
                    >
                        {groupByOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                Group: {opt.label}
                            </option>
                        ))}
                    </select>

                    {/* View Toggle */}
                    <div className="flex items-center rounded-xl border border-gray-200 dark:border-surface-700 overflow-hidden">
                        <button
                            onClick={() => setTaskViewPreferences({ mode: 'list' })}
                            className={`p-2 ${
                                taskViewPreferences.mode === 'list'
                                    ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                                    : 'text-gray-500'
                            }`}
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setTaskViewPreferences({ mode: 'board' })}
                            className={`p-2 ${
                                taskViewPreferences.mode === 'board'
                                    ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                                    : 'text-gray-500'
                            }`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>

                    <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => openTaskWizard()}>
                        New Task
                    </Button>
                </div>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Card variant="glass" padding="md">
                            <div className="flex flex-wrap gap-4">
                                {/* Priority Filter */}
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-surface-400 mb-1 block">Priority</label>
                                    <div className="flex gap-1">
                                        {priorityOptions.map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => {
                                                    const current = taskFilter.priority || [];
                                                    if (current.includes(p)) {
                                                        setTaskFilter({ priority: current.filter((x) => x !== p) });
                                                    } else {
                                                        setTaskFilter({ priority: [...current, p] });
                                                    }
                                                }}
                                                className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                                                    taskFilter.priority?.includes(p)
                                                        ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                                        : 'border-gray-200 dark:border-surface-700 text-gray-600 dark:text-surface-400'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-surface-400 mb-1 block">Status</label>
                                    <div className="flex gap-1 flex-wrap">
                                        {statusOptions.map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => {
                                                    const current = taskFilter.status || [];
                                                    if (current.includes(s)) {
                                                        setTaskFilter({ status: current.filter((x) => x !== s) });
                                                    } else {
                                                        setTaskFilter({ status: [...current, s] });
                                                    }
                                                }}
                                                className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                                                    taskFilter.status?.includes(s)
                                                        ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                                        : 'border-gray-200 dark:border-surface-700 text-gray-600 dark:text-surface-400'
                                                }`}
                                            >
                                                {s.replace(/_/g, ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Filters */}
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-surface-400 mb-1 block">Quick Filters</label>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setTaskFilter({ isOverdue: !taskFilter.isOverdue })}
                                            className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                                                taskFilter.isOverdue
                                                    ? 'bg-red-500/10 border-red-500 text-red-500'
                                                    : 'border-gray-200 dark:border-surface-700 text-gray-600 dark:text-surface-400'
                                            }`}
                                        >
                                            Overdue
                                        </button>
                                        <button
                                            onClick={() => setTaskFilter({ isBlocked: !taskFilter.isBlocked })}
                                            className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                                                taskFilter.isBlocked
                                                    ? 'bg-orange-500/10 border-orange-500 text-orange-500'
                                                    : 'border-gray-200 dark:border-surface-700 text-gray-600 dark:text-surface-400'
                                            }`}
                                        >
                                            Blocked
                                        </button>
                                        <button
                                            onClick={() => setTaskFilter({ slaBreach: !taskFilter.slaBreach })}
                                            className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                                                taskFilter.slaBreach
                                                    ? 'bg-red-500/10 border-red-500 text-red-500'
                                                    : 'border-gray-200 dark:border-surface-700 text-gray-600 dark:text-surface-400'
                                            }`}
                                        >
                                            SLA Breach
                                        </button>
                                    </div>
                                </div>

                                {/* Show Completed */}
                                <div className="flex items-end">
                                    <button
                                        onClick={() =>
                                            setTaskViewPreferences({ showCompleted: !taskViewPreferences.showCompleted })
                                        }
                                        className={`px-2 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1 ${
                                            taskViewPreferences.showCompleted
                                                ? 'bg-green-500/10 border-green-500 text-green-500'
                                                : 'border-gray-200 dark:border-surface-700 text-gray-600 dark:text-surface-400'
                                        }`}
                                    >
                                        {taskViewPreferences.showCompleted ? <Eye size={12} /> : <EyeOff size={12} />}
                                        Completed
                                    </button>
                                </div>

                                {/* Clear Filters */}
                                <div className="flex items-end ml-auto">
                                    <button
                                        onClick={() => {
                                            resetTaskFilter();
                                            setSearchQuery('');
                                        }}
                                        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                    >
                                        <RotateCcw size={12} />
                                        Clear all
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Active Filter Chips */}
            {(taskFilter.priority?.length ||
                taskFilter.status?.length ||
                taskFilter.isOverdue ||
                taskFilter.isBlocked ||
                searchQuery) && (
                <div className="flex flex-wrap gap-2">
                    {taskFilter.priority?.map((p) => (
                        <span
                            key={p}
                            className="px-2 py-1 text-xs bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-lg flex items-center gap-1"
                        >
                            Priority: {p}
                            <button onClick={() => setTaskFilter({ priority: taskFilter.priority?.filter((x) => x !== p) })}>
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                    {taskFilter.status?.map((s) => (
                        <span
                            key={s}
                            className="px-2 py-1 text-xs bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-lg flex items-center gap-1"
                        >
                            Status: {s.replace(/_/g, ' ')}
                            <button onClick={() => setTaskFilter({ status: taskFilter.status?.filter((x) => x !== s) })}>
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                    {taskFilter.isOverdue && (
                        <span className="px-2 py-1 text-xs bg-red-500/10 text-red-500 rounded-lg flex items-center gap-1">
                            Overdue
                            <button onClick={() => setTaskFilter({ isOverdue: false })}>
                                <X size={12} />
                            </button>
                        </span>
                    )}
                    {taskFilter.isBlocked && (
                        <span className="px-2 py-1 text-xs bg-orange-500/10 text-orange-500 rounded-lg flex items-center gap-1">
                            Blocked
                            <button onClick={() => setTaskFilter({ isBlocked: false })}>
                                <X size={12} />
                            </button>
                        </span>
                    )}
                    {searchQuery && (
                        <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-surface-700 text-gray-700 dark:text-surface-300 rounded-lg flex items-center gap-1">
                            Search: "{searchQuery}"
                            <button onClick={() => handleSearch('')}>
                                <X size={12} />
                            </button>
                        </span>
                    )}
                </div>
            )}

            {/* Task List */}
            {filteredTasks.length === 0 ? (
                <Card variant="glass" padding="lg">
                    <div className="text-center py-12">
                        <CheckSquare size={48} className="mx-auto mb-4 text-gray-300 dark:text-surface-600" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-surface-100 mb-2">No tasks found</h3>
                        <p className="text-gray-500 dark:text-surface-400 mb-4">
                            {searchQuery || Object.keys(taskFilter).length > 0
                                ? 'Try adjusting your filters'
                                : 'Create your first task to get started'}
                        </p>
                        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => openTaskWizard()}>
                            Create Task
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-6">
                    {sortedGroups.map(([groupName, groupTasks]) => (
                        <div key={groupName}>
                            <div className="flex items-center gap-2 mb-3">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-surface-300">{groupName}</h3>
                                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-surface-800 px-2 py-0.5 rounded-full">
                                    {groupTasks.length}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {groupTasks.map((task) => {
                                    const priorityConf = priorityConfig[task.priority] || priorityConfig.medium;
                                    const statusConf = statusConfig[task.status] || statusConfig.open;
                                    const PriorityIcon = priorityConf.icon;
                                    const SourceIcon = sourceSystemIcons[task.sourceSystem] || sourceSystemIcons.manual;
                                    const isOverdue =
                                        task.dueDate &&
                                        task.dueDate < new Date().toISOString().split('T')[0] &&
                                        task.status !== 'completed';

                                    return (
                                        <motion.div
                                            key={task.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <Card
                                                variant="glass"
                                                padding="none"
                                                className={`hover:shadow-lg transition-all cursor-pointer ${
                                                    selectedTaskId === task.id
                                                        ? 'ring-2 ring-[var(--accent-primary)]'
                                                        : ''
                                                } ${isOverdue ? 'border-l-4 border-red-500' : ''} ${
                                                    task.isBlocked ? 'border-l-4 border-orange-500' : ''
                                                }`}
                                                onClick={() => setSelectedTaskId(task.id)}
                                            >
                                                <div className="flex items-center gap-4 p-4">
                                                    {/* Checkbox */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            completeTask(task.id);
                                                        }}
                                                        className="flex-shrink-0 hover:scale-110 transition-transform"
                                                    >
                                                        {task.status === 'completed' ? (
                                                            <CheckCircle2 size={20} className="text-green-500" />
                                                        ) : (
                                                            <Square
                                                                size={20}
                                                                className="text-gray-400 hover:text-green-500"
                                                            />
                                                        )}
                                                    </button>

                                                    {/* Priority Icon */}
                                                    <div
                                                        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                                                            task.priority === 'critical'
                                                                ? 'bg-red-500/10'
                                                                : task.priority === 'high'
                                                                ? 'bg-orange-500/10'
                                                                : task.priority === 'medium'
                                                                ? 'bg-amber-500/10'
                                                                : 'bg-gray-500/10'
                                                        }`}
                                                    >
                                                        <PriorityIcon
                                                            size={16}
                                                            className={
                                                                task.priority === 'critical'
                                                                    ? 'text-red-500'
                                                                    : task.priority === 'high'
                                                                    ? 'text-orange-500'
                                                                    : task.priority === 'medium'
                                                                    ? 'text-amber-500'
                                                                    : 'text-gray-500'
                                                            }
                                                        />
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p
                                                                className={`font-medium truncate ${
                                                                    task.status === 'completed'
                                                                        ? 'text-gray-400 line-through'
                                                                        : 'text-gray-900 dark:text-surface-100'
                                                                }`}
                                                            >
                                                                {task.title}
                                                            </p>
                                                            {task.hasUnreadUpdates && (
                                                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                                            )}
                                                            {task.slaBreach && (
                                                                <Badge variant="danger" size="sm">
                                                                    SLA
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-surface-400">
                                                            <Badge
                                                                variant={getBadgeVariant(statusConf.color)}
                                                                size="sm"
                                                            >
                                                                {statusConf.label}
                                                            </Badge>
                                                            {task.dueDate && (
                                                                <span
                                                                    className={`flex items-center gap-1 ${
                                                                        isOverdue ? 'text-red-500' : ''
                                                                    }`}
                                                                >
                                                                    <Calendar size={12} />
                                                                    {formatDate(task.dueDate)}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1">
                                                                <SourceIcon size={12} />
                                                                {task.sourceSystem}
                                                            </span>
                                                            {task.owner && (
                                                                <span className="flex items-center gap-1">
                                                                    <User size={12} />
                                                                    {task.owner.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Tags */}
                                                    {task.tags?.length > 0 && (
                                                        <div className="hidden md:flex items-center gap-1">
                                                            {task.tags.slice(0, 2).map((tag) => (
                                                                <span
                                                                    key={tag.id}
                                                                    className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-surface-300"
                                                                >
                                                                    {tag.name}
                                                                </span>
                                                            ))}
                                                            {task.tags.length > 2 && (
                                                                <span className="text-xs text-gray-400">
                                                                    +{task.tags.length - 2}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Indicators */}
                                                    <div className="flex items-center gap-2 text-gray-400">
                                                        {task.comments?.length > 0 && (
                                                            <span className="flex items-center gap-1 text-xs">
                                                                <MessageSquare size={14} />
                                                                {task.comments.length}
                                                            </span>
                                                        )}
                                                        {task.attachments?.length > 0 && (
                                                            <span className="flex items-center gap-1 text-xs">
                                                                <Paperclip size={14} />
                                                                {task.attachments.length}
                                                            </span>
                                                        )}
                                                        {task.linkedRiskIds?.length > 0 && (
                                                            <span className="flex items-center gap-1 text-xs text-orange-400">
                                                                <Link2 size={14} />
                                                                {task.linkedRiskIds.length}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                                                </div>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// =============================================================================
// RISKS TAB
// =============================================================================

function RisksTab() {
    const { t, language } = useThemeStore();
    const {
        getFilteredRisks,
        getGroupedRisks,
        riskFilter,
        setRiskFilter,
        resetRiskFilter,
        riskViewPreferences,
        setRiskViewPreferences,
        openRiskWizard,
    } = useTaskStore();

    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);

    const filteredRisks = getFilteredRisks();
    const groupedRisks = getGroupedRisks();

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setRiskFilter({ searchQuery: query });
    };

    const groupByOptions: { value: RiskGroupBy; label: string }[] = [
        { value: 'severity', label: 'Severity' },
        { value: 'status', label: 'Status' },
        { value: 'owner', label: 'Owner' },
        { value: 'impactArea', label: 'Impact Area' },
        { value: 'affectedSystem', label: 'System' },
        { value: 'none', label: 'None' },
    ];

    const severityOptions: RiskSeverity[] = ['critical', 'high', 'medium', 'low'];
    const statusOptions: RiskStatus[] = ['identified', 'assessing', 'mitigating', 'monitoring', 'escalated'];

    // Severity order for grouping
    const severityOrder = ['Critical', 'High', 'Medium', 'Low'];

    const sortedGroups = Object.entries(groupedRisks).sort(([a], [b]) => {
        if (riskViewPreferences.groupBy === 'severity') {
            return severityOrder.indexOf(a) - severityOrder.indexOf(b);
        }
        return a.localeCompare(b);
    });

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1 flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search risks..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-gray-900 dark:text-surface-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2.5 rounded-xl border transition-colors ${
                            showFilters
                                ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                : 'bg-white dark:bg-surface-800/50 border-gray-200 dark:border-surface-700 text-gray-600 dark:text-surface-400'
                        }`}
                    >
                        <SlidersHorizontal size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={riskViewPreferences.groupBy}
                        onChange={(e) => setRiskViewPreferences({ groupBy: e.target.value as RiskGroupBy })}
                        className="px-3 py-2 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-sm text-gray-700 dark:text-surface-300"
                    >
                        {groupByOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                Group: {opt.label}
                            </option>
                        ))}
                    </select>

                    <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => openRiskWizard()}>
                        Log Risk
                    </Button>
                </div>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Card variant="glass" padding="md">
                            <div className="flex flex-wrap gap-4">
                                {/* Severity Filter */}
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-surface-400 mb-1 block">Severity</label>
                                    <div className="flex gap-1">
                                        {severityOptions.map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => {
                                                    const current = riskFilter.severity || [];
                                                    if (current.includes(s)) {
                                                        setRiskFilter({ severity: current.filter((x) => x !== s) });
                                                    } else {
                                                        setRiskFilter({ severity: [...current, s] });
                                                    }
                                                }}
                                                className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                                                    riskFilter.severity?.includes(s)
                                                        ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                                        : 'border-gray-200 dark:border-surface-700 text-gray-600 dark:text-surface-400'
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-surface-400 mb-1 block">Status</label>
                                    <div className="flex gap-1 flex-wrap">
                                        {statusOptions.map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => {
                                                    const current = riskFilter.status || [];
                                                    if (current.includes(s)) {
                                                        setRiskFilter({ status: current.filter((x) => x !== s) });
                                                    } else {
                                                        setRiskFilter({ status: [...current, s] });
                                                    }
                                                }}
                                                className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                                                    riskFilter.status?.includes(s)
                                                        ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                                        : 'border-gray-200 dark:border-surface-700 text-gray-600 dark:text-surface-400'
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Filters */}
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-surface-400 mb-1 block">Flags</label>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setRiskFilter({ isNewlyEscalated: !riskFilter.isNewlyEscalated })}
                                            className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                                                riskFilter.isNewlyEscalated
                                                    ? 'bg-red-500/10 border-red-500 text-red-500'
                                                    : 'border-gray-200 dark:border-surface-700 text-gray-600 dark:text-surface-400'
                                            }`}
                                        >
                                            Escalated
                                        </button>
                                        <button
                                            onClick={() => setRiskFilter({ isStale: !riskFilter.isStale })}
                                            className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                                                riskFilter.isStale
                                                    ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                                                    : 'border-gray-200 dark:border-surface-700 text-gray-600 dark:text-surface-400'
                                            }`}
                                        >
                                            Stale
                                        </button>
                                        <button
                                            onClick={() =>
                                                setRiskFilter({ isMitigationOverdue: !riskFilter.isMitigationOverdue })
                                            }
                                            className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                                                riskFilter.isMitigationOverdue
                                                    ? 'bg-red-500/10 border-red-500 text-red-500'
                                                    : 'border-gray-200 dark:border-surface-700 text-gray-600 dark:text-surface-400'
                                            }`}
                                        >
                                            Overdue
                                        </button>
                                    </div>
                                </div>

                                {/* Clear */}
                                <div className="flex items-end ml-auto">
                                    <button
                                        onClick={() => {
                                            resetRiskFilter();
                                            setSearchQuery('');
                                        }}
                                        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                    >
                                        <RotateCcw size={12} />
                                        Clear all
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Risk List */}
            {filteredRisks.length === 0 ? (
                <Card variant="glass" padding="lg">
                    <div className="text-center py-12">
                        <Shield size={48} className="mx-auto mb-4 text-gray-300 dark:text-surface-600" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-surface-100 mb-2">No risks found</h3>
                        <p className="text-gray-500 dark:text-surface-400 mb-4">
                            {searchQuery || Object.keys(riskFilter).length > 0
                                ? 'Try adjusting your filters'
                                : 'Log your first risk to start tracking'}
                        </p>
                        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => openRiskWizard()}>
                            Log Risk
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-6">
                    {sortedGroups.map(([groupName, groupRisks]) => (
                        <div key={groupName}>
                            <div className="flex items-center gap-2 mb-3">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-surface-300">{groupName}</h3>
                                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-surface-800 px-2 py-0.5 rounded-full">
                                    {groupRisks.length}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {groupRisks.map((risk) => (
                                    <motion.div key={risk.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card
                                            variant="glass"
                                            padding="none"
                                            className={`hover:shadow-lg transition-all cursor-pointer ${
                                                selectedRiskId === risk.id ? 'ring-2 ring-[var(--accent-primary)]' : ''
                                            } ${
                                                risk.severity === 'critical'
                                                    ? 'border-l-4 border-red-500'
                                                    : risk.severity === 'high'
                                                    ? 'border-l-4 border-orange-500'
                                                    : ''
                                            }`}
                                            onClick={() => setSelectedRiskId(risk.id)}
                                        >
                                            <div className="flex items-center gap-4 p-4">
                                                {/* Severity Indicator */}
                                                <div
                                                    className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                                                        risk.severity === 'critical'
                                                            ? 'bg-red-500/10'
                                                            : risk.severity === 'high'
                                                            ? 'bg-orange-500/10'
                                                            : risk.severity === 'medium'
                                                            ? 'bg-amber-500/10'
                                                            : 'bg-green-500/10'
                                                    }`}
                                                >
                                                    <Shield
                                                        size={20}
                                                        className={
                                                            risk.severity === 'critical'
                                                                ? 'text-red-500'
                                                                : risk.severity === 'high'
                                                                ? 'text-orange-500'
                                                                : risk.severity === 'medium'
                                                                ? 'text-amber-500'
                                                                : 'text-green-500'
                                                        }
                                                    />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-gray-900 dark:text-surface-100 truncate">
                                                            {risk.title}
                                                        </p>
                                                        {risk.isNewlyEscalated && (
                                                            <Badge variant="danger" size="sm">
                                                                Escalated
                                                            </Badge>
                                                        )}
                                                        {risk.isStale && (
                                                            <Badge variant="warning" size="sm">
                                                                Stale
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-surface-400">
                                                        <Badge
                                                            variant={getBadgeVariant(riskSeverityConfig[risk.severity].color)}
                                                            size="sm"
                                                        >
                                                            {risk.severity}
                                                        </Badge>
                                                        <Badge
                                                            variant={getBadgeVariant(riskStatusConfig[risk.status].color)}
                                                            size="sm"
                                                        >
                                                            {riskStatusConfig[risk.status].label}
                                                        </Badge>
                                                        {risk.impactAreas.length > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <Target size={12} />
                                                                {risk.impactAreas[0]}
                                                            </span>
                                                        )}
                                                        {risk.owner && (
                                                            <span className="flex items-center gap-1">
                                                                <User size={12} />
                                                                {risk.owner.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Progress */}
                                                <div className="hidden md:block w-32">
                                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                                        <span>Mitigation</span>
                                                        <span>{risk.mitigationProgress}%</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${
                                                                risk.mitigationProgress >= 80
                                                                    ? 'bg-green-500'
                                                                    : risk.mitigationProgress >= 50
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-red-500'
                                                            }`}
                                                            style={{ width: `${risk.mitigationProgress}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Impact Score */}
                                                <div className="hidden lg:flex flex-col items-center px-3">
                                                    <span className="text-xs text-gray-400">Impact</span>
                                                    <span
                                                        className={`text-lg font-bold ${
                                                            risk.impactScore >= 15
                                                                ? 'text-red-500'
                                                                : risk.impactScore >= 10
                                                                ? 'text-orange-500'
                                                                : risk.impactScore >= 5
                                                                ? 'text-amber-500'
                                                                : 'text-green-500'
                                                        }`}
                                                    >
                                                        {risk.impactScore}
                                                    </span>
                                                </div>

                                                <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// =============================================================================
// SHORTCUTS TAB
// =============================================================================

function ShortcutsTab() {
    const { t } = useThemeStore();
    const { setTaskFilter, setRiskFilter } = useTaskStore();

    const quickLinks = [
        { icon: Calendar, label: 'Due Today', action: () => { setTaskFilter({ dueDateFrom: new Date().toISOString().split('T')[0], dueDateTo: new Date().toISOString().split('T')[0] }); }, color: 'blue' },
        { icon: AlertTriangle, label: 'Overdue Tasks', action: () => { setTaskFilter({ isOverdue: true }); }, color: 'red' },
        { icon: Pause, label: 'Blocked Tasks', action: () => { setTaskFilter({ isBlocked: true }); }, color: 'orange' },
        { icon: Eye, label: 'Needs Review', action: () => { setTaskFilter({ status: ['awaiting_review'] }); }, color: 'purple' },
        { icon: AlertOctagon, label: 'Critical Risks', action: () => { setRiskFilter({ severity: ['critical'] }); }, color: 'red' },
        { icon: Clock, label: 'Due This Week', action: () => { setTaskFilter({}); }, color: 'cyan' },
    ];

    const recentViews = [
        { label: 'High Priority Tasks', type: 'filter' },
        { label: 'Invoice Processing Queue', type: 'view' },
        { label: 'Treasury Risks', type: 'filter' },
    ];

    return (
        <div className="space-y-6">
            {/* Quick Actions Grid */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-surface-300 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {quickLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <button
                                key={link.label}
                                onClick={link.action}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-all"
                            >
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        link.color === 'red'
                                            ? 'bg-red-500/10'
                                            : link.color === 'orange'
                                            ? 'bg-orange-500/10'
                                            : link.color === 'purple'
                                            ? 'bg-purple-500/10'
                                            : link.color === 'cyan'
                                            ? 'bg-cyan-500/10'
                                            : 'bg-blue-500/10'
                                    }`}
                                >
                                    <Icon
                                        size={20}
                                        className={
                                            link.color === 'red'
                                                ? 'text-red-500'
                                                : link.color === 'orange'
                                                ? 'text-orange-500'
                                                : link.color === 'purple'
                                                ? 'text-purple-500'
                                                : link.color === 'cyan'
                                                ? 'text-cyan-500'
                                                : 'text-blue-500'
                                        }
                                    />
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-surface-300 text-center">
                                    {link.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Saved Filters */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-surface-300 mb-4">Saved Filters</h3>
                <Card variant="glass" padding="lg">
                    <div className="text-center py-6">
                        <Bookmark size={32} className="mx-auto mb-2 text-gray-300 dark:text-surface-600" />
                        <p className="text-gray-500 dark:text-surface-400 text-sm">
                            Save your frequently used filters for quick access
                        </p>
                    </div>
                </Card>
            </div>

            {/* Recent Views */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-surface-300 mb-4">Recently Viewed</h3>
                <Card variant="glass" padding="md">
                    <div className="space-y-2">
                        {recentViews.map((view, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-surface-800/50 cursor-pointer"
                            >
                                <Clock size={14} className="text-gray-400" />
                                <span className="text-sm text-gray-700 dark:text-surface-300">{view.label}</span>
                                <Badge variant="neutral" size="sm">
                                    {view.type}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Keyboard Shortcuts */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-surface-300 mb-4">Keyboard Shortcuts</h3>
                <Card variant="glass" padding="md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { keys: ['⌘', 'K'], action: 'Quick search' },
                            { keys: ['⌘', 'N'], action: 'New task' },
                            { keys: ['⌘', 'R'], action: 'New risk' },
                            { keys: ['Esc'], action: 'Close panel' },
                            { keys: ['↑', '↓'], action: 'Navigate list' },
                            { keys: ['Enter'], action: 'Open selected' },
                        ].map((shortcut, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-surface-400">{shortcut.action}</span>
                                <div className="flex items-center gap-1">
                                    {shortcut.keys.map((key, i) => (
                                        <React.Fragment key={i}>
                                            <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-surface-700 rounded border border-gray-200 dark:border-surface-600 font-mono">
                                                {key}
                                            </kbd>
                                            {i < shortcut.keys.length - 1 && <span className="text-gray-400">+</span>}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function TaskCenterPage() {
    const { t } = useThemeStore();
    const { isLoading, fetchTasks, fetchRisks, getTaskSummary, getRiskSummary } = useTaskStore();
    const [activeTab, setActiveTab] = useState<'today' | 'tasks' | 'risks' | 'shortcuts'>('today');

    const taskSummary = getTaskSummary();
    const riskSummary = getRiskSummary();

    useEffect(() => {
        // Attempt to fetch from API (falls back to demo data)
        fetchTasks();
        fetchRisks();
    }, [fetchTasks, fetchRisks]);

    const tabs = [
        { id: 'today' as const, label: 'Today', icon: Zap, count: taskSummary.dueToday + taskSummary.overdue },
        { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare, count: taskSummary.total - taskSummary.byStatus.completed },
        { id: 'risks' as const, label: 'Risks', icon: Shield, count: riskSummary.total - riskSummary.byStatus.resolved },
        { id: 'shortcuts' as const, label: 'Shortcuts', icon: Bookmark },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
                        Task Center
                    </h1>
                    <p className="text-gray-500 dark:text-surface-500 mt-1">
                        Manage your actions, track risks, and stay on top of what matters
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-xl bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 text-gray-600 dark:text-surface-400 hover:bg-gray-50 dark:hover:bg-surface-800">
                        <Bell size={18} />
                    </button>
                    <button className="p-2 rounded-xl bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 text-gray-600 dark:text-surface-400 hover:bg-gray-50 dark:hover:bg-surface-800">
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-surface-700">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                isActive
                                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                    : 'border-transparent text-gray-500 dark:text-surface-400 hover:text-gray-700 dark:hover:text-surface-300'
                            }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span
                                    className={`px-1.5 py-0.5 text-xs rounded-full ${
                                        isActive
                                            ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                                            : 'bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-surface-400'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'today' && <TodayOverview />}
                    {activeTab === 'tasks' && <TasksTab />}
                    {activeTab === 'risks' && <RisksTab />}
                    {activeTab === 'shortcuts' && <ShortcutsTab />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}