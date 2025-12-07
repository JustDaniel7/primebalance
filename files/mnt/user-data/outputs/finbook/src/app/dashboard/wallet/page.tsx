'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui';
import { useStore } from '@/store';
import {
  WalletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsRightLeftIcon,
  QrCodeIcon,
  ClipboardIcon,
  CheckIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const tokenLogos: Record<string, string> = {
  ETH: '⟠',
  USDC: '◎',
  SOL: '◐',
  USDT: '₮',
  BTC: '₿',
};

const tokenColors: Record<string, string> = {
  ETH: 'from-blue-500/20 to-indigo-600/10 border-blue-500/30',
  USDC: 'from-sky-500/20 to-blue-600/10 border-sky-500/30',
  SOL: 'from-violet-500/20 to-purple-600/10 border-violet-500/30',
  USDT: 'from-emerald-500/20 to-green-600/10 border-emerald-500/30',
  BTC: 'from-amber-500/20 to-orange-600/10 border-amber-500/30',
};

export default function WalletPage() {
  const { tokens } = useStore();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'tokens' | 'transactions' | 'settings'>('tokens');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const walletAddress = '0x7a3B...8f4D';
  const fullAddress = '0x7a3B4c5D6E7F8a9B0C1d2E3f4A5b6C7D8E9f8f4D';

  const totalValue = tokens.reduce((sum, t) => sum + t.usdValue, 0);

  const recentWalletTxs = [
    { id: '1', type: 'receive', token: 'ETH', amount: 0.5, from: '0x1234...5678', timestamp: '2 hours ago', status: 'confirmed' },
    { id: '2', type: 'send', token: 'USDC', amount: 1000, to: '0xabcd...ef01', timestamp: '1 day ago', status: 'confirmed' },
    { id: '3', type: 'swap', tokenFrom: 'ETH', tokenTo: 'USDC', amountFrom: 0.3, amountTo: 540, timestamp: '3 days ago', status: 'confirmed' },
    { id: '4', type: 'receive', token: 'SOL', amount: 25, from: '0x9876...5432', timestamp: '1 week ago', status: 'confirmed' },
  ];

  const copyAddress = () => {
    navigator.clipboard.writeText(fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/20">
              <WalletIcon className="w-6 h-6 text-amber-400" />
            </div>
            Crypto Wallet
          </h1>
          <p className="text-gray-400 mt-1">Manage your digital assets and tokens</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowReceiveModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium text-white transition-colors"
          >
            <ArrowDownIcon className="w-5 h-5 text-emerald-400" />
            Receive
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-medium text-white shadow-lg shadow-emerald-500/25"
          >
            <ArrowUpIcon className="w-5 h-5" />
            Send
          </motion.button>
        </div>
      </div>

      {/* Wallet Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-amber-500/10" />
          <div className="relative">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Portfolio Value</p>
                <p className="text-4xl font-bold text-white font-mono">
                  ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-emerald-400 text-sm font-medium">+$3,245.50</span>
                  <span className="text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full">+7.2%</span>
                  <span className="text-gray-500 text-xs">24h</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm text-gray-300 font-mono bg-white/5 px-3 py-1.5 rounded-lg">
                    {walletAddress}
                  </code>
                  <button
                    onClick={copyAddress}
                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                    {copied ? <CheckIcon className="w-4 h-4 text-emerald-400" /> : <ClipboardIcon className="w-4 h-4" />}
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <QrCodeIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Security Status */}
            <div className="flex items-center gap-4 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-400">Wallet Secured</p>
                <p className="text-xs text-gray-400">KYC verified • AML compliant • Multi-sig enabled</p>
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full">ERC-1400</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl w-fit">
        {['tokens', 'transactions', 'settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              activeTab === tab 
                ? 'bg-white/10 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tokens Tab */}
      {activeTab === 'tokens' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokens.map((token, index) => (
            <motion.div
              key={token.symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:border-white/20 transition-colors cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tokenColors[token.symbol]} flex items-center justify-center text-2xl`}>
                      {tokenLogos[token.symbol]}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{token.symbol}</p>
                      <p className="text-xs text-gray-500">{token.name}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    token.change24h >= 0 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-400 text-sm">Balance</span>
                    <span className="font-mono font-semibold text-white">
                      {token.balance.toLocaleString()} {token.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-400 text-sm">USD Value</span>
                    <span className="font-mono text-gray-300">
                      ${token.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-400 text-sm">Price</span>
                    <span className="font-mono text-gray-400 text-sm">
                      ${token.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                  <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-gray-300 transition-colors">
                    <ArrowUpIcon className="w-3 h-3" /> Send
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-gray-300 transition-colors">
                    <ArrowDownIcon className="w-3 h-3" /> Receive
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-gray-300 transition-colors">
                    <ArrowsRightLeftIcon className="w-3 h-3" /> Swap
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}

          {/* Add Token Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: tokens.length * 0.1 }}
          >
            <Card className="h-full min-h-[220px] flex flex-col items-center justify-center border-dashed border-white/10 hover:border-emerald-500/30 cursor-pointer transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-white/5 group-hover:bg-emerald-500/10 flex items-center justify-center mb-3 transition-colors">
                <span className="text-2xl text-gray-500 group-hover:text-emerald-400 transition-colors">+</span>
              </div>
              <p className="text-gray-500 group-hover:text-gray-300 font-medium transition-colors">Add Token</p>
              <p className="text-xs text-gray-600 mt-1">Import custom token</p>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Recent Wallet Activity</h3>
          <div className="space-y-3">
            {recentWalletTxs.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'receive' ? 'bg-emerald-500/10' :
                    tx.type === 'send' ? 'bg-rose-500/10' : 'bg-violet-500/10'
                  }`}>
                    {tx.type === 'receive' && <ArrowDownIcon className="w-5 h-5 text-emerald-400" />}
                    {tx.type === 'send' && <ArrowUpIcon className="w-5 h-5 text-rose-400" />}
                    {tx.type === 'swap' && <ArrowsRightLeftIcon className="w-5 h-5 text-violet-400" />}
                  </div>
                  <div>
                    <p className="font-medium text-white capitalize">{tx.type}</p>
                    <p className="text-xs text-gray-500">
                      {tx.type === 'swap' 
                        ? `${tx.amountFrom} ${tx.tokenFrom} → ${tx.amountTo} ${tx.tokenTo}`
                        : tx.type === 'receive' 
                          ? `From ${tx.from}`
                          : `To ${tx.to}`
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-medium ${
                    tx.type === 'receive' ? 'text-emerald-400' : 
                    tx.type === 'send' ? 'text-rose-400' : 'text-white'
                  }`}>
                    {tx.type === 'swap' 
                      ? `${tx.amountFrom} ${tx.tokenFrom}`
                      : `${tx.type === 'receive' ? '+' : '-'}${tx.amount} ${tx.token}`
                    }
                  </p>
                  <p className="text-xs text-gray-500">{tx.timestamp}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
              Security Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                <div>
                  <p className="font-medium text-white">Multi-Signature</p>
                  <p className="text-xs text-gray-500">Require multiple approvals</p>
                </div>
                <button className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-sm rounded-lg">
                  Enabled
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                <div>
                  <p className="font-medium text-white">Transaction Limits</p>
                  <p className="text-xs text-gray-500">Daily: $50,000 | Per tx: $10,000</p>
                </div>
                <button className="px-3 py-1.5 bg-white/5 text-gray-300 text-sm rounded-lg hover:bg-white/10 transition-colors">
                  Configure
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                <div>
                  <p className="font-medium text-white">Whitelist Addresses</p>
                  <p className="text-xs text-gray-500">Only send to approved addresses</p>
                </div>
                <button className="px-3 py-1.5 bg-white/5 text-gray-300 text-sm rounded-lg hover:bg-white/10 transition-colors">
                  Manage
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <GlobeAltIcon className="w-5 h-5 text-sky-400" />
              Network Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                <div>
                  <p className="font-medium text-white">Primary Network</p>
                  <p className="text-xs text-gray-500">Ethereum Mainnet</p>
                </div>
                <button className="px-3 py-1.5 bg-white/5 text-gray-300 text-sm rounded-lg hover:bg-white/10 transition-colors">
                  Change
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                <div>
                  <p className="font-medium text-white">Gas Price Strategy</p>
                  <p className="text-xs text-gray-500">Optimized for low fees (&lt;10¢)</p>
                </div>
                <button className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-sm rounded-lg">
                  Active
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="font-medium text-amber-400">Oracle Status</p>
                    <p className="text-xs text-gray-400">Price feeds updating every 15s</p>
                  </div>
                </div>
                <span className="text-xs text-amber-400">Live</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Send Modal */}
      <AnimatePresence>
        {showSendModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowSendModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1d24] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-6">Send Crypto</h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Token</label>
                  <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                    {tokens.map(t => (
                      <option key={t.symbol} value={t.symbol}>{t.symbol} - {t.balance} available</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Recipient Address</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-400 hover:text-emerald-300">
                      MAX
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-white/[0.02] rounded-xl space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Network Fee</span>
                    <span className="text-white">~$0.08</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Estimated Gas</span>
                    <span className="text-white">~1,800 gwei</span>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSendModal(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-medium text-white"
                  >
                    Send
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receive Modal */}
      <AnimatePresence>
        {showReceiveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowReceiveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1d24] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl text-center"
            >
              <h2 className="text-xl font-bold text-white mb-6">Receive Crypto</h2>
              <div className="bg-white p-4 rounded-xl inline-block mb-4">
                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <QrCodeIcon className="w-32 h-32 text-gray-800" />
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-2">Your wallet address</p>
              <div className="flex items-center justify-center gap-2 mb-6">
                <code className="text-sm text-gray-300 font-mono bg-white/5 px-4 py-2 rounded-lg">
                  {fullAddress}
                </code>
                <button
                  onClick={copyAddress}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  {copied ? <CheckIcon className="w-4 h-4 text-emerald-400" /> : <ClipboardIcon className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-gray-300 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
