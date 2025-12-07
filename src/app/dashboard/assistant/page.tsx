'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui';
import { useStore } from '@/index';
import {
  SparklesIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CalculatorIcon,
  LightBulbIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  MicrophoneIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const quickActions = [
  { icon: DocumentTextIcon, label: 'Generate Report', prompt: 'Generate a financial summary report for this month' },
  { icon: ChartBarIcon, label: 'Analyze Trends', prompt: 'Analyze my spending trends over the past 6 months' },
  { icon: CalculatorIcon, label: 'Tax Estimate', prompt: 'Estimate my quarterly tax payment' },
  { icon: LightBulbIcon, label: 'Savings Tips', prompt: 'Suggest ways to reduce my business expenses' },
];

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hello! I'm your AI financial assistant. I can help you with bookkeeping, tax questions, financial analysis, and more. What would you like to know?",
    timestamp: new Date(),
    suggestions: [
      'What are my top expenses this month?',
      'Generate a cash flow forecast',
      'Find uncategorized transactions',
      'Calculate my effective tax rate',
    ],
  },
];

export default function AssistantPage() {
  const { aiMessages } = useStore();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses: Record<string, { content: string; suggestions?: string[] }> = {
        expenses: {
          content: "Based on your transaction history, your top 5 expenses this month are:\n\n1. **Payroll & Contractors** - $24,500 (54%)\n2. **Software & SaaS** - $4,200 (9%)\n3. **Cloud Infrastructure** - $3,800 (8%)\n4. **Marketing** - $2,100 (5%)\n5. **Office & Supplies** - $1,400 (3%)\n\nI noticed your cloud costs increased 23% from last month. Would you like me to analyze potential optimization opportunities?",
          suggestions: ['Analyze cloud cost optimization', 'Compare to industry benchmarks', 'Set up expense alerts'],
        },
        forecast: {
          content: "I've generated a 90-day cash flow forecast based on your historical data:\n\n**Projected Cash Position:**\n- Day 30: $92,400\n- Day 60: $108,200\n- Day 90: $125,800\n\n**Key Assumptions:**\n- Revenue growth: 8% MoM\n- Operating expenses: Stable\n- No major capital expenditures\n\nYour runway looks healthy! Would you like me to run different scenarios?",
          suggestions: ['Run pessimistic scenario', 'Factor in planned hiring', 'Export forecast to Excel'],
        },
        uncategorized: {
          content: "I found **7 uncategorized transactions** totaling $2,847.50:\n\n1. AMZN*2X4K8J - $234.99 (Dec 3)\n2. STRIPE TRANSFER - $1,500.00 (Dec 2)\n3. SQ *COFFEE - $12.45 (Dec 1)\n4. UBER *TRIP - $45.60 (Nov 30)\n5. GOOGLE *ADS - $854.46 (Nov 28)\n6. MAILCHIMP - $150.00 (Nov 27)\n7. ZOOM.US - $50.00 (Nov 26)\n\nWould you like me to suggest categories for each?",
          suggestions: ['Auto-categorize all', 'Review one by one', 'Set up rules for future'],
        },
        tax: {
          content: "Based on your YTD income and deductions, here's your estimated tax situation:\n\n**Effective Tax Rate:** 28.4%\n\n**Breakdown:**\n- Federal Income Tax: 22%\n- State Tax (CA): 9.3%\n- Self-Employment: 15.3% (on 92.35%)\n\n**Deductions Applied:**\n- Business expenses: $45,000\n- Home office: $4,800\n- Health insurance: $7,200\n- Retirement (SEP-IRA): $12,500\n\nYou could reduce your rate by maximizing retirement contributions before year-end.",
          suggestions: ['Calculate max SEP-IRA contribution', 'Find more deductions', 'Estimate quarterly payment'],
        },
        default: {
          content: "I'd be happy to help with that! Could you provide a bit more detail about what you're looking for? I can assist with:\n\n• Financial reporting and analysis\n• Transaction categorization\n• Tax planning and estimates\n• Budget forecasting\n• Expense optimization\n• Crypto tax calculations\n\nJust let me know what you need!",
          suggestions: ['Show me a dashboard summary', 'Review recent transactions', 'Help with tax planning'],
        },
      };

      let response = responses.default;
      const lowerText = messageText.toLowerCase();
      
      if (lowerText.includes('expense') || lowerText.includes('spending') || lowerText.includes('top')) {
        response = responses.expenses;
      } else if (lowerText.includes('forecast') || lowerText.includes('cash flow') || lowerText.includes('projection')) {
        response = responses.forecast;
      } else if (lowerText.includes('uncategorized') || lowerText.includes('categorize')) {
        response = responses.uncategorized;
      } else if (lowerText.includes('tax') || lowerText.includes('rate') || lowerText.includes('deduction')) {
        response = responses.tax;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 border border-violet-500/20">
              <SparklesIcon className="w-6 h-6 text-violet-400" />
            </div>
            AI Financial Assistant
          </h1>
          <p className="text-gray-400 mt-1">Powered by advanced AI for intelligent financial insights</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Online</span>
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSend(action.prompt)}
              className="flex items-center gap-3 p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-white/5">
                <Icon className="w-4 h-4 text-gray-400" />
              </div>
              <span className="text-sm font-medium text-gray-300">{action.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : ''}`}>
                <div className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    message.role === 'assistant' 
                      ? 'bg-gradient-to-br from-violet-500 to-purple-600' 
                      : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  }`}>
                    {message.role === 'assistant' ? (
                      <SparklesIcon className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-xs font-bold text-white">U</span>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`space-y-2 ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`p-4 rounded-2xl ${
                      message.role === 'assistant' 
                        ? 'bg-white/[0.03] border border-white/5' 
                        : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/20'
                    }`}>
                      <div className="text-sm text-gray-200 whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
                        {message.content.split('\n').map((line, i) => {
                          // Handle bold text
                          const parts = line.split(/(\*\*.*?\*\*)/g);
                          return (
                            <p key={i} className={i > 0 ? 'mt-2' : ''}>
                              {parts.map((part, j) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                  return <strong key={j} className="text-white">{part.slice(2, -2)}</strong>;
                                }
                                return part;
                              })}
                            </p>
                          );
                        })}
                      </div>
                    </div>

                    {/* Copy Button for Assistant Messages */}
                    {message.role === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {copied === message.id ? (
                          <>
                            <CheckIcon className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <ClipboardDocumentIcon className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Suggestions */}
                    {message.suggestions && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.suggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(suggestion)}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-gray-300 hover:text-white transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4 text-white" />
                </div>
                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                  <div className="flex items-center gap-1">
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 bg-violet-400 rounded-full"
                    />
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 bg-violet-400 rounded-full"
                    />
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 bg-violet-400 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
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
              <PaperClipIcon className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about your finances..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 pr-12"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <MicrophoneIcon className="w-5 h-5" />
              </button>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTyping ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <PaperAirplaneIcon className="w-5 h-5" />
              )}
            </motion.button>
          </form>
          <p className="text-xs text-gray-500 mt-2 text-center">
            AI responses are for informational purposes only. Always verify important financial decisions.
          </p>
        </div>
      </Card>
    </div>
  );
}
