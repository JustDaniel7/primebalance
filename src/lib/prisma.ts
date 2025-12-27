import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'
import { Pool } from 'pg'

function createPool(): Pool {
  // Cloud Run sets K_SERVICE env var
  const isCloudRun = !!process.env.K_SERVICE
  const cloudSqlConnection = process.env.CLOUD_SQL_CONNECTION_NAME
  
  if (isCloudRun && cloudSqlConnection) {
    console.log('🔌 Using Cloud SQL socket:', cloudSqlConnection)
    return new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: `/cloudsql/${cloudSqlConnection}`,
    })
  }
  
  // Local development (including npm start locally)
  console.log('🔌 Using local database connection')
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