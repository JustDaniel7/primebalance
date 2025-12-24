'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    X,
    Edit,
    Send,
    CheckCircle,
    XCircle,
    CreditCard,
    Archive,
    Download,
    Printer,
    History,
    FileText,
    User,
    Calendar,
    Building2,
    Clock,
    DollarSign,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    ExternalLink,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useInvoiceStore } from '@/store/invoice-store';
import { useThemeStore } from '@/store/theme-store';
import {
    Invoice,
    InvoiceStatus,
    InvoicePayment,
    InvoiceAccountingEvent,
    InvoiceVersion,
    InvoiceLineItem,
} from '@/types/invoice';

// =============================================================================
// TYPES
// =============================================================================

interface InvoiceDetailProps {
    invoice: Invoice;
    onClose: () => void;
    onEdit?: () => void;
    onPayment?: () => void;
    onRefresh?: () => void;
}

// =============================================================================
// STATUS CONFIG
// =============================================================================

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    draft: { label: 'Draft', color: 'text-gray-700', bgColor: 'bg-gray-100' },
    confirmed: { label: 'Confirmed', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    sent: { label: 'Sent', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
    partially_paid: { label: 'Partially Paid', color: 'text-amber-700', bgColor: 'bg-amber-100' },
    paid: { label: 'Paid', color: 'text-green-700', bgColor: 'bg-green-100' },
    overdue: { label: 'Overdue', color: 'text-red-700', bgColor: 'bg-red-100' },
    cancelled: { label: 'Cancelled', color: 'text-gray-500', bgColor: 'bg-gray-100' },
    archived: { label: 'Archived', color: 'text-slate-600', bgColor: 'bg-slate-100' },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function InvoiceDetail({ invoice, onClose, onEdit, onPayment, onRefresh }: InvoiceDetailProps) {
    const { t } = useThemeStore();
    const { fetchInvoice, confirmInvoice, sendInvoice, loading } = useInvoiceStore();

    const [activeTab, setActiveTab] = useState<'details' | 'payments' | 'history' | 'events'>('details');
    const [versions, setVersions] = useState<InvoiceVersion[]>([]);
    const [payments, setPayments] = useState<InvoicePayment[]>([]);
    const [events, setEvents] = useState<InvoiceAccountingEvent[]>([]);
    const [showAllItems, setShowAllItems] = useState(false);

    // Fetch full details
    useEffect(() => {
        const loadDetails = async () => {
            await fetchInvoice(invoice.id, {
                includeVersions: true,
                includeEvents: true,
                includePayments: true,
            });
        };
        loadDetails();
    }, [invoice.id]);

    // Get full invoice from store after fetch
    const { currentInvoice, versions: storeVersions, payments: storePayments, accountingEvents } = useInvoiceStore();

    useEffect(() => {
        if (storeVersions) setVersions(storeVersions);
        if (storePayments) setPayments(storePayments);
        if (accountingEvents) setEvents(accountingEvents);
    }, [storeVersions, storePayments, accountingEvents]);

    const displayInvoice = currentInvoice?.id === invoice.id ? currentInvoice : invoice;
    const items = (displayInvoice.items || []) as InvoiceLineItem[];
    const statusConfig = STATUS_CONFIG[displayInvoice.status] || STATUS_CONFIG.draft;

    // Format currency
    const formatCurrency = (amount: number, currency: string = displayInvoice.currency) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Format datetime
    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Check if can perform actions
    const canEdit = displayInvoice.status === InvoiceStatus.DRAFT;
    const canConfirm = displayInvoice.status === InvoiceStatus.DRAFT;
    const canSend = displayInvoice.status === InvoiceStatus.CONFIRMED;
    const canPay = [InvoiceStatus.CONFIRMED, InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE].includes(displayInvoice.status as InvoiceStatus);

    // Handle actions
    const handleConfirm = async () => {
        const success = await confirmInvoice(displayInvoice.id);
        if (success && onRefresh) {
            onRefresh();
        }
    };

    const handleSend = async () => {
        const success = await sendInvoice(displayInvoice.id);
        if (success && onRefresh) {
            onRefresh();
        }
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
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
                            <FileText size={24} className="text-[var(--accent-primary)]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {displayInvoice.invoiceNumber}
                                </h2>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {displayInvoice.customerName} • Version {displayInvoice.version}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {canEdit && onEdit && (
                            <Button variant="secondary" size="sm" onClick={onEdit} leftIcon={<Edit size={16} />}>
                                Edit
                            </Button>
                        )}
                        {canConfirm && (
                            <Button variant="secondary" size="sm" onClick={handleConfirm} leftIcon={<CheckCircle size={16} />}>
                                Confirm
                            </Button>
                        )}
                        {canSend && (
                            <Button variant="secondary" size="sm" onClick={handleSend} leftIcon={<Send size={16} />}>
                                Mark Sent
                            </Button>
                        )}
                        {canPay && onPayment && (
                            <Button variant="primary" size="sm" onClick={onPayment} leftIcon={<CreditCard size={16} />}>
                                Record Payment
                            </Button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-6 border-b border-gray-200 dark:border-surface-700">
                    <div className="flex gap-6">
                        {[
                            { id: 'details', label: 'Details', icon: FileText },
                            { id: 'payments', label: `Payments (${payments.length})`, icon: CreditCard },
                            { id: 'history', label: `History (${versions.length})`, icon: History },
                            { id: 'events', label: `Events (${events.length})`, icon: DollarSign },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                    className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${
                                        isActive
                                            ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Icon size={16} />
                                    <span className="text-sm font-medium">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Details Tab */}
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card className="p-4">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                        {formatCurrency(displayInvoice.total)}
                                    </p>
                                </Card>
                                <Card className="p-4">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Paid</p>
                                    <p className="text-xl font-bold text-green-600 mt-1">
                                        {formatCurrency(displayInvoice.paidAmount)}
                                    </p>
                                </Card>
                                <Card className="p-4">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Outstanding</p>
                                    <p className={`text-xl font-bold mt-1 ${displayInvoice.outstandingAmount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                                        {formatCurrency(displayInvoice.outstandingAmount)}
                                    </p>
                                </Card>
                                <Card className="p-4">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Tax</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                        {formatCurrency(displayInvoice.taxAmount)}
                                    </p>
                                </Card>
                            </div>

                            {/* Customer & Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <User size={18} className="text-gray-400" />
                                        <h4 className="font-medium">Customer</h4>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p className="font-medium text-gray-900 dark:text-white">{displayInvoice.customerName}</p>
                                        {displayInvoice.customerEmail && (
                                            <p className="text-gray-500">{displayInvoice.customerEmail}</p>
                                        )}
                                        {displayInvoice.customerTaxId && (
                                            <p className="text-gray-500">Tax ID: {displayInvoice.customerTaxId}</p>
                                        )}
                                        {displayInvoice.customerAddress && (
                                            <p className="text-gray-500">
                                                {(displayInvoice.customerAddress as { street?: string; city?: string; country?: string }).street}, {(displayInvoice.customerAddress as { city?: string }).city}
                                            </p>
                                        )}
                                    </div>
                                </Card>

                                <Card className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Calendar size={18} className="text-gray-400" />
                                        <h4 className="font-medium">Dates</h4>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Invoice Date</span>
                                            <span className="font-medium">{formatDate(displayInvoice.invoiceDate)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Due Date</span>
                                            <span className={`font-medium ${new Date(displayInvoice.dueDate) < new Date() && displayInvoice.outstandingAmount > 0 ? 'text-red-600' : ''}`}>
                        {formatDate(displayInvoice.dueDate)}
                      </span>
                                        </div>
                                        {displayInvoice.confirmedAt && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Confirmed</span>
                                                <span className="font-medium">{formatDateTime(displayInvoice.confirmedAt)}</span>
                                            </div>
                                        )}
                                        {displayInvoice.paidAt && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Paid</span>
                                                <span className="font-medium text-green-600">{formatDateTime(displayInvoice.paidAt)}</span>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>

                            {/* Line Items */}
                            <Card className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium">Line Items</h4>
                                    <span className="text-sm text-gray-500">{items.length} items</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                        <tr className="border-b border-gray-200 dark:border-surface-700">
                                            <th className="text-left py-2 text-gray-500 font-medium">Description</th>
                                            <th className="text-right py-2 text-gray-500 font-medium">Qty</th>
                                            <th className="text-right py-2 text-gray-500 font-medium">Unit Price</th>
                                            <th className="text-right py-2 text-gray-500 font-medium">Tax</th>
                                            <th className="text-right py-2 text-gray-500 font-medium">Total</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {(showAllItems ? items : items.slice(0, 5)).map((item, idx) => (
                                            <tr key={item.id || idx} className="border-b border-gray-100 dark:border-surface-800">
                                                <td className="py-3">{item.description}</td>
                                                <td className="py-3 text-right">{item.quantity} {item.unit}</td>
                                                <td className="py-3 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                                                <td className="py-3 text-right">{item.taxRate}%</td>
                                                <td className="py-3 text-right font-mono font-medium">{formatCurrency(item.total)}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                        <tfoot>
                                        <tr className="border-t border-gray-200 dark:border-surface-700">
                                            <td colSpan={4} className="py-2 text-right font-medium">Subtotal</td>
                                            <td className="py-2 text-right font-mono">{formatCurrency(displayInvoice.subtotal)}</td>
                                        </tr>
                                        {displayInvoice.discountAmount > 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-2 text-right font-medium text-red-600">Discount</td>
                                                <td className="py-2 text-right font-mono text-red-600">-{formatCurrency(displayInvoice.discountAmount)}</td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td colSpan={4} className="py-2 text-right font-medium">Tax</td>
                                            <td className="py-2 text-right font-mono">{formatCurrency(displayInvoice.taxAmount)}</td>
                                        </tr>
                                        <tr className="border-t border-gray-200 dark:border-surface-700">
                                            <td colSpan={4} className="py-2 text-right text-lg font-bold">Total</td>
                                            <td className="py-2 text-right font-mono text-lg font-bold text-[var(--accent-primary)]">
                                                {formatCurrency(displayInvoice.total)}
                                            </td>
                                        </tr>
                                        </tfoot>
                                    </table>
                                </div>
                                {items.length > 5 && (
                                    <button
                                        onClick={() => setShowAllItems(!showAllItems)}
                                        className="mt-3 text-sm text-[var(--accent-primary)] hover:underline flex items-center gap-1"
                                    >
                                        {showAllItems ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        {showAllItems ? 'Show less' : `Show all ${items.length} items`}
                                    </button>
                                )}
                            </Card>

                            {/* Notes */}
                            {(displayInvoice.notes || displayInvoice.internalNotes) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {displayInvoice.notes && (
                                        <Card className="p-4">
                                            <h4 className="font-medium mb-2">Notes</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{displayInvoice.notes}</p>
                                        </Card>
                                    )}
                                    {displayInvoice.internalNotes && (
                                        <Card className="p-4 bg-amber-50 dark:bg-amber-900/20">
                                            <h4 className="font-medium mb-2">Internal Notes</h4>
                                            <p className="text-sm text-amber-800 dark:text-amber-200">{displayInvoice.internalNotes}</p>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Payments Tab */}
                    {activeTab === 'payments' && (
                        <div className="space-y-4">
                            {payments.length === 0 ? (
                                <div className="text-center py-12">
                                    <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500">No payments recorded yet</p>
                                    {canPay && onPayment && (
                                        <Button variant="primary" onClick={onPayment} className="mt-4">
                                            Record Payment
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                payments.map((payment) => (
                                    <Card key={payment.id} className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                    <DollarSign size={20} className="text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {formatCurrency(payment.amount, payment.currency)}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {formatDate(payment.paymentDate)} • {payment.paymentMethod}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={payment.status === 'completed' ? 'success' : 'warning'}>
                                                {payment.status}
                                            </Badge>
                                        </div>
                                        {payment.reference && (
                                            <p className="text-sm text-gray-500 mt-2">Ref: {payment.reference}</p>
                                        )}
                                    </Card>
                                ))
                            )}
                        </div>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            {versions.length === 0 ? (
                                <div className="text-center py-12">
                                    <History size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500">No version history available</p>
                                </div>
                            ) : (
                                versions.map((version, idx) => (
                                    <Card key={version.id} className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-surface-700 flex items-center justify-center text-sm font-medium">
                                                    v{version.version}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                                                        {version.changeType.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {formatDateTime(version.createdAt)}
                                                        {version.createdByName && ` by ${version.createdByName}`}
                                                    </p>
                                                </div>
                                            </div>
                                            {version.changedFields.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {version.changedFields.slice(0, 3).map((field) => (
                                                        <Badge key={field} variant="neutral" size="sm">
                                                            {field}
                                                        </Badge>
                                                    ))}
                                                    {version.changedFields.length > 3 && (
                                                        <Badge variant="neutral" size="sm">
                                                            +{version.changedFields.length - 3}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {version.changeReason && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                                {version.changeReason}
                                            </p>
                                        )}
                                    </Card>
                                ))
                            )}
                        </div>
                    )}

                    {/* Events Tab */}
                    {activeTab === 'events' && (
                        <div className="space-y-4">
                            {events.length === 0 ? (
                                <div className="text-center py-12">
                                    <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500">No accounting events yet</p>
                                    <p className="text-sm text-gray-400 mt-1">Events are created when the invoice is confirmed</p>
                                </div>
                            ) : (
                                events.map((event) => (
                                    <Card key={event.id} className={`p-4 ${event.status === 'reversed' ? 'opacity-60' : ''}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                    event.eventType.includes('revenue') ? 'bg-green-100 dark:bg-green-900/30' :
                                                        event.eventType.includes('payment') ? 'bg-blue-100 dark:bg-blue-900/30' :
                                                            event.eventType.includes('tax') ? 'bg-purple-100 dark:bg-purple-900/30' :
                                                                event.eventType.includes('reversal') ? 'bg-red-100 dark:bg-red-900/30' :
                                                                    'bg-gray-100 dark:bg-gray-800'
                                                }`}>
                                                    <DollarSign size={20} className={
                                                        event.eventType.includes('revenue') ? 'text-green-600' :
                                                            event.eventType.includes('payment') ? 'text-blue-600' :
                                                                event.eventType.includes('tax') ? 'text-purple-600' :
                                                                    event.eventType.includes('reversal') ? 'text-red-600' :
                                                                        'text-gray-600'
                                                    } />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                                                        {event.eventType.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {event.fiscalPeriod} {event.fiscalYear}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-mono font-medium text-gray-900 dark:text-white">
                                                    {formatCurrency(event.amount, event.currency)}
                                                </p>
                                                <Badge variant={event.status === 'posted' ? 'success' : 'neutral'} size="sm">
                                                    {event.status}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">Debit</p>
                                                <p className="font-medium">{event.debitAccountCode} - {event.debitAccountName}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Credit</p>
                                                <p className="font-medium">{event.creditAccountCode} - {event.creditAccountName}</p>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

export default InvoiceDetail;