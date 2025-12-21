'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Send,
  Download,
  Copy,
  Check,
  Clock,
  AlertCircle,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Mail,
  Eye,
  MoreVertical,
  Building2,
  User,
  MapPin,
  Calendar,
  CreditCard,
  Percent,
  RefreshCw,
  X,
} from 'lucide-react';
import { Card, Button, Badge, Input } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useInvoiceStore } from '@/store/invoice-store';
import { COUNTRIES, CURRENCIES, DEFAULT_TAX_RATES } from '@/types/invoice';
import type { Invoice, InvoiceItem, InvoiceParty, InvoicePayment } from '@/types/invoice';

// =============================================================================
// INVOICE LIST COMPONENT
// =============================================================================

function InvoiceList({
  onCreateNew,
  onSelectInvoice,
}: {
  onCreateNew: () => void;
  onSelectInvoice: (invoice: Invoice) => void;
}) {
  const { t, language } = useThemeStore();
const { invoices, fetchInvoices, isInitialized, isLoading, markAsPaid, deleteInvoice, duplicateInvoice } = useInvoiceStore();
// Fetch on mount
useEffect(() => {
  if (!isInitialized) {
    fetchInvoices();
  }
}, [fetchInvoices, isInitialized]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Invoice['status'] | 'all'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.recipient.company?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const statusTabs: Array<{ value: Invoice['status'] | 'all'; label: string }> = [
    { value: 'all', label: t('invoice.all') },
    { value: 'draft', label: t('invoice.draft') },
    { value: 'sent', label: t('invoice.sent') },
    { value: 'paid', label: t('invoice.paid') },
    { value: 'overdue', label: t('invoice.overdue') },
  ];

  const getStatusBadge = (status: Invoice['status']) => {
    const config = {
      draft: { variant: 'neutral' as const, icon: FileText },
      sent: { variant: 'info' as const, icon: Send },
      paid: { variant: 'success' as const, icon: Check },
      overdue: { variant: 'danger' as const, icon: AlertCircle },
      cancelled: { variant: 'neutral' as const, icon: XCircle },
    };
    const { variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} size="sm">
        <Icon size={12} className="mr-1" />
        {t(`invoice.${status}`)}
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
    const draft = invoices.filter((i) => i.status === 'draft').reduce((s, i) => s + i.total, 0);
    const sent = invoices.filter((i) => i.status === 'sent').reduce((s, i) => s + i.total, 0);
    const paid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
    const overdue = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.total, 0);
    return { draft, sent, paid, overdue };
  }, [invoices]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
            {t('invoice.title')}
          </h1>
          <p className="text-gray-500 dark:text-surface-500 mt-1">{t('invoice.subtitle')}</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={onCreateNew}>
          {t('invoice.create')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('invoice.draft'), value: totals.draft, color: 'gray' },
          { label: t('invoice.sent'), value: totals.sent, color: 'blue' },
          { label: t('invoice.paid'), value: totals.paid, color: 'green' },
          { label: t('invoice.overdue'), value: totals.overdue, color: 'red' },
        ].map((stat) => (
          <Card key={stat.label} variant="glass" padding="md">
            <p className="text-sm text-gray-500 dark:text-surface-400">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-surface-100 mt-1">
              {formatCurrency(stat.value, 'EUR')}
            </p>
          </Card>
        ))}
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

      {/* Invoice List */}
      {filteredInvoices.length === 0 ? (
        <Card variant="glass" padding="lg" className="text-center">
          <FileText size={48} className="mx-auto text-gray-300 dark:text-surface-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-surface-100">{t('invoice.noInvoices')}</h3>
          <p className="text-gray-500 dark:text-surface-400 mt-1">{t('invoice.createFirst')}</p>
          <Button variant="primary" className="mt-4" onClick={onCreateNew}>
            {t('invoice.create')}
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice, index) => (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="glass" padding="md" hover className="cursor-pointer" onClick={() => onSelectInvoice(invoice)}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center flex-shrink-0">
                      <FileText size={20} className="text-[var(--accent-primary)]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-surface-100">
                          {invoice.invoiceNumber}
                        </span>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-surface-400 truncate">
                        {invoice.recipient.company || invoice.recipient.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="font-semibold text-gray-900 dark:text-surface-100">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-surface-400">
                        {formatDate(invoice.invoiceDate)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {invoice.status === 'draft' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Send logic
                          }}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors"
                          title={t('invoice.action.send')}
                        >
                          <Send size={16} className="text-gray-500 dark:text-surface-400" />
                        </button>
                      )}
                      {invoice.status === 'sent' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsPaid(invoice.id);
                          }}
                          className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
                          title={t('invoice.action.markPaid')}
                        >
                          <Check size={16} className="text-green-500" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateInvoice(invoice.id);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors"
                        title={t('invoice.action.duplicate')}
                      >
                        <Copy size={16} className="text-gray-500 dark:text-surface-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Download PDF
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors"
                        title={t('invoice.action.download')}
                      >
                        <Download size={16} className="text-gray-500 dark:text-surface-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// INVOICE WIZARD COMPONENT
// =============================================================================

function InvoiceWizard({ onClose, onComplete }: { onClose: () => void; onComplete: (invoice: Invoice) => void }) {
  const { t, language } = useThemeStore();
  const { wizardState, updateWizardState, setWizardStep, createInvoice, generateInvoiceNumber, calculateInvoiceTotals } = useInvoiceStore();
  const [showEmailModal, setShowEmailModal] = useState(false);

  const steps = [
    { id: 1, key: 'recipient', label: t('invoice.wizard.step1'), icon: User },
    { id: 2, key: 'sender', label: t('invoice.wizard.step2'), icon: Building2 },
    { id: 3, key: 'details', label: t('invoice.wizard.step3'), icon: Calendar },
    { id: 4, key: 'items', label: t('invoice.wizard.step4'), icon: FileText },
    { id: 5, key: 'tax', label: t('invoice.wizard.step5'), icon: Percent },
    { id: 6, key: 'payment', label: t('invoice.wizard.step6'), icon: CreditCard },
    { id: 7, key: 'review', label: t('invoice.wizard.step7'), icon: Eye },
  ];

  const currentStep = wizardState.step;

  const goNext = () => {
    if (currentStep < 7) setWizardStep(currentStep + 1);
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

  const getCountryName = (code: string) => {
    const country = COUNTRIES.find((c) => c.code === code);
    if (!country) return code;
    return country.name[language as keyof typeof country.name] || country.name.en;
  };

  // Calculate totals
  const totals = useMemo(() => {
    return calculateInvoiceTotals(wizardState.items, wizardState.taxRate, wizardState.applyTax);
  }, [wizardState.items, wizardState.taxRate, wizardState.applyTax, calculateInvoiceTotals]);

  const handleCreateInvoice = (asDraft: boolean) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (wizardState.payment.dueInDays || 14));

    const invoice = createInvoice({
      invoiceNumber: wizardState.invoiceNumber || generateInvoiceNumber(),
      status: asDraft ? 'draft' : 'sent',
      sender: wizardState.sender as InvoiceParty,
      recipient: wizardState.recipient as InvoiceParty,
      invoiceDate: wizardState.invoiceDate,
      dueDate: dueDate.toISOString().split('T')[0],
      serviceDate: wizardState.serviceDate,
      items: wizardState.items,
      currency: wizardState.currency,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      total: totals.total,
      applyTax: wizardState.applyTax,
      taxRate: wizardState.taxRate,
      taxExemptReason: wizardState.taxExemptReason,
      payment: wizardState.payment as InvoicePayment,
      notes: wizardState.notes,
      language: wizardState.language,
      isRecurring: false,
    });

    onComplete(invoice);
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: wizardState.taxRate,
      total: 0,
    };
    updateWizardState({ items: [...wizardState.items, newItem] });
  };

  const updateItem = (id: string, updates: Partial<InvoiceItem>) => {
    const items = wizardState.items.map((item) => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      }
      return item;
    });
    updateWizardState({ items });
  };

  const removeItem = (id: string) => {
    updateWizardState({ items: wizardState.items.filter((i) => i.id !== id) });
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Recipient
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                {t('invoice.recipient.title')}
              </h2>
              <p className="text-gray-500 dark:text-surface-400 mt-1">{t('invoice.recipient.subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('invoice.recipient.name')}
                value={wizardState.recipient.name || ''}
                onChange={(e) => updateWizardState({ recipient: { ...wizardState.recipient, name: e.target.value } })}
                placeholder="Max Mustermann"
              />
              <Input
                label={t('invoice.recipient.company')}
                value={wizardState.recipient.company || ''}
                onChange={(e) => updateWizardState({ recipient: { ...wizardState.recipient, company: e.target.value } })}
                placeholder="Mustermann GmbH"
              />
              <Input
                label={t('invoice.recipient.address')}
                value={wizardState.recipient.address || ''}
                onChange={(e) => updateWizardState({ recipient: { ...wizardState.recipient, address: e.target.value } })}
                placeholder="Musterstraße 123"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('invoice.recipient.postalCode')}
                  value={wizardState.recipient.postalCode || ''}
                  onChange={(e) => updateWizardState({ recipient: { ...wizardState.recipient, postalCode: e.target.value } })}
                  placeholder="80331"
                />
                <Input
                  label={t('invoice.recipient.city')}
                  value={wizardState.recipient.city || ''}
                  onChange={(e) => updateWizardState({ recipient: { ...wizardState.recipient, city: e.target.value } })}
                  placeholder="München"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                  {t('invoice.recipient.country')}
                </label>
                <select
                  value={wizardState.recipient.country || 'DE'}
                  onChange={(e) => updateWizardState({ recipient: { ...wizardState.recipient, country: e.target.value } })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-gray-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name[language as keyof typeof c.name] || c.name.en}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label={t('invoice.recipient.email')}
                type="email"
                value={wizardState.recipient.email || ''}
                onChange={(e) => updateWizardState({ recipient: { ...wizardState.recipient, email: e.target.value } })}
                placeholder="kontakt@firma.de"
              />
            </div>
          </div>
        );

      case 2: // Sender
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                {t('invoice.sender.title')}
              </h2>
              <p className="text-gray-500 dark:text-surface-400 mt-1">{t('invoice.sender.subtitle')}</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-700 dark:text-blue-300">
              💡 {t('invoice.sender.hint')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('invoice.sender.name')}
                value={wizardState.sender.name || ''}
                onChange={(e) => updateWizardState({ sender: { ...wizardState.sender, name: e.target.value } })}
              />
              <Input
                label={t('invoice.sender.company')}
                value={wizardState.sender.company || ''}
                onChange={(e) => updateWizardState({ sender: { ...wizardState.sender, company: e.target.value } })}
              />
              <Input
                label={t('invoice.recipient.address')}
                value={wizardState.sender.address || ''}
                onChange={(e) => updateWizardState({ sender: { ...wizardState.sender, address: e.target.value } })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('invoice.recipient.postalCode')}
                  value={wizardState.sender.postalCode || ''}
                  onChange={(e) => updateWizardState({ sender: { ...wizardState.sender, postalCode: e.target.value } })}
                />
                <Input
                  label={t('invoice.recipient.city')}
                  value={wizardState.sender.city || ''}
                  onChange={(e) => updateWizardState({ sender: { ...wizardState.sender, city: e.target.value } })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                  {t('invoice.recipient.country')}
                </label>
                <select
                  value={wizardState.sender.country || 'DE'}
                  onChange={(e) => {
                    const country = e.target.value;
                    const taxRate = DEFAULT_TAX_RATES[country] || 19;
                    updateWizardState({ sender: { ...wizardState.sender, country }, taxRate });
                  }}
                  className="w-full px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-gray-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name[language as keyof typeof c.name] || c.name.en}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label={t('invoice.sender.taxId')}
                value={wizardState.sender.taxId || ''}
                onChange={(e) => updateWizardState({ sender: { ...wizardState.sender, taxId: e.target.value } })}
                placeholder="DE123456789"
              />
              <Input
                label={t('invoice.recipient.email')}
                type="email"
                value={wizardState.sender.email || ''}
                onChange={(e) => updateWizardState({ sender: { ...wizardState.sender, email: e.target.value } })}
              />
              <Input
                label={t('invoice.sender.vatId')}
                value={wizardState.sender.vatId || ''}
                onChange={(e) => updateWizardState({ sender: { ...wizardState.sender, vatId: e.target.value } })}
              />
            </div>
          </div>
        );

      case 3: // Details
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                {t('invoice.details.title')}
              </h2>
              <p className="text-gray-500 dark:text-surface-400 mt-1">{t('invoice.details.subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label={t('invoice.details.invoiceNumber')}
                  value={wizardState.invoiceNumber}
                  onChange={(e) => updateWizardState({ invoiceNumber: e.target.value })}
                />
                <p className="text-xs text-gray-500 dark:text-surface-500 mt-1">
                  {t('invoice.details.invoiceNumberHint')}
                </p>
              </div>
              <div>
                <Input
                  label={t('invoice.details.invoiceDate')}
                  type="date"
                  value={wizardState.invoiceDate}
                  onChange={(e) => updateWizardState({ invoiceDate: e.target.value })}
                />
                <p className="text-xs text-gray-500 dark:text-surface-500 mt-1">
                  {t('invoice.details.invoiceDateHint')}
                </p>
              </div>
              <div>
                <Input
                  label={t('invoice.details.serviceDate')}
                  type="date"
                  value={wizardState.serviceDate}
                  onChange={(e) => updateWizardState({ serviceDate: e.target.value })}
                />
                <p className="text-xs text-gray-500 dark:text-surface-500 mt-1">
                  {t('invoice.details.serviceDateHint')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                  {t('invoice.currency')}
                </label>
                <select
                  value={wizardState.currency}
                  onChange={(e) => updateWizardState({ currency: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-gray-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 4: // Items
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                {t('invoice.items.title')}
              </h2>
              <p className="text-gray-500 dark:text-surface-400 mt-1">{t('invoice.items.subtitle')}</p>
            </div>
            <div className="space-y-4">
              {wizardState.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-surface-400">
                  {t('invoice.items.noItems')}
                </div>
              ) : (
                wizardState.items.map((item, idx) => (
                  <Card key={item.id} variant="glass" padding="md">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <Input
                            label={t('invoice.items.description')}
                            value={item.description}
                            onChange={(e) => updateItem(item.id, { description: e.target.value })}
                            placeholder={t('invoice.items.descriptionPlaceholder')}
                          />
                        </div>
                        <Input
                          label={t('invoice.items.quantity')}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                        />
                        <Input
                          label={t('invoice.items.unitPrice')}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) })}
                        />
                      </div>
                      <div className="flex flex-col items-end gap-2 min-w-[100px]">
                        <p className="text-sm text-gray-500 dark:text-surface-400">{t('invoice.items.total')}</p>
                        <p className="font-semibold text-gray-900 dark:text-surface-100">
                          {formatCurrency(item.total, wizardState.currency)}
                        </p>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
              <Button variant="secondary" leftIcon={<Plus size={18} />} onClick={addItem} className="w-full">
                {t('invoice.items.add')}
              </Button>
            </div>
          </div>
        );

      case 5: // Tax
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                {t('invoice.tax.title')}
              </h2>
              <p className="text-gray-500 dark:text-surface-400 mt-1">{t('invoice.tax.subtitle')}</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-3">
                  {t('invoice.tax.applyTax')}
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => updateWizardState({ applyTax: true, taxExemptReason: undefined })}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      wizardState.applyTax
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                        : 'border-gray-200 dark:border-surface-700 hover:border-gray-300 dark:hover:border-surface-600'
                    }`}
                  >
                    <Check size={24} className={wizardState.applyTax ? 'text-[var(--accent-primary)] mx-auto mb-2' : 'text-gray-400 mx-auto mb-2'} />
                    <p className="font-medium text-gray-900 dark:text-surface-100">{t('invoice.tax.yes')}</p>
                  </button>
                  <button
                    onClick={() => updateWizardState({ applyTax: false })}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      !wizardState.applyTax
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                        : 'border-gray-200 dark:border-surface-700 hover:border-gray-300 dark:hover:border-surface-600'
                    }`}
                  >
                    <X size={24} className={!wizardState.applyTax ? 'text-[var(--accent-primary)] mx-auto mb-2' : 'text-gray-400 mx-auto mb-2'} />
                    <p className="font-medium text-gray-900 dark:text-surface-100">{t('invoice.tax.no')}</p>
                  </button>
                </div>
              </div>

              {wizardState.applyTax ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                    {t('invoice.tax.rate')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={wizardState.taxRate}
                      onChange={(e) => updateWizardState({ taxRate: Number(e.target.value) })}
                      className="w-24 px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-gray-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                    />
                    <span className="text-gray-500 dark:text-surface-400">%</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                    {t('invoice.tax.exemptReason')}
                  </label>
                  <select
                    value={wizardState.taxExemptReason || ''}
                    onChange={(e) => updateWizardState({ taxExemptReason: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-gray-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                  >
                    <option value="small_business">{t('invoice.tax.smallBusiness')}</option>
                    <option value="reverse_charge">{t('invoice.tax.reverseCharge')}</option>
                    <option value="export">{t('invoice.tax.export')}</option>
                    <option value="other">{t('invoice.tax.other')}</option>
                  </select>
                </div>
              )}

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <p className="font-medium text-amber-700 dark:text-amber-300 mb-1">{t('invoice.tax.notSure')}</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">{t('invoice.tax.notSureHint')}</p>
              </div>
            </div>
          </div>
        );

      case 6: // Payment
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                {t('invoice.payment.title')}
              </h2>
              <p className="text-gray-500 dark:text-surface-400 mt-1">{t('invoice.payment.subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                  {t('invoice.payment.dueIn')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={wizardState.payment.dueInDays || 14}
                    onChange={(e) => updateWizardState({ payment: { ...wizardState.payment, dueInDays: Number(e.target.value) } })}
                    className="w-24 px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-gray-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                  />
                  <span className="text-gray-500 dark:text-surface-400">{t('invoice.payment.days')}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                  {t('invoice.payment.method')}
                </label>
                <select
                  value={wizardState.payment.method || 'bank_transfer'}
                  onChange={(e) => updateWizardState({ payment: { ...wizardState.payment, method: e.target.value as any } })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700 rounded-xl text-gray-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                >
                  <option value="bank_transfer">{t('invoice.payment.bankTransfer')}</option>
                  <option value="cash">{t('invoice.payment.cash')}</option>
                  <option value="paypal">{t('invoice.payment.paypal')}</option>
                  <option value="credit_card">{t('invoice.payment.creditCard')}</option>
                  <option value="other">{t('invoice.payment.other')}</option>
                </select>
              </div>
              {wizardState.payment.method === 'bank_transfer' && (
                <>
                  <Input
                    label={t('invoice.payment.bankName')}
                    value={wizardState.payment.bankName || ''}
                    onChange={(e) => updateWizardState({ payment: { ...wizardState.payment, bankName: e.target.value } })}
                  />
                  <Input
                    label={t('invoice.payment.iban')}
                    value={wizardState.payment.iban || ''}
                    onChange={(e) => updateWizardState({ payment: { ...wizardState.payment, iban: e.target.value } })}
                    placeholder="DE89 3704 0044 0532 0130 00"
                  />
                  <Input
                    label={t('invoice.payment.bic')}
                    value={wizardState.payment.bic || ''}
                    onChange={(e) => updateWizardState({ payment: { ...wizardState.payment, bic: e.target.value } })}
                    placeholder="DEUTDEDB"
                  />
                </>
              )}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-surface-800/30 rounded-xl text-sm text-gray-600 dark:text-surface-400">
              💡 {t('invoice.payment.hint')}
            </div>
          </div>
        );

      case 7: // Review
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-surface-100">
                {t('invoice.review.title')}
              </h2>
              <p className="text-gray-500 dark:text-surface-400 mt-1">{t('invoice.review.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* From */}
              <Card variant="glass" padding="md">
                <h3 className="font-medium text-gray-500 dark:text-surface-400 mb-2">{t('invoice.review.from')}</h3>
                <p className="font-semibold text-gray-900 dark:text-surface-100">{wizardState.sender.company || wizardState.sender.name}</p>
                <p className="text-sm text-gray-600 dark:text-surface-400">
                  {wizardState.sender.address}<br />
                  {wizardState.sender.postalCode} {wizardState.sender.city}<br />
                  {getCountryName(wizardState.sender.country || 'DE')}
                </p>
                {wizardState.sender.taxId && (
                  <p className="text-sm text-gray-500 dark:text-surface-500 mt-2">Tax ID: {wizardState.sender.taxId}</p>
                )}
              </Card>

              {/* To */}
              <Card variant="glass" padding="md">
                <h3 className="font-medium text-gray-500 dark:text-surface-400 mb-2">{t('invoice.review.to')}</h3>
                <p className="font-semibold text-gray-900 dark:text-surface-100">{wizardState.recipient.company || wizardState.recipient.name}</p>
                <p className="text-sm text-gray-600 dark:text-surface-400">
                  {wizardState.recipient.address}<br />
                  {wizardState.recipient.postalCode} {wizardState.recipient.city}<br />
                  {getCountryName(wizardState.recipient.country || 'DE')}
                </p>
              </Card>
            </div>

            {/* Invoice Details */}
            <Card variant="glass" padding="md">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-gray-900 dark:text-surface-100">{wizardState.invoiceNumber}</span>
                <span className="text-gray-500 dark:text-surface-400">{wizardState.invoiceDate}</span>
              </div>
              
              <div className="border-t border-gray-200 dark:border-surface-700 pt-4">
                <h4 className="font-medium text-gray-700 dark:text-surface-300 mb-3">{t('invoice.review.items')}</h4>
                <div className="space-y-2">
                  {wizardState.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-surface-400">
                        {item.description} × {item.quantity}
                      </span>
                      <span className="text-gray-900 dark:text-surface-100">{formatCurrency(item.total, wizardState.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-surface-700 pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-surface-400">{t('invoice.review.subtotal')}</span>
                  <span className="text-gray-900 dark:text-surface-100">{formatCurrency(totals.subtotal, wizardState.currency)}</span>
                </div>
                {wizardState.applyTax && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-surface-400">{t('invoice.review.tax')} ({wizardState.taxRate}%)</span>
                    <span className="text-gray-900 dark:text-surface-100">{formatCurrency(totals.taxAmount, wizardState.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200 dark:border-surface-700">
                  <span className="text-gray-900 dark:text-surface-100">{t('invoice.review.total')}</span>
                  <span className="text-[var(--accent-primary)]">{formatCurrency(totals.total, wizardState.currency)}</span>
                </div>
              </div>
            </Card>

            {/* Payment Terms */}
            <Card variant="glass" padding="md">
              <h4 className="font-medium text-gray-700 dark:text-surface-300 mb-2">{t('invoice.review.paymentTerms')}</h4>
              <p className="text-gray-600 dark:text-surface-400">
                {t('invoice.review.dueBy')}: {new Date(new Date(wizardState.invoiceDate).getTime() + (wizardState.payment.dueInDays || 14) * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
              {wizardState.payment.method === 'bank_transfer' && wizardState.payment.iban && (
                <p className="text-sm text-gray-500 dark:text-surface-500 mt-1">
                  IBAN: {wizardState.payment.iban}
                </p>
              )}
            </Card>

            {/* Recurring Option */}
            <Card variant="glass" padding="md">
              <h4 className="font-medium text-gray-700 dark:text-surface-300 mb-2">{t('invoice.recurring.title')}</h4>
              <p className="text-sm text-gray-500 dark:text-surface-400 mb-3">{t('invoice.recurring.subtitle')}</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]" />
                <span className="text-gray-700 dark:text-surface-300">{t('invoice.recurring.enable')}</span>
              </label>
            </Card>
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
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-surface-400" />
          </button>
          <h1 className="font-semibold text-gray-900 dark:text-surface-100">{t('invoice.wizard.title')}</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Step Indicators */}
      <div className="bg-white dark:bg-surface-800 border-b border-gray-200 dark:border-surface-700 px-4 py-3 overflow-x-auto">
        <div className="max-w-4xl mx-auto flex gap-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            return (
              <button
                key={step.id}
                onClick={() => step.id < currentStep && setWizardStep(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[var(--accent-primary)] text-white'
                    : isCompleted
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 cursor-pointer'
                    : 'bg-gray-100 dark:bg-surface-700 text-gray-400 dark:text-surface-500'
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
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white dark:bg-surface-800 border-t border-gray-200 dark:border-surface-700 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="secondary"
            leftIcon={<ChevronLeft size={18} />}
            onClick={goBack}
            disabled={currentStep === 1}
          >
            {t('common.back')}
          </Button>

          <div className="flex gap-3">
            {currentStep === 7 ? (
              <>
                <Button variant="secondary" onClick={() => handleCreateInvoice(true)}>
                  {t('invoice.action.saveDraft')}
                </Button>
                <Button variant="primary" leftIcon={<Send size={18} />} onClick={() => handleCreateInvoice(false)}>
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
// MAIN PAGE COMPONENT
// =============================================================================

export default function InvoicesPage() {
  const [showWizard, setShowWizard] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { resetWizard } = useInvoiceStore();

  const handleCreateNew = () => {
    resetWizard();
    setShowWizard(true);
  };

  const handleWizardComplete = (invoice: Invoice) => {
    setShowWizard(false);
    setSelectedInvoice(invoice);
  };

  if (showWizard) {
    return <InvoiceWizard onClose={() => setShowWizard(false)} onComplete={handleWizardComplete} />;
  }

  return (
    <InvoiceList
      onCreateNew={handleCreateNew}
      onSelectInvoice={setSelectedInvoice}
    />
  );
}
