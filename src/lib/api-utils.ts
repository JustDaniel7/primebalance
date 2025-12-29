// src/lib/api-utils.ts
// NEW FILE: Shared API utilities

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function getSessionWithOrg() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null

  // First try to find the user by email
  let user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { organization: true }
  })

  // If user not found but session has organizationId (from JWT), create user on the fly
  if (!user && (session.user as any).organizationId) {
    const orgId = (session.user as any).organizationId as string
    try {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || 'User',
          organizationId: orgId,
        },
        include: { organization: true }
      })
    } catch {
      // User might have been created by another request, try to fetch again
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { organization: true }
      })
    }
  }

  // If still no user but we have an email, try to link to first available org
  if (!user) {
    const org = await prisma.organization.findFirst()
    if (org) {
      try {
        user = await prisma.user.create({
          data: {
            email: session.user.email,
            name: session.user.name || 'User',
            organizationId: org.id,
          },
          include: { organization: true }
        })
      } catch {
        // User might have been created by another request, try to fetch again
        user = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: { organization: true }
        })
      }
    }
  }

  return user
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function notFound(resource: string) {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 })
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}