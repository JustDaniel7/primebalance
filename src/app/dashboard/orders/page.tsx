'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    FileText,
    Send,
    Check,
    Clock,
    AlertCircle,
    ChevronRight,
    ChevronLeft,
    Trash2,
    Package,
    X,
    AlertTriangle,
    ArrowRight,
    Percent,
    Calendar,
    Building2,
    User,
    Receipt,
    CheckCircle2,
    CircleDashed,
    PlayCircle,
    PauseCircle,
    RefreshCw,
} from 'lucide-react';
import { Card, Button, Badge, Input } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useOrderStore } from '@/store/order-store';
import { useInvoiceStore } from '@/store/invoice-store';
import { COUNTRIES, CURRENCIES, DEFAULT_TAX_RATES } from '@/types/invoice';
import type { Order, OrderItem, InvoiceType } from '@/types/order';
import type { Invoice, InvoiceItem, InvoiceParty } from '@/types/invoice';

// =============================================================================
// ORDER LIST COMPONENT
// =============================================================================

function OrderList({
                       onCreateNew,
                       onSelectOrder,
                       onInvoiceOrder,
                   }: {
    onCreateNew: () => void;
    onSelectOrder: (order: Order) => void;
    onInvoiceOrder: (order: Order) => void;
}) {
    const { t, language } = useThemeStore();
    const { orders, getInvoicingStatus } = useOrderStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');

    const filteredOrders = useMemo(() => {
        return orders.filter((ord) => {
            const matchesSearch =
                ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ord.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ord.customer.company?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || ord.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [orders, searchQuery, statusFilter]);

    const statusTabs: Array<{ value: Order['status'] | 'all'; label: string }> = [
        { value: 'all', label: t('common.all') },
        { value: 'confirmed', label: t('order.status.confirmed') },
        { value: 'in_progress', label: t('order.status.in_progress') },
        { value: 'completed', label: t('order.status.completed') },
    ];

    const getStatusBadge = (status: Order['status']) => {
        const config: Record<Order['status'], { variant: 'success' | 'warning' | 'info' | 'neutral' | 'danger'; icon: any }> = {
            draft: { variant: 'neutral', icon: CircleDashed },
            confirmed: { variant: 'info', icon: CheckCircle2 },
            in_progress: { variant: 'warning', icon: PlayCircle },
            partially_completed: { variant: 'warning', icon: PauseCircle },
            completed: { variant: 'success', icon: Check },
            cancelled: { variant: 'danger', icon: X },
        };
        const { variant, icon: Icon } = config[status];
        return (
            <Badge variant={variant} size="sm">
                <Icon size={12} className="mr-1" />
                {t(`order.status.${status}`)}
            </Badge>
        );
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US');
    };

    // Calculate totals
    const totals = useMemo(() => {
        const open = orders.filter((o) => ['confirmed', 'in_progress'].includes(o.status)).reduce((s, o) => s + o.amountRemaining, 0);
        const invoiced = orders.reduce((s, o) => s + o.amountInvoiced, 0);
        const total = orders.reduce((s, o) => s + o.total, 0);
        return { open, invoiced, total };
    }, [orders]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
                        {t('order.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-surface-500 mt-1">{t('order.subtitle')}</p>
                </div>
                <Button variant="primary" leftIcon={<Plus size={18} />} onClick={onCreateNew}>
                    {t('order.new')}
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <Card variant="glass" padding="md">
                    <p className="text-sm text-gray-500 dark:text-surface-400">{t('common.total')}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-surface-100 mt-1">
                        {formatCurrency(totals.total, 'EUR')}
                    </p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-sm text-gray-500 dark:text-surface-400">{t('fakturierung.previouslyInvoiced')}</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {formatCurrency(totals.invoiced, 'EUR')}
                    </p>
                </Card>
                <Card variant="glass" padding="md">
                    <p className="text-sm text-gray-500 dark:text-surface-400">{t('fakturierung.remainingAfter')}</p>
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                        {formatCurrency(totals.open, 'EUR')}
                    </p>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('invoice.search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-gray-900 dark:text-surface-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)]"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                    {statusTabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setStatusFilter(tab.value)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                statusFilter === tab.value
                                    ? 'bg-[var(--accent-primary)] text-white'
                                    : 'bg-gray-100 dark:bg-surface-800/50 text-gray-600 dark:text-surface-400 hover:bg-gray-200 dark:hover:bg-surface-700/50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Order List */}
            {filteredOrders.length === 0 ? (
                <Card variant="glass" padding="lg" className="text-center">
                    <Package size={48} className="mx-auto text-gray-300 dark:text-surface-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-surface-100">Keine Aufträge</h3>
                    <p className="text-gray-500 dark:text-surface-400 mt-1">Erstellen Sie Ihren ersten Auftrag</p>
                    <Button variant="primary" className="mt-4" onClick={onCreateNew}>
                        {t('order.new')}
                    </Button>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredOrders.map((order, index) => {
                        const status = getInvoicingStatus(order.id);
                        return (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card variant="glass" padding="md" hover className="cursor-pointer">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0" onClick={() => onSelectOrder(order)}>
                                            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center flex-shrink-0">
                                                <Package size={20} className="text-[var(--accent-primary)]" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-surface-100">
                            {order.orderNumber}
                          </span>
                                                    {getStatusBadge(order.status)}
                                                    {order.isCrossBorder && (
                                                        <Badge variant="info" size="sm">EU/Export</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-surface-400 truncate">
                                                    {order.customer.company || order.customer.name}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {/* Invoicing Progress */}
                                            <div className="hidden md:block text-right">
                                                <p className="font-semibold text-gray-900 dark:text-surface-100">
                                                    {formatCurrency(order.total, order.currency)}
                                                </p>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <div className="w-24 h-1.5 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-green-500 rounded-full transition-all"
                                                            style={{ width: `${status.percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-gray-500 dark:text-surface-400">
                            {status.percentage.toFixed(0)}%
                          </span>
                                                </div>
                                            </div>
                                            {/* Actions */}
                                            {order.amountRemaining > 0 && order.status !== 'cancelled' && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    leftIcon={<Receipt size={16} />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onInvoiceOrder(order);
                                                    }}
                                                >
                                                    {t('fakturierung.title').split(' ')[0]}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// =============================================================================
// FAKTURIERUNG WIZARD COMPONENT
// =============================================================================

function FakturierungWizard({
                                order,
                                onClose,
                                onComplete,
                            }: {
    order: Order;
    onClose: () => void;
    onComplete: (invoice: Invoice) => void;
}) {
    const { t, language } = useThemeStore();
    const { wizardState, updateWizardState, setWizardStep, getSuggestedInvoiceType, getInvoicingStatus, checkDoubleInvoicing, linkInvoiceToOrder, markItemsAsInvoiced } = useOrderStore();
    const { createInvoice, generateInvoiceNumber } = useInvoiceStore();

    const [selectedItems, setSelectedItems] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        order.items.forEach((item) => {
            initial[item.id] = item.quantityRemaining;
        });
        return initial;
    });
    const [invoicePercentage, setInvoicePercentage] = useState(100);

    const steps = [
        { id: 1, label: t('fakturierung.selectOrder'), icon: Package },
        { id: 2, label: t('fakturierung.invoiceType'), icon: FileText },
        { id: 3, label: t('fakturierung.scope'), icon: Percent },
        { id: 4, label: t('fakturierung.taxQuestion').split('?')[0], icon: Receipt },
        { id: 5, label: t('fakturierung.summary'), icon: Check },
    ];

    const currentStep = wizardState.step;
    const invoicingStatus = getInvoicingStatus(order.id);

    const goNext = () => {
        if (currentStep < 5) setWizardStep(currentStep + 1);
    };

    const goBack = () => {
        if (currentStep > 1) setWizardStep(currentStep - 1);
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    // Calculate current invoice amount based on selections
    const currentInvoiceAmount = useMemo(() => {
        if (wizardState.invoiceType === 'final') {
            return order.amountRemaining;
        }

        let amount = 0;
        order.items.forEach((item) => {
            const qty = selectedItems[item.id] || 0;
            amount += qty * item.unitPrice;
        });

        if (wizardState.invoiceType === 'partial' || wizardState.invoiceType === 'advance') {
            return (order.total * invoicePercentage) / 100;
        }

        return amount;
    }, [wizardState.invoiceType, selectedItems, invoicePercentage, order]);

    const taxAmount = wizardState.applyTax ? currentInvoiceAmount * (wizardState.taxRate / 100) : 0;
    const totalAmount = currentInvoiceAmount + taxAmount;

    // Validation
    const validation = checkDoubleInvoicing(order.id, totalAmount);

    const invoiceTypeOptions: Array<{ value: InvoiceType; label: string; description: string }> = [
        { value: 'final', label: t('fakturierung.type.final'), description: language === 'de' ? 'Kompletter Restbetrag' : 'Complete remaining amount' },
        { value: 'partial', label: t('fakturierung.type.partial'), description: language === 'de' ? 'Teilweise abrechnen' : 'Invoice partial amount' },
        { value: 'advance', label: t('fakturierung.type.advance'), description: language === 'de' ? 'Anzahlung vor Leistung' : 'Payment before delivery' },
        { value: 'periodic', label: t('fakturierung.type.periodic'), description: language === 'de' ? 'Regelmäßig wiederkehrend' : 'Regular recurring' },
    ];

    const handleCreateInvoice = () => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + wizardState.paymentDays);

        // Convert order items to invoice items
        const invoiceItems: InvoiceItem[] = order.items
            .filter((item) => selectedItems[item.id] > 0)
            .map((item) => ({
                id: item.id,
                description: item.description,
                quantity: wizardState.invoiceType === 'final' ? item.quantityRemaining : selectedItems[item.id],
                unitPrice: item.unitPrice,
                taxRate: wizardState.applyTax ? wizardState.taxRate : 0,
                total: (wizardState.invoiceType === 'final' ? item.quantityRemaining : selectedItems[item.id]) * item.unitPrice,
            }));

        const invoice = createInvoice({
            invoiceNumber: generateInvoiceNumber(),
            status: 'draft',
            sender: order.seller as InvoiceParty,
            recipient: order.customer as InvoiceParty,
            invoiceDate: wizardState.invoiceDate,
            dueDate: dueDate.toISOString().split('T')[0],
            serviceDate: order.deliveryDate || wizardState.invoiceDate,
            servicePeriodStart: order.servicePeriodStart,
            servicePeriodEnd: order.servicePeriodEnd,
            items: invoiceItems,
            currency: order.currency,
            subtotal: currentInvoiceAmount,
            taxAmount: taxAmount,
            total: totalAmount,
            applyTax: wizardState.applyTax,
            taxRate: wizardState.taxRate,
            taxExemptReason: !wizardState.applyTax ? (order.isCrossBorder ? 'reverse_charge' : 'small_business') : undefined,
            payment: {
                method: 'bank_transfer',
                dueInDays: wizardState.paymentDays,
            },
            notes: wizardState.notes || `${wizardState.invoiceType === 'partial' ? (language === 'de' ? 'Teilrechnung' : 'Partial Invoice') : ''} - ${order.orderNumber}`,
            language: language as 'en' | 'de' | 'es' | 'fr',
            isRecurring: order.isRecurring,
            recurringInterval: order.recurringInterval,
        });

        // Update order with invoicing info
        linkInvoiceToOrder(order.id, invoice.id, totalAmount);

        // Mark items as invoiced
        const invoicedItems = order.items
            .filter((item) => selectedItems[item.id] > 0)
            .map((item) => ({
                itemId: item.id,
                quantity: wizardState.invoiceType === 'final' ? item.quantityRemaining : selectedItems[item.id],
                amount: (wizardState.invoiceType === 'final' ? item.quantityRemaining : selectedItems[item.id]) * item.unitPrice,
            }));
        markItemsAsInvoiced(order.id, invoicedItems);

        onComplete(invoice);
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1: // Order Overview
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('fakturierung.selectOrder')}
                            </h2>
                            <p className="text-gray-500 dark:text-surface-400 mt-1">
                                {order.orderNumber} - {order.customer.company || order.customer.name}
                            </p>
                        </div>

                        {/* Order Summary Card */}
                        <Card variant="glass" padding="lg">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-surface-100">{order.orderNumber}</h3>
                                    <p className="text-sm text-gray-500 dark:text-surface-400">
                                        {order.customer.company || order.customer.name}
                                    </p>
                                </div>
                                <Badge variant={order.customerType === 'b2b' ? 'info' : 'neutral'}>
                                    {order.customerType.toUpperCase()}
                                </Badge>
                            </div>

                            {/* Items */}
                            <div className="border-t border-gray-200 dark:border-surface-700 pt-4 space-y-2">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-surface-400">
                      {item.description} ({item.quantityRemaining}/{item.quantity} {item.unit})
                    </span>
                                        <span className="text-gray-900 dark:text-surface-100">
                      {formatCurrency(item.amountRemaining, order.currency)}
                    </span>
                                    </div>
                                ))}
                            </div>

                            {/* Invoicing Progress */}
                            <div className="border-t border-gray-200 dark:border-surface-700 pt-4 mt-4">
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-500 dark:text-surface-400">{t('fakturierung.previouslyInvoiced')}</span>
                                    <span className="text-green-600 dark:text-green-400">{formatCurrency(invoicingStatus.invoiced, order.currency)}</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                    <span className="text-gray-900 dark:text-surface-100">{t('fakturierung.remainingAfter').replace('After This Invoice', '')}</span>
                                    <span className="text-[var(--accent-primary)]">{formatCurrency(invoicingStatus.remaining, order.currency)}</span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 dark:bg-surface-700 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 rounded-full transition-all"
                                        style={{ width: `${invoicingStatus.percentage}%` }}
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Order Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
                                {t('fakturierung.orderStatus')}
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {(['confirmed', 'in_progress', 'partially_completed', 'completed'] as const).map((status) => (
                                    <button
                                        key={status}
                                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                                            order.status === status
                                                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 text-[var(--accent-primary)]'
                                                : 'border-gray-200 dark:border-surface-700 text-gray-500 dark:text-surface-400'
                                        }`}
                                    >
                                        {t(`order.status.${status}`)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 2: // Invoice Type
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('fakturierung.invoiceType')}
                            </h2>
                            <p className="text-gray-500 dark:text-surface-400 mt-1">{t('fakturierung.typeCorrect')}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {invoiceTypeOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => updateWizardState({ invoiceType: option.value })}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                                        wizardState.invoiceType === option.value
                                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                            : 'border-gray-200 dark:border-surface-700 hover:border-gray-300 dark:hover:border-surface-600'
                                    }`}
                                >
                                    <p className="font-semibold text-gray-900 dark:text-surface-100">{option.label}</p>
                                    <p className="text-sm text-gray-500 dark:text-surface-400 mt-1">{option.description}</p>
                                </button>
                            ))}
                        </div>

                        {getSuggestedInvoiceType(order.id) !== wizardState.invoiceType && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-start gap-3">
                                <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="font-medium text-blue-700 dark:text-blue-300">
                                        {language === 'de' ? 'Empfehlung' : 'Recommendation'}
                                    </p>
                                    <p className="text-sm text-blue-600 dark:text-blue-400">
                                        {language === 'de'
                                            ? `Basierend auf dem Auftragsstatus wird "${t(`fakturierung.type.${getSuggestedInvoiceType(order.id)}`)}" empfohlen.`
                                            : `Based on order status, "${t(`fakturierung.type.${getSuggestedInvoiceType(order.id)}`)}" is recommended.`
                                        }
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 3: // Scope
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('fakturierung.scope')}
                            </h2>
                            <p className="text-gray-500 dark:text-surface-400 mt-1">
                                {wizardState.invoiceType === 'final'
                                    ? (language === 'de' ? 'Gesamter Restbetrag wird abgerechnet' : 'Full remaining amount will be invoiced')
                                    : (language === 'de' ? 'Wählen Sie den abzurechnenden Umfang' : 'Select the scope to invoice')
                                }
                            </p>
                        </div>

                        {wizardState.invoiceType === 'final' ? (
                            <Card variant="glass" padding="lg">
                                <div className="text-center py-4">
                                    <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
                                    <p className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                                        {t('fakturierung.type.final')}
                                    </p>
                                    <p className="text-3xl font-bold text-[var(--accent-primary)] mt-2">
                                        {formatCurrency(order.amountRemaining, order.currency)}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-surface-400 mt-2">
                                        {language === 'de' ? 'Alle offenen Positionen werden abgerechnet' : 'All open items will be invoiced'}
                                    </p>
                                </div>
                            </Card>
                        ) : (
                            <>
                                {/* Percentage Slider */}
                                {(wizardState.invoiceType === 'partial' || wizardState.invoiceType === 'advance') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
                                            {t('fakturierung.scopePercent')}: {invoicePercentage}%
                                        </label>
                                        <input
                                            type="range"
                                            min="10"
                                            max="100"
                                            step="5"
                                            value={invoicePercentage}
                                            onChange={(e) => setInvoicePercentage(Number(e.target.value))}
                                            className="w-full h-2 bg-gray-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
                                        />
                                        <div className="flex justify-between text-sm text-gray-500 dark:text-surface-400 mt-1">
                                            <span>10%</span>
                                            <span>50%</span>
                                            <span>100%</span>
                                        </div>
                                    </div>
                                )}

                                {/* Item Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-2">
                                        {t('fakturierung.scopeItems')}
                                    </label>
                                    <div className="space-y-3">
                                        {order.items.map((item) => (
                                            <Card key={item.id} variant="glass" padding="md">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900 dark:text-surface-100">{item.description}</p>
                                                        <p className="text-sm text-gray-500 dark:text-surface-400">
                                                            {language === 'de' ? 'Verfügbar' : 'Available'}: {item.quantityRemaining} / {item.quantity} {item.unit}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={item.quantityRemaining}
                                                            value={selectedItems[item.id] || 0}
                                                            onChange={(e) => setSelectedItems({ ...selectedItems, [item.id]: Math.min(Number(e.target.value), item.quantityRemaining) })}
                                                            className="w-20 px-3 py-2 bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-lg text-center"
                                                        />
                                                        <span className="text-gray-900 dark:text-surface-100 font-medium w-24 text-right">
                              {formatCurrency((selectedItems[item.id] || 0) * item.unitPrice, order.currency)}
                            </span>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Amount Preview */}
                        <Card variant="glass" padding="md" className="bg-[var(--accent-primary)]/5">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-700 dark:text-surface-300">{t('fakturierung.currentAmount')}</span>
                                <span className="text-2xl font-bold text-[var(--accent-primary)]">
                  {formatCurrency(currentInvoiceAmount, order.currency)}
                </span>
                            </div>
                        </Card>
                    </div>
                );

            case 4: // Tax
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('fakturierung.taxQuestion')}
                            </h2>
                        </div>

                        {/* Auto-detected info */}
                        <div className="p-4 bg-gray-50 dark:bg-surface-800/30 rounded-xl">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500 dark:text-surface-400">{language === 'de' ? 'Verkäufer' : 'Seller'}</p>
                                    <p className="font-medium text-gray-900 dark:text-surface-100">{order.seller.country}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-surface-400">{language === 'de' ? 'Kunde' : 'Customer'}</p>
                                    <p className="font-medium text-gray-900 dark:text-surface-100">{order.customer.country}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-surface-400">{language === 'de' ? 'Kundentyp' : 'Customer Type'}</p>
                                    <p className="font-medium text-gray-900 dark:text-surface-100">{order.customerType.toUpperCase()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-surface-400">{language === 'de' ? 'Grenzüberschreitend' : 'Cross-border'}</p>
                                    <p className="font-medium text-gray-900 dark:text-surface-100">{order.isCrossBorder ? (language === 'de' ? 'Ja' : 'Yes') : (language === 'de' ? 'Nein' : 'No')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tax Options */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => updateWizardState({ applyTax: true })}
                                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                                    wizardState.applyTax
                                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                        : 'border-gray-200 dark:border-surface-700'
                                }`}
                            >
                                <Check size={24} className={wizardState.applyTax ? 'text-[var(--accent-primary)] mx-auto mb-2' : 'text-gray-400 mx-auto mb-2'} />
                                <p className="font-medium text-gray-900 dark:text-surface-100">{t('invoice.tax.yes')}</p>
                                <p className="text-sm text-gray-500 dark:text-surface-400">{DEFAULT_TAX_RATES[order.seller.country] || 19}% MwSt</p>
                            </button>
                            <button
                                onClick={() => updateWizardState({ applyTax: false })}
                                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                                    !wizardState.applyTax
                                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                        : 'border-gray-200 dark:border-surface-700'
                                }`}
                            >
                                <X size={24} className={!wizardState.applyTax ? 'text-[var(--accent-primary)] mx-auto mb-2' : 'text-gray-400 mx-auto mb-2'} />
                                <p className="font-medium text-gray-900 dark:text-surface-100">{t('invoice.tax.no')}</p>
                                <p className="text-sm text-gray-500 dark:text-surface-400">
                                    {order.isCrossBorder && order.customerType === 'b2b' ? 'Reverse Charge' : (language === 'de' ? 'Steuerbefreit' : 'Tax exempt')}
                                </p>
                            </button>
                        </div>

                        {wizardState.applyTax && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                                    {t('invoice.tax.rate')}
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={wizardState.taxRate}
                                        onChange={(e) => updateWizardState({ taxRate: Number(e.target.value) })}
                                        className="w-24 px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl"
                                    />
                                    <span className="text-gray-500">%</span>
                                </div>
                            </div>
                        )}

                        {/* Recommendation for cross-border B2B */}
                        {order.isCrossBorder && order.customerType === 'b2b' && wizardState.applyTax && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="text-amber-500 flex-shrink-0" size={20} />
                                <div>
                                    <p className="font-medium text-amber-700 dark:text-amber-300">
                                        {language === 'de' ? 'Hinweis' : 'Note'}
                                    </p>
                                    <p className="text-sm text-amber-600 dark:text-amber-400">
                                        {language === 'de'
                                            ? 'Bei B2B-Geschäften innerhalb der EU gilt oft das Reverse-Charge-Verfahren (keine MwSt).'
                                            : 'For B2B transactions within the EU, the reverse charge mechanism often applies (no VAT).'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 5: // Summary
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                                {t('fakturierung.summary')}
                            </h2>
                            <p className="text-gray-500 dark:text-surface-400 mt-1">{t('fakturierung.createNow')}</p>
                        </div>

                        {/* Validation Warning */}
                        {!validation.valid && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
                                <div>
                                    <p className="font-medium text-red-700 dark:text-red-300">{t('fakturierung.doubleWarning')}</p>
                                    <p className="text-sm text-red-600 dark:text-red-400">{validation.warning}</p>
                                </div>
                            </div>
                        )}

                        {/* Summary Card */}
                        <Card variant="glass" padding="lg">
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-surface-400">{language === 'de' ? 'Kunde' : 'Customer'}</span>
                                    <span className="font-medium text-gray-900 dark:text-surface-100">{order.customer.company || order.customer.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-surface-400">{language === 'de' ? 'Auftrag' : 'Order'}</span>
                                    <span className="font-medium text-gray-900 dark:text-surface-100">{order.orderNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-surface-400">{t('fakturierung.invoiceType')}</span>
                                    <Badge variant="info">{t(`fakturierung.type.${wizardState.invoiceType}`)}</Badge>
                                </div>

                                <div className="border-t border-gray-200 dark:border-surface-700 pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-surface-400">{language === 'de' ? 'Netto' : 'Net'}</span>
                                        <span className="text-gray-900 dark:text-surface-100">{formatCurrency(currentInvoiceAmount, order.currency)}</span>
                                    </div>
                                    {wizardState.applyTax && (
                                        <div className="flex justify-between mt-2">
                                            <span className="text-gray-500 dark:text-surface-400">{t('invoice.review.tax')} ({wizardState.taxRate}%)</span>
                                            <span className="text-gray-900 dark:text-surface-100">{formatCurrency(taxAmount, order.currency)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between mt-3 pt-3 border-t border-gray-200 dark:border-surface-700">
                                        <span className="font-semibold text-gray-900 dark:text-surface-100">{t('invoice.review.total')}</span>
                                        <span className="text-2xl font-bold text-[var(--accent-primary)]">{formatCurrency(totalAmount, order.currency)}</span>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 dark:border-surface-700 pt-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-surface-400">{t('fakturierung.previouslyInvoiced')}</span>
                                        <span className="text-green-600">{formatCurrency(invoicingStatus.invoiced, order.currency)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1">
                                        <span className="text-gray-500 dark:text-surface-400">{t('fakturierung.remainingAfter')}</span>
                                        <span className="text-amber-600">{formatCurrency(invoicingStatus.remaining - totalAmount, order.currency)}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Payment Terms */}
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label={t('invoice.details.invoiceDate')}
                                type="date"
                                value={wizardState.invoiceDate}
                                onChange={(e) => updateWizardState({ invoiceDate: e.target.value })}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                                    {t('invoice.payment.dueIn')}
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={wizardState.paymentDays}
                                        onChange={(e) => updateWizardState({ paymentDays: Number(e.target.value) })}
                                        className="w-20 px-3 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl"
                                    />
                                    <span className="text-gray-500">{t('invoice.payment.days')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Auto-Invoice Option */}
                        {order.isRecurring && (
                            <Card variant="glass" padding="md" className="bg-blue-50 dark:bg-blue-900/20">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]" />
                                    <div>
                                        <p className="font-medium text-blue-700 dark:text-blue-300">{t('fakturierung.autoFuture')}</p>
                                        <p className="text-sm text-blue-600 dark:text-blue-400">
                                            {language === 'de' ? `Automatisch ${order.recurringInterval === 'monthly' ? 'monatlich' : order.recurringInterval} fakturieren` : `Auto-invoice ${order.recurringInterval}`}
                                        </p>
                                    </div>
                                </label>
                            </Card>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-surface-800 border-b border-gray-200 dark:border-surface-700 px-4 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-700">
                        <X size={20} className="text-gray-500" />
                    </button>
                    <h1 className="font-semibold text-gray-900 dark:text-surface-100">{t('fakturierung.title')}</h1>
                    <div className="w-10" />
                </div>
            </div>

            {/* Steps */}
            <div className="bg-white dark:bg-surface-800 border-b border-gray-200 dark:border-surface-700 px-4 py-3 overflow-x-auto">
                <div className="max-w-4xl mx-auto flex gap-2">
                    {steps.map((step) => {
                        const Icon = step.icon;
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;
                        return (
                            <button
                                key={step.id}
                                onClick={() => step.id < currentStep && setWizardStep(step.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                                    isActive ? 'bg-[var(--accent-primary)] text-white' : isCompleted ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-surface-700 text-gray-400'
                                }`}
                                disabled={step.id > currentStep}
                            >
                                {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                                <span className="hidden sm:inline">{step.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        {renderStepContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-surface-800 border-t border-gray-200 dark:border-surface-700 px-4 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Button variant="secondary" leftIcon={<ChevronLeft size={18} />} onClick={goBack} disabled={currentStep === 1}>
                        {t('common.back')}
                    </Button>
                    <div className="flex gap-3">
                        {currentStep === 5 ? (
                            <>
                                <Button variant="secondary" onClick={onClose}>
                                    {t('invoice.action.saveDraft')}
                                </Button>
                                <Button variant="primary" leftIcon={<Receipt size={18} />} onClick={handleCreateInvoice} disabled={!validation.valid}>
                                    {t('invoice.action.create')}
                                </Button>
                            </>
                        ) : (
                            <Button variant="primary" rightIcon={<ChevronRight size={18} />} onClick={goNext}>
                                {t('common.next')}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function OrdersPage() {
    const [showWizard, setShowWizard] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const { resetWizard, selectOrderForInvoicing, setWizardStep } = useOrderStore();

    const handleInvoiceOrder = (order: Order) => {
        resetWizard();
        selectOrderForInvoicing(order.id);
        setWizardStep(1);
        setSelectedOrder(order);
        setShowWizard(true);
    };

    const handleWizardComplete = () => {
        setShowWizard(false);
        setSelectedOrder(null);
    };

    if (showWizard && selectedOrder) {
        return <FakturierungWizard order={selectedOrder} onClose={() => setShowWizard(false)} onComplete={handleWizardComplete} />;
    }

    return (
        <OrderList
            onCreateNew={() => {}}
            onSelectOrder={setSelectedOrder}
            onInvoiceOrder={handleInvoiceOrder}
        />
    );
}