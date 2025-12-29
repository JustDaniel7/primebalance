import { NextResponse } from 'next/server'
import { getSessionWithOrg, unauthorized } from '@/lib/api-utils'

export async function GET() {
  try {
    const user = await getSessionWithOrg()
    if (!user?.organizationId) return unauthorized()

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
