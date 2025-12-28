import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Placeholder board reports data
    const reports = [
      {
        id: '1',
        title: 'Q4 2024 Financial Summary',
        type: 'quarterly',
        status: 'published',
        createdAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Annual Report 2024',
        type: 'annual',
        status: 'draft',
        createdAt: new Date().toISOString(),
        publishedAt: null,
      },
    ]

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Board reports error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch board reports' },
      { status: 500 }
    )
  }
}
