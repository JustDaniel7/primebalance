// prisma/seed.ts
// Comprehensive seed for PrimeBalance - December 2025
// Prisma 7, Node 24 LTS, Next.js 16

import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { Pool } from 'pg'

// Use Pool directly for better connection handling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Helper for dates
const daysAgo = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

const daysFromNow = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

async function main() {
  console.log('🌱 Seeding PrimeBalance Database...\n')
  console.log('=' .repeat(60))

  // =============================================================================
  // CLEANUP - Delete all existing data in correct order (respecting FK constraints)
  // =============================================================================
  console.log('\n🧹 Cleaning existing data...')
  
  // Child tables first
  await prisma.liquidityPosition.deleteMany({})
  
  // FX module
  await prisma.fXRate.deleteMany({})
  await prisma.fXExposure.deleteMany({})
  
  // KPI module
  await prisma.kPIHistory.deleteMany({})
  await prisma.kPI.deleteMany({})
  
  // Scenario module
  await prisma.scenario.deleteMany({})
  
  // Cash Forecast module
  await prisma.cashForecastPeriod.deleteMany({})
  await prisma.cashForecast.deleteMany({})
  
  // Task module (with all relations)
  await prisma.taskActivity.deleteMany({})
  await prisma.taskComment.deleteMany({})
  await prisma.taskAttachment.deleteMany({})
  await prisma.taskNotification.deleteMany({})
  await prisma.taskRiskLink.deleteMany({})
  await prisma.taskDependency.deleteMany({})
  await prisma.taskWatcher.deleteMany({})
  await prisma.taskAssignee.deleteMany({})
  await prisma.taskTagLink.deleteMany({})
  await prisma.savedTaskFilter.deleteMany({})
  await prisma.riskActivity.deleteMany({})
  await prisma.riskComment.deleteMany({})
  await prisma.riskMitigationStep.deleteMany({})
  await prisma.risk.deleteMany({})
  await prisma.taskTag.deleteMany({})
  await prisma.task.deleteMany({})
  
  // Offer module
  await prisma.offer.deleteMany({})
  
  // Supplier module
  await prisma.supplierContact.deleteMany({})
  await prisma.supplier.deleteMany({})
  
  // Customer module
  await prisma.customerRiskIndicator.deleteMany({})
  await prisma.customerRevenue.deleteMany({})
  await prisma.customerCreditEvent.deleteMany({})
  await prisma.customerPayment.deleteMany({})
  await prisma.customerContact.deleteMany({})
  await prisma.customer.deleteMany({})
  
  // Period Close module
  await prisma.periodAuditEntry.deleteMany({})
  await prisma.periodAdjustment.deleteMany({})
  await prisma.periodMissingItem.deleteMany({})
  await prisma.closeChecklistItem.deleteMany({})
  await prisma.accountingPeriod.deleteMany({})

  // Assets module
  await prisma.assetDisposal.deleteMany({})
  await prisma.assetTransfer.deleteMany({})
  await prisma.assetEvent.deleteMany({})
  await prisma.assetDepreciation.deleteMany({})
  await prisma.capExItem.deleteMany({})
  await prisma.capExBudget.deleteMany({})
  await prisma.asset.deleteMany({})
  
  // Treasury module
  await prisma.nettingOpportunity.deleteMany({})
  await prisma.nettingSession.deleteMany({})
  await prisma.nettingAgreement.deleteMany({})
  await prisma.offsetEntry.deleteMany({})
  await prisma.treasuryScenario.deleteMany({})
  await prisma.treasuryDecision.deleteMany({})
  await prisma.treasuryCashMovement.deleteMany({})
  await prisma.facilityDrawdown.deleteMany({})
  await prisma.creditFacility.deleteMany({})
  await prisma.capitalBucket.deleteMany({})
  await prisma.treasuryAccount.deleteMany({})
  
  // Receivables module
  await prisma.receivableEvent.deleteMany({})
  await prisma.receivablePayment.deleteMany({})
  await prisma.receivable.deleteMany({})
  
  // Inventory module
  await prisma.inventoryMovement.deleteMany({})
  await prisma.inventoryBatch.deleteMany({})
  await prisma.inventoryItem.deleteMany({})
  
  // Liabilities module
  await prisma.liabilityPayment.deleteMany({})
  await prisma.liability.deleteMany({})
  
  // Core business
  await prisma.archiveItem.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.invoice.deleteMany({})
  
  // Project module
  await prisma.internalChargeback.deleteMany({})
  await prisma.timeEntry.deleteMany({})
  await prisma.projectMilestone.deleteMany({})
  await prisma.project.deleteMany({})
  await prisma.costCenter.deleteMany({})
  
  // User data
  await prisma.savedReport.deleteMany({})
  await prisma.aISuggestion.deleteMany({})
  await prisma.wallet.deleteMany({})
  await prisma.corporateEntity.deleteMany({})
  
  // Chat
  await prisma.chatMessage.deleteMany({})
  await prisma.chatChannel.deleteMany({})
  
  // Transactions
  await prisma.receipt.deleteMany({})
  await prisma.transaction.deleteMany({})
  await prisma.financialAccount.deleteMany({})

  // Auth & User
  await prisma.userSettings.deleteMany({})
  await prisma.session.deleteMany({})
  await prisma.account.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.organization.deleteMany({})
  
  console.log('  ✓ Cleaned all tables')

  // =============================================================================
  // 1. ORGANIZATION
  // =============================================================================
  console.log('\n📁 Creating Organization...')
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      name: 'Demo Company GmbH',
      slug: 'demo-company',
      country: 'CH',
      industry: 'Technology',
      fiscalYearEnd: '12-31',
      defaultCurrency: 'EUR',
      taxId: 'CHE-123.456.789',
    },
  })
  console.log('  ✓ Organization:', org.name)

  // =============================================================================
  // 2. USER & SETTINGS
  // =============================================================================
  console.log('\n👤 Creating User...')
  const user = await prisma.user.upsert({
    where: { email: 'demo@primebalance.app' },
    update: { organizationId: org.id },
    create: {
      email: 'demo@primebalance.app',
      name: 'Max Mustermann',
      role: 'owner',
      organizationId: org.id,
    },
  })
  console.log('  ✓ User:', user.email)

  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      language: 'en',
      timezone: 'Europe/Zurich',
      currency: 'EUR',
      theme: 'dark',
      dateFormat: 'DD.MM.YYYY',
    },
  })
  console.log('  ✓ User settings created')

  // =============================================================================
  // 3. FINANCIAL ACCOUNTS (Chart of Accounts)
  // =============================================================================
  console.log('\n📊 Creating Chart of Accounts...')
  const accountsData = [
    { accountNumber: '1000', name: 'Assets', type: 'asset', balance: 0 },
    { accountNumber: '1100', name: 'Cash & Bank', type: 'bank', balance: 0, parent: '1000' },
    { accountNumber: '1110', name: 'Business Checking (EUR)', type: 'bank', balance: 125000, parent: '1100' },
    { accountNumber: '1111', name: 'Business Checking (CHF)', type: 'bank', balance: 45000, parent: '1100' },
    { accountNumber: '1120', name: 'Savings Account', type: 'bank', balance: 75000, parent: '1100' },
    { accountNumber: '1150', name: 'Crypto Holdings', type: 'crypto', balance: 28500, parent: '1000' },
    { accountNumber: '1200', name: 'Accounts Receivable', type: 'asset', balance: 67500, parent: '1000' },
    { accountNumber: '1300', name: 'Inventory', type: 'asset', balance: 45000, parent: '1000' },
    { accountNumber: '1400', name: 'Prepaid Expenses', type: 'asset', balance: 12000, parent: '1000' },
    { accountNumber: '1500', name: 'Fixed Assets', type: 'asset', balance: 185000, parent: '1000' },
    { accountNumber: '1510', name: 'Equipment', type: 'asset', balance: 85000, parent: '1500' },
    { accountNumber: '1520', name: 'Vehicles', type: 'asset', balance: 65000, parent: '1500' },
    { accountNumber: '1530', name: 'Furniture & Fixtures', type: 'asset', balance: 35000, parent: '1500' },
    { accountNumber: '2000', name: 'Liabilities', type: 'liability', balance: 0 },
    { accountNumber: '2100', name: 'Accounts Payable', type: 'liability', balance: 42000, parent: '2000' },
    { accountNumber: '2200', name: 'Credit Cards', type: 'liability', balance: 8500, parent: '2000' },
    { accountNumber: '2300', name: 'Short-term Loans', type: 'liability', balance: 50000, parent: '2000' },
    { accountNumber: '2400', name: 'Accrued Expenses', type: 'liability', balance: 15000, parent: '2000' },
    { accountNumber: '2500', name: 'VAT Payable', type: 'liability', balance: 18500, parent: '2000' },
    { accountNumber: '2600', name: 'Long-term Loans', type: 'liability', balance: 120000, parent: '2000' },
    { accountNumber: '3000', name: 'Equity', type: 'equity', balance: 350000 },
    { accountNumber: '3100', name: 'Share Capital', type: 'equity', balance: 100000, parent: '3000' },
    { accountNumber: '3200', name: 'Retained Earnings', type: 'equity', balance: 250000, parent: '3000' },
    { accountNumber: '4000', name: 'Revenue', type: 'revenue', balance: 0 },
    { accountNumber: '4100', name: 'Product Sales', type: 'revenue', balance: 450000, parent: '4000' },
    { accountNumber: '4200', name: 'Service Revenue', type: 'revenue', balance: 280000, parent: '4000' },
    { accountNumber: '4300', name: 'Subscription Revenue', type: 'revenue', balance: 156000, parent: '4000' },
    { accountNumber: '4400', name: 'Other Income', type: 'revenue', balance: 24000, parent: '4000' },
    { accountNumber: '5000', name: 'Expenses', type: 'expense', balance: 0 },
    { accountNumber: '5100', name: 'Cost of Goods Sold', type: 'expense', balance: 185000, parent: '5000' },
    { accountNumber: '5200', name: 'Salaries & Wages', type: 'expense', balance: 320000, parent: '5000' },
    { accountNumber: '5300', name: 'Rent & Utilities', type: 'expense', balance: 48000, parent: '5000' },
    { accountNumber: '5400', name: 'Marketing', type: 'expense', balance: 65000, parent: '5000' },
    { accountNumber: '5500', name: 'Software & Subscriptions', type: 'expense', balance: 28000, parent: '5000' },
    { accountNumber: '5600', name: 'Professional Services', type: 'expense', balance: 42000, parent: '5000' },
    { accountNumber: '5700', name: 'Travel & Entertainment', type: 'expense', balance: 18000, parent: '5000' },
    { accountNumber: '5800', name: 'Depreciation', type: 'expense', balance: 35000, parent: '5000' },
    { accountNumber: '5900', name: 'Other Expenses', type: 'expense', balance: 12000, parent: '5000' },
  ]

  const accountMap: Record<string, string> = {}
  
  for (const acc of accountsData) {
    const created = await prisma.financialAccount.upsert({
      where: { organizationId_accountNumber: { organizationId: org.id, accountNumber: acc.accountNumber } },
      update: { balance: acc.balance },
      create: {
        name: acc.name,
        accountNumber: acc.accountNumber,
        type: acc.type,
        balance: acc.balance,
        currency: 'EUR',
        organizationId: org.id,
      },
    })
    accountMap[acc.accountNumber] = created.id
  }

  for (const acc of accountsData) {
    if (acc.parent && accountMap[acc.parent]) {
      await prisma.financialAccount.update({
        where: { id: accountMap[acc.accountNumber] },
        data: { parentId: accountMap[acc.parent] },
      })
    }
  }
  console.log('  ✓ Created', Object.keys(accountMap).length, 'accounts')

  // =============================================================================
  // 4. TRANSACTIONS
  // =============================================================================
  console.log('\n💳 Creating Transactions...')
  const transactions = [
    { date: '2025-01-15', description: 'Client Payment - Acme Corp', amount: 25000, type: 'income', category: 'Product Sales', account: '1110', status: 'completed', tags: ['client', 'invoice-paid'] },
    { date: '2025-01-14', description: 'AWS Cloud Services - January', amount: -3240.50, type: 'expense', category: 'Cloud Infrastructure', account: '1110', status: 'completed', tags: ['infrastructure', 'recurring'] },
    { date: '2025-01-13', description: 'Office Rent - January', amount: -4500, type: 'expense', category: 'Rent', account: '1110', status: 'completed', tags: ['rent', 'recurring'] },
    { date: '2025-01-12', description: 'Subscription Revenue - January Batch', amount: 13500, type: 'income', category: 'Subscription Revenue', account: '1110', status: 'completed', tags: ['saas', 'recurring'] },
    { date: '2025-01-11', description: 'Freelancer Payment - UI Design', amount: -4500, type: 'expense', category: 'Professional Services', account: '1110', status: 'pending', tags: ['contractor', 'design'] },
    { date: '2025-01-10', description: 'Hardware Purchase - Laptops', amount: -8500, type: 'expense', category: 'Equipment', account: '2200', status: 'completed', tags: ['hardware', 'capex'] },
    { date: '2025-01-09', description: 'Client Payment - TechStart GmbH', amount: 18500, type: 'income', category: 'Service Revenue', account: '1110', status: 'completed', tags: ['client', 'consulting'] },
    { date: '2025-01-08', description: 'Google Workspace - Annual', amount: -2880, type: 'expense', category: 'Software', account: '1110', status: 'completed', tags: ['software', 'annual'] },
    { date: '2025-01-07', description: 'Transfer to Savings', amount: -20000, type: 'transfer', category: 'Internal Transfer', account: '1110', status: 'completed', tags: ['internal'] },
    { date: '2025-01-06', description: 'ETH Sale to EUR', amount: 5500, type: 'income', category: 'Crypto Exchange', account: '1150', status: 'completed', tags: ['crypto'], tokenized: true, txHash: '0x7a8b9c0d...' },
    { date: '2025-01-05', description: 'Marketing Campaign - LinkedIn', amount: -3500, type: 'expense', category: 'Marketing', account: '2200', status: 'completed', tags: ['marketing', 'ads'] },
    { date: '2025-01-04', description: 'Client Payment - GlobalTech', amount: 42000, type: 'income', category: 'Product Sales', account: '1110', status: 'completed', tags: ['client', 'enterprise'] },
    { date: '2025-01-03', description: 'Insurance Premium - Q1', amount: -4200, type: 'expense', category: 'Insurance', account: '1110', status: 'completed', tags: ['insurance', 'quarterly'] },
    { date: '2025-01-02', description: 'Salary Payments - January', amount: -45000, type: 'expense', category: 'Salaries', account: '1110', status: 'completed', tags: ['payroll', 'recurring'] },
    { date: '2024-12-28', description: 'Year-end Client Payment', amount: 35000, type: 'income', category: 'Service Revenue', account: '1110', status: 'completed', tags: ['client'] },
    { date: '2024-12-20', description: 'Software Licenses - Annual Renewal', amount: -12500, type: 'expense', category: 'Software', account: '1110', status: 'completed', tags: ['software', 'annual'] },
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
        accountId: accountMap[tx.account],
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', transactions.length, 'transactions')

  // =============================================================================
  // 5. RECEIPTS
  // =============================================================================
  console.log('\n🧾 Creating Receipts...')
  const receipts = [
    { fileName: 'aws-invoice-jan-2025.pdf', fileType: 'pdf', fileSize: 245000, vendor: 'Amazon Web Services', amount: 3240.50, date: '2025-01-14' },
    { fileName: 'office-rent-jan-2025.pdf', fileType: 'pdf', fileSize: 125000, vendor: 'Swiss Property AG', amount: 4500, date: '2025-01-13' },
    { fileName: 'laptop-receipt.pdf', fileType: 'pdf', fileSize: 180000, vendor: 'Apple Store', amount: 8500, date: '2025-01-10' },
    { fileName: 'google-workspace-receipt.pdf', fileType: 'pdf', fileSize: 95000, vendor: 'Google', amount: 2880, date: '2025-01-08' },
    { fileName: 'linkedin-ads-invoice.pdf', fileType: 'pdf', fileSize: 156000, vendor: 'LinkedIn', amount: 3500, date: '2025-01-05' },
    { fileName: 'insurance-q1-2025.pdf', fileType: 'pdf', fileSize: 320000, vendor: 'Swiss Re', amount: 4200, date: '2025-01-03' },
    { fileName: 'restaurant-receipt.jpg', fileType: 'image', fileSize: 2500000, vendor: 'Restaurant Bellevue', amount: 245.50, date: '2025-01-02' },
    { fileName: 'taxi-receipt.jpg', fileType: 'image', fileSize: 1800000, vendor: 'Uber', amount: 42.30, date: '2025-01-02' },
  ]

  for (const r of receipts) {
    await prisma.receipt.create({
      data: {
        fileName: r.fileName,
        fileUrl: `/uploads/${r.fileName}`,
        fileType: r.fileType,
        fileSize: r.fileSize,
        vendor: r.vendor,
        amount: r.amount,
        date: new Date(r.date),
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', receipts.length, 'receipts')

  // =============================================================================
  // 6. CHAT CHANNELS & MESSAGES
  // =============================================================================
  console.log('\n💬 Creating Chat Channels & Messages...')
  const channelsData = [
    { name: 'general', description: 'General team discussion' },
    { name: 'finance', description: 'Finance and accounting topics' },
    { name: 'sales', description: 'Sales team updates' },
    { name: 'engineering', description: 'Technical discussions' },
  ]

  const channelMap: Record<string, string> = {}
  for (const ch of channelsData) {
    const created = await prisma.chatChannel.upsert({
      where: { organizationId_name: { organizationId: org.id, name: ch.name } },
      update: {},
      create: { name: ch.name, description: ch.description, organizationId: org.id },
    })
    channelMap[ch.name] = created.id
  }
  console.log('  ✓ Created', channelsData.length, 'channels')

  // Chat Messages
  const messages = [
    { channel: 'general', content: 'Welcome to Demo Company! 🎉', createdAt: daysAgo(30) },
    { channel: 'general', content: 'Q1 kickoff meeting scheduled for Monday at 10am', createdAt: daysAgo(7) },
    { channel: 'general', content: 'Reminder: Submit expense reports by end of month', createdAt: daysAgo(3) },
    { channel: 'finance', content: 'January invoices have been processed', createdAt: daysAgo(5) },
    { channel: 'finance', content: 'VAT filing due next week - all documents ready', createdAt: daysAgo(2) },
    { channel: 'finance', content: 'Bank reconciliation complete for December', createdAt: daysAgo(10) },
    { channel: 'sales', content: 'Closed deal with GlobalTech - €42k! 🚀', createdAt: daysAgo(4) },
    { channel: 'sales', content: 'New lead from trade show - TechStart GmbH', createdAt: daysAgo(8) },
    { channel: 'engineering', content: 'Deployed v2.1 to production', createdAt: daysAgo(6) },
    { channel: 'engineering', content: 'Sprint planning tomorrow at 2pm', createdAt: daysAgo(1) },
  ]

  for (const msg of messages) {
    await prisma.chatMessage.create({
      data: {
        content: msg.content,
        channelId: channelMap[msg.channel],
        userId: user.id,
        createdAt: msg.createdAt,
      },
    })
  }
  console.log('  ✓ Created', messages.length, 'chat messages')

  // =============================================================================
  // 7. CORPORATE ENTITIES
  // =============================================================================
  console.log('\n🏢 Creating Corporate Entities...')
  const entities = [
    { name: 'Demo Company GmbH', type: 'corporation', jurisdiction: 'CH', taxId: 'CHE-123.456.789', ownershipPercent: 100, revenue: 910000, expenses: 753000, taxLiability: 31400, effectiveTaxRate: 20 },
    { name: 'Demo Tech AG', type: 'corporation', jurisdiction: 'CH', taxId: 'CHE-987.654.321', ownershipPercent: 100, revenue: 450000, expenses: 380000, taxLiability: 14000, effectiveTaxRate: 20 },
    { name: 'Demo Services LLC', type: 'llc', jurisdiction: 'DE', taxId: 'DE123456789', ownershipPercent: 80, revenue: 280000, expenses: 220000, taxLiability: 18000, effectiveTaxRate: 30 },
  ]

  const entityMap: Record<string, string> = {}
  for (const e of entities) {
    const created = await prisma.corporateEntity.create({
      data: {
        name: e.name,
        type: e.type,
        jurisdiction: e.jurisdiction,
        taxId: e.taxId,
        ownershipPercent: e.ownershipPercent,
        revenue: e.revenue,
        expenses: e.expenses,
        taxLiability: e.taxLiability,
        effectiveTaxRate: e.effectiveTaxRate,
        incorporationDate: new Date('2020-01-15'),
        userId: user.id,
      },
    })
    entityMap[e.name] = created.id
  }
  console.log('  ✓ Created', entities.length, 'corporate entities')

  // =============================================================================
  // 8. WALLETS
  // =============================================================================
  console.log('\n👛 Creating Wallets...')
  const wallets = [
    { name: 'Company ETH Wallet', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8bDe0', network: 'ethereum', provider: 'metamask' },
    { name: 'Company BTC Wallet', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', network: 'bitcoin', provider: 'ledger' },
    { name: 'Treasury SOL', address: '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs', network: 'solana', provider: 'phantom' },
  ]

  for (const w of wallets) {
    await prisma.wallet.upsert({
      where: { userId_address_network: { userId: user.id, address: w.address, network: w.network } },
      update: {},
      create: { ...w, userId: user.id },
    })
  }
  console.log('  ✓ Created', wallets.length, 'wallets')

  // =============================================================================
  // 9. AI SUGGESTIONS
  // =============================================================================
  console.log('\n🤖 Creating AI Suggestions...')
  const suggestions = [
    { type: 'tax_optimization', title: 'R&D Tax Credit Opportunity', description: 'Based on your software development expenses, you may qualify for R&D tax credits worth approximately €15,000.', impact: 'Potential savings: €15,000/year', priority: 'high' },
    { type: 'categorization', title: 'Uncategorized Transactions', description: '8 transactions from the last week need categorization for accurate reporting.', impact: 'Affects monthly report accuracy', priority: 'medium' },
    { type: 'anomaly', title: 'Unusual Marketing Spend', description: 'Marketing expenses are 40% higher than the 3-month average. Review recent campaigns.', impact: 'Budget variance: +€5,200', priority: 'medium' },
    { type: 'insight', title: 'Cash Flow Optimization', description: 'Moving invoice payment terms from Net-45 to Net-30 could improve cash position by €28,000.', impact: 'Improved liquidity', priority: 'low' },
  ]

  for (const s of suggestions) {
    await prisma.aISuggestion.create({
      data: { ...s, userId: user.id },
    })
  }
  console.log('  ✓ Created', suggestions.length, 'AI suggestions')

  // =============================================================================
  // 10. SAVED REPORTS
  // =============================================================================
  console.log('\n📈 Creating Saved Reports...')
  const reports = [
    { name: 'Monthly P&L', type: 'PROFIT_LOSS', isScheduled: true, scheduleFreq: 'monthly' },
    { name: 'Weekly Cash Flow', type: 'CASH_FLOW', isScheduled: true, scheduleFreq: 'weekly' },
    { name: 'Quarterly Tax Summary', type: 'TAX_SUMMARY', isScheduled: true, scheduleFreq: 'quarterly' },
    { name: 'Annual Balance Sheet', type: 'BALANCE_SHEET', isScheduled: false },
  ]

  for (const r of reports) {
    await prisma.savedReport.create({
      data: { ...r, userId: user.id },
    })
  }
  console.log('  ✓ Created', reports.length, 'saved reports')

  // =============================================================================
  // 11. INVOICES
  // =============================================================================
  console.log('\n📄 Creating Invoices...')
  const invoices = [
    {
      invoiceNumber: 'INV-2025-001',
      status: 'paid',
      sender: { name: 'Demo Company GmbH', address: 'Bahnhofstrasse 1', city: 'Zurich', postalCode: '8001', country: 'CH', taxId: 'CHE-123.456.789' },
      recipient: { name: 'Acme Corp', company: 'Acme Corporation', address: '123 Main St', city: 'Berlin', postalCode: '10115', country: 'DE', email: 'billing@acme.de' },
      invoiceDate: '2025-01-10',
      dueDate: '2025-01-25',
      items: [
        { id: '1', description: 'Software License - Enterprise', quantity: 1, unitPrice: 15000, taxRate: 7.7, total: 16155 },
        { id: '2', description: 'Implementation Services', quantity: 40, unitPrice: 150, taxRate: 7.7, total: 6462 },
      ],
      subtotal: 21000,
      taxAmount: 1617,
      total: 22617,
      paidAt: '2025-01-15',
    },
    {
      invoiceNumber: 'INV-2025-002',
      status: 'sent',
      sender: { name: 'Demo Company GmbH', address: 'Bahnhofstrasse 1', city: 'Zurich', postalCode: '8001', country: 'CH', taxId: 'CHE-123.456.789' },
      recipient: { name: 'TechStart GmbH', address: 'Startup Allee 42', city: 'Munich', postalCode: '80331', country: 'DE', email: 'finance@techstart.de' },
      invoiceDate: '2025-01-12',
      dueDate: '2025-01-27',
      items: [
        { id: '1', description: 'Consulting Services - January', quantity: 80, unitPrice: 200, taxRate: 7.7, total: 17232 },
      ],
      subtotal: 16000,
      taxAmount: 1232,
      total: 17232,
      sentAt: '2025-01-12',
    },
    {
      invoiceNumber: 'INV-2025-003',
      status: 'draft',
      sender: { name: 'Demo Company GmbH', address: 'Bahnhofstrasse 1', city: 'Zurich', postalCode: '8001', country: 'CH', taxId: 'CHE-123.456.789' },
      recipient: { name: 'GlobalTech Inc', address: '500 Tech Drive', city: 'San Francisco', postalCode: '94105', country: 'US', email: 'ap@globaltech.com' },
      invoiceDate: '2025-01-16',
      dueDate: '2025-02-15',
      items: [
        { id: '1', description: 'Annual Software Subscription', quantity: 50, unitPrice: 800, taxRate: 0, total: 40000 },
        { id: '2', description: 'Premium Support Package', quantity: 1, unitPrice: 5000, taxRate: 0, total: 5000 },
      ],
      subtotal: 45000,
      taxAmount: 0,
      total: 45000,
    },
    {
      invoiceNumber: 'INV-2024-089',
      status: 'overdue',
      sender: { name: 'Demo Company GmbH', address: 'Bahnhofstrasse 1', city: 'Zurich', postalCode: '8001', country: 'CH', taxId: 'CHE-123.456.789' },
      recipient: { name: 'SlowPay Ltd', address: '99 Late Street', city: 'London', postalCode: 'EC1A 1BB', country: 'GB', email: 'accounts@slowpay.co.uk' },
      invoiceDate: '2024-12-01',
      dueDate: '2024-12-31',
      items: [
        { id: '1', description: 'Development Services - Q4', quantity: 120, unitPrice: 175, taxRate: 7.7, total: 22638 },
      ],
      subtotal: 21000,
      taxAmount: 1617,
      total: 22617,
      sentAt: '2024-12-01',
    },
  ]

  for (const inv of invoices) {
    await prisma.invoice.create({
      data: {
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        sender: inv.sender,
        recipient: inv.recipient,
        invoiceDate: new Date(inv.invoiceDate),
        dueDate: new Date(inv.dueDate),
        items: inv.items,
        currency: 'EUR',
        subtotal: inv.subtotal,
        taxAmount: inv.taxAmount,
        total: inv.total,
        applyTax: inv.taxAmount > 0,
        taxRate: 7.7,
        payment: { method: 'bank_transfer', dueInDays: 15, bankName: 'UBS', iban: 'CH93 0076 2011 6238 5295 7' },
        language: 'en',
        sentAt: inv.sentAt ? new Date(inv.sentAt) : null,
        paidAt: inv.paidAt ? new Date(inv.paidAt) : null,
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', invoices.length, 'invoices')

  // =============================================================================
  // 12. ORDERS
  // =============================================================================
  console.log('\n📦 Creating Orders...')
  const orders = [
    {
      orderNumber: 'ORD-2025-001',
      status: 'completed',
      customerName: 'Acme Corp',
      customerEmail: 'orders@acme.de',
      orderDate: '2025-01-05',
      items: [
        { id: '1', description: 'Enterprise License', quantity: 1, unitPrice: 15000 },
        { id: '2', description: 'Implementation', quantity: 40, unitPrice: 150 },
      ],
      subtotal: 21000,
      taxAmount: 1617,
      total: 22617,
      totalQuantity: 41,
      fulfilledQuantity: 41,
      fulfillmentPercent: 100,
      invoicedAmount: 22617,
      paidAmount: 22617,
      completedDate: '2025-01-15',
    },
    {
      orderNumber: 'ORD-2025-002',
      status: 'in_progress',
      customerName: 'TechStart GmbH',
      customerEmail: 'orders@techstart.de',
      orderDate: '2025-01-08',
      expectedDeliveryDate: '2025-02-08',
      items: [
        { id: '1', description: 'Consulting Package', quantity: 160, unitPrice: 200 },
      ],
      subtotal: 32000,
      taxAmount: 2464,
      total: 34464,
      totalQuantity: 160,
      fulfilledQuantity: 80,
      fulfillmentPercent: 50,
      invoicedAmount: 17232,
      paidAmount: 0,
      priority: 'high',
    },
    {
      orderNumber: 'ORD-2025-003',
      status: 'confirmed',
      customerName: 'GlobalTech Inc',
      customerEmail: 'procurement@globaltech.com',
      orderDate: '2025-01-14',
      expectedDeliveryDate: '2025-02-01',
      items: [
        { id: '1', description: 'Annual Subscription x50', quantity: 50, unitPrice: 800 },
        { id: '2', description: 'Premium Support', quantity: 1, unitPrice: 5000 },
      ],
      subtotal: 45000,
      taxAmount: 0,
      total: 45000,
      totalQuantity: 51,
      fulfilledQuantity: 0,
      fulfillmentPercent: 0,
      invoicedAmount: 0,
      paidAmount: 0,
      priority: 'normal',
    },
    {
      orderNumber: 'ORD-2025-004',
      status: 'draft',
      customerName: 'NewClient AG',
      customerEmail: 'info@newclient.ch',
      orderDate: '2025-01-16',
      items: [
        { id: '1', description: 'Starter Package', quantity: 1, unitPrice: 5000 },
      ],
      subtotal: 5000,
      taxAmount: 385,
      total: 5385,
      totalQuantity: 1,
      fulfilledQuantity: 0,
      fulfillmentPercent: 0,
      invoicedAmount: 0,
      paidAmount: 0,
    },
  ]

  for (const ord of orders) {
    await prisma.order.create({
      data: {
        orderNumber: ord.orderNumber,
        status: ord.status,
        customerName: ord.customerName,
        customerEmail: ord.customerEmail,
        orderDate: new Date(ord.orderDate),
        expectedDeliveryDate: ord.expectedDeliveryDate ? new Date(ord.expectedDeliveryDate) : null,
        completedDate: ord.completedDate ? new Date(ord.completedDate) : null,
        items: ord.items,
        currency: 'EUR',
        subtotal: ord.subtotal,
        taxAmount: ord.taxAmount,
        discountAmount: 0,
        total: ord.total,
        taxRate: 7.7,
        totalQuantity: ord.totalQuantity,
        fulfilledQuantity: ord.fulfilledQuantity,
        fulfillmentPercent: ord.fulfillmentPercent,
        invoicedAmount: ord.invoicedAmount,
        paidAmount: ord.paidAmount,
        priority: ord.priority || 'normal',
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', orders.length, 'orders')

  // =============================================================================
  // 13. ARCHIVE ITEMS
  // =============================================================================
  console.log('\n📁 Creating Archive Items...')
  const archiveItems = [
    { category: 'bookings', originalId: 'txn-2024-final', originalType: 'transaction', title: 'Year-End Closing Entries 2024', description: 'Final adjusting entries for fiscal year 2024', amount: 125000, itemDate: '2024-12-31', fiscalYear: 2024, tags: ['year-end', 'adjustments'] },
    { category: 'invoices', originalId: 'inv-2024-078', originalType: 'invoice', title: 'Invoice Schmidt & Partner', description: 'Consulting services November 2024', amount: 8500, counterparty: 'Schmidt & Partner GmbH', itemDate: '2024-11-30', fiscalYear: 2024, tags: ['consulting', 'paid'] },
    { category: 'invoices', originalId: 'inv-2024-079', originalType: 'invoice', title: 'Invoice Tech Solutions', description: 'IT Support December 2024', amount: 3200, counterparty: 'Tech Solutions AG', itemDate: '2024-12-15', fiscalYear: 2024, tags: ['it', 'support'] },
    { category: 'bank', originalId: 'stmt-2024-12', originalType: 'statement', title: 'Bank Statement December 2024', description: 'Monthly bank reconciliation statement', amount: 142500, counterparty: 'UBS AG', itemDate: '2024-12-31', fiscalYear: 2024, tags: ['reconciliation'] },
    { category: 'contracts', originalId: 'contract-2024-015', originalType: 'contract', title: 'Service Agreement - TechCorp', description: '12-month service agreement', amount: 96000, counterparty: 'TechCorp Ltd', itemDate: '2024-01-15', fiscalYear: 2024, tags: ['annual', 'services'] },
    { category: 'documents', originalId: 'doc-2024-tax', originalType: 'document', title: 'Tax Return 2023', description: 'Filed corporate tax return', amount: 45000, itemDate: '2024-03-31', fiscalYear: 2024, tags: ['tax', 'filed'] },
  ]

  for (const item of archiveItems) {
    await prisma.archiveItem.create({
      data: {
        category: item.category,
        originalId: item.originalId,
        originalType: item.originalType,
        title: item.title,
        description: item.description,
        amount: item.amount,
        currency: 'EUR',
        counterparty: item.counterparty,
        itemDate: new Date(item.itemDate),
        fiscalYear: item.fiscalYear,
        tags: item.tags,
        archivedBy: user.id,
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', archiveItems.length, 'archive items')

  // =============================================================================
  // 14. LIABILITIES
  // =============================================================================
  console.log('\n💰 Creating Liabilities...')
  const liabilities = [
    {
      type: 'loan',
      name: 'Business Expansion Loan',
      counterpartyName: 'UBS AG',
      counterpartyType: 'bank',
      principalAmount: 150000,
      outstandingAmount: 120000,
      paidAmount: 30000,
      interestRate: 3.5,
      interestType: 'fixed',
      startDate: '2023-06-01',
      maturityDate: '2028-06-01',
      paymentFrequency: 'monthly',
      paymentAmount: 2850,
      nextPaymentDate: '2025-02-01',
      riskLevel: 'low',
    },
    {
      type: 'credit_line',
      name: 'Operating Credit Line',
      counterpartyName: 'Credit Suisse',
      counterpartyType: 'bank',
      principalAmount: 0,
      outstandingAmount: 25000,
      creditLimit: 100000,
      availableCredit: 75000,
      interestRate: 5.25,
      interestType: 'variable',
      startDate: '2024-01-01',
      maturityDate: '2025-12-31',
      riskLevel: 'low',
    },
    {
      type: 'supplier_credit',
      name: 'Hardware Supplier Credit',
      counterpartyName: 'Dell Technologies',
      counterpartyType: 'supplier',
      principalAmount: 45000,
      outstandingAmount: 35000,
      paidAmount: 10000,
      startDate: '2024-11-01',
      maturityDate: '2025-05-01',
      paymentFrequency: 'monthly',
      paymentAmount: 7500,
      nextPaymentDate: '2025-02-01',
      riskLevel: 'low',
    },
    {
      type: 'lease',
      name: 'Office Lease Obligation',
      counterpartyName: 'Swiss Property AG',
      counterpartyType: 'other',
      principalAmount: 216000,
      outstandingAmount: 162000,
      paidAmount: 54000,
      startDate: '2023-01-01',
      maturityDate: '2026-12-31',
      paymentFrequency: 'monthly',
      paymentAmount: 4500,
      nextPaymentDate: '2025-02-01',
      riskLevel: 'low',
    },
  ]

  const liabilityMap: Record<string, string> = {}
  for (const lib of liabilities) {
    const utilizationRate = lib.creditLimit ? (lib.outstandingAmount / lib.creditLimit) * 100 : null
    
    const created = await prisma.liability.create({
      data: {
        type: lib.type,
        name: lib.name,
        counterpartyName: lib.counterpartyName,
        counterpartyType: lib.counterpartyType,
        currency: 'EUR',
        principalAmount: lib.principalAmount,
        outstandingAmount: lib.outstandingAmount,
        paidAmount: lib.paidAmount || 0,
        creditLimit: lib.creditLimit,
        availableCredit: lib.availableCredit,
        utilizationRate,
        interestRate: lib.interestRate,
        interestType: lib.interestType,
        startDate: new Date(lib.startDate),
        maturityDate: lib.maturityDate ? new Date(lib.maturityDate) : null,
        nextPaymentDate: lib.nextPaymentDate ? new Date(lib.nextPaymentDate) : null,
        paymentFrequency: lib.paymentFrequency,
        paymentAmount: lib.paymentAmount,
        riskLevel: lib.riskLevel,
        organizationId: org.id,
      },
    })
    liabilityMap[lib.name] = created.id
  }
  console.log('  ✓ Created', liabilities.length, 'liabilities')

  // =============================================================================
  // 14b. LIABILITY PAYMENTS
  // =============================================================================
  console.log('\n💸 Creating Liability Payments...')
  const liabilityPayments = [
    // Business Expansion Loan payments
    { liabilityName: 'Business Expansion Loan', amount: 2850, principalAmount: 2500, interestAmount: 350, paymentDate: daysAgo(60), status: 'completed' },
    { liabilityName: 'Business Expansion Loan', amount: 2850, principalAmount: 2510, interestAmount: 340, paymentDate: daysAgo(30), status: 'completed' },
    { liabilityName: 'Business Expansion Loan', amount: 2850, principalAmount: 2520, interestAmount: 330, paymentDate: daysAgo(0), status: 'completed' },
    // Hardware Supplier Credit payments
    { liabilityName: 'Hardware Supplier Credit', amount: 7500, principalAmount: 7500, interestAmount: 0, paymentDate: daysAgo(45), status: 'completed' },
    { liabilityName: 'Hardware Supplier Credit', amount: 2500, principalAmount: 2500, interestAmount: 0, paymentDate: daysAgo(15), status: 'completed' },
    // Office Lease payments
    { liabilityName: 'Office Lease Obligation', amount: 4500, principalAmount: 4500, interestAmount: 0, paymentDate: daysAgo(60), status: 'completed' },
    { liabilityName: 'Office Lease Obligation', amount: 4500, principalAmount: 4500, interestAmount: 0, paymentDate: daysAgo(30), status: 'completed' },
    { liabilityName: 'Office Lease Obligation', amount: 4500, principalAmount: 4500, interestAmount: 0, paymentDate: daysAgo(0), status: 'completed' },
  ]

  for (const pmt of liabilityPayments) {
    await prisma.liabilityPayment.create({
      data: {
        amount: pmt.amount,
        principalAmount: pmt.principalAmount,
        interestAmount: pmt.interestAmount,
        paymentDate: pmt.paymentDate,
        status: pmt.status,
        liabilityId: liabilityMap[pmt.liabilityName],
      },
    })
  }
  console.log('  ✓ Created', liabilityPayments.length, 'liability payments')

  // =============================================================================
  // 15. INVENTORY
  // =============================================================================
  console.log('\n📦 Creating Inventory...')
  const inventory = [
    { sku: 'SW-LIC-ENT', name: 'Enterprise Software License', type: 'finished_goods', category: 'Software', quantityOnHand: 999, quantityAvailable: 999, unitCost: 2500, sellingPrice: 15000, minimumStock: 1, reorderPoint: 1 },
    { sku: 'SW-LIC-PRO', name: 'Professional Software License', type: 'finished_goods', category: 'Software', quantityOnHand: 999, quantityAvailable: 999, unitCost: 800, sellingPrice: 5000, minimumStock: 1, reorderPoint: 1 },
    { sku: 'HW-LAPTOP-01', name: 'MacBook Pro 16"', type: 'merchandise', category: 'Hardware', quantityOnHand: 15, quantityAvailable: 12, quantityReserved: 3, unitCost: 2200, sellingPrice: 2800, minimumStock: 5, reorderPoint: 8, warehouseName: 'Main Warehouse', location: 'A-1-01' },
    { sku: 'HW-MONITOR-01', name: 'Dell UltraSharp 32"', type: 'merchandise', category: 'Hardware', quantityOnHand: 25, quantityAvailable: 25, unitCost: 650, sellingPrice: 850, minimumStock: 10, reorderPoint: 15, warehouseName: 'Main Warehouse', location: 'A-1-02' },
    { sku: 'HW-KB-01', name: 'Mechanical Keyboard', type: 'merchandise', category: 'Accessories', quantityOnHand: 50, quantityAvailable: 48, quantityReserved: 2, unitCost: 85, sellingPrice: 149, minimumStock: 20, reorderPoint: 25, warehouseName: 'Main Warehouse', location: 'B-2-01' },
    { sku: 'CONS-PAPER-01', name: 'Printer Paper A4', type: 'consumables', category: 'Office Supplies', quantityOnHand: 100, quantityAvailable: 100, unitCost: 4.50, minimumStock: 50, reorderPoint: 60, unitOfMeasure: 'pack', warehouseName: 'Main Warehouse', location: 'C-1-01' },
    { sku: 'HW-LAPTOP-02', name: 'ThinkPad X1 Carbon', type: 'merchandise', category: 'Hardware', quantityOnHand: 3, quantityAvailable: 3, unitCost: 1800, sellingPrice: 2400, minimumStock: 5, reorderPoint: 8, warehouseName: 'Main Warehouse', location: 'A-1-03' },
  ]

  const inventoryMap: Record<string, string> = {}
  for (const item of inventory) {
    const totalValue = item.quantityOnHand * item.unitCost
    
    const created = await prisma.inventoryItem.create({
      data: {
        sku: item.sku,
        name: item.name,
        type: item.type,
        category: item.category,
        status: 'active',
        quantityOnHand: item.quantityOnHand,
        quantityAvailable: item.quantityAvailable,
        quantityReserved: item.quantityReserved || 0,
        unitCost: item.unitCost,
        averageCost: item.unitCost,
        sellingPrice: item.sellingPrice,
        totalValue,
        currency: 'EUR',
        unitOfMeasure: item.unitOfMeasure || 'pcs',
        minimumStock: item.minimumStock,
        reorderPoint: item.reorderPoint,
        warehouseName: item.warehouseName,
        location: item.location,
        organizationId: org.id,
      },
    })
    inventoryMap[item.sku] = created.id
  }
  console.log('  ✓ Created', inventory.length, 'inventory items')

  // =============================================================================
  // 15b. INVENTORY BATCHES
  // =============================================================================
  console.log('\n📋 Creating Inventory Batches...')
  const batches = [
    { sku: 'HW-LAPTOP-01', batchNumber: 'BATCH-2025-001', initialQuantity: 10, currentQuantity: 8, unitCost: 2200, status: 'available' },
    { sku: 'HW-LAPTOP-01', batchNumber: 'BATCH-2025-002', initialQuantity: 5, currentQuantity: 4, unitCost: 2150, status: 'available' },
    { sku: 'HW-MONITOR-01', batchNumber: 'BATCH-2024-050', initialQuantity: 30, currentQuantity: 25, unitCost: 650, status: 'available' },
    { sku: 'HW-KB-01', batchNumber: 'BATCH-2024-100', initialQuantity: 100, currentQuantity: 50, unitCost: 85, status: 'available' },
    { sku: 'CONS-PAPER-01', batchNumber: 'BATCH-2025-010', initialQuantity: 200, currentQuantity: 100, unitCost: 4.50, status: 'available', expiryDate: daysFromNow(365) },
  ]

  const batchMap: Record<string, string> = {}
  for (const batch of batches) {
    const created = await prisma.inventoryBatch.create({
      data: {
        batchNumber: batch.batchNumber,
        initialQuantity: batch.initialQuantity,
        currentQuantity: batch.currentQuantity,
        unitCost: batch.unitCost,
        status: batch.status,
        receivedDate: daysAgo(30),
        expiryDate: batch.expiryDate,
        inventoryItemId: inventoryMap[batch.sku],
      },
    })
    batchMap[batch.batchNumber] = created.id
  }
  console.log('  ✓ Created', batches.length, 'inventory batches')

  // =============================================================================
  // 15c. INVENTORY MOVEMENTS
  // =============================================================================
  console.log('\n🔄 Creating Inventory Movements...')
  const movements = [
    { sku: 'HW-LAPTOP-01', type: 'receipt', quantity: 10, previousQuantity: 5, newQuantity: 15, unitCost: 2200, referenceType: 'purchase_order', batchNumber: 'BATCH-2025-001', movementDate: daysAgo(30) },
    { sku: 'HW-LAPTOP-01', type: 'issue', quantity: -3, previousQuantity: 15, newQuantity: 12, unitCost: 2200, referenceType: 'sales_order', movementDate: daysAgo(15) },
    { sku: 'HW-MONITOR-01', type: 'receipt', quantity: 30, previousQuantity: 0, newQuantity: 30, unitCost: 650, referenceType: 'purchase_order', batchNumber: 'BATCH-2024-050', movementDate: daysAgo(60) },
    { sku: 'HW-MONITOR-01', type: 'issue', quantity: -5, previousQuantity: 30, newQuantity: 25, unitCost: 650, referenceType: 'sales_order', movementDate: daysAgo(20) },
    { sku: 'HW-KB-01', type: 'receipt', quantity: 100, previousQuantity: 0, newQuantity: 100, unitCost: 85, referenceType: 'purchase_order', movementDate: daysAgo(90) },
    { sku: 'HW-KB-01', type: 'issue', quantity: -50, previousQuantity: 100, newQuantity: 50, unitCost: 85, referenceType: 'sales_order', movementDate: daysAgo(45) },
    { sku: 'CONS-PAPER-01', type: 'receipt', quantity: 200, previousQuantity: 0, newQuantity: 200, unitCost: 4.50, referenceType: 'purchase_order', batchNumber: 'BATCH-2025-010', movementDate: daysAgo(30) },
    { sku: 'CONS-PAPER-01', type: 'issue', quantity: -100, previousQuantity: 200, newQuantity: 100, unitCost: 4.50, referenceType: 'internal_use', movementDate: daysAgo(10) },
    { sku: 'HW-LAPTOP-02', type: 'adjustment', quantity: -2, previousQuantity: 5, newQuantity: 3, unitCost: 1800, reason: 'Inventory count adjustment', movementDate: daysAgo(5) },
  ]

  for (const mov of movements) {
    await prisma.inventoryMovement.create({
      data: {
        type: mov.type,
        quantity: Math.abs(mov.quantity),
        previousQuantity: mov.previousQuantity,
        newQuantity: mov.newQuantity,
        unitCost: mov.unitCost,
        totalCost: Math.abs(mov.quantity) * mov.unitCost,
        referenceType: mov.referenceType,
        reason: mov.reason,
        movementDate: mov.movementDate,
        batchId: mov.batchNumber ? batchMap[mov.batchNumber] : null,
        inventoryItemId: inventoryMap[mov.sku],
      },
    })
  }
  console.log('  ✓ Created', movements.length, 'inventory movements')

  // =============================================================================
  // 16. RECEIVABLES
  // =============================================================================
  console.log('\n💵 Creating Receivables...')
  const receivables = [
    { originType: 'invoice', originReferenceId: 'INV-2025-002', debtorName: 'TechStart GmbH', debtorEmail: 'finance@techstart.de', originalAmount: 17232, outstandingAmount: 17232, paidAmount: 0, issueDate: daysAgo(5), dueDate: daysFromNow(10), status: 'open', riskLevel: 'low', reference: 'Consulting Services January' },
    { originType: 'invoice', originReferenceId: 'INV-2024-089', debtorName: 'SlowPay Ltd', debtorEmail: 'accounts@slowpay.co.uk', originalAmount: 22617, outstandingAmount: 22617, paidAmount: 0, issueDate: daysAgo(50), dueDate: daysAgo(20), status: 'overdue', riskLevel: 'high', daysOutstanding: 20, agingBucket: '1-30', reference: 'Development Services Q4', collectionStage: 'reminder_1' },
    { originType: 'invoice', originReferenceId: 'INV-2024-075', debtorName: 'LateClient AG', debtorEmail: 'ap@lateclient.ch', originalAmount: 35000, outstandingAmount: 15000, paidAmount: 20000, issueDate: daysAgo(90), dueDate: daysAgo(60), status: 'partially_paid', riskLevel: 'medium', daysOutstanding: 60, agingBucket: '61-90', reference: 'Annual License' },
    { originType: 'contract', originReferenceId: 'CONTRACT-2024-022', debtorName: 'BigCorp International', debtorEmail: 'payables@bigcorp.com', originalAmount: 85000, outstandingAmount: 0, paidAmount: 85000, issueDate: daysAgo(60), dueDate: daysAgo(30), status: 'paid', riskLevel: 'low', reference: 'Q4 Project Milestone' },
  ]

  const receivableMap: Record<string, string> = {}
  for (const rec of receivables) {
    const created = await prisma.receivable.create({
      data: {
        originType: rec.originType,
        originReferenceId: rec.originReferenceId,
        debtorName: rec.debtorName,
        debtorEmail: rec.debtorEmail,
        currency: 'EUR',
        originalAmount: rec.originalAmount,
        outstandingAmount: rec.outstandingAmount,
        paidAmount: rec.paidAmount,
        issueDate: rec.issueDate,
        dueDate: rec.dueDate,
        lastActivityDate: new Date(),
        status: rec.status,
        riskLevel: rec.riskLevel,
        daysOutstanding: rec.daysOutstanding || 0,
        agingBucket: rec.agingBucket || 'current',
        reference: rec.reference,
        collectionStage: rec.collectionStage,
        autoRemindersEnabled: true,
        organizationId: org.id,
      },
    })
    receivableMap[rec.originReferenceId] = created.id
  }
  console.log('  ✓ Created', receivables.length, 'receivables')

  // =============================================================================
  // 16b. RECEIVABLE PAYMENTS
  // =============================================================================
  console.log('\n💳 Creating Receivable Payments...')
  const receivablePayments = [
    { receivableRef: 'INV-2024-075', amount: 10000, type: 'payment', appliedAt: daysAgo(45), reference: 'Wire transfer - partial payment' },
    { receivableRef: 'INV-2024-075', amount: 10000, type: 'payment', appliedAt: daysAgo(30), reference: 'Wire transfer - 2nd installment' },
    { receivableRef: 'CONTRACT-2024-022', amount: 42500, type: 'payment', appliedAt: daysAgo(45), reference: 'Milestone 1 payment' },
    { receivableRef: 'CONTRACT-2024-022', amount: 42500, type: 'payment', appliedAt: daysAgo(30), reference: 'Milestone 2 payment - final' },
  ]

  for (const pmt of receivablePayments) {
    await prisma.receivablePayment.create({
      data: {
        amount: pmt.amount,
        type: pmt.type,
        reference: pmt.reference,
        appliedAt: pmt.appliedAt,
        appliedBy: user.id,
        receivableId: receivableMap[pmt.receivableRef],
      },
    })
  }
  console.log('  ✓ Created', receivablePayments.length, 'receivable payments')

  // =============================================================================
  // 16c. RECEIVABLE EVENTS
  // =============================================================================
  console.log('\n📋 Creating Receivable Events...')
  const receivableEvents = [
    { receivableRef: 'INV-2025-002', type: 'receivable_created', description: 'Invoice sent to TechStart GmbH', performedBy: user.id, createdAt: daysAgo(5) },
    { receivableRef: 'INV-2024-089', type: 'receivable_created', description: 'Invoice sent to SlowPay Ltd', performedBy: user.id, createdAt: daysAgo(50) },
    { receivableRef: 'INV-2024-089', type: 'reminder_sent', description: 'First payment reminder sent', performedBy: user.id, createdAt: daysAgo(15) },
    { receivableRef: 'INV-2024-089', type: 'status_changed', description: 'Status changed to overdue', previousValue: 'due', newValue: 'overdue', createdAt: daysAgo(10) },
    { receivableRef: 'INV-2024-075', type: 'receivable_created', description: 'Invoice sent to LateClient AG', performedBy: user.id, createdAt: daysAgo(90) },
    { receivableRef: 'INV-2024-075', type: 'partial_payment_applied', description: 'Payment of €10,000 applied', amount: 10000, createdAt: daysAgo(45) },
    { receivableRef: 'INV-2024-075', type: 'partial_payment_applied', description: 'Payment of €10,000 applied', amount: 10000, createdAt: daysAgo(30) },
    { receivableRef: 'CONTRACT-2024-022', type: 'receivable_created', description: 'Contract receivable created', performedBy: user.id, createdAt: daysAgo(60) },
    { receivableRef: 'CONTRACT-2024-022', type: 'payment_applied', description: 'Full payment received', amount: 85000, createdAt: daysAgo(30) },
    { receivableRef: 'CONTRACT-2024-022', type: 'status_changed', description: 'Status changed to paid', previousValue: 'open', newValue: 'paid', createdAt: daysAgo(30) },
  ]

  for (const evt of receivableEvents) {
    await prisma.receivableEvent.create({
      data: {
        type: evt.type,
        description: evt.description,
        previousValue: evt.previousValue,
        newValue: evt.newValue,
        amount: evt.amount,
        performedBy: evt.performedBy,
        receivableId: receivableMap[evt.receivableRef],
        createdAt: evt.createdAt,
      },
    })
  }
  console.log('  ✓ Created', receivableEvents.length, 'receivable events')

  // =============================================================================
  // 17. TREASURY ACCOUNTS
  // =============================================================================
  console.log('\n🏦 Creating Treasury Accounts...')
  const treasuryAccounts = [
    { name: 'Operating Account EUR', type: 'operating', bankName: 'UBS AG', iban: 'CH93 0076 2011 6238 5295 7', cashClassification: 'unrestricted', currentBalance: 125000, isMainAccount: true },
    { name: 'Operating Account CHF', type: 'operating', bankName: 'Credit Suisse', iban: 'CH56 0483 5012 3456 7100 0', cashClassification: 'unrestricted', currentBalance: 45000 },
    { name: 'Savings Reserve', type: 'reserve', bankName: 'UBS AG', iban: 'CH12 0076 2011 6238 5295 8', cashClassification: 'reserved', currentBalance: 75000 },
    { name: 'Tax Reserve Account', type: 'restricted', bankName: 'UBS AG', iban: 'CH34 0076 2011 6238 5295 9', cashClassification: 'restricted', currentBalance: 35000, minimumBalance: 30000 },
    { name: 'Investment Account', type: 'investment', bankName: 'Julius Baer', iban: 'CH78 0851 8012 3456 7890 0', cashClassification: 'committed', currentBalance: 50000 },
  ]

  const treasuryAccountMap: Record<string, string> = {}
  for (const acc of treasuryAccounts) {
    const created = await prisma.treasuryAccount.create({
      data: {
        name: acc.name,
        type: acc.type,
        bankName: acc.bankName,
        iban: acc.iban,
        cashClassification: acc.cashClassification,
        currency: acc.name.includes('CHF') ? 'CHF' : 'EUR',
        currentBalance: acc.currentBalance,
        availableBalance: acc.currentBalance,
        minimumBalance: acc.minimumBalance,
        isMainAccount: acc.isMainAccount || false,
        status: 'active',
        organizationId: org.id,
      },
    })
    treasuryAccountMap[acc.name] = created.id
  }
  console.log('  ✓ Created', treasuryAccounts.length, 'treasury accounts')

  // =============================================================================
  // 17b. TREASURY CASH MOVEMENTS
  // =============================================================================
  console.log('\n💸 Creating Treasury Cash Movements...')
  const cashMovements = [
    { accountName: 'Operating Account EUR', type: 'inflow', category: 'operating', amount: 25000, description: 'Client payment - Acme Corp', counterparty: 'Acme Corp', movementDate: daysAgo(2), balanceBefore: 100000, balanceAfter: 125000 },
    { accountName: 'Operating Account EUR', type: 'outflow', category: 'operating', amount: 4500, description: 'Office rent payment', counterparty: 'Swiss Property AG', movementDate: daysAgo(5), balanceBefore: 104500, balanceAfter: 100000 },
    { accountName: 'Operating Account EUR', type: 'outflow', category: 'operating', amount: 3240.50, description: 'AWS infrastructure', counterparty: 'Amazon Web Services', movementDate: daysAgo(7), balanceBefore: 107740.50, balanceAfter: 104500 },
    { accountName: 'Operating Account EUR', type: 'transfer_out', category: 'financing', amount: 20000, description: 'Transfer to savings', counterparty: 'Internal', movementDate: daysAgo(10), balanceBefore: 127740.50, balanceAfter: 107740.50 },
    { accountName: 'Savings Reserve', type: 'transfer_in', category: 'financing', amount: 20000, description: 'Transfer from operating', counterparty: 'Internal', movementDate: daysAgo(10), balanceBefore: 55000, balanceAfter: 75000 },
    { accountName: 'Tax Reserve Account', type: 'transfer_in', category: 'financing', amount: 5000, description: 'Monthly tax provision', counterparty: 'Internal', movementDate: daysAgo(15), balanceBefore: 30000, balanceAfter: 35000 },
    { accountName: 'Investment Account', type: 'interest', category: 'investing', amount: 250, description: 'Monthly interest earned', counterparty: 'Julius Baer', movementDate: daysAgo(1), balanceBefore: 49750, balanceAfter: 50000 },
  ]

  for (const mov of cashMovements) {
    await prisma.treasuryCashMovement.create({
      data: {
        type: mov.type,
        category: mov.category,
        amount: mov.amount,
        currency: 'EUR',
        description: mov.description,
        counterparty: mov.counterparty,
        movementDate: mov.movementDate,
        balanceBefore: mov.balanceBefore,
        balanceAfter: mov.balanceAfter,
        status: 'completed',
        accountId: treasuryAccountMap[mov.accountName],
      },
    })
  }
  console.log('  ✓ Created', cashMovements.length, 'treasury cash movements')

  // =============================================================================
  // 18. CAPITAL BUCKETS
  // =============================================================================
  console.log('\n🪣 Creating Capital Buckets...')
  const buckets = [
    { name: 'Operating Expenses', type: 'operating', targetAmount: 150000, currentAmount: 125000, priority: 1, isRequired: true },
    { name: 'Payroll Reserve', type: 'payroll', targetAmount: 90000, currentAmount: 90000, priority: 1, isRequired: true },
    { name: 'Tax Reserve', type: 'tax_reserve', targetAmount: 50000, currentAmount: 35000, priority: 2, isRequired: true },
    { name: 'Debt Service', type: 'debt_service', targetAmount: 35000, currentAmount: 35000, priority: 2, isRequired: true },
    { name: 'CapEx Fund', type: 'capex', targetAmount: 100000, currentAmount: 50000, priority: 3 },
    { name: 'Emergency Fund', type: 'emergency', targetAmount: 75000, currentAmount: 45000, priority: 2, isRequired: true },
    { name: 'Growth Investment', type: 'growth', targetAmount: 200000, currentAmount: 25000, priority: 4, timeHorizon: 'long_term' },
  ]

  for (const bucket of buckets) {
    const fundingPercent = (bucket.currentAmount / bucket.targetAmount) * 100
    let fundingStatus = 'underfunded'
    if (fundingPercent >= 100) fundingStatus = 'overfunded'
    else if (fundingPercent >= 95) fundingStatus = 'funded'
    
    await prisma.capitalBucket.create({
      data: {
        name: bucket.name,
        type: bucket.type,
        currency: 'EUR',
        targetAmount: bucket.targetAmount,
        currentAmount: bucket.currentAmount,
        fundingStatus,
        fundingPercent,
        priority: bucket.priority,
        isRequired: bucket.isRequired || false,
        timeHorizon: bucket.timeHorizon,
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', buckets.length, 'capital buckets')

  // =============================================================================
  // 19. CREDIT FACILITIES
  // =============================================================================
  console.log('\n🏛️ Creating Credit Facilities...')
  const facilities = [
    { name: 'Revolving Credit Facility', type: 'revolving', lenderName: 'UBS AG', facilityLimit: 200000, drawnAmount: 25000, interestRate: 4.5, interestType: 'variable', startDate: '2024-01-01', maturityDate: '2026-12-31', commitmentFeeBps: 25 },
    { name: 'Term Loan Facility', type: 'term', lenderName: 'Credit Suisse', facilityLimit: 150000, drawnAmount: 120000, interestRate: 3.5, interestType: 'fixed', startDate: '2023-06-01', maturityDate: '2028-06-01' },
    { name: 'Overdraft Facility', type: 'overdraft', lenderName: 'UBS AG', facilityLimit: 50000, drawnAmount: 0, interestRate: 8.5, interestType: 'variable', startDate: '2024-01-01', maturityDate: '2025-12-31' },
  ]

  const facilityMap: Record<string, string> = {}
  for (const fac of facilities) {
    const available = fac.facilityLimit - fac.drawnAmount
    const utilization = (fac.drawnAmount / fac.facilityLimit) * 100
    
    const created = await prisma.creditFacility.create({
      data: {
        name: fac.name,
        type: fac.type,
        status: 'active',
        lenderName: fac.lenderName,
        currency: 'EUR',
        facilityLimit: fac.facilityLimit,
        drawnAmount: fac.drawnAmount,
        availableAmount: available,
        utilizationRate: utilization,
        interestRate: fac.interestRate,
        interestType: fac.interestType,
        commitmentFeeBps: fac.commitmentFeeBps,
        startDate: new Date(fac.startDate),
        maturityDate: new Date(fac.maturityDate),
        organizationId: org.id,
      },
    })
    facilityMap[fac.name] = created.id
  }
  console.log('  ✓ Created', facilities.length, 'credit facilities')

  // =============================================================================
  // 19b. FACILITY DRAWDOWNS
  // =============================================================================
  console.log('\n📤 Creating Facility Drawdowns...')
  const drawdowns = [
    { facilityName: 'Revolving Credit Facility', amount: 25000, drawdownDate: daysAgo(30), outstandingAmount: 25000, status: 'active', purpose: 'Working capital' },
    { facilityName: 'Term Loan Facility', amount: 150000, drawdownDate: new Date('2023-06-01'), repaidAmount: 30000, outstandingAmount: 120000, status: 'active', purpose: 'Business expansion' },
  ]

  for (const dd of drawdowns) {
    await prisma.facilityDrawdown.create({
      data: {
        amount: dd.amount,
        drawdownDate: dd.drawdownDate,
        repaidAmount: dd.repaidAmount || 0,
        outstandingAmount: dd.outstandingAmount,
        status: dd.status,
        purpose: dd.purpose,
        facilityId: facilityMap[dd.facilityName],
      },
    })
  }
  console.log('  ✓ Created', drawdowns.length, 'facility drawdowns')

  // =============================================================================
  // 20. TREASURY DECISIONS
  // =============================================================================
  console.log('\n📋 Creating Treasury Decisions...')
  const decisions = [
    { type: 'rebalance', title: 'Monthly Cash Rebalancing', description: 'Transfer excess operating cash to savings reserve', amount: 25000, priority: 'normal', status: 'pending' },
    { type: 'reserve_allocation', title: 'Tax Reserve Top-up', description: 'Increase tax reserve to meet Q1 obligations', amount: 15000, priority: 'high', status: 'pending' },
    { type: 'drawdown', title: 'Credit Line Drawdown', description: 'Draw from revolving facility for equipment purchase', amount: 30000, priority: 'normal', status: 'approved' },
  ]

  for (const dec of decisions) {
    await prisma.treasuryDecision.create({
      data: {
        type: dec.type,
        title: dec.title,
        description: dec.description,
        currency: 'EUR',
        amount: dec.amount,
        priority: dec.priority,
        status: dec.status,
        requiresApproval: true,
        executionMode: 'manual',
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', decisions.length, 'treasury decisions')

  // =============================================================================
  // 21. TREASURY SCENARIOS
  // =============================================================================
  console.log('\n📊 Creating Treasury Scenarios...')
  const treasuryScenarios = [
    { name: 'Baseline Forecast', type: 'baseline', isBaseline: true, horizonDays: 90, assumptions: { revenueGrowth: 0.05, expenseGrowth: 0.03, collectionDays: 30 }, minimumCashAmount: 85000, endingCashAmount: 145000 },
    { name: 'Optimistic Scenario', type: 'best_case', horizonDays: 90, assumptions: { revenueGrowth: 0.15, expenseGrowth: 0.02, collectionDays: 25 }, minimumCashAmount: 95000, endingCashAmount: 185000, probabilityWeight: 20 },
    { name: 'Pessimistic Scenario', type: 'worst_case', horizonDays: 90, assumptions: { revenueGrowth: -0.10, expenseGrowth: 0.05, collectionDays: 45 }, minimumCashAmount: 45000, endingCashAmount: 75000, probabilityWeight: 15 },
    { name: 'Major Client Loss', type: 'stress_test', horizonDays: 90, assumptions: { revenueGrowth: -0.25, expenseGrowth: 0, collectionDays: 60, clientChurn: 0.20 }, minimumCashAmount: 25000, endingCashAmount: 40000, riskScore: 85 },
  ]

  const today = new Date()
  for (const scen of treasuryScenarios) {
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + scen.horizonDays)
    
    await prisma.treasuryScenario.create({
      data: {
        name: scen.name,
        type: scen.type,
        isBaseline: scen.isBaseline || false,
        isActive: true,
        horizonDays: scen.horizonDays,
        startDate: today,
        endDate,
        assumptions: scen.assumptions,
        minimumCashAmount: scen.minimumCashAmount,
        endingCashAmount: scen.endingCashAmount,
        probabilityWeight: scen.probabilityWeight,
        riskScore: scen.riskScore,
        createdBy: user.id,
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', treasuryScenarios.length, 'treasury scenarios')

  // =============================================================================
  // 22. NETTING OPPORTUNITIES
  // =============================================================================
  console.log('\n🔄 Creating Netting Opportunities...')
  const netting = [
    { entityAName: 'Demo Company GmbH', entityBName: 'Demo Tech AG', amountAToB: 15000, amountBToA: 8500, netAmount: 6500, netDirection: 'a_to_b' },
    { entityAName: 'Demo Company GmbH', entityBName: 'Demo Services LLC', amountAToB: 22000, amountBToA: 18000, netAmount: 4000, netDirection: 'a_to_b' },
  ]

  for (const n of netting) {
    const grossAmount = n.amountAToB + n.amountBToA
    const savingsAmount = grossAmount - n.netAmount
    const savingsPercent = (savingsAmount / grossAmount) * 100
    
    await prisma.nettingOpportunity.create({
      data: {
        entityAId: entityMap[n.entityAName] || 'entity-a',
        entityAName: n.entityAName,
        entityBId: entityMap[n.entityBName] || 'entity-b',
        entityBName: n.entityBName,
        currency: 'EUR',
        amountAToB: n.amountAToB,
        amountBToA: n.amountBToA,
        netAmount: n.netAmount,
        netDirection: n.netDirection,
        grossAmount,
        savingsAmount,
        savingsPercent,
        status: 'identified',
        validUntil: daysFromNow(30),
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', netting.length, 'netting opportunities')

  // =============================================================================
  // 22b. NETTING AGREEMENTS, SESSIONS & OFFSETS
  // =============================================================================
  console.log('\n📋 Creating Netting Agreements, Sessions & Offsets...')

  // Netting Agreement
  const nettingAgreement = await prisma.nettingAgreement.create({
    data: {
      agreementNumber: 'NET-AGR-001',
      name: 'Demo Intercompany Netting',
      type: 'intercompany',
      status: 'active',
      nettingFrequency: 'monthly',
      settlementDays: 5,
      baseCurrency: 'EUR',
      minimumNettingAmount: 1000,
      effectiveDate: daysAgo(180),
      nextNettingDate: daysFromNow(7),
      organizationId: org.id,
    },
  })

  // Netting Sessions
  const nettingSessions = [
    {
      sessionNumber: 'NET-2024-001',
      type: 'intercompany',
      status: 'settled',
      periodStart: daysAgo(60),
      periodEnd: daysAgo(30),
      nettingDate: daysAgo(25),
      settlementDate: daysAgo(20),
      totalReceivables: 45000,
      totalPayables: 32000,
      grossAmount: 77000,
      netAmount: 13000,
      savingsAmount: 64000,
      savingsPercentage: 83.12,
    },
    {
      sessionNumber: 'NET-2024-002',
      type: 'intercompany',
      status: 'approved',
      periodStart: daysAgo(30),
      periodEnd: new Date(),
      nettingDate: daysFromNow(5),
      settlementDate: daysFromNow(10),
      totalReceivables: 52000,
      totalPayables: 38000,
      grossAmount: 90000,
      netAmount: 14000,
      savingsAmount: 76000,
      savingsPercentage: 84.44,
    },
    {
      sessionNumber: 'NET-2024-003',
      type: 'counterparty',
      status: 'draft',
      periodStart: new Date(),
      periodEnd: daysFromNow(30),
      nettingDate: daysFromNow(35),
      settlementDate: daysFromNow(40),
      totalReceivables: 28000,
      totalPayables: 22000,
      grossAmount: 50000,
      netAmount: 6000,
      savingsAmount: 44000,
      savingsPercentage: 88.00,
    },
  ]

  for (const session of nettingSessions) {
    await prisma.nettingSession.create({
      data: {
        ...session,
        baseCurrency: 'EUR',
        agreementId: nettingAgreement.id,
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', nettingSessions.length, 'netting sessions')

  // Offset Entries
  const offsetsData = [
    {
      offsetNumber: 'OFF-2024-001',
      type: 'ar_ap',
      status: 'applied',
      partyId: 'cust-demo-1',
      partyName: 'Demo Tech AG',
      partyType: 'customer',
      sourceDocumentType: 'credit_note',
      sourceDocumentNumber: 'CN-2024-045',
      sourceAmount: 5000,
      targetDocumentType: 'invoice',
      targetDocumentNumber: 'INV-2024-312',
      targetAmount: 8500,
      offsetAmount: 5000,
      offsetDate: daysAgo(15),
      effectiveDate: daysAgo(14),
    },
    {
      offsetNumber: 'OFF-2024-002',
      type: 'intercompany',
      status: 'approved',
      partyId: 'subsidiary-1',
      partyName: 'Demo Services LLC',
      partyType: 'subsidiary',
      sourceDocumentType: 'intercompany_receivable',
      sourceDocumentNumber: 'IC-REC-2024-089',
      sourceAmount: 12000,
      targetDocumentType: 'intercompany_payable',
      targetDocumentNumber: 'IC-PAY-2024-056',
      targetAmount: 12000,
      offsetAmount: 12000,
      offsetDate: daysAgo(5),
      effectiveDate: daysAgo(3),
    },
    {
      offsetNumber: 'OFF-2024-003',
      type: 'advance',
      status: 'pending',
      partyId: 'cust-demo-2',
      partyName: 'Alpha Corp',
      partyType: 'customer',
      sourceDocumentType: 'advance_payment',
      sourceDocumentNumber: 'ADV-2024-018',
      sourceAmount: 25000,
      targetDocumentType: 'invoice',
      targetDocumentNumber: 'INV-2024-445',
      targetAmount: 32000,
      offsetAmount: 25000,
      offsetDate: new Date(),
      effectiveDate: daysFromNow(2),
    },
  ]

  for (const offset of offsetsData) {
    await prisma.offsetEntry.create({
      data: {
        ...offset,
        currency: 'EUR',
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', offsetsData.length, 'offset entries')

  // =============================================================================
  // 23. ASSETS
  // =============================================================================
  console.log('\n🏗️ Creating Assets...')
  const assets = [
    { assetNumber: 'AST-001', name: 'Office Building - Zurich', category: 'property_plant_equipment', assetClass: 'buildings', acquisitionDate: '2020-01-15', acquisitionCost: 850000, residualValue: 100000, usefulLifeMonths: 480, depreciationMethod: 'straight_line', locationName: 'Zurich HQ', accumulatedDepreciation: 93750 },
    { assetNumber: 'AST-002', name: 'Company Vehicle - Tesla Model 3', category: 'property_plant_equipment', assetClass: 'vehicles', acquisitionDate: '2023-06-01', acquisitionCost: 52000, residualValue: 15000, usefulLifeMonths: 60, depreciationMethod: 'straight_line', locationName: 'Zurich HQ', serialNumber: '5YJ3E1EA1PF123456', accumulatedDepreciation: 11100 },
    { assetNumber: 'AST-003', name: 'Server Infrastructure', category: 'property_plant_equipment', assetClass: 'equipment', acquisitionDate: '2024-01-15', acquisitionCost: 45000, residualValue: 5000, usefulLifeMonths: 48, depreciationMethod: 'straight_line', locationName: 'Data Center', accumulatedDepreciation: 10000 },
    { assetNumber: 'AST-004', name: 'Office Furniture Set', category: 'property_plant_equipment', assetClass: 'furniture', acquisitionDate: '2022-03-01', acquisitionCost: 35000, residualValue: 2000, usefulLifeMonths: 84, depreciationMethod: 'straight_line', locationName: 'Zurich HQ', accumulatedDepreciation: 13571 },
    { assetNumber: 'AST-005', name: 'Software Platform - PrimeBalance', category: 'intangible', assetClass: 'software', acquisitionDate: '2021-06-01', acquisitionCost: 250000, residualValue: 0, usefulLifeMonths: 60, depreciationMethod: 'straight_line', accumulatedDepreciation: 175000 },
    { assetNumber: 'AST-006', name: 'Patent - Data Processing Method', category: 'intangible', assetClass: 'patents', acquisitionDate: '2022-01-01', acquisitionCost: 75000, residualValue: 0, usefulLifeMonths: 180, depreciationMethod: 'straight_line', accumulatedDepreciation: 15000 },
    { assetNumber: 'AST-007', name: 'MacBook Pro Fleet (10 units)', category: 'property_plant_equipment', assetClass: 'equipment', acquisitionDate: '2024-06-01', acquisitionCost: 28000, residualValue: 4000, usefulLifeMonths: 36, depreciationMethod: 'straight_line', locationName: 'Zurich HQ', quantity: 10, accumulatedDepreciation: 4667 },
    { assetNumber: 'AST-008', name: 'Old Printer (Disposed)', category: 'property_plant_equipment', assetClass: 'equipment', acquisitionDate: '2019-01-01', acquisitionCost: 5000, residualValue: 0, usefulLifeMonths: 60, depreciationMethod: 'straight_line', locationName: 'Zurich HQ', accumulatedDepreciation: 5000, status: 'disposed' },
  ]

  const assetMap: Record<string, string> = {}
  for (const asset of assets) {
    const currentBookValue = asset.acquisitionCost - asset.accumulatedDepreciation
    const depreciableAmount = asset.acquisitionCost - asset.residualValue
    const monthlyDep = depreciableAmount / asset.usefulLifeMonths
    
    const status = asset.status || (currentBookValue <= asset.residualValue ? 'fully_depreciated' : 'active')
    
    const created = await prisma.asset.create({
      data: {
        assetNumber: asset.assetNumber,
        name: asset.name,
        category: asset.category,
        assetClass: asset.assetClass,
        status,
        acquisitionDate: new Date(asset.acquisitionDate),
        acquisitionType: 'purchase',
        acquisitionCost: asset.acquisitionCost,
        currency: 'EUR',
        currentBookValue,
        residualValue: asset.residualValue,
        isDepreciable: true,
        depreciationMethod: asset.depreciationMethod,
        usefulLifeMonths: asset.usefulLifeMonths,
        accumulatedDepreciation: asset.accumulatedDepreciation,
        depreciationStartDate: new Date(asset.acquisitionDate),
        monthlyDepreciation: monthlyDep,
        locationName: asset.locationName,
        entityName: 'Demo Company GmbH',
        quantity: asset.quantity || 1,
        serialNumber: asset.serialNumber,
        organizationId: org.id,
      },
    })
    assetMap[asset.assetNumber] = created.id
  }
  console.log('  ✓ Created', assets.length, 'assets')

  // =============================================================================
  // 23b. ASSET DEPRECIATION ENTRIES
  // =============================================================================
  console.log('\n📉 Creating Asset Depreciation Entries...')
  const depreciationEntries = [
    // Tesla Model 3 - monthly depreciation entries for 2024
    { assetNumber: 'AST-002', periodStart: '2024-07-01', periodEnd: '2024-07-31', fiscalYear: 2024, fiscalPeriod: 'M07', depreciationAmount: 617, openingBookValue: 45283, closingBookValue: 44667 },
    { assetNumber: 'AST-002', periodStart: '2024-08-01', periodEnd: '2024-08-31', fiscalYear: 2024, fiscalPeriod: 'M08', depreciationAmount: 617, openingBookValue: 44667, closingBookValue: 44050 },
    { assetNumber: 'AST-002', periodStart: '2024-09-01', periodEnd: '2024-09-30', fiscalYear: 2024, fiscalPeriod: 'M09', depreciationAmount: 617, openingBookValue: 44050, closingBookValue: 43433 },
    { assetNumber: 'AST-002', periodStart: '2024-10-01', periodEnd: '2024-10-31', fiscalYear: 2024, fiscalPeriod: 'M10', depreciationAmount: 617, openingBookValue: 43433, closingBookValue: 42817 },
    { assetNumber: 'AST-002', periodStart: '2024-11-01', periodEnd: '2024-11-30', fiscalYear: 2024, fiscalPeriod: 'M11', depreciationAmount: 617, openingBookValue: 42817, closingBookValue: 42200 },
    { assetNumber: 'AST-002', periodStart: '2024-12-01', periodEnd: '2024-12-31', fiscalYear: 2024, fiscalPeriod: 'M12', depreciationAmount: 617, openingBookValue: 42200, closingBookValue: 41583 },
    // Server Infrastructure
    { assetNumber: 'AST-003', periodStart: '2024-10-01', periodEnd: '2024-10-31', fiscalYear: 2024, fiscalPeriod: 'M10', depreciationAmount: 833, openingBookValue: 37500, closingBookValue: 36667 },
    { assetNumber: 'AST-003', periodStart: '2024-11-01', periodEnd: '2024-11-30', fiscalYear: 2024, fiscalPeriod: 'M11', depreciationAmount: 833, openingBookValue: 36667, closingBookValue: 35833 },
    { assetNumber: 'AST-003', periodStart: '2024-12-01', periodEnd: '2024-12-31', fiscalYear: 2024, fiscalPeriod: 'M12', depreciationAmount: 833, openingBookValue: 35833, closingBookValue: 35000 },
    // MacBook Fleet
    { assetNumber: 'AST-007', periodStart: '2024-07-01', periodEnd: '2024-07-31', fiscalYear: 2024, fiscalPeriod: 'M07', depreciationAmount: 667, openingBookValue: 28000, closingBookValue: 27333 },
    { assetNumber: 'AST-007', periodStart: '2024-08-01', periodEnd: '2024-08-31', fiscalYear: 2024, fiscalPeriod: 'M08', depreciationAmount: 667, openingBookValue: 27333, closingBookValue: 26667 },
    { assetNumber: 'AST-007', periodStart: '2024-09-01', periodEnd: '2024-09-30', fiscalYear: 2024, fiscalPeriod: 'M09', depreciationAmount: 667, openingBookValue: 26667, closingBookValue: 26000 },
  ]

  for (const dep of depreciationEntries) {
    const accumulatedDep = assets.find(a => a.assetNumber === dep.assetNumber)!.acquisitionCost - dep.closingBookValue
    await prisma.assetDepreciation.create({
      data: {
        periodStart: new Date(dep.periodStart),
        periodEnd: new Date(dep.periodEnd),
        fiscalYear: dep.fiscalYear,
        fiscalPeriod: dep.fiscalPeriod,
        depreciationAmount: dep.depreciationAmount,
        accumulatedDepreciation: accumulatedDep,
        openingBookValue: dep.openingBookValue,
        closingBookValue: dep.closingBookValue,
        method: 'straight_line',
        status: 'posted',
        bookType: 'statutory',
        assetId: assetMap[dep.assetNumber],
      },
    })
  }
  console.log('  ✓ Created', depreciationEntries.length, 'depreciation entries')

  // =============================================================================
  // 23c. ASSET EVENTS
  // =============================================================================
  console.log('\n📋 Creating Asset Events...')
  const assetEvents = [
    { assetNumber: 'AST-001', type: 'acquisition', description: 'Asset acquired via purchase', amount: 850000, eventDate: '2020-01-15' },
    { assetNumber: 'AST-002', type: 'acquisition', description: 'Company vehicle purchased', amount: 52000, eventDate: '2023-06-01' },
    { assetNumber: 'AST-002', type: 'insurance_update', description: 'Insurance policy renewed', eventDate: '2024-06-01' },
    { assetNumber: 'AST-003', type: 'acquisition', description: 'Server infrastructure purchased', amount: 45000, eventDate: '2024-01-15' },
    { assetNumber: 'AST-003', type: 'maintenance', description: 'Scheduled maintenance performed', eventDate: '2024-07-15' },
    { assetNumber: 'AST-005', type: 'acquisition', description: 'Software platform development completed', amount: 250000, eventDate: '2021-06-01' },
    { assetNumber: 'AST-007', type: 'acquisition', description: 'MacBook fleet purchased', amount: 28000, eventDate: '2024-06-01' },
    { assetNumber: 'AST-008', type: 'acquisition', description: 'Printer purchased', amount: 5000, eventDate: '2019-01-01' },
    { assetNumber: 'AST-008', type: 'disposal', description: 'Printer disposed - obsolete', previousValue: 0, newValue: 0, eventDate: '2024-01-15' },
  ]

  for (const evt of assetEvents) {
    await prisma.assetEvent.create({
      data: {
        type: evt.type,
        description: evt.description,
        amount: evt.amount,
        previousValue: evt.previousValue,
        newValue: evt.newValue,
        eventDate: new Date(evt.eventDate),
        performedBy: user.id,
        assetId: assetMap[evt.assetNumber],
      },
    })
  }
  console.log('  ✓ Created', assetEvents.length, 'asset events')

  // =============================================================================
  // 23d. ASSET TRANSFERS
  // =============================================================================
  console.log('\n🔄 Creating Asset Transfers...')
  const assetTransfers = [
    {
      assetNumber: 'AST-003',
      transferDate: daysAgo(60),
      effectiveDate: daysAgo(60),
      transferType: 'location',
      fromLocationName: 'Zurich HQ',
      toLocationName: 'Data Center',
      bookValueAtTransfer: 40000,
      accumulatedDepAtTransfer: 5000,
      status: 'completed',
      reason: 'Server relocation to dedicated data center',
    },
    {
      assetNumber: 'AST-004',
      transferDate: daysAgo(30),
      effectiveDate: daysAgo(30),
      transferType: 'cost_center',
      fromCostCenterName: 'Administration',
      toCostCenterName: 'Engineering',
      bookValueAtTransfer: 21429,
      accumulatedDepAtTransfer: 13571,
      status: 'completed',
      reason: 'Department reorganization',
    },
  ]

  for (const transfer of assetTransfers) {
    await prisma.assetTransfer.create({
      data: {
        transferDate: transfer.transferDate,
        effectiveDate: transfer.effectiveDate,
        transferType: transfer.transferType,
        fromLocationName: transfer.fromLocationName,
        toLocationName: transfer.toLocationName,
        fromCostCenterName: transfer.fromCostCenterName,
        toCostCenterName: transfer.toCostCenterName,
        bookValueAtTransfer: transfer.bookValueAtTransfer,
        accumulatedDepAtTransfer: transfer.accumulatedDepAtTransfer,
        status: transfer.status,
        reason: transfer.reason,
        requestedBy: user.id,
        requestedAt: transfer.transferDate,
        approvedBy: user.id,
        approvedAt: transfer.transferDate,
        assetId: assetMap[transfer.assetNumber],
      },
    })
  }
  console.log('  ✓ Created', assetTransfers.length, 'asset transfers')

  // =============================================================================
  // 23e. ASSET DISPOSAL
  // =============================================================================
  console.log('\n🗑️ Creating Asset Disposal...')
  await prisma.assetDisposal.create({
    data: {
      disposalDate: new Date('2024-01-15'),
      disposalType: 'scrap',
      carryingAmount: 0,
      accumulatedDepreciation: 5000,
      salePrice: 0,
      gainOrLoss: 0,
      isGain: false,
      disposalCosts: 100,
      status: 'completed',
      reason: 'Equipment obsolete and no longer functional',
      approvedBy: user.id,
      approvedAt: new Date('2024-01-15'),
      assetId: assetMap['AST-008'],
      organizationId: org.id,
    },
  })
  console.log('  ✓ Created 1 asset disposal')

  // =============================================================================
  // 24. CAPEX BUDGETS
  // =============================================================================
  console.log('\n📈 Creating CapEx Budgets...')
  const capexBudget = await prisma.capExBudget.create({
    data: {
      name: 'FY2025 Capital Expenditure Budget',
      fiscalYear: '2025',
      description: 'Annual capital expenditure budget for fiscal year 2025',
      currency: 'EUR',
      budgetAmount: 150000,
      committedAmount: 45000,
      spentAmount: 28000,
      remainingAmount: 122000,
      utilizationPercent: 18.67,
      status: 'active',
      organizationId: org.id,
    },
  })

  const capexItems = [
    { description: 'Server Infrastructure Upgrade', category: 'IT', estimatedAmount: 35000, actualAmount: 28000, status: 'spent', classification: 'capex' },
    { description: 'Office Renovation', category: 'Facilities', estimatedAmount: 25000, status: 'approved', classification: 'capex' },
    { description: 'New Development Laptops', category: 'IT', estimatedAmount: 20000, status: 'committed', classification: 'capex' },
    { description: 'Marketing Software Suite', category: 'Software', estimatedAmount: 15000, status: 'planned', classification: 'borderline' },
    { description: 'Electric Vehicle', category: 'Vehicles', estimatedAmount: 55000, status: 'planned', classification: 'capex' },
  ]

  for (const item of capexItems) {
    await prisma.capExItem.create({
      data: {
        description: item.description,
        category: item.category,
        estimatedAmount: item.estimatedAmount,
        actualAmount: item.actualAmount,
        variance: item.actualAmount ? item.actualAmount - item.estimatedAmount : null,
        status: item.status,
        classification: item.classification,
        budgetId: capexBudget.id,
      },
    })
  }
  console.log('  ✓ Created 1 CapEx budget with', capexItems.length, 'items')

  // =============================================================================
  // PROJECTS MODULE - ADD TO: prisma/seed.ts (after other data, before SUMMARY)
  // =============================================================================

  // =============================================================================
  // COST CENTERS
  // =============================================================================
  console.log('\n🏢 Creating Cost Centers...')
  const costCenters = [
    { code: 'CC-EXEC', name: 'Executive', level: 0, annualBudget: 500000, budgetSpent: 125000, isActive: true },
    { code: 'CC-ENG', name: 'Engineering', level: 0, annualBudget: 1200000, budgetSpent: 450000, isActive: true },
    { code: 'CC-ENG-FE', name: 'Frontend Team', level: 1, parentCode: 'CC-ENG', annualBudget: 400000, budgetSpent: 150000, isActive: true },
    { code: 'CC-ENG-BE', name: 'Backend Team', level: 1, parentCode: 'CC-ENG', annualBudget: 450000, budgetSpent: 180000, isActive: true },
    { code: 'CC-ENG-INFRA', name: 'Infrastructure', level: 1, parentCode: 'CC-ENG', annualBudget: 350000, budgetSpent: 120000, isActive: true },
    { code: 'CC-SALES', name: 'Sales & Marketing', level: 0, annualBudget: 800000, budgetSpent: 280000, isActive: true },
    { code: 'CC-OPS', name: 'Operations', level: 0, annualBudget: 300000, budgetSpent: 95000, isActive: true },
    { code: 'CC-FIN', name: 'Finance & Admin', level: 0, annualBudget: 250000, budgetSpent: 85000, isActive: true },
  ]

  const costCenterMap: Record<string, string> = {}
  
  // First pass: create all cost centers
  for (const cc of costCenters) {
    const created = await prisma.costCenter.create({
      data: {
        code: cc.code,
        name: cc.name,
        level: cc.level,
        path: cc.code,
        annualBudget: cc.annualBudget,
        budgetSpent: cc.budgetSpent,
        budgetRemaining: cc.annualBudget - cc.budgetSpent,
        budgetUtilization: (cc.budgetSpent / cc.annualBudget) * 100,
        isActive: cc.isActive,
        allocationMethod: 'direct',
        organizationId: org.id,
      },
    })
    costCenterMap[cc.code] = created.id
  }

  // Second pass: set parent relationships
  for (const cc of costCenters) {
    if (cc.parentCode && costCenterMap[cc.parentCode]) {
      await prisma.costCenter.update({
        where: { id: costCenterMap[cc.code] },
        data: { 
          parentId: costCenterMap[cc.parentCode],
          path: `${cc.parentCode}/${cc.code}`,
        },
      })
    }
  }
  console.log('  ✓ Created', costCenters.length, 'cost centers')

  // =============================================================================
  // PROJECTS
  // =============================================================================
  console.log('\n📊 Creating Projects...')
  const projects = [
    {
      code: 'PRJ-2025-001',
      name: 'Platform Redesign',
      description: 'Complete UI/UX redesign of the main platform',
      type: 'internal',
      status: 'active',
      priority: 'high',
      costCenterCode: 'CC-ENG-FE',
      plannedStartDate: '2025-01-01',
      plannedEndDate: '2025-06-30',
      actualStartDate: '2025-01-08',
      budgetType: 'fixed',
      budgetAmount: 150000,
      budgetSpent: 45000,
      allocatedHours: 2000,
      actualHours: 580,
      percentComplete: 28,
      isBillable: false,
    },
    {
      code: 'PRJ-2025-002',
      name: 'Enterprise API Integration',
      description: 'Build enterprise-grade API integration for TechCorp',
      type: 'client',
      status: 'active',
      priority: 'critical',
      costCenterCode: 'CC-ENG-BE',
      clientName: 'TechCorp Ltd',
      plannedStartDate: '2025-01-15',
      plannedEndDate: '2025-04-15',
      actualStartDate: '2025-01-15',
      budgetType: 'time_materials',
      budgetAmount: 85000,
      budgetSpent: 32000,
      contractValue: 120000,
      billedAmount: 40000,
      collectedAmount: 40000,
      totalRevenue: 40000,
      totalCosts: 32000,
      grossProfit: 8000,
      grossMargin: 20,
      allocatedHours: 800,
      actualHours: 320,
      percentComplete: 40,
      isBillable: true,
      billingRate: 150,
      billingMethod: 'hourly',
    },
    {
      code: 'PRJ-2025-003',
      name: 'AI Features R&D',
      description: 'Research and development for AI-powered features',
      type: 'rd',
      status: 'active',
      priority: 'medium',
      costCenterCode: 'CC-ENG',
      plannedStartDate: '2025-01-01',
      plannedEndDate: '2025-12-31',
      actualStartDate: '2025-01-02',
      budgetType: 'fixed',
      budgetAmount: 200000,
      budgetSpent: 28000,
      allocatedHours: 3000,
      actualHours: 420,
      percentComplete: 14,
      isBillable: false,
    },
    {
      code: 'PRJ-2025-004',
      name: 'Data Center Migration',
      description: 'Migrate infrastructure to new cloud provider',
      type: 'capex',
      status: 'planning',
      priority: 'high',
      costCenterCode: 'CC-ENG-INFRA',
      plannedStartDate: '2025-02-01',
      plannedEndDate: '2025-05-31',
      budgetType: 'milestone',
      budgetAmount: 350000,
      budgetSpent: 0,
      allocatedHours: 1500,
      actualHours: 0,
      percentComplete: 0,
      isBillable: false,
    },
    {
      code: 'PRJ-2024-015',
      name: 'Website Refresh',
      description: 'Marketing website redesign completed in Q4 2024',
      type: 'internal',
      status: 'completed',
      priority: 'medium',
      costCenterCode: 'CC-SALES',
      plannedStartDate: '2024-09-01',
      plannedEndDate: '2024-12-15',
      actualStartDate: '2024-09-05',
      actualEndDate: '2024-12-10',
      budgetType: 'fixed',
      budgetAmount: 45000,
      budgetSpent: 42500,
      allocatedHours: 600,
      actualHours: 575,
      percentComplete: 100,
      isBillable: false,
    },
    {
      code: 'PRJ-2025-005',
      name: 'GlobalTech Implementation',
      description: 'Enterprise implementation for GlobalTech',
      type: 'client',
      status: 'active',
      priority: 'high',
      costCenterCode: 'CC-ENG',
      clientName: 'GlobalTech Inc',
      plannedStartDate: '2025-01-20',
      plannedEndDate: '2025-07-20',
      actualStartDate: '2025-01-22',
      budgetType: 'milestone',
      budgetAmount: 180000,
      budgetSpent: 25000,
      contractValue: 250000,
      billedAmount: 50000,
      collectedAmount: 50000,
      totalRevenue: 50000,
      totalCosts: 25000,
      grossProfit: 25000,
      grossMargin: 50,
      allocatedHours: 1200,
      actualHours: 180,
      percentComplete: 15,
      isBillable: true,
      billingRate: 180,
      billingMethod: 'milestone',
    },
  ]

  const projectMap: Record<string, string> = {}

  for (const proj of projects) {
    const costCenterId = proj.costCenterCode ? costCenterMap[proj.costCenterCode] : null
    const created = await prisma.project.create({
      data: {
        code: proj.code,
        name: proj.name,
        description: proj.description,
        type: proj.type,
        status: proj.status,
        priority: proj.priority,
        costCenterId,
        costCenterCode: proj.costCenterCode,
        clientName: proj.clientName,
        plannedStartDate: new Date(proj.plannedStartDate),
        plannedEndDate: new Date(proj.plannedEndDate),
        actualStartDate: proj.actualStartDate ? new Date(proj.actualStartDate) : null,
        actualEndDate: proj.actualEndDate ? new Date(proj.actualEndDate) : null,
        budgetType: proj.budgetType,
        budgetAmount: proj.budgetAmount,
        budgetSpent: proj.budgetSpent,
        budgetRemaining: proj.budgetAmount - proj.budgetSpent,
        budgetVariance: proj.budgetAmount - proj.budgetSpent,
        budgetUtilization: (proj.budgetSpent / proj.budgetAmount) * 100,
        contractValue: proj.contractValue,
        billedAmount: proj.billedAmount || 0,
        collectedAmount: proj.collectedAmount || 0,
        unbilledAmount: (proj.contractValue || 0) - (proj.billedAmount || 0),
        totalRevenue: proj.totalRevenue || 0,
        totalCosts: proj.totalCosts || proj.budgetSpent,
        grossProfit: proj.grossProfit || 0,
        grossMargin: proj.grossMargin || 0,
        netProfit: proj.grossProfit || 0,
        netMargin: proj.grossMargin || 0,
        allocatedHours: proj.allocatedHours,
        actualHours: proj.actualHours,
        remainingHours: proj.allocatedHours - proj.actualHours,
        percentComplete: proj.percentComplete,
        isBillable: proj.isBillable,
        billingRate: proj.billingRate,
        billingMethod: proj.billingMethod,
        organizationId: org.id,
      },
    })
    projectMap[proj.code] = created.id
  }
  console.log('  ✓ Created', projects.length, 'projects')

  // =============================================================================
  // PROJECT MILESTONES
  // =============================================================================
  console.log('\n🎯 Creating Project Milestones...')
  const milestones = [
    { projectCode: 'PRJ-2025-001', name: 'Design Phase Complete', plannedDate: '2025-02-15', status: 'completed', percentComplete: 100, isBillable: false },
    { projectCode: 'PRJ-2025-001', name: 'Development Sprint 1', plannedDate: '2025-03-15', status: 'in_progress', percentComplete: 45, isBillable: false },
    { projectCode: 'PRJ-2025-001', name: 'Development Sprint 2', plannedDate: '2025-04-30', status: 'pending', percentComplete: 0, isBillable: false },
    { projectCode: 'PRJ-2025-001', name: 'UAT & Launch', plannedDate: '2025-06-15', status: 'pending', percentComplete: 0, isBillable: false },
    { projectCode: 'PRJ-2025-002', name: 'API Spec Finalized', plannedDate: '2025-02-01', status: 'completed', percentComplete: 100, isBillable: true, billingAmount: 15000 },
    { projectCode: 'PRJ-2025-002', name: 'Core Integration Complete', plannedDate: '2025-03-01', status: 'in_progress', percentComplete: 60, isBillable: true, billingAmount: 40000 },
    { projectCode: 'PRJ-2025-002', name: 'Testing & Go-Live', plannedDate: '2025-04-01', status: 'pending', percentComplete: 0, isBillable: true, billingAmount: 65000 },
    { projectCode: 'PRJ-2025-005', name: 'Discovery & Planning', plannedDate: '2025-02-15', status: 'completed', percentComplete: 100, isBillable: true, billingAmount: 50000 },
    { projectCode: 'PRJ-2025-005', name: 'Phase 1 Delivery', plannedDate: '2025-04-15', status: 'pending', percentComplete: 0, isBillable: true, billingAmount: 100000 },
    { projectCode: 'PRJ-2025-005', name: 'Phase 2 & Handover', plannedDate: '2025-07-15', status: 'pending', percentComplete: 0, isBillable: true, billingAmount: 100000 },
  ]

  for (const ms of milestones) {
    await prisma.projectMilestone.create({
      data: {
        name: ms.name,
        plannedDate: new Date(ms.plannedDate),
        status: ms.status,
        percentComplete: ms.percentComplete,
        isBillable: ms.isBillable,
        billingAmount: ms.billingAmount,
        projectId: projectMap[ms.projectCode],
      },
    })
  }
  console.log('  ✓ Created', milestones.length, 'project milestones')

  // Update milestone counts on projects
  for (const proj of projects) {
    const projectMilestones = milestones.filter(m => m.projectCode === proj.code)
    const completedMilestones = projectMilestones.filter(m => m.status === 'completed')
    await prisma.project.update({
      where: { id: projectMap[proj.code] },
      data: {
        milestoneCount: projectMilestones.length,
        milestonesCompleted: completedMilestones.length,
      },
    })
  }

  // =============================================================================
  // TIME ENTRIES
  // =============================================================================
  console.log('\n⏱️  Creating Time Entries...')
  const timeEntries = [
    { projectCode: 'PRJ-2025-001', costCenterCode: 'CC-ENG-FE', userId: user.id, userName: user.name, date: daysAgo(1), hours: 8, description: 'Component library development', category: 'Development', isBillable: false, status: 'approved' },
    { projectCode: 'PRJ-2025-001', costCenterCode: 'CC-ENG-FE', userId: user.id, userName: user.name, date: daysAgo(2), hours: 6.5, description: 'Design system implementation', category: 'Development', isBillable: false, status: 'approved' },
    { projectCode: 'PRJ-2025-001', costCenterCode: 'CC-ENG-FE', userId: user.id, userName: user.name, date: daysAgo(3), hours: 7, description: 'Code review and testing', category: 'Review', isBillable: false, status: 'approved' },
    { projectCode: 'PRJ-2025-002', costCenterCode: 'CC-ENG-BE', userId: user.id, userName: user.name, date: daysAgo(1), hours: 4, description: 'API endpoint development', category: 'Development', isBillable: true, hourlyRate: 150, status: 'approved' },
    { projectCode: 'PRJ-2025-002', costCenterCode: 'CC-ENG-BE', userId: user.id, userName: user.name, date: daysAgo(2), hours: 5, description: 'Integration testing', category: 'Testing', isBillable: true, hourlyRate: 150, status: 'submitted' },
    { projectCode: 'PRJ-2025-002', costCenterCode: 'CC-ENG-BE', userId: user.id, userName: user.name, date: daysAgo(4), hours: 6, description: 'Client workshop - API design', category: 'Meeting', isBillable: true, hourlyRate: 150, status: 'approved' },
    { projectCode: 'PRJ-2025-003', costCenterCode: 'CC-ENG', userId: user.id, userName: user.name, date: daysAgo(5), hours: 8, description: 'ML model research', category: 'Research', isBillable: false, status: 'approved' },
    { projectCode: 'PRJ-2025-003', costCenterCode: 'CC-ENG', userId: user.id, userName: user.name, date: daysAgo(6), hours: 4, description: 'Prototype development', category: 'Development', isBillable: false, status: 'draft' },
    { projectCode: 'PRJ-2025-005', costCenterCode: 'CC-ENG', userId: user.id, userName: user.name, date: daysAgo(2), hours: 3, description: 'Requirements gathering call', category: 'Meeting', isBillable: true, hourlyRate: 180, status: 'approved' },
    { projectCode: 'PRJ-2025-005', costCenterCode: 'CC-ENG', userId: user.id, userName: user.name, date: daysAgo(3), hours: 6, description: 'Architecture planning', category: 'Planning', isBillable: true, hourlyRate: 180, status: 'submitted' },
  ]

  for (const te of timeEntries) {
    const billableAmount = te.isBillable && te.hourlyRate ? te.hours * te.hourlyRate : null
    await prisma.timeEntry.create({
      data: {
        userId: te.userId,
        userName: te.userName,
        projectId: projectMap[te.projectCode],
        projectCode: te.projectCode,
        costCenterId: costCenterMap[te.costCenterCode],
        date: te.date,
        hours: te.hours,
        description: te.description,
        category: te.category,
        isBillable: te.isBillable,
        hourlyRate: te.hourlyRate,
        billableAmount,
        status: te.status,
        approvedBy: te.status === 'approved' ? user.id : null,
        approvedAt: te.status === 'approved' ? new Date() : null,
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', timeEntries.length, 'time entries')

  // =============================================================================
  // INTERNAL CHARGEBACKS
  // =============================================================================
  console.log('\n🔄 Creating Internal Chargebacks...')
  const chargebacks = [
    {
      chargebackNumber: 'CB-2025-001',
      fromCostCenterCode: 'CC-ENG-FE',
      toCostCenterCode: 'CC-SALES',
      projectCode: 'PRJ-2024-015',
      date: daysAgo(30),
      description: 'Website redesign development hours',
      category: 'Labor',
      amount: 18500,
      periodStart: '2024-11-01',
      periodEnd: '2024-12-15',
      status: 'approved',
    },
    {
      chargebackNumber: 'CB-2025-002',
      fromCostCenterCode: 'CC-ENG-INFRA',
      toCostCenterCode: 'CC-ENG-BE',
      date: daysAgo(15),
      description: 'Cloud infrastructure allocation - January',
      category: 'Infrastructure',
      amount: 4500,
      allocationMethod: 'percentage',
      allocationBasis: 'Resource usage 30%',
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      status: 'approved',
    },
    {
      chargebackNumber: 'CB-2025-003',
      fromCostCenterCode: 'CC-OPS',
      toCostCenterCode: 'CC-ENG',
      date: daysAgo(10),
      description: 'Shared services allocation - Q1',
      category: 'Overhead',
      amount: 8200,
      allocationMethod: 'headcount',
      allocationBasis: '12 FTEs in Engineering',
      periodStart: '2025-01-01',
      periodEnd: '2025-03-31',
      status: 'pending',
    },
    {
      chargebackNumber: 'CB-2025-004',
      fromCostCenterCode: 'CC-ENG-BE',
      toCostCenterCode: 'CC-ENG-FE',
      projectCode: 'PRJ-2025-001',
      date: daysAgo(5),
      description: 'API development support for Platform Redesign',
      category: 'Labor',
      amount: 6000,
      quantity: 40,
      unitRate: 150,
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      status: 'pending',
    },
  ]

  for (const cb of chargebacks) {
    await prisma.internalChargeback.create({
      data: {
        chargebackNumber: cb.chargebackNumber,
        fromCostCenterId: costCenterMap[cb.fromCostCenterCode],
        fromCostCenterCode: cb.fromCostCenterCode,
        toCostCenterId: costCenterMap[cb.toCostCenterCode],
        toCostCenterCode: cb.toCostCenterCode,
        projectId: cb.projectCode ? projectMap[cb.projectCode] : null,
        projectCode: cb.projectCode,
        date: cb.date,
        description: cb.description,
        category: cb.category,
        amount: cb.amount,
        allocationMethod: cb.allocationMethod || 'direct',
        allocationBasis: cb.allocationBasis,
        quantity: cb.quantity,
        unitRate: cb.unitRate,
        periodStart: new Date(cb.periodStart),
        periodEnd: new Date(cb.periodEnd),
        status: cb.status,
        approvedBy: cb.status === 'approved' ? user.id : null,
        approvedAt: cb.status === 'approved' ? new Date() : null,
        createdBy: user.id,
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', chargebacks.length, 'internal chargebacks')

  // =============================================================================
  // PERIOD CLOSE MODULE
  // =============================================================================

  // =============================================================================
  // ACCOUNTING PERIODS
  // =============================================================================
  console.log('\n📅 Creating Accounting Periods...')
  
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const periods = [
    {
      name: `${new Date(currentYear, currentMonth - 2, 1).toLocaleString('default', { month: 'long' })} ${currentYear}`,
      code: `${currentYear}-${String(currentMonth - 1).padStart(2, '0')}`,
      type: 'monthly',
      startDate: new Date(currentYear, currentMonth - 2, 1),
      endDate: new Date(currentYear, currentMonth - 1, 0),
      fiscalYear: currentYear,
      fiscalMonth: currentMonth - 1,
      status: 'locked',
      closedAt: new Date(currentYear, currentMonth - 1, 5),
      closedBy: user.id,
      checklistTotal: 13,
      checklistCompleted: 13,
      checklistProgress: 100,
      hasUnreconciledItems: false,
      hasPendingTransactions: false,
      hasMissingDocuments: false,
      hasUnapprovedAdjustments: false,
      totalRevenue: 118000,
      totalExpenses: 89000,
      netIncome: 29000,
    },
    {
      name: `${new Date(currentYear, currentMonth - 1, 1).toLocaleString('default', { month: 'long' })} ${currentYear}`,
      code: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
      type: 'monthly',
      startDate: new Date(currentYear, currentMonth - 1, 1),
      endDate: new Date(currentYear, currentMonth, 0),
      fiscalYear: currentYear,
      fiscalMonth: currentMonth,
      status: 'closed',
      closedAt: new Date(currentYear, currentMonth, 5),
      closedBy: user.id,
      checklistTotal: 13,
      checklistCompleted: 13,
      checklistProgress: 100,
      hasUnreconciledItems: false,
      hasPendingTransactions: false,
      hasMissingDocuments: false,
      hasUnapprovedAdjustments: false,
      totalRevenue: 125000,
      totalExpenses: 98000,
      netIncome: 27000,
    },
    {
      name: `${new Date(currentYear, currentMonth, 1).toLocaleString('default', { month: 'long' })} ${currentYear}`,
      code: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
      type: 'monthly',
      startDate: new Date(currentYear, currentMonth, 1),
      endDate: new Date(currentYear, currentMonth + 1, 0),
      fiscalYear: currentYear,
      fiscalMonth: currentMonth + 1,
      status: 'open',
      checklistTotal: 13,
      checklistCompleted: 5,
      checklistProgress: 38,
      hasUnreconciledItems: true,
      hasPendingTransactions: true,
      hasMissingDocuments: true,
      hasUnapprovedAdjustments: true,
    },
  ]

  const periodMap: Record<string, string> = {}
  for (const p of periods) {
    const created = await prisma.accountingPeriod.create({
      data: {
        name: p.name,
        code: p.code,
        type: p.type,
        startDate: p.startDate,
        endDate: p.endDate,
        fiscalYear: p.fiscalYear,
        fiscalMonth: p.fiscalMonth,
        status: p.status,
        closedAt: p.closedAt,
        closedBy: p.closedBy,
        checklistTotal: p.checklistTotal,
        checklistCompleted: p.checklistCompleted,
        checklistProgress: p.checklistProgress,
        hasUnreconciledItems: p.hasUnreconciledItems,
        hasPendingTransactions: p.hasPendingTransactions,
        hasMissingDocuments: p.hasMissingDocuments,
        hasUnapprovedAdjustments: p.hasUnapprovedAdjustments,
        totalRevenue: p.totalRevenue,
        totalExpenses: p.totalExpenses,
        netIncome: p.netIncome,
        organizationId: org.id,
      },
    })
    periodMap[p.code] = created.id
  }
  console.log('  ✓ Created', periods.length, 'accounting periods')

  // =============================================================================
  // CLOSE CHECKLIST ITEMS
  // =============================================================================
  console.log('\n✅ Creating Close Checklist Items...')
  
  const currentPeriodCode = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
  const currentPeriodId = periodMap[currentPeriodCode]

  const checklistItems = [
    { name: 'Bank Reconciliation', category: 'reconciliation', orderIndex: 1, isRequired: true, isCritical: true, isAutomated: false, status: 'completed' },
    { name: 'Credit Card Reconciliation', category: 'reconciliation', orderIndex: 2, isRequired: true, isCritical: false, isAutomated: false, status: 'completed' },
    { name: 'Accounts Receivable Aging Review', category: 'review', orderIndex: 3, isRequired: true, isCritical: false, isAutomated: true, status: 'completed' },
    { name: 'Accounts Payable Review', category: 'review', orderIndex: 4, isRequired: true, isCritical: false, isAutomated: true, status: 'completed' },
    { name: 'Inventory Count Verification', category: 'reconciliation', orderIndex: 5, isRequired: false, isCritical: false, isAutomated: false, status: 'completed' },
    { name: 'Prepaid Expenses Amortization', category: 'adjustment', orderIndex: 6, isRequired: true, isCritical: false, isAutomated: true, status: 'in_progress' },
    { name: 'Depreciation Entry', category: 'adjustment', orderIndex: 7, isRequired: true, isCritical: false, isAutomated: true, status: 'pending' },
    { name: 'Accrued Expenses Review', category: 'adjustment', orderIndex: 8, isRequired: true, isCritical: false, isAutomated: false, status: 'pending' },
    { name: 'Revenue Recognition Review', category: 'review', orderIndex: 9, isRequired: true, isCritical: true, isAutomated: false, status: 'pending' },
    { name: 'Intercompany Reconciliation', category: 'reconciliation', orderIndex: 10, isRequired: false, isCritical: false, isAutomated: false, status: 'pending' },
    { name: 'Trial Balance Review', category: 'review', orderIndex: 11, isRequired: true, isCritical: true, isAutomated: true, status: 'pending' },
    { name: 'Financial Statements Generation', category: 'system', orderIndex: 12, isRequired: true, isCritical: true, isAutomated: true, status: 'pending' },
    { name: 'Management Approval', category: 'approval', orderIndex: 13, isRequired: true, isCritical: true, isAutomated: false, status: 'pending' },
  ]

  for (const item of checklistItems) {
    await prisma.closeChecklistItem.create({
      data: {
        periodId: currentPeriodId,
        name: item.name,
        category: item.category,
        orderIndex: item.orderIndex,
        isRequired: item.isRequired,
        isCritical: item.isCritical,
        isAutomated: item.isAutomated,
        status: item.status,
        completedAt: item.status === 'completed' ? new Date() : null,
        completedBy: item.status === 'completed' ? user.id : null,
      },
    })
  }
  console.log('  ✓ Created', checklistItems.length, 'checklist items')

  // =============================================================================
  // PERIOD MISSING ITEMS
  // =============================================================================
  console.log('\n⚠️  Creating Period Missing Items...')
  
  const missingItems = [
    {
      type: 'document',
      severity: 'high',
      title: 'Missing vendor invoice #INV-4521',
      description: 'Invoice from ABC Supplies for office equipment purchase',
      reference: 'PO-2024-0892',
      assignedTo: user.id,
      assignedToName: user.name,
      dueDate: daysFromNow(3),
      status: 'open',
    },
    {
      type: 'reconciliation',
      severity: 'critical',
      title: 'Unreconciled bank transactions',
      description: '12 transactions totaling €8,450 need to be matched',
      status: 'in_progress',
    },
    {
      type: 'approval',
      severity: 'medium',
      title: 'Expense report pending approval',
      description: 'Q4 travel expenses for sales team require manager sign-off',
      reference: 'EXP-2024-156',
      assignedTo: user.id,
      assignedToName: user.name,
      dueDate: daysFromNow(5),
      status: 'open',
    },
  ]

  for (const item of missingItems) {
    await prisma.periodMissingItem.create({
      data: {
        periodId: currentPeriodId,
        type: item.type,
        severity: item.severity,
        title: item.title,
        description: item.description,
        reference: item.reference,
        assignedTo: item.assignedTo,
        assignedToName: item.assignedToName,
        dueDate: item.dueDate,
        status: item.status,
      },
    })
  }
  console.log('  ✓ Created', missingItems.length, 'missing items')

  // =============================================================================
  // PERIOD ADJUSTMENTS
  // =============================================================================
  console.log('\n📝 Creating Period Adjustments...')
  
  const adjustments = [
    {
      adjustmentNumber: 'ADJ-2025-001',
      type: 'accrual',
      status: 'pending_approval',
      description: 'Accrue December utilities expense',
      reason: 'Utility bill not yet received, estimate based on prior months',
      debitAccountName: '6200 - Utilities Expense',
      creditAccountName: '2100 - Accrued Expenses',
      amount: 2500,
      effectiveDate: new Date(currentYear, currentMonth, 0),
      isReversing: true,
      reversalDate: daysFromNow(30),
      requestedBy: user.id,
      requestedByName: user.name,
    },
    {
      adjustmentNumber: 'ADJ-2025-002',
      type: 'deferral',
      status: 'draft',
      description: 'Defer prepaid insurance to future periods',
      reason: 'Annual insurance premium paid, defer 11 months',
      debitAccountName: '1400 - Prepaid Insurance',
      creditAccountName: '6300 - Insurance Expense',
      amount: 4400,
      effectiveDate: new Date(currentYear, currentMonth, 0),
      isReversing: false,
      requestedBy: user.id,
      requestedByName: user.name,
    },
    {
      adjustmentNumber: 'ADJ-2025-003',
      type: 'provision',
      status: 'approved',
      description: 'Bad debt provision for doubtful accounts',
      reason: 'Increase allowance based on aging analysis',
      debitAccountName: '6500 - Bad Debt Expense',
      creditAccountName: '1210 - Allowance for Doubtful Accounts',
      amount: 3200,
      effectiveDate: new Date(currentYear, currentMonth, 0),
      isReversing: false,
      requestedBy: user.id,
      requestedByName: user.name,
      approvedBy: user.id,
      approvedByName: user.name,
      approvedAt: daysAgo(1),
    },
  ]

  for (const adj of adjustments) {
    await prisma.periodAdjustment.create({
      data: {
        periodId: currentPeriodId,
        adjustmentNumber: adj.adjustmentNumber,
        type: adj.type,
        status: adj.status,
        description: adj.description,
        reason: adj.reason,
        debitAccountName: adj.debitAccountName,
        creditAccountName: adj.creditAccountName,
        amount: adj.amount,
        currency: 'EUR',
        effectiveDate: adj.effectiveDate,
        isReversing: adj.isReversing,
        reversalDate: adj.reversalDate,
        requestedBy: adj.requestedBy,
        requestedByName: adj.requestedByName,
        approvedBy: adj.approvedBy,
        approvedByName: adj.approvedByName,
        approvedAt: adj.approvedAt,
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', adjustments.length, 'period adjustments')

  // =============================================================================
  // PERIOD AUDIT ENTRIES
  // =============================================================================
  console.log('\n📋 Creating Period Audit Entries...')
  
  const auditEntries = [
    {
      action: 'created',
      description: 'Period created',
      userId: user.id,
      userName: user.name,
      createdAt: daysAgo(20),
    },
    {
      action: 'checklist_updated',
      description: 'Completed: Bank Reconciliation',
      userId: user.id,
      userName: user.name,
      createdAt: daysAgo(5),
    },
    {
      action: 'checklist_updated',
      description: 'Completed: Credit Card Reconciliation',
      userId: user.id,
      userName: user.name,
      createdAt: daysAgo(4),
    },
    {
      action: 'adjustment_posted',
      description: 'Adjustment ADJ-2025-003 approved',
      userId: user.id,
      userName: user.name,
      createdAt: daysAgo(1),
    },
  ]

  for (const entry of auditEntries) {
    await prisma.periodAuditEntry.create({
      data: {
        periodId: currentPeriodId,
        action: entry.action,
        description: entry.description,
        userId: entry.userId,
        userName: entry.userName,
        createdAt: entry.createdAt,
      },
    })
  }
  console.log('  ✓ Created', auditEntries.length, 'audit entries')

  // =============================================================================
  // CUSTOMERS
  // =============================================================================
  console.log('\n👥 Creating Customers...')

  const customers = [
    {
      customerNumber: 'C-10001',
      name: 'Acme Corporation',
      type: 'enterprise',
      status: 'active',
      industry: 'Technology',
      email: 'accounts@acmecorp.com',
      phone: '+1 (555) 123-4567',
      website: 'https://acmecorp.com',
      address: { street: '123 Tech Boulevard', city: 'San Francisco', state: 'CA', postalCode: '94105', country: 'US' },
      taxId: 'US-123456789',
      creditLimit: 500000,
      creditUsed: 125000,
      creditAvailable: 375000,
      creditStatus: 'approved',
      paymentTerms: 'Net 30',
      paymentBehavior: 'excellent',
      averageDaysToPayment: 18,
      riskLevel: 'low',
      riskScore: 12,
      totalRevenue: 1250000,
      totalOrders: 48,
      averageOrderValue: 26041.67,
      outstandingBalance: 125000,
      customerSince: daysAgo(730),
      accountManagerName: 'Sarah Johnson',
    },
    {
      customerNumber: 'C-10002',
      name: 'Global Industries Ltd',
      type: 'enterprise',
      status: 'active',
      industry: 'Manufacturing',
      email: 'finance@globalind.com',
      phone: '+44 20 7123 4567',
      website: 'https://globalindustries.co.uk',
      address: { street: '45 Industrial Way', city: 'London', state: '', postalCode: 'EC1A 1BB', country: 'GB' },
      taxId: 'GB987654321',
      creditLimit: 750000,
      creditUsed: 320000,
      creditAvailable: 430000,
      creditStatus: 'approved',
      paymentTerms: 'Net 45',
      paymentBehavior: 'good',
      averageDaysToPayment: 38,
      riskLevel: 'low',
      riskScore: 18,
      totalRevenue: 2800000,
      totalOrders: 156,
      averageOrderValue: 17948.72,
      outstandingBalance: 320000,
      customerSince: daysAgo(1095),
      accountManagerName: 'Michael Chen',
    },
    {
      customerNumber: 'C-10003',
      name: 'Summit Solutions GmbH',
      type: 'business',
      status: 'active',
      industry: 'Professional Services',
      email: 'billing@summit-solutions.de',
      phone: '+49 30 1234 5678',
      address: { street: 'Alexanderplatz 10', city: 'Berlin', state: '', postalCode: '10178', country: 'DE' },
      taxId: 'DE123456789',
      creditLimit: 150000,
      creditUsed: 45000,
      creditAvailable: 105000,
      creditStatus: 'approved',
      paymentTerms: 'Net 30',
      paymentBehavior: 'good',
      averageDaysToPayment: 28,
      riskLevel: 'low',
      riskScore: 8,
      totalRevenue: 380000,
      totalOrders: 24,
      averageOrderValue: 15833.33,
      outstandingBalance: 45000,
      customerSince: daysAgo(365),
      accountManagerName: 'Sarah Johnson',
    },
    {
      customerNumber: 'C-10004',
      name: 'Pacific Trading Co',
      type: 'business',
      status: 'active',
      industry: 'Retail',
      email: 'ap@pacifictrading.com',
      phone: '+1 (415) 555-0199',
      address: { street: '500 Market Street', city: 'San Francisco', state: 'CA', postalCode: '94102', country: 'US' },
      taxId: 'US-987654321',
      creditLimit: 100000,
      creditUsed: 85000,
      creditAvailable: 15000,
      creditStatus: 'under_review',
      paymentTerms: 'Net 30',
      paymentBehavior: 'fair',
      averageDaysToPayment: 42,
      riskLevel: 'medium',
      riskScore: 45,
      totalRevenue: 520000,
      totalOrders: 65,
      averageOrderValue: 8000.00,
      outstandingBalance: 85000,
      customerSince: daysAgo(540),
      accountManagerName: 'Michael Chen',
    },
    {
      customerNumber: 'C-10005',
      name: 'Nordic Innovations AS',
      type: 'business',
      status: 'active',
      industry: 'Technology',
      email: 'invoices@nordicinnovations.no',
      phone: '+47 22 12 34 56',
      address: { street: 'Karl Johans gate 25', city: 'Oslo', state: '', postalCode: '0159', country: 'NO' },
      creditLimit: 200000,
      creditUsed: 0,
      creditAvailable: 200000,
      creditStatus: 'approved',
      paymentTerms: 'Net 15',
      paymentBehavior: 'excellent',
      averageDaysToPayment: 12,
      riskLevel: 'low',
      riskScore: 5,
      totalRevenue: 180000,
      totalOrders: 12,
      averageOrderValue: 15000.00,
      outstandingBalance: 0,
      customerSince: daysAgo(180),
      accountManagerName: 'Sarah Johnson',
    },
    {
      customerNumber: 'C-10006',
      name: 'RedFlag Industries',
      type: 'business',
      status: 'suspended',
      industry: 'Construction',
      email: 'accounts@redflag.com',
      phone: '+1 (212) 555-0188',
      address: { street: '789 Builder Ave', city: 'New York', state: 'NY', postalCode: '10001', country: 'US' },
      creditLimit: 50000,
      creditUsed: 50000,
      creditAvailable: 0,
      creditStatus: 'suspended',
      paymentTerms: 'Due on Receipt',
      paymentBehavior: 'delinquent',
      averageDaysToPayment: 95,
      riskLevel: 'critical',
      riskScore: 85,
      totalRevenue: 150000,
      totalOrders: 18,
      averageOrderValue: 8333.33,
      outstandingBalance: 50000,
      customerSince: daysAgo(400),
      accountManagerName: 'Michael Chen',
    },
  ]

  const customerMap: Record<string, string> = {}
  for (const c of customers) {
    const created = await prisma.customer.create({
      data: {
        customerNumber: c.customerNumber,
        name: c.name,
        type: c.type,
        status: c.status,
        industry: c.industry,
        email: c.email,
        phone: c.phone,
        website: c.website,
        address: c.address,
        taxId: c.taxId,
        creditLimit: c.creditLimit,
        creditUsed: c.creditUsed,
        creditAvailable: c.creditAvailable,
        creditStatus: c.creditStatus,
        paymentTerms: c.paymentTerms,
        paymentBehavior: c.paymentBehavior,
        averageDaysToPayment: c.averageDaysToPayment,
        riskLevel: c.riskLevel,
        riskScore: c.riskScore,
        totalRevenue: c.totalRevenue,
        totalOrders: c.totalOrders,
        averageOrderValue: c.averageOrderValue,
        outstandingBalance: c.outstandingBalance,
        customerSince: c.customerSince,
        accountManagerName: c.accountManagerName,
        organizationId: org.id,
      },
    })
    customerMap[c.customerNumber] = created.id
  }
  console.log('  ✓ Created', customers.length, 'customers')

  // =============================================================================
  // CUSTOMER CONTACTS
  // =============================================================================
  console.log('\n📇 Creating Customer Contacts...')

  const contacts = [
    { customerNumber: 'C-10001', name: 'John Smith', title: 'CFO', email: 'jsmith@acmecorp.com', phone: '+1 (555) 123-4568', isPrimary: true, role: 'billing' },
    { customerNumber: 'C-10001', name: 'Emily Davis', title: 'Procurement Manager', email: 'edavis@acmecorp.com', phone: '+1 (555) 123-4569', isPrimary: false, role: 'purchasing' },
    { customerNumber: 'C-10001', name: 'Mark Thompson', title: 'CEO', email: 'mthompson@acmecorp.com', isPrimary: false, role: 'executive' },
    { customerNumber: 'C-10002', name: 'Robert Wilson', title: 'VP Finance', email: 'rwilson@globalind.com', phone: '+44 20 7123 4568', isPrimary: true, role: 'executive' },
    { customerNumber: 'C-10002', name: 'Lisa Brown', title: 'Accounts Payable', email: 'lbrown@globalind.com', phone: '+44 20 7123 4569', isPrimary: false, role: 'billing' },
    { customerNumber: 'C-10003', name: 'Klaus Mueller', title: 'Managing Director', email: 'kmueller@summit-solutions.de', phone: '+49 30 1234 5679', isPrimary: true, role: 'executive' },
    { customerNumber: 'C-10004', name: 'Jennifer Lee', title: 'Finance Director', email: 'jlee@pacifictrading.com', phone: '+1 (415) 555-0200', isPrimary: true, role: 'billing' },
    { customerNumber: 'C-10005', name: 'Erik Andersen', title: 'CEO', email: 'eandersen@nordicinnovations.no', phone: '+47 22 12 34 57', isPrimary: true, role: 'executive' },
  ]

  for (const contact of contacts) {
    await prisma.customerContact.create({
      data: {
        customerId: customerMap[contact.customerNumber],
        name: contact.name,
        title: contact.title,
        email: contact.email,
        phone: contact.phone,
        isPrimary: contact.isPrimary,
        role: contact.role,
      },
    })
  }
  console.log('  ✓ Created', contacts.length, 'customer contacts')

  // =============================================================================
  // CUSTOMER PAYMENTS
  // =============================================================================
  console.log('\n💳 Creating Customer Payments...')

  const payments = [
    { customerNumber: 'C-10001', invoiceNumber: 'INV-2024-001', amount: 45000, invoiceDate: daysAgo(60), dueDate: daysAgo(30), paymentDate: daysAgo(35), status: 'paid', daysToPayment: 25 },
    { customerNumber: 'C-10001', invoiceNumber: 'INV-2024-015', amount: 38000, invoiceDate: daysAgo(45), dueDate: daysAgo(15), paymentDate: daysAgo(18), status: 'paid', daysToPayment: 27 },
    { customerNumber: 'C-10001', invoiceNumber: 'INV-2024-028', amount: 52000, invoiceDate: daysAgo(20), dueDate: daysFromNow(10), status: 'pending' },
    { customerNumber: 'C-10002', invoiceNumber: 'INV-2024-002', amount: 125000, invoiceDate: daysAgo(90), dueDate: daysAgo(45), paymentDate: daysAgo(42), status: 'paid', daysToPayment: 48 },
    { customerNumber: 'C-10002', invoiceNumber: 'INV-2024-019', amount: 85000, invoiceDate: daysAgo(50), dueDate: daysAgo(5), paymentDate: daysAgo(2), status: 'paid', daysToPayment: 48 },
    { customerNumber: 'C-10002', invoiceNumber: 'INV-2024-033', amount: 95000, invoiceDate: daysAgo(15), dueDate: daysFromNow(30), status: 'pending' },
    { customerNumber: 'C-10004', invoiceNumber: 'INV-2024-008', amount: 25000, invoiceDate: daysAgo(75), dueDate: daysAgo(45), paymentDate: null, status: 'overdue', daysOverdue: 45 },
    { customerNumber: 'C-10004', invoiceNumber: 'INV-2024-022', amount: 18000, invoiceDate: daysAgo(40), dueDate: daysAgo(10), paymentDate: null, status: 'overdue', daysOverdue: 10 },
    { customerNumber: 'C-10006', invoiceNumber: 'INV-2024-005', amount: 35000, invoiceDate: daysAgo(150), dueDate: daysAgo(150), paymentDate: null, status: 'overdue', daysOverdue: 150 },
    { customerNumber: 'C-10006', invoiceNumber: 'INV-2024-012', amount: 15000, invoiceDate: daysAgo(120), dueDate: daysAgo(120), paymentDate: null, status: 'overdue', daysOverdue: 120 },
  ]

  for (const payment of payments) {
    await prisma.customerPayment.create({
      data: {
        customerId: customerMap[payment.customerNumber],
        invoiceNumber: payment.invoiceNumber,
        amount: payment.amount,
        invoiceDate: payment.invoiceDate,
        dueDate: payment.dueDate,
        paymentDate: payment.paymentDate,
        status: payment.status,
        daysToPayment: payment.daysToPayment,
        daysOverdue: payment.daysOverdue,
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', payments.length, 'customer payments')

  // =============================================================================
  // CUSTOMER REVENUE
  // =============================================================================
  console.log('\n📈 Creating Customer Revenue Records...')

  const revenueRecords = [
    { customerNumber: 'C-10001', period: '2024-Q3', periodType: 'quarterly', revenue: 280000, cost: 168000, profit: 112000, margin: 40, orderCount: 12, averageOrderValue: 23333 },
    { customerNumber: 'C-10001', period: '2024-Q4', periodType: 'quarterly', revenue: 320000, cost: 185000, profit: 135000, margin: 42, orderCount: 14, averageOrderValue: 22857 },
    { customerNumber: 'C-10002', period: '2024-Q3', periodType: 'quarterly', revenue: 650000, cost: 420000, profit: 230000, margin: 35, orderCount: 38, averageOrderValue: 17105 },
    { customerNumber: 'C-10002', period: '2024-Q4', periodType: 'quarterly', revenue: 720000, cost: 450000, profit: 270000, margin: 38, orderCount: 42, averageOrderValue: 17143 },
    { customerNumber: 'C-10003', period: '2024-Q4', periodType: 'quarterly', revenue: 95000, cost: 55000, profit: 40000, margin: 42, orderCount: 6, averageOrderValue: 15833 },
    { customerNumber: 'C-10004', period: '2024-Q3', periodType: 'quarterly', revenue: 120000, cost: 85000, profit: 35000, margin: 29, orderCount: 15, averageOrderValue: 8000 },
    { customerNumber: 'C-10004', period: '2024-Q4', periodType: 'quarterly', revenue: 95000, cost: 70000, profit: 25000, margin: 26, orderCount: 12, averageOrderValue: 7917 },
  ]

  for (const rev of revenueRecords) {
    await prisma.customerRevenue.create({
      data: {
        customerId: customerMap[rev.customerNumber],
        period: rev.period,
        periodType: rev.periodType,
        revenue: rev.revenue,
        cost: rev.cost,
        profit: rev.profit,
        margin: rev.margin,
        orderCount: rev.orderCount,
        averageOrderValue: rev.averageOrderValue,
      },
    })
  }
  console.log('  ✓ Created', revenueRecords.length, 'revenue records')

  // =============================================================================
  // CUSTOMER RISK INDICATORS
  // =============================================================================
  console.log('\n⚠️  Creating Customer Risk Indicators...')

  const riskIndicators = [
    { customerNumber: 'C-10004', category: 'payment', indicator: 'Late payments', description: 'Multiple invoices paid 15+ days late in last quarter', severity: 'medium', score: 25, status: 'active', recommendedAction: 'Review payment terms' },
    { customerNumber: 'C-10004', category: 'credit', indicator: 'High credit utilization', description: 'Credit utilization at 85%, approaching limit', severity: 'medium', score: 20, status: 'monitoring', recommendedAction: 'Consider credit limit review' },
    { customerNumber: 'C-10006', category: 'payment', indicator: 'Severely overdue', description: 'Outstanding invoices over 120 days past due', severity: 'critical', score: 40, status: 'active', recommendedAction: 'Initiate collection process' },
    { customerNumber: 'C-10006', category: 'credit', indicator: 'Credit blocked', description: 'Account suspended due to non-payment', severity: 'critical', score: 35, status: 'active', recommendedAction: 'No new orders until payment received' },
    { customerNumber: 'C-10006', category: 'financial', indicator: 'Cash flow concerns', description: 'Industry reports indicate financial distress', severity: 'high', score: 10, status: 'monitoring', recommendedAction: 'Monitor closely' },
  ]

  for (const risk of riskIndicators) {
    await prisma.customerRiskIndicator.create({
      data: {
        customerId: customerMap[risk.customerNumber],
        category: risk.category,
        indicator: risk.indicator,
        description: risk.description,
        severity: risk.severity,
        score: risk.score,
        status: risk.status,
        recommendedAction: risk.recommendedAction,
      },
    })
  }
  console.log('  ✓ Created', riskIndicators.length, 'risk indicators')

  // =============================================================================
  // SUPPLIERS
  // =============================================================================
  console.log('\n🚚 Creating Suppliers...')
  const suppliers = [
    { supplierNumber: 'SUP-001', name: 'TechParts GmbH', category: 'manufacturer', status: 'preferred', industry: 'Electronics', email: 'orders@techparts.de', paymentTerms: 'Net 30', totalPurchases: 125000, qualityRating: 4.5, deliveryRating: 4.2, onTimeDeliveryRate: 92 },
    { supplierNumber: 'SUP-002', name: 'CloudServices Inc', category: 'service_provider', status: 'active', industry: 'Technology', email: 'billing@cloudservices.com', paymentTerms: 'Net 15', totalPurchases: 85000, qualityRating: 4.8, deliveryRating: 4.9, onTimeDeliveryRate: 99 },
    { supplierNumber: 'SUP-003', name: 'Office World AG', category: 'distributor', status: 'active', industry: 'Office Supplies', email: 'sales@officeworld.ch', paymentTerms: 'Net 45', totalPurchases: 22000, qualityRating: 4.0, deliveryRating: 3.8, onTimeDeliveryRate: 85 },
    { supplierNumber: 'SUP-004', name: 'SecurIT Solutions', category: 'contractor', status: 'active', industry: 'Cybersecurity', email: 'accounts@securit.io', paymentTerms: 'Net 30', totalPurchases: 45000, qualityRating: 4.7, deliveryRating: 4.5, onTimeDeliveryRate: 95 },
    { supplierNumber: 'SUP-005', name: 'Global Logistics Ltd', category: 'service_provider', status: 'active', industry: 'Logistics', email: 'finance@globallog.com', paymentTerms: 'Net 30', totalPurchases: 38000, qualityRating: 3.9, deliveryRating: 4.1, onTimeDeliveryRate: 88 },
  ]

  const supplierMap: Record<string, string> = {}
  for (const sup of suppliers) {
    const created = await prisma.supplier.create({
      data: {
        supplierNumber: sup.supplierNumber,
        name: sup.name,
        category: sup.category,
        status: sup.status,
        email: sup.email,
        paymentTerms: sup.paymentTerms,
        totalSpend: sup.totalPurchases,
        qualityScore: Math.round(sup.qualityRating * 20),
        reliabilityScore: Math.round((sup.qualityRating + sup.deliveryRating) / 2 * 20),
        onTimeDeliveryRate: sup.onTimeDeliveryRate,
        organizationId: org.id,
      },
    })
    supplierMap[sup.supplierNumber] = created.id
  }
  console.log('  ✓ Created', suppliers.length, 'suppliers')

  // =============================================================================
  // OFFERS
  // =============================================================================
  console.log('\n📝 Creating Offers...')
  const offers = [
    { offerNumber: 'QUO-2025-001', status: 'sent', type: 'quote', customerName: 'Alpine Industries AG', offerDate: daysAgo(5), validUntil: daysFromNow(25), subtotal: 28500, taxAmount: 5415, total: 33915, taxRate: 19 },
    { offerNumber: 'QUO-2025-002', status: 'accepted', type: 'proposal', customerName: 'TechStart GmbH', offerDate: daysAgo(15), validUntil: daysAgo(1), acceptedAt: daysAgo(3), subtotal: 75000, taxAmount: 14250, total: 89250, taxRate: 19 },
    { offerNumber: 'QUO-2025-003', status: 'draft', type: 'estimate', customerName: 'Future Corp', offerDate: new Date(), validUntil: daysFromNow(30), subtotal: 15000, taxAmount: 2850, total: 17850, taxRate: 19 },
    { offerNumber: 'QUO-2025-004', status: 'rejected', type: 'quote', customerName: 'SmallBiz Solutions', offerDate: daysAgo(20), validUntil: daysAgo(5), rejectedAt: daysAgo(8), subtotal: 8500, taxAmount: 1615, total: 10115, taxRate: 19 },
    { offerNumber: 'QUO-2025-005', status: 'expired', type: 'tender', customerName: 'Government Agency XY', offerDate: daysAgo(45), validUntil: daysAgo(15), subtotal: 250000, taxAmount: 0, total: 250000, taxRate: 0 },
  ]

  for (const offer of offers) {
    await prisma.offer.create({
      data: {
        offerNumber: offer.offerNumber,
        status: offer.status,
        customerName: offer.customerName,
        counterparty: { name: offer.customerName },
        offerDate: offer.offerDate,
        expiryDate: offer.validUntil,
        validityDays: 30,
        acceptedAt: offer.acceptedAt,
        rejectedAt: offer.rejectedAt,
        lineItems: [{ description: 'Professional Services', quantity: 1, unitPrice: offer.subtotal, total: offer.subtotal }],
        currency: 'EUR',
        subtotal: offer.subtotal,
        taxTotal: offer.taxAmount,
        grandTotal: offer.total,
        taxRate: offer.taxRate,
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', offers.length, 'offers')

  // =============================================================================
  // TASKS
  // =============================================================================
  console.log('\n✅ Creating Tasks...')
  const tasks = [
    { title: 'Review Q4 Financial Statements', status: 'in_progress', priority: 'high', taskType: 'review', category: 'finance', dueDate: daysFromNow(3), progress: 60 },
    { title: 'Approve Vendor Payment Batch', status: 'pending', priority: 'urgent', taskType: 'approval', category: 'finance', dueDate: daysFromNow(1), progress: 0 },
    { title: 'Monthly Bank Reconciliation', status: 'completed', priority: 'normal', taskType: 'reconciliation', category: 'finance', dueDate: daysAgo(2), completedAt: daysAgo(1), progress: 100 },
    { title: 'Update Tax Registration', status: 'pending', priority: 'high', taskType: 'compliance', category: 'tax', dueDate: daysFromNow(14), progress: 0 },
    { title: 'Prepare Board Meeting Materials', status: 'in_progress', priority: 'normal', taskType: 'deadline', category: 'operations', dueDate: daysFromNow(7), progress: 35 },
    { title: 'Invoice Follow-up - Overdue Accounts', status: 'pending', priority: 'high', taskType: 'general', category: 'finance', dueDate: daysFromNow(2), progress: 0 },
    { title: 'Annual Audit Preparation', status: 'pending', priority: 'normal', taskType: 'compliance', category: 'compliance', dueDate: daysFromNow(30), progress: 0 },
  ]

  for (const task of tasks) {
    await prisma.task.create({
      data: {
        title: task.title,
        status: task.status,
        priority: task.priority,
        type: task.taskType,
        category: task.category,
        dueDate: task.dueDate,
        completedAt: task.completedAt,
        createdById: user.id,
        organizationId: org.id,
        assignees: {
          create: {
            userId: user.id,
            assignedAt: new Date(),
          },
        },
      },
    })
  }
  console.log('  ✓ Created', tasks.length, 'tasks')

  // =============================================================================
  // CASH FORECASTS
  // =============================================================================
  console.log('\n📈 Creating Cash Forecasts...')
  const forecast = await prisma.cashForecast.create({
    data: {
      version: 'baseline',
      timeHorizon: 'year',
      granularity: 'monthly',
      currency: 'EUR',
      currentCashBalance: 250000,
      minimumCashRunway: 90,
      covenantThreshold: 100000,
      projectedMinimumBalance: 180000,
      avgCollectionDays: 30,
      avgPaymentTerms: 30,
      confidence: 'high',
      organizationId: org.id,
    },
  })

  const forecastPeriods = [
    { label: '2025-01', openingBalance: 250000, closingBalance: 265000, netCashFlow: 15000 },
    { label: '2025-02', openingBalance: 265000, closingBalance: 292000, netCashFlow: 27000 },
    { label: '2025-03', openingBalance: 292000, closingBalance: 317000, netCashFlow: 25000 },
    { label: '2025-04', openingBalance: 317000, closingBalance: 347000, netCashFlow: 30000 },
    { label: '2025-05', openingBalance: 347000, closingBalance: 380000, netCashFlow: 33000 },
    { label: '2025-06', openingBalance: 380000, closingBalance: 410000, netCashFlow: 30000 },
  ]

  for (const fp of forecastPeriods) {
    await prisma.cashForecastPeriod.create({
      data: {
        periodId: fp.label,
        periodLabel: fp.label,
        startDate: new Date(`${fp.label}-01`),
        endDate: new Date(`${fp.label}-28`),
        openingBalance: fp.openingBalance,
        closingBalance: fp.closingBalance,
        netCashFlow: fp.netCashFlow,
        cashIn: { expected: fp.netCashFlow + 50000, bestCase: fp.netCashFlow + 60000, worstCase: fp.netCashFlow + 40000 },
        cashOut: { expected: 50000, bestCase: 45000, worstCase: 55000 },
        confidence: 'high',
        cashForecastId: forecast.id,
      },
    })
  }
  console.log('  ✓ Created 1 cash forecast with', forecastPeriods.length, 'periods')

  // =============================================================================
  // SCENARIOS
  // =============================================================================
  console.log('\n🎯 Creating Scenarios...')
  const scenariosData = [
    {
      name: 'Optimistic Growth',
      description: 'Revenue growth 20% above baseline with moderate cost increases',
      caseType: 'best_case',
      status: 'approved',
      metrics: { revenue: 2160000, costs: 1740000, cash: 420000, netPosition: 420000, profitMargin: 19.4 },
      confidenceLevel: 'medium',
      confidenceScore: 65,
    },
    {
      name: 'Conservative Baseline',
      description: 'Baseline assumptions with 5% safety buffer',
      caseType: 'expected_case',
      status: 'approved',
      metrics: { revenue: 1800000, costs: 1450000, cash: 350000, netPosition: 350000, profitMargin: 19.4 },
      confidenceLevel: 'high',
      confidenceScore: 85,
    },
    {
      name: 'Economic Downturn',
      description: 'Stress test: 15% revenue decline, cost reduction measures',
      caseType: 'worst_case',
      status: 'reviewed',
      metrics: { revenue: 1530000, costs: 1305000, cash: 225000, netPosition: 225000, profitMargin: 14.7 },
      confidenceLevel: 'low',
      confidenceScore: 40,
    },
  ]

  for (const sc of scenariosData) {
    await prisma.scenario.create({
      data: {
        name: sc.name,
        description: sc.description,
        caseType: sc.caseType,
        status: sc.status,
        metrics: sc.metrics,
        confidenceLevel: sc.confidenceLevel,
        confidenceScore: sc.confidenceScore,
        ownerId: user.id,
        ownerName: user.name || 'Demo User',
        createdBy: user.id,
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', scenariosData.length, 'scenarios')

  // =============================================================================
  // KPIs
  // =============================================================================
  console.log('\n📊 Creating KPIs...')
  const kpis = [
    { code: 'GROSS_MARGIN', name: 'Gross Margin', category: 'margins', unit: 'percentage', currentValue: 42.5, previousValue: 40.2, targetValue: 45, status: 'watch', trend: 'improving' },
    { code: 'EBITDA_MARGIN', name: 'EBITDA Margin', category: 'margins', unit: 'percentage', currentValue: 18.3, previousValue: 17.8, targetValue: 20, status: 'on_track', trend: 'improving' },
    { code: 'CASH_BURN', name: 'Monthly Cash Burn', category: 'burn_runway', unit: 'currency', currentValue: 45000, previousValue: 52000, targetValue: 40000, status: 'watch', trend: 'improving' },
    { code: 'RUNWAY_MONTHS', name: 'Cash Runway', category: 'burn_runway', unit: 'number', currentValue: 18.5, previousValue: 16.2, targetValue: 24, status: 'watch', trend: 'improving' },
    { code: 'DSO', name: 'Days Sales Outstanding', category: 'cash_conversion', unit: 'days', currentValue: 38, previousValue: 42, targetValue: 30, status: 'off_track', trend: 'improving' },
    { code: 'DPO', name: 'Days Payable Outstanding', category: 'cash_conversion', unit: 'days', currentValue: 45, previousValue: 43, targetValue: 45, status: 'on_track', trend: 'stable' },
    { code: 'REVENUE_GROWTH', name: 'Revenue Growth Rate', category: 'growth', unit: 'percentage', currentValue: 15.2, previousValue: 12.8, targetValue: 20, status: 'watch', trend: 'improving' },
    { code: 'CAC', name: 'Customer Acquisition Cost', category: 'unit_economics', unit: 'currency', currentValue: 850, previousValue: 920, targetValue: 750, status: 'watch', trend: 'improving' },
    { code: 'LTV', name: 'Customer Lifetime Value', category: 'unit_economics', unit: 'currency', currentValue: 4200, previousValue: 3800, targetValue: 5000, status: 'on_track', trend: 'improving' },
    { code: 'LTV_CAC', name: 'LTV/CAC Ratio', category: 'unit_economics', unit: 'ratio', currentValue: 4.9, previousValue: 4.1, targetValue: 5, status: 'on_track', trend: 'improving' },
  ]

  for (const kpi of kpis) {
    await prisma.kPI.create({
      data: {
        code: kpi.code,
        name: kpi.name,
        category: kpi.category,
        unit: kpi.unit,
        currentValue: kpi.currentValue,
        previousValue: kpi.previousValue,
        targetValue: kpi.targetValue,
        status: kpi.status,
        trend: kpi.trend,
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', kpis.length, 'KPIs')

  // =============================================================================
  // FX MANAGEMENT
  // =============================================================================
  console.log('\n💱 Creating FX Exposures...')
  const fxExposures = [
    { baseCurrency: 'EUR', quoteCurrency: 'USD', type: 'receivable', exposureAmount: 125000, hedgedAmount: 75000, bookingRate: 1.0850, currentRate: 1.0920, maturityDate: daysFromNow(45) },
    { baseCurrency: 'EUR', quoteCurrency: 'GBP', type: 'payable', exposureAmount: 85000, hedgedAmount: 85000, bookingRate: 0.8520, currentRate: 0.8480, maturityDate: daysFromNow(30) },
    { baseCurrency: 'EUR', quoteCurrency: 'CHF', type: 'forecast', exposureAmount: 200000, hedgedAmount: 0, bookingRate: 0.9450, currentRate: 0.9380, maturityDate: daysFromNow(90) },
    { baseCurrency: 'EUR', quoteCurrency: 'USD', type: 'payable', exposureAmount: 45000, hedgedAmount: 0, bookingRate: 1.0780, currentRate: 1.0920, maturityDate: daysFromNow(15) },
  ]

  for (const fx of fxExposures) {
    const unhedgedAmount = fx.exposureAmount - fx.hedgedAmount
    const hedgePercentage = (fx.hedgedAmount / fx.exposureAmount) * 100
    await prisma.fXExposure.create({
      data: {
        baseCurrency: fx.baseCurrency,
        quoteCurrency: fx.quoteCurrency,
        type: 'transactional',
        direction: fx.type === 'receivable' ? 'inflow' : 'outflow',
        status: fx.hedgedAmount >= fx.exposureAmount ? 'hedged' : fx.hedgedAmount > 0 ? 'partial_hedged' : 'open',
        grossExposure: fx.exposureAmount,
        netExposure: fx.exposureAmount,
        hedgedAmount: fx.hedgedAmount,
        unhedgedAmount: unhedgedAmount,
        hedgePercentage: hedgePercentage,
        spotRate: fx.currentRate,
        bookingRate: fx.bookingRate,
        currentRate: fx.currentRate,
        baseCurrencyValue: fx.exposureAmount * fx.currentRate,
        exposureDate: new Date(),
        maturityDate: fx.maturityDate,
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', fxExposures.length, 'FX exposures')

  // =============================================================================
  // LIQUIDITY POSITIONS
  // =============================================================================
  console.log('\n💧 Creating Liquidity Positions...')
  const liquidityPositions = [
    { date: daysAgo(0), totalCash: 485000, operatingCash: 350000, reserveCash: 135000, availableCredit: 100000, expectedInflows: 125000, expectedOutflows: 95000, runwayMonths: 18.5 },
    { date: daysAgo(7), totalCash: 465000, operatingCash: 330000, reserveCash: 135000, availableCredit: 100000, expectedInflows: 110000, expectedOutflows: 88000, runwayMonths: 17.8 },
    { date: daysAgo(14), totalCash: 452000, operatingCash: 317000, reserveCash: 135000, availableCredit: 100000, expectedInflows: 98000, expectedOutflows: 92000, runwayMonths: 17.2 },
    { date: daysAgo(21), totalCash: 478000, operatingCash: 343000, reserveCash: 135000, availableCredit: 100000, expectedInflows: 115000, expectedOutflows: 85000, runwayMonths: 18.1 },
  ]

  for (const lp of liquidityPositions) {
    await prisma.liquidityPosition.create({
      data: {
        positionDate: lp.date,
        periodType: 'daily',
        totalCash: lp.totalCash,
        operatingCash: lp.operatingCash,
        reserveCash: lp.reserveCash,
        availableCredit: lp.availableCredit,
        totalLiquidity: lp.totalCash + lp.availableCredit,
        expectedInflows: lp.expectedInflows,
        expectedOutflows: lp.expectedOutflows,
        netCashFlow: lp.expectedInflows - lp.expectedOutflows,
        runwayMonths: lp.runwayMonths,
        status: lp.runwayMonths > 12 ? 'normal' : lp.runwayMonths > 6 ? 'watch' : 'warning',
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', liquidityPositions.length, 'liquidity positions')
  console.log('\n✅ Suppliers module seeded successfully!')


  // =============================================================================
  // SUMMARY
  // =============================================================================
  console.log('\n' + '=' .repeat(60))
  console.log('✅ Database seeding completed successfully!')
  console.log('=' .repeat(60))
  console.log('\nSummary:')
  console.log('  • 1 Organization')
  console.log('  • 1 User with settings')
  console.log('  • ' + Object.keys(accountMap).length + ' Financial accounts')
  console.log('  • ' + transactions.length + ' Transactions')
  console.log('  • ' + receipts.length + ' Receipts')
  console.log('  • ' + channelsData.length + ' Chat channels')
  console.log('  • ' + messages.length + ' Chat messages')
  console.log('  • ' + entities.length + ' Corporate entities')
  console.log('  • ' + wallets.length + ' Wallets')
  console.log('  • ' + suggestions.length + ' AI suggestions')
  console.log('  • ' + reports.length + ' Saved reports')
  console.log('  • ' + invoices.length + ' Invoices')
  console.log('  • ' + orders.length + ' Orders')
  console.log('  • ' + archiveItems.length + ' Archive items')
  console.log('  • ' + liabilities.length + ' Liabilities')
  console.log('  • ' + liabilityPayments.length + ' Liability payments')
  console.log('  • ' + inventory.length + ' Inventory items')
  console.log('  • ' + batches.length + ' Inventory batches')
  console.log('  • ' + movements.length + ' Inventory movements')
  console.log('  • ' + receivables.length + ' Receivables')
  console.log('  • ' + receivablePayments.length + ' Receivable payments')
  console.log('  • ' + receivableEvents.length + ' Receivable events')
  console.log('  • ' + treasuryAccounts.length + ' Treasury accounts')
  console.log('  • ' + cashMovements.length + ' Treasury cash movements')
  console.log('  • ' + buckets.length + ' Capital buckets')
  console.log('  • ' + facilities.length + ' Credit facilities')
  console.log('  • ' + drawdowns.length + ' Facility drawdowns')
  console.log('  • ' + decisions.length + ' Treasury decisions')
  console.log('  • ' + treasuryScenarios.length + ' Treasury scenarios')
  console.log('  • ' + netting.length + ' Netting opportunities')
  console.log('  • ' + assets.length + ' Assets')
  console.log('  • ' + depreciationEntries.length + ' Depreciation entries')
  console.log('  • ' + assetEvents.length + ' Asset events')
  console.log('  • ' + assetTransfers.length + ' Asset transfers')
  console.log('  • 1 Asset disposal')
  console.log('  • 1 CapEx budget with ' + capexItems.length + ' items')
  console.log('  • ' + costCenters.length + ' Cost centers')
  console.log('  • ' + projects.length + ' Projects')
  console.log('  • ' + milestones.length + ' Project milestones')
  console.log('  • ' + timeEntries.length + ' Time entries')
  console.log('  • ' + chargebacks.length + ' Internal chargebacks')
  console.log('  • ' + periods.length + ' Accounting periods')
  console.log('  • ' + checklistItems.length + ' Checklist items')
  console.log('  • ' + missingItems.length + ' Missing items')
  console.log('  • ' + adjustments.length + ' Period adjustments')
  console.log('  • ' + auditEntries.length + ' Audit entries')
  console.log('  • ' + customers.length + ' Customers')
  console.log('  • ' + contacts.length + ' Customer contacts')
  console.log('  • ' + payments.length + ' Customer payments')
  console.log('  • ' + revenueRecords.length + ' Revenue records')
  console.log('  • ' + riskIndicators.length + ' Risk indicators')
  console.log('\n🎉 Ready to use!')
  console.log('   Login: demo@primebalance.app')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
    await prisma.$disconnect()
  })