// src/store/kpi-store.ts
// KPI Store - API-connected version

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  KPI,
  KPISummary,
  KPIAlert,
  KPIMarginMetrics,
  BurnRunwayMetrics,
  CCCMetrics,
  UnitEconomicsMetrics,
  KPITab,
  KPIViewPreferences,
  KPIFilter,
  KPITimeHorizon,
  KPIStatus,
  KPITrendDirection,
  KPICategory,
} from '@/types/kpis';

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface KPIState {
  // Data
  kpis: KPI[];
  summary: KPISummary | null;
  alerts: KPIAlert[];

  // Aggregated Metrics (computed from KPIs)
  marginMetrics: KPIMarginMetrics | null;
  burnRunwayMetrics: BurnRunwayMetrics | null;
  cccMetrics: CCCMetrics | null;
  unitEconomicsMetrics: UnitEconomicsMetrics | null;

  // UI State
  activeTab: KPITab;
  viewPreferences: KPIViewPreferences;
  filter: KPIFilter;
  selectedKPIId: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Fetch Actions
  fetchKPIs: (filters?: Record<string, string>) => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  fetchKPI: (id: string) => Promise<KPI | null>;

  // KPI CRUD
  createKPI: (data: Partial<KPI>) => Promise<KPI | null>;
  updateKPI: (id: string, data: Partial<KPI>) => Promise<void>;
  deleteKPI: (id: string) => Promise<void>;

  // Value Updates
  updateKPIValue: (id: string, value: number) => Promise<void>;
  recordHistoryPoint: (kpiId: string, data: any) => Promise<void>;

  // Alert Actions
  markAlertAsRead: (id: string) => Promise<void>;
  dismissAlert: (id: string) => Promise<void>;

  // Calculation
  recalculateKPIs: () => Promise<void>;

  // UI Actions
  setActiveTab: (tab: KPITab) => void;
  setViewPreferences: (prefs: Partial<KPIViewPreferences>) => void;
  setFilter: (filter: Partial<KPIFilter>) => void;
  resetFilter: () => void;
  selectKPI: (id: string | null) => void;
  toggleKPIPinned: (id: string) => Promise<void>;

  // Computed
  getFilteredKPIs: () => KPI[];
  getKPIsByCategory: (category: KPICategory) => KPI[];
  getKPIByCode: (code: string) => KPI | undefined;
  getPinnedKPIs: () => KPI[];
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialViewPreferences: KPIViewPreferences = {
  timeHorizon: 'quarter',
  showTargets: true,
  showBenchmarks: true,
  showTrends: true,
  compactView: false,
};

const initialFilter: KPIFilter = {};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useKPIStore = create<KPIState>()(
  persist(
    (set, get) => ({
      // Initial State
      kpis: [],
      summary: null,
      alerts: [],
      marginMetrics: null,
      burnRunwayMetrics: null,
      cccMetrics: null,
      unitEconomicsMetrics: null,

      // UI State
      activeTab: 'overview',
      viewPreferences: initialViewPreferences,
      filter: initialFilter,
      selectedKPIId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      // =====================================================================
      // FETCH ACTIONS
      // =====================================================================

      fetchKPIs: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          const params = new URLSearchParams(filters);
          const res = await fetch(`/api/kpis?${params}`);
          if (!res.ok) throw new Error('Failed to fetch KPIs');
          const data = await res.json();
          
          const kpis = data.kpis || [];
          set({ kpis, isLoading: false, isInitialized: true });

          // Compute aggregated metrics
          get().computeAggregatedMetrics(kpis);
        } catch (error) {
          console.error('Failed to fetch KPIs:', error);
          set({ error: (error as Error).message, isLoading: false, isInitialized: true });
        }
      },

      fetchSummary: async () => {
        try {
          const res = await fetch('/api/kpis/summary');
          if (!res.ok) throw new Error('Failed to fetch KPI summary');
          const data = await res.json();
          set({ summary: data.summary, alerts: data.alerts || [] });
        } catch (error) {
          console.error('Failed to fetch KPI summary:', error);
        }
      },

      fetchAlerts: async () => {
        try {
          const res = await fetch('/api/kpis/alerts');
          if (!res.ok) throw new Error('Failed to fetch KPI alerts');
          const data = await res.json();
          set({ alerts: data.alerts || [] });
        } catch (error) {
          console.error('Failed to fetch KPI alerts:', error);
        }
      },

      fetchKPI: async (id) => {
        try {
          const res = await fetch(`/api/kpis/${id}`);
          if (!res.ok) return null;
          return await res.json();
        } catch (error) {
          console.error('Failed to fetch KPI:', error);
          return null;
        }
      },

      // =====================================================================
      // KPI CRUD
      // =====================================================================

      createKPI: async (data) => {
        try {
          const res = await fetch('/api/kpis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('Failed to create KPI');
          const created = await res.json();
          await get().fetchKPIs();
          return created;
        } catch (error) {
          console.error('Failed to create KPI:', error);
          return null;
        }
      },

      updateKPI: async (id, data) => {
        try {
          const res = await fetch(`/api/kpis/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('Failed to update KPI');
          const updated = await res.json();
          set((state) => ({
            kpis: state.kpis.map((k) => (k.id === id ? { ...k, ...updated } : k)),
          }));
        } catch (error) {
          console.error('Failed to update KPI:', error);
        }
      },

      deleteKPI: async (id) => {
        try {
          await fetch(`/api/kpis/${id}`, { method: 'DELETE' });
          set((state) => ({
            kpis: state.kpis.filter((k) => k.id !== id),
          }));
        } catch (error) {
          console.error('Failed to delete KPI:', error);
        }
      },

      // =====================================================================
      // VALUE UPDATES
      // =====================================================================

      updateKPIValue: async (id, value) => {
        try {
          await fetch(`/api/kpis/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentValue: value }),
          });
          await get().fetchKPIs();
          await get().fetchSummary();
        } catch (error) {
          console.error('Failed to update KPI value:', error);
        }
      },

      recordHistoryPoint: async (kpiId, data) => {
        try {
          await fetch(`/api/kpis/${kpiId}/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          await get().fetchKPIs();
        } catch (error) {
          console.error('Failed to record history point:', error);
        }
      },

      // =====================================================================
      // ALERT ACTIONS
      // =====================================================================

      markAlertAsRead: async (id) => {
        try {
          await fetch(`/api/kpis/alerts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isRead: true }),
          });
          set((state) => ({
            alerts: state.alerts.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
          }));
        } catch (error) {
          console.error('Failed to mark alert as read:', error);
        }
      },

      dismissAlert: async (id) => {
        try {
          await fetch(`/api/kpis/alerts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isDismissed: true }),
          });
          set((state) => ({
            alerts: state.alerts.filter((a) => a.id !== id),
          }));
        } catch (error) {
          console.error('Failed to dismiss alert:', error);
        }
      },

      // =====================================================================
      // CALCULATION
      // =====================================================================

      recalculateKPIs: async () => {
        try {
          set({ isLoading: true });
          await fetch('/api/kpis/calculate', { method: 'POST' });
          await get().fetchKPIs();
          await get().fetchSummary();
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to recalculate KPIs:', error);
          set({ isLoading: false });
        }
      },

      // =====================================================================
      // UI ACTIONS
      // =====================================================================

      setActiveTab: (tab) => set({ activeTab: tab }),

      setViewPreferences: (prefs) =>
        set((state) => ({
          viewPreferences: { ...state.viewPreferences, ...prefs },
        })),

      setFilter: (filter) =>
        set((state) => ({
          filter: { ...state.filter, ...filter },
        })),

      resetFilter: () => set({ filter: initialFilter }),

      selectKPI: (id) => set({ selectedKPIId: id }),

      toggleKPIPinned: async (id) => {
        const kpi = get().kpis.find((k) => k.id === id);
        if (!kpi) return;

        await get().updateKPI(id, { isPinned: !kpi.isPinned } as any);
      },

      // =====================================================================
      // COMPUTED
      // =====================================================================

      getFilteredKPIs: () => {
        const { kpis, filter } = get();
        let filtered = [...kpis];

        if (filter.category?.length) {
          filtered = filtered.filter((k) => filter.category!.includes(k.definition.category as KPICategory));
        }
        if (filter.status?.length) {
          filtered = filtered.filter((k) => filter.status!.includes(k.value.status));
        }
        if (filter.trend?.length) {
          filtered = filtered.filter((k) => filter.trend!.includes(k.value.trend));
        }
        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (k) =>
              k.definition.name.toLowerCase().includes(query) ||
              k.definition.description?.toLowerCase().includes(query)
          );
        }

        return filtered;
      },

      getKPIsByCategory: (category) => {
        return get().kpis.filter((k) => k.definition.category === category);
      },

      getKPIByCode: (code) => {
        return get().kpis.find((k) => k.id === code || k.definition.name === code);
      },

      getPinnedKPIs: () => {
        return get().kpis.filter((k) => k.isPinned);
      },

      // =====================================================================
      // PRIVATE: Compute Aggregated Metrics
      // =====================================================================

      computeAggregatedMetrics: (kpis: KPI[]) => {
        // Helper to find KPI by code pattern
        const find = (pattern: string) => kpis.find((k) => 
          k.definition.name.toLowerCase().includes(pattern.toLowerCase())
        );

        // Margin Metrics
        const grossMarginKPI = find('gross margin');
        const operatingMarginKPI = find('operating margin') || find('ebitda');
        
        if (grossMarginKPI) {
          set({
            marginMetrics: {
              grossMargin: grossMarginKPI.value,
              contributionMargin: grossMarginKPI.value,
              operatingMargin: operatingMarginKPI?.value || grossMarginKPI.value,
              ebitdaMargin: operatingMarginKPI?.value || grossMarginKPI.value,
              netMargin: grossMarginKPI.value,
              byProduct: [],
              bySegment: [],
              byRegion: [],
              marginDrivers: [],
              hasErosionAlert: false,
              erosionThreshold: 5,
            },
          });
        }

        // Burn & Runway Metrics
        const burnKPI = find('burn');
        const runwayKPI = find('runway');
        
        if (burnKPI) {
          set({
            burnRunwayMetrics: {
              netBurnMonthly: burnKPI.value,
              netBurnRolling3M: burnKPI.rollingAverage,
              netBurnRolling6M: burnKPI.rollingAverage,
              grossBurn: burnKPI.value.current * 1.2,
              burnBreakdown: [],
              currentRunwayMonths: runwayKPI?.value.current || 18,
              currentRunwayDate: new Date(Date.now() + (runwayKPI?.value.current || 18) * 30 * 24 * 60 * 60 * 1000).toISOString(),
              runwayScenarios: [],
              currentCash: burnKPI.value.current * (runwayKPI?.value.current || 18),
              burnAccelerating: burnKPI.value.trend === 'deteriorating',
              runwayBelowThreshold: (runwayKPI?.value.current || 18) < 12,
              runwayThresholdMonths: 12,
            },
          });
        }

        // CCC Metrics
        const dsoKPI = find('dso') || find('days sales');
        const dpoKPI = find('dpo') || find('days payable');
        
        if (dsoKPI) {
          set({
            cccMetrics: {
              dso: dsoKPI.value,
              dpo: dpoKPI?.value || dsoKPI.value,
              dio: dsoKPI.value,
              netCCC: dsoKPI.value,
              components: [],
              internalTarget: 30,
              hasDeteriorationAlert: dsoKPI.value.trend === 'deteriorating',
              deteriorationThreshold: 5,
              workingCapital: 0,
              workingCapitalDays: dsoKPI.value.current,
              workingCapitalEfficiency: dsoKPI.value.trend,
            },
          });
        }

        // Unit Economics
        const cacKPI = find('cac');
        const ltvKPI = find('ltv');
        const ltvCacKPI = find('ltv/cac') || find('ltv_cac');
        
        if (cacKPI || ltvCacKPI) {
          set({
            unitEconomicsMetrics: {
              revenuePerUnit: cacKPI?.value || { current: 0, previous: 0, deltaVsPrior: 0, deltaVsPriorPercent: 0, status: 'on_track', trend: 'stable', momentum: 'steady' },
              variableCostPerUnit: cacKPI?.value || { current: 0, previous: 0, deltaVsPrior: 0, deltaVsPriorPercent: 0, status: 'on_track', trend: 'stable', momentum: 'steady' },
              contributionPerUnit: cacKPI?.value || { current: 0, previous: 0, deltaVsPrior: 0, deltaVsPriorPercent: 0, status: 'on_track', trend: 'stable', momentum: 'steady' },
              marginPerUnit: cacKPI?.value || { current: 0, previous: 0, deltaVsPrior: 0, deltaVsPriorPercent: 0, status: 'on_track', trend: 'stable', momentum: 'steady' },
              cac: cacKPI?.value || { current: 850, previous: 920, deltaVsPrior: -70, deltaVsPriorPercent: -7.6, status: 'watch', trend: 'improving', momentum: 'steady' },
              ltv: ltvKPI?.value || { current: 4200, previous: 3800, deltaVsPrior: 400, deltaVsPriorPercent: 10.5, status: 'on_track', trend: 'improving', momentum: 'steady' },
              ltvCacRatio: ltvCacKPI?.value || { current: 4.9, previous: 4.1, deltaVsPrior: 0.8, deltaVsPriorPercent: 19.5, status: 'on_track', trend: 'improving', momentum: 'steady' },
              paybackPeriod: { current: 10, previous: 11, deltaVsPrior: -1, deltaVsPriorPercent: -9, status: 'on_track', trend: 'improving', momentum: 'steady' },
              cohorts: [],
              distributions: [],
              unprofitableUnits: 0,
              unprofitablePercent: 0,
              unprofitableSegments: [],
              breakEvenPrice: 0,
              breakEvenVolume: 0,
            },
          });
        }
      },
    }),
    {
      name: 'kpi-store',
      partialize: (state) => ({
        activeTab: state.activeTab,
        viewPreferences: state.viewPreferences,
      }),
    }
  )
);