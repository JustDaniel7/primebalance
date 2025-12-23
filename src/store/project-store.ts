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
    currency: 'USD',
    isBillable: false,
    billingMethod: null,
    billingRate: 0,
    contractValue: 0,
    allocatedHours: 0,
    hourlyRate: 0,
};

// =============================================================================
// DEMO DATA
// =============================================================================

const generateDemoCostCenters = (): CostCenter[] => [
    {
        id: 'cc-001',
        code: 'CC-ENG',
        name: 'Engineering',
        description: 'Software engineering department',
        level: 1,
        path: 'CC-ENG',
        managerId: 'user-1',
        managerName: 'John Smith',
        annualBudget: 500000,
        budgetSpent: 320000,
        budgetRemaining: 180000,
        budgetUtilization: 64,
        currency: 'USD',
        allocationMethod: 'direct',
        isActive: true,
        effectiveFrom: '2024-01-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'cc-002',
        code: 'CC-SALES',
        name: 'Sales & Marketing',
        description: 'Sales and marketing department',
        level: 1,
        path: 'CC-SALES',
        managerId: 'user-2',
        managerName: 'Jane Doe',
        annualBudget: 300000,
        budgetSpent: 180000,
        budgetRemaining: 120000,
        budgetUtilization: 60,
        currency: 'USD',
        allocationMethod: 'revenue',
        isActive: true,
        effectiveFrom: '2024-01-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'cc-003',
        code: 'CC-OPS',
        name: 'Operations',
        description: 'Operations and support',
        level: 1,
        path: 'CC-OPS',
        annualBudget: 200000,
        budgetSpent: 95000,
        budgetRemaining: 105000,
        budgetUtilization: 47.5,
        currency: 'USD',
        allocationMethod: 'headcount',
        isActive: true,
        effectiveFrom: '2024-01-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

const generateDemoProjects = (): Project[] => [
    {
        id: 'proj-001',
        code: 'PRJ-2024-001',
        name: 'Website Redesign',
        description: 'Complete redesign of company website',
        type: 'client',
        status: 'active',
        priority: 'high',
        ownerId: 'user-1',
        ownerName: 'John Smith',
        costCenterId: 'cc-001',
        costCenterCode: 'CC-ENG',
        clientId: 'client-1',
        clientName: 'Acme Corp',
        plannedStartDate: '2024-01-15',
        plannedEndDate: '2024-06-30',
        actualStartDate: '2024-01-20',
        budgetType: 'fixed',
        budgetAmount: 75000,
        budgetSpent: 48000,
        budgetRemaining: 27000,
        budgetVariance: 27000,
        budgetUtilization: 64,
        currency: 'USD',
        contractValue: 95000,
        billedAmount: 47500,
        collectedAmount: 38000,
        unbilledAmount: 47500,
        totalRevenue: 47500,
        totalCosts: 48000,
        grossProfit: -500,
        grossMargin: -1.05,
        netProfit: -500,
        netMargin: -1.05,
        allocatedHours: 750,
        actualHours: 520,
        remainingHours: 230,
        hourlyRate: 125,
        percentComplete: 65,
        milestoneCount: 5,
        milestonesCompleted: 3,
        isBillable: true,
        billingRate: 150,
        billingMethod: 'milestone',
        tags: ['web', 'design', 'frontend'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'proj-002',
        code: 'PRJ-2024-002',
        name: 'CRM Integration',
        description: 'Integrate CRM with existing systems',
        type: 'internal',
        status: 'active',
        priority: 'medium',
        ownerId: 'user-1',
        ownerName: 'John Smith',
        costCenterId: 'cc-001',
        costCenterCode: 'CC-ENG',
        plannedStartDate: '2024-02-01',
        plannedEndDate: '2024-04-30',
        actualStartDate: '2024-02-05',
        budgetType: 'time_materials',
        budgetAmount: 45000,
        budgetSpent: 32000,
        budgetRemaining: 13000,
        budgetVariance: 13000,
        budgetUtilization: 71.1,
        currency: 'USD',
        totalRevenue: 0,
        totalCosts: 32000,
        grossProfit: -32000,
        grossMargin: 0,
        netProfit: -32000,
        netMargin: 0,
        allocatedHours: 400,
        actualHours: 280,
        remainingHours: 120,
        hourlyRate: 100,
        percentComplete: 70,
        milestoneCount: 3,
        milestonesCompleted: 2,
        isBillable: false,
        tags: ['integration', 'crm', 'backend'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'proj-003',
        code: 'PRJ-2024-003',
        name: 'Mobile App Development',
        description: 'Develop iOS and Android mobile app',
        type: 'client',
        status: 'planning',
        priority: 'high',
        ownerId: 'user-2',
        ownerName: 'Jane Doe',
        costCenterId: 'cc-001',
        costCenterCode: 'CC-ENG',
        clientId: 'client-2',
        clientName: 'TechStart Inc',
        plannedStartDate: '2024-04-01',
        plannedEndDate: '2024-09-30',
        budgetType: 'milestone',
        budgetAmount: 120000,
        budgetSpent: 0,
        budgetRemaining: 120000,
        budgetVariance: 120000,
        budgetUtilization: 0,
        currency: 'USD',
        contractValue: 180000,
        billedAmount: 0,
        collectedAmount: 0,
        unbilledAmount: 0,
        totalRevenue: 0,
        totalCosts: 0,
        grossProfit: 0,
        grossMargin: 0,
        netProfit: 0,
        netMargin: 0,
        allocatedHours: 1200,
        actualHours: 0,
        remainingHours: 1200,
        hourlyRate: 125,
        percentComplete: 0,
        milestoneCount: 6,
        milestonesCompleted: 0,
        isBillable: true,
        billingRate: 175,
        billingMethod: 'milestone',
        tags: ['mobile', 'ios', 'android'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

const generateDemoTimeEntries = (): TimeEntry[] => [
    {
        id: 'time-001',
        userId: 'user-1',
        userName: 'John Smith',
        projectId: 'proj-001',
        projectCode: 'PRJ-2024-001',
        date: new Date().toISOString().split('T')[0],
        hours: 8,
        description: 'Frontend development - homepage redesign',
        category: 'development',
        isBillable: true,
        hourlyRate: 150,
        billableAmount: 1200,
        costRate: 100,
        costAmount: 800,
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'time-002',
        userId: 'user-2',
        userName: 'Jane Doe',
        projectId: 'proj-001',
        projectCode: 'PRJ-2024-001',
        date: new Date().toISOString().split('T')[0],
        hours: 4,
        description: 'Design review and feedback',
        category: 'design',
        isBillable: true,
        hourlyRate: 150,
        billableAmount: 600,
        costRate: 90,
        costAmount: 360,
        status: 'submitted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

const generateDemoChargebacks = (): InternalChargeback[] => [
    {
        id: 'cb-001',
        chargebackNumber: 'CB-2024-001',
        fromCostCenterId: 'cc-001',
        fromCostCenterCode: 'CC-ENG',
        toCostCenterId: 'cc-002',
        toCostCenterCode: 'CC-SALES',
        projectId: 'proj-001',
        projectCode: 'PRJ-2024-001',
        date: new Date().toISOString().split('T')[0],
        description: 'Engineering support for sales demo',
        category: 'labor',
        amount: 2400,
        currency: 'USD',
        allocationMethod: 'hours',
        quantity: 16,
        unitRate: 150,
        periodStart: '2024-03-01',
        periodEnd: '2024-03-31',
        status: 'approved',
        approvedBy: 'user-3',
        approvedAt: new Date().toISOString(),
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

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

    // Selected
    selectedProjectId: string | null;
    selectedCostCenterId: string | null;

    // Projects CRUD
    createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'budgetRemaining' | 'budgetVariance' | 'budgetUtilization' | 'grossProfit' | 'grossMargin' | 'netProfit' | 'netMargin' | 'remainingHours'>) => Project;
    updateProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;
    updateProjectStatus: (id: string, status: ProjectStatus) => void;

    // Cost Centers CRUD
    createCostCenter: (costCenter: Omit<CostCenter, 'id' | 'createdAt' | 'updatedAt' | 'budgetRemaining' | 'budgetUtilization'>) => CostCenter;
    updateCostCenter: (id: string, updates: Partial<CostCenter>) => void;
    deleteCostCenter: (id: string) => void;

    // Time Entries
    createTimeEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt' | 'billableAmount' | 'costAmount'>) => TimeEntry;
    updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => void;
    deleteTimeEntry: (id: string) => void;
    approveTimeEntry: (id: string, approvedBy: string) => void;
    rejectTimeEntry: (id: string, reason: string) => void;
    submitTimeEntry: (id: string) => void;

    // Cost Attribution
    createCostAttribution: (attribution: Omit<CostAttribution, 'id' | 'createdAt' | 'updatedAt'>) => CostAttribution;
    approveCostAttribution: (id: string, approvedBy: string) => void;
    rejectCostAttribution: (id: string) => void;

    // Chargebacks
    createChargeback: (chargeback: Omit<InternalChargeback, 'id' | 'chargebackNumber' | 'createdAt' | 'updatedAt'>) => InternalChargeback;
    approveChargeback: (id: string, approvedBy: string) => void;
    rejectChargeback: (id: string, reason: string) => void;

    // Milestones
    createMilestone: (milestone: Omit<ProjectMilestone, 'id' | 'createdAt' | 'updatedAt'>) => ProjectMilestone;
    updateMilestone: (id: string, updates: Partial<ProjectMilestone>) => void;
    completeMilestone: (id: string) => void;

    // Resource Allocation
    allocateResource: (allocation: Omit<ResourceAllocation, 'id' | 'createdAt' | 'updatedAt' | 'actualHours'>) => ResourceAllocation;
    updateAllocation: (id: string, updates: Partial<ResourceAllocation>) => void;
    removeAllocation: (id: string) => void;

    // Wizard
    openWizard: (editProject?: Project) => void;
    closeWizard: () => void;
    setWizardStep: (step: number) => void;
    updateWizardState: (updates: Partial<ProjectWizardState>) => void;
    resetWizard: () => void;
    saveFromWizard: () => Project | null;

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
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useProjectStore = create<ProjectState>()(
    persist(
        (set, get) => ({
            // Initial Data
            projects: generateDemoProjects(),
            costCenters: generateDemoCostCenters(),
            budgetLines: [],
            costAttributions: [],
            timeEntries: generateDemoTimeEntries(),
            resourceAllocations: [],
            chargebacks: generateDemoChargebacks(),
            milestones: [],

            wizardState: initialWizardState,
            wizardOpen: false,
            selectedProjectId: null,
            selectedCostCenterId: null,

            // =========================================================================
            // PROJECTS CRUD
            // =========================================================================

            createProject: (projectData) => {
                const now = new Date().toISOString();
                const project: Project = {
                    ...projectData,
                    id: `proj-${Date.now()}`,
                    budgetRemaining: projectData.budgetAmount - projectData.budgetSpent,
                    budgetVariance: projectData.budgetAmount - projectData.budgetSpent,
                    budgetUtilization: projectData.budgetAmount > 0
                        ? (projectData.budgetSpent / projectData.budgetAmount) * 100
                        : 0,
                    remainingHours: projectData.allocatedHours - projectData.actualHours,
                    grossProfit: projectData.totalRevenue - projectData.totalCosts,
                    grossMargin: projectData.totalRevenue > 0
                        ? ((projectData.totalRevenue - projectData.totalCosts) / projectData.totalRevenue) * 100
                        : 0,
                    netProfit: projectData.totalRevenue - projectData.totalCosts,
                    netMargin: projectData.totalRevenue > 0
                        ? ((projectData.totalRevenue - projectData.totalCosts) / projectData.totalRevenue) * 100
                        : 0,
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => ({ projects: [...state.projects, project] }));
                return project;
            },

            updateProject: (id, updates) => {
                set((state) => ({
                    projects: state.projects.map((p) => {
                        if (p.id !== id) return p;
                        const updated = { ...p, ...updates, updatedAt: new Date().toISOString() };
                        // Recalculate derived fields
                        updated.budgetRemaining = updated.budgetAmount - updated.budgetSpent;
                        updated.budgetVariance = updated.budgetAmount - updated.budgetSpent;
                        updated.budgetUtilization = updated.budgetAmount > 0
                            ? (updated.budgetSpent / updated.budgetAmount) * 100
                            : 0;
                        updated.remainingHours = updated.allocatedHours - updated.actualHours;
                        updated.grossProfit = updated.totalRevenue - updated.totalCosts;
                        updated.grossMargin = updated.totalRevenue > 0
                            ? ((updated.totalRevenue - updated.totalCosts) / updated.totalRevenue) * 100
                            : 0;
                        return updated;
                    }),
                }));
            },

            deleteProject: (id) => {
                set((state) => ({
                    projects: state.projects.filter((p) => p.id !== id),
                    timeEntries: state.timeEntries.filter((t) => t.projectId !== id),
                    milestones: state.milestones.filter((m) => m.projectId !== id),
                    costAttributions: state.costAttributions.filter((c) => c.projectId !== id),
                }));
            },

            updateProjectStatus: (id, status) => {
                const now = new Date().toISOString();
                set((state) => ({
                    projects: state.projects.map((p) => {
                        if (p.id !== id) return p;
                        const updates: Partial<Project> = { status, updatedAt: now };
                        if (status === 'active' && !p.actualStartDate) {
                            updates.actualStartDate = now.split('T')[0];
                        }
                        if (status === 'completed' && !p.actualEndDate) {
                            updates.actualEndDate = now.split('T')[0];
                            updates.percentComplete = 100;
                        }
                        return { ...p, ...updates };
                    }),
                }));
            },

            // =========================================================================
            // COST CENTERS CRUD
            // =========================================================================

            createCostCenter: (data) => {
                const now = new Date().toISOString();
                const costCenter: CostCenter = {
                    ...data,
                    id: `cc-${Date.now()}`,
                    budgetRemaining: data.annualBudget - data.budgetSpent,
                    budgetUtilization: data.annualBudget > 0
                        ? (data.budgetSpent / data.annualBudget) * 100
                        : 0,
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => ({ costCenters: [...state.costCenters, costCenter] }));
                return costCenter;
            },

            updateCostCenter: (id, updates) => {
                set((state) => ({
                    costCenters: state.costCenters.map((cc) => {
                        if (cc.id !== id) return cc;
                        const updated = { ...cc, ...updates, updatedAt: new Date().toISOString() };
                        updated.budgetRemaining = updated.annualBudget - updated.budgetSpent;
                        updated.budgetUtilization = updated.annualBudget > 0
                            ? (updated.budgetSpent / updated.annualBudget) * 100
                            : 0;
                        return updated;
                    }),
                }));
            },

            deleteCostCenter: (id) => {
                set((state) => ({
                    costCenters: state.costCenters.filter((cc) => cc.id !== id),
                }));
            },

            // =========================================================================
            // TIME ENTRIES
            // =========================================================================

            createTimeEntry: (data) => {
                const now = new Date().toISOString();
                const entry: TimeEntry = {
                    ...data,
                    id: `time-${Date.now()}`,
                    billableAmount: data.isBillable && data.hourlyRate
                        ? data.hours * data.hourlyRate
                        : 0,
                    costAmount: data.costRate ? data.hours * data.costRate : 0,
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => ({ timeEntries: [...state.timeEntries, entry] }));

                // Update project actual hours
                get().updateProject(data.projectId, {
                    actualHours: get().projects.find((p) => p.id === data.projectId)?.actualHours || 0 + data.hours,
                });

                return entry;
            },

            updateTimeEntry: (id, updates) => {
                set((state) => ({
                    timeEntries: state.timeEntries.map((t) => {
                        if (t.id !== id) return t;
                        const updated = { ...t, ...updates, updatedAt: new Date().toISOString() };
                        updated.billableAmount = updated.isBillable && updated.hourlyRate
                            ? updated.hours * updated.hourlyRate
                            : 0;
                        updated.costAmount = updated.costRate ? updated.hours * updated.costRate : 0;
                        return updated;
                    }),
                }));
            },

            deleteTimeEntry: (id) => {
                set((state) => ({
                    timeEntries: state.timeEntries.filter((t) => t.id !== id),
                }));
            },

            approveTimeEntry: (id, approvedBy) => {
                set((state) => ({
                    timeEntries: state.timeEntries.map((t) =>
                        t.id === id
                            ? { ...t, status: 'approved' as TimeEntryStatus, approvedBy, approvedAt: new Date().toISOString() }
                            : t
                    ),
                }));
            },

            rejectTimeEntry: (id, reason) => {
                set((state) => ({
                    timeEntries: state.timeEntries.map((t) =>
                        t.id === id
                            ? { ...t, status: 'rejected' as TimeEntryStatus, rejectionReason: reason }
                            : t
                    ),
                }));
            },

            submitTimeEntry: (id) => {
                set((state) => ({
                    timeEntries: state.timeEntries.map((t) =>
                        t.id === id ? { ...t, status: 'submitted' as TimeEntryStatus } : t
                    ),
                }));
            },

            // =========================================================================
            // COST ATTRIBUTION
            // =========================================================================

            createCostAttribution: (data) => {
                const now = new Date().toISOString();
                const attribution: CostAttribution = {
                    ...data,
                    id: `cost-${Date.now()}`,
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => ({ costAttributions: [...state.costAttributions, attribution] }));
                return attribution;
            },

            approveCostAttribution: (id, approvedBy) => {
                set((state) => ({
                    costAttributions: state.costAttributions.map((c) =>
                        c.id === id
                            ? { ...c, status: 'approved', approvedBy, approvedAt: new Date().toISOString() }
                            : c
                    ),
                }));
            },

            rejectCostAttribution: (id) => {
                set((state) => ({
                    costAttributions: state.costAttributions.map((c) =>
                        c.id === id ? { ...c, status: 'rejected' } : c
                    ),
                }));
            },

            // =========================================================================
            // CHARGEBACKS
            // =========================================================================

            createChargeback: (data) => {
                const now = new Date().toISOString();
                const count = get().chargebacks.length + 1;
                const chargeback: InternalChargeback = {
                    ...data,
                    id: `cb-${Date.now()}`,
                    chargebackNumber: `CB-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`,
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => ({ chargebacks: [...state.chargebacks, chargeback] }));
                return chargeback;
            },

            approveChargeback: (id, approvedBy) => {
                set((state) => ({
                    chargebacks: state.chargebacks.map((c) =>
                        c.id === id
                            ? { ...c, status: 'approved' as ChargebackStatus, approvedBy, approvedAt: new Date().toISOString() }
                            : c
                    ),
                }));
            },

            rejectChargeback: (id, reason) => {
                set((state) => ({
                    chargebacks: state.chargebacks.map((c) =>
                        c.id === id
                            ? { ...c, status: 'rejected' as ChargebackStatus, rejectionReason: reason }
                            : c
                    ),
                }));
            },

            // =========================================================================
            // MILESTONES
            // =========================================================================

            createMilestone: (data) => {
                const now = new Date().toISOString();
                const milestone: ProjectMilestone = {
                    ...data,
                    id: `ms-${Date.now()}`,
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => ({ milestones: [...state.milestones, milestone] }));

                // Update project milestone count
                const project = get().projects.find((p) => p.id === data.projectId);
                if (project) {
                    get().updateProject(data.projectId, {
                        milestoneCount: project.milestoneCount + 1,
                    });
                }

                return milestone;
            },

            updateMilestone: (id, updates) => {
                set((state) => ({
                    milestones: state.milestones.map((m) =>
                        m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
                    ),
                }));
            },

            completeMilestone: (id) => {
                const milestone = get().milestones.find((m) => m.id === id);
                if (!milestone) return;

                set((state) => ({
                    milestones: state.milestones.map((m) =>
                        m.id === id
                            ? { ...m, status: 'completed', percentComplete: 100, actualDate: new Date().toISOString().split('T')[0] }
                            : m
                    ),
                }));

                // Update project milestones completed
                const project = get().projects.find((p) => p.id === milestone.projectId);
                if (project) {
                    get().updateProject(milestone.projectId, {
                        milestonesCompleted: project.milestonesCompleted + 1,
                    });
                }
            },

            // =========================================================================
            // RESOURCE ALLOCATION
            // =========================================================================

            allocateResource: (data) => {
                const now = new Date().toISOString();
                const allocation: ResourceAllocation = {
                    ...data,
                    id: `alloc-${Date.now()}`,
                    actualHours: 0,
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => ({ resourceAllocations: [...state.resourceAllocations, allocation] }));
                return allocation;
            },

            updateAllocation: (id, updates) => {
                set((state) => ({
                    resourceAllocations: state.resourceAllocations.map((a) =>
                        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
                    ),
                }));
            },

            removeAllocation: (id) => {
                set((state) => ({
                    resourceAllocations: state.resourceAllocations.filter((a) => a.id !== id),
                }));
            },

            // =========================================================================
            // WIZARD
            // =========================================================================

            openWizard: (editProject) => {
                if (editProject) {
                    set({
                        wizardOpen: true,
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
                    set({ wizardOpen: true, wizardState: initialWizardState });
                }
            },

            closeWizard: () => {
                set({ wizardOpen: false });
            },

            setWizardStep: (step) => {
                set((state) => ({ wizardState: { ...state.wizardState, step } }));
            },

            updateWizardState: (updates) => {
                set((state) => ({ wizardState: { ...state.wizardState, ...updates } }));
            },

            resetWizard: () => {
                set({ wizardState: initialWizardState });
            },

            saveFromWizard: () => {
                const { wizardState } = get();

                if (!wizardState.name || !wizardState.type || !wizardState.budgetType) {
                    return null;
                }

                const project = get().createProject({
                    code: wizardState.code || `PRJ-${Date.now()}`,
                    name: wizardState.name,
                    description: wizardState.description,
                    type: wizardState.type,
                    status: 'planning',
                    priority: wizardState.priority,
                    ownerId: wizardState.ownerId,
                    costCenterId: wizardState.costCenterId,
                    departmentId: wizardState.departmentId,
                    clientId: wizardState.clientId,
                    plannedStartDate: wizardState.plannedStartDate,
                    plannedEndDate: wizardState.plannedEndDate,
                    budgetType: wizardState.budgetType,
                    budgetAmount: wizardState.budgetAmount,
                    budgetSpent: 0,
                    currency: wizardState.currency,
                    contractValue: wizardState.contractValue,
                    billedAmount: 0,
                    collectedAmount: 0,
                    unbilledAmount: 0,
                    totalRevenue: 0,
                    totalCosts: 0,
                    allocatedHours: wizardState.allocatedHours,
                    actualHours: 0,
                    hourlyRate: wizardState.hourlyRate,
                    percentComplete: 0,
                    milestoneCount: 0,
                    milestonesCompleted: 0,
                    isBillable: wizardState.isBillable,
                    billingRate: wizardState.billingRate,
                    billingMethod: wizardState.billingMethod || undefined,
                    tags: [],
                });

                set({ wizardOpen: false, wizardState: initialWizardState });
                return project;
            },

            // =========================================================================
            // ANALYTICS
            // =========================================================================

            getProjectSummary: () => {
                const { projects } = get();

                const summary: ProjectSummary = {
                    totalProjects: projects.length,
                    activeProjects: projects.filter((p) => p.status === 'active').length,
                    completedProjects: projects.filter((p) => p.status === 'completed').length,
                    onHoldProjects: projects.filter((p) => p.status === 'on_hold').length,
                    totalBudget: projects.reduce((sum, p) => sum + p.budgetAmount, 0),
                    totalSpent: projects.reduce((sum, p) => sum + p.budgetSpent, 0),
                    totalRemaining: projects.reduce((sum, p) => sum + p.budgetRemaining, 0),
                    totalRevenue: projects.reduce((sum, p) => sum + p.totalRevenue, 0),
                    totalCosts: projects.reduce((sum, p) => sum + p.totalCosts, 0),
                    totalProfit: projects.reduce((sum, p) => sum + p.grossProfit, 0),
                    averageMargin: projects.length > 0
                        ? projects.reduce((sum, p) => sum + p.grossMargin, 0) / projects.length
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
                const costCenter = get().costCenters.find((cc) => cc.id === costCenterId);
                if (!costCenter) return null;

                const projects = get().getProjectsByCostCenter(costCenterId);
                const chargebacksIn = get().chargebacks
                    .filter((c) => c.toCostCenterId === costCenterId && c.status === 'approved')
                    .reduce((sum, c) => sum + c.amount, 0);
                const chargebacksOut = get().chargebacks
                    .filter((c) => c.fromCostCenterId === costCenterId && c.status === 'approved')
                    .reduce((sum, c) => sum + c.amount, 0);

                return {
                    costCenterId,
                    costCenterCode: costCenter.code,
                    costCenterName: costCenter.name,
                    annualBudget: costCenter.annualBudget,
                    ytdBudget: costCenter.annualBudget * (new Date().getMonth() + 1) / 12,
                    ytdActual: costCenter.budgetSpent,
                    ytdVariance: (costCenter.annualBudget * (new Date().getMonth() + 1) / 12) - costCenter.budgetSpent,
                    utilizationPercent: costCenter.budgetUtilization,
                    laborCost: projects.reduce((sum, p) => sum + p.totalCosts * 0.7, 0), // estimate
                    materialCost: projects.reduce((sum, p) => sum + p.totalCosts * 0.2, 0),
                    overheadCost: projects.reduce((sum, p) => sum + p.totalCosts * 0.1, 0),
                    otherCost: 0,
                    chargebacksIn,
                    chargebacksOut,
                    netChargebacks: chargebacksIn - chargebacksOut,
                    activeProjects: projects.filter((p) => p.status === 'active').length,
                    totalProjectCost: projects.reduce((sum, p) => sum + p.totalCosts, 0),
                };
            },

            getProjectProfitability: (projectId) => {
                const project = get().projects.find((p) => p.id === projectId);
                if (!project) return null;

                return {
                    projectId,
                    projectCode: project.code,
                    projectName: project.name,
                    contractValue: project.contractValue || 0,
                    billedRevenue: project.billedAmount || 0,
                    recognizedRevenue: project.totalRevenue,
                    unbilledRevenue: project.unbilledAmount || 0,
                    laborCost: project.totalCosts * 0.7,
                    materialCost: project.totalCosts * 0.2,
                    overheadCost: project.totalCosts * 0.1,
                    otherCost: 0,
                    totalCost: project.totalCosts,
                    grossProfit: project.grossProfit,
                    grossMargin: project.grossMargin,
                    netProfit: project.netProfit,
                    netMargin: project.netMargin,
                    budgetVariance: project.budgetVariance,
                    scheduleVariance: 0, // would need more data
                    earnedValue: project.budgetAmount * (project.percentComplete / 100),
                    plannedValue: project.budgetAmount,
                    costPerformanceIndex: project.budgetSpent > 0
                        ? (project.budgetAmount * (project.percentComplete / 100)) / project.budgetSpent
                        : 1,
                    schedulePerformanceIndex: 1,
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
                return get().projects.filter((p) => p.budgetVariance < 0);
            },

            // =========================================================================
            // TIME TRACKING
            // =========================================================================

            getTimeEntriesByProject: (projectId) => {
                return get().timeEntries.filter((t) => t.projectId === projectId);
            },

            getTimeEntriesByUser: (userId) => {
                return get().timeEntries.filter((t) => t.userId === userId);
            },

            getPendingTimeEntries: () => {
                return get().timeEntries.filter((t) => t.status === 'submitted');
            },

            // =========================================================================
            // SELECTION
            // =========================================================================

            selectProject: (id) => set({ selectedProjectId: id }),
            selectCostCenter: (id) => set({ selectedCostCenterId: id }),
        }),
        {
            name: 'primebalance-projects',
            partialize: (state) => ({
                projects: state.projects,
                costCenters: state.costCenters,
                timeEntries: state.timeEntries,
                chargebacks: state.chargebacks,
                milestones: state.milestones,
                resourceAllocations: state.resourceAllocations,
            }),
        }
    )
);