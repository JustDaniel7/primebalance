// src/app/api/user/profile/route.ts
// User profile management

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

export async function GET() {
  const user = await getSessionWithOrg()
  if (!user) return unauthorized()

  // Get user with settings
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      settings: {
        select: {
          language: true,
          timezone: true,
          currency: true,
          dateFormat: true,
          theme: true,
        }
      },
      createdAt: true,
    }
  })

  return NextResponse.json(profile)
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user) return unauthorized()

  const body = await req.json()
  const { name, email } = body

  // Validate email if provided
  if (email && email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return badRequest('Email already in use')
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
    }
  })

  return NextResponse.json(updated)
}
