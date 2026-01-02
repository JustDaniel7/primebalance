// src/app/api/organizations/create/route.ts
// API endpoint for creating new organizations

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find the user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, organizationId: true }
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // User already has an organization
  if (user.organizationId) {
    return NextResponse.json(
      { error: 'User already belongs to an organization' },
      { status: 400 }
    )
  }

  try {
    const body = await req.json()
    const { name, country, industry, defaultCurrency } = body

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Organization name must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Generate unique slug
    let slug = generateSlug(name)
    const existingSlug = await prisma.organization.findUnique({
      where: { slug }
    })

    if (existingSlug) {
      slug = `${slug}-${nanoid(6)}`
    }

    // Create organization and update user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the organization
      const organization = await tx.organization.create({
        data: {
          name: name.trim(),
          slug,
          country: country || 'CH',
          industry: industry || null,
          defaultCurrency: defaultCurrency || 'USD',
        }
      })

      // Create an invite code for this organization (for inviting others later)
      await tx.organizationInvitation.create({
        data: {
          organizationId: organization.id,
          inviteCode: nanoid(12),
          role: 'member',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          createdByUserId: user.id,
        }
      })

      // Update user to be owner of this organization
      await tx.user.update({
        where: { id: user.id },
        data: {
          organizationId: organization.id,
          role: 'owner',
        }
      })

      return organization
    })

    return NextResponse.json({
      success: true,
      organization: {
        id: result.id,
        name: result.name,
        slug: result.slug,
      }
    })
  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}
