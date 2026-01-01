// src/lib/auth.ts
import { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "demo",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "demo",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "demo",
      clientSecret: process.env.GITHUB_SECRET || "demo",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.email) {
          return {
            id: "1",
            email: credentials.email,
            name: "Demo User",
          }
        }
        return null
      }
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user?.email) {
        // Try to find existing user
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, organizationId: true }
        })
        
        // If user doesn't exist, auto-create and link to first organization
        if (!dbUser) {
          // Find the first organization (from seed data)
          const org = await prisma.organization.findFirst()
          
          if (org) {
            // Create user linked to the organization
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || 'User',
                organizationId: org.id,
              },
              select: { id: true, organizationId: true }
            })
          }
        }
        
        // If user exists but has no org, link to first available org
        if (dbUser && !dbUser.organizationId) {
          const org = await prisma.organization.findFirst()
          if (org) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { organizationId: org.id }
            })
            dbUser.organizationId = org.id
          }
        }
        
        if (dbUser) {
          token.organizationId = dbUser.organizationId || undefined
          token.sub = dbUser.id
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