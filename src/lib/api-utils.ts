// src/lib/api-utils.ts
// Shared API utilities for authentication and error handling

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit, getRateLimitId, RATE_LIMITS, type RateLimitConfig } from '@/lib/rate-limit'

/**
 * Get the current session with organization context.
 * Returns the user with their organization if they have one.
 * Returns null if user is not authenticated or doesn't exist.
 *
 * SECURITY: This function does NOT auto-create users or auto-assign organizations.
 * Users are created in auth.ts during OAuth callback.
 * Users must explicitly join/create organizations via /auth/select-organization.
 */
export async function getSessionWithOrg() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null

  // Find the user with their organization
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { organization: true }
  })

  // Return user (may have organizationId = null if they haven't selected one yet)
  // Middleware will redirect users without org to /auth/select-organization
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