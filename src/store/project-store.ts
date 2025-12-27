// =============================================================================
// PROJECT STORE - PrimeBalance Finance OS
// CHANGE TYPE: UPDATE - Full API Integration (replaces demo data)
// FILE PATH: src/store/project-store.ts
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    Project,
    CostCenter,
    ProjectBudgetLine,
    CostAttribution,
    TimeEntry,
    ResourceAllocation,
    InternalChargeback,
    ProjectMilestone,
    ProjectSummary,
    CostCenterSummary,
    ProjectProfitability,
    ProjectWizardState,
    ProjectStatus,
    ProjectType,
    BudgetType,
    TimeEntryStatus,
    ChargebackStatus,
} from '@/types/project';

// =============================================================================
// INITIAL STATES
// =============================================================================

const initialWizardState: ProjectWizardState = {
    step: 1,
    code: '',
    name: '',
    description: '',
    type: null,
    priority: 'medium',
    costCenterId: '',
    departmentId: '',
    clientId: '',
    ownerId: '',
    plannedStartDate: '',
    plannedEndDate: '',
    budgetType: null,
    budgetAmount: 0,
    currency: 'EUR',
    isBillable: false,
    billingMethod: null,
    billingRate: 0,
    contractValue: 0,
    allocatedHours: 0,
    hourlyRate: 0,
};

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface ProjectState {
    // Data
    projects: Project[];
    costCenters: CostCenter[];
    budgetLines: ProjectBudgetLine[];
    costAttributions: CostAttribution[];
    timeEntries: TimeEntry[];
    resourceAllocations: ResourceAllocation[];
    chargebacks: InternalChargeback[];
    milestones: ProjectMilestone[];

    // Wizard
    wizardState: ProjectWizardState;
    wizardOpen: boolean;
    editingProjectId: string | null;

    // Selected
    selectedProjectId: string | null;
    selectedCostCenterId: string | null;

    // Loading & Error States
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;

    // Delete Confirmation
    deleteConfirmId: string | null;
    deleteConfirmType: 'project' | 'costCenter' | 'timeEntry' | 'chargeback' | null;

    // API Actions
    fetchProjects: () => Promise<void>;
    fetchCostCenters: () => Promise<void>;
    fetchTimeEntries: (projectId?: string) => Promise<void>;
    fetchChargebacks: () => Promise<void>;

    // Projects CRUD
    createProject: (projectData: Partial<Project>) => Promise<Project | null>;
    updateProject: (id: string, updates: Partial<Project>) => Promise<Project | null>;
    deleteProject: (id: string) => Promise<boolean>;
    updateProjectStatus: (id: string, status: ProjectStatus) => Promise<boolean>;

    // Cost Centers CRUD
    createCostCenter: (data: Partial<CostCenter>) => Promise<CostCenter | null>;
    updateCostCenter: (id: string, updates: Partial<CostCenter>) => Promise<CostCenter | null>;
    deleteCostCenter: (id: string) => Promise<boolean>;

    // Time Entries
    createTimeEntry: (data: Partial<TimeEntry>) => Promise<TimeEntry | null>;
    updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => Promise<TimeEntry | null>;
    deleteTimeEntry: (id: string) => Promise<boolean>;
    approveTimeEntry: (id: string, approvedBy: string) => Promise<boolean>;
    rejectTimeEntry: (id: string, reason: string) => Promise<boolean>;
    submitTimeEntry: (id: string) => Promise<boolean>;

    // Chargebacks
    createChargeback: (data: Partial<InternalChargeback>) => Promise<InternalChargeback | null>;
    updateChargeback: (id: string, updates: Partial<InternalChargeback>) => Promise<InternalChargeback | null>;
    deleteChargeback: (id: string) => Promise<boolean>;
    approveChargeback: (id: string, approvedBy: string) => Promise<boolean>;
    rejectChargeback: (id: string, reason: string) => Promise<boolean>;

    // Milestones
    createMilestone: (data: Partial<ProjectMilestone>) => Promise<ProjectMilestone | null>;
    updateMilestone: (id: string, updates: Partial<ProjectMilestone>) => Promise<ProjectMilestone | null>;
    deleteMilestone: (id: string) => Promise<boolean>;
    completeMilestone: (id: string) => Promise<boolean>;

    // Wizard
    openWizard: (editProject?: Project) => void;
    closeWizard: () => void;
    setWizardStep: (step: number) => void;
    updateWizardState: (updates: Partial<ProjectWizardState>) => void;
    resetWizard: () => void;
    saveFromWizard: () => Promise<Project | null>;

    // Delete Confirmation
    openDeleteConfirm: (id: string, type: 'project' | 'costCenter' | 'timeEntry' | 'chargeback') => void;
    closeDeleteConfirm: () => void;
    confirmDelete: () => Promise<boolean>;

    // Analytics
    getProjectSummary: () => ProjectSummary;
    getCostCenterSummary: (costCenterId: string) => CostCenterSummary | null;
    getProjectProfitability: (projectId: string) => ProjectProfitability | null;
    getProjectsByStatus: (status: ProjectStatus) => Project[];
    getProjectsByCostCenter: (costCenterId: string) => Project[];
    getOverdueProjects: () => Project[];
    getOverBudgetProjects: () => Project[];

    // Time Tracking
    getTimeEntriesByProject: (projectId: string) => TimeEntry[];
    getTimeEntriesByUser: (userId: string) => TimeEntry[];
    getPendingTimeEntries: () => TimeEntry[];

    // Selection
    selectProject: (id: string | null) => void;
    selectCostCenter: (id: string | null) => void;

    // Error handling
    clearError: () => void;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useProjectStore = create<ProjectState>()(
    persist(
        (set, get) => ({
            // Initial Data (empty - fetched from API)
            projects: [],
            costCenters: [],
            budgetLines: [],
            costAttributions: [],
            timeEntries: [],
            resourceAllocations: [],
            chargebacks: [],
            milestones: [],

            wizardState: initialWizardState,
            wizardOpen: false,
            editingProjectId: null,
            selectedProjectId: null,
            selectedCostCenterId: null,

            // Loading & Error States
            isLoading: false,
            isSaving: false,
            error: null,

            // Delete Confirmation
            deleteConfirmId: null,
            deleteConfirmType: null,

            // =================================================================
            // API FETCH ACTIONS
            // =================================================================

            fetchProjects: async () => {
                set({ isLoading: true, error: null });
                try {
                    const res = await fetch('/api/projects');
                    if (!res.ok) throw new Error('Failed to fetch projects');
                    const data = await res.json();
                    set({ projects: data.projects || [], isLoading: false });
                } catch (error) {
                    console.error('fetchProjects error:', error);
                    set({ error: (error as Error).message, isLoading: false });
                }
            },

            fetchCostCenters: async () => {
                try {
                    const res = await fetch('/api/cost-centers');
                    if (!res.ok) throw new Error('Failed to fetch cost centers');
                    const data = await res.json();
                    set({ costCenters: data.costCenters || [] });
                } catch (error) {
                    console.error('fetchCostCenters error:', error);
                    // Don't set error for secondary fetch
                }
            },

            fetchTimeEntries: async (projectId?: string) => {
                try {
                    const url = projectId 
                        ? `/api/time-entries?projectId=${projectId}` 
                        : '/api/time-entries';
                    const res = await fetch(url);
                    if (!res.ok) throw new Error('Failed to fetch time entries');
                    const data = await res.json();
                    set({ timeEntries: data.timeEntries || [] });
                } catch (error) {
                    console.error('fetchTimeEntries error:', error);
                }
            },

            fetchChargebacks: async () => {
                try {
                    const res = await fetch('/api/chargebacks');
                    if (!res.ok) throw new Error('Failed to fetch chargebacks');
                    const data = await res.json();
                    set({ chargebacks: data.chargebacks || [] });
                } catch (error) {
                    console.error('fetchChargebacks error:', error);
                }
            },

            // =================================================================
            // PROJECTS CRUD
            // =================================================================

            createProject: async (projectData) => {
                set({ isSaving: true, error: null });
                try {
                    const res = await fetch('/api/projects', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(projectData),
                    });
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Failed to create project');
                    }
                    const project = await res.json();
                    set((state) => ({
                        projects: [...state.projects, project],
                        isSaving: false,
                    }));
                    return project;
                } catch (error) {
                    console.error('createProject error:', error);
                    set({ error: (error as Error).message, isSaving: false });
                    return null;
                }
            },

            updateProject: async (id, updates) => {
                set({ isSaving: true, error: null });
                try {
                    const res = await fetch(`/api/projects/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updates),
                    });
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Failed to update project');
                    }
                    const project = await res.json();
                    set((state) => ({
                        projects: state.projects.map((p) => p.id === id ? { ...p, ...project } : p),
                        isSaving: false,
                    }));
                    return project;
                } catch (error) {
                    console.error('updateProject error:', error);
                    set({ error: (error as Error).message, isSaving: false });
                    return null;
                }
            },

            deleteProject: async (id) => {
                set({ isSaving: true, error: null });
                try {
                    const res = await fetch(`/api/projects/${id}`, {
                        method: 'DELETE',
                    });
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Failed to delete project');
                    }
                    set((state) => ({
                        projects: state.projects.filter((p) => p.id !== id),
                        timeEntries: state.timeEntries.filter((t) => t.projectId !== id),
                        milestones: state.milestones.filter((m) => m.projectId !== id),
                        isSaving: false,
                        deleteConfirmId: null,
                        deleteConfirmType: null,
                    }));
                    return true;
                } catch (error) {
                    console.error('deleteProject error:', error);
                    set({ error: (error as Error).message, isSaving: false });
                    return false;
                }
            },

            updateProjectStatus: async (id, status) => {
                return !!(await get().updateProject(id, { status }));
            },

            // =================================================================
            // COST CENTERS CRUD
            // =================================================================

            createCostCenter: async (data) => {
                set({ isSaving: true, error: null });
                try {
                    const res = await fetch('/api/cost-centers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Failed to create cost center');
                    }
                    const costCenter = await res.json();
                    set((state) => ({
                        costCenters: [...state.costCenters, costCenter],
                        isSaving: false,
                    }));
                    return costCenter;
                } catch (error) {
                    console.error('createCostCenter error:', error);
                    set({ error: (error as Error).message, isSaving: false });
                    return null;
                }
            },

            updateCostCenter: async (id, updates) => {
                set({ isSaving: true, error: null });
                try {
                    const res = await fetch(`/api/cost-centers/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updates),
                    });
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Failed to update cost center');
                    }
                    const costCenter = await res.json();
                    set((state) => ({
                        costCenters: state.costCenters.map((c) => c.id === id ? { ...c, ...costCenter } : c),
                        isSaving: false,
                    }));
                    return costCenter;
                } catch (error) {
                    console.error('updateCostCenter error:', error);
                    set({ error: (error as Error).message, isSaving: false });
                    return null;
                }
            },

            deleteCostCenter: async (id) => {
                set({ isSaving: true, error: null });
                try {
                    const res = await fetch(`/api/cost-centers/${id}`, {
                        method: 'DELETE',
                    });
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Failed to delete cost center');
                    }
                    set((state) => ({
                        costCenters: state.costCenters.filter((c) => c.id !== id),
                        isSaving: false,
                        deleteConfirmId: null,
                        deleteConfirmType: null,
                    }));
                    return true;
                } catch (error) {
                    console.error('deleteCostCenter error:', error);
                    set({ error: (error as Error).message, isSaving: false });
                    return false;
                }
            },

            // =================================================================
            // TIME ENTRIES CRUD
            // =================================================================

            createTimeEntry: async (data) => {
                set({ isSaving: true, error: null });
                try {
                    const res = await fetch('/api/time-entries', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Failed to create time entry');
                    }
                    const entry = await res.json();
                    set((state) => ({
                        timeEntries: [...state.timeEntries, entry],
                        isSaving: false,
                    }));
                    return entry;
                } catch (error) {
                    console.error('createTimeEntry error:', error);
                    set({ error: (error as Error).message, isSaving: false });
                    return null;
                }
            },

            updateTimeEntry: async (id, updates) => {
                set({ isSaving: true, error: null });
                try {
                    const res = await fetch(`/api/time-entries/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updates),
                    });
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Failed to update time entry');
                    }
                    const entry = await res.json();
                    set((state) => ({
                        timeEntries: state.timeEntries.map((t) => t.id === id ? { ...t, ...entry } : t),
                        isSaving: false,
                    }));
                    return entry;
                } catch (error) {
                    console.error('updateTimeEntry error:', error);
                    set({ error: (error as Error).message, isSaving: false });
                    return null;
                }
            },

            deleteTimeEntry: async (id) => {
                set({ isSaving: true, error: null });
                try {
                    const res = await fetch(`/api/time-entries/${id}`, {
                        method: 'DELETE',
                    });
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Failed to delete time entry');
                    }
                    set((state) => ({
                        timeEntries: state.timeEntries.filter((t) => t.id !== id),
                        isSaving: false,
                        deleteConfirmId: null,
                        deleteConfirmType: null,
                    }));
                    return true;
                } catch (error) {
                    console.error('deleteTimeEntry error:', error);
                    set({ error: (error as Error).message, isSaving: false });
                    return false;
                }
            },

            approveTimeEntry: async (id, approvedBy) => {
                return !!(await get().updateTimeEntry(id, { 
                    status: 'approved' as TimeEntryStatus, 
                    approvedBy, 
                    approvedAt: new Date().toISOString() 
                }));
            },

            rejectTimeEntry: async (id, reason) => {
                return !!(await get().updateTimeEntry(id, { 
                    status: 'rejected' as TimeEntryStatus, 
                    rejectionReason: reason 
                }));
            },

            submitTimeEntry: async (id) => {
                return !!(await get().updateTimeEntry(id, { 
                    status: 'submitted' as TimeEntryStatus 
                }));
            },

            // =================================================================
            // CHARGEBACKS CRUD
            // =================================================================

            createChargeback: async (data) => {
                set({ isSaving: true, error: null });
                try {
                    const res = await fetch('/api/chargebacks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Failed to create chargeback');
                    }
                    const chargeback = await res.json();
                    set((state) => ({
                        chargebacks: [...state.chargebacks, chargeback],
                        isSaving: false,
                    }));
                    return chargeback;
                } catch (error) {
                    console.error('createChargeback error:', error);
                    set({ error: (error as Error).message, isSaving: false });
                    return null;
                }
            },

            updateChargeback: async (id, updates) => {
                set({ isSaving: true, error: null });
                try {
                    const res = await fetch(`/api/chargebacks/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updates),
                    });
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Failed to update chargeback');
                    }
                    const chargeback = await res.json();
                    set((state) => ({
                        chargebacks: state.chargebacks.map((c) => c.id === id ? { ...c, ...chargeback } : c),
                        isSaving: false,
                    }));
                    return chargeback;
                } catch (error) {
                    console.error('updateChargeback error:', error);
                    set({ error: (error as Error).message, isSaving: false });
                    return null;
                }
            },

            deleteChargeback: async (id) => {
                set({ isSaving: true, error: null });
                try {
                    const res = await fetch(`/api/chargebacks/${id}`, {
                        method: 'DELETE',
                    });
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Failed to delete chargeback');
                    }
                    set((state) => ({
                        chargebacks: state.chargebacks.filter((c) => c.id !== id),
                        isSaving: false,
                        deleteConfirmId: null,
                        deleteConfirmType: null,
                    }));
                    return true;
                } catch (error) {
                    console.error('deleteChargeback error:', error);
                    set({ error: (error as Error).message, isSaving: false });
                    return false;
                }
            },

            approveChargeback: async (id, approvedBy) => {
                return !!(await get().updateChargeback(id, { 
                    status: 'approved' as ChargebackStatus, 
                    approvedBy, 
                    approvedAt: new Date().toISOString() 
                }));
            },

            rejectChargeback: async (id, reason) => {
                return !!(await get().updateChargeback(id, { 
                    status: 'rejected' as ChargebackStatus, 
                    rejectionReason: reason 
                }));
            },

            // =================================================================
            // MILESTONES CRUD
            // =================================================================

            createMilestone: async (data) => {
                set({ isSaving: true, error: null });
                try {
                    const res = await fetch('/api/milestones', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Failed to create milestone');
                    }
                    const milestone = await res.json();
                    set((state) => ({
                        milestones: [...state.milestones, milestone],
                        isSaving: false,
                    }));
                    return milestone;
                } catch (error) {
                    console.error('createMilestone error:', error);
                    set({ error: (error as Error).message, isSaving: false });
                    return null;
                }
            },

            updateMilestone: async (id, updates) => {
                set({ isSaving: true, error: null });
                try {
                    const res = await fetch(`/api/milestones/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updates),
                    });
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Failed to update milestone');
                    }
                    const milestone = await res.json();
                    set((state) => ({
                        milestones: state.milestones.map((m) => m.id === id ? { ...m, ...milestone } : m),
                        isSaving: false,
                    }));
                    return milestone;
                } catch (error) {
                    console.error('updateMilestone error:', error);
                    set({ error: (error as Error).message, isSaving: false });
                    return null;
                }
            },

            deleteMilestone: async (id) => {
                set({ isSaving: true, error: null });
                try {
                    const res = await fetch(`/api/milestones/${id}`, {
                        method: 'DELETE',
                    });
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || 'Failed to delete milestone');
                    }
                    set((state) => ({
                        milestones: state.milestones.filter((m) => m.id !== id),
                        isSaving: false,
                    }));
                    return true;
                } catch (error) {
                    console.error('deleteMilestone error:', error);
                    set({ error: (error as Error).message, isSaving: false });
                    return false;
                }
            },

            completeMilestone: async (id) => {
                return !!(await get().updateMilestone(id, { 
                    status: 'completed', 
                    percentComplete: 100,
                    actualDate: new Date().toISOString().split('T')[0]
                }));
            },

            // =================================================================
            // WIZARD ACTIONS
            // =================================================================

            openWizard: (editProject) => {
                if (editProject) {
                    set({
                        wizardOpen: true,
                        editingProjectId: editProject.id,
                        wizardState: {
                            step: 1,
                            code: editProject.code,
                            name: editProject.name,
                            description: editProject.description || '',
                            type: editProject.type,
                            priority: editProject.priority,
                            costCenterId: editProject.costCenterId || '',
                            departmentId: editProject.departmentId || '',
                            clientId: editProject.clientId || '',
                            ownerId: editProject.ownerId || '',
                            plannedStartDate: editProject.plannedStartDate,
                            plannedEndDate: editProject.plannedEndDate,
                            budgetType: editProject.budgetType,
                            budgetAmount: editProject.budgetAmount,
                            currency: editProject.currency,
                            isBillable: editProject.isBillable,
                            billingMethod: editProject.billingMethod || null,
                            billingRate: editProject.billingRate || 0,
                            contractValue: editProject.contractValue || 0,
                            allocatedHours: editProject.allocatedHours,
                            hourlyRate: editProject.hourlyRate || 0,
                        },
                    });
                } else {
                    set({ wizardOpen: true, editingProjectId: null, wizardState: initialWizardState });
                }
            },

            closeWizard: () => {
                set({ wizardOpen: false, editingProjectId: null });
            },

            setWizardStep: (step) => {
                set((state) => ({ wizardState: { ...state.wizardState, step } }));
            },

            updateWizardState: (updates) => {
                set((state) => ({ wizardState: { ...state.wizardState, ...updates } }));
            },

            resetWizard: () => {
                set({ wizardState: initialWizardState, editingProjectId: null });
            },

            saveFromWizard: async () => {
                const { wizardState, editingProjectId } = get();

                if (!wizardState.name || !wizardState.type || !wizardState.budgetType) {
                    set({ error: 'Please fill in all required fields' });
                    return null;
                }

                const projectData = {
                    code: wizardState.code || undefined,
                    name: wizardState.name,
                    description: wizardState.description,
                    type: wizardState.type,
                    priority: wizardState.priority,
                    costCenterId: wizardState.costCenterId || undefined,
                    departmentId: wizardState.departmentId || undefined,
                    clientId: wizardState.clientId || undefined,
                    ownerId: wizardState.ownerId || undefined,
                    plannedStartDate: wizardState.plannedStartDate,
                    plannedEndDate: wizardState.plannedEndDate,
                    budgetType: wizardState.budgetType,
                    budgetAmount: wizardState.budgetAmount,
                    currency: wizardState.currency,
                    isBillable: wizardState.isBillable,
                    billingMethod: wizardState.billingMethod || undefined,
                    billingRate: wizardState.billingRate,
                    contractValue: wizardState.contractValue,
                    allocatedHours: wizardState.allocatedHours,
                    hourlyRate: wizardState.hourlyRate,
                };

                let project: Project | null;
                if (editingProjectId) {
                    project = await get().updateProject(editingProjectId, projectData);
                } else {
                    project = await get().createProject(projectData);
                }

                if (project) {
                    set({ wizardOpen: false, wizardState: initialWizardState, editingProjectId: null });
                }
                return project;
            },

            // =================================================================
            // DELETE CONFIRMATION
            // =================================================================

            openDeleteConfirm: (id, type) => {
                set({ deleteConfirmId: id, deleteConfirmType: type });
            },

            closeDeleteConfirm: () => {
                set({ deleteConfirmId: null, deleteConfirmType: null });
            },

            confirmDelete: async () => {
                const { deleteConfirmId, deleteConfirmType } = get();
                if (!deleteConfirmId || !deleteConfirmType) return false;

                switch (deleteConfirmType) {
                    case 'project':
                        return await get().deleteProject(deleteConfirmId);
                    case 'costCenter':
                        return await get().deleteCostCenter(deleteConfirmId);
                    case 'timeEntry':
                        return await get().deleteTimeEntry(deleteConfirmId);
                    case 'chargeback':
                        return await get().deleteChargeback(deleteConfirmId);
                    default:
                        return false;
                }
            },

            // =================================================================
            // ANALYTICS
            // =================================================================

            getProjectSummary: () => {
                const { projects } = get();

                const summary: ProjectSummary = {
                    totalProjects: projects.length,
                    activeProjects: projects.filter((p) => p.status === 'active').length,
                    completedProjects: projects.filter((p) => p.status === 'completed').length,
                    onHoldProjects: projects.filter((p) => p.status === 'on_hold').length,
                    totalBudget: projects.reduce((sum, p) => sum + (p.budgetAmount || 0), 0),
                    totalSpent: projects.reduce((sum, p) => sum + (p.budgetSpent || 0), 0),
                    totalRemaining: projects.reduce((sum, p) => sum + (p.budgetRemaining || 0), 0),
                    totalRevenue: projects.reduce((sum, p) => sum + (p.totalRevenue || 0), 0),
                    totalCosts: projects.reduce((sum, p) => sum + (p.totalCosts || 0), 0),
                    totalProfit: projects.reduce((sum, p) => sum + (p.grossProfit || 0), 0),
                    averageMargin: projects.length > 0
                        ? projects.reduce((sum, p) => sum + (p.grossMargin || 0), 0) / projects.length
                        : 0,
                    overdueProjects: get().getOverdueProjects().length,
                    overBudgetProjects: get().getOverBudgetProjects().length,
                    byType: {
                        internal: projects.filter((p) => p.type === 'internal').length,
                        client: projects.filter((p) => p.type === 'client').length,
                        rd: projects.filter((p) => p.type === 'rd').length,
                        capex: projects.filter((p) => p.type === 'capex').length,
                        opex: projects.filter((p) => p.type === 'opex').length,
                        maintenance: projects.filter((p) => p.type === 'maintenance').length,
                    },
                    byStatus: {
                        planning: projects.filter((p) => p.status === 'planning').length,
                        active: projects.filter((p) => p.status === 'active').length,
                        on_hold: projects.filter((p) => p.status === 'on_hold').length,
                        completed: projects.filter((p) => p.status === 'completed').length,
                        cancelled: projects.filter((p) => p.status === 'cancelled').length,
                        archived: projects.filter((p) => p.status === 'archived').length,
                    },
                };
                return summary;
            },

            getCostCenterSummary: (costCenterId) => {
                const { costCenters, projects, chargebacks } = get();
                const cc = costCenters.find((c) => c.id === costCenterId);
                if (!cc) return null;

                const ccProjects = projects.filter((p) => p.costCenterId === costCenterId);
                const activeProjects = ccProjects.filter((p) => p.status === 'active').length;
                const totalProjectCost = ccProjects.reduce((sum, p) => sum + (p.budgetSpent || 0), 0);

                // Calculate chargebacks
                const chargebacksIn = chargebacks
                    .filter((cb) => cb.toCostCenterId === costCenterId && cb.status === 'approved')
                    .reduce((sum, cb) => sum + cb.amount, 0);
                const chargebacksOut = chargebacks
                    .filter((cb) => cb.fromCostCenterId === costCenterId && cb.status === 'approved')
                    .reduce((sum, cb) => sum + cb.amount, 0);

                return {
                    costCenterId: cc.id,
                    costCenterCode: cc.code,
                    costCenterName: cc.name,
                    annualBudget: cc.annualBudget || 0,
                    ytdBudget: cc.annualBudget || 0, // Simplified - would need period calculation
                    ytdActual: cc.budgetSpent || 0,
                    ytdVariance: (cc.annualBudget || 0) - (cc.budgetSpent || 0),
                    utilizationPercent: cc.budgetUtilization || 0,
                    laborCost: totalProjectCost * 0.6, // Simplified breakdown
                    materialCost: totalProjectCost * 0.2,
                    overheadCost: totalProjectCost * 0.15,
                    otherCost: totalProjectCost * 0.05,
                    chargebacksIn,
                    chargebacksOut,
                    netChargebacks: chargebacksIn - chargebacksOut,
                    activeProjects,
                    totalProjectCost,
                };
            },

            getProjectProfitability: (projectId) => {
                const project = get().projects.find((p) => p.id === projectId);
                if (!project) return null;

                const totalCost = project.totalCosts || 0;
                const budgetVariance = (project.budgetAmount || 0) - (project.budgetSpent || 0);
                const percentComplete = project.percentComplete || 0;
                const plannedValue = (project.budgetAmount || 0) * (percentComplete / 100);
                const earnedValue = plannedValue; // Simplified
                const costPerformanceIndex = totalCost > 0 ? earnedValue / totalCost : 1;
                const schedulePerformanceIndex = plannedValue > 0 ? earnedValue / plannedValue : 1;

                return {
                    projectId: project.id,
                    projectCode: project.code,
                    projectName: project.name,
                    contractValue: project.contractValue || 0,
                    billedRevenue: project.billedAmount || 0,
                    recognizedRevenue: project.totalRevenue || 0,
                    unbilledRevenue: project.unbilledAmount || 0,
                    laborCost: totalCost * 0.6, // Simplified breakdown
                    materialCost: totalCost * 0.2,
                    overheadCost: totalCost * 0.15,
                    otherCost: totalCost * 0.05,
                    totalCost,
                    grossProfit: project.grossProfit || 0,
                    grossMargin: project.grossMargin || 0,
                    netProfit: project.netProfit || 0,
                    netMargin: project.netMargin || 0,
                    budgetVariance,
                    scheduleVariance: 0, // Would need timeline calculation
                    earnedValue,
                    plannedValue,
                    costPerformanceIndex,
                    schedulePerformanceIndex,
                };
            },

            getProjectsByStatus: (status) => {
                return get().projects.filter((p) => p.status === status);
            },

            getProjectsByCostCenter: (costCenterId) => {
                return get().projects.filter((p) => p.costCenterId === costCenterId);
            },

            getOverdueProjects: () => {
                const today = new Date().toISOString().split('T')[0];
                return get().projects.filter(
                    (p) => p.status === 'active' && p.plannedEndDate < today
                );
            },

            getOverBudgetProjects: () => {
                return get().projects.filter(
                    (p) => (p.budgetUtilization || 0) > 100
                );
            },

            getTimeEntriesByProject: (projectId) => {
                return get().timeEntries.filter((t) => t.projectId === projectId);
            },

            getTimeEntriesByUser: (userId) => {
                return get().timeEntries.filter((t) => t.userId === userId);
            },

            getPendingTimeEntries: () => {
                return get().timeEntries.filter((t) => t.status === 'submitted');
            },

            selectProject: (id) => set({ selectedProjectId: id }),
            selectCostCenter: (id) => set({ selectedCostCenterId: id }),

            clearError: () => set({ error: null }),
        }),
        {
            name: 'primebalance-projects',
            partialize: (state) => ({
                selectedProjectId: state.selectedProjectId,
                selectedCostCenterId: state.selectedCostCenterId,
            }),
        }
    )
);