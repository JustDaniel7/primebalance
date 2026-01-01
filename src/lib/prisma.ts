import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'
import { Pool } from 'pg'

function createPool(): Pool {
  // Cloud Run sets K_SERVICE env var
  const isCloudRun = !!process.env.K_SERVICE
  const cloudSqlConnection = process.env.CLOUD_SQL_CONNECTION_NAME
  
  if (isCloudRun && cloudSqlConnection) {
    return new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: `/cloudsql/${cloudSqlConnection}`,
    })
  }
  
  // Local development (including npm start locally)
  return new Pool({
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