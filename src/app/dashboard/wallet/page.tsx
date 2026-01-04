'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store';
import { useWalletStore } from '@/store/wallet-store'
import { useThemeStore } from '@/store/theme-store'
import { Card, Button, Badge } from '@/components/ui'
import { WalletIcon, TrendUpIcon, TrendDownIcon } from '@/components/ui/Icons'
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  Layers,
  Image,
  Wallet,
  Send,
  Download,
  ArrowLeftRight,
  Coins,
  Plus,
  X,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  MoreVertical,
  Copy,
  ExternalLink,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type { CryptoToken } from '@/types';
import React from "react";
import { useExchangeRates } from '@/hooks/useExchangeRates';
import toast from 'react-hot-toast';

// =============================================================================
// TYPES
// =============================================================================

interface WalletData {
  id: string;
  name: string;
  address: string;
  network: string;
  provider?: string;
  isActive: boolean;
  createdAt: string;
}

interface WalletTransaction {
  id: string;
  type: 'send' | 'receive' | 'swap';
  token: string;
  amount: number;
  usdValue: number;
  from?: string;
  to?: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  txHash?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const NETWORKS = [
  { value: 'ethereum', label: 'Ethereum', icon: 'Ξ', color: 'text-blue-500' },
  { value: 'polygon', label: 'Polygon', icon: '⬡', color: 'text-purple-500' },
  { value: 'solana', label: 'Solana', icon: '◎', color: 'text-green-500' },
  { value: 'arbitrum', label: 'Arbitrum', icon: '🔵', color: 'text-blue-400' },
  { value: 'bitcoin', label: 'Bitcoin', icon: '₿', color: 'text-orange-500' },
];

const PROVIDERS = ['metamask', 'coinbase', 'phantom', 'ledger', 'trust', 'other'];

// Demo transactions
const DEMO_TRANSACTIONS: WalletTransaction[] = [
  { id: '1', type: 'receive', token: 'ETH', amount: 2.5, usdValue: 5000, from: '0x1234...5678', status: 'completed', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', type: 'send', token: 'USDC', amount: 1000, usdValue: 1000, to: '0xabcd...efgh', status: 'completed', timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: '3', type: 'swap', token: 'ETH → USDC', amount: 1, usdValue: 2000, status: 'completed', timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: '4', type: 'receive', token: 'SOL', amount: 10, usdValue: 1000, from: '7EYn...87aw', status: 'pending', timestamp: new Date(Date.now() - 1800000).toISOString() },
];

// =============================================================================
// API HELPERS
// =============================================================================

async function fetchWallets(): Promise<WalletData[]> {
  const res = await fetch('/api/wallets');
  if (!res.ok) throw new Error('Failed to fetch wallets');
  const data = await res.json();
  return data.wallets || [];
}

async function createWallet(data: Partial<WalletData>): Promise<WalletData> {
  const res = await fetch('/api/wallets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create wallet');
  }
  return res.json();
}

async function updateWallet(id: string, data: Partial<WalletData>): Promise<WalletData> {
  const res = await fetch(`/api/wallets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update wallet');
  }
  return res.json();
}

async function deleteWallet(id: string): Promise<void> {
  const res = await fetch(`/api/wallets/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete wallet');
  }
}

// =============================================================================
// HELPERS
// =============================================================================

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

const getNetworkConfig = (network: string) => {
  return NETWORKS.find((n) => n.value === network) || NETWORKS[0];
};

const copyToClipboard = async (text: string) => {
  await navigator.clipboard.writeText(text);
};

// =============================================================================
// WALLET WIZARD MODAL
// =============================================================================

interface WalletWizardProps {
  wallet?: WalletData | null;
  onClose: () => void;
  onSave: (data: Partial<WalletData>) => Promise<void>;
  isSaving: boolean;
}

function WalletWizard({ wallet, onClose, onSave, isSaving }: WalletWizardProps) {
  const [formData, setFormData] = useState({
    name: wallet?.name || '',
    address: wallet?.address || '',
    network: wallet?.network || 'ethereum',
    provider: wallet?.provider && !['metamask', 'coinbase', 'phantom', 'ledger', 'trust'].includes(wallet.provider) ? 'other' : (wallet?.provider || ''),
    customProvider: wallet?.provider && !['metamask', 'coinbase', 'phantom', 'ledger', 'trust'].includes(wallet.provider) ? wallet.provider : '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!formData.name.trim()) {
      setError('Wallet name is required');
      return;
    }
    if (!formData.address.trim()) {
      setError('Wallet address is required');
      return;
    }
    if (formData.provider === 'other' && !formData.customProvider.trim()) {
      setError('Please specify the provider name');
      return;
    }

    try {
      // Use customProvider when 'other' is selected
      const submitData = {
        ...formData,
        provider: formData.provider === 'other' ? formData.customProvider : formData.provider,
      };
      await onSave(submitData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-md"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-surface-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {wallet ? 'Edit Wallet' : 'Add Wallet'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {wallet ? 'Update wallet details' : 'Connect a new wallet'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Wallet Name *
              </label>
              <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Main ETH Wallet"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Wallet Address *
              </label>
              <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="0x..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Network *
              </label>
              <select
                  value={formData.network}
                  onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
              >
                {NETWORKS.map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.icon} {n.label}
                    </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Provider
              </label>
              <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value, customProvider: e.target.value === 'other' ? formData.customProvider : '' })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white capitalize"
              >
                <option value="">Select provider</option>
                {PROVIDERS.map((p) => (
                    <option key={p} value={p} className="capitalize">{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom provider input when 'other' is selected */}
          {formData.provider === 'other' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Custom Provider Name
              </label>
              <input
                type="text"
                value={formData.customProvider}
                onChange={(e) => setFormData({ ...formData, customProvider: e.target.value })}
                placeholder="Enter your wallet provider name"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white placeholder-gray-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter the name of your wallet provider (e.g., Rainbow, Argent, Trezor)
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-surface-700">
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
              ) : wallet ? 'Update Wallet' : 'Add Wallet'}
            </Button>
          </div>
        </motion.div>
      </div>
  );
}

// =============================================================================
// DELETE CONFIRMATION
// =============================================================================

interface DeleteConfirmProps {
  wallet: WalletData;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

function DeleteConfirmModal({ wallet, onClose, onConfirm, isDeleting }: DeleteConfirmProps) {
  return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-md"
        >
          <div className="p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
              Remove Wallet?
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mt-2">
              Are you sure you want to remove <strong>{wallet.name}</strong>?
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-surface-700">
            <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
              Cancel
            </Button>
            <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remove'}
            </button>
          </div>
        </motion.div>
      </div>
  );
}

// =============================================================================
// WALLET CARD
// =============================================================================

interface WalletCardProps {
  wallet: WalletData;
  onEdit: () => void;
  onDelete: () => void;
}

function WalletCard({ wallet, onEdit, onDelete }: WalletCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const network = getNetworkConfig(wallet.network);

  const handleCopy = async () => {
    await copyToClipboard(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
      <Card variant="glass" padding="md" hover className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gray-100 dark:bg-surface-700 flex items-center justify-center text-xl ${network.color}`}>
              {network.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{wallet.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{network.label}</p>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg">
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            {menuOpen && (
                <React.Fragment>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-gray-200 dark:border-surface-700 py-1 z-20">
                    <button onClick={() => { onEdit(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-700">
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button onClick={() => { onDelete(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </React.Fragment>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-surface-900/50 rounded-lg">
          <code className="flex-1 text-xs text-gray-600 dark:text-gray-400 font-mono truncate">{wallet.address}</code>
          <button onClick={handleCopy} className="p-1.5 hover:bg-gray-200 dark:hover:bg-surface-700 rounded transition-colors" title="Copy address">
            {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
          <a href={`https://etherscan.io/address/${wallet.address}`} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-gray-200 dark:hover:bg-surface-700 rounded transition-colors" title="View on explorer">
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
        </div>
        {wallet.provider && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500">Provider:</span>
              <Badge variant="neutral" size="sm">{wallet.provider}</Badge>
            </div>
        )}
      </Card>
  );
}
// =============================================================================
// TOKEN CARD
// =============================================================================

function TokenCard({ token, index }: { token: CryptoToken; index: number }) {
  const getTokenIcon = (symbol: string) => {
    switch (symbol) {
      case 'BTC': return '₿';
      case 'ETH': return 'Ξ';
      case 'SOL': return '◎';
      case 'USDC':
      case 'USDT': return '$';
      case 'MATIC': return '⬡';
      case 'BNB': return '🔶';
      case 'ADA': return '₳';
      case 'XRP': return '✕';
      case 'DOGE': return '🐕';
      default: return symbol[0];
    }
  };

  const priceFormatted = token.price
      ? token.price >= 1
          ? `$${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : `$${token.price.toFixed(6)}`
      : null;

  return (
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
      >
        <Card variant="glass" padding="md" hover>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-surface-800/50 flex items-center justify-center text-2xl">
                {getTokenIcon(token.symbol)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-surface-100">{token.name}</h3>
                <p className="text-sm text-gray-500 dark:text-surface-500">
                  {token.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {token.symbol}
                </p>
                {priceFormatted && (
                    <p className="text-xs text-gray-400 dark:text-surface-600">{priceFormatted}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900 dark:text-surface-100">
                {formatCurrency(token.usdValue)}
              </p>
              <p className={`text-sm flex items-center justify-end gap-1 ${token.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {token.change24h >= 0 ? <TrendUpIcon size={14} /> : <TrendDownIcon size={14} />}
                {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
  );
}

// =============================================================================
// TRANSACTION ROW
// =============================================================================

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const getIcon = () => {
    switch (tx.type) {
      case 'send': return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'receive': return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case 'swap': return <ArrowLeftRight className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (tx.status) {
      case 'completed': return <Badge variant="success" size="sm">Completed</Badge>;
      case 'pending': return <Badge variant="warning" size="sm">Pending</Badge>;
      case 'failed': return <Badge variant="danger" size="sm">Failed</Badge>;
    }
  };

  return (
      <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-surface-700 last:border-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-surface-700 flex items-center justify-center">
            {getIcon()}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white capitalize">
              {tx.type} {tx.token}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(tx.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-medium ${tx.type === 'receive' ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
            {tx.type === 'receive' ? '+' : tx.type === 'send' ? '-' : ''}{tx.amount} {tx.token.split(' ')[0]}
          </p>
          <div className="mt-1">{getStatusBadge()}</div>
        </div>
      </div>
  );
}

// =============================================================================
// SEND MODAL
// =============================================================================

interface SendModalProps {
  tokens: CryptoToken[];
  onClose: () => void;
}

function SendModal({ tokens, onClose }: SendModalProps) {
  const [selectedToken, setSelectedToken] = useState(tokens[0]?.symbol || 'ETH');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const token = tokens.find(t => t.symbol === selectedToken);
  const maxAmount = token?.balance || 0;

  const handleSend = async () => {
    if (!recipient || !amount) return;

    // Validate address format (basic check)
    if (!recipient.startsWith('0x') || recipient.length !== 42) {
      setError('Invalid wallet address format. Address should start with 0x and be 42 characters.');
      return;
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (amountNum > maxAmount) {
      setError(`Insufficient balance. Maximum: ${maxAmount} ${selectedToken}`);
      return;
    }

    setSending(true);
    setError(null);

    // Simulate transaction (wallet SDK integration required for real transactions)
    await new Promise(resolve => setTimeout(resolve, 1500));

    setSuccess(true);
    setTimeout(() => {
      setSending(false);
      onClose();
    }, 1500);
  };

  return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-surface-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Send Crypto</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction Submitted</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Your transaction has been simulated successfully.
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  Note: This is a demo. Real transactions require wallet SDK integration.
                </p>
              </div>
            ) : (
            <React.Fragment>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Token</label>
              <select
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
              >
                {tokens.map(t => (
                    <option key={t.symbol} value={t.symbol}>{t.symbol} - {t.balance.toLocaleString()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipient Address</label>
              <input
                  type="text"
                  value={recipient}
                  onChange={(e) => { setRecipient(e.target.value); setError(null); }}
                  placeholder="0x..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                <button onClick={() => setAmount(maxAmount.toString())} className="text-xs text-[var(--accent-primary)] hover:underline">Max: {maxAmount}</button>
              </div>
              <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  max={maxAmount}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
              />
            </div>
            {amount && token && (
                <div className="p-3 bg-gray-50 dark:bg-surface-900/50 rounded-lg text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Value</span>
                    <span className="text-gray-900 dark:text-white">≈ ${(parseFloat(amount || '0') * (token.usdValue / token.balance)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-500">Network Fee</span>
                    <span className="text-gray-900 dark:text-white">≈ $2.50</span>
                  </div>
                </div>
            )}
            </React.Fragment>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-surface-700">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSend} disabled={sending || !recipient || !amount}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </div>
  );
}

// =============================================================================
// RECEIVE MODAL
// =============================================================================

interface ReceiveModalProps {
  wallets: WalletData[];
  onClose: () => void;
}

function ReceiveModal({ wallets, onClose }: ReceiveModalProps) {
  const [selectedWallet, setSelectedWallet] = useState(wallets[0]?.id || '');
  const [copied, setCopied] = useState(false);

  const wallet = wallets.find(w => w.id === selectedWallet);
  const address = wallet?.address || '';

  const handleCopy = async () => {
    if (address) {
      await copyToClipboard(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-surface-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Receive Crypto</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {wallets.length > 0 ? (
                <React.Fragment>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Wallet</label>
                    <select
                        value={selectedWallet}
                        onChange={(e) => setSelectedWallet(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-gray-900 dark:text-white"
                    >
                      {wallets.map(w => (
                          <option key={w.id} value={w.id}>{w.name} ({w.network})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col items-center py-6">
                    <div className="w-48 h-48 bg-white p-2 rounded-xl border border-gray-200 flex items-center justify-center">
                      <div className="w-full h-full bg-gray-50 rounded-lg p-3">
                        {/* Simple QR code pattern placeholder */}
                        <div className="w-full h-full grid grid-cols-7 grid-rows-7 gap-0.5">
                          {Array.from({ length: 49 }).map((_, i) => {
                            const row = Math.floor(i / 7);
                            const col = i % 7;
                            const isCorner = (row < 2 && col < 2) || (row < 2 && col > 4) || (row > 4 && col < 2);
                            const isRandom = Math.random() > 0.5;
                            return (
                              <div
                                key={i}
                                className={`rounded-sm ${isCorner || isRandom ? 'bg-gray-800' : 'bg-white'}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Scan to receive</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      (Demo QR - install qrcode.react for real QR codes)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wallet Address</label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-surface-900/50 rounded-xl">
                      <code className="flex-1 text-sm text-gray-600 dark:text-gray-400 font-mono break-all">{address}</code>
                      <button onClick={handleCopy} className="p-2 hover:bg-gray-200 dark:hover:bg-surface-700 rounded-lg transition-colors">
                        {copied ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">Only send {wallet?.network} compatible tokens to this address.</p>
                  </div>
                </React.Fragment>
            ) : (
                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Add a wallet first to receive crypto</p>
                </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-surface-700">
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
  );
}

// =============================================================================
// SWAP MODAL
// =============================================================================

interface SwapModalProps {
  tokens: CryptoToken[];
  onClose: () => void;
}

function SwapModal({ tokens, onClose }: SwapModalProps) {
  const [fromToken, setFromToken] = useState(tokens[0]?.symbol || 'ETH');
  const [toToken, setToToken] = useState(tokens[1]?.symbol || 'USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fromTokenData = tokens.find(t => t.symbol === fromToken);
  const toTokenData = tokens.find(t => t.symbol === toToken);

  const exchangeRate = fromTokenData && toTokenData ? (fromTokenData.usdValue / fromTokenData.balance) / (toTokenData.usdValue / toTokenData.balance) : 1;
  const toAmount = fromAmount ? (parseFloat(fromAmount) * exchangeRate).toFixed(6) : '';

  const handleSwap = async () => {
    if (!fromAmount) return;

    const amountNum = parseFloat(fromAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (fromTokenData && amountNum > fromTokenData.balance) {
      setError(`Insufficient balance. Maximum: ${fromTokenData.balance} ${fromToken}`);
      return;
    }
    if (fromToken === toToken) {
      setError('Cannot swap the same token.');
      return;
    }

    setSwapping(true);
    setError(null);

    // Simulate swap (DEX integration required for real swaps)
    await new Promise(resolve => setTimeout(resolve, 2000));

    setSuccess(true);
    toast.success(`Swapped ${fromAmount} ${fromToken} for ${toAmount} ${toToken}`);
    setTimeout(() => {
      setSwapping(false);
      onClose();
    }, 1500);
  };

  const handleFlip = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount('');
  };

  return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-surface-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Swap Tokens</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-700 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Swap Complete</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Swapped {fromAmount} {fromToken} for {toAmount} {toToken}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  Note: This is a demo. Real swaps require DEX integration.
                </p>
              </div>
            ) : (
            <React.Fragment>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            <div className="p-4 bg-gray-50 dark:bg-surface-900/50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">From</span>
                <span className="text-xs text-gray-400">Balance: {fromTokenData?.balance.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => { setFromAmount(e.target.value); setError(null); }}
                    placeholder="0.00"
                    className="flex-1 bg-transparent text-2xl font-semibold text-gray-900 dark:text-white outline-none"
                />
                <select
                    value={fromToken}
                    onChange={(e) => setFromToken(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-600 rounded-lg font-medium"
                >
                  {tokens.map(t => (
                      <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-center">
              <button onClick={handleFlip} className="p-2 bg-gray-100 dark:bg-surface-700 rounded-full hover:bg-gray-200 dark:hover:bg-surface-600 transition-colors">
                <ArrowDownLeft className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-surface-900/50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">To</span>
                <span className="text-xs text-gray-400">Balance: {toTokenData?.balance.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                    type="text"
                    value={toAmount}
                    readOnly
                    placeholder="0.00"
                    className="flex-1 bg-transparent text-2xl font-semibold text-gray-900 dark:text-white outline-none"
                />
                <select
                    value={toToken}
                    onChange={(e) => setToToken(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-600 rounded-lg font-medium"
                >
                  {tokens.filter(t => t.symbol !== fromToken).map(t => (
                      <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-surface-900/50 rounded-lg text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Rate</span>
                <span className="text-gray-900 dark:text-white">1 {fromToken} = {exchangeRate.toFixed(4)} {toToken}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500">Slippage</span>
                <span className="text-gray-900 dark:text-white">0.5%</span>
              </div>
            </div>
            </React.Fragment>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-surface-700">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSwap} disabled={swapping || !fromAmount}>
              {swapping ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowLeftRight className="w-4 h-4 mr-2" />}
              {swapping ? 'Swapping...' : 'Swap'}
            </Button>
          </div>
        </div>
      </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function WalletPage() {
  const { cryptoTokens } = useStore();
  const { cryptoRates, fiatRates, isLoading: ratesLoading, lastUpdated: ratesUpdated, refresh: refreshRates, convert } = useExchangeRates({
    type: 'all',
    base: 'USD',
    refreshInterval: 60000, // Refresh every minute
  });
  // Enrich tokens with live rates
  const enrichedTokens = useMemo(() => {
    return cryptoTokens.map(token => {
      const liveRate = cryptoRates.find(r => r.symbol === token.symbol);
      if (liveRate) {
        return {
          ...token,
          usdValue: token.balance * liveRate.current_price,
          change24h: liveRate.price_change_percentage_24h,
          price: liveRate.current_price,
        };
      }
      return token;
    });
  }, [cryptoTokens, cryptoRates]);
  const { t } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'assets' | 'wallets' | 'history'>('assets');

  // Data
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(DEMO_TRANSACTIONS);
  const [isSyncingTx, setIsSyncingTx] = useState(false);

  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletData | null>(null);
  const [deletingWallet, setDeletingWallet] = useState<WalletData | null>(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);

  // Load wallets
  const loadWallets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWallets();
      setWallets(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, []);

  // Calculate totals
  const totalValue = enrichedTokens.reduce((sum, token) => sum + token.usdValue, 0);
  const totalChange24h = enrichedTokens.reduce((sum, token) => sum + (token.usdValue * token.change24h / 100), 0);
  const changePercentage = totalValue > 0 ? (totalChange24h / (totalValue - totalChange24h)) * 100 : 0;

  // Handlers
  const handleCreateWallet = async (data: Partial<WalletData>) => {
    setIsSaving(true);
    try {
      const created = await createWallet(data);
      setWallets((prev) => [...prev, created]);
      setWizardOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateWallet = async (data: Partial<WalletData>) => {
    if (!editingWallet) return;
    setIsSaving(true);
    try {
      const updated = await updateWallet(editingWallet.id, data);
      setWallets((prev) => prev.map((w) => (w.id === editingWallet.id ? updated : w)));
      setEditingWallet(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWallet = async () => {
    if (!deletingWallet) return;
    setIsSaving(true);
    try {
      await deleteWallet(deletingWallet.id);
      setWallets((prev) => prev.filter((w) => w.id !== deletingWallet.id));
      setDeletingWallet(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncTransactions = async () => {
    setIsSyncingTx(true);
    try {
      // Simulate fetching transactions from blockchain/API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Add a new simulated transaction
      const newTx: WalletTransaction = {
        id: `tx-${Date.now()}`,
        type: 'receive',
        token: 'ETH',
        amount: 0.5,
        usdValue: 1000,
        from: '0x9876...5432',
        status: 'completed',
        timestamp: new Date().toISOString(),
      };

      setTransactions(prev => [newTx, ...prev]);
      toast.success('Transactions synced successfully');
    } catch {
      toast.error('Failed to sync transactions');
    } finally {
      setIsSyncingTx(false);
    }
  };

  const tabs = [
    { id: 'assets', label: t('wallet.assets') || 'Assets', icon: Coins },
    { id: 'wallets', label: 'Wallets', icon: Wallet },
    { id: 'history', label: t('wallet.history') || 'History', icon: Clock },
  ];

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 font-display">
              {t('wallet.title') || 'Crypto Wallet'}
            </h1>
            <p className="text-gray-500 dark:text-surface-500 mt-1">
              {t('wallet.subtitle') || 'Manage your crypto assets'}
            </p>
          </div>
          <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setWizardOpen(true)}>
            Add Wallet
          </Button>
        </div>

        {/* Portfolio Value */}
        <Card variant="glass" padding="lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-surface-400">{t('wallet.totalValue') || 'Total Value'}</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-surface-100 mt-1">
                {formatCurrency(totalValue)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {changePercentage >= 0 ? (
                    <TrendUpIcon size={16} className="text-green-500" />
                ) : (
                    <TrendDownIcon size={16} className="text-red-500" />
                )}
                <span className={changePercentage >= 0 ? 'text-green-500' : 'text-red-500'}>
                                {changePercentage >= 0 ? '+' : ''}{changePercentage.toFixed(2)}%
                            </span>
                <span className="text-gray-500 dark:text-surface-500">24h</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" leftIcon={<Send size={16} />} onClick={() => setSendModalOpen(true)}>
                {t('wallet.send') || 'Send'}
              </Button>
              <Button variant="secondary" leftIcon={<Download size={16} />} onClick={() => setReceiveModalOpen(true)}>
                {t('wallet.receive') || 'Receive'}
              </Button>
              <Button variant="secondary" leftIcon={<ArrowLeftRight size={16} />} onClick={() => setSwapModalOpen(true)}>
                {t('wallet.swap') || 'Swap'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-surface-800/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'assets' | 'wallets' | 'history')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                            ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                            : 'border-transparent text-gray-500 dark:text-surface-400 hover:text-gray-700 dark:hover:text-surface-300'
                    }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
            <Card variant="glass" padding="md" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <Button variant="secondary" onClick={loadWallets}>Retry</Button>
              </div>
            </Card>
        )}

        {/* Loading */}
        {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
            </div>
        )}

        {/* Assets Tab */}
        {!isLoading && activeTab === 'assets' && (
            <div className="space-y-4">
              {ratesUpdated && (
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Live prices from CoinGecko</span>
                    <div className="flex items-center gap-2">
                      <span>Updated: {new Date(ratesUpdated).toLocaleTimeString()}</span>
                      <button onClick={refreshRates} className="p-1 hover:bg-gray-100 dark:hover:bg-surface-700 rounded" title="Refresh">
                        <RefreshCw className={`w-3 h-3 ${ratesLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {enrichedTokens.map((token, index) => (
                    <TokenCard key={token.symbol} token={token} index={index} />
                ))}
              </div>
            </div>
        )}

        {/* Wallets Tab */}
        {!isLoading && activeTab === 'wallets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallets.map((wallet) => (
                  <WalletCard
                      key={wallet.id}
                      wallet={wallet}
                      onEdit={() => setEditingWallet(wallet)}
                      onDelete={() => setDeletingWallet(wallet)}
                  />
              ))}
              {wallets.length === 0 && (
                  <Card variant="glass" padding="lg" className="col-span-full text-center">
                    <WalletIcon size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No wallets added</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                      Add your first wallet to start tracking
                    </p>
                    <Button variant="primary" className="mt-4" onClick={() => setWizardOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Wallet
                    </Button>
                  </Card>
              )}
            </div>
        )}

        {/* History Tab */}
        {!isLoading && activeTab === 'history' && (
            <Card variant="glass" padding="md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Transaction History</h3>
                <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<RefreshCw size={14} className={isSyncingTx ? 'animate-spin' : ''} />}
                    onClick={handleSyncTransactions}
                    disabled={isSyncingTx}
                >
                  {isSyncingTx ? 'Syncing...' : 'Sync'}
                </Button>
              </div>
              {transactions.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-surface-700">
                    {transactions.map((tx) => (
                        <TransactionRow key={tx.id} tx={tx} />
                    ))}
                  </div>
              ) : (
                  <div className="text-center py-12">
                    <Clock size={48} className="mx-auto text-gray-400 dark:text-surface-500 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-surface-100">No transactions</h3>
                    <p className="text-gray-500 dark:text-surface-500 mt-2">
                      Your transaction history will appear here
                    </p>
                  </div>
              )}
            </Card>
        )}

        {/* Modals */}
        <AnimatePresence>
          {wizardOpen && (
              <WalletWizard
                  onClose={() => setWizardOpen(false)}
                  onSave={handleCreateWallet}
                  isSaving={isSaving}
              />
          )}
          {editingWallet && (
              <WalletWizard
                  wallet={editingWallet}
                  onClose={() => setEditingWallet(null)}
                  onSave={handleUpdateWallet}
                  isSaving={isSaving}
              />
          )}
          {deletingWallet && (
              <DeleteConfirmModal
                  wallet={deletingWallet}
                  onClose={() => setDeletingWallet(null)}
                  onConfirm={handleDeleteWallet}
                  isDeleting={isSaving}
              />
          )}
        </AnimatePresence>

        {sendModalOpen && <SendModal tokens={cryptoTokens} onClose={() => setSendModalOpen(false)} />}
        {receiveModalOpen && <ReceiveModal wallets={wallets} onClose={() => setReceiveModalOpen(false)} />}
        {swapModalOpen && <SwapModal tokens={cryptoTokens} onClose={() => setSwapModalOpen(false)} />}

      </div>
  );
}