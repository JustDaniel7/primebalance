// src/types/next-auth.d.ts
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      organizationId?: string
    } & DefaultSession["user"]
  }

  interface User {
    organizationId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    organizationId?: string
  }
}
