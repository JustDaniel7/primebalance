import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Placeholder runway data
    const runway = {
      currentCashBalance: 1500000,
      currency: 'USD',
      monthlyBurnRate: 85000,
      runwayMonths: 17.6,
      projectedRunwayEndDate: new Date(Date.now() + 17.6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      trend: 'stable',
      historicalBurnRates: [
        { month: '2024-09', burnRate: 82000 },
        { month: '2024-10', burnRate: 88000 },
        { month: '2024-11', burnRate: 84000 },
        { month: '2024-12', burnRate: 85000 },
      ],
      recommendations: [
        'Consider reducing cloud infrastructure costs',
        'Review contractor expenses for Q1',
      ],
    }

    return NextResponse.json(runway)
  } catch (error) {
    console.error('Runway error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch runway data' },
      { status: 500 }
    )
  }
}
