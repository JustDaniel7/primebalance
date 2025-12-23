'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '@/store/theme-store';
import { Card, Button, Badge } from '@/components/ui';
import {
  PlusIcon,
  AccountsIcon,
  WalletIcon,
  TrendUpIcon,
} from '@/components/ui/Icons';
import {
  RefreshCw,
  CreditCard,
  Building2,
  Landmark,
  Bitcoin,
  DollarSign,
  Wallet,
  X,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronRight,
  Search,
  MoreVertical,
  Eye,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { Account, AccountType, Currency } from '@/types';

// =============================================================================
// API HELPERS
// =============================================================================

async function fetchAccounts(): Promise<Account[]> {
  const res = await fetch('/api/accounts');
  if (!res.ok) throw new Error('Failed to fetch accounts');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function createAccount(data: Partial<Account>): Promise<Account> {
  const res = await fetch('/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create account');
  }
  return res.json();
}

async function updateAccount(id: string, data: Partial<Account>): Promise<Account> {
  const res = await fetch(`/api/accounts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update account');
  }
  return res.json();
}

async function deleteAccount(id: string): Promise<void> {
  const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete account');
  }
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'asset', label: 'Asset', icon: TrendUpIcon, color: 'text-blue-500' },
  { value: 'liability', label: 'Liability', icon: CreditCard, color: 'text-red-500' },
  { value: 'equity', label: 'Equity', icon: Building2, color: 'text-purple-500' },
  { value: 'revenue', label: 'Revenue', icon: DollarSign, color: 'text-green-500' },
  { value: 'expense', label: 'Expense', icon: Wallet, color: 'text-orange-500' },
  { value: 'bank', label: 'Bank', icon: Landmark, color: 'text-emerald-500' },
  { value: 'crypto', label: 'Crypto', icon: Bitcoin, color: 'text-amber-500' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'BTC', 'ETH'];

// =============================================================================
// HELPERS
// =============================================================================

const formatCurrency = (amount: number, currency: string = 'USD') => {
  if (['BTC', 'ETH', 'USDC', 'USDT'].includes(currency)) {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${currency}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getAccountIcon = (type: AccountType) => {
  const config = ACCOUNT_TYPES.find((t) => t.value === type);
  if (!config) return <AccountsIcon size={24} className="text-[var(--accent-primary)]" />;
  const Icon = config.icon;
  return <Icon size={24} className={config.color} />;
};

const getAccountTypeLabel = (type: AccountType) => {
  return ACCOUNT_TYPES.find((t) => t.value === type)?.label || type;
};

// =============================================================================
// ACCOUNT WIZARD MODAL
// =============================================================================

interface AccountWizardProps {
  account?: Account | null;
  accounts: Account[];
  onClose: () => void;
  onSave: (data: Partial<Account>) => Promise<void>;
  isSaving: boolean;
}

function AccountWizard({ account, accounts, onClose, onSave, isSaving }: AccountWizardProps) {
  const { t } = useThemeStore();
  const [formData, setFormData] = useState<{
    name: string;
    accountNumber: string;
    type: AccountType;
    currency: Currency;
    balance: number;
    parentId: string;
    description: string;
    isActive: boolean;
  }>({
    name: account?.name || '',
    accountNumber: account?.accountNumber || '',
    type: account?.type || 'asset',
    currency: account?.currency || 'USD',
    balance: account?.balance || 0,
    parentId: account?.parentId || '',
    description: account?.description || '',
    isActive: account?.isActive ?? true,
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!formData.name.trim()) {
      setError('Account name is required');
      return;
    }
    if (!formData.accountNumber.trim()) {
      setError('Account number is required');
      return;
    }

    try {
      await onSave(formData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Filter parent accounts (only show same type or category accounts)
  const parentOptions = accounts.filter(
      (a) => a.id !== account?.id && a.type === formData.type
  );

  return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-surface-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {account ? 'Edit Account' : 'New Account'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {account ? 'Update account details' : 'Add a new financial account'}
              </p>
            </div>
            <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Name *
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Business Checking"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Number *
                </label>
                <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="e.g., 1110"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Type *
                </label>
                <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType, parentId: '' })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
                >
                  {ACCOUNT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Currency
                </label>
                <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
                >
                  {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Opening Balance
                </label>
                <input
                    type="number"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Parent Account
                </label>
                <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
                >
                  <option value="">No parent (top-level account)</option>
                  {parentOptions.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountNumber} - {a.name}
                      </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description..."
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all resize-none"
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Account is active
                                </span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-900/50">
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
              ) : account ? (
                  'Update Account'
              ) : (
                  'Create Account'
              )}
            </Button>
          </div>
        </motion.div>
      </div>
  );
}

// =============================================================================
// DELETE CONFIRMATION MODAL
// =============================================================================

interface DeleteConfirmProps {
  account: Account;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

function DeleteConfirmModal({ account, onClose, onConfirm, isDeleting }: DeleteConfirmProps) {
  return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-md"
        >
          <div className="p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
              Delete Account?
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mt-2">
              Are you sure you want to delete <strong>{account.name}</strong> ({account.accountNumber})?
              This action cannot be undone.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-surface-700">
            <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
                variant="primary"
                onClick={onConfirm}
                disabled={isDeleting}
                className="!bg-red-600 hover:!bg-red-700"
            >
              {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
              ) : (
                  'Delete Account'
              )}
            </Button>
          </div>
        </motion.div>
      </div>
  );
}

// =============================================================================
// ACCOUNT CARD
// =============================================================================

interface AccountCardProps {
  account: Account;
  onEdit: () => void;
  onDelete: () => void;
}

function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
      <Card variant="glass" padding="md" hover className="relative group">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
            {getAccountIcon(account.type)}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={account.isActive ? 'success' : 'neutral'} size="sm">
              {account.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <div className="relative">
              <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>
              <AnimatePresence>
                {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                      <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-gray-200 dark:border-surface-700 py-1 z-20"
                      >
                        <button
                            onClick={() => { onEdit(); setMenuOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-700"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                            onClick={() => { onDelete(); setMenuOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </motion.div>
                    </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 dark:text-surface-400 font-mono">
            {account.accountNumber}
          </p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100 mt-1 truncate">
            {account.name}
          </h3>
          {account.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                {account.description}
              </p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-surface-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-surface-400">Balance</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-300">
                        {getAccountTypeLabel(account.type)}
                    </span>
          </div>
          <p className={`text-xl font-bold mt-1 ${
              account.balance >= 0 ? 'text-gray-900 dark:text-surface-100' : 'text-red-600'
          }`}>
            {formatCurrency(account.balance, account.currency)}
          </p>
        </div>

        {account.children && account.children.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-surface-700">
              <p className="text-xs text-gray-500">
                {account.children.length} sub-account{account.children.length !== 1 ? 's' : ''}
              </p>
            </div>
        )}
      </Card>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function AccountsPage() {
  const { t } = useThemeStore();

  // State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedType, setSelectedType] = useState<AccountType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

  // Load accounts
  const loadAccounts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAccounts();
      setAccounts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesType = selectedType === 'all' || acc.type === selectedType;
      const matchesSearch = !searchQuery ||
          acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          acc.accountNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [accounts, selectedType, searchQuery]);

  // Calculate totals
  const totals = useMemo(() => {
    const bankCrypto = accounts.filter((a) => a.type === 'bank' || a.type === 'crypto');
    const assets = accounts.filter((a) => a.type === 'asset');
    const liabilities = accounts.filter((a) => a.type === 'liability');

    return {
      cashBalance: bankCrypto.reduce((sum, a) => sum + a.balance, 0),
      totalAssets: assets.reduce((sum, a) => sum + a.balance, 0),
      totalLiabilities: liabilities.reduce((sum, a) => sum + a.balance, 0),
      accountCount: accounts.length,
    };
  }, [accounts]);

  // Handlers
  const handleCreateAccount = async (data: Partial<Account>) => {
    setIsSaving(true);
    try {
      const created = await createAccount(data);
      setAccounts((prev) => [...prev, created]);
      setWizardOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateAccount = async (data: Partial<Account>) => {
    if (!editingAccount) return;
    setIsSaving(true);
    try {
      const updated = await updateAccount(editingAccount.id, data);
      setAccounts((prev) => prev.map((a) => (a.id === editingAccount.id ? updated : a)));
      setEditingAccount(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletingAccount) return;
    setIsSaving(true);
    try {
      await deleteAccount(deletingAccount.id);
      setAccounts((prev) => prev.filter((a) => a.id !== deletingAccount.id));
      setDeletingAccount(null);
    } finally {
      setIsSaving(false);
    }
  };

  const accountTypes: Array<{ value: AccountType | 'all'; label: string; icon: React.ElementType }> = [
    { value: 'all', label: 'All', icon: AccountsIcon },
    ...ACCOUNT_TYPES.map((t) => ({ value: t.value, label: t.label, icon: t.icon })),
  ];

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
              {t('accounts.title') || 'Chart of Accounts'}
            </h1>
            <p className="text-gray-500 dark:text-surface-500 mt-1">
              {t('accounts.subtitle') || 'Manage your financial accounts'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
                variant="secondary"
                leftIcon={<RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />}
                onClick={loadAccounts}
                disabled={isLoading}
            >
              Sync
            </Button>
            <Button
                variant="primary"
                leftIcon={<PlusIcon size={18} />}
                onClick={() => setWizardOpen(true)}
            >
              Add Account
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="glass" padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-surface-400">Cash & Bank</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-surface-100 mt-1">
                  {formatCurrency(totals.cashBalance)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Landmark className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </Card>

          <Card variant="glass" padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-surface-400">Total Assets</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-surface-100 mt-1">
                  {formatCurrency(totals.totalAssets)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </Card>

          <Card variant="glass" padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-surface-400">Liabilities</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-surface-100 mt-1">
                  {formatCurrency(totals.totalLiabilities)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </Card>

          <Card variant="glass" padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-surface-400">Total Accounts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-surface-100 mt-1">
                  {totals.accountCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
                <AccountsIcon size={24} className="text-[var(--accent-primary)]" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search accounts..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
            />
          </div>

          {/* Type Tabs */}
          <div className="flex flex-wrap gap-2">
            {accountTypes.map((type) => {
              const Icon = type.icon;
              const count = type.value === 'all'
                  ? accounts.length
                  : accounts.filter((a) => a.type === type.value).length;
              return (
                  <button
                      key={type.value}
                      onClick={() => setSelectedType(type.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          selectedType === type.value
                              ? 'bg-[var(--accent-primary)] text-white'
                              : 'bg-gray-100 dark:bg-surface-800/50 text-gray-600 dark:text-surface-400 hover:bg-gray-200 dark:hover:bg-surface-700/50'
                      }`}
                  >
                    <Icon size={16} />
                    {type.label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        selectedType === type.value
                            ? 'bg-white/20'
                            : 'bg-gray-200 dark:bg-surface-700'
                    }`}>
                                    {count}
                                </span>
                  </button>
              );
            })}
          </div>
        </div>

        {/* Error State */}
        {error && (
            <Card variant="glass" padding="md" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <Button variant="secondary" size="sm" onClick={loadAccounts}>
                  Retry
                </Button>
              </div>
            </Card>
        )}

        {/* Loading State */}
        {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
            </div>
        )}

        {/* Accounts Grid */}
        {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAccounts.map((account, index) => (
                  <motion.div
                      key={account.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                  >
                    <AccountCard
                        account={account}
                        onEdit={() => setEditingAccount(account)}
                        onDelete={() => setDeletingAccount(account)}
                    />
                  </motion.div>
              ))}

              {filteredAccounts.length === 0 && !error && (
                  <Card variant="glass" padding="lg" className="col-span-full text-center">
                    <AccountsIcon size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {searchQuery || selectedType !== 'all' ? 'No accounts found' : 'No accounts yet'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                      {searchQuery || selectedType !== 'all'
                          ? 'Try adjusting your search or filters'
                          : 'Create your first account to get started'}
                    </p>
                    {!searchQuery && selectedType === 'all' && (
                        <Button
                            variant="primary"
                            className="mt-4"
                            onClick={() => setWizardOpen(true)}
                        >
                          <PlusIcon size={18} className="mr-2" />
                          Add Account
                        </Button>
                    )}
                  </Card>
              )}
            </div>
        )}

        {/* Modals */}
        <AnimatePresence>
          {wizardOpen && (
              <AccountWizard
                  accounts={accounts}
                  onClose={() => setWizardOpen(false)}
                  onSave={handleCreateAccount}
                  isSaving={isSaving}
              />
          )}

          {editingAccount && (
              <AccountWizard
                  account={editingAccount}
                  accounts={accounts}
                  onClose={() => setEditingAccount(null)}
                  onSave={handleUpdateAccount}
                  isSaving={isSaving}
              />
          )}

          {deletingAccount && (
              <DeleteConfirmModal
                  account={deletingAccount}
                  onClose={() => setDeletingAccount(null)}
                  onConfirm={handleDeleteAccount}
                  isDeleting={isSaving}
              />
          )}
        </AnimatePresence>
      </div>
  );
}
