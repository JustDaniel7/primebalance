// src/app/api/chat/channels/route.ts
// NEW FILE: Chat channels

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const channels = await prisma.chatChannel.findMany({
    where: { organizationId: user.organizationId },
    include: { _count: { select: { messages: true } } },
    orderBy: { name: 'asc' }
  })
  
  return NextResponse.json(channels)
}

export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const { name, description, type } = await req.json()
  if (!name) return badRequest('Name is required')
  
  const channel = await prisma.chatChannel.create({
    data: {
      name,
      description,
      type: type || 'public',
      organizationId: user.organizationId,
    }
  })
  
  return NextResponse.json(channel, { status: 201 })
}