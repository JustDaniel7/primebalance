'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui';
import {
  PaperAirplaneIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PaperClipIcon,
  FaceSmileIcon,
  AtSymbolIcon,
  HashtagIcon,
  PhoneIcon,
  VideoCameraIcon,
  InformationCircleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Channel {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  unread?: number;
  members?: number;
  online?: boolean;
}

interface ChatMessage {
  id: string;
  channelId: string;
  user: string;
  avatar: string;
  content: string;
  timestamp: Date;
  reactions?: { emoji: string; count: number }[];
}

const channels: Channel[] = [
  { id: 'general', name: 'general', type: 'channel', unread: 3, members: 12 },
  { id: 'finance-team', name: 'finance-team', type: 'channel', members: 5 },
  { id: 'tax-discussions', name: 'tax-discussions', type: 'channel', unread: 1, members: 4 },
  { id: 'quarterly-review', name: 'quarterly-review', type: 'channel', members: 8 },
];

const directMessages: Channel[] = [
  { id: 'dm-sarah', name: 'Sarah Chen', type: 'dm', online: true },
  { id: 'dm-mike', name: 'Mike Johnson', type: 'dm', online: true },
  { id: 'dm-emily', name: 'Emily Davis', type: 'dm', online: false },
  { id: 'dm-alex', name: 'Alex Kim', type: 'dm', online: false },
];

const initialMessages: Record<string, ChatMessage[]> = {
  'general': [
    { id: '1', channelId: 'general', user: 'Sarah Chen', avatar: 'SC', content: 'Hey team! Just finished the Q4 financial summary. The revenue numbers are looking really strong this quarter 📈', timestamp: new Date(Date.now() - 3600000), reactions: [{ emoji: '🎉', count: 3 }, { emoji: '👍', count: 2 }] },
    { id: '2', channelId: 'general', user: 'Mike Johnson', avatar: 'MJ', content: "That's great news! Can you share the breakdown by product line?", timestamp: new Date(Date.now() - 3000000) },
    { id: '3', channelId: 'general', user: 'Sarah Chen', avatar: 'SC', content: "Sure! Here's the breakdown:\n\n• Product A: $45,000 (+12%)\n• Product B: $38,500 (+8%)\n• Services: $72,500 (+15%)", timestamp: new Date(Date.now() - 2400000), reactions: [{ emoji: '📊', count: 1 }] },
  ],
  'finance-team': [
    { id: '1', channelId: 'finance-team', user: 'Emily Davis', avatar: 'ED', content: 'The new expense tracking system is now live! Please start logging your receipts there.', timestamp: new Date(Date.now() - 7200000) },
    { id: '2', channelId: 'finance-team', user: 'Alex Kim', avatar: 'AK', content: "Perfect timing! I have a bunch of receipts from last week's conference.", timestamp: new Date(Date.now() - 6000000) },
  ],
  'tax-discussions': [
    { id: '1', channelId: 'tax-discussions', user: 'Mike Johnson', avatar: 'MJ', content: 'Q4 estimated taxes are due January 15th. Please make sure all deductions are documented.', timestamp: new Date(Date.now() - 86400000) },
    { id: '2', channelId: 'tax-discussions', user: 'Sarah Chen', avatar: 'SC', content: "I've compiled a list of potential deductions we might have missed. Can we review tomorrow?", timestamp: new Date(Date.now() - 43200000), reactions: [{ emoji: '✅', count: 2 }] },
  ],
  'quarterly-review': [
    { id: '1', channelId: 'quarterly-review', user: 'Emily Davis', avatar: 'ED', content: 'Quarterly review meeting scheduled for Friday at 2pm. Please prepare your department summaries.', timestamp: new Date(Date.now() - 172800000) },
  ],
  'dm-sarah': [
    { id: '1', channelId: 'dm-sarah', user: 'Sarah Chen', avatar: 'SC', content: 'Hey! Do you have time to review the budget proposal today?', timestamp: new Date(Date.now() - 1800000) },
    { id: '2', channelId: 'dm-sarah', user: 'You', avatar: 'ME', content: "Sure, I can take a look this afternoon. What's the deadline?", timestamp: new Date(Date.now() - 1200000) },
    { id: '3', channelId: 'dm-sarah', user: 'Sarah Chen', avatar: 'SC', content: 'End of week would be great. Thanks!', timestamp: new Date(Date.now() - 600000) },
  ],
  'dm-mike': [
    { id: '1', channelId: 'dm-mike', user: 'Mike Johnson', avatar: 'MJ', content: 'Can you review the invoice from the new vendor?', timestamp: new Date(Date.now() - 3600000) },
  ],
  'dm-emily': [
    { id: '1', channelId: 'dm-emily', user: 'Emily Davis', avatar: 'ED', content: 'Meeting at 3pm confirmed for tomorrow.', timestamp: new Date(Date.now() - 86400000) },
  ],
  'dm-alex': [
    { id: '1', channelId: 'dm-alex', user: 'Alex Kim', avatar: 'AK', content: 'Updated the spreadsheet with the latest numbers.', timestamp: new Date(Date.now() - 172800000) },
  ],
};

export default function ChatPage() {
  const [activeChannel, setActiveChannel] = useState<Channel>(channels[0]);
  const [allMessages, setAllMessages] = useState<Record<string, ChatMessage[]>>(initialMessages);
  const [input, setInput] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentMessages = allMessages[activeChannel.id] || [];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, scrollToBottom]);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      channelId: activeChannel.id,
      user: 'You',
      avatar: 'ME',
      content: input,
      timestamp: new Date(),
    };

    setAllMessages(prev => ({
      ...prev,
      [activeChannel.id]: [...(prev[activeChannel.id] || []), newMessage],
    }));
    setInput('');
  };

  const handleChannelSelect = (channel: Channel) => {
    setActiveChannel(channel);
    setShowSidebar(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="h-[calc(100vh-180px)] flex relative">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="lg:hidden absolute top-2 left-2 z-50 p-2 bg-surface-800 rounded-lg border border-white/10"
      >
        {showSidebar ? <XMarkIcon className="w-5 h-5 text-white" /> : <Bars3Icon className="w-5 h-5 text-white" />}
      </button>

      {/* Sidebar Backdrop */}
      {showSidebar && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setShowSidebar(false)} />
      )}

      {/* Sidebar */}
      <div className={`
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 fixed lg:relative z-40 lg:z-0
        w-64 h-full bg-[#0f1115] border-r border-white/5 flex flex-col transition-transform duration-300
      `}>
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
                  onClick={() => handleChannelSelect(channel)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${
                    activeChannel.id === channel.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <HashtagIcon className="w-4 h-4" />
                    <span>{channel.name}</span>
                  </div>
                  {channel.unread && (
                    <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-xs rounded-full">{channel.unread}</span>
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
                  onClick={() => handleChannelSelect(dm)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                    activeChannel.id === dm.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
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

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-sm font-bold text-white">ME</div>
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="h-14 px-4 lg:px-6 flex items-center justify-between border-b border-white/5 bg-[#0f1115]/80">
          <div className="flex items-center gap-3 ml-10 lg:ml-0">
            {activeChannel.type === 'channel' ? (
              <HashtagIcon className="w-5 h-5 text-gray-400" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-sm font-medium text-white">
                {activeChannel.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
            <div>
              <h2 className="font-semibold text-white text-sm lg:text-base">{activeChannel.name}</h2>
              {activeChannel.type === 'channel' && (
                <p className="text-xs text-gray-500 hidden sm:block">{activeChannel.members} members</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors hidden sm:block">
              <PhoneIcon className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors hidden sm:block">
              <VideoCameraIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowMembers(!showMembers)}
              className={`p-2 rounded-lg transition-colors ${showMembers ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
            >
              <UserGroupIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
            {currentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  {activeChannel.type === 'channel' ? (
                    <HashtagIcon className="w-8 h-8 text-gray-500" />
                  ) : (
                    <span className="text-2xl font-bold text-gray-500">{activeChannel.name.split(' ').map(n => n[0]).join('')}</span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {activeChannel.type === 'channel' ? `Welcome to #${activeChannel.name}` : `Start a conversation with ${activeChannel.name}`}
                </h3>
                <p className="text-sm text-gray-500">Send a message to get started</p>
              </div>
            ) : (
              currentMessages.map((message, index) => {
                const showAvatar = index === 0 || currentMessages[index - 1].user !== message.user;
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${!showAvatar ? 'ml-11' : ''}`}
                  >
                    {showAvatar && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                        message.user === 'You' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-violet-500 to-purple-600'
                      }`}>
                        {message.avatar}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {showAvatar && (
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-semibold text-white text-sm">{message.user}</span>
                          <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                        </div>
                      )}
                      <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      {message.reactions && (
                        <div className="flex items-center gap-1 mt-2">
                          {message.reactions.map((reaction, i) => (
                            <button key={i} className="flex items-center gap-1 px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded-full text-sm transition-colors">
                              <span>{reaction.emoji}</span>
                              <span className="text-gray-400">{reaction.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Members Panel */}
          <AnimatePresence>
            {showMembers && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 200, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l border-white/5 overflow-hidden hidden lg:block"
              >
                <div className="w-[200px] p-4">
                  <h3 className="text-sm font-semibold text-white mb-4">Members • {activeChannel.members || 2}</h3>
                  <div className="space-y-3">
                    {['Sarah Chen', 'Mike Johnson', 'Emily Davis', 'Alex Kim', 'You'].slice(0, activeChannel.members || 2).map((name, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-medium text-white">
                            {name === 'You' ? 'ME' : name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-[#0f1115] ${i < 3 ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">{name}</p>
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
        <div className="p-3 lg:p-4 border-t border-white/5">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2 lg:gap-3">
            <button type="button" className="p-2 lg:p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <PlusIcon className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Message ${activeChannel.type === 'channel' ? '#' : ''}${activeChannel.name}`}
                className="w-full px-4 py-2.5 lg:py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm lg:text-base"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1">
                <button type="button" className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                  <AtSymbolIcon className="w-5 h-5" />
                </button>
                <button type="button" className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                  <FaceSmileIcon className="w-5 h-5" />
                </button>
                <button type="button" className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                  <PaperClipIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 lg:p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}