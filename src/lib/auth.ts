// src/lib/auth.ts
import type { AuthOptions } from "next-auth"
import type { Provider } from "next-auth/providers/index"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

// Build providers array conditionally based on available credentials
const providers: Provider[] = []

// Only add Google provider if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

// Only add GitHub provider if credentials are configured
if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    })
  )
}

// Demo/Development credentials provider - only enabled via explicit env var
// In production, set ENABLE_DEMO_AUTH=false or don't set it at all
if (process.env.ENABLE_DEMO_AUTH === 'true') {
  providers.push(
    CredentialsProvider({
      name: "Demo Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Only allow specific demo accounts in demo mode
        const demoAccounts = ['primebalanceus@gmail.com', 'demo@primebalance.app', 'demo@example.com', 'test@example.com', 'admin@example.com']

        if (credentials?.email && demoAccounts.includes(credentials.email.toLowerCase())) {
          // In demo mode, verify against demo password
          if (credentials.password === process.env.DEMO_PASSWORD || credentials.password === 'demo123') {
            return {
              id: `demo-${credentials.email}`,
              email: credentials.email,
              name: "Demo User",
            }
          }
        }
        return null
      }
    })
  )
}

// Ensure at least one provider is configured
if (providers.length === 0) {
  console.warn(
    'WARNING: No authentication providers configured. ' +
    'Set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET, GITHUB_ID/GITHUB_SECRET, ' +
    'or ENABLE_DEMO_AUTH=true for development.'
  )
  // Add a fallback demo provider only in development
  if (process.env.NODE_ENV === 'development') {
    providers.push(
      CredentialsProvider({
        name: "Development Login",
        credentials: {
          email: { label: "Email", type: "email" },
        },
        async authorize(credentials) {
          if (credentials?.email) {
            console.warn('Using development-only authentication. DO NOT USE IN PRODUCTION.')
            return {
              id: `dev-${credentials.email}`,
              email: credentials.email,
              name: "Dev User",
            }
          }
          return null
        }
      })
    )
  }
}

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers,
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On initial sign-in, user object is provided
      if (user?.email) {
        // Try to find existing user - wrap in try/catch for database connection failures
        try {
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, organizationId: true }
          })

          // If user doesn't exist, create WITHOUT organization
          // User will be redirected to /auth/select-organization to choose/create one
          if (!dbUser) {
            try {
              dbUser = await prisma.user.create({
                data: {
                  email: user.email,
                  name: user.name || 'User',
                  image: user.image,
                  // organizationId intentionally left null - user must select/create org
                },
                select: { id: true, organizationId: true }
              })
            } catch {
              // Race condition: user might have been created by another request
              dbUser = await prisma.user.findUnique({
                where: { email: user.email },
                select: { id: true, organizationId: true }
              })
            }
          }

          // Do NOT auto-assign to first org - user must explicitly join/create
          // Middleware will redirect users without org to selection page

          if (dbUser) {
            token.organizationId = dbUser.organizationId || undefined
            token.sub = dbUser.id
            token.email = user.email
          }
        } catch (dbError) {
          // Database not available - use demo/dev mode with user info from provider
          if (process.env.NODE_ENV === 'development' || process.env.ENABLE_DEMO_AUTH === 'true') {
            console.warn('Database not available, using demo mode authentication:', (dbError as Error).message)
            token.sub = user.id || `demo-${user.email}`
            token.email = user.email
            token.organizationId = 'demo-org'
          } else {
            throw dbError
          }
        }
      }

      // CRITICAL: On session update or when user has no organizationId,
      // always refresh from database to ensure token stays in sync
      // This handles the case when user creates/joins an org after initial login
      if (trigger === 'update' || (token.email && !token.organizationId)) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: { id: true, organizationId: true }
          })

          if (dbUser) {
            token.organizationId = dbUser.organizationId || undefined
            token.sub = dbUser.id
          }
        } catch (dbError) {
          // Database not available in dev/demo mode - keep existing token values
          if (process.env.NODE_ENV === 'development' || process.env.ENABLE_DEMO_AUTH === 'true') {
            console.warn('Database not available for session refresh:', (dbError as Error).message)
            // Keep demo-org if no organizationId set
            if (!token.organizationId) {
              token.organizationId = 'demo-org'
            }
          } else {
            throw dbError
          }
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub as string
        session.user.organizationId = token.organizationId as string | undefined
      }
      return session
    },
  },
}