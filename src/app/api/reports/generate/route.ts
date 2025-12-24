// src/app/api/reports/generate/route.ts
// REPLACE: Fixed Prisma field names and Decimal handling

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

interface DateRange {
  start: Date
  end: Date
}

function getDateRange(period: string): DateRange {
  const now = new Date()
  const start = new Date()
  const end = new Date()

  switch (period) {
    case 'week':
      start.setDate(now.getDate() - 7)
      break
    case 'month':
      start.setMonth(now.getMonth() - 1)
      break
    case 'quarter':
      start.setMonth(now.getMonth() - 3)
      break
    case 'year':
      start.setFullYear(now.getFullYear() - 1)
      break
    case 'ytd':
      start.setMonth(0, 1)
      start.setHours(0, 0, 0, 0)
      break
    default:
      start.setMonth(now.getMonth() - 1)
  }

  return { start, end }
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const body = await req.json()
  const { reportType, period = 'month' } = body

  if (!reportType) {
    return badRequest('Report type is required')
  }

  const dateRange = getDateRange(period)
  const orgId = user.organizationId

  try {
    let reportData: unknown = null

    switch (reportType) {
      case 'profit-loss':
      case 'profit_loss':
        reportData = await generateProfitLoss(orgId, dateRange)
        break

      case 'balance-sheet':
      case 'balance_sheet':
        reportData = await generateBalanceSheet(orgId, dateRange)
        break

      case 'cash-flow':
      case 'cash_flow':
        reportData = await generateCashFlow(orgId, dateRange)
        break

      case 'expense-report':
      case 'expense_report':
        reportData = await generateExpenseReport(orgId, dateRange)
        break

      case 'income-report':
      case 'income_report':
        reportData = await generateIncomeReport(orgId, dateRange)
        break

      case 'tax-summary':
      case 'tax_summary':
        reportData = await generateTaxSummary(orgId, dateRange)
        break

      case 'ar-aging':
      case 'ar_aging':
        reportData = await generateARAgingReport(orgId)
        break

      case 'ap-aging':
      case 'ap_aging':
        reportData = await generateAPAgingReport(orgId)
        break

      case 'inventory-valuation':
      case 'inventory_valuation':
        reportData = await generateInventoryValuation(orgId)
        break

      case 'asset-register':
      case 'asset_register':
        reportData = await generateAssetRegister(orgId)
        break

      default:
        return badRequest(`Unknown report type: ${reportType}`)
    }

    return NextResponse.json({
      success: true,
      reportType,
      period,
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      },
      data: reportData,
    })
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
        { error: 'Failed to generate report', details: (error as Error).message },
        { status: 500 }
    )
  }
}

// ============================================================================
// REPORT GENERATORS
// ============================================================================

async function generateProfitLoss(orgId: string, dateRange: DateRange) {
  // Get transactions grouped by type
  const transactions = await prisma.transaction.findMany({
    where: {
      organizationId: orgId,
      date: { gte: dateRange.start, lte: dateRange.end },
      status: 'completed',
    },
    include: { account: true },
  })

  // Get invoices
  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: orgId,
      invoiceDate: { gte: dateRange.start, lte: dateRange.end },
      status: 'paid',
    },
  })

  const revenue = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

  const invoiceRevenue = invoices.reduce((sum, i) => sum + Number(i.total), 0)

  const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const netIncome = revenue + invoiceRevenue - expenses

  // Group by category
  const byCategory: Record<string, number> = {}
  transactions.forEach(t => {
    const cat = t.category || 'Uncategorized'
    byCategory[cat] = (byCategory[cat] || 0) + (t.type === 'income' ? t.amount : -Math.abs(t.amount))
  })

  return {
    headers: ['Category', 'Amount'],
    rows: [
      { id: '1', category: 'Revenue (Transactions)', amount: revenue },
      { id: '2', category: 'Revenue (Invoices)', amount: invoiceRevenue },
      { id: '3', category: 'Total Revenue', amount: revenue + invoiceRevenue },
      { id: '4', category: 'Expenses', amount: -expenses },
      { id: '5', category: 'Net Income', amount: netIncome },
    ],
    totals: { amount: netIncome },
    summary: {
      totalRevenue: revenue + invoiceRevenue,
      totalExpenses: expenses,
      netIncome,
      transactionCount: transactions.length,
      invoiceCount: invoices.length,
    },
    byCategory,
    currency: 'USD',
  }
}

async function generateBalanceSheet(orgId: string, dateRange: DateRange) {
  // Get accounts
  const accounts = await prisma.financialAccount.findMany({
    where: { organizationId: orgId, isActive: true },
  })

  // Get receivables
  const receivables = await prisma.receivable.findMany({
    where: { organizationId: orgId, status: { not: 'paid' } },
  })

  // Get liabilities
  const liabilities = await prisma.liability.findMany({
    where: { organizationId: orgId, status: { not: 'paid_off' } },
  })

  // Get assets - use status field, not isActive
  const assets = await prisma.asset.findMany({
    where: {
      organizationId: orgId,
      status: { in: ['active', 'in_use', 'fully_depreciated'] }
    },
  })

  // Get treasury accounts
  const treasuryAccounts = await prisma.treasuryAccount.findMany({
    where: { organizationId: orgId, status: 'active' },
  })

  const totalAssets = accounts
      .filter(a => a.type === 'asset' || a.type === 'bank')
      .reduce((sum, a) => sum + a.balance, 0)

  const totalReceivables = receivables.reduce((sum, r) => sum + Number(r.outstandingAmount), 0)

  const fixedAssets = assets.reduce((sum, a) => sum + Number(a.acquisitionCost), 0)

  const totalCash = treasuryAccounts.reduce((sum, t) => sum + Number(t.currentBalance), 0)

  const totalLiabilities = liabilities.reduce((sum, l) => sum + Number(l.outstandingAmount), 0)

  const equity = (totalAssets + totalReceivables + fixedAssets + totalCash) - totalLiabilities

  return {
    headers: ['Category', 'Amount'],
    rows: [
      { id: '1', category: 'Cash & Bank', amount: totalCash },
      { id: '2', category: 'Accounts Receivable', amount: totalReceivables },
      { id: '3', category: 'Fixed Assets', amount: fixedAssets },
      { id: '4', category: 'Other Assets', amount: totalAssets },
      { id: '5', category: 'Total Assets', amount: totalCash + totalReceivables + fixedAssets + totalAssets },
      { id: '6', category: 'Liabilities', amount: totalLiabilities },
      { id: '7', category: 'Equity', amount: equity },
    ],
    totals: {
      assets: totalCash + totalReceivables + fixedAssets + totalAssets,
      liabilities: totalLiabilities,
      equity,
    },
    summary: {
      cashBalance: totalCash,
      receivablesBalance: totalReceivables,
      fixedAssetsValue: fixedAssets,
      totalLiabilities,
      netWorth: equity,
    },
    currency: 'USD',
  }
}

async function generateCashFlow(orgId: string, dateRange: DateRange) {
  const transactions = await prisma.transaction.findMany({
    where: {
      organizationId: orgId,
      date: { gte: dateRange.start, lte: dateRange.end },
      status: 'completed',
    },
  })

  const inflows = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

  const outflows = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const netCashFlow = inflows - outflows

  // Get treasury movements - use 'type' field with correct values
  let operatingInflows = 0
  let operatingOutflows = 0

  try {
    const treasuryMovements = await prisma.treasuryCashMovement.findMany({
      where: {
        movementDate: { gte: dateRange.start, lte: dateRange.end },
      },
    })

    // TreasuryCashMovement uses 'type' field with values: inflow, outflow, transfer_in, transfer_out
    operatingInflows = treasuryMovements
        .filter(m => (m.type === 'inflow' || m.type === 'transfer_in') && m.category === 'operating')
        .reduce((sum, m) => sum + Number(m.amount), 0)

    operatingOutflows = treasuryMovements
        .filter(m => (m.type === 'outflow' || m.type === 'transfer_out') && m.category === 'operating')
        .reduce((sum, m) => sum + Number(m.amount), 0)
  } catch {
    // Treasury movements table might not exist or be empty
  }

  const totalInflows = inflows + operatingInflows
  const totalOutflows = outflows + operatingOutflows

  return {
    headers: ['Category', 'Inflows', 'Outflows', 'Net'],
    rows: [
      { id: '1', category: 'Operating Activities', inflows: totalInflows, outflows: totalOutflows, net: totalInflows - totalOutflows },
      { id: '2', category: 'Investing Activities', inflows: 0, outflows: 0, net: 0 },
      { id: '3', category: 'Financing Activities', inflows: 0, outflows: 0, net: 0 },
      { id: '4', category: 'Net Cash Flow', inflows: totalInflows, outflows: totalOutflows, net: netCashFlow },
    ],
    totals: {
      inflows: totalInflows,
      outflows: totalOutflows,
      net: netCashFlow,
    },
    summary: {
      operatingCashFlow: netCashFlow,
      investingCashFlow: 0,
      financingCashFlow: 0,
      netChange: netCashFlow,
    },
    currency: 'USD',
  }
}

async function generateExpenseReport(orgId: string, dateRange: DateRange) {
  const transactions = await prisma.transaction.findMany({
    where: {
      organizationId: orgId,
      date: { gte: dateRange.start, lte: dateRange.end },
      type: 'expense',
    },
    include: { account: true },
  })

  // Group by category
  const byCategory: Record<string, { count: number; amount: number }> = {}
  transactions.forEach(t => {
    const cat = t.category || 'Uncategorized'
    if (!byCategory[cat]) byCategory[cat] = { count: 0, amount: 0 }
    byCategory[cat].count += 1
    byCategory[cat].amount += Math.abs(t.amount)
  })

  const rows = Object.entries(byCategory).map(([category, data], i) => ({
    id: String(i + 1),
    category,
    count: data.count,
    amount: data.amount,
  }))

  const totalExpenses = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)

  return {
    headers: ['Category', 'Count', 'Amount'],
    rows,
    totals: { amount: totalExpenses },
    summary: {
      totalExpenses,
      transactionCount: transactions.length,
      categoryCount: Object.keys(byCategory).length,
      averageExpense: transactions.length > 0 ? totalExpenses / transactions.length : 0,
    },
    currency: 'USD',
  }
}

async function generateIncomeReport(orgId: string, dateRange: DateRange) {
  const transactions = await prisma.transaction.findMany({
    where: {
      organizationId: orgId,
      date: { gte: dateRange.start, lte: dateRange.end },
      type: 'income',
    },
  })

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: orgId,
      invoiceDate: { gte: dateRange.start, lte: dateRange.end },
      status: 'paid',
    },
  })

  const transactionIncome = transactions.reduce((sum, t) => sum + t.amount, 0)
  const invoiceIncome = invoices.reduce((sum, i) => sum + Number(i.total), 0)

  return {
    headers: ['Source', 'Count', 'Amount'],
    rows: [
      { id: '1', source: 'Transaction Income', count: transactions.length, amount: transactionIncome },
      { id: '2', source: 'Invoice Income', count: invoices.length, amount: invoiceIncome },
      { id: '3', source: 'Total', count: transactions.length + invoices.length, amount: transactionIncome + invoiceIncome },
    ],
    totals: { amount: transactionIncome + invoiceIncome },
    summary: {
      totalIncome: transactionIncome + invoiceIncome,
      transactionCount: transactions.length,
      invoiceCount: invoices.length,
    },
    currency: 'USD',
  }
}

async function generateTaxSummary(orgId: string, dateRange: DateRange) {
  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: orgId,
      invoiceDate: { gte: dateRange.start, lte: dateRange.end },
    },
  })

  const totalSales = invoices.reduce((sum, i) => sum + Number(i.subtotal), 0)
  const totalTax = invoices.reduce((sum, i) => sum + Number(i.taxAmount), 0)
  const totalWithTax = invoices.reduce((sum, i) => sum + Number(i.total), 0)

  // Get liabilities with tax type
  const taxLiabilities = await prisma.liability.findMany({
    where: {
      organizationId: orgId,
      type: 'tax',
    },
  })

  const taxOwed = taxLiabilities.reduce((sum, l) => sum + Number(l.outstandingAmount), 0)

  return {
    headers: ['Category', 'Amount'],
    rows: [
      { id: '1', category: 'Gross Sales', amount: totalSales },
      { id: '2', category: 'Tax Collected', amount: totalTax },
      { id: '3', category: 'Total with Tax', amount: totalWithTax },
      { id: '4', category: 'Tax Liabilities', amount: taxOwed },
      { id: '5', category: 'Net Tax Position', amount: totalTax - taxOwed },
    ],
    totals: { taxCollected: totalTax, taxOwed },
    summary: {
      grossSales: totalSales,
      taxCollected: totalTax,
      taxLiabilities: taxOwed,
      netTaxPosition: totalTax - taxOwed,
      effectiveRate: totalSales > 0 ? (totalTax / totalSales) * 100 : 0,
    },
    currency: 'USD',
  }
}

async function generateARAgingReport(orgId: string) {
  const receivables = await prisma.receivable.findMany({
    where: {
      organizationId: orgId,
      status: { not: 'paid' },
    },
  })

  const now = new Date()
  const buckets: Record<string, { count: number; amount: number }> = {
    current: { count: 0, amount: 0 },
    '1-30': { count: 0, amount: 0 },
    '31-60': { count: 0, amount: 0 },
    '61-90': { count: 0, amount: 0 },
    '90+': { count: 0, amount: 0 },
  }

  receivables.forEach(r => {
    const dueDate = new Date(r.dueDate)
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    const amount = Number(r.outstandingAmount)

    if (daysOverdue <= 0) {
      buckets.current.count += 1
      buckets.current.amount += amount
    } else if (daysOverdue <= 30) {
      buckets['1-30'].count += 1
      buckets['1-30'].amount += amount
    } else if (daysOverdue <= 60) {
      buckets['31-60'].count += 1
      buckets['31-60'].amount += amount
    } else if (daysOverdue <= 90) {
      buckets['61-90'].count += 1
      buckets['61-90'].amount += amount
    } else {
      buckets['90+'].count += 1
      buckets['90+'].amount += amount
    }
  })

  const totalOutstanding = receivables.reduce((sum, r) => sum + Number(r.outstandingAmount), 0)

  return {
    headers: ['Aging Bucket', 'Count', 'Amount', 'Percentage'],
    rows: Object.entries(buckets).map(([bucket, data], i) => ({
      id: String(i + 1),
      bucket,
      count: data.count,
      amount: data.amount,
      percentage: totalOutstanding > 0 ? (data.amount / totalOutstanding) * 100 : 0,
    })),
    totals: { amount: totalOutstanding },
    summary: {
      totalOutstanding,
      receivableCount: receivables.length,
      averageAmount: receivables.length > 0 ? totalOutstanding / receivables.length : 0,
      overdueAmount: buckets['1-30'].amount + buckets['31-60'].amount + buckets['61-90'].amount + buckets['90+'].amount,
    },
    buckets,
    currency: 'USD',
  }
}

async function generateAPAgingReport(orgId: string) {
  const liabilities = await prisma.liability.findMany({
    where: {
      organizationId: orgId,
      status: { not: 'paid_off' },
    },
  })

  const now = new Date()
  const buckets: Record<string, { count: number; amount: number }> = {
    current: { count: 0, amount: 0 },
    '1-30': { count: 0, amount: 0 },
    '31-60': { count: 0, amount: 0 },
    '61-90': { count: 0, amount: 0 },
    '90+': { count: 0, amount: 0 },
  }

  liabilities.forEach(l => {
    // Liability uses maturityDate, not dueDate
    const dueDate = l.maturityDate ? new Date(l.maturityDate) : new Date(l.startDate)
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    const amount = Number(l.outstandingAmount)

    if (daysOverdue <= 0) {
      buckets.current.count += 1
      buckets.current.amount += amount
    } else if (daysOverdue <= 30) {
      buckets['1-30'].count += 1
      buckets['1-30'].amount += amount
    } else if (daysOverdue <= 60) {
      buckets['31-60'].count += 1
      buckets['31-60'].amount += amount
    } else if (daysOverdue <= 90) {
      buckets['61-90'].count += 1
      buckets['61-90'].amount += amount
    } else {
      buckets['90+'].count += 1
      buckets['90+'].amount += amount
    }
  })

  const totalOutstanding = liabilities.reduce((sum, l) => sum + Number(l.outstandingAmount), 0)

  return {
    headers: ['Aging Bucket', 'Count', 'Amount', 'Percentage'],
    rows: Object.entries(buckets).map(([bucket, data], i) => ({
      id: String(i + 1),
      bucket,
      count: data.count,
      amount: data.amount,
      percentage: totalOutstanding > 0 ? (data.amount / totalOutstanding) * 100 : 0,
    })),
    totals: { amount: totalOutstanding },
    summary: {
      totalOutstanding,
      liabilityCount: liabilities.length,
      averageAmount: liabilities.length > 0 ? totalOutstanding / liabilities.length : 0,
    },
    buckets,
    currency: 'USD',
  }
}

async function generateInventoryValuation(orgId: string) {
  const inventory = await prisma.inventoryItem.findMany({
    where: { organizationId: orgId, status: { not: 'discontinued' } },
  })

  const totalValue = inventory.reduce((sum, i) => sum + Number(i.totalValue || 0), 0)
  const totalQuantity = inventory.reduce((sum, i) => sum + Number(i.quantityOnHand || 0), 0)

  // Group by category
  const byCategory: Record<string, { count: number; quantity: number; value: number }> = {}
  inventory.forEach(i => {
    const cat = i.category || 'Uncategorized'
    if (!byCategory[cat]) byCategory[cat] = { count: 0, quantity: 0, value: 0 }
    byCategory[cat].count += 1
    byCategory[cat].quantity += Number(i.quantityOnHand || 0)
    byCategory[cat].value += Number(i.totalValue || 0)
  })

  return {
    headers: ['Category', 'Items', 'Quantity', 'Value'],
    rows: Object.entries(byCategory).map(([category, data], i) => ({
      id: String(i + 1),
      category,
      items: data.count,
      quantity: data.quantity,
      value: data.value,
    })),
    totals: { quantity: totalQuantity, value: totalValue },
    summary: {
      totalItems: inventory.length,
      totalQuantity,
      totalValue,
      averageValue: inventory.length > 0 ? totalValue / inventory.length : 0,
    },
    byCategory,
    currency: 'USD',
  }
}

async function generateAssetRegister(orgId: string) {
  // Asset uses status field, not isActive
  const assets = await prisma.asset.findMany({
    where: {
      organizationId: orgId,
      status: { in: ['active', 'in_use', 'fully_depreciated'] }
    },
  })

  const totalCost = assets.reduce((sum, a) => sum + Number(a.acquisitionCost), 0)
  const totalAccumulatedDep = assets.reduce((sum, a) => sum + Number(a.accumulatedDepreciation || 0), 0)
  const totalNetBookValue = assets.reduce((sum, a) => sum + Number(a.currentBookValue), 0)

  // Group by category
  const byCategory: Record<string, { count: number; cost: number; nbv: number }> = {}
  assets.forEach(a => {
    const cat = a.category || 'Uncategorized'
    if (!byCategory[cat]) byCategory[cat] = { count: 0, cost: 0, nbv: 0 }
    byCategory[cat].count += 1
    byCategory[cat].cost += Number(a.acquisitionCost)
    byCategory[cat].nbv += Number(a.currentBookValue)
  })

  return {
    headers: ['Category', 'Count', 'Total Cost', 'Net Book Value'],
    rows: Object.entries(byCategory).map(([category, data], i) => ({
      id: String(i + 1),
      category,
      count: data.count,
      cost: data.cost,
      nbv: data.nbv,
    })),
    totals: { cost: totalCost, nbv: totalNetBookValue },
    summary: {
      totalAssets: assets.length,
      totalCost,
      totalAccumulatedDepreciation: totalAccumulatedDep,
      totalNetBookValue,
      averageCost: assets.length > 0 ? totalCost / assets.length : 0,
    },
    byCategory,
    currency: 'USD',
  }
}