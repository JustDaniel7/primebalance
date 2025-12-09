import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow auth pages
        if (pathname.startsWith('/auth')) {
          return true
        }
        
        // Allow API routes (NextAuth handles its own)
        if (pathname.startsWith('/api')) {
          return true
        }
        
        // Allow public pages
        if (pathname === '/') {
          return true
        }
        
        // Require auth for dashboard
        if (pathname.startsWith('/dashboard')) {
          return !!token
        }
        
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
}