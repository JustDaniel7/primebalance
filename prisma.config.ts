// prisma.config.ts
import { config } from 'dotenv'
config({ path: '.env.local' })  // Load .env.local specifically

import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})