'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui';
import { useStore } from '@/index';
import {
  ChartPieIcon,
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  PrinterIcon,
  EnvelopeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';

type ReportType = 'profit-loss' | 'balance-sheet' | 'cash-flow' | 'tax-summary';

const reportConfigs = {
  'profit-loss': {
    title: 'Profit & Loss Statement',
    icon: ArrowTrendingUpIcon,
    color: 'from-emerald-500/20 to-green-600/10 border-emerald-500/30',
    iconColor: 'text-emerald-400',
  },
  'balance-sheet': {
    title: 'Balance Sheet',
    icon: ScaleIcon,
    color: 'from-violet-500/20 to-purple-600/10 border-violet-500/30',
    iconColor: 'text-violet-400',
  },
  'cash-flow': {
    title: 'Cash Flow Statement',
    icon: BanknotesIcon,
    color: 'from-sky-500/20 to-blue-600/10 border-sky-500/30',
    iconColor: 'text-sky-400',
  },
  'tax-summary': {
    title: 'Tax Summary Report',
    icon: DocumentChartBarIcon,
    color: 'from-amber-500/20 to-orange-600/10 border-amber-500/30',
    iconColor: 'text-amber-400',
  },
};

export default function ReportsPage() {
  const { metrics } = useStore();
  const [activeReport, setActiveReport] = useState<ReportType>('profit-loss');
  const [dateRange, setDateRange] = useState('ytd');
  const [comparePeriod, setComparePeriod] = useState(false);

  const config = reportConfigs[activeReport];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-600/10 border border-rose-500/20">
              <ChartPieIcon className="w-6 h-6 text-rose-400" />
            </div>
            Financial Reports
          </h1>
          <p className="text-gray-400 mt-1">Generate and analyze your financial statements</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium text-white transition-colors"
          >
            <PrinterIcon className="w-5 h-5" />
            Print
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-medium text-white shadow-lg shadow-emerald-500/25"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Export PDF
          </motion.button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-4 gap-4">
        {(Object.keys(reportConfigs) as ReportType[]).map((type) => {
          const cfg = reportConfigs[type];
          const Icon = cfg.icon;
          return (
            <motion.button
              key={type}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveReport(type)}
              className={`p-4 rounded-xl border transition-all text-left ${
                activeReport === type
                  ? `bg-gradient-to-br ${cfg.color} ring-2 ring-white/20`
                  : 'bg-white/[0.02] border-white/5 hover:border-white/10'
              }`}
            >
              <Icon className={`w-6 h-6 ${cfg.iconColor} mb-3`} />
              <p className="font-medium text-white">{cfg.title}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Date Range & Options */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-400">Period:</span>
            </div>
            <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
              {[
                { value: 'mtd', label: 'MTD' },
                { value: 'qtd', label: 'QTD' },
                { value: 'ytd', label: 'YTD' },
                { value: 'custom', label: 'Custom' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDateRange(option.value)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    dateRange === option.value
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={comparePeriod}
              onChange={(e) => setComparePeriod(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/50"
            />
            <span className="text-sm text-gray-400">Compare to previous period</span>
          </label>
        </div>
      </Card>

      {/* Report Content */}
      <motion.div
        key={activeReport}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {activeReport === 'profit-loss' && (
          <Card>
            <div className="border-b border-white/5 pb-4 mb-6">
              <h2 className="text-xl font-bold text-white">Profit & Loss Statement</h2>
              <p className="text-sm text-gray-400">January 1 - December 31, 2024</p>
            </div>

            <div className="space-y-6">
              {/* Revenue Section */}
              <div>
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">Revenue</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Product Sales</span>
                    <span className="font-mono text-white">$98,500.00</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Service Revenue</span>
                    <span className="font-mono text-white">$45,000.00</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Consulting Fees</span>
                    <span className="font-mono text-white">$12,500.00</span>
                  </div>
                  <div className="flex justify-between py-3 bg-emerald-500/5 rounded-lg px-3 -mx-3">
                    <span className="font-semibold text-emerald-400">Total Revenue</span>
                    <span className="font-mono font-bold text-emerald-400">$156,000.00</span>
                  </div>
                </div>
              </div>

              {/* Cost of Goods */}
              <div>
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">Cost of Goods Sold</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Direct Materials</span>
                    <span className="font-mono text-white">$28,000.00</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Direct Labor</span>
                    <span className="font-mono text-white">$15,680.00</span>
                  </div>
                  <div className="flex justify-between py-3 bg-amber-500/5 rounded-lg px-3 -mx-3">
                    <span className="font-semibold text-amber-400">Total COGS</span>
                    <span className="font-mono font-bold text-amber-400">$43,680.00</span>
                  </div>
                </div>
              </div>

              {/* Gross Profit */}
              <div className="flex justify-between py-4 bg-white/5 rounded-xl px-4 -mx-4">
                <span className="text-lg font-bold text-white">Gross Profit</span>
                <div className="text-right">
                  <span className="font-mono text-xl font-bold text-white">$112,320.00</span>
                  <p className="text-xs text-emerald-400">72.0% margin</p>
                </div>
              </div>

              {/* Operating Expenses */}
              <div>
                <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-3">Operating Expenses</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Salaries & Wages</span>
                    <span className="font-mono text-white">$24,000.00</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Rent & Utilities</span>
                    <span className="font-mono text-white">$8,400.00</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Software & Subscriptions</span>
                    <span className="font-mono text-white">$4,200.00</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Marketing & Advertising</span>
                    <span className="font-mono text-white">$6,800.00</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Professional Services</span>
                    <span className="font-mono text-white">$1,920.00</span>
                  </div>
                  <div className="flex justify-between py-3 bg-rose-500/5 rounded-lg px-3 -mx-3">
                    <span className="font-semibold text-rose-400">Total Operating Expenses</span>
                    <span className="font-mono font-bold text-rose-400">$45,320.00</span>
                  </div>
                </div>
              </div>

              {/* Net Income */}
              <div className="flex justify-between py-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl px-6 -mx-4 border border-emerald-500/20">
                <div>
                  <span className="text-xl font-bold text-white">Net Income</span>
                  <p className="text-sm text-gray-400">Before taxes</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-3xl font-bold text-emerald-400">$67,000.00</span>
                  <p className="text-sm text-emerald-400">+23.4% vs last year</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeReport === 'balance-sheet' && (
          <Card>
            <div className="border-b border-white/5 pb-4 mb-6">
              <h2 className="text-xl font-bold text-white">Balance Sheet</h2>
              <p className="text-sm text-gray-400">As of December 31, 2024</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Assets */}
              <div className="space-y-6">
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Assets</h3>
                
                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-2">Current Assets</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-300">Cash & Equivalents</span>
                      <span className="font-mono text-white">$85,000</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-300">Accounts Receivable</span>
                      <span className="font-mono text-white">$42,000</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-300">Crypto Holdings</span>
                      <span className="font-mono text-white">$45,000</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-300">Inventory</span>
                      <span className="font-mono text-white">$18,000</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-2">Non-Current Assets</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-300">Property & Equipment</span>
                      <span className="font-mono text-white">$45,000</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-300">Intangible Assets</span>
                      <span className="font-mono text-white">$10,000</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between py-3 bg-emerald-500/10 rounded-lg px-3">
                  <span className="font-semibold text-emerald-400">Total Assets</span>
                  <span className="font-mono font-bold text-emerald-400">$245,000</span>
                </div>
              </div>

              {/* Liabilities & Equity */}
              <div className="space-y-6">
                <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider">Liabilities & Equity</h3>
                
                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-2">Current Liabilities</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-300">Accounts Payable</span>
                      <span className="font-mono text-white">$12,000</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-300">Accrued Expenses</span>
                      <span className="font-mono text-white">$8,000</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-300">Short-term Debt</span>
                      <span className="font-mono text-white">$15,000</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between py-3 bg-rose-500/10 rounded-lg px-3">
                  <span className="font-semibold text-rose-400">Total Liabilities</span>
                  <span className="font-mono font-bold text-rose-400">$35,000</span>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-2">Shareholders' Equity</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-300">Common Stock</span>
                      <span className="font-mono text-white">$100,000</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-300">Retained Earnings</span>
                      <span className="font-mono text-white">$110,000</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between py-3 bg-violet-500/10 rounded-lg px-3">
                  <span className="font-semibold text-violet-400">Total Equity</span>
                  <span className="font-mono font-bold text-violet-400">$210,000</span>
                </div>

                <div className="flex justify-between py-3 bg-white/5 rounded-lg px-3">
                  <span className="font-semibold text-white">Total Liabilities & Equity</span>
                  <span className="font-mono font-bold text-white">$245,000</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeReport === 'cash-flow' && (
          <Card>
            <div className="border-b border-white/5 pb-4 mb-6">
              <h2 className="text-xl font-bold text-white">Cash Flow Statement</h2>
              <p className="text-sm text-gray-400">For the Year Ended December 31, 2024</p>
            </div>

            <div className="space-y-6">
              {/* Operating Activities */}
              <div>
                <h3 className="text-sm font-semibold text-sky-400 uppercase tracking-wider mb-3">Operating Activities</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Net Income</span>
                    <span className="font-mono text-white">$67,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Depreciation</span>
                    <span className="font-mono text-white">$5,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Changes in Working Capital</span>
                    <span className="font-mono text-rose-400">($8,500)</span>
                  </div>
                  <div className="flex justify-between py-3 bg-sky-500/10 rounded-lg px-3 -mx-3">
                    <span className="font-semibold text-sky-400">Net Cash from Operations</span>
                    <span className="font-mono font-bold text-sky-400">$63,500</span>
                  </div>
                </div>
              </div>

              {/* Investing Activities */}
              <div>
                <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-3">Investing Activities</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Purchase of Equipment</span>
                    <span className="font-mono text-rose-400">($15,000)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Crypto Asset Purchases</span>
                    <span className="font-mono text-rose-400">($30,000)</span>
                  </div>
                  <div className="flex justify-between py-3 bg-violet-500/10 rounded-lg px-3 -mx-3">
                    <span className="font-semibold text-violet-400">Net Cash from Investing</span>
                    <span className="font-mono font-bold text-violet-400">($45,000)</span>
                  </div>
                </div>
              </div>

              {/* Financing Activities */}
              <div>
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">Financing Activities</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Loan Proceeds</span>
                    <span className="font-mono text-white">$20,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Loan Repayments</span>
                    <span className="font-mono text-rose-400">($5,000)</span>
                  </div>
                  <div className="flex justify-between py-3 bg-amber-500/10 rounded-lg px-3 -mx-3">
                    <span className="font-semibold text-amber-400">Net Cash from Financing</span>
                    <span className="font-mono font-bold text-amber-400">$15,000</span>
                  </div>
                </div>
              </div>

              {/* Net Change */}
              <div className="flex justify-between py-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl px-6 -mx-4 border border-emerald-500/20">
                <div>
                  <span className="text-xl font-bold text-white">Net Change in Cash</span>
                  <p className="text-sm text-gray-400">Beginning Balance: $51,500</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-3xl font-bold text-emerald-400">$33,500</span>
                  <p className="text-sm text-gray-400">Ending Balance: $85,000</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeReport === 'tax-summary' && (
          <Card>
            <div className="border-b border-white/5 pb-4 mb-6">
              <h2 className="text-xl font-bold text-white">Tax Summary Report</h2>
              <p className="text-sm text-gray-400">Tax Year 2024</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Income Summary */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Income Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Gross Revenue</span>
                    <span className="font-mono text-white">$156,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Crypto Gains (Short-term)</span>
                    <span className="font-mono text-white">$8,500</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Crypto Gains (Long-term)</span>
                    <span className="font-mono text-white">$12,000</span>
                  </div>
                  <div className="flex justify-between py-3 bg-emerald-500/10 rounded-lg px-3">
                    <span className="font-semibold text-emerald-400">Total Taxable Income</span>
                    <span className="font-mono font-bold text-emerald-400">$176,500</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-sky-400 uppercase tracking-wider">Deductions</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Business Expenses</span>
                    <span className="font-mono text-white">$45,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Depreciation</span>
                    <span className="font-mono text-white">$5,000</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-300">Crypto Losses</span>
                    <span className="font-mono text-white">$3,200</span>
                  </div>
                  <div className="flex justify-between py-3 bg-sky-500/10 rounded-lg px-3">
                    <span className="font-semibold text-sky-400">Total Deductions</span>
                    <span className="font-mono font-bold text-sky-400">$53,200</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Estimate */}
            <div className="mt-8 p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Estimated Tax Liability</h3>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">
                  Preliminary Estimate
                </span>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Federal Tax</p>
                  <p className="text-2xl font-bold font-mono text-white">$24,660</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">State Tax (CA)</p>
                  <p className="text-2xl font-bold font-mono text-white">$9,264</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Self-Employment</p>
                  <p className="text-2xl font-bold font-mono text-white">$8,478</p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-amber-500/20">
                <span className="text-lg font-semibold text-amber-400">Total Estimated Taxes</span>
                <span className="text-3xl font-bold font-mono text-amber-400">$42,402</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-6">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-medium text-white">
                <ArrowDownTrayIcon className="w-5 h-5" />
                Export Tax Package
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-gray-300 transition-colors">
                <EnvelopeIcon className="w-5 h-5" />
                Send to Accountant
              </button>
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
