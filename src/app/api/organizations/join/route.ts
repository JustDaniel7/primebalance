// src/app/api/organizations/join/route.ts
// API endpoint for joining an organization via invite code

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyWelcome } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find the user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, organizationId: true, email: true }
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
    const { inviteCode } = body

    if (!inviteCode || typeof inviteCode !== 'string') {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 400 }
      )
    }

    // Find the invitation
    const invitation = await prisma.organizationInvitation.findUnique({
      where: { inviteCode: inviteCode.trim() },
      include: { organization: true }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      )
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This invite code has expired' },
        { status: 400 }
      )
    }

    // Check if invitation is email-specific and matches
    if (invitation.email && invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invite code is for a different email address' },
        { status: 403 }
      )
    }

    // Check if email-specific invitation was already used
    if (invitation.email && invitation.usedAt) {
      return NextResponse.json(
        { error: 'This invite code has already been used' },
        { status: 400 }
      )
    }

    // Join the organization in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user to join the organization
      await tx.user.update({
        where: { id: user.id },
        data: {
          organizationId: invitation.organizationId,
          role: invitation.role,
        }
      })

      // Mark email-specific invitation as used
      if (invitation.email) {
        await tx.organizationInvitation.update({
          where: { id: invitation.id },
          data: {
            usedAt: new Date(),
            usedByUserId: user.id,
          }
        })
      }

      return invitation.organization
    })

    // Send welcome notification to the new member
    await notifyWelcome(user.id, session.user.name || 'there', result.id)

    return NextResponse.json({
      success: true,
      organization: {
        id: result.id,
        name: result.name,
        slug: result.slug,
      }
    })
  } catch (error) {
    console.error('Error joining organization:', error)
    return NextResponse.json(
      { error: 'Failed to join organization' },
      { status: 500 }
    )
  }
}

// GET endpoint to validate invite code without joining
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const inviteCode = searchParams.get('code')

  if (!inviteCode) {
    return NextResponse.json(
      { error: 'Invite code is required' },
      { status: 400 }
    )
  }

  const invitation = await prisma.organizationInvitation.findUnique({
    where: { inviteCode },
    include: {
      organization: {
        select: { name: true, slug: true }
      }
    }
  })

  if (!invitation) {
    return NextResponse.json(
      { error: 'Invalid invite code' },
      { status: 404 }
    )
  }

  if (invitation.expiresAt < new Date()) {
    return NextResponse.json(
      { error: 'This invite code has expired' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    valid: true,
    organization: invitation.organization,
    role: invitation.role,
    emailRestricted: !!invitation.email,
  })
}
