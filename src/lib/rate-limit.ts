// src/lib/rate-limit.ts
// Simple in-memory rate limiter for API endpoints
// For production at scale, consider using Redis or a distributed cache

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Max requests per window
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  limit: number
}

// Default configurations for different endpoint types
export const RATE_LIMITS = {
  // Standard API endpoints: 100 requests per minute
  standard: { windowMs: 60 * 1000, maxRequests: 100 },

  // AI/expensive operations: 20 requests per minute
  ai: { windowMs: 60 * 1000, maxRequests: 20 },

  // Authentication endpoints: 10 requests per minute (prevent brute force)
  auth: { windowMs: 60 * 1000, maxRequests: 10 },

  // Write operations: 60 requests per minute
  write: { windowMs: 60 * 1000, maxRequests: 60 },

  // Heavy reports: 10 requests per minute
  reports: { windowMs: 60 * 1000, maxRequests: 10 },
} as const

/**
 * Check rate limit for a given identifier (typically IP + userId or organizationId)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.standard
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  // No existing entry or window expired - create new
  if (!entry || entry.resetTime < now) {
    const resetTime = now + config.windowMs
    rateLimitStore.set(identifier, { count: 1, resetTime })
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime,
      limit: config.maxRequests,
    }
  }

  // Within window - increment count
  entry.count++

  if (entry.count > config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      limit: config.maxRequests,
    }
  }

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
    limit: config.maxRequests,
  }
}

/**
 * Create rate limit identifier from request context
 * Uses organizationId if authenticated, otherwise falls back to IP
 */
export function getRateLimitId(
  req: Request,
  organizationId?: string | null,
  endpoint?: string
): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'

  const base = organizationId ? `org:${organizationId}` : `ip:${ip}`
  return endpoint ? `${base}:${endpoint}` : base
}
