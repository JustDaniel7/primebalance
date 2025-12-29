'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Save,
    Plus,
    Trash2,
    Calculator,
    User,
    Calendar,
    FileText,
    Building2,
    CreditCard,
    ChevronRight,
    ChevronLeft,
    AlertCircle,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useInvoiceStore } from '@/store/invoice-store';
import { useThemeStore } from '@/store/theme-store';
import {
    Invoice,
    InvoiceStatus,
    InvoiceLineItem,
    CreateInvoiceRequest,
    UpdateInvoiceRequest,
    PaymentTerms,
    TaxClassification,
    Address,
    BankDetails,
} from '@/types/invoice';

// =============================================================================
// TYPES
// =============================================================================

interface InvoiceFormProps {
    invoice?: Invoice;
    orderId?: string;
    onClose: () => void;
    onSuccess?: (invoice: Invoice) => void;
}

interface LineItemFormData {
    id: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    taxRate: number;
    discountPercent?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const PAYMENT_TERMS_OPTIONS = [
    { value: PaymentTerms.DUE_ON_RECEIPT, label: 'Due on Receipt' },
    { value: PaymentTerms.NET_7, label: 'Net 7' },
    { value: PaymentTerms.NET_14, label: 'Net 14' },
    { value: PaymentTerms.NET_30, label: 'Net 30' },
    { value: PaymentTerms.NET_45, label: 'Net 45' },
    { value: PaymentTerms.NET_60, label: 'Net 60' },
    { value: PaymentTerms.NET_90, label: 'Net 90' },
];

const TAX_CLASSIFICATION_OPTIONS = [
    { value: TaxClassification.STANDARD, label: 'Standard Rate' },
    { value: TaxClassification.REDUCED, label: 'Reduced Rate' },
    { value: TaxClassification.ZERO, label: 'Zero Rate' },
    { value: TaxClassification.EXEMPT, label: 'Exempt' },
    { value: TaxClassification.REVERSE_CHARGE, label: 'Reverse Charge' },
];

const CURRENCY_OPTIONS = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD'];

const WIZARD_STEPS = [
    { id: 'customer', label: 'Customer', icon: User },
    { id: 'items', label: 'Line Items', icon: FileText },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'review', label: 'Review', icon: Calculator },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function InvoiceForm({ invoice, orderId, onClose, onSuccess }: InvoiceFormProps) {
    const { t } = useThemeStore();
    const { createInvoice, updateInvoice, createFromOrder, isLoading, error } = useInvoiceStore();

    const isEditing = !!invoice;
    const isReadOnly = isEditing && invoice.status !== InvoiceStatus.DRAFT;

    // Wizard state
    const [step, setStep] = useState(0);

    // Form state
    const [customerName, setCustomerName] = useState(invoice?.customerName || '');
    const [customerEmail, setCustomerEmail] = useState(invoice?.customerEmail || '');
    const [customerTaxId, setCustomerTaxId] = useState(invoice?.customerTaxId || '');
    const [customerAddress, setCustomerAddress] = useState<Address>(
        (invoice?.customerAddress as Address) || {
            street: '',
            city: '',
            postalCode: '',
            country: '',
            countryCode: '',
        }
    );

    const [invoiceDate, setInvoiceDate] = useState(
        invoice?.invoiceDate?.split('T')[0] || new Date().toISOString().split('T')[0]
    );
    const [dueDate, setDueDate] = useState(
        invoice?.dueDate?.split('T')[0] || ''
    );
    const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>(
        (invoice?.paymentTerms as PaymentTerms) || PaymentTerms.NET_30
    );

    const [currency, setCurrency] = useState(invoice?.currency || 'EUR');
    const [taxRate, setTaxRate] = useState(invoice?.taxRate || 19);
    const [taxClassification, setTaxClassification] = useState<TaxClassification>(
        (invoice?.taxClassification as TaxClassification) || TaxClassification.STANDARD
    );

    const [items, setItems] = useState<LineItemFormData[]>(
        invoice?.items?.map((item, idx) => ({
            id: item.id || `item_${idx}`,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            discountPercent: item.discountPercent,
        })) || [
            { id: 'item_1', description: '', quantity: 1, unit: 'pcs', unitPrice: 0, taxRate: 19 },
        ]
    );

    const [notes, setNotes] = useState(invoice?.notes || '');
    const [internalNotes, setInternalNotes] = useState(invoice?.internalNotes || '');
    const [reference, setReference] = useState(invoice?.reference || '');
    const [poNumber, setPoNumber] = useState(invoice?.poNumber || '');

    const [bankDetails, setBankDetails] = useState<BankDetails>(
        (invoice?.bankDetails as BankDetails) || {
            bankName: '',
            accountName: '',
            iban: '',
            bic: '',
        }
    );

    // Calculate due date from payment terms
    useEffect(() => {
        if (invoiceDate && !isEditing) {
            const date = new Date(invoiceDate);
            let days = 30;

            switch (paymentTerms) {
                case PaymentTerms.DUE_ON_RECEIPT: days = 0; break;
                case PaymentTerms.NET_7: days = 7; break;
                case PaymentTerms.NET_14: days = 14; break;
                case PaymentTerms.NET_30: days = 30; break;
                case PaymentTerms.NET_45: days = 45; break;
                case PaymentTerms.NET_60: days = 60; break;
                case PaymentTerms.NET_90: days = 90; break;
            }

            date.setDate(date.getDate() + days);
            setDueDate(date.toISOString().split('T')[0]);
        }
    }, [invoiceDate, paymentTerms, isEditing]);

    // Calculate totals
    const totals = useMemo(() => {
        let subtotal = 0;
        let totalTax = 0;

        items.forEach((item) => {
            const lineSubtotal = item.quantity * item.unitPrice;
            const discount = item.discountPercent ? lineSubtotal * (item.discountPercent / 100) : 0;
            const taxableAmount = lineSubtotal - discount;
            const lineTax = taxableAmount * (item.taxRate / 100);

            subtotal += taxableAmount;
            totalTax += lineTax;
        });

        return {
            subtotal: Math.round(subtotal * 100) / 100,
            taxAmount: Math.round(totalTax * 100) / 100,
            total: Math.round((subtotal + totalTax) * 100) / 100,
        };
    }, [items]);

    // Validation
    const validateStep = (stepIndex: number): boolean => {
        switch (stepIndex) {
            case 0: // Customer
                return customerName.trim().length > 0;
            case 1: // Items
                return items.length > 0 && items.every(
                    (item) => item.description.trim().length > 0 && item.quantity > 0
                );
            case 2: // Payment
                return !!invoiceDate && !!dueDate;
            case 3: // Review
                return true;
            default:
                return true;
        }
    };

    const canProceed = validateStep(step);

    // Line item handlers
    const addLineItem = () => {
        setItems([
            ...items,
            {
                id: `item_${Date.now()}`,
                description: '',
                quantity: 1,
                unit: 'pcs',
                unitPrice: 0,
                taxRate,
            },
        ]);
    };

    const updateLineItem = (id: string, field: keyof LineItemFormData, value: string | number) => {
        setItems(items.map((item) =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const removeLineItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter((item) => item.id !== id));
        }
    };

    // Submit handler
    const handleSubmit = async () => {
        const invoiceData: CreateInvoiceRequest = {
            customerName,
            customerEmail: customerEmail || undefined,
            customerTaxId: customerTaxId || undefined,
            customerAddress: customerAddress.street ? customerAddress : undefined,
            invoiceDate,
            dueDate,
            currency,
            taxRate,
            taxClassification,
            paymentTerms,
            items: items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate,
                discountPercent: item.discountPercent,
            })),
            bankDetails: bankDetails.iban ? bankDetails : undefined,
            reference: reference || undefined,
            poNumber: poNumber || undefined,
            notes: notes || undefined,
            internalNotes: internalNotes || undefined,
        };

        let result: Invoice | null = null;

        if (orderId) {
            result = await createFromOrder(orderId, { taxRate, paymentTerms });
        } else if (isEditing) {
            result = await updateInvoice(invoice.id, invoiceData as UpdateInvoiceRequest);
        } else {
            result = await createInvoice(invoiceData);
        }

        if (result) {
            onSuccess?.(result);
            onClose();
        }
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    return (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-surface-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-surface-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {isEditing ? `Edit Invoice ${invoice.invoiceNumber}` : 'New Invoice'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {isReadOnly
                                ? 'This invoice is read-only (already confirmed)'
                                : 'Fill in the details to create your invoice'
                            }
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-surface-700">
                    <div className="flex items-center justify-between">
                        {WIZARD_STEPS.map((s, index) => {
                            const Icon = s.icon;
                            const isActive = step === index;
                            const isCompleted = step > index;
                            const isClickable = index <= step || validateStep(index - 1);

                            return (
                                <React.Fragment key={s.id}>
                                    <button
                                        onClick={() => isClickable && setStep(index)}
                                        disabled={!isClickable}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                                            isActive
                                                ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                                                : isCompleted
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-gray-400'
                                        } ${isClickable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-surface-800' : 'cursor-not-allowed'}`}
                                    >
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                isCompleted
                                                    ? 'bg-green-500 text-white'
                                                    : isActive
                                                        ? 'bg-[var(--accent-primary)] text-white'
                                                        : 'bg-gray-200 dark:bg-surface-700'
                                            }`}
                                        >
                                            <Icon size={16} />
                                        </div>
                                        <span className="text-sm font-medium hidden sm:block">{s.label}</span>
                                    </button>
                                    {index < WIZARD_STEPS.length - 1 && (
                                        <div
                                            className={`flex-1 h-0.5 mx-2 ${
                                                step > index ? 'bg-green-500' : 'bg-gray-200 dark:bg-surface-700'
                                            }`}
                                        />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                            <AlertCircle className="text-red-500" size={20} />
                            <span className="text-red-700 dark:text-red-300">{error}</span>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {/* Step 0: Customer */}
                        {step === 0 && (
                            <motion.div
                                key="customer"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Customer Information
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Customer Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                disabled={isReadOnly}
                                                placeholder="Enter customer name"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white disabled:opacity-50"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={customerEmail}
                                                onChange={(e) => setCustomerEmail(e.target.value)}
                                                disabled={isReadOnly}
                                                placeholder="customer@example.com"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Tax ID / VAT Number
                                            </label>
                                            <input
                                                type="text"
                                                value={customerTaxId}
                                                onChange={(e) => setCustomerTaxId(e.target.value)}
                                                disabled={isReadOnly}
                                                placeholder="DE123456789"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Address
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <input
                                                type="text"
                                                value={customerAddress.street}
                                                onChange={(e) => setCustomerAddress({ ...customerAddress, street: e.target.value })}
                                                disabled={isReadOnly}
                                                placeholder="Street address"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                            />
                                        </div>

                                        <div>
                                            <input
                                                type="text"
                                                value={customerAddress.postalCode}
                                                onChange={(e) => setCustomerAddress({ ...customerAddress, postalCode: e.target.value })}
                                                disabled={isReadOnly}
                                                placeholder="Postal code"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                            />
                                        </div>

                                        <div>
                                            <input
                                                type="text"
                                                value={customerAddress.city}
                                                onChange={(e) => setCustomerAddress({ ...customerAddress, city: e.target.value })}
                                                disabled={isReadOnly}
                                                placeholder="City"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <input
                                                type="text"
                                                value={customerAddress.country}
                                                onChange={(e) => setCustomerAddress({ ...customerAddress, country: e.target.value })}
                                                disabled={isReadOnly}
                                                placeholder="Country"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 1: Line Items */}
                        {step === 1 && (
                            <motion.div
                                key="items"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Line Items
                                    </h3>

                                    <div className="flex items-center gap-4">
                                        <div>
                                            <label className="text-sm text-gray-500 mr-2">Currency:</label>
                                            <select
                                                value={currency}
                                                onChange={(e) => setCurrency(e.target.value)}
                                                disabled={isReadOnly}
                                                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm"
                                            >
                                                {CURRENCY_OPTIONS.map((c) => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-sm text-gray-500 mr-2">Default Tax:</label>
                                            <input
                                                type="number"
                                                value={taxRate}
                                                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                                disabled={isReadOnly}
                                                className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm"
                                            />
                                            <span className="text-sm text-gray-500 ml-1">%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {items.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl space-y-3"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        value={item.description}
                                                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                                        disabled={isReadOnly}
                                                        placeholder="Item description"
                                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700"
                                                    />
                                                </div>

                                                {!isReadOnly && (
                                                    <button
                                                        onClick={() => removeLineItem(item.id)}
                                                        disabled={items.length === 1}
                                                        className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                <div>
                                                    <label className="text-xs text-gray-500 mb-1 block">Quantity</label>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                        disabled={isReadOnly}
                                                        min="0"
                                                        step="0.01"
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs text-gray-500 mb-1 block">Unit</label>
                                                    <select
                                                        value={item.unit}
                                                        onChange={(e) => updateLineItem(item.id, 'unit', e.target.value)}
                                                        disabled={isReadOnly}
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
                                                    >
                                                        <option value="pcs">pcs</option>
                                                        <option value="hrs">hrs</option>
                                                        <option value="days">days</option>
                                                        <option value="kg">kg</option>
                                                        <option value="m">m</option>
                                                        <option value="l">l</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="text-xs text-gray-500 mb-1 block">Unit Price</label>
                                                    <input
                                                        type="number"
                                                        value={item.unitPrice}
                                                        onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                        disabled={isReadOnly}
                                                        min="0"
                                                        step="0.01"
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs text-gray-500 mb-1 block">Tax %</label>
                                                    <input
                                                        type="number"
                                                        value={item.taxRate}
                                                        onChange={(e) => updateLineItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)}
                                                        disabled={isReadOnly}
                                                        min="0"
                                                        max="100"
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs text-gray-500 mb-1 block">Line Total</label>
                                                    <div className="px-3 py-2 bg-gray-100 dark:bg-surface-600 rounded-lg text-sm font-medium">
                                                        {formatCurrency(item.quantity * item.unitPrice * (1 + item.taxRate / 100))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {!isReadOnly && (
                                    <Button
                                        variant="secondary"
                                        onClick={addLineItem}
                                        leftIcon={<Plus size={18} />}
                                        className="w-full"
                                    >
                                        Add Line Item
                                    </Button>
                                )}

                                {/* Totals */}
                                <div className="p-4 bg-[var(--accent-primary)]/5 rounded-xl">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                                        <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-600 dark:text-gray-400">Tax</span>
                                        <span className="font-medium">{formatCurrency(totals.taxAmount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-surface-600">
                                        <span className="text-lg font-semibold">Total</span>
                                        <span className="text-lg font-bold text-[var(--accent-primary)]">
                      {formatCurrency(totals.total)}
                    </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Payment */}
                        {step === 2 && (
                            <motion.div
                                key="payment"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Payment Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Invoice Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={invoiceDate}
                                            onChange={(e) => setInvoiceDate(e.target.value)}
                                            disabled={isReadOnly}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Payment Terms
                                        </label>
                                        <select
                                            value={paymentTerms}
                                            onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)}
                                            disabled={isReadOnly}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                        >
                                            {PAYMENT_TERMS_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Due Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            disabled={isReadOnly}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Tax Classification
                                        </label>
                                        <select
                                            value={taxClassification}
                                            onChange={(e) => setTaxClassification(e.target.value as TaxClassification)}
                                            disabled={isReadOnly}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                        >
                                            {TAX_CLASSIFICATION_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Bank Details (for payment)
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm text-gray-500 mb-1 block">Bank Name</label>
                                            <input
                                                type="text"
                                                value={bankDetails.bankName}
                                                onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                                disabled={isReadOnly}
                                                placeholder="Bank name"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm text-gray-500 mb-1 block">Account Name</label>
                                            <input
                                                type="text"
                                                value={bankDetails.accountName}
                                                onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                                                disabled={isReadOnly}
                                                placeholder="Account holder name"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm text-gray-500 mb-1 block">IBAN</label>
                                            <input
                                                type="text"
                                                value={bankDetails.iban}
                                                onChange={(e) => setBankDetails({ ...bankDetails, iban: e.target.value })}
                                                disabled={isReadOnly}
                                                placeholder="DE89 3704 0044 0532 0130 00"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm text-gray-500 mb-1 block">BIC/SWIFT</label>
                                            <input
                                                type="text"
                                                value={bankDetails.bic}
                                                onChange={(e) => setBankDetails({ ...bankDetails, bic: e.target.value })}
                                                disabled={isReadOnly}
                                                placeholder="COBADEFFXXX"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Reference
                                        </label>
                                        <input
                                            type="text"
                                            value={reference}
                                            onChange={(e) => setReference(e.target.value)}
                                            disabled={isReadOnly}
                                            placeholder="Your reference"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            PO Number
                                        </label>
                                        <input
                                            type="text"
                                            value={poNumber}
                                            onChange={(e) => setPoNumber(e.target.value)}
                                            disabled={isReadOnly}
                                            placeholder="Customer PO number"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Review */}
                        {step === 3 && (
                            <motion.div
                                key="review"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Review Invoice
                                </h3>

                                {/* Customer Summary */}
                                <Card className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <User size={18} className="text-gray-400" />
                                        <h4 className="font-medium">Customer</h4>
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <p className="font-medium text-gray-900 dark:text-white">{customerName}</p>
                                        {customerEmail && <p className="text-gray-500">{customerEmail}</p>}
                                        {customerAddress.street && (
                                            <p className="text-gray-500">
                                                {customerAddress.street}, {customerAddress.postalCode} {customerAddress.city}
                                            </p>
                                        )}
                                    </div>
                                </Card>

                                {/* Items Summary */}
                                <Card className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FileText size={18} className="text-gray-400" />
                                        <h4 className="font-medium">Items ({items.length})</h4>
                                    </div>
                                    <div className="space-y-2">
                                        {items.map((item) => (
                                            <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {item.quantity} x {item.description}
                        </span>
                                                <span className="font-medium">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                {/* Payment Summary */}
                                <Card className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Calendar size={18} className="text-gray-400" />
                                        <h4 className="font-medium">Payment</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500">Invoice Date</p>
                                            <p className="font-medium">{new Date(invoiceDate).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Due Date</p>
                                            <p className="font-medium">{new Date(dueDate).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Payment Terms</p>
                                            <p className="font-medium">
                                                {PAYMENT_TERMS_OPTIONS.find((o) => o.value === paymentTerms)?.label}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Currency</p>
                                            <p className="font-medium">{currency}</p>
                                        </div>
                                    </div>
                                </Card>

                                {/* Totals Summary */}
                                <Card className="p-4 bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/20">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Tax ({taxRate}%)</span>
                                            <span className="font-medium">{formatCurrency(totals.taxAmount)}</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-surface-600">
                                            <span className="text-lg font-semibold">Total</span>
                                            <span className="text-xl font-bold text-[var(--accent-primary)]">
                        {formatCurrency(totals.total)}
                      </span>
                                        </div>
                                    </div>
                                </Card>

                                {/* Notes */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Notes (visible on invoice)
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            disabled={isReadOnly}
                                            rows={3}
                                            placeholder="Thank you for your business..."
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Internal Notes (not visible)
                                        </label>
                                        <textarea
                                            value={internalNotes}
                                            onChange={(e) => setInternalNotes(e.target.value)}
                                            disabled={isReadOnly}
                                            rows={3}
                                            placeholder="Internal notes..."
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 resize-none"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-surface-700">
                    <div className="text-sm text-gray-500">
                        {isEditing && (
                            <Badge variant={invoice.status === InvoiceStatus.DRAFT ? 'warning' : 'info'}>
                                {invoice.status.toUpperCase()}
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {step > 0 && (
                            <Button
                                variant="secondary"
                                onClick={() => setStep(step - 1)}
                                leftIcon={<ChevronLeft size={18} />}
                            >
                                Back
                            </Button>
                        )}

                        {step < WIZARD_STEPS.length - 1 ? (
                            <Button
                                variant="primary"
                                onClick={() => setStep(step + 1)}
                                disabled={!canProceed}
                                rightIcon={<ChevronRight size={18} />}
                            >
                                Next
                            </Button>
                        ) : (
                            !isReadOnly && (
                                <Button
                                    variant="primary"
                                    onClick={handleSubmit}
                                    disabled={isLoading || !canProceed}
                                    leftIcon={<Save size={18} />}
                                >
                                    {isLoading ? 'Saving...' : isEditing ? 'Update Invoice' : 'Create Invoice'}
                                </Button>
                            )
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default InvoiceForm;