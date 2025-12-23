// src/app/api/receipts/[id]/route.ts
// NEW FILE: Single receipt operations

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getSessionWithOrg()
    if (!user?.organizationId) return unauthorized()

    const { id } = await params

    const receipt = await prisma.receipt.findFirst({
        where: { id, organizationId: user.organizationId },
        include: { transaction: true }
    })

    if (!receipt) return notFound('Receipt')

    return NextResponse.json(receipt)
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getSessionWithOrg()
    if (!user?.organizationId) return unauthorized()

    const { id } = await params
    const body = await req.json()

    const existing = await prisma.receipt.findFirst({
        where: { id, organizationId: user.organizationId }
    })

    if (!existing) return notFound('Receipt')

    const { vendor, amount, date, category, transactionId, status } = body

    const receipt = await prisma.receipt.update({
        where: { id },
        data: {
            ...(vendor !== undefined && { vendor }),
            ...(amount !== undefined && { amount }),
            ...(date !== undefined && { date: date ? new Date(date) : null }),
            ...(category !== undefined && { category }),
            ...(transactionId !== undefined && { transactionId }),
            ...(status !== undefined && { status }),
        }
    })

    return NextResponse.json(receipt)
}

// Soft delete - sets deletedAt timestamp
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

    const receipt = await prisma.receipt.update({
        where: { id },
        data: {
            deletedAt: new Date(),
            status: 'deleted'
        }
    })

    return NextResponse.json(receipt)
}