'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Building2,
  Globe,
  FileText,
  Scale,
  Play,
  X,
  Info,
  Sparkles,
  Target,
  RefreshCw,
} from 'lucide-react';
import {
  TaxOptimizationSuggestion,
  OptimizationCategory,
  ImplementationStep,
} from '@/types/tax';
import { useTaxStore } from '@/store/tax-store';
import { getJurisdiction } from '@/data/jurisdictions';

// =============================================================================
// CATEGORY CONFIG
// =============================================================================

const categoryConfig: Record<OptimizationCategory, { label: string; icon: React.ElementType; color: string }> = {
  [OptimizationCategory.HOLDING_STRUCTURE]: {
    label: 'Holding Structure',
    icon: Building2,
    color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
  },
  [OptimizationCategory.TRANSFER_PRICING]: {
    label: 'Transfer Pricing',
    icon: Scale,
    color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  },
  [OptimizationCategory.DTA_UTILIZATION]: {
    label: 'Treaty Optimization',
    icon: Globe,
    color: 'text-green-500 bg-green-100 dark:bg-green-900/30',
  },
  [OptimizationCategory.ENTITY_RESTRUCTURING]: {
    label: 'Entity Restructuring',
    icon: Building2,
    color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30',
  },
  [OptimizationCategory.FINANCING_ARRANGEMENT]: {
    label: 'Financing',
    icon: DollarSign,
    color: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30',
  },
  [OptimizationCategory.IP_PLANNING]: {
    label: 'IP Planning',
    icon: Lightbulb,
    color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
  },
  [OptimizationCategory.DIVIDEND_ROUTING]: {
    label: 'Dividend Routing',
    icon: ArrowRight,
    color: 'text-pink-500 bg-pink-100 dark:bg-pink-900/30',
  },
  [OptimizationCategory.LOSS_UTILIZATION]: {
    label: 'Loss Utilization',
    icon: TrendingDown,
    color: 'text-red-500 bg-red-100 dark:bg-red-900/30',
  },
  [OptimizationCategory.TAX_CREDITS]: {
    label: 'Tax Credits',
    icon: CheckCircle2,
    color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30',
  },
  [OptimizationCategory.INCENTIVE_PROGRAMS]: {
    label: 'Incentive Programs',
    icon: Sparkles,
    color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30',
  },
  [OptimizationCategory.PE_OPTIMIZATION]: {
    label: 'PE Optimization',
    icon: Target,
    color: 'text-slate-500 bg-slate-100 dark:bg-slate-700',
  },
};

// =============================================================================
// SUGGESTION CARD COMPONENT
// =============================================================================

interface SuggestionCardProps {
  suggestion: TaxOptimizationSuggestion;
  onDismiss: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, onDismiss }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showImplementation, setShowImplementation] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const config = suggestion.category ? categoryConfig[suggestion.category] : {
    label: 'Optimization',
    icon: Lightbulb,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };
  const Icon = config.icon;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const toggleStep = (order: number) => {
    setCompletedSteps(prev =>
      prev.includes(order) ? prev.filter(s => s !== order) : [...prev, order]
    );
  };

  const steps = suggestion.implementationSteps || [];
  const completionPercentage = steps.length > 0
    ? (completedSteps.length / steps.length) * 100
    : 0;

  // Get savings values with fallbacks
  const savingsMin = suggestion.estimatedSavingsMin ?? suggestion.savingsAmount ?? 0;
  const savingsMax = suggestion.estimatedSavingsMax ?? suggestion.savingsAmount ?? 0;
  const savingsPercentMin = suggestion.estimatedSavingsPercentageMin ?? (suggestion.savingsPercentage?.[0] ?? 0);
  const savingsPercentMax = suggestion.estimatedSavingsPercentageMax ?? (suggestion.savingsPercentage?.[1] ?? 0);
  const jurisdictions = suggestion.relatedJurisdictions || suggestion.affectedJurisdictions || [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`p-2 rounded-lg ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}>
                    {config.label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    suggestion.priority === 'HIGH' || suggestion.priority === 'high'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : suggestion.priority === 'MEDIUM' || suggestion.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {suggestion.priority.toUpperCase()} Priority
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {suggestion.title}
                </h3>
              </div>

              <button
                onClick={onDismiss}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              {suggestion.description}
            </p>

            {/* Savings Estimate */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Potential Savings:
                </span>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(savingsMin)} - {formatCurrency(savingsMax)}
                </span>
              </div>
              <div className="text-sm text-slate-500">
                ({savingsPercentMin.toFixed(1)}% - {savingsPercentMax.toFixed(1)}%)
              </div>
            </div>

            {/* Jurisdictions */}
            {jurisdictions.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <Globe className="w-4 h-4 text-slate-400" />
                <div className="flex flex-wrap gap-1">
                  {jurisdictions.map(code => {
                    const j = getJurisdiction(code);
                    return (
                      <span
                        key={code}
                        className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      >
                        {j?.flag} {j?.shortName || code}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Meta Info */}
            <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {suggestion.timeToImplement || suggestion.timeframe || 'TBD'}
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {(suggestion.complexity || 'MEDIUM').toString().toUpperCase()} Complexity
              </div>
            </div>
          </div>
        </div>

        {/* Expand Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center gap-2 text-sm text-blue-500 hover:text-blue-600"
        >
          {isExpanded ? (
            <>
              <ChevronDown className="w-4 h-4" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronRight className="w-4 h-4" />
              View Details & Implementation Steps
            </>
          )}
        </button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-200 dark:border-slate-700"
          >
            <div className="p-4 space-y-4">
              {/* Implementation Steps */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Implementation Steps
                  </h4>
                  <span className="text-sm text-slate-500">
                    {completedSteps.length}/{steps.length} completed
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full mb-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    className="h-full bg-green-500 rounded-full"
                  />
                </div>

                {/* Steps List */}
                <div className="space-y-3">
                  {steps.map((step) => (
                    <div
                      key={step.order}
                      className={`p-3 rounded-lg border transition-colors ${
                        completedSteps.includes(step.order)
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleStep(step.order)}
                          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            completedSteps.includes(step.order)
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-slate-300 dark:border-slate-600 hover:border-green-400'
                          }`}
                        >
                          {completedSteps.includes(step.order) && (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className={`font-medium ${
                              completedSteps.includes(step.order)
                                ? 'text-green-700 dark:text-green-400 line-through'
                                : 'text-slate-900 dark:text-white'
                            }`}>
                              {step.order}. {step.title}
                            </h5>
                            <span className="text-xs text-slate-500">
                              {step.estimatedDuration}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {step.description}
                          </p>
                          
                          {/* Step Meta */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {step.responsibleParty && (
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                {step.responsibleParty}
                              </span>
                            )}
                            {step.estimatedCost && (
                              <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                                Est. Cost: {formatCurrency(step.estimatedCost)}
                              </span>
                            )}
                            {step.dependencies && step.dependencies.length > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                Depends on: Step {step.dependencies.join(', ')}
                              </span>
                            )}
                          </div>

                          {/* Documentation Required */}
                          {step.documentationRequired && step.documentationRequired.length > 0 && (
                            <div className="mt-2 flex items-start gap-2">
                              <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                              <div className="flex flex-wrap gap-1">
                                {step.documentationRequired.map(doc => (
                                  <span
                                    key={doc}
                                    className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                  >
                                    {doc}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risks */}
              {(suggestion.risks?.length ?? 0) > 0 && (
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    Risks to Consider
                  </h4>
                  <ul className="space-y-2">
                    {suggestion.risks?.map((risk, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Legal Considerations */}
              {(suggestion.legalConsiderations?.length ?? 0) > 0 && (
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                    <Scale className="w-4 h-4 text-blue-500" />
                    Legal Considerations
                  </h4>
                  <ul className="space-y-2">
                    {suggestion.legalConsiderations?.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface TaxOptimizationPanelProps {
  onRunAnalysis?: () => void;
}

export const TaxOptimizationPanel: React.FC<TaxOptimizationPanelProps> = ({
  onRunAnalysis,
}) => {
  const { optimizationResult, isAnalyzing, dismissSuggestion, runOptimizationAnalysis } = useTaxStore();
  const [selectedCategory, setSelectedCategory] = useState<OptimizationCategory | 'ALL'>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  const filteredSuggestions = useMemo(() => {
    if (!optimizationResult) return [];

    return optimizationResult.suggestions.filter(s => {
      if (selectedCategory !== 'ALL' && s.category !== selectedCategory) return false;
      if (selectedPriority !== 'ALL' && s.priority !== selectedPriority) return false;
      return true;
    });
  }, [optimizationResult, selectedCategory, selectedPriority]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleRunAnalysis = () => {
    if (onRunAnalysis) {
      onRunAnalysis();
    } else {
      runOptimizationAnalysis({
        annualRevenue: 10000000,
        dividendFlows: [],
        royaltyFlows: [],
        currentEffectiveTaxRate: 25,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            Tax Optimization
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            AI-powered suggestions to optimize your tax structure
          </p>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Run Analysis
            </>
          )}
        </button>
      </div>

      {/* Summary Cards */}
      {optimizationResult && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Current Tax Burden</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(optimizationResult.currentTaxBurden)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Optimized Estimate</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(optimizationResult.optimizedTaxBurden)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Potential Savings</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-5 h-5" />
              {formatCurrency(optimizationResult.potentialSavings)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">Suggestions Found</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {optimizationResult.suggestions.length}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      {optimizationResult && optimizationResult.suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as OptimizationCategory | 'ALL')}
              className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
            >
              <option value="ALL">All Categories</option>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW')}
              className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <span className="text-sm text-slate-500">
            Showing {filteredSuggestions.length} of {optimizationResult.suggestions.length} suggestions
          </span>
        </div>
      )}

      {/* Suggestions List */}
      {filteredSuggestions.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onDismiss={() => dismissSuggestion(suggestion.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : optimizationResult ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No Suggestions Match Filters
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Try adjusting your filters to see more optimization opportunities.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
          <Lightbulb className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Run Analysis to Get Started
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Click "Run Analysis" to analyze your corporate structure and discover tax optimization opportunities.
          </p>
          <button
            onClick={handleRunAnalysis}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Run Analysis
          </button>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800 dark:text-yellow-200">
          <p className="font-medium mb-1">Important Disclaimer</p>
          <p>
            These suggestions are for informational purposes only and do not constitute tax, legal, or 
            financial advice. Always consult with qualified tax professionals and legal advisors before 
            implementing any tax planning strategies. Tax laws and regulations vary by jurisdiction and 
            are subject to change.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaxOptimizationPanel;
