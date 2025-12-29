# PrimeBalance Design Framework

This document defines the standardized structure for all components, stores, types, and API routes in the PrimeBalance codebase.

---

## Table of Contents

1. [Zustand Stores](#1-zustand-stores)
2. [Type Definitions](#2-type-definitions)
3. [API Routes](#3-api-routes)
4. [Frontend Components](#4-frontend-components)
5. [Naming Conventions](#5-naming-conventions)

---

## 1. Zustand Stores

**File naming**: `{feature}-store.ts` (kebab-case)
**Location**: `src/store/`

### Standard Structure

```typescript
// =============================================================================
// {FEATURE_NAME} STORE
// src/store/{feature}-store.ts
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { /* types */ } from '@/types/{feature}';

// =============================================================================
// API MAPPERS
// =============================================================================

function mapApiTo{Entity}(api: Record<string, unknown>): {Entity} {
  return {
    id: api.id as string,
    // ... map all fields with type casting and defaults
  };
}

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface {Feature}State {
  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------
  {entities}: {Entity}[];
  current{Entity}: {Entity} | null;
  // ... related data arrays

  // ---------------------------------------------------------------------------
  // Pagination (if applicable)
  // ---------------------------------------------------------------------------
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // ---------------------------------------------------------------------------
  // Filters (if applicable)
  // ---------------------------------------------------------------------------
  filters: {Entity}Filters;

  // ---------------------------------------------------------------------------
  // UI State
  // ---------------------------------------------------------------------------
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  selectedIds: string[];

  // ---------------------------------------------------------------------------
  // Actions - Fetch
  // ---------------------------------------------------------------------------
  fetch{Entities}: (filters?: {Entity}Filters) => Promise<void>;
  fetch{Entity}: (id: string) => Promise<void>;

  // ---------------------------------------------------------------------------
  // Actions - CRUD
  // ---------------------------------------------------------------------------
  create{Entity}: (data: Create{Entity}Request) => Promise<{Entity} | null>;
  update{Entity}: (id: string, data: Update{Entity}Request) => Promise<void>;
  delete{Entity}: (id: string) => Promise<void>;

  // ---------------------------------------------------------------------------
  // Actions - Workflow (domain-specific)
  // ---------------------------------------------------------------------------
  // e.g., confirmInvoice, approveOrder, etc.

  // ---------------------------------------------------------------------------
  // Actions - Selection & UI
  // ---------------------------------------------------------------------------
  select{Entity}: (id: string | null) => void;
  setFilters: (filters: Partial<{Entity}Filters>) => void;
  clearFilters: () => void;
  clearError: () => void;

  // ---------------------------------------------------------------------------
  // Getters (computed/derived data)
  // ---------------------------------------------------------------------------
  get{Entity}ById: (id: string) => {Entity} | undefined;
  getAnalytics: () => {Entity}Analytics;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  {entities}: [],
  current{Entity}: null,
  pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
  filters: {},
  isLoading: false,
  error: null,
  isInitialized: false,
  selectedIds: [],
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const use{Feature}Store = create<{Feature}State>()(
  persist(
    (set, get) => ({
      ...initialState,

      // =========================================================================
      // FETCH ACTIONS
      // =========================================================================

      fetch{Entities}: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/{entities}');
          if (!res.ok) throw new Error('Failed to fetch {entities}');
          const data = await res.json();

          const {entities} = (data.{entities} || []).map(mapApiTo{Entity});
          set({
            {entities},
            pagination: data.pagination || initialState.pagination,
            isLoading: false,
            isInitialized: true
          });
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
            isInitialized: true
          });
        }
      },

      // =========================================================================
      // CRUD ACTIONS
      // =========================================================================

      create{Entity}: async (data) => {
        try {
          const res = await fetch('/api/{entities}', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('Failed to create {entity}');
          const created = await res.json();
          const {entity} = mapApiTo{Entity}(created);
          set((state) => ({ {entities}: [...state.{entities}, {entity}] }));
          return {entity};
        } catch (error) {
          console.error('Failed to create {entity}:', error);
          return null;
        }
      },

      update{Entity}: async (id, data) => {
        // Optimistic update
        set((state) => ({
          {entities}: state.{entities}.map((e) =>
            e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e
          ),
        }));

        try {
          await fetch(`/api/{entities}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
        } catch (error) {
          console.error('Failed to update {entity}:', error);
          get().fetch{Entities}(); // Rollback by refetching
        }
      },

      delete{Entity}: async (id) => {
        try {
          const res = await fetch(`/api/{entities}/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Failed to delete {entity}');
          set((state) => ({
            {entities}: state.{entities}.filter((e) => e.id !== id),
            current{Entity}: state.current{Entity}?.id === id ? null : state.current{Entity},
          }));
        } catch (error) {
          console.error('Failed to delete {entity}:', error);
        }
      },

      // =========================================================================
      // SELECTION & UI ACTIONS
      // =========================================================================

      select{Entity}: (id) => set({ selectedIds: id ? [id] : [] }),
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters },
        pagination: { ...state.pagination, page: 1 },
      })),
      clearFilters: () => set({ filters: {}, pagination: initialState.pagination }),
      clearError: () => set({ error: null }),

      // =========================================================================
      // GETTERS
      // =========================================================================

      get{Entity}ById: (id) => get().{entities}.find((e) => e.id === id),

      getAnalytics: () => {
        const { {entities} } = get();
        return {
          total: {entities}.length,
          // ... computed analytics
        };
      },
    }),
    {
      name: 'primebalance-{feature}',
      partialize: (state) => ({
        // Only persist essential state
        selectedIds: state.selectedIds,
        filters: state.filters,
      }),
    }
  )
);
```

### Key Principles

1. **API Mappers**: Always define mapper functions at the top to normalize API responses
2. **Interface Grouping**: Organize interface into: Data, Pagination, Filters, UI State, Actions, Getters
3. **Section Comments**: Use `// ===` dividers for major sections
4. **Optimistic Updates**: Apply for update operations, with rollback on failure
5. **Error Handling**: Set error state, log to console, never throw to UI
6. **Persist Middleware**: Use `partialize` to only persist essential state

---

## 2. Type Definitions

**File naming**: `{feature}.ts` (kebab-case)
**Location**: `src/types/`

### Standard Structure

```typescript
// =============================================================================
// {FEATURE} TYPES
// src/types/{feature}.ts
// =============================================================================

// =============================================================================
// ENUMS (use UPPERCASE keys, lowercase/snake_case values matching database)
// =============================================================================

export enum {Entity}Status {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived',
}

export enum {Entity}Type {
  TYPE_A = 'type_a',
  TYPE_B = 'type_b',
}

// =============================================================================
// CORE INTERFACES
// =============================================================================

export interface {Entity} {
  // Identity
  id: string;
  {entity}Number: string;

  // Core Fields (required)
  name: string;
  status: {Entity}Status;
  type: {Entity}Type;

  // Optional Fields
  description?: string;

  // Related Entity References
  customerId?: string;
  customerName?: string;

  // Financial Fields (use number, not Decimal)
  amount: number;
  currency: string;

  // Dates (use ISO string format)
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// RELATED MODELS
// =============================================================================

export interface {Entity}Item {
  id: string;
  {entity}Id: string;
  // ... item-specific fields
}

export interface {Entity}Event {
  id: string;
  {entity}Id: string;
  eventType: string;
  // ... event fields
  createdAt: string;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

export interface Create{Entity}Request {
  name: string;
  type?: {Entity}Type;
  // ... creation fields (subset of Entity)
}

export interface Update{Entity}Request {
  name?: string;
  status?: {Entity}Status;
  // ... updatable fields (all optional)
}

// =============================================================================
// STORE TYPES
// =============================================================================

export interface {Entity}Filters {
  status?: {Entity}Status;
  type?: {Entity}Type;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface {Entity}Analytics {
  total: number;
  byStatus: Record<{Entity}Status, number>;
  // ... analytics fields
}

export interface {Entity}Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function canTransitionTo(
  current: {Entity}Status,
  target: {Entity}Status
): boolean {
  const transitions: Record<{Entity}Status, {Entity}Status[]> = {
    [{Entity}Status.DRAFT]: [{Entity}Status.ACTIVE, {Entity}Status.CANCELLED],
    [{Entity}Status.ACTIVE]: [{Entity}Status.COMPLETED, {Entity}Status.CANCELLED],
    [{Entity}Status.COMPLETED]: [{Entity}Status.ARCHIVED],
    [{Entity}Status.CANCELLED]: [{Entity}Status.ARCHIVED],
    [{Entity}Status.ARCHIVED]: [],
  };
  return transitions[current]?.includes(target) ?? false;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const {ENTITY}_STATUSES: Array<{
  value: {Entity}Status;
  label: string;
  color: string;
}> = [
  { value: {Entity}Status.DRAFT, label: 'Draft', color: 'gray' },
  { value: {Entity}Status.ACTIVE, label: 'Active', color: 'emerald' },
  { value: {Entity}Status.COMPLETED, label: 'Completed', color: 'blue' },
  { value: {Entity}Status.CANCELLED, label: 'Cancelled', color: 'red' },
  { value: {Entity}Status.ARCHIVED, label: 'Archived', color: 'slate' },
];
```

### Key Principles

1. **Enum Keys**: Use UPPERCASE keys, values should match database format: `DRAFT = 'draft'`
2. **Interface Organization**: Identity -> Core -> Optional -> References -> Financial -> Dates
3. **Request Types**: Separate Create (required fields) and Update (all optional)
4. **Helper Functions**: Include status transitions, validation, calculations
5. **Constants**: Include UI-friendly status/type arrays with labels and colors

---

## 3. API Routes

**File naming**: `route.ts`
**Location**: `src/app/api/{resource}/route.ts`

### Standard Structure

```typescript
// =============================================================================
// {RESOURCE} API - Main Route
// src/app/api/{resource}/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest, notFound } from '@/lib/api-utils';

// =============================================================================
// GET - List {Resources}
// =============================================================================

export async function GET(request: NextRequest) {
  // Auth
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Filters
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build where clause
    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { {resource}Number: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute queries in parallel
    const [{resources}, total] = await Promise.all([
      prisma.{resource}.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: {
          // Standard includes
        },
      }),
      prisma.{resource}.count({ where }),
    ]);

    // Response
    return NextResponse.json({
      {resources},
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching {resources}:', error);
    return NextResponse.json(
      { error: 'Failed to fetch {resources}' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create {Resource}
// =============================================================================

export async function POST(request: NextRequest) {
  // Auth
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  try {
    const body = await request.json();

    // Validation
    if (!body.name) {
      return badRequest('Name is required');
    }

    // Generate number
    const count = await prisma.{resource}.count({
      where: { organizationId: user.organizationId },
    });
    const {resource}Number = body.{resource}Number ||
      `{PREFIX}-${String(count + 1).padStart(5, '0')}`;

    // Create
    const {resource} = await prisma.{resource}.create({
      data: {
        {resource}Number,
        name: body.name,
        status: body.status || 'DRAFT',
        // ... other fields with defaults
        organizationId: user.organizationId,
      },
      include: {
        // Standard includes
      },
    });

    return NextResponse.json({ {resource} }, { status: 201 });
  } catch (error) {
    console.error('Error creating {resource}:', error);
    return NextResponse.json(
      { error: 'Failed to create {resource}' },
      { status: 500 }
    );
  }
}
```

### Dynamic Route Structure

```typescript
// =============================================================================
// {RESOURCE} API - Single Resource
// src/app/api/{resource}/[id]/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

// =============================================================================
// GET - Get Single {Resource}
// =============================================================================

export async function GET(request: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  try {
    const { id } = await params;

    const {resource} = await prisma.{resource}.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        // Detailed includes for single resource
      },
    });

    if (!{resource}) {
      return notFound('{Resource}');
    }

    return NextResponse.json({ {resource} });
  } catch (error) {
    console.error('Error fetching {resource}:', error);
    return NextResponse.json(
      { error: 'Failed to fetch {resource}' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH - Update {Resource}
// =============================================================================

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  try {
    const { id } = await params;
    const body = await request.json();

    // Build update data
    const updateData: Record<string, unknown> = { ...body };

    // Handle date fields
    const dateFields = ['effectiveDate', 'dueDate'];
    dateFields.forEach((field) => {
      if (body[field]) {
        updateData[field] = new Date(body[field]);
      }
    });

    const result = await prisma.{resource}.updateMany({
      where: {
        id,
        organizationId: user.organizationId,
      },
      data: updateData,
    });

    if (result.count === 0) {
      return notFound('{Resource}');
    }

    // Fetch updated resource
    const {resource} = await prisma.{resource}.findUnique({
      where: { id },
      include: {
        // Standard includes
      },
    });

    return NextResponse.json({ {resource} });
  } catch (error) {
    console.error('Error updating {resource}:', error);
    return NextResponse.json(
      { error: 'Failed to update {resource}' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Delete {Resource}
// =============================================================================

export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  try {
    const { id } = await params;

    const result = await prisma.{resource}.deleteMany({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (result.count === 0) {
      return notFound('{Resource}');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting {resource}:', error);
    return NextResponse.json(
      { error: 'Failed to delete {resource}' },
      { status: 500 }
    );
  }
}
```

### Key Principles

1. **Auth Utilities**: Always use `getSessionWithOrg()`, `unauthorized()`, `badRequest()`, `notFound()`
2. **Consistent Error Format**: `{ error: string }` with appropriate status codes
3. **Pagination**: Include page, limit, total, totalPages in all list responses
4. **Parallel Queries**: Use `Promise.all()` for independent queries
5. **Org Scoping**: Always include `organizationId` in queries

---

## 4. Frontend Components

**File naming**: `{ComponentName}.tsx` (PascalCase)
**Location**: `src/components/{feature}/`

### Standard Structure

```typescript
// =============================================================================
// {ComponentName}
// src/components/{feature}/{ComponentName}.tsx
// =============================================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

// UI Components
import { Button, Card, Input, Badge } from '@/components/ui';

// Stores
import { use{Feature}Store } from '@/store/{feature}-store';
import { useThemeStore } from '@/store/theme-store';

// Types
import type { {Entity} } from '@/types/{feature}';

// =============================================================================
// TYPES
// =============================================================================

interface {ComponentName}Props {
  // Required props
  {entity}Id?: string;

  // Optional props with defaults
  mode?: 'view' | 'edit';

  // Callbacks
  onClose?: () => void;
  onSuccess?: (result: {Entity}) => void;
  onError?: (error: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function {ComponentName}({
  {entity}Id,
  mode = 'view',
  onClose,
  onSuccess,
  onError,
}: {ComponentName}Props) {
  // ---------------------------------------------------------------------------
  // Stores
  // ---------------------------------------------------------------------------
  const { t, theme } = useThemeStore();
  const {
    current{Entity},
    fetch{Entity},
    update{Entity},
    isLoading,
    error,
  } = use{Feature}Store();

  // ---------------------------------------------------------------------------
  // Local State
  // ---------------------------------------------------------------------------
  const [formData, setFormData] = useState<Partial<{Entity}>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if ({entity}Id) {
      fetch{Entity}({entity}Id);
    }
  }, [{entity}Id]);

  useEffect(() => {
    if (current{Entity}) {
      setFormData(current{Entity});
    }
  }, [current{Entity}]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleSubmit = useCallback(async () => {
    if (!{entity}Id) return;

    setIsSubmitting(true);
    try {
      await update{Entity}({entity}Id, formData);
      onSuccess?.(formData as {Entity});
    } catch (err) {
      onError?.((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }, [{entity}Id, formData, update{Entity}, onSuccess, onError]);

  const handleChange = useCallback((field: keyof {Entity}, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // ---------------------------------------------------------------------------
  // Render Helpers
  // ---------------------------------------------------------------------------
  const renderHeader = () => (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold">{t('{feature}.title')}</h2>
      {onClose && (
        <Button variant="ghost" onClick={onClose}>
          {t('common.close')}
        </Button>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Loading & Error States
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">Loading...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-red-500">{error}</div>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="p-6">
        {renderHeader()}

        <div className="mt-4 space-y-4">
          {/* Form fields */}
          <Input
            label={t('{feature}.name')}
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={mode === 'view'}
          />

          {/* ... more fields */}
        </div>

        {mode === 'edit' && (
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              {t('common.save')}
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {ComponentName};
```

### Index File Structure

```typescript
// src/components/{feature}/index.ts

export { {EntityList} } from './{EntityList}';
export { {EntityForm} } from './{EntityForm}';
export { {EntityDetail} } from './{EntityDetail}';
export { {EntityCard} } from './{EntityCard}';
```

### Key Principles

1. **Use 'use client'**: Required for client components
2. **Named Exports**: Use named exports, also provide default export
3. **Section Comments**: Use `// ---` dividers for sections within component
4. **Hook Order**: Stores -> Local State -> Effects -> Handlers -> Render Helpers
5. **Callbacks with useCallback**: Wrap handlers to prevent unnecessary re-renders
6. **Loading/Error States**: Always handle before main render
7. **Translation**: Use `t()` from theme store for all user-facing text

---

## 5. Naming Conventions

### Files

| Type | Pattern | Example |
|------|---------|---------|
| Store | `{feature}-store.ts` | `invoice-store.ts` |
| Types | `{feature}.ts` | `invoice.ts` |
| API Route | `route.ts` | `src/app/api/invoices/route.ts` |
| Component | `{ComponentName}.tsx` | `InvoiceForm.tsx` |
| Index | `index.ts` | `src/components/invoices/index.ts` |

### Variables & Functions

| Type | Pattern | Example |
|------|---------|---------|
| Store hook | `use{Feature}Store` | `useInvoiceStore` |
| Entity type | `{Entity}` (singular) | `Invoice` |
| Entity array | `{entities}` (plural) | `invoices` |
| API mapper | `mapApiTo{Entity}` | `mapApiToInvoice` |
| Status enum | `{Entity}Status` | `InvoiceStatus` |
| Enum values | `UPPER_CASE` | `DRAFT`, `CONFIRMED` |

### API Endpoints

| Action | Method | Path |
|--------|--------|------|
| List | GET | `/api/{resources}` |
| Create | POST | `/api/{resources}` |
| Get | GET | `/api/{resources}/[id]` |
| Update | PATCH | `/api/{resources}/[id]` |
| Delete | DELETE | `/api/{resources}/[id]` |
| Action | POST | `/api/{resources}/[id]/{action}` |

---

## Current Inconsistencies to Fix

### Stores
- [x] `invoice-store.ts`: Missing `persist` middleware - FIXED
- [x] `invoice-store.ts`: Missing API mappers - FIXED (added `mapApiToInvoice`, `mapApiToPayment`, `mapApiToVersion`)
- [x] `invoice-store.ts`: Uses `loading` instead of `isLoading` - FIXED
- [ ] All stores: Standardize on `isLoading`, `isInitialized` naming

### Types
- [x] `invoice.ts`: Enum format is correct (UPPERCASE keys, lowercase values matching DB)
- [x] `customers.ts`: Converted type aliases to enums - FIXED (CustomerStatus, CustomerAccountType, RiskLevel, PaymentBehavior, CreditStatus, etc.)

### API Routes
- [x] `invoices/route.ts`: Uses `getSessionWithOrg()` utility - FIXED
- [x] `invoices/route.ts`: Uses `unauthorized()`, `badRequest()` utilities - FIXED
- [ ] Standardize response format: always wrap in `{ {resource}: data }`

### Components
- [ ] Standardize export pattern: use named exports with re-export in index.ts
- [ ] Ensure all components use `useCallback` for handlers
