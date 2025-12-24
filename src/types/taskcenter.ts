// =============================================================================
// TASK CENTER TYPES - PrimeBalance Finance OS
// =============================================================================

// Priority & Severity
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RiskLikelihood = 'rare' | 'unlikely' | 'possible' | 'likely' | 'almost_certain';

// Task Status
export type TaskStatus = 
    | 'open'
    | 'in_progress'
    | 'blocked'
    | 'awaiting_review'
    | 'completed'
    | 'cancelled'
    | 'snoozed';

// Risk Status
export type RiskStatus = 
    | 'identified'
    | 'assessing'
    | 'mitigating'
    | 'monitoring'
    | 'resolved'
    | 'accepted'
    | 'escalated';

// Source Systems
export type SourceSystem = 
    | 'invoices'
    | 'orders'
    | 'receivables'
    | 'liabilities'
    | 'treasury'
    | 'inventory'
    | 'assets'
    | 'tax'
    | 'manual';

// Assignment Reason
export type AssignmentReason = 
    | 'direct_assignment'
    | 'rule_based'
    | 'escalation'
    | 'subscription'
    | 'ownership';

// =============================================================================
// CORE ENTITIES
// =============================================================================

export interface TaskOwner {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
}

export interface TaskTag {
    id: string;
    name: string;
    color: string;
}

export interface TaskAttachment {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: string;
    uploadedBy: string;
}

export interface TaskComment {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    createdAt: string;
    updatedAt?: string;
    mentions?: string[];
    reactions?: Record<string, string[]>;
    parentId?: string; // For threading
}

export interface TaskActivity {
    id: string;
    type: 'created' | 'updated' | 'status_changed' | 'assigned' | 'commented' | 'attachment_added' | 'escalated' | 'snoozed';
    actorId: string;
    actorName: string;
    timestamp: string;
    details?: Record<string, any>;
    previousValue?: string;
    newValue?: string;
}

// =============================================================================
// TASK ENTITY
// =============================================================================

export interface Task {
    id: string;
    title: string;
    description?: string;
    
    // Status & Priority
    status: TaskStatus;
    priority: TaskPriority;
    
    // Dates
    dueDate?: string;
    dueTime?: string; // For working hours awareness
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    snoozedUntil?: string;
    
    // Assignment
    ownerId?: string;
    ownerName?: string;
    owner?: TaskOwner;
    assigneeIds: string[];
    assignees?: TaskOwner[];
    watcherIds: string[];
    assignmentReason: AssignmentReason;
    
    // Source & Relations
    sourceSystem: SourceSystem;
    sourceEntityId?: string;
    sourceEntityType?: string;
    linkedRiskIds: string[];
    linkedTaskIds: string[];
    parentTaskId?: string;
    
    // SLA
    slaDeadline?: string;
    slaBreach: boolean;
    slaWarning: boolean;
    
    // Dependencies
    blockedByTaskIds: string[];
    blockingTaskIds: string[];
    isBlocked: boolean;
    
    // Meta
    tags: TaskTag[];
    attachments: TaskAttachment[];
    comments: TaskComment[];
    activities: TaskActivity[];
    
    // Flags
    hasUnreadUpdates: boolean;
    hasMentions: boolean;
    
    // Custom fields
    metadata?: Record<string, any>;
}

// =============================================================================
// RISK ENTITY
// =============================================================================

export interface RiskMitigationStep {
    id: string;
    description: string;
    ownerId?: string;
    ownerName?: string;
    deadline?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    completedAt?: string;
}

export interface Risk {
    id: string;
    title: string;
    description?: string;
    
    // Classification
    severity: RiskSeverity;
    likelihood: RiskLikelihood;
    impactScore: number; // 1-25 (severity * likelihood)
    
    // Status
    status: RiskStatus;
    
    // Dates
    identifiedAt: string;
    targetMitigationDate?: string;
    resolvedAt?: string;
    lastUpdatedAt: string;
    
    // Ownership
    ownerId?: string;
    ownerName?: string;
    owner?: TaskOwner;
    escalatedTo?: string;
    
    // Impact
    impactAreas: string[];
    affectedSystemId?: string;
    affectedSystemName?: string;
    affectedProjectId?: string;
    affectedProjectName?: string;
    blastRadius: 'isolated' | 'team' | 'department' | 'organization';
    
    // Mitigation
    mitigationPlan?: string;
    mitigationSteps: RiskMitigationStep[];
    mitigationProgress: number; // 0-100
    
    // Relations
    linkedTaskIds: string[];
    linkedRiskIds: string[];
    
    // Flags
    isNewlyEscalated: boolean;
    isStale: boolean; // No update in X days
    isMitigationOverdue: boolean;
    
    // Audit
    activities: TaskActivity[];
    comments: TaskComment[];
    
    // Source
    sourceSystem?: SourceSystem;
    sourceEntityId?: string;
}

// =============================================================================
// QUICK NAVIGATION
// =============================================================================

export interface SavedFilter {
    id: string;
    name: string;
    icon?: string;
    filters: TaskFilter;
    isDefault: boolean;
    isShared: boolean;
    createdBy: string;
    order: number;
}

export interface QuickAction {
    id: string;
    name: string;
    icon: string;
    href?: string;
    action?: string;
    order: number;
}

// =============================================================================
// FILTERS & SORTING
// =============================================================================

export interface TaskFilter {
    status?: TaskStatus[];
    priority?: TaskPriority[];
    ownerId?: string[];
    assigneeId?: string[];
    sourceSystem?: SourceSystem[];
    tags?: string[];
    dueDateFrom?: string;
    dueDateTo?: string;
    isOverdue?: boolean;
    isBlocked?: boolean;
    hasAttachments?: boolean;
    slaBreach?: boolean;
    searchQuery?: string;
}

export interface RiskFilter {
    status?: RiskStatus[];
    severity?: RiskSeverity[];
    likelihood?: RiskLikelihood[];
    ownerId?: string[];
    impactArea?: string[];
    affectedSystem?: string[];
    isStale?: boolean;
    isMitigationOverdue?: boolean;
    isNewlyEscalated?: boolean;
    searchQuery?: string;
}

export type TaskSortField = 'dueDate' | 'priority' | 'status' | 'createdAt' | 'updatedAt' | 'slaDeadline';
export type RiskSortField = 'severity' | 'impactScore' | 'targetMitigationDate' | 'identifiedAt' | 'lastUpdatedAt';
export type SortOrder = 'asc' | 'desc';

export interface TaskSort {
    field: TaskSortField;
    order: SortOrder;
}

export interface RiskSort {
    field: RiskSortField;
    order: SortOrder;
}

// =============================================================================
// GROUPING
// =============================================================================

export type TaskGroupBy = 'dueDate' | 'priority' | 'status' | 'owner' | 'sourceSystem' | 'none';
export type RiskGroupBy = 'severity' | 'status' | 'owner' | 'impactArea' | 'affectedSystem' | 'none';

// =============================================================================
// SUMMARY & STATS
// =============================================================================

export interface TaskSummary {
    total: number;
    byStatus: Record<TaskStatus, number>;
    byPriority: Record<TaskPriority, number>;
    dueToday: number;
    overdue: number;
    dueSoon: number; // Next 7 days
    blocked: number;
    needsReview: number;
    slaBreach: number;
    completedToday: number;
    completedThisWeek: number;
}

export interface RiskSummary {
    total: number;
    byStatus: Record<RiskStatus, number>;
    bySeverity: Record<RiskSeverity, number>;
    criticalCount: number;
    highCount: number;
    newlyEscalated: number;
    staleCount: number;
    mitigationOverdue: number;
    averageImpactScore: number;
}

// =============================================================================
// NOTIFICATIONS
// =============================================================================

export type NotificationType = 
    | 'assignment'
    | 'mention'
    | 'escalation'
    | 'sla_breach'
    | 'comment'
    | 'status_change'
    | 'due_soon'
    | 'overdue';

export interface TaskNotification {
    id: string;
    type: NotificationType;
    taskId?: string;
    riskId?: string;
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
    actorId?: string;
    actorName?: string;
}

// =============================================================================
// WIZARD STATE
// =============================================================================

export interface TaskWizardState {
    step: number;
    isOpen: boolean;
    editingTaskId?: string;
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate?: string;
    assigneeIds: string[];
    tags: string[];
    sourceSystem: SourceSystem;
    linkedRiskIds: string[];
}

export interface RiskWizardState {
    step: number;
    isOpen: boolean;
    editingRiskId?: string;
    title: string;
    description: string;
    severity: RiskSeverity;
    likelihood: RiskLikelihood;
    impactAreas: string[];
    targetMitigationDate?: string;
    mitigationPlan: string;
    mitigationSteps: Omit<RiskMitigationStep, 'id'>[];
}

// =============================================================================
// VIEW PREFERENCES
// =============================================================================

export type ViewDensity = 'compact' | 'comfortable' | 'spacious';
export type ViewMode = 'list' | 'board' | 'calendar';

export interface TaskViewPreferences {
    density: ViewDensity;
    mode: ViewMode;
    groupBy: TaskGroupBy;
    sort: TaskSort;
    showCompleted: boolean;
    showSnoozed: boolean;
    columnsVisible: string[];
}

export interface RiskViewPreferences {
    density: ViewDensity;
    groupBy: RiskGroupBy;
    sort: RiskSort;
    showResolved: boolean;
    columnsVisible: string[];
}