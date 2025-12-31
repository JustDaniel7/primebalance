'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { useThemeStore } from '@/store/theme-store'
import { Card, Button } from '@/components/ui'
import { Send, Sparkles, MessageSquare, Lightbulb, TrendingUp, PieChart, Clock } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AssistantPage() {
  const { t } = useThemeStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: t('ai.greeting') || "Hello! I'm your PrimeBalance AI assistant. I can help you analyze transactions, review invoices, track expenses, and provide financial insights. What would you like to know?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const suggestions = [
    { icon: TrendingUp, text: t('ai.suggestion1') || 'Show me my transaction summary for this month' },
    { icon: PieChart, text: t('ai.suggestion2') || 'What are my top expense categories?' },
    { icon: Clock, text: t('ai.suggestion3') || 'Show me overdue invoices' },
    { icon: Lightbulb, text: t('ai.suggestion4') || 'How can I optimize my cash flow?' },
  ]

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    // Add user message and clear input
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsTyping(true)

    try {
      // Prepare conversation history for API (exclude initial greeting for cleaner context)
      const conversationHistory = updatedMessages
        .filter(m => m.id !== '1') // Exclude initial greeting
        .map(m => ({ role: m.role, content: m.content }))

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('AI chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSuggestion = (text: string) => {
    setInput(text)
  }

  const handleNewChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: t('ai.greeting') || "Hello! I'm your PrimeBalance AI assistant. I can help you analyze transactions, review invoices, track expenses, and provide financial insights. What would you like to know?",
        timestamp: new Date(),
      },
    ])
  }

  return (
    <div className="space-y-6 h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/20">
              <Sparkles className="w-6 h-6 text-violet-500" />
            </div>
            {t('ai.title')}
          </h1>
          <p className="text-gray-500 dark:text-surface-500 mt-1">
            {t('ai.subtitle')}
          </p>
        </div>
        <Button variant="secondary" leftIcon={<MessageSquare size={18} />} onClick={handleNewChat}>
          {t('ai.newChat') || 'New Chat'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
        {/* Chat Area */}
        <div className="lg:col-span-3 flex flex-col min-h-0 overflow-hidden">
          <Card variant="glass" padding="none" className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-[var(--accent-primary)] text-white'
                        : 'bg-gray-100 dark:bg-surface-800/50 text-gray-900 dark:text-surface-100'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={16} className="text-violet-500" />
                        <span className="text-sm font-medium text-violet-500">AI Assistant</span>
                      </div>
                    )}
                    {message.role === 'assistant' ? (
                      <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-inherit">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 dark:bg-surface-800/50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-violet-500 animate-pulse" />
                      <span className="text-sm text-gray-500 dark:text-surface-400">{t('ai.thinking') || 'Thinking...'}</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-surface-800/50">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t('ai.askAnything')}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50 text-gray-900 dark:text-surface-100 placeholder:text-gray-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
                />
                <Button variant="primary" onClick={handleSend} leftIcon={<Send size={18} />}>
                  {t('chat.send')}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Suggestions */}
          <Card variant="glass" padding="md">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-surface-100 mb-4">
              {t('ai.suggestions')}
            </h3>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => {
                const Icon = suggestion.icon
                return (
                  <button
                    key={index}
                    onClick={() => handleSuggestion(suggestion.text)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-surface-800/30 hover:bg-gray-100 dark:hover:bg-surface-800/50 transition-colors text-left"
                  >
                    <Icon size={18} className="text-[var(--accent-primary)] flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-surface-300">{suggestion.text}</span>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Recent Chats */}
          <Card variant="glass" padding="md">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-surface-100 mb-4">
              {t('ai.recentChats')}
            </h3>
            <div className="space-y-2">
              {['Tax optimization analysis', 'Q4 expense review', 'Cash flow forecast'].map((chat, index) => (
                <button
                  key={index}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-surface-800/30 transition-colors text-left"
                >
                  <MessageSquare size={16} className="text-gray-400 dark:text-surface-500" />
                  <span className="text-sm text-gray-600 dark:text-surface-400 truncate">{chat}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
