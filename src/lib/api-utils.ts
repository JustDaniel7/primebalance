// src/lib/api-utils.ts
// NEW FILE: Shared API utilities

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function getSessionWithOrg() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { organization: true }
  })
  
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