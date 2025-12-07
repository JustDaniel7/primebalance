'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui';
import { useStore } from '@/index';
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
} from '@heroicons/react/24/outline';

const accountTypeIcons: Record<string, React.ReactNode> = {
  asset: <BanknotesIcon className="w-5 h-5 text-emerald-400" />,
  liability: <CreditCardIcon className="w-5 h-5 text-rose-400" />,
  equity: <BuildingLibraryIcon className="w-5 h-5 text-violet-400" />,
  revenue: <ArrowTrendingUpIcon className="w-5 h-5 text-sky-400" />,
  expense: <ArrowTrendingDownIcon className="w-5 h-5 text-amber-400" />,
};

const accountTypeColors: Record<string, string> = {
  asset: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
  liability: 'from-rose-500/20 to-rose-600/5 border-rose-500/30',
  equity: 'from-violet-500/20 to-violet-600/5 border-violet-500/30',
  revenue: 'from-sky-500/20 to-sky-600/5 border-sky-500/30',
  expense: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
};

interface AccountData {
  id: string;
  name: string;
  accountNumber: string;
  type: string;
  balance: number;
  currency: string;
  children?: AccountData[];
}

interface AccountRowProps {
  account: AccountData;
  level?: number;
}

function AccountRow({ account, level = 0 }: AccountRowProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = account.children && account.children.length > 0;

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="group hover:bg-white/[0.02] transition-colors"
      >
        <td className="px-6 py-4">
          <div className="flex items-center gap-3" style={{ paddingLeft: `${level * 24}px` }}>
            {hasChildren ? (
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                {expanded ? (
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                )}
              </button>
            ) : (
              <span className="w-6" />
            )}
            <div className={`p-2 rounded-lg bg-gradient-to-br ${accountTypeColors[account.type]}`}>
              {accountTypeIcons[account.type]}
            </div>
            <div>
              <p className="font-medium text-white">{account.name}</p>
              <p className="text-xs text-gray-500">{account.accountNumber}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
            ${account.type === 'asset' ? 'bg-emerald-500/10 text-emerald-400' : ''}
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
            <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <PencilIcon className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-colors">
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </td>
      </motion.tr>
      <AnimatePresence>
        {expanded && hasChildren && account.children?.map((child) => (
          <AccountRow key={child.id} account={child} level={level + 1} />
        ))}
      </AnimatePresence>
    </>
  );
}

export default function AccountsPage() {
  const { accounts } = useStore();
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const accountTypes = [
    { type: 'asset', label: 'Assets', total: 245000 },
    { type: 'liability', label: 'Liabilities', total: 35000 },
    { type: 'equity', label: 'Equity', total: 210000 },
    { type: 'revenue', label: 'Revenue', total: 156000 },
    { type: 'expense', label: 'Expenses', total: 45000 },
  ];

  const filteredAccounts = selectedType 
    ? accounts.filter(a => a.type === selectedType)
    : accounts;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
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
          New Account
        </motion.button>
      </div>

      {/* Account Type Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
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
                <span className="text-sm font-medium text-gray-300">{item.label}</span>
              </div>
              <p className="text-xl font-bold text-white font-mono">
                ${item.total.toLocaleString()}
              </p>
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
              {filteredAccounts.map((account, index) => (
                <AccountRow key={account.id} account={account} />
              ))}
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowNewAccount(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1d24] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-6">Create New Account</h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Account Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Operating Cash"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Account Code</label>
                  <input
                    type="text"
                    placeholder="e.g., 1010"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Account Type</label>
                  <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                    <option value="asset">Asset</option>
                    <option value="liability">Liability</option>
                    <option value="equity">Equity</option>
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Parent Account (Optional)</label>
                  <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
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
    </div>
  );
}
