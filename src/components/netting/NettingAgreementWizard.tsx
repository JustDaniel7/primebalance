'use client';

import React, { useState, useMemo } from 'react';
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
    ChevronLeft,
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
    Settings,
    Trash2,
    UserPlus,
    Briefcase,
    Globe,
    CreditCard,
    Shield,
    Zap,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useNettingStore } from '@/store/netting-store';
import type { NettingSession, NettingAgreement, NettingPosition, OffsetEntry, NettingStatus, NettingType, NettingParty, PartyType } from '@/types/netting';
import { NETTING_TYPES, NETTING_STATUSES, PARTY_TYPES, SETTLEMENT_METHODS, NETTING_FREQUENCIES } from '@/types/netting';

// =============================================================================
// METRIC CARDS
// =============================================================================

// Color mappings for Tailwind JIT - classes must be static strings
const colorStyles: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
    gray: { bg: 'bg-gray-500/10', text: 'text-gray-500' },
};

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
                const colors = colorStyles[metric.color] || colorStyles.gray;
                return (
                    <motion.div key={metric.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                        <Card variant="glass" padding="md">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metric.value}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{metric.subtext}</p>
                                </div>
                                <div className={`p-3 rounded-xl ${colors.bg}`}>
                                    <Icon className={`w-6 h-6 ${colors.text}`} />
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

            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>{new Date(session.periodStart).toLocaleDateString()} - {new Date(session.periodEnd).toLocaleDateString()}</span>
                <span>{t('netting.settlementDate') || 'Settlement'}: {new Date(session.settlementDate).toLocaleDateString()}</span>
            </div>
        </Card>
    );
}

// =============================================================================
// NETTING AGREEMENT WIZARD
// =============================================================================

interface WizardParty {
    id: string;
    partyId: string;
    partyName: string;
    partyType: PartyType;
    isNettingCenter: boolean;
}

// Demo parties for selection
const AVAILABLE_PARTIES = [
    { id: 'cust-1', name: 'Acme Corporation', type: 'customer' as PartyType },
    { id: 'cust-2', name: 'Global Industries', type: 'customer' as PartyType },
    { id: 'sup-1', name: 'Global Materials Inc', type: 'supplier' as PartyType },
    { id: 'sup-2', name: 'TechParts Solutions', type: 'supplier' as PartyType },
    { id: 'sup-3', name: 'Swift Logistics Co', type: 'supplier' as PartyType },
    { id: 'sub-1', name: 'Company UK Ltd', type: 'subsidiary' as PartyType },
    { id: 'sub-2', name: 'Company DE GmbH', type: 'subsidiary' as PartyType },
    { id: 'sub-3', name: 'Company FR SAS', type: 'subsidiary' as PartyType },
    { id: 'sub-4', name: 'Company ES SA', type: 'subsidiary' as PartyType },
    { id: 'aff-1', name: 'Partner Holdings LLC', type: 'affiliate' as PartyType },
    { id: 'jv-1', name: 'Joint Venture Asia', type: 'joint_venture' as PartyType },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CNY', 'CAD', 'AUD'];

export function NettingAgreementWizard({ onCloseAction, onCompleteAction }: { onCloseAction: () => void; onCompleteAction: (agreement: any) => void }) {
    const { t } = useThemeStore();
    const [step, setStep] = useState(1);
    const totalSteps = 5;

    // Form state
    const [formData, setFormData] = useState({
        // Step 1: Basic Info
        name: '',
        type: 'counterparty' as NettingType,
        description: '',

        // Step 2: Parties
        parties: [] as WizardParty[],

        // Step 3: Terms
        nettingFrequency: 'monthly' as 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly',
        settlementDays: 5,
        baseCurrency: 'USD',

        // Step 4: Thresholds & Rules
        minimumNettingAmount: 0,
        maximumNettingAmount: 0,
        autoApproveBelow: 0,
        requireDualApproval: false,

        // Step 5: Dates
        effectiveDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        notes: '',
    });

    const [searchParty, setSearchParty] = useState('');

    const filteredParties = AVAILABLE_PARTIES.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchParty.toLowerCase());
        const notAlreadyAdded = !formData.parties.find(fp => fp.partyId === p.id);
        // Filter by type based on netting type
        if (formData.type === 'intercompany') {
            return matchesSearch && notAlreadyAdded && (p.type === 'subsidiary' || p.type === 'affiliate');
        }
        return matchesSearch && notAlreadyAdded;
    });

    const addParty = (party: typeof AVAILABLE_PARTIES[0]) => {
        const newParty: WizardParty = {
            id: `wp-${Date.now()}`,
            partyId: party.id,
            partyName: party.name,
            partyType: party.type,
            isNettingCenter: false,
        };
        setFormData({ ...formData, parties: [...formData.parties, newParty] });
    };

    const removeParty = (partyId: string) => {
        setFormData({ ...formData, parties: formData.parties.filter(p => p.id !== partyId) });
    };

    const toggleNettingCenter = (partyId: string) => {
        setFormData({
            ...formData,
            parties: formData.parties.map(p => ({
                ...p,
                isNettingCenter: p.id === partyId ? !p.isNettingCenter : false,
            })),
        });
    };

    const canProceed = () => {
        switch (step) {
            case 1: return formData.name.trim().length > 0;
            case 2: return formData.parties.length >= 2;
            case 3: return formData.settlementDays > 0;
            case 4: return true;
            case 5: return formData.effectiveDate.length > 0;
            default: return true;
        }
    };

    const handleSubmit = () => {
        onCompleteAction({
            name: formData.name,
            type: formData.type,
            status: 'active',
            parties: formData.parties.map(p => ({
                id: p.id,
                partyId: p.partyId,
                partyName: p.partyName,
                partyType: p.partyType,
                isNettingCenter: p.isNettingCenter,
                createdAt: new Date().toISOString(),
            })),
            nettingFrequency: formData.nettingFrequency,
            settlementDays: formData.settlementDays,
            baseCurrency: formData.baseCurrency,
            minimumNettingAmount: formData.minimumNettingAmount || undefined,
            maximumNettingAmount: formData.maximumNettingAmount || undefined,
            effectiveDate: formData.effectiveDate,
            expiryDate: formData.expiryDate || undefined,
            notes: formData.notes || undefined,
        });
        onCloseAction();
    };

    const typeIcons = {
        counterparty: <Users size={24} className="text-purple-500" />,
        intercompany: <Building2 size={24} className="text-blue-500" />,
        multilateral: <Globe size={24} className="text-emerald-500" />,
    };

    const partyTypeIcons: Record<PartyType, React.ReactNode> = {
        customer: <Users size={16} className="text-blue-500" />,
        supplier: <Briefcase size={16} className="text-orange-500" />,
        subsidiary: <Building2 size={16} className="text-purple-500" />,
        affiliate: <GitMerge size={16} className="text-emerald-500" />,
        joint_venture: <Zap size={16} className="text-amber-500" />,
    };

    return (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-3xl bg-white dark:bg-surface-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-surface-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/10 flex items-center justify-center">
                                <Settings size={24} className="text-indigo-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {t('netting.wizard.title') || 'Configure Netting Agreement'}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {t('netting.wizard.subtitle') || 'Set up counterparty or intercompany netting rules'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onCloseAction} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <div key={s} className="flex-1 flex items-center gap-2">
                                <div className={`flex-1 h-2 rounded-full transition-colors ${s <= step ? 'bg-[var(--accent-primary)]' : 'bg-gray-200 dark:bg-surface-700'}`} />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span className={step === 1 ? 'text-[var(--accent-primary)] font-medium' : ''}>{t('netting.wizard.step1') || 'Type'}</span>
                        <span className={step === 2 ? 'text-[var(--accent-primary)] font-medium' : ''}>{t('netting.wizard.step2') || 'Parties'}</span>
                        <span className={step === 3 ? 'text-[var(--accent-primary)] font-medium' : ''}>{t('netting.wizard.step3') || 'Terms'}</span>
                        <span className={step === 4 ? 'text-[var(--accent-primary)] font-medium' : ''}>{t('netting.wizard.step4') || 'Rules'}</span>
                        <span className={step === 5 ? 'text-[var(--accent-primary)] font-medium' : ''}>{t('netting.wizard.step5') || 'Review'}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Type & Basic Info */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        {t('netting.wizard.selectType') || 'Select Netting Type'}
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        {NETTING_TYPES.map((type) => (
                                            <button
                                                key={type.value}
                                                onClick={() => setFormData({ ...formData, type: type.value, parties: [] })}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${
                                                    formData.type === type.value
                                                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                                        : 'border-gray-200 dark:border-surface-700 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    {typeIcons[type.value]}
                                                    <span className="font-medium text-gray-900 dark:text-white">{type.label}</span>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {type.value === 'counterparty' && (t('netting.wizard.counterpartyDesc') || 'Net with external customers and suppliers')}
                                                    {type.value === 'intercompany' && (t('netting.wizard.intercompanyDesc') || 'Net between group subsidiaries')}
                                                    {type.value === 'multilateral' && (t('netting.wizard.multilateralDesc') || 'Multi-party netting arrangement')}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('netting.wizard.agreementName') || 'Agreement Name'} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder={t('netting.wizard.namePlaceholder') || 'e.g., Q1 2025 Supplier Netting'}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('netting.wizard.description') || 'Description'}
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        placeholder={t('netting.wizard.descriptionPlaceholder') || 'Optional description of this netting agreement...'}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)]"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Parties */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        {t('netting.wizard.addParties') || 'Add Netting Parties'}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        {t('netting.wizard.partiesHint') || 'Select at least 2 parties to participate in this netting agreement'}
                                    </p>

                                    {/* Search */}
                                    <div className="relative mb-4">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchParty}
                                            onChange={(e) => setSearchParty(e.target.value)}
                                            placeholder={t('netting.wizard.searchParties') || 'Search parties...'}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                        />
                                    </div>

                                    {/* Available Parties */}
                                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto mb-6">
                                        {filteredParties.map((party) => (
                                            <button
                                                key={party.id}
                                                onClick={() => addParty(party)}
                                                className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-surface-700 hover:bg-gray-50 dark:hover:bg-surface-800 text-left transition-colors"
                                            >
                                                {partyTypeIcons[party.type]}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{party.name}</p>
                                                    <p className="text-xs text-gray-500 capitalize">{party.type.replace('_', ' ')}</p>
                                                </div>
                                                <Plus size={16} className="text-gray-400" />
                                            </button>
                                        ))}
                                        {filteredParties.length === 0 && (
                                            <p className="col-span-2 text-center text-gray-500 py-4">{t('netting.wizard.noPartiesFound') || 'No parties found'}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Selected Parties */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                            {t('netting.wizard.selectedParties') || 'Selected Parties'} ({formData.parties.length})
                                        </h4>
                                        {formData.type === 'intercompany' && (
                                            <span className="text-xs text-gray-500">{t('netting.wizard.clickToSetCenter') || 'Click star to set as netting center'}</span>
                                        )}
                                    </div>

                                    {formData.parties.length === 0 ? (
                                        <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-surface-700 rounded-xl">
                                            <UserPlus size={32} className="mx-auto text-gray-300 mb-2" />
                                            <p className="text-gray-500">{t('netting.wizard.noPartiesSelected') || 'No parties selected yet'}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {formData.parties.map((party) => (
                                                <div
                                                    key={party.id}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                                                        party.isNettingCenter
                                                            ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700'
                                                            : 'border-gray-200 dark:border-surface-700'
                                                    }`}
                                                >
                                                    {partyTypeIcons[party.partyType]}
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900 dark:text-white">{party.partyName}</p>
                                                        <p className="text-xs text-gray-500 capitalize">{party.partyType.replace('_', ' ')}</p>
                                                    </div>
                                                    {party.isNettingCenter && (
                                                        <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30">
                                                            {t('netting.nettingCenter') || 'Netting Center'}
                                                        </span>
                                                    )}
                                                    {formData.type === 'intercompany' && (
                                                        <button
                                                            onClick={() => toggleNettingCenter(party.id)}
                                                            className={`p-1.5 rounded-lg transition-colors ${
                                                                party.isNettingCenter
                                                                    ? 'text-amber-500 hover:bg-amber-100'
                                                                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-800'
                                                            }`}
                                                        >
                                                            <Shield size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => removeParty(party.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Terms */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {t('netting.wizard.nettingTerms') || 'Netting Terms'}
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('netting.wizard.frequency') || 'Netting Frequency'} *
                                        </label>
                                        <select
                                            value={formData.nettingFrequency}
                                            onChange={(e) => setFormData({ ...formData, nettingFrequency: e.target.value as any })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                        >
                                            {NETTING_FREQUENCIES.map((freq) => (
                                                <option key={freq.value} value={freq.value}>{freq.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('netting.wizard.settlementDays') || 'Settlement Days'} *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="30"
                                            value={formData.settlementDays}
                                            onChange={(e) => setFormData({ ...formData, settlementDays: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">{t('netting.wizard.settlementDaysHint') || 'Days after netting date for settlement'}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('netting.baseCurrency') || 'Base Currency'} *
                                    </label>
                                    <select
                                        value={formData.baseCurrency}
                                        onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                    >
                                        {CURRENCIES.map((curr) => (
                                            <option key={curr} value={curr}>{curr}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Visual Preview */}
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-3">{t('netting.wizard.cyclePreview') || 'Netting Cycle Preview'}</h4>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 text-center p-3 bg-white dark:bg-surface-900 rounded-lg">
                                            <Calendar size={20} className="mx-auto text-blue-500 mb-1" />
                                            <p className="text-xs text-gray-500">{t('netting.wizard.periodEnds') || 'Period Ends'}</p>
                                            <p className="font-medium capitalize">{formData.nettingFrequency}</p>
                                        </div>
                                        <ChevronRight className="text-gray-400" />
                                        <div className="flex-1 text-center p-3 bg-white dark:bg-surface-900 rounded-lg">
                                            <GitMerge size={20} className="mx-auto text-purple-500 mb-1" />
                                            <p className="text-xs text-gray-500">{t('netting.wizard.nettingRuns') || 'Netting Runs'}</p>
                                            <p className="font-medium">{t('netting.wizard.sameDay') || 'Same Day'}</p>
                                        </div>
                                        <ChevronRight className="text-gray-400" />
                                        <div className="flex-1 text-center p-3 bg-white dark:bg-surface-900 rounded-lg">
                                            <CreditCard size={20} className="mx-auto text-emerald-500 mb-1" />
                                            <p className="text-xs text-gray-500">{t('netting.wizard.settlementDue') || 'Settlement Due'}</p>
                                            <p className="font-medium">+{formData.settlementDays} {t('netting.days') || 'days'}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 4: Rules & Thresholds */}
                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {t('netting.wizard.rulesThresholds') || 'Rules & Thresholds'}
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('netting.minimumAmount') || 'Minimum Netting Amount'}
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{formData.baseCurrency}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.minimumNettingAmount}
                                                onChange={(e) => setFormData({ ...formData, minimumNettingAmount: parseFloat(e.target.value) || 0 })}
                                                className="w-full pl-14 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{t('netting.wizard.minHint') || 'Skip netting below this amount (0 = no minimum)'}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('netting.wizard.maxAmount') || 'Maximum Netting Amount'}
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{formData.baseCurrency}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.maximumNettingAmount}
                                                onChange={(e) => setFormData({ ...formData, maximumNettingAmount: parseFloat(e.target.value) || 0 })}
                                                className="w-full pl-14 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{t('netting.wizard.maxHint') || 'Cap per session (0 = no maximum)'}</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl space-y-4">
                                    <h4 className="font-medium text-gray-900 dark:text-white">{t('netting.wizard.approvalRules') || 'Approval Rules'}</h4>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('netting.wizard.autoApprove') || 'Auto-Approve Below'}
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{formData.baseCurrency}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.autoApproveBelow}
                                                onChange={(e) => setFormData({ ...formData, autoApproveBelow: parseFloat(e.target.value) || 0 })}
                                                className="w-full pl-14 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{t('netting.wizard.autoApproveHint') || 'Sessions below this amount are auto-approved (0 = all need approval)'}</p>
                                    </div>

                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.requireDualApproval}
                                            onChange={(e) => setFormData({ ...formData, requireDualApproval: e.target.checked })}
                                            className="w-5 h-5 rounded border-gray-300 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{t('netting.wizard.dualApproval') || 'Require Dual Approval'}</p>
                                            <p className="text-xs text-gray-500">{t('netting.wizard.dualApprovalHint') || 'Two approvers required for all sessions'}</p>
                                        </div>
                                    </label>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 5: Dates & Review */}
                        {step === 5 && (
                            <motion.div
                                key="step5"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {t('netting.wizard.reviewConfirm') || 'Review & Confirm'}
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('netting.effectiveDate') || 'Effective Date'} *
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.effectiveDate}
                                            onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('netting.expiryDate') || 'Expiry Date'}
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.expiryDate}
                                            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                            min={formData.effectiveDate}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('netting.notes') || 'Notes'}
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                    />
                                </div>

                                {/* Summary */}
                                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <CheckCircle2 size={20} className="text-emerald-500" />
                                        {t('netting.wizard.summary') || 'Agreement Summary'}
                                    </h4>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">{t('netting.name') || 'Name'}:</span>
                                                <span className="font-medium">{formData.name || '—'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">{t('netting.type') || 'Type'}:</span>
                                                <span className="font-medium capitalize">{formData.type}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">{t('netting.parties') || 'Parties'}:</span>
                                                <span className="font-medium">{formData.parties.length}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">{t('netting.frequency') || 'Frequency'}:</span>
                                                <span className="font-medium capitalize">{formData.nettingFrequency}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">{t('netting.baseCurrency') || 'Currency'}:</span>
                                                <span className="font-medium">{formData.baseCurrency}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">{t('netting.settlementDays') || 'Settlement'}:</span>
                                                <span className="font-medium">+{formData.settlementDays} days</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">{t('netting.effectiveDate') || 'Effective'}:</span>
                                                <span className="font-medium">{formData.effectiveDate}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">{t('netting.expiryDate') || 'Expiry'}:</span>
                                                <span className="font-medium">{formData.expiryDate || 'No expiry'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Parties List */}
                                    <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-800">
                                        <p className="text-sm text-gray-500 mb-2">{t('netting.wizard.includedParties') || 'Included Parties'}:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.parties.map((party) => (
                                                <span key={party.id} className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 ${party.isNettingCenter ? 'bg-amber-100 text-amber-700' : 'bg-white dark:bg-surface-800 text-gray-700 dark:text-gray-300'}`}>
                                                    {partyTypeIcons[party.partyType]}
                                                    {party.partyName}
                                                    {party.isNettingCenter && <Shield size={12} />}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-surface-700">
                    <Button
                        variant="ghost"
                        onClick={() => step > 1 && setStep(step - 1)}
                        disabled={step === 1}
                        leftIcon={<ChevronLeft size={18} />}
                    >
                        {t('common.back') || 'Back'}
                    </Button>

                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onCloseAction}>
                            {t('common.cancel') || 'Cancel'}
                        </Button>

                        {step < totalSteps ? (
                            <Button
                                variant="primary"
                                onClick={() => setStep(step + 1)}
                                disabled={!canProceed()}
                                rightIcon={<ChevronRight size={18} />}
                            >
                                {t('common.next') || 'Next'}
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                onClick={handleSubmit}
                                disabled={!canProceed()}
                                leftIcon={<CheckCircle2 size={18} />}
                            >
                                {t('netting.createAgreement') || 'Create Agreement'}
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// SESSION DETAIL MODAL (unchanged - keeping for reference)
// =============================================================================

function SessionDetailModal({ session, onClose }: { session: NettingSession; onClose: () => void }) {
    const { t } = useThemeStore();
    const { approveSession, rejectSession, settleSession } = useNettingStore();
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

    const handleApprove = () => { approveSession(session.id); onClose(); };
    const handleReject = () => { if (rejectReason.trim()) { rejectSession(session.id, rejectReason); setShowRejectModal(false); onClose(); } };
    const handleSettle = () => { settleSession(session.id); onClose(); };

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
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('netting.periodInfo') || 'Period Information'}</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-gray-500">{t('netting.periodStart') || 'Period Start'}</span><span>{new Date(session.periodStart).toLocaleDateString()}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">{t('netting.periodEnd') || 'Period End'}</span><span>{new Date(session.periodEnd).toLocaleDateString()}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">{t('netting.settlementDate') || 'Settlement Date'}</span><span className="font-medium">{new Date(session.settlementDate).toLocaleDateString()}</span></div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('netting.approvalInfo') || 'Approval Information'}</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-gray-500">{t('netting.createdAt') || 'Created'}</span><span>{new Date(session.createdAt).toLocaleString()}</span></div>
                                        {session.approvedByName && <div className="flex justify-between"><span className="text-gray-500">{t('netting.approvedBy') || 'Approved By'}</span><span>{session.approvedByName}</span></div>}
                                        {session.approvedAt && <div className="flex justify-between"><span className="text-gray-500">{t('netting.approvedAt') || 'Approved At'}</span><span>{new Date(session.approvedAt).toLocaleString()}</span></div>}
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
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4 text-sm">
                                        <div><p className="text-gray-500">{t('netting.receivables') || 'Receivables'}</p><p className="font-semibold text-emerald-600">${position.receivables.toLocaleString()}</p></div>
                                        <div><p className="text-gray-500">{t('netting.payables') || 'Payables'}</p><p className="font-semibold text-red-600">${position.payables.toLocaleString()}</p></div>
                                        <div><p className="text-gray-500">{t('netting.grossPosition') || 'Gross'}</p><p className="font-semibold">${Math.abs(position.grossPosition).toLocaleString()}</p></div>
                                        <div><p className="text-gray-500">{t('netting.settlement') || 'Settlement'}</p><p className={`font-semibold ${position.settlementDirection === 'receive' ? 'text-emerald-600' : position.settlementDirection === 'pay' ? 'text-red-600' : 'text-gray-500'}`}>{position.settlementDirection === 'none' ? '—' : `${position.settlementDirection === 'receive' ? '+' : '-'}$${position.settlementAmount.toLocaleString()}`}</p></div>
                                    </div>
                                </div>
                            ))}
                            {positions.length === 0 && <p className="text-center text-gray-500 py-8">{t('netting.noPositions') || 'No positions'}</p>}
                        </div>
                    )}

                    {activeTab === 'settlements' && (
                        <div className="space-y-4">
                            {settlements.map((settlement) => (
                                <div key={settlement.id} className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <div className="flex items-center justify-between mb-3">
                                        <div><p className="font-medium">{settlement.instructionNumber}</p><p className="text-xs text-gray-500">{t('netting.valueDate') || 'Value Date'}: {new Date(settlement.valueDate).toLocaleDateString()}</p></div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${settlement.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : settlement.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{settlement.status}</span>
                                    </div>
                                    <div className="flex items-center gap-4 p-3 bg-white dark:bg-surface-900 rounded-lg">
                                        <div className="flex-1"><p className="text-xs text-gray-500">{t('netting.payer') || 'Payer'}</p><p className="font-medium">{settlement.payerName}</p></div>
                                        <ArrowRightLeft size={20} className="text-gray-400" />
                                        <div className="flex-1 text-right"><p className="text-xs text-gray-500">{t('netting.receiver') || 'Receiver'}</p><p className="font-medium">{settlement.receiverName}</p></div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-sm text-gray-500 capitalize">{settlement.settlementMethod.replace('_', ' ')}</span>
                                        <span className="text-lg font-bold">${settlement.amount.toLocaleString()} {settlement.currency}</span>
                                    </div>
                                </div>
                            ))}
                            {settlements.length === 0 && <p className="text-center text-gray-500 py-8">{t('netting.noSettlements') || 'No settlements'}</p>}
                        </div>
                    )}

                    {activeTab === 'preview' && (
                        <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-4">{t('netting.settlementPreview') || 'Settlement Preview'}</h3>
                            <div className="flex items-center justify-between p-4 bg-white dark:bg-surface-900 rounded-lg">
                                <div className="text-center"><p className="text-xs text-gray-500 mb-1">{t('netting.grossTransactions') || 'Gross'}</p><p className="text-2xl font-bold">${session.grossAmount.toLocaleString()}</p></div>
                                <div className="flex items-center gap-2"><ArrowRightLeft className="text-blue-500" /><div className="text-center"><p className="text-xs text-emerald-600">{t('netting.netting') || 'Netting'}</p><p className="text-sm font-medium text-emerald-600">-{session.savingsPercentage.toFixed(1)}%</p></div><ArrowRightLeft className="text-blue-500" /></div>
                                <div className="text-center"><p className="text-xs text-gray-500 mb-1">{t('netting.netSettlement') || 'Net'}</p><p className="text-2xl font-bold text-emerald-600">${session.netAmount.toLocaleString()}</p></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-surface-700">
                    <Button variant="secondary" onClick={onClose}>{t('common.close') || 'Close'}</Button>
                    <div className="flex gap-2">
                        {session.status === 'pending_approval' && (
                            <>
                                <Button variant="secondary" onClick={() => setShowRejectModal(true)} leftIcon={<XCircle size={16} />}>{t('netting.reject') || 'Reject'}</Button>
                                <Button variant="primary" onClick={handleApprove} leftIcon={<CheckCircle2 size={16} />}>{t('netting.approve') || 'Approve'}</Button>
                            </>
                        )}
                        {session.status === 'approved' && (
                            <Button variant="primary" onClick={handleSettle} leftIcon={<Send size={16} />}>{t('netting.settle') || 'Settle'}</Button>
                        )}
                    </div>
                </div>

                {/* Reject Modal */}
                <AnimatePresence>
                    {showRejectModal && (
                        <div className="fixed inset-0 z-[60] bg-gray-900/50 flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-white dark:bg-surface-900 rounded-2xl shadow-2xl">
                                <div className="p-6 border-b border-gray-200 dark:border-surface-700"><h3 className="text-lg font-bold">{t('netting.rejectSession') || 'Reject Session'}</h3></div>
                                <div className="p-6"><label className="block text-sm font-medium mb-1">{t('netting.rejectReason') || 'Reason'} *</label><textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" /></div>
                                <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-surface-700"><Button variant="secondary" onClick={() => setShowRejectModal(false)}>{t('common.cancel') || 'Cancel'}</Button><Button variant="primary" onClick={handleReject} disabled={!rejectReason.trim()} className="bg-red-500 hover:bg-red-600">{t('netting.confirmReject') || 'Confirm'}</Button></div>
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
                        <div><p className="text-xs text-gray-500">{t('netting.source') || 'Source'}</p><p className="font-medium">{offset.sourceDocumentNumber}</p><p className="text-sm text-emerald-600">${offset.sourceAmount.toLocaleString()}</p></div>
                        <div className="flex items-center justify-center"><ArrowRightLeft size={24} className="text-gray-400" /></div>
                        <div className="text-right"><p className="text-xs text-gray-500">{t('netting.target') || 'Target'}</p><p className="font-medium">{offset.targetDocumentNumber}</p><p className="text-sm text-red-600">${offset.targetAmount.toLocaleString()}</p></div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                        <p className="text-sm text-gray-500">{t('netting.offsetAmount') || 'Offset'}: <span className="font-bold text-gray-900 dark:text-white">${offset.offsetAmount.toLocaleString()}</span></p>
                        <div className="flex gap-2">
                            {offset.status === 'pending' && <Button variant="secondary" size="sm" onClick={() => approveOffset(offset.id)}>{t('netting.approve') || 'Approve'}</Button>}
                            {offset.status === 'approved' && <Button variant="primary" size="sm" onClick={() => applyOffset(offset.id)}>{t('netting.apply') || 'Apply'}</Button>}
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