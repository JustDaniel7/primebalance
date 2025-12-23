'use client';

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { usePeriodCloseStore } from '@/store/period-close-store';
import type { AccountingPeriod, CloseChecklistItem, MissingItem, PeriodAdjustment, PeriodStatus, AdjustmentType } from '@/types/period-close';
import { PERIOD_STATUSES, ADJUSTMENT_TYPES } from '@/types/period-close';

// =============================================================================
// METRIC CARDS
// =============================================================================

function MetricCards() {
    const { getSummary } = usePeriodCloseStore();
    const summary = getSummary();

    const metrics = [
        { label: 'Checklist Progress', value: `${summary.checklistProgress.toFixed(0)}%`, subtext: `${summary.pendingItems} items pending`, icon: ClipboardCheck, color: 'blue' },
        { label: 'Critical Blockers', value: summary.criticalBlockers, subtext: 'Must resolve to close', icon: AlertTriangle, color: summary.criticalBlockers > 0 ? 'red' : 'emerald' },
        { label: 'Pending Adjustments', value: summary.pendingAdjustments, subtext: `$${summary.totalAdjustmentAmount.toLocaleString()}`, icon: DollarSign, color: 'amber' },
        { label: 'Missing Items', value: summary.openMissingItems, subtext: `${summary.criticalMissingItems} critical`, icon: AlertCircle, color: summary.criticalMissingItems > 0 ? 'red' : 'gray' },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, idx) => {
                const Icon = metric.icon;
                return (
                    <motion.div key={metric.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                        <Card variant="glass" padding="md">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metric.value}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{metric.subtext}</p>
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
// PERIOD CARD
// =============================================================================

function PeriodCard({ period, onSelect }: { period: AccountingPeriod; onSelect: () => void }) {
    const statusConfig = PERIOD_STATUSES.find((s) => s.value === period.status);
    const { startClosing, closePeriod, lockPeriod, reopenPeriod } = usePeriodCloseStore();
    const [showReopenModal, setShowReopenModal] = useState(false);
    const [reopenReason, setReopenReason] = useState('');

    const handleReopen = () => {
        if (reopenReason.trim()) {
            reopenPeriod(period.id, 'current-user', reopenReason);
            setShowReopenModal(false);
            setReopenReason('');
        }
    };

    const StatusIcon = period.status === 'open' ? Unlock : period.status === 'locked' ? LockKeyhole : period.status === 'closed' ? Lock : period.status === 'closing' ? Clock : RotateCcw;

    return (
        <>
            <Card variant="glass" padding="md" hover className="cursor-pointer" onClick={onSelect}>
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{period.code}</p>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{period.name}</h3>
                    </div>
                    <Badge variant={period.status === 'open' || period.status === 'reopened' ? 'success' : period.status === 'closing' ? 'warning' : period.status === 'closed' ? 'info' : 'neutral'}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig?.label}
                    </Badge>
                </div>

                <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Close Progress</span>
                        <span className="font-medium text-gray-900 dark:text-white">{period.checklistProgress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div className={`h-full ${period.checklistProgress === 100 ? 'bg-emerald-500' : 'bg-[var(--accent-primary)]'} rounded-full transition-all`} style={{ width: `${period.checklistProgress}%` }} />
                    </div>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-3">
                    <p>{period.startDate} → {period.endDate}</p>
                    {period.closedAt && <p>Closed: {new Date(period.closedAt).toLocaleDateString()}</p>}
                </div>

                {/* Flags */}
                <div className="flex flex-wrap gap-1 mb-3">
                    {period.hasUnreconciledItems && <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Unreconciled</span>}
                    {period.hasPendingTransactions && <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Pending Txns</span>}
                    {period.hasMissingDocuments && <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Missing Docs</span>}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-surface-700" onClick={(e) => e.stopPropagation()}>
                    {period.status === 'open' && (
                        <Button variant="primary" size="sm" onClick={() => startClosing(period.id)}><Play size={14} className="mr-1" />Start Close</Button>
                    )}
                    {period.status === 'closing' && (
                        <Button variant="primary" size="sm" onClick={() => closePeriod(period.id, 'current-user')}><CheckCircle2 size={14} className="mr-1" />Close Period</Button>
                    )}
                    {period.status === 'closed' && (
                        <>
                            <Button variant="secondary" size="sm" onClick={() => lockPeriod(period.id)}><LockKeyhole size={14} className="mr-1" />Lock</Button>
                            <Button variant="ghost" size="sm" onClick={() => setShowReopenModal(true)}><RotateCcw size={14} className="mr-1" />Reopen</Button>
                        </>
                    )}
                    {period.status === 'locked' && (
                        <Button variant="ghost" size="sm" onClick={() => setShowReopenModal(true)}><RotateCcw size={14} className="mr-1" />Reopen</Button>
                    )}
                </div>
            </Card>

            {/* Reopen Modal */}
            <AnimatePresence>
                {showReopenModal && (
                    <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowReopenModal(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-white dark:bg-surface-900 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b border-gray-200 dark:border-surface-700">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reopen Period</h2>
                                <p className="text-sm text-gray-500 mt-1">This will create an audit trail entry.</p>
                            </div>
                            <div className="p-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason for reopening *</label>
                                <textarea value={reopenReason} onChange={(e) => setReopenReason(e.target.value)} rows={3} placeholder="Enter reason..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white" />
                            </div>
                            <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-surface-700">
                                <Button variant="secondary" onClick={() => setShowReopenModal(false)}>Cancel</Button>
                                <Button variant="primary" onClick={handleReopen} disabled={!reopenReason.trim()}>Reopen Period</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

// =============================================================================
// CHECKLIST TAB
// =============================================================================

// =============================================================================
// CHECKLIST TAB WITH ITEM WIZARD
// =============================================================================

function ChecklistTab() {
    const { checklistItems, selectedPeriodId, completeChecklistItem, resetChecklistItem, skipChecklistItem, updateChecklistItem } = usePeriodCloseStore();
    const { t } = useThemeStore();
    const items = checklistItems.filter((i) => i.periodId === selectedPeriodId).sort((a, b) => a.order - b.order);

    const [selectedItem, setSelectedItem] = useState<CloseChecklistItem | null>(null);
    const [notes, setNotes] = useState('');

    const openItemWizard = (item: CloseChecklistItem) => {
        setSelectedItem(item);
        setNotes(item.notes || '');
    };

    const handleComplete = () => {
        if (!selectedItem) return;
        if (notes) updateChecklistItem(selectedItem.id, { notes });
        completeChecklistItem(selectedItem.id, 'current-user');
        setSelectedItem(null);
        setNotes('');
    };

    const handleSkip = () => {
        if (!selectedItem || selectedItem.isCritical) return;
        skipChecklistItem(selectedItem.id, notes || 'Skipped by user');
        setSelectedItem(null);
        setNotes('');
    };

    const statusColors: Record<string, string> = {
        pending: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        skipped: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
        blocked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };

    const categoryDescriptions: Record<string, string> = {
        reconciliation: t('periodClose.categoryDesc.reconciliation') || 'Verify account balances match external records',
        review: t('periodClose.categoryDesc.review') || 'Review and validate financial data',
        adjustment: t('periodClose.categoryDesc.adjustment') || 'Record necessary accounting adjustments',
        approval: t('periodClose.categoryDesc.approval') || 'Obtain required approvals and sign-offs',
        documentation: t('periodClose.categoryDesc.documentation') || 'Ensure all documentation is complete',
        system: t('periodClose.categoryDesc.system') || 'System-generated tasks and reports',
    };

    const getItemGuidance = (item: CloseChecklistItem): string[] => {
        const guidance: Record<string, string[]> = {
            'Bank Reconciliation': [
                t('periodClose.guidance.bank.1') || 'Download bank statement for the period',
                t('periodClose.guidance.bank.2') || 'Match all transactions with book entries',
                t('periodClose.guidance.bank.3') || 'Investigate and resolve any discrepancies',
                t('periodClose.guidance.bank.4') || 'Document outstanding items (deposits in transit, outstanding checks)',
                t('periodClose.guidance.bank.5') || 'Verify ending balance matches',
            ],
            'Credit Card Reconciliation': [
                t('periodClose.guidance.cc.1') || 'Obtain credit card statements',
                t('periodClose.guidance.cc.2') || 'Match charges to receipts and invoices',
                t('periodClose.guidance.cc.3') || 'Verify expense categorization',
                t('periodClose.guidance.cc.4') || 'Confirm statement balance matches GL',
            ],
            'Accounts Receivable Aging Review': [
                t('periodClose.guidance.ar.1') || 'Run AR aging report',
                t('periodClose.guidance.ar.2') || 'Review items over 90 days',
                t('periodClose.guidance.ar.3') || 'Assess need for bad debt allowance',
                t('periodClose.guidance.ar.4') || 'Follow up on significant overdue items',
            ],
            'Accounts Payable Review': [
                t('periodClose.guidance.ap.1') || 'Review open AP items',
                t('periodClose.guidance.ap.2') || 'Verify all invoices received are recorded',
                t('periodClose.guidance.ap.3') || 'Check for duplicate payments',
                t('periodClose.guidance.ap.4') || 'Confirm vendor statement reconciliations',
            ],
            'Depreciation Entry': [
                t('periodClose.guidance.depr.1') || 'Run depreciation calculation',
                t('periodClose.guidance.depr.2') || 'Review asset additions/disposals',
                t('periodClose.guidance.depr.3') || 'Post depreciation journal entry',
                t('periodClose.guidance.depr.4') || 'Verify accumulated depreciation balances',
            ],
            'Trial Balance Review': [
                t('periodClose.guidance.tb.1') || 'Generate trial balance report',
                t('periodClose.guidance.tb.2') || 'Verify debits equal credits',
                t('periodClose.guidance.tb.3') || 'Review unusual balances or variances',
                t('periodClose.guidance.tb.4') || 'Compare to prior period',
            ],
            'Management Approval': [
                t('periodClose.guidance.mgmt.1') || 'Prepare financial summary for review',
                t('periodClose.guidance.mgmt.2') || 'Present key metrics and variances',
                t('periodClose.guidance.mgmt.3') || 'Obtain management sign-off',
                t('periodClose.guidance.mgmt.4') || 'Document any concerns raised',
            ],
        };
        return guidance[item.name] || [
            t('periodClose.guidance.default.1') || 'Review the task requirements',
            t('periodClose.guidance.default.2') || 'Complete all necessary steps',
            t('periodClose.guidance.default.3') || 'Document any issues found',
            t('periodClose.guidance.default.4') || 'Mark as complete when finished',
        ];
    };

    return (
        <>
            <Card variant="glass" padding="none">
                <div className="divide-y divide-gray-200 dark:divide-surface-700">
                    {items.map((item) => (
                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-surface-800/50 cursor-pointer" onClick={() => openItemWizard(item)}>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.status === 'completed' ? 'bg-emerald-500 text-white' : item.status === 'skipped' ? 'bg-gray-300 dark:bg-gray-600 text-white' : 'bg-gray-200 dark:bg-surface-700 text-gray-500'}`}>
                                    {item.status === 'completed' ? <Check size={16} /> : item.status === 'skipped' ? <Ban size={14} /> : <span className="text-sm font-medium">{item.order}</span>}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className={`font-medium ${item.status === 'completed' || item.status === 'skipped' ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>{item.name}</p>
                                        {item.isCritical && <span className="px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{t('periodClose.critical') || 'Critical'}</span>}
                                        {item.isAutomated && <span className="px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{t('periodClose.auto') || 'Auto'}</span>}
                                    </div>
                                    <p className="text-xs text-gray-500">{item.category} {item.completedAt && `• ${t('periodClose.completedOn') || 'Completed'} ${new Date(item.completedAt).toLocaleDateString()}`}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>{t(`periodClose.status.${item.status}`) || item.status}</span>
                                <ChevronRight size={18} className="text-gray-400" />
                            </div>
                        </div>
                    ))}
                    {items.length === 0 && <div className="p-12 text-center text-gray-500">{t('periodClose.noChecklist') || 'No checklist items for this period'}</div>}
                </div>
            </Card>

            {/* Checklist Item Wizard Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl bg-white dark:bg-surface-900 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            {/* Header */}
                            <div className="p-6 border-b border-gray-200 dark:border-surface-700">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedItem.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-[var(--accent-primary)] text-white'}`}>
                                            {selectedItem.status === 'completed' ? <Check size={20} /> : <span className="font-bold">{selectedItem.order}</span>}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedItem.name}</h2>
                                            <p className="text-sm text-gray-500">{t(`periodClose.category.${selectedItem.category}`) || selectedItem.category}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg"><X size={20} /></button>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    {selectedItem.isCritical && <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{t('periodClose.criticalTask') || 'Critical - Required for close'}</span>}
                                    {selectedItem.isAutomated && <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{t('periodClose.automatedTask') || 'Automated check available'}</span>}
                                    <span className={`px-2 py-1 rounded text-xs ${statusColors[selectedItem.status]}`}>{t(`periodClose.status.${selectedItem.status}`) || selectedItem.status}</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                {/* Category Description */}
                                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">{categoryDescriptions[selectedItem.category]}</p>
                                </div>

                                {/* Step-by-Step Guidance */}
                                <div className="mb-6">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('periodClose.stepsToComplete') || 'Steps to Complete'}</h3>
                                    <div className="space-y-3">
                                        {getItemGuidance(selectedItem).map((step, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-surface-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{idx + 1}</span>
                                                </div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('periodClose.notesLabel') || 'Notes & Comments'}</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        placeholder={t('periodClose.notesPlaceholder') || 'Add any notes, issues found, or comments...'}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                                    />
                                </div>

                                {/* Completion Info */}
                                {selectedItem.status === 'completed' && selectedItem.completedAt && (
                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                            <CheckCircle2 size={18} />
                                            <span className="font-medium">{t('periodClose.completedBy') || 'Completed by'} {selectedItem.completedBy || 'User'}</span>
                                        </div>
                                        <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">
                                            {new Date(selectedItem.completedAt).toLocaleString()}
                                        </p>
                                        {selectedItem.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{t('periodClose.notes') || 'Notes'}: {selectedItem.notes}</p>}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-surface-700">
                                <div>
                                    {selectedItem.status === 'completed' && (
                                        <Button variant="ghost" onClick={() => { resetChecklistItem(selectedItem.id); setSelectedItem(null); }}>
                                            <RotateCcw size={16} className="mr-2" />{t('periodClose.resetItem') || 'Reset Item'}
                                        </Button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {selectedItem.status !== 'completed' && selectedItem.status !== 'skipped' && (
                                        <>
                                            {!selectedItem.isCritical && (
                                                <Button variant="secondary" onClick={handleSkip}>
                                                    <Ban size={16} className="mr-2" />{t('periodClose.skip') || 'Skip'}
                                                </Button>
                                            )}
                                            <Button variant="primary" onClick={handleComplete}>
                                                <CheckCircle2 size={16} className="mr-2" />{t('periodClose.markComplete') || 'Mark Complete'}
                                            </Button>
                                        </>
                                    )}
                                    {(selectedItem.status === 'completed' || selectedItem.status === 'skipped') && (
                                        <Button variant="secondary" onClick={() => setSelectedItem(null)}>{t('common.close') || 'Close'}</Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
// =============================================================================
// MISSING ITEMS TAB WITH WIZARD
// =============================================================================

function MissingItemsTab() {
    const { missingItems, selectedPeriodId, resolveMissingItem, waiveMissingItem, createMissingItem, updateMissingItem } = usePeriodCloseStore();
    const { t } = useThemeStore();
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MissingItem | null>(null);
    const [wizardStep, setWizardStep] = useState(1);
    const [resolution, setResolution] = useState('');
    const [waiveReason, setWaiveReason] = useState('');

    const [formData, setFormData] = useState({
        type: 'document' as 'document' | 'reconciliation' | 'approval' | 'transaction' | 'entry',
        severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
        title: '',
        description: '',
        reference: '',
        assignedToName: '',
        dueDate: '',
        notes: '',
    });

    const items = missingItems.filter((i) => i.periodId === selectedPeriodId);
    const openItems = items.filter(i => i.status === 'open' || i.status === 'in_progress');
    const resolvedItems = items.filter(i => i.status === 'resolved' || i.status === 'waived');

    const severityColors: Record<string, string> = {
        low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };

    const statusColors: Record<string, string> = {
        open: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        waived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    };

    const typeIcons: Record<string, React.ElementType> = {
        document: FileText,
        reconciliation: ClipboardCheck,
        approval: CheckCircle2,
        transaction: DollarSign,
        entry: FileText,
    };

    const resetForm = () => {
        setFormData({
            type: 'document', severity: 'medium', title: '', description: '',
            reference: '', assignedToName: '', dueDate: '', notes: '',
        });
        setWizardStep(1);
    };

    const handleSubmit = () => {
        if (!formData.title || !selectedPeriodId) return;
        createMissingItem({
            ...formData,
            periodId: selectedPeriodId,
            status: 'open',
            assignedTo: formData.assignedToName ? 'user-assigned' : undefined,
        });
        setShowModal(false);
        resetForm();
    };

    const handleResolve = () => {
        if (!selectedItem || !resolution.trim()) return;
        resolveMissingItem(selectedItem.id, 'current-user', resolution);
        setSelectedItem(null);
        setResolution('');
    };

    const handleWaive = () => {
        if (!selectedItem || !waiveReason.trim()) return;
        waiveMissingItem(selectedItem.id, waiveReason);
        setSelectedItem(null);
        setWaiveReason('');
    };

    const handleStartProgress = () => {
        if (!selectedItem) return;
        updateMissingItem(selectedItem.id, { status: 'in_progress' });
        setSelectedItem({ ...selectedItem, status: 'in_progress' });
    };

    const canProceed = () => {
        switch (wizardStep) {
            case 1: return formData.type && formData.severity;
            case 2: return formData.title.trim().length > 0;
            case 3: return true;
            default: return true;
        }
    };

    const getTypeGuidance = (type: string): string[] => {
        const guidance: Record<string, string[]> = {
            document: [
                t('periodClose.missingGuidance.doc.1') || 'Identify the specific document that is missing',
                t('periodClose.missingGuidance.doc.2') || 'Contact the responsible party to obtain the document',
                t('periodClose.missingGuidance.doc.3') || 'Set a deadline for document submission',
                t('periodClose.missingGuidance.doc.4') || 'Upload or reference the document once received',
            ],
            reconciliation: [
                t('periodClose.missingGuidance.recon.1') || 'Identify the accounts or items that need reconciliation',
                t('periodClose.missingGuidance.recon.2') || 'Gather all relevant statements and records',
                t('periodClose.missingGuidance.recon.3') || 'Match transactions and identify discrepancies',
                t('periodClose.missingGuidance.recon.4') || 'Document the reconciliation and any adjustments made',
            ],
            approval: [
                t('periodClose.missingGuidance.appr.1') || 'Identify who needs to provide approval',
                t('periodClose.missingGuidance.appr.2') || 'Prepare the necessary documentation for review',
                t('periodClose.missingGuidance.appr.3') || 'Submit for approval and track status',
                t('periodClose.missingGuidance.appr.4') || 'Document the approval once received',
            ],
            transaction: [
                t('periodClose.missingGuidance.txn.1') || 'Identify the missing transaction details',
                t('periodClose.missingGuidance.txn.2') || 'Research the source of the transaction',
                t('periodClose.missingGuidance.txn.3') || 'Record the transaction with proper documentation',
                t('periodClose.missingGuidance.txn.4') || 'Verify the transaction is correctly categorized',
            ],
            entry: [
                t('periodClose.missingGuidance.entry.1') || 'Identify the journal entry that needs to be made',
                t('periodClose.missingGuidance.entry.2') || 'Gather supporting documentation',
                t('periodClose.missingGuidance.entry.3') || 'Prepare the entry with correct accounts and amounts',
                t('periodClose.missingGuidance.entry.4') || 'Post the entry and verify it balances',
            ],
        };
        return guidance[type] || guidance.document;
    };

    return (
        <div className="space-y-4">
            {/* Header Stats */}
            <div className="flex items-center justify-between">
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{openItems.length} {t('periodClose.openItems') || 'Open'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{resolvedItems.length} {t('periodClose.resolvedItems') || 'Resolved'}</span>
                    </div>
                </div>
                <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => { resetForm(); setShowModal(true); }}>
                    {t('periodClose.addMissingItem') || 'Add Missing Item'}
                </Button>
            </div>

            {/* Missing Items List */}
            <Card variant="glass" padding="none">
                <div className="divide-y divide-gray-200 dark:divide-surface-700">
                    {items.map((item) => {
                        const TypeIcon = typeIcons[item.type] || FileText;
                        return (
                            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-surface-800/50 cursor-pointer" onClick={() => { setSelectedItem(item); setResolution(''); setWaiveReason(''); }}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.status === 'resolved' ? 'bg-emerald-100 dark:bg-emerald-900/30' : item.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-surface-700'}`}>
                                        <TypeIcon size={20} className={item.status === 'resolved' ? 'text-emerald-600' : item.severity === 'critical' ? 'text-red-600' : 'text-gray-500'} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className={`font-medium ${item.status === 'resolved' || item.status === 'waived' ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>{item.title}</p>
                                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${severityColors[item.severity]}`}>{t(`periodClose.severity.${item.severity}`) || item.severity}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                            <span>{t(`periodClose.itemType.${item.type}`) || item.type}</span>
                                            {item.assignedToName && <span>• {t('periodClose.assignedTo') || 'Assigned to'}: {item.assignedToName}</span>}
                                            {item.dueDate && <span>• {t('periodClose.due') || 'Due'}: {new Date(item.dueDate).toLocaleDateString()}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>{t(`periodClose.itemStatus.${item.status}`) || item.status}</span>
                                    <ChevronRight size={18} className="text-gray-400" />
                                </div>
                            </div>
                        );
                    })}
                    {items.length === 0 && (
                        <div className="p-12 text-center">
                            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-4" />
                            <p className="text-gray-500">{t('periodClose.noMissingItems') || 'No missing items - great job!'}</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* New Missing Item Wizard */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl bg-white dark:bg-surface-900 rounded-2xl shadow-2xl">
                            {/* Header */}
                            <div className="p-6 border-b border-gray-200 dark:border-surface-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('periodClose.addMissingItem') || 'Add Missing Item'}</h2>
                                        <p className="text-sm text-gray-500 mt-1">{t('periodClose.step') || 'Step'} {wizardStep} {t('periodClose.of') || 'of'} 3</p>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg"><X size={20} /></button>
                                </div>
                                {/* Progress */}
                                <div className="flex gap-2 mt-4">
                                    {[1, 2, 3].map((step) => (
                                        <div key={step} className={`flex-1 h-2 rounded-full ${step <= wizardStep ? 'bg-[var(--accent-primary)]' : 'bg-gray-200 dark:bg-surface-700'}`} />
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                {wizardStep === 1 && (
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{t('periodClose.itemTypeAndSeverity') || 'Item Type & Severity'}</h3>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">{t('periodClose.type') || 'Type'}</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { value: 'document', label: t('periodClose.itemType.document') || 'Document', desc: t('periodClose.itemTypeDesc.document') || 'Missing invoice, receipt, or supporting document' },
                                                    { value: 'reconciliation', label: t('periodClose.itemType.reconciliation') || 'Reconciliation', desc: t('periodClose.itemTypeDesc.reconciliation') || 'Account or balance needs to be reconciled' },
                                                    { value: 'approval', label: t('periodClose.itemType.approval') || 'Approval', desc: t('periodClose.itemTypeDesc.approval') || 'Missing sign-off or authorization' },
                                                    { value: 'transaction', label: t('periodClose.itemType.transaction') || 'Transaction', desc: t('periodClose.itemTypeDesc.transaction') || 'Missing or unrecorded transaction' },
                                                ].map((type) => (
                                                    <button key={type.value} onClick={() => setFormData({ ...formData, type: type.value as any })}
                                                            className={`p-3 rounded-xl border-2 text-left transition-all ${formData.type === type.value ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5' : 'border-gray-200 dark:border-surface-700'}`}>
                                                        <p className="font-medium text-gray-900 dark:text-white">{type.label}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{type.desc}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">{t('periodClose.severity') || 'Severity'}</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {[
                                                    { value: 'low', label: t('periodClose.severity.low') || 'Low', color: 'bg-gray-100 border-gray-300' },
                                                    { value: 'medium', label: t('periodClose.severity.medium') || 'Medium', color: 'bg-amber-50 border-amber-300' },
                                                    { value: 'high', label: t('periodClose.severity.high') || 'High', color: 'bg-orange-50 border-orange-300' },
                                                    { value: 'critical', label: t('periodClose.severity.critical') || 'Critical', color: 'bg-red-50 border-red-300' },
                                                ].map((sev) => (
                                                    <button key={sev.value} onClick={() => setFormData({ ...formData, severity: sev.value as any })}
                                                            className={`p-3 rounded-xl border-2 text-center transition-all ${formData.severity === sev.value ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20' : `border-gray-200 dark:border-surface-700 ${sev.color}`}`}>
                                                        <p className="font-medium text-gray-900 dark:text-white text-sm">{sev.label}</p>
                                                    </button>
                                                ))}
                                            </div>
                                            {formData.severity === 'critical' && (
                                                <p className="text-sm text-red-600 mt-2 flex items-center gap-2">
                                                    <AlertTriangle size={16} />
                                                    {t('periodClose.criticalWarning') || 'Critical items will block period close until resolved'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {wizardStep === 2 && (
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{t('periodClose.itemDetails') || 'Item Details'}</h3>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">{t('periodClose.title') || 'Title'} *</label>
                                            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                   placeholder={t('periodClose.titlePlaceholder') || 'e.g., Missing vendor invoice #12345'}
                                                   className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">{t('periodClose.description') || 'Description'}</label>
                                            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3}
                                                      placeholder={t('periodClose.descriptionPlaceholder') || 'Provide details about what is missing and why it is needed'}
                                                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">{t('periodClose.reference') || 'Reference'}</label>
                                            <input type="text" value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                                   placeholder={t('periodClose.referencePlaceholder') || 'e.g., PO-2024-0892, Account #1234'}
                                                   className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                        </div>

                                        {/* Guidance based on type */}
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">{t('periodClose.resolutionSteps') || 'Steps to Resolve'}</h4>
                                            <ul className="space-y-2">
                                                {getTypeGuidance(formData.type).map((step, idx) => (
                                                    <li key={idx} className="text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
                                                        <span className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center flex-shrink-0 text-xs font-medium">{idx + 1}</span>
                                                        {step}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {wizardStep === 3 && (
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{t('periodClose.assignmentAndDeadline') || 'Assignment & Deadline'}</h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">{t('periodClose.assignTo') || 'Assign To'}</label>
                                                <input type="text" value={formData.assignedToName} onChange={(e) => setFormData({ ...formData, assignedToName: e.target.value })}
                                                       placeholder={t('periodClose.assignToPlaceholder') || 'e.g., Jane Doe'}
                                                       className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">{t('periodClose.dueDate') || 'Due Date'}</label>
                                                <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                                       className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">{t('periodClose.additionalNotes') || 'Additional Notes'}</label>
                                            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2}
                                                      placeholder={t('periodClose.notesPlaceholder') || 'Any additional context or instructions'}
                                                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                        </div>

                                        {/* Summary */}
                                        <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">{t('periodClose.summary') || 'Summary'}</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between"><span className="text-gray-500">{t('periodClose.type') || 'Type'}</span><span className="font-medium text-gray-900 dark:text-white capitalize">{formData.type}</span></div>
                                                <div className="flex justify-between"><span className="text-gray-500">{t('periodClose.severity') || 'Severity'}</span><span className={`font-medium px-2 py-0.5 rounded ${severityColors[formData.severity]}`}>{formData.severity}</span></div>
                                                <div className="flex justify-between"><span className="text-gray-500">{t('periodClose.title') || 'Title'}</span><span className="font-medium text-gray-900 dark:text-white">{formData.title || '—'}</span></div>
                                                {formData.assignedToName && <div className="flex justify-between"><span className="text-gray-500">{t('periodClose.assignedTo') || 'Assigned to'}</span><span className="font-medium text-gray-900 dark:text-white">{formData.assignedToName}</span></div>}
                                                {formData.dueDate && <div className="flex justify-between"><span className="text-gray-500">{t('periodClose.dueDate') || 'Due date'}</span><span className="font-medium text-gray-900 dark:text-white">{new Date(formData.dueDate).toLocaleDateString()}</span></div>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-surface-700">
                                <Button variant="ghost" onClick={() => wizardStep > 1 && setWizardStep(wizardStep - 1)} disabled={wizardStep === 1}>
                                    {t('common.back') || 'Back'}
                                </Button>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => setShowModal(false)}>{t('common.cancel') || 'Cancel'}</Button>
                                    {wizardStep < 3 ? (
                                        <Button variant="primary" onClick={() => setWizardStep(wizardStep + 1)} disabled={!canProceed()}>
                                            {t('common.next') || 'Next'} <ChevronRight size={16} className="ml-1" />
                                        </Button>
                                    ) : (
                                        <Button variant="primary" onClick={handleSubmit} disabled={!formData.title}>
                                            {t('periodClose.createItem') || 'Create Item'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View/Resolve Missing Item Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl bg-white dark:bg-surface-900 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            {/* Header */}
                            <div className="p-6 border-b border-gray-200 dark:border-surface-700">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedItem.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-surface-700'}`}>
                                            {React.createElement(typeIcons[selectedItem.type] || FileText, { size: 24, className: selectedItem.severity === 'critical' ? 'text-red-600' : 'text-gray-500' })}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedItem.title}</h2>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColors[selectedItem.severity]}`}>{t(`periodClose.severity.${selectedItem.severity}`) || selectedItem.severity}</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[selectedItem.status]}`}>{t(`periodClose.itemStatus.${selectedItem.status}`) || selectedItem.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg"><X size={20} /></button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                                {/* Details */}
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500">{t('periodClose.description') || 'Description'}</p>
                                        <p className="text-gray-900 dark:text-white">{selectedItem.description || '—'}</p>
                                    </div>
                                    {selectedItem.reference && (
                                        <div>
                                            <p className="text-sm text-gray-500">{t('periodClose.reference') || 'Reference'}</p>
                                            <p className="text-gray-900 dark:text-white font-mono">{selectedItem.reference}</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedItem.assignedToName && (
                                            <div>
                                                <p className="text-sm text-gray-500">{t('periodClose.assignedTo') || 'Assigned To'}</p>
                                                <p className="text-gray-900 dark:text-white">{selectedItem.assignedToName}</p>
                                            </div>
                                        )}
                                        {selectedItem.dueDate && (
                                            <div>
                                                <p className="text-sm text-gray-500">{t('periodClose.dueDate') || 'Due Date'}</p>
                                                <p className={`font-medium ${new Date(selectedItem.dueDate) < new Date() ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                                                    {new Date(selectedItem.dueDate).toLocaleDateString()}
                                                    {new Date(selectedItem.dueDate) < new Date() && <span className="ml-2 text-xs">({t('periodClose.overdue') || 'Overdue'})</span>}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Resolution Steps */}
                                {(selectedItem.status === 'open' || selectedItem.status === 'in_progress') && (
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">{t('periodClose.resolutionSteps') || 'Steps to Resolve'}</h4>
                                        <ul className="space-y-2">
                                            {getTypeGuidance(selectedItem.type).map((step, idx) => (
                                                <li key={idx} className="text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
                                                    <span className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center flex-shrink-0 text-xs font-medium">{idx + 1}</span>
                                                    {step}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Resolution Info (for resolved/waived) */}
                                {selectedItem.status === 'resolved' && (
                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
                                            <CheckCircle2 size={18} />
                                            <span className="font-medium">{t('periodClose.resolved') || 'Resolved'}</span>
                                        </div>
                                        <p className="text-sm text-emerald-600 dark:text-emerald-500">{selectedItem.resolution}</p>
                                        {selectedItem.resolvedBy && <p className="text-xs text-gray-500 mt-2">{t('periodClose.resolvedBy') || 'Resolved by'}: {selectedItem.resolvedBy} • {selectedItem.resolvedAt && new Date(selectedItem.resolvedAt).toLocaleString()}</p>}
                                    </div>
                                )}

                                {selectedItem.status === 'waived' && (
                                    <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                                            <Ban size={18} />
                                            <span className="font-medium">{t('periodClose.waived') || 'Waived'}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedItem.waivedReason}</p>
                                    </div>
                                )}

                                {/* Resolution Form (for open/in_progress) */}
                                {(selectedItem.status === 'open' || selectedItem.status === 'in_progress') && (
                                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-surface-700">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('periodClose.resolutionDetails') || 'Resolution Details'}</label>
                                            <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3}
                                                      placeholder={t('periodClose.resolutionPlaceholder') || 'Describe how this item was resolved...'}
                                                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                                            <div>
                                                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t('periodClose.waiveInstead') || 'Cannot resolve?'}</p>
                                                <p className="text-xs text-amber-600 dark:text-amber-400">{t('periodClose.waiveExplanation') || 'Waive this item if it is not applicable or cannot be resolved'}</p>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => document.getElementById('waive-section')?.scrollIntoView({ behavior: 'smooth' })}>
                                                {t('periodClose.waive') || 'Waive'}
                                            </Button>
                                        </div>

                                        <div id="waive-section" className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('periodClose.waiveReason') || 'Waive Reason'}</label>
                                            <textarea value={waiveReason} onChange={(e) => setWaiveReason(e.target.value)} rows={2}
                                                      placeholder={t('periodClose.waiveReasonPlaceholder') || 'Explain why this item is being waived...'}
                                                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-surface-700">
                                <div>
                                    {selectedItem.status === 'open' && (
                                        <Button variant="ghost" onClick={handleStartProgress}>
                                            <Play size={16} className="mr-2" />{t('periodClose.startProgress') || 'Start Progress'}
                                        </Button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {(selectedItem.status === 'open' || selectedItem.status === 'in_progress') ? (
                                        <>
                                            <Button variant="secondary" onClick={handleWaive} disabled={!waiveReason.trim()}>
                                                <Ban size={16} className="mr-2" />{t('periodClose.waive') || 'Waive'}
                                            </Button>
                                            <Button variant="primary" onClick={handleResolve} disabled={!resolution.trim()}>
                                                <CheckCircle2 size={16} className="mr-2" />{t('periodClose.markResolved') || 'Mark Resolved'}
                                            </Button>
                                        </>
                                    ) : (
                                        <Button variant="secondary" onClick={() => setSelectedItem(null)}>{t('common.close') || 'Close'}</Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// =============================================================================
// ADJUSTMENTS TAB WITH WIZARD
// =============================================================================

function AdjustmentsTab() {
    const { adjustments, selectedPeriodId, createAdjustment, approveAdjustment, rejectAdjustment, postAdjustment, updateAdjustment } = usePeriodCloseStore();
    const { t } = useThemeStore();
    const [showModal, setShowModal] = useState(false);
    const [selectedAdj, setSelectedAdj] = useState<PeriodAdjustment | null>(null);
    const [wizardStep, setWizardStep] = useState(1);
    const [formData, setFormData] = useState({
        type: 'accrual' as AdjustmentType,
        description: '',
        reason: '',
        debitAccountName: '',
        creditAccountName: '',
        amount: 0,
        effectiveDate: new Date().toISOString().split('T')[0],
        isReversing: false,
        reversalDate: '',
        supportingDocuments: [] as string[],
        notes: '',
    });

    const items = adjustments.filter((a) => a.periodId === selectedPeriodId);

    const statusColors: Record<string, string> = {
        draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        pending_approval: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        posted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };

    const resetForm = () => {
        setFormData({
            type: 'accrual', description: '', reason: '', debitAccountName: '', creditAccountName: '',
            amount: 0, effectiveDate: new Date().toISOString().split('T')[0], isReversing: false, reversalDate: '', supportingDocuments: [], notes: '',
        });
        setWizardStep(1);
    };

    const handleSubmit = () => {
        if (!formData.description || !formData.amount || !selectedPeriodId) return;
        createAdjustment({
            ...formData,
            periodId: selectedPeriodId,
            status: 'pending_approval',
            currency: 'USD',
            requestedBy: 'current-user',
            requestedByName: 'Current User',
        });
        setShowModal(false);
        resetForm();
    };

    const canProceed = () => {
        switch (wizardStep) {
            case 1: return formData.type && formData.description;
            case 2: return formData.debitAccountName && formData.creditAccountName && formData.amount > 0;
            case 3: return true;
            default: return true;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => { resetForm(); setShowModal(true); }}>
                    {t('periodClose.newAdjustment') || 'New Adjustment'}
                </Button>
            </div>

            <Card variant="glass" padding="none">
                <div className="divide-y divide-gray-200 dark:divide-surface-700">
                    {items.map((adj) => (
                        <div key={adj.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-surface-800/50 cursor-pointer" onClick={() => setSelectedAdj(adj)}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${adj.status === 'posted' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-surface-700'}`}>
                                    <DollarSign size={20} className={adj.status === 'posted' ? 'text-emerald-600' : 'text-gray-500'} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900 dark:text-white">{adj.adjustmentNumber}</p>
                                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-400 capitalize">{adj.type}</span>
                                    </div>
                                    <p className="text-sm text-gray-500">{adj.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <p className="font-semibold text-gray-900 dark:text-white">${adj.amount.toLocaleString()}</p>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[adj.status]}`}>{t(`periodClose.adjStatus.${adj.status}`) || adj.status.replace('_', ' ')}</span>
                                <ChevronRight size={18} className="text-gray-400" />
                            </div>
                        </div>
                    ))}
                    {items.length === 0 && <div className="p-12 text-center text-gray-500">{t('periodClose.noAdjustments') || 'No adjustments'}</div>}
                </div>
            </Card>

            {/* New Adjustment Wizard */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl bg-white dark:bg-surface-900 rounded-2xl shadow-2xl">
                            {/* Header */}
                            <div className="p-6 border-b border-gray-200 dark:border-surface-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('periodClose.createAdjustment') || 'Create Adjustment'}</h2>
                                        <p className="text-sm text-gray-500 mt-1">{t('periodClose.step') || 'Step'} {wizardStep} {t('periodClose.of') || 'of'} 3</p>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg"><X size={20} /></button>
                                </div>
                                {/* Progress */}
                                <div className="flex gap-2 mt-4">
                                    {[1, 2, 3].map((step) => (
                                        <div key={step} className={`flex-1 h-2 rounded-full ${step <= wizardStep ? 'bg-[var(--accent-primary)]' : 'bg-gray-200 dark:bg-surface-700'}`} />
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                {wizardStep === 1 && (
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{t('periodClose.adjustmentType') || 'Adjustment Type & Description'}</h3>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">{t('periodClose.type') || 'Type'}</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {ADJUSTMENT_TYPES.map((type) => (
                                                    <button key={type.value} onClick={() => setFormData({ ...formData, type: type.value })}
                                                            className={`p-3 rounded-xl border-2 text-left transition-all ${formData.type === type.value ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5' : 'border-gray-200 dark:border-surface-700'}`}>
                                                        <p className="font-medium text-gray-900 dark:text-white">{t(`periodClose.adjType.${type.value}`) || type.label}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">{t('periodClose.description') || 'Description'} *</label>
                                            <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                   placeholder={t('periodClose.descPlaceholder') || 'Brief description of the adjustment'}
                                                   className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">{t('periodClose.reason') || 'Reason / Justification'}</label>
                                            <textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} rows={3}
                                                      placeholder={t('periodClose.reasonPlaceholder') || 'Explain why this adjustment is needed'}
                                                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                        </div>
                                    </div>
                                )}

                                {wizardStep === 2 && (
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{t('periodClose.accountsAmount') || 'Accounts & Amount'}</h3>

                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                            <p className="text-sm text-blue-700 dark:text-blue-300">{t('periodClose.doubleEntry') || 'Enter the accounts affected. Debit increases assets/expenses, Credit increases liabilities/equity/revenue.'}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">{t('periodClose.debitAccount') || 'Debit Account'} *</label>
                                                <input type="text" value={formData.debitAccountName} onChange={(e) => setFormData({ ...formData, debitAccountName: e.target.value })}
                                                       placeholder="e.g., 6200 - Utilities Expense"
                                                       className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">{t('periodClose.creditAccount') || 'Credit Account'} *</label>
                                                <input type="text" value={formData.creditAccountName} onChange={(e) => setFormData({ ...formData, creditAccountName: e.target.value })}
                                                       placeholder="e.g., 2100 - Accrued Expenses"
                                                       className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">{t('periodClose.amount') || 'Amount'} *</label>
                                                <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                                       className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">{t('periodClose.effectiveDate') || 'Effective Date'}</label>
                                                <input type="date" value={formData.effectiveDate} onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                                                       className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                            </div>
                                        </div>

                                        {/* Preview */}
                                        {formData.amount > 0 && (
                                            <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('periodClose.preview') || 'Journal Entry Preview'}</p>
                                                <table className="w-full text-sm">
                                                    <thead><tr className="text-gray-500"><th className="text-left py-1">{t('periodClose.account') || 'Account'}</th><th className="text-right py-1">{t('periodClose.debit') || 'Debit'}</th><th className="text-right py-1">{t('periodClose.credit') || 'Credit'}</th></tr></thead>
                                                    <tbody>
                                                    <tr><td className="py-1">{formData.debitAccountName || '—'}</td><td className="text-right">${formData.amount.toLocaleString()}</td><td></td></tr>
                                                    <tr><td className="py-1 pl-4">{formData.creditAccountName || '—'}</td><td></td><td className="text-right">${formData.amount.toLocaleString()}</td></tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {wizardStep === 3 && (
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{t('periodClose.reviewSubmit') || 'Review & Submit'}</h3>

                                        {/* Auto-reversal */}
                                        <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                            <div className="flex items-center gap-3 mb-3">
                                                <input type="checkbox" id="reversing" checked={formData.isReversing} onChange={(e) => setFormData({ ...formData, isReversing: e.target.checked })} className="w-4 h-4 rounded" />
                                                <label htmlFor="reversing" className="font-medium text-gray-900 dark:text-white">{t('periodClose.autoReverse') || 'Auto-reverse in next period'}</label>
                                            </div>
                                            {formData.isReversing && (
                                                <div>
                                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('periodClose.reversalDate') || 'Reversal Date'}</label>
                                                    <input type="date" value={formData.reversalDate} onChange={(e) => setFormData({ ...formData, reversalDate: e.target.value })}
                                                           className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Notes */}
                                        <div>
                                            <label className="block text-sm font-medium mb-1">{t('periodClose.additionalNotes') || 'Additional Notes'}</label>
                                            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2}
                                                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                        </div>

                                        {/* Summary */}
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                            <h4 className="font-medium text-emerald-800 dark:text-emerald-300 mb-3">{t('periodClose.summary') || 'Summary'}</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">{t('periodClose.type') || 'Type'}</span><span className="font-medium text-gray-900 dark:text-white capitalize">{formData.type}</span></div>
                                                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">{t('periodClose.description') || 'Description'}</span><span className="font-medium text-gray-900 dark:text-white">{formData.description}</span></div>
                                                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">{t('periodClose.amount') || 'Amount'}</span><span className="font-medium text-gray-900 dark:text-white">${formData.amount.toLocaleString()}</span></div>
                                                <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">{t('periodClose.autoReverse') || 'Auto-reverse'}</span><span className="font-medium text-gray-900 dark:text-white">{formData.isReversing ? t('common.yes') || 'Yes' : t('common.no') || 'No'}</span></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-surface-700">
                                <Button variant="ghost" onClick={() => wizardStep > 1 && setWizardStep(wizardStep - 1)} disabled={wizardStep === 1}>
                                    {t('common.back') || 'Back'}
                                </Button>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => setShowModal(false)}>{t('common.cancel') || 'Cancel'}</Button>
                                    {wizardStep < 3 ? (
                                        <Button variant="primary" onClick={() => setWizardStep(wizardStep + 1)} disabled={!canProceed()}>
                                            {t('common.next') || 'Next'} <ChevronRight size={16} className="ml-1" />
                                        </Button>
                                    ) : (
                                        <Button variant="primary" onClick={handleSubmit}>{t('periodClose.submitForApproval') || 'Submit for Approval'}</Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View Adjustment Detail Modal */}
            <AnimatePresence>
                {selectedAdj && (
                    <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedAdj(null)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-white dark:bg-surface-900 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b border-gray-200 dark:border-surface-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedAdj.adjustmentNumber}</h2>
                                        <p className="text-sm text-gray-500 capitalize">{selectedAdj.type} {t('periodClose.adjustment') || 'Adjustment'}</p>
                                    </div>
                                    <button onClick={() => setSelectedAdj(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg"><X size={20} /></button>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <span className="text-gray-600 dark:text-gray-400">{t('periodClose.status') || 'Status'}</span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedAdj.status]}`}>{t(`periodClose.adjStatus.${selectedAdj.status}`) || selectedAdj.status.replace('_', ' ')}</span>
                                </div>

                                <div className="space-y-3">
                                    <div><p className="text-sm text-gray-500">{t('periodClose.description') || 'Description'}</p><p className="font-medium text-gray-900 dark:text-white">{selectedAdj.description}</p></div>
                                    {selectedAdj.reason && <div><p className="text-sm text-gray-500">{t('periodClose.reason') || 'Reason'}</p><p className="text-gray-700 dark:text-gray-300">{selectedAdj.reason}</p></div>}
                                </div>

                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('periodClose.journalEntry') || 'Journal Entry'}</p>
                                    <table className="w-full text-sm">
                                        <thead><tr className="text-gray-500"><th className="text-left py-1">{t('periodClose.account') || 'Account'}</th><th className="text-right py-1">{t('periodClose.debit') || 'Debit'}</th><th className="text-right py-1">{t('periodClose.credit') || 'Credit'}</th></tr></thead>
                                        <tbody>
                                        <tr><td className="py-1">{selectedAdj.debitAccountName}</td><td className="text-right">${selectedAdj.amount.toLocaleString()}</td><td></td></tr>
                                        <tr><td className="py-1 pl-4">{selectedAdj.creditAccountName}</td><td></td><td className="text-right">${selectedAdj.amount.toLocaleString()}</td></tr>
                                        </tbody>
                                    </table>
                                </div>

                                {selectedAdj.isReversing && (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-sm text-amber-700 dark:text-amber-400">
                                        <RotateCcw size={16} className="inline mr-2" />{t('periodClose.willReverse') || 'Will auto-reverse on'} {selectedAdj.reversalDate}
                                    </div>
                                )}

                                {selectedAdj.requestedByName && <p className="text-sm text-gray-500">{t('periodClose.requestedBy') || 'Requested by'}: {selectedAdj.requestedByName}</p>}
                                {selectedAdj.approvedByName && <p className="text-sm text-gray-500">{t('periodClose.approvedBy') || 'Approved by'}: {selectedAdj.approvedByName} on {new Date(selectedAdj.approvedAt!).toLocaleDateString()}</p>}
                                {selectedAdj.postedAt && <p className="text-sm text-emerald-600">{t('periodClose.postedOn') || 'Posted on'}: {new Date(selectedAdj.postedAt).toLocaleString()}</p>}
                            </div>

                            <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-surface-700">
                                {selectedAdj.status === 'pending_approval' && (
                                    <>
                                        <Button variant="secondary" onClick={() => { rejectAdjustment(selectedAdj.id, 'current-user', 'Rejected'); setSelectedAdj(null); }}><XCircle size={16} className="mr-2" />{t('periodClose.reject') || 'Reject'}</Button>
                                        <Button variant="primary" onClick={() => { approveAdjustment(selectedAdj.id, 'current-user'); setSelectedAdj(null); }}><CheckCircle2 size={16} className="mr-2" />{t('periodClose.approve') || 'Approve'}</Button>
                                    </>
                                )}
                                {selectedAdj.status === 'approved' && (
                                    <Button variant="primary" onClick={() => { postAdjustment(selectedAdj.id); setSelectedAdj(null); }}><FileText size={16} className="mr-2" />{t('periodClose.post') || 'Post'}</Button>
                                )}
                                {(selectedAdj.status === 'posted' || selectedAdj.status === 'rejected') && (
                                    <Button variant="secondary" onClick={() => setSelectedAdj(null)}>{t('common.close') || 'Close'}</Button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// =============================================================================
// AUDIT TRAIL TAB
// =============================================================================

function AuditTrailTab() {
    const { auditTrail, selectedPeriodId } = usePeriodCloseStore();
    const entries = auditTrail.filter((e) => e.periodId === selectedPeriodId);

    const actionIcons: Record<string, React.ElementType> = {
        created: Plus,
        opened: Unlock,
        checklist_updated: ClipboardCheck,
        adjustment_posted: DollarSign,
        closing_started: Play,
        closed: Lock,
        reopened: RotateCcw,
        locked: LockKeyhole,
    };

    return (
        <Card variant="glass" padding="none">
            <div className="divide-y divide-gray-200 dark:divide-surface-700">
                {entries.map((entry) => {
                    const Icon = actionIcons[entry.action] || History;
                    return (
                        <div key={entry.id} className="p-4 flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-gray-100 dark:bg-surface-800"><Icon size={16} className="text-gray-500" /></div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-900 dark:text-white">{entry.description}</p>
                                <p className="text-xs text-gray-500 mt-1">{entry.userName || 'System'} • {new Date(entry.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    );
                })}
                {entries.length === 0 && <div className="p-12 text-center text-gray-500">No audit entries</div>}
            </div>
        </Card>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function PeriodClosePage() {
    const { periods, selectedPeriodId, selectPeriod } = usePeriodCloseStore();
    const [activeTab, setActiveTab] = useState<'checklist' | 'missing' | 'adjustments' | 'audit'>('checklist');

    const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

    const tabs = [
        { id: 'checklist', label: 'Close Checklist', icon: ClipboardCheck },
        { id: 'missing', label: 'Missing Items', icon: AlertCircle },
        { id: 'adjustments', label: 'Adjustments', icon: DollarSign },
        { id: 'audit', label: 'Audit Trail', icon: History },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-600/10 border border-blue-500/20">
                            <CalendarCheck className="w-6 h-6 text-blue-400" />
                        </div>
                        Period Close
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage accounting period close process</p>
                </div>
            </div>

            {/* Metrics */}
            <MetricCards />

            {/* Periods */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Accounting Periods</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {periods.map((period) => (
                        <PeriodCard key={period.id} period={period} onSelect={() => selectPeriod(period.id)} />
                    ))}
                </div>
            </div>

            {/* Selected Period Details */}
            {selectedPeriod && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedPeriod.name} Details</h2>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 border-b border-gray-200 dark:border-surface-700">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.id ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                    <Icon size={18} />{tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {activeTab === 'checklist' && <ChecklistTab />}
                    {activeTab === 'missing' && <MissingItemsTab />}
                    {activeTab === 'adjustments' && <AdjustmentsTab />}
                    {activeTab === 'audit' && <AuditTrailTab />}
                </div>
            )}
        </div>
    );
}