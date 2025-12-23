// =============================================================================
// EXPORT UTILITIES
// Client-side document generation for PDF, DOCX, CSV, XML
// =============================================================================

import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';

// =============================================================================
// TYPES
// =============================================================================

export type ExportFormat = 'pdf' | 'docx' | 'csv' | 'xml';

export interface ExportData {
    title: string;
    subtitle?: string;
    generatedAt: string;
    sections: ExportSection[];
    metadata?: Record<string, string>;
}

export interface ExportSection {
    title: string;
    type: 'text' | 'keyValue' | 'table' | 'list';
    content: string | KeyValuePair[] | TableData | string[];
}

export interface KeyValuePair {
    key: string;
    value: string | number;
}

export interface TableData {
    headers: string[];
    rows: (string | number)[][];
}

// =============================================================================
// DOWNLOAD HELPER
// =============================================================================

const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// =============================================================================
// PDF EXPORT
// =============================================================================

export const exportToPDF = (data: ExportData, filename: string = 'export.pdf') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let y = margin;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(data.title, margin, y);
    y += 10;

    // Subtitle
    if (data.subtitle) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text(data.subtitle, margin, y);
        y += 8;
    }

    // Generated date
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generated: ${data.generatedAt}`, margin, y);
    y += 15;

    // Reset text color
    doc.setTextColor(0);

    // Sections
    data.sections.forEach((section) => {
        // Check if we need a new page
        if (y > 260) {
            doc.addPage();
            y = margin;
        }

        // Section title
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(section.title, margin, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        if (section.type === 'text' && typeof section.content === 'string') {
            const lines = doc.splitTextToSize(section.content, contentWidth);
            doc.text(lines, margin, y);
            y += lines.length * 5 + 5;
        }

        if (section.type === 'keyValue' && Array.isArray(section.content)) {
            (section.content as KeyValuePair[]).forEach((pair) => {
                if (y > 270) {
                    doc.addPage();
                    y = margin;
                }
                doc.setFont('helvetica', 'normal');
                doc.text(`${pair.key}:`, margin, y);
                doc.setFont('helvetica', 'bold');
                doc.text(String(pair.value), margin + 60, y);
                y += 6;
            });
            y += 5;
        }

        if (section.type === 'list' && Array.isArray(section.content)) {
            (section.content as string[]).forEach((item) => {
                if (y > 270) {
                    doc.addPage();
                    y = margin;
                }
                const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 5);
                doc.text(lines, margin + 5, y);
                y += lines.length * 5 + 2;
            });
            y += 5;
        }

        if (section.type === 'table' && section.content && typeof section.content === 'object' && 'headers' in section.content) {
            const tableData = section.content as TableData;
            const colWidth = contentWidth / tableData.headers.length;

            // Headers
            doc.setFont('helvetica', 'bold');
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, y - 4, contentWidth, 8, 'F');
            tableData.headers.forEach((header, i) => {
                doc.text(header, margin + (i * colWidth) + 2, y);
            });
            y += 8;

            // Rows
            doc.setFont('helvetica', 'normal');
            tableData.rows.forEach((row) => {
                if (y > 270) {
                    doc.addPage();
                    y = margin;
                }
                row.forEach((cell, i) => {
                    const text = String(cell).substring(0, 20);
                    doc.text(text, margin + (i * colWidth) + 2, y);
                });
                y += 6;
            });
            y += 5;
        }

        y += 5;
    });

    // Footer disclaimer
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text('This document is for informational purposes only. Not investment advice.', margin, 285);

    doc.save(filename);
};

// =============================================================================
// DOCX EXPORT
// =============================================================================

export const exportToDocx = async (data: ExportData, filename: string = 'export.docx') => {
    const children: any[] = [];

    // Title
    children.push(
        new Paragraph({
            children: [new TextRun({ text: data.title, bold: true, size: 36 })],
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
        })
    );

    // Subtitle
    if (data.subtitle) {
        children.push(
            new Paragraph({
                children: [new TextRun({ text: data.subtitle, color: '666666', size: 22 })],
                spacing: { after: 100 },
            })
        );
    }

    // Generated date
    children.push(
        new Paragraph({
            children: [new TextRun({ text: `Generated: ${data.generatedAt}`, color: '999999', size: 18 })],
            spacing: { after: 400 },
        })
    );

    // Sections
    data.sections.forEach((section) => {
        // Section title
        children.push(
            new Paragraph({
                children: [new TextRun({ text: section.title, bold: true, size: 26 })],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 150 },
            })
        );

        if (section.type === 'text' && typeof section.content === 'string') {
            children.push(
                new Paragraph({
                    children: [new TextRun({ text: section.content, size: 22 })],
                    spacing: { after: 200 },
                })
            );
        }

        if (section.type === 'keyValue' && Array.isArray(section.content)) {
            (section.content as KeyValuePair[]).forEach((pair) => {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: `${pair.key}: `, size: 22 }),
                            new TextRun({ text: String(pair.value), bold: true, size: 22 }),
                        ],
                        spacing: { after: 80 },
                    })
                );
            });
        }

        if (section.type === 'list' && Array.isArray(section.content)) {
            (section.content as string[]).forEach((item) => {
                children.push(
                    new Paragraph({
                        children: [new TextRun({ text: `• ${item}`, size: 22 })],
                        spacing: { after: 80 },
                    })
                );
            });
        }

        if (section.type === 'table' && section.content && typeof section.content === 'object' && 'headers' in section.content) {
            const tableData = section.content as TableData;

            const tableRows = [
                new TableRow({
                    children: tableData.headers.map((header) =>
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: header, bold: true, size: 20 })] })],
                            shading: { fill: 'E8E8E8' },
                        })
                    ),
                }),
                ...tableData.rows.map((row) =>
                    new TableRow({
                        children: row.map((cell) =>
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 20 })] })],
                            })
                        ),
                    })
                ),
            ];

            children.push(
                new Table({
                    rows: tableRows,
                    width: { size: 100, type: WidthType.PERCENTAGE },
                })
            );
        }
    });

    // Disclaimer
    children.push(
        new Paragraph({
            children: [new TextRun({ text: 'This document is for informational purposes only. Not investment advice.', color: '999999', size: 16, italics: true })],
            spacing: { before: 400 },
        })
    );

    const doc = new Document({
        sections: [{ children }],
    });

    const blob = await Packer.toBlob(doc);
    downloadFile(blob, filename);
};

// =============================================================================
// CSV EXPORT
// =============================================================================

export const exportToCSV = (data: ExportData, filename: string = 'export.csv') => {
    const lines: string[] = [];

    // Header info
    lines.push(`"${data.title}"`);
    if (data.subtitle) lines.push(`"${data.subtitle}"`);
    lines.push(`"Generated: ${data.generatedAt}"`);
    lines.push('');

    // Sections
    data.sections.forEach((section) => {
        lines.push(`"${section.title}"`);

        if (section.type === 'text' && typeof section.content === 'string') {
            lines.push(`"${section.content.replace(/"/g, '""')}"`);
        }

        if (section.type === 'keyValue' && Array.isArray(section.content)) {
            (section.content as KeyValuePair[]).forEach((pair) => {
                lines.push(`"${pair.key}","${pair.value}"`);
            });
        }

        if (section.type === 'list' && Array.isArray(section.content)) {
            (section.content as string[]).forEach((item) => {
                lines.push(`"${item.replace(/"/g, '""')}"`);
            });
        }

        if (section.type === 'table' && section.content && typeof section.content === 'object' && 'headers' in section.content) {
            const tableData = section.content as TableData;
            lines.push(tableData.headers.map((h) => `"${h}"`).join(','));
            tableData.rows.forEach((row) => {
                lines.push(row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','));
            });
        }

        lines.push('');
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, filename);
};

// =============================================================================
// XML EXPORT
// =============================================================================

export const exportToXML = (data: ExportData, filename: string = 'export.xml') => {
    const escapeXml = (str: string): string => {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<report>\n';
    xml += `  <title>${escapeXml(data.title)}</title>\n`;
    if (data.subtitle) xml += `  <subtitle>${escapeXml(data.subtitle)}</subtitle>\n`;
    xml += `  <generatedAt>${escapeXml(data.generatedAt)}</generatedAt>\n`;

    if (data.metadata) {
        xml += '  <metadata>\n';
        Object.entries(data.metadata).forEach(([key, value]) => {
            xml += `    <${key}>${escapeXml(value)}</${key}>\n`;
        });
        xml += '  </metadata>\n';
    }

    xml += '  <sections>\n';
    data.sections.forEach((section) => {
        xml += `    <section type="${section.type}">\n`;
        xml += `      <title>${escapeXml(section.title)}</title>\n`;

        if (section.type === 'text' && typeof section.content === 'string') {
            xml += `      <content>${escapeXml(section.content)}</content>\n`;
        }

        if (section.type === 'keyValue' && Array.isArray(section.content)) {
            xml += '      <items>\n';
            (section.content as KeyValuePair[]).forEach((pair) => {
                xml += `        <item key="${escapeXml(pair.key)}" value="${escapeXml(String(pair.value))}" />\n`;
            });
            xml += '      </items>\n';
        }

        if (section.type === 'list' && Array.isArray(section.content)) {
            xml += '      <items>\n';
            (section.content as string[]).forEach((item) => {
                xml += `        <item>${escapeXml(item)}</item>\n`;
            });
            xml += '      </items>\n';
        }

        if (section.type === 'table' && section.content && typeof section.content === 'object' && 'headers' in section.content) {
            const tableData = section.content as TableData;
            xml += '      <table>\n';
            xml += '        <headers>\n';
            tableData.headers.forEach((header) => {
                xml += `          <header>${escapeXml(header)}</header>\n`;
            });
            xml += '        </headers>\n';
            xml += '        <rows>\n';
            tableData.rows.forEach((row) => {
                xml += '          <row>\n';
                row.forEach((cell, i) => {
                    xml += `            <cell column="${escapeXml(tableData.headers[i])}">${escapeXml(String(cell))}</cell>\n`;
                });
                xml += '          </row>\n';
            });
            xml += '        </rows>\n';
            xml += '      </table>\n';
        }

        xml += '    </section>\n';
    });
    xml += '  </sections>\n';
    xml += '</report>';

    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    downloadFile(blob, filename);
};

// =============================================================================
// UNIFIED EXPORT FUNCTION
// =============================================================================

export const exportDocument = async (data: ExportData, format: ExportFormat, filename?: string) => {
    const baseName = filename || data.title.toLowerCase().replace(/\s+/g, '-');

    switch (format) {
        case 'pdf':
            exportToPDF(data, `${baseName}.pdf`);
            break;
        case 'docx':
            await exportToDocx(data, `${baseName}.docx`);
            break;
        case 'csv':
            exportToCSV(data, `${baseName}.csv`);
            break;
        case 'xml':
            exportToXML(data, `${baseName}.xml`);
            break;
    }
};