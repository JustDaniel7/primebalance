// src/store/taskcenter-store.ts
// Task Center Store - API-connected version

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Task,
  Risk,
  TaskStatus,
  TaskPriority,
  RiskStatus,
  RiskSeverity,
  TaskFilter,
  RiskFilter,
  TaskSort,
  RiskSort,
  TaskSummary,
  RiskSummary,
  TaskWizardState,
  RiskWizardState,
  TaskViewPreferences,
  RiskViewPreferences,
  TaskGroupBy,
  RiskGroupBy,
  TaskComment,
  RiskMitigationStep,
} from '@/types/taskcenter';

// =============================================================================
// INITIAL STATES
// =============================================================================

const initialTaskWizard: TaskWizardState = {
  step: 1,
  isOpen: false,
  title: '',
  description: '',
  priority: 'medium',
  assigneeIds: [],
  tags: [],
  sourceSystem: 'manual',
  linkedRiskIds: [],
};

const initialRiskWizard: RiskWizardState = {
  step: 1,
  isOpen: false,
  title: '',
  description: '',
  severity: 'medium',
  likelihood: 'possible',
  impactAreas: [],
  mitigationPlan: '',
  mitigationSteps: [],
};

const initialTaskViewPreferences: TaskViewPreferences = {
  density: 'comfortable',
  mode: 'list',
  groupBy: 'dueDate',
  sort: { field: 'dueDate', order: 'asc' },
  showCompleted: false,
  showSnoozed: false,
  columnsVisible: ['title', 'status', 'priority', 'dueDate', 'owner'],
};

const initialRiskViewPreferences: RiskViewPreferences = {
  density: 'comfortable',
  groupBy: 'severity',
  sort: { field: 'impactScore', order: 'desc' },
  showResolved: false,
  columnsVisible: ['title', 'status', 'severity', 'impactScore', 'owner'],
};

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface TaskCenterState {
  // Data
  tasks: Task[];
  risks: Risk[];
  taskSummary: TaskSummary | null;
  riskSummary: RiskSummary | null;

  // UI State
  activeTab: 'tasks' | 'risks';
  taskFilter: TaskFilter;
  riskFilter: RiskFilter;
  taskViewPreferences: TaskViewPreferences;
  riskViewPreferences: RiskViewPreferences;

  // Wizards
  taskWizard: TaskWizardState;
  riskWizard: RiskWizardState;

  // Loading
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Fetch Actions
  fetchTasks: (filters?: Record<string, string>) => Promise<void>;
  fetchTask: (id: string) => Promise<Task | null>;
  fetchTaskSummary: () => Promise<void>;
  fetchRisks: (filters?: Record<string, string>) => Promise<void>;
  fetchRisk: (id: string) => Promise<Risk | null>;
  fetchRiskSummary: () => Promise<void>;

  // Task CRUD
  createTask: (data: Partial<Task>) => Promise<Task | null>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Task Actions
  completeTask: (id: string) => Promise<void>;
  reopenTask: (id: string) => Promise<void>;
  snoozeTask: (id: string, until: string) => Promise<void>;
  assignTask: (id: string, assigneeIds: string[]) => Promise<void>;

  // Task Comments
  addTaskComment: (taskId: string, content: string, parentId?: string) => Promise<void>;

  // Risk CRUD
  createRisk: (data: Partial<Risk>) => Promise<Risk | null>;
  updateRisk: (id: string, data: Partial<Risk>) => Promise<void>;
  deleteRisk: (id: string) => Promise<void>;

  // Risk Actions
  escalateRisk: (id: string, to: string) => Promise<void>;
  resolveRisk: (id: string) => Promise<void>;
  updateMitigationStep: (riskId: string, stepId: string, status: string) => Promise<void>;

  // UI Actions
  setActiveTab: (tab: 'tasks' | 'risks') => void;
  setTaskFilter: (filter: Partial<TaskFilter>) => void;
  setRiskFilter: (filter: Partial<RiskFilter>) => void;
  resetTaskFilter: () => void;
  resetRiskFilter: () => void;
  setTaskViewPreferences: (prefs: Partial<TaskViewPreferences>) => void;
  setRiskViewPreferences: (prefs: Partial<RiskViewPreferences>) => void;

  // Wizard Actions
  openTaskWizard: (editTask?: Task) => void;
  closeTaskWizard: () => void;
  updateTaskWizard: (data: Partial<TaskWizardState>) => void;
  openRiskWizard: (editRisk?: Risk) => void;
  closeRiskWizard: () => void;
  updateRiskWizard: (data: Partial<RiskWizardState>) => void;

  // Computed
  getFilteredTasks: () => Task[];
  getFilteredRisks: () => Risk[];
  getGroupedTasks: () => Record<string, Task[]>;
  getGroupedRisks: () => Record<string, Risk[]>;
  getTaskSummary: () => TaskSummary;
  getRiskSummary: () => RiskSummary;
}

// =============================================================================
// DEFAULT SUMMARIES
// =============================================================================

const defaultTaskSummary: TaskSummary = {
  total: 0,
  byStatus: { open: 0, in_progress: 0, blocked: 0, awaiting_review: 0, completed: 0, cancelled: 0, snoozed: 0 },
  byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
  dueToday: 0,
  overdue: 0,
  dueSoon: 0,
  blocked: 0,
  needsReview: 0,
  slaBreach: 0,
  completedToday: 0,
  completedThisWeek: 0,
};

const defaultRiskSummary: RiskSummary = {
  total: 0,
  byStatus: { identified: 0, assessing: 0, mitigating: 0, monitoring: 0, resolved: 0, accepted: 0, escalated: 0 },
  bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
  criticalCount: 0,
  highCount: 0,
  newlyEscalated: 0,
  staleCount: 0,
  mitigationOverdue: 0,
  averageImpactScore: 0,
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useTaskStore = create<TaskCenterState>()(
  persist(
    (set, get) => ({
      // Initial State
      tasks: [],
      risks: [],
      taskSummary: null,
      riskSummary: null,

      activeTab: 'tasks',
      taskFilter: {},
      riskFilter: {},
      taskViewPreferences: initialTaskViewPreferences,
      riskViewPreferences: initialRiskViewPreferences,

      taskWizard: initialTaskWizard,
      riskWizard: initialRiskWizard,

      isLoading: false,
      error: null,
      isInitialized: false,

      // =====================================================================
      // FETCH ACTIONS
      // =====================================================================

      fetchTasks: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          const params = new URLSearchParams(filters);
          const res = await fetch(`/api/tasks?${params}`);
          if (!res.ok) throw new Error('Failed to fetch tasks');
          const data = await res.json();
          set({ tasks: data.tasks || [], isLoading: false, isInitialized: true });
        } catch (error) {
          console.error('Failed to fetch tasks:', error);
          set({ error: (error as Error).message, isLoading: false, isInitialized: true });
        }
      },

      fetchTask: async (id) => {
        try {
          const res = await fetch(`/api/tasks/${id}`);
          if (!res.ok) return null;
          return await res.json();
        } catch (error) {
          console.error('Failed to fetch task:', error);
          return null;
        }
      },

      fetchTaskSummary: async () => {
        try {
          const res = await fetch('/api/tasks/summary');
          if (!res.ok) throw new Error('Failed to fetch task summary');
          const data = await res.json();
          set({ taskSummary: data });
        } catch (error) {
          console.error('Failed to fetch task summary:', error);
        }
      },

      fetchRisks: async (filters) => {
        try {
          const params = new URLSearchParams(filters);
          const res = await fetch(`/api/risks?${params}`);
          if (!res.ok) throw new Error('Failed to fetch risks');
          const data = await res.json();
          set({ risks: data.risks || [] });
        } catch (error) {
          console.error('Failed to fetch risks:', error);
        }
      },

      fetchRisk: async (id) => {
        try {
          const res = await fetch(`/api/risks/${id}`);
          if (!res.ok) return null;
          return await res.json();
        } catch (error) {
          console.error('Failed to fetch risk:', error);
          return null;
        }
      },

      fetchRiskSummary: async () => {
        try {
          const res = await fetch('/api/risks/summary');
          if (!res.ok) throw new Error('Failed to fetch risk summary');
          const data = await res.json();
          set({ riskSummary: data });
        } catch (error) {
          console.error('Failed to fetch risk summary:', error);
        }
      },

      // =====================================================================
      // TASK CRUD
      // =====================================================================

      createTask: async (data) => {
        try {
          const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('Failed to create task');
          const created = await res.json();
          set((state) => ({ tasks: [created, ...state.tasks] }));
          get().fetchTaskSummary();
          return created;
        } catch (error) {
          console.error('Failed to create task:', error);
          return null;
        }
      },

      updateTask: async (id, data) => {
        try {
          const res = await fetch(`/api/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('Failed to update task');
          const updated = await res.json();
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updated } : t)),
          }));
          get().fetchTaskSummary();
        } catch (error) {
          console.error('Failed to update task:', error);
        }
      },

      deleteTask: async (id) => {
        try {
          await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
          set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
          get().fetchTaskSummary();
        } catch (error) {
          console.error('Failed to delete task:', error);
        }
      },

      // =====================================================================
      // TASK ACTIONS
      // =====================================================================

      completeTask: async (id) => {
        await get().updateTask(id, { status: 'completed' });
      },

      reopenTask: async (id) => {
        await get().updateTask(id, { status: 'open', completedAt: undefined } as any);
      },

      snoozeTask: async (id, until) => {
        await get().updateTask(id, { status: 'snoozed', snoozedUntil: until } as any);
      },

      assignTask: async (id, assigneeIds) => {
        // This would need a separate endpoint for managing assignees
        await get().updateTask(id, { assigneeIds } as any);
      },

      addTaskComment: async (taskId, content, parentId) => {
        try {
          await fetch(`/api/tasks/${taskId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, parentId }),
          });
          // Refresh task to get updated comments
          const task = await get().fetchTask(taskId);
          if (task) {
            set((state) => ({
              tasks: state.tasks.map((t) => (t.id === taskId ? task : t)),
            }));
          }
        } catch (error) {
          console.error('Failed to add comment:', error);
        }
      },

      // =====================================================================
      // RISK CRUD
      // =====================================================================

      createRisk: async (data) => {
        try {
          const res = await fetch('/api/risks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('Failed to create risk');
          const created = await res.json();
          set((state) => ({ risks: [created, ...state.risks] }));
          get().fetchRiskSummary();
          return created;
        } catch (error) {
          console.error('Failed to create risk:', error);
          return null;
        }
      },

      updateRisk: async (id, data) => {
        try {
          const res = await fetch(`/api/risks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('Failed to update risk');
          const updated = await res.json();
          set((state) => ({
            risks: state.risks.map((r) => (r.id === id ? { ...r, ...updated } : r)),
          }));
          get().fetchRiskSummary();
        } catch (error) {
          console.error('Failed to update risk:', error);
        }
      },

      deleteRisk: async (id) => {
        try {
          await fetch(`/api/risks/${id}`, { method: 'DELETE' });
          set((state) => ({ risks: state.risks.filter((r) => r.id !== id) }));
          get().fetchRiskSummary();
        } catch (error) {
          console.error('Failed to delete risk:', error);
        }
      },

      // =====================================================================
      // RISK ACTIONS
      // =====================================================================

      escalateRisk: async (id, to) => {
        await get().updateRisk(id, {
          status: 'escalated',
          escalatedTo: to,
          isNewlyEscalated: true,
        } as any);
      },

      resolveRisk: async (id) => {
        await get().updateRisk(id, { status: 'resolved' } as any);
      },

      updateMitigationStep: async (riskId, stepId, status) => {
        try {
          await fetch(`/api/risks/${riskId}/steps/${stepId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          });
          // Refresh risk
          const risk = await get().fetchRisk(riskId);
          if (risk) {
            set((state) => ({
              risks: state.risks.map((r) => (r.id === riskId ? risk : r)),
            }));
          }
        } catch (error) {
          console.error('Failed to update mitigation step:', error);
        }
      },

      // =====================================================================
      // UI ACTIONS
      // =====================================================================

      setActiveTab: (tab) => set({ activeTab: tab }),

      setTaskFilter: (filter) =>
        set((state) => ({ taskFilter: { ...state.taskFilter, ...filter } })),

      setRiskFilter: (filter) =>
        set((state) => ({ riskFilter: { ...state.riskFilter, ...filter } })),

      resetTaskFilter: () => set({ taskFilter: {} }),
      resetRiskFilter: () => set({ riskFilter: {} }),

      setTaskViewPreferences: (prefs) =>
        set((state) => ({
          taskViewPreferences: { ...state.taskViewPreferences, ...prefs },
        })),

      setRiskViewPreferences: (prefs) =>
        set((state) => ({
          riskViewPreferences: { ...state.riskViewPreferences, ...prefs },
        })),

      // =====================================================================
      // WIZARD ACTIONS
      // =====================================================================

      openTaskWizard: (editTask) => {
        if (editTask) {
          set({
            taskWizard: {
              ...initialTaskWizard,
              isOpen: true,
              editingTaskId: editTask.id,
              title: editTask.title,
              description: editTask.description || '',
              priority: editTask.priority,
              dueDate: editTask.dueDate,
              assigneeIds: editTask.assigneeIds || [],
              tags: editTask.tags?.map((t: any) => t.name || t) || [],
              sourceSystem: editTask.sourceSystem,
              linkedRiskIds: editTask.linkedRiskIds || [],
            },
          });
        } else {
          set({ taskWizard: { ...initialTaskWizard, isOpen: true } });
        }
      },

      closeTaskWizard: () => set({ taskWizard: initialTaskWizard }),

      updateTaskWizard: (data) =>
        set((state) => ({ taskWizard: { ...state.taskWizard, ...data } })),

      openRiskWizard: (editRisk) => {
        if (editRisk) {
          set({
            riskWizard: {
              ...initialRiskWizard,
              isOpen: true,
              editingRiskId: editRisk.id,
              title: editRisk.title,
              description: editRisk.description || '',
              severity: editRisk.severity,
              likelihood: editRisk.likelihood,
              impactAreas: editRisk.impactAreas || [],
              targetMitigationDate: editRisk.targetMitigationDate,
              mitigationPlan: editRisk.mitigationPlan || '',
              mitigationSteps: editRisk.mitigationSteps || [],
            },
          });
        } else {
          set({ riskWizard: { ...initialRiskWizard, isOpen: true } });
        }
      },

      closeRiskWizard: () => set({ riskWizard: initialRiskWizard }),

      updateRiskWizard: (data) =>
        set((state) => ({ riskWizard: { ...state.riskWizard, ...data } })),

      // =====================================================================
      // COMPUTED
      // =====================================================================

      getFilteredTasks: () => {
        const { tasks, taskFilter, taskViewPreferences } = get();
        let filtered = [...tasks];

        // Apply filters
        if (taskFilter.status?.length) {
          filtered = filtered.filter((t) => taskFilter.status!.includes(t.status as any));
        }
        if (taskFilter.priority?.length) {
          filtered = filtered.filter((t) => taskFilter.priority!.includes(t.priority as any));
        }
        if (taskFilter.ownerId?.length) {
          filtered = filtered.filter((t) => t.ownerId && taskFilter.ownerId!.includes(t.ownerId));
        }
        if (taskFilter.sourceSystem?.length) {
          filtered = filtered.filter((t) => taskFilter.sourceSystem!.includes(t.sourceSystem as any));
        }
        if (taskFilter.searchQuery) {
          const q = taskFilter.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
          );
        }

        // Hide completed/snoozed unless requested
        if (!taskViewPreferences.showCompleted) {
          filtered = filtered.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
        }
        if (!taskViewPreferences.showSnoozed) {
          filtered = filtered.filter((t) => t.status !== 'snoozed');
        }

        // Sort
        const { field, order } = taskViewPreferences.sort;
        filtered.sort((a, b) => {
          let aVal: any = a[field as keyof Task];
          let bVal: any = b[field as keyof Task];

          if (field === 'priority') {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            aVal = priorityOrder[aVal as keyof typeof priorityOrder] || 0;
            bVal = priorityOrder[bVal as keyof typeof priorityOrder] || 0;
          }

          if (order === 'asc') {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          }
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        });

        return filtered;
      },

      getFilteredRisks: () => {
        const { risks, riskFilter, riskViewPreferences } = get();
        let filtered = [...risks];

        if (riskFilter.status?.length) {
          filtered = filtered.filter((r) => riskFilter.status!.includes(r.status as any));
        }
        if (riskFilter.severity?.length) {
          filtered = filtered.filter((r) => riskFilter.severity!.includes(r.severity as any));
        }
        if (riskFilter.ownerId?.length) {
          filtered = filtered.filter((r) => r.ownerId && riskFilter.ownerId!.includes(r.ownerId));
        }
        if (riskFilter.searchQuery) {
          const q = riskFilter.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (r) => r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
          );
        }

        if (!riskViewPreferences.showResolved) {
          filtered = filtered.filter((r) => r.status !== 'resolved' && r.status !== 'accepted');
        }

        const { field, order } = riskViewPreferences.sort;
        filtered.sort((a, b) => {
          let aVal: any = a[field as keyof Risk];
          let bVal: any = b[field as keyof Risk];

          if (field === 'severity') {
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            aVal = severityOrder[aVal as keyof typeof severityOrder] || 0;
            bVal = severityOrder[bVal as keyof typeof severityOrder] || 0;
          }

          if (order === 'asc') {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          }
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        });

        return filtered;
      },

      getGroupedTasks: () => {
        const tasks = get().getFilteredTasks();
        const { groupBy } = get().taskViewPreferences;

        if (groupBy === 'none') return { 'All Tasks': tasks };

        const groups: Record<string, Task[]> = {};
        const today = new Date().toISOString().split('T')[0];

        tasks.forEach((task) => {
          let groupKey: string;

          switch (groupBy) {
            case 'dueDate':
              if (!task.dueDate) {
                groupKey = 'No Due Date';
              } else {
                const dueDate = task.dueDate.split('T')[0];
                if (dueDate < today) groupKey = 'Overdue';
                else if (dueDate === today) groupKey = 'Today';
                else {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  if (dueDate === tomorrow.toISOString().split('T')[0]) groupKey = 'Tomorrow';
                  else {
                    const weekFromNow = new Date();
                    weekFromNow.setDate(weekFromNow.getDate() + 7);
                    if (dueDate <= weekFromNow.toISOString().split('T')[0]) groupKey = 'This Week';
                    else groupKey = 'Later';
                  }
                }
              }
              break;
            case 'priority':
              groupKey = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
              break;
            case 'status':
              groupKey = task.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
              break;
            case 'owner':
              groupKey = task.ownerName || 'Unassigned';
              break;
            case 'sourceSystem':
              groupKey = task.sourceSystem.charAt(0).toUpperCase() + task.sourceSystem.slice(1);
              break;
            default:
              groupKey = 'Other';
          }

          if (!groups[groupKey]) groups[groupKey] = [];
          groups[groupKey].push(task);
        });

        return groups;
      },

      getGroupedRisks: () => {
        const risks = get().getFilteredRisks();
        const { groupBy } = get().riskViewPreferences;

        if (groupBy === 'none') return { 'All Risks': risks };

        const groups: Record<string, Risk[]> = {};

        risks.forEach((risk) => {
          let groupKey: string;

          switch (groupBy) {
            case 'severity':
              groupKey = risk.severity.charAt(0).toUpperCase() + risk.severity.slice(1);
              break;
            case 'status':
              groupKey = risk.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
              break;
            case 'owner':
              groupKey = risk.ownerName || 'Unassigned';
              break;
            default:
              groupKey = 'Other';
          }

          if (!groups[groupKey]) groups[groupKey] = [];
          groups[groupKey].push(risk);
        });

        return groups;
      },

      getTaskSummary: () => {
        return get().taskSummary || defaultTaskSummary;
      },

      getRiskSummary: () => {
        return get().riskSummary || defaultRiskSummary;
      },
    }),
    {
      name: 'taskcenter-store',
      partialize: (state) => ({
        activeTab: state.activeTab,
        taskFilter: state.taskFilter,
        riskFilter: state.riskFilter,
        taskViewPreferences: state.taskViewPreferences,
        riskViewPreferences: state.riskViewPreferences,
      }),
    }
  )
);