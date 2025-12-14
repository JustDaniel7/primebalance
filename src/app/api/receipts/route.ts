// src/app/api/receipts/route.ts
// NEW FILE: Receipts CRUD

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const { searchParams } = new URL(req.url)
  const unlinked = searchParams.get('unlinked') === 'true'
  
  const where: any = { organizationId: user.organizationId }
  if (unlinked) where.transactionId = null
  
  const receipts = await prisma.receipt.findMany({
    where,
    include: { transaction: true },
    orderBy: { createdAt: 'desc' }
  })
  
  return NextResponse.json(receipts)
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const body = await req.json()
  const { fileName, fileUrl, fileType, fileSize, transactionId, vendor, amount, date } = body
  
  if (!fileName || !fileUrl || !fileType) {
    return badRequest('Missing required fields')
  }
  
  const receipt = await prisma.receipt.create({
    data: {
      fileName,
      fileUrl,
      fileType,
      fileSize: fileSize || 0,
      transactionId,
      vendor,
      amount,
      date: date ? new Date(date) : null,
      organizationId: user.organizationId,
    }
  })
  
  return NextResponse.json(receipt, { status: 201 })
}