// src/store/customers-store.ts
// Customers Store - API-connected version
// REPLACE: src/store/customers-store.ts

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
  CustomerStatus,
  CustomerAccountType,
  CreditStatus,
  RiskLevel,
  PaymentBehavior,
} from '@/types/customers';

// =============================================================================
// API MAPPERS
// =============================================================================

function mapApiToCustomer(api: Record<string, unknown>): Customer {
  return {
    id: api.id as string,
    customerNumber: api.customerNumber as string,
    name: api.name as string,
    type: (api.type as CustomerAccountType) || 'business',
    status: (api.status as CustomerStatus) || 'active',
    industry: api.industry as string | undefined,
    email: (api.email as string) || '',
    phone: api.phone as string | undefined,
    website: api.website as string | undefined,
    address: api.address as Customer['address'],
    taxId: api.taxId as string | undefined,
    legalName: api.legalName as string | undefined,
    creditLimit: Number(api.creditLimit) || 0,
    creditUsed: Number(api.creditUsed) || 0,
    creditAvailable: Number(api.creditAvailable) || 0,
    creditStatus: (api.creditStatus as CreditStatus) || 'approved',
    paymentTerms: (api.paymentTerms as string) || 'Net 30',
    paymentBehavior: (api.paymentBehavior as PaymentBehavior) || 'good',
    averageDaysToPayment: (api.averageDaysToPayment as number) || 0,
    riskLevel: (api.riskLevel as RiskLevel) || 'low',
    riskScore: (api.riskScore as number) || 0,
    totalRevenue: Number(api.totalRevenue) || 0,
    totalOrders: (api.totalOrders as number) || 0,
    averageOrderValue: Number(api.averageOrderValue) || 0,
    outstandingBalance: Number(api.outstandingBalance) || 0,
    overdueAmount: Number(api.overdueAmount) || 0,
    currency: (api.currency as string) || 'EUR',
    latePaymentCount: (api.latePaymentCount as number) || 0,
    customerSince: api.customerSince as string,
    accountManagerId: api.accountManagerId as string | undefined,
    accountManagerName: api.accountManagerName as string | undefined,
    preferredLanguage: (api.preferredLanguage as string) || 'en',
    invoiceDelivery: (api.invoiceDelivery as 'email' | 'mail' | 'portal') || 'email',
    tags: (api.tags as string[]) || [],
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
    role: (api.role as CustomerContact['role']) || 'general',
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
    invoiceDate: api.invoiceDate as string,
    dueDate: api.dueDate as string,
    paymentDate: api.paymentDate as string | undefined,
    status: (api.status as PaymentRecord['status']) || 'pending',
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
    periodType: api.periodType as RevenueRecord['periodType'],
    revenue: Number(api.revenue) || 0,
    cost: api.cost ? Number(api.cost) : undefined,
    profit: api.profit ? Number(api.profit) : undefined,
    margin: api.margin ? Number(api.margin) : undefined,
    orderCount: (api.orderCount as number) || 0,
    averageOrderValue: Number(api.averageOrderValue) || 0,
    createdAt: api.createdAt as string,
  };
}

function mapApiToRiskIndicator(api: Record<string, unknown>): RiskIndicator {
  return {
    id: api.id as string,
    customerId: api.customerId as string,
    category: api.category as RiskIndicator['category'],
    indicator: api.indicator as string,
    description: api.description as string,
    severity: (api.severity as RiskLevel) || 'medium',
    score: (api.score as number) || 0,
    status: (api.status as RiskIndicator['status']) || 'active',
    detectedAt: api.detectedAt as string,
    resolvedAt: api.resolvedAt as string | undefined,
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
  createCustomer: (customer: Omit<Customer, 'id' | 'customerNumber' | 'createdAt' | 'updatedAt'>) => Promise<Customer | null>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  // Credit
  updateCreditLimit: (customerId: string, newLimit: number, reason: string) => Promise<void>;
  updateCreditStatus: (customerId: string, status: CreditStatus, reason: string) => Promise<void>;

  // Risk
  addRiskIndicator: (indicator: Omit<RiskIndicator, 'id' | 'createdAt' | 'updatedAt'>) => Promise<RiskIndicator | null>;
  resolveRiskIndicator: (id: string, actionTaken: string) => Promise<void>;

  // Contacts
  addContact: (contact: Omit<CustomerContact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CustomerContact | null>;
  updateContact: (id: string, updates: Partial<CustomerContact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;

  // Analytics
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

      // =================================================================
      // API
      // =================================================================

      fetchCustomers: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/customers');
          if (!response.ok) throw new Error('Failed to fetch customers');
          const data = await response.json();

          const customers = (data.customers || []).map(mapApiToCustomer);

          set({
            customers,
            isLoading: false,
            isInitialized: true,
          });
        } catch (error) {
          console.error('Failed to fetch customers:', error);
          set({ error: (error as Error).message, isLoading: false, isInitialized: true });
        }
      },

      fetchCustomer: async (id: string) => {
        try {
          const response = await fetch(`/api/customers/${id}`);
          if (!response.ok) return;
          const data = await response.json();

          const customer = mapApiToCustomer(data);
          const contacts = (data.contacts || []).map(mapApiToContact);
          const payments = (data.payments || []).map(mapApiToPayment);
          const creditEvents = (data.creditEvents || []).map(mapApiToCreditEvent);
          const revenueRecords = (data.revenueRecords || []).map(mapApiToRevenue);
          const riskIndicators = (data.riskIndicators || []).map(mapApiToRiskIndicator);

          set((state) => ({
            customers: state.customers.map((c) => (c.id === id ? customer : c)),
            contacts: [
              ...state.contacts.filter((c) => c.customerId !== id),
              ...contacts,
            ],
            payments: [
              ...state.payments.filter((p) => p.customerId !== id),
              ...payments,
            ],
            creditEvents: [
              ...state.creditEvents.filter((e) => e.customerId !== id),
              ...creditEvents,
            ],
            revenue: [
              ...state.revenue.filter((r) => r.customerId !== id),
              ...revenueRecords,
            ],
            riskIndicators: [
              ...state.riskIndicators.filter((r) => r.customerId !== id),
              ...riskIndicators,
            ],
          }));
        } catch (error) {
          console.error('Failed to fetch customer:', error);
        }
      },

      // =================================================================
      // CUSTOMERS
      // =================================================================

      createCustomer: async (data) => {
        try {
          const response = await fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!response.ok) throw new Error('Failed to create customer');
          const created = await response.json();
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
        }
      },

      deleteCustomer: async (id) => {
        set((state) => ({ customers: state.customers.filter((c) => c.id !== id) }));

        try {
          await fetch(`/api/customers/${id}`, { method: 'DELETE' });
        } catch (error) {
          console.error('Failed to delete customer:', error);
        }
      },

      // =================================================================
      // CREDIT
      // =================================================================

      updateCreditLimit: async (customerId, newLimit, reason) => {
        const customer = get().customers.find((c) => c.id === customerId);
        if (!customer) return;

        const event: CreditEvent = {
          id: `credit-${Date.now()}`,
          customerId,
          type: newLimit > customer.creditLimit ? 'limit_increase' : 'limit_decrease',
          previousValue: customer.creditLimit.toString(),
          newValue: newLimit.toString(),
          reason,
          changedByName: 'Current User',
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  creditLimit: newLimit,
                  creditAvailable: newLimit - c.creditUsed,
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
          creditEvents: [event, ...state.creditEvents],
        }));

        try {
          await fetch(`/api/customers/${customerId}/credit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: event.type,
              newValue: newLimit.toString(),
              reason,
            }),
          });
        } catch (error) {
          console.error('Failed to update credit limit:', error);
        }
      },

      updateCreditStatus: async (customerId, status, reason) => {
        const customer = get().customers.find((c) => c.id === customerId);
        if (!customer) return;

        const event: CreditEvent = {
          id: `credit-${Date.now()}`,
          customerId,
          type: 'status_change',
          previousValue: customer.creditStatus,
          newValue: status,
          reason,
          changedByName: 'Current User',
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId ? { ...c, creditStatus: status, updatedAt: new Date().toISOString() } : c
          ),
          creditEvents: [event, ...state.creditEvents],
        }));

        try {
          await fetch(`/api/customers/${customerId}/credit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'status_change', newValue: status, reason }),
          });
        } catch (error) {
          console.error('Failed to update credit status:', error);
        }
      },

      // =================================================================
      // RISK
      // =================================================================

      addRiskIndicator: async (data) => {
        try {
          const response = await fetch(`/api/customers/${data.customerId}/risk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!response.ok) throw new Error('Failed to add risk indicator');
          const created = await response.json();
          const indicator = mapApiToRiskIndicator(created);

          set((state) => ({ riskIndicators: [...state.riskIndicators, indicator] }));

          // Refetch customer to get updated risk score
          await get().fetchCustomer(data.customerId);

          return indicator;
        } catch (error) {
          console.error('Failed to add risk indicator:', error);
          return null;
        }
      },

      resolveRiskIndicator: async (id, actionTaken) => {
        const indicator = get().riskIndicators.find((r) => r.id === id);
        if (!indicator) return;

        set((state) => ({
          riskIndicators: state.riskIndicators.map((r) =>
            r.id === id
              ? { ...r, status: 'resolved' as const, actionTaken, resolvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : r
          ),
        }));

        try {
          await fetch(`/api/customers/${indicator.customerId}/risk/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'resolved', actionTaken }),
          });

          // Refetch customer to get updated risk score
          await get().fetchCustomer(indicator.customerId);
        } catch (error) {
          console.error('Failed to resolve risk indicator:', error);
        }
      },

      // =================================================================
      // CONTACTS
      // =================================================================

      addContact: async (data) => {
        try {
          const response = await fetch(`/api/customers/${data.customerId}/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!response.ok) throw new Error('Failed to add contact');
          const created = await response.json();
          const contact = mapApiToContact(created);

          set((state) => ({ contacts: [...state.contacts, contact] }));
          return contact;
        } catch (error) {
          console.error('Failed to add contact:', error);
          return null;
        }
      },

      updateContact: async (id, updates) => {
        const contact = get().contacts.find((c) => c.id === id);
        if (!contact) return;

        set((state) => ({
          contacts: state.contacts.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        }));

        try {
          await fetch(`/api/customers/${contact.customerId}/contacts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
        } catch (error) {
          console.error('Failed to update contact:', error);
        }
      },

      deleteContact: async (id) => {
        const contact = get().contacts.find((c) => c.id === id);
        if (!contact) return;

        set((state) => ({ contacts: state.contacts.filter((c) => c.id !== id) }));

        try {
          await fetch(`/api/customers/${contact.customerId}/contacts/${id}`, { method: 'DELETE' });
        } catch (error) {
          console.error('Failed to delete contact:', error);
        }
      },

      // =================================================================
      // ANALYTICS
      // =================================================================

      getAnalytics: () => {
        const { customers, riskIndicators } = get();
        const activeCustomers = customers.filter((c) => c.status === 'active');

        return {
          totalCustomers: customers.length,
          activeCustomers: activeCustomers.length,
          newCustomersThisMonth: customers.filter(
            (c) => new Date(c.customerSince) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ).length,
          churnedThisMonth: customers.filter((c) => c.status === 'churned').length,
          totalRevenue: customers.reduce((sum, c) => sum + c.totalRevenue, 0),
          averageCustomerValue:
            customers.length > 0 ? customers.reduce((sum, c) => sum + c.totalRevenue, 0) / customers.length : 0,
          totalOutstanding: customers.reduce((sum, c) => sum + c.outstandingBalance, 0),
          riskBreakdown: {
            low: customers.filter((c) => c.riskLevel === 'low').length,
            medium: customers.filter((c) => c.riskLevel === 'medium').length,
            high: customers.filter((c) => c.riskLevel === 'high').length,
            critical: customers.filter((c) => c.riskLevel === 'critical').length,
          },
          paymentBehaviorBreakdown: {
            excellent: customers.filter((c) => c.paymentBehavior === 'excellent').length,
            good: customers.filter((c) => c.paymentBehavior === 'good').length,
            fair: customers.filter((c) => c.paymentBehavior === 'fair').length,
            poor: customers.filter((c) => c.paymentBehavior === 'poor').length,
            delinquent: customers.filter((c) => c.paymentBehavior === 'delinquent').length,
          },
          topCustomersByRevenue: [...customers]
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5)
            .map((c) => ({ id: c.id, name: c.name, revenue: c.totalRevenue })),
          atRiskCustomers: customers
            .filter((c) => c.riskLevel === 'high' || c.riskLevel === 'critical')
            .map((c) => ({
              id: c.id,
              name: c.name,
              riskLevel: c.riskLevel,
              indicators: riskIndicators.filter((r) => r.customerId === c.id && r.status === 'active').length,
            })),
        };
      },

      getCustomerPayments: (customerId) => get().payments.filter((p) => p.customerId === customerId),
      getCustomerRevenue: (customerId) => get().revenue.filter((r) => r.customerId === customerId),
      getCustomerRiskIndicators: (customerId) => get().riskIndicators.filter((r) => r.customerId === customerId),
      getCustomerContacts: (customerId) => get().contacts.filter((c) => c.customerId === customerId),

      selectCustomer: (id) => set({ selectedCustomerId: id }),
    }),
    {
      name: 'primebalance-customers',
      partialize: (state) => ({
        selectedCustomerId: state.selectedCustomerId,
      }),
    }
  )
);