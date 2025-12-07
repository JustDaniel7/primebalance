'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EllipsisHorizontalIcon,
  PaperClipIcon,
  FaceSmileIcon,
  AtSymbolIcon,
  HashtagIcon,
  PhoneIcon,
  VideoCameraIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface Channel {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  unread?: number;
  lastMessage?: string;
  avatar?: string;
  members?: number;
  online?: boolean;
}

interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  content: string;
  timestamp: Date;
  reactions?: { emoji: string; count: number }[];
}

const channels: Channel[] = [
  { id: '1', name: 'general', type: 'channel', unread: 3, members: 12 },
  { id: '2', name: 'finance-team', type: 'channel', members: 5 },
  { id: '3', name: 'tax-discussions', type: 'channel', unread: 1, members: 4 },
  { id: '4', name: 'quarterly-review', type: 'channel', members: 8 },
];

const directMessages: Channel[] = [
  { id: 'd1', name: 'Sarah Chen', type: 'dm', online: true, lastMessage: 'The Q4 reports look great!' },
  { id: 'd2', name: 'Mike Johnson', type: 'dm', online: true, lastMessage: 'Can you review the invoice?' },
  { id: 'd3', name: 'Emily Davis', type: 'dm', online: false, lastMessage: 'Meeting at 3pm confirmed' },
  { id: 'd4', name: 'Alex Kim', type: 'dm', online: false, lastMessage: 'Updated the spreadsheet' },
];

const mockMessages: ChatMessage[] = [
  {
    id: '1',
    user: 'Sarah Chen',
    avatar: 'SC',
    content: 'Hey team! Just finished the Q4 financial summary. The revenue numbers are looking really strong this quarter 📈',
    timestamp: new Date(Date.now() - 3600000),
    reactions: [{ emoji: '🎉', count: 3 }, { emoji: '👍', count: 2 }],
  },
  {
    id: '2',
    user: 'Mike Johnson',
    avatar: 'MJ',
    content: 'That\'s great news! Can you share the breakdown by product line?',
    timestamp: new Date(Date.now() - 3000000),
  },
  {
    id: '3',
    user: 'Sarah Chen',
    avatar: 'SC',
    content: 'Sure! Here\'s the breakdown:\n\n• Product A: $45,000 (+12%)\n• Product B: $38,500 (+8%)\n• Services: $72,500 (+15%)\n\nThe services segment really drove growth this quarter.',
    timestamp: new Date(Date.now() - 2400000),
    reactions: [{ emoji: '📊', count: 1 }],
  },
  {
    id: '4',
    user: 'Emily Davis',
    avatar: 'ED',
    content: 'These are impressive numbers! @Sarah should we schedule a team meeting to discuss the Q1 projections?',
    timestamp: new Date(Date.now() - 1800000),
  },
  {
    id: '5',
    user: 'Alex Kim',
    avatar: 'AK',
    content: 'I\'ve updated the expense tracking spreadsheet with November data. Also flagged a few transactions that need review.',
    timestamp: new Date(Date.now() - 1200000),
    reactions: [{ emoji: '✅', count: 1 }],
  },
];

export default function ChatPage() {
  const [activeChannel, setActiveChannel] = useState<Channel>(channels[0]);
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [input, setInput] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user: 'You',
      avatar: 'ME',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="h-[calc(100vh-180px)] flex">
      {/* Sidebar */}
      <div className="w-64 bg-white/[0.02] border-r border-white/5 flex flex-col">
        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations"
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Channels</span>
              <button className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannel(channel)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${
                    activeChannel.id === channel.id
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <HashtagIcon className="w-4 h-4" />
                    <span>{channel.name}</span>
                  </div>
                  {channel.unread && (
                    <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                      {channel.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-2 mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Direct Messages</span>
              <button className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              {directMessages.map((dm) => (
                <button
                  key={dm.id}
                  onClick={() => setActiveChannel(dm)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                    activeChannel.id === dm.id
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-medium text-white">
                      {dm.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    {dm.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0f1115]" />
                    )}
                  </div>
                  <span className="truncate">{dm.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Status */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-sm font-bold text-white">
                ME
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0f1115]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Your Name</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-14 px-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            {activeChannel.type === 'channel' ? (
              <HashtagIcon className="w-5 h-5 text-gray-400" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-sm font-medium text-white">
                {activeChannel.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
            <div>
              <h2 className="font-semibold text-white">{activeChannel.name}</h2>
              {activeChannel.type === 'channel' && (
                <p className="text-xs text-gray-500">{activeChannel.members} members</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <PhoneIcon className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <VideoCameraIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowMembers(!showMembers)}
              className={`p-2 rounded-lg transition-colors ${
                showMembers ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <UserGroupIcon className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <InformationCircleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message, index) => {
              const showAvatar = index === 0 || messages[index - 1].user !== message.user;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${!showAvatar ? 'ml-11' : ''}`}
                >
                  {showAvatar && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {message.avatar}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {showAvatar && (
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-white">{message.user}</span>
                        <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                      </div>
                    )}
                    <p className="text-gray-300 whitespace-pre-wrap">{message.content}</p>
                    {message.reactions && (
                      <div className="flex items-center gap-1 mt-2">
                        {message.reactions.map((reaction, i) => (
                          <button
                            key={i}
                            className="flex items-center gap-1 px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded-full text-sm transition-colors"
                          >
                            <span>{reaction.emoji}</span>
                            <span className="text-gray-400">{reaction.count}</span>
                          </button>
                        ))}
                        <button className="p-1 rounded-full hover:bg-white/10 text-gray-500 transition-colors">
                          <FaceSmileIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Members Panel */}
          <AnimatePresence>
            {showMembers && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 240, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l border-white/5 overflow-hidden"
              >
                <div className="w-60 p-4">
                  <h3 className="text-sm font-semibold text-white mb-4">Members • {activeChannel.members || 1}</h3>
                  <div className="space-y-3">
                    {['Sarah Chen', 'Mike Johnson', 'Emily Davis', 'Alex Kim', 'You'].map((name, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-medium text-white">
                            {name === 'You' ? 'ME' : name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0f1115] ${
                            i < 3 ? 'bg-emerald-400' : 'bg-gray-500'
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm text-white">{name}</p>
                          <p className="text-xs text-gray-500">{i < 3 ? 'Online' : 'Offline'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <button
              type="button"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Message #${activeChannel.name}`}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                >
                  <AtSymbolIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                >
                  <FaceSmileIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                >
                  <PaperClipIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!input.trim()}
              className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
