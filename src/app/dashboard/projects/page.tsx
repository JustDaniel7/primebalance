'use client';

// =============================================================================
// PROJECTS PAGE - PrimeBalance Finance OS
// CHANGE TYPE: UPDATE - Added loading states, error handling, delete confirmations
// FILE PATH: src/app/dashboard/projects/page.tsx
// =============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FolderKanban, Plus, Search, Calendar, DollarSign, Clock,
    TrendingUp, AlertTriangle, CheckCircle2, PauseCircle, XCircle,
    Target, Briefcase, Building2, Edit, Trash2, Eye, Receipt, X,
    ChevronRight, ChevronLeft, Layers, Download, RefreshCw, Loader2, AlertCircle,
} from 'lucide-react';
import { Card, Button, Badge, ExportModal, convertToFormat, downloadFile, type ExportFormat } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useProjectStore } from '@/store/project-store';
import toast from 'react-hot-toast';
import type { Project, CostCenter, ProjectStatus, ProjectType } from '@/types/project';
import { PROJECT_STATUSES, PROJECT_TYPES, BUDGET_TYPES } from '@/types/project';

// =============================================================================
// HELPERS
// =============================================================================

const formatCurrency = (value: number, currency = 'EUR'): string => {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

// =============================================================================
// STATUS & TYPE CONFIG
// =============================================================================

const STATUS_ICONS: Record<ProjectStatus, React.ElementType> = {
    planning: Calendar,
    active: TrendingUp,
    on_hold: PauseCircle,
    completed: CheckCircle2,
    cancelled: XCircle,
    archived: FolderKanban,
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
    planning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    on_hold: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    archived: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
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
// DELETE CONFIRMATION DIALOG
// =============================================================================

function DeleteConfirmDialog({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    isDeleting,
}: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting: boolean;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-md"
            >
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-surface-700">
                    <Button variant="secondary" onClick={onCancel} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// ERROR ALERT
// =============================================================================

function ErrorAlert({ message, onDismiss }: { message: string; onDismiss: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <span className="text-red-800 dark:text-red-200">{message}</span>
                </div>
                <button onClick={onDismiss} className="text-red-600 hover:text-red-800">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}

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
            bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            label: 'Total Budget',
            value: formatCurrency(summary.totalBudget),
            subtext: `${formatCurrency(summary.totalSpent)} spent`,
            icon: DollarSign,
            bgColor: 'bg-blue-100 dark:bg-blue-900/30',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            label: 'Total Profit',
            value: formatCurrency(summary.totalProfit),
            subtext: `${summary.averageMargin.toFixed(1)}% avg margin`,
            icon: TrendingUp,
            bgColor: summary.totalProfit >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30',
            iconColor: summary.totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
        },
        {
            label: 'Attention Needed',
            value: summary.overdueProjects + summary.overBudgetProjects,
            subtext: `${summary.overdueProjects} overdue, ${summary.overBudgetProjects} over budget`,
            icon: AlertTriangle,
            bgColor: (summary.overdueProjects + summary.overBudgetProjects) > 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-900/30',
            iconColor: (summary.overdueProjects + summary.overBudgetProjects) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                    <Card key={metric.label} variant="glass" padding="lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {metric.value}
                                    {metric.total !== undefined && (
                                        <span className="text-lg text-gray-400">/{metric.total}</span>
                                    )}
                                </p>
                                {metric.subtext && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{metric.subtext}</p>
                                )}
                            </div>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${metric.bgColor}`}>
                                <Icon className={`w-6 h-6 ${metric.iconColor}`} />
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}

// =============================================================================
// PROJECT CARD
// =============================================================================

function ProjectCard({
    project,
    onView,
    onEdit,
    onDelete,
}: {
    project: Project;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const StatusIcon = STATUS_ICONS[project.status];
    const TypeIcon = TYPE_ICONS[project.type];
    const budgetPercent = project.budgetUtilization || 0;
    const isOverBudget = budgetPercent > 100;

    return (
        <Card variant="glass" padding="lg" className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
                        <TypeIcon className="w-5 h-5 text-[var(--accent-primary)]" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{project.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{project.code}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onEdit}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                        title="Edit project"
                    >
                        <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete project"
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[project.status]}`}>
                        <StatusIcon className="w-3 h-3" />
                        {PROJECT_STATUSES.find((s) => s.value === project.status)?.label || project.status}
                    </span>
                    {project.isBillable && (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            Billable
                        </span>
                    )}
                </div>

                {/* Budget Progress */}
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500 dark:text-gray-400">Budget</span>
                        <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                            {budgetPercent.toFixed(0)}%
                        </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${
                                isOverBudget ? 'bg-red-500' : budgetPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{formatCurrency(project.budgetSpent || 0)}</span>
                        <span>{formatCurrency(project.budgetAmount || 0)}</span>
                    </div>
                </div>

                {/* Timeline */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(project.plannedStartDate)} → {formatDate(project.plannedEndDate)}</span>
                </div>

                {/* Progress */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-surface-700">
                    <span className="text-sm text-gray-500">Progress</span>
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--accent-primary)] rounded-full"
                                style={{ width: `${project.percentComplete || 0}%` }}
                            />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {project.percentComplete || 0}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-surface-700">
                <Button variant="secondary" className="w-full" onClick={onView}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                </Button>
            </div>
        </Card>
    );
}

// =============================================================================
// COST CENTER CARD
// =============================================================================

function CostCenterCard({
    costCenter,
    onEdit,
    onDelete,
}: {
    costCenter: CostCenter;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const { getProjectsByCostCenter } = useProjectStore();
    const projects = getProjectsByCostCenter(costCenter.id);
    const utilizationPercent = costCenter.budgetUtilization || 0;

    return (
        <Card variant="glass" padding="lg">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{costCenter.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{costCenter.code}</p>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onEdit}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                    >
                        <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Budget Utilization</span>
                        <span className="font-medium text-gray-900 dark:text-white">{utilizationPercent.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${
                                utilizationPercent > 90 ? 'bg-red-500' : utilizationPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500">Annual Budget</p>
                        <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(costCenter.annualBudget || 0)}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Spent</p>
                        <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(costCenter.budgetSpent || 0)}</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between text-xs text-gray-500 pt-3 border-t border-gray-200 dark:border-surface-700 mt-4">
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
        editingProjectId,
        setWizardStep,
        updateWizardState,
        saveFromWizard,
        costCenters,
        isSaving,
    } = useProjectStore();

    const handleSave = async () => {
        const project = await saveFromWizard();
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-surface-700">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {editingProjectId ? 'Edit Project' : 'New Project'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Step {wizardState.step} of 4
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Progress */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-surface-900/50">
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map((step) => (
                            <div
                                key={step}
                                className={`flex-1 h-1.5 rounded-full ${
                                    step <= wizardState.step ? 'bg-[var(--accent-primary)]' : 'bg-gray-200 dark:bg-surface-700'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {/* Step 1: Basic Info */}
                    {wizardState.step === 1 && (
                        <div className="space-y-4">
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
                                    placeholder="PRJ-2024-XXX (auto-generated if empty)"
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
                                                        : 'border-gray-200 dark:border-surface-600 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                    <span className="font-medium text-gray-900 dark:text-white">{type.label}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">{type.description}</p>
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
                                    placeholder="Project description..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Timeline */}
                    {wizardState.step === 2 && (
                        <div className="space-y-4">
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
                        </div>
                    )}

                    {/* Step 3: Budget */}
                    {wizardState.step === 3 && (
                        <div className="space-y-4">
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
                                                    : 'border-gray-200 dark:border-surface-600 hover:border-gray-300'
                                            }`}
                                        >
                                            <span className="font-medium text-gray-900 dark:text-white">{type.label}</span>
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
                                        placeholder="0"
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
                                        <option value="EUR">EUR</option>
                                        <option value="USD">USD</option>
                                        <option value="CHF">CHF</option>
                                        <option value="GBP">GBP</option>
                                    </select>
                                </div>
                            </div>

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
                        </div>
                    )}

                    {/* Step 4: Billing */}
                    {wizardState.step === 4 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isBillable"
                                    checked={wizardState.isBillable}
                                    onChange={(e) => updateWizardState({ isBillable: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300"
                                />
                                <label htmlFor="isBillable" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    This project is billable to client
                                </label>
                            </div>

                            {wizardState.isBillable && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Billing Method
                                        </label>
                                        <select
                                            value={wizardState.billingMethod || ''}
                                            onChange={(e) => updateWizardState({ billingMethod: e.target.value as any })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                        >
                                            <option value="">Select method...</option>
                                            <option value="hourly">Hourly</option>
                                            <option value="fixed">Fixed Price</option>
                                            <option value="milestone">Milestone-Based</option>
                                            <option value="retainer">Retainer</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Billing Rate (per hour)
                                            </label>
                                            <input
                                                type="number"
                                                value={wizardState.billingRate}
                                                onChange={(e) => updateWizardState({ billingRate: parseFloat(e.target.value) || 0 })}
                                                placeholder="0"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Contract Value
                                            </label>
                                            <input
                                                type="number"
                                                value={wizardState.contractValue}
                                                onChange={(e) => updateWizardState({ contractValue: parseFloat(e.target.value) || 0 })}
                                                placeholder="0"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-900/50">
                    <Button
                        variant="secondary"
                        onClick={() => wizardState.step > 1 && setWizardStep(wizardState.step - 1)}
                        disabled={wizardState.step === 1}
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
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
                            <Button variant="primary" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : editingProjectId ? (
                                    'Update Project'
                                ) : (
                                    'Create Project'
                                )}
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
    const { 
        projects, 
        timeEntries, 
        createTimeEntry, 
        approveTimeEntry, 
        rejectTimeEntry,
        openDeleteConfirm,
        isSaving 
    } = useProjectStore();
    const [showModal, setShowModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'submitted' | 'approved' | 'rejected'>('all');

    const [formData, setFormData] = useState({
        projectId: '',
        date: new Date().toISOString().split('T')[0],
        hours: 0,
        description: '',
    });

    const filteredEntries = timeEntries.filter(e => filterStatus === 'all' || e.status === filterStatus);

    const handleSubmit = async () => {
        if (!formData.projectId || !formData.hours || !formData.description) return;

        const project = projects.find(p => p.id === formData.projectId);
        await createTimeEntry({
            projectId: formData.projectId,
            projectCode: project?.code,
            date: formData.date,
            hours: formData.hours,
            description: formData.description,
            status: 'draft',
        });

        setShowModal(false);
        setFormData({
            projectId: '',
            date: new Date().toISOString().split('T')[0],
            hours: 0,
            description: '',
        });
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
                <Button variant="primary" onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Log Time
                </Button>
            </div>

            {/* Time Entries Table */}
            <Card variant="glass" padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-surface-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hours</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-surface-700">
                            {filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        No time entries found
                                    </td>
                                </tr>
                            ) : (
                                filteredEntries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-surface-800/50">
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                            {formatDate(entry.date)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                            {entry.projectCode}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                                            {entry.description}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                            {entry.hours}h
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                                                entry.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                entry.status === 'submitted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                entry.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                            }`}>
                                                {entry.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {entry.status === 'submitted' && (
                                                    <>
                                                        <button
                                                            onClick={() => approveTimeEntry(entry.id, 'current-user')}
                                                            className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded text-green-600"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => rejectTimeEntry(entry.id, 'Not approved')}
                                                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600"
                                                            title="Reject"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => openDeleteConfirm(entry.id, 'timeEntry')}
                                                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Add Time Entry Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-md"
                        >
                            <div className="p-6 border-b border-gray-200 dark:border-surface-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Log Time Entry</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project *</label>
                                    <select
                                        value={formData.projectId}
                                        onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                    >
                                        <option value="">Select project...</option>
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hours *</label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={formData.hours}
                                            onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-surface-700">
                                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Log Time
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// =============================================================================
// COST CENTER EDIT MODAL
// =============================================================================

function CostCenterEditModal({
    costCenter,
    onClose,
    onSave,
    isSaving,
}: {
    costCenter: CostCenter;
    onClose: () => void;
    onSave: (id: string, updates: Partial<CostCenter>) => Promise<CostCenter | null>;
    isSaving: boolean;
}) {
    const [formData, setFormData] = useState({
        name: costCenter.name,
        code: costCenter.code,
        description: costCenter.description || '',
        annualBudget: costCenter.annualBudget,
        managerName: costCenter.managerName || '',
    });
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        setError(null);

        if (!formData.name.trim()) {
            setError('Name is required');
            return;
        }

        if (!formData.code.trim()) {
            setError('Code is required');
            return;
        }

        if (formData.annualBudget < 0) {
            setError('Annual budget cannot be negative');
            return;
        }

        const result = await onSave(costCenter.id, {
            name: formData.name.trim(),
            code: formData.code.trim(),
            description: formData.description.trim() || undefined,
            annualBudget: formData.annualBudget,
            managerName: formData.managerName.trim() || undefined,
        });

        if (result) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-md"
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-surface-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Cost Center</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Cost center name"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Code *
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            placeholder="CC-001"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Optional description"
                            rows={2}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Annual Budget
                        </label>
                        <input
                            type="number"
                            value={formData.annualBudget}
                            onChange={(e) => setFormData({ ...formData, annualBudget: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Manager Name
                        </label>
                        <input
                            type="text"
                            value={formData.managerName}
                            onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                            placeholder="Manager name"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-surface-700">
                    <Button variant="secondary" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// CHARGEBACKS TAB
// =============================================================================

function ChargebacksTab() {
    const { 
        chargebacks, 
        costCenters, 
        createChargeback, 
        approveChargeback,
        openDeleteConfirm,
        isSaving 
    } = useProjectStore();
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        fromCostCenterId: '',
        toCostCenterId: '',
        description: '',
        amount: 0,
        periodStart: '',
        periodEnd: '',
    });

    const handleSubmit = async () => {
        if (!formData.fromCostCenterId || !formData.toCostCenterId || !formData.amount) return;

        const fromCC = costCenters.find(c => c.id === formData.fromCostCenterId);
        const toCC = costCenters.find(c => c.id === formData.toCostCenterId);

        await createChargeback({
            fromCostCenterId: formData.fromCostCenterId,
            fromCostCenterCode: fromCC?.code,
            toCostCenterId: formData.toCostCenterId,
            toCostCenterCode: toCC?.code,
            date: new Date().toISOString().split('T')[0],
            description: formData.description,
            category: 'labor',
            amount: formData.amount,
            currency: 'EUR',
            allocationMethod: 'direct',
            periodStart: formData.periodStart,
            periodEnd: formData.periodEnd,
            status: 'pending',
        });

        setShowModal(false);
        setFormData({
            fromCostCenterId: '',
            toCostCenterId: '',
            description: '',
            amount: 0,
            periodStart: '',
            periodEnd: '',
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button variant="primary" onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Chargeback
                </Button>
            </div>

            <Card variant="glass" padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-surface-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From → To</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-surface-700">
                            {chargebacks.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        No chargebacks found
                                    </td>
                                </tr>
                            ) : (
                                chargebacks.map((cb) => (
                                    <tr key={cb.id} className="hover:bg-gray-50 dark:hover:bg-surface-800/50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                            {cb.chargebackNumber}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                            {cb.fromCostCenterCode} → {cb.toCostCenterCode}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                                            {cb.description}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(cb.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                                                cb.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                cb.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                            }`}>
                                                {cb.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {cb.status === 'pending' && (
                                                    <button
                                                        onClick={() => approveChargeback(cb.id, 'current-user')}
                                                        className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded text-green-600"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openDeleteConfirm(cb.id, 'chargeback')}
                                                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Add Chargeback Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-md"
                        >
                            <div className="p-6 border-b border-gray-200 dark:border-surface-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Chargeback</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From *</label>
                                        <select
                                            value={formData.fromCostCenterId}
                                            onChange={(e) => setFormData({ ...formData, fromCostCenterId: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                        >
                                            <option value="">Select...</option>
                                            {costCenters.map((cc) => (
                                                <option key={cc.id} value={cc.id}>{cc.code}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To *</label>
                                        <select
                                            value={formData.toCostCenterId}
                                            onChange={(e) => setFormData({ ...formData, toCostCenterId: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                        >
                                            <option value="">Select...</option>
                                            {costCenters.map((cc) => (
                                                <option key={cc.id} value={cc.id}>{cc.code}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount *</label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-surface-700">
                                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Create Chargeback
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// =============================================================================
// PROJECT DETAIL MODAL
// =============================================================================

function ProjectDetailModal({
    project,
    onClose,
    onEdit,
}: {
    project: Project;
    onClose: () => void;
    onEdit: () => void;
}) {
    const { t } = useThemeStore();
    const { updateProjectStatus, getTimeEntriesByProject, milestones } = useProjectStore();
    const [isUpdating, setIsUpdating] = useState(false);

    const StatusIcon = STATUS_ICONS[project.status];
    const TypeIcon = TYPE_ICONS[project.type];
    const timeEntries = getTimeEntriesByProject(project.id);
    const projectMilestones = milestones.filter(m => m.projectId === project.id);
    const totalHours = timeEntries.reduce((sum, te) => sum + te.hours, 0);
    const budgetPercent = project.budgetUtilization || 0;

    const handleStatusChange = async (newStatus: ProjectStatus) => {
        setIsUpdating(true);
        const success = await updateProjectStatus(project.id, newStatus);
        if (success) {
            toast.success(`Project status updated to ${newStatus}`);
        } else {
            toast.error('Failed to update project status');
        }
        setIsUpdating(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-surface-700">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
                            <TypeIcon className="w-6 h-6 text-[var(--accent-primary)]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{project.name}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{project.code}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={onEdit}>
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                        </Button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
                    {/* Status & Quick Actions */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${STATUS_COLORS[project.status]}`}>
                            <StatusIcon className="w-4 h-4" />
                            {PROJECT_STATUSES.find(s => s.value === project.status)?.label || project.status}
                        </span>
                        {project.isBillable && (
                            <Badge variant="success">Billable</Badge>
                        )}
                        <div className="flex-1" />
                        <select
                            value={project.status}
                            onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                            disabled={isUpdating}
                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                        >
                            {PROJECT_STATUSES.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card variant="glass" padding="md">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Budget</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(project.budgetAmount || 0)}</p>
                            <div className="h-1.5 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden mt-2">
                                <div
                                    className={`h-full rounded-full ${budgetPercent > 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{budgetPercent.toFixed(0)}% used</p>
                        </Card>
                        <Card variant="glass" padding="md">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Spent</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(project.budgetSpent || 0)}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatCurrency(project.budgetRemaining || 0)} remaining</p>
                        </Card>
                        <Card variant="glass" padding="md">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Progress</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{project.percentComplete || 0}%</p>
                            <div className="h-1.5 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden mt-2">
                                <div
                                    className="h-full bg-[var(--accent-primary)] rounded-full"
                                    style={{ width: `${project.percentComplete || 0}%` }}
                                />
                            </div>
                        </Card>
                        <Card variant="glass" padding="md">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Hours Logged</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{totalHours}h</p>
                            <p className="text-xs text-gray-500 mt-1">{project.allocatedHours || 0}h allocated</p>
                        </Card>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Project Details</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Type</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {PROJECT_TYPES.find(t => t.value === project.type)?.label}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Priority</span>
                                    <span className="font-medium text-gray-900 dark:text-white capitalize">{project.priority}</span>
                                </div>
                                {project.ownerName && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Owner</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{project.ownerName}</span>
                                    </div>
                                )}
                                {project.clientName && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Client</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{project.clientName}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Timeline</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Planned Start</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(project.plannedStartDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Planned End</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(project.plannedEndDate)}</span>
                                </div>
                                {project.actualStartDate && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Actual Start</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{formatDate(project.actualStartDate)}</span>
                                    </div>
                                )}
                                {project.actualEndDate && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Actual End</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{formatDate(project.actualEndDate)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {project.description && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-surface-900/50 p-3 rounded-lg">
                                {project.description}
                            </p>
                        </div>
                    )}

                    {/* Milestones */}
                    {projectMilestones.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Milestones</h3>
                            <div className="space-y-2">
                                {projectMilestones.map(m => (
                                    <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-surface-900/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {m.status === 'completed' ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <Clock className="w-5 h-5 text-gray-400" />
                                            )}
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{m.name}</span>
                                        </div>
                                        <span className="text-sm text-gray-500">{formatDate(m.plannedDate)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-surface-700">
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </motion.div>
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
        fetchProjects,
        fetchCostCenters,
        fetchTimeEntries,
        fetchChargebacks,
        isLoading,
        isSaving,
        error,
        clearError,
        deleteConfirmId,
        deleteConfirmType,
        openDeleteConfirm,
        closeDeleteConfirm,
        confirmDelete,
        updateCostCenter,
    } = useProjectStore();

    const [activeTab, setActiveTab] = useState<'projects' | 'cost-centers' | 'time' | 'chargebacks'>('projects');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<ProjectType | 'all'>('all');
    const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // Fetch data on mount
    useEffect(() => {
        fetchProjects();
        fetchCostCenters();
        fetchTimeEntries();
        fetchChargebacks();
    }, [fetchProjects, fetchCostCenters, fetchTimeEntries, fetchChargebacks]);

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

    // Get delete confirmation details
    const getDeleteDetails = () => {
        if (!deleteConfirmId || !deleteConfirmType) return { title: '', message: '' };
        
        switch (deleteConfirmType) {
            case 'project':
                const project = projects.find(p => p.id === deleteConfirmId);
                return {
                    title: 'Delete Project',
                    message: `Are you sure you want to delete "${project?.name}"? This action cannot be undone.`,
                };
            case 'costCenter':
                const cc = costCenters.find(c => c.id === deleteConfirmId);
                return {
                    title: 'Delete Cost Center',
                    message: `Are you sure you want to delete "${cc?.name}"? This action cannot be undone.`,
                };
            case 'timeEntry':
                return {
                    title: 'Delete Time Entry',
                    message: 'Are you sure you want to delete this time entry? This action cannot be undone.',
                };
            case 'chargeback':
                return {
                    title: 'Delete Chargeback',
                    message: 'Are you sure you want to delete this chargeback? This action cannot be undone.',
                };
            default:
                return { title: '', message: '' };
        }
    };

    const deleteDetails = getDeleteDetails();

    // Export projects
    const getExportData = () => ({
        exportedAt: new Date().toISOString(),
        projects: filteredProjects.map(p => ({
            code: p.code,
            name: p.name,
            type: p.type,
            status: p.status,
            budget: p.budgetAmount || 0,
            spent: p.budgetSpent || 0,
            remaining: p.budgetRemaining || 0,
            progress: p.percentComplete || 0,
            plannedStartDate: p.plannedStartDate,
            plannedEndDate: p.plannedEndDate,
            owner: p.ownerName,
            client: p.clientName,
        })),
    });

    const handleExport = (format: ExportFormat) => {
        const exportData = getExportData();
        const fileName = `projects-export-${new Date().toISOString().split('T')[0]}`;
        const { content, mimeType, extension } = convertToFormat(exportData, format, 'projects');
        downloadFile(content, `${fileName}.${extension}`, mimeType);
        toast.success(`Projects exported as ${format.toUpperCase()}`);
    };

    return (
        <div className="space-y-6">
            {/* Error Alert */}
            <AnimatePresence>
                {error && <ErrorAlert message={error} onDismiss={clearError} />}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
                        Projects & Cost Centers
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Manage projects, budgets, time tracking, and cost allocations
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" onClick={() => setShowExportModal(true)}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Button variant="secondary" onClick={() => fetchProjects()} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button variant="primary" onClick={() => openWizard()}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Project
                    </Button>
                </div>
            </div>

            {/* Export Modal */}
            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                onExport={handleExport}
                title={t('projects.exportTitle') || 'Export Projects'}
                fileName="projects"
            />

            {/* Metric Cards */}
            <MetricCards />

            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-surface-800 rounded-xl w-fit">
                {[
                    { id: 'projects', label: 'Projects', icon: FolderKanban },
                    { id: 'cost-centers', label: 'Cost Centers', icon: Building2 },
                    { id: 'time', label: 'Time Tracking', icon: Clock },
                    { id: 'chargebacks', label: 'Chargebacks', icon: Receipt },
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-white dark:bg-surface-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
                </div>
            )}

            {/* Projects Tab */}
            {!isLoading && activeTab === 'projects' && (
                <>
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative flex-1 min-w-[200px] max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search projects..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                        >
                            <option value="all">All Status</option>
                            {PROJECT_STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
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
                                onView={() => setSelectedProject(project)}
                                onEdit={() => openWizard(project)}
                                onDelete={() => openDeleteConfirm(project.id, 'project')}
                            />
                        ))}
                    </div>

                    {filteredProjects.length === 0 && !isLoading && (
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
            {!isLoading && activeTab === 'cost-centers' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {costCenters.map((cc) => (
                        <CostCenterCard
                            key={cc.id}
                            costCenter={cc}
                            onEdit={() => setEditingCostCenter(cc)}
                            onDelete={() => openDeleteConfirm(cc.id, 'costCenter')}
                        />
                    ))}
                    {costCenters.length === 0 && (
                        <Card variant="glass" padding="lg" className="text-center col-span-full">
                            <Building2 className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No cost centers</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                Create cost centers to organize project budgets
                            </p>
                        </Card>
                    )}
                </div>
            )}

            {/* Time Tracking Tab */}
            {!isLoading && activeTab === 'time' && <TimeTrackingTab />}

            {/* Chargebacks Tab */}
            {!isLoading && activeTab === 'chargebacks' && <ChargebacksTab />}

            {/* Wizard Modal */}
            <AnimatePresence>
                {wizardOpen && <ProjectWizard onClose={closeWizard} />}
            </AnimatePresence>

            {/* Project Detail Modal */}
            <AnimatePresence>
                {selectedProject && (
                    <ProjectDetailModal
                        project={selectedProject}
                        onClose={() => setSelectedProject(null)}
                        onEdit={() => {
                            openWizard(selectedProject);
                            setSelectedProject(null);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Cost Center Edit Modal */}
            <AnimatePresence>
                {editingCostCenter && (
                    <CostCenterEditModal
                        costCenter={editingCostCenter}
                        onClose={() => setEditingCostCenter(null)}
                        onSave={updateCostCenter}
                        isSaving={isSaving}
                    />
                )}
            </AnimatePresence>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                isOpen={!!deleteConfirmId}
                title={deleteDetails.title}
                message={deleteDetails.message}
                onConfirm={confirmDelete}
                onCancel={closeDeleteConfirm}
                isDeleting={isSaving}
            />
        </div>
    );
}