// =============================================================================
// PROJECTS / COST CENTERS TYPES
// =============================================================================

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'archived';
export type ProjectType = 'internal' | 'client' | 'rd' | 'capex' | 'opex' | 'maintenance';
export type BudgetType = 'fixed' | 'time_materials' | 'retainer' | 'milestone';
export type AllocationMethod = 'direct' | 'percentage' | 'hours' | 'headcount' | 'revenue' | 'custom';
export type ChargebackStatus = 'pending' | 'approved' | 'rejected' | 'billed' | 'paid';
export type TimeEntryStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'billed';

// =============================================================================
// COST CENTER
// =============================================================================

export interface CostCenter {
    id: string;
    code: string;
    name: string;
    description?: string;

    // Hierarchy
    parentId?: string;
    level: number;
    path: string; // e.g., "CC001/CC001-A/CC001-A-1"

    // Manager
    managerId?: string;
    managerName?: string;

    // Budget
    annualBudget: number;
    budgetSpent: number;
    budgetRemaining: number;
    budgetUtilization: number; // percentage
    currency: string;

    // Allocation
    allocationMethod: AllocationMethod;
    allocationBasis?: string;

    // Status
    isActive: boolean;
    effectiveFrom: string;
    effectiveTo?: string;

    // Meta
    tags?: string[];
    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// PROJECT
// =============================================================================

export interface Project {
    id: string;
    code: string;
    name: string;
    description?: string;

    // Classification
    type: ProjectType;
    status: ProjectStatus;
    priority: 'low' | 'medium' | 'high' | 'critical';

    // Ownership
    ownerId?: string;
    ownerName?: string;
    costCenterId?: string;
    costCenterCode?: string;
    departmentId?: string;
    clientId?: string;
    clientName?: string;

    // Timeline
    plannedStartDate: string;
    plannedEndDate: string;
    actualStartDate?: string;
    actualEndDate?: string;

    // Budget & Financials
    budgetType: BudgetType;
    budgetAmount: number;
    budgetSpent: number;
    budgetRemaining: number;
    budgetVariance: number; // positive = under budget
    budgetUtilization: number; // percentage
    currency: string;

    // Revenue (for client projects)
    contractValue?: number;
    billedAmount?: number;
    collectedAmount?: number;
    unbilledAmount?: number;

    // Profitability
    totalRevenue: number;
    totalCosts: number;
    grossProfit: number;
    grossMargin: number; // percentage
    netProfit: number;
    netMargin: number; // percentage

    // Resources
    allocatedHours: number;
    actualHours: number;
    remainingHours: number;
    hourlyRate?: number;

    // Progress
    percentComplete: number;
    milestoneCount: number;
    milestonesCompleted: number;

    // Billing
    isBillable: boolean;
    billingRate?: number;
    billingMethod?: 'hourly' | 'fixed' | 'milestone' | 'retainer';

    // Meta
    tags?: string[];
    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// PROJECT BUDGET LINE
// =============================================================================

export interface ProjectBudgetLine {
    id: string;
    projectId: string;

    // Category
    category: 'labor' | 'materials' | 'equipment' | 'subcontractor' | 'travel' | 'overhead' | 'other';
    subcategory?: string;
    description: string;

    // Amounts
    budgetAmount: number;
    actualAmount: number;
    variance: number;
    variancePercent: number;

    // Timing
    periodStart?: string;
    periodEnd?: string;

    // Status
    isApproved: boolean;
    approvedBy?: string;
    approvedAt?: string;

    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// COST ATTRIBUTION
// =============================================================================

export interface CostAttribution {
    id: string;

    // Source
    sourceType: 'transaction' | 'invoice' | 'timesheet' | 'manual' | 'allocation';
    sourceId?: string;
    sourceReference?: string;

    // Target
    projectId?: string;
    costCenterId?: string;

    // Cost details
    date: string;
    description: string;
    category: string;
    amount: number;
    currency: string;

    // Allocation
    allocationPercent?: number;
    allocationBasis?: string;

    // Billing
    isBillable: boolean;
    billedAmount?: number;
    billingStatus?: 'unbilled' | 'billed' | 'paid';

    // Approval
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: string;

    // Meta
    notes?: string;
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// TIME ENTRY
// =============================================================================

export interface TimeEntry {
    id: string;

    // User
    userId: string;
    userName?: string;

    // Project/Task
    projectId: string;
    projectCode?: string;
    taskId?: string;
    taskName?: string;
    costCenterId?: string;

    // Time
    date: string;
    hours: number;
    startTime?: string;
    endTime?: string;

    // Description
    description: string;
    category?: string;

    // Billing
    isBillable: boolean;
    hourlyRate?: number;
    billableAmount?: number;

    // Cost
    costRate?: number;
    costAmount?: number;

    // Status
    status: TimeEntryStatus;
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;

    // Meta
    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// RESOURCE ALLOCATION
// =============================================================================

export interface ResourceAllocation {
    id: string;

    // Resource
    userId: string;
    userName?: string;
    role?: string;

    // Project
    projectId: string;
    projectCode?: string;

    // Allocation
    allocationPercent: number; // 0-100
    allocatedHours: number;
    actualHours: number;

    // Period
    startDate: string;
    endDate?: string;

    // Rates
    costRate?: number;
    billRate?: number;

    // Status
    isActive: boolean;

    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// INTERNAL CHARGEBACK
// =============================================================================

export interface InternalChargeback {
    id: string;
    chargebackNumber: string;

    // From/To
    fromCostCenterId: string;
    fromCostCenterCode?: string;
    toCostCenterId: string;
    toCostCenterCode?: string;

    // Project (optional)
    projectId?: string;
    projectCode?: string;

    // Details
    date: string;
    description: string;
    category: string;

    // Amount
    amount: number;
    currency: string;

    // Basis
    allocationMethod: AllocationMethod;
    allocationBasis?: string;
    quantity?: number;
    unitRate?: number;

    // Period
    periodStart: string;
    periodEnd: string;

    // Status
    status: ChargebackStatus;
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;

    // References
    invoiceId?: string;
    journalEntryId?: string;

    // Meta
    notes?: string;
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// PROJECT MILESTONE
// =============================================================================

export interface ProjectMilestone {
    id: string;
    projectId: string;

    name: string;
    description?: string;

    // Timeline
    plannedDate: string;
    actualDate?: string;

    // Status
    status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
    percentComplete: number;

    // Billing (for milestone billing)
    isBillable: boolean;
    billingAmount?: number;
    billedAt?: string;

    // Dependencies
    dependsOn?: string[]; // milestone IDs

    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// ANALYTICS
// =============================================================================

export interface ProjectProfitability {
    projectId: string;
    projectCode: string;
    projectName: string;

    // Revenue
    contractValue: number;
    billedRevenue: number;
    recognizedRevenue: number;
    unbilledRevenue: number;

    // Costs
    laborCost: number;
    materialCost: number;
    overheadCost: number;
    otherCost: number;
    totalCost: number;

    // Profit
    grossProfit: number;
    grossMargin: number;
    netProfit: number;
    netMargin: number;

    // Efficiency
    budgetVariance: number;
    scheduleVariance: number;
    earnedValue: number;
    plannedValue: number;
    costPerformanceIndex: number;
    schedulePerformanceIndex: number;
}

export interface CostCenterSummary {
    costCenterId: string;
    costCenterCode: string;
    costCenterName: string;

    // Budget
    annualBudget: number;
    ytdBudget: number;
    ytdActual: number;
    ytdVariance: number;
    utilizationPercent: number;

    // By Category
    laborCost: number;
    materialCost: number;
    overheadCost: number;
    otherCost: number;

    // Chargebacks
    chargebacksIn: number;
    chargebacksOut: number;
    netChargebacks: number;

    // Projects
    activeProjects: number;
    totalProjectCost: number;
}

export interface ProjectSummary {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    onHoldProjects: number;

    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;

    totalRevenue: number;
    totalCosts: number;
    totalProfit: number;
    averageMargin: number;

    overdueProjects: number;
    overBudgetProjects: number;

    byType: Record<ProjectType, number>;
    byStatus: Record<ProjectStatus, number>;
}

// =============================================================================
// WIZARD STATE
// =============================================================================

export interface ProjectWizardState {
    step: number;

    // Basic Info
    code: string;
    name: string;
    description: string;
    type: ProjectType | null;
    priority: 'low' | 'medium' | 'high' | 'critical';

    // Classification
    costCenterId: string;
    departmentId: string;
    clientId: string;
    ownerId: string;

    // Timeline
    plannedStartDate: string;
    plannedEndDate: string;

    // Budget
    budgetType: BudgetType | null;
    budgetAmount: number;
    currency: string;

    // Billing
    isBillable: boolean;
    billingMethod: 'hourly' | 'fixed' | 'milestone' | 'retainer' | null;
    billingRate: number;
    contractValue: number;

    // Resources
    allocatedHours: number;
    hourlyRate: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const PROJECT_TYPES: { value: ProjectType; label: string; description: string }[] = [
    { value: 'internal', label: 'Internal', description: 'Internal company project' },
    { value: 'client', label: 'Client', description: 'Client-facing billable project' },
    { value: 'rd', label: 'R&D', description: 'Research and development' },
    { value: 'capex', label: 'CapEx', description: 'Capital expenditure project' },
    { value: 'opex', label: 'OpEx', description: 'Operational expenditure' },
    { value: 'maintenance', label: 'Maintenance', description: 'Maintenance and support' },
];

export const PROJECT_STATUSES: { value: ProjectStatus; label: string; color: string }[] = [
    { value: 'planning', label: 'Planning', color: 'gray' },
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'on_hold', label: 'On Hold', color: 'amber' },
    { value: 'completed', label: 'Completed', color: 'blue' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' },
    { value: 'archived', label: 'Archived', color: 'slate' },
];

export const BUDGET_TYPES: { value: BudgetType; label: string }[] = [
    { value: 'fixed', label: 'Fixed Price' },
    { value: 'time_materials', label: 'Time & Materials' },
    { value: 'retainer', label: 'Retainer' },
    { value: 'milestone', label: 'Milestone-Based' },
];

export const COST_CATEGORIES = [
    'labor',
    'materials',
    'equipment',
    'subcontractor',
    'travel',
    'software',
    'overhead',
    'other',
] as const;

export const ALLOCATION_METHODS: { value: AllocationMethod; label: string }[] = [
    { value: 'direct', label: 'Direct Assignment' },
    { value: 'percentage', label: 'Percentage Based' },
    { value: 'hours', label: 'Hours Worked' },
    { value: 'headcount', label: 'Headcount' },
    { value: 'revenue', label: 'Revenue Based' },
    { value: 'custom', label: 'Custom Formula' },
];