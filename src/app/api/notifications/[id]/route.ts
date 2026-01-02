// src/app/api/notifications/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils'

// DELETE /api/notifications/[id] - Delete a notification
export async function DELETE(
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

  await prisma.taskNotification.delete({
    where: { id }
  })

  return NextResponse.json({ success: true })
}
