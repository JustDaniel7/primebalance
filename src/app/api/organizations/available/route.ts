// src/app/api/organizations/available/route.ts
// API endpoint to get organizations available to the current user

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find the user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      organizationId: true,
      email: true,
      organization: {
        select: { id: true, name: true, slug: true }
      }
    }
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // If user already has an organization, return it
  if (user.organizationId && user.organization) {
    return NextResponse.json({
      hasOrganization: true,
      currentOrganization: user.organization,
      pendingInvitations: [],
    })
  }

  // Find pending invitations for this user's email
  const pendingInvitations = await prisma.organizationInvitation.findMany({
    where: {
      email: user.email?.toLowerCase(),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      organization: {
        select: { id: true, name: true, slug: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({
    hasOrganization: false,
    currentOrganization: null,
    pendingInvitations: pendingInvitations.map(inv => ({
      id: inv.id,
      organization: inv.organization,
      role: inv.role,
      inviteCode: inv.inviteCode,
      expiresAt: inv.expiresAt,
    })),
  })
}
