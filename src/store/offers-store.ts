// src/store/offers-store.ts
// Offers Store - API-connected version

import { create } from 'zustand';
import type {
  Offer,
  OfferStatus,
  OfferLineItem,
  OfferTemplate,
  OfferVersion,
  OfferAuditLog,
  OfferStats,
  OfferCounterparty,
  MarginPreview,
  AcceptanceMethod,
} from '@/types/offers';
import { VALID_TRANSITIONS } from '@/types/offers';

// =============================================================================
// HELPERS
// =============================================================================

const calculateLineItem = (item: Partial<OfferLineItem>): OfferLineItem => {
  const quantity = item.quantity || 0;
  const unitPrice = item.unitPrice || 0;
  const subtotal = quantity * unitPrice;

  let discountAmount = 0;
  if (item.discountType && item.discountValue) {
    if (item.discountType === 'percentage') {
      discountAmount = subtotal * (item.discountValue / 100);
    } else if (item.discountType === 'fixed') {
      discountAmount = item.discountValue;
    }
  }

  const netAmount = subtotal - discountAmount;
  const taxAmount = item.taxRate ? netAmount * (item.taxRate / 100) : 0;

  const costPrice = item.costPrice || 0;
  const totalCost = costPrice * quantity;
  const marginAmount = netAmount - totalCost;
  const marginPercent = netAmount > 0 ? (marginAmount / netAmount) * 100 : 0;

  return {
    id: item.id || `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    lineNumber: item.lineNumber || 1,
    type: item.type || 'product',
    description: item.description || '',
    sku: item.sku,
    quantity,
    unit: item.unit || 'pcs',
    unitPrice,
    currency: item.currency || 'EUR',
    discountType: item.discountType,
    discountValue: item.discountValue,
    discountReason: item.discountReason,
    subtotal,
    discountAmount,
    netAmount,
    costPrice: item.costPrice,
    marginAmount,
    marginPercent,
    taxRate: item.taxRate,
    taxAmount,
    notes: item.notes,
  };
};

const calculateOfferTotals = (lineItems: OfferLineItem[]) => {
  const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalDiscount = lineItems.reduce((sum, item) => sum + item.discountAmount, 0);
  const taxTotal = lineItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
  const grandTotal = subtotal - totalDiscount + taxTotal;

  const totalCost = lineItems.reduce((sum, item) => sum + (item.costPrice || 0) * item.quantity, 0);
  const grossMargin = subtotal - totalDiscount - totalCost;
  const grossMarginPercent = subtotal - totalDiscount > 0 ? (grossMargin / (subtotal - totalDiscount)) * 100 : 0;

  return { subtotal, totalDiscount, taxTotal, grandTotal, totalCost, grossMargin, grossMarginPercent };
};

// =============================================================================
// API MAPPER
// =============================================================================

function mapApiToOffer(api: Record<string, unknown>): Offer {
  const lineItems = (api.lineItems as Partial<OfferLineItem>[]) || [];
  
  return {
    id: api.id as string,
    offerNumber: api.offerNumber as string,
    version: (api.version as number) || 1,
    status: (api.status as OfferStatus) || 'draft',
    counterparty: api.counterparty as OfferCounterparty,
    offerDate: api.offerDate ? new Date(api.offerDate as string).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    validityDays: (api.validityDays as number) || 30,
    expiryDate: api.expiryDate ? new Date(api.expiryDate as string).toISOString().split('T')[0] : '',
    sentAt: api.sentAt ? new Date(api.sentAt as string).toISOString() : undefined,
    acceptedAt: api.acceptedAt ? new Date(api.acceptedAt as string).toISOString() : undefined,
    rejectedAt: api.rejectedAt ? new Date(api.rejectedAt as string).toISOString() : undefined,
    convertedAt: api.convertedAt ? new Date(api.convertedAt as string).toISOString() : undefined,
    currency: (api.currency as string) || 'EUR',
    paymentTerms: (api.paymentTerms as string) || 'net_30',
    deliveryTerms: api.deliveryTerms as string | undefined,
    lineItems: lineItems.map((item, idx) => calculateLineItem({ ...item, lineNumber: idx + 1 })),
    subtotal: Number(api.subtotal) || 0,
    totalDiscount: Number(api.totalDiscount) || 0,
    taxTotal: Number(api.taxTotal) || 0,
    grandTotal: Number(api.grandTotal) || 0,
    totalCost: api.totalCost ? Number(api.totalCost) : undefined,
    grossMargin: api.grossMargin ? Number(api.grossMargin) : undefined,
    grossMarginPercent: api.grossMarginPercent ? Number(api.grossMarginPercent) : undefined,
    internalNotes: api.internalNotes as string | undefined,
    customerNotes: api.customerNotes as string | undefined,
    termsAndConditions: api.termsAndConditions as string | undefined,
    disclaimer: (api.disclaimer as string) || 'This offer is non-binding.',
    acceptanceMethod: api.acceptanceMethod as AcceptanceMethod | undefined,
    rejectionReason: api.rejectionReason as string | undefined,
    convertedOrderId: api.convertedOrderId as string | undefined,
    convertedOrderNumber: api.convertedOrderNumber as string | undefined,
    templateId: api.templateId as string | undefined,
    templateName: api.templateName as string | undefined,
    previousVersionId: api.previousVersionId as string | undefined,
    createdBy: (api.createdBy as string) || 'System',
    createdAt: api.createdAt as string,
    updatedBy: api.updatedBy as string | undefined,
    updatedAt: api.updatedAt as string | undefined,
    sentBy: api.sentBy as string | undefined,
    approvedBy: api.approvedBy as string | undefined,
    organizationId: api.organizationId as string | undefined,
  };
}

function mapApiToTemplate(api: Record<string, unknown>): OfferTemplate {
  return {
    id: api.id as string,
    name: api.name as string,
    description: api.description as string | undefined,
    category: api.category as string | undefined,
    defaultCurrency: (api.defaultCurrency as string) || 'EUR',
    defaultValidityDays: (api.defaultValidityDays as number) || 30,
    defaultPaymentTerms: (api.defaultPaymentTerms as string) || 'net_30',
    defaultDeliveryTerms: api.defaultDeliveryTerms as string | undefined,
    defaultTermsAndConditions: api.defaultTermsAndConditions as string | undefined,
    defaultDisclaimer: (api.defaultDisclaimer as string) || '',
    defaultLineItems: (api.defaultLineItems as Partial<OfferLineItem>[]) || [],
    headerText: api.headerText as string | undefined,
    footerText: api.footerText as string | undefined,
    usageCount: (api.usageCount as number) || 0,
    lastUsedAt: api.lastUsedAt as string | undefined,
    createdBy: (api.createdBy as string) || 'System',
    createdAt: api.createdAt as string,
    isActive: (api.isActive as boolean) ?? true,
  };
}

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface OffersState {
  offers: Offer[];
  templates: OfferTemplate[];
  versions: OfferVersion[];
  auditLogs: OfferAuditLog[];
  selectedOffer: Offer | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  filterStatus: OfferStatus | 'all';

  // Fetch
  fetchOffers: () => Promise<void>;
  fetchOffer: (id: string) => Promise<void>;
  fetchTemplates: () => Promise<void>;

  // Filter & Select
  setFilterStatus: (status: OfferStatus | 'all') => void;
  selectOffer: (id: string | null) => void;
  getOfferById: (id: string) => Offer | undefined;

  // Stats
  getStats: () => OfferStats;

  // CRUD
  createOffer: (offer: Partial<Offer>) => Promise<Offer | null>;
  updateOffer: (id: string, updates: Partial<Offer>) => Promise<void>;
  deleteOffer: (id: string) => Promise<boolean>;
  duplicateOffer: (id: string) => Promise<Offer | null>;

  // Line Items (local only, then sync)
  addLineItem: (offerId: string, item: Partial<OfferLineItem>) => void;
  updateLineItem: (offerId: string, lineId: string, updates: Partial<OfferLineItem>) => void;
  removeLineItem: (offerId: string, lineId: string) => void;

  // Status Transitions
  sendOffer: (id: string) => Promise<boolean>;
  reviseOffer: (id: string, revisionNotes?: string) => Promise<Offer | null>;
  acceptOffer: (id: string, method: AcceptanceMethod) => Promise<boolean>;
  rejectOffer: (id: string, reason?: string) => Promise<boolean>;
  markExpired: (id: string) => Promise<boolean>;
  convertToOrder: (id: string) => Promise<string | null>;

  // Templates
  createFromTemplate: (templateId: string, counterparty: OfferCounterparty) => Promise<Offer | null>;

  // Margin Preview
  getMarginPreview: (id: string) => MarginPreview | null;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useOffersStore = create<OffersState>((set, get) => ({
  offers: [],
  templates: [],
  versions: [],
  auditLogs: [],
  selectedOffer: null,
  isLoading: false,
  isInitialized: false,
  error: null,
  filterStatus: 'all',

  // =========================================================================
  // FETCH
  // =========================================================================

  fetchOffers: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/offers');
      if (!res.ok) throw new Error('Failed to fetch offers');
      const data = await res.json();
      const offers = (data.offers || []).map(mapApiToOffer);
      set({ offers, isLoading: false, isInitialized: true });
    } catch (error) {
      console.error('Failed to fetch offers:', error);
      set({ error: (error as Error).message, isLoading: false, isInitialized: true });
    }
  },

  fetchOffer: async (id: string) => {
    try {
      const res = await fetch(`/api/offers/${id}`);
      if (!res.ok) throw new Error('Failed to fetch offer');
      const data = await res.json();
      const offer = mapApiToOffer(data);
      
      // Extract versions and audit logs
      const versions = (data.versions || []) as OfferVersion[];
      const auditLogs = (data.auditLogs || []) as OfferAuditLog[];

      set((state) => ({
        offers: state.offers.map((o) => (o.id === id ? offer : o)),
        versions: [...state.versions.filter((v) => v.offerId !== id), ...versions],
        auditLogs: [...state.auditLogs.filter((l) => l.offerId !== id), ...auditLogs],
        selectedOffer: offer,
      }));
    } catch (error) {
      console.error('Failed to fetch offer:', error);
    }
  },

  fetchTemplates: async () => {
    try {
      const res = await fetch('/api/offers/templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      const data = await res.json();
      const templates = (data.templates || []).map(mapApiToTemplate);
      set({ templates });
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  },

  // =========================================================================
  // FILTER & SELECT
  // =========================================================================

  setFilterStatus: (status) => set({ filterStatus: status }),

  selectOffer: (id) => {
    if (id) {
      get().fetchOffer(id);
    } else {
      set({ selectedOffer: null });
    }
  },

  getOfferById: (id) => get().offers.find((o) => o.id === id),

  // =========================================================================
  // STATS
  // =========================================================================

  getStats: () => {
    const { offers } = get();
    const byStatus: Record<OfferStatus, number> = {
      draft: 0, sent: 0, revised: 0, accepted: 0, rejected: 0, expired: 0, converted: 0,
    };

    let totalValue = 0;
    let acceptedValue = 0;
    let totalValidityDays = 0;
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    let expiringIn7Days = 0;

    const thisMonth = { created: 0, sent: 0, accepted: 0, rejected: 0 };
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    offers.forEach((offer) => {
      byStatus[offer.status]++;
      totalValue += offer.grandTotal;
      totalValidityDays += offer.validityDays;

      if (offer.status === 'accepted' || offer.status === 'converted') {
        acceptedValue += offer.grandTotal;
      }

      if ((offer.status === 'sent' || offer.status === 'revised') && new Date(offer.expiryDate) <= in7Days) {
        expiringIn7Days++;
      }

      const createdDate = new Date(offer.createdAt);
      if (createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) {
        thisMonth.created++;
      }

      if (offer.sentAt) {
        const sentDate = new Date(offer.sentAt);
        if (sentDate.getMonth() === currentMonth && sentDate.getFullYear() === currentYear) {
          thisMonth.sent++;
        }
      }

      if (offer.acceptedAt) {
        const acceptedDate = new Date(offer.acceptedAt);
        if (acceptedDate.getMonth() === currentMonth && acceptedDate.getFullYear() === currentYear) {
          thisMonth.accepted++;
        }
      }

      if (offer.rejectedAt) {
        const rejectedDate = new Date(offer.rejectedAt);
        if (rejectedDate.getMonth() === currentMonth && rejectedDate.getFullYear() === currentYear) {
          thisMonth.rejected++;
        }
      }
    });

    const sentCount = byStatus.sent + byStatus.revised + byStatus.accepted + byStatus.rejected + byStatus.expired + byStatus.converted;
    const acceptedCount = byStatus.accepted + byStatus.converted;

    return {
      totalOffers: offers.length,
      byStatus,
      totalValue,
      acceptedValue,
      conversionRate: sentCount > 0 ? (acceptedCount / sentCount) * 100 : 0,
      averageValue: offers.length > 0 ? totalValue / offers.length : 0,
      averageValidityDays: offers.length > 0 ? totalValidityDays / offers.length : 30,
      expiringIn7Days,
      thisMonth,
    };
  },

  // =========================================================================
  // CRUD
  // =========================================================================

  createOffer: async (offerData) => {
    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offerData),
      });
      if (!res.ok) throw new Error('Failed to create offer');
      const created = await res.json();
      const offer = mapApiToOffer(created);
      set((state) => ({ offers: [offer, ...state.offers] }));
      return offer;
    } catch (error) {
      console.error('Failed to create offer:', error);
      return null;
    }
  },

  updateOffer: async (id, updates) => {
    // Optimistic update
    set((state) => ({
      offers: state.offers.map((o) => {
        if (o.id !== id) return o;
        const lineItems = updates.lineItems
          ? updates.lineItems.map((item, idx) => calculateLineItem({ ...item, lineNumber: idx + 1 }))
          : o.lineItems;
        const totals = calculateOfferTotals(lineItems);
        return { ...o, ...updates, lineItems, ...totals, updatedAt: new Date().toISOString() };
      }),
    }));

    try {
      await fetch(`/api/offers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Failed to update offer:', error);
      get().fetchOffers();
    }
  },

  deleteOffer: async (id) => {
    try {
      const res = await fetch(`/api/offers/${id}`, { method: 'DELETE' });
      if (!res.ok) return false;
      set((state) => ({
        offers: state.offers.filter((o) => o.id !== id),
        selectedOffer: state.selectedOffer?.id === id ? null : state.selectedOffer,
      }));
      return true;
    } catch (error) {
      console.error('Failed to delete offer:', error);
      return false;
    }
  },

  duplicateOffer: async (id) => {
    try {
      const res = await fetch(`/api/offers/${id}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to duplicate offer');
      const created = await res.json();
      const offer = mapApiToOffer(created);
      set((state) => ({ offers: [offer, ...state.offers] }));
      return offer;
    } catch (error) {
      console.error('Failed to duplicate offer:', error);
      return null;
    }
  },

  // =========================================================================
  // LINE ITEMS (Local updates, then sync via updateOffer)
  // =========================================================================

  addLineItem: (offerId, item) => {
    const offer = get().offers.find((o) => o.id === offerId);
    if (!offer) return;

    const newItem = calculateLineItem({
      ...item,
      id: `line-${Date.now()}`,
      lineNumber: offer.lineItems.length + 1,
      currency: offer.currency,
    });

    const lineItems = [...offer.lineItems, newItem];
    get().updateOffer(offerId, { lineItems });
  },

  updateLineItem: (offerId, lineId, updates) => {
    const offer = get().offers.find((o) => o.id === offerId);
    if (!offer) return;

    const lineItems = offer.lineItems.map((item) =>
      item.id === lineId ? calculateLineItem({ ...item, ...updates }) : item
    );
    get().updateOffer(offerId, { lineItems });
  },

  removeLineItem: (offerId, lineId) => {
    const offer = get().offers.find((o) => o.id === offerId);
    if (!offer) return;

    const lineItems = offer.lineItems
      .filter((item) => item.id !== lineId)
      .map((item, idx) => ({ ...item, lineNumber: idx + 1 }));
    get().updateOffer(offerId, { lineItems });
  },

  // =========================================================================
  // STATUS TRANSITIONS
  // =========================================================================

  sendOffer: async (id) => {
    const offer = get().offers.find((o) => o.id === id);
    if (!offer || !VALID_TRANSITIONS[offer.status]?.includes('sent')) return false;

    try {
      const res = await fetch(`/api/offers/${id}/send`, { method: 'POST' });
      if (!res.ok) return false;
      const updated = await res.json();
      set((state) => ({
        offers: state.offers.map((o) => (o.id === id ? mapApiToOffer(updated) : o)),
      }));
      return true;
    } catch (error) {
      console.error('Failed to send offer:', error);
      return false;
    }
  },

  reviseOffer: async (id, revisionNotes) => {
    const offer = get().offers.find((o) => o.id === id);
    if (!offer || offer.status !== 'sent') return null;

    try {
      const res = await fetch(`/api/offers/${id}/revise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionNotes }),
      });
      if (!res.ok) return null;
      const updated = await res.json();
      const revised = mapApiToOffer(updated);
      set((state) => ({
        offers: state.offers.map((o) => (o.id === id ? revised : o)),
      }));
      return revised;
    } catch (error) {
      console.error('Failed to revise offer:', error);
      return null;
    }
  },

  acceptOffer: async (id, method) => {
    try {
      const res = await fetch(`/api/offers/${id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      });
      if (!res.ok) return false;
      const updated = await res.json();
      set((state) => ({
        offers: state.offers.map((o) => (o.id === id ? mapApiToOffer(updated) : o)),
      }));
      return true;
    } catch (error) {
      console.error('Failed to accept offer:', error);
      return false;
    }
  },

  rejectOffer: async (id, reason) => {
    try {
      const res = await fetch(`/api/offers/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) return false;
      const updated = await res.json();
      set((state) => ({
        offers: state.offers.map((o) => (o.id === id ? mapApiToOffer(updated) : o)),
      }));
      return true;
    } catch (error) {
      console.error('Failed to reject offer:', error);
      return false;
    }
  },

  markExpired: async (id) => {
    const offer = get().offers.find((o) => o.id === id);
    if (!offer || !VALID_TRANSITIONS[offer.status]?.includes('expired')) return false;

    // Use PATCH to update status
    try {
      const res = await fetch(`/api/offers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'expired' }),
      });
      // Note: This won't work as PATCH only allows draft/revised
      // Would need a separate endpoint for expire action
      if (!res.ok) return false;
      get().fetchOffer(id);
      return true;
    } catch (error) {
      console.error('Failed to mark expired:', error);
      return false;
    }
  },

  convertToOrder: async (id) => {
    try {
      const res = await fetch(`/api/offers/${id}/convert`, { method: 'POST' });
      if (!res.ok) return null;
      const data = await res.json();
      const updated = mapApiToOffer(data.offer);
      set((state) => ({
        offers: state.offers.map((o) => (o.id === id ? updated : o)),
      }));
      return data.orderNumber;
    } catch (error) {
      console.error('Failed to convert offer:', error);
      return null;
    }
  },

  // =========================================================================
  // TEMPLATES
  // =========================================================================

  createFromTemplate: async (templateId, counterparty) => {
    const template = get().templates.find((t) => t.id === templateId);
    if (!template) return null;

    const offer = await get().createOffer({
      counterparty,
      currency: template.defaultCurrency,
      validityDays: template.defaultValidityDays,
      paymentTerms: template.defaultPaymentTerms,
      deliveryTerms: template.defaultDeliveryTerms,
      termsAndConditions: template.defaultTermsAndConditions,
      disclaimer: template.defaultDisclaimer,
      lineItems: template.defaultLineItems.map((item) => ({
        ...item,
        quantity: 1,
        currency: template.defaultCurrency,
      })) as OfferLineItem[],
      templateId: template.id,
      templateName: template.name,
    });

    return offer;
  },

  // =========================================================================
  // MARGIN PREVIEW
  // =========================================================================

  getMarginPreview: (id) => {
    const offer = get().offers.find((o) => o.id === id);
    if (!offer) return null;

    const lineItems = offer.lineItems.map((item) => ({
      lineId: item.id,
      description: item.description,
      revenue: item.netAmount,
      cost: (item.costPrice || 0) * item.quantity,
      margin: item.marginAmount || 0,
      marginPercent: item.marginPercent || 0,
    }));

    const totalRevenue = lineItems.reduce((sum, item) => sum + item.revenue, 0);
    const totalCost = lineItems.reduce((sum, item) => sum + item.cost, 0);
    const grossMargin = totalRevenue - totalCost;
    const grossMarginPercent = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
    const discountImpact = offer.totalDiscount;

    const warnings: string[] = [];
    if (grossMarginPercent < 30) warnings.push('Gross margin below 30% threshold');
    if (lineItems.some((item) => item.marginPercent < 20)) warnings.push('One or more line items have margin below 20%');
    if (discountImpact > totalRevenue * 0.15) warnings.push('Total discount exceeds 15% of revenue');

    return {
      lineItems,
      totals: {
        totalRevenue,
        totalCost,
        grossMargin,
        grossMarginPercent,
        discountImpact,
        netMargin: grossMargin,
        netMarginPercent: grossMarginPercent,
      },
      assumptions: [
        'Cost prices based on standard cost data',
        'Margin calculations exclude taxes',
        'No volume rebates or promotional adjustments applied',
      ],
      warnings,
    };
  },
}));