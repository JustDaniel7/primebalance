'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui';
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

const getAIResponse = (input: string): { content: string; suggestions?: string[] } => {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('expense') || lowerInput.includes('spending') || lowerInput.includes('top')) {
    return {
      content: `Based on your transaction history, your top 5 expenses this month are:

**1. Payroll & Contractors** - $24,500 (54%)
**2. Software & SaaS** - $4,200 (9%)
**3. Cloud Infrastructure** - $3,800 (8%)
**4. Marketing** - $2,100 (5%)
**5. Office & Supplies** - $1,400 (3%)

I noticed your cloud costs increased 23% from last month. Would you like me to analyze potential optimization opportunities?`,
      suggestions: ['Analyze cloud cost optimization', 'Compare to industry benchmarks', 'Set up expense alerts'],
    };
  }
  
  if (lowerInput.includes('forecast') || lowerInput.includes('cash flow') || lowerInput.includes('projection')) {
    return {
      content: `I've generated a 90-day cash flow forecast based on your historical data:

**Projected Cash Position:**
- Day 30: $92,400
- Day 60: $108,200
- Day 90: $125,800

**Key Assumptions:**
- Revenue growth: 8% MoM
- Operating expenses: Stable
- No major capital expenditures

Your runway looks healthy! Would you like me to run different scenarios?`,
      suggestions: ['Run pessimistic scenario', 'Factor in planned hiring', 'Export forecast to Excel'],
    };
  }
  
  if (lowerInput.includes('uncategorized') || lowerInput.includes('categorize')) {
    return {
      content: `I found **7 uncategorized transactions** totaling $2,847.50:

1. AMZN*2X4K8J - $234.99 (Dec 3)
2. STRIPE TRANSFER - $1,500.00 (Dec 2)
3. SQ *COFFEE - $12.45 (Dec 1)
4. UBER *TRIP - $45.60 (Nov 30)
5. GOOGLE *ADS - $854.46 (Nov 28)
6. MAILCHIMP - $150.00 (Nov 27)
7. ZOOM.US - $50.00 (Nov 26)

Would you like me to suggest categories for each?`,
      suggestions: ['Auto-categorize all', 'Review one by one', 'Set up rules for future'],
    };
  }
  
  if (lowerInput.includes('tax') || lowerInput.includes('rate') || lowerInput.includes('deduction')) {
    return {
      content: `Based on your YTD income and deductions, here's your estimated tax situation:

**Effective Tax Rate:** 28.4%

**Breakdown:**
- Federal Income Tax: 22%
- State Tax (CA): 9.3%
- Self-Employment: 15.3% (on 92.35%)

**Deductions Applied:**
- Business expenses: $45,000
- Home office: $4,800
- Health insurance: $7,200
- Retirement (SEP-IRA): $12,500

You could reduce your rate by maximizing retirement contributions before year-end.`,
      suggestions: ['Calculate max SEP-IRA contribution', 'Find more deductions', 'Estimate quarterly payment'],
    };
  }
  
  if (lowerInput.includes('report') || lowerInput.includes('summary')) {
    return {
      content: `Here's your financial summary for this month:

**Revenue:** $23,750 (+12% vs last month)
**Expenses:** $8,340 (-5% vs last month)
**Net Income:** $15,410

**Key Highlights:**
- Subscription revenue grew 15%
- Successfully reduced cloud costs by $450
- 3 new clients onboarded

Would you like me to generate a detailed PDF report?`,
      suggestions: ['Generate PDF report', 'Email summary to team', 'Compare to last quarter'],
    };
  }
  
  if (lowerInput.includes('reduce') || lowerInput.includes('save') || lowerInput.includes('cut')) {
    return {
      content: `Based on your expense patterns, here are my top recommendations to reduce costs:

**1. Consolidate SaaS subscriptions** - Potential savings: $340/mo
   - You have 3 project management tools, consider using just one

**2. Negotiate cloud contracts** - Potential savings: $500/mo
   - Your AWS usage qualifies for reserved instance pricing

**3. Review recurring charges** - Potential savings: $180/mo
   - Found 4 unused subscriptions still being charged

**4. Optimize payment timing** - Potential savings: $120/mo
   - Early payment discounts available from 2 vendors

Total potential monthly savings: **$1,140/month**`,
      suggestions: ['Show unused subscriptions', 'Contact AWS about pricing', 'Set up payment reminders'],
    };
  }
  
  return {
    content: `I'd be happy to help with that! Here's what I can assist you with:

• **Financial reporting** - Generate P&L, balance sheets, cash flow statements
• **Transaction management** - Categorize, search, and analyze transactions
• **Tax planning** - Estimates, deductions, and optimization strategies
• **Budget forecasting** - Cash flow projections and scenario analysis
• **Expense optimization** - Find savings opportunities and reduce costs
• **Crypto accounting** - Track holdings and calculate tax implications

What would you like to explore?`,
    suggestions: ['Show me a dashboard summary', 'Review recent transactions', 'Help with tax planning'],
  };
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
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
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback((text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = getAIResponse(messageText);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  }, [input, isTyping]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    handleSend(suggestion);
  }, [handleSend]);

  const handleQuickAction = useCallback((prompt: string) => {
    handleSend(prompt);
  }, [handleSend]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessageContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className={i > 0 ? 'mt-2' : ''}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="text-white">{part.slice(2, -2)}</strong>;
            }
            return <span key={j}>{part}</span>;
          })}
        </p>
      );
    });
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 border border-violet-500/20">
              <SparklesIcon className="w-5 sm:w-6 h-5 sm:h-6 text-violet-400" />
            </div>
            <span className="hidden sm:inline">AI Financial Assistant</span>
            <span className="sm:hidden">AI Assistant</span>
          </h1>
          <p className="text-gray-400 mt-1 text-sm hidden sm:block">Powered by advanced AI for intelligent financial insights</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Online</span>
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleQuickAction(action.prompt)}
              disabled={isTyping}
              className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl transition-colors text-left disabled:opacity-50"
            >
              <div className="p-1.5 sm:p-2 rounded-lg bg-white/5 shrink-0">
                <Icon className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-300 truncate">{action.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[90%] sm:max-w-[80%] ${message.role === 'user' ? 'order-2' : ''}`}>
                <div className={`flex items-start gap-2 sm:gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-7 sm:w-8 h-7 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    message.role === 'assistant' 
                      ? 'bg-gradient-to-br from-violet-500 to-purple-600' 
                      : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  }`}>
                    {message.role === 'assistant' ? (
                      <SparklesIcon className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
                    ) : (
                      <span className="text-xs font-bold text-white">U</span>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`space-y-2 ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`p-3 sm:p-4 rounded-2xl ${
                      message.role === 'assistant' 
                        ? 'bg-white/[0.03] border border-white/5' 
                        : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/20'
                    }`}>
                      <div className="text-sm text-gray-200 whitespace-pre-wrap">
                        {renderMessageContent(message.content)}
                      </div>
                    </div>

                    {/* Copy Button */}
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
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.suggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestionClick(suggestion)}
                            disabled={isTyping}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-gray-300 hover:text-white transition-colors disabled:opacity-50"
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
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-2 h-2 bg-violet-400 rounded-full" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 bg-violet-400 rounded-full" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 bg-violet-400 rounded-full" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 sm:p-4 border-t border-white/5">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <PaperClipIcon className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your finances..."
                disabled={isTyping}
                className="w-full px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50 text-sm sm:text-base"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTyping ? (
                <ArrowPathIcon className="w-4 sm:w-5 h-4 sm:h-5 animate-spin" />
              ) : (
                <PaperAirplaneIcon className="w-4 sm:w-5 h-4 sm:h-5" />
              )}
            </motion.button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center hidden sm:block">
            AI responses are for informational purposes only. Always verify important financial decisions.
          </p>
        </div>
      </Card>
    </div>
  );
}