'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FolderKanban,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Calendar,
    DollarSign,
    Clock,
    Users,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle2,
    PauseCircle,
    XCircle,
    Target,
    Briefcase,
    Building2,
    BarChart3,
    PieChart,
    ArrowRight,
    Edit,
    Trash2,
    Eye,
    Receipt,
    X,
    ChevronRight,
    Layers,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useProjectStore } from '@/store/project-store';
import type { Project, CostCenter, ProjectStatus, ProjectType } from '@/types/project';
import { PROJECT_STATUSES, PROJECT_TYPES, BUDGET_TYPES } from '@/types/project';

// =============================================================================
// STATUS & TYPE ICONS
// =============================================================================

const STATUS_ICONS: Record<ProjectStatus, React.ElementType> = {
    planning: Calendar,
    active: TrendingUp,
    on_hold: PauseCircle,
    completed: CheckCircle2,
    cancelled: XCircle,
    archived: FolderKanban,
};

const TYPE_ICONS: Record<ProjectType, React.ElementType> = {
    internal: Building2,
    client: Briefcase,
    rd: Target,
    capex: DollarSign,
    opex: Receipt,
    maintenance: Layers,
};

// =============================================================================
// METRIC CARDS
// =============================================================================

function MetricCards() {
    const { getProjectSummary } = useProjectStore();
    const summary = getProjectSummary();

    const metrics = [
        {
            label: 'Active Projects',
            value: summary.activeProjects,
            total: summary.totalProjects,
            icon: FolderKanban,
            color: 'emerald',
        },
        {
            label: 'Total Budget',
            value: `$${(summary.totalBudget / 1000).toFixed(0)}K`,
            subtext: `$${(summary.totalSpent / 1000).toFixed(0)}K spent`,
            icon: DollarSign,
            color: 'blue',
        },
        {
            label: 'Total Profit',
            value: `$${(summary.totalProfit / 1000).toFixed(0)}K`,
            subtext: `${summary.averageMargin.toFixed(1)}% avg margin`,
            icon: TrendingUp,
            color: summary.totalProfit >= 0 ? 'emerald' : 'red',
        },
        {
            label: 'At Risk',
            value: summary.overdueProjects + summary.overBudgetProjects,
            subtext: `${summary.overdueProjects} overdue, ${summary.overBudgetProjects} over budget`,
            icon: AlertTriangle,
            color: 'amber',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, idx) => {
                const Icon = metric.icon;
                return (
                    <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card variant="glass" padding="md">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                        {metric.value}
                                        {metric.total && (
                                            <span className="text-sm font-normal text-gray-500">
                                                /{metric.total}
                                            </span>
                                        )}
                                    </p>
                                    {metric.subtext && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {metric.subtext}
                                        </p>
                                    )}
                                </div>
                                <div className={`p-3 rounded-xl bg-${metric.color}-500/10`}>
                                    <Icon className={`w-6 h-6 text-${metric.color}-500`} />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
}

// =============================================================================
// PROJECT CARD
// =============================================================================

function ProjectCard({ project, onView, onEdit }: { project: Project; onView: () => void; onEdit: () => void }) {
    const statusConfig = PROJECT_STATUSES.find((s) => s.value === project.status);
    const StatusIcon = STATUS_ICONS[project.status];
    const TypeIcon = TYPE_ICONS[project.type];

    const progressColor = project.budgetUtilization > 90
        ? 'bg-red-500'
        : project.budgetUtilization > 75
            ? 'bg-amber-500'
            : 'bg-emerald-500';

    return (
        <Card variant="glass" padding="md" hover className="cursor-pointer" onClick={onView}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${statusConfig?.color || 'gray'}-500/10`}>
                        <TypeIcon className={`w-5 h-5 text-${statusConfig?.color || 'gray'}-500`} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{project.code}</p>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{project.name}</h3>
                    </div>
                </div>
                <Badge
                    variant={
                        project.status === 'active' ? 'success' :
                            project.status === 'completed' ? 'info' :
                                project.status === 'on_hold' ? 'warning' :
                                    'neutral'
                    }
                >
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig?.label}
                </Badge>
            </div>

            {project.clientName && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    {project.clientName}
                </p>
            )}

            {/* Progress */}
            <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium text-gray-900 dark:text-white">{project.percentComplete}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[var(--accent-primary)] rounded-full transition-all"
                        style={{ width: `${project.percentComplete}%` }}
                    />
                </div>
            </div>

            {/* Budget */}
            <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Budget</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                        ${project.budgetSpent.toLocaleString()} / ${project.budgetAmount.toLocaleString()}
                    </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${progressColor} rounded-full transition-all`}
                        style={{ width: `${Math.min(project.budgetUtilization, 100)}%` }}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-surface-700">
                <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {project.actualHours}/{project.allocatedHours}h
                </div>
                <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(project.plannedEndDate).toLocaleDateString()}
                </div>
                {project.isBillable && (
                    <div className={`flex items-center gap-1 ${project.grossMargin >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {project.grossMargin >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {project.grossMargin.toFixed(1)}%
                    </div>
                )}
            </div>
        </Card>
    );
}

// =============================================================================
// COST CENTER CARD
// =============================================================================

function CostCenterCard({ costCenter }: { costCenter: CostCenter }) {
    const { getProjectsByCostCenter } = useProjectStore();
    const projects = getProjectsByCostCenter(costCenter.id);

    const utilizationColor = costCenter.budgetUtilization > 90
        ? 'text-red-500'
        : costCenter.budgetUtilization > 75
            ? 'text-amber-500'
            : 'text-emerald-500';

    return (
        <Card variant="glass" padding="md" hover className="cursor-pointer">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{costCenter.code}</p>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{costCenter.name}</h3>
                </div>
                <Badge variant={costCenter.isActive ? 'success' : 'neutral'}>
                    {costCenter.isActive ? 'Active' : 'Inactive'}
                </Badge>
            </div>

            <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Annual Budget</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                        ${costCenter.annualBudget.toLocaleString()}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Spent</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                        ${costCenter.budgetSpent.toLocaleString()}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Utilization</span>
                    <span className={`font-medium ${utilizationColor}`}>
                        {costCenter.budgetUtilization.toFixed(1)}%
                    </span>
                </div>
            </div>

            <div className="h-2 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden mb-3">
                <div
                    className={`h-full ${utilizationColor.replace('text-', 'bg-')} rounded-full transition-all`}
                    style={{ width: `${Math.min(costCenter.budgetUtilization, 100)}%` }}
                />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-surface-700">
                <span>{projects.length} projects</span>
                {costCenter.managerName && <span>Manager: {costCenter.managerName}</span>}
            </div>
        </Card>
    );
}

// =============================================================================
// PROJECT WIZARD
// =============================================================================

function ProjectWizard({ onClose }: { onClose: () => void }) {
    const {
        wizardState,
        setWizardStep,
        updateWizardState,
        saveFromWizard,
        costCenters,
    } = useProjectStore();

    const handleSave = () => {
        const project = saveFromWizard();
        if (project) {
            onClose();
        }
    };

    const canProceed = useMemo(() => {
        switch (wizardState.step) {
            case 1:
                return wizardState.name && wizardState.type;
            case 2:
                return wizardState.plannedStartDate && wizardState.plannedEndDate;
            case 3:
                return wizardState.budgetType && wizardState.budgetAmount > 0;
            case 4:
                return true;
            default:
                return true;
        }
    }, [wizardState]);

    return (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-white dark:bg-surface-900 rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-surface-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Project</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Step {wizardState.step} of 4
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Progress */}
                <div className="px-6 py-3 border-b border-gray-200 dark:border-surface-700">
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map((step) => (
                            <div
                                key={step}
                                className={`flex-1 h-2 rounded-full ${
                                    step <= wizardState.step
                                        ? 'bg-[var(--accent-primary)]'
                                        : 'bg-gray-200 dark:bg-surface-700'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {wizardState.step === 1 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Basic Information</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Project Name *
                                </label>
                                <input
                                    type="text"
                                    value={wizardState.name}
                                    onChange={(e) => updateWizardState({ name: e.target.value })}
                                    placeholder="Enter project name"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Project Code
                                </label>
                                <input
                                    type="text"
                                    value={wizardState.code}
                                    onChange={(e) => updateWizardState({ code: e.target.value })}
                                    placeholder="PRJ-2024-XXX"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Project Type *
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {PROJECT_TYPES.map((type) => {
                                        const Icon = TYPE_ICONS[type.value];
                                        return (
                                            <button
                                                key={type.value}
                                                onClick={() => updateWizardState({ type: type.value })}
                                                className={`p-3 rounded-xl border-2 text-left transition-all ${
                                                    wizardState.type === type.value
                                                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                                        : 'border-gray-200 dark:border-surface-700 hover:border-gray-300'
                                                }`}
                                            >
                                                <Icon className="w-5 h-5 mb-1 text-gray-600 dark:text-gray-400" />
                                                <p className="font-medium text-gray-900 dark:text-white">{type.label}</p>
                                                <p className="text-xs text-gray-500">{type.description}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={wizardState.description}
                                    onChange={(e) => updateWizardState({ description: e.target.value })}
                                    rows={3}
                                    placeholder="Describe the project..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>
                    )}

                    {wizardState.step === 2 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Timeline & Assignment</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Start Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={wizardState.plannedStartDate}
                                        onChange={(e) => updateWizardState({ plannedStartDate: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        End Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={wizardState.plannedEndDate}
                                        onChange={(e) => updateWizardState({ plannedEndDate: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Cost Center
                                </label>
                                <select
                                    value={wizardState.costCenterId}
                                    onChange={(e) => updateWizardState({ costCenterId: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                >
                                    <option value="">Select cost center...</option>
                                    {costCenters.map((cc) => (
                                        <option key={cc.id} value={cc.id}>
                                            {cc.code} - {cc.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Priority
                                </label>
                                <select
                                    value={wizardState.priority}
                                    onChange={(e) => updateWizardState({ priority: e.target.value as any })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {wizardState.step === 3 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Budget & Billing</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Budget Type *
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {BUDGET_TYPES.map((type) => (
                                        <button
                                            key={type.value}
                                            onClick={() => updateWizardState({ budgetType: type.value })}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                                                wizardState.budgetType === type.value
                                                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                                    : 'border-gray-200 dark:border-surface-700 hover:border-gray-300'
                                            }`}
                                        >
                                            <p className="font-medium text-gray-900 dark:text-white">{type.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Budget Amount *
                                    </label>
                                    <input
                                        type="number"
                                        value={wizardState.budgetAmount}
                                        onChange={(e) => updateWizardState({ budgetAmount: parseFloat(e.target.value) || 0 })}
                                        placeholder="0.00"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Currency
                                    </label>
                                    <select
                                        value={wizardState.currency}
                                        onChange={(e) => updateWizardState({ currency: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                        <option value="CHF">CHF</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="billable"
                                    checked={wizardState.isBillable}
                                    onChange={(e) => updateWizardState({ isBillable: e.target.checked })}
                                    className="w-5 h-5 rounded"
                                />
                                <label htmlFor="billable" className="text-sm text-gray-700 dark:text-gray-300">
                                    This is a billable project
                                </label>
                            </div>

                            {wizardState.isBillable && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Contract Value
                                        </label>
                                        <input
                                            type="number"
                                            value={wizardState.contractValue}
                                            onChange={(e) => updateWizardState({ contractValue: parseFloat(e.target.value) || 0 })}
                                            placeholder="0.00"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Billing Rate (per hour)
                                        </label>
                                        <input
                                            type="number"
                                            value={wizardState.billingRate}
                                            onChange={(e) => updateWizardState({ billingRate: parseFloat(e.target.value) || 0 })}
                                            placeholder="0.00"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {wizardState.step === 4 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Resources & Hours</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Allocated Hours
                                    </label>
                                    <input
                                        type="number"
                                        value={wizardState.allocatedHours}
                                        onChange={(e) => updateWizardState({ allocatedHours: parseFloat(e.target.value) || 0 })}
                                        placeholder="0"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Internal Hourly Rate
                                    </label>
                                    <input
                                        type="number"
                                        value={wizardState.hourlyRate}
                                        onChange={(e) => updateWizardState({ hourlyRate: parseFloat(e.target.value) || 0 })}
                                        placeholder="0.00"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Project Summary</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Name</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{wizardState.name || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Type</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {PROJECT_TYPES.find((t) => t.value === wizardState.type)?.label || '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Budget</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {wizardState.currency} {wizardState.budgetAmount.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Timeline</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {wizardState.plannedStartDate} → {wizardState.plannedEndDate}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Hours</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {wizardState.allocatedHours}h @ ${wizardState.hourlyRate}/h
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-surface-700">
                    <Button
                        variant="ghost"
                        onClick={() => wizardState.step > 1 && setWizardStep(wizardState.step - 1)}
                        disabled={wizardState.step === 1}
                    >
                        Back
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        {wizardState.step < 4 ? (
                            <Button
                                variant="primary"
                                onClick={() => setWizardStep(wizardState.step + 1)}
                                disabled={!canProceed}
                            >
                                Next
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        ) : (
                            <Button variant="primary" onClick={handleSave}>
                                Create Project
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// TIME TRACKING TAB
// =============================================================================

function TimeTrackingTab() {
    const { projects, timeEntries, createTimeEntry, approveTimeEntry, rejectTimeEntry, deleteTimeEntry } = useProjectStore();
    const [showModal, setShowModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'submitted' | 'approved' | 'rejected'>('all');

    const [formData, setFormData] = useState({
        projectId: '',
        date: new Date().toISOString().split('T')[0],
        hours: 0,
        description: '',
        category: '',
        isBillable: true,
        hourlyRate: 0,
    });

    const filteredEntries = timeEntries.filter(e => filterStatus === 'all' || e.status === filterStatus);

    const handleSubmit = () => {
        if (!formData.projectId || !formData.hours || !formData.description) return;

        createTimeEntry({
            userId: 'current-user',
            userName: 'Current User',
            projectId: formData.projectId,
            projectCode: projects.find(p => p.id === formData.projectId)?.code,
            date: formData.date,
            hours: formData.hours,
            description: formData.description,
            category: formData.category,
            isBillable: formData.isBillable,
            hourlyRate: formData.hourlyRate,
            costRate: formData.hourlyRate * 0.7,
            status: 'draft',
        });

        setShowModal(false);
        setFormData({ projectId: '', date: new Date().toISOString().split('T')[0], hours: 0, description: '', category: '', isBillable: true, hourlyRate: 0 });
    };

    const statusColors: Record<string, string> = {
        draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {['all', 'draft', 'submitted', 'approved', 'rejected'].map((status) => (
                        <button key={status} onClick={() => setFilterStatus(status as any)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === status ? 'bg-[var(--accent-primary)] text-white' : 'bg-gray-100 dark:bg-surface-800 text-gray-600 dark:text-gray-400'}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
                <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setShowModal(true)}>Log Time</Button>
            </div>

            <Card variant="glass" padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="border-b border-gray-200 dark:border-surface-700">
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Project</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Hours</th>
                            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredEntries.map((entry) => (
                            <tr key={entry.id} className="border-b border-gray-100 dark:border-surface-800 hover:bg-gray-50 dark:hover:bg-surface-800/50">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{new Date(entry.date).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">{entry.projectCode}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">{entry.description}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">{entry.hours}h</td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">${(entry.billableAmount || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[entry.status]}`}>{entry.status}</span></td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        {entry.status === 'submitted' && (
                                            <>
                                                <button onClick={() => approveTimeEntry(entry.id, 'current-user')} className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded text-emerald-600"><CheckCircle2 size={16} /></button>
                                                <button onClick={() => rejectTimeEntry(entry.id, 'Not approved')} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600"><XCircle size={16} /></button>
                                            </>
                                        )}
                                        <button onClick={() => deleteTimeEntry(entry.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-surface-700 rounded text-gray-500"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {filteredEntries.length === 0 && <div className="text-center py-12"><Clock className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" /><p className="text-gray-500">No time entries found</p></div>}
                </div>
            </Card>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-white dark:bg-surface-900 rounded-2xl shadow-2xl">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-surface-700">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Log Time</h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg"><X size={20} className="text-gray-500" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project *</label>
                                    <select value={formData.projectId} onChange={(e) => setFormData({ ...formData, projectId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white">
                                        <option value="">Select project...</option>
                                        {projects.filter(p => p.status === 'active').map((p) => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hours *</label><input type="number" step="0.5" value={formData.hours} onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white" /></div>
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"><option value="">Select...</option><option value="development">Development</option><option value="design">Design</option><option value="meeting">Meeting</option><option value="review">Review</option><option value="other">Other</option></select></div>
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hourly Rate</label><input type="number" value={formData.hourlyRate} onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white" /></div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-surface-800 rounded-xl"><input type="checkbox" id="billable" checked={formData.isBillable} onChange={(e) => setFormData({ ...formData, isBillable: e.target.checked })} className="w-4 h-4 rounded" /><label htmlFor="billable" className="text-sm text-gray-700 dark:text-gray-300">Billable time</label></div>
                            </div>
                            <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-surface-700"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button variant="primary" onClick={handleSubmit}>Save Entry</Button></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// =============================================================================
// CHARGEBACKS TAB
// =============================================================================

function ChargebacksTab() {
    const { costCenters, chargebacks, projects, createChargeback, approveChargeback, rejectChargeback } = useProjectStore();
    const [showModal, setShowModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    const [formData, setFormData] = useState({
        fromCostCenterId: '', toCostCenterId: '', projectId: '', description: '', category: 'labor', amount: 0, quantity: 0, unitRate: 0,
        periodStart: new Date().toISOString().split('T')[0], periodEnd: new Date().toISOString().split('T')[0], allocationMethod: 'direct' as const,
    });

    const filteredChargebacks = chargebacks.filter(c => filterStatus === 'all' || c.status === filterStatus);

    const handleSubmit = () => {
        if (!formData.fromCostCenterId || !formData.toCostCenterId || !formData.amount) return;
        createChargeback({
            fromCostCenterId: formData.fromCostCenterId, fromCostCenterCode: costCenters.find(c => c.id === formData.fromCostCenterId)?.code,
            toCostCenterId: formData.toCostCenterId, toCostCenterCode: costCenters.find(c => c.id === formData.toCostCenterId)?.code,
            projectId: formData.projectId || undefined, projectCode: projects.find(p => p.id === formData.projectId)?.code,
            date: new Date().toISOString().split('T')[0], description: formData.description, category: formData.category,
            amount: formData.amount, currency: 'USD', allocationMethod: formData.allocationMethod,
            quantity: formData.quantity, unitRate: formData.unitRate, periodStart: formData.periodStart, periodEnd: formData.periodEnd,
            status: 'pending', createdBy: 'current-user',
        });
        setShowModal(false);
        setFormData({ fromCostCenterId: '', toCostCenterId: '', projectId: '', description: '', category: 'labor', amount: 0, quantity: 0, unitRate: 0, periodStart: new Date().toISOString().split('T')[0], periodEnd: new Date().toISOString().split('T')[0], allocationMethod: 'direct' });
    };

    const statusColors: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {['all', 'pending', 'approved', 'rejected'].map((status) => (
                        <button key={status} onClick={() => setFilterStatus(status as any)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === status ? 'bg-[var(--accent-primary)] text-white' : 'bg-gray-100 dark:bg-surface-800 text-gray-600 dark:text-gray-400'}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
                <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setShowModal(true)}>New Chargeback</Button>
            </div>

            <Card variant="glass" padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="border-b border-gray-200 dark:border-surface-700">
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">From → To</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
                            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredChargebacks.map((cb) => (
                            <tr key={cb.id} className="border-b border-gray-100 dark:border-surface-800 hover:bg-gray-50 dark:hover:bg-surface-800/50">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">{cb.chargebackNumber}</td>
                                <td className="px-4 py-3 text-sm"><span className="text-gray-900 dark:text-white">{cb.fromCostCenterCode}</span><ArrowRight className="inline w-4 h-4 mx-2 text-gray-400" /><span className="text-gray-900 dark:text-white">{cb.toCostCenterCode}</span></td>
                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">{cb.description}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{new Date(cb.periodStart).toLocaleDateString()} - {new Date(cb.periodEnd).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right font-medium">${cb.amount.toLocaleString()}</td>
                                <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[cb.status]}`}>{cb.status}</span></td>
                                <td className="px-4 py-3 text-right">
                                    {cb.status === 'pending' && (
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => approveChargeback(cb.id, 'current-user')} className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded text-emerald-600"><CheckCircle2 size={16} /></button>
                                            <button onClick={() => rejectChargeback(cb.id, 'Not approved')} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600"><XCircle size={16} /></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {filteredChargebacks.length === 0 && <div className="text-center py-12"><ArrowRight className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" /><p className="text-gray-500">No chargebacks found</p></div>}
                </div>
            </Card>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-white dark:bg-surface-900 rounded-2xl shadow-2xl">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-surface-700">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Chargeback</h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg"><X size={20} className="text-gray-500" /></button>
                            </div>
                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Cost Center *</label><select value={formData.fromCostCenterId} onChange={(e) => setFormData({ ...formData, fromCostCenterId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"><option value="">Select...</option>{costCenters.map((cc) => <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>)}</select></div>
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Cost Center *</label><select value={formData.toCostCenterId} onChange={(e) => setFormData({ ...formData, toCostCenterId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"><option value="">Select...</option>{costCenters.filter(cc => cc.id !== formData.fromCostCenterId).map((cc) => <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>)}</select></div>
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label><input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"><option value="labor">Labor</option><option value="materials">Materials</option><option value="equipment">Equipment</option><option value="software">Software</option><option value="overhead">Overhead</option></select></div>
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount *</label><input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white" /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period Start</label><input type="date" value={formData.periodStart} onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period End</label><input type="date" value={formData.periodEnd} onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white" /></div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-surface-700"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button variant="primary" onClick={handleSubmit}>Create Chargeback</Button></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
// =============================================================================
// MAIN PAGE
// =============================================================================

export default function ProjectsPage() {
    const { t } = useThemeStore();
    const {
        projects,
        costCenters,
        wizardOpen,
        openWizard,
        closeWizard,
        selectProject,
    } = useProjectStore();

    const [activeTab, setActiveTab] = useState<'projects' | 'cost-centers' | 'time' | 'chargebacks'>('projects');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<ProjectType | 'all'>('all');

    // Filter projects
    const filteredProjects = useMemo(() => {
        return projects.filter((p) => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.code.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
            const matchesType = typeFilter === 'all' || p.type === typeFilter;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [projects, searchQuery, statusFilter, typeFilter]);

    const tabs = [
        { id: 'projects', label: 'Projects', icon: FolderKanban },
        { id: 'cost-centers', label: 'Cost Centers', icon: Building2 },
        { id: 'time', label: 'Time Tracking', icon: Clock },
        { id: 'chargebacks', label: 'Chargebacks', icon: ArrowRight },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 border border-violet-500/20">
                            <FolderKanban className="w-6 h-6 text-violet-400" />
                        </div>
                        Projects & Cost Centers
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Manage projects, budgets, and cost attribution
                    </p>
                </div>
                <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => openWizard()}>
                    New Project
                </Button>
            </div>

            {/* Metrics */}
            <MetricCards />

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-surface-700">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
                                activeTab === tab.id
                                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Projects Tab */}
            {activeTab === 'projects' && (
                <>
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search projects..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                        >
                            <option value="all">All Statuses</option>
                            {PROJECT_STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                        >
                            <option value="all">All Types</option>
                            {PROJECT_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Projects Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProjects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onView={() => selectProject(project.id)}
                                onEdit={() => openWizard(project)}
                            />
                        ))}
                    </div>

                    {filteredProjects.length === 0 && (
                        <Card variant="glass" padding="lg" className="text-center">
                            <FolderKanban className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No projects found</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                                    ? 'Try adjusting your filters'
                                    : 'Create your first project to get started'}
                            </p>
                            {!searchQuery && statusFilter === 'all' && typeFilter === 'all' && (
                                <Button variant="primary" className="mt-4" onClick={() => openWizard()}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Project
                                </Button>
                            )}
                        </Card>
                    )}
                </>
            )}

            {/* Cost Centers Tab */}
            {activeTab === 'cost-centers' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {costCenters.map((cc) => (
                        <CostCenterCard key={cc.id} costCenter={cc} />
                    ))}
                </div>
            )}

            {/* Time Tracking Tab */}
            {activeTab === 'time' && (
                <TimeTrackingTab />
            )}

            {/* Chargebacks Tab */}
            {activeTab === 'chargebacks' && (
                <ChargebacksTab />
            )}

            {/* Wizard Modal */}
            <AnimatePresence>
                {wizardOpen && <ProjectWizard onClose={closeWizard} />}
            </AnimatePresence>
        </div>
    );
}