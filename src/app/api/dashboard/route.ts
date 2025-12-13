// src/app/api/dashboard/route.ts
// Dashboard API - GET metrics and summary data

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'


// GET /api/dashboard - Get dashboard metrics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = session.user.organizationId

    // Date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    // Current month transactions
    const currentMonthTx = await prisma.transaction.findMany({
      where: {
        organizationId,
        date: { gte: startOfMonth },
        status: 'COMPLETED',
      },
    })

    // Last month transactions
    const lastMonthTx = await prisma.transaction.findMany({
      where: {
        organizationId,
        date: { gte: startOfLastMonth, lte: endOfLastMonth },
        status: 'COMPLETED',
      },
    })

    // Year to date transactions
    const ytdTx = await prisma.transaction.findMany({
      where: {
        organizationId,
        date: { gte: startOfYear },
        status: 'COMPLETED',
      },
    })

    // Calculate metrics
    const currentMonthIncome = currentMonthTx
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const currentMonthExpenses = currentMonthTx
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

    const lastMonthIncome = lastMonthTx
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const lastMonthExpenses = lastMonthTx
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

    const ytdRevenue = ytdTx
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const ytdExpenses = ytdTx
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

    // Get total balance from accounts
    const accounts = await prisma.financialAccount.findMany({
      where: { organizationId, isActive: true },
    })

    const totalBalance = accounts
      .filter(a => ['ASSET', 'BANK', 'CRYPTO'].includes(a.type))
      .reduce((sum, a) => sum + Number(a.balance), 0)

    const totalLiabilities = accounts
      .filter(a => a.type === 'LIABILITY')
      .reduce((sum, a) => sum + Number(a.balance), 0)

    // Pending transactions count
    const pendingCount = await prisma.transaction.count({
      where: { organizationId, status: 'PENDING' },
    })

    // Recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { organizationId },
      orderBy: { date: 'desc' },
      take: 5,
    })

    // Expense breakdown by category (current month)
    const expensesByCategory = currentMonthTx
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, t) => {
        const cat = t.category || 'Uncategorized'
        acc[cat] = (acc[cat] || 0) + Math.abs(Number(t.amount))
        return acc
      }, {} as Record<string, number>)

    // Calculate percentage changes
    const incomeChange = lastMonthIncome > 0 
      ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 
      : 0
    const expenseChange = lastMonthExpenses > 0 
      ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
      : 0

    // Cash flow for last 6 months
    const cashFlowData = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const monthTx = await prisma.transaction.findMany({
        where: {
          organizationId,
          date: { gte: monthStart, lte: monthEnd },
          status: 'COMPLETED',
        },
      })

      const income = monthTx
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      
      const expenses = monthTx
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

      cashFlowData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        income,
        expenses,
        net: income - expenses,
      })
    }

    return NextResponse.json({
      metrics: {
        totalBalance,
        totalLiabilities,
        netWorth: totalBalance - totalLiabilities,
        monthlyIncome: currentMonthIncome,
        monthlyExpenses: currentMonthExpenses,
        monthlyNet: currentMonthIncome - currentMonthExpenses,
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
    })
  } catch (error) {
    console.error('GET /api/dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}