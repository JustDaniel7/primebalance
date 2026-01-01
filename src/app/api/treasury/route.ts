// src/app/api/treasury/route.ts
// Main treasury dashboard endpoint

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionWithOrg, unauthorized } from '@/lib/api-utils'

// GET /api/treasury - Get treasury summary
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg()
  if (!user?.organizationId) return unauthorized()
  
  const orgId = user.organizationId
  
  // Get all accounts
  const accounts = await prisma.treasuryAccount.findMany({
    where: { organizationId: orgId, status: 'active' }
  })
  
  // Get capital buckets
  const buckets = await prisma.capitalBucket.findMany({
    where: { organizationId: orgId }
  })
  
  // Get credit facilities
  const facilities = await prisma.creditFacility.findMany({
    where: { organizationId: orgId, status: 'active' }
  })
  
  // Get pending decisions
  const pendingDecisions = await prisma.treasuryDecision.findMany({
    where: { organizationId: orgId, status: 'pending' },
    orderBy: { priority: 'asc' }
  })
  
  // Get netting opportunities
  const nettingOpportunities = await prisma.nettingOpportunity.findMany({
    where: { organizationId: orgId, status: 'identified' }
  })
  
  // Calculate summaries
  const cashByClassification = accounts.reduce((acc, a) => {
    const key = a.cashClassification
    acc[key] = (acc[key] || 0) + Number(a.currentBalance)
    return acc
  }, {} as Record<string, number>)
  
  const cashByCurrency = accounts.reduce((acc, a) => {
    acc[a.currency] = (acc[a.currency] || 0) + Number(a.currentBalance)
    return acc
  }, {} as Record<string, number>)
  
  const totalCash = accounts.reduce((sum, a) => sum + Number(a.currentBalance), 0)
  const totalAvailable = accounts.reduce((sum, a) => sum + Number(a.availableBalance), 0)
  
  const totalCreditLimit = facilities.reduce((sum, f) => sum + Number(f.facilityLimit), 0)
  const totalCreditUsed = facilities.reduce((sum, f) => sum + Number(f.drawnAmount), 0)
  const totalCreditAvailable = facilities.reduce((sum, f) => sum + Number(f.availableAmount), 0)
  
  const bucketsUnderfunded = buckets.filter(b => b.fundingStatus === 'underfunded')
  const bucketDeficit = bucketsUnderfunded.reduce((sum, b) => 
    sum + (Number(b.targetAmount) - Number(b.currentAmount)), 0)
  
  const nettingSavings = nettingOpportunities.reduce((sum, n) => sum + Number(n.savingsAmount), 0)

  // Helper to convert Decimal fields to numbers
  const serializeDecimals = <T extends Record<string, unknown>>(obj: T): T => {
    const result = { ...obj } as Record<string, unknown>
    for (const key in result) {
      const val = result[key]
      if (val !== null && typeof val === 'object' && 'toNumber' in (val as object)) {
        result[key] = Number(val)
      }
    }
    return result as T
  }

  return NextResponse.json({
    summary: {
      totalCash,
      totalAvailable,
      restrictedCash: cashByClassification.restricted || 0,
      totalCreditLimit,
      totalCreditUsed,
      totalCreditAvailable,
      bucketsUnderfundedCount: bucketsUnderfunded.length,
      bucketDeficit,
      pendingDecisionsCount: pendingDecisions.length,
      nettingSavings,
    },
    cashByClassification,
    cashByCurrency,
    accounts: accounts.map(serializeDecimals),
    buckets: buckets.map(serializeDecimals),
    facilities: facilities.map(serializeDecimals),
    pendingDecisions: pendingDecisions.map(serializeDecimals),
    nettingOpportunities: nettingOpportunities.map(serializeDecimals),
  })
}