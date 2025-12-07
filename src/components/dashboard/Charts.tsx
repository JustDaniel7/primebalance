'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const revenueData = {
  labels: months,
  datasets: [
    {
      label: 'Revenue',
      data: [45000, 52000, 48000, 61000, 55000, 67000, 72000, 68000, 78000, 85000, 92000, 98000],
      borderColor: '#14d47a',
      backgroundColor: 'rgba(20, 212, 122, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: '#14d47a',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2,
    },
    {
      label: 'Expenses',
      data: [32000, 35000, 31000, 42000, 38000, 45000, 48000, 44000, 52000, 55000, 58000, 62000],
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: '#ef4444',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2,
    },
  ],
}

const expenseBreakdownData = {
  labels: ['Operations', 'Marketing', 'Payroll', 'Infrastructure', 'Other'],
  datasets: [
    {
      label: 'Expenses',
      data: [15000, 8500, 25000, 6500, 7000],
      backgroundColor: [
        'rgba(20, 212, 122, 0.8)',
        'rgba(238, 177, 5, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(107, 114, 128, 0.8)',
      ],
      borderRadius: 8,
      borderSkipped: false,
    },
  ],
}

const lineChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      align: 'end',
      labels: {
        color: '#8594a9',
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 20,
        font: {
          size: 12,
          family: 'DM Sans',
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(52, 58, 70, 0.95)',
      titleColor: '#f6f7f9',
      bodyColor: '#d5dae2',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      cornerRadius: 12,
      padding: 12,
      displayColors: true,
      callbacks: {
        label: function (context) {
          // @ts-ignore
          return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#66778f',
        font: {
          size: 11,
          family: 'DM Sans',
        },
      },
      border: {
        display: false,
      },
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.03)',
      },
      ticks: {
        color: '#66778f',
        font: {
          size: 11,
          family: 'DM Sans',
        },
        callback: function (value) {
          return '$' + (Number(value) / 1000).toFixed(0) + 'k'
        },
      },
      border: {
        display: false,
      },
    },
  },
}

const barChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(52, 58, 70, 0.95)',
      titleColor: '#f6f7f9',
      bodyColor: '#d5dae2',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      cornerRadius: 12,
      padding: 12,
      callbacks: {
        label: function (context) {
          // @ts-ignore
          return '$' + context.parsed.x.toLocaleString()
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.03)',
      },
      ticks: {
        color: '#66778f',
        font: {
          size: 11,
          family: 'DM Sans',
        },
        callback: function (value) {
          return '$' + (Number(value) / 1000).toFixed(0) + 'k'
        },
      },
      border: {
        display: false,
      },
    },
    y: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#b0bac8',
        font: {
          size: 12,
          family: 'DM Sans',
        },
      },
      border: {
        display: false,
      },
    },
  },
}

export function RevenueChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card variant="glass" className="h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-surface-100">
              Revenue & Expenses
            </h3>
            <p className="text-sm text-surface-500">Monthly overview</p>
          </div>
          <div className="flex gap-2">
            {['1M', '3M', '6M', '1Y'].map((period, index) => (
              <button
                key={period}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  index === 3
                    ? 'bg-surface-800 text-surface-100'
                    : 'text-surface-400 hover:text-surface-200'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[300px]">
          <Line data={revenueData} options={lineChartOptions} />
        </div>
      </Card>
    </motion.div>
  )
}

export function ExpenseBreakdownChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card variant="glass" className="h-full">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-surface-100">
            Expense Breakdown
          </h3>
          <p className="text-sm text-surface-500">This month&apos;s spending</p>
        </div>
        <div className="h-[240px]">
          <Bar data={expenseBreakdownData} options={barChartOptions} />
        </div>
      </Card>
    </motion.div>
  )
}
