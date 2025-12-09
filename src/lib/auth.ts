// src/lib/auth.ts
import { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"

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
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = token.sub as string
      }
      return session
    },
  },
}