// src/store/fx-store.ts
// FX Store - API-connected version

import { create } from 'zustand';
import type {
  FXDashboard,
  FXRate,
  CurrencyExposure,
  FXConversion,
  FXScenario,
  FXAuditLog,
  ExposureSummary,
  FXRiskSummary,
  FXCost,
  ExposureType,
  TimeHorizon,
} from '@/types/fx';

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface FXState {
  // Data
  dashboard: FXDashboard | null;
  rates: FXRate[];
  exposures: CurrencyExposure[];
  conversions: FXConversion[];
  scenarios: FXScenario[];
  auditLogs: FXAuditLog[];

  // Summaries (computed from dashboard)
  exposureSummary: ExposureSummary | null;
  riskSummary: FXRiskSummary | null;
  currentPeriodCosts: FXCost | null;

  // UI State
  selectedCurrency: string | null;
  selectedTimeHorizon: TimeHorizon | 'all';
  selectedExposureType: ExposureType | 'all';
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Fetch Actions
  fetchDashboard: () => Promise<void>;
  fetchRates: (baseCurrency?: string) => Promise<void>;
  fetchExposures: (filters?: Record<string, string>) => Promise<void>;
  fetchConversions: () => Promise<void>;
  fetchScenarios: () => Promise<void>;

  // Rate Actions
  createRate: (rate: Partial<FXRate>) => Promise<void>;

  // Exposure Actions
  createExposure: (exposure: Partial<CurrencyExposure>) => Promise<void>;

  // Conversion Actions
  createConversion: (conversion: Partial<FXConversion>) => Promise<FXConversion | null>;
  completeConversion: (id: string) => Promise<void>;

  // Scenario Actions
  createScenario: (scenario: Partial<FXScenario>) => Promise<void>;
  runScenario: (id: string) => Promise<void>;
  deleteScenario: (id: string) => Promise<void>;

  // Filter Actions
  setSelectedCurrency: (currency: string | null) => void;
  setSelectedTimeHorizon: (horizon: TimeHorizon | 'all') => void;
  setSelectedExposureType: (type: ExposureType | 'all') => void;

  // Refresh
  refreshDashboard: () => Promise<void>;

  // Computed
  getFilteredExposures: () => CurrencyExposure[];
  getExposureByCurrency: (currency: string) => CurrencyExposure | undefined;
  getRateForCurrency: (currency: string) => FXRate | undefined;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useFXStore = create<FXState>((set, get) => ({
  // Initial State
  dashboard: null,
  rates: [],
  exposures: [],
  conversions: [],
  scenarios: [],
  auditLogs: [],
  exposureSummary: null,
  riskSummary: null,
  currentPeriodCosts: null,

  // UI State
  selectedCurrency: null,
  selectedTimeHorizon: 'all',
  selectedExposureType: 'all',
  isLoading: false,
  error: null,
  isInitialized: false,

  // =====================================================================
  // FETCH ACTIONS
  // =====================================================================

  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/fx/dashboard');
      if (!res.ok) throw new Error('Failed to fetch FX dashboard');
      const data = await res.json();

      set({
        dashboard: data,
        rates: data.currentRates || [],
        exposures: data.exposures || [],
        conversions: data.recentConversions || [],
        scenarios: data.activeScenarios || [],
        exposureSummary: data.exposureSummary || null,
        riskSummary: data.riskSummary || null,
        currentPeriodCosts: data.currentPeriodCosts || null,
        isInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch FX dashboard:', error);
      set({ error: (error as Error).message, isLoading: false, isInitialized: true });
    }
  },

  fetchRates: async (baseCurrency) => {
    try {
      const params = new URLSearchParams();
      if (baseCurrency) params.append('base', baseCurrency);

      const res = await fetch(`/api/fx/rates?${params}`);
      if (!res.ok) throw new Error('Failed to fetch rates');
      const data = await res.json();
      set({ rates: data.rates || [] });
    } catch (error) {
      console.error('Failed to fetch rates:', error);
    }
  },

  fetchExposures: async (filters) => {
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/fx/exposures?${params}`);
      if (!res.ok) throw new Error('Failed to fetch exposures');
      const data = await res.json();
      set({ exposures: data.exposures || [] });
    } catch (error) {
      console.error('Failed to fetch exposures:', error);
    }
  },

  fetchConversions: async () => {
    try {
      const res = await fetch('/api/fx/conversions');
      if (!res.ok) throw new Error('Failed to fetch conversions');
      const data = await res.json();
      set({ conversions: data.conversions || [] });
    } catch (error) {
      console.error('Failed to fetch conversions:', error);
    }
  },

  fetchScenarios: async () => {
    try {
      const res = await fetch('/api/fx/scenarios');
      if (!res.ok) throw new Error('Failed to fetch scenarios');
      const data = await res.json();
      set({ scenarios: data.scenarios || [] });
    } catch (error) {
      console.error('Failed to fetch scenarios:', error);
    }
  },

  // =====================================================================
  // RATE ACTIONS
  // =====================================================================

  createRate: async (rate) => {
    try {
      const res = await fetch('/api/fx/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rate),
      });
      if (!res.ok) throw new Error('Failed to create rate');
      await get().fetchRates();
    } catch (error) {
      console.error('Failed to create rate:', error);
    }
  },

  // =====================================================================
  // EXPOSURE ACTIONS
  // =====================================================================

  createExposure: async (exposure) => {
    try {
      const res = await fetch('/api/fx/exposures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exposure),
      });
      if (!res.ok) throw new Error('Failed to create exposure');
      await get().fetchExposures();
    } catch (error) {
      console.error('Failed to create exposure:', error);
    }
  },

  // =====================================================================
  // CONVERSION ACTIONS
  // =====================================================================

  createConversion: async (conversion) => {
    try {
      const res = await fetch('/api/fx/conversions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversion),
      });
      if (!res.ok) throw new Error('Failed to create conversion');
      const created = await res.json();
      set((state) => ({ conversions: [created, ...state.conversions] }));
      return created;
    } catch (error) {
      console.error('Failed to create conversion:', error);
      return null;
    }
  },

  completeConversion: async (id) => {
    try {
      await fetch(`/api/fx/conversions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      set((state) => ({
        conversions: state.conversions.map((c) =>
          c.id === id ? { ...c, status: 'completed' } : c
        ),
      }));
    } catch (error) {
      console.error('Failed to complete conversion:', error);
    }
  },

  // =====================================================================
  // SCENARIO ACTIONS
  // =====================================================================

  createScenario: async (scenario) => {
    try {
      const res = await fetch('/api/fx/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenario),
      });
      if (!res.ok) throw new Error('Failed to create scenario');
      const created = await res.json();
      set((state) => ({ scenarios: [created, ...state.scenarios] }));
    } catch (error) {
      console.error('Failed to create scenario:', error);
    }
  },

  runScenario: async (id) => {
    try {
      const res = await fetch(`/api/fx/scenarios/${id}/run`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to run scenario');
      const updated = await res.json();
      set((state) => ({
        scenarios: state.scenarios.map((s) => (s.id === id ? updated : s)),
      }));
    } catch (error) {
      console.error('Failed to run scenario:', error);
    }
  },

  deleteScenario: async (id) => {
    try {
      await fetch(`/api/fx/scenarios/${id}`, { method: 'DELETE' });
      set((state) => ({
        scenarios: state.scenarios.filter((s) => s.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete scenario:', error);
    }
  },

  // =====================================================================
  // FILTER ACTIONS
  // =====================================================================

  setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),
  setSelectedTimeHorizon: (horizon) => set({ selectedTimeHorizon: horizon }),
  setSelectedExposureType: (type) => set({ selectedExposureType: type }),

  // =====================================================================
  // REFRESH
  // =====================================================================

  refreshDashboard: async () => {
    set({ isLoading: true });
    await get().fetchDashboard();
    set({ isLoading: false });
  },

  // =====================================================================
  // COMPUTED
  // =====================================================================

  getFilteredExposures: () => {
    const { exposures, selectedCurrency, selectedTimeHorizon, selectedExposureType } = get();
    let filtered = [...exposures];

    if (selectedCurrency) {
      filtered = filtered.filter((e) => e.currency === selectedCurrency);
    }
    if (selectedTimeHorizon !== 'all') {
      filtered = filtered.filter((e) => e.timeHorizon === selectedTimeHorizon);
    }
    if (selectedExposureType !== 'all') {
      filtered = filtered.filter((e) => e.exposureType === selectedExposureType);
    }

    return filtered;
  },

  getExposureByCurrency: (currency) => {
    return get().exposures.find((e) => e.currency === currency);
  },

  getRateForCurrency: (currency) => {
    return get().rates.find((r) => r.quoteCurrency === currency);
  },
}));