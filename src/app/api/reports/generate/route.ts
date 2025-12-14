// src/app/api/reports/generate/route.ts
// Report Generation API - POST to generate report data

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/reports/generate - Generate report data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, startDate, endDate } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Report type is required' },
        { status: 400 }
      )
    }

    const organizationId = session.user.organizationId
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1)
    const end = endDate ? new Date(endDate) : new Date()

    let reportData: any = {}

    switch (type.toLowerCase().replace('-', '_')) {
      case 'profit_loss':
        reportData = await generateProfitLoss(organizationId, start, end)
        break
      case 'balance_sheet':
        reportData = await generateBalanceSheet(organizationId, end)
        break
      case 'cash_flow':
        reportData = await generateCashFlow(organizationId, start, end)
        break
      case 'tax_summary':
        reportData = await generateTaxSummary(organizationId, start, end)
        break
      case 'expense_report':
        reportData = await generateExpenseReport(organizationId, start, end)
        break
      case 'income_report':
        reportData = await generateIncomeReport(organizationId, start, end)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      type,
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
      generatedAt: new Date().toISOString(),
      data: reportData,
    })
  } catch (error) {
    console.error('POST /api/reports/generate error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

// Profit & Loss Report
async function generateProfitLoss(organizationId: string, start: Date, end: Date) {
  const transactions = await prisma.transaction.findMany({
    where: {
      organizationId,
      date: { gte: start, lte: end },
      status: 'COMPLETED',
    },
  })

  const revenue = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const expenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

  // Group by category
  const revenueByCategory = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => {
      const cat = t.category || 'Uncategorized'
      acc[cat] = (acc[cat] || 0) + Number(t.amount)
      return acc
    }, {} as Record<string, number>)

  const expensesByCategory = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => {
      const cat = t.category || 'Uncategorized'
      acc[cat] = (acc[cat] || 0) + Math.abs(Number(t.amount))
      return acc
    }, {} as Record<string, number>)

  return {
    summary: {
      totalRevenue: revenue,
      totalExpenses: expenses,
      grossProfit: revenue - expenses,
      netIncome: revenue - expenses,
      profitMargin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
    },
    revenue: {
      total: revenue,
      byCategory: revenueByCategory,
    },
    expenses: {
      total: expenses,
      byCategory: expensesByCategory,
    },
  }
}

// Balance Sheet Report
async function generateBalanceSheet(organizationId: string, asOfDate: Date) {
  const accounts = await prisma.financialAccount.findMany({
    where: { organizationId, isActive: true },
  })

  const assets = accounts
    .filter(a => ['ASSET', 'BANK', 'CRYPTO'].includes(a.type))
    .reduce((sum, a) => sum + Number(a.balance), 0)

  const liabilities = accounts
    .filter(a => a.type === 'LIABILITY')
    .reduce((sum, a) => sum + Number(a.balance), 0)

  const equity = accounts
    .filter(a => a.type === 'EQUITY')
    .reduce((sum, a) => sum + Number(a.balance), 0)

  // Group accounts by type
  const accountsByType = accounts.reduce((acc, a) => {
    const type = a.type.toLowerCase()
    if (!acc[type]) acc[type] = []
    acc[type].push({
      name: a.name,
      accountNumber: a.accountNumber,
      balance: Number(a.balance),
    })
    return acc
  }, {} as Record<string, any[]>)

  return {
    asOfDate: asOfDate.toISOString().split('T')[0],
    summary: {
      totalAssets: assets,
      totalLiabilities: liabilities,
      totalEquity: equity,
      netWorth: assets - liabilities,
    },
    assets: {
      total: assets,
      accounts: [...(accountsByType.asset || []), ...(accountsByType.bank || []), ...(accountsByType.crypto || [])],
    },
    liabilities: {
      total: liabilities,
      accounts: accountsByType.liability || [],
    },
    equity: {
      total: equity,
      accounts: accountsByType.equity || [],
    },
  }
}

// Cash Flow Report
async function generateCashFlow(organizationId: string, start: Date, end: Date) {
  const transactions = await prisma.transaction.findMany({
    where: {
      organizationId,
      date: { gte: start, lte: end },
      status: 'COMPLETED',
    },
    orderBy: { date: 'asc' },
  })

  // Group by month
  const monthlyFlow = transactions.reduce((acc, t) => {
    const month = t.date.toISOString().substring(0, 7)
    if (!acc[month]) {
      acc[month] = { income: 0, expenses: 0, net: 0 }
    }
    if (t.type === 'INCOME') {
      acc[month].income += Number(t.amount)
    } else if (t.type === 'EXPENSE') {
      acc[month].expenses += Math.abs(Number(t.amount))
    }
    acc[month].net = acc[month].income - acc[month].expenses
    return acc
  }, {} as Record<string, { income: number; expenses: number; net: number }>)

  const operatingIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const operatingExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

  return {
    summary: {
      operatingCashFlow: operatingIncome - operatingExpenses,
      investingCashFlow: 0,
      financingCashFlow: 0,
      netCashFlow: operatingIncome - operatingExpenses,
    },
    monthlyBreakdown: Object.entries(monthlyFlow).map(([month, data]) => ({
      month,
      ...data,
    })),
    operating: {
      inflows: operatingIncome,
      outflows: operatingExpenses,
      net: operatingIncome - operatingExpenses,
    },
  }
}

// Tax Summary Report
async function generateTaxSummary(organizationId: string, start: Date, end: Date) {
  const transactions = await prisma.transaction.findMany({
    where: {
      organizationId,
      date: { gte: start, lte: end },
      status: 'COMPLETED',
    },
  })

  const income = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const deductibleExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

  // Estimate tax (simplified)
  const taxableIncome = income - deductibleExpenses
  const estimatedTax = taxableIncome > 0 ? taxableIncome * 0.25 : 0

  // Group deductions by category
  const deductionsByCategory = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => {
      const cat = t.category || 'Uncategorized'
      acc[cat] = (acc[cat] || 0) + Math.abs(Number(t.amount))
      return acc
    }, {} as Record<string, number>)

  return {
    summary: {
      grossIncome: income,
      totalDeductions: deductibleExpenses,
      taxableIncome,
      estimatedTax,
      effectiveRate: income > 0 ? (estimatedTax / income) * 100 : 0,
    },
    income: {
      total: income,
    },
    deductions: {
      total: deductibleExpenses,
      byCategory: deductionsByCategory,
    },
    quarterly: {
      q1: { estimated: estimatedTax / 4, due: 'April 15' },
      q2: { estimated: estimatedTax / 4, due: 'June 15' },
      q3: { estimated: estimatedTax / 4, due: 'September 15' },
      q4: { estimated: estimatedTax / 4, due: 'January 15' },
    },
  }
}

// Expense Report
async function generateExpenseReport(organizationId: string, start: Date, end: Date) {
  const transactions = await prisma.transaction.findMany({
    where: {
      organizationId,
      date: { gte: start, lte: end },
      type: 'EXPENSE',
      status: 'COMPLETED',
    },
    orderBy: { date: 'desc' },
  })

  const total = transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

  const byCategory = transactions.reduce((acc, t) => {
    const cat = t.category || 'Uncategorized'
    acc[cat] = (acc[cat] || 0) + Math.abs(Number(t.amount))
    return acc
  }, {} as Record<string, number>)

  const byMonth = transactions.reduce((acc, t) => {
    const month = t.date.toISOString().substring(0, 7)
    acc[month] = (acc[month] || 0) + Math.abs(Number(t.amount))
    return acc
  }, {} as Record<string, number>)

  return {
    summary: {
      total,
      count: transactions.length,
      average: transactions.length > 0 ? total / transactions.length : 0,
    },
    byCategory: Object.entries(byCategory)
      .map(([category, amount]) => ({ category, amount, percentage: (amount / total) * 100 }))
      .sort((a, b) => b.amount - a.amount),
    byMonth: Object.entries(byMonth)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    transactions: transactions.slice(0, 100).map(t => ({
      id: t.id,
      date: t.date.toISOString().split('T')[0],
      description: t.description,
      amount: Math.abs(Number(t.amount)),
      category: t.category,
    })),
  }
}

// Income Report
async function generateIncomeReport(organizationId: string, start: Date, end: Date) {
  const transactions = await prisma.transaction.findMany({
    where: {
      organizationId,
      date: { gte: start, lte: end },
      type: 'INCOME',
      status: 'COMPLETED',
    },
    orderBy: { date: 'desc' },
  })

  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0)

  const byCategory = transactions.reduce((acc, t) => {
    const cat = t.category || 'Uncategorized'
    acc[cat] = (acc[cat] || 0) + Number(t.amount)
    return acc
  }, {} as Record<string, number>)

  const byMonth = transactions.reduce((acc, t) => {
    const month = t.date.toISOString().substring(0, 7)
    acc[month] = (acc[month] || 0) + Number(t.amount)
    return acc
  }, {} as Record<string, number>)

  return {
    summary: {
      total,
      count: transactions.length,
      average: transactions.length > 0 ? total / transactions.length : 0,
    },
    byCategory: Object.entries(byCategory)
      .map(([category, amount]) => ({ category, amount, percentage: (amount / total) * 100 }))
      .sort((a, b) => b.amount - a.amount),
    byMonth: Object.entries(byMonth)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    transactions: transactions.slice(0, 100).map(t => ({
      id: t.id,
      date: t.date.toISOString().split('T')[0],
      description: t.description,
      amount: Number(t.amount),
      category: t.category,
    })),
  }
}