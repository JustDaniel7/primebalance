// src/lib/validation.ts
// Centralized Zod schemas for API request validation

import { z } from 'zod';

// =============================================================================
// Common Schemas
// =============================================================================

export const dateStringSchema = z.string().refine(
  (val) => !isNaN(new Date(val).getTime()),
  { message: 'Invalid date format' }
);

export const positiveNumberSchema = z.number().positive('Must be a positive number');
export const nonNegativeNumberSchema = z.number().nonnegative('Cannot be negative');

export const currencyCodeSchema = z.string().length(3, 'Currency code must be 3 characters');

export const emailSchema = z.string().email('Invalid email format').optional().or(z.literal(''));

// =============================================================================
// Invoice Schemas
// =============================================================================

export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Item description is required'),
  quantity: positiveNumberSchema,
  unitPrice: nonNegativeNumberSchema,
  unit: z.string().optional().default('pcs'),
  taxRate: nonNegativeNumberSchema.optional(),
});

export const createInvoiceSchema = z.object({
  // Customer info - support both formats
  customerName: z.string().min(1).max(200).optional(),
  customerEmail: emailSchema,
  recipient: z.object({
    name: z.string().min(1).max(200),
    email: emailSchema,
    address: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),

  // Dates
  invoiceDate: dateStringSchema,
  dueDate: dateStringSchema,
  serviceDate: dateStringSchema.optional(),
  servicePeriodStart: dateStringSchema.optional(),
  servicePeriodEnd: dateStringSchema.optional(),

  // Items
  items: z.array(invoiceItemSchema).min(1, 'At least one line item is required'),

  // Financial
  currency: currencyCodeSchema.optional().default('EUR'),
  taxRate: nonNegativeNumberSchema.optional().default(19),
  applyTax: z.boolean().optional().default(true),
  taxExemptReason: z.string().optional(),
  taxExemptNote: z.string().optional(),

  // Payment
  payment: z.object({
    method: z.string().optional(),
    dueInDays: z.number().optional(),
  }).optional(),

  // Meta
  notes: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),
  language: z.string().optional().default('en'),
  invoiceNumber: z.string().optional(),

  // Recurring
  isRecurring: z.boolean().optional().default(false),
  recurringInterval: z.string().optional(),
  nextRecurringDate: dateStringSchema.optional(),

  // Relations
  orderId: z.string().optional(),

  // Sender info
  sender: z.record(z.string(), z.unknown()).optional(),
  customerAddress: z.record(z.string(), z.unknown()).optional(),
}).refine(
  (data) => data.customerName || data.recipient?.name,
  { message: 'Customer name is required (customerName or recipient.name)', path: ['customerName'] }
);

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

// =============================================================================
// Customer Schemas
// =============================================================================

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(200),
  email: emailSchema,
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  taxId: z.string().max(50).optional(),
  vatNumber: z.string().max(50).optional(),

  // Address
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),

  // Business
  paymentTerms: z.number().optional(),
  creditLimit: nonNegativeNumberSchema.optional(),
  currency: currencyCodeSchema.optional(),

  // Meta
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'prospect', 'suspended']).optional().default('active'),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

// =============================================================================
// Order Schemas
// =============================================================================

export const orderItemSchema = z.object({
  description: z.string().min(1, 'Item description is required'),
  quantity: positiveNumberSchema,
  unitPrice: nonNegativeNumberSchema,
  unit: z.string().optional(),
  sku: z.string().optional(),
});

export const createOrderSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required'),
  customerId: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required').max(200),
  customerEmail: emailSchema,
  customerAddress: z.record(z.string(), z.unknown()).optional(),

  // Dates
  orderDate: dateStringSchema,
  expectedDeliveryDate: dateStringSchema.optional(),

  // Items
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),

  // Financial
  currency: currencyCodeSchema.optional().default('EUR'),
  subtotal: nonNegativeNumberSchema,
  taxAmount: nonNegativeNumberSchema.optional().default(0),
  discountAmount: nonNegativeNumberSchema.optional().default(0),
  total: nonNegativeNumberSchema,
  taxRate: nonNegativeNumberSchema.optional().default(0),
  totalQuantity: nonNegativeNumberSchema.optional().default(0),

  // Meta
  notes: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),

  // Recurring
  isRecurring: z.boolean().optional().default(false),
  recurringInterval: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// =============================================================================
// Liability Schemas
// =============================================================================

export const settlementSchema = z.object({
  amount: positiveNumberSchema,
  settlementType: z.enum(['partial', 'full']).optional().default('partial'),
  settlementDate: dateStringSchema.optional(),

  // Breakdown
  principalAmount: nonNegativeNumberSchema.optional(),
  interestAmount: nonNegativeNumberSchema.optional().default(0),
  feesAmount: nonNegativeNumberSchema.optional().default(0),
  penaltiesWaived: nonNegativeNumberSchema.optional().default(0),

  // References
  paymentId: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().max(2000).optional(),

  // FX
  fxRate: positiveNumberSchema.optional(),

  // Offset/Netting
  isOffset: z.boolean().optional().default(false),
  offsetReceivableId: z.string().optional(),
  nettingBatchId: z.string().optional(),
});

export type SettlementInput = z.infer<typeof settlementSchema>;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Validate request body against a Zod schema.
 * Returns { success: true, data } or { success: false, error }.
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body);

  if (!result.success) {
    // Get the first error message
    const firstError = result.error.issues[0];
    const path = firstError.path.length > 0 ? `${firstError.path.join('.')}: ` : '';
    return {
      success: false,
      error: `${path}${firstError.message}`,
    };
  }

  return { success: true, data: result.data };
}

/**
 * Validate and return all errors (useful for form validation).
 */
export function validateRequestAllErrors<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; errors: Array<{ path: string; message: string }> } {
  const result = schema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }

  return { success: true, data: result.data };
}
