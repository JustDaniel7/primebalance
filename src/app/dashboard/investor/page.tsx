'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Shield,
    TrendingUp,
    TrendingDown,
    Minus,
    DollarSign,
    PieChart,
    BarChart3,
    Clock,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Eye,
    Lock,
    FileText,
    Calendar,
    Users,
    Building2,
    Wallet,
    CreditCard,
    Activity,
    Target,
    Gauge,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Download,
    Info,
    ChevronRight,
    Banknote,
    Scale,
    Landmark,
    CircleDollarSign,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';
import { useInvestorStore } from '@/store/investor-store';
import type { InvestorRiskLevel, TrendDirection, DataQuality, MaterialChange } from '@/types/investor';
import { REPORTING_PERIODS, INVESTOR_RISK_LEVELS } from '@/types/investor';

// =============================================================================
// UTILITIES
// =============================================================================

const formatCurrency = (value: number, currency: string = 'USD'): string => {
    if (value >= 1000000) return `${currency} ${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${currency} ${(value / 1000).toFixed(0)}K`;
    return `${currency} ${value.toLocaleString()}`;
};

const formatPercent = (value: number): string => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const getTrendIcon = (direction?: TrendDirection) => {
    if (direction === 'up') return <TrendingUp size={14} className="text-emerald-500" />;
    if (direction === 'down') return <TrendingDown size={14} className="text-red-500" />;
    return <Minus size={14} className="text-gray-400" />;
};

const getRiskColor = (level: InvestorRiskLevel): string => {
    const colors: Record<InvestorRiskLevel, string> = {
        low: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
        moderate: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
        elevated: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
        high: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
        critical: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    };
    return colors[level];
};

const getHealthColor = (status: string): string => {
    const colors: Record<string, string> = {
        healthy: 'text-emerald-600 bg-emerald-100',
        stable: 'text-blue-600 bg-blue-100',
        cautionary: 'text-amber-600 bg-amber-100',
        concerning: 'text-orange-600 bg-orange-100',
        critical: 'text-red-600 bg-red-100',
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
};

// =============================================================================
// METRIC CARD COMPONENT
// =============================================================================

function MetricCard({
                        label,
                        value,
                        subtext,
                        icon: Icon,
                        trend,
                        trendValue,
                        color = 'blue',
                    }: {
    label: string;
    value: string;
    subtext?: string;
    icon: any;
    trend?: TrendDirection;
    trendValue?: number;
    color?: string;
}) {
    return (
        <Card variant="glass" padding="md">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                    {subtext && (
                        <div className="flex items-center gap-1.5 mt-1">
                            {trend && getTrendIcon(trend)}
                            <span className={`text-xs ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                                {trendValue !== undefined && formatPercent(trendValue)} {subtext}
                            </span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-xl bg-${color}-500/10`}>
                    <Icon className={`w-6 h-6 text-${color}-500`} />
                </div>
            </div>
        </Card>
    );
}

// =============================================================================
// SECTION HEADER
// =============================================================================

function SectionHeader({ title, icon: Icon, badge }: { title: string; icon: any; badge?: string }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-surface-800">
                <Icon size={20} className="text-gray-600 dark:text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            {badge && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {badge}
                </span>
            )}
        </div>
    );
}

// =============================================================================
// FINANCIAL PERFORMANCE SECTION
// =============================================================================

function FinancialPerformanceSection() {
    const { dashboard, selectedPeriod } = useInvestorStore();
    const revenue = dashboard?.revenue;
    const costs = dashboard?.costs;
    const margins = dashboard?.margins;

    if (!revenue || !costs || !margins) return null;

    return (
        <div className="space-y-4">
            <SectionHeader title="Financial Performance" icon={BarChart3} badge={selectedPeriod.toUpperCase()} />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Revenue YTD"
                    value={formatCurrency(revenue.ytd.value)}
                    subtext="vs prior year"
                    icon={DollarSign}
                    trend={revenue.ytd.changeDirection}
                    trendValue={revenue.ytd.changePercent}
                    color="emerald"
                />
                <MetricCard
                    label="Total Costs"
                    value={formatCurrency(costs.totalCosts.value)}
                    subtext="vs prior year"
                    icon={CreditCard}
                    trend={costs.totalCosts.changeDirection}
                    trendValue={costs.totalCosts.changePercent}
                    color="red"
                />
                <MetricCard
                    label="Gross Margin"
                    value={`${margins.grossMarginPercent.toFixed(1)}%`}
                    subtext={formatCurrency(margins.grossMargin.value)}
                    icon={PieChart}
                    color="blue"
                />
                <MetricCard
                    label="EBITDA"
                    value={formatCurrency(margins.ebitda?.value || 0)}
                    subtext={`${margins.ebitdaMarginPercent?.toFixed(1)}% margin`}
                    icon={TrendingUp}
                    color="purple"
                />
            </div>

            {/* Revenue Breakdown */}
            <Card variant="glass" padding="md">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Revenue Breakdown</h3>
                <div className="space-y-2">
                    {revenue.breakdown?.map((item) => (
                        <div key={item.category} className="flex items-center gap-3">
                            <div className="flex-1">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600 dark:text-gray-400">{item.category}</span>
                                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-surface-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                        style={{ width: `${item.percentOfTotal}%` }}
                                    />
                                </div>
                            </div>
                            <span className="text-xs text-gray-500 w-12 text-right">{item.percentOfTotal.toFixed(1)}%</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

// =============================================================================
// FINANCIAL POSITION SECTION
// =============================================================================

function FinancialPositionSection() {
    const { dashboard } = useInvestorStore();
    const cashPosition = dashboard?.cashPosition;
    const liabilities = dashboard?.liabilities;
    const workingCapital = dashboard?.workingCapital;

    if (!cashPosition || !liabilities || !workingCapital) return null;

    return (
        <div className="space-y-4">
            <SectionHeader title="Financial Position" icon={Landmark} />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Cash & Equivalents"
                    value={formatCurrency(cashPosition.cashAndEquivalents.value)}
                    subtext="total liquid"
                    icon={Wallet}
                    trend={cashPosition.cashAndEquivalents.changeDirection}
                    trendValue={cashPosition.cashAndEquivalents.changePercent}
                    color="emerald"
                />
                <MetricCard
                    label="Total Liabilities"
                    value={formatCurrency(liabilities.totalLiabilities.value)}
                    subtext="all obligations"
                    icon={Scale}
                    color="amber"
                />
                <MetricCard
                    label="Working Capital"
                    value={formatCurrency(workingCapital.netWorkingCapital.value)}
                    subtext={`${workingCapital.workingCapitalRatio.toFixed(1)}x ratio`}
                    icon={Activity}
                    color="blue"
                />
                <MetricCard
                    label="Current Ratio"
                    value={`${liabilities.currentRatio?.toFixed(2)}x`}
                    subtext="liquidity measure"
                    icon={Gauge}
                    color="purple"
                />
            </div>

            {/* Cash Accounts */}
            <Card variant="glass" padding="md">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Cash Accounts</h3>
                <div className="space-y-2">
                    {cashPosition.bankAccounts?.map((account) => (
                        <div key={account.name} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-surface-700 last:border-0">
                            <div className="flex items-center gap-2">
                                <Banknote size={16} className={account.isRestricted ? 'text-amber-500' : 'text-emerald-500'} />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{account.name}</span>
                                {account.isRestricted && (
                                    <span className="px-1.5 py-0.5 text-xs rounded bg-amber-100 text-amber-700">Restricted</span>
                                )}
                            </div>
                            <span className="font-medium">{account.currency} {account.balance.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

// =============================================================================
// BURN & RUNWAY SECTION
// =============================================================================

function BurnRunwaySection() {
    const { dashboard } = useInvestorStore();
    const burn = dashboard?.burn;
    const runway = dashboard?.runway;

    if (!burn || !runway) return null;

    const primaryScenario = runway.scenarios.find((s) => s.type === runway.primaryScenario);

    return (
        <div className="space-y-4">
            <SectionHeader title="Cash Burn & Runway" icon={Clock} />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Monthly Burn"
                    value={formatCurrency(burn.currentMonthlyBurn.value)}
                    subtext="current month"
                    icon={TrendingDown}
                    trend={burn.burnTrend}
                    trendValue={burn.burnTrendPercent}
                    color="red"
                />
                <MetricCard
                    label="3-Month Avg"
                    value={formatCurrency(burn.rollingAverage3Month.value)}
                    subtext="rolling average"
                    icon={BarChart3}
                    color="amber"
                />
                <MetricCard
                    label="Cash Runway"
                    value={`${primaryScenario?.runwayMonths.toFixed(1)} mo`}
                    subtext={`${runway.primaryScenario} case`}
                    icon={Target}
                    color="blue"
                />
                <MetricCard
                    label="Runway End"
                    value={primaryScenario?.runwayEndDate.split('-').slice(0, 2).join('-') || '—'}
                    subtext={`${primaryScenario?.confidenceLevel}% confidence`}
                    icon={Calendar}
                    color="purple"
                />
            </div>

            {/* Scenario Analysis */}
            <Card variant="glass" padding="md">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Runway Scenarios</h3>
                <div className="grid grid-cols-3 gap-4">
                    {runway.scenarios.map((scenario) => (
                        <div
                            key={scenario.type}
                            className={`p-4 rounded-xl border-2 ${
                                scenario.type === runway.primaryScenario
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-surface-700'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 capitalize">{scenario.type}</span>
                                {scenario.type === runway.primaryScenario && (
                                    <span className="px-1.5 py-0.5 text-xs rounded bg-blue-500 text-white">Primary</span>
                                )}
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{scenario.runwayMonths.toFixed(1)} mo</p>
                            <p className="text-xs text-gray-500 mt-1">{formatCurrency(scenario.monthlyBurnRate)}/mo burn</p>
                            <p className="text-xs text-gray-500">{scenario.confidenceLevel}% confidence</p>
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-surface-700">
                                <p className="text-xs text-gray-500">Assumptions:</p>
                                <ul className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-0.5">
                                    {scenario.assumptions.slice(0, 2).map((a, i) => (
                                        <li key={i}>• {a}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>

                {runway.warnings && runway.warnings.length > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-2">
                            <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">Important Notes</p>
                                <ul className="text-xs text-amber-700 dark:text-amber-500 mt-1 space-y-0.5">
                                    {runway.warnings.map((w, i) => (
                                        <li key={i}>• {w}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

// =============================================================================
// RISK INDICATORS SECTION
// =============================================================================

function RiskIndicatorsSection() {
    const { dashboard } = useInvestorStore();
    const risks = dashboard?.risks;

    if (!risks) return null;

    return (
        <div className="space-y-4">
            <SectionHeader title="Risk Indicators" icon={AlertTriangle} />

            {/* Overall Risk */}
            <Card variant="glass" padding="md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Risk Overview</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(risks.overallRiskLevel)}`}>
                        {risks.overallRiskLevel.toUpperCase()} RISK
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-surface-800">
                        <p className="text-xs text-gray-500 mb-1">Liquidity Risk</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskColor(risks.liquidityRisk)}`}>
                            {risks.liquidityRisk}
                        </span>
                    </div>
                    {risks.concentrationRisks.slice(0, 3).map((risk) => (
                        <div key={risk.type} className="p-3 rounded-lg bg-gray-50 dark:bg-surface-800">
                            <p className="text-xs text-gray-500 mb-1 capitalize">{risk.type} Concentration</p>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskColor(risk.riskLevel)}`}>
                                    {risk.riskLevel}
                                </span>
                                <span className="text-xs text-gray-600">{risk.concentrationPercent}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Concentration Details */}
            <Card variant="glass" padding="md">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Concentration Analysis</h3>
                <div className="space-y-4">
                    {risks.concentrationRisks.map((risk) => (
                        <div key={risk.type} className="pb-3 border-b border-gray-100 dark:border-surface-700 last:border-0">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium capitalize">{risk.type}</span>
                                <span className={`px-2 py-0.5 rounded text-xs ${getRiskColor(risk.riskLevel)}`}>{risk.riskLevel}</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">{risk.description}</p>
                            {risk.topItems && (
                                <div className="flex flex-wrap gap-2">
                                    {risk.topItems.map((item) => (
                                        <span key={item.name} className="px-2 py-1 text-xs bg-gray-100 dark:bg-surface-700 rounded">
                                            {item.name}: {item.percent}%
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

// =============================================================================
// BOARD SUMMARY SECTION
// =============================================================================

// =============================================================================
// BOARD SUMMARY SECTION
// =============================================================================

function BoardSummarySection() {
    const { dashboard } = useInvestorStore();
    const boardSummary = dashboard?.boardSummary;
    const revenue = dashboard?.revenue;
    const burn = dashboard?.burn;
    const runway = dashboard?.runway;
    const risks = dashboard?.risks;
    const compliance = dashboard?.compliance;
    const [exportFormat, setExportFormat] = useState<'pdf' | 'docx' | 'csv' | 'xml'>('pdf');
    const [isExporting, setIsExporting] = useState(false);

    if (!boardSummary || !revenue || !burn || !runway || !risks || !compliance) return null;

    const getImpactIcon = (impact: MaterialChange['impact']) => {
        if (impact === 'positive') return <ArrowUpRight size={14} className="text-emerald-500" />;
        if (impact === 'negative') return <ArrowDownRight size={14} className="text-red-500" />;
        return <Minus size={14} className="text-gray-400" />;
    };

    const handleExport = async () => {
        setIsExporting(true);

        // Dynamically import to avoid SSR issues
        const { exportDocument } = await import('@/lib/export-utils');

        const exportData = {
            title: 'Board Executive Summary',
            subtitle: `${dashboard.organizationName} - Financial Overview`,
            generatedAt: new Date().toLocaleString(),
            metadata: {
                organization: dashboard.organizationName,
                currency: dashboard.reportingCurrency,
                fiscalYearEnd: dashboard.fiscalYearEnd,
                healthStatus: boardSummary.financialHealthStatus,
            },
            sections: [
                {
                    title: 'Financial Health',
                    type: 'keyValue' as const,
                    content: [
                        { key: 'Status', value: boardSummary.financialHealthStatus.toUpperCase() },
                        { key: 'As Of Date', value: boardSummary.asOfDate },
                        { key: 'Period', value: boardSummary.periodCovered },
                    ],
                },
                {
                    title: 'Key Highlights',
                    type: 'list' as const,
                    content: boardSummary.keyHighlights,
                },
                {
                    title: 'Financial Metrics',
                    type: 'table' as const,
                    content: {
                        headers: ['Metric', 'Value', 'Change'],
                        rows: [
                            ['Revenue YTD', formatCurrency(revenue.ytd.value), formatPercent(revenue.ytd.changePercent || 0)],
                            ['EBITDA', formatCurrency(dashboard.margins.ebitda?.value || 0), `${dashboard.margins.ebitdaMarginPercent?.toFixed(1)}% margin`],
                            ['Monthly Burn', formatCurrency(burn.currentMonthlyBurn.value), formatPercent(burn.burnTrendPercent)],
                            ['Cash Runway', `${runway.scenarios.find(s => s.type === runway.primaryScenario)?.runwayMonths.toFixed(1)} months`, runway.primaryScenario],
                        ],
                    },
                },
                {
                    title: 'Material Changes',
                    type: 'table' as const,
                    content: {
                        headers: ['Category', 'Description', 'Impact', 'Change %'],
                        rows: boardSummary.materialChanges.map((change) => [
                            change.category,
                            change.description,
                            change.impact,
                            change.changePercent ? `${change.changePercent.toFixed(1)}%` : 'N/A',
                        ]),
                    },
                },
                {
                    title: 'Liquidity Status',
                    type: 'text' as const,
                    content: boardSummary.liquidityStatus,
                },
                {
                    title: 'Sustainability Outlook',
                    type: 'text' as const,
                    content: boardSummary.sustainabilityOutlook,
                },
                {
                    title: 'Risk Factors',
                    type: 'list' as const,
                    content: boardSummary.riskFactors,
                },
                {
                    title: 'Risk Summary',
                    type: 'keyValue' as const,
                    content: [
                        { key: 'Overall Risk Level', value: risks.overallRiskLevel },
                        { key: 'Liquidity Risk', value: risks.liquidityRisk },
                        ...risks.concentrationRisks.map((r) => ({
                            key: `${r.type.charAt(0).toUpperCase() + r.type.slice(1)} Concentration`,
                            value: `${r.concentrationPercent}% (${r.riskLevel})`,
                        })),
                    ],
                },
                {
                    title: 'Data Quality & Compliance',
                    type: 'keyValue' as const,
                    content: [
                        { key: 'Data Completeness', value: `${compliance.dataCompletenessPercent}%` },
                        { key: 'Reconciliation Coverage', value: `${compliance.reconciliationCoverage}%` },
                        { key: 'Audit Trail', value: compliance.auditTrailAvailable ? 'Available' : 'Unavailable' },
                        { key: 'Last Reconciliation', value: compliance.lastReconciliationDate || 'N/A' },
                    ],
                },
                {
                    title: 'Data Limitations',
                    type: 'list' as const,
                    content: boardSummary.dataLimitations,
                },
            ],
        };

        await exportDocument(exportData, exportFormat, 'board-summary');
        setIsExporting(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <SectionHeader title="Board Summary" icon={FileText} />
                <div className="flex items-center gap-2">
                    <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value as any)}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                    >
                        <option value="pdf">PDF</option>
                        <option value="docx">Word (.docx)</option>
                        <option value="csv">CSV</option>
                        <option value="xml">XML</option>
                    </select>
                    <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Download size={16} className={isExporting ? 'animate-pulse' : ''} />}
                        onClick={handleExport}
                        disabled={isExporting}
                    >
                        {isExporting ? 'Exporting...' : 'Export'}
                    </Button>
                </div>
            </div>

            {/* Rest of the BoardSummarySection content remains the same... */}
            {/* Health Status */}
            <Card variant="glass" padding="lg">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Financial Health Status</p>
                        <div className="flex items-center gap-3 mt-1">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getHealthColor(boardSummary.financialHealthStatus)}`}>
                                {boardSummary.financialHealthStatus.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-500">as of {boardSummary.asOfDate}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Period Covered</p>
                        <p className="font-medium">{boardSummary.periodCovered}</p>
                    </div>
                </div>

                {/* Key Highlights */}
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Key Highlights</h4>
                    <ul className="space-y-2">
                        {boardSummary.keyHighlights.map((highlight, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                {highlight}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Material Changes */}
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Material Changes</h4>
                    <div className="space-y-3">
                        {boardSummary.materialChanges.map((change, i) => (
                            <div key={i} className="p-3 bg-gray-50 dark:bg-surface-800 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        {getImpactIcon(change.impact)}
                                        <span className="font-medium text-sm">{change.category}</span>
                                        <span className={`px-1.5 py-0.5 text-xs rounded ${
                                            change.magnitude === 'material' || change.magnitude === 'significant'
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {change.magnitude}
                                        </span>
                                    </div>
                                    {change.changePercent && (
                                        <span className={`text-sm font-medium ${change.impact === 'positive' ? 'text-emerald-600' : change.impact === 'negative' ? 'text-red-600' : 'text-gray-600'}`}>
                                            {formatPercent(change.changePercent)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{change.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Liquidity & Sustainability */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-2">Liquidity Status</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">{boardSummary.liquidityStatus}</p>
                    </div>
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                        <h4 className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-2">Sustainability Outlook</h4>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">{boardSummary.sustainabilityOutlook}</p>
                    </div>
                </div>

                {/* Risk Factors */}
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Risk Factors</h4>
                    <ul className="space-y-2">
                        {boardSummary.riskFactors.map((risk, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                {risk}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Data Limitations */}
                {boardSummary.dataLimitations.length > 0 && (
                    <div className="p-3 bg-gray-100 dark:bg-surface-800 rounded-lg">
                        <div className="flex items-start gap-2">
                            <Info size={16} className="text-gray-500 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Data Limitations</p>
                                <ul className="text-xs text-gray-500 mt-1 space-y-0.5">
                                    {boardSummary.dataLimitations.map((l, i) => (
                                        <li key={i}>• {l}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
// =============================================================================
// COMPLIANCE SECTION
// =============================================================================

function ComplianceSection() {
    const { dashboard } = useInvestorStore();
    const compliance = dashboard?.compliance;

    if (!compliance) return null;

    return (
        <div className="space-y-4">
            <SectionHeader title="Compliance & Audit Signals" icon={Shield} />

            <Card variant="glass" padding="md">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">Data Completeness</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{compliance.dataCompletenessPercent}%</p>
                        <div className="h-2 bg-gray-200 dark:bg-surface-700 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${compliance.dataCompletenessPercent}%` }} />
                        </div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">Reconciliation Coverage</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{compliance.reconciliationCoverage}%</p>
                        <div className="h-2 bg-gray-200 dark:bg-surface-700 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${compliance.reconciliationCoverage}%` }} />
                        </div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">Audit Trail</p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            {compliance.auditTrailAvailable ? (
                                <CheckCircle2 size={24} className="text-emerald-500" />
                            ) : (
                                <XCircle size={24} className="text-red-500" />
                            )}
                            <span className="text-lg font-semibold">{compliance.auditTrailAvailable ? 'Available' : 'Unavailable'}</span>
                        </div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">Last Reconciliation</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{compliance.lastReconciliationDate || '—'}</p>
                        <p className="text-xs text-gray-500 mt-1">{compliance.pendingReconciliations} pending</p>
                    </div>
                </div>

                {compliance.knownDataGaps.length > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-2">
                            <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">Known Data Gaps</p>
                                <ul className="text-xs text-amber-700 dark:text-amber-500 mt-1 space-y-0.5">
                                    {compliance.knownDataGaps.map((gap, i) => (
                                        <li key={i}>• {gap}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function InvestorPage() {
    const { t } = useThemeStore();
    const { dashboard, selectedPeriod, setSelectedPeriod, refreshDashboard, isLoading, lastRefresh } = useInvestorStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'burn' | 'risk' | 'summary'>('overview');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/10 border border-blue-500/20">
                            <Shield className="w-6 h-6 text-blue-500" />
                        </div>
                        Investor & Board View
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Executive governance and financial oversight dashboard</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Read-only Badge */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Lock size={14} className="text-blue-600" />
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Read-Only Access</span>
                    </div>

                    {/* Period Selector */}
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value as any)}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800"
                    >
                        {REPORTING_PERIODS.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>

                    {/* Refresh */}
                    <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />} onClick={refreshDashboard} disabled={isLoading}>
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Last Updated Banner */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-surface-800 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock size={14} />
                    <span>Last data refresh: {new Date(lastRefresh).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        dashboard?.dataQualityOverall === 'complete' ? 'bg-emerald-100 text-emerald-700' :
                            dashboard?.dataQualityOverall === 'partial' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                    }`}>
                        Data: {dashboard?.dataQualityOverall}
                    </span>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-surface-800 rounded-xl">
                {[
                    { id: 'overview', label: 'Financial Overview', icon: BarChart3 },
                    { id: 'burn', label: 'Burn & Runway', icon: Clock },
                    { id: 'risk', label: 'Risk Analysis', icon: AlertTriangle },
                    { id: 'summary', label: 'Board Summary', icon: FileText },
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                                activeTab === tab.id
                                    ? 'bg-white dark:bg-surface-900 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                            }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
            >
                {activeTab === 'overview' && (
                    <>
                        <FinancialPerformanceSection />
                        <FinancialPositionSection />
                        <ComplianceSection />
                    </>
                )}

                {activeTab === 'burn' && <BurnRunwaySection />}

                {activeTab === 'risk' && <RiskIndicatorsSection />}

                {activeTab === 'summary' && <BoardSummarySection />}
            </motion.div>

            {/* Disclaimers */}
            <Card variant="glass" padding="sm">
                <div className="flex items-start gap-2">
                    <Info size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-500">
                        {dashboard?.disclaimers[0]} This dashboard provides read-only access and does not support data modification.
                    </p>
                </div>
            </Card>
        </div>
    );
}