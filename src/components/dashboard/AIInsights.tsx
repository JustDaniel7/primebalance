'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme-store'
import { Card } from '@/components/ui'
import { SparklesIcon } from '@/components/ui/Icons'
import { Send, Lightbulb, TrendingUp, PiggyBank, AlertCircle } from 'lucide-react'

interface Insight {
  id: string
  type: 'tip' | 'warning' | 'opportunity' | 'info'
  title: string
  description: string
}

export default function AIInsights() {
  const { t } = useThemeStore()
  const [query, setQuery] = useState('')

  const insights: Insight[] = [
    {
      id: '1',
      type: 'opportunity',
      title: t('ai.suggestion1'),
      description: 'Based on your spending patterns, consider restructuring cloud expenses.',
    },
    {
      id: '2',
      type: 'tip',
      title: t('ai.suggestion2'),
      description: 'Infrastructure costs increased 15% this quarter.',
    },
    {
      id: '3',
      type: 'info',
      title: t('ai.suggestion3'),
      description: 'Projected positive cash flow for the next 3 months.',
    },
  ]

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="w-4 h-4 text-green-400" />
      case 'tip':
        return <Lightbulb className="w-4 h-4 text-yellow-400" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      case 'info':
        return <PiggyBank className="w-4 h-4 text-blue-400" />
    }
  }

  const getInsightBgColor = (type: Insight['type']) => {
    switch (type) {
      case 'opportunity':
        return 'bg-green-500/10 border-green-500/20'
      case 'tip':
        return 'bg-yellow-500/10 border-yellow-500/20'
      case 'warning':
        return 'bg-red-500/10 border-red-500/20'
      case 'info':
        return 'bg-blue-500/10 border-blue-500/20'
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle AI query
    setQuery('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card variant="glass">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/20">
            <SparklesIcon size={20} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
              {t('dashboard.aiInsights')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-surface-500">
              {t('ai.subtitle')}
            </p>
          </div>
        </div>

        {/* AI Query Input */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('dashboard.askAI')}
              className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-100 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50 text-gray-900 dark:text-surface-100 placeholder:text-gray-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </form>

        {/* Insights List */}
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
              className={`p-4 rounded-xl border ${getInsightBgColor(insight.type)} cursor-pointer hover:scale-[1.02] transition-transform`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getInsightIcon(insight.type)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-surface-100">
                    {insight.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-surface-400 mt-1">
                    {insight.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}
