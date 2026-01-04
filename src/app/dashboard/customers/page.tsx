// src/app/dashboard/customers/page.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Plus,
    Search,
    Building2,
    Loader2,
    User,
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
    Trash2,
    Shield,
    Activity,
    BarChart3,
    UserPlus,
    Ban,
    Eye,
    History,
    PieChart,
    Lightbulb,
    Sparkles,
} from 'lucide-react';
import { createDebouncedLookup, type PostalCodeResult } from '@/lib/postal-code-lookup';
import { Card, Button, Badge } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useCustomersStore } from '@/store/customers-store';
import toast from 'react-hot-toast';
import { RefreshCw, Send } from 'lucide-react';
import type { Customer, RiskIndicator, PaymentRecord, CustomerContact } from '@/types/customers';
import {
    CustomerStatus,
    CustomerAccountType,
    RiskLevel,
    PaymentBehavior,
    CreditStatus,
    InvoiceDelivery,
    CUSTOMER_STATUSES,
    CUSTOMER_TYPES,
    RISK_LEVELS,
    PAYMENT_BEHAVIORS,
    PAYMENT_TERMS,
    INDUSTRIES,
} from '@/types/customers';

// =============================================================================
// METRIC CARDS
// =============================================================================

function MetricCards() {
    const { getAnalytics } = useCustomersStore();
    const analytics = getAnalytics();
    const { t } = useThemeStore();

    const metrics = [
        { label: t('customers.totalCustomers') || 'Total Customers', value: analytics.totalCustomers, subtext: `${analytics.activeCustomers} ${t('customers.active') || 'active'}`, icon: Users, color: 'blue' },
        { label: t('customers.totalRevenue') || 'Total Revenue', value: `$${(analytics.totalRevenue / 1000000).toFixed(1)}M`, subtext: `$${(analytics.averageCustomerValue / 1000).toFixed(0)}K ${t('customers.avgValue') || 'avg'}`, icon: DollarSign, color: 'emerald' },
        { label: t('customers.outstanding') || 'Outstanding', value: `$${(analytics.totalOutstanding / 1000).toFixed(0)}K`, subtext: t('customers.acrossAllCustomers') || 'Across all customers', icon: CreditCard, color: 'amber' },
        { label: t('customers.atRisk') || 'At Risk', value: analytics.riskBreakdown.high + analytics.riskBreakdown.critical, subtext: `${analytics.riskBreakdown.critical} ${t('customers.critical') || 'critical'}`, icon: AlertTriangle, color: analytics.riskBreakdown.critical > 0 ? 'red' : 'amber' },
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
// CHURN ANALYSIS SECTION
// =============================================================================

function ChurnAnalysisSection() {
    const { customers, getAnalytics } = useCustomersStore();
    const { t } = useThemeStore();
    const [showDetails, setShowDetails] = useState(false);

    const analytics = getAnalytics();

    // Calculate churn metrics
    const churnMetrics = useMemo(() => {
        const total = customers.length;
        const churned = customers.filter(c => c.status === 'churned').length;
        const atRisk = customers.filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical').length;
        const inactive = customers.filter(c => c.status === 'inactive').length;

        // Calculate churn rate
        const churnRate = total > 0 ? (churned / total) * 100 : 0;

        // Calculate revenue at risk from high-risk customers
        const revenueAtRisk = customers
            .filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical')
            .reduce((sum, c) => sum + (c.totalRevenue || 0), 0);

        // Lost revenue from churned customers
        const lostRevenue = customers
            .filter(c => c.status === 'churned')
            .reduce((sum, c) => sum + (c.totalRevenue || 0), 0);

        // Get at-risk customers sorted by revenue (most valuable first)
        const atRiskCustomers = customers
            .filter(c => (c.riskLevel === 'high' || c.riskLevel === 'critical') && c.status !== 'churned')
            .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
            .slice(0, 5);

        return {
            total,
            churned,
            churnRate,
            atRisk,
            inactive,
            revenueAtRisk,
            lostRevenue,
            atRiskCustomers,
            retentionRate: 100 - churnRate,
        };
    }, [customers]);

    // Churn risk indicators
    const riskIndicators = useMemo(() => {
        return customers
            .filter(c => c.status !== 'churned')
            .map(customer => {
                let riskScore = 0;
                const factors: string[] = [];

                // High risk level
                if (customer.riskLevel === 'critical') {
                    riskScore += 40;
                    factors.push('Critical risk status');
                } else if (customer.riskLevel === 'high') {
                    riskScore += 25;
                    factors.push('High risk status');
                }

                // Payment behavior
                if (customer.paymentBehavior === 'poor') {
                    riskScore += 30;
                    factors.push('Poor payment history');
                } else if (customer.paymentBehavior === 'fair') {
                    riskScore += 15;
                    factors.push('Fair payment history');
                }

                // Days since last activity
                if (customer.lastActivityDate) {
                    const daysSinceActivity = Math.floor(
                        (Date.now() - new Date(customer.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    if (daysSinceActivity > 90) {
                        riskScore += 25;
                        factors.push('No activity in 90+ days');
                    } else if (daysSinceActivity > 60) {
                        riskScore += 15;
                        factors.push('No activity in 60+ days');
                    }
                }

                // Inactive status
                if (customer.status === 'inactive') {
                    riskScore += 20;
                    factors.push('Inactive status');
                }

                return {
                    customer,
                    riskScore: Math.min(riskScore, 100),
                    factors,
                };
            })
            .filter(item => item.riskScore > 30)
            .sort((a, b) => b.riskScore - a.riskScore)
            .slice(0, 10);
    }, [customers]);

    if (customers.length === 0) return null;

    return (
        <Card variant="glass" padding="md">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                        <TrendingDown className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            {t('customers.churnAnalysis') || 'Churn Analysis'}
                        </h3>
                        <p className="text-xs text-gray-500">Customer retention insights</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm text-[var(--accent-primary)] hover:underline"
                >
                    {showDetails ? 'Hide Details' : 'Show Details'}
                </button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="p-3 bg-gray-50 dark:bg-surface-800 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Churn Rate</p>
                    <p className={`text-xl font-bold ${churnMetrics.churnRate > 10 ? 'text-red-600' : churnMetrics.churnRate > 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {churnMetrics.churnRate.toFixed(1)}%
                    </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-surface-800 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Retention Rate</p>
                    <p className="text-xl font-bold text-emerald-600">{churnMetrics.retentionRate.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-surface-800 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">At Risk</p>
                    <p className="text-xl font-bold text-amber-600">{churnMetrics.atRisk}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-surface-800 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Revenue at Risk</p>
                    <p className="text-xl font-bold text-red-600">
                        ${(churnMetrics.revenueAtRisk / 1000).toFixed(0)}K
                    </p>
                </div>
            </div>

            {showDetails && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                >
                    {/* At-Risk Customers */}
                    {riskIndicators.length > 0 && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <AlertTriangle size={16} className="text-red-500" />
                                High Churn Risk Customers
                            </h4>
                            <div className="space-y-2">
                                {riskIndicators.map(({ customer, riskScore, factors }) => (
                                    <div key={customer.id} className="flex items-center justify-between p-2 bg-white dark:bg-surface-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                                riskScore >= 70 ? 'bg-red-100 text-red-700' :
                                                riskScore >= 50 ? 'bg-orange-100 text-orange-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                                {riskScore}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-gray-900 dark:text-white">{customer.name}</p>
                                                <p className="text-xs text-gray-500">{factors.slice(0, 2).join(' • ')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                ${((customer.totalRevenue || 0) / 1000).toFixed(0)}K
                                            </p>
                                            <p className="text-xs text-gray-500">Revenue at risk</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recommendations */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Lightbulb size={16} className="text-blue-500" />
                            Retention Recommendations
                        </h4>
                        <div className="space-y-2">
                            {churnMetrics.atRisk > 0 && (
                                <div className="flex items-start gap-2 text-sm">
                                    <CheckCircle2 size={16} className="text-blue-500 mt-0.5" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Reach out to {churnMetrics.atRisk} at-risk customers with personalized offers
                                    </span>
                                </div>
                            )}
                            {churnMetrics.inactive > 0 && (
                                <div className="flex items-start gap-2 text-sm">
                                    <CheckCircle2 size={16} className="text-blue-500 mt-0.5" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Re-engage {churnMetrics.inactive} inactive customers with win-back campaigns
                                    </span>
                                </div>
                            )}
                            <div className="flex items-start gap-2 text-sm">
                                <CheckCircle2 size={16} className="text-blue-500 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300">
                                    Review payment terms for customers with poor payment behavior
                                </span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <CheckCircle2 size={16} className="text-blue-500 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300">
                                    Schedule quarterly business reviews with high-value customers
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Lost Revenue */}
                    {churnMetrics.lostRevenue > 0 && (
                        <div className="p-3 bg-gray-50 dark:bg-surface-800 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Lost Revenue from Churn</p>
                                <p className="text-xs text-gray-500">{churnMetrics.churned} customers churned</p>
                            </div>
                            <p className="text-xl font-bold text-red-600">
                                ${(churnMetrics.lostRevenue / 1000).toFixed(0)}K
                            </p>
                        </div>
                    )}
                </motion.div>
            )}
        </Card>
    );
}

// =============================================================================
// CUSTOMER CARD
// =============================================================================

function CustomerCard({ customer, onClick }: { customer: Customer; onClick: () => void }) {
    const { t } = useThemeStore();

    const statusColors: Record<CustomerStatus, string> = {
        active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        prospect: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        churned: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        suspended: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };

    const riskColors: Record<RiskLevel, string> = {
        low: 'text-emerald-500',
        medium: 'text-amber-500',
        high: 'text-orange-500',
        critical: 'text-red-500',
    };

    const behaviorColors: Record<PaymentBehavior, string> = {
        excellent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        good: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        fair: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        poor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        delinquent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
        <Card variant="glass" padding="md" hover className="cursor-pointer" onClick={onClick}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${customer.type === 'enterprise' ? 'bg-purple-100 dark:bg-purple-900/30' : customer.type === 'business' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-surface-700'}`}>
                        {customer.type === 'individual' ? <User size={24} className="text-gray-500" /> : <Building2 size={24} className={customer.type === 'enterprise' ? 'text-purple-500' : 'text-blue-500'} />}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{customer.name}</h3>
                        <p className="text-xs text-gray-500">{customer.customerNumber} • {customer.industry || customer.type}</p>
                    </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[customer.status]}`}>
                    {t(`customers.status.${customer.status}`) || customer.status}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                    <p className="text-xs text-gray-500">{t('customers.totalRevenue') || 'Total Revenue'}</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">${customer.totalRevenue.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">{t('customers.outstanding') || 'Outstanding'}</p>
                    <p className={`text-lg font-semibold ${customer.outstandingBalance > 0 ? 'text-amber-600' : 'text-gray-900 dark:text-white'}`}>${customer.outstandingBalance.toLocaleString()}</p>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-surface-700">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className={riskColors[customer.riskLevel]} />
                    <span className="text-xs text-gray-500">{t('customers.risk') || 'Risk'}: {t(`customers.riskLevel.${customer.riskLevel}`) || customer.riskLevel}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${behaviorColors[customer.paymentBehavior]}`}>
                    {t(`customers.behavior.${customer.paymentBehavior}`) || customer.paymentBehavior}
                </span>
            </div>

            {/* Credit Bar */}
            <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">{t('customers.creditUsed') || 'Credit Used'}</span>
                    <span className="text-gray-700 dark:text-gray-300">${customer.creditUsed.toLocaleString()} / ${customer.creditLimit.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${customer.creditUsed / customer.creditLimit > 0.8 ? 'bg-red-500' : customer.creditUsed / customer.creditLimit > 0.5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                         style={{ width: `${Math.min(100, (customer.creditUsed / customer.creditLimit) * 100)}%` }} />
                </div>
            </div>
        </Card>
    );
}

// =============================================================================
// CUSTOMER DETAIL MODAL
// =============================================================================

function CustomerDetailModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
    const { t } = useThemeStore();
    const {
        getCustomerPayments,
        getCustomerRiskIndicators,
        getCustomerContacts,
        getCustomerRevenue,
        updateCreditLimit,
        resolveRiskIndicator,
        fetchCustomer
    } = useCustomersStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'credit' | 'revenue' | 'risk' | 'contacts'>('overview');
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [newCreditLimit, setNewCreditLimit] = useState(customer.creditLimit);
    const [creditReason, setCreditReason] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    // Fetch full customer data on mount
    useEffect(() => {
        fetchCustomer(customer.id);
    }, [customer.id, fetchCustomer]);

    const payments = getCustomerPayments(customer.id);
    const riskIndicators = getCustomerRiskIndicators(customer.id);
    const contacts = getCustomerContacts(customer.id);
    const revenue = getCustomerRevenue(customer.id);

    const activeRisks = riskIndicators.filter((r) => r.status === 'active');

    const statusColors: Record<string, string> = {
        active: 'bg-emerald-100 text-emerald-700',
        inactive: 'bg-gray-100 text-gray-600',
        prospect: 'bg-blue-100 text-blue-700',
        churned: 'bg-red-100 text-red-700',
        suspended: 'bg-amber-100 text-amber-700',
    };

    const riskColors: Record<string, string> = {
        low: 'bg-emerald-100 text-emerald-700',
        medium: 'bg-amber-100 text-amber-700',
        high: 'bg-orange-100 text-orange-700',
        critical: 'bg-red-100 text-red-700',
    };

    const paymentStatusColors: Record<string, string> = {
        paid: 'bg-emerald-100 text-emerald-700',
        pending: 'bg-blue-100 text-blue-700',
        partial: 'bg-amber-100 text-amber-700',
        overdue: 'bg-red-100 text-red-700',
        written_off: 'bg-gray-100 text-gray-600',
    };

    const handleCreditUpdate = () => {
        if (creditReason.trim()) {
            updateCreditLimit(customer.id, newCreditLimit, creditReason);
            setShowCreditModal(false);
            toast.success(t('customers.creditUpdated') || 'Credit limit updated');
        }
    };

    const handleSendEmail = async () => {
        if (!emailSubject.trim() || !emailBody.trim()) return;
        setIsSendingEmail(true);
        try {
            // Simulate sending email (real implementation would call an API)
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success(`${t('customers.emailSent') || 'Email sent to'} ${customer.email}`);
            setShowEmailModal(false);
            setEmailSubject('');
            setEmailBody('');
        } catch {
            toast.error(t('customers.emailFailed') || 'Failed to send email');
        } finally {
            setIsSendingEmail(false);
        }
    };

    const tabs = [
        { id: 'overview', label: t('customers.overview') || 'Overview', icon: Eye },
        { id: 'payments', label: t('customers.payments') || 'Payments', icon: CreditCard, count: payments.length },
        { id: 'credit', label: t('customers.credit') || 'Credit', icon: Shield },
        { id: 'revenue', label: t('customers.revenue') || 'Revenue', icon: BarChart3 },
        { id: 'risk', label: t('customers.risk') || 'Risk', icon: AlertTriangle, count: activeRisks.length },
        { id: 'contacts', label: t('customers.contacts') || 'Contacts', icon: Users, count: contacts.length },
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
                            <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${customer.type === 'enterprise' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                                <Building2 size={32} className={customer.type === 'enterprise' ? 'text-purple-500' : 'text-blue-500'} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{customer.name}</h2>
                                <p className="text-gray-500">{customer.customerNumber} • {customer.industry}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[customer.status]}`}>{customer.status}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskColors[customer.riskLevel]}`}>{customer.riskLevel} risk</span>
                                </div>
                            </div>
                        </div>
                        {customer.email && (
                            <Button variant="secondary" size="sm" leftIcon={<Send size={16} />} onClick={() => setShowEmailModal(true)}>
                                {t('customers.sendEmail') || 'Email'}
                            </Button>
                        )}
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
                                    <p className="text-xs text-gray-500">{t('customers.totalRevenue') || 'Total Revenue'}</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">${customer.totalRevenue.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <p className="text-xs text-gray-500">{t('customers.totalOrders') || 'Total Orders'}</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{customer.totalOrders}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <p className="text-xs text-gray-500">{t('customers.avgOrderValue') || 'Avg Order'}</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">${customer.averageOrderValue.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <p className="text-xs text-gray-500">{t('customers.outstanding') || 'Outstanding'}</p>
                                    <p className={`text-xl font-bold ${customer.outstandingBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>${customer.outstandingBalance.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('customers.contactInfo') || 'Contact Information'}</h3>
                                    <div className="space-y-2">
                                        {customer.email && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <Mail size={16} className="text-gray-400" />
                                                <span className="text-gray-700 dark:text-gray-300">{customer.email}</span>
                                            </div>
                                        )}
                                        {customer.phone && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <Phone size={16} className="text-gray-400" />
                                                <span className="text-gray-700 dark:text-gray-300">{customer.phone}</span>
                                            </div>
                                        )}
                                        {customer.website && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <Globe size={16} className="text-gray-400" />
                                                <span className="text-gray-700 dark:text-gray-300">{customer.website}</span>
                                            </div>
                                        )}
                                        {customer.address && (
                                            <div className="flex items-start gap-3 text-sm">
                                                <MapPin size={16} className="text-gray-400 mt-0.5" />
                                                <span className="text-gray-700 dark:text-gray-300">{customer.address.street}, {customer.address.city}, {customer.address.state} {customer.address.postalCode}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('customers.accountInfo') || 'Account Information'}</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-gray-500">{t('customers.customerSince') || 'Customer Since'}</span><span className="text-gray-900 dark:text-white">{new Date(customer.customerSince).toLocaleDateString()}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">{t('customers.accountManager') || 'Account Manager'}</span><span className="text-gray-900 dark:text-white">{customer.accountManagerName || '—'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">{t('customers.paymentTerms') || 'Payment Terms'}</span><span className="text-gray-900 dark:text-white">{customer.paymentTerms}</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Behavior */}
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('customers.paymentBehavior') || 'Payment Behavior'}</h3>
                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500">{t('customers.avgDaysToPayment') || 'Avg Days to Payment'}</p>
                                            <p className={`text-2xl font-bold ${(customer.averageDaysToPayment || 0) > 45 ? 'text-red-600' : (customer.averageDaysToPayment || 0) > 30 ? 'text-amber-600' : 'text-emerald-600'}`}>{customer.averageDaysToPayment || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">{t('customers.latePayments') || 'Late Payments'}</p>
                                            <p className={`text-2xl font-bold ${(customer.latePaymentCount || 0) > 5 ? 'text-red-600' : (customer.latePaymentCount || 0) > 2 ? 'text-amber-600' : 'text-emerald-600'}`}>{customer.latePaymentCount || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">{t('customers.riskScore') || 'Risk Score'}</p>
                                            <p className={`text-2xl font-bold ${customer.riskScore > 50 ? 'text-red-600' : customer.riskScore > 25 ? 'text-amber-600' : 'text-emerald-600'}`}>{customer.riskScore}/100</p>
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
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('customers.invoice') || 'Invoice'}</th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('customers.amount') || 'Amount'}</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('customers.dueDate') || 'Due Date'}</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('customers.paidDate') || 'Paid Date'}</th>
                                        <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('customers.status') || 'Status'}</th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('customers.daysOverdue') || 'Days'}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {payments.map((payment) => (
                                        <tr key={payment.id} className="border-b border-gray-100 dark:border-surface-800">
                                            <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{payment.invoiceNumber}</td>
                                            <td className="py-3 px-4 text-sm text-right font-medium text-gray-900 dark:text-white">${payment.amount.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{new Date(payment.dueDate).toLocaleDateString()}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '—'}</td>
                                            <td className="py-3 px-4 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[payment.status]}`}>{payment.status}</span></td>
                                            <td className="py-3 px-4 text-sm text-right">
                                                {payment.daysOverdue ? <span className="text-red-600">+{payment.daysOverdue}</span> : payment.daysToPayment ? <span className="text-emerald-600">{payment.daysToPayment}</span> : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                                {payments.length === 0 && <p className="text-center text-gray-500 py-8">{t('customers.noPayments') || 'No payment history'}</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'credit' && (
                        <div className="space-y-6">
                            {/* Credit Overview */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <p className="text-xs text-gray-500">{t('customers.creditLimit') || 'Credit Limit'}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">${customer.creditLimit.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <p className="text-xs text-gray-500">{t('customers.creditUsed') || 'Credit Used'}</p>
                                    <p className="text-2xl font-bold text-amber-600">${customer.creditUsed.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <p className="text-xs text-gray-500">{t('customers.creditAvailable') || 'Available'}</p>
                                    <p className="text-2xl font-bold text-emerald-600">${customer.creditAvailable.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Credit Bar */}
                            <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">{t('customers.utilization') || 'Utilization'}</span>
                                    <span className="font-medium">{((customer.creditUsed / customer.creditLimit) * 100).toFixed(1)}%</span>
                                </div>
                                <div className="h-3 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${customer.creditUsed / customer.creditLimit > 0.8 ? 'bg-red-500' : customer.creditUsed / customer.creditLimit > 0.5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                         style={{ width: `${Math.min(100, (customer.creditUsed / customer.creditLimit) * 100)}%` }} />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button variant="primary" onClick={() => setShowCreditModal(true)}>
                                    <Edit size={16} className="mr-2" />{t('customers.adjustLimit') || 'Adjust Limit'}
                                </Button>
                            </div>

                            {/* Credit Limit Modal */}
                            <AnimatePresence>
                                {showCreditModal && (
                                    <div className="fixed inset-0 z-[60] bg-gray-900/50 flex items-center justify-center p-4">
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                                    className="w-full max-w-md bg-white dark:bg-surface-900 rounded-2xl shadow-2xl">
                                            <div className="p-6 border-b border-gray-200 dark:border-surface-700">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('customers.adjustCreditLimit') || 'Adjust Credit Limit'}</h3>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">{t('customers.newLimit') || 'New Credit Limit'}</label>
                                                    <input type="number" value={newCreditLimit} onChange={(e) => setNewCreditLimit(parseFloat(e.target.value) || 0)}
                                                           className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">{t('customers.reason') || 'Reason'} *</label>
                                                    <textarea value={creditReason} onChange={(e) => setCreditReason(e.target.value)} rows={3}
                                                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-surface-700">
                                                <Button variant="secondary" onClick={() => setShowCreditModal(false)}>{t('common.cancel') || 'Cancel'}</Button>
                                                <Button variant="primary" onClick={handleCreditUpdate} disabled={!creditReason.trim()}>{t('common.save') || 'Save'}</Button>
                                            </div>
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>

                            {/* Email Modal */}
                            <AnimatePresence>
                                {showEmailModal && (
                                    <div className="fixed inset-0 z-[60] bg-gray-900/50 flex items-center justify-center p-4">
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                                    className="w-full max-w-lg bg-white dark:bg-surface-900 rounded-2xl shadow-2xl">
                                            <div className="p-6 border-b border-gray-200 dark:border-surface-700">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('customers.sendEmailTo') || 'Send Email to'} {customer.name}</h3>
                                                <p className="text-sm text-gray-500 mt-1">{customer.email}</p>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">{t('customers.subject') || 'Subject'} *</label>
                                                    <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)}
                                                           placeholder={t('customers.emailSubjectPlaceholder') || 'Enter email subject'}
                                                           className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">{t('customers.message') || 'Message'} *</label>
                                                    <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={6}
                                                              placeholder={t('customers.emailBodyPlaceholder') || 'Enter your message...'}
                                                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-surface-700">
                                                <Button variant="secondary" onClick={() => setShowEmailModal(false)} disabled={isSendingEmail}>{t('common.cancel') || 'Cancel'}</Button>
                                                <Button variant="primary" onClick={handleSendEmail} disabled={!emailSubject.trim() || !emailBody.trim() || isSendingEmail}>
                                                    {isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
                                                    {t('customers.send') || 'Send'}
                                                </Button>
                                            </div>
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {activeTab === 'revenue' && (
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                    <tr className="border-b border-gray-200 dark:border-surface-700">
                                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('customers.period') || 'Period'}</th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('customers.revenue') || 'Revenue'}</th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('customers.profit') || 'Profit'}</th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('customers.margin') || 'Margin'}</th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">{t('customers.orders') || 'Orders'}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {revenue.map((r) => (
                                        <tr key={r.id} className="border-b border-gray-100 dark:border-surface-800">
                                            <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{r.period}</td>
                                            <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">${r.revenue.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-sm text-right text-emerald-600">${r.profit?.toLocaleString() || '—'}</td>
                                            <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">{r.margin?.toFixed(1)}%</td>
                                            <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">{r.orderCount}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                                {revenue.length === 0 && <p className="text-center text-gray-500 py-8">{t('customers.noRevenue') || 'No revenue history'}</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'risk' && (
                        <div className="space-y-4">
                            {riskIndicators.map((indicator) => (
                                <div key={indicator.id} className={`p-4 rounded-xl border ${indicator.status === 'resolved' ? 'bg-gray-50 dark:bg-surface-800 border-gray-200 dark:border-surface-700' : indicator.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : indicator.severity === 'high' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle size={20} className={indicator.status === 'resolved' ? 'text-gray-400' : indicator.severity === 'critical' ? 'text-red-500' : indicator.severity === 'high' ? 'text-orange-500' : 'text-amber-500'} />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className={`font-medium ${indicator.status === 'resolved' ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>{indicator.indicator}</p>
                                                    <span className={`px-2 py-0.5 rounded text-xs ${riskColors[indicator.severity]}`}>{indicator.severity}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{indicator.description}</p>
                                                {indicator.recommendedAction && indicator.status !== 'resolved' && (
                                                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">💡 {indicator.recommendedAction}</p>
                                                )}
                                                {indicator.actionTaken && (
                                                    <p className="text-sm text-emerald-600 mt-2">✓ {indicator.actionTaken}</p>
                                                )}
                                            </div>
                                        </div>
                                        {indicator.status === 'active' && (
                                            <Button variant="secondary" size="sm" onClick={() => {
                                                const action = prompt('Enter action taken to resolve:');
                                                if (action) resolveRiskIndicator(customer.id, indicator.id, action);
                                            }}>
                                                {t('customers.resolve') || 'Resolve'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {riskIndicators.length === 0 && (
                                <div className="p-8 text-center">
                                    <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
                                    <p className="text-gray-500">{t('customers.noRiskIndicators') || 'No risk indicators'}</p>
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
                                                {contact.isPrimary && <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">{t('customers.primary') || 'Primary'}</span>}
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
                            {contacts.length === 0 && <p className="text-center text-gray-500 py-8">{t('customers.noContacts') || 'No contacts'}</p>}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// NEW CUSTOMER MODAL
// =============================================================================

// Create debounced postal code lookup
const postalCodeLookup = createDebouncedLookup(500);

function NewCustomerModal({ onClose }: { onClose: () => void }) {
    const { t } = useThemeStore();
    const { createCustomer } = useCustomersStore();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        type: 'business' as CustomerAccountType,
        status: 'active' as CustomerStatus,
        email: '',
        phone: '',
        industry: '',
        address: { street: '', city: '', state: '', postalCode: '', country: '' },
        creditLimit: 50000,
        paymentTerms: 'Net 30',
    });
    const [postalLookupLoading, setPostalLookupLoading] = useState(false);
    const [postalLookupSuccess, setPostalLookupSuccess] = useState(false);

    // Handle postal code change with auto-lookup
    const handlePostalCodeChange = (postalCode: string) => {
        setFormData({ ...formData, address: { ...formData.address, postalCode } });
        setPostalLookupSuccess(false);

        if (postalCode.length >= 4) {
            setPostalLookupLoading(true);
            postalCodeLookup(postalCode, formData.address.country || undefined, (result: PostalCodeResult | null) => {
                setPostalLookupLoading(false);
                if (result) {
                    setFormData(prev => ({
                        ...prev,
                        address: {
                            ...prev.address,
                            city: result.city,
                            state: result.state || result.stateCode || '',
                            country: result.country,
                        }
                    }));
                    setPostalLookupSuccess(true);
                }
            });
        }
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.email) return;
        await createCustomer({
            ...formData,
            customerSince: new Date().toISOString(),
            totalRevenue: 0,
            totalOrders: 0,
            averageOrderValue: 0,
            outstandingBalance: 0,
            creditUsed: 0,
            creditAvailable: formData.creditLimit,
            creditStatus: CreditStatus.APPROVED,
            riskLevel: RiskLevel.LOW,
            riskScore: 0,
            paymentBehavior: PaymentBehavior.GOOD,
            averageDaysToPayment: 0,
            latePaymentCount: 0,
            overdueAmount: 0,
            currency: 'EUR',
            preferredLanguage: 'en',
            invoiceDelivery: InvoiceDelivery.EMAIL,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-2xl bg-white dark:bg-surface-900 rounded-2xl shadow-2xl">
                <div className="p-6 border-b border-gray-200 dark:border-surface-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('customers.newCustomer') || 'New Customer'}</h2>
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
                            <h3 className="font-semibold text-gray-900 dark:text-white">{t('customers.basicInfo') || 'Basic Information'}</h3>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('customers.companyName') || 'Company Name'} *</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                       className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('customers.type') || 'Type'}</label>
                                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as CustomerAccountType })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800">
                                        {CUSTOMER_TYPES.map((ct) => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('customers.industry') || 'Industry'}</label>
                                    <select value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800">
                                        <option value="">Select...</option>
                                        {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('customers.email') || 'Email'} *</label>
                                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                           className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('customers.phone') || 'Phone'}</label>
                                    <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                           className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{t('customers.address') || 'Address'}</h3>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('customers.street') || 'Street'}</label>
                                <input type="text" value={formData.address.street} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                                       className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('customers.city') || 'City'}</label>
                                    <input type="text" value={formData.address.city} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                                           className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('customers.state') || 'State'}</label>
                                    <input type="text" value={formData.address.state} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                                           className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('customers.postalCode') || 'Postal Code'}</label>
                                    <div className="relative">
                                        <input type="text" value={formData.address.postalCode} onChange={(e) => handlePostalCodeChange(e.target.value)}
                                               placeholder={t('customers.enterPostalCode') || 'Enter postal code...'}
                                               className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 pr-10" />
                                        {postalLookupLoading && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                            </div>
                                        )}
                                        {postalLookupSuccess && !postalLookupLoading && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Sparkles className="w-4 h-4 text-green-500" />
                                            </div>
                                        )}
                                    </div>
                                    {postalLookupSuccess && (
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                            Auto-filled city and country
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('customers.country') || 'Country'}</label>
                                    <input type="text" value={formData.address.country} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })}
                                           className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{t('customers.creditSettings') || 'Credit Settings'}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('customers.creditLimit') || 'Credit Limit'}</label>
                                    <input type="number" value={formData.creditLimit} onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                                           className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('customers.paymentTerms') || 'Payment Terms'}</label>
                                    <select value={formData.paymentTerms} onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800">
                                        {PAYMENT_TERMS.map((pt) => <option key={pt} value={pt}>{pt}</option>)}
                                    </select>
                                </div>
                            </div>
                            {/* Summary */}
                            <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl mt-4">
                                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">{t('customers.summary') || 'Summary'}</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-500">{t('customers.name') || 'Name'}</span><span className="font-medium text-gray-900 dark:text-white">{formData.name || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">{t('customers.type') || 'Type'}</span><span className="font-medium text-gray-900 dark:text-white capitalize">{formData.type}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">{t('customers.email') || 'Email'}</span><span className="font-medium text-gray-900 dark:text-white">{formData.email || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">{t('customers.creditLimit') || 'Credit Limit'}</span><span className="font-medium text-gray-900 dark:text-white">${formData.creditLimit.toLocaleString()}</span></div>
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
                            <Button variant="primary" onClick={handleSubmit}>{t('customers.createCustomer') || 'Create Customer'}</Button>
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

export default function CustomersPage() {
    const { t } = useThemeStore();
    const { 
        customers, 
        selectCustomer, 
        selectedCustomerId,
        fetchCustomers,
        fetchCustomer,
        isLoading,
        isInitialized 
    } = useCustomersStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<CustomerStatus | 'all'>('all');
    const [filterRisk, setFilterRisk] = useState<RiskLevel | 'all'>('all');
    const [showNewModal, setShowNewModal] = useState(false);

    // Fetch customers on mount
    useEffect(() => {
        if (!isInitialized) {
            fetchCustomers();
        }
    }, [fetchCustomers, isInitialized]);

    // Fetch full customer data when selected
    useEffect(() => {
        if (selectedCustomerId) {
            fetchCustomer(selectedCustomerId);
        }
    }, [selectedCustomerId, fetchCustomer]);

    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

    const filteredCustomers = useMemo(() => {
        return customers.filter((c) => {
            const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  c.customerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  (c.email || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
            const matchesRisk = filterRisk === 'all' || c.riskLevel === filterRisk;
            return matchesSearch && matchesStatus && matchesRisk;
        });
    }, [customers, searchQuery, filterStatus, filterRisk]);

    // Churn analysis
    const churnedCount = useMemo(() => customers.filter(c => c.status === 'churned').length, [customers]);
    const atRiskCount = useMemo(() => customers.filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical').length, [customers]);

    // Sync handler
    const handleSync = async () => {
        await fetchCustomers();
        toast.success(t('customers.syncSuccess') || 'Customers synced successfully');
    };

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
                        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 border border-violet-500/20">
                            <Users className="w-6 h-6 text-violet-400" />
                        </div>
                        {t('customers.title') || 'Customers'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('customers.subtitle') || 'Manage customer relationships and credit'}</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        leftIcon={<RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />}
                        onClick={handleSync}
                        disabled={isLoading}
                    >
                        {t('common.sync') || 'Sync'}
                    </Button>
                    <Button variant="primary" leftIcon={<UserPlus size={18} />} onClick={() => setShowNewModal(true)}>
                        {t('customers.newCustomer') || 'New Customer'}
                    </Button>
                </div>
            </div>

            {/* Churn Analysis Alert */}
            {churnedCount > 0 && (
                <Card variant="glass" padding="md" className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                                {t('customers.churnAlert') || 'Customer Churn Alert'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {churnedCount} {t('customers.customersChurned') || 'customers have churned this period'}.
                                {atRiskCount > 0 && ` ${atRiskCount} ${t('customers.moreAtRisk') || 'more are at risk'}.`}
                            </p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setFilterStatus(CustomerStatus.CHURNED)}>
                            {t('customers.viewChurned') || 'View Churned'}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Metrics */}
            <MetricCards />

            {/* Churn Analysis */}
            <ChurnAnalysisSection />

            {/* Filters */}
            <Card variant="glass" padding="md">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                               placeholder={t('customers.searchPlaceholder') || 'Search customers...'}
                               className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800" />
                    </div>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as CustomerStatus | 'all')}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800">
                        <option value="all">{t('customers.allStatuses') || 'All Statuses'}</option>
                        {CUSTOMER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value as RiskLevel | 'all')}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800">
                        <option value="all">{t('customers.allRiskLevels') || 'All Risk Levels'}</option>
                        {RISK_LEVELS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                </div>
            </Card>

            {/* Customer Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.map((customer) => (
                    <CustomerCard key={customer.id} customer={customer} onClick={() => selectCustomer(customer.id)} />
                ))}
            </div>

            {filteredCustomers.length === 0 && (
                <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">{t('customers.noCustomers') || 'No customers found'}</p>
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedCustomer && <CustomerDetailModal customer={selectedCustomer} onClose={() => selectCustomer(null)} />}
            </AnimatePresence>

            {/* New Customer Modal */}
            <AnimatePresence>
                {showNewModal && <NewCustomerModal onClose={() => setShowNewModal(false)} />}
            </AnimatePresence>
        </div>
    );
}