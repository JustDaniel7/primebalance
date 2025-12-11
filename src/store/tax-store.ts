// =============================================================================
// PRIMEBALANCE - TAX MANAGEMENT STORE
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CorporateEntity,
  CorporateStructure,
  EntityType,
  OwnershipStake,
  TaxTransaction,
  TransactionType,
  TaxOptimizationSuggestion,
  TaxNotification,
  TaxNotificationType,
  TaxDashboardState,
} from '@/types/tax';
import {
  analyzeStructureForOptimizations,
  OptimizationContext,
  OptimizationResult,
} from '@/lib/tax-optimization-engine';

// =============================================================================
// TYPES
// =============================================================================

interface TaxStore {
  // Corporate Structures
  structures: CorporateStructure[];
  activeStructureId: string | null;
  
  // Transactions
  taxTransactions: TaxTransaction[];
  
  // Optimization
  optimizationResult: OptimizationResult | null;
  isAnalyzing: boolean;
  
  // Notifications
  notifications: TaxNotification[];
  
  // UI State
  dashboardState: TaxDashboardState;
  
  // Structure Actions
  createStructure: (name: string, parentEntity: Omit<CorporateEntity, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateStructure: (id: string, updates: Partial<CorporateStructure>) => void;
  deleteStructure: (id: string) => void;
  setActiveStructure: (id: string | null) => void;
  
  // Entity Actions
  addEntity: (structureId: string, entity: Omit<CorporateEntity, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateEntity: (structureId: string, entityId: string, updates: Partial<CorporateEntity>) => void;
  deleteEntity: (structureId: string, entityId: string) => void;
  
  // Ownership Actions
  addOwnershipStake: (structureId: string, stake: Omit<OwnershipStake, 'id'>) => void;
  updateOwnershipStake: (structureId: string, stakeId: string, updates: Partial<OwnershipStake>) => void;
  deleteOwnershipStake: (structureId: string, stakeId: string) => void;
  
  // Transaction Actions
  addTaxTransaction: (transaction: Omit<TaxTransaction, 'id' | 'createdAt'>) => void;
  updateTaxTransaction: (id: string, updates: Partial<TaxTransaction>) => void;
  deleteTaxTransaction: (id: string) => void;
  
  // Optimization Actions
  runOptimizationAnalysis: (context: Partial<OptimizationContext>) => void;
  dismissSuggestion: (suggestionId: string) => void;
  
  // Notification Actions
  addNotification: (notification: Omit<TaxNotification, 'id' | 'createdAt' | 'read' | 'dismissed'>) => void;
  markNotificationRead: (id: string) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // UI Actions
  updateDashboardState: (updates: Partial<TaxDashboardState>) => void;
  
  // Getters
  getActiveStructure: () => CorporateStructure | null;
  getEntityById: (structureId: string, entityId: string) => CorporateEntity | null;
  getEntitiesByType: (structureId: string, type: EntityType) => CorporateEntity[];
  getChildEntities: (structureId: string, parentId: string) => CorporateEntity[];
  getUnreadNotificationsCount: () => number;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useTaxStore = create<TaxStore>()(
  persist(
    (set, get) => ({
      // Initial State
      structures: [],
      activeStructureId: null,
      taxTransactions: [],
      optimizationResult: null,
      isAnalyzing: false,
      notifications: [],
      dashboardState: {
        selectedStructureId: null,
        selectedEntityId: null,
        selectedJurisdiction: null,
        viewMode: 'OVERVIEW',
        timeRange: 'YTD',
        filters: {
          entityTypes: [],
          jurisdictionTypes: [],
          transactionTypes: [],
          showIntercompanyOnly: false,
          showOptimizationsOnly: false,
        },
      },

      // Structure Actions
      createStructure: (name, parentEntity) => {
        const structureId = generateId();
        const entityId = generateId();
        const now = new Date().toISOString();

        const newEntity: CorporateEntity = {
          ...parentEntity,
          id: entityId,
          type: EntityType.PARENT,
          parentEntityId: null,
          createdAt: now,
          updatedAt: now,
        };

        const newStructure: CorporateStructure = {
          id: structureId,
          name,
          entities: [newEntity],
          ownershipStakes: [],
          ultimateParentId: entityId,
          createdAt: now,
          updatedAt: now,
        };

        set(state => ({
          structures: [...state.structures, newStructure],
          activeStructureId: structureId,
        }));

        return structureId;
      },

      updateStructure: (id, updates) => {
        set(state => ({
          structures: state.structures.map(s =>
            s.id === id
              ? { ...s, ...updates, updatedAt: new Date().toISOString() }
              : s
          ),
        }));
      },

      deleteStructure: (id) => {
        set(state => ({
          structures: state.structures.filter(s => s.id !== id),
          activeStructureId: state.activeStructureId === id ? null : state.activeStructureId,
        }));
      },

      setActiveStructure: (id) => {
        set({ activeStructureId: id });
      },

      // Entity Actions
      addEntity: (structureId, entity) => {
        const entityId = generateId();
        const now = new Date().toISOString();

        const newEntity: CorporateEntity = {
          ...entity,
          id: entityId,
          createdAt: now,
          updatedAt: now,
        };

        set(state => ({
          structures: state.structures.map(s =>
            s.id === structureId
              ? {
                  ...s,
                  entities: [...s.entities, newEntity],
                  updatedAt: now,
                }
              : s
          ),
        }));

        return entityId;
      },

      updateEntity: (structureId, entityId, updates) => {
        const now = new Date().toISOString();

        set(state => ({
          structures: state.structures.map(s =>
            s.id === structureId
              ? {
                  ...s,
                  entities: s.entities.map(e =>
                    e.id === entityId
                      ? { ...e, ...updates, updatedAt: now }
                      : e
                  ),
                  updatedAt: now,
                }
              : s
          ),
        }));
      },

      deleteEntity: (structureId, entityId) => {
        const now = new Date().toISOString();

        set(state => ({
          structures: state.structures.map(s =>
            s.id === structureId
              ? {
                  ...s,
                  entities: s.entities.filter(e => e.id !== entityId),
                  ownershipStakes: s.ownershipStakes.filter(
                    os => os.parentEntityId !== entityId && os.childEntityId !== entityId
                  ),
                  updatedAt: now,
                }
              : s
          ),
        }));
      },

      // Ownership Actions
      addOwnershipStake: (structureId, stake) => {
        const stakeId = generateId();
        const now = new Date().toISOString();

        const newStake: OwnershipStake = {
          ...stake,
          id: stakeId,
        };

        set(state => ({
          structures: state.structures.map(s =>
            s.id === structureId
              ? {
                  ...s,
                  ownershipStakes: [...s.ownershipStakes, newStake],
                  updatedAt: now,
                }
              : s
          ),
        }));
      },

      updateOwnershipStake: (structureId, stakeId, updates) => {
        const now = new Date().toISOString();

        set(state => ({
          structures: state.structures.map(s =>
            s.id === structureId
              ? {
                  ...s,
                  ownershipStakes: s.ownershipStakes.map(os =>
                    os.id === stakeId ? { ...os, ...updates } : os
                  ),
                  updatedAt: now,
                }
              : s
          ),
        }));
      },

      deleteOwnershipStake: (structureId, stakeId) => {
        const now = new Date().toISOString();

        set(state => ({
          structures: state.structures.map(s =>
            s.id === structureId
              ? {
                  ...s,
                  ownershipStakes: s.ownershipStakes.filter(os => os.id !== stakeId),
                  updatedAt: now,
                }
              : s
          ),
        }));
      },

      // Transaction Actions
      addTaxTransaction: (transaction) => {
        const id = generateId();
        const now = new Date().toISOString();

        const newTransaction: TaxTransaction = {
          ...transaction,
          id,
          createdAt: now,
        };

        set(state => ({
          taxTransactions: [...state.taxTransactions, newTransaction],
        }));
      },

      updateTaxTransaction: (id, updates) => {
        set(state => ({
          taxTransactions: state.taxTransactions.map(t =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteTaxTransaction: (id) => {
        set(state => ({
          taxTransactions: state.taxTransactions.filter(t => t.id !== id),
        }));
      },

      // Optimization Actions
      runOptimizationAnalysis: (partialContext) => {
        const state = get();
        const activeStructure = state.structures.find(s => s.id === state.activeStructureId);

        if (!activeStructure) return;

        set({ isAnalyzing: true });

        // Build full context
        const context: OptimizationContext = {
          structure: activeStructure,
          annualRevenue: partialContext.annualRevenue || 1000000,
          intercompanyTransactions: partialContext.intercompanyTransactions || 
            state.taxTransactions.filter(t => t.isIntercompany),
          dividendFlows: partialContext.dividendFlows || [],
          royaltyFlows: partialContext.royaltyFlows || [],
          currentEffectiveTaxRate: partialContext.currentEffectiveTaxRate || 25,
        };

        // Run analysis
        const result = analyzeStructureForOptimizations(context);

        // Generate notifications for high-priority suggestions
        const newNotifications: TaxNotification[] = result.suggestions
          .filter(s => s.priority === 'HIGH')
          .slice(0, 3) // Limit to top 3
          .map(s => ({
            id: generateId(),
            type: TaxNotificationType.OPTIMIZATION_FOUND,
            title: 'Tax Optimization Opportunity',
            message: `${s.title}: Potential savings of $${(s.estimatedSavingsMin || 0).toLocaleString()} - $${(s.estimatedSavingsMax || 0).toLocaleString()}`,
            priority: 'HIGH' as const,
            category: 'OPTIMIZATION' as const,
            actionRequired: true,
            actionLabel: 'View Details',
            optimizationSuggestionId: s.id,
            read: false,
            dismissed: false,
            createdAt: new Date().toISOString(),
          }));

        set(state => ({
          optimizationResult: result,
          isAnalyzing: false,
          notifications: [...state.notifications, ...newNotifications],
        }));
      },

      dismissSuggestion: (suggestionId) => {
        set(state => ({
          optimizationResult: state.optimizationResult
            ? {
                ...state.optimizationResult,
                suggestions: state.optimizationResult.suggestions.filter(
                  s => s.id !== suggestionId
                ),
              }
            : null,
        }));
      },

      // Notification Actions
      addNotification: (notification) => {
        const id = generateId();
        const now = new Date().toISOString();

        const newNotification: TaxNotification = {
          ...notification,
          id,
          read: false,
          dismissed: false,
          createdAt: now,
        };

        set(state => ({
          notifications: [newNotification, ...state.notifications],
        }));
      },

      markNotificationRead: (id) => {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      dismissNotification: (id) => {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, dismissed: true } : n
          ),
        }));
      },

      clearAllNotifications: () => {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, dismissed: true })),
        }));
      },

      // UI Actions
      updateDashboardState: (updates) => {
        set(state => ({
          dashboardState: { ...state.dashboardState, ...updates },
        }));
      },

      // Getters
      getActiveStructure: () => {
        const state = get();
        return state.structures.find(s => s.id === state.activeStructureId) || null;
      },

      getEntityById: (structureId, entityId) => {
        const structure = get().structures.find(s => s.id === structureId);
        return structure?.entities.find(e => e.id === entityId) || null;
      },

      getEntitiesByType: (structureId, type) => {
        const structure = get().structures.find(s => s.id === structureId);
        return structure?.entities.filter(e => e.type === type) || [];
      },

      getChildEntities: (structureId, parentId) => {
        const structure = get().structures.find(s => s.id === structureId);
        return structure?.entities.filter(e => e.parentEntityId === parentId) || [];
      },

      getUnreadNotificationsCount: () => {
        return get().notifications.filter(n => !n.read && !n.dismissed).length;
      },
    }),
    {
      name: 'primebalance-tax-store',
      partialize: (state) => ({
        structures: state.structures,
        activeStructureId: state.activeStructureId,
        taxTransactions: state.taxTransactions,
        notifications: state.notifications.filter(n => !n.dismissed),
      }),
    }
  )
);

// =============================================================================
// DEMO DATA INITIALIZATION
// =============================================================================

export function initializeDemoTaxData() {
  const store = useTaxStore.getState();
  
  // Only initialize if no structures exist
  if (store.structures.length > 0) return;

  // Create a demo corporate structure
  const structureId = store.createStructure('Acme Global Holdings', {
    name: 'Acme Corp',
    legalName: 'Acme Corporation',
    type: EntityType.PARENT,
    jurisdictionCode: 'US-DE',
    registrationNumber: 'DE-12345678',
    taxId: '12-3456789',
    fiscalYearEnd: '12-31',
    functionalCurrency: 'USD',
    isConsolidated: true,
    isPermanentEstablishment: false,
    status: 'ACTIVE',
  });

  // Add subsidiaries
  store.addEntity(structureId, {
    name: 'Acme Europe',
    legalName: 'Acme Europe GmbH',
    type: EntityType.SUBSIDIARY,
    jurisdictionCode: 'DE',
    parentEntityId: store.getActiveStructure()?.ultimateParentId || null,
    ownershipPercentage: 100,
    fiscalYearEnd: '12-31',
    functionalCurrency: 'EUR',
    isConsolidated: true,
    isPermanentEstablishment: false,
    status: 'ACTIVE',
  });

  store.addEntity(structureId, {
    name: 'Acme Asia',
    legalName: 'Acme Asia Pte. Ltd.',
    type: EntityType.SUBSIDIARY,
    jurisdictionCode: 'SG',
    parentEntityId: store.getActiveStructure()?.ultimateParentId || null,
    ownershipPercentage: 100,
    fiscalYearEnd: '12-31',
    functionalCurrency: 'SGD',
    isConsolidated: true,
    isPermanentEstablishment: false,
    status: 'ACTIVE',
  });

  store.addEntity(structureId, {
    name: 'Acme UK Branch',
    legalName: 'Acme Corporation UK Branch',
    type: EntityType.PERMANENT_ESTABLISHMENT,
    jurisdictionCode: 'GB',
    parentEntityId: store.getActiveStructure()?.ultimateParentId || null,
    fiscalYearEnd: '12-31',
    functionalCurrency: 'GBP',
    isConsolidated: true,
    isPermanentEstablishment: true,
    peOfEntityId: store.getActiveStructure()?.ultimateParentId || undefined,
    status: 'ACTIVE',
  });

  // Add some notifications
  store.addNotification({
    type: TaxNotificationType.FILING_DEADLINE,
    title: 'Upcoming Filing Deadline',
    message: 'US Federal Tax Return (Form 1120) is due in 45 days.',
    priority: 'HIGH',
    category: 'DEADLINE',
    actionRequired: true,
    dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    relatedJurisdiction: 'US-FED',
  });

  store.addNotification({
    type: TaxNotificationType.COMPLIANCE_WARNING,
    title: 'Transfer Pricing Documentation',
    message: 'Annual transfer pricing documentation is due for German subsidiary.',
    priority: 'MEDIUM',
    category: 'COMPLIANCE',
    actionRequired: true,
    relatedJurisdiction: 'DE',
  });
}
