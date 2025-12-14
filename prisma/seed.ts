// prisma/seed.ts
// NEW FILE: Database seed script

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo-company',
      country: 'CH',
      industry: 'Technology',
      fiscalYearEnd: '12-31',
      defaultCurrency: 'USD',
    },
  })
  console.log('✓ Organization created:', org.name)

  // Create demo user (will be linked via NextAuth on first login)
  const user = await prisma.user.upsert({
    where: { email: 'demo@primebalance.app' },
    update: { organizationId: org.id },
    create: {
      email: 'demo@primebalance.app',
      name: 'Demo User',
      role: 'owner',
      organizationId: org.id,
    },
  })
  console.log('✓ User created:', user.email)

  // Create user settings
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      language: 'en',
      timezone: 'Europe/Zurich',
      currency: 'USD',
      theme: 'dark',
    },
  })
  console.log('✓ User settings created')

  // Create chart of accounts
  const accounts = [
    { accountNumber: '1000', name: 'Assets', type: 'asset', balance: 245000 },
    { accountNumber: '1100', name: 'Cash & Bank', type: 'bank', balance: 125000, parentNumber: '1000' },
    { accountNumber: '1110', name: 'Business Checking', type: 'bank', balance: 87500, parentNumber: '1100' },
    { accountNumber: '1120', name: 'Savings Account', type: 'bank', balance: 37500, parentNumber: '1100' },
    { accountNumber: '1150', name: 'Crypto Holdings', type: 'crypto', balance: 45000, parentNumber: '1000' },
    { accountNumber: '1200', name: 'Accounts Receivable', type: 'asset', balance: 23500, parentNumber: '1000' },
    { accountNumber: '2000', name: 'Liabilities', type: 'liability', balance: 35000 },
    { accountNumber: '2100', name: 'Accounts Payable', type: 'liability', balance: 15000, parentNumber: '2000' },
    { accountNumber: '2200', name: 'Credit Cards', type: 'liability', balance: 20000, parentNumber: '2000' },
    { accountNumber: '3000', name: 'Equity', type: 'equity', balance: 210000 },
    { accountNumber: '4000', name: 'Revenue', type: 'revenue', balance: 156000 },
    { accountNumber: '4100', name: 'Sales Revenue', type: 'revenue', balance: 120000, parentNumber: '4000' },
    { accountNumber: '4200', name: 'Subscription Revenue', type: 'revenue', balance: 36000, parentNumber: '4000' },
    { accountNumber: '5000', name: 'Expenses', type: 'expense', balance: 45000 },
    { accountNumber: '5100', name: 'Cloud Infrastructure', type: 'expense', balance: 18000, parentNumber: '5000' },
    { accountNumber: '5200', name: 'Professional Services', type: 'expense', balance: 15000, parentNumber: '5000' },
    { accountNumber: '5300', name: 'Office Expenses', type: 'expense', balance: 12000, parentNumber: '5000' },
  ]

  // Create accounts (parent first, then children)
  const accountMap: Record<string, string> = {}
  
  for (const acc of accounts.filter(a => !a.parentNumber)) {
    const created = await prisma.financialAccount.upsert({
      where: { organizationId_accountNumber: { organizationId: org.id, accountNumber: acc.accountNumber } },
      update: {},
      create: {
        accountNumber: acc.accountNumber,
        name: acc.name,
        type: acc.type,
        balance: acc.balance,
        organizationId: org.id,
      },
    })
    accountMap[acc.accountNumber] = created.id
  }

  for (const acc of accounts.filter(a => a.parentNumber)) {
    const created = await prisma.financialAccount.upsert({
      where: { organizationId_accountNumber: { organizationId: org.id, accountNumber: acc.accountNumber } },
      update: {},
      create: {
        accountNumber: acc.accountNumber,
        name: acc.name,
        type: acc.type,
        balance: acc.balance,
        parentId: accountMap[acc.parentNumber!],
        organizationId: org.id,
      },
    })
    accountMap[acc.accountNumber] = created.id
  }
  console.log('✓ Chart of accounts created:', Object.keys(accountMap).length, 'accounts')

  // Create sample transactions
  const transactions = [
    { date: '2025-12-06', description: 'Client Payment - Acme Corp', amount: 15000, type: 'income', category: 'Sales Revenue', accountNumber: '1110', status: 'completed', tags: ['client', 'invoice'] },
    { date: '2025-12-05', description: 'AWS Cloud Services', amount: -2340.50, type: 'expense', category: 'Cloud Infrastructure', accountNumber: '1110', status: 'completed', tags: ['infrastructure', 'recurring'] },
    { date: '2025-12-04', description: 'Freelancer Payment - Design', amount: -3500, type: 'expense', category: 'Professional Services', accountNumber: '1110', status: 'pending', tags: ['contractor'] },
    { date: '2025-12-03', description: 'Subscription Revenue - December', amount: 8750, type: 'income', category: 'Subscription Revenue', accountNumber: '1110', status: 'completed', tags: ['saas', 'recurring'] },
    { date: '2025-12-02', description: 'Office Supplies', amount: -234.99, type: 'expense', category: 'Office Expenses', accountNumber: '2200', status: 'completed', tags: ['supplies'] },
    { date: '2025-12-01', description: 'ETH to USDC Conversion', amount: 5000, type: 'transfer', category: 'Crypto Exchange', accountNumber: '1150', status: 'completed', tags: ['crypto'], tokenized: true, txHash: '0xabcd...efgh' },
  ]

  for (const tx of transactions) {
    await prisma.transaction.create({
      data: {
        date: new Date(tx.date),
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        status: tx.status,
        tags: tx.tags,
        tokenized: tx.tokenized || false,
        txHash: tx.txHash,
        accountId: accountMap[tx.accountNumber],
        organizationId: org.id,
      },
    })
  }
  console.log('✓ Transactions created:', transactions.length)

  // Create chat channels
  const channels = [
    { name: 'general', description: 'General discussion' },
    { name: 'finance', description: 'Finance team updates' },
    { name: 'tech', description: 'Technical discussions' },
  ]

  for (const ch of channels) {
    await prisma.chatChannel.upsert({
      where: { organizationId_name: { organizationId: org.id, name: ch.name } },
      update: {},
      create: {
        name: ch.name,
        description: ch.description,
        organizationId: org.id,
      },
    })
  }
  console.log('✓ Chat channels created:', channels.length)

  console.log('✅ Seed complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())