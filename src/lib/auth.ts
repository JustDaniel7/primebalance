// src/lib/auth.ts
import { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

export const authOptions: AuthOptions = {
  // Use JWT strategy instead of database for now
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
    // Simple credentials for development
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // This is just for development
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
      // On sign in, fetch organizationId from database
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, organizationId: true }
        })
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