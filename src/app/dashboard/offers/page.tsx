'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Plus,
    Send,
    Edit,
    Trash2,
    Copy,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowRight,
    Eye,
    RefreshCw,
    Filter,
    Search,
    DollarSign,
    Percent,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    Package,
    Users,
    Calendar,
    Mail,
    Building2,
    Tag,
    ShoppingCart,
    FileCheck,
    X,
    Save,
    Calculator,
    TrendingUp,
    Info,
    History,
    Shield,
    LayoutTemplate,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useOffersStore } from '@/store/offers-store';
import type { Offer, OfferStatus, OfferLineItem, OfferCounterparty, AcceptanceMethod } from '@/types/offers';
import { OFFER_STATUSES, LINE_TYPES, OFFERS_PAYMENT_TERMS, VALIDITY_PERIODS, STATUS_ACTIONS } from '@/types/offers';

// =============================================================================
// UTILITIES
// =============================================================================

const formatCurrency = (value: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
};

const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString();
};

const getStatusColor = (status: OfferStatus): string => {
    const colors: Record<OfferStatus, string> = {
        draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        revised: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        expired: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
        converted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return colors[status];
};

const getStatusIcon = (status: OfferStatus) => {
    const icons: Record<OfferStatus, any> = {
        draft: Edit,
        sent: Send,
        revised: RefreshCw,
        accepted: CheckCircle2,
        rejected: XCircle,
        expired: Clock,
        converted: ShoppingCart,
    };
    return icons[status];
};

// =============================================================================
// STATS CARDS
// =============================================================================

function StatsSection() {
    const { getStats } = useOffersStore();
    const stats = getStats();

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card variant="glass" padding="md">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Offers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalOffers}</p>
            </Card>
            <Card variant="glass" padding="md">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.totalValue)}</p>
            </Card>
            <Card variant="glass" padding="md">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Conversion Rate</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.conversionRate.toFixed(1)}%</p>
            </Card>
            <Card variant="glass" padding="md">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Pending</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.byStatus.sent + stats.byStatus.revised}</p>
            </Card>
            <Card variant="glass" padding="md">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Accepted</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.byStatus.accepted}</p>
            </Card>
            <Card variant="glass" padding="md">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Expiring Soon</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.expiringIn7Days}</p>
            </Card>
        </div>
    );
}

// =============================================================================
// OFFER LIST
// =============================================================================

function OfferList({ onSelect, onNew }: { onSelect: (id: string) => void; onNew: () => void }) {
    const { offers, filterStatus, setFilterStatus, deleteOffer, duplicateOffer, sendOffer } = useOffersStore();
    const [search, setSearch] = useState('');

    const filteredOffers = offers.filter((offer) => {
        if (filterStatus !== 'all' && offer.status !== filterStatus) return false;
        if (search) {
            const searchLower = search.toLowerCase();
            return (
                offer.offerNumber.toLowerCase().includes(searchLower) ||
                offer.counterparty.name.toLowerCase().includes(searchLower) ||
                offer.counterparty.company?.toLowerCase().includes(searchLower)
            );
        }
        return true;
    });

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-2 items-center">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search offers..."
                            className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-800 w-64"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-3 py-2 text-sm border border-gray-200 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-800"
                    >
                        <option value="all">All Statuses</option>
                        {OFFER_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>
                <Button variant="primary" leftIcon={<Plus size={16} />} onClick={onNew}>
                    New Offer
                </Button>
            </div>

            {/* List */}
            <div className="space-y-2">
                {filteredOffers.map((offer) => {
                    const StatusIcon = getStatusIcon(offer.status);
                    const isExpiringSoon = (offer.status === 'sent' || offer.status === 'revised') &&
                        new Date(offer.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

                    return (
                        <Card
                            key={offer.id}
                            variant="glass"
                            padding="md"
                            className="cursor-pointer hover:border-blue-500/50 transition-colors"
                            onClick={() => onSelect(offer.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${getStatusColor(offer.status)}`}>
                                        <StatusIcon size={18} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{offer.offerNumber}</span>
                                            <span className="text-xs text-gray-500">v{offer.version}</span>
                                            {isExpiringSoon && (
                                                <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded flex items-center gap-1">
                                                    <Clock size={10} /> Expiring soon
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {offer.counterparty.company || offer.counterparty.name}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="font-semibold">{formatCurrency(offer.grandTotal, offer.currency)}</p>
                                        <p className="text-xs text-gray-500">{offer.lineItems.length} items</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm">{formatDate(offer.offerDate)}</p>
                                        <p className="text-xs text-gray-500">Valid until {formatDate(offer.expiryDate)}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
                                        {OFFER_STATUSES.find((s) => s.value === offer.status)?.label}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    );
                })}

                {filteredOffers.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <FileText size={48} className="mx-auto mb-3 opacity-50" />
                        <p>No offers found</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// OFFER DETAIL / EDITOR
// =============================================================================

function OfferDetail({ offerId, onClose }: { offerId: string; onClose: () => void }) {
    const {
        getOfferById,
        updateOffer,
        sendOffer,
        reviseOffer,
        acceptOffer,
        rejectOffer,
        convertToOrder,
        duplicateOffer,
        deleteOffer,
        addLineItem,
        updateLineItem,
        removeLineItem,
        getMarginPreview,
    } = useOffersStore();

    const offer = getOfferById(offerId);
    const [activeTab, setActiveTab] = useState<'details' | 'lines' | 'margin' | 'history'>('details');
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [acceptMethod, setAcceptMethod] = useState<AcceptanceMethod>('email');

    if (!offer) return null;

    const marginPreview = getMarginPreview(offerId);
    const canEdit = offer.status === 'draft' || offer.status === 'revised';
    const canSend = offer.status === 'draft' || offer.status === 'revised';
    const canRevise = offer.status === 'sent';
    const canAcceptReject = offer.status === 'sent' || offer.status === 'revised';
    const canConvert = offer.status === 'accepted';

    const handleSend = () => {
        if (offer.lineItems.length === 0) {
            alert('Cannot send offer without line items');
            return;
        }
        if (!offer.counterparty.email) {
            alert('Cannot send offer without counterparty email');
            return;
        }
        if (sendOffer(offerId)) {
            // Success
        }
    };

    const handleAccept = () => {
        acceptOffer(offerId, acceptMethod);
        setShowAcceptModal(false);
    };

    const handleReject = () => {
        rejectOffer(offerId, rejectReason);
        setShowRejectModal(false);
        setRejectReason('');
    };

    const handleConvert = () => {
        const orderNumber = convertToOrder(offerId);
        if (orderNumber) {
            alert(`Order ${orderNumber} created successfully!`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-surface-900 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-surface-700 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${getStatusColor(offer.status)}`}>
                            {React.createElement(getStatusIcon(offer.status), { size: 20 })}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{offer.offerNumber}</h2>
                            <p className="text-sm text-gray-500">Version {offer.version} • {offer.counterparty.company || offer.counterparty.name}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(offer.status)}`}>
                            {OFFER_STATUSES.find((s) => s.value === offer.status)?.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {canSend && (
                            <Button variant="primary" leftIcon={<Send size={16} />} onClick={handleSend}>
                                Send Offer
                            </Button>
                        )}
                        {canRevise && (
                            <Button variant="secondary" leftIcon={<Edit size={16} />} onClick={() => reviseOffer(offerId)}>
                                Revise
                            </Button>
                        )}
                        {canAcceptReject && (
                            <>
                                <Button variant="primary" leftIcon={<CheckCircle2 size={16} />} onClick={() => setShowAcceptModal(true)}>
                                    Mark Accepted
                                </Button>
                                <Button variant="ghost" leftIcon={<XCircle size={16} />} onClick={() => setShowRejectModal(true)}>
                                    Mark Rejected
                                </Button>
                            </>
                        )}
                        {canConvert && (
                            <Button variant="primary" leftIcon={<ShoppingCart size={16} />} onClick={handleConvert}>
                                Convert to Order
                            </Button>
                        )}
                        <Button variant="ghost" leftIcon={<Copy size={16} />} onClick={() => duplicateOffer(offerId)}>
                            Duplicate
                        </Button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-6 border-b border-gray-200 dark:border-surface-700">
                    <div className="flex gap-6">
                        {[
                            { id: 'details', label: 'Details', icon: FileText },
                            { id: 'lines', label: 'Line Items', icon: Package },
                            { id: 'margin', label: 'Margin Preview', icon: TrendingUp },
                            { id: 'history', label: 'History', icon: History },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'details' && (
                        <div className="grid grid-cols-2 gap-6">
                            {/* Counterparty */}
                            <Card variant="glass" padding="md">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Building2 size={16} />
                                    Counterparty
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <p><span className="text-gray-500">Name:</span> {offer.counterparty.name}</p>
                                    <p><span className="text-gray-500">Company:</span> {offer.counterparty.company || '-'}</p>
                                    <p><span className="text-gray-500">Email:</span> {offer.counterparty.email}</p>
                                    <p><span className="text-gray-500">Contact:</span> {offer.counterparty.contactPerson || '-'}</p>
                                </div>
                            </Card>

                            {/* Terms */}
                            <Card variant="glass" padding="md">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Calendar size={16} />
                                    Terms & Dates
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <p><span className="text-gray-500">Offer Date:</span> {formatDate(offer.offerDate)}</p>
                                    <p><span className="text-gray-500">Valid Until:</span> {formatDate(offer.expiryDate)}</p>
                                    <p><span className="text-gray-500">Payment:</span> {OFFERS_PAYMENT_TERMS.find((t) => t.value === offer.paymentTerms)?.label || offer.paymentTerms}</p>
                                    <p><span className="text-gray-500">Currency:</span> {offer.currency}</p>
                                </div>
                            </Card>

                            {/* Totals */}
                            <Card variant="glass" padding="md">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <DollarSign size={16} />
                                    Totals
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span>{formatCurrency(offer.subtotal, offer.currency)}</span>
                                    </div>
                                    {offer.totalDiscount > 0 && (
                                        <div className="flex justify-between text-red-600">
                                            <span>Discount</span>
                                            <span>-{formatCurrency(offer.totalDiscount, offer.currency)}</span>
                                        </div>
                                    )}
                                    {offer.taxTotal > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Tax</span>
                                            <span>{formatCurrency(offer.taxTotal, offer.currency)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                        <span>Grand Total</span>
                                        <span>{formatCurrency(offer.grandTotal, offer.currency)}</span>
                                    </div>
                                </div>
                            </Card>

                            {/* Status Info */}
                            <Card variant="glass" padding="md">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Info size={16} />
                                    Status Info
                                </h3>
                                <div className="space-y-2 text-sm">
                                    {offer.sentAt && <p><span className="text-gray-500">Sent:</span> {new Date(offer.sentAt).toLocaleString()}</p>}
                                    {offer.acceptedAt && <p><span className="text-gray-500">Accepted:</span> {new Date(offer.acceptedAt).toLocaleString()}</p>}
                                    {offer.rejectedAt && <p><span className="text-gray-500">Rejected:</span> {new Date(offer.rejectedAt).toLocaleString()}</p>}
                                    {offer.convertedAt && (
                                        <p><span className="text-gray-500">Converted:</span> {new Date(offer.convertedAt).toLocaleString()} → {offer.convertedOrderNumber}</p>
                                    )}
                                    {offer.rejectionReason && <p><span className="text-gray-500">Reason:</span> {offer.rejectionReason}</p>}
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'lines' && (
                        <div className="space-y-4">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="border-b border-gray-200 dark:border-surface-700">
                                    <th className="text-left py-2 px-2">#</th>
                                    <th className="text-left py-2 px-2">Description</th>
                                    <th className="text-right py-2 px-2">Qty</th>
                                    <th className="text-right py-2 px-2">Unit Price</th>
                                    <th className="text-right py-2 px-2">Discount</th>
                                    <th className="text-right py-2 px-2">Net Amount</th>
                                </tr>
                                </thead>
                                <tbody>
                                {offer.lineItems.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-100 dark:border-surface-800">
                                        <td className="py-3 px-2">{item.lineNumber}</td>
                                        <td className="py-3 px-2">
                                            <p className="font-medium">{item.description}</p>
                                            <p className="text-xs text-gray-500">{LINE_TYPES.find((t) => t.value === item.type)?.label}</p>
                                        </td>
                                        <td className="py-3 px-2 text-right">{item.quantity} {item.unit}</td>
                                        <td className="py-3 px-2 text-right">{formatCurrency(item.unitPrice, item.currency)}</td>
                                        <td className="py-3 px-2 text-right text-red-600">
                                            {item.discountAmount > 0 ? `-${formatCurrency(item.discountAmount, item.currency)}` : '-'}
                                        </td>
                                        <td className="py-3 px-2 text-right font-medium">{formatCurrency(item.netAmount, item.currency)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>

                            {canEdit && (
                                <Button
                                    variant="secondary"
                                    leftIcon={<Plus size={16} />}
                                    onClick={() => addLineItem(offerId, {
                                        type: 'product',
                                        description: 'New Item',
                                        quantity: 1,
                                        unit: 'pcs',
                                        unitPrice: 0,
                                    })}
                                >
                                    Add Line Item
                                </Button>
                            )}
                        </div>
                    )}

                    {activeTab === 'margin' && marginPreview && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-4 gap-4">
                                <Card variant="glass" padding="md">
                                    <p className="text-xs text-gray-500">Total Revenue</p>
                                    <p className="text-xl font-bold">{formatCurrency(marginPreview.totals.totalRevenue, offer.currency)}</p>
                                </Card>
                                <Card variant="glass" padding="md">
                                    <p className="text-xs text-gray-500">Total Cost</p>
                                    <p className="text-xl font-bold">{formatCurrency(marginPreview.totals.totalCost, offer.currency)}</p>
                                </Card>
                                <Card variant="glass" padding="md">
                                    <p className="text-xs text-gray-500">Gross Margin</p>
                                    <p className="text-xl font-bold text-emerald-600">{formatCurrency(marginPreview.totals.grossMargin, offer.currency)}</p>
                                </Card>
                                <Card variant="glass" padding="md">
                                    <p className="text-xs text-gray-500">Margin %</p>
                                    <p className="text-xl font-bold text-emerald-600">{marginPreview.totals.grossMarginPercent.toFixed(1)}%</p>
                                </Card>
                            </div>

                            {/* Warnings */}
                            {marginPreview.warnings.length > 0 && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
                                    <h4 className="font-medium text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-2">
                                        <AlertTriangle size={16} />
                                        Warnings
                                    </h4>
                                    <ul className="text-sm text-amber-700 dark:text-amber-500 space-y-1">
                                        {marginPreview.warnings.map((w, i) => (
                                            <li key={i}>• {w}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Line Details */}
                            <Card variant="glass" padding="md">
                                <h4 className="font-semibold mb-3">Margin by Line Item</h4>
                                <table className="w-full text-sm">
                                    <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2">Item</th>
                                        <th className="text-right py-2">Revenue</th>
                                        <th className="text-right py-2">Cost</th>
                                        <th className="text-right py-2">Margin</th>
                                        <th className="text-right py-2">Margin %</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {marginPreview.lineItems.map((item) => (
                                        <tr key={item.lineId} className="border-b border-gray-100">
                                            <td className="py-2">{item.description}</td>
                                            <td className="py-2 text-right">{formatCurrency(item.revenue, offer.currency)}</td>
                                            <td className="py-2 text-right">{formatCurrency(item.cost, offer.currency)}</td>
                                            <td className={`py-2 text-right ${item.margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {formatCurrency(item.margin, offer.currency)}
                                            </td>
                                            <td className={`py-2 text-right ${item.marginPercent >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {item.marginPercent.toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </Card>

                            {/* Assumptions */}
                            <div className="text-xs text-gray-500">
                                <p className="font-medium mb-1">Assumptions:</p>
                                <ul className="space-y-0.5">
                                    {marginPreview.assumptions.map((a, i) => (
                                        <li key={i}>• {a}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-500">Audit trail for this offer</p>
                            <div className="space-y-2">
                                {[
                                    { action: 'Created', date: offer.createdAt, user: offer.createdBy },
                                    offer.sentAt && { action: 'Sent', date: offer.sentAt, user: offer.sentBy },
                                    offer.acceptedAt && { action: 'Accepted', date: offer.acceptedAt, user: 'Counterparty' },
                                    offer.rejectedAt && { action: 'Rejected', date: offer.rejectedAt, user: 'Counterparty' },
                                    offer.convertedAt && { action: 'Converted to Order', date: offer.convertedAt, user: 'Current User' },
                                ].filter(Boolean).map((event: any, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-surface-800 rounded-lg">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <div className="flex-1">
                                            <p className="font-medium">{event.action}</p>
                                            <p className="text-xs text-gray-500">by {event.user}</p>
                                        </div>
                                        <p className="text-sm text-gray-500">{new Date(event.date).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Disclaimer */}
                <div className="px-6 py-3 border-t border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-800">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Shield size={12} />
                        {offer.disclaimer.slice(0, 150)}...
                    </p>
                </div>
            </motion.div>

            {/* Accept Modal */}
            <AnimatePresence>
                {showAcceptModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-60"
                        onClick={() => setShowAcceptModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white dark:bg-surface-900 rounded-xl p-6 max-w-md w-full m-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-semibold mb-4">Mark Offer as Accepted</h3>
                            <div className="mb-4">
                                <label className="text-sm font-medium block mb-1">Acceptance Method</label>
                                <select
                                    value={acceptMethod}
                                    onChange={(e) => setAcceptMethod(e.target.value as AcceptanceMethod)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="email">Email Confirmation</option>
                                    <option value="signature">Signature</option>
                                    <option value="click">Click/Digital</option>
                                    <option value="verbal">Verbal Confirmation</option>
                                    <option value="written">Written Confirmation</option>
                                </select>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" onClick={() => setShowAcceptModal(false)}>Cancel</Button>
                                <Button variant="primary" onClick={handleAccept}>Confirm Acceptance</Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reject Modal */}
            <AnimatePresence>
                {showRejectModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-60"
                        onClick={() => setShowRejectModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white dark:bg-surface-900 rounded-xl p-6 max-w-md w-full m-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-semibold mb-4">Mark Offer as Rejected</h3>
                            <div className="mb-4">
                                <label className="text-sm font-medium block mb-1">Rejection Reason (optional)</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Enter reason for rejection..."
                                    className="w-full px-3 py-2 border rounded-lg resize-none"
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                                <Button variant="primary" onClick={handleReject}>Confirm Rejection</Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function OffersPage() {
    const { t } = useThemeStore();
    const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
    const [showNewOffer, setShowNewOffer] = useState(false);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/10 border border-indigo-500/20">
                            <FileText className="w-6 h-6 text-indigo-500" />
                        </div>
                        Offers & Quotes
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Create, manage, and track commercial offers</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full flex items-center gap-1">
                        <Shield size={12} />
                        Non-Binding
                    </span>
                </div>
            </div>

            {/* Stats */}
            <StatsSection />

            {/* Offer List */}
            <OfferList
                onSelect={(id) => setSelectedOfferId(id)}
                onNew={() => setShowNewOffer(true)}
            />

            {/* Offer Detail Modal */}
            <AnimatePresence>
                {selectedOfferId && (
                    <OfferDetail
                        offerId={selectedOfferId}
                        onClose={() => setSelectedOfferId(null)}
                    />
                )}
            </AnimatePresence>

            {/* Disclaimer */}
            <Card variant="glass" padding="sm">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Info size={12} />
                    All offers are non-binding and do not constitute contracts. Explicit human confirmation is required for binding steps.
                </p>
            </Card>
        </div>
    );
}