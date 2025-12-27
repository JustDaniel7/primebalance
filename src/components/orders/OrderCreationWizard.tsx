'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    ChevronRight,
    ChevronLeft,
    Check,
    X,
    Building2,
    Package,
    FileText,
    Globe,
    Save,
    Trash2,
    AlertTriangle,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useOrderStore } from '@/store/order-store';
import { COUNTRIES, CURRENCIES } from '@/types/invoice';
import type { SimpleOrder as Order, SimpleOrderItem as OrderItem, SimpleOrderParty as OrderParty, SimpleCustomerType as CustomerType } from '@/store/order-store';
// =============================================================================
// TYPES
// =============================================================================

interface OrderWizardProps {
    onClose: () => void;
    onComplete: (order: Order) => void;
    editOrder?: Order;
}

type WizardStep = 'customer' | 'items' | 'terms' | 'review';

// =============================================================================
// ORDER CREATION WIZARD
// =============================================================================

export function OrderCreationWizard({ onClose, onComplete, editOrder }: OrderWizardProps) {
    const { t, language } = useThemeStore();
    const { createOrder, updateOrder } = useOrderStore();

    // Wizard State
    const [currentStep, setCurrentStep] = useState<WizardStep>('customer');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State - Customer
    const [customerType, setCustomerType] = useState<CustomerType>(editOrder?.customerType || 'b2b');
    const [customer, setCustomer] = useState<OrderParty>(editOrder?.customer || {
        name: '',
        company: '',
        address: '',
        city: '',
        postalCode: '',
        country: 'DE',
        email: '',
        vatId: '',
    });

    // Form State - Seller (usually pre-filled from company settings)
    const [seller] = useState<OrderParty>(editOrder?.seller || {
        name: 'Your Company',
        company: 'Your Company GmbH',
        address: 'Your Address',
        city: 'Your City',
        postalCode: '12345',
        country: 'DE',
        vatId: 'DE123456789',
    });

    // Form State - Items (matching OrderItem interface exactly)
    const [items, setItems] = useState<OrderItem[]>(
        editOrder?.items || [{
            id: `item-${Date.now()}`,
            description: '',
            quantity: 1,
            unit: 'piece',
            unitPrice: 0,
            taxRate: 19,
            total: 0,
            quantityInvoiced: 0,
            quantityRemaining: 1,
            amountInvoiced: 0,
            amountRemaining: 0,
        }]
    );

    // Form State - Terms
    const [currency, setCurrency] = useState(editOrder?.currency || 'EUR');
    const [orderDate, setOrderDate] = useState(editOrder?.orderDate || new Date().toISOString().split('T')[0]);
    const [deliveryDate, setDeliveryDate] = useState(editOrder?.deliveryDate || '');
    const [servicePeriodStart, setServicePeriodStart] = useState(editOrder?.servicePeriodStart || '');
    const [servicePeriodEnd, setServicePeriodEnd] = useState(editOrder?.servicePeriodEnd || '');
    const [paymentDays, setPaymentDays] = useState(30);
    const [isRecurring, setIsRecurring] = useState(editOrder?.isRecurring || false);
    const [recurringInterval, setRecurringInterval] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>(
        (editOrder?.recurringInterval === 'yearly' ? 'yearly' : editOrder?.recurringInterval) || 'monthly'
    );
    const [notes, setNotes] = useState(editOrder?.notes || '');
    const [reference, setReference] = useState(editOrder?.reference || '');

    // Derived State
    const isCrossBorder = customer.country !== seller.country;
    const isIntraEU = isCrossBorder && isEUCountry(customer.country) && isEUCountry(seller.country);

    // Steps configuration
    const steps: { id: WizardStep; label: string; icon: React.ElementType }[] = [
        { id: 'customer', label: t('order.wizard.customer') || 'Customer', icon: Building2 },
        { id: 'items', label: t('order.wizard.items') || 'Items', icon: Package },
        { id: 'terms', label: t('order.wizard.terms') || 'Terms', icon: FileText },
        { id: 'review', label: t('order.wizard.review') || 'Review', icon: Check },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    // ==========================================================================
    // CALCULATIONS
    // ==========================================================================

    const totals = useMemo(() => {
        let subtotal = 0;
        let taxAmount = 0;

        items.forEach(item => {
            const lineSubtotal = (item.quantity || 0) * (item.unitPrice || 0);
            const lineTax = lineSubtotal * ((item.taxRate || 0) / 100);
            subtotal += lineSubtotal;
            taxAmount += lineTax;
        });

        // B2B cross-border: reverse charge (no tax)
        if (customerType === 'b2b' && isCrossBorder && customer.vatId) {
            taxAmount = 0;
        }

        return {
            subtotal,
            taxAmount,
            total: subtotal + taxAmount,
        };
    }, [items, customerType, isCrossBorder, customer.vatId]);

    // ==========================================================================
    // ITEM MANAGEMENT
    // ==========================================================================

    const addItem = () => {
        const newItem: OrderItem = {
            id: `item-${Date.now()}`,
            description: '',
            quantity: 1,
            unit: 'piece',
            unitPrice: 0,
            taxRate: customerType === 'b2b' && isCrossBorder ? 0 : 19,
            total: 0,
            quantityInvoiced: 0,
            quantityRemaining: 1,
            amountInvoiced: 0,
            amountRemaining: 0,
        };
        setItems([...items, newItem]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
        const updated = [...items];
        (updated[index] as any)[field] = value;

        // Recalculate line total
        const qty = updated[index].quantity || 0;
        const price = updated[index].unitPrice || 0;
        const lineTotal = qty * price;
        updated[index].total = lineTotal;
        updated[index].quantityRemaining = qty;
        updated[index].amountRemaining = lineTotal;

        setItems(updated);
    };

    // ==========================================================================
    // VALIDATION
    // ==========================================================================

    const validateStep = (step: WizardStep): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        switch (step) {
            case 'customer':
                if (!customer.name && !customer.company) errors.push(t('order.validation.customerRequired') || 'Customer required');
                if (!customer.address) errors.push(t('order.validation.addressRequired') || 'Address required');
                if (!customer.city) errors.push(t('order.validation.cityRequired') || 'City required');
                if (!customer.country) errors.push(t('order.validation.countryRequired') || 'Country required');
                if (customerType === 'b2b' && isCrossBorder && !customer.vatId) {
                    errors.push(t('order.validation.vatIdRequired') || 'VAT ID required for cross-border B2B');
                }
                break;

            case 'items':
                if (items.length === 0) errors.push(t('order.validation.itemsRequired') || 'At least one item required');
                items.forEach((item, idx) => {
                    if (!item.description) errors.push(`${t('order.validation.descriptionRequired') || 'Description required'} (#${idx + 1})`);
                    if (!item.quantity || item.quantity <= 0) errors.push(`${t('order.validation.quantityPositive') || 'Quantity must be > 0'} (#${idx + 1})`);
                });
                break;

            case 'terms':
                if (!orderDate) errors.push(t('order.validation.dateRequired') || 'Order date required');
                break;

            case 'review':
                break;
        }

        return { valid: errors.length === 0, errors };
    };

    const stepValidation = validateStep(currentStep);

    // ==========================================================================
    // NAVIGATION
    // ==========================================================================

    const goNext = () => {
        if (!stepValidation.valid) return;
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < steps.length) {
            setCurrentStep(steps[nextIndex].id);
        }
    };

    const goBack = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(steps[prevIndex].id);
        }
    };

    // ==========================================================================
    // SUBMIT
    // ==========================================================================

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            // Build order data matching the exact Order interface
            const orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
                orderNumber: editOrder?.orderNumber || `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
                status: 'draft',
                customer,
                seller,
                customerType,
                isCrossBorder,
                items: items.map((item, idx) => ({
                    id: item.id || `item-${idx}`,
                    description: item.description || '',
                    quantity: item.quantity || 0,
                    unit: item.unit || 'piece',
                    unitPrice: item.unitPrice || 0,
                    taxRate: item.taxRate || 0,
                    total: (item.quantity || 0) * (item.unitPrice || 0),
                    quantityInvoiced: 0,
                    quantityRemaining: item.quantity || 0,
                    amountInvoiced: 0,
                    amountRemaining: (item.quantity || 0) * (item.unitPrice || 0),
                })),
                currency,
                subtotal: totals.subtotal,
                taxAmount: totals.taxAmount,
                total: totals.total,
                amountInvoiced: 0,
                amountRemaining: totals.total,
                invoiceIds: [],
                orderDate,
                deliveryDate: deliveryDate || undefined,
                servicePeriodStart: servicePeriodStart || undefined,
                servicePeriodEnd: servicePeriodEnd || undefined,
                isRecurring,
                recurringInterval: isRecurring ? recurringInterval : undefined,
                notes: notes || undefined,
                reference: reference || undefined,
            };

            let order: Order;
            if (editOrder) {
                updateOrder(editOrder.id, orderData);
                order = { ...editOrder, ...orderData, updatedAt: new Date().toISOString() };
            } else {
                order = createOrder(orderData);
            }

            onComplete(order);
        } catch (error) {
            console.error('Failed to create order:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==========================================================================
    // HELPERS
    // ==========================================================================

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const unitOptions = [
        { value: 'piece', label: t('order.unit.piece') || 'Piece' },
        { value: 'hour', label: t('order.unit.hour') || 'Hour' },
        { value: 'day', label: t('order.unit.day') || 'Day' },
        { value: 'month', label: t('order.unit.month') || 'Month' },
        { value: 'flat', label: t('order.unit.flat') || 'Flat Rate' },
    ];

    // ==========================================================================
    // RENDER
    // ==========================================================================

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-surface-950 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {editOrder ? (t('order.edit') || 'Edit Order') : (t('order.new') || 'New Order')}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {t('order.wizard.subtitle') || 'Create a new order step by step'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = step.id === currentStep;
                        const isCompleted = index < currentStepIndex;

                        return (
                            <React.Fragment key={step.id}>
                                <div className="flex items-center">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                            isCompleted
                                                ? 'bg-green-500 text-white'
                                                : isActive
                                                    ? 'bg-[var(--accent-primary)] text-white'
                                                    : 'bg-gray-200 dark:bg-surface-700 text-gray-500'
                                        }`}
                                    >
                                        {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                                    </div>
                                    <span
                                        className={`ml-3 text-sm font-medium hidden sm:block ${
                                            isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500'
                                        }`}
                                    >
                    {step.label}
                  </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`flex-1 h-0.5 mx-4 ${
                                            index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200 dark:bg-surface-700'
                                        }`}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Step Content */}
                <Card className="p-6 mb-6">
                    <AnimatePresence mode="wait">
                        {/* STEP 1: Customer */}
                        {currentStep === 'customer' && (
                            <motion.div
                                key="customer"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    {t('order.wizard.customerInfo') || 'Customer Information'}
                                </h2>

                                {/* Customer Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t('order.form.customerType') || 'Customer Type'}
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {(['b2b', 'b2c'] as CustomerType[]).map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setCustomerType(type)}
                                                className={`p-3 rounded-xl border-2 text-center transition-all ${
                                                    customerType === type
                                                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                                                        : 'border-gray-200 dark:border-surface-700 hover:border-gray-300'
                                                }`}
                                            >
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {type === 'b2b' ? (t('order.form.b2b') || 'Business (B2B)') : (t('order.form.b2c') || 'Consumer (B2C)')}
                        </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Customer Details */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {customerType === 'b2b' ? (t('order.form.company') || 'Company') : (t('order.form.name') || 'Name')} *
                                        </label>
                                        <input
                                            type="text"
                                            value={customerType === 'b2b' ? (customer.company || '') : customer.name}
                                            onChange={(e) => setCustomer({
                                                ...customer,
                                                [customerType === 'b2b' ? 'company' : 'name']: e.target.value
                                            })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                                        />
                                    </div>
                                    {customerType === 'b2b' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t('order.form.contactPerson') || 'Contact Person'}
                                            </label>
                                            <input
                                                type="text"
                                                value={customer.name}
                                                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {t('common.email') || 'Email'}
                                        </label>
                                        <input
                                            type="email"
                                            value={customer.email || ''}
                                            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                                        />
                                    </div>
                                    {customerType === 'b2b' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t('common.vatId') || 'VAT ID'} {isCrossBorder && '*'}
                                            </label>
                                            <input
                                                type="text"
                                                value={customer.vatId || ''}
                                                onChange={(e) => setCustomer({ ...customer, vatId: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t('common.address') || 'Address'} *
                                    </label>
                                    <input
                                        type="text"
                                        value={customer.address}
                                        onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                                    />
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {t('common.zipCode') || 'Postal Code'} *
                                        </label>
                                        <input
                                            type="text"
                                            value={customer.postalCode}
                                            onChange={(e) => setCustomer({ ...customer, postalCode: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {t('common.city') || 'City'} *
                                        </label>
                                        <input
                                            type="text"
                                            value={customer.city}
                                            onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {t('common.country') || 'Country'} *
                                        </label>
                                        <select
                                            value={customer.country}
                                            onChange={(e) => setCustomer({ ...customer, country: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                                        >
                                            {COUNTRIES.map((c) => (
                                                <option key={c.code} value={c.code}>{(c.name as Record<string, string>)[language] || (c.name as Record<string, string>).en}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Cross-border indicator */}
                                {isCrossBorder && (
                                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                        <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        <span className="text-sm text-blue-700 dark:text-blue-300">
                      {isIntraEU ? (t('order.form.intraEU') || 'Intra-EU Transaction') : (t('order.form.crossBorder') || 'Cross-Border Transaction')}
                                            {customerType === 'b2b' && customer.vatId && ' - Reverse Charge'}
                    </span>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* STEP 2: Items */}
                        {currentStep === 'items' && (
                            <motion.div
                                key="items"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {t('order.form.items') || 'Line Items'}
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        <label className="text-sm text-gray-600 dark:text-gray-400">
                                            {t('order.form.currency') || 'Currency'}:
                                        </label>
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
                                </div>

                                {/* Line Items */}
                                <div className="space-y-4">
                                    {items.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl border border-gray-200 dark:border-surface-700"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-gray-500">
                          {t('order.form.item') || 'Item'} #{index + 1}
                        </span>
                                                {items.length > 1 && (
                                                    <button
                                                        onClick={() => removeItem(index)}
                                                        className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                                                {/* Description */}
                                                <div className="sm:col-span-5">
                                                    <label className="block text-xs text-gray-500 mb-1">
                                                        {t('order.form.description') || 'Description'} *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={item.description}
                                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
                                                    />
                                                </div>

                                                {/* Quantity */}
                                                <div className="sm:col-span-2">
                                                    <label className="block text-xs text-gray-500 mb-1">
                                                        {t('order.form.quantity') || 'Qty'} *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={item.quantity || ''}
                                                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>

                                                {/* Unit */}
                                                <div className="sm:col-span-2">
                                                    <label className="block text-xs text-gray-500 mb-1">
                                                        {t('order.form.unit') || 'Unit'}
                                                    </label>
                                                    <select
                                                        value={item.unit}
                                                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
                                                    >
                                                        {unitOptions.map((u) => (
                                                            <option key={u.value} value={u.value}>{u.label}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Unit Price */}
                                                <div className="sm:col-span-2">
                                                    <label className="block text-xs text-gray-500 mb-1">
                                                        {t('order.form.unitPrice') || 'Price'} *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={item.unitPrice || ''}
                                                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>

                                                {/* Line Total */}
                                                <div className="sm:col-span-1">
                                                    <label className="block text-xs text-gray-500 mb-1">
                                                        {t('order.form.lineTotal') || 'Total'}
                                                    </label>
                                                    <div className="px-3 py-2 bg-gray-100 dark:bg-surface-600 rounded-lg text-sm font-medium text-right">
                                                        {formatCurrency(item.quantity * item.unitPrice)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tax Rate (for domestic orders) */}
                                            {!(customerType === 'b2b' && isCrossBorder) && (
                                                <div className="mt-3 flex items-center gap-4">
                                                    <label className="text-xs text-gray-500">
                                                        {t('order.form.taxRate') || 'Tax Rate'}:
                                                    </label>
                                                    <select
                                                        value={item.taxRate}
                                                        onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value))}
                                                        className="px-2 py-1 rounded border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
                                                    >
                                                        <option value={0}>0%</option>
                                                        <option value={7}>7%</option>
                                                        <option value={19}>19%</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Add Item Button */}
                                <button
                                    onClick={addItem}
                                    className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-surface-600 rounded-xl text-gray-500 hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} />
                                    {t('order.form.addItem') || 'Add Item'}
                                </button>

                                {/* Totals */}
                                <div className="border-t border-gray-200 dark:border-surface-700 pt-4">
                                    <div className="flex justify-end">
                                        <div className="w-64 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">{t('order.form.subtotal') || 'Subtotal'}</span>
                                                <span className="text-gray-900 dark:text-white">{formatCurrency(totals.subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">{t('order.form.tax') || 'Tax'}</span>
                                                <span className="text-gray-900 dark:text-white">{formatCurrency(totals.taxAmount)}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold text-lg border-t border-gray-200 dark:border-surface-700 pt-2">
                                                <span className="text-gray-900 dark:text-white">{t('order.form.total') || 'Total'}</span>
                                                <span className="text-[var(--accent-primary)]">{formatCurrency(totals.total)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: Terms */}
                        {currentStep === 'terms' && (
                            <motion.div
                                key="terms"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    {t('order.form.terms') || 'Terms & Conditions'}
                                </h2>

                                {/* Dates */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {t('order.form.orderDate') || 'Order Date'} *
                                        </label>
                                        <input
                                            type="date"
                                            value={orderDate}
                                            onChange={(e) => setOrderDate(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {t('order.form.expectedDelivery') || 'Expected Delivery'}
                                        </label>
                                        <input
                                            type="date"
                                            value={deliveryDate}
                                            onChange={(e) => setDeliveryDate(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {t('order.form.paymentDays') || 'Payment Terms'}
                                        </label>
                                        <select
                                            value={paymentDays}
                                            onChange={(e) => setPaymentDays(parseInt(e.target.value))}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                                        >
                                            <option value={7}>Net 7</option>
                                            <option value={14}>Net 14</option>
                                            <option value={30}>Net 30</option>
                                            <option value={45}>Net 45</option>
                                            <option value={60}>Net 60</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Service Period */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t('order.form.servicePeriod') || 'Service Period'}
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="date"
                                            value={servicePeriodStart}
                                            onChange={(e) => setServicePeriodStart(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                                        />
                                        <input
                                            type="date"
                                            value={servicePeriodEnd}
                                            onChange={(e) => setServicePeriodEnd(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                                        />
                                    </div>
                                </div>

                                {/* Reference */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t('order.form.customerPO') || 'Customer PO / Reference'}
                                    </label>
                                    <input
                                        type="text"
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                                    />
                                </div>

                                {/* Recurring */}
                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isRecurring}
                                            onChange={(e) => setIsRecurring(e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-[var(--accent-primary)]"
                                        />
                                        <span className="font-medium text-gray-900 dark:text-white">
                      {t('order.form.isRecurring') || 'This is a recurring order'}
                    </span>
                                    </label>

                                    {isRecurring && (
                                        <div className="mt-4 ml-8">
                                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                {t('order.form.recurringInterval') || 'Interval'}
                                            </label>
                                            <select
                                                value={recurringInterval}
                                                onChange={(e) => setRecurringInterval(e.target.value as typeof recurringInterval)}
                                                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700"
                                            >
                                                <option value="weekly">{t('order.form.weekly') || 'Weekly'}</option>
                                                <option value="monthly">{t('order.form.monthly') || 'Monthly'}</option>
                                                <option value="quarterly">{t('order.form.quarterly') || 'Quarterly'}</option>
                                                <option value="yearly">{t('order.form.annually') || 'Yearly'}</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t('order.form.internalNotes') || 'Notes'}
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: Review */}
                        {currentStep === 'review' && (
                            <motion.div
                                key="review"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    {t('order.wizard.review') || 'Review Order'}
                                </h2>

                                {/* Customer Summary */}
                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">{t('order.form.customer') || 'Customer'}</h3>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {customer.company || customer.name}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {customer.address}, {customer.postalCode} {customer.city}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {(() => {
                                            const country = COUNTRIES.find(c => c.code === customer.country);
                                            return country ? (country.name as Record<string, string>)[language] || (country.name as Record<string, string>).en : customer.country;
                                        })()}
                                    </p>
                                    {customer.vatId && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">VAT: {customer.vatId}</p>
                                    )}
                                    {isCrossBorder && (
                                        <Badge variant="info" size="sm" className="mt-2">
                                            {isIntraEU ? 'Intra-EU' : 'Export'}
                                        </Badge>
                                    )}
                                </div>

                                {/* Items Summary */}
                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <h3 className="text-sm font-medium text-gray-500 mb-3">{t('order.form.items') || 'Items'}</h3>
                                    <div className="space-y-2">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">
                          {item.quantity} x {item.description}
                        </span>
                                                <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-gray-200 dark:border-surface-600 mt-3 pt-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">{t('order.form.subtotal') || 'Subtotal'}</span>
                                            <span>{formatCurrency(totals.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">{t('order.form.tax') || 'Tax'}</span>
                                            <span>{formatCurrency(totals.taxAmount)}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold text-lg mt-2">
                                            <span>{t('order.form.total') || 'Total'}</span>
                                            <span className="text-[var(--accent-primary)]">{formatCurrency(totals.total)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Terms Summary */}
                                <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">{t('order.form.terms') || 'Terms'}</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">{t('order.form.orderDate') || 'Order Date'}:</span>
                                            <span className="ml-2 text-gray-900 dark:text-white">{orderDate}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">{t('order.form.paymentTerms') || 'Payment'}:</span>
                                            <span className="ml-2 text-gray-900 dark:text-white">Net {paymentDays}</span>
                                        </div>
                                        {deliveryDate && (
                                            <div>
                                                <span className="text-gray-500">{t('order.form.expectedDelivery') || 'Delivery'}:</span>
                                                <span className="ml-2 text-gray-900 dark:text-white">{deliveryDate}</span>
                                            </div>
                                        )}
                                        {isRecurring && (
                                            <div>
                                                <span className="text-gray-500">{t('order.form.recurring') || 'Recurring'}:</span>
                                                <span className="ml-2 text-gray-900 dark:text-white capitalize">{recurringInterval}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>

                {/* Validation Errors */}
                {!stepValidation.valid && stepValidation.errors.length > 0 && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                {stepValidation.errors.map((error, idx) => (
                                    <p key={idx} className="text-sm text-red-700 dark:text-red-300">{error}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={goBack}
                        disabled={currentStepIndex === 0}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={18} />
                        {t('common.back') || 'Back'}
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg"
                        >
                            {t('common.cancel') || 'Cancel'}
                        </button>

                        {currentStep === 'review' ? (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                            >
                                <Save size={18} />
                                {isSubmitting ? (t('common.processing') || 'Processing...') : (editOrder ? (t('order.update') || 'Update Order') : (t('order.create') || 'Create Order'))}
                            </button>
                        ) : (
                            <button
                                onClick={goNext}
                                disabled={!stepValidation.valid}
                                className="flex items-center gap-2 px-6 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('common.next') || 'Next'}
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
// HELPER FUNCTIONS
// =============================================================================

function isEUCountry(code: string): boolean {
    const euCountries = [
        'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
        'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
        'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
    ];
    return euCountries.includes(code);
}

export default OrderCreationWizard;