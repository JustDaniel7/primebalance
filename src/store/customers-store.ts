// src/store/customers-store.ts
// Customers Store - API-connected version

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Customer,
  CustomerContact,
  PaymentRecord,
  CreditEvent,
  RevenueRecord,
  RiskIndicator,
  CustomerAnalytics,
} from '@/types/customers';
import {
  CustomerStatus,
  CustomerAccountType,
  CreditStatus,
  RiskLevel,
  PaymentBehavior,
  RiskIndicatorStatus,
  RiskIndicatorCategory,
  InvoiceDelivery,
  ContactRole,
  PaymentRecordStatus,
  RevenuePeriodType,
} from '@/types/customers';

// =============================================================================
// API MAPPERS
// =============================================================================

function mapApiToCustomer(api: Record<string, unknown>): Customer {
  return {
    id: api.id as string,
    customerNumber: api.customerNumber as string,
    name: api.name as string,
    legalName: api.legalName as string | undefined,
    type: (api.type as CustomerAccountType) || CustomerAccountType.BUSINESS,
    status: (api.status as CustomerStatus) || CustomerStatus.ACTIVE,
    email: api.email as string | undefined,
    phone: api.phone as string | undefined,
    website: api.website as string | undefined,
    address: api.address as Customer['address'],
    industry: api.industry as string | undefined,
    taxId: api.taxId as string | undefined,
    vatNumber: api.vatNumber as string | undefined,
    registrationNumber: api.registrationNumber as string | undefined,
    classification: api.classification as string | undefined,
    employeeCount: api.employeeCount as number | undefined,
    annualRevenue: api.annualRevenue ? Number(api.annualRevenue) : undefined,
    accountManagerId: api.accountManagerId as string | undefined,
    accountManagerName: api.accountManagerName as string | undefined,
    segment: api.segment as string | undefined,
    tags: (api.tags as string[]) || [],
    customerSince: api.customerSince ? new Date(api.customerSince as string).toISOString() : new Date().toISOString(),
    lastActivityDate: api.lastActivityDate ? new Date(api.lastActivityDate as string).toISOString() : undefined,
    lastPurchaseDate: api.lastPurchaseDate ? new Date(api.lastPurchaseDate as string).toISOString() : undefined,
    lastOrderDate: api.lastOrderDate ? new Date(api.lastOrderDate as string).toISOString() : undefined,
    lastPaymentDate: api.lastPaymentDate ? new Date(api.lastPaymentDate as string).toISOString() : undefined,
    lastContactDate: api.lastContactDate ? new Date(api.lastContactDate as string).toISOString() : undefined,
    totalRevenue: Number(api.totalRevenue) || 0,
    totalOrders: (api.totalOrders as number) || 0,
    averageOrderValue: Number(api.averageOrderValue) || 0,
    outstandingBalance: Number(api.outstandingBalance) || 0,
    overdueAmount: Number(api.overdueAmount) || 0,
    currency: (api.currency as string) || 'EUR',
    creditLimit: Number(api.creditLimit) || 0,
    creditUsed: Number(api.creditUsed) || 0,
    creditAvailable: Number(api.creditAvailable) || 0,
    creditStatus: (api.creditStatus as CreditStatus) || CreditStatus.APPROVED,
    paymentTerms: (api.paymentTerms as string) || 'Net 30',
    riskLevel: (api.riskLevel as RiskLevel) || RiskLevel.LOW,
    riskScore: (api.riskScore as number) || 0,
    paymentBehavior: (api.paymentBehavior as PaymentBehavior) || PaymentBehavior.GOOD,
    averageDaysToPayment: api.averageDaysToPayment as number | undefined,
    onTimePaymentRate: api.onTimePaymentRate ? Number(api.onTimePaymentRate) : undefined,
    latePaymentCount: api.latePaymentCount as number | undefined,
    preferredPaymentMethod: api.preferredPaymentMethod as string | undefined,
    preferredLanguage: (api.preferredLanguage as string) || 'en',
    invoiceDelivery: (api.invoiceDelivery as InvoiceDelivery) || InvoiceDelivery.EMAIL,
    notes: api.notes as string | undefined,
    createdAt: api.createdAt as string,
    updatedAt: api.updatedAt as string,
  };
}

function mapApiToContact(api: Record<string, unknown>): CustomerContact {
  return {
    id: api.id as string,
    customerId: api.customerId as string,
    name: api.name as string,
    title: api.title as string | undefined,
    email: api.email as string,
    phone: api.phone as string | undefined,
    isPrimary: (api.isPrimary as boolean) || false,
    role: (api.role as ContactRole) || ContactRole.GENERAL,
    notes: api.notes as string | undefined,
    createdAt: api.createdAt as string,
    updatedAt: api.updatedAt as string,
  };
}

function mapApiToPayment(api: Record<string, unknown>): PaymentRecord {
  return {
    id: api.id as string,
    customerId: api.customerId as string,
    invoiceId: api.invoiceId as string | undefined,
    invoiceNumber: api.invoiceNumber as string | undefined,
    amount: Number(api.amount) || 0,
    currency: (api.currency as string) || 'EUR',
    invoiceDate: new Date(api.invoiceDate as string).toISOString(),
    dueDate: new Date(api.dueDate as string).toISOString(),
    paymentDate: api.paymentDate ? new Date(api.paymentDate as string).toISOString() : undefined,
    status: (api.status as PaymentRecordStatus) || PaymentRecordStatus.PENDING,
    daysToPayment: api.daysToPayment as number | undefined,
    daysOverdue: api.daysOverdue as number | undefined,
    paymentMethod: api.paymentMethod as string | undefined,
    referenceNumber: api.referenceNumber as string | undefined,
    createdAt: api.createdAt as string,
  };
}

function mapApiToCreditEvent(api: Record<string, unknown>): CreditEvent {
  return {
    id: api.id as string,
    customerId: api.customerId as string,
    type: api.type as CreditEvent['type'],
    previousValue: api.previousValue as string | undefined,
    newValue: api.newValue as string,
    reason: api.reason as string,
    changedBy: api.changedBy as string | undefined,
    changedByName: api.changedByName as string | undefined,
    createdAt: api.createdAt as string,
  };
}

function mapApiToRevenue(api: Record<string, unknown>): RevenueRecord {
  return {
    id: api.id as string,
    customerId: api.customerId as string,
    period: api.period as string,
    periodType: (api.periodType as RevenuePeriodType) || RevenuePeriodType.MONTHLY,
    revenue: Number(api.revenue) || 0,
    cost: api.cost ? Number(api.cost) : undefined,
    profit: api.profit ? Number(api.profit) : undefined,
    margin: api.margin ? Number(api.margin) : undefined,
    productRevenue: api.productRevenue ? Number(api.productRevenue) : undefined,
    serviceRevenue: api.serviceRevenue ? Number(api.serviceRevenue) : undefined,
    otherRevenue: api.otherRevenue ? Number(api.otherRevenue) : undefined,
    orderCount: (api.orderCount as number) || 0,
    averageOrderValue: Number(api.averageOrderValue) || 0,
    createdAt: api.createdAt as string,
  };
}

function mapApiToRiskIndicator(api: Record<string, unknown>): RiskIndicator {
  return {
    id: api.id as string,
    customerId: api.customerId as string,
    category: (api.category as RiskIndicatorCategory) || RiskIndicatorCategory.FINANCIAL,
    indicator: api.indicator as string,
    description: api.description as string,
    severity: (api.severity as RiskLevel) || RiskLevel.MEDIUM,
    score: (api.score as number) || 0,
    status: (api.status as RiskIndicatorStatus) || RiskIndicatorStatus.ACTIVE,
    detectedAt: api.detectedAt ? new Date(api.detectedAt as string).toISOString() : new Date().toISOString(),
    resolvedAt: api.resolvedAt ? new Date(api.resolvedAt as string).toISOString() : undefined,
    recommendedAction: api.recommendedAction as string | undefined,
    actionTaken: api.actionTaken as string | undefined,
    createdAt: api.createdAt as string,
    updatedAt: api.updatedAt as string,
  };
}

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface CustomersState {
  customers: Customer[];
  payments: PaymentRecord[];
  creditEvents: CreditEvent[];
  revenue: RevenueRecord[];
  riskIndicators: RiskIndicator[];
  contacts: CustomerContact[];
  selectedCustomerId: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // API
  fetchCustomers: () => Promise<void>;
  fetchCustomer: (id: string) => Promise<void>;

  // Customers
  createCustomer: (customer: Partial<Customer>) => Promise<Customer | null>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  // Address Sync
  syncAddressToRelated: (customerId: string, address: Customer['address']) => Promise<{ invoicesUpdated: number; ordersUpdated: number }>;

  // Credit
  updateCreditLimit: (customerId: string, newLimit: number, reason: string) => Promise<void>;
  updateCreditStatus: (customerId: string, status: CreditStatus | string, reason: string) => Promise<void>;

  // Risk
  addRiskIndicator: (indicator: Partial<RiskIndicator>) => Promise<RiskIndicator | null>;
  resolveRiskIndicator: (customerId: string, riskId: string, actionTaken: string) => Promise<void>;

  // Contacts
  addContact: (customerId: string, contact: Partial<CustomerContact>) => Promise<CustomerContact | null>;
  updateContact: (customerId: string, contactId: string, updates: Partial<CustomerContact>) => Promise<void>;
  deleteContact: (customerId: string, contactId: string) => Promise<void>;

  // Analytics (computed in store)
  getAnalytics: () => CustomerAnalytics;
  getCustomerPayments: (customerId: string) => PaymentRecord[];
  getCustomerRevenue: (customerId: string) => RevenueRecord[];
  getCustomerRiskIndicators: (customerId: string) => RiskIndicator[];
  getCustomerContacts: (customerId: string) => CustomerContact[];

  // Selection
  selectCustomer: (id: string | null) => void;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useCustomersStore = create<CustomersState>()(
  persist(
    (set, get) => ({
      customers: [],
      payments: [],
      creditEvents: [],
      revenue: [],
      riskIndicators: [],
      contacts: [],
      selectedCustomerId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      // =======================================================================
      // FETCH
      // =======================================================================

      fetchCustomers: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/customers');
          if (!res.ok) throw new Error('Failed to fetch customers');
          const data = await res.json();

          const customers = (data.customers || []).map(mapApiToCustomer);
          const contacts: CustomerContact[] = [];
          const riskIndicators: RiskIndicator[] = [];

          // Extract related data from included relations
          (data.customers || []).forEach((c: Record<string, unknown>) => {
            if (Array.isArray(c.contacts)) {
              (c.contacts as Record<string, unknown>[]).forEach((contact) =>
                contacts.push(mapApiToContact(contact))
              );
            }
            if (Array.isArray(c.riskIndicators)) {
              (c.riskIndicators as Record<string, unknown>[]).forEach((risk) =>
                riskIndicators.push(mapApiToRiskIndicator(risk))
              );
            }
          });

          set({ customers, contacts, riskIndicators, isLoading: false, isInitialized: true });
        } catch (error) {
          console.error('Failed to fetch customers:', error);
          set({ error: (error as Error).message, isLoading: false, isInitialized: true });
        }
      },

      fetchCustomer: async (id: string) => {
        try {
          const res = await fetch(`/api/customers/${id}`);
          if (!res.ok) throw new Error('Failed to fetch customer');
          const data = await res.json();

          const customer = mapApiToCustomer(data);
          const payments = (data.payments || []).map(mapApiToPayment);
          const creditEvents = (data.creditEvents || []).map(mapApiToCreditEvent);
          const revenue = (data.revenueRecords || []).map(mapApiToRevenue);
          const risks = (data.riskIndicators || []).map(mapApiToRiskIndicator);
          const contacts = (data.contacts || []).map(mapApiToContact);

          set((state) => ({
            customers: state.customers.map((c) => (c.id === id ? customer : c)),
            payments: [...state.payments.filter((p) => p.customerId !== id), ...payments],
            creditEvents: [...state.creditEvents.filter((e) => e.customerId !== id), ...creditEvents],
            revenue: [...state.revenue.filter((r) => r.customerId !== id), ...revenue],
            riskIndicators: [...state.riskIndicators.filter((r) => r.customerId !== id), ...risks],
            contacts: [...state.contacts.filter((c) => c.customerId !== id), ...contacts],
          }));
        } catch (error) {
          console.error('Failed to fetch customer:', error);
        }
      },

      // =======================================================================
      // CUSTOMERS CRUD
      // =======================================================================

      createCustomer: async (data) => {
        try {
          const res = await fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('Failed to create customer');
          const created = await res.json();
          const customer = mapApiToCustomer(created);
          set((state) => ({ customers: [...state.customers, customer] }));
          return customer;
        } catch (error) {
          console.error('Failed to create customer:', error);
          return null;
        }
      },

      updateCustomer: async (id, updates) => {
        // Optimistic update
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        }));

        try {
          await fetch(`/api/customers/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
        } catch (error) {
          console.error('Failed to update customer:', error);
          get().fetchCustomers();
        }
      },

      deleteCustomer: async (id) => {
        try {
          const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Failed to delete customer');
          set((state) => ({
            customers: state.customers.filter((c) => c.id !== id),
            payments: state.payments.filter((p) => p.customerId !== id),
            creditEvents: state.creditEvents.filter((e) => e.customerId !== id),
            revenue: state.revenue.filter((r) => r.customerId !== id),
            riskIndicators: state.riskIndicators.filter((r) => r.customerId !== id),
            contacts: state.contacts.filter((c) => c.customerId !== id),
            selectedCustomerId: state.selectedCustomerId === id ? null : state.selectedCustomerId,
          }));
        } catch (error) {
          console.error('Failed to delete customer:', error);
        }
      },

      // =======================================================================
      // ADDRESS SYNC
      // =======================================================================

      syncAddressToRelated: async (customerId, address) => {
        let invoicesUpdated = 0;
        let ordersUpdated = 0;

        try {
          // Sync address to related invoices
          const invoicesRes = await fetch(`/api/customers/${customerId}/sync-address`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, syncTo: ['invoices', 'orders'] }),
          });

          if (invoicesRes.ok) {
            const data = await invoicesRes.json();
            invoicesUpdated = data.invoicesUpdated || 0;
            ordersUpdated = data.ordersUpdated || 0;
          }

          // Also update the customer's address in local state
          set((state) => ({
            customers: state.customers.map((c) =>
              c.id === customerId
                ? { ...c, address, updatedAt: new Date().toISOString() }
                : c
            ),
          }));

          return { invoicesUpdated, ordersUpdated };
        } catch (error) {
          console.error('Failed to sync address:', error);
          return { invoicesUpdated: 0, ordersUpdated: 0 };
        }
      },

      // =======================================================================
      // CREDIT
      // =======================================================================

      updateCreditLimit: async (customerId, newLimit, reason) => {
        const customer = get().customers.find((c) => c.id === customerId);
        if (!customer) return;

        const type = newLimit > customer.creditLimit ? 'limit_increase' : 'limit_decrease';

        // Optimistic update
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? { ...c, creditLimit: newLimit, creditAvailable: newLimit - c.creditUsed }
              : c
          ),
        }));

        try {
          await fetch(`/api/customers/${customerId}/credit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, newValue: newLimit.toString(), reason }),
          });
          // Refresh to get the new credit event
          get().fetchCustomer(customerId);
        } catch (error) {
          console.error('Failed to update credit limit:', error);
        }
      },

      updateCreditStatus: async (customerId, status, reason) => {
        // Optimistic update
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId ? { ...c, creditStatus: status as CreditStatus } : c
          ),
        }));

        try {
          await fetch(`/api/customers/${customerId}/credit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'status_change', newValue: status, reason }),
          });
          get().fetchCustomer(customerId);
        } catch (error) {
          console.error('Failed to update credit status:', error);
        }
      },

      // =======================================================================
      // RISK
      // =======================================================================

      addRiskIndicator: async (indicator) => {
        if (!indicator.customerId) return null;

        try {
          const res = await fetch(`/api/customers/${indicator.customerId}/risks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(indicator),
          });
          if (!res.ok) throw new Error('Failed to add risk indicator');
          const created = await res.json();
          const risk = mapApiToRiskIndicator(created);
          set((state) => ({ riskIndicators: [...state.riskIndicators, risk] }));
          // Refresh customer to get updated risk level
          get().fetchCustomer(indicator.customerId);
          return risk;
        } catch (error) {
          console.error('Failed to add risk indicator:', error);
          return null;
        }
      },

      resolveRiskIndicator: async (customerId, riskId, actionTaken) => {
        // Optimistic update
        set((state) => ({
          riskIndicators: state.riskIndicators.map((r) =>
            r.id === riskId
              ? { ...r, status: RiskIndicatorStatus.RESOLVED, actionTaken, resolvedAt: new Date().toISOString() }
              : r
          ),
        }));

        try {
          await fetch(`/api/customers/${customerId}/risks/${riskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'resolved', actionTaken }),
          });
          // Refresh customer to get updated risk level
          get().fetchCustomer(customerId);
        } catch (error) {
          console.error('Failed to resolve risk indicator:', error);
        }
      },

      // =======================================================================
      // CONTACTS
      // =======================================================================

      addContact: async (customerId, contact) => {
        try {
          const res = await fetch(`/api/customers/${customerId}/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contact),
          });
          if (!res.ok) throw new Error('Failed to add contact');
          const created = await res.json();
          const newContact = mapApiToContact(created);
          set((state) => ({ contacts: [...state.contacts, newContact] }));
          return newContact;
        } catch (error) {
          console.error('Failed to add contact:', error);
          return null;
        }
      },

      updateContact: async (customerId, contactId, updates) => {
        // Optimistic update
        set((state) => ({
          contacts: state.contacts.map((c) =>
            c.id === contactId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        }));

        try {
          await fetch(`/api/customers/${customerId}/contacts/${contactId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
        } catch (error) {
          console.error('Failed to update contact:', error);
        }
      },

      deleteContact: async (customerId, contactId) => {
        try {
          await fetch(`/api/customers/${customerId}/contacts/${contactId}`, {
            method: 'DELETE',
          });
          set((state) => ({
            contacts: state.contacts.filter((c) => c.id !== contactId),
          }));
        } catch (error) {
          console.error('Failed to delete contact:', error);
        }
      },

      // =======================================================================
      // ANALYTICS (Computed in Store)
      // =======================================================================

      getAnalytics: () => {
        const { customers, riskIndicators } = get();

        const active = customers.filter((c) => c.status === 'active');

        const riskBreakdown = {
          low: customers.filter((c) => c.riskLevel === 'low').length,
          medium: customers.filter((c) => c.riskLevel === 'medium').length,
          high: customers.filter((c) => c.riskLevel === 'high').length,
          critical: customers.filter((c) => c.riskLevel === 'critical').length,
        };

        const paymentBehaviorBreakdown = {
          excellent: customers.filter((c) => c.paymentBehavior === 'excellent').length,
          good: customers.filter((c) => c.paymentBehavior === 'good').length,
          fair: customers.filter((c) => c.paymentBehavior === 'fair').length,
          poor: customers.filter((c) => c.paymentBehavior === 'poor').length,
          delinquent: customers.filter((c) => c.paymentBehavior === 'delinquent').length,
        };

        const topCustomersByRevenue = [...customers]
          .sort((a, b) => b.totalRevenue - a.totalRevenue)
          .slice(0, 10)
          .map((c) => ({ id: c.id, name: c.name, revenue: c.totalRevenue }));

        const atRiskCustomers = customers
          .filter((c) => c.riskLevel === 'high' || c.riskLevel === 'critical')
          .map((c) => ({
            id: c.id,
            name: c.name,
            riskLevel: c.riskLevel,
            indicators: riskIndicators.filter((r) => r.customerId === c.id && r.status === 'active').length,
          }));

        return {
          totalCustomers: customers.length,
          activeCustomers: active.length,
          newCustomersThisMonth: 0,
          churnedThisMonth: 0,
          totalRevenue: customers.reduce((sum, c) => sum + c.totalRevenue, 0),
          averageCustomerValue: active.length > 0
            ? customers.reduce((sum, c) => sum + c.totalRevenue, 0) / active.length
            : 0,
          totalOutstanding: customers.reduce((sum, c) => sum + c.outstandingBalance, 0),
          riskBreakdown,
          paymentBehaviorBreakdown,
          topCustomersByRevenue,
          atRiskCustomers,
        };
      },

      getCustomerPayments: (customerId) => get().payments.filter((p) => p.customerId === customerId),
      getCustomerRevenue: (customerId) => get().revenue.filter((r) => r.customerId === customerId),
      getCustomerRiskIndicators: (customerId) => get().riskIndicators.filter((r) => r.customerId === customerId),
      getCustomerContacts: (customerId) => get().contacts.filter((c) => c.customerId === customerId),

      // =======================================================================
      // SELECTION
      // =======================================================================

      selectCustomer: (id) => set({ selectedCustomerId: id }),
    }),
    {
      name: 'customers-storage',
      partialize: (state) => ({ selectedCustomerId: state.selectedCustomerId }),
    }
  )
);