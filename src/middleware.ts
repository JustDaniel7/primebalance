// src/middleware.ts
// Middleware to enforce organization context for authenticated users

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that don't require organization context
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/select-organization',
  '/api/auth',
  '/api/organizations/create',
  '/api/organizations/join',
  '/api/organizations/available',
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
]

// Routes that require authentication but not organization
const AUTH_ONLY_ROUTES = [
  '/auth/select-organization',
  '/api/organizations/create',
  '/api/organizations/join',
  '/api/organizations/available',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
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

  // User is authenticated but has no organization - redirect to selection page
  if (!token.organizationId) {
    // Don't redirect if already going to org selection or related APIs
    if (pathname === '/auth/select-organization') {
      return NextResponse.next()
    }

    const selectOrgUrl = new URL('/auth/select-organization', request.url)
    selectOrgUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(selectOrgUrl)
  }

  // User has organization - allow access
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
