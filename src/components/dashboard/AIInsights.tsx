'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme-store'
import { Card } from '@/components/ui'
import { SparklesIcon } from '@/components/ui/Icons'
import { Send, Lightbulb, TrendingUp, PiggyBank, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'

interface Insight {
  id: string
  type: 'tip' | 'warning' | 'opportunity' | 'info'
  title: string
  description: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function AIInsights() {
  const { t } = useThemeStore()
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingInsights, setIsLoadingInsights] = useState(true)
  const [insights, setInsights] = useState<Insight[]>([])
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [showChat, setShowChat] = useState(false)
  const [chatResponse, setChatResponse] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Generate initial insights on mount
  const fetchInsights = useCallback(async () => {
    setIsLoadingInsights(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: 'Analyze my financial data and provide 3 brief insights. For each insight, classify it as one of: opportunity (growth potential), tip (cost saving), warning (risk alert), or info (general observation). Format as JSON array with objects containing: type, title (short), description (1 sentence). Only return the JSON array, no other text.'
          }]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch insights')
      }

      const data = await response.json()

      // Try to parse AI response as JSON
      try {
        const content = data.content || ''
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const parsedInsights = JSON.parse(jsonMatch[0])
          setInsights(parsedInsights.map((insight: Insight, index: number) => ({
            ...insight,
            id: `insight-${index}`
          })))
        } else {
          // Fallback to default insights if parsing fails
          setDefaultInsights()
        }
      } catch {
        setDefaultInsights()
      }
    } catch (err) {
      console.error('Failed to fetch AI insights:', err)
      setDefaultInsights()
    } finally {
      setIsLoadingInsights(false)
    }
  }, [])

  const setDefaultInsights = () => {
    setInsights([
      {
        id: '1',
        type: 'opportunity',
        title: 'Revenue Growth Potential',
        description: 'Analyze your top customers to identify upsell opportunities.',
      },
      {
        id: '2',
        type: 'tip',
        title: 'Optimize Expenses',
        description: 'Review recurring subscriptions for potential savings.',
      },
      {
        id: '3',
        type: 'info',
        title: 'Cash Flow Healthy',
        description: 'Your current cash position supports 6+ months of operations.',
      },
    ])
  }

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isLoading) return

    const userMessage = query.trim()
    setQuery('')
    setIsLoading(true)
    setShowChat(true)
    setChatResponse(null)
    setError(null)

    // Add user message to history
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: userMessage }]
    setChatHistory(newHistory)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      const assistantMessage = data.content || 'I could not generate a response.'

      setChatResponse(assistantMessage)
      setChatHistory([...newHistory, { role: 'assistant', content: assistantMessage }])
    } catch (err) {
      console.error('AI chat error:', err)
      setError('Failed to get AI response. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInsightClick = (insight: Insight) => {
    setQuery(`Tell me more about: ${insight.title}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="h-full"
    >
      <Card variant="glass" className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
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
          {!showChat && (
            <button
              onClick={fetchInsights}
              disabled={isLoadingInsights}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-surface-300 hover:bg-gray-100 dark:hover:bg-surface-800/50 transition-colors disabled:opacity-50"
              title="Refresh insights"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingInsights ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* AI Query Input */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('dashboard.askAI')}
              disabled={isLoading}
              className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-100 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50 text-gray-900 dark:text-surface-100 placeholder:text-gray-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </form>

        {/* Chat Response or Insights */}
        <div className="space-y-3 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {showChat ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {/* Show last user message */}
                {chatHistory.length > 0 && (
                  <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                    <p className="text-xs text-violet-400 font-medium mb-1">You asked:</p>
                    <p className="text-sm text-gray-900 dark:text-surface-100">
                      {chatHistory[chatHistory.length - (chatResponse ? 2 : 1)]?.content}
                    </p>
                  </div>
                )}

                {/* AI Response */}
                {isLoading ? (
                  <div className="p-4 rounded-xl bg-gray-100 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                      <span className="text-sm text-gray-500 dark:text-surface-400">
                        {t('ai.analyzing')}
                      </span>
                    </div>
                  </div>
                ) : chatResponse ? (
                  <div className="p-4 rounded-xl bg-gray-100 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50">
                    <p className="text-sm text-gray-900 dark:text-surface-100 whitespace-pre-wrap">
                      {chatResponse}
                    </p>
                  </div>
                ) : null}

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Back to insights button */}
                <button
                  onClick={() => {
                    setShowChat(false)
                    setChatResponse(null)
                  }}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  ← Back to insights
                </button>
              </motion.div>
            ) : isLoadingInsights ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-gray-100 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50 animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-surface-700 rounded w-full" />
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="insights"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {insights.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    onClick={() => handleInsightClick(insight)}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  )
}
