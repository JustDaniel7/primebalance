import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'
import { Pool, PoolConfig } from 'pg'

// =============================================================================
// CONNECTION POOL CONFIGURATION
// =============================================================================

// Reduce pool size for local development to prevent connection exhaustion
const isDevelopment = process.env.NODE_ENV === 'development'

// Base pool configuration with proper timeouts and limits
const basePoolConfig: Partial<PoolConfig> = {
  // Connection limits - smaller for dev to prevent exhaustion during hot reload
  max: parseInt(process.env.DB_POOL_MAX || (isDevelopment ? '5' : '20')),
  min: parseInt(process.env.DB_POOL_MIN || '1'),

  // Timeouts (in milliseconds)
  idleTimeoutMillis: isDevelopment ? 10000 : 30000,  // Close idle faster in dev
  connectionTimeoutMillis: 10000,   // Fail if can't connect within 10 seconds

  // Statement timeout (prevent long-running queries)
  statement_timeout: 30000,         // 30 second query timeout
}

function createPool(): Pool {
  // Cloud Run sets K_SERVICE env var
  const isCloudRun = !!process.env.K_SERVICE
  const cloudSqlConnection = process.env.CLOUD_SQL_CONNECTION_NAME

  if (isCloudRun && cloudSqlConnection) {
    return new Pool({
      ...basePoolConfig,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: `/cloudsql/${cloudSqlConnection}`,
    })
  }

  // Local development (including npm start locally)
  return new Pool({
    ...basePoolConfig,
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5433'),
    database: process.env.DB_NAME || 'primebalance',
    user: process.env.DB_USER || 'primebalance_app',
    password: process.env.DB_PASSWORD,
  })
}

// =============================================================================
// SINGLETON PATTERN FOR DEVELOPMENT
// Prevents connection pool exhaustion during Next.js hot reloading
// =============================================================================

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

// Reuse existing pool and client in development, or create new ones
const pool = globalForPrisma.pool ?? createPool()
const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

// Store in global object during development to survive hot reloads
if (isDevelopment) {
  globalForPrisma.prisma = prisma
  globalForPrisma.pool = pool
}

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
    await pool.end()
  })
}
