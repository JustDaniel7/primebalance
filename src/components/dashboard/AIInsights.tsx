'use client'

import { motion } from 'framer-motion'
import { useStore } from '@/index'
import { Card, Button } from '@/components/ui'
import { SparklesIcon, ChevronRightIcon } from '@/components/ui/Icons'
import Link from 'next/link'

export default function AIInsights() {
  const { aiSuggestions } = useStore()

  const priorityColors = {
    high: 'from-red-500/20 to-red-500/5 border-red-500/20',
    medium: 'from-accent-500/20 to-accent-500/5 border-accent-500/20',
    low: 'from-primary-500/20 to-primary-500/5 border-primary-500/20',
  }

  const priorityIconColors = {
    high: 'text-red-400',
    medium: 'text-accent-400',
    low: 'text-primary-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card variant="glass">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500/20 to-accent-500/5 flex items-center justify-center">
              <SparklesIcon size={20} className="text-accent-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-surface-100">
                AI Insights
              </h3>
              <p className="text-sm text-surface-500">
                Personalized recommendations
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/assistant"
            className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            Ask AI
            <ChevronRightIcon size={16} />
          </Link>
        </div>

        <div className="space-y-3">
          {aiSuggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
              className={`p-4 rounded-xl bg-gradient-to-r border ${
                priorityColors[suggestion.priority]
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg bg-surface-900/50 flex items-center justify-center flex-shrink-0 ${
                    priorityIconColors[suggestion.priority]
                  }`}
                >
                  <SparklesIcon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-surface-100">
                      {suggestion.title}
                    </h4>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-medium rounded uppercase ${
                        suggestion.priority === 'high'
                          ? 'bg-red-500/20 text-red-400'
                          : suggestion.priority === 'medium'
                          ? 'bg-accent-500/20 text-accent-400'
                          : 'bg-primary-500/20 text-primary-400'
                      }`}
                    >
                      {suggestion.priority}
                    </span>
                  </div>
                  <p className="text-xs text-surface-400 mb-2">
                    {suggestion.description}
                  </p>
                  {suggestion.impact && (
                    <p className="text-xs text-primary-400 font-medium">
                      {suggestion.impact}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3">
                    {suggestion.actions.map((action, actionIndex) => (
                      <Button
                        key={actionIndex}
                        variant="ghost"
                        size="sm"
                        className="text-xs py-1.5 px-3"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}
