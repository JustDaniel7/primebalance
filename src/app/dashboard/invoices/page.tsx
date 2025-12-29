'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Archive,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  RefreshCw,
  ChevronDown,
  Receipt,
  CreditCard,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useInvoiceStore } from '@/store/invoice-store';
import { useThemeStore } from '@/store/theme-store';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { InvoiceDetail } from '@/components/invoices/InvoiceDetail';
import { PaymentModal } from '@/components/invoices/PaymentModal';
import { Invoice, InvoiceStatus } from '@/types/invoice';

// =============================================================================
// STATUS CONFIG
// =============================================================================

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; icon: React.ElementType }> = {
  [InvoiceStatus.DRAFT]: { label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: FileText },
  [InvoiceStatus.CONFIRMED]: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle },
  [InvoiceStatus.SENT]: { label: 'Sent', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: Send },
  [InvoiceStatus.PARTIALLY_PAID]: { label: 'Partial', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: DollarSign },
  [InvoiceStatus.PAID]: { label: 'Paid', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  [InvoiceStatus.OVERDUE]: { label: 'Overdue', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertTriangle },
  [InvoiceStatus.CANCELLED]: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500', icon: XCircle },
  [InvoiceStatus.ARCHIVED]: { label: 'Archived', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', icon: Archive },
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function InvoicesPage() {
  const { t } = useThemeStore();
  const {
    invoices,
    pagination,
    statistics,
    isLoading,
    error,
    filters,
    fetchInvoices,
    setFilters,
    clearFilters,
    setPage,
    confirmInvoice,
    sendInvoice,
    cancelInvoice,
    archiveInvoice,
    deleteInvoice,
    clearError,
  } = useInvoiceStore();

  // UI State
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);

  // Fetch invoices on mount and filter changes
  useEffect(() => {
    fetchInvoices();
  }, [filters, pagination.page]);

  // Apply search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== filters.search) {
        setFilters({ search: searchQuery || undefined });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Apply status filter
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilters({ status: undefined });
    } else {
      setFilters({ status: statusFilter });
    }
  }, [statusFilter]);

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if overdue
  const isOverdue = (invoice: Invoice) => {
    if ([InvoiceStatus.PAID, InvoiceStatus.CANCELLED, InvoiceStatus.ARCHIVED].includes(invoice.status as InvoiceStatus)) {
      return false;
    }
    return new Date(invoice.dueDate) < new Date() && invoice.outstandingAmount > 0;
  };

  // Handle actions
  const handleConfirm = async (id: string) => {
    const success = await confirmInvoice(id);
    if (success) {
      setActionMenuId(null);
      fetchInvoices();
    }
  };

  const handleSend = async (id: string) => {
    const success = await sendInvoice(id);
    if (success) {
      setActionMenuId(null);
      fetchInvoices();
    }
  };

  const handleCancel = async () => {
    if (!showCancelModal || !cancelReason.trim()) return;

    const success = await cancelInvoice(showCancelModal, cancelReason);
    if (success) {
      setShowCancelModal(null);
      setCancelReason('');
      fetchInvoices();
    }
  };

  const handleArchive = async (id: string) => {
    const success = await archiveInvoice(id);
    if (success) {
      setActionMenuId(null);
      fetchInvoices();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this draft invoice?')) {
      const success = await deleteInvoice(id);
      if (success) {
        setActionMenuId(null);
        fetchInvoices();
      }
    }
  };

  // Stats cards data
  const statsCards = useMemo(() => [
    {
      label: 'Total Revenue',
      value: formatCurrency(statistics?.totalRevenue || 0),
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Outstanding',
      value: formatCurrency(statistics?.totalOutstanding || 0),
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      label: 'Paid',
      value: formatCurrency(statistics?.totalPaid || 0),
      icon: CheckCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Invoices',
      value: statistics?.count || 0,
      icon: FileText,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ], [statistics]);

  return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('invoices.title') || 'Invoices'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your invoices and track payments
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
                variant="secondary"
                onClick={() => fetchInvoices()}
                leftIcon={<RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />}
            >
              Refresh
            </Button>
            <Button
                variant="primary"
                onClick={() => setShowForm(true)}
                leftIcon={<Plus size={18} />}
            >
              New Invoice
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-500" size={20} />
                <span className="text-red-700 dark:text-red-300">{error}</span>
              </div>
              <button onClick={clearError} className="text-red-500 hover:text-red-700">
                <XCircle size={20} />
              </button>
            </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                      <Icon size={24} className={stat.color} />
                    </div>
                  </div>
                </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search invoices..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <option key={status} value={status}>{config.label}</option>
                ))}
              </select>

              <Button
                  variant="secondary"
                  onClick={() => setShowFilters(!showFilters)}
                  leftIcon={<Filter size={18} />}
              >
                Filters
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                  <div className="pt-4 mt-4 border-t border-gray-200 dark:border-surface-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm text-gray-500 mb-1 block">Date From</label>
                      <input
                          type="date"
                          value={filters.dateFrom || ''}
                          onChange={(e) => setFilters({ dateFrom: e.target.value || undefined })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-500 mb-1 block">Date To</label>
                      <input
                          type="date"
                          value={filters.dateTo || ''}
                          onChange={(e) => setFilters({ dateTo: e.target.value || undefined })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-500 mb-1 block">Currency</label>
                      <select
                          value={filters.currency || ''}
                          onChange={(e) => setFilters({ currency: e.target.value || undefined })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm"
                      >
                        <option value="">All Currencies</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                        <option value="CHF">CHF</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <Button
                          variant="secondary"
                          onClick={clearFilters}
                          className="w-full"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Invoice List */}
        <Card className="overflow-hidden">
          {isLoading && invoices.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
              </div>
          ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No invoices found</p>
                <Button
                    variant="primary"
                    onClick={() => setShowForm(true)}
                    className="mt-4"
                    leftIcon={<Plus size={18} />}
                >
                  Create First Invoice
                </Button>
              </div>
          ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-surface-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Invoice
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-surface-700">
                    {invoices.map((invoice) => {
                      const statusConfig = STATUS_CONFIG[invoice.status as InvoiceStatus] || STATUS_CONFIG[InvoiceStatus.DRAFT];
                      const StatusIcon = statusConfig.icon;
                      const overdue = isOverdue(invoice);

                      return (
                          <tr
                              key={invoice.id}
                              className="hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors"
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
                                  <Receipt size={20} className="text-[var(--accent-primary)]" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {invoice.invoiceNumber}
                                  </p>
                                  {invoice.orderNumber && (
                                      <p className="text-xs text-gray-500">
                                        Order: {invoice.orderNumber}
                                      </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <p className="text-sm text-gray-900 dark:text-white">
                                {invoice.customerName}
                              </p>
                              {invoice.customerEmail && (
                                  <p className="text-xs text-gray-500">{invoice.customerEmail}</p>
                              )}
                            </td>

                            <td className="px-4 py-4">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {formatDate(invoice.invoiceDate)}
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <p className={`text-sm ${overdue ? 'text-red-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                {formatDate(invoice.dueDate)}
                                {overdue && (
                                    <span className="ml-1 text-xs">(Overdue)</span>
                                )}
                              </p>
                            </td>

                            <td className="px-4 py-4 text-right">
                              <p className="font-mono font-medium text-gray-900 dark:text-white">
                                {formatCurrency(invoice.total, invoice.currency)}
                              </p>
                              {invoice.outstandingAmount > 0 && invoice.outstandingAmount < invoice.total && (
                                  <p className="text-xs text-amber-600">
                                    Due: {formatCurrency(invoice.outstandingAmount, invoice.currency)}
                                  </p>
                              )}
                            </td>

                            <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            <StatusIcon size={14} />
                            {statusConfig.label}
                          </span>
                            </td>

                            <td className="px-4 py-4 text-right">
                              <div className="relative">
                                <button
                                    onClick={() => setActionMenuId(actionMenuId === invoice.id ? null : invoice.id)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                                >
                                  <MoreHorizontal size={18} className="text-gray-500" />
                                </button>

                                <AnimatePresence>
                                  {actionMenuId === invoice.id && (
                                      <motion.div
                                          initial={{ opacity: 0, scale: 0.95 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          exit={{ opacity: 0, scale: 0.95 }}
                                          className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-gray-200 dark:border-surface-700 z-10 py-1"
                                      >
                                        <button
                                            onClick={() => {
                                              setViewingInvoice(invoice);
                                              setActionMenuId(null);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-surface-700 flex items-center gap-2"
                                        >
                                          <Eye size={16} /> View Details
                                        </button>

                                        {invoice.status === InvoiceStatus.DRAFT && (
                                            <>
                                              <button
                                                  onClick={() => {
                                                    setEditingInvoice(invoice);
                                                    setShowForm(true);
                                                    setActionMenuId(null);
                                                  }}
                                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-surface-700 flex items-center gap-2"
                                              >
                                                <Edit size={16} /> Edit
                                              </button>
                                              <button
                                                  onClick={() => handleConfirm(invoice.id)}
                                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-surface-700 flex items-center gap-2 text-blue-600"
                                              >
                                                <CheckCircle size={16} /> Confirm
                                              </button>
                                              <button
                                                  onClick={() => handleDelete(invoice.id)}
                                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-surface-700 flex items-center gap-2 text-red-600"
                                              >
                                                <Trash2 size={16} /> Delete
                                              </button>
                                            </>
                                        )}

                                        {invoice.status === InvoiceStatus.CONFIRMED && (
                                            <button
                                                onClick={() => handleSend(invoice.id)}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-surface-700 flex items-center gap-2 text-indigo-600"
                                            >
                                              <Send size={16} /> Mark as Sent
                                            </button>
                                        )}

                                        {[InvoiceStatus.CONFIRMED, InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE].includes(invoice.status as InvoiceStatus) && (
                                            <>
                                              <button
                                                  onClick={() => {
                                                    setPaymentInvoice(invoice);
                                                    setActionMenuId(null);
                                                  }}
                                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-surface-700 flex items-center gap-2 text-green-600"
                                              >
                                                <CreditCard size={16} /> Record Payment
                                              </button>
                                              <button
                                                  onClick={() => {
                                                    setShowCancelModal(invoice.id);
                                                    setActionMenuId(null);
                                                  }}
                                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-surface-700 flex items-center gap-2 text-red-600"
                                              >
                                                <XCircle size={16} /> Cancel
                                              </button>
                                            </>
                                        )}

                                        {[InvoiceStatus.PAID, InvoiceStatus.CANCELLED].includes(invoice.status as InvoiceStatus) && (
                                            <button
                                                onClick={() => handleArchive(invoice.id)}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-surface-700 flex items-center gap-2"
                                            >
                                              <Archive size={16} /> Archive
                                            </button>
                                        )}
                                      </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </td>
                          </tr>
                      );
                    })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-surface-700 flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setPage(pagination.page - 1)}
                            disabled={pagination.page === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setPage(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                )}
              </>
          )}
        </Card>

        {/* Modals */}
        <AnimatePresence>
          {showForm && (
              <InvoiceForm
                  invoice={editingInvoice || undefined}
                  onClose={() => {
                    setShowForm(false);
                    setEditingInvoice(null);
                  }}
                  onSuccess={() => {
                    fetchInvoices();
                  }}
              />
          )}

          {viewingInvoice && (
              <InvoiceDetail
                  invoice={viewingInvoice}
                  onClose={() => setViewingInvoice(null)}
                  onEdit={() => {
                    setEditingInvoice(viewingInvoice);
                    setViewingInvoice(null);
                    setShowForm(true);
                  }}
                  onPayment={() => {
                    setPaymentInvoice(viewingInvoice);
                    setViewingInvoice(null);
                  }}
                  onRefresh={() => fetchInvoices()}
              />
          )}

          {paymentInvoice && (
              <PaymentModal
                  invoice={paymentInvoice}
                  onClose={() => setPaymentInvoice(null)}
                  onSuccess={() => {
                    setPaymentInvoice(null);
                    fetchInvoices();
                  }}
              />
          )}

          {/* Cancel Modal */}
          {showCancelModal && (
              <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-md bg-white dark:bg-surface-900 rounded-2xl shadow-2xl p-6"
                >
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Cancel Invoice
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Please provide a reason for cancelling this invoice. This action will reverse all accounting entries.
                  </p>
                  <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Enter cancellation reason..."
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 mb-4"
                  />
                  <div className="flex justify-end gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => {
                          setShowCancelModal(null);
                          setCancelReason('');
                        }}
                    >
                      Close
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleCancel}
                        disabled={!cancelReason.trim()}
                        className="bg-red-600 hover:bg-red-700"
                    >
                      Cancel Invoice
                    </Button>
                  </div>
                </motion.div>
              </div>
          )}
        </AnimatePresence>

        {/* Click outside to close action menu */}
        {actionMenuId && (
            <div
                className="fixed inset-0 z-0"
                onClick={() => setActionMenuId(null)}
            />
        )}
      </div>
  );
}