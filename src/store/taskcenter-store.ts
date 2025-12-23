import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    Task,
    Risk,
    TaskStatus,
    TaskPriority,
    RiskStatus,
    RiskSeverity,
    RiskLikelihood,
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
    SavedFilter,
    TaskNotification,
    TaskOwner,
    TaskTag,
    SourceSystem,
    TaskGroupBy,
    RiskGroupBy,
    TaskActivity,
    TaskComment,
    RiskMitigationStep,
} from '@/types/taskcenter';

// =============================================================================
// API MAPPING HELPERS
// =============================================================================

function mapApiToTask(api: any): Task {
    return {
        id: api.id,
        title: api.title,
        description: api.description,
        status: api.status || 'open',
        priority: api.priority || 'medium',
        dueDate: api.dueDate,
        dueTime: api.dueTime,
        createdAt: api.createdAt || new Date().toISOString(),
        updatedAt: api.updatedAt || new Date().toISOString(),
        completedAt: api.completedAt,
        snoozedUntil: api.snoozedUntil,
        ownerId: api.ownerId,
        owner: api.owner,
        assigneeIds: api.assigneeIds || [],
        assignees: api.assignees || [],
        watcherIds: api.watcherIds || [],
        assignmentReason: api.assignmentReason || 'direct_assignment',
        sourceSystem: api.sourceSystem || 'manual',
        sourceEntityId: api.sourceEntityId,
        sourceEntityType: api.sourceEntityType,
        linkedRiskIds: api.linkedRiskIds || [],
        linkedTaskIds: api.linkedTaskIds || [],
        parentTaskId: api.parentTaskId,
        slaDeadline: api.slaDeadline,
        slaBreach: api.slaBreach || false,
        slaWarning: api.slaWarning || false,
        blockedByTaskIds: api.blockedByTaskIds || [],
        blockingTaskIds: api.blockingTaskIds || [],
        isBlocked: api.isBlocked || false,
        tags: api.tags || [],
        attachments: api.attachments || [],
        comments: api.comments || [],
        activities: api.activities || [],
        hasUnreadUpdates: api.hasUnreadUpdates || false,
        hasMentions: api.hasMentions || false,
        metadata: api.metadata,
    };
}

function mapApiToRisk(api: any): Risk {
    return {
        id: api.id,
        title: api.title,
        description: api.description,
        severity: api.severity || 'medium',
        likelihood: api.likelihood || 'possible',
        impactScore: api.impactScore || 0,
        status: api.status || 'identified',
        identifiedAt: api.identifiedAt || new Date().toISOString(),
        targetMitigationDate: api.targetMitigationDate,
        resolvedAt: api.resolvedAt,
        lastUpdatedAt: api.lastUpdatedAt || new Date().toISOString(),
        ownerId: api.ownerId,
        owner: api.owner,
        escalatedTo: api.escalatedTo,
        impactAreas: api.impactAreas || [],
        affectedSystemId: api.affectedSystemId,
        affectedSystemName: api.affectedSystemName,
        affectedProjectId: api.affectedProjectId,
        affectedProjectName: api.affectedProjectName,
        blastRadius: api.blastRadius || 'isolated',
        mitigationPlan: api.mitigationPlan,
        mitigationSteps: api.mitigationSteps || [],
        mitigationProgress: api.mitigationProgress || 0,
        linkedTaskIds: api.linkedTaskIds || [],
        linkedRiskIds: api.linkedRiskIds || [],
        isNewlyEscalated: api.isNewlyEscalated || false,
        isStale: api.isStale || false,
        isMitigationOverdue: api.isMitigationOverdue || false,
        activities: api.activities || [],
        comments: api.comments || [],
        sourceSystem: api.sourceSystem,
        sourceEntityId: api.sourceEntityId,
    };
}

// =============================================================================
// INITIAL STATES
// =============================================================================

const initialTaskFilter: TaskFilter = {};

const initialRiskFilter: RiskFilter = {};

const initialTaskSort: TaskSort = {
    field: 'dueDate',
    order: 'asc',
};

const initialRiskSort: RiskSort = {
    field: 'impactScore',
    order: 'desc',
};

const initialTaskViewPreferences: TaskViewPreferences = {
    density: 'comfortable',
    mode: 'list',
    groupBy: 'dueDate',
    sort: initialTaskSort,
    showCompleted: false,
    showSnoozed: false,
    columnsVisible: ['title', 'status', 'priority', 'dueDate', 'owner', 'tags'],
};

const initialRiskViewPreferences: RiskViewPreferences = {
    density: 'comfortable',
    groupBy: 'severity',
    sort: initialRiskSort,
    showResolved: false,
    columnsVisible: ['title', 'severity', 'likelihood', 'status', 'owner', 'targetMitigationDate'],
};

const initialTaskWizardState: TaskWizardState = {
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

const initialRiskWizardState: RiskWizardState = {
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

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface TaskCenterState {
    // Data
    tasks: Task[];
    risks: Risk[];
    savedFilters: SavedFilter[];
    notifications: TaskNotification[];
    owners: TaskOwner[];
    tags: TaskTag[];
    
    // UI State
    activeTab: 'today' | 'tasks' | 'risks' | 'shortcuts';
    taskFilter: TaskFilter;
    riskFilter: RiskFilter;
    taskViewPreferences: TaskViewPreferences;
    riskViewPreferences: RiskViewPreferences;
    taskWizardState: TaskWizardState;
    riskWizardState: RiskWizardState;
    selectedTaskId: string | null;
    selectedRiskId: string | null;
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;
    
    // API Actions
    fetchTasks: () => Promise<void>;
    fetchRisks: () => Promise<void>;
    
    // Task CRUD
    createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'activities' | 'comments' | 'attachments'>) => Task;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;
    completeTask: (id: string) => void;
    snoozeTask: (id: string, until: string) => void;
    reassignTask: (id: string, assigneeIds: string[]) => void;
    addTaskComment: (taskId: string, content: string, mentions?: string[]) => void;
    
    // Risk CRUD
    createRisk: (risk: Omit<Risk, 'id' | 'identifiedAt' | 'lastUpdatedAt' | 'activities' | 'comments' | 'impactScore'>) => Risk;
    updateRisk: (id: string, updates: Partial<Risk>) => void;
    deleteRisk: (id: string) => void;
    acknowledgeRisk: (id: string) => void;
    escalateRisk: (id: string, escalateTo: string, reason: string) => void;
    updateMitigationStep: (riskId: string, stepId: string, status: RiskMitigationStep['status']) => void;
    addRiskComment: (riskId: string, content: string, mentions?: string[]) => void;
    
    // Filters
    setTaskFilter: (filter: Partial<TaskFilter>) => void;
    resetTaskFilter: () => void;
    setRiskFilter: (filter: Partial<RiskFilter>) => void;
    resetRiskFilter: () => void;
    saveFilter: (name: string, filters: TaskFilter, isShared: boolean) => void;
    deleteFilter: (id: string) => void;
    
    // View Preferences
    setTaskViewPreferences: (prefs: Partial<TaskViewPreferences>) => void;
    setRiskViewPreferences: (prefs: Partial<RiskViewPreferences>) => void;
    
    // Wizard
    openTaskWizard: (editTask?: Task) => void;
    closeTaskWizard: () => void;
    updateTaskWizard: (updates: Partial<TaskWizardState>) => void;
    openRiskWizard: (editRisk?: Risk) => void;
    closeRiskWizard: () => void;
    updateRiskWizard: (updates: Partial<RiskWizardState>) => void;
    
    // Selection
    setSelectedTask: (id: string | null) => void;
    setSelectedRisk: (id: string | null) => void;
    setActiveTab: (tab: 'today' | 'tasks' | 'risks' | 'shortcuts') => void;
    
    // Notifications
    markNotificationRead: (id: string) => void;
    markAllNotificationsRead: () => void;
    
    // Computed
    getFilteredTasks: () => Task[];
    getFilteredRisks: () => Risk[];
    getTaskSummary: () => TaskSummary;
    getRiskSummary: () => RiskSummary;
    getTodayTasks: () => Task[];
    getOverdueTasks: () => Task[];
    getDueSoonTasks: () => Task[];
    getBlockedTasks: () => Task[];
    getCriticalRisks: () => Risk[];
    getStaleRisks: () => Risk[];
    getGroupedTasks: (groupBy: TaskGroupBy) => Record<string, Task[]>;
    getGroupedRisks: (groupBy: RiskGroupBy) => Record<string, Risk[]>;
}

// =============================================================================
// DEMO DATA
// =============================================================================

const demoOwners: TaskOwner[] = [
    { id: 'owner-1', name: 'John Doe', email: 'john@company.com' },
    { id: 'owner-2', name: 'Jane Smith', email: 'jane@company.com' },
    { id: 'owner-3', name: 'Mike Johnson', email: 'mike@company.com' },
];

const demoTags: TaskTag[] = [
    { id: 'tag-1', name: 'Urgent', color: 'red' },
    { id: 'tag-2', name: 'Finance', color: 'green' },
    { id: 'tag-3', name: 'Compliance', color: 'purple' },
    { id: 'tag-4', name: 'Review', color: 'amber' },
];

const generateDemoTasks = (): Task[] => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return [
        {
            id: 'task-1',
            title: 'Review Q4 Invoice Reconciliation',
            description: 'Verify all Q4 invoices are properly reconciled with bank statements',
            status: 'open',
            priority: 'high',
            dueDate: today,
            dueTime: '17:00',
            createdAt: yesterday,
            updatedAt: now.toISOString(),
            ownerId: 'owner-1',
            owner: demoOwners[0],
            assigneeIds: ['owner-1'],
            assignees: [demoOwners[0]],
            watcherIds: ['owner-2'],
            assignmentReason: 'direct_assignment',
            sourceSystem: 'invoices',
            sourceEntityId: 'inv-batch-q4',
            linkedRiskIds: ['risk-1'],
            linkedTaskIds: [],
            slaDeadline: today + 'T18:00:00Z',
            slaBreach: false,
            slaWarning: true,
            blockedByTaskIds: [],
            blockingTaskIds: [],
            isBlocked: false,
            tags: [demoTags[1], demoTags[3]],
            attachments: [],
            comments: [],
            activities: [],
            hasUnreadUpdates: false,
            hasMentions: false,
        },
        {
            id: 'task-2',
            title: 'Approve Vendor Payment Batch',
            description: 'Review and approve pending vendor payments totaling €45,000',
            status: 'awaiting_review',
            priority: 'critical',
            dueDate: today,
            createdAt: yesterday,
            updatedAt: now.toISOString(),
            ownerId: 'owner-2',
            owner: demoOwners[1],
            assigneeIds: ['owner-2'],
            assignees: [demoOwners[1]],
            watcherIds: [],
            assignmentReason: 'rule_based',
            sourceSystem: 'liabilities',
            linkedRiskIds: [],
            linkedTaskIds: [],
            slaBreach: false,
            slaWarning: false,
            blockedByTaskIds: [],
            blockingTaskIds: ['task-3'],
            isBlocked: false,
            tags: [demoTags[0], demoTags[1]],
            attachments: [],
            comments: [],
            activities: [],
            hasUnreadUpdates: true,
            hasMentions: false,
        },
        {
            id: 'task-3',
            title: 'Process Treasury Transfer',
            description: 'Execute inter-entity fund transfer for operational needs',
            status: 'blocked',
            priority: 'high',
            dueDate: tomorrow,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            ownerId: 'owner-1',
            owner: demoOwners[0],
            assigneeIds: ['owner-1'],
            assignees: [demoOwners[0]],
            watcherIds: [],
            assignmentReason: 'direct_assignment',
            sourceSystem: 'treasury',
            linkedRiskIds: [],
            linkedTaskIds: [],
            slaBreach: false,
            slaWarning: false,
            blockedByTaskIds: ['task-2'],
            blockingTaskIds: [],
            isBlocked: true,
            tags: [demoTags[1]],
            attachments: [],
            comments: [],
            activities: [],
            hasUnreadUpdates: false,
            hasMentions: false,
        },
        {
            id: 'task-4',
            title: 'Submit VAT Return',
            description: 'Prepare and submit quarterly VAT return for DE jurisdiction',
            status: 'in_progress',
            priority: 'critical',
            dueDate: yesterday,
            createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: now.toISOString(),
            ownerId: 'owner-3',
            owner: demoOwners[2],
            assigneeIds: ['owner-3'],
            assignees: [demoOwners[2]],
            watcherIds: ['owner-1', 'owner-2'],
            assignmentReason: 'ownership',
            sourceSystem: 'tax',
            linkedRiskIds: ['risk-2'],
            linkedTaskIds: [],
            slaBreach: true,
            slaWarning: false,
            blockedByTaskIds: [],
            blockingTaskIds: [],
            isBlocked: false,
            tags: [demoTags[0], demoTags[2]],
            attachments: [],
            comments: [],
            activities: [],
            hasUnreadUpdates: false,
            hasMentions: true,
        },
        {
            id: 'task-5',
            title: 'Inventory Stocktake Verification',
            description: 'Verify physical inventory counts against system records',
            status: 'open',
            priority: 'medium',
            dueDate: nextWeek,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            ownerId: 'owner-2',
            owner: demoOwners[1],
            assigneeIds: ['owner-2', 'owner-3'],
            assignees: [demoOwners[1], demoOwners[2]],
            watcherIds: [],
            assignmentReason: 'direct_assignment',
            sourceSystem: 'inventory',
            linkedRiskIds: [],
            linkedTaskIds: [],
            slaBreach: false,
            slaWarning: false,
            blockedByTaskIds: [],
            blockingTaskIds: [],
            isBlocked: false,
            tags: [],
            attachments: [],
            comments: [],
            activities: [],
            hasUnreadUpdates: false,
            hasMentions: false,
        },
    ];
};

const generateDemoRisks = (): Risk[] => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return [
        {
            id: 'risk-1',
            title: 'Invoice Processing Delays',
            description: 'Increasing backlog of unprocessed invoices may lead to payment delays and vendor relationship issues',
            severity: 'high',
            likelihood: 'likely',
            impactScore: 16,
            status: 'mitigating',
            identifiedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            targetMitigationDate: nextWeek,
            lastUpdatedAt: now.toISOString(),
            ownerId: 'owner-1',
            owner: demoOwners[0],
            impactAreas: ['Operations', 'Vendor Relations'],
            affectedSystemName: 'Invoicing',
            blastRadius: 'department',
            mitigationPlan: 'Implement automated invoice processing and hire temporary staff',
            mitigationSteps: [
                { id: 'step-1', description: 'Audit current invoice backlog', status: 'completed', completedAt: now.toISOString() },
                { id: 'step-2', description: 'Configure automation rules', status: 'in_progress' },
                { id: 'step-3', description: 'Onboard temporary staff', status: 'pending', deadline: nextWeek },
            ],
            mitigationProgress: 40,
            linkedTaskIds: ['task-1'],
            linkedRiskIds: [],
            isNewlyEscalated: false,
            isStale: false,
            isMitigationOverdue: false,
            activities: [],
            comments: [],
            sourceSystem: 'invoices',
        },
        {
            id: 'risk-2',
            title: 'VAT Compliance Deadline Risk',
            description: 'Potential penalty exposure due to delayed VAT submission',
            severity: 'critical',
            likelihood: 'almost_certain',
            impactScore: 20,
            status: 'escalated',
            identifiedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            targetMitigationDate: new Date().toISOString().split('T')[0],
            lastUpdatedAt: now.toISOString(),
            ownerId: 'owner-3',
            owner: demoOwners[2],
            escalatedTo: 'owner-1',
            impactAreas: ['Compliance', 'Finance'],
            affectedSystemName: 'Tax',
            blastRadius: 'organization',
            mitigationPlan: 'Expedite VAT return preparation with dedicated team',
            mitigationSteps: [
                { id: 'step-1', description: 'Gather all required documents', status: 'completed' },
                { id: 'step-2', description: 'Calculate VAT liability', status: 'in_progress' },
                { id: 'step-3', description: 'Submit return', status: 'pending' },
            ],
            mitigationProgress: 60,
            linkedTaskIds: ['task-4'],
            linkedRiskIds: [],
            isNewlyEscalated: true,
            isStale: false,
            isMitigationOverdue: true,
            activities: [],
            comments: [],
            sourceSystem: 'tax',
        },
        {
            id: 'risk-3',
            title: 'Cash Flow Concentration',
            description: 'Over-reliance on single banking partner for operational funds',
            severity: 'medium',
            likelihood: 'unlikely',
            impactScore: 6,
            status: 'monitoring',
            identifiedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            targetMitigationDate: nextMonth,
            lastUpdatedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            ownerId: 'owner-2',
            owner: demoOwners[1],
            impactAreas: ['Treasury', 'Operations'],
            affectedSystemName: 'Treasury',
            blastRadius: 'organization',
            mitigationPlan: 'Diversify banking relationships and establish backup facilities',
            mitigationSteps: [
                { id: 'step-1', description: 'Identify alternative banking partners', status: 'completed' },
                { id: 'step-2', description: 'Open secondary accounts', status: 'pending', deadline: nextMonth },
            ],
            mitigationProgress: 30,
            linkedTaskIds: [],
            linkedRiskIds: [],
            isNewlyEscalated: false,
            isStale: true,
            isMitigationOverdue: false,
            activities: [],
            comments: [],
            sourceSystem: 'treasury',
        },
    ];
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useTaskStore = create<TaskCenterState>()(
    persist(
        (set, get) => ({
            // Initial data
            tasks: generateDemoTasks(),
            risks: generateDemoRisks(),
            savedFilters: [],
            notifications: [],
            owners: demoOwners,
            tags: demoTags,
            
            // UI State
            activeTab: 'today',
            taskFilter: initialTaskFilter,
            riskFilter: initialRiskFilter,
            taskViewPreferences: initialTaskViewPreferences,
            riskViewPreferences: initialRiskViewPreferences,
            taskWizardState: initialTaskWizardState,
            riskWizardState: initialRiskWizardState,
            selectedTaskId: null,
            selectedRiskId: null,
            isLoading: false,
            error: null,
            isInitialized: true,

            // API Actions
            fetchTasks: async () => {
                set({ isLoading: true, error: null });
                try {
                    const res = await fetch('/api/tasks');
                    if (res.ok) {
                        const data = await res.json();
                        set({ tasks: data.map(mapApiToTask), isInitialized: true });
                    }
                } catch (error) {
                    console.error('Failed to fetch tasks:', error);
                    // Keep demo data on error
                } finally {
                    set({ isLoading: false });
                }
            },

            fetchRisks: async () => {
                set({ isLoading: true, error: null });
                try {
                    const res = await fetch('/api/risks');
                    if (res.ok) {
                        const data = await res.json();
                        set({ risks: data.map(mapApiToRisk), isInitialized: true });
                    }
                } catch (error) {
                    console.error('Failed to fetch risks:', error);
                    // Keep demo data on error
                } finally {
                    set({ isLoading: false });
                }
            },

            // Task CRUD
            createTask: (taskData) => {
                const newTask: Task = {
                    ...taskData,
                    id: `task-${Date.now()}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    activities: [{
                        id: `act-${Date.now()}`,
                        type: 'created',
                        actorId: 'current-user',
                        actorName: 'You',
                        timestamp: new Date().toISOString(),
                    }],
                    comments: [],
                    attachments: [],
                };
                set((state) => ({ tasks: [newTask, ...state.tasks] }));
                return newTask;
            },

            updateTask: (id, updates) => {
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === id
                            ? { ...task, ...updates, updatedAt: new Date().toISOString() }
                            : task
                    ),
                }));
            },

            deleteTask: (id) => {
                set((state) => ({
                    tasks: state.tasks.filter((task) => task.id !== id),
                }));
            },

            completeTask: (id) => {
                const { updateTask } = get();
                updateTask(id, {
                    status: 'completed',
                    completedAt: new Date().toISOString(),
                });
            },

            snoozeTask: (id, until) => {
                const { updateTask } = get();
                updateTask(id, {
                    status: 'snoozed',
                    snoozedUntil: until,
                });
            },

            reassignTask: (id, assigneeIds) => {
                const { updateTask, owners } = get();
                const assignees = owners.filter((o) => assigneeIds.includes(o.id));
                updateTask(id, { assigneeIds, assignees });
            },

            addTaskComment: (taskId, content, mentions) => {
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === taskId
                            ? {
                                ...task,
                                comments: [
                                    ...task.comments,
                                    {
                                        id: `comment-${Date.now()}`,
                                        content,
                                        authorId: 'current-user',
                                        authorName: 'You',
                                        createdAt: new Date().toISOString(),
                                        mentions,
                                    },
                                ],
                                updatedAt: new Date().toISOString(),
                            }
                            : task
                    ),
                }));
            },

            // Risk CRUD
            createRisk: (riskData) => {
                const severityScore: Record<RiskSeverity, number> = { low: 1, medium: 2, high: 3, critical: 4 };
                const likelihoodScore: Record<RiskLikelihood, number> = { rare: 1, unlikely: 2, possible: 3, likely: 4, almost_certain: 5 };
                const impactScore = severityScore[riskData.severity] * likelihoodScore[riskData.likelihood];

                const newRisk: Risk = {
                    ...riskData,
                    id: `risk-${Date.now()}`,
                    identifiedAt: new Date().toISOString(),
                    lastUpdatedAt: new Date().toISOString(),
                    impactScore,
                    activities: [{
                        id: `act-${Date.now()}`,
                        type: 'created',
                        actorId: 'current-user',
                        actorName: 'You',
                        timestamp: new Date().toISOString(),
                    }],
                    comments: [],
                };
                set((state) => ({ risks: [newRisk, ...state.risks] }));
                return newRisk;
            },

            updateRisk: (id, updates) => {
                set((state) => ({
                    risks: state.risks.map((risk) =>
                        risk.id === id
                            ? { ...risk, ...updates, lastUpdatedAt: new Date().toISOString() }
                            : risk
                    ),
                }));
            },

            deleteRisk: (id) => {
                set((state) => ({
                    risks: state.risks.filter((risk) => risk.id !== id),
                }));
            },

            acknowledgeRisk: (id) => {
                const { updateRisk } = get();
                updateRisk(id, { status: 'assessing' });
            },

            escalateRisk: (id, escalatedTo, reason) => {
                const { updateRisk } = get();
                updateRisk(id, {
                    status: 'escalated',
                    escalatedTo,
                    isNewlyEscalated: true,
                });
            },

            updateMitigationStep: (riskId, stepId, status) => {
                set((state) => ({
                    risks: state.risks.map((risk) => {
                        if (risk.id !== riskId) return risk;
                        const updatedSteps = risk.mitigationSteps.map((step) =>
                            step.id === stepId
                                ? { ...step, status, completedAt: status === 'completed' ? new Date().toISOString() : undefined }
                                : step
                        );
                        const completedCount = updatedSteps.filter((s) => s.status === 'completed').length;
                        const progress = Math.round((completedCount / updatedSteps.length) * 100);
                        return {
                            ...risk,
                            mitigationSteps: updatedSteps,
                            mitigationProgress: progress,
                            lastUpdatedAt: new Date().toISOString(),
                        };
                    }),
                }));
            },

            addRiskComment: (riskId, content, mentions) => {
                set((state) => ({
                    risks: state.risks.map((risk) =>
                        risk.id === riskId
                            ? {
                                ...risk,
                                comments: [
                                    ...risk.comments,
                                    {
                                        id: `comment-${Date.now()}`,
                                        content,
                                        authorId: 'current-user',
                                        authorName: 'You',
                                        createdAt: new Date().toISOString(),
                                        mentions,
                                    },
                                ],
                                lastUpdatedAt: new Date().toISOString(),
                            }
                            : risk
                    ),
                }));
            },

            // Filters
            setTaskFilter: (filter) => {
                set((state) => ({
                    taskFilter: { ...state.taskFilter, ...filter },
                }));
            },

            resetTaskFilter: () => {
                set({ taskFilter: initialTaskFilter });
            },

            setRiskFilter: (filter) => {
                set((state) => ({
                    riskFilter: { ...state.riskFilter, ...filter },
                }));
            },

            resetRiskFilter: () => {
                set({ riskFilter: initialRiskFilter });
            },

            saveFilter: (name, filters, isShared) => {
                const newFilter: SavedFilter = {
                    id: `filter-${Date.now()}`,
                    name,
                    filters,
                    isDefault: false,
                    isShared,
                    createdBy: 'current-user',
                    order: get().savedFilters.length,
                };
                set((state) => ({
                    savedFilters: [...state.savedFilters, newFilter],
                }));
            },

            deleteFilter: (id) => {
                set((state) => ({
                    savedFilters: state.savedFilters.filter((f) => f.id !== id),
                }));
            },

            // View Preferences
            setTaskViewPreferences: (prefs) => {
                set((state) => ({
                    taskViewPreferences: { ...state.taskViewPreferences, ...prefs },
                }));
            },

            setRiskViewPreferences: (prefs) => {
                set((state) => ({
                    riskViewPreferences: { ...state.riskViewPreferences, ...prefs },
                }));
            },

            // Wizard
            openTaskWizard: (editTask) => {
                if (editTask) {
                    set({
                        taskWizardState: {
                            step: 1,
                            isOpen: true,
                            editingTaskId: editTask.id,
                            title: editTask.title,
                            description: editTask.description || '',
                            priority: editTask.priority,
                            dueDate: editTask.dueDate,
                            assigneeIds: editTask.assigneeIds,
                            tags: editTask.tags.map((t) => t.id),
                            sourceSystem: editTask.sourceSystem,
                            linkedRiskIds: editTask.linkedRiskIds,
                        },
                    });
                } else {
                    set({ taskWizardState: { ...initialTaskWizardState, isOpen: true } });
                }
            },

            closeTaskWizard: () => {
                set({ taskWizardState: initialTaskWizardState });
            },

            updateTaskWizard: (updates) => {
                set((state) => ({
                    taskWizardState: { ...state.taskWizardState, ...updates },
                }));
            },

            openRiskWizard: (editRisk) => {
                if (editRisk) {
                    set({
                        riskWizardState: {
                            step: 1,
                            isOpen: true,
                            editingRiskId: editRisk.id,
                            title: editRisk.title,
                            description: editRisk.description || '',
                            severity: editRisk.severity,
                            likelihood: editRisk.likelihood,
                            impactAreas: editRisk.impactAreas,
                            targetMitigationDate: editRisk.targetMitigationDate,
                            mitigationPlan: editRisk.mitigationPlan || '',
                            mitigationSteps: editRisk.mitigationSteps,
                        },
                    });
                } else {
                    set({ riskWizardState: { ...initialRiskWizardState, isOpen: true } });
                }
            },

            closeRiskWizard: () => {
                set({ riskWizardState: initialRiskWizardState });
            },

            updateRiskWizard: (updates) => {
                set((state) => ({
                    riskWizardState: { ...state.riskWizardState, ...updates },
                }));
            },

            // Selection
            setSelectedTask: (id) => {
                set({ selectedTaskId: id });
            },

            setSelectedRisk: (id) => {
                set({ selectedRiskId: id });
            },

            setActiveTab: (tab) => {
                set({ activeTab: tab });
            },

            // Notifications
            markNotificationRead: (id) => {
                set((state) => ({
                    notifications: state.notifications.map((n) =>
                        n.id === id ? { ...n, isRead: true } : n
                    ),
                }));
            },

            markAllNotificationsRead: () => {
                set((state) => ({
                    notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
                }));
            },

            // Computed - Filtered Tasks
            getFilteredTasks: () => {
                const { tasks, taskFilter, taskViewPreferences } = get();
                let filtered = [...tasks];

                // Status filter
                if (taskFilter.status?.length) {
                    filtered = filtered.filter((t) => taskFilter.status!.includes(t.status));
                }

                // Priority filter
                if (taskFilter.priority?.length) {
                    filtered = filtered.filter((t) => taskFilter.priority!.includes(t.priority));
                }

                // Source system filter
                if (taskFilter.sourceSystem?.length) {
                    filtered = filtered.filter((t) => taskFilter.sourceSystem!.includes(t.sourceSystem));
                }

                // Owner filter
                if (taskFilter.ownerId?.length) {
                    filtered = filtered.filter((t) => t.ownerId && taskFilter.ownerId!.includes(t.ownerId));
                }

                // Search query
                if (taskFilter.searchQuery) {
                    const query = taskFilter.searchQuery.toLowerCase();
                    filtered = filtered.filter(
                        (t) =>
                            t.title.toLowerCase().includes(query) ||
                            t.description?.toLowerCase().includes(query)
                    );
                }

                // Overdue filter
                if (taskFilter.isOverdue) {
                    const today = new Date().toISOString().split('T')[0];
                    filtered = filtered.filter((t) => t.dueDate && t.dueDate < today && t.status !== 'completed');
                }

                // Blocked filter
                if (taskFilter.isBlocked) {
                    filtered = filtered.filter((t) => t.isBlocked);
                }

                // Hide completed unless shown
                if (!taskViewPreferences.showCompleted) {
                    filtered = filtered.filter((t) => t.status !== 'completed');
                }

                // Hide snoozed unless shown
                if (!taskViewPreferences.showSnoozed) {
                    filtered = filtered.filter((t) => t.status !== 'snoozed');
                }

                // Sort
                const { sort } = taskViewPreferences;
                filtered.sort((a, b) => {
                    let aVal: any, bVal: any;
                    switch (sort.field) {
                        case 'dueDate':
                            aVal = a.dueDate || '9999';
                            bVal = b.dueDate || '9999';
                            break;
                        case 'priority':
                            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                            aVal = priorityOrder[a.priority];
                            bVal = priorityOrder[b.priority];
                            break;
                        case 'createdAt':
                            aVal = a.createdAt;
                            bVal = b.createdAt;
                            break;
                        case 'updatedAt':
                            aVal = a.updatedAt;
                            bVal = b.updatedAt;
                            break;
                        default:
                            aVal = a[sort.field];
                            bVal = b[sort.field];
                    }
                    if (sort.order === 'asc') {
                        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                    }
                    return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
                });

                return filtered;
            },

            // Computed - Filtered Risks
            getFilteredRisks: () => {
                const { risks, riskFilter, riskViewPreferences } = get();
                let filtered = [...risks];

                // Status filter
                if (riskFilter.status?.length) {
                    filtered = filtered.filter((r) => riskFilter.status!.includes(r.status));
                }

                // Severity filter
                if (riskFilter.severity?.length) {
                    filtered = filtered.filter((r) => riskFilter.severity!.includes(r.severity));
                }

                // Owner filter
                if (riskFilter.ownerId?.length) {
                    filtered = filtered.filter((r) => r.ownerId && riskFilter.ownerId!.includes(r.ownerId));
                }

                // Search query
                if (riskFilter.searchQuery) {
                    const query = riskFilter.searchQuery.toLowerCase();
                    filtered = filtered.filter(
                        (r) =>
                            r.title.toLowerCase().includes(query) ||
                            r.description?.toLowerCase().includes(query)
                    );
                }

                // Stale filter
                if (riskFilter.isStale) {
                    filtered = filtered.filter((r) => r.isStale);
                }

                // Mitigation overdue filter
                if (riskFilter.isMitigationOverdue) {
                    filtered = filtered.filter((r) => r.isMitigationOverdue);
                }

                // Newly escalated filter
                if (riskFilter.isNewlyEscalated) {
                    filtered = filtered.filter((r) => r.isNewlyEscalated);
                }

                // Hide resolved unless shown
                if (!riskViewPreferences.showResolved) {
                    filtered = filtered.filter((r) => r.status !== 'resolved');
                }

                // Sort
                const { sort } = riskViewPreferences;
                filtered.sort((a, b) => {
                    let aVal: any, bVal: any;
                    switch (sort.field) {
                        case 'impactScore':
                            aVal = a.impactScore;
                            bVal = b.impactScore;
                            break;
                        case 'severity':
                            const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                            aVal = severityOrder[a.severity];
                            bVal = severityOrder[b.severity];
                            break;
                        case 'targetMitigationDate':
                            aVal = a.targetMitigationDate || '9999';
                            bVal = b.targetMitigationDate || '9999';
                            break;
                        default:
                            aVal = a[sort.field];
                            bVal = b[sort.field];
                    }
                    if (sort.order === 'asc') {
                        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                    }
                    return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
                });

                return filtered;
            },

            // Computed - Summary
            getTaskSummary: (): TaskSummary => {
                const { tasks } = get();
                const today = new Date().toISOString().split('T')[0];
                const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());

                const byStatus: Record<TaskStatus, number> = {
                    open: 0,
                    in_progress: 0,
                    blocked: 0,
                    awaiting_review: 0,
                    completed: 0,
                    cancelled: 0,
                    snoozed: 0,
                };

                const byPriority: Record<TaskPriority, number> = {
                    low: 0,
                    medium: 0,
                    high: 0,
                    critical: 0,
                };

                let dueToday = 0;
                let overdue = 0;
                let dueSoon = 0;
                let blocked = 0;
                let needsReview = 0;
                let slaBreach = 0;
                let completedToday = 0;
                let completedThisWeek = 0;

                tasks.forEach((task) => {
                    byStatus[task.status]++;
                    byPriority[task.priority]++;

                    if (task.dueDate === today && task.status !== 'completed') dueToday++;
                    if (task.dueDate && task.dueDate < today && task.status !== 'completed') overdue++;
                    if (task.dueDate && task.dueDate > today && task.dueDate <= weekFromNow && task.status !== 'completed') dueSoon++;
                    if (task.isBlocked) blocked++;
                    if (task.status === 'awaiting_review') needsReview++;
                    if (task.slaBreach) slaBreach++;
                    if (task.completedAt?.startsWith(today)) completedToday++;
                    if (task.completedAt && task.completedAt >= weekStart.toISOString()) completedThisWeek++;
                });

                return {
                    total: tasks.length,
                    byStatus,
                    byPriority,
                    dueToday,
                    overdue,
                    dueSoon,
                    blocked,
                    needsReview,
                    slaBreach,
                    completedToday,
                    completedThisWeek,
                };
            },

            getRiskSummary: (): RiskSummary => {
                const { risks } = get();

                const byStatus: Record<RiskStatus, number> = {
                    identified: 0,
                    assessing: 0,
                    mitigating: 0,
                    monitoring: 0,
                    resolved: 0,
                    accepted: 0,
                    escalated: 0,
                };

                const bySeverity: Record<RiskSeverity, number> = {
                    low: 0,
                    medium: 0,
                    high: 0,
                    critical: 0,
                };

                let totalImpactScore = 0;

                risks.forEach((risk) => {
                    byStatus[risk.status]++;
                    bySeverity[risk.severity]++;
                    totalImpactScore += risk.impactScore;
                });

                return {
                    total: risks.length,
                    byStatus,
                    bySeverity,
                    criticalCount: bySeverity.critical,
                    highCount: bySeverity.high,
                    newlyEscalated: risks.filter((r) => r.isNewlyEscalated).length,
                    staleCount: risks.filter((r) => r.isStale).length,
                    mitigationOverdue: risks.filter((r) => r.isMitigationOverdue).length,
                    averageImpactScore: risks.length ? Math.round(totalImpactScore / risks.length) : 0,
                };
            },

            // Computed - Quick Access
            getTodayTasks: () => {
                const { tasks } = get();
                const today = new Date().toISOString().split('T')[0];
                return tasks.filter(
                    (t) =>
                        (t.dueDate === today || (t.dueDate && t.dueDate < today)) &&
                        t.status !== 'completed' &&
                        t.status !== 'cancelled'
                );
            },

            getOverdueTasks: () => {
                const { tasks } = get();
                const today = new Date().toISOString().split('T')[0];
                return tasks.filter(
                    (t) => t.dueDate && t.dueDate < today && t.status !== 'completed' && t.status !== 'cancelled'
                );
            },

            getDueSoonTasks: () => {
                const { tasks } = get();
                const today = new Date().toISOString().split('T')[0];
                const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                return tasks.filter(
                    (t) =>
                        t.dueDate &&
                        t.dueDate > today &&
                        t.dueDate <= weekFromNow &&
                        t.status !== 'completed' &&
                        t.status !== 'cancelled'
                );
            },

            getBlockedTasks: () => {
                const { tasks } = get();
                return tasks.filter((t) => t.isBlocked);
            },

            getCriticalRisks: () => {
                const { risks } = get();
                return risks.filter((r) => r.severity === 'critical' && r.status !== 'resolved');
            },

            getStaleRisks: () => {
                const { risks } = get();
                return risks.filter((r) => r.isStale);
            },

            // Computed - Grouping
            getGroupedTasks: (groupBy) => {
                const tasks = get().getFilteredTasks();
                const groups: Record<string, Task[]> = {};

                if (groupBy === 'none') {
                    groups['all'] = tasks;
                    return groups;
                }

                tasks.forEach((task) => {
                    let key: string;
                    switch (groupBy) {
                        case 'dueDate':
                            const today = new Date().toISOString().split('T')[0];
                            if (!task.dueDate) key = 'No Due Date';
                            else if (task.dueDate < today) key = 'Overdue';
                            else if (task.dueDate === today) key = 'Today';
                            else {
                                const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                if (task.dueDate === tomorrow) key = 'Tomorrow';
                                else {
                                    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                    if (task.dueDate <= weekFromNow) key = 'This Week';
                                    else key = 'Later';
                                }
                            }
                            break;
                        case 'priority':
                            key = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
                            break;
                        case 'status':
                            key = task.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                            break;
                        case 'owner':
                            key = task.owner?.name || 'Unassigned';
                            break;
                        case 'sourceSystem':
                            key = task.sourceSystem.charAt(0).toUpperCase() + task.sourceSystem.slice(1);
                            break;
                        default:
                            key = 'Other';
                    }
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(task);
                });

                return groups;
            },

            getGroupedRisks: (groupBy) => {
                const risks = get().getFilteredRisks();
                const groups: Record<string, Risk[]> = {};

                if (groupBy === 'none') {
                    groups['all'] = risks;
                    return groups;
                }

                risks.forEach((risk) => {
                    let key: string;
                    switch (groupBy) {
                        case 'severity':
                            key = risk.severity.charAt(0).toUpperCase() + risk.severity.slice(1);
                            break;
                        case 'status':
                            key = risk.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                            break;
                        case 'owner':
                            key = risk.owner?.name || 'Unassigned';
                            break;
                        case 'impactArea':
                            key = risk.impactAreas[0] || 'Uncategorized';
                            break;
                        case 'affectedSystem':
                            key = risk.affectedSystemName || 'Unknown';
                            break;
                        default:
                            key = 'Other';
                    }
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(risk);
                });

                return groups;
            },
        }),
        {
            name: 'primebalance-task-center',
            partialize: (state) => ({
                taskFilter: state.taskFilter,
                riskFilter: state.riskFilter,
                taskViewPreferences: state.taskViewPreferences,
                riskViewPreferences: state.riskViewPreferences,
                savedFilters: state.savedFilters,
                activeTab: state.activeTab,
            }),
        }
    )
);