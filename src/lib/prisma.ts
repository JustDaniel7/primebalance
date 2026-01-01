import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'
import { Pool, PoolConfig } from 'pg'

// =============================================================================
// CONNECTION POOL CONFIGURATION
// =============================================================================

// Base pool configuration with proper timeouts and limits
const basePoolConfig: Partial<PoolConfig> = {
  // Connection limits
  max: parseInt(process.env.DB_POOL_MAX || '20'),          // Maximum connections
  min: parseInt(process.env.DB_POOL_MIN || '2'),           // Minimum idle connections

  // Timeouts (in milliseconds)
  idleTimeoutMillis: 30000,         // Close idle connections after 30 seconds
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

const pool = createPool()
const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({ adapter })