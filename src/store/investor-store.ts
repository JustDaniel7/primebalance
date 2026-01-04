// src/store/investor-store.ts
// Investor Store - API-connected version

import { create } from 'zustand';
import type {
  InvestorDashboard,
  ReportingPeriod,
  AccessLog,
  DataQuality,
} from '@/types/investor';

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface InvestorState {
  // Data
  dashboard: InvestorDashboard | null;
  investors: any[];
  snapshots: any[];
  runwayProjections: any[];
  boardReports: any[];
  accessLogs: AccessLog[];

  // UI State
  selectedPeriod: ReportingPeriod;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  lastRefresh: string;

  // Fetch Actions
  fetchDashboard: (period?: string) => Promise<void>;
  fetchInvestors: () => Promise<void>;
  fetchSnapshots: (periodType?: string) => Promise<void>;
  fetchRunwayProjections: () => Promise<void>;
  fetchBoardReports: () => Promise<void>;

  // Investor CRUD
  createInvestor: (data: any) => Promise<any>;
  updateInvestor: (id: string, data: any) => Promise<void>;
  deleteInvestor: (id: string) => Promise<void>;

  // Snapshot Actions
  createSnapshot: (data: any) => Promise<void>;

  // Runway Actions
  createRunwayProjection: (data: any) => Promise<void>;

  // Board Report Actions
  createBoardReport: (data: any) => Promise<void>;
  publishBoardReport: (id: string) => Promise<void>;

  // UI Actions
  setSelectedPeriod: (period: ReportingPeriod) => void;
  refreshDashboard: () => Promise<void>;

  // Utility
  exportBoardSummary: () => string;
  getAccessLogs: () => AccessLog[];
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useInvestorStore = create<InvestorState>((set, get) => ({
  // Initial State
  dashboard: null,
  investors: [],
  snapshots: [],
  runwayProjections: [],
  boardReports: [],
  accessLogs: [],

  // UI State
  selectedPeriod: 'ytd',
  isLoading: false,
  error: null,
  isInitialized: false,
  lastRefresh: new Date().toISOString(),

  // =====================================================================
  // FETCH ACTIONS
  // =====================================================================

  fetchDashboard: async (period?: string) => {
    set({ isLoading: true, error: null });
    try {
      const url = period ? `/api/investor/dashboard?period=${period}` : '/api/investor/dashboard';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch investor dashboard');
      const data = await res.json();
      set({
        dashboard: data,
        isLoading: false,
        isInitialized: true,
        lastRefresh: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to fetch investor dashboard:', error);
      set({ error: (error as Error).message, isLoading: false, isInitialized: true });
    }
  },

  fetchInvestors: async () => {
    try {
      const res = await fetch('/api/investor/investors');
      if (!res.ok) throw new Error('Failed to fetch investors');
      const data = await res.json();
      set({ investors: data.investors || [] });
    } catch (error) {
      console.error('Failed to fetch investors:', error);
    }
  },

  fetchSnapshots: async (periodType) => {
    try {
      const params = new URLSearchParams();
      if (periodType) params.append('periodType', periodType);
      const res = await fetch(`/api/investor/snapshots?${params}`);
      if (!res.ok) throw new Error('Failed to fetch snapshots');
      const data = await res.json();
      set({ snapshots: data.snapshots || [] });
    } catch (error) {
      console.error('Failed to fetch snapshots:', error);
    }
  },

  fetchRunwayProjections: async () => {
    try {
      const res = await fetch('/api/investor/runway');
      if (!res.ok) throw new Error('Failed to fetch runway projections');
      const data = await res.json();
      set({ runwayProjections: data.projections || [] });
    } catch (error) {
      console.error('Failed to fetch runway projections:', error);
    }
  },

  fetchBoardReports: async () => {
    try {
      const res = await fetch('/api/investor/board-reports');
      if (!res.ok) throw new Error('Failed to fetch board reports');
      const data = await res.json();
      set({ boardReports: data.reports || [] });
    } catch (error) {
      console.error('Failed to fetch board reports:', error);
    }
  },

  // =====================================================================
  // INVESTOR CRUD
  // =====================================================================

  createInvestor: async (data) => {
    try {
      const res = await fetch('/api/investor/investors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create investor');
      const created = await res.json();
      set((state) => ({ investors: [created, ...state.investors] }));
      return created;
    } catch (error) {
      console.error('Failed to create investor:', error);
      return null;
    }
  },

  updateInvestor: async (id, data) => {
    try {
      const res = await fetch(`/api/investor/investors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update investor');
      const updated = await res.json();
      set((state) => ({
        investors: state.investors.map((i) => (i.id === id ? updated : i)),
      }));
    } catch (error) {
      console.error('Failed to update investor:', error);
    }
  },

  deleteInvestor: async (id) => {
    try {
      await fetch(`/api/investor/investors/${id}`, { method: 'DELETE' });
      set((state) => ({
        investors: state.investors.filter((i) => i.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete investor:', error);
    }
  },

  // =====================================================================
  // SNAPSHOT ACTIONS
  // =====================================================================

  createSnapshot: async (data) => {
    try {
      const res = await fetch('/api/investor/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create snapshot');
      await get().fetchSnapshots();
      await get().fetchDashboard(); // Refresh dashboard with new snapshot
    } catch (error) {
      console.error('Failed to create snapshot:', error);
    }
  },

  // =====================================================================
  // RUNWAY ACTIONS
  // =====================================================================

  createRunwayProjection: async (data) => {
    try {
      const res = await fetch('/api/investor/runway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create runway projection');
      const created = await res.json();
      set((state) => ({
        runwayProjections: [created, ...state.runwayProjections],
      }));
    } catch (error) {
      console.error('Failed to create runway projection:', error);
    }
  },

  // =====================================================================
  // BOARD REPORT ACTIONS
  // =====================================================================

  createBoardReport: async (data) => {
    try {
      const res = await fetch('/api/investor/board-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create board report');
      const created = await res.json();
      set((state) => ({
        boardReports: [created, ...state.boardReports],
      }));
    } catch (error) {
      console.error('Failed to create board report:', error);
    }
  },

  publishBoardReport: async (id) => {
    try {
      await fetch(`/api/investor/board-reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published', publishedAt: new Date().toISOString() }),
      });
      set((state) => ({
        boardReports: state.boardReports.map((r) =>
          r.id === id ? { ...r, status: 'published', publishedAt: new Date().toISOString() } : r
        ),
      }));
    } catch (error) {
      console.error('Failed to publish board report:', error);
    }
  },

  // =====================================================================
  // UI ACTIONS
  // =====================================================================

  setSelectedPeriod: (period) => {
    set({ selectedPeriod: period });
    // Could refetch with different period filter
  },

  refreshDashboard: async () => {
    set({ isLoading: true });
    await get().fetchDashboard();
    set({ isLoading: false });
  },

  // =====================================================================
  // UTILITY
  // =====================================================================

  exportBoardSummary: () => {
    const { dashboard } = get();
    if (!dashboard?.boardSummary) return '{}';
    return JSON.stringify(dashboard.boardSummary, null, 2);
  },

  getAccessLogs: () => get().accessLogs,
}));