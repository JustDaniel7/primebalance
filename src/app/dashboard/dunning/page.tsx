'use client';

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, Clock, CheckCircle2, XCircle, Send, FileText, DollarSign,
    Search, RefreshCw, ChevronRight, ChevronLeft, Eye, Play, Pause, Settings,
    Download, Upload, BarChart3, Inbox, AlertCircle, Shield, Gavel, Mail,
    Target, Zap, CheckSquare, RotateCcw, Globe, Info, Plus, X, Loader2,
    Edit2, Save, User, Building2, Calendar, Hash, Percent, FileCode,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useThemeStore } from '@/store/theme-store';

// =============================================================================
// TYPES
// =============================================================================

type TabId = 'overview' | 'queue' | 'proposals' | 'exceptions' | 'automation' | 'templates' | 'settings' | 'email-log';

interface Dunning {
    id: string;
    dunningNumber: string;
    invoiceId: string;
    customerName: string;
    customerEmail: string;
    customerType: string;
    jurisdictionId: string;
    currency: string;
    originalAmount: number;
    outstandingAmount: number;
    interestAccrued: number;
    feesAccrued: number;
    totalDue: number;
    invoiceDueDate: string;
    daysPastDue: number;
    status: string;
    currentLevel: number;
    isDisputed: boolean;
    hasActiveProposal: boolean;
    communications: { level: number; sentAt: string; sentTo: string; subject: string; body: string }[];
}

interface Proposal {
    id: string;
    dunningId: string;
    proposalLevel: number;
    status: string;
    proposedAmount: number;
    calculatedInterest: number;
    calculatedFees: number;
    confidenceScore: number;
    paymentDeadline: string;
    explanation: string;
    verificationChecks: Record<string, boolean>;
    dunning: { customerName: string; customerEmail: string; invoiceId: string };
    isAutoSend: boolean;
    overrideEmail?: string;
}

interface Exception {
    id: string;
    exceptionType: string;
    reason: string;
    status: string;
    isOverdue: boolean;
    slaDeadline: string;
    createdAt: string;
    retryCount: number;
    maxRetries: number;
    assignedTo?: string;
    assignedName?: string;
}

interface Rule {
    id: string;
    code: string;
    name: string;
    description: string;
    isActive: boolean;
    dunningLevels: number[];
    confidenceThreshold: number;
    schedule: string | null;
    multiSignatureRequired: boolean;
    autoSendEnabled: boolean;
    executionCount: number;
    successCount: number;
    lastExecutedAt: string | null;
    daysOverdueMin: number;
    daysOverdueMax: number | null;
}

interface Jurisdiction {
    id: string;
    jurisdictionId: string;
    jurisdictionName: string;
    statutoryInterestRateB2B: number;
    statutoryInterestRateB2C: number;
    flatFeeAmountB2B: number;
    flatFeeAmountB2C: number;
    defaultLanguage: string;
}

interface Template {
    id: string;
    code: string;
    name: string;
    level: number;
    language: string;
    subject: string;
    body: string;
    isActive: boolean;
}

interface EmailLog {
    id: string;
    dunningId: string;
    dunningNumber: string;
    customerName: string;
    sentTo: string;
    subject: string;
    body: string;
    level: number;
    sentAt: string;
    status: 'sent' | 'delivered' | 'failed' | 'opened';
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    issued: { label: 'Issued', bg: 'bg-gray-200 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200' },
    due: { label: 'Due', bg: 'bg-blue-200 dark:bg-blue-800', text: 'text-blue-800 dark:text-blue-200' },
    overdue: { label: 'Overdue', bg: 'bg-amber-200 dark:bg-amber-800', text: 'text-amber-800 dark:text-amber-200' },
    reminder_sent: { label: 'Reminder Sent', bg: 'bg-sky-200 dark:bg-sky-800', text: 'text-sky-800 dark:text-sky-200' },
    dunning_level1_sent: { label: 'Level 1 Sent', bg: 'bg-orange-200 dark:bg-orange-800', text: 'text-orange-800 dark:text-orange-200' },
    dunning_level2_sent: { label: 'Level 2 Sent', bg: 'bg-red-200 dark:bg-red-800', text: 'text-red-800 dark:text-red-200' },
    dunning_level3_pending: { label: 'Level 3 Pending', bg: 'bg-purple-200 dark:bg-purple-800', text: 'text-purple-800 dark:text-purple-200' },
    dunning_level3_sent: { label: 'Level 3 Sent', bg: 'bg-rose-200 dark:bg-rose-800', text: 'text-rose-800 dark:text-rose-200' },
    disputed: { label: 'Disputed', bg: 'bg-yellow-200 dark:bg-yellow-800', text: 'text-yellow-800 dark:text-yellow-200' },
    settled: { label: 'Settled', bg: 'bg-green-200 dark:bg-green-800', text: 'text-green-800 dark:text-green-200' },
    written_off: { label: 'Written Off', bg: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-800 dark:text-slate-200' },
};

const LEVEL_CONFIG: Record<number, { label: string; bg: string; text: string; statusAfterSend: string }> = {
    0: { label: 'None', bg: 'bg-gray-200 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200', statusAfterSend: 'overdue' },
    1: { label: 'Reminder', bg: 'bg-sky-200 dark:bg-sky-800', text: 'text-sky-800 dark:text-sky-200', statusAfterSend: 'reminder_sent' },
    2: { label: 'Level 1', bg: 'bg-orange-200 dark:bg-orange-800', text: 'text-orange-800 dark:text-orange-200', statusAfterSend: 'dunning_level1_sent' },
    3: { label: 'Level 2', bg: 'bg-red-200 dark:bg-red-800', text: 'text-red-800 dark:text-red-200', statusAfterSend: 'dunning_level2_sent' },
    4: { label: 'Level 3', bg: 'bg-purple-200 dark:bg-purple-800', text: 'text-purple-800 dark:text-purple-200', statusAfterSend: 'dunning_level3_sent' },
};

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];
const LANGUAGES = [{ code: 'de', name: 'German' }, { code: 'en', name: 'English' }, { code: 'fr', name: 'French' }];

// =============================================================================
// INITIAL DATA
// =============================================================================

const createInitialDunnings = (): Dunning[] => [
    { id: '1', dunningNumber: 'DUN-DE-2025-00001', invoiceId: 'INV-2025-0001', customerName: 'Müller GmbH', customerEmail: 'buchhaltung@mueller-gmbh.de', customerType: 'B2B', jurisdictionId: 'DE', currency: 'EUR', originalAmount: 15000, outstandingAmount: 15000, interestAccrued: 123.45, feesAccrued: 40, totalDue: 15163.45, invoiceDueDate: '2024-11-15', daysPastDue: 49, status: 'dunning_level2_sent', currentLevel: 3, isDisputed: false, hasActiveProposal: false, communications: [] },
    { id: '2', dunningNumber: 'DUN-DE-2025-00002', invoiceId: 'INV-2025-0002', customerName: 'Schmidt & Partner KG', customerEmail: 'rechnung@schmidt-partner.de', customerType: 'B2B', jurisdictionId: 'DE', currency: 'EUR', originalAmount: 8500, outstandingAmount: 8500, interestAccrued: 45.20, feesAccrued: 0, totalDue: 8545.20, invoiceDueDate: '2024-12-10', daysPastDue: 24, status: 'dunning_level1_sent', currentLevel: 2, isDisputed: false, hasActiveProposal: true, communications: [] },
    { id: '3', dunningNumber: 'DUN-CH-2025-00001', invoiceId: 'INV-2025-0003', customerName: 'Weber Consulting AG', customerEmail: 'primebalanceus@gmail.com', customerType: 'B2B', jurisdictionId: 'CH', currency: 'CHF', originalAmount: 25000, outstandingAmount: 25000, interestAccrued: 0, feesAccrued: 0, totalDue: 25000, invoiceDueDate: '2024-12-20', daysPastDue: 14, status: 'reminder_sent', currentLevel: 1, isDisputed: false, hasActiveProposal: false, communications: [] },
    { id: '4', dunningNumber: 'DUN-GB-2025-00001', invoiceId: 'INV-2025-0004', customerName: 'Tech Solutions Ltd', customerEmail: 'accounts@techsolutions.co.uk', customerType: 'B2B', jurisdictionId: 'GB', currency: 'GBP', originalAmount: 12000, outstandingAmount: 12000, interestAccrued: 0, feesAccrued: 0, totalDue: 12000, invoiceDueDate: '2024-12-28', daysPastDue: 6, status: 'overdue', currentLevel: 0, isDisputed: false, hasActiveProposal: false, communications: [] },
];

const createInitialProposals = (): Proposal[] => [
    { id: 'prop-1', dunningId: '2', proposalLevel: 3, status: 'pending', proposedAmount: 8545.20, calculatedInterest: 45.20, calculatedFees: 40, confidenceScore: 0.96, paymentDeadline: '2025-01-17', explanation: 'Auto-proposed escalation to Level 2. Invoice is 24 days overdue.', verificationChecks: { invoiceExists: true, noPaymentReceived: true, noActiveDispute: true }, dunning: { customerName: 'Schmidt & Partner KG', customerEmail: 'rechnung@schmidt-partner.de', invoiceId: 'INV-2025-0002' }, isAutoSend: true },
    { id: 'prop-2', dunningId: '3', proposalLevel: 2, status: 'pending', proposedAmount: 25085.62, calculatedInterest: 85.62, calculatedFees: 0, confidenceScore: 0.92, paymentDeadline: '2025-01-20', explanation: 'Auto-proposed escalation to Level 1. Reminder sent 7 days ago.', verificationChecks: { invoiceExists: true, noPaymentReceived: true, noActiveDispute: true }, dunning: { customerName: 'Weber Consulting AG', customerEmail: 'primebalanceus@gmail.com', invoiceId: 'INV-2025-0003' }, isAutoSend: true },
];

const INITIAL_EXCEPTIONS: Exception[] = [
    { id: 'exc-1', exceptionType: 'LOW_CONFIDENCE', reason: 'Confidence score 0.65 below threshold 0.70.', status: 'open', isOverdue: false, slaDeadline: '2025-01-05', createdAt: '2025-01-02', retryCount: 0, maxRetries: 3 },
    { id: 'exc-2', exceptionType: 'VERIFICATION_FAILED', reason: 'Unable to verify invoice existence. API timeout.', status: 'open', isOverdue: true, slaDeadline: '2025-01-01', createdAt: '2024-12-30', retryCount: 2, maxRetries: 3, assignedName: 'Anna Schmidt' },
];

const INITIAL_RULES: Rule[] = [
    { id: 'rule-1', code: 'AUTO_REMINDER', name: 'Automatic Payment Reminder', description: 'Auto-send reminders for invoices 3+ days overdue', isActive: true, dunningLevels: [1], confidenceThreshold: 0.95, schedule: '0 8 * * 1-5', multiSignatureRequired: false, autoSendEnabled: true, executionCount: 245, successCount: 238, lastExecutedAt: '2025-01-03T08:00:00Z', daysOverdueMin: 3, daysOverdueMax: 13 },
    { id: 'rule-2', code: 'AUTO_LEVEL1', name: 'Automatic Level 1', description: 'Auto-send Level 1 for invoices 14+ days overdue', isActive: true, dunningLevels: [2], confidenceThreshold: 0.95, schedule: '0 9 * * 1-5', multiSignatureRequired: false, autoSendEnabled: true, executionCount: 156, successCount: 148, lastExecutedAt: '2025-01-03T09:00:00Z', daysOverdueMin: 14, daysOverdueMax: 29 },
    { id: 'rule-3', code: 'AUTO_LEVEL2', name: 'Automatic Level 2', description: 'Auto-send Level 2 for invoices 30+ days overdue', isActive: true, dunningLevels: [3], confidenceThreshold: 0.95, schedule: '0 10 * * 1-5', multiSignatureRequired: false, autoSendEnabled: true, executionCount: 89, successCount: 82, lastExecutedAt: '2025-01-03T10:00:00Z', daysOverdueMin: 30, daysOverdueMax: null },
    { id: 'rule-4', code: 'LEVEL3_MANUAL', name: 'Level 3 - Manual Only', description: 'Level 3 requires MANUAL initiation. Never auto-sent.', isActive: true, dunningLevels: [4], confidenceThreshold: 1.0, schedule: null, multiSignatureRequired: true, autoSendEnabled: false, executionCount: 12, successCount: 12, lastExecutedAt: '2024-12-28T14:30:00Z', daysOverdueMin: 60, daysOverdueMax: null },
];

const INITIAL_JURISDICTIONS: Jurisdiction[] = [
    { id: 'jur-1', jurisdictionId: 'DE', jurisdictionName: 'Germany', statutoryInterestRateB2B: 0.0912, statutoryInterestRateB2C: 0.0512, flatFeeAmountB2B: 40, flatFeeAmountB2C: 0, defaultLanguage: 'de' },
    { id: 'jur-2', jurisdictionId: 'AT', jurisdictionName: 'Austria', statutoryInterestRateB2B: 0.0912, statutoryInterestRateB2C: 0.04, flatFeeAmountB2B: 40, flatFeeAmountB2C: 0, defaultLanguage: 'de' },
    { id: 'jur-3', jurisdictionId: 'CH', jurisdictionName: 'Switzerland', statutoryInterestRateB2B: 0.05, statutoryInterestRateB2C: 0.05, flatFeeAmountB2B: 50, flatFeeAmountB2C: 20, defaultLanguage: 'de' },
    { id: 'jur-4', jurisdictionId: 'FR', jurisdictionName: 'France', statutoryInterestRateB2B: 0.1275, statutoryInterestRateB2C: 0.0425, flatFeeAmountB2B: 40, flatFeeAmountB2C: 0, defaultLanguage: 'fr' },
    { id: 'jur-5', jurisdictionId: 'GB', jurisdictionName: 'United Kingdom', statutoryInterestRateB2B: 0.08, statutoryInterestRateB2C: 0.08, flatFeeAmountB2B: 100, flatFeeAmountB2C: 40, defaultLanguage: 'en' },
];

const INITIAL_TEMPLATES: Template[] = [
    { id: 'tpl-1', code: 'REMINDER_DE', name: 'Payment Reminder (DE)', level: 1, language: 'de', subject: 'Zahlungserinnerung - Rechnung {{invoice_number}}', body: 'Sehr geehrte Damen und Herren,\n\nwir möchten Sie freundlich an die ausstehende Zahlung erinnern.\n\nRechnungsnummer: {{invoice_number}}\nBetrag: {{amount}}\nFällig seit: {{due_date}}\n\nMit freundlichen Grüßen\n{{company_name}}', isActive: true },
    { id: 'tpl-2', code: 'REMINDER_EN', name: 'Payment Reminder (EN)', level: 1, language: 'en', subject: 'Payment Reminder - Invoice {{invoice_number}}', body: 'Dear Sir/Madam,\n\nThis is a friendly reminder about your outstanding payment.\n\nInvoice: {{invoice_number}}\nAmount: {{amount}}\nDue since: {{due_date}}\n\nBest regards\n{{company_name}}', isActive: true },
    { id: 'tpl-3', code: 'LEVEL1_DE', name: 'First Dunning (DE)', level: 2, language: 'de', subject: '1. Mahnung - Rechnung {{invoice_number}}', body: 'Sehr geehrte Damen und Herren,\n\ntrotz unserer Zahlungserinnerung haben wir noch keinen Zahlungseingang verzeichnen können.\n\nRechnungsnummer: {{invoice_number}}\nBetrag: {{amount}}\nZinsen: {{interest}}\nGesamtbetrag: {{total_due}}\n\nBitte begleichen Sie den ausstehenden Betrag innerhalb von 14 Tagen.\n\nMit freundlichen Grüßen\n{{company_name}}', isActive: true },
    { id: 'tpl-4', code: 'LEVEL2_DE', name: 'Second Dunning (DE)', level: 3, language: 'de', subject: '2. Mahnung - Rechnung {{invoice_number}}', body: 'Sehr geehrte Damen und Herren,\n\nleider haben wir trotz unserer 1. Mahnung noch keinen Zahlungseingang feststellen können.\n\nGesamtforderung inkl. Zinsen und Gebühren: {{total_due}}\n\nSollten wir innerhalb von 7 Tagen keinen Zahlungseingang verzeichnen, sehen wir uns gezwungen, rechtliche Schritte einzuleiten.\n\nMit freundlichen Grüßen\n{{company_name}}', isActive: true },
    { id: 'tpl-5', code: 'LEVEL3_DE', name: 'Final Notice (DE)', level: 4, language: 'de', subject: 'Letzte Mahnung vor gerichtlichem Mahnverfahren - {{invoice_number}}', body: 'Sehr geehrte Damen und Herren,\n\ndies ist unsere letzte Mahnung vor Einleitung des gerichtlichen Mahnverfahrens.\n\nGesamtforderung: {{total_due}}\nZahlungsfrist: 7 Tage\n\nNach Ablauf dieser Frist werden wir ohne weitere Ankündigung rechtliche Schritte einleiten.\n\nMit freundlichen Grüßen\n{{company_name}}', isActive: true },
];

// =============================================================================
// HELPER: SEND EMAIL (SIMULATED - REPLACE WITH REAL API)
// =============================================================================

async function sendDunningEmail(params: {
    to: string;
    subject: string;
    body: string;
    dunningId: string;
    level: number;
}): Promise<{ success: boolean; messageId: string }> {
    // Simulate API call - REPLACE THIS WITH YOUR ACTUAL EMAIL SERVICE
    // e.g., SendGrid, AWS SES, Mailgun, etc.
    console.log('📧 SENDING EMAIL:', params);

    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate 95% success rate
            const success = Math.random() > 0.05;
            resolve({
                success,
                messageId: success ? `msg-${Date.now()}` : '',
            });
        }, 1500);
    });
}

function processTemplate(template: Template, data: Record<string, string>): { subject: string; body: string } {
    let subject = template.subject;
    let body = template.body;

    Object.entries(data).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, value);
        body = body.replace(regex, value);
    });

    return { subject, body };
}

// =============================================================================
// TOAST COMPONENT
// =============================================================================

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
    React.useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
    const colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' };
    return (
        <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 50, x: '-50%' }}
                    className={`fixed bottom-6 left-1/2 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 z-50 max-w-lg`}>
            {type === 'success' && <CheckCircle2 size={20} />}
            {type === 'error' && <XCircle size={20} />}
            {type === 'info' && <Info size={20} />}
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={16} /></button>
        </motion.div>
    );
}

// =============================================================================
// NEW DUNNING WIZARD
// =============================================================================

function NewDunningWizard({ jurisdictions, onClose, onCreate }: {
    jurisdictions: Jurisdiction[];
    onClose: () => void;
    onCreate: (d: Omit<Dunning, 'id' | 'dunningNumber' | 'communications'>) => void
}) {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        // Step 1: Customer
        customerName: '',
        customerEmail: '',
        customerType: 'B2B' as 'B2B' | 'B2C',
        jurisdictionId: 'DE',
        // Step 2: Invoice
        invoiceId: '',
        originalAmount: 0,
        currency: 'EUR',
        invoiceDueDate: '',
        // Step 3: Dunning Settings
        currentLevel: 0,
        status: 'overdue',
        isDisputed: false,
    });

    const selectedJurisdiction = jurisdictions.find(j => j.jurisdictionId === form.jurisdictionId);
    const daysPastDue = form.invoiceDueDate
        ? Math.max(0, Math.floor((Date.now() - new Date(form.invoiceDueDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
    const interestRate = form.customerType === 'B2B'
        ? selectedJurisdiction?.statutoryInterestRateB2B || 0
        : selectedJurisdiction?.statutoryInterestRateB2C || 0;
    const interestAccrued = form.originalAmount * interestRate * (daysPastDue / 365);
    const flatFee = form.customerType === 'B2B'
        ? selectedJurisdiction?.flatFeeAmountB2B || 0
        : selectedJurisdiction?.flatFeeAmountB2C || 0;
    const totalDue = form.originalAmount + interestAccrued + flatFee;

    const canProceed = step === 1
        ? form.customerName && form.customerEmail && form.customerEmail.includes('@')
        : step === 2
            ? form.invoiceId && form.originalAmount > 0 && form.invoiceDueDate
            : step === 3
                ? true
                : true;

    const handleCreate = () => {
        onCreate({
            ...form,
            outstandingAmount: form.originalAmount,
            interestAccrued,
            feesAccrued: flatFee,
            totalDue,
            daysPastDue,
            hasActiveProposal: false,
        });
    };

    // Auto-suggest status based on level
    const handleLevelChange = (level: number) => {
        let suggestedStatus = 'overdue';
        switch (level) {
            case 0: suggestedStatus = daysPastDue > 0 ? 'overdue' : 'due'; break;
            case 1: suggestedStatus = 'reminder_sent'; break;
            case 2: suggestedStatus = 'dunning_level1_sent'; break;
            case 3: suggestedStatus = 'dunning_level2_sent'; break;
            case 4: suggestedStatus = 'dunning_level3_sent'; break;
        }
        setForm({ ...form, currentLevel: level, status: suggestedStatus });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-surface-700"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-800">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Dunning</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Step {step} of 4</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-surface-700 rounded-lg">
                        <X size={24} className="text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                {/* Progress */}
                <div className="px-5 pt-4">
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4].map(s => (
                            <React.Fragment key={s}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                                    s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-surface-700 text-gray-500'
                                }`}>
                                    {s}
                                </div>
                                {s < 4 && <div className={`flex-1 h-1 rounded transition-colors ${s < step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-surface-700'}`} />}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Customer</span>
                        <span>Invoice</span>
                        <span>Settings</span>
                        <span>Review</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 min-h-[320px]">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Customer Info */}
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Customer Name *</label>
                                    <div className="relative">
                                        <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={form.customerName}
                                            onChange={e => setForm({ ...form, customerName: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                            placeholder="Company GmbH"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Customer Email * (Dunning will be sent here)</label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="email"
                                            value={form.customerEmail}
                                            onChange={e => setForm({ ...form, customerEmail: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                            placeholder="accounting@customer.de"
                                        />
                                    </div>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">📧 This is where the dunning emails will be sent</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Customer Type</label>
                                        <select
                                            value={form.customerType}
                                            onChange={e => setForm({ ...form, customerType: e.target.value as 'B2B' | 'B2C' })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white"
                                        >
                                            <option value="B2B">B2B (Business)</option>
                                            <option value="B2C">B2C (Consumer)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Jurisdiction</label>
                                        <select
                                            value={form.jurisdictionId}
                                            onChange={e => setForm({ ...form, jurisdictionId: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white"
                                        >
                                            {jurisdictions.map(j => <option key={j.jurisdictionId} value={j.jurisdictionId}>{j.jurisdictionName}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Invoice Info */}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Invoice Number *</label>
                                    <div className="relative">
                                        <Hash size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={form.invoiceId}
                                            onChange={e => setForm({ ...form, invoiceId: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white"
                                            placeholder="INV-2025-0001"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Amount *</label>
                                        <div className="relative">
                                            <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="number"
                                                value={form.originalAmount || ''}
                                                onChange={e => setForm({ ...form, originalAmount: parseFloat(e.target.value) || 0 })}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white"
                                                placeholder="10000"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Currency</label>
                                        <select
                                            value={form.currency}
                                            onChange={e => setForm({ ...form, currency: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white"
                                        >
                                            {['EUR', 'USD', 'GBP', 'CHF'].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Invoice Due Date *</label>
                                    <div className="relative">
                                        <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="date"
                                            value={form.invoiceDueDate}
                                            onChange={e => setForm({ ...form, invoiceDueDate: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    {daysPastDue > 0 && (
                                        <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-medium">
                                            ⚠️ This invoice is {daysPastDue} days overdue
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Dunning Settings (NEW) */}
                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">Current Dunning Level</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {Object.entries(LEVEL_CONFIG).map(([level, config]) => {
                                            const lvl = parseInt(level);
                                            const isSelected = form.currentLevel === lvl;
                                            return (
                                                <button
                                                    key={level}
                                                    type="button"
                                                    onClick={() => handleLevelChange(lvl)}
                                                    className={`p-3 rounded-xl border-2 transition-all ${
                                                        isSelected
                                                            ? `${config.bg} ${config.text} border-blue-500 ring-2 ring-blue-500 ring-offset-2`
                                                            : 'bg-gray-50 dark:bg-surface-800 border-gray-200 dark:border-surface-600 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="text-center">
                                                        <p className="font-bold text-sm">{config.label}</p>
                                                        <p className="text-xs opacity-75">Level {lvl}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Select the current state of this dunning (e.g., if reminder was already sent, select "Reminder")
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">Status</label>
                                    <select
                                        value={form.status}
                                        onChange={e => setForm({ ...form, status: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white"
                                    >
                                        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                                            <option key={status} value={status}>{config.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <label className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.isDisputed}
                                        onChange={e => setForm({ ...form, isDisputed: e.target.checked })}
                                        className="rounded border-yellow-400"
                                    />
                                    <div>
                                        <span className="font-medium text-yellow-800 dark:text-yellow-200">Mark as Disputed</span>
                                        <p className="text-xs text-yellow-700 dark:text-yellow-300">Customer has raised a dispute about this invoice</p>
                                    </div>
                                </label>
                            </motion.div>
                        )}

                        {/* Step 4: Review */}
                        {step === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
                                    <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-3">Review Dunning Details</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div><span className="text-blue-700 dark:text-blue-300">Customer:</span> <span className="font-bold text-blue-900 dark:text-blue-100">{form.customerName}</span></div>
                                        <div><span className="text-blue-700 dark:text-blue-300">Email:</span> <span className="font-bold text-blue-900 dark:text-blue-100">{form.customerEmail}</span></div>
                                        <div><span className="text-blue-700 dark:text-blue-300">Invoice:</span> <span className="font-bold text-blue-900 dark:text-blue-100">{form.invoiceId}</span></div>
                                        <div><span className="text-blue-700 dark:text-blue-300">Type:</span> <span className="font-bold text-blue-900 dark:text-blue-100">{form.customerType}</span></div>
                                        <div><span className="text-blue-700 dark:text-blue-300">Level:</span> <span className={`font-bold px-2 py-0.5 rounded ${LEVEL_CONFIG[form.currentLevel]?.bg} ${LEVEL_CONFIG[form.currentLevel]?.text}`}>{LEVEL_CONFIG[form.currentLevel]?.label}</span></div>
                                        <div><span className="text-blue-700 dark:text-blue-300">Status:</span> <span className={`font-bold px-2 py-0.5 rounded ${STATUS_CONFIG[form.status]?.bg} ${STATUS_CONFIG[form.status]?.text}`}>{STATUS_CONFIG[form.status]?.label}</span></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                        <p className="text-sm text-gray-500">Original Amount</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">{form.currency} {form.originalAmount.toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
                                        <p className="text-sm text-amber-600">Interest ({(interestRate * 100).toFixed(2)}% p.a.)</p>
                                        <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{form.currency} {interestAccrued.toFixed(2)}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                                        <p className="text-sm text-gray-500">Flat Fee ({form.customerType})</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">{form.currency} {flatFee.toFixed(2)}</p>
                                    </div>
                                    <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-xl">
                                        <p className="text-sm text-red-600">Days Overdue</p>
                                        <p className="text-xl font-bold text-red-700 dark:text-red-300">{daysPastDue}</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl border-2 border-green-200 dark:border-green-800">
                                    <p className="text-sm text-green-600 dark:text-green-400">Total Due</p>
                                    <p className="text-3xl font-bold text-green-700 dark:text-green-300">{form.currency} {totalDue.toFixed(2)}</p>
                                </div>

                                {form.isDisputed && (
                                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl border border-yellow-200 dark:border-yellow-800">
                                        <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">⚠️ This dunning is marked as disputed</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex justify-between p-5 border-t border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-800">
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : onClose}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 dark:bg-surface-700 hover:bg-gray-300 dark:hover:bg-surface-600 text-gray-800 dark:text-gray-200 rounded-xl font-medium"
                    >
                        <ChevronLeft size={18} />{step > 1 ? 'Back' : 'Cancel'}
                    </button>
                    {step < 4 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            disabled={!canProceed}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold"
                        >
                            Next<ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold"
                        >
                            <Plus size={18} />Create Dunning
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}


// =============================================================================
// NEW TEMPLATE WIZARD
// =============================================================================

function NewTemplateWizard({ onClose, onCreate }: { onClose: () => void; onCreate: (t: Omit<Template, 'id'>) => void }) {
    const [form, setForm] = useState({
        code: '',
        name: '',
        level: 1,
        language: 'de',
        subject: '',
        body: '',
        isActive: true,
    });

    const isValid = form.code && form.name && form.subject && form.body;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-surface-700"
                        onClick={e => e.stopPropagation()}>

                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Template</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-surface-700 rounded-lg"><X size={24} className="text-gray-600 dark:text-gray-300" /></button>
                </div>

                <div className="p-5 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Template Code *</label>
                            <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                                   className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white font-mono" placeholder="REMINDER_EN" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Template Name *</label>
                            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                   className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white" placeholder="Payment Reminder (EN)" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Dunning Level</label>
                            <select value={form.level} onChange={e => setForm({ ...form, level: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white">
                                {Object.entries(LEVEL_CONFIG).filter(([k]) => parseInt(k) > 0).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Language</label>
                            <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white">
                                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Subject Line *</label>
                        <input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                               className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white" placeholder="Payment Reminder - Invoice {{invoice_number}}" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Email Body *</label>
                        <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })}
                                  className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white font-mono text-sm h-40 resize-none" placeholder="Dear Customer,\n\n..." />
                        <p className="text-xs text-gray-500 mt-2">Variables: {'{{invoice_number}}'}, {'{{amount}}'}, {'{{due_date}}'}, {'{{interest}}'}, {'{{total_due}}'}, {'{{customer_name}}'}, {'{{company_name}}'}</p>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Template is active</span>
                    </label>
                </div>

                <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-800">
                    <button onClick={onClose} className="px-5 py-2.5 bg-gray-200 dark:bg-surface-700 hover:bg-gray-300 dark:hover:bg-surface-600 text-gray-800 dark:text-gray-200 rounded-xl font-medium">Cancel</button>
                    <button onClick={() => onCreate(form)} disabled={!isValid}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold">Create Template</button>
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// NEW AUTOMATION RULE WIZARD
// =============================================================================

function NewAutomationWizard({ onClose, onCreate }: { onClose: () => void; onCreate: (r: Omit<Rule, 'id' | 'executionCount' | 'successCount' | 'lastExecutedAt'>) => void }) {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        code: '',
        name: '',
        description: '',
        isActive: true,
        dunningLevels: [1] as number[],
        confidenceThreshold: 0.95,
        schedule: '0 8 * * 1-5' as string | null,
        multiSignatureRequired: false,
        autoSendEnabled: true,
        daysOverdueMin: 3,
        daysOverdueMax: null as number | null,
    });

    const toggleLevel = (level: number) => {
        if (form.dunningLevels.includes(level)) {
            setForm({ ...form, dunningLevels: form.dunningLevels.filter(l => l !== level) });
        } else {
            setForm({ ...form, dunningLevels: [...form.dunningLevels, level].sort() });
        }
    };

    const canProceed = step === 1 ? form.code && form.name : step === 2 ? form.dunningLevels.length > 0 : true;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-surface-700"
                        onClick={e => e.stopPropagation()}>

                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-800">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Automation Rule</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Step {step} of 3</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-surface-700 rounded-lg"><X size={24} className="text-gray-600 dark:text-gray-300" /></button>
                </div>

                <div className="p-5 min-h-[350px]">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Rule Code *</label>
                                    <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                                           className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white font-mono" placeholder="AUTO_REMINDER_NEW" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Rule Name *</label>
                                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                           className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white" placeholder="Automatic Payment Reminder" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Description</label>
                                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                              className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white h-24 resize-none" placeholder="Describe what this rule does..." />
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Dunning Levels *</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(LEVEL_CONFIG).filter(([k]) => parseInt(k) > 0).map(([k, v]) => {
                                            const level = parseInt(k);
                                            const selected = form.dunningLevels.includes(level);
                                            return (
                                                <button key={k} onClick={() => toggleLevel(level)}
                                                        className={`px-4 py-2 rounded-xl font-medium transition-all ${selected ? `${v.bg} ${v.text} ring-2 ring-offset-2 ring-blue-500` : 'bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-400'}`}>
                                                    {v.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {form.dunningLevels.includes(4) && (
                                        <p className="mt-2 text-sm text-purple-600 dark:text-purple-400">⚠️ Level 3 should always be manual. Consider removing it from automation.</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Min Days Overdue</label>
                                        <input type="number" value={form.daysOverdueMin} onChange={e => setForm({ ...form, daysOverdueMin: parseInt(e.target.value) || 0 })}
                                               className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Max Days Overdue (optional)</label>
                                        <input type="number" value={form.daysOverdueMax || ''} onChange={e => setForm({ ...form, daysOverdueMax: e.target.value ? parseInt(e.target.value) : null })}
                                               className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white" placeholder="No limit" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Confidence Threshold</label>
                                    <div className="flex items-center gap-4">
                                        <input type="range" min="0.5" max="1" step="0.05" value={form.confidenceThreshold} onChange={e => setForm({ ...form, confidenceThreshold: parseFloat(e.target.value) })}
                                               className="flex-1" />
                                        <span className="text-lg font-bold text-gray-900 dark:text-white w-16">{(form.confidenceThreshold * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Schedule (Cron)</label>
                                    <input type="text" value={form.schedule || ''} onChange={e => setForm({ ...form, schedule: e.target.value || null })}
                                           className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white font-mono" placeholder="0 8 * * 1-5 (8am weekdays)" />
                                    <p className="text-xs text-gray-500 mt-1">Leave empty for manual-only execution</p>
                                </div>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-surface-800 rounded-xl cursor-pointer">
                                        <input type="checkbox" checked={form.autoSendEnabled} onChange={e => setForm({ ...form, autoSendEnabled: e.target.checked })} className="rounded" />
                                        <div>
                                            <span className="font-medium text-gray-900 dark:text-white">Auto-Send Enabled</span>
                                            <p className="text-xs text-gray-500">Automatically send emails when proposal is approved</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-surface-800 rounded-xl cursor-pointer">
                                        <input type="checkbox" checked={form.multiSignatureRequired} onChange={e => setForm({ ...form, multiSignatureRequired: e.target.checked })} className="rounded" />
                                        <div>
                                            <span className="font-medium text-gray-900 dark:text-white">Require Multi-Signature</span>
                                            <p className="text-xs text-gray-500">Multiple approvals required (recommended for Level 3)</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-surface-800 rounded-xl cursor-pointer">
                                        <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                                        <div>
                                            <span className="font-medium text-gray-900 dark:text-white">Rule Active</span>
                                            <p className="text-xs text-gray-500">Enable this rule immediately</p>
                                        </div>
                                    </label>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex justify-between p-5 border-t border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-800">
                    <button onClick={() => step > 1 ? setStep(step - 1) : onClose}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 dark:bg-surface-700 hover:bg-gray-300 dark:hover:bg-surface-600 text-gray-800 dark:text-gray-200 rounded-xl font-medium">
                        <ChevronLeft size={18} />{step > 1 ? 'Back' : 'Cancel'}
                    </button>
                    {step < 3 ? (
                        <button onClick={() => setStep(step + 1)} disabled={!canProceed}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold">
                            Next<ChevronRight size={18} />
                        </button>
                    ) : (
                        <button onClick={() => onCreate(form)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold">
                            <Zap size={18} />Create Rule
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// DUNNING DETAIL MODAL (with email change)
// =============================================================================

function DunningDetailModal({ dunning, onClose, onInitiateLevel3, onUpdateEmail }: { dunning: Dunning; onClose: () => void; onInitiateLevel3: () => void; onUpdateEmail: (email: string) => void }) {
    const { language } = useThemeStore();
    const [editingEmail, setEditingEmail] = useState(false);
    const [newEmail, setNewEmail] = useState(dunning.customerEmail);

    const formatCurrency = (amount: number, currency = 'EUR') => new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency }).format(amount);
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US');
    const canInitiateLevel3 = dunning.currentLevel === 3 && dunning.status === 'dunning_level2_sent' && !dunning.isDisputed;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-surface-700"
                        onClick={e => e.stopPropagation()}>

                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-800">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{dunning.dunningNumber}</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{dunning.customerName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-surface-700 rounded-lg"><X size={24} /></button>
                </div>

                <div className="p-5 overflow-y-auto max-h-[calc(90vh-180px)] space-y-5">
                    {/* Email */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Mail size={20} className="text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Dunning Email</p>
                                    {editingEmail ? (
                                        <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} autoFocus
                                               className="mt-1 px-3 py-1.5 bg-white dark:bg-surface-800 border border-blue-300 rounded-lg text-sm w-64" />
                                    ) : (
                                        <p className="text-blue-800 dark:text-blue-300 font-mono">{dunning.customerEmail}</p>
                                    )}
                                </div>
                            </div>
                            {editingEmail ? (
                                <div className="flex gap-2">
                                    <button onClick={() => { onUpdateEmail(newEmail); setEditingEmail(false); }} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"><Save size={16} /></button>
                                    <button onClick={() => { setEditingEmail(false); setNewEmail(dunning.customerEmail); }} className="p-2 bg-gray-200 dark:bg-surface-700 rounded-lg"><X size={16} /></button>
                                </div>
                            ) : (
                                <button onClick={() => setEditingEmail(true)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                                    <Edit2 size={14} />Change
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-100 dark:bg-surface-800 rounded-xl"><p className="text-sm text-gray-600 dark:text-gray-400">Outstanding</p><p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(dunning.outstandingAmount, dunning.currency)}</p></div>
                        <div className="text-center p-4 bg-amber-100 dark:bg-amber-900/30 rounded-xl"><p className="text-sm text-amber-700">Interest + Fees</p><p className="text-xl font-bold text-amber-800 dark:text-amber-200">{formatCurrency(dunning.interestAccrued + dunning.feesAccrued, dunning.currency)}</p></div>
                        <div className="text-center p-4 bg-red-100 dark:bg-red-900/30 rounded-xl"><p className="text-sm text-red-700">Days Overdue</p><p className="text-xl font-bold text-red-800 dark:text-red-200">{dunning.daysPastDue}</p></div>
                    </div>

                    {/* Status */}
                    <div className="p-4 bg-gray-100 dark:bg-surface-800 rounded-xl flex items-center justify-between">
                        <div><p className="text-sm text-gray-600">Current Level</p><span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold ${LEVEL_CONFIG[dunning.currentLevel]?.bg} ${LEVEL_CONFIG[dunning.currentLevel]?.text}`}>{LEVEL_CONFIG[dunning.currentLevel]?.label}</span></div>
                        <div><p className="text-sm text-gray-600">Status</p><span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold ${STATUS_CONFIG[dunning.status]?.bg} ${STATUS_CONFIG[dunning.status]?.text}`}>{STATUS_CONFIG[dunning.status]?.label}</span></div>
                    </div>

                    {/* Communication History */}
                    <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Communication History</h3>
                        {dunning.communications.length === 0 ? (
                            <p className="text-sm text-gray-500 italic p-4 bg-gray-50 dark:bg-surface-800 rounded-lg">No communications sent yet</p>
                        ) : (
                            <div className="space-y-2">
                                {dunning.communications.map((c, i) => (
                                    <div key={i} className="p-3 bg-gray-50 dark:bg-surface-800 rounded-lg border border-gray-200 dark:border-surface-700">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${LEVEL_CONFIG[c.level]?.bg} ${LEVEL_CONFIG[c.level]?.text}`}>{LEVEL_CONFIG[c.level]?.label}</span>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">to {c.sentTo}</span>
                                            </div>
                                            <span className="text-xs text-gray-500">{formatDate(c.sentAt)}</span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{c.subject}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Level 3 */}
                    {canInitiateLevel3 && (
                        <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-xl border-2 border-purple-300 dark:border-purple-700">
                            <div className="flex items-start gap-3">
                                <Gavel size={28} className="text-purple-700 dark:text-purple-300" />
                                <div>
                                    <h4 className="font-bold text-purple-900 dark:text-purple-100">Level 3 - Legal Action</h4>
                                    <p className="text-sm text-purple-800 dark:text-purple-200 mt-1">Level 2 sent without response. You can manually initiate Level 3.</p>
                                    <button onClick={onInitiateLevel3} className="mt-3 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold">Initiate Level 3</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end p-5 border-t border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-800">
                    <button onClick={onClose} className="px-5 py-2.5 bg-gray-200 dark:bg-surface-700 hover:bg-gray-300 dark:hover:bg-surface-600 text-gray-800 dark:text-gray-200 rounded-xl font-medium">Close</button>
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// LEVEL 3 INITIATION MODAL
// =============================================================================

function Level3InitiationModal({ dunning, onClose, onConfirm }: { dunning: Dunning; onClose: () => void; onConfirm: (reason: string) => void }) {
    const [reason, setReason] = useState('');
    const [confirmed, setConfirmed] = useState(false);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-surface-700"
                        onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-purple-200 dark:bg-purple-800 rounded-full"><Gavel size={28} className="text-purple-700 dark:text-purple-200" /></div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Initiate Level 3</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{dunning.customerName}</p>
                        </div>
                    </div>
                    <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-lg mb-4 border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-800 dark:text-red-200 font-medium">⚠️ Level 3 initiates legal proceedings. Requires multi-signature.</p>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Reason *</label>
                            <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Why is legal action necessary..."
                                      className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white h-24 resize-none" />
                        </div>
                        <label className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-surface-800 rounded-xl cursor-pointer">
                            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-0.5 rounded" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">I confirm all prior collection attempts have been exhausted.</span>
                        </label>
                    </div>
                </div>
                <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-800">
                    <button onClick={onClose} className="px-5 py-2.5 bg-gray-200 dark:bg-surface-700 hover:bg-gray-300 dark:hover:bg-surface-600 text-gray-800 dark:text-gray-200 rounded-xl font-medium">Cancel</button>
                    <button onClick={() => onConfirm(reason)} disabled={!reason.trim() || !confirmed}
                            className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold">Request Approval</button>
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// TEMPLATE EDITOR MODAL
// =============================================================================

function TemplateEditorModal({ template, onClose, onSave }: { template: Template; onClose: () => void; onSave: (t: Template) => void }) {
    const [form, setForm] = useState(template);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-surface-700"
                        onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit: {template.name}</h2>
                </div>
                <div className="p-5 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Name</label>
                        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                               className="w-full px-4 py-2.5 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Level</label>
                            <select value={form.level} onChange={e => setForm({ ...form, level: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white">
                                {Object.entries(LEVEL_CONFIG).filter(([k]) => parseInt(k) > 0).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Language</label>
                            <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white">
                                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Subject</label>
                        <input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                               className="w-full px-4 py-2.5 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Body</label>
                        <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })}
                                  className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white font-mono text-sm h-48 resize-none" />
                    </div>
                    <label className="flex items-center gap-3"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded" /><span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span></label>
                </div>
                <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-800">
                    <button onClick={onClose} className="px-5 py-2.5 bg-gray-200 dark:bg-surface-700 hover:bg-gray-300 dark:hover:bg-surface-600 text-gray-800 dark:text-gray-200 rounded-xl font-medium">Cancel</button>
                    <button onClick={() => onSave(form)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">Save</button>
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// IMPORT MODAL
// =============================================================================

function ImportModal({ onClose, onImport }: { onClose: () => void; onImport: (file: File) => void }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-surface-700"
                        onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Import Dunning Data</h2>
                    <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                         onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setSelectedFile(f); }}
                         onClick={() => fileInputRef.current?.click()}
                         className={`p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-surface-600 hover:border-gray-400'}`}>
                        <Upload size={40} className="mx-auto mb-3 text-gray-400" />
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{selectedFile ? selectedFile.name : 'Drop CSV/XLSX here'}</p>
                        <p className="text-xs text-gray-500 mt-1">or click to browse</p>
                        <input ref={fileInputRef} type="file" accept=".csv,.xlsx" onChange={e => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }} className="hidden" />
                    </div>
                </div>
                <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-800">
                    <button onClick={onClose} className="px-5 py-2.5 bg-gray-200 dark:bg-surface-700 hover:bg-gray-300 dark:hover:bg-surface-600 text-gray-800 dark:text-gray-200 rounded-xl font-medium">Cancel</button>
                    <button onClick={() => selectedFile && onImport(selectedFile)} disabled={!selectedFile}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold">Import</button>
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// EMAIL TEST MODAL
// =============================================================================

function EmailTestModal({ onClose, onTest }: { onClose: () => void; onTest: (email: string) => void }) {
    const [testEmail, setTestEmail] = useState('');
    const [testing, setTesting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleTest = async () => {
        setTesting(true);
        setResult(null);
        try {
            const response = await fetch('/api/dunning/send-email/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ testEmail }),
            });
            const data = await response.json();
            setResult({ success: data.success, message: data.message || data.error });
        } catch (error) {
            setResult({ success: false, message: 'Failed to connect to email service' });
        }
        setTesting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-surface-700"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Test Email Configuration</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Send a test email to verify your SMTP settings</p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Your Email Address</label>
                            <input
                                type="email"
                                value={testEmail}
                                onChange={e => setTestEmail(e.target.value)}
                                placeholder="your-email@example.com"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white"
                            />
                        </div>

                        {result && (
                            <div className={`p-4 rounded-xl ${result.success ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'}`}>
                                <div className="flex items-center gap-2">
                                    {result.success ? <CheckCircle2 size={20} className="text-green-600" /> : <XCircle size={20} className="text-red-600" />}
                                    <p className={`text-sm font-medium ${result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                        {result.message}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-800">
                    <button onClick={onClose} className="px-5 py-2.5 bg-gray-200 dark:bg-surface-700 hover:bg-gray-300 dark:hover:bg-surface-600 text-gray-800 dark:text-gray-200 rounded-xl font-medium">
                        Close
                    </button>
                    <button
                        onClick={handleTest}
                        disabled={!testEmail || !testEmail.includes('@') || testing}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold"
                    >
                        {testing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        Send Test
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function DunningPage() {
    const { language } = useThemeStore();

    // State
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [dunnings, setDunnings] = useState<Dunning[]>(createInitialDunnings);
    const [proposals, setProposals] = useState<Proposal[]>(createInitialProposals);
    const [exceptions, setExceptions] = useState<Exception[]>(INITIAL_EXCEPTIONS);
    const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);
    const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
    const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [levelFilter, setLevelFilter] = useState('all');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Modals
    const [selectedDunning, setSelectedDunning] = useState<Dunning | null>(null);
    const [level3Dunning, setLevel3Dunning] = useState<Dunning | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [showNewDunningWizard, setShowNewDunningWizard] = useState(false);
    const [showNewTemplateWizard, setShowNewTemplateWizard] = useState(false);
    const [showNewAutomationWizard, setShowNewAutomationWizard] = useState(false);
    const [showEmailTestModal, setShowEmailTestModal] = useState(false);

    // Helpers
    const formatCurrency = (amount: number, currency = 'EUR') => new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', { style: 'currency', currency }).format(amount);
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US');
    const formatDateTime = (dateStr: string) => new Date(dateStr).toLocaleString(language === 'de' ? 'de-DE' : 'en-US');
    const showToast = (message: string, type: 'success' | 'error' | 'info') => setToast({ message, type });

    // Filtered data
    const filteredDunnings = useMemo(() => {
        let result = [...dunnings];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(d => d.dunningNumber.toLowerCase().includes(q) || d.invoiceId.toLowerCase().includes(q) || d.customerName.toLowerCase().includes(q) || d.customerEmail.toLowerCase().includes(q));
        }
        if (statusFilter !== 'all') result = result.filter(d => d.status === statusFilter);
        if (levelFilter !== 'all') result = result.filter(d => d.currentLevel === parseInt(levelFilter));
        return result;
    }, [dunnings, searchQuery, statusFilter, levelFilter]);

    const stats = useMemo(() => ({
        totalOutstanding: dunnings.reduce((sum, d) => sum + d.outstandingAmount, 0),
        overdueCount: dunnings.filter(d => d.daysPastDue > 0).length,
        disputedCount: dunnings.filter(d => d.isDisputed).length,
        pendingProposals: proposals.filter(p => p.status === 'pending').length,
        openExceptions: exceptions.filter(e => e.status === 'open').length,
        emailsSent: emailLogs.length,
    }), [dunnings, proposals, exceptions, emailLogs]);

    // ===========================================
    // ACTION HANDLERS
    // ===========================================

    const handleExport = () => {
        const data = dunnings.map(d => ({
            dunningNumber: d.dunningNumber, invoiceId: d.invoiceId, customerName: d.customerName, customerEmail: d.customerEmail,
            amount: d.totalDue, currency: d.currency, status: STATUS_CONFIG[d.status]?.label || d.status, level: LEVEL_CONFIG[d.currentLevel]?.label, daysPastDue: d.daysPastDue,
        }));
        const csv = [Object.keys(data[0]).join(','), ...data.map(row => Object.values(row).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `dunning-export-${new Date().toISOString().split('T')[0]}.csv`; a.click();
        URL.revokeObjectURL(url);
        showToast('Export downloaded', 'success');
    };

    const handleImport = (file: File) => {
        setIsLoading(true);
        setTimeout(() => { setIsLoading(false); setShowImportModal(false); showToast(`Imported ${file.name} - 3 new records added`, 'success'); }, 1500);
    };

    const handleCreateDunning = (data: Omit<Dunning, 'id' | 'dunningNumber' | 'communications'>) => {
        const newDunning: Dunning = {
            ...data,
            id: `dun-${Date.now()}`,
            dunningNumber: `DUN-${data.jurisdictionId}-${new Date().getFullYear()}-${String(dunnings.length + 1).padStart(5, '0')}`,
            communications: [],
        };
        setDunnings(prev => [newDunning, ...prev]);
        setShowNewDunningWizard(false);
        showToast(`Dunning ${newDunning.dunningNumber} created`, 'success');
    };

    const handleApproveProposal = async (proposal: Proposal) => {
        if (proposal.proposalLevel > 3) {
            showToast('Level 3 requires multi-signature approval', 'error');
            return;
        }

        setIsLoading(true);
        const dunning = dunnings.find(d => d.id === proposal.dunningId);
        if (!dunning) { setIsLoading(false); return; }

        // Find template
        const template = templates.find(t => t.level === proposal.proposalLevel && t.isActive);
        if (!template) {
            setIsLoading(false);
            showToast('No active template found for this level', 'error');
            return;
        }

        // Process template
        const targetEmail = proposal.overrideEmail || proposal.dunning.customerEmail;
        const { subject, body } = processTemplate(template, {
            invoice_number: dunning.invoiceId,
            amount: formatCurrency(dunning.originalAmount, dunning.currency),
            due_date: formatDate(dunning.invoiceDueDate),
            interest: formatCurrency(dunning.interestAccrued, dunning.currency),
            total_due: formatCurrency(dunning.totalDue, dunning.currency),
            customer_name: dunning.customerName,
            company_name: 'PrimeBalance GmbH',
        });

        // Send email
        const result = await sendDunningEmail({ to: targetEmail, subject, body, dunningId: dunning.id, level: proposal.proposalLevel });

        if (result.success) {
            // Log email
            const emailLog: EmailLog = {
                id: result.messageId,
                dunningId: dunning.id,
                dunningNumber: dunning.dunningNumber,
                customerName: dunning.customerName,
                sentTo: targetEmail,
                subject,
                body,
                level: proposal.proposalLevel,
                sentAt: new Date().toISOString(),
                status: 'sent',
            };
            setEmailLogs(prev => [emailLog, ...prev]);

            // Update proposal
            setProposals(prev => prev.map(p => p.id === proposal.id ? { ...p, status: 'sent' } : p));

            // Update dunning
            setDunnings(prev => prev.map(d => {
                if (d.id === proposal.dunningId) {
                    return {
                        ...d,
                        currentLevel: proposal.proposalLevel,
                        status: LEVEL_CONFIG[proposal.proposalLevel]?.statusAfterSend || d.status,
                        hasActiveProposal: false,
                        communications: [...d.communications, { level: proposal.proposalLevel, sentAt: new Date().toISOString(), sentTo: targetEmail, subject, body }],
                    };
                }
                return d;
            }));

            showToast(`✉️ Email sent to ${targetEmail}`, 'success');
        } else {
            showToast('Failed to send email. Check logs.', 'error');
        }

        setIsLoading(false);
    };

    const handleRejectProposal = (proposalId: string) => {
        setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'rejected' } : p));
        showToast('Proposal rejected', 'info');
    };

    const handleUpdateEmail = (dunningId: string, email: string) => {
        setDunnings(prev => prev.map(d => d.id === dunningId ? { ...d, customerEmail: email } : d));
        if (selectedDunning?.id === dunningId) setSelectedDunning({ ...selectedDunning, customerEmail: email });
        showToast('Email updated', 'success');
    };

    const handleInitiateLevel3 = (dunning: Dunning) => { setSelectedDunning(null); setLevel3Dunning(dunning); };

    const handleConfirmLevel3 = (reason: string) => {
        if (!level3Dunning) return;
        const newProposal: Proposal = {
            id: `prop-${Date.now()}`, dunningId: level3Dunning.id, proposalLevel: 4, status: 'pending',
            proposedAmount: level3Dunning.totalDue, calculatedInterest: level3Dunning.interestAccrued, calculatedFees: level3Dunning.feesAccrued + 100,
            confidenceScore: 1.0, paymentDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            explanation: `MANUAL Level 3. Reason: ${reason}`, verificationChecks: { manualReview: true, level2Exhausted: true },
            dunning: { customerName: level3Dunning.customerName, customerEmail: level3Dunning.customerEmail, invoiceId: level3Dunning.invoiceId },
            isAutoSend: false,
        };
        setProposals(prev => [...prev, newProposal]);
        setDunnings(prev => prev.map(d => d.id === level3Dunning.id ? { ...d, status: 'dunning_level3_pending', hasActiveProposal: true } : d));
        setLevel3Dunning(null);
        showToast('Level 3 request created', 'info');
    };

    const handleResolveException = (id: string) => { setExceptions(prev => prev.map(e => e.id === id ? { ...e, status: 'resolved' } : e)); showToast('Resolved', 'success'); };

    const handleRetryException = (id: string) => {
        const exc = exceptions.find(e => e.id === id);
        if (exc && exc.retryCount < exc.maxRetries) {
            setIsLoading(true);
            setTimeout(() => {
                setExceptions(prev => prev.map(e => e.id === id ? { ...e, retryCount: e.retryCount + 1 } : e));
                setIsLoading(false);
                showToast(`Retry ${exc.retryCount + 1}/${exc.maxRetries}`, 'info');
            }, 1000);
        }
    };

    const handleToggleRule = (id: string) => {
        const rule = rules.find(r => r.id === id);
        setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
        showToast(`Rule "${rule?.name}" ${rule?.isActive ? 'disabled' : 'enabled'}`, 'info');
    };

    const handleCreateTemplate = (data: Omit<Template, 'id'>) => {
        setTemplates(prev => [...prev, { ...data, id: `tpl-${Date.now()}` }]);
        setShowNewTemplateWizard(false);
        showToast('Template created', 'success');
    };

    const handleSaveTemplate = (t: Template) => { setTemplates(prev => prev.map(x => x.id === t.id ? t : x)); setEditingTemplate(null); showToast('Template saved', 'success'); };

    const handleCreateRule = (data: Omit<Rule, 'id' | 'executionCount' | 'successCount' | 'lastExecutedAt'>) => {
        setRules(prev => [...prev, { ...data, id: `rule-${Date.now()}`, executionCount: 0, successCount: 0, lastExecutedAt: null }]);
        setShowNewAutomationWizard(false);
        showToast('Automation rule created', 'success');
    };

    const handleRefresh = () => { setIsLoading(true); setTimeout(() => { setIsLoading(false); showToast('Refreshed', 'success'); }, 1000); };

    // Tabs
    const tabs = [
        { id: 'overview' as TabId, label: 'Overview', icon: BarChart3, badge: 0 },
        { id: 'queue' as TabId, label: 'Queue', icon: Inbox, badge: stats.overdueCount },
        { id: 'proposals' as TabId, label: 'Proposals', icon: CheckSquare, badge: stats.pendingProposals },
        { id: 'exceptions' as TabId, label: 'Exceptions', icon: AlertCircle, badge: stats.openExceptions },
        { id: 'automation' as TabId, label: 'Automation', icon: Zap, badge: 0 },
        { id: 'templates' as TabId, label: 'Templates', icon: FileText, badge: 0 },
        { id: 'email-log' as TabId, label: 'Email Log', icon: Mail, badge: stats.emailsSent },
        { id: 'settings' as TabId, label: 'Settings', icon: Settings, badge: 0 },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Toast */}
            <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

            {/* Modals */}
            {selectedDunning && <DunningDetailModal dunning={selectedDunning} onClose={() => setSelectedDunning(null)} onInitiateLevel3={() => handleInitiateLevel3(selectedDunning)} onUpdateEmail={email => handleUpdateEmail(selectedDunning.id, email)} />}
            {level3Dunning && <Level3InitiationModal dunning={level3Dunning} onClose={() => setLevel3Dunning(null)} onConfirm={handleConfirmLevel3} />}
            {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} onImport={handleImport} />}
            {editingTemplate && <TemplateEditorModal template={editingTemplate} onClose={() => setEditingTemplate(null)} onSave={handleSaveTemplate} />}
            {showNewDunningWizard && <NewDunningWizard jurisdictions={INITIAL_JURISDICTIONS} onClose={() => setShowNewDunningWizard(false)} onCreate={handleCreateDunning} />}
            {showNewTemplateWizard && <NewTemplateWizard onClose={() => setShowNewTemplateWizard(false)} onCreate={handleCreateTemplate} />}
            {showNewAutomationWizard && <NewAutomationWizard onClose={() => setShowNewAutomationWizard(false)} onCreate={handleCreateRule} />}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dunning & Collections</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Level 1 & 2: Auto-email • Level 3: Manual</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowNewDunningWizard(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors">
                        <Plus size={18} />New Dunning
                    </button>
                    <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-surface-800 hover:bg-gray-200 dark:hover:bg-surface-700 text-gray-800 dark:text-gray-200 rounded-xl font-medium border border-gray-200 dark:border-surface-700">
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-surface-800 hover:bg-gray-200 dark:hover:bg-surface-700 text-gray-800 dark:text-gray-200 rounded-xl font-medium border border-gray-200 dark:border-surface-700">
                        <Download size={18} />
                    </button>
                    <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-surface-800 hover:bg-gray-200 dark:hover:bg-surface-700 text-gray-800 dark:text-gray-200 rounded-xl font-medium border border-gray-200 dark:border-surface-700">
                        <Upload size={18} />
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-surface-700">
                <nav className="flex gap-1 overflow-x-auto">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${isActive ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                                <Icon size={18} />
                                {tab.label}
                                {tab.badge > 0 && <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-surface-700 text-gray-700 dark:text-gray-300'}`}>{tab.badge}</span>}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    {activeTab === 'overview' && <OverviewTab stats={stats} dunnings={dunnings} proposals={proposals} formatCurrency={formatCurrency} onApprove={handleApproveProposal} onReject={handleRejectProposal} />}
                    {activeTab === 'queue' && <QueueTab dunnings={filteredDunnings} searchQuery={searchQuery} setSearchQuery={setSearchQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} levelFilter={levelFilter} setLevelFilter={setLevelFilter} formatCurrency={formatCurrency} formatDate={formatDate} onViewDunning={setSelectedDunning} />}
                    {activeTab === 'proposals' && <ProposalsTab proposals={proposals} formatCurrency={formatCurrency} formatDate={formatDate} onApprove={handleApproveProposal} onReject={handleRejectProposal} isLoading={isLoading} />}
                    {activeTab === 'exceptions' && <ExceptionsTab exceptions={exceptions} formatDate={formatDate} onResolve={handleResolveException} onRetry={handleRetryException} isLoading={isLoading} />}
                    {activeTab === 'automation' && <AutomationTab rules={rules} onToggleRule={handleToggleRule} onNewRule={() => setShowNewAutomationWizard(true)} />}
                    {activeTab === 'templates' && <TemplatesTab templates={templates} onEditTemplate={setEditingTemplate} onNewTemplate={() => setShowNewTemplateWizard(true)} />}
                    {activeTab === 'email-log' && <EmailLogTab emailLogs={emailLogs} formatDateTime={formatDateTime} />}
                    {activeTab === 'settings' && <SettingsTab jurisdictions={INITIAL_JURISDICTIONS} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// =============================================================================
// TAB COMPONENTS (SHORTENED FOR SPACE)
// =============================================================================

function OverviewTab({ stats, dunnings, proposals, formatCurrency, onApprove, onReject }: any) {
    const statCards = [
        { label: 'Outstanding', value: formatCurrency(stats.totalOutstanding), icon: DollarSign, bg: 'bg-blue-100 dark:bg-blue-900/40', color: 'text-blue-600 dark:text-blue-400' },
        { label: 'Overdue', value: stats.overdueCount, icon: AlertTriangle, bg: 'bg-amber-100 dark:bg-amber-900/40', color: 'text-amber-600 dark:text-amber-400' },
        { label: 'Proposals', value: stats.pendingProposals, icon: Clock, bg: 'bg-purple-100 dark:bg-purple-900/40', color: 'text-purple-600 dark:text-purple-400' },
        { label: 'Exceptions', value: stats.openExceptions, icon: AlertCircle, bg: 'bg-red-100 dark:bg-red-900/40', color: 'text-red-600 dark:text-red-400' },
        { label: 'Emails Sent', value: stats.emailsSent, icon: Mail, bg: 'bg-green-100 dark:bg-green-900/40', color: 'text-green-600 dark:text-green-400' },
        { label: 'Collection Rate', value: '87%', icon: Target, bg: 'bg-teal-100 dark:bg-teal-900/40', color: 'text-teal-600 dark:text-teal-400' },
    ];
    const pendingProposals = proposals.filter((p: any) => p.status === 'pending');

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statCards.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <Card className="p-4 border border-gray-200 dark:border-surface-700">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${s.bg}`}><Icon size={22} className={s.color} /></div>
                                    <div><p className="text-xs font-medium text-gray-500 dark:text-gray-400">{s.label}</p><p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p></div>
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 border border-gray-200 dark:border-surface-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pending Approvals</h3>
                        <span className="px-3 py-1 text-sm font-bold rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">{pendingProposals.length}</span>
                    </div>
                    <div className="space-y-3">
                        {pendingProposals.slice(0, 5).map((p: Proposal) => (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-surface-800 rounded-xl border border-gray-200 dark:border-surface-700">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${LEVEL_CONFIG[p.proposalLevel]?.bg}`}>
                                        {p.proposalLevel === 4 ? <Gavel size={16} className={LEVEL_CONFIG[p.proposalLevel]?.text} /> : <Send size={16} className={LEVEL_CONFIG[p.proposalLevel]?.text} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.dunning?.customerName}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">{LEVEL_CONFIG[p.proposalLevel]?.label} → {p.dunning?.customerEmail}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {p.proposalLevel <= 3 && <button onClick={() => onApprove(p)} className="p-2 bg-green-100 dark:bg-green-900/40 hover:bg-green-200 rounded-lg"><CheckCircle2 size={18} className="text-green-600" /></button>}
                                    <button onClick={() => onReject(p.id)} className="p-2 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 rounded-lg"><XCircle size={18} className="text-red-600" /></button>
                                </div>
                            </div>
                        ))}
                        {pendingProposals.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No pending proposals</p>}
                    </div>
                </Card>

                <Card className="p-6 border border-gray-200 dark:border-surface-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Dunning by Level</h3>
                    <div className="space-y-4">
                        {Object.entries(LEVEL_CONFIG).map(([level, config]) => {
                            const count = dunnings.filter((d: any) => d.currentLevel === parseInt(level)).length;
                            const pct = dunnings.length > 0 ? (count / dunnings.length) * 100 : 0;
                            return (
                                <div key={level} className="flex items-center gap-3">
                                    <span className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300">{config.label}</span>
                                    <div className="flex-1 h-6 bg-gray-100 dark:bg-surface-800 rounded-full overflow-hidden">
                                        <div style={{ width: `${pct}%` }} className={`h-full rounded-full transition-all ${config.bg}`} />
                                    </div>
                                    <span className="w-8 text-sm font-bold text-gray-900 dark:text-white text-right">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
}

function QueueTab({ dunnings, searchQuery, setSearchQuery, statusFilter, setStatusFilter, levelFilter, setLevelFilter, formatCurrency, formatDate, onViewDunning }: any) {
    return (
        <div className="space-y-4">
            <Card className="p-4 border border-gray-200 dark:border-surface-700">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                               className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white" />
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white">
                        <option value="all">All Statuses</option>
                        {Object.entries(STATUS_CONFIG).map(([s, c]) => <option key={s} value={s}>{c.label}</option>)}
                    </select>
                    <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="px-4 py-2.5 bg-gray-50 dark:bg-surface-800 border border-gray-300 dark:border-surface-600 rounded-xl text-gray-900 dark:text-white">
                        <option value="all">All Levels</option>
                        {Object.entries(LEVEL_CONFIG).map(([l, c]) => <option key={l} value={l}>{c.label}</option>)}
                    </select>
                </div>
            </Card>

            <Card className="overflow-hidden border border-gray-200 dark:border-surface-700">
                {dunnings.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-gray-500"><Inbox size={56} className="mb-4 opacity-50" /><p>No records found</p></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100 dark:bg-surface-800">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Dunning #</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Customer</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Amount</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Level</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Days</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase"></th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-surface-700">
                            {dunnings.map((d: Dunning) => (
                                <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-surface-800/50 cursor-pointer" onClick={() => onViewDunning(d)}>
                                    <td className="px-4 py-4"><p className="text-sm font-semibold text-gray-900 dark:text-white">{d.dunningNumber}</p><p className="text-xs text-gray-500">{d.invoiceId}</p></td>
                                    <td className="px-4 py-4"><p className="text-sm font-medium text-gray-900 dark:text-white">{d.customerName}</p><p className="text-xs text-gray-500">{d.customerEmail}</p></td>
                                    <td className="px-4 py-4 text-right"><p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(d.totalDue, d.currency)}</p></td>
                                    <td className="px-4 py-4 text-center"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${LEVEL_CONFIG[d.currentLevel]?.bg} ${LEVEL_CONFIG[d.currentLevel]?.text}`}>{LEVEL_CONFIG[d.currentLevel]?.label}</span></td>
                                    <td className="px-4 py-4 text-center"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${STATUS_CONFIG[d.status]?.bg} ${STATUS_CONFIG[d.status]?.text}`}>{STATUS_CONFIG[d.status]?.label}</span></td>
                                    <td className="px-4 py-4 text-center"><span className={`text-sm font-bold ${d.daysPastDue > 60 ? 'text-red-600' : d.daysPastDue > 30 ? 'text-orange-600' : 'text-amber-600'}`}>{d.daysPastDue}d</span></td>
                                    <td className="px-4 py-4 text-right"><button className="p-2 bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 rounded-lg"><Eye size={16} className="text-gray-600 dark:text-gray-300" /></button></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}

function ProposalsTab({ proposals, formatCurrency, formatDate, onApprove, onReject, isLoading }: any) {
    const pending = proposals.filter((p: Proposal) => p.status === 'pending');
    return (
        <div className="space-y-4">
            <Card className="p-4 border border-gray-200 dark:border-surface-700">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pending Proposals</h3>
                    <span className="px-3 py-1 text-sm font-bold rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">{pending.length}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Level 1 & 2: Emails sent automatically on approval</span>
                </div>
            </Card>
            <div className="space-y-4">
                {pending.map((p: Proposal) => (
                    <Card key={p.id} className={`p-5 border-2 ${p.proposalLevel === 4 ? 'border-purple-300 dark:border-purple-700' : 'border-gray-200 dark:border-surface-700'}`}>
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${LEVEL_CONFIG[p.proposalLevel]?.bg} ${LEVEL_CONFIG[p.proposalLevel]?.text}`}>{LEVEL_CONFIG[p.proposalLevel]?.label}</span>
                                    <span className="text-base font-bold text-gray-900 dark:text-white">{p.dunning?.customerName}</span>
                                    {p.proposalLevel === 4 ? <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200"><Gavel size={12} className="inline mr-1" />Multi-Sig</span>
                                        : <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200"><Mail size={12} className="inline mr-1" />Auto-Send</span>}
                                </div>
                                <div className="grid grid-cols-4 gap-4 mb-3">
                                    <div className="p-3 bg-gray-50 dark:bg-surface-800 rounded-lg"><p className="text-xs text-gray-500">Amount</p><p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(p.proposedAmount)}</p></div>
                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg"><p className="text-xs text-amber-600">Interest</p><p className="text-base font-bold text-amber-700 dark:text-amber-300">{formatCurrency(p.calculatedInterest)}</p></div>
                                    <div className="p-3 bg-gray-50 dark:bg-surface-800 rounded-lg"><p className="text-xs text-gray-500">Confidence</p><p className={`text-base font-bold ${p.confidenceScore >= 0.95 ? 'text-green-600' : 'text-amber-600'}`}>{(p.confidenceScore * 100).toFixed(0)}%</p></div>
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg"><p className="text-xs text-blue-600">Send To</p><p className="text-sm font-bold text-blue-700 dark:text-blue-300 truncate">{p.dunning?.customerEmail}</p></div>
                                </div>
                                {p.explanation && <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800"><div className="flex items-start gap-2"><Info size={16} className="text-blue-600 mt-0.5" /><p className="text-sm text-blue-800 dark:text-blue-200">{p.explanation}</p></div></div>}
                            </div>
                            <div className="flex flex-col gap-2">
                                {p.proposalLevel <= 3 && (
                                    <button onClick={() => onApprove(p)} disabled={isLoading}
                                            className="flex items-center justify-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl text-sm font-bold">
                                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}Approve & Send
                                    </button>
                                )}
                                {p.proposalLevel === 4 && <button className="flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold"><Gavel size={18} />Add Signature</button>}
                                <button onClick={() => onReject(p.id)} className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-200 dark:bg-surface-700 hover:bg-gray-300 dark:hover:bg-surface-600 text-gray-800 dark:text-gray-200 rounded-xl text-sm font-bold"><XCircle size={18} />Reject</button>
                            </div>
                        </div>
                    </Card>
                ))}
                {pending.length === 0 && <Card className="p-16 border border-gray-200 dark:border-surface-700"><div className="flex flex-col items-center text-gray-500"><CheckSquare size={56} className="mb-4 opacity-50" /><p>No pending proposals</p></div></Card>}
            </div>
        </div>
    );
}

function ExceptionsTab({ exceptions, formatDate, onResolve, onRetry, isLoading }: any) {
    const open = exceptions.filter((e: Exception) => e.status === 'open');
    return (
        <div className="space-y-4">
            <Card className="p-4 border border-gray-200 dark:border-surface-700">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Exception Queue</h3>
                    <span className="px-3 py-1 text-sm font-bold rounded-full bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200">{open.length} open</span>
                </div>
            </Card>
            <div className="space-y-4">
                {open.map((e: Exception) => (
                    <Card key={e.id} className={`p-5 border-2 ${e.isOverdue ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-surface-700'}`}>
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${e.isOverdue ? 'bg-red-100 dark:bg-red-900/40' : 'bg-amber-100 dark:bg-amber-900/40'}`}>
                                <AlertCircle size={24} className={e.isOverdue ? 'text-red-600' : 'text-amber-600'} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-base font-bold text-gray-900 dark:text-white">{e.exceptionType}</span>
                                    {e.isOverdue && <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200">SLA Breached</span>}
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{e.reason}</p>
                                <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <span>Created: {formatDate(e.createdAt)}</span>
                                    <span className={e.isOverdue ? 'text-red-600 font-medium' : ''}>SLA: {formatDate(e.slaDeadline)}</span>
                                    <span>Retries: {e.retryCount}/{e.maxRetries}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => onRetry(e.id)} disabled={e.retryCount >= e.maxRetries || isLoading}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-200 dark:bg-surface-700 hover:bg-gray-300 dark:hover:bg-surface-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 dark:text-gray-200 rounded-xl text-sm font-bold">
                                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}Retry
                                </button>
                                <button onClick={() => onResolve(e.id)} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold"><CheckCircle2 size={16} />Resolve</button>
                            </div>
                        </div>
                    </Card>
                ))}
                {open.length === 0 && <Card className="p-16 border border-gray-200 dark:border-surface-700"><div className="flex flex-col items-center text-gray-500"><CheckCircle2 size={56} className="mb-4 text-green-500 opacity-50" /><p>No open exceptions</p></div></Card>}
            </div>
        </div>
    );
}

function AutomationTab({ rules, onToggleRule, onNewRule }: any) {
    return (
        <div className="space-y-6">
            <Card className="p-4 border border-gray-200 dark:border-surface-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Automation Rules</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Level 1 & 2 auto-email • Level 3 manual only</p>
                    </div>
                    <button onClick={onNewRule} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"><Plus size={18} />New Rule</button>
                </div>
            </Card>
            <div className="space-y-4">
                {rules.map((r: Rule) => (
                    <Card key={r.id} className="p-5 border border-gray-200 dark:border-surface-700">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${r.isActive ? 'bg-green-100 dark:bg-green-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                <Zap size={24} className={r.isActive ? 'text-green-600' : 'text-gray-400'} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-base font-bold text-gray-900 dark:text-white">{r.name}</span>
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${r.isActive ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>{r.isActive ? 'Active' : 'Inactive'}</span>
                                    {r.autoSendEnabled ? <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200"><Mail size={10} className="inline mr-1" />Auto-Send</span>
                                        : <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200"><Gavel size={10} className="inline mr-1" />Manual</span>}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{r.description}</p>
                                <div className="flex flex-wrap gap-2">
                                    {r.dunningLevels?.map((l: number) => <span key={l} className={`px-3 py-1 rounded-lg text-xs font-bold ${LEVEL_CONFIG[l]?.bg} ${LEVEL_CONFIG[l]?.text}`}>{LEVEL_CONFIG[l]?.label}</span>)}
                                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded-lg text-xs font-bold">≥{(r.confidenceThreshold * 100)}%</span>
                                    <span className="px-3 py-1 bg-gray-100 dark:bg-surface-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold">{r.daysOverdueMin}+ days</span>
                                </div>
                            </div>
                            <button onClick={() => onToggleRule(r.id)} className="p-3 bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 rounded-xl">
                                {r.isActive ? <Pause size={20} className="text-gray-600 dark:text-gray-300" /> : <Play size={20} className="text-gray-600 dark:text-gray-300" />}
                            </button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function TemplatesTab({ templates, onEditTemplate, onNewTemplate }: any) {
    return (
        <div className="space-y-6">
            <Card className="p-4 border border-gray-200 dark:border-surface-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Email Templates</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Manage dunning email templates</p>
                    </div>
                    <button onClick={onNewTemplate} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"><Plus size={18} />New Template</button>
                </div>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((t: Template) => (
                    <Card key={t.id} className="p-5 border border-gray-200 dark:border-surface-700">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h4 className="text-base font-bold text-gray-900 dark:text-white">{t.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${LEVEL_CONFIG[t.level]?.bg} ${LEVEL_CONFIG[t.level]?.text}`}>{LEVEL_CONFIG[t.level]?.label}</span>
                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{t.language.toUpperCase()}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.isActive ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>{t.isActive ? 'Active' : 'Inactive'}</span>
                                </div>
                            </div>
                            <button onClick={() => onEditTemplate(t)} className="p-2 bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-600 rounded-lg"><Edit2 size={16} className="text-gray-600 dark:text-gray-300" /></button>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-surface-800 rounded-lg">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Subject:</p>
                            <p className="text-sm text-gray-800 dark:text-gray-200 font-mono truncate">{t.subject}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function EmailLogTab({ emailLogs, formatDateTime }: any) {
    return (
        <div className="space-y-4">
            <Card className="p-4 border border-gray-200 dark:border-surface-700">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Email Log</h3>
                    <span className="px-3 py-1 text-sm font-bold rounded-full bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200">{emailLogs.length} sent</span>
                </div>
            </Card>
            {emailLogs.length === 0 ? (
                <Card className="p-16 border border-gray-200 dark:border-surface-700"><div className="flex flex-col items-center text-gray-500"><Mail size={56} className="mb-4 opacity-50" /><p>No emails sent yet</p></div></Card>
            ) : (
                <div className="space-y-3">
                    {emailLogs.map((log: EmailLog) => (
                        <Card key={log.id} className="p-4 border border-gray-200 dark:border-surface-700">
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg ${LEVEL_CONFIG[log.level]?.bg}`}>
                                    <Mail size={20} className={LEVEL_CONFIG[log.level]?.text} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{log.customerName}</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${LEVEL_CONFIG[log.level]?.bg} ${LEVEL_CONFIG[log.level]?.text}`}>{LEVEL_CONFIG[log.level]?.label}</span>
                                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200">{log.status}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">{formatDateTime(log.sentAt)}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">To: <span className="font-mono text-blue-600 dark:text-blue-400">{log.sentTo}</span></p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{log.subject}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function SettingsTab({ jurisdictions }: { jurisdictions: Jurisdiction[] }) {
    return (
        <div className="space-y-6">
            <Card className="p-6 border border-gray-200 dark:border-surface-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Jurisdiction Configurations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {jurisdictions.map(j => (
                        <div key={j.id} className="p-5 bg-gray-50 dark:bg-surface-800 rounded-xl border border-gray-200 dark:border-surface-700">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg"><Globe size={20} className="text-blue-600 dark:text-blue-400" /></div>
                                <div><p className="font-bold text-gray-900 dark:text-white">{j.jurisdictionName}</p><p className="text-xs text-gray-500">{j.jurisdictionId}</p></div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between p-2 bg-white dark:bg-surface-900 rounded-lg"><span className="text-gray-600 dark:text-gray-400">B2B Interest:</span><span className="font-bold text-gray-900 dark:text-white">{(j.statutoryInterestRateB2B * 100).toFixed(2)}%</span></div>
                                <div className="flex justify-between p-2 bg-white dark:bg-surface-900 rounded-lg"><span className="text-gray-600 dark:text-gray-400">B2C Interest:</span><span className="font-bold text-gray-900 dark:text-white">{(j.statutoryInterestRateB2C * 100).toFixed(2)}%</span></div>
                                <div className="flex justify-between p-2 bg-white dark:bg-surface-900 rounded-lg"><span className="text-gray-600 dark:text-gray-400">Flat Fee:</span><span className="font-bold text-gray-900 dark:text-white">€{j.flatFeeAmountB2B}</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
