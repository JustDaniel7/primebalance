'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    FileText,
    Check,
    ChevronRight,
    ChevronLeft,
    Package,
    X,
    AlertTriangle,
    Percent,
    Building2,
    Receipt,
    CheckCircle2,
    CircleDashed,
    PlayCircle,
    PauseCircle,
    Globe,
    Save,
    Trash2,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useOrderStore } from '@/store/order-store';
import { useInvoiceStore } from '@/store/invoice-store';
import { COUNTRIES, CURRENCIES } from '@/types/invoice';
import type { Invoice, InvoiceItem, InvoiceParty } from '@/types/invoice';

// Use types from store directly
type Order = ReturnType<typeof useOrderStore.getState>['orders'][0];
type OrderItem = Order['items'][0];

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
        { value: 'all', label: t('common.all') || 'All' },
        { value: 'draft', label: t('order.status.draft') || 'Draft' },
        { value: 'confirmed', label: t('order.status.confirmed') || 'Confirmed' },
        { value: 'in_progress', label: t('order.status.inProgress') || 'In Progress' },
        { value: 'completed', label: t('order.status.completed') || 'Completed' },
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
        const { variant, icon: Icon } = config[status] || config.draft;
        return (
            <Badge variant={variant} size="sm">
                <Icon size={12} className="mr-1" />
                {t(`order.status.${status}`) || status}
            </Badge>
        );
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('order.title') || 'Orders'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {t('order.subtitle') || 'Manage your orders and invoicing'}
                    </p>
                </div>
                <Button variant="primary" leftIcon={<Plus size={18} />} onClick={onCreateNew}>
                    {t('order.new') || 'New Order'}
                </Button>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder={t('order.search') || 'Search orders...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                    {statusTabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setStatusFilter(tab.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                statusFilter === tab.value
                                    ? 'bg-[var(--accent-primary)] text-white'
                                    : 'bg-gray-100 dark:bg-surface-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-surface-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <Card className="p-12 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {t('order.empty') || 'No orders found'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {t('order.emptyDesc') || 'Create your first order to get started'}
                    </p>
                    <Button variant="primary" leftIcon={<Plus size={18} />} onClick={onCreateNew}>
                        {t('order.new') || 'New Order'}
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredOrders.map((order) => {
                        const invoicingStatus = getInvoicingStatus(order.id);
                        return (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group"
                            >
                                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelectOrder(order)}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {order.orderNumber}
                                                </h3>
                                                {getStatusBadge(order.status)}
                                                {order.isCrossBorder && (
                                                    <Badge variant="info" size="sm">
                                                        <Globe size={12} className="mr-1" />
                                                        {t('order.crossBorder') || 'Cross-border'}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                {order.customer.company || order.customer.name}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                                {order.orderDate} • {order.items.length} {t('order.items') || 'items'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {formatCurrency(order.total, order.currency)}
                                            </p>
                                            {invoicingStatus.percentage > 0 && (
                                                <div className="mt-2">
                                                    <div className="text-xs text-gray-500 mb-1">
                                                        {Math.round(invoicingStatus.percentage)}% {t('order.invoiced') || 'invoiced'}
                                                    </div>
                                                    <div className="w-24 h-1.5 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-green-500 rounded-full"
                                                            style={{ width: `${invoicingStatus.percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {order.amountRemaining > 0 && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    leftIcon={<Receipt size={16} />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onInvoiceOrder(order);
                                                    }}
                                                >
                                                    {t('order.invoice') || 'Invoice'}
                                                </Button>
                                            )}
                                            <ChevronRight className="text-gray-400 group-hover:text-gray-600" size={20} />
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
// ORDER CREATION WIZARD
// =============================================================================

function OrderCreationWizard({
                                 onClose,
                                 onComplete,
                             }: {
    onClose: () => void;
    onComplete: (order: Order) => void;
}) {
    const { t, language } = useThemeStore();
    const { createOrder } = useOrderStore();

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [customerType, setCustomerType] = useState<'b2b' | 'b2c'>('b2b');
    const [customer, setCustomer] = useState({
        name: '',
        company: '',
        address: '',
        city: '',
        postalCode: '',
        country: 'DE',
        email: '',
        vatId: '',
    });
    const [seller] = useState({
        name: 'Your Company',
        company: 'Your Company GmbH',
        address: 'Your Address',
        city: 'Your City',
        postalCode: '12345',
        country: 'DE',
        vatId: 'DE123456789',
    });
    const [items, setItems] = useState<Array<{
        id: string;
        description: string;
        quantity: number;
        unitPrice: number;
        unit: string;
        taxRate: number;
    }>>([{
        id: `item-${Date.now()}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        unit: 'piece',
        taxRate: 19,
    }]);
    const [currency, setCurrency] = useState('EUR');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [deliveryDate, setDeliveryDate] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringInterval, setRecurringInterval] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
    const [notes, setNotes] = useState('');

    const isCrossBorder = customer.country !== seller.country;

    // Calculate totals
    const totals = useMemo(() => {
        let subtotal = 0;
        let taxAmount = 0;
        items.forEach(item => {
            const lineTotal = item.quantity * item.unitPrice;
            subtotal += lineTotal;
            if (!(customerType === 'b2b' && isCrossBorder && customer.vatId)) {
                taxAmount += lineTotal * (item.taxRate / 100);
            }
        });
        return { subtotal, taxAmount, total: subtotal + taxAmount };
    }, [items, customerType, isCrossBorder, customer.vatId]);

    const addItem = () => {
        setItems([...items, {
            id: `item-${Date.now()}`,
            description: '',
            quantity: 1,
            unitPrice: 0,
            unit: 'piece',
            taxRate: customerType === 'b2b' && isCrossBorder ? 0 : 19,
        }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: string, value: any) => {
        const updated = [...items];
        (updated[index] as any)[field] = value;
        setItems(updated);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                return !!(customer.name || customer.company) && !!customer.address && !!customer.city && !!customer.country;
            case 2:
                return items.length > 0 && items.every(item => item.description && item.quantity > 0);
            case 3:
                return !!orderDate;
            default:
                return true;
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const orderItems = items.map((item, idx) => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                unit: item.unit,
                taxRate: item.taxRate,
                total: item.quantity * item.unitPrice,
                quantityInvoiced: 0,
                quantityRemaining: item.quantity,
                amountInvoiced: 0,
                amountRemaining: item.quantity * item.unitPrice,
            }));

            const order = createOrder({
                orderNumber: `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
                status: 'draft',
                customer,
                seller,
                customerType,
                isCrossBorder,
                items: orderItems,
                currency,
                subtotal: totals.subtotal,
                taxAmount: totals.taxAmount,
                total: totals.total,
                amountInvoiced: 0,
                amountRemaining: totals.total,
                invoiceIds: [],
                orderDate,
                deliveryDate: deliveryDate || undefined,
                isRecurring,
                recurringInterval: isRecurring ? recurringInterval : undefined,
                notes: notes || undefined,
            });
            onComplete(order);
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [
        { id: 1, label: t('order.wizard.customer') || 'Customer', icon: Building2 },
        { id: 2, label: t('order.wizard.items') || 'Items', icon: Package },
        { id: 3, label: t('order.wizard.terms') || 'Terms', icon: FileText },
        { id: 4, label: t('order.wizard.review') || 'Review', icon: Check },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-surface-950 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {t('order.new') || 'New Order'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {t('order.wizard.subtitle') || 'Create a new order step by step'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Progress */}
                <div className="flex items-center justify-between mb-8">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;
                        return (
                            <React.Fragment key={step.id}>
                                <div className="flex items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        isCompleted ? 'bg-green-500 text-white' :
                                            isActive ? 'bg-[var(--accent-primary)] text-white' :
                                                'bg-gray-200 dark:bg-surface-700 text-gray-500'
                                    }`}>
                                        {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                                    </div>
                                    <span className={`ml-3 text-sm font-medium hidden sm:block ${
                                        isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500'
                                    }`}>
                                        {step.label}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-4 ${
                                        index < currentStep - 1 ? 'bg-green-500' : 'bg-gray-200 dark:bg-surface-700'
                                    }`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Content */}
                <Card className="p-6 mb-6">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Customer */}
                        {currentStep === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {t('order.wizard.customerInfo') || 'Customer Information'}
                                </h2>

                                <div className="grid grid-cols-2 gap-3">
                                    {(['b2b', 'b2c'] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setCustomerType(type)}
                                            className={`p-3 rounded-xl border-2 text-center ${
                                                customerType === type
                                                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                                                    : 'border-gray-200 dark:border-surface-700'
                                            }`}
                                        >
                                            {type === 'b2b' ? 'Business (B2B)' : 'Consumer (B2C)'}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {customerType === 'b2b' ? 'Company' : 'Name'} *
                                        </label>
                                        <input
                                            type="text"
                                            value={customerType === 'b2b' ? customer.company : customer.name}
                                            onChange={(e) => setCustomer({
                                                ...customer,
                                                [customerType === 'b2b' ? 'company' : 'name']: e.target.value
                                            })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                                        />
                                    </div>
                                    {customerType === 'b2b' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Contact Person
                                            </label>
                                            <input
                                                type="text"
                                                value={customer.name}
                                                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address *</label>
                                    <input
                                        type="text"
                                        value={customer.address}
                                        onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                                    />
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Postal Code *</label>
                                        <input
                                            type="text"
                                            value={customer.postalCode}
                                            onChange={(e) => setCustomer({ ...customer, postalCode: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City *</label>
                                        <input
                                            type="text"
                                            value={customer.city}
                                            onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Country *</label>
                                        <select
                                            value={customer.country}
                                            onChange={(e) => setCustomer({ ...customer, country: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                                        >
                                            {COUNTRIES.map((c) => (
                                                <option key={c.code} value={c.code}>{c.name.en}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {customerType === 'b2b' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                            <input
                                                type="email"
                                                value={customer.email}
                                                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                VAT ID {isCrossBorder && '*'}
                                            </label>
                                            <input
                                                type="text"
                                                value={customer.vatId}
                                                onChange={(e) => setCustomer({ ...customer, vatId: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                                            />
                                        </div>
                                    </div>
                                )}

                                {isCrossBorder && (
                                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                        <Globe className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm text-blue-700 dark:text-blue-300">
                                            Cross-border transaction {customerType === 'b2b' && customer.vatId && '- Reverse Charge'}
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Step 2: Items */}
                        {currentStep === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Line Items</h2>
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm"
                                    >
                                        {CURRENCIES.map((c) => (
                                            <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    {items.map((item, index) => (
                                        <div key={item.id} className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                            <div className="flex items-start justify-between mb-3">
                                                <span className="text-sm font-medium text-gray-500">Item #{index + 1}</span>
                                                {items.length > 1 && (
                                                    <button onClick={() => removeItem(index)} className="p-1 text-red-500 hover:bg-red-100 rounded">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-12 gap-4">
                                                <div className="col-span-5">
                                                    <input
                                                        type="text"
                                                        placeholder="Description *"
                                                        value={item.description}
                                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Qty"
                                                        value={item.quantity || ''}
                                                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
                                                        min="0"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <select
                                                        value={item.unit}
                                                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
                                                    >
                                                        <option value="piece">Piece</option>
                                                        <option value="hour">Hour</option>
                                                        <option value="day">Day</option>
                                                        <option value="month">Month</option>
                                                        <option value="flat">Flat</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Price"
                                                        value={item.unitPrice || ''}
                                                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
                                                        min="0"
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <div className="px-3 py-2 bg-gray-100 dark:bg-surface-600 rounded-lg text-sm text-right">
                                                        {formatCurrency(item.quantity * item.unitPrice)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={addItem}
                                    className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-surface-600 rounded-xl text-gray-500 hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} />
                                    Add Item
                                </button>

                                <div className="border-t border-gray-200 dark:border-surface-700 pt-4">
                                    <div className="flex justify-end">
                                        <div className="w-64 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Subtotal</span>
                                                <span>{formatCurrency(totals.subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Tax</span>
                                                <span>{formatCurrency(totals.taxAmount)}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold text-lg border-t pt-2">
                                                <span>Total</span>
                                                <span className="text-[var(--accent-primary)]">{formatCurrency(totals.total)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Terms */}
                        {currentStep === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Terms & Dates</h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Order Date *</label>
                                        <input
                                            type="date"
                                            value={orderDate}
                                            onChange={(e) => setOrderDate(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Expected Delivery</label>
                                        <input
                                            type="date"
                                            value={deliveryDate}
                                            onChange={(e) => setDeliveryDate(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isRecurring}
                                            onChange={(e) => setIsRecurring(e.target.checked)}
                                            className="w-5 h-5 rounded"
                                        />
                                        <span className="font-medium">Recurring Order</span>
                                    </label>
                                    {isRecurring && (
                                        <div className="mt-4 ml-8">
                                            <select
                                                value={recurringInterval}
                                                onChange={(e) => setRecurringInterval(e.target.value as any)}
                                                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700"
                                            >
                                                <option value="weekly">Weekly</option>
                                                <option value="monthly">Monthly</option>
                                                <option value="quarterly">Quarterly</option>
                                                <option value="yearly">Yearly</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Step 4: Review */}
                        {currentStep === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Review Order</h2>

                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Customer</h3>
                                    <p className="font-semibold">{customer.company || customer.name}</p>
                                    <p className="text-sm text-gray-600">{customer.address}, {customer.postalCode} {customer.city}</p>
                                </div>

                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <h3 className="text-sm font-medium text-gray-500 mb-3">Items</h3>
                                    {items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm mb-1">
                                            <span>{item.quantity} x {item.description}</span>
                                            <span>{formatCurrency(item.quantity * item.unitPrice)}</span>
                                        </div>
                                    ))}
                                    <div className="border-t mt-3 pt-3 flex justify-between font-semibold">
                                        <span>Total</span>
                                        <span className="text-[var(--accent-primary)]">{formatCurrency(totals.total)}</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setCurrentStep(s => s - 1)}
                        disabled={currentStep === 1}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                    >
                        <ChevronLeft size={18} />
                        Back
                    </button>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            Cancel
                        </button>
                        {currentStep === 4 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                            >
                                <Save size={18} />
                                {isSubmitting ? 'Creating...' : 'Create Order'}
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentStep(s => s + 1)}
                                disabled={!validateStep(currentStep)}
                                className="flex items-center gap-2 px-6 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                            >
                                Next
                                <ChevronRight size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// FAKTURIERUNG WIZARD (Simplified - keeping existing logic)
// =============================================================================

function FakturierungWizard({
                                order,
                                onClose,
                                onComplete,
                            }: {
    order: Order;
    onClose: () => void;
    onComplete: () => void;
}) {
    const { t, language } = useThemeStore();
    const { wizardState, setWizardStep, linkInvoiceToOrder, markItemsAsInvoiced } = useOrderStore();
    const { createInvoice, generateInvoiceNumber } = useInvoiceStore();

    const [selectedItems, setSelectedItems] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        order.items.forEach((item) => {
            initial[item.id] = item.quantityRemaining;
        });
        return initial;
    });

    const currentStep = wizardState.step;

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const currentInvoiceAmount = Object.entries(selectedItems).reduce((sum, [itemId, qty]) => {
        const item = order.items.find(i => i.id === itemId);
        return sum + (item ? qty * item.unitPrice : 0);
    }, 0);

    const handleCreateInvoice = () => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + wizardState.paymentDays);

        const taxAmount = wizardState.applyTax ? currentInvoiceAmount * (wizardState.taxRate / 100) : 0;
        const totalAmount = currentInvoiceAmount + taxAmount;

        const invoiceItems: InvoiceItem[] = order.items
            .filter(item => selectedItems[item.id] > 0)
            .map(item => ({
                id: `inv-item-${Date.now()}-${item.id}`,
                description: item.description,
                quantity: selectedItems[item.id],
                unitPrice: item.unitPrice,
                taxRate: wizardState.applyTax ? wizardState.taxRate : 0,
                total: selectedItems[item.id] * item.unitPrice,
            }));

        const invoice = createInvoice({
            invoiceNumber: generateInvoiceNumber(),
            status: 'draft',
            sender: order.seller as InvoiceParty,
            recipient: order.customer as InvoiceParty,
            invoiceDate: wizardState.invoiceDate,
            dueDate: dueDate.toISOString().split('T')[0],
            items: invoiceItems,
            currency: order.currency,
            subtotal: currentInvoiceAmount,
            taxAmount,
            total: totalAmount,
            applyTax: wizardState.applyTax,
            taxRate: wizardState.taxRate,
            payment: {
                method: 'bank_transfer',
                dueInDays: wizardState.paymentDays,
            },
            notes: wizardState.notes || `${order.orderNumber}`,
            language: language as 'en' | 'de' | 'es' | 'fr',
            isRecurring: false,
        });

        linkInvoiceToOrder(order.id, invoice.id, totalAmount);

        const invoicedItems = order.items
            .filter(item => selectedItems[item.id] > 0)
            .map(item => ({
                itemId: item.id,
                quantity: selectedItems[item.id],
                amount: selectedItems[item.id] * item.unitPrice,
            }));
        markItemsAsInvoiced(order.id, invoicedItems);

        onComplete();
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-surface-950 p-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {t('fakturierung.title') || 'Create Invoice'}
                        </h1>
                        <p className="text-gray-500">{order.orderNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <Card className="p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Select Items to Invoice</h2>
                    <div className="space-y-3">
                        {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-surface-800 rounded-lg">
                                <div>
                                    <p className="font-medium">{item.description}</p>
                                    <p className="text-sm text-gray-500">
                                        {item.quantityRemaining} of {item.quantity} remaining
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        value={selectedItems[item.id] || 0}
                                        onChange={(e) => setSelectedItems({
                                            ...selectedItems,
                                            [item.id]: Math.min(parseFloat(e.target.value) || 0, item.quantityRemaining)
                                        })}
                                        className="w-20 px-3 py-2 rounded-lg border text-center"
                                        min="0"
                                        max={item.quantityRemaining}
                                    />
                                    <span className="text-sm text-gray-500 w-24 text-right">
                                        {formatCurrency((selectedItems[item.id] || 0) * item.unitPrice, order.currency)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t mt-6 pt-4">
                        <div className="flex justify-between text-lg font-semibold">
                            <span>Invoice Total</span>
                            <span className="text-[var(--accent-primary)]">{formatCurrency(currentInvoiceAmount, order.currency)}</span>
                        </div>
                    </div>
                </Card>

                <div className="flex justify-between">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        Cancel
                    </button>
                    <button
                        onClick={handleCreateInvoice}
                        disabled={currentInvoiceAmount <= 0}
                        className="flex items-center gap-2 px-6 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                        <Receipt size={18} />
                        Create Invoice
                    </button>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function OrdersPage() {
    const [view, setView] = useState<'list' | 'create' | 'invoice'>('list');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const { resetWizard, selectOrderForInvoicing, setWizardStep } = useOrderStore();

    const handleCreateNew = () => {
        setView('create');
    };

    const handleInvoiceOrder = (order: Order) => {
        resetWizard();
        selectOrderForInvoicing(order.id);
        setWizardStep(1);
        setSelectedOrder(order);
        setView('invoice');
    };

    const handleOrderCreated = () => {
        setView('list');
    };

    const handleWizardComplete = () => {
        setView('list');
        setSelectedOrder(null);
    };

    if (view === 'create') {
        return <OrderCreationWizard onClose={() => setView('list')} onComplete={handleOrderCreated} />;
    }

    if (view === 'invoice' && selectedOrder) {
        return <FakturierungWizard order={selectedOrder} onClose={() => setView('list')} onComplete={handleWizardComplete} />;
    }

    return (
        <OrderList
            onCreateNew={handleCreateNew}
            onSelectOrder={setSelectedOrder}
            onInvoiceOrder={handleInvoiceOrder}
        />
    );
}