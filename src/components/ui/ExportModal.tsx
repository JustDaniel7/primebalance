'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Download,
    X,
    FileJson,
    FileText,
    FileSpreadsheet,
    File,
    FileCode,
    Loader2,
} from 'lucide-react';
import Button from './Button';
import { useThemeStore } from '@/store/theme-store';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';

export type ExportFormat = 'json' | 'csv' | 'xml' | 'txt' | 'pdf' | 'docx';

interface ExportOption {
    format: ExportFormat;
    label: string;
    description: string;
    icon: React.ElementType;
    mimeType: string;
    extension: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
    {
        format: 'pdf',
        label: 'PDF',
        description: 'Printable document',
        icon: File,
        mimeType: 'application/pdf',
        extension: 'pdf',
    },
    {
        format: 'json',
        label: 'JSON',
        description: 'Structured data format',
        icon: FileJson,
        mimeType: 'application/json',
        extension: 'json',
    },
    {
        format: 'csv',
        label: 'CSV',
        description: 'Spreadsheet compatible',
        icon: FileSpreadsheet,
        mimeType: 'text/csv',
        extension: 'csv',
    },
    {
        format: 'xml',
        label: 'XML',
        description: 'Extensible markup format',
        icon: FileCode,
        mimeType: 'application/xml',
        extension: 'xml',
    },
    {
        format: 'txt',
        label: 'TXT',
        description: 'Plain text format',
        icon: FileText,
        mimeType: 'text/plain',
        extension: 'txt',
    },
    {
        format: 'docx',
        label: 'DOCX',
        description: 'Word document',
        icon: File,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: 'docx',
    },
];

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (format: ExportFormat) => void | Promise<void>;
    title?: string;
    fileName?: string;
    availableFormats?: ExportFormat[];
}

export function ExportModal({
    isOpen,
    onClose,
    onExport,
    title = 'Export Data',
    fileName = 'export',
    availableFormats = ['pdf', 'json', 'csv', 'xml', 'txt', 'docx'],
}: ExportModalProps) {
    const { t } = useThemeStore();
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
    const [isExporting, setIsExporting] = useState(false);

    const filteredOptions = EXPORT_OPTIONS.filter((opt) =>
        availableFormats.includes(opt.format)
    );

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await onExport(selectedFormat);
            onClose();
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                    className="absolute inset-0 bg-black/50"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-md mx-4"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200 dark:border-surface-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-[var(--accent-primary)]/10">
                                    <Download size={20} className="text-[var(--accent-primary)]" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {title}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {t('common.selectFormat') || 'Select export format'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Format Options */}
                    <div className="p-6 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            {filteredOptions.map((option) => {
                                const Icon = option.icon;
                                const isSelected = selectedFormat === option.format;
                                return (
                                    <button
                                        key={option.format}
                                        onClick={() => setSelectedFormat(option.format)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                                            isSelected
                                                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                                : 'border-gray-200 dark:border-surface-700 hover:border-gray-300 dark:hover:border-surface-600'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`p-2 rounded-lg ${
                                                    isSelected
                                                        ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                                                        : 'bg-gray-100 dark:bg-surface-800 text-gray-500'
                                                }`}
                                            >
                                                <Icon size={18} />
                                            </div>
                                            <div>
                                                <p
                                                    className={`font-medium ${
                                                        isSelected
                                                            ? 'text-[var(--accent-primary)]'
                                                            : 'text-gray-900 dark:text-white'
                                                    }`}
                                                >
                                                    {option.label}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {option.description}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* File name preview */}
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-surface-800 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">
                                {t('common.fileName') || 'File name'}
                            </p>
                            <p className="text-sm font-mono text-gray-900 dark:text-white">
                                {fileName}-{new Date().toISOString().split('T')[0]}.
                                {EXPORT_OPTIONS.find((o) => o.format === selectedFormat)?.extension}
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-200 dark:border-surface-700 flex justify-end gap-3">
                        <Button variant="secondary" onClick={onClose}>
                            {t('common.cancel') || 'Cancel'}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleExport}
                            disabled={isExporting}
                            leftIcon={
                                isExporting ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Download size={16} />
                                )
                            }
                        >
                            {isExporting
                                ? t('common.exporting') || 'Exporting...'
                                : t('common.export') || 'Export'}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

// Helper function to convert data to different formats
export function convertToFormat(
    data: any,
    format: ExportFormat,
    fileName: string
): { content: string | Blob; mimeType: string; extension: string } {
    const option = EXPORT_OPTIONS.find((o) => o.format === format)!;

    switch (format) {
        case 'json':
            return {
                content: JSON.stringify(data, null, 2),
                mimeType: option.mimeType,
                extension: option.extension,
            };

        case 'csv': {
            // Flatten object for CSV
            const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
                const result: Record<string, any> = {};
                for (const key in obj) {
                    const newKey = prefix ? `${prefix}.${key}` : key;
                    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                        Object.assign(result, flattenObject(obj[key], newKey));
                    } else {
                        result[newKey] = obj[key];
                    }
                }
                return result;
            };

            let csvContent = '';
            if (Array.isArray(data)) {
                if (data.length > 0) {
                    const flattened = data.map((item) => flattenObject(item));
                    const headers = Object.keys(flattened[0]);
                    csvContent = headers.join(',') + '\n';
                    csvContent += flattened
                        .map((row) =>
                            headers
                                .map((h) => {
                                    const val = row[h];
                                    if (typeof val === 'string' && val.includes(',')) {
                                        return `"${val}"`;
                                    }
                                    return val ?? '';
                                })
                                .join(',')
                        )
                        .join('\n');
                }
            } else {
                const flattened = flattenObject(data);
                csvContent = 'Key,Value\n';
                csvContent += Object.entries(flattened)
                    .map(([k, v]) => `${k},${v}`)
                    .join('\n');
            }
            return {
                content: csvContent,
                mimeType: option.mimeType,
                extension: option.extension,
            };
        }

        case 'xml': {
            const toXml = (obj: any, rootName = 'root'): string => {
                const xmlEscape = (str: string) =>
                    String(str)
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');

                const convert = (data: any, name: string): string => {
                    if (data === null || data === undefined) {
                        return `<${name}/>`;
                    }
                    if (Array.isArray(data)) {
                        return data.map((item) => convert(item, 'item')).join('');
                    }
                    if (typeof data === 'object') {
                        const children = Object.entries(data)
                            .map(([key, val]) => convert(val, key))
                            .join('');
                        return `<${name}>${children}</${name}>`;
                    }
                    return `<${name}>${xmlEscape(String(data))}</${name}>`;
                };

                return `<?xml version="1.0" encoding="UTF-8"?>\n${convert(obj, rootName)}`;
            };
            return {
                content: toXml(data, fileName.replace(/[^a-zA-Z0-9]/g, '_')),
                mimeType: option.mimeType,
                extension: option.extension,
            };
        }

        case 'txt': {
            const toText = (obj: any, indent = 0): string => {
                const prefix = '  '.repeat(indent);
                if (Array.isArray(obj)) {
                    return obj.map((item, i) => `${prefix}[${i}]\n${toText(item, indent + 1)}`).join('\n');
                }
                if (typeof obj === 'object' && obj !== null) {
                    return Object.entries(obj)
                        .map(([key, val]) => {
                            if (typeof val === 'object' && val !== null) {
                                return `${prefix}${key}:\n${toText(val, indent + 1)}`;
                            }
                            return `${prefix}${key}: ${val}`;
                        })
                        .join('\n');
                }
                return `${prefix}${obj}`;
            };
            return {
                content: `${fileName} Export\n${'='.repeat(50)}\nExported: ${new Date().toLocaleString()}\n\n${toText(data)}`,
                mimeType: option.mimeType,
                extension: option.extension,
            };
        }

        case 'pdf': {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;
            const maxWidth = pageWidth - margin * 2;
            let yPosition = 20;

            // Title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(fileName, margin, yPosition);
            yPosition += 10;

            // Date
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Exported: ${new Date().toLocaleString()}`, margin, yPosition);
            yPosition += 15;

            // Content
            doc.setFontSize(11);

            const addContent = (obj: any, indent = 0) => {
                const indentStr = '  '.repeat(indent);

                if (Array.isArray(obj)) {
                    obj.forEach((item, i) => {
                        if (yPosition > 270) {
                            doc.addPage();
                            yPosition = 20;
                        }
                        doc.setFont('helvetica', 'bold');
                        doc.text(`${indentStr}[${i + 1}]`, margin, yPosition);
                        yPosition += 6;
                        doc.setFont('helvetica', 'normal');
                        addContent(item, indent + 1);
                    });
                } else if (typeof obj === 'object' && obj !== null) {
                    Object.entries(obj).forEach(([key, val]) => {
                        if (yPosition > 270) {
                            doc.addPage();
                            yPosition = 20;
                        }
                        if (typeof val === 'object' && val !== null) {
                            doc.setFont('helvetica', 'bold');
                            doc.text(`${indentStr}${key}:`, margin, yPosition);
                            yPosition += 6;
                            doc.setFont('helvetica', 'normal');
                            addContent(val, indent + 1);
                        } else {
                            const text = `${indentStr}${key}: ${val ?? 'N/A'}`;
                            const lines = doc.splitTextToSize(text, maxWidth - indent * 10);
                            lines.forEach((line: string) => {
                                if (yPosition > 270) {
                                    doc.addPage();
                                    yPosition = 20;
                                }
                                doc.text(line, margin + indent * 5, yPosition);
                                yPosition += 5;
                            });
                        }
                    });
                } else {
                    const text = `${indentStr}${obj}`;
                    doc.text(text, margin, yPosition);
                    yPosition += 5;
                }
            };

            addContent(data);

            return {
                content: doc.output('blob'),
                mimeType: option.mimeType,
                extension: option.extension,
            };
        }

        case 'docx': {
            const children: (Paragraph | Table)[] = [];

            // Title
            children.push(
                new Paragraph({
                    text: fileName,
                    heading: HeadingLevel.HEADING_1,
                    spacing: { after: 200 },
                })
            );

            // Date
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Exported: ${new Date().toLocaleString()}`,
                            italics: true,
                            size: 20,
                        }),
                    ],
                    spacing: { after: 400 },
                })
            );

            const addDocxContent = (obj: any, level = 0) => {
                if (Array.isArray(obj)) {
                    // Create a table for arrays
                    if (obj.length > 0 && typeof obj[0] === 'object') {
                        const headers = Object.keys(obj[0]);
                        const rows: TableRow[] = [];

                        // Header row
                        rows.push(
                            new TableRow({
                                children: headers.map(
                                    (h) =>
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [
                                                        new TextRun({ text: h, bold: true }),
                                                    ],
                                                }),
                                            ],
                                            width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
                                        })
                                ),
                            })
                        );

                        // Data rows
                        obj.forEach((item) => {
                            rows.push(
                                new TableRow({
                                    children: headers.map(
                                        (h) =>
                                            new TableCell({
                                                children: [
                                                    new Paragraph({
                                                        text: String(item[h] ?? ''),
                                                    }),
                                                ],
                                            })
                                    ),
                                })
                            );
                        });

                        children.push(
                            new Table({
                                rows,
                                width: { size: 100, type: WidthType.PERCENTAGE },
                            })
                        );
                    } else {
                        obj.forEach((item, i) => {
                            children.push(
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: `[${i + 1}] `, bold: true }),
                                        new TextRun({ text: String(item) }),
                                    ],
                                    indent: { left: level * 360 },
                                })
                            );
                        });
                    }
                } else if (typeof obj === 'object' && obj !== null) {
                    Object.entries(obj).forEach(([key, val]) => {
                        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                            children.push(
                                new Paragraph({
                                    children: [new TextRun({ text: `${key}:`, bold: true })],
                                    indent: { left: level * 360 },
                                    spacing: { before: 200 },
                                })
                            );
                            addDocxContent(val, level + 1);
                        } else if (Array.isArray(val)) {
                            children.push(
                                new Paragraph({
                                    children: [new TextRun({ text: `${key}:`, bold: true })],
                                    indent: { left: level * 360 },
                                    spacing: { before: 200 },
                                })
                            );
                            addDocxContent(val, level + 1);
                        } else {
                            children.push(
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: `${key}: `, bold: true }),
                                        new TextRun({ text: String(val ?? 'N/A') }),
                                    ],
                                    indent: { left: level * 360 },
                                })
                            );
                        }
                    });
                } else {
                    children.push(
                        new Paragraph({
                            text: String(obj),
                            indent: { left: level * 360 },
                        })
                    );
                }
            };

            addDocxContent(data);

            const docxDocument = new Document({
                sections: [{ children }],
            });

            // Return a promise-like structure - caller needs to handle async
            return {
                content: docxDocument,
                mimeType: option.mimeType,
                extension: option.extension,
                isDocx: true,
            } as any;
        }

        default:
            return {
                content: JSON.stringify(data, null, 2),
                mimeType: 'application/json',
                extension: 'json',
            };
    }
}

// Helper function to trigger download
export async function downloadFile(content: string | Blob | Document, fileName: string, mimeType: string, isDocx = false) {
    let blob: Blob;

    if (isDocx && content instanceof Document) {
        // Handle DOCX documents using Packer
        blob = await Packer.toBlob(content);
    } else if (typeof content === 'string') {
        blob = new Blob([content], { type: mimeType });
    } else {
        blob = content as Blob;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
