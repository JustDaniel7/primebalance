// src/app/api/dashboard/route.ts
// Dashboard API - GET metrics and summary data
// OPTIMIZED: Reduced from 9+ sequential queries to 4 parallel queries
// CACHED: Dashboard metrics are cached for 5 minutes per organization

import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized } from '@/lib/api-utils'
import { CACHE_TTL, CACHE_TAGS } from '@/lib/cache'
import { logger } from '@/lib/logger'

// Helper to get month key from date (YYYY-MM format)
function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`
}

// Types for dashboard data
interface DashboardMetrics {
  totalBalance: number
  totalLiabilities: number
  netWorth: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyNet: number
  ytdRevenue: number
  ytdExpenses: number
  ytdNet: number
  pendingTransactions: number
  incomeChange: number
  expenseChange: number
  grossMargin: number
}

interface CashFlowEntry {
  month: string
  income: number
  expenses: number
  net: number
}

interface RecentTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: string
  category: string | null
  status: string
}

interface DashboardData {
  metrics: DashboardMetrics
  recentTransactions: RecentTransaction[]
  expensesByCategory: Record<string, number>
  cashFlowData: CashFlowEntry[]
}

/**
 * Core function to fetch dashboard data from database
 * This is wrapped with unstable_cache for server-side caching
 */
async function fetchDashboardDataCore(organizationId: string): Promise<DashboardData> {
  logger.debug('Fetching fresh dashboard data', { organizationId })

  // Date ranges
  const now = new Date()
  const currentMonthKey = getMonthKey(now)
  const lastMonthKey = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1))
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  // Execute all queries in parallel (reduced from 9+ to 4 queries)
  const [allTransactions, accounts, pendingCount, recentTransactions] = await Promise.all([
    // Single query for all transactions in 6-month window
    prisma.transaction.findMany({
      where: {
        organizationId,
        date: { gte: sixMonthsAgo },
        status: 'COMPLETED',
      },
      select: {
        date: true,
        type: true,
        amount: true,
        category: true,
      },
    }),
    // Account balances
    prisma.financialAccount.findMany({
      where: { organizationId, isActive: true },
      select: { type: true, balance: true },
    }),
    // Pending count
    prisma.transaction.count({
      where: { organizationId, status: 'PENDING' },
    }),
    // Recent transactions
    prisma.transaction.findMany({
      where: { organizationId },
      orderBy: { date: 'desc' },
      take: 5,
      select: {
        id: true,
        date: true,
        description: true,
        amount: true,
        type: true,
        category: true,
        status: true,
      },
    }),
  ])

  // Process all metrics in a single pass through transactions
  const monthlyData: Record<string, { income: number; expenses: number }> = {}
  let ytdRevenue = 0
  let ytdExpenses = 0
  const expensesByCategory: Record<string, number> = {}

  for (const tx of allTransactions) {
    const amount = Number(tx.amount)
    const monthKey = getMonthKey(tx.date)
    const isYTD = tx.date >= startOfYear

    // Initialize month data if needed
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expenses: 0 }
    }

    if (tx.type === 'INCOME') {
      monthlyData[monthKey].income += amount
      if (isYTD) ytdRevenue += amount
    } else if (tx.type === 'EXPENSE') {
      const absAmount = Math.abs(amount)
      monthlyData[monthKey].expenses += absAmount
      if (isYTD) ytdExpenses += absAmount

      // Track category for current month only
      if (monthKey === currentMonthKey) {
        const cat = tx.category || 'Uncategorized'
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + absAmount
      }
    }
  }

  // Extract current and last month data
  const currentMonth = monthlyData[currentMonthKey] || { income: 0, expenses: 0 }
  const lastMonth = monthlyData[lastMonthKey] || { income: 0, expenses: 0 }

  // Calculate account totals
  const totalBalance = accounts
    .filter(a => ['ASSET', 'BANK', 'CRYPTO'].includes(a.type))
    .reduce((sum, a) => sum + Number(a.balance), 0)

  const totalLiabilities = accounts
    .filter(a => a.type === 'LIABILITY')
    .reduce((sum, a) => sum + Number(a.balance), 0)

  // Calculate percentage changes
  const incomeChange = lastMonth.income > 0
    ? ((currentMonth.income - lastMonth.income) / lastMonth.income) * 100
    : 0
  const expenseChange = lastMonth.expenses > 0
    ? ((currentMonth.expenses - lastMonth.expenses) / lastMonth.expenses) * 100
    : 0

  // Build cash flow data for last 6 months (no additional queries!)
  const cashFlowData: CashFlowEntry[] = []
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = getMonthKey(monthDate)
    const data = monthlyData[monthKey] || { income: 0, expenses: 0 }

    cashFlowData.push({
      month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
    })
  }

  return {
    metrics: {
      totalBalance,
      totalLiabilities,
      netWorth: totalBalance - totalLiabilities,
      monthlyIncome: currentMonth.income,
      monthlyExpenses: currentMonth.expenses,
      monthlyNet: currentMonth.income - currentMonth.expenses,
      ytdRevenue,
      ytdExpenses,
      ytdNet: ytdRevenue - ytdExpenses,
      pendingTransactions: pendingCount,
      incomeChange: Math.round(incomeChange * 10) / 10,
      expenseChange: Math.round(expenseChange * 10) / 10,
      grossMargin: ytdRevenue > 0 ? (ytdRevenue - ytdExpenses) / ytdRevenue : 0,
    },
    recentTransactions: recentTransactions.map(t => ({
      id: t.id,
      date: t.date.toISOString().split('T')[0],
      description: t.description,
      amount: Number(t.amount),
      type: t.type.toLowerCase(),
      category: t.category,
      status: t.status.toLowerCase(),
    })),
    expensesByCategory,
    cashFlowData,
  }
}

/**
 * Create a cached version of the dashboard data fetcher
 * Cache key includes organization ID to prevent data leakage
 */
function getCachedDashboardData(organizationId: string) {
  return unstable_cache(
    () => fetchDashboardDataCore(organizationId),
    [`dashboard-${organizationId}`],
    {
      revalidate: CACHE_TTL.DASHBOARD,
      tags: [CACHE_TAGS.DASHBOARD, `dashboard-${organizationId}`],
    }
  )()
}

// GET /api/dashboard - Get dashboard metrics
export async function GET() {
  try {
    const user = await getSessionWithOrg()
    if (!user?.id || !user?.organizationId) return unauthorized()

    const organizationId = user.organizationId

    // Use cached dashboard data (5 minute TTL)
    const data = await getCachedDashboardData(organizationId)

    return NextResponse.json(data)
  } catch (error) {
    logger.error('GET /api/dashboard error', { route: '/api/dashboard' }, error as Error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
