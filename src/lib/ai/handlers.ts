// src/lib/ai/handlers.ts
// Tool function handlers that execute database queries

import { prisma } from '@/lib/prisma'
import type { ToolName } from './tools'

type HandlerArgs = Record<string, unknown>

// Helper to safely limit results
function safeLimit(limit: unknown, defaultVal = 20, max = 100): number {
  const n = typeof limit === 'number' ? limit : defaultVal
  return Math.min(Math.max(1, n), max)
}

// Helper to format currency
function formatCurrency(amount: number | null | undefined, currency = 'EUR'): string {
  if (amount == null) return 'N/A'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

// Helper to get date range based on period
function getPeriodDateRange(period: string): { startDate: Date; endDate: Date } {
  const now = new Date()
  const endDate = new Date(now)
  let startDate: Date

  switch (period) {
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7))
      break
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1))
      break
    case 'quarter':
      startDate = new Date(now.setMonth(now.getMonth() - 3))
      break
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1))
      break
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1))
  }

  return { startDate, endDate }
}

// Handler implementations
const handlers: Record<ToolName, (args: HandlerArgs, orgId: string) => Promise<string>> = {
  async get_transactions(args, orgId) {
    const where: Record<string, unknown> = { organizationId: orgId }

    if (args.type) where.type = args.type
    if (args.status) where.status = args.status
    if (args.category) where.category = args.category

    if (args.startDate || args.endDate) {
      where.date = {}
      if (args.startDate) (where.date as Record<string, unknown>).gte = new Date(args.startDate as string)
      if (args.endDate) (where.date as Record<string, unknown>).lte = new Date(args.endDate as string)
    }

    const limit = safeLimit(args.limit)
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        account: { select: { name: true, accountNumber: true } }
      }
    })

    const total = await prisma.transaction.count({ where })

    return JSON.stringify({
      transactions: transactions.map(t => ({
        id: t.id,
        date: t.date.toISOString().split('T')[0],
        description: t.description,
        amount: t.amount,
        currency: t.currency,
        type: t.type,
        category: t.category,
        status: t.status,
        formattedAmount: formatCurrency(Number(t.amount), t.currency),
        accountName: t.account?.name,
        accountNumber: t.account?.accountNumber
      })),
      total,
      showing: transactions.length
    })
  },

  async get_transaction_summary(args, orgId) {
    const { period = 'month', groupBy = 'category' } = args as { period?: string; groupBy?: string }
    const { startDate, endDate } = getPeriodDateRange(period)

    const transactions = await prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        date: { gte: startDate, lte: endDate }
      },
      select: {
        amount: true,
        type: true,
        category: true,
        status: true,
        date: true
      }
    })

    // Calculate totals
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
    const netCashFlow = income - expenses

    // Group by specified field
    const grouped: Record<string, { count: number; total: number }> = {}
    transactions.forEach(t => {
      let key: string
      if (groupBy === 'month') {
        key = t.date.toISOString().substring(0, 7)
      } else {
        key = (t[groupBy as keyof typeof t] as string) || 'Uncategorized'
      }
      if (!grouped[key]) grouped[key] = { count: 0, total: 0 }
      grouped[key].count++
      grouped[key].total += Number(t.amount)
    })

    return JSON.stringify({
      period,
      dateRange: { from: startDate.toISOString().split('T')[0], to: endDate.toISOString().split('T')[0] },
      totals: {
        income: formatCurrency(income),
        expenses: formatCurrency(expenses),
        netCashFlow: formatCurrency(netCashFlow),
        transactionCount: transactions.length
      },
      breakdown: Object.entries(grouped).map(([key, val]) => ({
        [groupBy]: key,
        count: val.count,
        total: formatCurrency(val.total)
      }))
    })
  },

  async get_invoices(args, orgId) {
    const where: Record<string, unknown> = { organizationId: orgId }

    if (args.status) where.status = args.status
    if (args.customerId) where.customerId = args.customerId

    if (args.startDate || args.endDate) {
      where.invoiceDate = {}
      if (args.startDate) (where.invoiceDate as Record<string, unknown>).gte = new Date(args.startDate as string)
      if (args.endDate) (where.invoiceDate as Record<string, unknown>).lte = new Date(args.endDate as string)
    }

    if (args.overdue) {
      where.status = { in: ['sent', 'partially_paid'] }
      where.dueDate = { lt: new Date() }
    }

    const limit = safeLimit(args.limit)
    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { invoiceDate: 'desc' },
      take: limit,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        customerName: true,
        invoiceDate: true,
        dueDate: true,
        total: true,
        currency: true,
        paidAmount: true,
        outstandingAmount: true
      }
    })

    const total = await prisma.invoice.count({ where })

    return JSON.stringify({
      invoices: invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        customerName: inv.customerName,
        invoiceDate: inv.invoiceDate.toISOString().split('T')[0],
        dueDate: inv.dueDate.toISOString().split('T')[0],
        formattedTotal: formatCurrency(Number(inv.total), inv.currency),
        formattedPaid: formatCurrency(Number(inv.paidAmount), inv.currency),
        formattedOutstanding: formatCurrency(Number(inv.outstandingAmount), inv.currency),
        isOverdue: inv.dueDate < new Date() && ['sent', 'partially_paid'].includes(inv.status)
      })),
      total,
      showing: invoices.length
    })
  },

  async get_invoice_statistics(args, orgId) {
    const { period = 'month' } = args as { period?: string }
    const { startDate, endDate } = getPeriodDateRange(period)

    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId: orgId,
        invoiceDate: { gte: startDate, lte: endDate }
      },
      select: {
        status: true,
        total: true,
        paidAmount: true,
        outstandingAmount: true,
        dueDate: true
      }
    })

    const now = new Date()
    const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.total), 0)
    const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0)
    const totalDue = invoices.reduce((sum, inv) => sum + Number(inv.outstandingAmount), 0)
    const overdueInvoices = invoices.filter(inv => inv.dueDate < now && Number(inv.outstandingAmount) > 0)
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + Number(inv.outstandingAmount), 0)

    // Status breakdown
    const byStatus: Record<string, number> = {}
    invoices.forEach(inv => {
      byStatus[inv.status] = (byStatus[inv.status] || 0) + 1
    })

    return JSON.stringify({
      period,
      dateRange: { from: startDate.toISOString().split('T')[0], to: endDate.toISOString().split('T')[0] },
      summary: {
        totalInvoices: invoices.length,
        totalAmount: formatCurrency(totalAmount),
        totalPaid: formatCurrency(totalPaid),
        totalOutstanding: formatCurrency(totalDue),
        paymentRate: invoices.length && totalAmount > 0 ? `${((totalPaid / totalAmount) * 100).toFixed(1)}%` : 'N/A'
      },
      overdue: {
        count: overdueInvoices.length,
        amount: formatCurrency(overdueAmount)
      },
      byStatus
    })
  },

  async get_receipts(args, orgId) {
    const where: Record<string, unknown> = { organizationId: orgId, deletedAt: null }

    if (args.status) where.status = args.status
    if (args.category) where.category = args.category
    if (args.vendor) where.vendor = { contains: args.vendor as string, mode: 'insensitive' }

    if (args.startDate || args.endDate) {
      where.date = {}
      if (args.startDate) (where.date as Record<string, unknown>).gte = new Date(args.startDate as string)
      if (args.endDate) (where.date as Record<string, unknown>).lte = new Date(args.endDate as string)
    }

    const limit = safeLimit(args.limit)
    const receipts = await prisma.receipt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        fileName: true,
        vendor: true,
        amount: true,
        date: true,
        category: true,
        status: true
      }
    })

    const total = await prisma.receipt.count({ where })

    return JSON.stringify({
      receipts: receipts.map(r => ({
        id: r.id,
        fileName: r.fileName,
        vendor: r.vendor,
        category: r.category,
        status: r.status,
        date: r.date?.toISOString().split('T')[0] || null,
        formattedAmount: r.amount ? formatCurrency(Number(r.amount)) : 'N/A'
      })),
      total,
      showing: receipts.length
    })
  },

  async get_assets(args, orgId) {
    const where: Record<string, unknown> = { organizationId: orgId }

    if (args.status) where.status = args.status
    if (args.category) where.category = args.category

    const limit = safeLimit(args.limit)
    const assets = await prisma.asset.findMany({
      where,
      orderBy: { acquisitionDate: 'desc' },
      take: limit,
      select: {
        id: true,
        assetNumber: true,
        name: true,
        category: true,
        subcategory: true,
        status: true,
        acquisitionDate: true,
        acquisitionCost: true,
        currentBookValue: true,
        currency: true
      }
    })

    const total = await prisma.asset.count({ where })

    return JSON.stringify({
      assets: assets.map(a => ({
        id: a.id,
        assetNumber: a.assetNumber,
        name: a.name,
        category: a.category,
        subcategory: a.subcategory,
        status: a.status,
        acquisitionDate: a.acquisitionDate.toISOString().split('T')[0],
        formattedCost: formatCurrency(Number(a.acquisitionCost), a.currency),
        formattedBookValue: formatCurrency(Number(a.currentBookValue), a.currency)
      })),
      total,
      showing: assets.length
    })
  },

  async get_customers(args, orgId) {
    const where: Record<string, unknown> = { organizationId: orgId }

    if (args.status) where.status = args.status

    const limit = safeLimit(args.limit)
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        type: true,
        industry: true,
        totalRevenue: true,
        outstandingBalance: true,
        currency: true
      }
    })

    const total = await prisma.customer.count({ where })

    return JSON.stringify({
      customers: customers.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        status: c.status,
        type: c.type,
        industry: c.industry,
        formattedRevenue: c.totalRevenue ? formatCurrency(Number(c.totalRevenue), c.currency || 'EUR') : 'N/A',
        formattedOutstanding: c.outstandingBalance ? formatCurrency(Number(c.outstandingBalance), c.currency || 'EUR') : 'N/A'
      })),
      total,
      showing: customers.length
    })
  },

  async get_financial_accounts(args, orgId) {
    const where: Record<string, unknown> = { organizationId: orgId }

    if (args.type) where.type = args.type

    const limit = safeLimit(args.limit, 50, 200)
    const accounts = await prisma.financialAccount.findMany({
      where,
      orderBy: { accountNumber: 'asc' },
      take: limit,
      select: {
        id: true,
        accountNumber: true,
        name: true,
        type: true,
        balance: true,
        currency: true,
        isActive: true
      }
    })

    const total = await prisma.financialAccount.count({ where })

    return JSON.stringify({
      accounts: accounts.map(a => ({
        id: a.id,
        accountNumber: a.accountNumber,
        name: a.name,
        type: a.type,
        isActive: a.isActive,
        formattedBalance: formatCurrency(Number(a.balance), a.currency)
      })),
      total,
      showing: accounts.length
    })
  },

  async get_receivables(args, orgId) {
    const where: Record<string, unknown> = { organizationId: orgId }

    if (args.status) where.status = args.status

    const limit = safeLimit(args.limit)
    const receivables = await prisma.receivable.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      take: limit,
      select: {
        id: true,
        originReferenceId: true,
        debtorName: true,
        status: true,
        originalAmount: true,
        outstandingAmount: true,
        currency: true,
        issueDate: true,
        dueDate: true,
        agingBucket: true
      }
    })

    const total = await prisma.receivable.count({ where })

    return JSON.stringify({
      receivables: receivables.map(r => ({
        id: r.id,
        referenceId: r.originReferenceId,
        debtorName: r.debtorName,
        status: r.status,
        agingBucket: r.agingBucket,
        issueDate: r.issueDate.toISOString().split('T')[0],
        dueDate: r.dueDate.toISOString().split('T')[0],
        formattedOriginal: formatCurrency(Number(r.originalAmount), r.currency),
        formattedOutstanding: formatCurrency(Number(r.outstandingAmount), r.currency),
        isOverdue: r.dueDate < new Date() && r.status === 'open'
      })),
      total,
      showing: receivables.length
    })
  },

  async get_projects(args, orgId) {
    const where: Record<string, unknown> = { organizationId: orgId }

    if (args.status) where.status = args.status

    const limit = safeLimit(args.limit)
    const projects = await prisma.project.findMany({
      where,
      orderBy: { plannedStartDate: 'desc' },
      take: limit,
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        plannedStartDate: true,
        plannedEndDate: true,
        actualStartDate: true,
        actualEndDate: true,
        budgetAmount: true,
        budgetSpent: true,
        budgetUtilization: true,
        currency: true
      }
    })

    const total = await prisma.project.count({ where })

    return JSON.stringify({
      projects: projects.map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        status: p.status,
        plannedStartDate: p.plannedStartDate.toISOString().split('T')[0],
        plannedEndDate: p.plannedEndDate.toISOString().split('T')[0],
        actualStartDate: p.actualStartDate?.toISOString().split('T')[0] || null,
        actualEndDate: p.actualEndDate?.toISOString().split('T')[0] || null,
        formattedBudget: formatCurrency(Number(p.budgetAmount), p.currency),
        formattedSpent: formatCurrency(Number(p.budgetSpent), p.currency),
        budgetUtilization: `${Number(p.budgetUtilization).toFixed(1)}%`
      })),
      total,
      showing: projects.length
    })
  },

  async get_kpis(args, orgId) {
    const where: Record<string, unknown> = { organizationId: orgId }

    if (args.category) where.category = args.category

    const kpis = await prisma.kPI.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        currentValue: true,
        targetValue: true,
        unit: true,
        trend: true,
        status: true
      }
    })

    return JSON.stringify({
      kpis: kpis.map(k => ({
        id: k.id,
        name: k.name,
        code: k.code,
        category: k.category,
        unit: k.unit,
        trend: k.trend,
        status: k.status,
        currentValue: Number(k.currentValue),
        targetValue: k.targetValue ? Number(k.targetValue) : null,
        achievement: k.targetValue
          ? `${((Number(k.currentValue) / Number(k.targetValue)) * 100).toFixed(1)}%`
          : 'N/A'
      })),
      total: kpis.length
    })
  }
}

export async function executeToolCall(
  toolName: string,
  args: HandlerArgs,
  organizationId: string
): Promise<string> {
  const handler = handlers[toolName as ToolName]

  if (!handler) {
    return JSON.stringify({ error: `Unknown tool: ${toolName}` })
  }

  try {
    return await handler(args, organizationId)
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error)
    return JSON.stringify({
      error: `Failed to execute ${toolName}`,
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
