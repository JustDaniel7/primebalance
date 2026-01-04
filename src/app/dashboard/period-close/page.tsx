// src/app/dashboard/period-close/page.tsx
// Period Close Dashboard - API-connected version
// REPLACE: src/app/dashboard/period-close/page.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarCheck,
    Plus,
    Lock,
    Unlock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock,
    FileText,
    History,
    ChevronRight,
    X,
    Play,
    RotateCcw,
    LockKeyhole,
    ClipboardCheck,
    AlertCircle,
    DollarSign,
    MoreVertical,
    Check,
    Ban,
    Eye,
    Loader2,
    Search,
    FileSearch,
    Activity,
    User,
    Calendar,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { usePeriodCloseStore } from '@/store/period-close-store';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';
import type {
    AccountingPeriod,
    CloseChecklistItem,
    MissingItem,
    PeriodAdjustment,
    PeriodStatus,
    AdjustmentType,
} from '@/types/period-close';
import { PERIOD_STATUSES, ADJUSTMENT_TYPES } from '@/types/period-close';

// =============================================================================
// LOADING SKELETON
// =============================================================================

function LoadingSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="h-8 w-48 bg-gray-200 dark:bg-surface-700 rounded" />
                <div className="h-10 w-32 bg-gray-200 dark:bg-surface-700 rounded" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 dark:bg-surface-700 rounded-xl" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-surface-700 rounded-xl" />
                <div className="h-96 bg-gray-200 dark:bg-surface-700 rounded-xl" />
            </div>
        </div>
    );
}

// =============================================================================
// PDF EXPORT FUNCTION
// =============================================================================

function generatePeriodClosePDF(
    period: AccountingPeriod,
    checklistItems: Array<{ name: string; status: string; completedAt?: string; completedBy?: string }>,
    adjustments: Array<{ description: string; type: string; amount: number; status: string }>,
    missingItems: Array<{ title: string; severity: string; status: string }>
) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Period Close Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Period Info
    doc.setFontSize(14);
    doc.text(period.name, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${period.startDate} - ${period.endDate}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text(`Status: ${period.status.toUpperCase()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Financial Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Summary', 20, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Revenue: €${(period.totalRevenue || 0).toLocaleString()}`, 25, yPos);
    yPos += 6;
    doc.text(`Total Expenses: €${(period.totalExpenses || 0).toLocaleString()}`, 25, yPos);
    yPos += 6;
    doc.text(`Net Income: €${(period.netIncome || 0).toLocaleString()}`, 25, yPos);
    yPos += 6;
    doc.text(`Total Assets: €${(period.totalAssets || 0).toLocaleString()}`, 25, yPos);
    yPos += 6;
    doc.text(`Total Liabilities: €${(period.totalLiabilities || 0).toLocaleString()}`, 25, yPos);
    yPos += 15;

    // Checklist Progress
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Checklist Progress (${period.checklistProgress.toFixed(0)}%)`, 20, yPos);
    yPos += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const completedItems = checklistItems.filter(i => i.status === 'completed');
    const pendingItems = checklistItems.filter(i => i.status !== 'completed');

    doc.text(`Completed: ${completedItems.length} | Pending: ${pendingItems.length}`, 25, yPos);
    yPos += 10;

    // Completed items
    completedItems.slice(0, 10).forEach((item) => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
        doc.text(`✓ ${item.name}`, 25, yPos);
        yPos += 5;
    });

    if (completedItems.length > 10) {
        doc.text(`... and ${completedItems.length - 10} more completed items`, 25, yPos);
        yPos += 5;
    }
    yPos += 10;

    // Adjustments
    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Adjustments (${adjustments.length})`, 20, yPos);
    yPos += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    adjustments.slice(0, 8).forEach((adj) => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
        const sign = adj.amount >= 0 ? '+' : '';
        doc.text(`• ${adj.description} (${adj.type}): ${sign}€${adj.amount.toLocaleString()} [${adj.status}]`, 25, yPos);
        yPos += 5;
    });
    yPos += 10;

    // Missing Items
    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }
    const openMissing = missingItems.filter(m => m.status === 'open');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Missing Items (${openMissing.length} open)`, 20, yPos);
    yPos += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    openMissing.slice(0, 8).forEach((item) => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
        doc.text(`• [${item.severity.toUpperCase()}] ${item.title}`, 25, yPos);
        yPos += 5;
    });

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Generated: ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
            pageWidth / 2,
            290,
            { align: 'center' }
        );
    }

    // Save
    doc.save(`period-close-${period.code}.pdf`);
}

// =============================================================================
// METRIC CARDS
// =============================================================================

function MetricCards() {
    const { getSummary } = usePeriodCloseStore();
    const summary = getSummary();
    const { t } = useThemeStore();

    const metrics = [
        {
            label: t('periodClose.checklistProgress') || 'Checklist Progress',
            value: `${summary.checklistProgress.toFixed(0)}%`,
            subtext: `${summary.pendingItems} ${t('periodClose.itemsPending') || 'items pending'}`,
            icon: ClipboardCheck,
            color: 'blue',
        },
        {
            label: t('periodClose.criticalBlockers') || 'Critical Blockers',
            value: summary.criticalBlockers,
            subtext: t('periodClose.mustResolve') || 'Must resolve to close',
            icon: AlertTriangle,
            color: summary.criticalBlockers > 0 ? 'red' : 'emerald',
        },
        {
            label: t('periodClose.pendingAdjustments') || 'Pending Adjustments',
            value: summary.pendingAdjustments,
            subtext: `€${summary.totalAdjustmentAmount.toLocaleString()}`,
            icon: DollarSign,
            color: 'amber',
        },
        {
            label: t('periodClose.missingItems') || 'Missing Items',
            value: summary.openMissingItems,
            subtext: `${summary.criticalMissingItems} ${t('periodClose.critical') || 'critical'}`,
            icon: AlertCircle,
            color: summary.criticalMissingItems > 0 ? 'red' : 'blue',
        },
    ];

    const colorClasses: Record<string, string> = {
        blue: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
        red: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
        amber: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
        emerald: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30',
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric) => (
                <Card key={metric.label} variant="glass" padding="md">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${colorClasses[metric.color]}`}>
                            <metric.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{metric.label}</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{metric.value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{metric.subtext}</p>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

// =============================================================================
// PERIOD CARD
// =============================================================================

interface PeriodCardProps {
    period: AccountingPeriod;
    onSelect: () => void;
    isSelected: boolean;
}

function PeriodCard({ period, onSelect, isSelected }: PeriodCardProps) {
    const { startClosing, closePeriod, lockPeriod, reopenPeriod } = usePeriodCloseStore();
    const [showReopenModal, setShowReopenModal] = useState(false);
    const [reopenReason, setReopenReason] = useState('');

    const statusConfig = PERIOD_STATUSES.find((s) => s.value === period.status);
    const StatusIcon =
        period.status === 'open'
            ? Unlock
            : period.status === 'locked'
              ? LockKeyhole
              : period.status === 'closed'
                ? Lock
                : period.status === 'closing'
                  ? Clock
                  : RotateCcw;

    const handleReopen = () => {
        if (reopenReason.trim()) {
            reopenPeriod(period.id, 'current-user', reopenReason);
            setShowReopenModal(false);
            setReopenReason('');
        }
    };

    return (
        <>
            <Card
                variant="glass"
                padding="md"
                hover
                className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-[var(--accent-primary)]' : ''}`}
                onClick={onSelect}
            >
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{period.code}</p>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{period.name}</h3>
                    </div>
                    <Badge
                        variant={
                            period.status === 'open' || period.status === 'reopened'
                                ? 'success'
                                : period.status === 'closing'
                                  ? 'warning'
                                  : period.status === 'closed'
                                    ? 'info'
                                    : 'neutral'
                        }
                    >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig?.label}
                    </Badge>
                </div>

                <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Close Progress</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {period.checklistProgress.toFixed(0)}%
                        </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${period.checklistProgress === 100 ? 'bg-emerald-500' : 'bg-[var(--accent-primary)]'} rounded-full transition-all`}
                            style={{ width: `${period.checklistProgress}%` }}
                        />
                    </div>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-3">
                    <p>
                        {period.startDate} → {period.endDate}
                    </p>
                    {period.closedAt && <p>Closed: {new Date(period.closedAt).toLocaleDateString()}</p>}
                </div>

                {/* Flags */}
                <div className="flex flex-wrap gap-1 mb-3">
                    {period.hasUnreconciledItems && (
                        <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            Unreconciled
                        </span>
                    )}
                    {period.hasPendingTransactions && (
                        <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            Pending Txns
                        </span>
                    )}
                    {period.hasMissingDocuments && (
                        <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            Missing Docs
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div
                    className="flex gap-2 pt-3 border-t border-gray-200 dark:border-surface-700"
                    onClick={(e) => e.stopPropagation()}
                >
                    {period.status === 'open' && (
                        <Button variant="primary" size="sm" onClick={() => startClosing(period.id)}>
                            <Play size={14} className="mr-1" />
                            Start Close
                        </Button>
                    )}
                    {period.status === 'closing' && (
                        <Button variant="primary" size="sm" onClick={() => closePeriod(period.id, 'current-user')}>
                            <CheckCircle2 size={14} className="mr-1" />
                            Close Period
                        </Button>
                    )}
                    {period.status === 'closed' && (
                        <>
                            <Button variant="secondary" size="sm" onClick={() => lockPeriod(period.id)}>
                                <LockKeyhole size={14} className="mr-1" />
                                Lock
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setShowReopenModal(true)}>
                                <RotateCcw size={14} className="mr-1" />
                                Reopen
                            </Button>
                        </>
                    )}
                    {period.status === 'locked' && (
                        <Button variant="ghost" size="sm" onClick={() => setShowReopenModal(true)}>
                            <Unlock size={14} className="mr-1" />
                            Unlock
                        </Button>
                    )}
                </div>
            </Card>

            {/* Reopen Modal */}
            <AnimatePresence>
                {showReopenModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowReopenModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-surface-800 rounded-xl p-6 max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-semibold mb-4">Reopen Period</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Please provide a reason for reopening this period. This action will be logged for audit
                                purposes.
                            </p>
                            <textarea
                                value={reopenReason}
                                onChange={(e) => setReopenReason(e.target.value)}
                                placeholder="Reason for reopening..."
                                className="w-full p-3 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 mb-4"
                                rows={3}
                            />
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" onClick={() => setShowReopenModal(false)}>
                                    Cancel
                                </Button>
                                <Button variant="primary" onClick={handleReopen} disabled={!reopenReason.trim()}>
                                    Reopen Period
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// =============================================================================
// CHECKLIST SECTION
// =============================================================================

function ChecklistSection({ periodId }: { periodId: string }) {
    const { checklistItems, completeChecklistItem, skipChecklistItem, resetChecklistItem } = usePeriodCloseStore();
    const items = checklistItems.filter((i) => i.periodId === periodId).sort((a, b) => a.order - b.order);

    const categories = ['reconciliation', 'review', 'adjustment', 'approval', 'documentation', 'system'];

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'in_progress':
                return <Clock className="w-5 h-5 text-amber-500" />;
            case 'skipped':
                return <Ban className="w-5 h-5 text-gray-400" />;
            case 'blocked':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />;
        }
    };

    return (
        <Card variant="glass" padding="lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[var(--accent-primary)]" />
                Close Checklist
            </h3>

            <div className="space-y-4">
                {categories.map((category) => {
                    const categoryItems = items.filter((i) => i.category === category);
                    if (categoryItems.length === 0) return null;

                    return (
                        <div key={category}>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 capitalize">
                                {category}
                            </h4>
                            <div className="space-y-2">
                                {categoryItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-surface-700/50 hover:bg-gray-100 dark:hover:bg-surface-700"
                                    >
                                        <button
                                            onClick={() =>
                                                item.status === 'completed'
                                                    ? resetChecklistItem(item.id)
                                                    : completeChecklistItem(item.id, 'current-user')
                                            }
                                            className="flex-shrink-0"
                                        >
                                            {getStatusIcon(item.status)}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className={`text-sm font-medium ${item.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}
                                            >
                                                {item.name}
                                                {item.isCritical && (
                                                    <span className="ml-2 text-xs text-red-500">Critical</span>
                                                )}
                                            </p>
                                            {item.description && (
                                                <p className="text-xs text-gray-500 truncate">{item.description}</p>
                                            )}
                                        </div>
                                        {item.status === 'pending' && !item.isRequired && (
                                            <button
                                                onClick={() => skipChecklistItem(item.id, 'Skipped by user')}
                                                className="text-xs text-gray-400 hover:text-gray-600"
                                            >
                                                Skip
                                            </button>
                                        )}
                                        {item.isAutomated && (
                                            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                Auto
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

// =============================================================================
// INSPECTOR PANEL
// =============================================================================

interface InspectorPanelProps {
    period: AccountingPeriod;
    onClose: () => void;
}

function InspectorPanel({ period, onClose }: InspectorPanelProps) {
    const { checklistItems, adjustments, missingItems } = usePeriodCloseStore();
    const [activeTab, setActiveTab] = useState<'audit' | 'balances' | 'documents'>('audit');

    const periodChecklist = checklistItems.filter((i) => i.periodId === period.id);
    const periodAdjustments = adjustments.filter((a) => a.periodId === period.id);
    const periodMissing = missingItems.filter((m) => m.periodId === period.id);

    // Build audit trail from all activities
    const auditTrail = useMemo(() => {
        const events: Array<{
            id: string;
            type: string;
            action: string;
            user: string;
            timestamp: string;
            details?: string;
        }> = [];

        // Add period events
        if (period.closedAt) {
            events.push({
                id: `period-closed-${period.id}`,
                type: 'period',
                action: 'Period Closed',
                user: period.closedBy || 'System',
                timestamp: period.closedAt,
            });
        }
        if (period.reopenedAt) {
            events.push({
                id: `period-reopened-${period.id}`,
                type: 'period',
                action: 'Period Reopened',
                user: period.reopenedBy || 'System',
                timestamp: period.reopenedAt,
                details: period.reopenReason,
            });
        }

        // Add checklist completions
        periodChecklist.forEach((item) => {
            if (item.completedAt) {
                events.push({
                    id: `checklist-${item.id}`,
                    type: 'checklist',
                    action: `Completed: ${item.name}`,
                    user: item.completedBy || 'System',
                    timestamp: item.completedAt,
                });
            }
        });

        // Add adjustment activities
        periodAdjustments.forEach((adj) => {
            if (adj.approvedAt) {
                events.push({
                    id: `adj-approved-${adj.id}`,
                    type: 'adjustment',
                    action: `Approved: ${adj.description}`,
                    user: adj.approvedBy || 'System',
                    timestamp: adj.approvedAt,
                    details: `€${adj.amount.toLocaleString()}`,
                });
            }
            if (adj.postedAt) {
                events.push({
                    id: `adj-posted-${adj.id}`,
                    type: 'adjustment',
                    action: `Posted: ${adj.description}`,
                    user: 'System',
                    timestamp: adj.postedAt,
                });
            }
        });

        // Sort by timestamp descending
        return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [period, periodChecklist, periodAdjustments]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'period':
                return <Calendar className="w-4 h-4" />;
            case 'checklist':
                return <CheckCircle2 className="w-4 h-4" />;
            case 'adjustment':
                return <DollarSign className="w-4 h-4" />;
            default:
                return <Activity className="w-4 h-4" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'period':
                return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
            case 'checklist':
                return 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30';
            case 'adjustment':
                return 'text-amber-500 bg-amber-100 dark:bg-amber-900/30';
            default:
                return 'text-gray-500 bg-gray-100 dark:bg-gray-900/30';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-surface-800 shadow-xl z-50 overflow-hidden flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-surface-700">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <FileSearch className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Inspector Mode</h2>
                        <p className="text-sm text-gray-500">{period.name}</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-700 text-gray-500"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-surface-700">
                {[
                    { id: 'audit' as const, label: 'Audit Trail', icon: History },
                    { id: 'balances' as const, label: 'Balances', icon: DollarSign },
                    { id: 'documents' as const, label: 'Documents', icon: FileText },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                            activeTab === tab.id
                                ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'audit' && (
                    <div className="space-y-3">
                        {auditTrail.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No audit events recorded</p>
                            </div>
                        ) : (
                            auditTrail.map((event) => (
                                <div
                                    key={event.id}
                                    className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-surface-700/50"
                                >
                                    <div className={`p-2 rounded-lg ${getTypeColor(event.type)}`}>
                                        {getTypeIcon(event.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {event.action}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                            <User className="w-3 h-3" />
                                            <span>{event.user}</span>
                                            <span>•</span>
                                            <span>{formatDate(event.timestamp)}</span>
                                        </div>
                                        {event.details && (
                                            <p className="text-xs text-gray-500 mt-1">{event.details}</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'balances' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Total Revenue</p>
                                <p className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">
                                    €{(period.totalRevenue || 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                                <p className="text-xs text-red-600 dark:text-red-400 mb-1">Total Expenses</p>
                                <p className="text-xl font-semibold text-red-700 dark:text-red-300">
                                    €{(period.totalExpenses || 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Net Income</p>
                                <p className="text-xl font-semibold text-blue-700 dark:text-blue-300">
                                    €{(period.netIncome || 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                                <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Total Assets</p>
                                <p className="text-xl font-semibold text-purple-700 dark:text-purple-300">
                                    €{(period.totalAssets || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Period Adjustments ({periodAdjustments.length})
                            </h4>
                            <div className="space-y-2">
                                {periodAdjustments.map((adj) => (
                                    <div
                                        key={adj.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-surface-700/50"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {adj.description}
                                            </p>
                                            <p className="text-xs text-gray-500">{adj.type}</p>
                                        </div>
                                        <p className={`font-medium ${adj.amount >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {adj.amount >= 0 ? '+' : ''}€{adj.amount.toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                                {periodAdjustments.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-4">No adjustments</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="space-y-4">
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search documents..."
                                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-surface-700 border-0 text-sm focus:ring-2 focus:ring-[var(--accent-primary)]"
                                />
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Missing Documents ({periodMissing.filter((m) => m.status === 'open').length})
                            </h4>
                            <div className="space-y-2">
                                {periodMissing.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-surface-700/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${
                                                item.status === 'open'
                                                    ? 'bg-red-100 text-red-500 dark:bg-red-900/30'
                                                    : 'bg-emerald-100 text-emerald-500 dark:bg-emerald-900/30'
                                            }`}>
                                                {item.status === 'open' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {item.title}
                                                </p>
                                                <p className="text-xs text-gray-500">{item.type}</p>
                                            </div>
                                        </div>
                                        <Badge variant={item.severity === 'critical' ? 'danger' : 'warning'}>
                                            {item.severity === 'critical' ? 'Critical' : item.severity}
                                        </Badge>
                                    </div>
                                ))}
                                {periodMissing.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-4">All documents complete</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// =============================================================================
// ADJUSTMENTS SECTION
// =============================================================================

function AdjustmentsSection({ periodId }: { periodId: string }) {
    const { adjustments, approveAdjustment, rejectAdjustment, postAdjustment } = usePeriodCloseStore();
    const periodAdjustments = adjustments.filter((a) => a.periodId === periodId);

    const getStatusBadge = (status: string) => {
        const configs: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; label: string }> =
            {
                draft: { variant: 'neutral', label: 'Draft' },
                pending_approval: { variant: 'warning', label: 'Pending Approval' },
                approved: { variant: 'info', label: 'Approved' },
                posted: { variant: 'success', label: 'Posted' },
                rejected: { variant: 'danger', label: 'Rejected' },
            };
        const config = configs[status] || { variant: 'neutral' as const, label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <Card variant="glass" padding="lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[var(--accent-primary)]" />
                Period Adjustments
            </h3>

            {periodAdjustments.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No adjustments for this period.</p>
            ) : (
                <div className="space-y-3">
                    {periodAdjustments.map((adj) => (
                        <div key={adj.id} className="p-3 rounded-lg bg-gray-50 dark:bg-surface-700/50">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="font-medium text-sm text-gray-900 dark:text-white">
                                        {adj.adjustmentNumber}
                                    </p>
                                    <p className="text-xs text-gray-500">{adj.description}</p>
                                </div>
                                {getStatusBadge(adj.status)}
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">
                                    {adj.debitAccountName} → {adj.creditAccountName}
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    €{adj.amount.toLocaleString()}
                                </span>
                            </div>
                            {adj.status === 'pending_approval' && (
                                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-surface-600">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => approveAdjustment(adj.id, 'current-user')}
                                    >
                                        <Check size={14} className="mr-1" />
                                        Approve
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => rejectAdjustment(adj.id, 'current-user', 'Rejected by user')}
                                    >
                                        <XCircle size={14} className="mr-1" />
                                        Reject
                                    </Button>
                                </div>
                            )}
                            {adj.status === 'approved' && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-surface-600">
                                    <Button variant="primary" size="sm" onClick={() => postAdjustment(adj.id)}>
                                        <FileText size={14} className="mr-1" />
                                        Post to Ledger
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

// =============================================================================
// MISSING ITEMS SECTION
// =============================================================================

function MissingItemsSection({ periodId }: { periodId: string }) {
    const { missingItems, resolveMissingItem, waiveMissingItem, updateMissingItem } = usePeriodCloseStore();
    const items = missingItems.filter((i) => i.periodId === periodId && (i.status === 'open' || i.status === 'in_progress'));

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'high':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'medium':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            default:
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        }
    };

    return (
        <Card variant="glass" padding="lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[var(--accent-primary)]" />
                Missing Items ({items.length})
            </h3>

            {items.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No missing items. Ready to close!</p>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className="p-3 rounded-lg bg-gray-50 dark:bg-surface-700/50">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-xs ${getSeverityColor(item.severity)}`}>
                                            {item.severity}
                                        </span>
                                        <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                                    </div>
                                    <p className="font-medium text-sm text-gray-900 dark:text-white">{item.title}</p>
                                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                </div>
                            </div>
                            {item.dueDate && (
                                <p className="text-xs text-gray-500 mb-2">Due: {item.dueDate}</p>
                            )}
                            <div className="flex gap-2">
                                {item.status === 'open' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => updateMissingItem(item.id, { status: 'in_progress' })}
                                    >
                                        Start
                                    </Button>
                                )}
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => resolveMissingItem(item.id, 'current-user', 'Resolved')}
                                >
                                    Resolve
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => waiveMissingItem(item.id, 'Waived by user')}
                                >
                                    Waive
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function PeriodClosePage() {
    const {
        periods,
        selectedPeriodId,
        selectPeriod,
        fetchPeriods,
        isLoading,
        isInitialized,
        error,
        checklistItems,
        adjustments,
        missingItems,
    } = usePeriodCloseStore();
    const { t } = useThemeStore();
    const [showInspector, setShowInspector] = useState(false);

    useEffect(() => {
        if (!isInitialized) {
            fetchPeriods();
        }
    }, [isInitialized, fetchPeriods]);

    const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

    if (isLoading && !isInitialized) {
        return (
            <div className="space-y-6 p-6">
                <LoadingSkeleton />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">{error}</p>
                    <Button variant="primary" className="mt-4" onClick={() => fetchPeriods()}>
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CalendarCheck className="w-7 h-7 text-[var(--accent-primary)]" />
                        {t('periodClose.title') || 'Period Close'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {t('periodClose.description') || 'Manage accounting period closings and adjustments'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedPeriod && (
                        <>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    const periodChecklist = checklistItems.filter(i => i.periodId === selectedPeriod.id);
                                    const periodAdjustments = adjustments.filter(a => a.periodId === selectedPeriod.id);
                                    const periodMissing = missingItems.filter(m => m.periodId === selectedPeriod.id);
                                    generatePeriodClosePDF(selectedPeriod, periodChecklist, periodAdjustments, periodMissing);
                                }}
                                leftIcon={<Download size={16} />}
                            >
                                Export PDF
                            </Button>
                            <Button
                                variant={showInspector ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => setShowInspector(!showInspector)}
                                leftIcon={<FileSearch size={16} />}
                            >
                                Inspector
                            </Button>
                        </>
                    )}
                    {isLoading && (
                        <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Syncing...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Metrics */}
            <MetricCards />

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Period List */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t('periodClose.periods') || 'Accounting Periods'}
                    </h2>
                    {periods.length === 0 ? (
                        <Card variant="glass" padding="lg">
                            <p className="text-gray-500 dark:text-gray-400 text-center">
                                No periods found. Create your first period to get started.
                            </p>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {periods.map((period) => (
                                <PeriodCard
                                    key={period.id}
                                    period={period}
                                    onSelect={() => selectPeriod(period.id)}
                                    isSelected={period.id === selectedPeriodId}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Details Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedPeriod ? (
                        <>
                            <ChecklistSection periodId={selectedPeriod.id} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <AdjustmentsSection periodId={selectedPeriod.id} />
                                <MissingItemsSection periodId={selectedPeriod.id} />
                            </div>
                        </>
                    ) : (
                        <Card variant="glass" padding="lg">
                            <div className="text-center py-12">
                                <CalendarCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    {t('periodClose.selectPeriod') || 'Select a period to view details'}
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Inspector Panel */}
            <AnimatePresence>
                {showInspector && selectedPeriod && (
                    <InspectorPanel
                        period={selectedPeriod}
                        onClose={() => setShowInspector(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}