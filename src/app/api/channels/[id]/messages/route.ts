// src/app/api/chat/channels/[id]/messages/route.ts
// NEW FILE: Channel messages

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const cursor = searchParams.get('cursor')
  
  const messages = await prisma.chatMessage.findMany({
    where: { channelId: id },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(cursor && { cursor: { id: cursor }, skip: 1 })
  })
  
  return NextResponse.json(messages.reverse())
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg()
  if (!user) return unauthorized()
  
  const { id } = await params
  const { content } = await req.json()
  if (!content) return badRequest('Content is required')
  
  const message = await prisma.chatMessage.create({
    data: {
      content,
      channelId: id,
      userId: user.id,
    },
    include: { user: { select: { id: true, name: true, image: true } } }
  })
  
  return NextResponse.json(message, { status: 201 })
}