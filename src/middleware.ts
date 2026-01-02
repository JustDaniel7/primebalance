// src/middleware.ts
// Middleware to enforce organization context for authenticated users
// SECURITY: This middleware ensures users cannot access protected routes
// without being associated with an organization

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that don't require authentication at all
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/api/auth', // NextAuth routes must be public
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
]

// Routes that require authentication but NOT organization context
// (user can access these while setting up their organization)
const AUTH_ONLY_ROUTES = [
  '/auth/select-organization',
  '/api/organizations/create',
  '/api/organizations/join',
  '/api/organizations/available',
]

/**
 * Check if a value is a valid organization ID
 * Must be a non-empty string (not null, undefined, empty string, or whitespace)
 */
function hasValidOrganizationId(organizationId: unknown): boolean {
  return typeof organizationId === 'string' && organizationId.trim().length > 0
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes (no auth required)
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Get the token (contains user info including organizationId)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // No token = not authenticated, redirect to login
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check if route only requires auth (not org)
  if (AUTH_ONLY_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // SECURITY: User is authenticated but has no valid organization
  // This catches: null, undefined, empty string, whitespace-only strings
  if (!hasValidOrganizationId(token.organizationId)) {
    const selectOrgUrl = new URL('/auth/select-organization', request.url)
    selectOrgUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(selectOrgUrl)
  }

  // User has valid organization - allow access
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}
