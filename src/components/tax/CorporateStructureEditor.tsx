'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Globe,
  MapPin,
  Percent,
  Calendar,
  DollarSign,
  Users,
  GitBranch,
  MoreVertical,
  Check,
  X,
  Building,
  Briefcase,
  Network,
  Flag,
} from 'lucide-react';
import { CorporateEntity, EntityType, CorporateStructure } from '@/types/tax';
import { useTaxStore } from '@/store/tax-store';
import { getJurisdiction, getGroupedJurisdictions } from '@/data/jurisdictions';

// =============================================================================
// ENTITY TYPE CONFIG
// =============================================================================

const entityTypeConfig: Record<EntityType, { label: string; icon: React.ElementType; color: string }> = {
  [EntityType.PARENT]: { label: 'Parent Company', icon: Building2, color: 'text-blue-500 bg-blue-100' },
  [EntityType.HOLDING]: { label: 'Holding Company', icon: Network, color: 'text-purple-500 bg-purple-100' },
  [EntityType.OPERATING_COMPANY]: { label: 'Operating Company', icon: Briefcase, color: 'text-green-500 bg-green-100' },
  [EntityType.SUBSIDIARY]: { label: 'Subsidiary', icon: Building, color: 'text-cyan-500 bg-cyan-100' },
  [EntityType.PERMANENT_ESTABLISHMENT]: { label: 'Permanent Establishment', icon: MapPin, color: 'text-orange-500 bg-orange-100' },
  [EntityType.BRANCH]: { label: 'Branch', icon: GitBranch, color: 'text-yellow-500 bg-yellow-100' },
  [EntityType.REPRESENTATIVE_OFFICE]: { label: 'Representative Office', icon: Users, color: 'text-pink-500 bg-pink-100' },
  [EntityType.JOINT_VENTURE]: { label: 'Joint Venture', icon: Users, color: 'text-indigo-500 bg-indigo-100' },
  [EntityType.CORPORATION]: { label: 'Corporation', icon: Building2, color: 'text-slate-500 bg-slate-100' },
  [EntityType.IP_HOLDING]: { label: 'IP Holding', icon: Briefcase, color: 'text-amber-500 bg-amber-100' },
};

// =============================================================================
// ENTITY CARD COMPONENT
// =============================================================================

interface EntityCardProps {
  entity: CorporateEntity;
  structure: CorporateStructure;
  depth: number;
  onEdit: (entity: CorporateEntity) => void;
  onDelete: (entityId: string) => void;
  onAddChild: (parentId: string) => void;
}

const EntityCard: React.FC<EntityCardProps> = ({
  entity,
  structure,
  depth,
  onEdit,
  onDelete,
  onAddChild,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const jurisdiction = getJurisdiction(entity.jurisdictionCode);
  const config = entityTypeConfig[entity.type];
  const Icon = config.icon;

  // Get child entities
  const children = structure.entities.filter(e => e.parentEntityId === entity.id);
  const hasChildren = children.length > 0;

  // Calculate ownership chain
  const ownershipStake = structure.ownershipStakes.find(
    os => os.childEntityId === entity.id
  );

  return (
    <div className="relative">
      {/* Connection line */}
      {depth > 0 && (
        <div
          className="absolute left-0 top-0 h-8 w-8 border-l-2 border-b-2 border-slate-300 dark:border-slate-600 rounded-bl-lg"
          style={{ marginLeft: '-16px', marginTop: '-16px' }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: depth * 0.1 }}
        className="relative"
      >
        {/* Entity Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {/* Expand/Collapse */}
                {hasChildren && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-1 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                )}

                {/* Icon */}
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Info */}
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {entity.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {entity.legalName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {config.label}
                    </span>
                    {entity.status === 'DORMANT' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                        Dormant
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                >
                  <MoreVertical className="w-4 h-4 text-slate-500" />
                </button>
                
                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10"
                    >
                      <button
                        onClick={() => {
                          onEdit(entity);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Entity
                      </button>
                      <button
                        onClick={() => {
                          onAddChild(entity.id);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Child Entity
                      </button>
                      {entity.type !== EntityType.PARENT && (
                        <button
                          onClick={() => {
                            onDelete(entity.id);
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Entity
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              {/* Jurisdiction */}
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Jurisdiction</p>
                  <p className="text-sm font-medium">
                    {jurisdiction?.flag} {jurisdiction?.shortName || entity.jurisdictionCode}
                  </p>
                </div>
              </div>

              {/* Tax Rate */}
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Tax Rate</p>
                  <p className="text-sm font-medium">
                    {jurisdiction?.corporateTax.standardRate || 0}%
                  </p>
                </div>
              </div>

              {/* Ownership */}
              {ownershipStake && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Ownership</p>
                    <p className="text-sm font-medium">
                      {ownershipStake.ownershipPercentage}%
                    </p>
                  </div>
                </div>
              )}

              {/* Currency */}
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Currency</p>
                  <p className="text-sm font-medium">{entity.functionalCurrency}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Children */}
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="ml-8 mt-4 space-y-4 border-l-2 border-slate-200 dark:border-slate-700 pl-4"
            >
              {children.map(child => (
                <EntityCard
                  key={child.id}
                  entity={child}
                  structure={structure}
                  depth={depth + 1}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAddChild={onAddChild}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// =============================================================================
// ENTITY FORM MODAL
// =============================================================================

interface EntityFormProps {
  entity?: CorporateEntity;
  parentId?: string | null;
  structureId: string;
  onClose: () => void;
}

const EntityForm: React.FC<EntityFormProps> = ({
  entity,
  parentId,
  structureId,
  onClose,
}) => {
  const { addEntity, updateEntity } = useTaxStore();
  const groupedJurisdictions = useMemo(() => getGroupedJurisdictions(), []);

  const [formData, setFormData] = useState({
    name: entity?.name || '',
    legalName: entity?.legalName || '',
    type: entity?.type || EntityType.SUBSIDIARY,
    jurisdictionCode: entity?.jurisdictionCode || 'US-DE',
    registrationNumber: entity?.registrationNumber || '',
    taxId: entity?.taxId || '',
    vatId: entity?.vatId || '',
    fiscalYearEnd: entity?.fiscalYearEnd || '12-31',
    functionalCurrency: entity?.functionalCurrency || 'USD',
    ownershipPercentage: entity?.ownershipPercentage || 100,
    votingRights: entity?.votingRights || 100,
    isConsolidated: entity?.isConsolidated ?? true,
    isPermanentEstablishment: entity?.isPermanentEstablishment ?? false,
    status: entity?.status || 'ACTIVE',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (entity) {
      updateEntity(structureId, entity.id, formData);
    } else {
      addEntity(structureId, {
        ...formData,
        parentEntityId: parentId || null,
      });
    }

    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {entity ? 'Edit Entity' : 'Add New Entity'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {entity ? 'Update entity details' : 'Add a new entity to your corporate structure'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., Acme Europe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Legal Name *
              </label>
              <input
                type="text"
                required
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., Acme Europe GmbH"
              />
            </div>
          </div>

          {/* Entity Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Entity Type *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(entityTypeConfig).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type as EntityType })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.type === type
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${formData.type === type ? 'text-blue-500' : 'text-slate-400'}`} />
                    <p className={`text-xs text-center ${formData.type === type ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}>
                      {config.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Jurisdiction */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Jurisdiction *
            </label>
            <select
              required
              value={formData.jurisdictionCode}
              onChange={(e) => setFormData({ ...formData, jurisdictionCode: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {groupedJurisdictions.map(group => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.flag} {option.label} ({option.rate}%)
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Tax IDs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Registration Number
              </label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tax ID
              </label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                VAT ID
              </label>
              <input
                type="text"
                value={formData.vatId}
                onChange={(e) => setFormData({ ...formData, vatId: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Financial Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Fiscal Year End
              </label>
              <input
                type="text"
                value={formData.fiscalYearEnd}
                onChange={(e) => setFormData({ ...formData, fiscalYearEnd: e.target.value })}
                placeholder="MM-DD"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Functional Currency
              </label>
              <select
                value={formData.functionalCurrency}
                onChange={(e) => setFormData({ ...formData, functionalCurrency: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CHF">CHF - Swiss Franc</option>
                <option value="SGD">SGD - Singapore Dollar</option>
                <option value="HKD">HKD - Hong Kong Dollar</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="CNY">CNY - Chinese Yuan</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'DORMANT' | 'LIQUIDATING' | 'DISSOLVED' })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ACTIVE">Active</option>
                <option value="DORMANT">Dormant</option>
                <option value="LIQUIDATING">Liquidating</option>
                <option value="DISSOLVED">Dissolved</option>
              </select>
            </div>
          </div>

          {/* Ownership */}
          {parentId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Ownership Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.ownershipPercentage}
                    onChange={(e) => setFormData({ ...formData, ownershipPercentage: Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Voting Rights
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.votingRights}
                    onChange={(e) => setFormData({ ...formData, votingRights: Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                </div>
              </div>
            </div>
          )}

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isConsolidated}
                onChange={(e) => setFormData({ ...formData, isConsolidated: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Consolidated</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPermanentEstablishment}
                onChange={(e) => setFormData({ ...formData, isPermanentEstablishment: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Permanent Establishment</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {entity ? 'Update Entity' : 'Add Entity'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const CorporateStructureEditor: React.FC = () => {
  const { structures, activeStructureId, getActiveStructure, deleteEntity, createStructure } = useTaxStore();
  const activeStructure = getActiveStructure();

  const [showEntityForm, setShowEntityForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<CorporateEntity | undefined>();
  const [parentIdForNewEntity, setParentIdForNewEntity] = useState<string | null>(null);
  const [showNewStructureForm, setShowNewStructureForm] = useState(false);
  const [newStructureName, setNewStructureName] = useState('');

  const handleAddChild = (parentId: string) => {
    setParentIdForNewEntity(parentId);
    setEditingEntity(undefined);
    setShowEntityForm(true);
  };

  const handleEdit = (entity: CorporateEntity) => {
    setEditingEntity(entity);
    setParentIdForNewEntity(entity.parentEntityId ?? null);
    setShowEntityForm(true);
  };

  const handleDelete = (entityId: string) => {
    if (activeStructureId && confirm('Are you sure you want to delete this entity and all its children?')) {
      deleteEntity(activeStructureId, entityId);
    }
  };

  const handleCreateStructure = () => {
    if (newStructureName.trim()) {
      createStructure(newStructureName, {
        name: newStructureName + ' Parent',
        legalName: newStructureName + ' Inc.',
        type: EntityType.PARENT,
        jurisdictionCode: 'US-DE',
        fiscalYearEnd: '12-31',
        functionalCurrency: 'USD',
        isConsolidated: true,
        isPermanentEstablishment: false,
        status: 'ACTIVE',
      });
      setNewStructureName('');
      setShowNewStructureForm(false);
    }
  };

  // Get root entity
  const rootEntity = activeStructure?.entities.find(e => e.id === activeStructure.ultimateParentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Corporate Structure
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your corporate hierarchy and entities
          </p>
        </div>
        
        {activeStructure ? (
          <button
            onClick={() => handleAddChild(activeStructure.ultimateParentId)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Entity
          </button>
        ) : (
          <button
            onClick={() => setShowNewStructureForm(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Structure
          </button>
        )}
      </div>

      {/* Structure Selector */}
      {structures.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Active Structure:</span>
          <select
            value={activeStructureId || ''}
            onChange={(e) => useTaxStore.getState().setActiveStructure(e.target.value)}
            className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
          >
            {structures.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Structure View */}
      {activeStructure && rootEntity ? (
        <div className="space-y-4">
          <EntityCard
            entity={rootEntity}
            structure={activeStructure}
            depth={0}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddChild={handleAddChild}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Building2 className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No Corporate Structure
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Create your first corporate structure to start managing entities and optimizing taxes.
          </p>
          <button
            onClick={() => setShowNewStructureForm(true)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Structure
          </button>
        </div>
      )}

      {/* Entity Form Modal */}
      <AnimatePresence>
        {showEntityForm && activeStructureId && (
          <EntityForm
            entity={editingEntity}
            parentId={parentIdForNewEntity}
            structureId={activeStructureId}
            onClose={() => {
              setShowEntityForm(false);
              setEditingEntity(undefined);
              setParentIdForNewEntity(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* New Structure Modal */}
      <AnimatePresence>
        {showNewStructureForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowNewStructureForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Create New Structure
              </h2>
              <input
                type="text"
                value={newStructureName}
                onChange={(e) => setNewStructureName(e.target.value)}
                placeholder="Structure Name (e.g., Acme Holdings)"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none mb-4"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowNewStructureForm(false)}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateStructure}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CorporateStructureEditor;
