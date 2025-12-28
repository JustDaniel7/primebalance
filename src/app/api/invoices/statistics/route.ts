import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = session.user.organizationId

    // Get invoice counts by status
    const [total, draft, sent, paid, overdue, cancelled] = await Promise.all([
      prisma.invoice.count({ where: { organizationId } }),
      prisma.invoice.count({ where: { organizationId, status: 'draft' } }),
      prisma.invoice.count({ where: { organizationId, status: 'sent' } }),
      prisma.invoice.count({ where: { organizationId, status: 'paid' } }),
      prisma.invoice.count({ where: { organizationId, status: 'overdue' } }),
      prisma.invoice.count({ where: { organizationId, status: 'cancelled' } }),
    ])

    // Get totals by status
    const totals = await prisma.invoice.groupBy({
      by: ['status'],
      where: { organizationId },
      _sum: { total: true },
    })

    const totalsByStatus = totals.reduce((acc, item) => {
      acc[item.status] = Number(item._sum.total || 0)
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      counts: {
        total,
        draft,
        sent,
        paid,
        overdue,
        cancelled,
      },
      totals: {
        total: Object.values(totalsByStatus).reduce((a, b) => a + b, 0),
        draft: totalsByStatus['draft'] || 0,
        sent: totalsByStatus['sent'] || 0,
        paid: totalsByStatus['paid'] || 0,
        overdue: totalsByStatus['overdue'] || 0,
        cancelled: totalsByStatus['cancelled'] || 0,
      },
    })
  } catch (error) {
    console.error('Invoice statistics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice statistics' },
      { status: 500 }
    )
  }
}
