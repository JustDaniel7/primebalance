// prisma/seed.ts
// Comprehensive seed for all PrimeBalance modules

// prisma/seed.ts
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...\n')

  // =============================================================================
  // 1. ORGANIZATION
  // =============================================================================
  console.log('📁 Creating Organization...')
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
  
  // First pass: create accounts without parent references
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

  // Second pass: set parent relationships
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
    { date: '2025-01-06', description: 'ETH Sale to EUR', amount: 5500, type: 'income', category: 'Crypto Exchange', account: '1150', status: 'completed', tags: ['crypto'], tokenized: true, txHash: '0x7a8b...9c0d' },
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
  // 6. CHAT CHANNELS
  // =============================================================================
  console.log('\n💬 Creating Chat Channels...')
  const channels = [
    { name: 'general', description: 'General team discussion' },
    { name: 'finance', description: 'Finance and accounting topics' },
    { name: 'sales', description: 'Sales team updates' },
    { name: 'engineering', description: 'Technical discussions' },
  ]

  for (const ch of channels) {
    await prisma.chatChannel.upsert({
      where: { organizationId_name: { organizationId: org.id, name: ch.name } },
      update: {},
      create: { name: ch.name, description: ch.description, organizationId: org.id },
    })
  }
  console.log('  ✓ Created', channels.length, 'channels')

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
      where: { userId_address: { userId: user.id, address: w.address } },
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

  for (const lib of liabilities) {
    const utilizationRate = lib.creditLimit ? (lib.outstandingAmount / lib.creditLimit) * 100 : null
    
    await prisma.liability.create({
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
  }
  console.log('  ✓ Created', liabilities.length, 'liabilities')

  // =============================================================================
  // 15. INVENTORY
  // =============================================================================
  console.log('\n📦 Creating Inventory...')
  const inventory = [
    {
      sku: 'SW-LIC-ENT',
      name: 'Enterprise Software License',
      type: 'finished_goods',
      category: 'Software',
      quantityOnHand: 999,
      quantityAvailable: 999,
      unitCost: 2500,
      sellingPrice: 15000,
      minimumStock: 1,
      reorderPoint: 1,
    },
    {
      sku: 'SW-LIC-PRO',
      name: 'Professional Software License',
      type: 'finished_goods',
      category: 'Software',
      quantityOnHand: 999,
      quantityAvailable: 999,
      unitCost: 800,
      sellingPrice: 5000,
      minimumStock: 1,
      reorderPoint: 1,
    },
    {
      sku: 'HW-LAPTOP-01',
      name: 'MacBook Pro 16"',
      type: 'merchandise',
      category: 'Hardware',
      quantityOnHand: 15,
      quantityAvailable: 12,
      quantityReserved: 3,
      unitCost: 2200,
      sellingPrice: 2800,
      minimumStock: 5,
      reorderPoint: 8,
      warehouseName: 'Main Warehouse',
      location: 'A-1-01',
    },
    {
      sku: 'HW-MONITOR-01',
      name: 'Dell UltraSharp 32"',
      type: 'merchandise',
      category: 'Hardware',
      quantityOnHand: 25,
      quantityAvailable: 25,
      unitCost: 650,
      sellingPrice: 850,
      minimumStock: 10,
      reorderPoint: 15,
      warehouseName: 'Main Warehouse',
      location: 'A-1-02',
    },
    {
      sku: 'HW-KB-01',
      name: 'Mechanical Keyboard',
      type: 'merchandise',
      category: 'Accessories',
      quantityOnHand: 50,
      quantityAvailable: 48,
      quantityReserved: 2,
      unitCost: 85,
      sellingPrice: 149,
      minimumStock: 20,
      reorderPoint: 25,
      warehouseName: 'Main Warehouse',
      location: 'B-2-01',
    },
    {
      sku: 'CONS-PAPER-01',
      name: 'Printer Paper A4',
      type: 'consumables',
      category: 'Office Supplies',
      quantityOnHand: 100,
      quantityAvailable: 100,
      unitCost: 4.50,
      minimumStock: 50,
      reorderPoint: 60,
      unitOfMeasure: 'pack',
      warehouseName: 'Main Warehouse',
      location: 'C-1-01',
    },
    {
      sku: 'HW-LAPTOP-02',
      name: 'ThinkPad X1 Carbon',
      type: 'merchandise',
      category: 'Hardware',
      quantityOnHand: 3,
      quantityAvailable: 3,
      unitCost: 1800,
      sellingPrice: 2400,
      minimumStock: 5,
      reorderPoint: 8,
      warehouseName: 'Main Warehouse',
      location: 'A-1-03',
      status: 'active',
    },
  ]

  for (const item of inventory) {
    const totalValue = item.quantityOnHand * item.unitCost
    
    await prisma.inventoryItem.create({
      data: {
        sku: item.sku,
        name: item.name,
        type: item.type,
        category: item.category,
        status: item.status || 'active',
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
  }
  console.log('  ✓ Created', inventory.length, 'inventory items')

  // =============================================================================
  // 16. RECEIVABLES
  // =============================================================================
  console.log('\n💵 Creating Receivables...')
  const receivables = [
    {
      originType: 'invoice',
      originReferenceId: 'INV-2025-002',
      debtorName: 'TechStart GmbH',
      debtorEmail: 'finance@techstart.de',
      originalAmount: 17232,
      outstandingAmount: 17232,
      paidAmount: 0,
      issueDate: '2025-01-12',
      dueDate: '2025-01-27',
      status: 'open',
      riskLevel: 'low',
      reference: 'Consulting Services January',
    },
    {
      originType: 'invoice',
      originReferenceId: 'INV-2024-089',
      debtorName: 'SlowPay Ltd',
      debtorEmail: 'accounts@slowpay.co.uk',
      originalAmount: 22617,
      outstandingAmount: 22617,
      paidAmount: 0,
      issueDate: '2024-12-01',
      dueDate: '2024-12-31',
      status: 'overdue',
      riskLevel: 'high',
      daysOutstanding: 16,
      agingBucket: '1-30',
      reference: 'Development Services Q4',
      collectionStage: 'reminder_1',
    },
    {
      originType: 'invoice',
      originReferenceId: 'INV-2024-075',
      debtorName: 'LateClient AG',
      debtorEmail: 'ap@lateclient.ch',
      originalAmount: 35000,
      outstandingAmount: 15000,
      paidAmount: 20000,
      issueDate: '2024-10-15',
      dueDate: '2024-11-15',
      status: 'partially_paid',
      riskLevel: 'medium',
      daysOutstanding: 62,
      agingBucket: '61-90',
      reference: 'Annual License',
    },
    {
      originType: 'contract',
      originReferenceId: 'CONTRACT-2024-022',
      debtorName: 'BigCorp International',
      debtorEmail: 'payables@bigcorp.com',
      originalAmount: 85000,
      outstandingAmount: 0,
      paidAmount: 85000,
      issueDate: '2024-11-01',
      dueDate: '2024-12-01',
      status: 'paid',
      riskLevel: 'low',
      reference: 'Q4 Project Milestone',
    },
  ]

  for (const rec of receivables) {
    const today = new Date()
    const dueDate = new Date(rec.dueDate)
    const daysOut = rec.daysOutstanding || Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
    
    let agingBucket = 'current'
    if (daysOut > 90) agingBucket = '90+'
    else if (daysOut > 60) agingBucket = '61-90'
    else if (daysOut > 30) agingBucket = '31-60'
    else if (daysOut > 0) agingBucket = '1-30'
    
    await prisma.receivable.create({
      data: {
        originType: rec.originType,
        originReferenceId: rec.originReferenceId,
        debtorName: rec.debtorName,
        debtorEmail: rec.debtorEmail,
        currency: 'EUR',
        originalAmount: rec.originalAmount,
        outstandingAmount: rec.outstandingAmount,
        paidAmount: rec.paidAmount,
        issueDate: new Date(rec.issueDate),
        dueDate: new Date(rec.dueDate),
        lastActivityDate: new Date(),
        status: rec.status,
        riskLevel: rec.riskLevel,
        daysOutstanding: daysOut,
        agingBucket: rec.agingBucket || agingBucket,
        reference: rec.reference,
        collectionStage: rec.collectionStage,
        autoRemindersEnabled: true,
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', receivables.length, 'receivables')

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
    {
      name: 'Revolving Credit Facility',
      type: 'revolving',
      lenderName: 'UBS AG',
      facilityLimit: 200000,
      drawnAmount: 25000,
      interestRate: 4.5,
      interestType: 'variable',
      startDate: '2024-01-01',
      maturityDate: '2026-12-31',
      commitmentFeeBps: 25,
    },
    {
      name: 'Term Loan Facility',
      type: 'term',
      lenderName: 'Credit Suisse',
      facilityLimit: 150000,
      drawnAmount: 120000,
      interestRate: 3.5,
      interestType: 'fixed',
      startDate: '2023-06-01',
      maturityDate: '2028-06-01',
    },
    {
      name: 'Overdraft Facility',
      type: 'overdraft',
      lenderName: 'UBS AG',
      facilityLimit: 50000,
      drawnAmount: 0,
      interestRate: 8.5,
      interestType: 'variable',
      startDate: '2024-01-01',
      maturityDate: '2025-12-31',
    },
  ]

  for (const fac of facilities) {
    const available = fac.facilityLimit - fac.drawnAmount
    const utilization = (fac.drawnAmount / fac.facilityLimit) * 100
    
    await prisma.creditFacility.create({
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
  }
  console.log('  ✓ Created', facilities.length, 'credit facilities')

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
  const scenarios = [
    {
      name: 'Baseline Forecast',
      type: 'baseline',
      isBaseline: true,
      horizonDays: 90,
      assumptions: { revenueGrowth: 0.05, expenseGrowth: 0.03, collectionDays: 30 },
      minimumCashAmount: 85000,
      endingCashAmount: 145000,
    },
    {
      name: 'Optimistic Scenario',
      type: 'best_case',
      horizonDays: 90,
      assumptions: { revenueGrowth: 0.15, expenseGrowth: 0.02, collectionDays: 25 },
      minimumCashAmount: 95000,
      endingCashAmount: 185000,
      probabilityWeight: 20,
    },
    {
      name: 'Pessimistic Scenario',
      type: 'worst_case',
      horizonDays: 90,
      assumptions: { revenueGrowth: -0.10, expenseGrowth: 0.05, collectionDays: 45 },
      minimumCashAmount: 45000,
      endingCashAmount: 75000,
      probabilityWeight: 15,
    },
    {
      name: 'Major Client Loss',
      type: 'stress_test',
      horizonDays: 90,
      assumptions: { revenueGrowth: -0.25, expenseGrowth: 0, collectionDays: 60, clientChurn: 0.20 },
      minimumCashAmount: 25000,
      endingCashAmount: 40000,
      riskScore: 85,
    },
  ]

  const today = new Date()
  for (const scen of scenarios) {
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
  console.log('  ✓ Created', scenarios.length, 'treasury scenarios')

  // =============================================================================
  // 22. NETTING OPPORTUNITIES
  // =============================================================================
  console.log('\n🔄 Creating Netting Opportunities...')
  const netting = [
    {
      entityAName: 'Demo Company GmbH',
      entityBName: 'Demo Tech AG',
      amountAToB: 15000,
      amountBToA: 8500,
      netAmount: 6500,
      netDirection: 'a_to_b',
    },
    {
      entityAName: 'Demo Company GmbH',
      entityBName: 'Demo Services LLC',
      amountAToB: 22000,
      amountBToA: 18000,
      netAmount: 4000,
      netDirection: 'a_to_b',
    },
  ]

  for (const n of netting) {
    const grossAmount = n.amountAToB + n.amountBToA
    const savingsAmount = grossAmount - n.netAmount
    const savingsPercent = (savingsAmount / grossAmount) * 100
    
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 30)
    
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
        validUntil,
        organizationId: org.id,
      },
    })
  }
  console.log('  ✓ Created', netting.length, 'netting opportunities')

  // =============================================================================
  // 23. ASSETS
  // =============================================================================
  console.log('\n🏗️ Creating Assets...')
  const assets = [
    {
      assetNumber: 'AST-001',
      name: 'Office Building - Zurich',
      category: 'property_plant_equipment',
      assetClass: 'buildings',
      acquisitionDate: '2020-01-15',
      acquisitionCost: 850000,
      residualValue: 100000,
      usefulLifeMonths: 480,
      depreciationMethod: 'straight_line',
      locationName: 'Zurich HQ',
      accumulatedDepreciation: 93750,
    },
    {
      assetNumber: 'AST-002',
      name: 'Company Vehicle - Tesla Model 3',
      category: 'property_plant_equipment',
      assetClass: 'vehicles',
      acquisitionDate: '2023-06-01',
      acquisitionCost: 52000,
      residualValue: 15000,
      usefulLifeMonths: 60,
      depreciationMethod: 'straight_line',
      locationName: 'Zurich HQ',
      serialNumber: '5YJ3E1EA1PF123456',
      accumulatedDepreciation: 11100,
    },
    {
      assetNumber: 'AST-003',
      name: 'Server Infrastructure',
      category: 'property_plant_equipment',
      assetClass: 'equipment',
      acquisitionDate: '2024-01-15',
      acquisitionCost: 45000,
      residualValue: 5000,
      usefulLifeMonths: 48,
      depreciationMethod: 'straight_line',
      locationName: 'Data Center',
      accumulatedDepreciation: 10000,
    },
    {
      assetNumber: 'AST-004',
      name: 'Office Furniture Set',
      category: 'property_plant_equipment',
      assetClass: 'furniture',
      acquisitionDate: '2022-03-01',
      acquisitionCost: 35000,
      residualValue: 2000,
      usefulLifeMonths: 84,
      depreciationMethod: 'straight_line',
      locationName: 'Zurich HQ',
      accumulatedDepreciation: 13571,
    },
    {
      assetNumber: 'AST-005',
      name: 'Software Platform - PrimeBalance',
      category: 'intangible',
      assetClass: 'software',
      acquisitionDate: '2021-06-01',
      acquisitionCost: 250000,
      residualValue: 0,
      usefulLifeMonths: 60,
      depreciationMethod: 'straight_line',
      accumulatedDepreciation: 175000,
    },
    {
      assetNumber: 'AST-006',
      name: 'Patent - Data Processing Method',
      category: 'intangible',
      assetClass: 'patents',
      acquisitionDate: '2022-01-01',
      acquisitionCost: 75000,
      residualValue: 0,
      usefulLifeMonths: 180,
      depreciationMethod: 'straight_line',
      accumulatedDepreciation: 15000,
    },
    {
      assetNumber: 'AST-007',
      name: 'MacBook Pro Fleet (10 units)',
      category: 'property_plant_equipment',
      assetClass: 'equipment',
      acquisitionDate: '2024-06-01',
      acquisitionCost: 28000,
      residualValue: 4000,
      usefulLifeMonths: 36,
      depreciationMethod: 'straight_line',
      locationName: 'Zurich HQ',
      quantity: 10,
      accumulatedDepreciation: 4667,
    },
  ]

  for (const asset of assets) {
    const currentBookValue = asset.acquisitionCost - asset.accumulatedDepreciation
    const depreciableAmount = asset.acquisitionCost - asset.residualValue
    const monthlyDep = depreciableAmount / asset.usefulLifeMonths
    
    const status = currentBookValue <= asset.residualValue ? 'fully_depreciated' : 'active'
    
    await prisma.asset.create({
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
  }
  console.log('  ✓ Created', assets.length, 'assets')

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
  // DONE
  // =============================================================================
  console.log('\n' + '='.repeat(60))
  console.log('✅ Database seeding completed successfully!')
  console.log('='.repeat(60))
  console.log('\nSummary:')
  console.log('  • 1 Organization')
  console.log('  • 1 User with settings')
  console.log('  • ' + Object.keys(accountMap).length + ' Financial accounts')
  console.log('  • ' + transactions.length + ' Transactions')
  console.log('  • ' + receipts.length + ' Receipts')
  console.log('  • ' + channels.length + ' Chat channels')
  console.log('  • ' + entities.length + ' Corporate entities')
  console.log('  • ' + wallets.length + ' Wallets')
  console.log('  • ' + suggestions.length + ' AI suggestions')
  console.log('  • ' + reports.length + ' Saved reports')
  console.log('  • ' + invoices.length + ' Invoices')
  console.log('  • ' + orders.length + ' Orders')
  console.log('  • ' + archiveItems.length + ' Archive items')
  console.log('  • ' + liabilities.length + ' Liabilities')
  console.log('  • ' + inventory.length + ' Inventory items')
  console.log('  • ' + receivables.length + ' Receivables')
  console.log('  • ' + treasuryAccounts.length + ' Treasury accounts')
  console.log('  • ' + buckets.length + ' Capital buckets')
  console.log('  • ' + facilities.length + ' Credit facilities')
  console.log('  • ' + decisions.length + ' Treasury decisions')
  console.log('  • ' + scenarios.length + ' Treasury scenarios')
  console.log('  • ' + netting.length + ' Netting opportunities')
  console.log('  • ' + assets.length + ' Assets')
  console.log('  • 1 CapEx budget with ' + capexItems.length + ' items')
  console.log('\n🎉 Ready to use!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })