// src/app/dashboard/suppliers/page.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Truck,
    Plus,
    Search,
    Building2,
    Loader2,
    Mail,
    Phone,
    Globe,
    MapPin,
    CreditCard,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    DollarSign,
    FileText,
    ChevronRight,
    X,
    Edit,
    Shield,
    Activity,
    BarChart3,
    UserPlus,
    Package,
    Star,
    Eye,
    Users,
    Calendar,
    Percent,
    AlertCircle,
    Ban,
    User,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useSuppliersStore } from '@/store/suppliers-store';
import type { Supplier, DependencyRisk, ReliabilityRecord, SupplierContact, DependencyLevel, SupplierStatus, SupplierCategory, ReliabilityRating } from '@/types/suppliers';
import { SUPPLIER_STATUSES, SUPPLIER_CATEGORIES, RELIABILITY_RATINGS, DEPENDENCY_LEVELS, PAYMENT_METHODS, SUPPLIER_PAYMENT_TERMS } from '@/types/suppliers';

// =============================================================================
// METRIC CARDS
// =============================================================================

function MetricCards() {
    const { getAnalytics } = useSuppliersStore();
    const analytics = getAnalytics();
    const { t } = useThemeStore();

    const metrics = [
        { label: t('suppliers.totalSuppliers') || 'Total Suppliers', value: analytics.totalSuppliers, subtext: `${analytics.preferredSuppliers} ${t('suppliers.preferred') || 'preferred'}`, icon: Truck, color: 'blue' },
        { label: t('suppliers.totalSpendYTD') || 'Total Spend YTD', value: `$${(analytics.totalSpendYTD / 1000000).toFixed(1)}M`, subtext: `${analytics.activeSuppliers} ${t('suppliers.activeSuppliers') || 'active suppliers'}`, icon: DollarSign, color: 'emerald' },
        { label: t('suppliers.outstanding') || 'Outstanding', value: `$${(analytics.totalOutstanding / 1000).toFixed(0)}K`, subtext: `${analytics.avgPaymentDays} ${t('suppliers.avgDays') || 'avg days'}`, icon: CreditCard, color: 'amber' },
        { label: t('suppliers.highRisk') || 'High Risk', value: analytics.dependencyBreakdown.high + analytics.dependencyBreakdown.critical, subtext: `${analytics.dependencyBreakdown.critical} ${t('suppliers.critical') || 'critical'}`, icon: AlertTriangle, color: analytics.dependencyBreakdown.critical > 0 ? 'red' : 'amber' },
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
// SUPPLIER CARD
// =============================================================================

function SupplierCard({ supplier, onClick }: { supplier: Supplier; onClick: () => void }) {
    const { t } = useThemeStore();

    const statusColors: Record<SupplierStatus, string> = {
        active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        pending: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        blocked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        preferred: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };

    const reliabilityColors: Record<ReliabilityRating, string> = {
        excellent: 'text-emerald-500',
        good: 'text-blue-500',
        fair: 'text-amber-500',
        poor: 'text-orange-500',
        critical: 'text-red-500',
    };

    const dependencyColors: Record<DependencyLevel, string> = {
        low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
        <Card variant="glass" padding="md" hover className="cursor-pointer" onClick={onClick}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${supplier.status === 'preferred' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                        <Truck size={24} className={supplier.status === 'preferred' ? 'text-purple-500' : 'text-orange-500'} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{supplier.name}</h3>
                        <p className="text-xs text-gray-500">{supplier.supplierNumber} • {supplier.category}</p>
                    </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[supplier.status]}`}>
                    {supplier.status}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                    <p className="text-xs text-gray-500">{t('suppliers.totalSpend') || 'Total Spend'}</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">${supplier.totalSpend.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">{t('suppliers.outstanding') || 'Outstanding'}</p>
                    <p className={`text-lg font-semibold ${supplier.outstandingBalance > 0 ? 'text-amber-600' : 'text-gray-900 dark:text-white'}`}>${supplier.outstandingBalance.toLocaleString()}</p>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-surface-700">
                <div className="flex items-center gap-2">
                    <Star size={14} className={reliabilityColors[supplier.reliabilityRating]} />
                    <span className="text-xs text-gray-500">{supplier.reliabilityScore}% {t('suppliers.reliability') || 'reliability'}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${dependencyColors[supplier.dependencyLevel]}`}>
                    {supplier.dependencyLevel} {t('suppliers.dependency') || 'dependency'}
                </span>
            </div>

            {/* On-time delivery bar */}
            <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">{t('suppliers.onTimeDelivery') || 'On-Time Delivery'}</span>
                    <span className="text-gray-700 dark:text-gray-300">{supplier.onTimeDeliveryRate}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${supplier.onTimeDeliveryRate >= 95 ? 'bg-emerald-500' : supplier.onTimeDeliveryRate >= 85 ? 'bg-amber-500' : 'bg-red-500'}`}
                         style={{ width: `${supplier.onTimeDeliveryRate}%` }} />
                </div>
            </div>
        </Card>
    );
}

// =============================================================================
// SUPPLIER DETAIL MODAL
// =============================================================================

function SupplierDetailModal({ supplier, onClose }: { supplier: Supplier; onClose: () => void }) {
    const { t } = useThemeStore();
    const { 
        getSupplierPayments, 
        getSupplierRisks, 
        getSupplierContacts, 
        getSupplierSpend,
        getSupplierReliability,
        getSupplierBalance,
        resolveRisk,
        fetchSupplier
    } = useSuppliersStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'reliability' | 'spend' | 'risks' | 'contacts'>('overview');

    // Fetch full supplier data on mount
    useEffect(() => {
        fetchSupplier(supplier.id);
    }, [supplier.id, fetchSupplier]);

    const payments = getSupplierPayments(supplier.id);
    const risks = getSupplierRisks(supplier.id);
    const contacts = getSupplierContacts(supplier.id);
    const spend = getSupplierSpend(supplier.id);
    const reliability = getSupplierReliability(supplier.id);
    const balance = getSupplierBalance(supplier.id);

    const activeRisks = risks.filter((r) => r.status !== 'resolved');

    const statusColors: Record<string, string> = {
        active: 'bg-emerald-100 text-emerald-700',
        inactive: 'bg-gray-100 text-gray-600',
        pending: 'bg-blue-100 text-blue-700',
        blocked: 'bg-red-100 text-red-700',
        preferred: 'bg-purple-100 text-purple-700',
    };

    const dependencyColors: Record<string, string> = {
        low: 'bg-emerald-100 text-emerald-700',
        medium: 'bg-amber-100 text-amber-700',
        high: 'bg-orange-100 text-orange-700',
        critical: 'bg-red-100 text-red-700',
    };

    const paymentStatusColors: Record<string, string> = {
        completed: 'bg-emerald-100 text-emerald-700',
        pending: 'bg-blue-100 text-blue-700',
        processing: 'bg-amber-100 text-amber-700',
        scheduled: 'bg-purple-100 text-purple-700',
        failed: 'bg-red-100 text-red-700',
        cancelled: 'bg-gray-100 text-gray-600',
    };

    const tabs = [
        { id: 'overview', label: t('suppliers.overview') || 'Overview', icon: Eye },
        { id: 'payments', label: t('suppliers.payments') || 'Payments', icon: CreditCard, count: payments.length },
        { id: 'reliability', label: t('suppliers.reliability') || 'Reliability', icon: Star },
        { id: 'spend', label: t('suppliers.spend') || 'Spend', icon: BarChart3 },
        { id: 'risks', label: t('suppliers.risks') || 'Risks', icon: AlertTriangle, count: activeRisks.length },
        { id: 'contacts', label: t('suppliers.contacts') || 'Contacts', icon: Users, count: contacts.length },
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
                            <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${supplier.status === 'preferred' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                                <Truck size={32} className={supplier.status === 'preferred' ? 'text-purple-500' : 'text-orange-500'} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{supplier.name}</h2>
                                <p className="text-gray-500">{supplier.supplierNumber} • {supplier.category}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[supplier.status]}`}>{supplier.status}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${dependencyColors[supplier.dependencyLevel]}`}>{supplier.dependencyLevel} dependency</span>
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
                                <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
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
                            {/* Quick Stats */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <p className="text-xs text-gray-500">{t('suppliers.totalSpend') || 'Total Spend'}</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">${supplier.totalSpend.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <p className="text-xs text-gray-500">{t('suppliers.totalOrders') || 'Total Orders'}</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{supplier.totalOrders}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <p className="text-xs text-gray-500">{t('suppliers.avgOrder') || 'Avg Order'}</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">${supplier.averageOrderValue.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <p className="text-xs text-gray-500">{t('suppliers.outstanding') || 'Outstanding'}</p>
                                    <p className={`text-xl font-bold ${supplier.outstandingBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>${supplier.outstandingBalance.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Contact & Account Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('suppliers.contactInfo') || 'Contact Information'}</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 text-sm">
                                            <Mail size={16} className="text-gray-400" />
                                            <span className="text-gray-700 dark:text-gray-300">{supplier.email}</span>
                                        </div>
                                        {supplier.phone && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <Phone size={16} className="text-gray-400" />
                                                <span className="text-gray-700 dark:text-gray-300">{supplier.phone}</span>
                                            </div>
                                        )}
                                        {supplier.website && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <Globe size={16} className="text-gray-400" />
                                                <span className="text-gray-700 dark:text-gray-300">{supplier.website}</span>
                                            </div>
                                        )}
                                        {supplier.address && (
                                            <div className="flex items-start gap-3 text-sm">
                                                <MapPin size={16} className="text-gray-400 mt-0.5" />
                                                <span className="text-gray-700 dark:text-gray-300">{supplier.address.street}, {supplier.address.city}, {supplier.address.state} {supplier.address.postalCode}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('suppliers.accountInfo') || 'Account Information'}</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-gray-500">{t('suppliers.supplierSince') || 'Supplier Since'}</span><span className="text-gray-900 dark:text-white">{new Date(supplier.supplierSince).toLocaleDateString()}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">{t('suppliers.paymentTerms') || 'Payment Terms'}</span><span className="text-gray-900 dark:text-white">{supplier.paymentTerms}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">{t('suppliers.paymentMethod') || 'Payment Method'}</span><span className="text-gray-900 dark:text-white capitalize">{supplier.preferredPaymentMethod}</span></div>
                                        {supplier.earlyPaymentDiscount && (
                                            <div className="flex justify-between"><span className="text-gray-500">{t('suppliers.earlyDiscount') || 'Early Pay Discount'}</span><span className="text-emerald-600">{supplier.earlyPaymentDiscount}%</span></div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Reliability Metrics */}
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('suppliers.reliabilityMetrics') || 'Reliability Metrics'}</h3>
                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <div className="grid grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500">{t('suppliers.onTimeDelivery') || 'On-Time Delivery'}</p>
                                            <p className={`text-2xl font-bold ${supplier.onTimeDeliveryRate >= 95 ? 'text-emerald-600' : supplier.onTimeDeliveryRate >= 85 ? 'text-amber-600' : 'text-red-600'}`}>{supplier.onTimeDeliveryRate}%</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">{t('suppliers.qualityScore') || 'Quality Score'}</p>
                                            <p className={`text-2xl font-bold ${supplier.qualityScore >= 90 ? 'text-emerald-600' : supplier.qualityScore >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{supplier.qualityScore}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">{t('suppliers.defectRate') || 'Defect Rate'}</p>
                                            <p className={`text-2xl font-bold ${supplier.defectRate <= 1 ? 'text-emerald-600' : supplier.defectRate <= 3 ? 'text-amber-600' : 'text-red-600'}`}>{supplier.defectRate}%</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">{t('suppliers.avgLeadTime') || 'Avg Lead Time'}</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{supplier.avgLeadTime}d</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                    <tr className="border-b border-gray-200 dark:border-surface-700">
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('suppliers.payment') || 'Payment'}</th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('suppliers.amount') || 'Amount'}</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('suppliers.date') || 'Date'}</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('suppliers.method') || 'Method'}</th>
                                        <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('suppliers.status') || 'Status'}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {payments.map((payment) => (
                                        <tr key={payment.id} className="border-b border-gray-100 dark:border-surface-800">
                                            <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{payment.paymentNumber}</td>
                                            <td className="py-3 px-4 text-sm text-right font-medium text-gray-900 dark:text-white">${payment.amount.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 capitalize">{payment.paymentMethod}</td>
                                            <td className="py-3 px-4 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[payment.status]}`}>{payment.status}</span></td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                                {payments.length === 0 && <p className="text-center text-gray-500 py-8">{t('suppliers.noPayments') || 'No payment history'}</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'reliability' && (
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                    <tr className="border-b border-gray-200 dark:border-surface-700">
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('suppliers.order') || 'Order'}</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('suppliers.expected') || 'Expected'}</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('suppliers.actual') || 'Actual'}</th>
                                        <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('suppliers.variance') || 'Variance'}</th>
                                        <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('suppliers.quality') || 'Quality'}</th>
                                        <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('suppliers.issues') || 'Issues'}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {reliability.map((record) => (
                                        <tr key={record.id} className="border-b border-gray-100 dark:border-surface-800">
                                            <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{record.orderNumber}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{new Date(record.expectedDeliveryDate).toLocaleDateString()}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{record.actualDeliveryDate ? new Date(record.actualDeliveryDate).toLocaleDateString() : '—'}</td>
                                            <td className="py-3 px-4 text-sm text-center">
                                                {record.daysVariance === 0 ? <span className="text-emerald-600">On time</span> :
                                                 record.daysVariance < 0 ? <span className="text-emerald-600">{record.daysVariance}d early</span> :
                                                 <span className="text-red-600">+{record.daysVariance}d late</span>}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-center"><span className={record.qualityScore >= 95 ? 'text-emerald-600' : record.qualityScore >= 80 ? 'text-amber-600' : 'text-red-600'}>{record.qualityScore}%</span></td>
                                            <td className="py-3 px-4 text-center">
                                                {record.hasIssues ? (
                                                    <span className={`px-2 py-1 rounded-full text-xs ${record.issueResolved ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'}`}>
                                                        {record.issueType?.replace('_', ' ')}
                                                    </span>
                                                ) : (
                                                    <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                                {reliability.length === 0 && <p className="text-center text-gray-500 py-8">{t('suppliers.noReliability') || 'No reliability records'}</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'spend' && (
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                    <tr className="border-b border-gray-200 dark:border-surface-700">
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('suppliers.period') || 'Period'}</th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('suppliers.totalSpend') || 'Total Spend'}</th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('suppliers.orders') || 'Orders'}</th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('suppliers.avgOrder') || 'Avg Order'}</th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('suppliers.change') || 'Change'}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {spend.map((record) => (
                                        <tr key={record.id} className="border-b border-gray-100 dark:border-surface-800">
                                            <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{record.period}</td>
                                            <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">${record.totalSpend.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">{record.orderCount}</td>
                                            <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">${record.averageOrderValue.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-sm text-right">
                                                {record.changePercentage !== undefined && (
                                                    <span className={record.changePercentage >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                                        {record.changePercentage >= 0 ? '+' : ''}{record.changePercentage.toFixed(1)}%
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                                {spend.length === 0 && <p className="text-center text-gray-500 py-8">{t('suppliers.noSpend') || 'No spend records'}</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'risks' && (
                        <div className="space-y-4">
                            {risks.map((risk) => (
                                <div key={risk.id} className={`p-4 rounded-xl border ${risk.status === 'resolved' ? 'bg-gray-50 dark:bg-surface-800 border-gray-200 dark:border-surface-700' : risk.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : risk.severity === 'high' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle size={20} className={risk.status === 'resolved' ? 'text-gray-400' : risk.severity === 'critical' ? 'text-red-500' : risk.severity === 'high' ? 'text-orange-500' : 'text-amber-500'} />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className={`font-medium ${risk.status === 'resolved' ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>{risk.title}</p>
                                                    <span className={`px-2 py-0.5 rounded text-xs ${dependencyColors[risk.severity]}`}>{risk.severity}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{risk.description}</p>
                                                {risk.mitigationPlan && risk.status !== 'resolved' && (
                                                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">💡 {risk.mitigationPlan}</p>
                                                )}
                                            </div>
                                        </div>
                                        {risk.status !== 'resolved' && (
                                            <Button variant="secondary" size="sm" onClick={() => resolveRisk(supplier.id, risk.id)}>
                                                {t('suppliers.resolve') || 'Resolve'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {risks.length === 0 && (
                                <div className="p-8 text-center">
                                    <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
                                    <p className="text-gray-500">{t('suppliers.noRisks') || 'No dependency risks'}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'contacts' && (
                        <div className="space-y-4">
                            {contacts.map((contact) => (
                                <div key={contact.id} className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center">
                                            <User size={24} className="text-[var(--accent-primary)]" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-gray-900 dark:text-white">{contact.name}</p>
                                                {contact.isPrimary && <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">{t('suppliers.primary') || 'Primary'}</span>}
                                            </div>
                                            <p className="text-sm text-gray-500">{contact.title} • {contact.role}</p>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                                <span className="flex items-center gap-1"><Mail size={14} />{contact.email}</span>
                                                {contact.phone && <span className="flex items-center gap-1"><Phone size={14} />{contact.phone}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {contacts.length === 0 && <p className="text-center text-gray-500 py-8">{t('suppliers.noContacts') || 'No contacts'}</p>}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// NEW SUPPLIER MODAL
// =============================================================================

function NewSupplierModal({ onClose }: { onClose: () => void }) {
    const { t } = useThemeStore();
    const { createSupplier } = useSuppliersStore();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        legalName: '',
        status: 'active' as SupplierStatus,
        category: 'goods' as SupplierCategory,
        email: '',
        phone: '',
        website: '',
        address: { street: '', city: '', state: '', postalCode: '', country: '' },
        paymentTerms: 'Net 30',
        preferredPaymentMethod: 'wire' as const,
    });

    const handleSubmit = async () => {
        if (!formData.name || !formData.email) return;
        await createSupplier({
            ...formData,
            supplierSince: new Date().toISOString(),
            totalSpend: 0,
            totalOrders: 0,
            averageOrderValue: 0,
            outstandingBalance: 0,
            reliabilityRating: 'good',
            reliabilityScore: 80,
            onTimeDeliveryRate: 90,
            qualityScore: 80,
            defectRate: 0,
            avgLeadTime: 14,
            dependencyLevel: 'low',
            dependencyScore: 0,
            spendPercentage: 0,
            alternativeSuppliers: 0,
            criticalItems: 0,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-2xl bg-white dark:bg-surface-900 rounded-2xl shadow-2xl">
                <div className="p-6 border-b border-gray-200 dark:border-surface-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('suppliers.newSupplier') || 'New Supplier'}</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg"><X size={20} /></button>
                    </div>
                    <div className="flex gap-2 mt-4">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className={`flex-1 h-2 rounded-full ${s <= step ? 'bg-[var(--accent-primary)]' : 'bg-gray-200 dark:bg-surface-700'}`} />
                        ))}
                    </div>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {step === 1 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{t('suppliers.basicInfo') || 'Basic Information'}</h3>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('suppliers.companyName') || 'Company Name'} *</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                       className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('suppliers.status') || 'Status'}</label>
                                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as SupplierStatus })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800">
                                        {SUPPLIER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('suppliers.category') || 'Category'}</label>
                                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as SupplierCategory })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800">
                                        {SUPPLIER_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('suppliers.email') || 'Email'} *</label>
                                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                           className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('suppliers.phone') || 'Phone'}</label>
                                    <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                           className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{t('suppliers.address') || 'Address'}</h3>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('suppliers.street') || 'Street'}</label>
                                <input type="text" value={formData.address.street} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                                       className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('suppliers.city') || 'City'}</label>
                                    <input type="text" value={formData.address.city} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                                           className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('suppliers.state') || 'State'}</label>
                                    <input type="text" value={formData.address.state} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                                           className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('suppliers.postalCode') || 'Postal Code'}</label>
                                    <input type="text" value={formData.address.postalCode} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, postalCode: e.target.value } })}
                                           className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('suppliers.country') || 'Country'}</label>
                                    <input type="text" value={formData.address.country} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })}
                                           className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{t('suppliers.paymentSettings') || 'Payment Settings'}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('suppliers.paymentTerms') || 'Payment Terms'}</label>
                                    <select value={formData.paymentTerms} onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800">
                                        {SUPPLIER_PAYMENT_TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('suppliers.paymentMethod') || 'Payment Method'}</label>
                                    <select value={formData.preferredPaymentMethod} onChange={(e) => setFormData({ ...formData, preferredPaymentMethod: e.target.value as typeof formData.preferredPaymentMethod })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800">
                                        {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            {/* Summary */}
                            <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl mt-4">
                                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">{t('suppliers.summary') || 'Summary'}</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-500">{t('suppliers.name') || 'Name'}</span><span className="font-medium text-gray-900 dark:text-white">{formData.name || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">{t('suppliers.category') || 'Category'}</span><span className="font-medium text-gray-900 dark:text-white capitalize">{formData.category.replace('_', ' ')}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">{t('suppliers.email') || 'Email'}</span><span className="font-medium text-gray-900 dark:text-white">{formData.email || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">{t('suppliers.paymentTerms') || 'Payment Terms'}</span><span className="font-medium text-gray-900 dark:text-white">{formData.paymentTerms}</span></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-surface-700">
                    <Button variant="ghost" onClick={() => step > 1 && setStep(step - 1)} disabled={step === 1}>{t('common.back') || 'Back'}</Button>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose}>{t('common.cancel') || 'Cancel'}</Button>
                        {step < 3 ? (
                            <Button variant="primary" onClick={() => setStep(step + 1)} disabled={step === 1 && (!formData.name || !formData.email)}>
                                {t('common.next') || 'Next'} <ChevronRight size={16} className="ml-1" />
                            </Button>
                        ) : (
                            <Button variant="primary" onClick={handleSubmit}>{t('suppliers.createSupplier') || 'Create Supplier'}</Button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function SuppliersPage() {
    const { t } = useThemeStore();
    const { 
        suppliers, 
        selectSupplier, 
        selectedSupplierId,
        fetchSuppliers,
        fetchSupplier,
        isLoading,
        isInitialized 
    } = useSuppliersStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<SupplierStatus | 'all'>('all');
    const [filterCategory, setFilterCategory] = useState<SupplierCategory | 'all'>('all');
    const [showNewModal, setShowNewModal] = useState(false);

    // Fetch suppliers on mount
    useEffect(() => {
        if (!isInitialized) {
            fetchSuppliers();
        }
    }, [fetchSuppliers, isInitialized]);

    // Fetch full supplier data when selected
    useEffect(() => {
        if (selectedSupplierId) {
            fetchSupplier(selectedSupplierId);
        }
    }, [selectedSupplierId, fetchSupplier]);

    const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter((s) => {
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  s.supplierNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  s.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
            const matchesCategory = filterCategory === 'all' || s.category === filterCategory;
            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [suppliers, searchQuery, filterStatus, filterCategory]);

    // Loading state
    if (isLoading && !isInitialized) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-600/10 border border-orange-500/20">
                            <Truck className="w-6 h-6 text-orange-400" />
                        </div>
                        {t('suppliers.title') || 'Suppliers'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('suppliers.subtitle') || 'Manage supplier relationships and spend'}</p>
                </div>
                <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setShowNewModal(true)}>
                    {t('suppliers.newSupplier') || 'New Supplier'}
                </Button>
            </div>

            {/* Metrics */}
            <MetricCards />

            {/* Filters */}
            <Card variant="glass" padding="md">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                               placeholder={t('suppliers.searchPlaceholder') || 'Search suppliers...'}
                               className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                    </div>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as SupplierStatus | 'all')}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800">
                        <option value="all">{t('suppliers.allStatuses') || 'All Statuses'}</option>
                        {SUPPLIER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as SupplierCategory | 'all')}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800">
                        <option value="all">{t('suppliers.allCategories') || 'All Categories'}</option>
                        {SUPPLIER_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </div>
            </Card>

            {/* Supplier Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSuppliers.map((supplier) => (
                    <SupplierCard key={supplier.id} supplier={supplier} onClick={() => selectSupplier(supplier.id)} />
                ))}
            </div>

            {filteredSuppliers.length === 0 && (
                <div className="text-center py-12">
                    <Truck className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">{t('suppliers.noSuppliers') || 'No suppliers found'}</p>
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedSupplier && <SupplierDetailModal supplier={selectedSupplier} onClose={() => selectSupplier(null)} />}
            </AnimatePresence>

            {/* New Supplier Modal */}
            <AnimatePresence>
                {showNewModal && <NewSupplierModal onClose={() => setShowNewModal(false)} />}
            </AnimatePresence>
        </div>
    );
}