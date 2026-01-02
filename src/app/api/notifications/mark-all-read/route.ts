// src/app/api/notifications/mark-all-read/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized } from '@/lib/api-utils'

// PATCH /api/notifications/mark-all-read - Mark all notifications as read
export async function PATCH(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()

  const result = await prisma.taskNotification.updateMany({
    where: {
      organizationId: user.organizationId,
      recipientId: user.id,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    }
  })

  return NextResponse.json({
    success: true,
    count: result.count
  })
}
