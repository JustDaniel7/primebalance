// src/lib/cache.ts
// Server-side caching utilities using Next.js unstable_cache
// Provides organization-scoped caching for heavy database operations

import { unstable_cache } from 'next/cache'
import { logger } from './logger'

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

export const CACHE_TAGS = {
  DASHBOARD: 'dashboard',
  REPORTS: 'reports',
  KPI: 'kpi',
  INVOICES: 'invoices',
  CUSTOMERS: 'customers',
} as const

export const CACHE_TTL = {
  DASHBOARD: 300,      // 5 minutes - frequently viewed, moderate change rate
  REPORTS: 1800,       // 30 minutes - computation heavy, less frequent updates
  KPI: 600,            // 10 minutes - KPI calculations are expensive
  STATIC_DATA: 3600,   // 1 hour - reference data that rarely changes
  SHORT: 60,           // 1 minute - for data that changes frequently
} as const

// =============================================================================
// CACHE KEY BUILDERS
// =============================================================================

/**
 * Build a cache key with organization scope
 * All cached data is scoped to prevent cross-organization data leakage
 */
export function buildCacheKey(
  prefix: string,
  organizationId: string,
  ...parts: (string | number | undefined)[]
): string[] {
  const key = [prefix, organizationId, ...parts.filter(p => p !== undefined).map(String)]
  return key
}

// =============================================================================
// CACHED FUNCTION WRAPPERS
// =============================================================================

/**
 * Create a cached version of a function with organization-scoped cache keys
 *
 * @param fn - The async function to cache
 * @param keyPrefix - Prefix for the cache key
 * @param options - Cache options (revalidate time, tags)
 * @returns A cached version of the function
 *
 * @example
 * const getCachedDashboard = createCachedFunction(
 *   async (orgId: string) => fetchDashboardData(orgId),
 *   'dashboard-metrics',
 *   { revalidate: CACHE_TTL.DASHBOARD, tags: [CACHE_TAGS.DASHBOARD] }
 * )
 */
export function createCachedFunction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyPrefix: string,
  options: {
    revalidate?: number
    tags?: string[]
  } = {}
): (...args: TArgs) => Promise<TResult> {
  const { revalidate = CACHE_TTL.SHORT, tags = [] } = options

  return async (...args: TArgs): Promise<TResult> => {
    // Create a unique cache key based on function name and arguments
    const cacheKeyParts = [keyPrefix, ...args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    )]

    const cachedFn = unstable_cache(
      async () => {
        logger.debug('Cache miss - fetching fresh data', { keyPrefix, args: cacheKeyParts })
        return fn(...args)
      },
      cacheKeyParts,
      {
        revalidate,
        tags: [...tags, keyPrefix],
      }
    )

    return cachedFn()
  }
}

// =============================================================================
// CACHE INVALIDATION HELPERS
// =============================================================================

import { revalidateTag } from 'next/cache'

// Default cache profile for revalidation (Next.js 16+ API)
const DEFAULT_PROFILE = 'default'

/**
 * Invalidate all cached data for a specific organization
 * Call this when organization data changes significantly
 */
export function invalidateOrganizationCache(organizationId: string): void {
  logger.info('Invalidating organization cache', { organizationId })
  revalidateTag(`org-${organizationId}`, DEFAULT_PROFILE)
}

/**
 * Invalidate specific cache tags
 * Use this for targeted cache invalidation
 */
export function invalidateCacheTags(...tags: string[]): void {
  logger.info('Invalidating cache tags', { tags })
  tags.forEach(tag => revalidateTag(tag, DEFAULT_PROFILE))
}

/**
 * Invalidate dashboard cache for an organization
 * Call this when transactions, accounts, or balances change
 */
export function invalidateDashboardCache(organizationId: string): void {
  revalidateTag(CACHE_TAGS.DASHBOARD, DEFAULT_PROFILE)
  revalidateTag(`dashboard-${organizationId}`, DEFAULT_PROFILE)
}

/**
 * Invalidate reports cache for an organization
 * Call this when underlying financial data changes
 */
export function invalidateReportsCache(organizationId: string): void {
  revalidateTag(CACHE_TAGS.REPORTS, DEFAULT_PROFILE)
  revalidateTag(`reports-${organizationId}`, DEFAULT_PROFILE)
}

/**
 * Invalidate invoice-related caches
 */
export function invalidateInvoiceCache(organizationId: string): void {
  revalidateTag(CACHE_TAGS.INVOICES, DEFAULT_PROFILE)
  revalidateTag(`invoices-${organizationId}`, DEFAULT_PROFILE)
  // Also invalidate dashboard and reports as they depend on invoice data
  invalidateDashboardCache(organizationId)
  invalidateReportsCache(organizationId)
}

// =============================================================================
// IN-MEMORY CACHE FOR VERY HOT DATA
// =============================================================================

interface MemoryCacheEntry<T> {
  data: T
  expiresAt: number
}

const memoryCache = new Map<string, MemoryCacheEntry<unknown>>()

/**
 * Simple in-memory cache for extremely hot data within a single request cycle
 * This is useful for data that's accessed multiple times within a single API request
 *
 * Note: This cache is NOT shared across serverless function instances
 * Use Next.js unstable_cache for cross-instance caching
 */
export function getFromMemoryCache<T>(key: string): T | null {
  const entry = memoryCache.get(key) as MemoryCacheEntry<T> | undefined

  if (!entry) return null

  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key)
    return null
  }

  return entry.data
}

export function setInMemoryCache<T>(key: string, data: T, ttlMs: number = 60000): void {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  })

  // Cleanup expired entries periodically (every 100 cache sets)
  if (memoryCache.size % 100 === 0) {
    cleanupMemoryCache()
  }
}

function cleanupMemoryCache(): void {
  const now = Date.now()
  for (const [key, entry] of memoryCache.entries()) {
    if (now > entry.expiresAt) {
      memoryCache.delete(key)
    }
  }
}

/**
 * Get or compute a value, using memory cache
 */
export async function getOrCompute<T>(
  key: string,
  compute: () => Promise<T>,
  ttlMs: number = 60000
): Promise<T> {
  const cached = getFromMemoryCache<T>(key)
  if (cached !== null) {
    return cached
  }

  const result = await compute()
  setInMemoryCache(key, result, ttlMs)
  return result
}
