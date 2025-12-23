// src/store/suppliers-store.ts
// Suppliers Store - API-connected version
// REPLACE: src/store/suppliers-store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Supplier,
  SupplierBalance,
  SupplierPayment,
  ReliabilityRecord,
  SpendRecord,
  DependencyRisk,
  SupplierContact,
  SupplierAnalytics,
  SupplierStatus,
  SupplierCategory,
  ReliabilityRating,
  DependencyLevel,
  PaymentMethod,
} from '@/types/suppliers';

// =============================================================================
// API MAPPERS
// =============================================================================

function mapApiToSupplier(api: Record<string, unknown>): Supplier {
  return {
    id: api.id as string,
    supplierNumber: api.supplierNumber as string,
    name: api.name as string,
    legalName: api.legalName as string | undefined,
    status: (api.status as SupplierStatus) || 'active',
    category: (api.category as SupplierCategory) || 'goods',
    email: api.email as string,
    phone: api.phone as string | undefined,
    website: api.website as string | undefined,
    address: api.address as Supplier['address'],
    taxId: api.taxId as string | undefined,
    registrationNumber: api.registrationNumber as string | undefined,
    founded: api.founded as number | undefined,
    employeeCount: api.employeeCount as number | undefined,
    accountManagerId: api.accountManagerId as string | undefined,
    accountManagerName: api.accountManagerName as string | undefined,
    tags: (api.tags as string[]) || [],
    supplierSince: api.supplierSince as string,
    lastOrderDate: api.lastOrderDate as string | undefined,
    lastPaymentDate: api.lastPaymentDate as string | undefined,
    contractExpiryDate: api.contractExpiryDate as string | undefined,
    totalSpend: Number(api.totalSpend) || 0,
    totalOrders: (api.totalOrders as number) || 0,
    averageOrderValue: Number(api.averageOrderValue) || 0,
    outstandingBalance: Number(api.outstandingBalance) || 0,
    paymentTerms: (api.paymentTerms as string) || 'Net 30',
    preferredPaymentMethod: (api.preferredPaymentMethod as PaymentMethod) || 'wire',
    earlyPaymentDiscount: api.earlyPaymentDiscount ? Number(api.earlyPaymentDiscount) : undefined,
    reliabilityRating: (api.reliabilityRating as ReliabilityRating) || 'good',
    reliabilityScore: (api.reliabilityScore as number) || 80,
    onTimeDeliveryRate: Number(api.onTimeDeliveryRate) || 90,
    qualityScore: (api.qualityScore as number) || 80,
    defectRate: Number(api.defectRate) || 0,
    avgLeadTime: (api.avgLeadTime as number) || 14,
    dependencyLevel: (api.dependencyLevel as DependencyLevel) || 'low',
    dependencyScore: (api.dependencyScore as number) || 0,
    spendPercentage: Number(api.spendPercentage) || 0,
    alternativeSuppliers: (api.alternativeSuppliers as number) || 0,
    criticalItems: (api.criticalItems as number) || 0,
    notes: api.notes as string | undefined,
    createdAt: api.createdAt as string,
    updatedAt: api.updatedAt as string,
  };
}

function mapApiToBalance(api: Record<string, unknown>): SupplierBalance {
  return {
    id: api.id as string,
    supplierId: api.supplierId as string,
    totalOutstanding: Number(api.totalOutstanding) || 0,
    currentDue: Number(api.currentDue) || 0,
    overdue30: Number(api.overdue30) || 0,
    overdue60: Number(api.overdue60) || 0,
    overdue90Plus: Number(api.overdue90Plus) || 0,
    availableCredits: Number(api.availableCredits) || 0,
    pendingCredits: Number(api.pendingCredits) || 0,
    lastPaymentAmount: api.lastPaymentAmount ? Number(api.lastPaymentAmount) : undefined,
    lastPaymentDate: api.lastPaymentDate as string | undefined,
    nextPaymentDue: api.nextPaymentDue as string | undefined,
    nextPaymentAmount: api.nextPaymentAmount ? Number(api.nextPaymentAmount) : undefined,
    ytdPayments: Number(api.ytdPayments) || 0,
    ytdPurchases: Number(api.ytdPurchases) || 0,
    updatedAt: api.updatedAt as string,
  };
}

function mapApiToPayment(api: Record<string, unknown>): SupplierPayment {
  return {
    id: api.id as string,
    supplierId: api.supplierId as string,
    paymentNumber: api.paymentNumber as string,
    invoiceIds: (api.invoiceIds as string[]) || [],
    amount: Number(api.amount) || 0,
    currency: (api.currency as string) || 'EUR',
    paymentDate: api.paymentDate as string,
    dueDate: api.dueDate as string | undefined,
    paymentMethod: api.paymentMethod as PaymentMethod,
    referenceNumber: api.referenceNumber as string | undefined,
    bankAccount: api.bankAccount as string | undefined,
    status: (api.status as SupplierPayment['status']) || 'pending',
    discountTaken: api.discountTaken ? Number(api.discountTaken) : undefined,
    discountType: api.discountType as string | undefined,
    notes: api.notes as string | undefined,
    createdAt: api.createdAt as string,
  };
}

function mapApiToReliability(api: Record<string, unknown>): ReliabilityRecord {
  return {
    id: api.id as string,
    supplierId: api.supplierId as string,
    orderId: api.orderId as string,
    orderNumber: api.orderNumber as string,
    orderDate: api.orderDate as string,
    expectedDeliveryDate: api.expectedDeliveryDate as string,
    actualDeliveryDate: api.actualDeliveryDate as string | undefined,
    daysVariance: (api.daysVariance as number) || 0,
    itemsOrdered: (api.itemsOrdered as number) || 0,
    itemsReceived: (api.itemsReceived as number) || 0,
    itemsDefective: (api.itemsDefective as number) || 0,
    qualityScore: (api.qualityScore as number) || 100,
    hasIssues: (api.hasIssues as boolean) || false,
    issueType: api.issueType as ReliabilityRecord['issueType'],
    issueDescription: api.issueDescription as string | undefined,
    issueResolved: (api.issueResolved as boolean) || false,
    createdAt: api.createdAt as string,
  };
}

function mapApiToSpend(api: Record<string, unknown>): SpendRecord {
  return {
    id: api.id as string,
    supplierId: api.supplierId as string,
    period: api.period as string,
    periodType: api.periodType as SpendRecord['periodType'],
    totalSpend: Number(api.totalSpend) || 0,
    directSpend: Number(api.directSpend) || 0,
    indirectSpend: Number(api.indirectSpend) || 0,
    goodsSpend: api.goodsSpend ? Number(api.goodsSpend) : undefined,
    servicesSpend: api.servicesSpend ? Number(api.servicesSpend) : undefined,
    orderCount: (api.orderCount as number) || 0,
    averageOrderValue: Number(api.averageOrderValue) || 0,
    previousPeriodSpend: api.previousPeriodSpend ? Number(api.previousPeriodSpend) : undefined,
    changePercentage: api.changePercentage ? Number(api.changePercentage) : undefined,
    budgetAmount: api.budgetAmount ? Number(api.budgetAmount) : undefined,
    budgetVariance: api.budgetVariance ? Number(api.budgetVariance) : undefined,
    createdAt: api.createdAt as string,
  };
}

function mapApiToRisk(api: Record<string, unknown>): DependencyRisk {
  return {
    id: api.id as string,
    supplierId: api.supplierId as string,
    riskType: api.riskType as DependencyRisk['riskType'],
    title: api.title as string,
    description: api.description as string,
    severity: api.severity as DependencyLevel,
    impactScore: (api.impactScore as number) || 5,
    probabilityScore: (api.probabilityScore as number) || 5,
    overallRiskScore: (api.overallRiskScore as number) || 25,
    mitigationPlan: api.mitigationPlan as string | undefined,
    mitigationStatus: (api.mitigationStatus as DependencyRisk['mitigationStatus']) || 'not_started',
    status: (api.status as DependencyRisk['status']) || 'identified',
    identifiedAt: api.identifiedAt as string,
    resolvedAt: api.resolvedAt as string | undefined,
    createdAt: api.createdAt as string,
    updatedAt: api.updatedAt as string,
  };
}

function mapApiToContact(api: Record<string, unknown>): SupplierContact {
  return {
    id: api.id as string,
    supplierId: api.supplierId as string,
    name: api.name as string,
    title: api.title as string | undefined,
    email: api.email as string,
    phone: api.phone as string | undefined,
    isPrimary: (api.isPrimary as boolean) || false,
    role: (api.role as SupplierContact['role']) || 'general',
    notes: api.notes as string | undefined,
    createdAt: api.createdAt as string,
    updatedAt: api.updatedAt as string,
  };
}

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface SuppliersState {
  suppliers: Supplier[];
  balances: SupplierBalance[];
  payments: SupplierPayment[];
  reliability: ReliabilityRecord[];
  spend: SpendRecord[];
  risks: DependencyRisk[];
  contacts: SupplierContact[];

  selectedSupplierId: string | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Fetch
  fetchSuppliers: () => Promise<void>;
  fetchSupplier: (id: string) => Promise<void>;

  // Suppliers
  createSupplier: (supplier: Partial<Supplier>) => Promise<Supplier | null>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  // Risks
  addRisk: (supplierId: string, risk: Partial<DependencyRisk>) => Promise<DependencyRisk | null>;
  updateRisk: (supplierId: string, riskId: string, updates: Partial<DependencyRisk>) => Promise<void>;
  resolveRisk: (supplierId: string, riskId: string) => Promise<void>;

  // Contacts
  addContact: (supplierId: string, contact: Partial<SupplierContact>) => Promise<SupplierContact | null>;
  updateContact: (supplierId: string, contactId: string, updates: Partial<SupplierContact>) => Promise<void>;
  deleteContact: (supplierId: string, contactId: string) => Promise<void>;

  // Analytics
  getAnalytics: () => SupplierAnalytics;
  getSupplierBalance: (supplierId: string) => SupplierBalance | undefined;
  getSupplierPayments: (supplierId: string) => SupplierPayment[];
  getSupplierReliability: (supplierId: string) => ReliabilityRecord[];
  getSupplierSpend: (supplierId: string) => SpendRecord[];
  getSupplierRisks: (supplierId: string) => DependencyRisk[];
  getSupplierContacts: (supplierId: string) => SupplierContact[];

  // Selection
  selectSupplier: (id: string | null) => void;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useSuppliersStore = create<SuppliersState>()(
  persist(
    (set, get) => ({
      suppliers: [],
      balances: [],
      payments: [],
      reliability: [],
      spend: [],
      risks: [],
      contacts: [],
      selectedSupplierId: null,
      isLoading: false,
      isInitialized: false,

      // =============================================================================
      // FETCH
      // =============================================================================

      fetchSuppliers: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/suppliers');
          if (!res.ok) throw new Error('Failed to fetch suppliers');
          const data = await res.json();
          const suppliers = (data.suppliers || []).map(mapApiToSupplier);
          const balances = (data.suppliers || [])
            .filter((s: Record<string, unknown>) => s.balance)
            .map((s: Record<string, unknown>) => mapApiToBalance(s.balance as Record<string, unknown>));
          set({ suppliers, balances, isInitialized: true });
        } catch (error) {
          console.error('Error fetching suppliers:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchSupplier: async (id: string) => {
        try {
          const res = await fetch(`/api/suppliers/${id}`);
          if (!res.ok) throw new Error('Failed to fetch supplier');
          const data = await res.json();
          
          const supplier = mapApiToSupplier(data);
          const balance = data.balance ? mapApiToBalance(data.balance) : undefined;
          const payments = (data.payments || []).map(mapApiToPayment);
          const reliability = (data.reliability || []).map(mapApiToReliability);
          const spend = (data.spend || []).map(mapApiToSpend);
          const risks = (data.risks || []).map(mapApiToRisk);
          const contacts = (data.contacts || []).map(mapApiToContact);

          set((state) => ({
            suppliers: state.suppliers.map((s) => (s.id === id ? supplier : s)),
            balances: balance
              ? [...state.balances.filter((b) => b.supplierId !== id), balance]
              : state.balances,
            payments: [...state.payments.filter((p) => p.supplierId !== id), ...payments],
            reliability: [...state.reliability.filter((r) => r.supplierId !== id), ...reliability],
            spend: [...state.spend.filter((s) => s.supplierId !== id), ...spend],
            risks: [...state.risks.filter((r) => r.supplierId !== id), ...risks],
            contacts: [...state.contacts.filter((c) => c.supplierId !== id), ...contacts],
          }));
        } catch (error) {
          console.error('Error fetching supplier:', error);
        }
      },

      // =============================================================================
      // SUPPLIERS
      // =============================================================================

      createSupplier: async (data) => {
        try {
          const res = await fetch('/api/suppliers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('Failed to create supplier');
          const created = await res.json();
          const supplier = mapApiToSupplier(created);
          set((state) => ({ suppliers: [...state.suppliers, supplier] }));
          return supplier;
        } catch (error) {
          console.error('Error creating supplier:', error);
          return null;
        }
      },

      updateSupplier: async (id, updates) => {
        // Optimistic update
        set((state) => ({
          suppliers: state.suppliers.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
          ),
        }));
        try {
          const res = await fetch(`/api/suppliers/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          if (!res.ok) throw new Error('Failed to update supplier');
          const updated = await res.json();
          const supplier = mapApiToSupplier(updated);
          set((state) => ({
            suppliers: state.suppliers.map((s) => (s.id === id ? supplier : s)),
          }));
        } catch (error) {
          console.error('Error updating supplier:', error);
          get().fetchSuppliers();
        }
      },

      deleteSupplier: async (id) => {
        set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id) }));
        try {
          const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Failed to delete supplier');
        } catch (error) {
          console.error('Error deleting supplier:', error);
          get().fetchSuppliers();
        }
      },

      // =============================================================================
      // RISKS
      // =============================================================================

      addRisk: async (supplierId, data) => {
        try {
          const res = await fetch(`/api/suppliers/${supplierId}/risks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('Failed to add risk');
          const created = await res.json();
          const risk = mapApiToRisk(created);
          set((state) => ({ risks: [...state.risks, risk] }));
          get().fetchSupplier(supplierId);
          return risk;
        } catch (error) {
          console.error('Error adding risk:', error);
          return null;
        }
      },

      updateRisk: async (supplierId, riskId, updates) => {
        set((state) => ({
          risks: state.risks.map((r) =>
            r.id === riskId ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
          ),
        }));
        try {
          const res = await fetch(`/api/suppliers/${supplierId}/risks/${riskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          if (!res.ok) throw new Error('Failed to update risk');
          get().fetchSupplier(supplierId);
        } catch (error) {
          console.error('Error updating risk:', error);
        }
      },

      resolveRisk: async (supplierId, riskId) => {
        await get().updateRisk(supplierId, riskId, { status: 'resolved' });
      },

      // =============================================================================
      // CONTACTS
      // =============================================================================

      addContact: async (supplierId, data) => {
        try {
          const res = await fetch(`/api/suppliers/${supplierId}/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('Failed to add contact');
          const created = await res.json();
          const contact = mapApiToContact(created);
          set((state) => ({ contacts: [...state.contacts, contact] }));
          return contact;
        } catch (error) {
          console.error('Error adding contact:', error);
          return null;
        }
      },

      updateContact: async (supplierId, contactId, updates) => {
        set((state) => ({
          contacts: state.contacts.map((c) =>
            c.id === contactId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        }));
        try {
          const res = await fetch(`/api/suppliers/${supplierId}/contacts/${contactId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          if (!res.ok) throw new Error('Failed to update contact');
        } catch (error) {
          console.error('Error updating contact:', error);
        }
      },

      deleteContact: async (supplierId, contactId) => {
        set((state) => ({ contacts: state.contacts.filter((c) => c.id !== contactId) }));
        try {
          const res = await fetch(`/api/suppliers/${supplierId}/contacts/${contactId}`, {
            method: 'DELETE',
          });
          if (!res.ok) throw new Error('Failed to delete contact');
        } catch (error) {
          console.error('Error deleting contact:', error);
        }
      },

      // =============================================================================
      // ANALYTICS & GETTERS
      // =============================================================================

      getAnalytics: () => {
        const { suppliers, risks } = get();
        const active = suppliers.filter((s) => s.status === 'active' || s.status === 'preferred');
        const preferred = suppliers.filter((s) => s.status === 'preferred');
        const totalSpendYTD = suppliers.reduce((sum, s) => sum + s.totalSpend, 0);
        const totalOutstanding = suppliers.reduce((sum, s) => sum + s.outstandingBalance, 0);

        const reliabilityBreakdown = {
          excellent: suppliers.filter((s) => s.reliabilityRating === 'excellent').length,
          good: suppliers.filter((s) => s.reliabilityRating === 'good').length,
          fair: suppliers.filter((s) => s.reliabilityRating === 'fair').length,
          poor: suppliers.filter((s) => s.reliabilityRating === 'poor').length,
          critical: suppliers.filter((s) => s.reliabilityRating === 'critical').length,
        };

        const dependencyBreakdown = {
          low: suppliers.filter((s) => s.dependencyLevel === 'low').length,
          medium: suppliers.filter((s) => s.dependencyLevel === 'medium').length,
          high: suppliers.filter((s) => s.dependencyLevel === 'high').length,
          critical: suppliers.filter((s) => s.dependencyLevel === 'critical').length,
        };

        const topSuppliersBySpend = [...suppliers]
          .sort((a, b) => b.totalSpend - a.totalSpend)
          .slice(0, 5)
          .map((s) => ({ id: s.id, name: s.name, spend: s.totalSpend }));

        const highRiskSuppliers = suppliers
          .filter((s) => s.dependencyLevel === 'high' || s.dependencyLevel === 'critical')
          .map((s) => ({
            id: s.id,
            name: s.name,
            riskCount: risks.filter((r) => r.supplierId === s.id && r.status !== 'resolved').length,
            dependencyLevel: s.dependencyLevel,
          }));

        return {
          totalSuppliers: suppliers.length,
          activeSuppliers: active.length,
          preferredSuppliers: preferred.length,
          newSuppliersThisMonth: 0,
          totalSpendYTD,
          totalOutstanding,
          avgPaymentDays: 30,
          reliabilityBreakdown,
          dependencyBreakdown,
          topSuppliersBySpend,
          highRiskSuppliers,
          categorySpend: [],
        };
      },

      getSupplierBalance: (supplierId) => get().balances.find((b) => b.supplierId === supplierId),
      getSupplierPayments: (supplierId) => get().payments.filter((p) => p.supplierId === supplierId),
      getSupplierReliability: (supplierId) => get().reliability.filter((r) => r.supplierId === supplierId),
      getSupplierSpend: (supplierId) => get().spend.filter((s) => s.supplierId === supplierId),
      getSupplierRisks: (supplierId) => get().risks.filter((r) => r.supplierId === supplierId),
      getSupplierContacts: (supplierId) => get().contacts.filter((c) => c.supplierId === supplierId),

      selectSupplier: (id) => set({ selectedSupplierId: id }),
    }),
    {
      name: 'suppliers-storage',
      partialize: (state) => ({ selectedSupplierId: state.selectedSupplierId }),
    }
  )
);