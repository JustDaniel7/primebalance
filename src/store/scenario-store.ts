// src/store/scenario-store.ts
// Scenario Store - API-connected version

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Scenario,
  ScenarioAssumption,
  ScenarioMetrics,
  ScenarioCaseType,
  ScenarioStatus,
  ScenarioVisibility,
  StressTest,
  StressTestTemplate,
  StressIntensity,
  SimulationState,
  SimulationDriver,
  ImpactExplanation,
  ScenarioComparison,
  ScenarioComment,
  ScenarioDecision,
  ScenarioChangeEvent,
  ScenarioTab,
  ScenarioViewPreferences,
  ScenarioFilter,
  AssumptionCategory,
} from '@/types/scenarios';

// =============================================================================
// INITIAL STATES
// =============================================================================

const initialViewPreferences: ScenarioViewPreferences = {
  showDeltas: true,
  showConfidenceBands: true,
  comparisonMode: 'delta',
  focusMetric: 'all',
  timeHorizon: 'medium',
};

const initialFilter: ScenarioFilter = {};

// =============================================================================
// API MAPPERS
// =============================================================================

function mapApiToScenario(api: Record<string, unknown>): Scenario {
  return {
    id: api.id as string,
    name: api.name as string,
    description: api.description as string | undefined,
    caseType: (api.caseType as ScenarioCaseType) || 'custom',
    status: (api.status as ScenarioStatus) || 'draft',
    visibility: (api.visibility as ScenarioVisibility) || 'personal',
    assumptions: ((api.assumptions as Record<string, unknown>[]) || []).map(mapApiToAssumption),
    metrics: (api.metrics as ScenarioMetrics) || getDefaultMetrics(),
    confidence: {
      level: (api.confidenceLevel as 'low' | 'medium' | 'high') || 'medium',
      score: (api.confidenceScore as number) || 50,
      uncertaintyBandLow: api.uncertaintyBandLow ? Number(api.uncertaintyBandLow) : 0,
      uncertaintyBandHigh: api.uncertaintyBandHigh ? Number(api.uncertaintyBandHigh) : 0,
    },
    derivedFromId: api.derivedFromId as string | undefined,
    derivedFromName: api.derivedFromName as string | undefined,
    tags: (api.tags as string[]) || [],
    ownerId: api.ownerId as string,
    ownerName: api.ownerName as string,
    sharedWithTeams: (api.sharedWithTeams as string[]) || [],
    createdAt: api.createdAt as string,
    createdBy: api.createdBy as string,
    lastModifiedAt: api.updatedAt as string,
    lastModifiedBy: api.lastModifiedBy as string | undefined,
    lockedAt: api.lockedAt as string | undefined,
    lockedBy: api.lockedBy as string | undefined,
    approvedAt: api.approvedAt as string | undefined,
    approvedBy: api.approvedBy as string | undefined,
    version: (api.version as number) || 1,
    previousVersionId: api.previousVersionId as string | undefined,
  };
}

function mapApiToAssumption(api: Record<string, unknown>): ScenarioAssumption {
  return {
    id: api.id as string,
    name: api.name as string,
    category: (api.category as AssumptionCategory) || 'other',
    baseValue: Number(api.baseValue) || 0,
    currentValue: Number(api.currentValue) || 0,
    unit: (api.unit as ScenarioAssumption['unit']) || 'percentage',
    description: api.description as string | undefined,
    isProtected: (api.isProtected as boolean) || false,
    isOverridden: (api.isOverridden as boolean) || false,
    minValue: api.minValue ? Number(api.minValue) : undefined,
    maxValue: api.maxValue ? Number(api.maxValue) : undefined,
    step: api.step ? Number(api.step) : undefined,
    impactedMetrics: (api.impactedMetrics as ScenarioAssumption['impactedMetrics']) || [],
    lastModifiedAt: api.lastModifiedAt as string | undefined,
    lastModifiedBy: api.lastModifiedBy as string | undefined,
  };
}

function mapApiToStressTest(api: Record<string, unknown>): StressTest {
  return {
    id: api.id as string,
    name: api.name as string,
    description: api.description as string | undefined,
    type: (api.type as StressTest['type']) || 'combined',
    isTemplate: (api.isTemplate as boolean) || false,
    parameters: (api.parameters as StressTest['parameters']) || [],
    intensity: (api.intensity as StressIntensity) || 'moderate',
    result: (api.result as StressTest['result']) || 'pass',
    resultMetrics: (api.resultMetrics as ScenarioMetrics) || getDefaultMetrics(),
    thresholds: (api.thresholds as StressTest['thresholds']) || [],
    cashShortfallPoint: api.cashShortfallPoint as string | undefined,
    covenantBreachPoint: api.covenantBreachPoint as string | undefined,
    marginCollapsePoint: api.marginCollapsePoint as string | undefined,
    createdAt: api.createdAt as string,
    lastRunAt: api.lastRunAt as string,
  };
}

function mapApiToComment(api: Record<string, unknown>): ScenarioComment {
  return {
    id: api.id as string,
    scenarioId: api.scenarioId as string,
    content: api.content as string,
    authorId: api.authorId as string,
    authorName: api.authorName as string,
    createdAt: api.createdAt as string,
    updatedAt: api.updatedAt as string | undefined,
    parentId: api.parentId as string | undefined,
    isResolved: (api.isResolved as boolean) || false,
  };
}

function getDefaultMetrics(): ScenarioMetrics {
  return {
    revenue: 0,
    costs: 0,
    cash: 0,
    netPosition: 0,
    profitMargin: 0,
    cashRunwayDays: 0,
    revenueDelta: 0,
    costsDelta: 0,
    cashDelta: 0,
    netDelta: 0,
    revenueChangePercent: 0,
    costsChangePercent: 0,
    cashChangePercent: 0,
    netChangePercent: 0,
  };
}

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface ScenarioState {
  // Data
  scenarios: Scenario[];
  stressTests: StressTest[];
  stressTestTemplates: StressTestTemplate[];
  comments: ScenarioComment[];
  decisions: ScenarioDecision[];
  changeHistory: ScenarioChangeEvent[];

  // Simulation State
  activeSimulation: SimulationState | null;

  // UI State
  activeTab: ScenarioTab;
  viewPreferences: ScenarioViewPreferences;
  filter: ScenarioFilter;
  selectedScenarioId: string | null;
  comparisonScenarioIds: string[];
  isLoading: boolean;
  isSimulating: boolean;
  error: string | null;
  isInitialized: boolean;

  // Fetch
  fetchScenarios: () => Promise<void>;
  fetchScenario: (id: string) => Promise<void>;
  fetchStressTests: () => Promise<void>;

  // UI Actions
  setActiveTab: (tab: ScenarioTab) => void;
  setViewPreferences: (prefs: Partial<ScenarioViewPreferences>) => void;
  setFilter: (filter: Partial<ScenarioFilter>) => void;
  resetFilter: () => void;

  // Scenario CRUD
  selectScenario: (id: string | null) => void;
  createScenario: (scenario: Partial<Scenario>) => Promise<string | null>;
  updateScenario: (id: string, updates: Partial<Scenario>) => Promise<void>;
  cloneScenario: (id: string, newName: string) => Promise<string | null>;
  deleteScenario: (id: string) => Promise<boolean>;
  archiveScenario: (id: string) => Promise<void>;
  lockScenario: (id: string) => Promise<void>;
  approveScenario: (id: string, rationale?: string) => Promise<void>;

  // Assumptions
  updateAssumption: (scenarioId: string, assumptionId: string, value: number) => Promise<void>;
  resetAssumption: (scenarioId: string, assumptionId: string) => Promise<void>;
  resetAllAssumptions: (scenarioId: string) => Promise<void>;

  // Comparison
  addToComparison: (id: string) => void;
  removeFromComparison: (id: string) => void;
  clearComparison: () => void;
  getComparison: () => ScenarioComparison | null;

  // Stress Tests
  runStressTest: (id: string, intensity?: string) => Promise<void>;
  createStressTest: (data: Partial<StressTest>) => Promise<void>;
  deleteStressTest: (id: string) => Promise<void>;

  // Simulation
  startSimulation: (baseScenarioId: string) => void;
  updateSimulationDriver: (driverId: string, value: number) => void;
  resetSimulation: () => void;
  pinSimulation: (name: string) => Promise<string | null>;

  // Comments
  addComment: (scenarioId: string, content: string, parentId?: string) => Promise<void>;
  resolveComment: (commentId: string) => Promise<void>;

  // Computed
  getFilteredScenarios: () => Scenario[];
  getImpactExplanation: (scenarioId: string, comparedToId: string, metric: 'revenue' | 'cost' | 'cash' | 'net') => ImpactExplanation;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useScenarioStore = create<ScenarioState>()(
  persist(
    (set, get) => ({
      // Initial Data
      scenarios: [],
      stressTests: [],
      stressTestTemplates: [],
      comments: [],
      decisions: [],
      changeHistory: [],
      activeSimulation: null,

      // UI State
      activeTab: 'overview',
      viewPreferences: initialViewPreferences,
      filter: initialFilter,
      selectedScenarioId: null,
      comparisonScenarioIds: [],
      isLoading: false,
      isSimulating: false,
      error: null,
      isInitialized: false,

      // =====================================================================
      // FETCH
      // =====================================================================

      fetchScenarios: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/scenarios');
          if (!res.ok) throw new Error('Failed to fetch scenarios');
          const data = await res.json();
          const scenarios = (data.scenarios || []).map(mapApiToScenario);
          set({ scenarios, isLoading: false, isInitialized: true });
        } catch (error) {
          console.error('Failed to fetch scenarios:', error);
          set({ error: (error as Error).message, isLoading: false, isInitialized: true });
        }
      },

      fetchScenario: async (id) => {
        try {
          const res = await fetch(`/api/scenarios/${id}`);
          if (!res.ok) throw new Error('Failed to fetch scenario');
          const data = await res.json();
          const scenario = mapApiToScenario(data);

          // Extract comments and history
          const comments = ((data.comments || []) as Record<string, unknown>[]).map(mapApiToComment);
          const changeHistory = (data.changeEvents || []) as ScenarioChangeEvent[];
          const decisions = (data.decisions || []) as ScenarioDecision[];

          set((state) => ({
            scenarios: state.scenarios.map((s) => (s.id === id ? scenario : s)),
            comments: [...state.comments.filter((c) => c.scenarioId !== id), ...comments],
            changeHistory: [...state.changeHistory.filter((e) => e.scenarioId !== id), ...changeHistory],
            decisions: [...state.decisions.filter((d) => d.scenarioId !== id), ...decisions],
          }));
        } catch (error) {
          console.error('Failed to fetch scenario:', error);
        }
      },

      fetchStressTests: async () => {
        try {
          const res = await fetch('/api/scenarios/stress-tests');
          if (!res.ok) throw new Error('Failed to fetch stress tests');
          const data = await res.json();
          const stressTests = (data.stressTests || []).map(mapApiToStressTest);

          // Separate templates
          const templates = stressTests.filter((t: StressTest) => t.isTemplate);
          const tests = stressTests.filter((t: StressTest) => !t.isTemplate);

          set({
            stressTests: tests,
            stressTestTemplates: templates.map((t: StressTest) => ({
              id: t.id,
              name: t.name,
              description: t.description || '',
              type: t.type,
              defaultIntensities: [-5, -10, -20, -30],
              defaultParameters: t.parameters,
            })),
          });
        } catch (error) {
          console.error('Failed to fetch stress tests:', error);
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

      // =====================================================================
      // SCENARIO CRUD
      // =====================================================================

      selectScenario: (id) => {
        set({ selectedScenarioId: id });
        if (id) get().fetchScenario(id);
      },

      createScenario: async (scenarioData) => {
        try {
          const res = await fetch('/api/scenarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scenarioData),
          });
          if (!res.ok) throw new Error('Failed to create scenario');
          const created = await res.json();
          const scenario = mapApiToScenario(created);
          set((state) => ({ scenarios: [scenario, ...state.scenarios] }));
          return scenario.id;
        } catch (error) {
          console.error('Failed to create scenario:', error);
          return null;
        }
      },

      updateScenario: async (id, updates) => {
        // Optimistic update
        set((state) => ({
          scenarios: state.scenarios.map((s) =>
            s.id === id ? { ...s, ...updates, lastModifiedAt: new Date().toISOString() } : s
          ),
        }));

        try {
          await fetch(`/api/scenarios/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
        } catch (error) {
          console.error('Failed to update scenario:', error);
          get().fetchScenarios();
        }
      },

      cloneScenario: async (id, newName) => {
        try {
          const res = await fetch(`/api/scenarios/${id}/clone`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName }),
          });
          if (!res.ok) throw new Error('Failed to clone scenario');
          const created = await res.json();
          const scenario = mapApiToScenario(created);
          set((state) => ({ scenarios: [scenario, ...state.scenarios] }));
          return scenario.id;
        } catch (error) {
          console.error('Failed to clone scenario:', error);
          return null;
        }
      },

      deleteScenario: async (id) => {
        try {
          const res = await fetch(`/api/scenarios/${id}`, { method: 'DELETE' });
          if (!res.ok) return false;
          set((state) => ({
            scenarios: state.scenarios.filter((s) => s.id !== id),
            selectedScenarioId: state.selectedScenarioId === id ? null : state.selectedScenarioId,
            comparisonScenarioIds: state.comparisonScenarioIds.filter((cid) => cid !== id),
          }));
          return true;
        } catch (error) {
          console.error('Failed to delete scenario:', error);
          return false;
        }
      },

      archiveScenario: async (id) => {
        await get().updateScenario(id, { status: 'archived' });
      },

      lockScenario: async (id) => {
        try {
          const res = await fetch(`/api/scenarios/${id}/lock`, { method: 'POST' });
          if (!res.ok) throw new Error('Failed to lock scenario');
          const updated = await res.json();
          set((state) => ({
            scenarios: state.scenarios.map((s) => (s.id === id ? mapApiToScenario(updated) : s)),
          }));
        } catch (error) {
          console.error('Failed to lock scenario:', error);
        }
      },

      approveScenario: async (id, rationale) => {
        try {
          const res = await fetch(`/api/scenarios/${id}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rationale }),
          });
          if (!res.ok) throw new Error('Failed to approve scenario');
          const updated = await res.json();
          set((state) => ({
            scenarios: state.scenarios.map((s) => (s.id === id ? mapApiToScenario(updated) : s)),
          }));
        } catch (error) {
          console.error('Failed to approve scenario:', error);
        }
      },

      // =====================================================================
      // ASSUMPTIONS
      // =====================================================================

      updateAssumption: async (scenarioId, assumptionId, value) => {
        // Optimistic update
        set((state) => ({
          scenarios: state.scenarios.map((s) =>
            s.id === scenarioId
              ? {
                  ...s,
                  assumptions: s.assumptions.map((a) =>
                    a.id === assumptionId
                      ? { ...a, currentValue: value, isOverridden: value !== a.baseValue }
                      : a
                  ),
                }
              : s
          ),
        }));

        try {
          await fetch(`/api/scenarios/${scenarioId}/assumptions/${assumptionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentValue: value }),
          });
        } catch (error) {
          console.error('Failed to update assumption:', error);
          get().fetchScenario(scenarioId);
        }
      },

      resetAssumption: async (scenarioId, assumptionId) => {
        const scenario = get().scenarios.find((s) => s.id === scenarioId);
        const assumption = scenario?.assumptions.find((a) => a.id === assumptionId);
        if (assumption) {
          await get().updateAssumption(scenarioId, assumptionId, assumption.baseValue);
        }
      },

      resetAllAssumptions: async (scenarioId) => {
        const scenario = get().scenarios.find((s) => s.id === scenarioId);
        if (!scenario) return;

        for (const assumption of scenario.assumptions) {
          if (assumption.isOverridden) {
            await get().updateAssumption(scenarioId, assumption.id, assumption.baseValue);
          }
        }
      },

      // =====================================================================
      // COMPARISON
      // =====================================================================

      addToComparison: (id) => {
        set((state) => {
          if (state.comparisonScenarioIds.includes(id)) return state;
          if (state.comparisonScenarioIds.length >= 4) return state; // Max 4 scenarios
          return { comparisonScenarioIds: [...state.comparisonScenarioIds, id] };
        });
      },

      removeFromComparison: (id) => {
        set((state) => ({
          comparisonScenarioIds: state.comparisonScenarioIds.filter((cid) => cid !== id),
        }));
      },

      clearComparison: () => set({ comparisonScenarioIds: [] }),

      getComparison: () => {
        const { scenarios, comparisonScenarioIds } = get();
        if (comparisonScenarioIds.length < 2) return null;

        const comparedScenarios = comparisonScenarioIds
          .map((id) => scenarios.find((s) => s.id === id))
          .filter(Boolean) as Scenario[];

        if (comparedScenarios.length < 2) return null;

        const baselineId = comparedScenarios.find((s) => s.caseType === 'expected_case')?.id || comparedScenarios[0].id;
        const baseline = comparedScenarios.find((s) => s.id === baselineId)!;

        const deltas: Record<string, { revenue: number; costs: number; cash: number; net: number }> = {};
        comparedScenarios.forEach((s) => {
          deltas[s.id] = {
            revenue: s.metrics.revenue - baseline.metrics.revenue,
            costs: s.metrics.costs - baseline.metrics.costs,
            cash: s.metrics.cash - baseline.metrics.cash,
            net: s.metrics.netPosition - baseline.metrics.netPosition,
          };
        });

        const revenues = comparedScenarios.map((s) => s.metrics.revenue);
        const costs = comparedScenarios.map((s) => s.metrics.costs);
        const cashes = comparedScenarios.map((s) => s.metrics.cash);
        const nets = comparedScenarios.map((s) => s.metrics.netPosition);

        return {
          scenarios: comparedScenarios.map((s) => ({
            id: s.id,
            name: s.name,
            caseType: s.caseType,
            metrics: s.metrics,
          })),
          baselineId,
          deltas,
          spread: {
            revenue: { min: Math.min(...revenues), max: Math.max(...revenues), range: Math.max(...revenues) - Math.min(...revenues) },
            costs: { min: Math.min(...costs), max: Math.max(...costs), range: Math.max(...costs) - Math.min(...costs) },
            cash: { min: Math.min(...cashes), max: Math.max(...cashes), range: Math.max(...cashes) - Math.min(...cashes) },
            net: { min: Math.min(...nets), max: Math.max(...nets), range: Math.max(...nets) - Math.min(...nets) },
          },
        };
      },

      // =====================================================================
      // STRESS TESTS
      // =====================================================================

      runStressTest: async (id, intensity) => {
        try {
          const res = await fetch(`/api/scenarios/stress-tests/${id}/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intensity }),
          });
          if (!res.ok) throw new Error('Failed to run stress test');
          const updated = await res.json();
          set((state) => ({
            stressTests: state.stressTests.map((t) => (t.id === id ? mapApiToStressTest(updated) : t)),
          }));
        } catch (error) {
          console.error('Failed to run stress test:', error);
        }
      },

      createStressTest: async (data) => {
        try {
          const res = await fetch('/api/scenarios/stress-tests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('Failed to create stress test');
          const created = await res.json();
          set((state) => ({ stressTests: [mapApiToStressTest(created), ...state.stressTests] }));
        } catch (error) {
          console.error('Failed to create stress test:', error);
        }
      },

      deleteStressTest: async (id) => {
        try {
          await fetch(`/api/scenarios/stress-tests/${id}`, { method: 'DELETE' });
          set((state) => ({
            stressTests: state.stressTests.filter((t) => t.id !== id),
          }));
        } catch (error) {
          console.error('Failed to delete stress test:', error);
        }
      },

      // =====================================================================
      // SIMULATION
      // =====================================================================

      startSimulation: (baseScenarioId) => {
        const scenario = get().scenarios.find((s) => s.id === baseScenarioId);
        if (!scenario) return;

        const drivers: SimulationDriver[] = scenario.assumptions.map((a) => ({
          id: `driver-${a.id}`,
          assumptionId: a.id,
          name: a.name,
          category: a.category,
          baseValue: a.baseValue,
          currentValue: a.currentValue,
          minValue: a.minValue ?? a.baseValue * 0.5,
          maxValue: a.maxValue ?? a.baseValue * 1.5,
          step: a.step ?? a.baseValue * 0.01,
          unit: a.unit,
          isActive: true,
        }));

        set({
          activeSimulation: {
            id: `sim-${Date.now()}`,
            drivers,
            resultMetrics: { ...scenario.metrics },
            comparisonBaselineId: baseScenarioId,
            isPinned: false,
          },
          isSimulating: true,
        });
      },

      updateSimulationDriver: (driverId, value) => {
        set((state) => {
          if (!state.activeSimulation) return state;

          const newDrivers = state.activeSimulation.drivers.map((d) =>
            d.id === driverId ? { ...d, currentValue: value } : d
          );

          // Recalculate metrics based on driver changes
          const baseScenario = state.scenarios.find(
            (s) => s.id === state.activeSimulation!.comparisonBaselineId
          );
          if (!baseScenario) return state;

          // Simple impact calculation
          let revenueMultiplier = 1;
          let costMultiplier = 1;

          newDrivers.forEach((driver) => {
            const change = (driver.currentValue - driver.baseValue) / driver.baseValue;
            if (driver.category === 'growth' || driver.category === 'pricing' || driver.category === 'volume') {
              revenueMultiplier *= 1 + change;
            }
            if (driver.category === 'cost_inflation' || driver.category === 'headcount') {
              costMultiplier *= 1 + change;
            }
          });

          const newMetrics: ScenarioMetrics = {
            revenue: baseScenario.metrics.revenue * revenueMultiplier,
            costs: baseScenario.metrics.costs * costMultiplier,
            cash: baseScenario.metrics.cash * revenueMultiplier * 0.8,
            netPosition: baseScenario.metrics.revenue * revenueMultiplier - baseScenario.metrics.costs * costMultiplier,
            profitMargin: ((baseScenario.metrics.revenue * revenueMultiplier - baseScenario.metrics.costs * costMultiplier) / (baseScenario.metrics.revenue * revenueMultiplier)) * 100,
            cashRunwayDays: Math.round(baseScenario.metrics.cashRunwayDays * revenueMultiplier),
            revenueDelta: baseScenario.metrics.revenue * (revenueMultiplier - 1),
            costsDelta: baseScenario.metrics.costs * (costMultiplier - 1),
            cashDelta: baseScenario.metrics.cash * (revenueMultiplier * 0.8 - 1),
            netDelta: 0,
            revenueChangePercent: (revenueMultiplier - 1) * 100,
            costsChangePercent: (costMultiplier - 1) * 100,
            cashChangePercent: (revenueMultiplier * 0.8 - 1) * 100,
            netChangePercent: 0,
          };

          return {
            activeSimulation: {
              ...state.activeSimulation,
              drivers: newDrivers,
              resultMetrics: newMetrics,
            },
          };
        });
      },

      resetSimulation: () => {
        set({ activeSimulation: null, isSimulating: false });
      },

      pinSimulation: async (name) => {
        const simulation = get().activeSimulation;
        if (!simulation) return null;

        // Create a new scenario from the simulation
        const baseScenario = get().scenarios.find((s) => s.id === simulation.comparisonBaselineId);
        if (!baseScenario) return null;

        const scenarioId = await get().createScenario({
          name,
          description: `Created from simulation based on "${baseScenario.name}"`,
          caseType: 'custom',
          metrics: simulation.resultMetrics,
          derivedFromId: baseScenario.id,
          derivedFromName: baseScenario.name,
        });

        if (scenarioId) {
          set((state) => ({
            activeSimulation: state.activeSimulation
              ? { ...state.activeSimulation, isPinned: true, pinnedAsScenarioId: scenarioId }
              : null,
          }));
        }

        return scenarioId;
      },

      // =====================================================================
      // COMMENTS
      // =====================================================================

      addComment: async (scenarioId, content, parentId) => {
        try {
          const res = await fetch(`/api/scenarios/${scenarioId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, parentId }),
          });
          if (!res.ok) throw new Error('Failed to add comment');
          const created = await res.json();
          set((state) => ({
            comments: [mapApiToComment(created), ...state.comments],
          }));
        } catch (error) {
          console.error('Failed to add comment:', error);
        }
      },

      resolveComment: async (commentId) => {
        set((state) => ({
          comments: state.comments.map((c) =>
            c.id === commentId ? { ...c, isResolved: true } : c
          ),
        }));

        try {
          await fetch(`/api/scenarios/comments/${commentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isResolved: true }),
          });
        } catch (error) {
          console.error('Failed to resolve comment:', error);
        }
      },

      // =====================================================================
      // COMPUTED
      // =====================================================================

      getFilteredScenarios: () => {
        const { scenarios, filter } = get();
        let filtered = [...scenarios];

        if (filter.caseType?.length) {
          filtered = filtered.filter((s) => filter.caseType!.includes(s.caseType));
        }
        if (filter.status?.length) {
          filtered = filtered.filter((s) => filter.status!.includes(s.status));
        }
        if (filter.visibility?.length) {
          filtered = filtered.filter((s) => filter.visibility!.includes(s.visibility));
        }
        if (filter.tags?.length) {
          filtered = filtered.filter((s) => s.tags.some((t) => filter.tags!.includes(t)));
        }
        if (filter.ownerId) {
          filtered = filtered.filter((s) => s.ownerId === filter.ownerId);
        }
        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (s) =>
              s.name.toLowerCase().includes(query) ||
              s.description?.toLowerCase().includes(query)
          );
        }

        return filtered;
      },

      getImpactExplanation: (scenarioId, comparedToId, metric) => {
        const scenario = get().scenarios.find((s) => s.id === scenarioId);
        const baseline = get().scenarios.find((s) => s.id === comparedToId);

        if (!scenario || !baseline) {
          return {
            scenarioId,
            comparedToId,
            metric,
            totalChange: 0,
            totalChangePercent: 0,
            summaryText: 'Unable to calculate impact',
            primaryDrivers: [],
            secondaryDrivers: [],
            waterfall: { startValue: 0, endValue: 0, steps: [] },
            secondOrderEffects: [],
          };
        }

        const metricMap: Record<string, keyof ScenarioMetrics> = {
          revenue: 'revenue',
          cost: 'costs',
          cash: 'cash',
          net: 'netPosition',
        };

        const metricKey = metricMap[metric];
        const scenarioValue = scenario.metrics[metricKey] as number;
        const baselineValue = baseline.metrics[metricKey] as number;
        const totalChange = scenarioValue - baselineValue;
        const totalChangePercent = baselineValue !== 0 ? (totalChange / baselineValue) * 100 : 0;

        return {
          scenarioId,
          comparedToId,
          metric,
          totalChange,
          totalChangePercent,
          summaryText: `${metric} ${totalChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(totalChangePercent).toFixed(1)}%`,
          primaryDrivers: [],
          secondaryDrivers: [],
          waterfall: {
            startValue: baselineValue,
            endValue: scenarioValue,
            steps: [{ label: 'Change', value: totalChange, cumulative: scenarioValue, isPositive: totalChange >= 0 }],
          },
          secondOrderEffects: [],
        };
      },
    }),
    {
      name: 'scenario-storage',
      partialize: (state) => ({
        viewPreferences: state.viewPreferences,
        activeTab: state.activeTab,
        comparisonScenarioIds: state.comparisonScenarioIds,
      }),
    }
  )
);