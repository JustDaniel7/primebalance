'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    X,
    CreditCard,
    DollarSign,
    Calendar,
    FileText,
    AlertCircle,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useInvoiceStore } from '@/store/invoice-store';
import { useThemeStore } from '@/store/theme-store';
import { Invoice, PaymentMethod, ApplyPaymentRequest } from '@/types/invoice';

// =============================================================================
// TYPES
// =============================================================================

interface PaymentModalProps {
    invoice: Invoice;
    onClose: () => void;
    onSuccess?: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const PAYMENT_METHODS = [
    { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer', icon: '🏦' },
    { value: PaymentMethod.CREDIT_CARD, label: 'Credit Card', icon: '💳' },
    { value: PaymentMethod.DIRECT_DEBIT, label: 'Direct Debit', icon: '🔄' },
    { value: PaymentMethod.CASH, label: 'Cash', icon: '💵' },
    { value: PaymentMethod.CHECK, label: 'Check', icon: '📝' },
    { value: PaymentMethod.PAYPAL, label: 'PayPal', icon: '🅿️' },
    { value: PaymentMethod.OTHER, label: 'Other', icon: '📋' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function PaymentModal({ invoice, onClose, onSuccess }: PaymentModalProps) {
    const { t } = useThemeStore();
    const { applyPayment, isLoading, error } = useInvoiceStore();

    const [amount, setAmount] = useState(invoice.outstandingAmount);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK_TRANSFER);
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [transactionRef, setTransactionRef] = useState('');

    // Format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: invoice.currency,
        }).format(value);
    };

    // Handle submit
    const handleSubmit = async () => {
        if (amount <= 0 || amount > invoice.outstandingAmount) {
            return;
        }

        const paymentData: ApplyPaymentRequest = {
            amount,
            paymentDate,
            paymentMethod,
            reference: reference || undefined,
            bankAccount: bankAccount || undefined,
            transactionRef: transactionRef || undefined,
            notes: notes || undefined,
        };

        const success = await applyPayment(invoice.id, paymentData);

        if (success) {
            onSuccess?.();
            onClose();
        }
    };

    // Quick amount buttons
    const quickAmounts = [
        { label: 'Full Amount', value: invoice.outstandingAmount },
        { label: '50%', value: invoice.outstandingAmount * 0.5 },
        { label: '25%', value: invoice.outstandingAmount * 0.25 },
    ];

    return (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-white dark:bg-surface-900 rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-surface-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CreditCard size={20} className="text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Record Payment
                            </h2>
                            <p className="text-sm text-gray-500">
                                {invoice.invoiceNumber}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
                            <AlertCircle size={18} className="text-red-500" />
                            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                        </div>
                    )}

                    {/* Invoice Summary */}
                    <Card className="p-4 bg-gray-50 dark:bg-surface-800">
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-500">Invoice Total</span>
                            <span className="font-medium">{formatCurrency(invoice.total)}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-500">Already Paid</span>
                            <span className="font-medium text-green-600">{formatCurrency(invoice.paidAmount)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-surface-600">
                            <span className="font-medium">Outstanding</span>
                            <span className="font-bold text-amber-600">{formatCurrency(invoice.outstandingAmount)}</span>
                        </div>
                    </Card>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Payment Amount *
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                min="0.01"
                                max={invoice.outstandingAmount}
                                step="0.01"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white text-lg font-mono"
                            />
                        </div>

                        {/* Quick amounts */}
                        <div className="flex gap-2 mt-2">
                            {quickAmounts.map((qa) => (
                                <button
                                    key={qa.label}
                                    onClick={() => setAmount(Math.round(qa.value * 100) / 100)}
                                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                        amount === Math.round(qa.value * 100) / 100
                                            ? 'bg-[var(--accent-primary)] text-white'
                                            : 'bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                                    }`}
                                >
                                    {qa.label}
                                </button>
                            ))}
                        </div>

                        {amount > invoice.outstandingAmount && (
                            <p className="text-sm text-red-500 mt-1">
                                Amount exceeds outstanding balance
                            </p>
                        )}
                    </div>

                    {/* Payment Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Payment Date *
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                            />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Payment Method *
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {PAYMENT_METHODS.slice(0, 4).map((method) => (
                                <button
                                    key={method.value}
                                    onClick={() => setPaymentMethod(method.value)}
                                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                                        paymentMethod === method.value
                                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                            : 'border-gray-200 dark:border-surface-700 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="text-2xl">{method.icon}</span>
                                    <p className="text-xs mt-1 truncate">{method.label}</p>
                                </button>
                            ))}
                        </div>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm"
                        >
                            {PAYMENT_METHODS.map((method) => (
                                <option key={method.value} value={method.value}>
                                    {method.icon} {method.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Reference */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Reference
                            </label>
                            <input
                                type="text"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                placeholder="Payment reference"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Transaction ID
                            </label>
                            <input
                                type="text"
                                value={transactionRef}
                                onChange={(e) => setTransactionRef(e.target.value)}
                                placeholder="Bank transaction ID"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Optional notes..."
                            rows={2}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-800">
                    <div>
                        <p className="text-sm text-gray-500">Recording payment of</p>
                        <p className="text-xl font-bold text-[var(--accent-primary)]">
                            {formatCurrency(amount)}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={isLoading || amount <= 0 || amount > invoice.outstandingAmount || !paymentDate}
                            leftIcon={<CreditCard size={18} />}
                        >
                            {isLoading ? 'Processing...' : 'Record Payment'}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default PaymentModal;