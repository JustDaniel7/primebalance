// src/app/api/receipts/[id]/restore/route.ts
// NEW FILE: Restore soft-deleted receipt (within 12 hours)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound, badRequest } from '@/lib/api-utils'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getSessionWithOrg()
    if (!user?.organizationId) return unauthorized()

    const { id } = await params

    const existing = await prisma.receipt.findFirst({
        where: { id, organizationId: user.organizationId }
    })

    if (!existing) return notFound('Receipt')

    if (!existing.deletedAt) {
        return badRequest('Receipt is not deleted')
    }

    // Check 12-hour window
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000)
    if (existing.deletedAt < twelveHoursAgo) {
        return badRequest('Restore window has expired (12 hours)')
    }

    const receipt = await prisma.receipt.update({
        where: { id },
        data: {
            deletedAt: null,
            status: existing.transactionId ? 'matched' : 'unmatched'
        }
    })

    return NextResponse.json(receipt)
}