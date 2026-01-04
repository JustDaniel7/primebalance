'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme-store'
import { useStore } from '@/store'
import { Card, Button } from '@/components/ui'
import toast from 'react-hot-toast'
import {
  Send,
  Hash,
  Users,
  Plus,
  Search,
  Paperclip,
  Smile,
  Phone,
  Video,
  Circle,
  X,
  Loader2,
  User
} from 'lucide-react'

interface OrganizationMember {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: string
}

interface DMMessage {
  id: string
  content: string
  senderId: string
  senderName: string
  senderAvatar: string
  timestamp: string
}

type ChatType = 'channel' | 'dm'

export default function ChatPage() {
  const { t } = useThemeStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDescription, setNewChannelDescription] = useState('')
  const [creating, setCreating] = useState(false)

  // Chat type state (channel or DM)
  const [activeChatType, setActiveChatType] = useState<ChatType | null>(null)
  const [activeDMId, setActiveDMId] = useState<string | null>(null)
  const [dmMessages, setDMMessages] = useState<Record<string, DMMessage[]>>({})

  // Organization members
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)

  // Store state and actions
  const chatChannels = useStore((s) => s.chatChannels)
  const activeChannelId = useStore((s) => s.activeChannelId)
  const channelMessages = useStore((s) => s.channelMessages)
  const fetchChannels = useStore((s) => s.fetchChannels)
  const setActiveChannel = useStore((s) => s.setActiveChannel)
  const sendChannelMessage = useStore((s) => s.sendChannelMessage)
  const createChannel = useStore((s) => s.createChannel)

  // Get messages for active channel
  const messages = activeChannelId ? channelMessages[activeChannelId] || [] : []
  const activeChannel = chatChannels.find(c => c.id === activeChannelId)
  const activeDM = orgMembers.find(u => u.id === activeDMId)
  const activeDMMessageList = activeDMId ? dmMessages[activeDMId] || [] : []

  // Fetch channels and organization members on mount
  useEffect(() => {
    fetchChannels()

    // Fetch organization members
    const fetchMembers = async () => {
      try {
        const res = await fetch('/api/organization/members')
        if (res.ok) {
          const data = await res.json()
          setOrgMembers(data.members || [])
        }
      } catch (error) {
        console.error('Failed to fetch organization members:', error)
      } finally {
        setLoadingMembers(false)
      }
    }
    fetchMembers()
  }, [fetchChannels])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeDMMessageList])

  const handleSelectChannel = (channelId: string) => {
    setActiveChatType('channel')
    setActiveDMId(null)
    setActiveChannel(channelId)
  }

  const handleSelectDM = async (dmId: string) => {
    setActiveChatType('dm')
    setActiveChannel(null)
    setActiveDMId(dmId)

    // Fetch DM messages from API
    try {
      const res = await fetch(`/api/chat/dm/${dmId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setDMMessages(prev => ({
          ...prev,
          [dmId]: data.messages || [],
        }))
      }
    } catch (error) {
      console.error('Failed to fetch DM messages:', error)
    }
  }

  const handleSend = async () => {
    if (!message.trim() || sending) return

    if (activeChatType === 'channel' && activeChannelId) {
      setSending(true)
      try {
        await sendChannelMessage(activeChannelId, message.trim())
        setMessage('')
      } catch (error) {
        console.error('Failed to send message:', error)
      } finally {
        setSending(false)
      }
    } else if (activeChatType === 'dm' && activeDMId) {
      // Send DM via API
      setSending(true)
      try {
        const res = await fetch(`/api/chat/dm/${activeDMId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: message.trim() }),
        })

        if (!res.ok) throw new Error('Failed to send message')

        const newMessage: DMMessage = await res.json()
        setDMMessages(prev => ({
          ...prev,
          [activeDMId]: [...(prev[activeDMId] || []), newMessage],
        }))
        setMessage('')
      } catch (error) {
        console.error('Failed to send DM:', error)
        toast.error('Failed to send message')
      } finally {
        setSending(false)
      }
    }
  }

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || creating) return

    setCreating(true)
    try {
      const channel = await createChannel(newChannelName.trim(), newChannelDescription.trim() || undefined)
      handleSelectChannel(channel.id)
      setShowCreateModal(false)
      setNewChannelName('')
      setNewChannelDescription('')
      toast.success('Channel created successfully')
    } catch (error) {
      console.error('Failed to create channel:', error)
      toast.error('Failed to create channel')
    } finally {
      setCreating(false)
    }
  }

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getLastDMMessage = (dmId: string) => {
    const msgs = dmMessages[dmId] || []
    return msgs.length > 0 ? msgs[msgs.length - 1].content : t('chat.noMessages')
  }

  const getInitialsFromName = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const hasActiveChat = (activeChatType === 'channel' && activeChannel) || (activeChatType === 'dm' && activeDM)

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
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-surface-800/50 transition-colors"
              >
                <Plus size={14} className="text-gray-500 dark:text-surface-400" />
              </button>
            </div>
            <div className="space-y-1">
              {chatChannels.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-surface-500 px-3 py-2">
                  No channels yet
                </p>
              ) : (
                chatChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => handleSelectChannel(channel.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeChatType === 'channel' && activeChannelId === channel.id
                        ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                        : 'text-gray-600 dark:text-surface-400 hover:bg-gray-100 dark:hover:bg-surface-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Hash size={16} />
                      <span>{channel.name}</span>
                    </div>
                    {channel._count && channel._count.messages > 0 && (
                      <span className="text-xs text-gray-400 dark:text-surface-500">
                        {channel._count.messages}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Direct Messages - Team Members */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-surface-500 uppercase tracking-wider">
                  {t('chat.teamMembers')}
                </h3>
                <span className="text-xs text-gray-400">{orgMembers.length}</span>
              </div>
              <div className="space-y-1">
                {loadingMembers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={16} className="animate-spin text-gray-400" />
                  </div>
                ) : orgMembers.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-surface-500 px-3 py-2">
                    {t('chat.noTeamMembers')}
                  </p>
                ) : (
                  orgMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleSelectDM(member.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeChatType === 'dm' && activeDMId === member.id
                          ? 'bg-[var(--accent-primary)]/10'
                          : 'hover:bg-gray-100 dark:hover:bg-surface-800/50'
                      }`}
                    >
                      <div className="relative">
                        {member.image ? (
                          <img
                            src={member.image}
                            alt={member.name || ''}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center text-xs font-medium text-[var(--accent-primary)]`}>
                            {getInitialsFromName(member.name)}
                          </div>
                        )}
                        <Circle
                          size={10}
                          className="absolute -bottom-0.5 -right-0.5 text-green-500 fill-green-500"
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${
                            activeChatType === 'dm' && activeDMId === member.id
                              ? 'text-[var(--accent-primary)]'
                              : 'text-gray-900 dark:text-surface-100'
                          }`}>{member.name || member.email}</p>
                          {member.role === 'admin' && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">
                              Admin
                            </span>
                          )}
                          {member.role === 'owner' && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded">
                              Owner
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-surface-500 truncate">
                          {getLastDMMessage(member.id)}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Chat Area */}
        <Card variant="glass" padding="none" className="lg:col-span-3 flex flex-col">
          {hasActiveChat ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-surface-800/50">
                <div className="flex items-center gap-3">
                  {activeChatType === 'channel' && activeChannel ? (
                    <>
                      <Hash size={20} className="text-gray-500 dark:text-surface-400" />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-surface-100">
                          {activeChannel.name}
                        </h3>
                        {activeChannel.description && (
                          <p className="text-xs text-gray-500 dark:text-surface-500">
                            {activeChannel.description}
                          </p>
                        )}
                      </div>
                    </>
                  ) : activeChatType === 'dm' && activeDM ? (
                    <>
                      <div className="relative">
                        {activeDM.image ? (
                          <img
                            src={activeDM.image}
                            alt={activeDM.name || ''}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center text-sm font-medium text-[var(--accent-primary)]">
                            {getInitialsFromName(activeDM.name)}
                          </div>
                        )}
                        <Circle
                          size={12}
                          className="absolute -bottom-0.5 -right-0.5 text-green-500 fill-green-500"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-surface-100">
                          {activeDM.name || activeDM.email}
                        </h3>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500 dark:text-surface-500">
                            {t('chat.online')}
                          </p>
                          {activeDM.role !== 'member' && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded capitalize">
                              {activeDM.role}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-800/50 transition-colors">
                    <Phone size={18} className="text-gray-500 dark:text-surface-400" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-800/50 transition-colors">
                    <Video size={18} className="text-gray-500 dark:text-surface-400" />
                  </button>
                  {activeChatType === 'channel' && (
                    <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-800/50 transition-colors">
                      <Users size={18} className="text-gray-500 dark:text-surface-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activeChatType === 'channel' ? (
                  // Channel messages
                  messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-surface-500">
                      <Hash size={48} className="mb-4 opacity-50" />
                      <p className="text-lg font-medium">Welcome to #{activeChannel?.name}</p>
                      <p className="text-sm">This is the start of the conversation.</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.05, 0.5) }}
                        className="flex items-start gap-4"
                      >
                        <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center text-sm font-medium text-[var(--accent-primary)] flex-shrink-0">
                          {msg.user.image ? (
                            <img src={msg.user.image} alt={msg.user.name || ''} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            getInitials(msg.user.name)
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-semibold text-gray-900 dark:text-surface-100">
                              {msg.user.name || 'Unknown User'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-surface-500">
                              {formatTimestamp(msg.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-surface-300 mt-1">{msg.content}</p>
                        </div>
                      </motion.div>
                    ))
                  )
                ) : (
                  // DM messages
                  activeDMMessageList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-surface-500">
                      <User size={48} className="mb-4 opacity-50" />
                      <p className="text-lg font-medium">Chat with {activeDM?.name}</p>
                      <p className="text-sm">Send a message to start the conversation.</p>
                    </div>
                  ) : (
                    activeDMMessageList.map((msg, index) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.05, 0.5) }}
                        className={`flex items-start gap-4 ${msg.senderId === 'me' ? 'flex-row-reverse' : ''}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center text-sm font-medium text-[var(--accent-primary)] flex-shrink-0">
                          {msg.senderAvatar}
                        </div>
                        <div className={`flex-1 ${msg.senderId === 'me' ? 'text-right' : ''}`}>
                          <div className={`flex items-baseline gap-2 ${msg.senderId === 'me' ? 'justify-end' : ''}`}>
                            <span className="font-semibold text-gray-900 dark:text-surface-100">
                              {msg.senderName}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-surface-500">
                              {formatTimestamp(msg.timestamp)}
                            </span>
                          </div>
                          <p className={`text-gray-700 dark:text-surface-300 mt-1 ${
                            msg.senderId === 'me'
                              ? 'bg-[var(--accent-primary)]/10 inline-block px-4 py-2 rounded-2xl rounded-tr-md'
                              : 'bg-gray-100 dark:bg-surface-800 inline-block px-4 py-2 rounded-2xl rounded-tl-md'
                          }`}>
                            {msg.content}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )
                )}
                <div ref={messagesEndRef} />
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
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder={activeChatType === 'dm' ? `Message ${activeDM?.name}` : t('chat.typeMessage')}
                    disabled={sending}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50 text-gray-900 dark:text-surface-100 placeholder:text-gray-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 disabled:opacity-50"
                  />
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-800/50 transition-colors">
                    <Smile size={18} className="text-gray-500 dark:text-surface-400" />
                  </button>
                  <Button
                    variant="primary"
                    onClick={handleSend}
                    disabled={sending || !message.trim()}
                    leftIcon={sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  >
                    {t('chat.send')}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-surface-500">
              <Hash size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose a channel or direct message to start chatting</p>
            </div>
          )}
        </Card>
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-surface-900 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                Create Channel
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-surface-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">
                  Channel Name
                </label>
                <div className="relative">
                  <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="e.g. finance-team"
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-surface-800 border border-gray-200 dark:border-surface-700 text-gray-900 dark:text-surface-100 placeholder:text-gray-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                  placeholder="What's this channel about?"
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-surface-800 border border-gray-200 dark:border-surface-700 text-gray-900 dark:text-surface-100 placeholder:text-gray-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateChannel}
                disabled={!newChannelName.trim() || creating}
              >
                {creating ? 'Creating...' : 'Create Channel'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
