// src/app/api/receipts/[id]/permanent/route.ts
// NEW FILE: Permanently delete receipt

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils'

export async function DELETE(
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

    await prisma.receipt.delete({ where: { id } })

    return NextResponse.json({ success: true, id })
}