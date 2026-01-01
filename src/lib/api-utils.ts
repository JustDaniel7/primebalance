// src/lib/api-utils.ts
// Shared API utilities for authentication and error handling

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit, getRateLimitId, RATE_LIMITS, type RateLimitConfig } from '@/lib/rate-limit'

// Extended session user type with organizationId
interface SessionUser {
  id?: string
  email?: string | null
  name?: string | null
  image?: string | null
  organizationId?: string
}

/**
 * Get the current session with organization context.
 * This function handles user creation for new OAuth logins and validates
 * organization membership.
 */
export async function getSessionWithOrg() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null

  const sessionUser = session.user as SessionUser

  // First try to find the user by email
  let user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { organization: true }
  })

  // If user exists, return them (they already have an org assignment)
  if (user) {
    return user
  }

  // User doesn't exist - handle first-time login
  // Check if organizationId was passed in JWT from OAuth callback
  const jwtOrgId = sessionUser.organizationId

  if (jwtOrgId) {
    // Verify the organization actually exists before creating user
    const org = await prisma.organization.findUnique({
      where: { id: jwtOrgId }
    })

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
        return user
      } catch {
        // Race condition: user created by another request
        user = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: { organization: true }
        })
        if (user) return user
      }
    }
  }

  // No JWT org ID or org doesn't exist - only auto-assign in development
  // In production, users should be invited to an organization explicitly
  if (process.env.NODE_ENV === 'development' || process.env.AUTO_ASSIGN_ORG === 'true') {
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
        return user
      } catch {
        // Race condition: user created by another request
        user = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: { organization: true }
        })
        if (user) return user
      }
    }
  }

  // In production without AUTO_ASSIGN_ORG, return null
  // User needs to be invited to an organization
  return null
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

export function rateLimited(resetTime: number) {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Reset': String(resetTime),
      }
    }
  )
}

/**
 * Check rate limit for an API request.
 * Returns a 429 response if rate limited, or null if allowed.
 */
export function withRateLimit(
  req: NextRequest,
  organizationId: string | null | undefined,
  config: RateLimitConfig = RATE_LIMITS.standard,
  endpoint?: string
): NextResponse | null {
  const identifier = getRateLimitId(req, organizationId, endpoint)
  const result = checkRateLimit(identifier, config)

  if (!result.success) {
    return rateLimited(result.resetTime)
  }

  return null
}

// Re-export rate limit configs for convenience
export { RATE_LIMITS }