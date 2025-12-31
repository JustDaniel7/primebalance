// src/app/api/search/route.ts
// Global search API endpoint - searches across all tables

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}

interface SearchResponse {
  results: SearchResult[];
  grouped: Record<string, SearchResult[]>;
  total: number;
  query: string;
}

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  if (!query || query.length < 2) {
    return badRequest('Search query must be at least 2 characters');
  }

  const orgId = user.organizationId;
  const results: SearchResult[] = [];

  // Search in parallel for better performance
  const [
    customers,
    suppliers,
    invoices,
    orders,
    transactions,
    receipts,
    projects,
    assets,
    liabilities,
    archives,
    accounts,
    nettingAgreements,
    treasuryAccounts,
    kpis,
    receivables,
    inventoryItems,
  ] = await Promise.all([
    // Customers
    prisma.customer.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { customerNumber: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { legalName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: { id: true, name: true, customerNumber: true, email: true, type: true, status: true },
    }),

    // Suppliers
    prisma.supplier.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { supplierNumber: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: { id: true, name: true, supplierNumber: true, email: true, category: true, status: true },
    }),

    // Invoices
    prisma.invoice.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { invoiceNumber: { contains: query, mode: 'insensitive' } },
          { customerName: { contains: query, mode: 'insensitive' } },
          { reference: { contains: query, mode: 'insensitive' } },
          { notes: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: { id: true, invoiceNumber: true, customerName: true, total: true, currency: true, status: true },
    }),

    // Orders
    prisma.order.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { orderNumber: { contains: query, mode: 'insensitive' } },
          { customerName: { contains: query, mode: 'insensitive' } },
          { notes: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: { id: true, orderNumber: true, customerName: true, total: true, currency: true, status: true },
    }),

    // Transactions
    prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { description: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: { id: true, description: true, amount: true, currency: true, type: true, date: true },
    }),

    // Receipts
    prisma.receipt.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { fileName: { contains: query, mode: 'insensitive' } },
          { vendor: { contains: query, mode: 'insensitive' } },
          { extractedText: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: { id: true, fileName: true, vendor: true, amount: true, date: true, status: true },
    }),

    // Projects
    prisma.project.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: { id: true, name: true, code: true, status: true, budgetAmount: true, currency: true },
    }),

    // Assets
    prisma.asset.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { assetNumber: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { serialNumber: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: { id: true, name: true, assetNumber: true, category: true, currentBookValue: true, currency: true, status: true },
    }),

    // Liabilities
    prisma.liability.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { liabilityId: { contains: query, mode: 'insensitive' } },
          { counterpartyName: { contains: query, mode: 'insensitive' } },
          { legalReference: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: { id: true, liabilityId: true, counterpartyName: true, totalOutstanding: true, currency: true, status: true, primaryClass: true },
    }),

    // Archive Records
    prisma.archiveRecord.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { archiveRecordId: { contains: query, mode: 'insensitive' } },
          { counterpartyName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: { id: true, title: true, objectType: true, category: true, archivedAt: true },
    }),

    // Financial Accounts
    prisma.financialAccount.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { accountNumber: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: { id: true, name: true, accountNumber: true, type: true, balance: true, currency: true },
    }),

    // Netting Agreements
    prisma.nettingAgreement.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { agreementNumber: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: { id: true, agreementNumber: true, name: true, status: true, baseCurrency: true, type: true },
    }),

    // Treasury Accounts
    prisma.treasuryAccount.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { accountNumber: { contains: query, mode: 'insensitive' } },
          { bankName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: { id: true, name: true, accountNumber: true, bankName: true, currentBalance: true, currency: true, type: true },
    }),

    // KPIs
    prisma.kPI.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: { id: true, name: true, category: true, currentValue: true, unit: true, status: true },
    }),

    // Receivables
    prisma.receivable.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { debtorName: { contains: query, mode: 'insensitive' } },
          { debtorEmail: { contains: query, mode: 'insensitive' } },
          { originReferenceId: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: { id: true, debtorName: true, originType: true, outstandingAmount: true, currency: true, status: true },
    }),

    // Inventory Items
    prisma.inventoryItem.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: { id: true, name: true, sku: true, quantityOnHand: true, unitCost: true, currency: true },
    }),
  ]);

  // Transform results into unified format
  customers.forEach((c) => {
    results.push({
      id: c.id,
      type: 'customer',
      title: c.name,
      subtitle: c.customerNumber,
      description: c.email || undefined,
      url: `/dashboard/customers?id=${c.id}`,
      metadata: { status: c.status, type: c.type },
    });
  });

  suppliers.forEach((s) => {
    results.push({
      id: s.id,
      type: 'supplier',
      title: s.name,
      subtitle: s.supplierNumber,
      description: s.email || undefined,
      url: `/dashboard/suppliers?id=${s.id}`,
      metadata: { status: s.status, category: s.category },
    });
  });

  invoices.forEach((i) => {
    results.push({
      id: i.id,
      type: 'invoice',
      title: i.invoiceNumber,
      subtitle: i.customerName || undefined,
      description: `${i.currency} ${Number(i.total).toLocaleString()}`,
      url: `/dashboard/invoices?id=${i.id}`,
      metadata: { status: i.status, total: Number(i.total), currency: i.currency },
    });
  });

  orders.forEach((o) => {
    results.push({
      id: o.id,
      type: 'order',
      title: o.orderNumber,
      subtitle: o.customerName,
      description: `${o.currency} ${Number(o.total).toLocaleString()}`,
      url: `/dashboard/orders?id=${o.id}`,
      metadata: { status: o.status, total: Number(o.total), currency: o.currency },
    });
  });

  transactions.forEach((t) => {
    results.push({
      id: t.id,
      type: 'transaction',
      title: t.description,
      subtitle: t.type,
      description: `${t.currency} ${t.amount.toLocaleString()}`,
      url: `/dashboard/transactions?id=${t.id}`,
      metadata: { amount: t.amount, type: t.type, date: t.date },
    });
  });

  receipts.forEach((r) => {
    results.push({
      id: r.id,
      type: 'receipt',
      title: r.fileName,
      subtitle: r.vendor || undefined,
      description: r.amount ? `${r.amount.toLocaleString()}` : undefined,
      url: `/dashboard/receipts?id=${r.id}`,
      metadata: { status: r.status, date: r.date },
    });
  });

  projects.forEach((p) => {
    results.push({
      id: p.id,
      type: 'project',
      title: p.name,
      subtitle: p.code || undefined,
      description: p.budgetAmount ? `${p.currency} ${Number(p.budgetAmount).toLocaleString()}` : undefined,
      url: `/dashboard/projects?id=${p.id}`,
      metadata: { status: p.status },
    });
  });

  assets.forEach((a) => {
    results.push({
      id: a.id,
      type: 'asset',
      title: a.name,
      subtitle: a.assetNumber || undefined,
      description: a.currentBookValue ? `${a.currency} ${Number(a.currentBookValue).toLocaleString()}` : undefined,
      url: `/dashboard/assets?id=${a.id}`,
      metadata: { status: a.status, category: a.category },
    });
  });

  liabilities.forEach((l) => {
    results.push({
      id: l.id,
      type: 'liability',
      title: l.counterpartyName || l.liabilityId,
      subtitle: l.primaryClass || undefined,
      description: l.totalOutstanding ? `${l.currency} ${Number(l.totalOutstanding).toLocaleString()}` : undefined,
      url: `/dashboard/liabilities?id=${l.id}`,
      metadata: { status: l.status },
    });
  });

  archives.forEach((a) => {
    results.push({
      id: a.id,
      type: 'archive',
      title: a.title,
      subtitle: a.objectType,
      description: a.category,
      url: `/dashboard/archive?id=${a.id}`,
      metadata: { category: a.category, archivedAt: a.archivedAt },
    });
  });

  accounts.forEach((a) => {
    results.push({
      id: a.id,
      type: 'account',
      title: a.name,
      subtitle: a.accountNumber,
      description: `${a.currency} ${a.balance.toLocaleString()}`,
      url: `/dashboard/accounts?id=${a.id}`,
      metadata: { type: a.type, balance: a.balance },
    });
  });

  nettingAgreements.forEach((n) => {
    results.push({
      id: n.id,
      type: 'netting',
      title: n.name || n.agreementNumber,
      subtitle: n.type,
      url: `/dashboard/netting?id=${n.id}`,
      metadata: { status: n.status, currency: n.baseCurrency },
    });
  });

  treasuryAccounts.forEach((t) => {
    results.push({
      id: t.id,
      type: 'treasury',
      title: t.name,
      subtitle: t.bankName || t.accountNumber || undefined,
      description: t.currentBalance ? `${t.currency} ${Number(t.currentBalance).toLocaleString()}` : undefined,
      url: `/dashboard/treasury?id=${t.id}`,
      metadata: { type: t.type, balance: Number(t.currentBalance) },
    });
  });

  kpis.forEach((k) => {
    results.push({
      id: k.id,
      type: 'kpi',
      title: k.name,
      subtitle: k.category || undefined,
      description: k.currentValue ? `${k.currentValue}${k.unit || ''}` : undefined,
      url: `/dashboard/kpi?id=${k.id}`,
      metadata: { status: k.status },
    });
  });

  receivables.forEach((r) => {
    results.push({
      id: r.id,
      type: 'receivable',
      title: r.debtorName || 'Receivable',
      subtitle: r.originType,
      description: r.outstandingAmount ? `${r.currency} ${Number(r.outstandingAmount).toLocaleString()}` : undefined,
      url: `/dashboard/receivables?id=${r.id}`,
      metadata: { status: r.status },
    });
  });

  inventoryItems.forEach((i) => {
    results.push({
      id: i.id,
      type: 'inventory',
      title: i.name,
      subtitle: i.sku || undefined,
      description: `Qty: ${Number(i.quantityOnHand).toLocaleString()}`,
      url: `/dashboard/inventory?id=${i.id}`,
      metadata: { quantity: Number(i.quantityOnHand), unitCost: Number(i.unitCost) },
    });
  });

  // Group results by type
  const grouped: Record<string, SearchResult[]> = {};
  results.forEach((result) => {
    if (!grouped[result.type]) {
      grouped[result.type] = [];
    }
    grouped[result.type].push(result);
  });

  const response: SearchResponse = {
    results: results.slice(0, limit),
    grouped,
    total: results.length,
    query,
  };

  return NextResponse.json(response);
}
