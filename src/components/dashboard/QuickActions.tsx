'use client'

import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useInvoiceStore } from '@/store/invoice-store'
import { useLiabilitiesStore } from '@/store/liabilities-store'
import { useReceivablesStore } from '@/store/receivables-store'
import { useTreasuryStore } from '@/store/treasury-store'
import { useThemeStore } from '@/store/theme-store'
import { Card } from '@/components/ui'
import {
  Zap,
  FileText,
  Calendar,
  AlertTriangle,
  Clock,
  Send,
  CreditCard,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'

interface ActionItem {
  id: string
  type: 'invoice' | 'payment' | 'receivable' | 'approval' | 'alert'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  amount?: number
  dueDate?: string
  link: string
}

export default function QuickActions() {
  const { t } = useThemeStore()
  const { invoices, fetchInvoices, getOverdueInvoices, isInitialized: invoicesInit } = useInvoiceStore()
  const { getUpcomingPayments, getActiveAlerts, isInitialized: liabilitiesInit } = useLiabilitiesStore()
  const { getOverdue: getOverdueReceivables, isInitialized: receivablesInit } = useReceivablesStore()
  const { getPendingApprovals, isInitialized: treasuryInit } = useTreasuryStore()

  useEffect(() => {
    if (!invoicesInit) {
      fetchInvoices()
    }
  }, [invoicesInit, fetchInvoices])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays <= 7) return `${diffDays}d`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Aggregate action items from all sources
  const actionItems = useMemo(() => {
    const items: ActionItem[] = []

    // Overdue invoices
    const overdueInvoices = getOverdueInvoices()
    overdueInvoices.slice(0, 3).forEach((inv) => {
      items.push({
        id: `inv-${inv.id}`,
        type: 'invoice',
        priority: 'high',
        title: `Overdue Invoice #${inv.invoiceNumber}`,
        description: inv.customerName || 'Customer',
        amount: inv.outstandingAmount,
        dueDate: inv.dueDate,
        link: `/dashboard/invoices?id=${inv.id}`,
      })
    })

    // Pending treasury approvals
    const pendingApprovals = getPendingApprovals()
    pendingApprovals.slice(0, 2).forEach((dec) => {
      items.push({
        id: `dec-${dec.id}`,
        type: 'approval',
        priority: 'high',
        title: `Approval Required: ${dec.type}`,
        description: dec.rationale || 'Treasury decision pending',
        link: '/dashboard/treasury',
      })
    })

    // Upcoming liability payments
    const upcomingPayments = getUpcomingPayments(14)
    upcomingPayments.slice(0, 2).forEach((pay) => {
      items.push({
        id: `pay-${pay.id}`,
        type: 'payment',
        priority: pay.status === 'scheduled' ? 'medium' : 'low',
        title: 'Upcoming Payment',
        description: `Payment due`,
        amount: pay.amount,
        dueDate: pay.scheduledDate || pay.dueDate,
        link: '/dashboard/liabilities',
      })
    })

    // Overdue receivables
    const overdueReceivables = getOverdueReceivables()
    overdueReceivables.slice(0, 2).forEach((rec) => {
      items.push({
        id: `rec-${rec.id}`,
        type: 'receivable',
        priority: rec.riskLevel === 'critical' || rec.riskLevel === 'high' ? 'high' : 'medium',
        title: 'Collection Required',
        description: rec.debtor?.name || rec.reference || 'Receivable',
        amount: rec.outstandingAmount,
        dueDate: rec.dueDate,
        link: `/dashboard/receivables`,
      })
    })

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 6)
  }, [getOverdueInvoices, getPendingApprovals, getUpcomingPayments, getOverdueReceivables])

  const getIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return <FileText className="w-4 h-4" />
      case 'payment':
        return <CreditCard className="w-4 h-4" />
      case 'receivable':
        return <RefreshCw className="w-4 h-4" />
      case 'approval':
        return <CheckCircle2 className="w-4 h-4" />
      case 'alert':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Zap className="w-4 h-4" />
    }
  }

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          bg: 'bg-red-500/10 border-red-500/20',
          icon: 'text-red-400',
          text: 'text-red-400',
        }
      case 'medium':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20',
          icon: 'text-amber-400',
          text: 'text-amber-400',
        }
      default:
        return {
          bg: 'bg-blue-500/10 border-blue-500/20',
          icon: 'text-blue-400',
          text: 'text-blue-400',
        }
    }
  }

  // Quick action buttons
  const quickButtons = [
    {
      label: 'New Invoice',
      icon: FileText,
      href: '/dashboard/invoices?action=new',
      color: 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20',
    },
    {
      label: 'New Transaction',
      icon: Send,
      href: '/dashboard/transactions?action=new',
      color: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
    },
    {
      label: 'View Reports',
      icon: Calendar,
      href: '/dashboard/reports',
      color: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="h-full"
    >
      <Card variant="glass" className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                Action Items
              </h3>
              <p className="text-xs text-gray-500 dark:text-surface-500">
                {actionItems.length} items need attention
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-2 mb-6">
          {quickButtons.map((btn) => (
            <Link
              key={btn.label}
              href={btn.href}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-colors ${btn.color}`}
            >
              <btn.icon className="w-4 h-4" />
              <span className="text-xs font-medium">{btn.label}</span>
            </Link>
          ))}
        </div>

        {/* Action Items List */}
        {actionItems.length > 0 ? (
          <div className="space-y-2">
            {actionItems.map((item, index) => {
              const styles = getPriorityStyles(item.priority)
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * index }}
                >
                  <Link
                    href={item.link}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${styles.bg} hover:scale-[1.01] transition-transform cursor-pointer group`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${styles.bg} ${styles.icon}`}>
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-surface-100 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-surface-500 truncate">
                        {item.description}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {item.amount && (
                        <p className={`text-sm font-semibold ${styles.text}`}>
                          {formatCurrency(item.amount)}
                        </p>
                      )}
                      {item.dueDate && (
                        <div className="flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] text-gray-500 dark:text-surface-500">
                            {formatDate(item.dueDate)}
                          </span>
                        </div>
                      )}
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-surface-100">
              All caught up!
            </p>
            <p className="text-xs text-gray-500 dark:text-surface-500 mt-1">
              No urgent actions required
            </p>
          </div>
        )}

        {/* Summary Footer */}
        {actionItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-surface-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                {actionItems.filter((i) => i.priority === 'high').length} urgent
              </span>
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                {actionItems.filter((i) => i.priority === 'medium').length} pending
              </span>
            </div>
            <Link
              href="/dashboard/task-center"
              className="text-xs text-[var(--accent-primary)] hover:opacity-80 transition-opacity"
            >
              View All Tasks
            </Link>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
