// src/store/netting-store.ts
// Netting Store - API-connected version

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  NettingAgreement,
  NettingSession,
  NettingPosition,
  OffsetEntry,
  NettingAnalytics,
  NettingStatus,
} from '@/types/netting';

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface NettingState {
  // Data
  agreements: NettingAgreement[];
  sessions: NettingSession[];
  offsets: OffsetEntry[];
  analytics: NettingAnalytics | null;

  // Selection
  selectedSessionId: string | null;
  selectedAgreementId: string | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Fetch Actions
  fetchAgreements: () => Promise<void>;
  fetchAgreement: (id: string) => Promise<NettingAgreement | null>;
  fetchSessions: (filters?: Record<string, string>) => Promise<void>;
  fetchSession: (id: string) => Promise<NettingSession | null>;
  fetchOffsets: () => Promise<void>;
  fetchAnalytics: () => Promise<void>;

  // Agreement CRUD
  createAgreement: (data: Partial<NettingAgreement>) => Promise<NettingAgreement | null>;
  updateAgreement: (id: string, data: Partial<NettingAgreement>) => Promise<void>;
  deleteAgreement: (id: string) => Promise<void>;

  // Session CRUD
  createSession: (data: Partial<NettingSession>) => Promise<NettingSession | null>;
  updateSession: (id: string, data: Partial<NettingSession>) => Promise<void>;
  submitForApproval: (id: string) => Promise<void>;
  approveSession: (id: string) => Promise<void>;
  rejectSession: (id: string, reason: string) => Promise<void>;
  settleSession: (id: string) => Promise<void>;
  cancelSession: (id: string) => Promise<void>;

  // Offset CRUD
  createOffset: (data: Partial<OffsetEntry>) => Promise<OffsetEntry | null>;
  approveOffset: (id: string) => Promise<void>;
  applyOffset: (id: string) => Promise<void>;
  reverseOffset: (id: string) => Promise<void>;

  // Selection
  selectSession: (id: string | null) => void;
  selectAgreement: (id: string | null) => void;

  // Computed
  getAnalytics: () => NettingAnalytics;
  getSessionPositions: (sessionId: string) => NettingPosition[];
}

// =============================================================================
// DEFAULT ANALYTICS
// =============================================================================

const defaultAnalytics: NettingAnalytics = {
  totalSessions: 0,
  settledSessions: 0,
  pendingSessions: 0,
  totalGrossAmount: 0,
  totalNetAmount: 0,
  totalSavings: 0,
  avgSavingsPercentage: 0,
  byType: {
    counterparty: { sessions: 0, savings: 0 },
    intercompany: { sessions: 0, savings: 0 },
    multilateral: { sessions: 0, savings: 0 },
  },
  recentSessions: [],
  topCounterparties: [],
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useNettingStore = create<NettingState>()(
  persist(
    (set, get) => ({
      // Initial State
      agreements: [],
      sessions: [],
      offsets: [],
      analytics: null,
      selectedSessionId: null,
      selectedAgreementId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      // =====================================================================
      // FETCH ACTIONS
      // =====================================================================

      fetchAgreements: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/netting/agreements');
          if (!res.ok) throw new Error('Failed to fetch agreements');
          const data = await res.json();
          set({ agreements: data.agreements || [], isLoading: false, isInitialized: true });
        } catch (error) {
          console.error('Failed to fetch agreements:', error);
          set({ error: (error as Error).message, isLoading: false, isInitialized: true });
        }
      },

      fetchAgreement: async (id) => {
        try {
          const res = await fetch(`/api/netting/agreements/${id}`);
          if (!res.ok) return null;
          return await res.json();
        } catch (error) {
          console.error('Failed to fetch agreement:', error);
          return null;
        }
      },

      fetchSessions: async (filters) => {
        try {
          const params = new URLSearchParams(filters);
          const res = await fetch(`/api/netting/sessions?${params}`);
          if (!res.ok) throw new Error('Failed to fetch sessions');
          const data = await res.json();
          set({ sessions: data.sessions || [] });
        } catch (error) {
          console.error('Failed to fetch sessions:', error);
        }
      },

      fetchSession: async (id) => {
        try {
          const res = await fetch(`/api/netting/sessions/${id}`);
          if (!res.ok) return null;
          return await res.json();
        } catch (error) {
          console.error('Failed to fetch session:', error);
          return null;
        }
      },

      fetchOffsets: async () => {
        try {
          const res = await fetch('/api/netting/offsets');
          if (!res.ok) throw new Error('Failed to fetch offsets');
          const data = await res.json();
          set({ offsets: data.offsets || [] });
        } catch (error) {
          console.error('Failed to fetch offsets:', error);
        }
      },

      fetchAnalytics: async () => {
        try {
          const res = await fetch('/api/netting/analytics');
          if (!res.ok) throw new Error('Failed to fetch analytics');
          const data = await res.json();
          set({ analytics: data });
        } catch (error) {
          console.error('Failed to fetch analytics:', error);
        }
      },

      // =====================================================================
      // AGREEMENT CRUD
      // =====================================================================

      createAgreement: async (data) => {
        try {
          const res = await fetch('/api/netting/agreements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('Failed to create agreement');
          const created = await res.json();
          set((state) => ({ agreements: [created, ...state.agreements] }));
          return created;
        } catch (error) {
          console.error('Failed to create agreement:', error);
          return null;
        }
      },

      updateAgreement: async (id, data) => {
        try {
          const res = await fetch(`/api/netting/agreements/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('Failed to update agreement');
          const updated = await res.json();
          set((state) => ({
            agreements: state.agreements.map((a) => (a.id === id ? updated : a)),
          }));
        } catch (error) {
          console.error('Failed to update agreement:', error);
        }
      },

      deleteAgreement: async (id) => {
        try {
          await fetch(`/api/netting/agreements/${id}`, { method: 'DELETE' });
          set((state) => ({
            agreements: state.agreements.filter((a) => a.id !== id),
          }));
        } catch (error) {
          console.error('Failed to delete agreement:', error);
        }
      },

      // =====================================================================
      // SESSION CRUD
      // =====================================================================

      createSession: async (data) => {
        try {
          const res = await fetch('/api/netting/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('Failed to create session');
          const created = await res.json();
          set((state) => ({ sessions: [created, ...state.sessions] }));
          return created;
        } catch (error) {
          console.error('Failed to create session:', error);
          return null;
        }
      },

      updateSession: async (id, data) => {
        try {
          const res = await fetch(`/api/netting/sessions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('Failed to update session');
          const updated = await res.json();
          set((state) => ({
            sessions: state.sessions.map((s) => (s.id === id ? updated : s)),
          }));
        } catch (error) {
          console.error('Failed to update session:', error);
        }
      },

      submitForApproval: async (id) => {
        await get().updateSession(id, { status: 'pending_approval' } as any);
      },

      approveSession: async (id) => {
        try {
          const res = await fetch(`/api/netting/sessions/${id}/approve`, { method: 'POST' });
          if (!res.ok) throw new Error('Failed to approve session');
          const updated = await res.json();
          set((state) => ({
            sessions: state.sessions.map((s) => (s.id === id ? updated : s)),
          }));
        } catch (error) {
          console.error('Failed to approve session:', error);
        }
      },

      rejectSession: async (id, reason) => {
        try {
          await fetch(`/api/netting/sessions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'rejected', rejectedReason: reason }),
          });
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === id ? { ...s, status: 'rejected' as NettingStatus, rejectedReason: reason } : s
            ),
          }));
        } catch (error) {
          console.error('Failed to reject session:', error);
        }
      },

      settleSession: async (id) => {
        try {
          const res = await fetch(`/api/netting/sessions/${id}/settle`, { method: 'POST' });
          if (!res.ok) throw new Error('Failed to settle session');
          const updated = await res.json();
          set((state) => ({
            sessions: state.sessions.map((s) => (s.id === id ? updated : s)),
          }));
        } catch (error) {
          console.error('Failed to settle session:', error);
        }
      },

      cancelSession: async (id) => {
        await get().updateSession(id, { status: 'cancelled' } as any);
      },

      // =====================================================================
      // OFFSET CRUD
      // =====================================================================

      createOffset: async (data) => {
        try {
          const res = await fetch('/api/netting/offsets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('Failed to create offset');
          const created = await res.json();
          set((state) => ({ offsets: [created, ...state.offsets] }));
          return created;
        } catch (error) {
          console.error('Failed to create offset:', error);
          return null;
        }
      },

      approveOffset: async (id) => {
        try {
          await fetch(`/api/netting/offsets/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'approved', approvedAt: new Date().toISOString() }),
          });
          set((state) => ({
            offsets: state.offsets.map((o) =>
              o.id === id ? { ...o, status: 'approved' as any, approvedAt: new Date().toISOString() } : o
            ),
          }));
        } catch (error) {
          console.error('Failed to approve offset:', error);
        }
      },

      applyOffset: async (id) => {
        try {
          await fetch(`/api/netting/offsets/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'applied' }),
          });
          set((state) => ({
            offsets: state.offsets.map((o) => (o.id === id ? { ...o, status: 'applied' as any } : o)),
          }));
        } catch (error) {
          console.error('Failed to apply offset:', error);
        }
      },

      reverseOffset: async (id) => {
        try {
          await fetch(`/api/netting/offsets/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'reversed', reversedAt: new Date().toISOString() }),
          });
          set((state) => ({
            offsets: state.offsets.map((o) =>
              o.id === id ? { ...o, status: 'reversed' as any, reversedAt: new Date().toISOString() } : o
            ),
          }));
        } catch (error) {
          console.error('Failed to reverse offset:', error);
        }
      },

      // =====================================================================
      // SELECTION
      // =====================================================================

      selectSession: (id) => set({ selectedSessionId: id }),
      selectAgreement: (id) => set({ selectedAgreementId: id }),

      // =====================================================================
      // COMPUTED
      // =====================================================================

      getAnalytics: () => {
        return get().analytics || defaultAnalytics;
      },

      getSessionPositions: (sessionId) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        return session?.positions || [];
      },
    }),
    {
      name: 'netting-store',
      partialize: (state) => ({
        selectedSessionId: state.selectedSessionId,
        selectedAgreementId: state.selectedAgreementId,
      }),
    }
  )
);