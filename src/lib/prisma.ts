import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'
import { Pool } from 'pg'

function createPool(): Pool {
  // Production (Cloud Run) - use Unix socket
  const cloudSqlConnection = process.env.CLOUD_SQL_CONNECTION_NAME
  if (cloudSqlConnection && process.env.NODE_ENV === 'production') {
    return new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: `/cloudsql/${cloudSqlConnection}`,
    })
  }
  
  // Local development
  return new Pool({
    host: '127.0.0.1',
    port: 5433,
    database: 'primebalance',
    user: 'primebalance_app',
    password: process.env.DB_PASSWORD || 'demoPassword089',
  })
}

const pool = createPool()
const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({ adapter })