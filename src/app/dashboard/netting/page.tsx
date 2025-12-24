'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GitMerge,
    Plus,
    Search,
    Building2,
    DollarSign,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    ChevronRight,
    X,
    Eye,
    Users,
    Calendar,
    Percent,
    ArrowRightLeft,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    RefreshCw,
    Send,
    Ban,
    Check,
    Layers,
    BarChart3,
    Settings,  // <-- ADD THIS
} from 'lucide-react';

import { Card, Button } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useNettingStore } from '@/store/netting-store';
import type { NettingSession, NettingAgreement, NettingPosition, OffsetEntry, NettingStatus, NettingType } from '@/types/netting';
import { NETTING_TYPES, NETTING_STATUSES, PARTY_TYPES, SETTLEMENT_METHODS, NETTING_FREQUENCIES } from '@/types/netting';
import { NettingAgreementWizard } from '@/components/netting/NettingAgreementWizard';

// =============================================================================
// METRIC CARDS
// =============================================================================

function MetricCards() {
    const { getAnalytics } = useNettingStore();
    const analytics = getAnalytics();
    const { t } = useThemeStore();

    const metrics = [
        { label: t('netting.totalSessions') || 'Total Sessions', value: analytics.totalSessions, subtext: `${analytics.settledSessions} ${t('netting.settled') || 'settled'}`, icon: GitMerge, color: 'blue' },
        { label: t('netting.totalSavings') || 'Total Savings', value: `$${(analytics.totalSavings / 1000000).toFixed(2)}M`, subtext: `${analytics.avgSavingsPercentage.toFixed(1)}% ${t('netting.avgSavings') || 'avg'}`, icon: TrendingUp, color: 'emerald' },
        { label: t('netting.grossAmount') || 'Gross Amount', value: `$${(analytics.totalGrossAmount / 1000000).toFixed(2)}M`, subtext: t('netting.totalTransactions') || 'Total transactions', icon: DollarSign, color: 'purple' },
        { label: t('netting.pending') || 'Pending', value: analytics.pendingSessions, subtext: t('netting.awaitingSettlement') || 'Awaiting settlement', icon: Clock, color: analytics.pendingSessions > 0 ? 'amber' : 'gray' },
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
// SESSION CARD
// =============================================================================

function SessionCard({ session, onClick }: { session: NettingSession; onClick: () => void }) {
    const { t } = useThemeStore();

    const statusColors: Record<NettingStatus, string> = {
        draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        pending_approval: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        settled: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };

    const typeColors: Record<NettingType, string> = {
        counterparty: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        intercompany: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        multilateral: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    };

    return (
        <Card variant="glass" padding="md" hover className="cursor-pointer" onClick={onClick}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${session.type === 'intercompany' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                        <GitMerge size={24} className={session.type === 'intercompany' ? 'text-blue-500' : 'text-purple-500'} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{session.sessionNumber}</h3>
                        <p className="text-xs text-gray-500">{session.agreementName}</p>
                    </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[session.status]}`}>
                    {t(`netting.status.${session.status}`) || session.status}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                    <p className="text-xs text-gray-500">{t('netting.grossAmount') || 'Gross Amount'}</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">${session.grossAmount.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">{t('netting.netAmount') || 'Net Amount'}</p>
                    <p className="text-lg font-semibold text-emerald-600">${session.netAmount.toLocaleString()}</p>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-surface-700">
                <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-emerald-500" />
                    <span className="text-xs text-emerald-600">{session.savingsPercentage.toFixed(1)}% {t('netting.savings') || 'savings'}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${typeColors[session.type]}`}>
                    {t(`netting.type.${session.type}`) || session.type}
                </span>
            </div>

            {/* Period Info */}
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>{new Date(session.periodStart).toLocaleDateString()} - {new Date(session.periodEnd).toLocaleDateString()}</span>
                <span>{t('netting.settlementDate') || 'Settlement'}: {new Date(session.settlementDate).toLocaleDateString()}</span>
            </div>
        </Card>
    );
}

// =============================================================================
// SESSION DETAIL MODAL
// =============================================================================

function SessionDetailModal({ session, onClose }: { session: NettingSession; onClose: () => void }) {
    const { t } = useThemeStore();
    const { approveSession, rejectSession, settleSession, getSessionPositions } = useNettingStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'settlements' | 'preview'>('overview');
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const positions = session.positions;
    const settlements = session.settlements;

    const statusColors: Record<string, string> = {
        draft: 'bg-gray-100 text-gray-700',
        pending_approval: 'bg-amber-100 text-amber-700',
        approved: 'bg-blue-100 text-blue-700',
        settled: 'bg-emerald-100 text-emerald-700',
        cancelled: 'bg-gray-100 text-gray-600',
        rejected: 'bg-red-100 text-red-700',
    };

    const handleApprove = () => {
        approveSession(session.id);
        onClose();
    };

    const handleReject = () => {
        if (rejectReason.trim()) {
            rejectSession(session.id, rejectReason);
            setShowRejectModal(false);
            onClose();
        }
    };

    const handleSettle = () => {
        settleSession(session.id);
        onClose();
    };

    const tabs = [
        { id: 'overview', label: t('netting.overview') || 'Overview', icon: Eye },
        { id: 'positions', label: t('netting.positions') || 'Positions', icon: Users, count: positions.length },
        { id: 'settlements', label: t('netting.settlements') || 'Settlements', icon: Send, count: settlements.length },
        { id: 'preview', label: t('netting.preview') || 'Preview', icon: FileText },
    ];

    return (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-4xl bg-white dark:bg-surface-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-surface-700">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${session.type === 'intercompany' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                                <GitMerge size={32} className={session.type === 'intercompany' ? 'text-blue-500' : 'text-purple-500'} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{session.sessionNumber}</h2>
                                <p className="text-gray-500">{session.agreementName}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[session.status]}`}>{session.status}</span>
                                    <span className="text-xs text-gray-500">{session.baseCurrency}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg"><X size={24} /></button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mt-4 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-[var(--accent-primary)] text-white' : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-surface-800'}`}>
                                    <Icon size={16} />{tab.label}
                                    {tab.count !== undefined && tab.count > 0 && <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200 dark:bg-surface-700'}`}>{tab.count}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <p className="text-xs text-gray-500">{t('netting.totalReceivables') || 'Total Receivables'}</p>
                                    <p className="text-xl font-bold text-emerald-600">${session.totalReceivables.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <p className="text-xs text-gray-500">{t('netting.totalPayables') || 'Total Payables'}</p>
                                    <p className="text-xl font-bold text-red-600">${session.totalPayables.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <p className="text-xs text-gray-500">{t('netting.grossAmount') || 'Gross Amount'}</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">${session.grossAmount.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                    <p className="text-xs text-emerald-600">{t('netting.netAmount') || 'Net Amount'}</p>
                                    <p className="text-xl font-bold text-emerald-700">${session.netAmount.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Savings Highlight */}
                            <div className="p-6 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-emerald-700 dark:text-emerald-400">{t('netting.totalSavings') || 'Total Savings'}</p>
                                        <p className="text-3xl font-bold text-emerald-600">${session.savingsAmount.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-emerald-700 dark:text-emerald-400">{t('netting.efficiencyRate') || 'Efficiency Rate'}</p>
                                        <p className="text-3xl font-bold text-emerald-600">{session.savingsPercentage.toFixed(1)}%</p>
                                    </div>
                                </div>
                                <p className="text-sm text-emerald-600 mt-3">{t('netting.savingsExplanation') || 'Amount saved by netting instead of gross settlements'}</p>
                            </div>

                            {/* Period & Dates */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('netting.periodInfo') || 'Period Information'}</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-gray-500">{t('netting.periodStart') || 'Period Start'}</span><span>{new Date(session.periodStart).toLocaleDateString()}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">{t('netting.periodEnd') || 'Period End'}</span><span>{new Date(session.periodEnd).toLocaleDateString()}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">{t('netting.nettingDate') || 'Netting Date'}</span><span>{new Date(session.nettingDate).toLocaleDateString()}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">{t('netting.settlementDate') || 'Settlement Date'}</span><span className="font-medium">{new Date(session.settlementDate).toLocaleDateString()}</span></div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('netting.approvalInfo') || 'Approval Information'}</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-gray-500">{t('netting.createdAt') || 'Created'}</span><span>{new Date(session.createdAt).toLocaleString()}</span></div>
                                        {session.approvedByName && <div className="flex justify-between"><span className="text-gray-500">{t('netting.approvedBy') || 'Approved By'}</span><span>{session.approvedByName}</span></div>}
                                        {session.approvedAt && <div className="flex justify-between"><span className="text-gray-500">{t('netting.approvedAt') || 'Approved At'}</span><span>{new Date(session.approvedAt).toLocaleString()}</span></div>}
                                        {session.rejectedReason && <div className="flex justify-between"><span className="text-gray-500">{t('netting.rejectedReason') || 'Rejection Reason'}</span><span className="text-red-600">{session.rejectedReason}</span></div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'positions' && (
                        <div className="space-y-4">
                            {positions.map((position) => (
                                <div key={position.id} className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${position.settlementDirection === 'receive' ? 'bg-emerald-100 dark:bg-emerald-900/30' : position.settlementDirection === 'pay' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-surface-700'}`}>
                                                {position.settlementDirection === 'receive' ? <ArrowDownRight size={20} className="text-emerald-500" /> : position.settlementDirection === 'pay' ? <ArrowUpRight size={20} className="text-red-500" /> : <Minus size={20} className="text-gray-400" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{position.partyName}</p>
                                                <p className="text-xs text-gray-500 capitalize">{position.partyType}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-bold ${position.netPosition > 0 ? 'text-emerald-600' : position.netPosition < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                                {position.netPosition > 0 ? '+' : ''}{position.netPosition.toLocaleString()} {session.baseCurrency}
                                            </p>
                                            <p className="text-xs text-gray-500">{t('netting.netPosition') || 'Net Position'}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500">{t('netting.receivables') || 'Receivables'}</p>
                                            <p className="font-semibold text-emerald-600">${position.receivables.toLocaleString()}</p>
                                            <p className="text-xs text-gray-400">{position.receivableCount} {t('netting.items') || 'items'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">{t('netting.payables') || 'Payables'}</p>
                                            <p className="font-semibold text-red-600">${position.payables.toLocaleString()}</p>
                                            <p className="text-xs text-gray-400">{position.payableCount} {t('netting.items') || 'items'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">{t('netting.grossPosition') || 'Gross Position'}</p>
                                            <p className="font-semibold">${Math.abs(position.grossPosition).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">{t('netting.settlement') || 'Settlement'}</p>
                                            <p className={`font-semibold ${position.settlementDirection === 'receive' ? 'text-emerald-600' : position.settlementDirection === 'pay' ? 'text-red-600' : 'text-gray-500'}`}>
                                                {position.settlementDirection === 'none' ? '—' : `${position.settlementDirection === 'receive' ? '+' : '-'}$${position.settlementAmount.toLocaleString()}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {positions.length === 0 && <p className="text-center text-gray-500 py-8">{t('netting.noPositions') || 'No positions in this session'}</p>}
                        </div>
                    )}

                    {activeTab === 'settlements' && (
                        <div className="space-y-4">
                            {settlements.map((settlement) => (
                                <div key={settlement.id} className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{settlement.instructionNumber}</p>
                                            <p className="text-xs text-gray-500">{t('netting.valueDate') || 'Value Date'}: {new Date(settlement.valueDate).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${settlement.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : settlement.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {settlement.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 p-3 bg-white dark:bg-surface-900 rounded-lg">
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500">{t('netting.payer') || 'Payer'}</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{settlement.payerName}</p>
                                        </div>
                                        <ArrowRightLeft size={20} className="text-gray-400" />
                                        <div className="flex-1 text-right">
                                            <p className="text-xs text-gray-500">{t('netting.receiver') || 'Receiver'}</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{settlement.receiverName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-sm text-gray-500 capitalize">{settlement.settlementMethod.replace('_', ' ')}</span>
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">${settlement.amount.toLocaleString()} {settlement.currency}</span>
                                    </div>
                                </div>
                            ))}
                            {settlements.length === 0 && <p className="text-center text-gray-500 py-8">{t('netting.noSettlements') || 'No settlement instructions yet'}</p>}
                        </div>
                    )}

                    {activeTab === 'preview' && (
                        <div className="space-y-6">
                            {/* Settlement Preview */}
                            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-4">{t('netting.settlementPreview') || 'Settlement Preview'}</h3>

                                <div className="space-y-4">
                                    {/* Flow Diagram */}
                                    <div className="flex items-center justify-between p-4 bg-white dark:bg-surface-900 rounded-lg">
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500 mb-1">{t('netting.grossTransactions') || 'Gross Transactions'}</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">${session.grossAmount.toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ArrowRightLeft size={24} className="text-blue-500" />
                                            <div className="text-center">
                                                <p className="text-xs text-emerald-600">{t('netting.netting') || 'Netting'}</p>
                                                <p className="text-sm font-medium text-emerald-600">-{session.savingsPercentage.toFixed(1)}%</p>
                                            </div>
                                            <ArrowRightLeft size={24} className="text-blue-500" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500 mb-1">{t('netting.netSettlement') || 'Net Settlement'}</p>
                                            <p className="text-2xl font-bold text-emerald-600">${session.netAmount.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Summary Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                            <tr className="border-b border-gray-200 dark:border-surface-700">
                                                <th className="text-left py-2 px-3 text-gray-500">{t('netting.party') || 'Party'}</th>
                                                <th className="text-right py-2 px-3 text-gray-500">{t('netting.receivables') || 'Receivables'}</th>
                                                <th className="text-right py-2 px-3 text-gray-500">{t('netting.payables') || 'Payables'}</th>
                                                <th className="text-right py-2 px-3 text-gray-500">{t('netting.netPosition') || 'Net Position'}</th>
                                                <th className="text-right py-2 px-3 text-gray-500">{t('netting.action') || 'Action'}</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {positions.map((pos) => (
                                                <tr key={pos.id} className="border-b border-gray-100 dark:border-surface-800">
                                                    <td className="py-2 px-3 font-medium">{pos.partyName}</td>
                                                    <td className="py-2 px-3 text-right text-emerald-600">${pos.receivables.toLocaleString()}</td>
                                                    <td className="py-2 px-3 text-right text-red-600">${pos.payables.toLocaleString()}</td>
                                                    <td className={`py-2 px-3 text-right font-medium ${pos.netPosition >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {pos.netPosition >= 0 ? '+' : ''}{pos.netPosition.toLocaleString()}
                                                    </td>
                                                    <td className="py-2 px-3 text-right">
                                                            <span className={`px-2 py-0.5 rounded text-xs ${pos.settlementDirection === 'receive' ? 'bg-emerald-100 text-emerald-700' : pos.settlementDirection === 'pay' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                {pos.settlementDirection === 'none' ? 'No action' : pos.settlementDirection === 'receive' ? `Receive $${pos.settlementAmount.toLocaleString()}` : `Pay $${pos.settlementAmount.toLocaleString()}`}
                                                            </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-surface-700">
                    <Button variant="secondary" onClick={onClose}>{t('common.close') || 'Close'}</Button>
                    <div className="flex gap-2">
                        {session.status === 'pending_approval' && (
                            <>
                                <Button variant="secondary" onClick={() => setShowRejectModal(true)} leftIcon={<XCircle size={16} />}>
                                    {t('netting.reject') || 'Reject'}
                                </Button>
                                <Button variant="primary" onClick={handleApprove} leftIcon={<CheckCircle2 size={16} />}>
                                    {t('netting.approve') || 'Approve'}
                                </Button>
                            </>
                        )}
                        {session.status === 'approved' && (
                            <Button variant="primary" onClick={handleSettle} leftIcon={<Send size={16} />}>
                                {t('netting.settle') || 'Settle'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Reject Modal */}
                <AnimatePresence>
                    {showRejectModal && (
                        <div className="fixed inset-0 z-[60] bg-gray-900/50 flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                        className="w-full max-w-md bg-white dark:bg-surface-900 rounded-2xl shadow-2xl">
                                <div className="p-6 border-b border-gray-200 dark:border-surface-700">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('netting.rejectSession') || 'Reject Session'}</h3>
                                </div>
                                <div className="p-6">
                                    <label className="block text-sm font-medium mb-1">{t('netting.rejectReason') || 'Rejection Reason'} *</label>
                                    <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
                                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                </div>
                                <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-surface-700">
                                    <Button variant="secondary" onClick={() => setShowRejectModal(false)}>{t('common.cancel') || 'Cancel'}</Button>
                                    <Button variant="primary" onClick={handleReject} disabled={!rejectReason.trim()} className="bg-red-500 hover:bg-red-600">
                                        {t('netting.confirmReject') || 'Confirm Rejection'}
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

// =============================================================================
// OFFSETS TAB
// =============================================================================

function OffsetsTab() {
    const { t } = useThemeStore();
    const { offsets, approveOffset, applyOffset } = useNettingStore();

    const statusColors: Record<string, string> = {
        draft: 'bg-gray-100 text-gray-600',
        pending: 'bg-amber-100 text-amber-700',
        approved: 'bg-blue-100 text-blue-700',
        applied: 'bg-emerald-100 text-emerald-700',
        reversed: 'bg-red-100 text-red-700',
    };

    return (
        <div className="space-y-4">
            {offsets.map((offset) => (
                <Card key={offset.id} variant="glass" padding="md">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <ArrowRightLeft size={20} className="text-purple-500" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{offset.offsetNumber}</p>
                                <p className="text-xs text-gray-500">{offset.partyName} • {t(`netting.offsetType.${offset.type}`) || offset.type}</p>
                            </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[offset.status]}`}>{offset.status}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 dark:bg-surface-800 rounded-lg">
                        <div>
                            <p className="text-xs text-gray-500">{t('netting.source') || 'Source'}</p>
                            <p className="font-medium text-gray-900 dark:text-white">{offset.sourceDocumentNumber}</p>
                            <p className="text-sm text-emerald-600">${offset.sourceAmount.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center justify-center">
                            <ArrowRightLeft size={24} className="text-gray-400" />
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500">{t('netting.target') || 'Target'}</p>
                            <p className="font-medium text-gray-900 dark:text-white">{offset.targetDocumentNumber}</p>
                            <p className="text-sm text-red-600">${offset.targetAmount.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                        <p className="text-sm text-gray-500">{t('netting.offsetAmount') || 'Offset Amount'}: <span className="font-bold text-gray-900 dark:text-white">${offset.offsetAmount.toLocaleString()}</span></p>
                        <div className="flex gap-2">
                            {offset.status === 'pending' && (
                                <Button variant="secondary" size="sm" onClick={() => approveOffset(offset.id)}>
                                    {t('netting.approve') || 'Approve'}
                                </Button>
                            )}
                            {offset.status === 'approved' && (
                                <Button variant="primary" size="sm" onClick={() => applyOffset(offset.id)}>
                                    {t('netting.apply') || 'Apply'}
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            ))}
            {offsets.length === 0 && (
                <div className="text-center py-12">
                    <ArrowRightLeft className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">{t('netting.noOffsets') || 'No offset entries'}</p>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function NettingPage() {
    const { t } = useThemeStore();
    const { sessions, agreements, selectSession, selectedSessionId, createAgreement, fetchSessions, fetchAgreements, fetchOffsets } = useNettingStore();
    const [activeTab, setActiveTab] = useState<'sessions' | 'agreements' | 'offsets'>('sessions');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<NettingStatus | 'all'>('all');
    const [filterType, setFilterType] = useState<NettingType | 'all'>('all');
    const [showWizard, setShowWizard] = useState(false);

    // Fetch data on mount
    useEffect(() => {
        fetchSessions();
        fetchAgreements();
        fetchOffsets();
    }, [fetchSessions, fetchAgreements, fetchOffsets]);

    const selectedSession = sessions.find((s) => s.id === selectedSessionId);

    const filteredSessions = useMemo(() => {
        return sessions.filter((s) => {
            const matchesSearch = s.sessionNumber.toLowerCase().includes(searchQuery.toLowerCase()) || s.agreementName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
            const matchesType = filterType === 'all' || s.type === filterType;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [sessions, searchQuery, filterStatus, filterType]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/10 border border-indigo-500/20">
                            <GitMerge className="w-6 h-6 text-indigo-400" />
                        </div>
                        {t('netting.title') || 'Netting & Offsets'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('netting.subtitle') || 'Manage counterparty and intercompany netting'}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" leftIcon={<Settings size={18} />} onClick={() => setShowWizard(true)}>
                        {t('netting.configureAgreement') || 'Configure Agreement'}
                    </Button>
                    <Button variant="primary" leftIcon={<Plus size={18} />}>
                        {t('netting.newSession') || 'New Netting Session'}
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <MetricCards />

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-surface-700">
                {[
                    { id: 'sessions', label: t('netting.sessions') || 'Sessions', icon: Layers },
                    { id: 'agreements', label: t('netting.agreements') || 'Agreements', icon: FileText },
                    { id: 'offsets', label: t('netting.offsets') || 'Offsets', icon: ArrowRightLeft },
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === tab.id ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                            <Icon size={18} />{tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'sessions' && (
                <>
                    {/* Filters */}
                    <Card variant="glass" padding="md">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                       placeholder={t('netting.searchPlaceholder') || 'Search sessions...'}
                                       className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                            </div>
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800">
                                <option value="all">{t('netting.allStatuses') || 'All Statuses'}</option>
                                {NETTING_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                            <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800">
                                <option value="all">{t('netting.allTypes') || 'All Types'}</option>
                                {NETTING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                    </Card>

                    {/* Sessions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSessions.map((session) => (
                            <SessionCard key={session.id} session={session} onClick={() => selectSession(session.id)} />
                        ))}
                    </div>

                    {filteredSessions.length === 0 && (
                        <div className="text-center py-12">
                            <GitMerge className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">{t('netting.noSessions') || 'No netting sessions found'}</p>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'agreements' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {agreements.map((agreement) => (
                        <Card key={agreement.id} variant="glass" padding="md">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{agreement.name}</h3>
                                    <p className="text-sm text-gray-500">{agreement.agreementNumber}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${agreement.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {agreement.status}
                                </span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-gray-500">{t('netting.type') || 'Type'}</span><span className="capitalize">{agreement.type}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">{t('netting.parties') || 'Parties'}</span><span>{agreement.parties.length}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">{t('netting.frequency') || 'Frequency'}</span><span className="capitalize">{agreement.nettingFrequency}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">{t('netting.nextNetting') || 'Next Netting'}</span><span>{agreement.nextNettingDate ? new Date(agreement.nextNettingDate).toLocaleDateString() : '—'}</span></div>
                            </div>
                        </Card>
                    ))}

                    {/* Add New Agreement Card */}
                    <button
                        onClick={() => setShowWizard(true)}
                        className="p-6 border-2 border-dashed border-gray-200 dark:border-surface-700 rounded-2xl hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-all flex flex-col items-center justify-center gap-3 min-h-[200px]"
                    >
                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-surface-800 flex items-center justify-center">
                            <Plus size={24} className="text-gray-400" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium text-gray-900 dark:text-white">{t('netting.wizard.addNew') || 'Add New Agreement'}</p>
                            <p className="text-sm text-gray-500">{t('netting.wizard.configureNetting') || 'Configure netting rules'}</p>
                        </div>
                    </button>
                </div>
            )}

            {activeTab === 'offsets' && <OffsetsTab />}

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedSession && <SessionDetailModal session={selectedSession} onClose={() => selectSession(null)} />}
            </AnimatePresence>

            {/* Configuration Wizard */}
            <AnimatePresence>
                {showWizard && (
                    <NettingAgreementWizard
                        onCloseAction={() => setShowWizard(false)}
                        onCompleteAction={createAgreement}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}