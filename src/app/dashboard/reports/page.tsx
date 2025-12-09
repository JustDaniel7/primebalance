'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui';
import { useStore } from '@/store';
import toast from 'react-hot-toast';
import {
  ChartPieIcon,
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  PrinterIcon,
  EnvelopeIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';

type ReportType = 'profit-loss' | 'balance-sheet' | 'cash-flow' | 'tax-summary';

const reportConfigs = {
  'profit-loss': { title: 'Profit & Loss Statement', icon: ArrowTrendingUpIcon, color: 'from-emerald-500/20 to-green-600/10 border-emerald-500/30', iconColor: 'text-emerald-400' },
  'balance-sheet': { title: 'Balance Sheet', icon: ScaleIcon, color: 'from-violet-500/20 to-purple-600/10 border-violet-500/30', iconColor: 'text-violet-400' },
  'cash-flow': { title: 'Cash Flow Statement', icon: BanknotesIcon, color: 'from-sky-500/20 to-blue-600/10 border-sky-500/30', iconColor: 'text-sky-400' },
  'tax-summary': { title: 'Tax Summary Report', icon: DocumentChartBarIcon, color: 'from-amber-500/20 to-orange-600/10 border-amber-500/30', iconColor: 'text-amber-400' },
};

export default function ReportsPage() {
  const { metrics } = useStore();
  const [activeReport, setActiveReport] = useState<ReportType>('profit-loss');
  const [dateRange, setDateRange] = useState('ytd');
  const [comparePeriod, setComparePeriod] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const config = reportConfigs[activeReport];

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    toast.loading('Generating PDF...', { id: 'export' });

    try {
      // Create a simple text-based export since we can't use complex PDF libraries client-side
      const reportContent = generateReportText();
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeReport}-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully', { id: 'export' });
    } catch (error) {
      toast.error('Export failed', { id: 'export' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent = generateCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeReport}-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const generateReportText = () => {
    const date = new Date().toLocaleDateString();
    let content = `${config.title}\nGenerated: ${date}\nPeriod: ${dateRange.toUpperCase()}\n${'='.repeat(50)}\n\n`;

    if (activeReport === 'profit-loss') {
      content += `REVENUE\n`;
      content += `Product Sales: $98,500.00\n`;
      content += `Service Revenue: $45,000.00\n`;
      content += `Consulting Fees: $12,500.00\n`;
      content += `Total Revenue: $156,000.00\n\n`;
      content += `COST OF GOODS SOLD\n`;
      content += `Direct Materials: $28,000.00\n`;
      content += `Direct Labor: $15,680.00\n`;
      content += `Total COGS: $43,680.00\n\n`;
      content += `GROSS PROFIT: $112,320.00 (72.0% margin)\n\n`;
      content += `OPERATING EXPENSES\n`;
      content += `Salaries & Wages: $24,000.00\n`;
      content += `Rent & Utilities: $8,400.00\n`;
      content += `Software & Subscriptions: $4,200.00\n`;
      content += `Marketing & Advertising: $6,800.00\n`;
      content += `Professional Services: $1,920.00\n`;
      content += `Total Operating Expenses: $45,320.00\n\n`;
      content += `NET INCOME: $67,000.00\n`;
    } else if (activeReport === 'balance-sheet') {
      content += `ASSETS\n`;
      content += `Cash & Equivalents: $85,000\n`;
      content += `Accounts Receivable: $42,000\n`;
      content += `Crypto Holdings: $45,000\n`;
      content += `Inventory: $18,000\n`;
      content += `Property & Equipment: $45,000\n`;
      content += `Intangible Assets: $10,000\n`;
      content += `Total Assets: $245,000\n\n`;
      content += `LIABILITIES\n`;
      content += `Accounts Payable: $12,000\n`;
      content += `Accrued Expenses: $8,000\n`;
      content += `Short-term Debt: $15,000\n`;
      content += `Total Liabilities: $35,000\n\n`;
      content += `EQUITY\n`;
      content += `Common Stock: $100,000\n`;
      content += `Retained Earnings: $110,000\n`;
      content += `Total Equity: $210,000\n`;
    }

    return content;
  };

  const generateCSVContent = () => {
    let csv = 'Category,Item,Amount\n';
    
    if (activeReport === 'profit-loss') {
      csv += 'Revenue,Product Sales,98500\n';
      csv += 'Revenue,Service Revenue,45000\n';
      csv += 'Revenue,Consulting Fees,12500\n';
      csv += 'COGS,Direct Materials,28000\n';
      csv += 'COGS,Direct Labor,15680\n';
      csv += 'Expenses,Salaries & Wages,24000\n';
      csv += 'Expenses,Rent & Utilities,8400\n';
      csv += 'Expenses,Software,4200\n';
      csv += 'Expenses,Marketing,6800\n';
      csv += 'Expenses,Professional Services,1920\n';
    } else if (activeReport === 'balance-sheet') {
      csv += 'Assets,Cash & Equivalents,85000\n';
      csv += 'Assets,Accounts Receivable,42000\n';
      csv += 'Assets,Crypto Holdings,45000\n';
      csv += 'Liabilities,Accounts Payable,12000\n';
      csv += 'Liabilities,Short-term Debt,15000\n';
      csv += 'Equity,Common Stock,100000\n';
      csv += 'Equity,Retained Earnings,110000\n';
    }

    return csv;
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`${config.title} - ${new Date().toLocaleDateString()}`);
    const body = encodeURIComponent(`Please find attached the ${config.title} for your review.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    toast.success('Email client opened');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-600/10 border border-rose-500/20">
              <ChartPieIcon className="w-6 h-6 text-rose-400" />
            </div>
            Financial Reports
          </h1>
          <p className="text-gray-400 mt-1">Generate and analyze your financial statements</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium text-white transition-colors"
          >
            <PrinterIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Print</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium text-white transition-colors"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span className="hidden sm:inline">CSV</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-medium text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
          </motion.button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {(Object.keys(reportConfigs) as ReportType[]).map((type) => {
          const cfg = reportConfigs[type];
          const Icon = cfg.icon;
          return (
            <motion.button
              key={type}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveReport(type)}
              className={`p-3 sm:p-4 rounded-xl border transition-all text-left ${
                activeReport === type
                  ? `bg-gradient-to-br ${cfg.color} ring-2 ring-white/20`
                  : 'bg-white/[0.02] border-white/5 hover:border-white/10'
              }`}
            >
              <Icon className={`w-5 sm:w-6 h-5 sm:h-6 ${cfg.iconColor} mb-2 sm:mb-3`} />
              <p className="font-medium text-white text-sm sm:text-base truncate">{cfg.title}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Date Range & Options */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-400">Period:</span>
            </div>
            <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg overflow-x-auto">
              {[
                { value: 'mtd', label: 'MTD' },
                { value: 'qtd', label: 'QTD' },
                { value: 'ytd', label: 'YTD' },
                { value: 'custom', label: 'Custom' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDateRange(option.value)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
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
        ref={reportRef}
        key={activeReport}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="print:bg-white print:text-black"
      >
        {activeReport === 'profit-loss' && (
          <Card>
            <div className="border-b border-white/5 pb-4 mb-6 print:border-black">
              <h2 className="text-xl font-bold text-white print:text-black">Profit & Loss Statement</h2>
              <p className="text-sm text-gray-400 print:text-gray-600">January 1 - December 31, 2024</p>
            </div>

            <div className="space-y-6">
              {/* Revenue Section */}
              <div>
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3 print:text-emerald-600">Revenue</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-white/5 print:border-gray-200">
                    <span className="text-gray-300 print:text-gray-700">Product Sales</span>
                    <span className="font-mono text-white print:text-black">$98,500.00</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5 print:border-gray-200">
                    <span className="text-gray-300 print:text-gray-700">Service Revenue</span>
                    <span className="font-mono text-white print:text-black">$45,000.00</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5 print:border-gray-200">
                    <span className="text-gray-300 print:text-gray-700">Consulting Fees</span>
                    <span className="font-mono text-white print:text-black">$12,500.00</span>
                  </div>
                  <div className="flex justify-between py-3 bg-emerald-500/5 rounded-lg px-3 -mx-3 print:bg-emerald-50">
                    <span className="font-semibold text-emerald-400 print:text-emerald-600">Total Revenue</span>
                    <span className="font-mono font-bold text-emerald-400 print:text-emerald-600">$156,000.00</span>
                  </div>
                </div>
              </div>

              {/* Cost of Goods */}
              <div>
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3 print:text-amber-600">Cost of Goods Sold</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-white/5 print:border-gray-200">
                    <span className="text-gray-300 print:text-gray-700">Direct Materials</span>
                    <span className="font-mono text-white print:text-black">$28,000.00</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5 print:border-gray-200">
                    <span className="text-gray-300 print:text-gray-700">Direct Labor</span>
                    <span className="font-mono text-white print:text-black">$15,680.00</span>
                  </div>
                  <div className="flex justify-between py-3 bg-amber-500/5 rounded-lg px-3 -mx-3 print:bg-amber-50">
                    <span className="font-semibold text-amber-400 print:text-amber-600">Total COGS</span>
                    <span className="font-mono font-bold text-amber-400 print:text-amber-600">$43,680.00</span>
                  </div>
                </div>
              </div>

              {/* Gross Profit */}
              <div className="flex justify-between py-4 bg-white/5 rounded-xl px-4 -mx-4 print:bg-gray-100">
                <span className="text-lg font-bold text-white print:text-black">Gross Profit</span>
                <div className="text-right">
                  <span className="font-mono text-xl font-bold text-white print:text-black">$112,320.00</span>
                  <p className="text-xs text-emerald-400 print:text-emerald-600">72.0% margin</p>
                </div>
              </div>

              {/* Operating Expenses */}
              <div>
                <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-3 print:text-rose-600">Operating Expenses</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-white/5 print:border-gray-200">
                    <span className="text-gray-300 print:text-gray-700">Salaries & Wages</span>
                    <span className="font-mono text-white print:text-black">$24,000.00</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5 print:border-gray-200">
                    <span className="text-gray-300 print:text-gray-700">Rent & Utilities</span>
                    <span className="font-mono text-white print:text-black">$8,400.00</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5 print:border-gray-200">
                    <span className="text-gray-300 print:text-gray-700">Software & Subscriptions</span>
                    <span className="font-mono text-white print:text-black">$4,200.00</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5 print:border-gray-200">
                    <span className="text-gray-300 print:text-gray-700">Marketing & Advertising</span>
                    <span className="font-mono text-white print:text-black">$6,800.00</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5 print:border-gray-200">
                    <span className="text-gray-300 print:text-gray-700">Professional Services</span>
                    <span className="font-mono text-white print:text-black">$1,920.00</span>
                  </div>
                  <div className="flex justify-between py-3 bg-rose-500/5 rounded-lg px-3 -mx-3 print:bg-rose-50">
                    <span className="font-semibold text-rose-400 print:text-rose-600">Total Operating Expenses</span>
                    <span className="font-mono font-bold text-rose-400 print:text-rose-600">$45,320.00</span>
                  </div>
                </div>
              </div>

              {/* Net Income */}
              <div className="flex justify-between py-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl px-6 -mx-4 border border-emerald-500/20 print:bg-emerald-50 print:border-emerald-200">
                <div>
                  <span className="text-xl font-bold text-white print:text-black">Net Income</span>
                  <p className="text-sm text-gray-400 print:text-gray-600">Before taxes</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-3xl font-bold text-emerald-400 print:text-emerald-600">$67,000.00</span>
                  <p className="text-sm text-emerald-400 print:text-emerald-600">+23.4% vs last year</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Balance Sheet, Cash Flow, Tax Summary remain similar - keeping for brevity */}
        {activeReport === 'balance-sheet' && (
          <Card>
            <div className="border-b border-white/5 pb-4 mb-6">
              <h2 className="text-xl font-bold text-white">Balance Sheet</h2>
              <p className="text-sm text-gray-400">As of December 31, 2024</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Assets</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-white/5"><span className="text-gray-300">Cash & Equivalents</span><span className="font-mono text-white">$85,000</span></div>
                  <div className="flex justify-between py-2 border-b border-white/5"><span className="text-gray-300">Accounts Receivable</span><span className="font-mono text-white">$42,000</span></div>
                  <div className="flex justify-between py-2 border-b border-white/5"><span className="text-gray-300">Crypto Holdings</span><span className="font-mono text-white">$45,000</span></div>
                  <div className="flex justify-between py-2 border-b border-white/5"><span className="text-gray-300">Property & Equipment</span><span className="font-mono text-white">$45,000</span></div>
                  <div className="flex justify-between py-3 bg-emerald-500/10 rounded-lg px-3"><span className="font-semibold text-emerald-400">Total Assets</span><span className="font-mono font-bold text-emerald-400">$245,000</span></div>
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider">Liabilities & Equity</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-white/5"><span className="text-gray-300">Accounts Payable</span><span className="font-mono text-white">$12,000</span></div>
                  <div className="flex justify-between py-2 border-b border-white/5"><span className="text-gray-300">Short-term Debt</span><span className="font-mono text-white">$15,000</span></div>
                  <div className="flex justify-between py-3 bg-rose-500/10 rounded-lg px-3"><span className="font-semibold text-rose-400">Total Liabilities</span><span className="font-mono font-bold text-rose-400">$35,000</span></div>
                  <div className="flex justify-between py-2 border-b border-white/5"><span className="text-gray-300">Common Stock</span><span className="font-mono text-white">$100,000</span></div>
                  <div className="flex justify-between py-2 border-b border-white/5"><span className="text-gray-300">Retained Earnings</span><span className="font-mono text-white">$110,000</span></div>
                  <div className="flex justify-between py-3 bg-violet-500/10 rounded-lg px-3"><span className="font-semibold text-violet-400">Total Equity</span><span className="font-mono font-bold text-violet-400">$210,000</span></div>
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
              <div>
                <h3 className="text-sm font-semibold text-sky-400 uppercase tracking-wider mb-3">Operating Activities</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-white/5"><span className="text-gray-300">Net Income</span><span className="font-mono text-white">$67,000</span></div>
                  <div className="flex justify-between py-2 border-b border-white/5"><span className="text-gray-300">Depreciation</span><span className="font-mono text-white">$5,000</span></div>
                  <div className="flex justify-between py-3 bg-sky-500/10 rounded-lg px-3 -mx-3"><span className="font-semibold text-sky-400">Net Cash from Operations</span><span className="font-mono font-bold text-sky-400">$63,500</span></div>
                </div>
              </div>
              <div className="flex justify-between py-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl px-6 -mx-4 border border-emerald-500/20">
                <div><span className="text-xl font-bold text-white">Net Change in Cash</span><p className="text-sm text-gray-400">Beginning Balance: $51,500</p></div>
                <div className="text-right"><span className="font-mono text-3xl font-bold text-emerald-400">$33,500</span><p className="text-sm text-gray-400">Ending Balance: $85,000</p></div>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Income Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-white/5"><span className="text-gray-300">Gross Revenue</span><span className="font-mono text-white">$156,000</span></div>
                  <div className="flex justify-between py-2 border-b border-white/5"><span className="text-gray-300">Crypto Gains</span><span className="font-mono text-white">$20,500</span></div>
                  <div className="flex justify-between py-3 bg-emerald-500/10 rounded-lg px-3"><span className="font-semibold text-emerald-400">Total Taxable Income</span><span className="font-mono font-bold text-emerald-400">$176,500</span></div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-sky-400 uppercase tracking-wider">Deductions</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-white/5"><span className="text-gray-300">Business Expenses</span><span className="font-mono text-white">$45,000</span></div>
                  <div className="flex justify-between py-2 border-b border-white/5"><span className="text-gray-300">Depreciation</span><span className="font-mono text-white">$5,000</span></div>
                  <div className="flex justify-between py-3 bg-sky-500/10 rounded-lg px-3"><span className="font-semibold text-sky-400">Total Deductions</span><span className="font-mono font-bold text-sky-400">$53,200</span></div>
                </div>
              </div>
            </div>
            <div className="mt-8 p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Estimated Tax Liability</h3>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">Preliminary</span>
              </div>
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-amber-500/20">
                <span className="text-lg font-semibold text-amber-400">Total Estimated Taxes</span>
                <span className="text-3xl font-bold font-mono text-amber-400">$42,402</span>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={handleExportPDF} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-medium text-white">
                <ArrowDownTrayIcon className="w-5 h-5" />Export Tax Package
              </button>
              <button onClick={handleSendEmail} className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-gray-300 transition-colors">
                <EnvelopeIcon className="w-5 h-5" />Send to Accountant
              </button>
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  );
}