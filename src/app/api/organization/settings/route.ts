// src/app/api/organization/settings/route.ts
// Organization settings management

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

export async function GET() {
  const user = await getSessionWithOrg()
  if (!user) return unauthorized()
  if (!user.organizationId) return badRequest('No organization linked')

  const organization = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      country: true,
      industry: true,
      fiscalYearEnd: true,
      defaultCurrency: true,
      taxId: true,
    }
  })

  return NextResponse.json(organization)
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user) return unauthorized()
  if (!user.organizationId) return badRequest('No organization linked')

  // Only admins/owners can update org settings
  if (user.role !== 'owner' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can update organization settings' }, { status: 403 })
  }

  const body = await req.json()
  const { name, industry, country, defaultCurrency, fiscalYearEnd, taxId } = body

  const updated = await prisma.organization.update({
    where: { id: user.organizationId },
    data: {
      ...(name !== undefined && { name }),
      ...(industry !== undefined && { industry }),
      ...(country !== undefined && { country }),
      ...(defaultCurrency !== undefined && { defaultCurrency }),
      ...(fiscalYearEnd !== undefined && { fiscalYearEnd }),
      ...(taxId !== undefined && { taxId }),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      country: true,
      industry: true,
      fiscalYearEnd: true,
      defaultCurrency: true,
      taxId: true,
    }
  })

  return NextResponse.json(updated)
}
