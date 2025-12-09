'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui';
import { useStore } from '@/store';
import toast from 'react-hot-toast';
import {
  ChartBarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  BanknotesIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const accountTypeIcons: Record<string, React.ReactNode> = {
  asset: <BanknotesIcon className="w-5 h-5 text-emerald-400" />,
  liability: <CreditCardIcon className="w-5 h-5 text-rose-400" />,
  equity: <BuildingLibraryIcon className="w-5 h-5 text-violet-400" />,
  revenue: <ArrowTrendingUpIcon className="w-5 h-5 text-sky-400" />,
  expense: <ArrowTrendingDownIcon className="w-5 h-5 text-amber-400" />,
  bank: <BanknotesIcon className="w-5 h-5 text-emerald-400" />,
  crypto: <BanknotesIcon className="w-5 h-5 text-violet-400" />,
};

const accountTypeColors: Record<string, string> = {
  asset: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
  liability: 'from-rose-500/20 to-rose-600/5 border-rose-500/30',
  equity: 'from-violet-500/20 to-violet-600/5 border-violet-500/30',
  revenue: 'from-sky-500/20 to-sky-600/5 border-sky-500/30',
  expense: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
  bank: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
  crypto: 'from-violet-500/20 to-violet-600/5 border-violet-500/30',
};

interface Account {
  id: string;
  name: string;
  accountNumber: string;
  type: string;
  balance: number;
  currency: string;
  parentId?: string;
  isActive: boolean;
  createdAt: string;
}

export default function AccountsPage() {
  const { accounts, updateAccount, deleteAccount, addAccount } = useStore();
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set(['1000', '2000', '3000', '4000', '5000']));

  const [newAccountData, setNewAccountData] = useState({
    name: '',
    accountNumber: '',
    type: 'asset',
    parentId: '',
    balance: 0,
  });

  const accountTypes = [
    { type: 'asset', label: 'Assets', total: accounts.filter(a => a.type === 'asset' || a.type === 'bank' || a.type === 'crypto').reduce((sum, a) => sum + a.balance, 0) },
    { type: 'liability', label: 'Liabilities', total: accounts.filter(a => a.type === 'liability').reduce((sum, a) => sum + a.balance, 0) },
    { type: 'equity', label: 'Equity', total: accounts.filter(a => a.type === 'equity').reduce((sum, a) => sum + a.balance, 0) },
    { type: 'revenue', label: 'Revenue', total: accounts.filter(a => a.type === 'revenue').reduce((sum, a) => sum + a.balance, 0) },
    { type: 'expense', label: 'Expenses', total: accounts.filter(a => a.type === 'expense').reduce((sum, a) => sum + a.balance, 0) },
  ];

  const filteredAccounts = selectedType 
    ? accounts.filter(a => a.type === selectedType || (selectedType === 'asset' && (a.type === 'bank' || a.type === 'crypto')))
    : accounts;

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAccounts(newExpanded);
  };

  const handleEdit = (account: Account) => {
    setSelectedAccount(account);
    setShowEditAccount(true);
  };

  const handleDelete = (account: Account) => {
    setSelectedAccount(account);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (selectedAccount) {
      deleteAccount(selectedAccount.id);
      toast.success(`Account "${selectedAccount.name}" deleted`);
      setShowDeleteConfirm(false);
      setSelectedAccount(null);
    }
  };

  const handleUpdateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAccount) {
      updateAccount(selectedAccount.id, {
        name: selectedAccount.name,
        accountNumber: selectedAccount.accountNumber,
        type: selectedAccount.type as any,
        balance: selectedAccount.balance,
      });
      toast.success(`Account "${selectedAccount.name}" updated`);
      setShowEditAccount(false);
      setSelectedAccount(null);
    }
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const newAccount: Account = {
      id: Date.now().toString(),
      name: newAccountData.name,
      accountNumber: newAccountData.accountNumber,
      type: newAccountData.type as import('@/types').AccountType,
      balance: newAccountData.balance,
      currency: 'USD',
      parentId: newAccountData.parentId || undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    addAccount(newAccount);
    toast.success(`Account "${newAccount.name}" created`);
    setShowNewAccount(false);
    setNewAccountData({ name: '', accountNumber: '', type: 'asset', parentId: '', balance: 0 });
  };

  // Build hierarchical structure
  const rootAccounts = filteredAccounts.filter(a => !a.parentId);
  const getChildren = (parentId: string) => filteredAccounts.filter(a => a.parentId === parentId);

  const renderAccountRow = (account: Account, level: number = 0) => {
    const children = getChildren(account.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedAccounts.has(account.id);

    return (
      <>
        <motion.tr
          key={account.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="group hover:bg-white/[0.02] transition-colors"
        >
          <td className="px-6 py-4">
            <div className="flex items-center gap-3" style={{ paddingLeft: `${level * 24}px` }}>
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(account.id)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              ) : (
                <span className="w-6" />
              )}
              <div className={`p-2 rounded-lg bg-gradient-to-br ${accountTypeColors[account.type] || accountTypeColors.asset}`}>
                {accountTypeIcons[account.type] || accountTypeIcons.asset}
              </div>
              <div>
                <p className="font-medium text-white">{account.name}</p>
                <p className="text-xs text-gray-500">{account.accountNumber}</p>
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
              ${account.type === 'asset' || account.type === 'bank' || account.type === 'crypto' ? 'bg-emerald-500/10 text-emerald-400' : ''}
              ${account.type === 'liability' ? 'bg-rose-500/10 text-rose-400' : ''}
              ${account.type === 'equity' ? 'bg-violet-500/10 text-violet-400' : ''}
              ${account.type === 'revenue' ? 'bg-sky-500/10 text-sky-400' : ''}
              ${account.type === 'expense' ? 'bg-amber-500/10 text-amber-400' : ''}
            `}>
              {account.type}
            </span>
          </td>
          <td className="px-6 py-4 text-right">
            <span className={`font-mono font-semibold ${
              account.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {account.currency} {Math.abs(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleEdit(account)}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Edit account"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDelete(account)}
                className="p-2 rounded-lg hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-colors"
                title="Delete account"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </td>
        </motion.tr>
        {isExpanded && children.map(child => renderAccountRow(child, level + 1))}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20">
              <ChartBarIcon className="w-6 h-6 text-violet-400" />
            </div>
            Chart of Accounts
          </h1>
          <p className="text-gray-400 mt-1">Manage your account structure and balances</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowNewAccount(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-medium text-white shadow-lg shadow-emerald-500/25"
        >
          <PlusIcon className="w-5 h-5" />
          <span className="hidden sm:inline">New Account</span>
          <span className="sm:hidden">New</span>
        </motion.button>
      </div>

      {/* Account Type Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {accountTypes.map((item, index) => (
          <motion.div
            key={item.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`cursor-pointer transition-all ${
                selectedType === item.type ? 'ring-2 ring-emerald-500/50' : ''
              }`}
              onClick={() => setSelectedType(selectedType === item.type ? null : item.type)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${accountTypeColors[item.type]}`}>
                  {accountTypeIcons[item.type]}
                </div>
                <span className="text-sm font-medium text-gray-300 hidden sm:block">{item.label}</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-white font-mono">
                ${item.total.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 sm:hidden mt-1">{item.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Accounts Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Account</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Type</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Balance</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rootAccounts.map(account => renderAccountRow(account))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Account Modal */}
      <AnimatePresence>
        {showNewAccount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewAccount(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1d24] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Create New Account</h2>
                <button onClick={() => setShowNewAccount(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <XMarkIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Account Name</label>
                  <input
                    type="text"
                    value={newAccountData.name}
                    onChange={(e) => setNewAccountData({ ...newAccountData, name: e.target.value })}
                    placeholder="e.g., Operating Cash"
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Account Code</label>
                  <input
                    type="text"
                    value={newAccountData.accountNumber}
                    onChange={(e) => setNewAccountData({ ...newAccountData, accountNumber: e.target.value })}
                    placeholder="e.g., 1010"
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Account Type</label>
                  <select 
                    value={newAccountData.type}
                    onChange={(e) => setNewAccountData({ ...newAccountData, type: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="asset">Asset</option>
                    <option value="liability">Liability</option>
                    <option value="equity">Equity</option>
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Initial Balance</label>
                  <input
                    type="number"
                    value={newAccountData.balance}
                    onChange={(e) => setNewAccountData({ ...newAccountData, balance: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Parent Account (Optional)</label>
                  <select 
                    value={newAccountData.parentId}
                    onChange={(e) => setNewAccountData({ ...newAccountData, parentId: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="">No Parent (Top Level)</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewAccount(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-medium text-white"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Account Modal */}
      <AnimatePresence>
        {showEditAccount && selectedAccount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditAccount(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1d24] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Edit Account</h2>
                <button onClick={() => setShowEditAccount(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <XMarkIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleUpdateAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Account Name</label>
                  <input
                    type="text"
                    value={selectedAccount.name}
                    onChange={(e) => setSelectedAccount({ ...selectedAccount, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Account Code</label>
                  <input
                    type="text"
                    value={selectedAccount.accountNumber}
                    onChange={(e) => setSelectedAccount({ ...selectedAccount, accountNumber: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Account Type</label>
                  <select 
                    value={selectedAccount.type}
                    onChange={(e) => setSelectedAccount({ ...selectedAccount, type: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="asset">Asset</option>
                    <option value="liability">Liability</option>
                    <option value="equity">Equity</option>
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expense</option>
                    <option value="bank">Bank</option>
                    <option value="crypto">Crypto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Balance</label>
                  <input
                    type="number"
                    value={selectedAccount.balance}
                    onChange={(e) => setSelectedAccount({ ...selectedAccount, balance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditAccount(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-medium text-white"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && selectedAccount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1d24] rounded-2xl p-6 w-full max-w-sm border border-white/10 shadow-2xl"
            >
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
                  <TrashIcon className="w-6 h-6 text-rose-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Delete Account</h2>
                <p className="text-gray-400 mb-6">
                  Are you sure you want to delete <span className="text-white font-medium">"{selectedAccount.name}"</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-3 bg-rose-500 hover:bg-rose-600 rounded-xl font-medium text-white transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}