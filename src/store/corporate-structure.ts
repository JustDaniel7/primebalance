import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  CorporateEntity, 
  PermanentEstablishment, 
  TaxTransaction,
  TaxOptimizationSuggestion,
  TaxNotification,
  TaxCalculation,
} from '@/types/tax';
import { EntityType, TransactionType } from '@/types/tax';
import { 
  getJurisdiction, 
  calculateWithholdingTax,
} from '@/data/jurisdictions';

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface CorporateStructureState {
  // Entities
  entities: CorporateEntity[];
  permanentEstablishments: PermanentEstablishment[];
  
  // Transactions
  intercompanyTransactions: TaxTransaction[];
  
  // Optimizations
  optimizationSuggestions: TaxOptimizationSuggestion[];
  
  // Notifications
  taxNotifications: TaxNotification[];
  
  // Calculations
  taxCalculations: TaxCalculation[];
  
  // Entity CRUD
  addEntity: (entity: Omit<CorporateEntity, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateEntity: (id: string, updates: Partial<CorporateEntity>) => void;
  deleteEntity: (id: string) => void;
  getEntity: (id: string) => CorporateEntity | undefined;
  getChildEntities: (parentId: string) => CorporateEntity[];
  getRootEntities: () => CorporateEntity[];
  getEntityHierarchy: (entityId: string) => CorporateEntity[];
  
  // PE CRUD
  addPE: (pe: Omit<PermanentEstablishment, 'id'>) => string;
  updatePE: (id: string, updates: Partial<PermanentEstablishment>) => void;
  deletePE: (id: string) => void;
  getPEsForEntity: (entityId: string) => PermanentEstablishment[];
  
  // Intercompany Transactions
  addIntercompanyTransaction: (tx: Omit<TaxTransaction, 'id' | 'createdAt'>) => string;
  updateIntercompanyTransaction: (id: string, updates: Partial<TaxTransaction>) => void;
  deleteIntercompanyTransaction: (id: string) => void;
  getTransactionsBetweenEntities: (entity1Id: string, entity2Id: string) => TaxTransaction[];
  
  // Optimizations
  generateOptimizationSuggestions: () => void;
  updateOptimizationStatus: (id: string, status: TaxOptimizationSuggestion['status']) => void;
  dismissOptimization: (id: string) => void;
  
  // Notifications
  addNotification: (notification: Omit<TaxNotification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  dismissNotification: (id: string) => void;
  getUnreadNotifications: () => TaxNotification[];
  
  // Calculations
  calculateEntityTax: (entityId: string, fiscalYear: string) => TaxCalculation;
  calculateGroupTax: (fiscalYear: string) => TaxCalculation[];
  
  // Helpers
  getEffectiveOwnership: (entityId: string) => number;
  getTotalGroupTaxBurden: () => number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// Low tax holding jurisdictions for optimization suggestions
const LOW_TAX_HOLDING_JURISDICTIONS = [
  { code: 'NL', name: 'Netherlands', rate: 25.8 },
  { code: 'LU', name: 'Luxembourg', rate: 24.94 },
  { code: 'IE', name: 'Ireland', rate: 15 },
  { code: 'CH', name: 'Switzerland', rate: 14.6 },
  { code: 'SG', name: 'Singapore', rate: 17 },
  { code: 'HK', name: 'Hong Kong', rate: 16.5 },
];

const IP_BOX_JURISDICTIONS = [
  { code: 'NL', name: 'Netherlands', ipBoxRate: 9 },
  { code: 'LU', name: 'Luxembourg', ipBoxRate: 5.2 },
  { code: 'IE', name: 'Ireland', ipBoxRate: 6.25 },
  { code: 'CH', name: 'Switzerland', ipBoxRate: 8.8 },
  { code: 'GB', name: 'United Kingdom', ipBoxRate: 10 },
];

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useCorporateStructureStore = create<CorporateStructureState>()(
  persist(
    (set, get) => ({
      // Initial State
      entities: [],
      permanentEstablishments: [],
      intercompanyTransactions: [],
      optimizationSuggestions: [],
      taxNotifications: [],
      taxCalculations: [],
      
      // ========================================================================
      // ENTITY CRUD
      // ========================================================================
      
      addEntity: (entityData) => {
        const id = generateId();
        const now = getCurrentTimestamp();
        
        const newEntity: CorporateEntity = {
          ...entityData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          entities: [...state.entities, newEntity],
        }));
        
        // Trigger optimization recalculation
        setTimeout(() => get().generateOptimizationSuggestions(), 100);
        
        return id;
      },
      
      updateEntity: (id, updates) => {
        set((state) => ({
          entities: state.entities.map((e) =>
            e.id === id
              ? { ...e, ...updates, updatedAt: getCurrentTimestamp() }
              : e
          ),
        }));
        
        // Trigger optimization recalculation
        setTimeout(() => get().generateOptimizationSuggestions(), 100);
      },
      
      deleteEntity: (id) => {
        set((state) => {
          // Also delete child entities and PEs
          const idsToDelete = new Set<string>([id]);
          
          // Find all descendants
          const findDescendants = (parentId: string) => {
            state.entities
              .filter((e) => e.parentEntityId === parentId)
              .forEach((child) => {
                idsToDelete.add(child.id);
                findDescendants(child.id);
              });
          };
          findDescendants(id);
          
          return {
            entities: state.entities.filter((e) => !idsToDelete.has(e.id)),
            permanentEstablishments: state.permanentEstablishments.filter(
              (pe) => !idsToDelete.has(pe.entityId)
            ),
            intercompanyTransactions: state.intercompanyTransactions.filter(
              (tx) => !idsToDelete.has(tx.sourceEntityId || '') && !idsToDelete.has(tx.destinationEntityId || '')
            ),
          };
        });
      },
      
      getEntity: (id) => {
        return get().entities.find((e) => e.id === id);
      },
      
      getChildEntities: (parentId) => {
        return get().entities.filter((e) => e.parentEntityId === parentId);
      },
      
      getRootEntities: () => {
        return get().entities.filter((e) => e.parentEntityId === null || e.parentEntityId === undefined);
      },
      
      getEntityHierarchy: (entityId) => {
        const hierarchy: CorporateEntity[] = [];
        let current = get().getEntity(entityId);
        
        while (current) {
          hierarchy.unshift(current);
          current = current.parentEntityId ? get().getEntity(current.parentEntityId) : undefined;
        }
        
        return hierarchy;
      },
      
      // ========================================================================
      // PERMANENT ESTABLISHMENT CRUD
      // ========================================================================
      
      addPE: (peData) => {
        const id = generateId();
        
        const newPE: PermanentEstablishment = {
          ...peData,
          id,
        };
        
        set((state) => ({
          permanentEstablishments: [...state.permanentEstablishments, newPE],
        }));
        
        return id;
      },
      
      updatePE: (id, updates) => {
        set((state) => ({
          permanentEstablishments: state.permanentEstablishments.map((pe) =>
            pe.id === id ? { ...pe, ...updates } : pe
          ),
        }));
      },
      
      deletePE: (id) => {
        set((state) => ({
          permanentEstablishments: state.permanentEstablishments.filter((pe) => pe.id !== id),
        }));
      },
      
      getPEsForEntity: (entityId) => {
        return get().permanentEstablishments.filter((pe) => pe.entityId === entityId);
      },
      
      // ========================================================================
      // INTERCOMPANY TRANSACTIONS
      // ========================================================================
      
      addIntercompanyTransaction: (txData) => {
        const id = generateId();
        
        // Calculate withholding if applicable
        const payerEntity = txData.sourceEntityId ? get().getEntity(txData.sourceEntityId) : undefined;
        const receiverEntity = txData.destinationEntityId ? get().getEntity(txData.destinationEntityId) : undefined;
        
        let withholdingRate = 0;
        let withholdingAmount = 0;
        
        if (payerEntity && receiverEntity && txData.withholdingTaxApplicable) {
          const result = calculateWithholdingTax(
            payerEntity.jurisdictionCode,
            receiverEntity.jurisdictionCode,
            txData.amount,
            txData.transactionType === TransactionType.DIVIDEND ? 'dividends' :
            txData.transactionType === TransactionType.INTEREST ? 'interest' :
            txData.transactionType === TransactionType.ROYALTY ? 'royalties' : 'dividends'
          );
          
          withholdingRate = result.withholdingRate;
          withholdingAmount = result.withholdingAmount;
        }
        
        const newTx: TaxTransaction = {
          ...txData,
          id,
          withholdingTaxRate: withholdingRate,
          withholdingTaxAmount: withholdingAmount,
          createdAt: getCurrentTimestamp(),
        };
        
        set((state) => ({
          intercompanyTransactions: [...state.intercompanyTransactions, newTx],
        }));
        
        return id;
      },
      
      updateIntercompanyTransaction: (id, updates) => {
        set((state) => ({
          intercompanyTransactions: state.intercompanyTransactions.map((tx) =>
            tx.id === id ? { ...tx, ...updates } : tx
          ),
        }));
      },
      
      deleteIntercompanyTransaction: (id) => {
        set((state) => ({
          intercompanyTransactions: state.intercompanyTransactions.filter((tx) => tx.id !== id),
        }));
      },
      
      getTransactionsBetweenEntities: (entity1Id, entity2Id) => {
        return get().intercompanyTransactions.filter(
          (tx) =>
            (tx.sourceEntityId === entity1Id && tx.destinationEntityId === entity2Id) ||
            (tx.sourceEntityId === entity2Id && tx.destinationEntityId === entity1Id)
        );
      },
      
      // ========================================================================
      // OPTIMIZATION SUGGESTIONS
      // ========================================================================
      
      generateOptimizationSuggestions: () => {
        const { entities } = get();
        const suggestions: TaxOptimizationSuggestion[] = [];
        
        if (entities.length === 0) {
          set({ optimizationSuggestions: [] });
          return;
        }
        
        // Analyze each entity
        entities.forEach((entity) => {
          const jurisdiction = getJurisdiction(entity.jurisdictionCode);
          if (!jurisdiction) return;
          
          const effectiveRate = jurisdiction.corporateTax.standardRate;
          
          // 1. HIGH TAX JURISDICTION - HOLDING COMPANY SUGGESTION
          if (effectiveRate > 25 && entity.isHoldingCompany) {
            const betterJurisdictions = LOW_TAX_HOLDING_JURISDICTIONS
              .filter(j => j.rate < effectiveRate - 10)
              .slice(0, 3);
            
            if (betterJurisdictions.length > 0) {
              const bestOption = betterJurisdictions[0];
              const savingsPercent = ((effectiveRate - bestOption.rate) / effectiveRate) * 100;
              const annualProfit = entity.annualProfit || 0;
              
              suggestions.push({
                id: generateId(),
                type: 'HOLDING_COMPANY',
                title: `Holding Company Relocation - ${entity.name}`,
                description: `Consider relocating holding functions to ${bestOption.name} for reduced taxation on dividends and capital gains.`,
                currentTaxBurden: annualProfit * (effectiveRate / 100),
                optimizedTaxBurden: annualProfit * (bestOption.rate / 100),
                savingsAmount: annualProfit * ((effectiveRate - bestOption.rate) / 100),
                savingsPercentage: [savingsPercent * 0.8, savingsPercent * 1.1],
                complexity: 'HIGH',
                timeframe: '12-18 months',
                estimatedCost: 150000,
                implementationSteps: [
                  { order: 1, title: 'Feasibility Analysis', description: 'Conduct detailed tax and legal analysis', status: 'pending' },
                  { order: 2, title: 'Substance Planning', description: `Define required substance in ${bestOption.name}`, status: 'pending' },
                  { order: 3, title: 'Entity Incorporation', description: `Incorporate new holding entity in ${bestOption.name}`, status: 'pending', dependencies: [1, 2] },
                  { order: 4, title: 'Share Transfer', description: 'Transfer shares to new holding company', status: 'pending', dependencies: [3] },
                  { order: 5, title: 'Operational Setup', description: 'Establish board, bank accounts, office', status: 'pending', dependencies: [3] },
                  { order: 6, title: 'Regulatory Compliance', description: 'Complete all regulatory filings', status: 'pending', dependencies: [4, 5] },
                ],
                requirements: [
                  'Board meetings in new jurisdiction',
                  'Local directors/management',
                  'Minimum substance requirements',
                  'Anti-abuse provisions compliance',
                ],
                risks: [
                  'CFC rules may apply in parent jurisdiction',
                  'Exit taxation on migration',
                  'Ongoing compliance costs',
                ],
                applicableEntities: [entity.id],
                affectedJurisdictions: [entity.jurisdictionCode, bestOption.code],
                priority: 'HIGH',
                confidence: 75,
                status: 'suggested',
                createdAt: getCurrentTimestamp(),
              });
            }
          }
          
          // 2. IP MIGRATION SUGGESTION
          const hasIP = entity.assetTypes?.some(a => 
            a === 'IP_SOFTWARE' || a === 'IP_PATENTS' || a === 'IP_TRADEMARKS' || a === 'IP_KNOW_HOW' ||
            a.toLowerCase().includes('ip_')
          );
          
          if (hasIP && effectiveRate > 15) {
            const ipOptions = IP_BOX_JURISDICTIONS
              .filter(j => j.code !== entity.jurisdictionCode)
              .slice(0, 2);
            
            if (ipOptions.length > 0) {
              const bestIPOption = ipOptions[0];
              const annualProfit = entity.annualProfit || 0;
              
              suggestions.push({
                id: generateId(),
                type: 'IP_MIGRATION',
                title: `IP Box Optimization - ${entity.name}`,
                description: `Migrate IP assets to ${bestIPOption.name} to benefit from IP Box regime with ${bestIPOption.ipBoxRate}% rate on IP income.`,
                currentTaxBurden: annualProfit * 0.3 * (effectiveRate / 100),
                optimizedTaxBurden: annualProfit * 0.3 * (bestIPOption.ipBoxRate / 100),
                savingsAmount: annualProfit * 0.3 * ((effectiveRate - bestIPOption.ipBoxRate) / 100),
                savingsPercentage: [40, 70],
                complexity: 'HIGH',
                timeframe: '18-24 months',
                estimatedCost: 250000,
                implementationSteps: [
                  { order: 1, title: 'IP Valuation', description: 'Conduct independent IP valuation', status: 'pending' },
                  { order: 2, title: 'Transfer Pricing Study', description: 'Prepare comprehensive TP documentation', status: 'pending' },
                  { order: 3, title: 'IP Entity Setup', description: `Incorporate IP holding entity in ${bestIPOption.name}`, status: 'pending' },
                  { order: 4, title: 'IP Transfer', description: 'Execute IP transfer agreements', status: 'pending', dependencies: [1, 2, 3] },
                  { order: 5, title: 'License Agreements', description: 'Establish back-licensing arrangements', status: 'pending', dependencies: [4] },
                  { order: 6, title: 'Nexus Documentation', description: 'Document R&D activities for nexus ratio', status: 'pending', dependencies: [4] },
                ],
                requirements: [
                  'Valid IP valuation',
                  'Transfer pricing documentation',
                  'OECD Nexus ratio compliance',
                  'Substance in IP entity',
                ],
                risks: [
                  'Exit taxes on IP transfer',
                  'Transfer pricing audits',
                  'Nexus ratio limitations',
                  'BEPS implications',
                ],
                applicableEntities: [entity.id],
                affectedJurisdictions: [entity.jurisdictionCode, bestIPOption.code],
                priority: 'MEDIUM',
                confidence: 65,
                status: 'suggested',
                createdAt: getCurrentTimestamp(),
              });
            }
          }
          
          // 3. DELAWARE HOLDING SUGGESTION (for US entities)
          if (entity.jurisdictionCode.startsWith('US-') && 
              entity.jurisdictionCode !== 'US-DE' && 
              entity.isHoldingCompany &&
              !entities.some(e => e.jurisdictionCode === 'US-DE' && e.parentEntityId === entity.id)) {
            
            const annualProfit = entity.annualProfit || 0;
            
            suggestions.push({
              id: generateId(),
              type: 'STRUCTURE_REORGANIZATION',
              title: `Delaware Holding Structure - ${entity.name}`,
              description: 'Interpose a Delaware holding company to benefit from no state tax on intangible holding income and business-friendly legal environment.',
              currentTaxBurden: 0,
              optimizedTaxBurden: 0,
              savingsAmount: annualProfit * 0.02,
              savingsPercentage: [1, 4],
              complexity: 'MEDIUM',
              timeframe: '3-6 months',
              estimatedCost: 25000,
              implementationSteps: [
                { order: 1, title: 'Legal Analysis', description: 'Review state nexus and combined reporting rules', status: 'pending' },
                { order: 2, title: 'DE Entity Formation', description: 'Incorporate Delaware LLC or Corp', status: 'pending' },
                { order: 3, title: 'Asset Transfer', description: 'Transfer intangible assets or equity interests', status: 'pending', dependencies: [2] },
                { order: 4, title: 'Intercompany Agreements', description: 'Establish licensing and service agreements', status: 'pending', dependencies: [3] },
              ],
              requirements: [
                'No employees in Delaware',
                'Maintain separate books',
                'Arm\'s length pricing for intercompany',
              ],
              risks: [
                'State combined reporting may negate benefits',
                'Economic nexus in other states',
                'IRS scrutiny on related party transactions',
              ],
              applicableEntities: [entity.id],
              affectedJurisdictions: [entity.jurisdictionCode, 'US-DE'],
              priority: 'LOW',
              confidence: 60,
              status: 'suggested',
              createdAt: getCurrentTimestamp(),
            });
          }
          
          // 4. WITHHOLDING TAX OPTIMIZATION
          const childEntities = get().getChildEntities(entity.id);
          childEntities.forEach((child) => {
            const childJurisdiction = getJurisdiction(child.jurisdictionCode);
            if (!childJurisdiction) return;
            
            // Get withholding rate for dividends
            const whtResult = calculateWithholdingTax(
              child.jurisdictionCode,
              entity.jurisdictionCode,
              1000000, // Sample amount
              'dividends'
            );
            
            const currentWHT = whtResult.withholdingRate;
            
            if (currentWHT > 10) {
              const childAnnualProfit = child.annualProfit || 0;
              
              suggestions.push({
                id: generateId(),
                type: 'WITHHOLDING_REDUCTION',
                title: `Dividend Routing Optimization: ${child.name} → ${entity.name}`,
                description: `Current ${currentWHT}% withholding on dividends. Consider interposing entity in treaty jurisdiction to reduce withholding.`,
                currentTaxBurden: childAnnualProfit * 0.5 * (currentWHT / 100),
                optimizedTaxBurden: childAnnualProfit * 0.5 * 0.05,
                savingsAmount: childAnnualProfit * 0.5 * ((currentWHT - 5) / 100),
                savingsPercentage: [(currentWHT - 5) / currentWHT * 80, (currentWHT - 5) / currentWHT * 100],
                complexity: 'MEDIUM',
                timeframe: '6-12 months',
                estimatedCost: 75000,
                implementationSteps: [
                  { order: 1, title: 'Treaty Analysis', description: 'Analyze available treaty networks', status: 'pending' },
                  { order: 2, title: 'Jurisdiction Selection', description: 'Select optimal intermediate jurisdiction', status: 'pending', dependencies: [1] },
                  { order: 3, title: 'Entity Setup', description: 'Establish intermediate holding entity', status: 'pending', dependencies: [2] },
                  { order: 4, title: 'Share Transfer', description: 'Transfer shares through new structure', status: 'pending', dependencies: [3] },
                ],
                requirements: [
                  'Beneficial ownership substance',
                  'Principal Purpose Test compliance',
                  'LOB article satisfaction',
                ],
                risks: [
                  'Treaty shopping concerns',
                  'GAAR/SAAR application',
                  'Substance requirements',
                ],
                applicableEntities: [entity.id, child.id],
                affectedJurisdictions: [entity.jurisdictionCode, child.jurisdictionCode],
                priority: currentWHT > 20 ? 'HIGH' : 'MEDIUM',
                confidence: 55,
                status: 'suggested',
                createdAt: getCurrentTimestamp(),
              });
            }
          });
        });
        
        // Sort by priority and savings
        const priorityOrder: Record<string, number> = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        suggestions.sort((a, b) => {
          const priorityDiff = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
          if (priorityDiff !== 0) return priorityDiff;
          return (b.savingsAmount || 0) - (a.savingsAmount || 0);
        });
        
        set({ optimizationSuggestions: suggestions });
        
        // Add notifications for high-priority suggestions
        suggestions
          .filter(s => s.priority === 'HIGH' || s.priority === 'CRITICAL')
          .slice(0, 3)
          .forEach(s => {
            get().addNotification({
              type: 'OPTIMIZATION_FOUND',
              title: `New Optimization: ${s.title}`,
              message: `Potential savings: ${(s.savingsPercentage?.[0] || 0).toFixed(0)}-${(s.savingsPercentage?.[1] || 0).toFixed(0)}%`,
              optimizationId: s.id,
              actionRequired: false,
              priority: s.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
            });
          });
      },
      
      updateOptimizationStatus: (id, status) => {
        set((state) => ({
          optimizationSuggestions: state.optimizationSuggestions.map((s) =>
            s.id === id ? { ...s, status } : s
          ),
        }));
      },
      
      dismissOptimization: (id) => {
        set((state) => ({
          optimizationSuggestions: state.optimizationSuggestions.map((s) =>
            s.id === id ? { ...s, status: 'rejected' as const } : s
          ),
        }));
      },
      
      // ========================================================================
      // NOTIFICATIONS
      // ========================================================================
      
      addNotification: (notificationData) => {
        const id = generateId();
        
        const newNotification: TaxNotification = {
          ...notificationData,
          id,
          createdAt: getCurrentTimestamp(),
          read: false,
          dismissed: false,
        };
        
        set((state) => ({
          taxNotifications: [newNotification, ...state.taxNotifications].slice(0, 100),
        }));
      },
      
      markNotificationRead: (id) => {
        set((state) => ({
          taxNotifications: state.taxNotifications.map((n) =>
            n.id === id ? { ...n, read: true, readAt: getCurrentTimestamp() } : n
          ),
        }));
      },
      
      dismissNotification: (id) => {
        set((state) => ({
          taxNotifications: state.taxNotifications.map((n) =>
            n.id === id ? { ...n, dismissed: true, dismissedAt: getCurrentTimestamp() } : n
          ),
        }));
      },
      
      getUnreadNotifications: () => {
        return get().taxNotifications.filter((n) => !n.read && !n.dismissed);
      },
      
      // ========================================================================
      // TAX CALCULATIONS
      // ========================================================================
      
      calculateEntityTax: (entityId, fiscalYear) => {
        const entity = get().getEntity(entityId);
        if (!entity) {
          throw new Error(`Entity ${entityId} not found`);
        }
        
        const jurisdiction = getJurisdiction(entity.jurisdictionCode);
        if (!jurisdiction) {
          throw new Error(`Jurisdiction ${entity.jurisdictionCode} not found`);
        }
        
        const grossRevenue = entity.annualRevenue || 0;
        const taxableIncome = entity.annualProfit || 0;
        
        // Calculate corporate tax based on brackets
        let corporateTax = 0;
        const brackets = jurisdiction.corporateTax.brackets || [];
        
        if (brackets.length > 0) {
          let remainingIncome = taxableIncome;
          
          for (const bracket of brackets) {
            if (remainingIncome <= 0) break;
            
            const bracketMax = bracket.maxIncome ?? Infinity;
            const bracketSize = bracketMax - bracket.minIncome;
            const taxableInBracket = Math.min(remainingIncome, bracketSize);
            
            corporateTax += taxableInBracket * (bracket.rate / 100);
            remainingIncome -= taxableInBracket;
          }
        } else {
          corporateTax = taxableIncome * (jurisdiction.corporateTax.standardRate / 100);
        }
        
        // Apply minimum tax if applicable
        const totalTax = corporateTax;
        const effectiveTaxRate = taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0;
        
        const calculation: TaxCalculation = {
          entityId,
          jurisdictionCode: entity.jurisdictionCode,
          fiscalYear,
          grossRevenue,
          deductions: [],
          taxableIncome,
          corporateTax,
          localTaxes: 0,
          withholdingTaxes: 0,
          totalTax,
          effectiveTaxRate,
          foreignTaxCredits: 0,
          otherCredits: 0,
          netTaxPayable: totalTax,
          status: 'estimated',
          calculatedAt: getCurrentTimestamp(),
        };
        
        return calculation;
      },
      
      calculateGroupTax: (fiscalYear) => {
        const { entities } = get();
        return entities.map((e) => get().calculateEntityTax(e.id, fiscalYear));
      },
      
      // ========================================================================
      // HELPERS
      // ========================================================================
      
      getEffectiveOwnership: (entityId) => {
        const hierarchy = get().getEntityHierarchy(entityId);
        
        if (hierarchy.length <= 1) return 100;
        
        let effectiveOwnership = 100;
        for (let i = 1; i < hierarchy.length; i++) {
          effectiveOwnership *= (hierarchy[i].ownershipPercentage || 100) / 100;
        }
        
        return effectiveOwnership;
      },
      
      getTotalGroupTaxBurden: () => {
        const { entities } = get();
        
        return entities.reduce((total, entity) => {
          const jurisdiction = getJurisdiction(entity.jurisdictionCode);
          if (!jurisdiction || !entity.annualProfit) return total;
          
          const effectiveRate = jurisdiction.corporateTax.standardRate;
          return total + entity.annualProfit * (effectiveRate / 100);
        }, 0);
      },
    }),
    {
      name: 'primebalance-corporate-structure',
      partialize: (state) => ({
        entities: state.entities,
        permanentEstablishments: state.permanentEstablishments,
        intercompanyTransactions: state.intercompanyTransactions,
        taxNotifications: state.taxNotifications.slice(0, 50),
      }),
    }
  )
);

// ============================================================================
// SAMPLE DATA FOR DEMO
// ============================================================================

export function initializeSampleCorporateStructure() {
  const store = useCorporateStructureStore.getState();
  
  // Only initialize if empty
  if (store.entities.length > 0) return;
  
  // Create sample structure: US Parent -> DE Subsidiary -> CH IP Holding
  const parentId = store.addEntity({
    name: 'TechCorp Inc.',
    legalName: 'TechCorp Incorporated',
    type: EntityType.CORPORATION,
    jurisdictionCode: 'US-DE',
    parentEntityId: null,
    ownershipPercentage: 100,
    taxId: '12-3456789',
    registrationNumber: 'DE-12345',
    incorporationDate: '2015-03-15',
    fiscalYearEnd: '12-31',
    functionalCurrency: 'USD',
    annualRevenue: 50000000,
    annualProfit: 8000000,
    employees: 150,
    assets: 25000000,
    functions: ['management', 'sales', 'marketing'],
    risks: ['market_risk', 'operational_risk'],
    assetTypes: ['tangible_assets', 'receivables', 'ip_software'],
    isActive: true,
    isHoldingCompany: true,
    isProfitCenter: true,
    isConsolidated: true,
    isPermanentEstablishment: false,
    status: 'ACTIVE',
  });
  
  const germanSubId = store.addEntity({
    name: 'TechCorp GmbH',
    legalName: 'TechCorp Deutschland GmbH',
    type: EntityType.SUBSIDIARY,
    jurisdictionCode: 'DE',
    parentEntityId: parentId,
    ownershipPercentage: 100,
    taxId: 'DE123456789',
    registrationNumber: 'HRB 12345',
    incorporationDate: '2018-06-01',
    fiscalYearEnd: '12-31',
    functionalCurrency: 'EUR',
    annualRevenue: 15000000,
    annualProfit: 2500000,
    employees: 45,
    assets: 8000000,
    functions: ['distribution', 'sales', 'rd'],
    risks: ['market_risk', 'inventory_risk'],
    assetTypes: ['tangible_assets', 'inventory', 'ip_patents'],
    isActive: true,
    isHoldingCompany: false,
    isProfitCenter: true,
    isConsolidated: true,
    isPermanentEstablishment: false,
    status: 'ACTIVE',
  });
  
  store.addEntity({
    name: 'TechCorp IP AG',
    legalName: 'TechCorp Intellectual Property AG',
    type: EntityType.IP_HOLDING,
    jurisdictionCode: 'CH',
    parentEntityId: germanSubId,
    ownershipPercentage: 100,
    taxId: 'CHE-123.456.789',
    registrationNumber: 'CH-123.456.789',
    incorporationDate: '2020-01-15',
    fiscalYearEnd: '12-31',
    functionalCurrency: 'CHF',
    annualRevenue: 5000000,
    annualProfit: 4000000,
    employees: 5,
    assets: 15000000,
    functions: ['ip_licensing', 'ip_development'],
    risks: ['development_risk'],
    assetTypes: ['ip_patents', 'ip_software', 'ip_know_how'],
    isActive: true,
    isHoldingCompany: false,
    isProfitCenter: true,
    isConsolidated: true,
    isPermanentEstablishment: false,
    status: 'ACTIVE',
  });
  
  store.addEntity({
    name: 'TechCorp Singapore',
    legalName: 'TechCorp Asia Pte. Ltd.',
    type: EntityType.SUBSIDIARY,
    jurisdictionCode: 'SG',
    parentEntityId: parentId,
    ownershipPercentage: 100,
    taxId: 'SG12345678X',
    registrationNumber: '202012345X',
    incorporationDate: '2020-09-01',
    fiscalYearEnd: '12-31',
    functionalCurrency: 'SGD',
    annualRevenue: 8000000,
    annualProfit: 1500000,
    employees: 20,
    assets: 3000000,
    functions: ['sales', 'distribution', 'shared_services'],
    risks: ['market_risk', 'currency_risk'],
    assetTypes: ['tangible_assets', 'receivables'],
    isActive: true,
    isHoldingCompany: false,
    isProfitCenter: true,
    isConsolidated: true,
    isPermanentEstablishment: false,
    status: 'ACTIVE',
  });
  
  // Add a PE
  store.addPE({
    entityId: germanSubId,
    name: 'TechCorp France Branch',
    jurisdiction: 'FR',
    type: 'FIXED_PLACE',
    startDate: '2022-03-01',
    activities: ['Sales', 'Technical Support'],
    employees: 8,
    profitAttributionMethod: 'AOA',
    attributedProfit: 500000,
    isActive: true,
  });
  
  // Trigger optimization generation
  setTimeout(() => store.generateOptimizationSuggestions(), 500);
}
