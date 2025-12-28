import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Placeholder investors data
    const investors = [
      {
        id: '1',
        name: 'Acme Ventures',
        type: 'vc',
        ownership: 15.5,
        investedAmount: 2000000,
        currency: 'USD',
        joinedAt: '2023-01-15',
        status: 'active',
      },
      {
        id: '2',
        name: 'Angel Investor Group',
        type: 'angel',
        ownership: 5.0,
        investedAmount: 500000,
        currency: 'USD',
        joinedAt: '2022-06-01',
        status: 'active',
      },
    ]

    return NextResponse.json({ investors })
  } catch (error) {
    console.error('Investors error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch investors' },
      { status: 500 }
    )
  }
}
