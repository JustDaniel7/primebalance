'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui';
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  PhotoIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface Receipt {
  id: string;
  filename: string;
  uploadDate: string;
  status: 'processing' | 'completed' | 'failed';
  vendor?: string;
  amount?: number;
  category?: string;
  taxDeductible?: boolean;
  thumbnail?: string;
}

const mockReceipts: Receipt[] = [
  { id: '1', filename: 'office_supplies_dec.jpg', uploadDate: '2024-12-01', status: 'completed', vendor: 'Staples', amount: 234.56, category: 'Office Supplies', taxDeductible: true },
  { id: '2', filename: 'software_license.pdf', uploadDate: '2024-12-02', status: 'completed', vendor: 'Adobe', amount: 599.99, category: 'Software', taxDeductible: true },
  { id: '3', filename: 'team_lunch.png', uploadDate: '2024-12-03', status: 'processing', vendor: undefined, amount: undefined, category: undefined },
  { id: '4', filename: 'travel_expense.jpg', uploadDate: '2024-12-04', status: 'completed', vendor: 'United Airlines', amount: 1245.00, category: 'Travel', taxDeductible: true },
  { id: '5', filename: 'blurry_receipt.jpg', uploadDate: '2024-12-05', status: 'failed' },
];

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>(mockReceipts);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setUploadProgress(null);
            // Add new receipts
            const newReceipts: Receipt[] = files.map((file, index) => ({
              id: `new-${Date.now()}-${index}`,
              filename: file.name,
              uploadDate: new Date().toISOString().split('T')[0],
              status: 'processing' as const,
            }));
            setReceipts(prev => [...newReceipts, ...prev]);
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = receipt.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.vendor?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || receipt.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: receipts.length,
    processed: receipts.filter(r => r.status === 'completed').length,
    pending: receipts.filter(r => r.status === 'processing').length,
    failed: receipts.filter(r => r.status === 'failed').length,
    totalAmount: receipts.filter(r => r.amount).reduce((sum, r) => sum + (r.amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/10 border border-sky-500/20">
              <DocumentTextIcon className="w-6 h-6 text-sky-400" />
            </div>
            Receipt Scanner
          </h1>
          <p className="text-gray-400 mt-1">Upload and automatically process your receipts with AI</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5">
              <DocumentTextIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Receipts</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.processed}</p>
              <p className="text-xs text-gray-500">Processed</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <ClockIcon className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
              <p className="text-xs text-gray-500">Processing</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <SparklesIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white font-mono">${stats.totalAmount.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Extracted</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Upload Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          scale: isDragging ? 1.02 : 1,
          borderColor: isDragging ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.1)',
        }}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
          isDragging ? 'bg-emerald-500/10' : 'bg-white/[0.02]'
        }`}
      >
        {uploadProgress !== null ? (
          <div className="space-y-4">
            <ArrowPathIcon className="w-12 h-12 text-emerald-400 mx-auto animate-spin" />
            <p className="text-lg font-medium text-white">Uploading...</p>
            <div className="w-64 mx-auto bg-white/10 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400">{uploadProgress}%</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-600/10 border border-sky-500/20 flex items-center justify-center mx-auto mb-4">
              <CloudArrowUpIcon className="w-8 h-8 text-sky-400" />
            </div>
            <p className="text-lg font-medium text-white mb-2">
              Drag & drop receipts here
            </p>
            <p className="text-sm text-gray-400 mb-4">
              or click to browse • Supports JPG, PNG, PDF
            </p>
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-medium text-white cursor-pointer shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow">
              <PhotoIcon className="w-5 h-5" />
              Select Files
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </>
        )}

        {/* AI Feature Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 rounded-full border border-violet-500/20">
          <SparklesIcon className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-medium text-violet-400">AI-Powered OCR</span>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search receipts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-400" />
          {['all', 'completed', 'processing', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                filterStatus === status
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Receipts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReceipts.map((receipt, index) => (
          <motion.div
            key={receipt.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="group hover:border-white/20 transition-colors cursor-pointer" onClick={() => setSelectedReceipt(receipt)}>
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="w-16 h-20 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                  {receipt.filename.endsWith('.pdf') ? (
                    <DocumentTextIcon className="w-8 h-8 text-rose-400" />
                  ) : (
                    <PhotoIcon className="w-8 h-8 text-sky-400" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-white truncate">{receipt.filename}</p>
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      receipt.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      receipt.status === 'processing' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-rose-500/10 text-rose-400'
                    }`}>
                      {receipt.status === 'completed' && <CheckCircleIcon className="w-3 h-3" />}
                      {receipt.status === 'processing' && <ClockIcon className="w-3 h-3 animate-spin" />}
                      {receipt.status === 'failed' && <XCircleIcon className="w-3 h-3" />}
                      {receipt.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-3">Uploaded {receipt.uploadDate}</p>

                  {receipt.status === 'completed' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Vendor</span>
                        <span className="text-white">{receipt.vendor}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Amount</span>
                        <span className="text-emerald-400 font-mono">${receipt.amount?.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Category</span>
                        <span className="text-white">{receipt.category}</span>
                      </div>
                      {receipt.taxDeductible && (
                        <div className="mt-2 px-2 py-1 bg-emerald-500/10 rounded text-xs text-emerald-400 text-center">
                          ✓ Tax Deductible
                        </div>
                      )}
                    </div>
                  )}

                  {receipt.status === 'processing' && (
                    <div className="flex items-center gap-2 text-amber-400 text-sm">
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      <span>AI is analyzing this receipt...</span>
                    </div>
                  )}

                  {receipt.status === 'failed' && (
                    <div className="text-sm text-rose-400">
                      Could not process image. Please try again with a clearer photo.
                    </div>
                  )}
                </div>
              </div>

              {/* Hover Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-gray-300 transition-colors">
                  <EyeIcon className="w-3 h-3" /> View
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-gray-300 transition-colors">
                  <ArrowPathIcon className="w-3 h-3" /> Reprocess
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-xs font-medium text-rose-400 transition-colors">
                  <TrashIcon className="w-3 h-3" /> Delete
                </button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Receipt Detail Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setSelectedReceipt(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1d24] rounded-2xl p-6 w-full max-w-2xl border border-white/10 shadow-2xl"
            >
              <div className="flex gap-6">
                {/* Preview */}
                <div className="w-64 h-80 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                  {selectedReceipt.filename.endsWith('.pdf') ? (
                    <DocumentTextIcon className="w-16 h-16 text-rose-400" />
                  ) : (
                    <PhotoIcon className="w-16 h-16 text-sky-400" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">{selectedReceipt.filename}</h2>
                      <p className="text-sm text-gray-500">Uploaded {selectedReceipt.uploadDate}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      selectedReceipt.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      selectedReceipt.status === 'processing' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-rose-500/10 text-rose-400'
                    }`}>
                      {selectedReceipt.status}
                    </span>
                  </div>

                  {selectedReceipt.status === 'completed' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4 text-violet-400" />
                        AI Extracted Data
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white/[0.02] rounded-xl">
                          <p className="text-xs text-gray-500 mb-1">Vendor</p>
                          <p className="font-medium text-white">{selectedReceipt.vendor}</p>
                        </div>
                        <div className="p-3 bg-white/[0.02] rounded-xl">
                          <p className="text-xs text-gray-500 mb-1">Amount</p>
                          <p className="font-medium text-emerald-400 font-mono">${selectedReceipt.amount?.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-white/[0.02] rounded-xl">
                          <p className="text-xs text-gray-500 mb-1">Category</p>
                          <p className="font-medium text-white">{selectedReceipt.category}</p>
                        </div>
                        <div className="p-3 bg-white/[0.02] rounded-xl">
                          <p className="text-xs text-gray-500 mb-1">Tax Status</p>
                          <p className="font-medium text-emerald-400">
                            {selectedReceipt.taxDeductible ? '✓ Deductible' : 'Not Deductible'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-medium text-white">
                          Create Transaction
                        </button>
                        <button className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-gray-300 transition-colors">
                          Edit Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedReceipt(null)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
