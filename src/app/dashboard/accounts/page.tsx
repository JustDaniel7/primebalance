'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/index'
import { useThemeStore } from '@/store/theme-store'
import { Card, Button, Badge } from '@/components/ui'
import {
  PlusIcon,
  AccountsIcon,
  WalletIcon,
  TrendUpIcon,
} from '@/components/ui/Icons'
import { RefreshCw, CreditCard, Building2, Landmark, Bitcoin, DollarSign, Wallet } from 'lucide-react'
import type { AccountType } from '@/types'

export default function AccountsPage() {
  const { accounts } = useStore()
  const { t } = useThemeStore()
  const [selectedType, setSelectedType] = useState<AccountType | 'all'>('all')

  const accountTypes: Array<{ value: AccountType | 'all'; label: string; icon: React.ElementType }> = [
    { value: 'all', label: t('common.all'), icon: AccountsIcon },
    { value: 'bank', label: t('accounts.bankAccounts'), icon: Landmark },
    { value: 'crypto', label: t('accounts.crypto'), icon: Bitcoin },
    { value: 'asset', label: 'Assets', icon: TrendUpIcon },
    { value: 'liability', label: 'Liabilities', icon: CreditCard },
  ]

  const filteredAccounts = accounts.filter(
    (acc) => selectedType === 'all' || acc.type === selectedType
  )

  const totalBalance = accounts
    .filter(acc => acc.type === 'bank' || acc.type === 'crypto')
    .reduce((sum, acc) => sum + acc.balance, 0)

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'bank':
        return <Landmark size={24} className="text-[var(--accent-primary)]" />
      case 'crypto':
        return <Bitcoin size={24} className="text-[var(--accent-primary)]" />
      case 'asset':
        return <TrendUpIcon size={24} className="text-[var(--accent-primary)]" />
      case 'liability':
        return <CreditCard size={24} className="text-[var(--accent-primary)]" />
      case 'equity':
        return <Building2 size={24} className="text-[var(--accent-primary)]" />
      case 'revenue':
        return <DollarSign size={24} className="text-green-500" />
      case 'expense':
        return <Wallet size={24} className="text-red-400" />
      default:
        return <AccountsIcon size={24} className="text-[var(--accent-primary)]" />
    }
  }

  const getAccountTypeName = (type: AccountType) => {
    switch (type) {
      case 'bank': return t('accounts.bankAccounts')
      case 'crypto': return t('accounts.crypto')
      case 'asset': return 'Assets'
      case 'liability': return 'Liabilities'
      case 'equity': return 'Equity'
      case 'revenue': return t('common.income')
      case 'expense': return t('common.expense')
      default: return type
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
            {t('accounts.title')}
          </h1>
          <p className="text-gray-500 dark:text-surface-500 mt-1">
            {t('accounts.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" leftIcon={<RefreshCw size={18} />}>
            {t('accounts.sync')}
          </Button>
          <Button variant="primary" leftIcon={<PlusIcon size={18} />}>
            {t('accounts.addAccount')}
          </Button>
        </div>
      </div>

      {/* Total Balance */}
      <Card variant="glass" padding="lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-surface-400">{t('accounts.totalBalance')}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-surface-100 mt-1">
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
            <WalletIcon size={32} className="text-[var(--accent-primary)]" />
          </div>
        </div>
      </Card>

      {/* Account Type Tabs */}
      <div className="flex flex-wrap gap-2">
        {accountTypes.map((type) => {
          const Icon = type.icon
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
            </button>
          )
        })}
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAccounts.map((account, index) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card variant="glass" padding="md" hover>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
                  {getAccountIcon(account.type)}
                </div>
                <Badge variant={account.isActive ? 'success' : 'neutral'} size="sm">
                  {account.isActive ? t('accounts.connected') : t('accounts.disconnected')}
                </Badge>
              </div>
              
              <h3 className="font-semibold text-gray-900 dark:text-surface-100">{account.name}</h3>
              <p className="text-sm text-gray-500 dark:text-surface-500">{getAccountTypeName(account.type)}</p>
              
              <div className="flex items-end justify-between mt-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-surface-100">
                    {formatCurrency(account.balance, account.currency)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-surface-500">
                    #{account.accountNumber}
                  </p>
                </div>
                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-800/50 transition-colors">
                  <RefreshCw size={16} className="text-gray-500 dark:text-surface-400" />
                </button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card variant="glass" padding="md" hover className="cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Landmark size={24} className="text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-surface-100">{t('accounts.connectBank')}</h3>
              <p className="text-sm text-gray-500 dark:text-surface-500">Link your bank accounts automatically</p>
            </div>
          </div>
        </Card>
        <Card variant="glass" padding="md" hover className="cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <PlusIcon size={24} className="text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-surface-100">{t('accounts.manualAccount')}</h3>
              <p className="text-sm text-gray-500 dark:text-surface-500">Add an account manually</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
