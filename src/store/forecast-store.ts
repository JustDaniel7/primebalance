// src/store/forecast-store.ts
// Forecast Store - API-connected version

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  RevenueForecast,
  RevenueLineItem,
  CostForecast,
  CostLineItem,
  CashForecast,
  CashPeriod,
  ForecastSummary,
  ForecastScenario,
  ForecastAssumption,
  ForecastAlert,
  ForecastActualComparison,
  ForecastAccuracyTrend,
  ForecastViewPreferences,
  ForecastFilter,
  ForecastTab,
  ForecastValue,
  TimeHorizon,
  TimeGranularity,
  ConfidenceLevel,
} from '@/types/forecast';

// =============================================================================
// INITIAL STATES
// =============================================================================

const initialViewPreferences: ForecastViewPreferences = {
  timeHorizon: 'quarter',
  granularity: 'monthly',
  activeScenarioId: null,
  showBestWorstCase: true,
  showConfidenceIndicators: true,
  showAnnotations: false,
  comparisonMode: 'side_by_side',
  varianceThreshold: 5,
};

const initialFilter: ForecastFilter = {};

// =============================================================================
// API MAPPERS
// =============================================================================

function mapApiToRevenueForecast(api: Record<string, unknown>): RevenueForecast {
  const lineItems = ((api.lineItems as Record<string, unknown>[]) || []).map(mapApiToRevenueLineItem);
  
  return {
    id: api.id as string,
    version: (api.version as RevenueForecast['version']) || 'latest',
    scenarioId: api.scenarioId as string | undefined,
    timeHorizon: (api.timeHorizon as TimeHorizon) || 'quarter',
    granularity: (api.granularity as TimeGranularity) || 'monthly',
    currency: (api.currency as string) || 'EUR',
    totalExpected: Number(api.totalExpected) || 0,
    totalBestCase: Number(api.totalBestCase) || 0,
    totalWorstCase: Number(api.totalWorstCase) || 0,
    committedRevenue: Number(api.committedRevenue) || 0,
    projectedRevenue: Number(api.projectedRevenue) || 0,
    atRiskRevenue: Number(api.atRiskRevenue) || 0,
    lineItems,
    byProduct: (api.byProduct as Record<string, number>) || {},
    bySegment: (api.bySegment as Record<string, number>) || {},
    byRegion: (api.byRegion as Record<string, number>) || {},
    byType: (api.byType as Record<string, number>) || {},
    lastUpdatedAt: api.updatedAt as string,
    lastUpdatedBy: api.lastUpdatedBy as string | undefined,
    dataSource: (api.dataSource as string) || 'system',
    confidence: (api.confidence as ConfidenceLevel) || 'medium',
  };
}

function mapApiToRevenueLineItem(api: Record<string, unknown>): RevenueLineItem {
  return {
    id: api.id as string,
    name: api.name as string,
    category: (api.category as RevenueLineItem['category']) || 'product',
    type: (api.revenueType as RevenueLineItem['type']) || 'recurring',
    segment: api.segment as string | undefined,
    region: api.region as string | undefined,
    customerId: api.customerId as string | undefined,
    customerName: api.customerName as string | undefined,
    periods: (api.periods as Record<string, ForecastValue>) || {},
    isCommitted: (api.isCommitted as boolean) || false,
    isAtRisk: (api.isAtRisk as boolean) || false,
    isRenewal: (api.isRenewal as boolean) || false,
    hasUpsell: (api.hasUpsell as boolean) || false,
    hasDownsell: (api.hasDownsell as boolean) || false,
    highUncertainty: (api.highUncertainty as boolean) || false,
    drivers: (api.drivers as string[]) || [],
    annotations: [],
    confidence: (api.confidence as ConfidenceLevel) || 'medium',
    confidenceScore: (api.confidenceScore as number) || 50,
  };
}

function mapApiToCostForecast(api: Record<string, unknown>): CostForecast {
  const lineItems = ((api.lineItems as Record<string, unknown>[]) || []).map(mapApiToCostLineItem);
  
  return {
    id: api.id as string,
    version: (api.version as CostForecast['version']) || 'latest',
    scenarioId: api.scenarioId as string | undefined,
    timeHorizon: (api.timeHorizon as TimeHorizon) || 'quarter',
    granularity: (api.granularity as TimeGranularity) || 'monthly',
    currency: (api.currency as string) || 'EUR',
    totalExpected: Number(api.totalExpected) || 0,
    totalBestCase: Number(api.totalBestCase) || 0,
    totalWorstCase: Number(api.totalWorstCase) || 0,
    committedCosts: Number(api.committedCosts) || 0,
    estimatedCosts: Number(api.estimatedCosts) || 0,
    lineItems,
    byCategory: (api.byCategory as Record<string, number>) || {},
    byDepartment: (api.byDepartment as Record<string, number>) || {},
    byVendor: (api.byVendor as Record<string, number>) || {},
    byProject: (api.byProject as Record<string, number>) || {},
    overrunCount: (api.overrunCount as number) || 0,
    unplannedSpendTotal: Number(api.unplannedSpendTotal) || 0,
    lastUpdatedAt: api.updatedAt as string,
    lastUpdatedBy: api.lastUpdatedBy as string | undefined,
    dataSource: (api.dataSource as string) || 'system',
    confidence: (api.confidence as ConfidenceLevel) || 'medium',
  };
}

function mapApiToCostLineItem(api: Record<string, unknown>): CostLineItem {
  return {
    id: api.id as string,
    name: api.name as string,
    category: (api.category as CostLineItem['category']) || 'fixed',
    department: api.department as string | undefined,
    costCenter: api.costCenter as string | undefined,
    vendorId: api.vendorId as string | undefined,
    vendorName: api.vendorName as string | undefined,
    projectId: api.projectId as string | undefined,
    projectName: api.projectName as string | undefined,
    periods: (api.periods as Record<string, ForecastValue>) || {},
    isCommitted: (api.isCommitted as boolean) || false,
    isContractual: (api.isContractual as boolean) || false,
    hasStepChange: (api.hasStepChange as boolean) || false,
    stepChangeDescription: api.stepChangeDescription as string | undefined,
    isOverrun: (api.isOverrun as boolean) || false,
    isUnplanned: (api.isUnplanned as boolean) || false,
    drivers: (api.drivers as string[]) || [],
    annotations: [],
    scenarioImpact: api.scenarioImpact as string | undefined,
    confidence: (api.confidence as ConfidenceLevel) || 'medium',
    confidenceScore: (api.confidenceScore as number) || 50,
  };
}

function mapApiToCashForecast(api: Record<string, unknown>): CashForecast {
  const periods = ((api.periods as Record<string, unknown>[]) || []).map(mapApiToCashPeriod);
  
  return {
    id: api.id as string,
    version: (api.version as CashForecast['version']) || 'latest',
    scenarioId: api.scenarioId as string | undefined,
    timeHorizon: (api.timeHorizon as TimeHorizon) || 'quarter',
    granularity: (api.granularity as TimeGranularity) || 'monthly',
    currency: (api.currency as string) || 'EUR',
    currentCashBalance: Number(api.currentCashBalance) || 0,
    periods,
    minimumCashRunway: (api.minimumCashRunway as number) || 0,
    covenantThreshold: Number(api.covenantThreshold) || 0,
    projectedMinimumBalance: Number(api.projectedMinimumBalance) || 0,
    projectedMinimumDate: api.projectedMinimumDate as string || '',
    avgCollectionDays: (api.avgCollectionDays as number) || 30,
    avgPaymentTerms: (api.avgPaymentTerms as number) || 30,
    delayedReceivables: Number(api.delayedReceivables) || 0,
    stressScenarios: (api.stressScenarios as CashForecast['stressScenarios']) || [],
    hasNegativePeriods: (api.hasNegativePeriods as boolean) || false,
    hasCriticalPeriods: (api.hasCriticalPeriods as boolean) || false,
    covenantAtRisk: (api.covenantAtRisk as boolean) || false,
    lastUpdatedAt: api.updatedAt as string,
    lastUpdatedBy: api.lastUpdatedBy as string | undefined,
    dataSource: (api.dataSource as string) || 'system',
    confidence: (api.confidence as ConfidenceLevel) || 'medium',
  };
}

function mapApiToCashPeriod(api: Record<string, unknown>): CashPeriod {
  return {
    periodId: api.periodId as string,
    periodLabel: api.periodLabel as string,
    startDate: api.startDate as string,
    endDate: api.endDate as string,
    openingBalance: Number(api.openingBalance) || 0,
    closingBalance: Number(api.closingBalance) || 0,
    netCashFlow: Number(api.netCashFlow) || 0,
    cashIn: (api.cashIn as ForecastValue) || { expected: 0, bestCase: 0, worstCase: 0, confidence: 'medium', confidenceScore: 50 },
    cashInBreakdown: (api.cashInBreakdown as CashPeriod['cashInBreakdown']) || { collections: 0, otherReceipts: 0, financing: 0 },
    cashOut: (api.cashOut as ForecastValue) || { expected: 0, bestCase: 0, worstCase: 0, confidence: 'medium', confidenceScore: 50 },
    cashOutBreakdown: (api.cashOutBreakdown as CashPeriod['cashOutBreakdown']) || { payroll: 0, vendors: 0, taxes: 0, debtService: 0, capex: 0, other: 0 },
    isNegative: (api.isNegative as boolean) || false,
    isCritical: (api.isCritical as boolean) || false,
    breachesMinimum: (api.breachesMinimum as boolean) || false,
    breachesCovenant: (api.breachesCovenant as boolean) || false,
    confidence: (api.confidence as ConfidenceLevel) || 'medium',
  };
}

function mapApiToScenario(api: Record<string, unknown>): ForecastScenario {
  return {
    id: api.id as string,
    name: api.name as string,
    type: (api.type as ForecastScenario['type']) || 'custom',
    description: api.description as string | undefined,
    assumptions: ((api.assumptions as Record<string, unknown>[]) || []).map(mapApiToAssumption),
    revenueForecastId: api.revenueForecastId as string | undefined,
    costForecastId: api.costForecastId as string | undefined,
    cashForecastId: api.cashForecastId as string | undefined,
    revenueVsBase: Number(api.revenueVsBase) || 0,
    costVsBase: Number(api.costVsBase) || 0,
    cashVsBase: Number(api.cashVsBase) || 0,
    netVsBase: Number(api.netVsBase) || 0,
    isLocked: (api.isLocked as boolean) || false,
    isActive: (api.isActive as boolean) ?? true,
    createdAt: api.createdAt as string,
    createdBy: api.createdBy as string | undefined,
    lastUpdatedAt: api.updatedAt as string,
    lastUpdatedBy: api.lastUpdatedBy as string | undefined,
  };
}

function mapApiToAssumption(api: Record<string, unknown>): ForecastAssumption {
  return {
    id: api.id as string,
    name: api.name as string,
    category: (api.category as ForecastAssumption['category']) || 'other',
    value: Number(api.value) || 0,
    unit: (api.unit as ForecastAssumption['unit']) || 'percentage',
    description: api.description as string | undefined,
    impactedForecasts: (api.impactedForecasts as ForecastAssumption['impactedForecasts']) || [],
    isEditable: (api.isEditable as boolean) ?? true,
    lastUpdatedAt: api.updatedAt as string,
    lastUpdatedBy: api.lastUpdatedBy as string | undefined,
  };
}

function mapApiToAlert(api: Record<string, unknown>): ForecastAlert {
  return {
    id: api.id as string,
    type: api.type as ForecastAlert['type'],
    severity: (api.severity as ForecastAlert['severity']) || 'medium',
    title: api.title as string,
    message: api.message as string,
    forecastType: api.forecastType as ForecastAlert['forecastType'],
    periodId: api.periodId as string | undefined,
    lineItemId: api.lineItemId as string | undefined,
    threshold: api.threshold ? Number(api.threshold) : undefined,
    currentValue: api.currentValue ? Number(api.currentValue) : undefined,
    isRead: (api.isRead as boolean) || false,
    isDismissed: (api.isDismissed as boolean) || false,
    createdAt: api.createdAt as string,
  };
}

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface ForecastState {
  // Data
  revenueForecast: RevenueForecast | null;
  costForecast: CostForecast | null;
  cashForecast: CashForecast | null;
  scenarios: ForecastScenario[];
  alerts: ForecastAlert[];
  varianceData: ForecastActualComparison[];
  accuracyTrend: ForecastAccuracyTrend[];

  // UI State
  activeTab: ForecastTab;
  viewPreferences: ForecastViewPreferences;
  filter: ForecastFilter;
  selectedLineItemId: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Fetch Actions
  fetchForecasts: () => Promise<void>;
  fetchRevenueForecast: (version?: string, scenarioId?: string) => Promise<void>;
  fetchCostForecast: (version?: string, scenarioId?: string) => Promise<void>;
  fetchCashForecast: (version?: string, scenarioId?: string) => Promise<void>;
  fetchScenarios: () => Promise<void>;
  fetchAlerts: () => Promise<void>;

  // Tab Navigation
  setActiveTab: (tab: ForecastTab) => void;

  // View Preferences
  setViewPreferences: (prefs: Partial<ForecastViewPreferences>) => void;
  setTimeHorizon: (horizon: TimeHorizon) => void;
  setGranularity: (granularity: TimeGranularity) => void;
  setActiveScenario: (scenarioId: string | null) => void;

  // Filters
  setFilter: (filter: Partial<ForecastFilter>) => void;
  resetFilter: () => void;

  // Selection
  setSelectedLineItem: (id: string | null) => void;

  // Alerts
  markAlertRead: (id: string) => Promise<void>;
  dismissAlert: (id: string) => Promise<void>;

  // Scenarios
  createScenario: (scenario: Partial<ForecastScenario>) => Promise<ForecastScenario | null>;
  updateScenario: (id: string, updates: Partial<ForecastScenario>) => Promise<void>;
  deleteScenario: (id: string) => Promise<void>;
  lockScenario: (id: string) => Promise<void>;

  // Assumptions
  updateAssumption: (scenarioId: string, assumptionId: string, value: number) => Promise<void>;

  // Computed
  getSummary: () => ForecastSummary;
  getFilteredRevenueItems: () => RevenueLineItem[];
  getFilteredCostItems: () => CostLineItem[];
  getUnreadAlertCount: () => number;
  getActiveScenario: () => ForecastScenario | null;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useForecastStore = create<ForecastState>()(
  persist(
    (set, get) => ({
      // Initial Data
      revenueForecast: null,
      costForecast: null,
      cashForecast: null,
      scenarios: [],
      alerts: [],
      varianceData: [],
      accuracyTrend: [],

      // UI State
      activeTab: 'overview',
      viewPreferences: initialViewPreferences,
      filter: initialFilter,
      selectedLineItemId: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      // =====================================================================
      // FETCH ACTIONS
      // =====================================================================

      fetchForecasts: async () => {
        set({ isLoading: true, error: null });
        try {
          await Promise.all([
            get().fetchRevenueForecast(),
            get().fetchCostForecast(),
            get().fetchCashForecast(),
            get().fetchScenarios(),
            get().fetchAlerts(),
          ]);
          set({ isInitialized: true });
        } catch (error) {
          console.error('Failed to fetch forecasts:', error);
          set({ error: (error as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchRevenueForecast: async (version = 'latest', scenarioId) => {
        try {
          const params = new URLSearchParams({ version });
          if (scenarioId) params.append('scenarioId', scenarioId);
          
          const res = await fetch(`/api/forecasts/revenue?${params}`);
          if (!res.ok) throw new Error('Failed to fetch revenue forecast');
          const data = await res.json();
          
          if (data) {
            set({ revenueForecast: mapApiToRevenueForecast(data) });
          }
        } catch (error) {
          console.error('Failed to fetch revenue forecast:', error);
        }
      },

      fetchCostForecast: async (version = 'latest', scenarioId) => {
        try {
          const params = new URLSearchParams({ version });
          if (scenarioId) params.append('scenarioId', scenarioId);
          
          const res = await fetch(`/api/forecasts/cost?${params}`);
          if (!res.ok) throw new Error('Failed to fetch cost forecast');
          const data = await res.json();
          
          if (data) {
            set({ costForecast: mapApiToCostForecast(data) });
          }
        } catch (error) {
          console.error('Failed to fetch cost forecast:', error);
        }
      },

      fetchCashForecast: async (version = 'latest', scenarioId) => {
        try {
          const params = new URLSearchParams({ version });
          if (scenarioId) params.append('scenarioId', scenarioId);
          
          const res = await fetch(`/api/forecasts/cash?${params}`);
          if (!res.ok) throw new Error('Failed to fetch cash forecast');
          const data = await res.json();
          
          if (data) {
            set({ cashForecast: mapApiToCashForecast(data) });
          }
        } catch (error) {
          console.error('Failed to fetch cash forecast:', error);
        }
      },

      fetchScenarios: async () => {
        try {
          const res = await fetch('/api/forecasts/scenarios');
          if (!res.ok) throw new Error('Failed to fetch scenarios');
          const data = await res.json();
          const scenarios = (data.scenarios || []).map(mapApiToScenario);
          set({ scenarios });
        } catch (error) {
          console.error('Failed to fetch scenarios:', error);
        }
      },

      fetchAlerts: async () => {
        try {
          const res = await fetch('/api/forecasts/alerts');
          if (!res.ok) throw new Error('Failed to fetch alerts');
          const data = await res.json();
          const alerts = (data.alerts || []).map(mapApiToAlert);
          set({ alerts });
        } catch (error) {
          console.error('Failed to fetch alerts:', error);
        }
      },

      // =====================================================================
      // TAB NAVIGATION
      // =====================================================================

      setActiveTab: (tab) => set({ activeTab: tab }),

      // =====================================================================
      // VIEW PREFERENCES
      // =====================================================================

      setViewPreferences: (prefs) =>
        set((state) => ({
          viewPreferences: { ...state.viewPreferences, ...prefs },
        })),

      setTimeHorizon: (horizon) =>
        set((state) => ({
          viewPreferences: { ...state.viewPreferences, timeHorizon: horizon },
        })),

      setGranularity: (granularity) =>
        set((state) => ({
          viewPreferences: { ...state.viewPreferences, granularity },
        })),

      setActiveScenario: (scenarioId) => {
        set((state) => ({
          viewPreferences: { ...state.viewPreferences, activeScenarioId: scenarioId },
        }));
        // Refetch forecasts with scenario
        if (scenarioId) {
          get().fetchRevenueForecast('latest', scenarioId);
          get().fetchCostForecast('latest', scenarioId);
          get().fetchCashForecast('latest', scenarioId);
        } else {
          get().fetchRevenueForecast();
          get().fetchCostForecast();
          get().fetchCashForecast();
        }
      },

      // =====================================================================
      // FILTERS
      // =====================================================================

      setFilter: (filter) =>
        set((state) => ({
          filter: { ...state.filter, ...filter },
        })),

      resetFilter: () => set({ filter: initialFilter }),

      // =====================================================================
      // SELECTION
      // =====================================================================

      setSelectedLineItem: (id) => set({ selectedLineItemId: id }),

      // =====================================================================
      // ALERTS
      // =====================================================================

      markAlertRead: async (id) => {
        set((state) => ({
          alerts: state.alerts.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
        }));

        try {
          await fetch(`/api/forecasts/alerts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isRead: true }),
          });
        } catch (error) {
          console.error('Failed to mark alert read:', error);
        }
      },

      dismissAlert: async (id) => {
        set((state) => ({
          alerts: state.alerts.map((a) => (a.id === id ? { ...a, isDismissed: true } : a)),
        }));

        try {
          await fetch(`/api/forecasts/alerts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isDismissed: true }),
          });
        } catch (error) {
          console.error('Failed to dismiss alert:', error);
        }
      },

      // =====================================================================
      // SCENARIOS
      // =====================================================================

      createScenario: async (scenarioData) => {
        try {
          const res = await fetch('/api/forecasts/scenarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scenarioData),
          });
          if (!res.ok) throw new Error('Failed to create scenario');
          const created = await res.json();
          const scenario = mapApiToScenario(created);
          set((state) => ({ scenarios: [...state.scenarios, scenario] }));
          return scenario;
        } catch (error) {
          console.error('Failed to create scenario:', error);
          return null;
        }
      },

      updateScenario: async (id, updates) => {
        set((state) => ({
          scenarios: state.scenarios.map((s) =>
            s.id === id ? { ...s, ...updates, lastUpdatedAt: new Date().toISOString() } : s
          ),
        }));

        try {
          await fetch(`/api/forecasts/scenarios/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
        } catch (error) {
          console.error('Failed to update scenario:', error);
        }
      },

      deleteScenario: async (id) => {
        try {
          await fetch(`/api/forecasts/scenarios/${id}`, { method: 'DELETE' });
          set((state) => ({
            scenarios: state.scenarios.filter((s) => s.id !== id),
          }));
        } catch (error) {
          console.error('Failed to delete scenario:', error);
        }
      },

      lockScenario: async (id) => {
        await get().updateScenario(id, { isLocked: true });
      },

      // =====================================================================
      // ASSUMPTIONS
      // =====================================================================

      updateAssumption: async (scenarioId, assumptionId, value) => {
        set((state) => ({
          scenarios: state.scenarios.map((s) =>
            s.id === scenarioId
              ? {
                  ...s,
                  assumptions: s.assumptions.map((a) =>
                    a.id === assumptionId
                      ? { ...a, value, lastUpdatedAt: new Date().toISOString() }
                      : a
                  ),
                }
              : s
          ),
        }));

        try {
          await fetch(`/api/forecasts/scenarios/${scenarioId}/assumptions/${assumptionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value }),
          });
        } catch (error) {
          console.error('Failed to update assumption:', error);
        }
      },

      // =====================================================================
      // COMPUTED
      // =====================================================================

      getSummary: (): ForecastSummary => {
        const { revenueForecast, costForecast, cashForecast, alerts } = get();

        const totalRevenue = revenueForecast
          ? {
              expected: revenueForecast.totalExpected,
              bestCase: revenueForecast.totalBestCase,
              worstCase: revenueForecast.totalWorstCase,
              confidence: revenueForecast.confidence,
              confidenceScore: 70,
            }
          : { expected: 0, bestCase: 0, worstCase: 0, confidence: 'medium' as const, confidenceScore: 0 };

        const totalCosts = costForecast
          ? {
              expected: costForecast.totalExpected,
              bestCase: costForecast.totalBestCase,
              worstCase: costForecast.totalWorstCase,
              confidence: costForecast.confidence,
              confidenceScore: 70,
            }
          : { expected: 0, bestCase: 0, worstCase: 0, confidence: 'medium' as const, confidenceScore: 0 };

        const netExpected = totalRevenue.expected - totalCosts.expected;

        return {
          totalRevenue,
          revenueGrowthRate: 0,
          committedRevenuePercent: revenueForecast
            ? (revenueForecast.committedRevenue / revenueForecast.totalExpected) * 100
            : 0,
          atRiskRevenuePercent: revenueForecast
            ? (revenueForecast.atRiskRevenue / revenueForecast.totalExpected) * 100
            : 0,
          totalCosts,
          costGrowthRate: 0,
          fixedCostsPercent: 0,
          variableCostsPercent: 0,
          currentCash: cashForecast?.currentCashBalance || 0,
          projectedCash: {
            expected: cashForecast?.projectedMinimumBalance || 0,
            bestCase: 0,
            worstCase: 0,
            confidence: 'medium',
            confidenceScore: 50,
          },
          cashRunwayDays: cashForecast?.minimumCashRunway || 0,
          netPosition: {
            expected: netExpected,
            bestCase: totalRevenue.bestCase - totalCosts.worstCase,
            worstCase: totalRevenue.worstCase - totalCosts.bestCase,
            confidence: 'medium',
            confidenceScore: 60,
          },
          profitMargin: totalRevenue.expected > 0 ? (netExpected / totalRevenue.expected) * 100 : 0,
          overallConfidence: 'medium',
          overallConfidenceScore: 65,
          dataFreshness: 'fresh',
          lastUpdatedAt: new Date().toISOString(),
          dataCompleteness: 85,
          alertCount: alerts.filter((a) => !a.isDismissed).length,
          criticalAlertCount: alerts.filter((a) => !a.isDismissed && a.severity === 'critical').length,
        };
      },

      getFilteredRevenueItems: () => {
        const { revenueForecast, filter } = get();
        if (!revenueForecast) return [];

        let items = revenueForecast.lineItems;

        if (filter.segment?.length) {
          items = items.filter((i) => i.segment && filter.segment!.includes(i.segment));
        }
        if (filter.region?.length) {
          items = items.filter((i) => i.region && filter.region!.includes(i.region));
        }
        if (filter.revenueType?.length) {
          items = items.filter((i) => filter.revenueType!.includes(i.type));
        }
        if (filter.showAtRisk) {
          items = items.filter((i) => i.isAtRisk);
        }
        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase();
          items = items.filter(
            (i) =>
              i.name.toLowerCase().includes(query) ||
              i.customerName?.toLowerCase().includes(query)
          );
        }

        return items;
      },

      getFilteredCostItems: () => {
        const { costForecast, filter } = get();
        if (!costForecast) return [];

        let items = costForecast.lineItems;

        if (filter.department?.length) {
          items = items.filter((i) => i.department && filter.department!.includes(i.department));
        }
        if (filter.costCenter?.length) {
          items = items.filter((i) => i.costCenter && filter.costCenter!.includes(i.costCenter));
        }
        if (filter.category?.length) {
          items = items.filter((i) => filter.category!.includes(i.category));
        }
        if (filter.showOverruns) {
          items = items.filter((i) => i.isOverrun);
        }
        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase();
          items = items.filter(
            (i) =>
              i.name.toLowerCase().includes(query) ||
              i.vendorName?.toLowerCase().includes(query) ||
              i.projectName?.toLowerCase().includes(query)
          );
        }

        return items;
      },

      getUnreadAlertCount: () => {
        return get().alerts.filter((a) => !a.isRead && !a.isDismissed).length;
      },

      getActiveScenario: () => {
        const { scenarios, viewPreferences } = get();
        if (!viewPreferences.activeScenarioId) return null;
        return scenarios.find((s) => s.id === viewPreferences.activeScenarioId) || null;
      },
    }),
    {
      name: 'forecast-storage',
      partialize: (state) => ({
        viewPreferences: state.viewPreferences,
        activeTab: state.activeTab,
      }),
    }
  )
);