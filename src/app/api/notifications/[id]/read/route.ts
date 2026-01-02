// src/app/api/notifications/[id]/read/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils'

// PATCH /api/notifications/[id]/read - Mark notification as read
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const { id } = await params

  const notification = await prisma.taskNotification.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
      recipientId: user.id,
    }
  })

  if (!notification) {
    return notFound('Notification not found')
  }

  const updated = await prisma.taskNotification.update({
    where: { id },
    data: {
      isRead: true,
      readAt: new Date(),
    }
  })

  return NextResponse.json(updated)
}
