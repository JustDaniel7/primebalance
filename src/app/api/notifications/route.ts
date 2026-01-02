// src/app/api/notifications/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

// GET /api/notifications
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get('unreadOnly') === 'true'
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  const where: any = {
    organizationId: user.organizationId,
    recipientId: user.id,
  }

  if (unreadOnly) {
    where.isRead = false
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.taskNotification.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        task: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    }),
    prisma.taskNotification.count({ where }),
    prisma.taskNotification.count({
      where: {
        organizationId: user.organizationId,
        recipientId: user.id,
        isRead: false,
      }
    })
  ])

  return NextResponse.json({
    notifications,
    total,
    unreadCount,
    limit,
    offset,
  })
}

// POST /api/notifications - Create a new notification
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const body = await req.json()
  const {
    type,
    title,
    message,
    recipientId,
    taskId,
    riskId,
  } = body

  if (!type || !title || !message || !recipientId) {
    return badRequest('Missing required fields: type, title, message, recipientId')
  }

  const notification = await prisma.taskNotification.create({
    data: {
      type,
      title,
      message,
      recipientId,
      taskId,
      riskId,
      actorId: user.id,
      actorName: user.name || user.email,
      organizationId: user.organizationId,
    }
  })

  return NextResponse.json(notification, { status: 201 })
}
