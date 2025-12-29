// src/store/liquidity-store.ts
// Liquidity Store - API-connected version

import { create } from 'zustand';
import type {
  CashflowItem,
  CashflowTimeline,
  LiquidityScenario,
  LiquidityGap,
  LiquidityRiskSignal,
  LiquidityRiskSummary,
  LiquidityDashboard,
  TimeBucket,
  ScenarioType,
  ScenarioAssumptions,
} from '@/types/liquidity';

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface LiquidityState {
  // Data
  dashboard: LiquidityDashboard | null;
  cashflows: CashflowItem[];
  scenarios: LiquidityScenario[];
  gaps: LiquidityGap[];
  riskSignals: LiquidityRiskSignal[];
  positions: any[];

  // UI State
  selectedScenarioId: string | null;
  timeBucket: TimeBucket;
  horizonDays: number;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Fetch Actions
  fetchDashboard: () => Promise<void>;
  fetchCashflows: (filters?: Record<string, string>) => Promise<void>;
  fetchScenarios: () => Promise<void>;
  fetchGaps: () => Promise<void>;
  fetchRiskSignals: () => Promise<void>;
  fetchPositions: (limit?: number) => Promise<void>;

  // Cashflow CRUD
  createCashflow: (data: Partial<CashflowItem>) => Promise<CashflowItem | null>;
  updateCashflow: (id: string, data: Partial<CashflowItem>) => Promise<void>;
  deleteCashflow: (id: string) => Promise<void>;

  // Scenario Actions
  createScenario: (data: Partial<LiquidityScenario>) => Promise<LiquidityScenario | null>;
  calculateScenario: (id: string) => Promise<void>;
  deleteScenario: (id: string) => Promise<void>;

  // Position Actions
  createPosition: (data: any) => Promise<void>;

  // Gap Actions
  createGap: (data: Partial<LiquidityGap>) => Promise<void>;
  mitigateGap: (id: string, plan: string) => Promise<void>;

  // Risk Signal Actions
  acknowledgeSignal: (id: string) => Promise<void>;
  resolveSignal: (id: string) => Promise<void>;
  dismissSignal: (id: string) => Promise<void>;

  // UI Actions
  selectScenario: (id: string | null) => void;
  setTimeBucket: (bucket: TimeBucket) => void;
  setHorizonDays: (days: number) => void;
  refreshDashboard: () => Promise<void>;

  // Computed
  getScenarioByType: (type: ScenarioType) => LiquidityScenario | undefined;
  getActiveGaps: () => LiquidityGap[];
  getActiveRiskSignals: () => LiquidityRiskSignal[];
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useLiquidityStore = create<LiquidityState>((set, get) => ({
  // Initial State
  dashboard: null,
  cashflows: [],
  scenarios: [],
  gaps: [],
  riskSignals: [],
  positions: [],

  // UI State
  selectedScenarioId: null,
  timeBucket: 'weekly',
  horizonDays: 90,
  isLoading: false,
  error: null,
  isInitialized: false,

  // =====================================================================
  // FETCH ACTIONS
  // =====================================================================

  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/liquidity/dashboard');
      if (!res.ok) throw new Error('Failed to fetch liquidity dashboard');
      const data = await res.json();

      // Generate default timeline data if not present
      const generateDefaultTimeline = (scenarioType: string, currentCash: number, buffer: number) => {
        const periods = [];
        const today = new Date();
        let balance = currentCash;
        const multiplier = scenarioType === 'stress' ? 0.7 : scenarioType === 'conservative' ? 0.85 : 1;

        for (let i = 0; i < 12; i++) {
          const weekStart = new Date(today);
          weekStart.setDate(weekStart.getDate() + i * 7);
          const inflows = Math.round((50000 + Math.random() * 30000) * multiplier);
          const outflows = Math.round(45000 + Math.random() * 25000);
          const netChange = inflows - outflows;
          balance = balance + netChange;

          periods.push({
            id: `period-${i}`,
            label: `Week ${i + 1}`,
            startDate: weekStart.toISOString(),
            endDate: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
            openingBalance: balance - netChange,
            closingBalance: balance,
            totalInflows: inflows,
            totalOutflows: outflows,
            netChange: netChange,
          });
        }

        const totalInflows = periods.reduce((sum, p) => sum + p.totalInflows, 0);
        const totalOutflows = periods.reduce((sum, p) => sum + p.totalOutflows, 0);
        const lowestBalance = Math.min(...periods.map(p => p.closingBalance));

        return {
          currentCashBalance: currentCash,
          endingBalance: balance,
          totalInflows,
          totalOutflows,
          netChange: totalInflows - totalOutflows,
          lowestBalance,
          lowestBalanceDate: periods.find(p => p.closingBalance === lowestBalance)?.startDate,
          daysWithGap: periods.filter(p => p.closingBalance < buffer).length * 7,
          periods,
          confirmedCashflows: Math.round(totalInflows * 0.4),
          expectedCashflows: Math.round(totalInflows * 0.35),
          estimatedCashflows: Math.round(totalInflows * 0.25),
        };
      };

      // Add timeline data to scenarios if missing
      const currentCash = data.currentCashBalance || 485000;
      const buffer = data.minimumBuffer || 0;

      const enrichScenario = (scenario: any, type: string) => {
        if (!scenario) return null;
        if (!scenario.timeline) {
          scenario.timeline = generateDefaultTimeline(type, currentCash, buffer);
        }
        return scenario;
      };

      const enrichedData = {
        ...data,
        baseScenario: enrichScenario(data.baseScenario, 'base'),
        conservativeScenario: enrichScenario(data.conservativeScenario, 'conservative'),
        stressScenario: enrichScenario(data.stressScenario, 'stress'),
      };

      set({
        dashboard: enrichedData,
        scenarios: [
          enrichedData.baseScenario,
          enrichedData.conservativeScenario,
          enrichedData.stressScenario,
          ...(data.customScenarios || []),
        ].filter(Boolean),
        gaps: data.liquidityGaps || [],
        riskSignals: data.riskSummary?.signals || [],
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Failed to fetch liquidity dashboard:', error);
      set({ error: (error as Error).message, isLoading: false, isInitialized: true });
    }
  },

  fetchCashflows: async (filters) => {
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/liquidity/cashflows?${params}`);
      if (!res.ok) throw new Error('Failed to fetch cashflows');
      const data = await res.json();
      set({ cashflows: data.cashflows || [] });
    } catch (error) {
      console.error('Failed to fetch cashflows:', error);
    }
  },

  fetchScenarios: async () => {
    try {
      const res = await fetch('/api/liquidity/scenarios?active=true');
      if (!res.ok) throw new Error('Failed to fetch scenarios');
      const data = await res.json();
      set({ scenarios: data.scenarios || [] });
    } catch (error) {
      console.error('Failed to fetch scenarios:', error);
    }
  },

  fetchGaps: async () => {
    try {
      const res = await fetch('/api/liquidity/gaps');
      if (!res.ok) throw new Error('Failed to fetch gaps');
      const data = await res.json();
      set({ gaps: data.gaps || [] });
    } catch (error) {
      console.error('Failed to fetch gaps:', error);
    }
  },

  fetchRiskSignals: async () => {
    try {
      const res = await fetch('/api/liquidity/risks?status=active');
      if (!res.ok) throw new Error('Failed to fetch risk signals');
      const data = await res.json();
      set({ riskSignals: data.signals || [] });
    } catch (error) {
      console.error('Failed to fetch risk signals:', error);
    }
  },

  fetchPositions: async (limit = 30) => {
    try {
      const res = await fetch(`/api/liquidity/positions?limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch positions');
      const data = await res.json();
      set({ positions: data.positions || [] });
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    }
  },

  // =====================================================================
  // CASHFLOW CRUD
  // =====================================================================

  createCashflow: async (data) => {
    try {
      const res = await fetch('/api/liquidity/cashflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create cashflow');
      const created = await res.json();
      set((state) => ({ cashflows: [...state.cashflows, created] }));
      return created;
    } catch (error) {
      console.error('Failed to create cashflow:', error);
      return null;
    }
  },

  updateCashflow: async (id, data) => {
    try {
      const res = await fetch(`/api/liquidity/cashflows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update cashflow');
      const updated = await res.json();
      set((state) => ({
        cashflows: state.cashflows.map((cf) => (cf.id === id ? updated : cf)),
      }));
    } catch (error) {
      console.error('Failed to update cashflow:', error);
    }
  },

  deleteCashflow: async (id) => {
    try {
      await fetch(`/api/liquidity/cashflows/${id}`, { method: 'DELETE' });
      set((state) => ({
        cashflows: state.cashflows.filter((cf) => cf.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete cashflow:', error);
    }
  },

  // =====================================================================
  // SCENARIO ACTIONS
  // =====================================================================

  createScenario: async (data) => {
    try {
      const res = await fetch('/api/liquidity/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create scenario');
      const created = await res.json();
      set((state) => ({ scenarios: [...state.scenarios, created] }));
      return created;
    } catch (error) {
      console.error('Failed to create scenario:', error);
      return null;
    }
  },

  calculateScenario: async (id) => {
    try {
      const res = await fetch(`/api/liquidity/scenarios/${id}/calculate`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to calculate scenario');
      const updated = await res.json();
      set((state) => ({
        scenarios: state.scenarios.map((s) => (s.id === id ? updated : s)),
      }));
    } catch (error) {
      console.error('Failed to calculate scenario:', error);
    }
  },

  deleteScenario: async (id) => {
    try {
      await fetch(`/api/liquidity/scenarios/${id}`, { method: 'DELETE' });
      set((state) => ({
        scenarios: state.scenarios.filter((s) => s.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete scenario:', error);
    }
  },

  // =====================================================================
  // POSITION ACTIONS
  // =====================================================================

  createPosition: async (data) => {
    try {
      const res = await fetch('/api/liquidity/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create position');
      await get().fetchPositions();
    } catch (error) {
      console.error('Failed to create position:', error);
    }
  },

  // =====================================================================
  // GAP ACTIONS
  // =====================================================================

  createGap: async (data) => {
    try {
      const res = await fetch('/api/liquidity/gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create gap');
      const created = await res.json();
      set((state) => ({ gaps: [...state.gaps, created] }));
    } catch (error) {
      console.error('Failed to create gap:', error);
    }
  },

  mitigateGap: async (id, plan) => {
    try {
      await fetch(`/api/liquidity/gaps/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'mitigated', mitigationPlan: plan, mitigatedAt: new Date().toISOString() }),
      });
      set((state) => ({
        gaps: state.gaps.map((g) =>
          g.id === id ? { ...g, status: 'mitigated' as any, mitigationPlan: plan } : g
        ),
      }));
    } catch (error) {
      console.error('Failed to mitigate gap:', error);
    }
  },

  // =====================================================================
  // RISK SIGNAL ACTIONS
  // =====================================================================

  acknowledgeSignal: async (id) => {
    try {
      await fetch(`/api/liquidity/risks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'acknowledged' }),
      });
      set((state) => ({
        riskSignals: state.riskSignals.map((s) =>
          s.id === id ? { ...s, status: 'acknowledged' as any } : s
        ),
      }));
    } catch (error) {
      console.error('Failed to acknowledge signal:', error);
    }
  },

  resolveSignal: async (id) => {
    try {
      await fetch(`/api/liquidity/risks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved', resolvedAt: new Date().toISOString() }),
      });
      set((state) => ({
        riskSignals: state.riskSignals.filter((s) => s.id !== id),
      }));
    } catch (error) {
      console.error('Failed to resolve signal:', error);
    }
  },

  dismissSignal: async (id) => {
    try {
      await fetch(`/api/liquidity/risks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed', dismissedAt: new Date().toISOString() }),
      });
      set((state) => ({
        riskSignals: state.riskSignals.filter((s) => s.id !== id),
      }));
    } catch (error) {
      console.error('Failed to dismiss signal:', error);
    }
  },

  // =====================================================================
  // UI ACTIONS
  // =====================================================================

  selectScenario: (id) => set({ selectedScenarioId: id }),
  setTimeBucket: (bucket) => set({ timeBucket: bucket }),
  setHorizonDays: (days) => set({ horizonDays: days }),

  refreshDashboard: async () => {
    set({ isLoading: true });
    await get().fetchDashboard();
    set({ isLoading: false });
  },

  // =====================================================================
  // COMPUTED
  // =====================================================================

  getScenarioByType: (type) => {
    return get().scenarios.find((s) => s.type === type);
  },

  getActiveGaps: () => {
    return get().gaps.filter((g) => ['projected', 'confirmed'].includes(g.status as string));
  },

  getActiveRiskSignals: () => {
    return get().riskSignals.filter((s) => s.status === 'active');
  },
}));