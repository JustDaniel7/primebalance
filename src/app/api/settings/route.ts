// src/app/api/settings/route.ts
// NEW FILE: User settings

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user) return unauthorized()
  
  let settings = await prisma.userSettings.findUnique({
    where: { userId: user.id }
  })
  
  // Create default settings if none exist
  if (!settings) {
    settings = await prisma.userSettings.create({
      data: { userId: user.id }
    })
  }
  
  return NextResponse.json(settings)
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user) return unauthorized()
  
  const body = await req.json()
  
  const settings = await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: body,
    create: { userId: user.id, ...body }
  })
  
  return NextResponse.json(settings)
}