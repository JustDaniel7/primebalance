// src/types/api.ts
// Type definitions for API routes to eliminate unsafe `any` types
// These provide proper typing for Prisma where clauses and API responses

import { Prisma } from '@/generated/prisma/client'

// =============================================================================
// PRISMA WHERE INPUT TYPES
// =============================================================================

// Export commonly used Prisma where input types for type-safe query building
export type InvoiceWhereInput = Prisma.InvoiceWhereInput
export type CustomerWhereInput = Prisma.CustomerWhereInput
export type TransactionWhereInput = Prisma.TransactionWhereInput
export type LiabilityWhereInput = Prisma.LiabilityWhereInput
export type ReceivableWhereInput = Prisma.ReceivableWhereInput
export type OrderWhereInput = Prisma.OrderWhereInput
export type AssetWhereInput = Prisma.AssetWhereInput
export type ArchiveRecordWhereInput = Prisma.ArchiveRecordWhereInput
export type ProjectWhereInput = Prisma.ProjectWhereInput

// =============================================================================
// COMMON FILTER TYPES
// =============================================================================

export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface DateRangeFilter {
  start?: Date | string
  end?: Date | string
}

export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CommonQueryParams extends PaginationParams, SortParams {
  search?: string
  status?: string | string[]
}

// =============================================================================
// INVOICE TYPES
// =============================================================================

export interface InvoiceRecipient {
  name?: string
  email?: string
  address?: string
  phone?: string
  company?: string
  taxId?: string
}

export interface InvoiceLineItem {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
  taxRate?: number
  taxAmount?: number
  discount?: number
  sku?: string
  unit?: string
}

export interface InvoiceUpdateData {
  customerName?: string
  recipient?: InvoiceRecipient
  status?: string
  invoiceDate?: Date
  dueDate?: Date
  items?: InvoiceLineItem[]
  notes?: string
  terms?: string
  currency?: string
  subtotal?: number
  taxAmount?: number
  total?: number
  metadata?: Record<string, unknown>
}

// =============================================================================
// LIABILITY TYPES
// =============================================================================

export interface LiabilityUpdateData {
  name?: string
  description?: string
  status?: string
  primaryClass?: string
  secondaryClass?: string
  principalAmount?: number
  totalOutstanding?: number
  currency?: string
  counterpartyId?: string
  counterpartyName?: string
  inceptionDate?: Date
  maturityDate?: Date
  interestRate?: number
  paymentFrequency?: string
  notes?: string
  metadata?: Record<string, unknown>
}

export interface LiabilitySettlementBreakdown {
  principal?: number
  interest?: number
  fees?: number
  penalties?: number
  discount?: number
  [key: string]: number | undefined
}

// =============================================================================
// PROJECT TYPES
// =============================================================================

export interface ProjectUpdateData {
  name?: string
  description?: string
  status?: string
  startDate?: Date
  endDate?: Date
  budget?: number
  metadata?: Record<string, unknown>
}

// =============================================================================
// ARCHIVE TYPES
// =============================================================================

export interface ArchiveRecordData {
  documentType: string
  title: string
  description?: string
  sourceId?: string
  sourceType?: string
  metadata?: Record<string, unknown>
  retentionDate?: Date
  tags?: string[]
}

// =============================================================================
// IMPORT/EXPORT TYPES
// =============================================================================

export interface ImportResult {
  success: boolean
  processed: number
  created: number
  updated: number
  failed: number
  errors: ImportError[]
  warnings: ImportWarning[]
}

export interface ImportError {
  row: number
  field?: string
  message: string
  value?: unknown
}

export interface ImportWarning {
  row: number
  field?: string
  message: string
}

export interface ImportMapping {
  [csvField: string]: string
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  meta?: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
  }
}

export interface ApiErrorResponse {
  success: false
  error: string
  details?: string
  code?: string
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Build a type-safe where clause for organization-scoped queries
 */
export function buildOrgWhere<T extends { organizationId?: string }>(
  organizationId: string,
  additionalFilters?: Partial<T>
): T {
  return {
    organizationId,
    ...additionalFilters,
  } as T
}

/**
 * Parse pagination parameters with defaults
 */
export function parsePaginationParams(
  params: URLSearchParams,
  defaults: { page: number; limit: number } = { page: 1, limit: 20 }
): { skip: number; take: number; page: number; limit: number } {
  const page = Math.max(1, parseInt(params.get('page') || String(defaults.page)))
  const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') || String(defaults.limit))))

  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit,
  }
}

/**
 * Parse sort parameters with validation
 */
export function parseSortParams(
  params: URLSearchParams,
  allowedFields: string[],
  defaults: { field: string; order: 'asc' | 'desc' } = { field: 'createdAt', order: 'desc' }
): { orderBy: Record<string, 'asc' | 'desc'> } {
  const sortBy = params.get('sortBy') || defaults.field
  const sortOrder = (params.get('sortOrder') === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc'

  // Validate sort field to prevent injection
  const field = allowedFields.includes(sortBy) ? sortBy : defaults.field

  return {
    orderBy: { [field]: sortOrder },
  }
}

/**
 * Parse date range from query parameters
 */
export function parseDateRange(params: URLSearchParams): DateRangeFilter | null {
  const start = params.get('startDate') || params.get('start')
  const end = params.get('endDate') || params.get('end')

  if (!start && !end) return null

  const filter: DateRangeFilter = {}

  if (start) {
    const startDate = new Date(start)
    if (!isNaN(startDate.getTime())) {
      filter.start = startDate
    }
  }

  if (end) {
    const endDate = new Date(end)
    if (!isNaN(endDate.getTime())) {
      filter.end = endDate
    }
  }

  return Object.keys(filter).length > 0 ? filter : null
}
