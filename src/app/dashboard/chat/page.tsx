'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme-store'
import { Card, Button, Badge } from '@/components/ui'
import { 
  Send, 
  Hash, 
  Users, 
  Plus, 
  Search, 
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Circle
} from 'lucide-react'

interface Channel {
  id: string
  name: string
  unread: number
}

interface DirectMessage {
  id: string
  name: string
  avatar: string
  online: boolean
  lastMessage: string
}

interface Message {
  id: string
  user: string
  avatar: string
  content: string
  timestamp: string
}

export default function ChatPage() {
  const { t } = useThemeStore()
  const [selectedChannel, setSelectedChannel] = useState('general')
  const [message, setMessage] = useState('')

  const channels: Channel[] = [
    { id: 'general', name: 'general', unread: 0 },
    { id: 'finance', name: 'finance-team', unread: 3 },
    { id: 'tax', name: 'tax-planning', unread: 0 },
    { id: 'reports', name: 'monthly-reports', unread: 1 },
  ]

  const directMessages: DirectMessage[] = [
    { id: '1', name: 'Sarah Chen', avatar: 'SC', online: true, lastMessage: 'Sounds good!' },
    { id: '2', name: 'Michael Brown', avatar: 'MB', online: true, lastMessage: 'I\'ll review it today' },
    { id: '3', name: 'Emily Davis', avatar: 'ED', online: false, lastMessage: 'Thanks for the update' },
  ]

  const messages: Message[] = [
    { id: '1', user: 'Sarah Chen', avatar: 'SC', content: 'Hey team, the Q4 reports are ready for review.', timestamp: '10:30 AM' },
    { id: '2', user: 'Michael Brown', avatar: 'MB', content: 'Great! I\'ll take a look at the expense breakdown.', timestamp: '10:32 AM' },
    { id: '3', user: 'Emily Davis', avatar: 'ED', content: 'The tax optimization recommendations look promising. Should we schedule a call to discuss?', timestamp: '10:35 AM' },
    { id: '4', user: 'Sarah Chen', avatar: 'SC', content: 'Good idea. How about tomorrow at 2pm?', timestamp: '10:38 AM' },
  ]

  const handleSend = () => {
    if (!message.trim()) return
    // Handle sending message
    setMessage('')
  }

  return (
    <div className="h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
          {t('chat.title')}
        </h1>
        <p className="text-gray-500 dark:text-surface-500 mt-1">
          {t('chat.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100%-4rem)]">
        {/* Sidebar */}
        <Card variant="glass" padding="none" className="lg:col-span-1 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-surface-800/50">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-surface-500" />
              <input
                type="text"
                placeholder={t('chat.search')}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50 text-sm text-gray-900 dark:text-surface-100 placeholder:text-gray-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
              />
            </div>
          </div>

          {/* Channels */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-surface-500 uppercase tracking-wider">
                {t('chat.channels')}
              </h3>
              <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-surface-800/50 transition-colors">
                <Plus size={14} className="text-gray-500 dark:text-surface-400" />
              </button>
            </div>
            <div className="space-y-1">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedChannel === channel.id
                      ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                      : 'text-gray-600 dark:text-surface-400 hover:bg-gray-100 dark:hover:bg-surface-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Hash size={16} />
                    <span>{channel.name}</span>
                  </div>
                  {channel.unread > 0 && (
                    <Badge variant="info" size="sm">{channel.unread}</Badge>
                  )}
                </button>
              ))}
            </div>

            {/* Direct Messages */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-surface-500 uppercase tracking-wider">
                  {t('chat.directMessages')}
                </h3>
                <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-surface-800/50 transition-colors">
                  <Plus size={14} className="text-gray-500 dark:text-surface-400" />
                </button>
              </div>
              <div className="space-y-1">
                {directMessages.map((dm) => (
                  <button
                    key={dm.id}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-surface-400 hover:bg-gray-100 dark:hover:bg-surface-800/50 transition-colors"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center text-xs font-medium text-[var(--accent-primary)]">
                        {dm.avatar}
                      </div>
                      <Circle
                        size={10}
                        className={`absolute -bottom-0.5 -right-0.5 ${
                          dm.online ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'
                        }`}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 dark:text-surface-100">{dm.name}</p>
                      <p className="text-xs text-gray-500 dark:text-surface-500 truncate">{dm.lastMessage}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Chat Area */}
        <Card variant="glass" padding="none" className="lg:col-span-3 flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-surface-800/50">
            <div className="flex items-center gap-3">
              <Hash size={20} className="text-gray-500 dark:text-surface-400" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-surface-100">
                  {channels.find(c => c.id === selectedChannel)?.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-surface-500">
                  4 {t('chat.members')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-800/50 transition-colors">
                <Phone size={18} className="text-gray-500 dark:text-surface-400" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-800/50 transition-colors">
                <Video size={18} className="text-gray-500 dark:text-surface-400" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-800/50 transition-colors">
                <Users size={18} className="text-gray-500 dark:text-surface-400" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center text-sm font-medium text-[var(--accent-primary)] flex-shrink-0">
                  {msg.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-gray-900 dark:text-surface-100">{msg.user}</span>
                    <span className="text-xs text-gray-500 dark:text-surface-500">{msg.timestamp}</span>
                  </div>
                  <p className="text-gray-700 dark:text-surface-300 mt-1">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-surface-800/50">
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-800/50 transition-colors">
                <Paperclip size={18} className="text-gray-500 dark:text-surface-400" />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('chat.typeMessage')}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50 text-gray-900 dark:text-surface-100 placeholder:text-gray-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
              />
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-800/50 transition-colors">
                <Smile size={18} className="text-gray-500 dark:text-surface-400" />
              </button>
              <Button variant="primary" onClick={handleSend} leftIcon={<Send size={16} />}>
                {t('chat.send')}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
