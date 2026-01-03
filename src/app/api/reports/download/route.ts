// src/app/api/reports/download/route.ts
// Generate downloadable report files in CSV, JSON, XML, PDF, and DOCX formats

import { NextRequest, NextResponse } from 'next/server'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType, AlignmentType, BorderStyle } from 'docx'

export async function POST(req: NextRequest) {
    const user = await getSessionWithOrg()
    if (!user?.organizationId) return unauthorized()

    const body = await req.json()
    const { reportData, format = 'csv', fileName = 'report', reportType = 'Report', period = '' } = body

    if (!reportData) {
        return badRequest('Report data is required')
    }

    try {
        let content: string | Buffer | Uint8Array
        let contentType: string
        let fileExtension: string

        switch (format) {
            case 'csv':
                content = generateCSV(reportData)
                contentType = 'text/csv'
                fileExtension = 'csv'
                break

            case 'json':
                content = JSON.stringify(reportData, null, 2)
                contentType = 'application/json'
                fileExtension = 'json'
                break

            case 'xml':
                content = generateXML(reportData)
                contentType = 'application/xml'
                fileExtension = 'xml'
                break

            case 'pdf':
                content = await generatePDF(reportData, reportType, period)
                contentType = 'application/pdf'
                fileExtension = 'pdf'
                break

            case 'docx':
                content = await generateDOCX(reportData, reportType, period)
                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                fileExtension = 'docx'
                break

            default:
                return badRequest(`Unsupported format: ${format}`)
        }

        // Convert Uint8Array to Buffer for NextResponse compatibility
        const responseBody = content instanceof Uint8Array ? Buffer.from(content) : content

        return new NextResponse(responseBody, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${fileName}.${fileExtension}"`,
            },
        })
    } catch (error) {
        console.error('Download error:', error)
        return NextResponse.json({ error: 'Failed to generate download' }, { status: 500 })
    }
}

function generateCSV(data: any): string {
    const { headers, rows, summary } = data

    const lines: string[] = []

    // Headers
    if (headers) {
        lines.push(headers.join(','))
    }

    // Rows
    if (rows && Array.isArray(rows)) {
        rows.forEach((row: any) => {
            const values = headers
                ? headers.map((h: string) => {
                    const key = h.toLowerCase().replace(/\s+/g, '_')
                    const val = row[key] ?? row[h] ?? ''
                    return typeof val === 'string' && val.includes(',') ? `"${val}"` : val
                })
                : Object.values(row).map(v =>
                    typeof v === 'string' && (v as string).includes(',') ? `"${v}"` : v
                )
            lines.push(values.join(','))
        })
    }

    // Summary
    if (summary) {
        lines.push('')
        lines.push('Summary')
        Object.entries(summary).forEach(([key, value]) => {
            lines.push(`${key},${value}`)
        })
    }

    return lines.join('\n')
}

function generateXML(data: any): string {
    const { headers, rows, summary, reportType } = data

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += `<report type="${reportType || 'custom'}" generated="${new Date().toISOString()}">\n`

    if (rows && Array.isArray(rows)) {
        xml += '  <data>\n'
        rows.forEach((row: any) => {
            xml += '    <row>\n'
            Object.entries(row).forEach(([key, value]) => {
                const escapedValue = String(value)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                xml += `      <${key}>${escapedValue}</${key}>\n`
            })
            xml += '    </row>\n'
        })
        xml += '  </data>\n'
    }

    if (summary) {
        xml += '  <summary>\n'
        Object.entries(summary).forEach(([key, value]) => {
            xml += `    <${key}>${value}</${key}>\n`
        })
        xml += '  </summary>\n'
    }

    xml += '</report>'
    return xml
}

// PDF Generation using pdf-lib
async function generatePDF(data: any, reportType: string, period: string): Promise<Uint8Array> {
    const { headers, rows, summary, totals, currency = 'USD' } = data

    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    let page = pdfDoc.addPage([612, 792]) // Letter size
    const { width, height } = page.getSize()
    let yPosition = height - 50

    // Title
    const title = reportType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    page.drawText(title, {
        x: 50,
        y: yPosition,
        size: 24,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
    })
    yPosition -= 25

    // Period
    if (period) {
        page.drawText(`Period: ${period}`, {
            x: 50,
            y: yPosition,
            size: 12,
            font,
            color: rgb(0.4, 0.4, 0.4),
        })
        yPosition -= 15
    }

    // Generated date
    page.drawText(`Generated: ${new Date().toLocaleString()}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5),
    })
    yPosition -= 40

    // Summary section
    if (summary) {
        page.drawText('Summary', {
            x: 50,
            y: yPosition,
            size: 14,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
        })
        yPosition -= 20

        Object.entries(summary).forEach(([key, value]) => {
            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
            let displayValue: string
            if (typeof value === 'number') {
                if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('income') ||
                    key.toLowerCase().includes('expense') || key.toLowerCase().includes('revenue') ||
                    key.toLowerCase().includes('cost') || key.toLowerCase().includes('value')) {
                    displayValue = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
                } else {
                    displayValue = value.toLocaleString()
                }
            } else {
                displayValue = String(value)
            }

            page.drawText(`${formattedKey}: ${displayValue}`, {
                x: 60,
                y: yPosition,
                size: 11,
                font,
                color: rgb(0.3, 0.3, 0.3),
            })
            yPosition -= 15

            if (yPosition < 100) {
                page = pdfDoc.addPage([612, 792])
                yPosition = height - 50
            }
        })
        yPosition -= 20
    }

    // Data table
    if (headers && rows && rows.length > 0) {
        page.drawText('Details', {
            x: 50,
            y: yPosition,
            size: 14,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
        })
        yPosition -= 25

        // Table headers
        const colWidth = Math.min(120, (width - 100) / headers.length)
        headers.forEach((header: string, idx: number) => {
            page.drawText(header, {
                x: 50 + idx * colWidth,
                y: yPosition,
                size: 10,
                font: boldFont,
                color: rgb(0.1, 0.1, 0.1),
            })
        })
        yPosition -= 5

        // Draw line under headers
        page.drawLine({
            start: { x: 50, y: yPosition },
            end: { x: width - 50, y: yPosition },
            thickness: 1,
            color: rgb(0.8, 0.8, 0.8),
        })
        yPosition -= 15

        // Table rows
        rows.forEach((row: any) => {
            if (yPosition < 100) {
                page = pdfDoc.addPage([612, 792])
                yPosition = height - 50
            }

            headers.forEach((header: string, idx: number) => {
                const key = header.toLowerCase().replace(/\s+/g, '_')
                const altKey = header.toLowerCase().replace(/\s+/g, '')
                let value = row[key] ?? row[altKey] ?? row[header] ?? ''

                if (typeof value === 'number') {
                    if (header.toLowerCase().includes('amount') || header.toLowerCase().includes('value') ||
                        header.toLowerCase().includes('cost')) {
                        value = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
                    } else {
                        value = value.toLocaleString()
                    }
                }

                const text = String(value).substring(0, 20) // Truncate long text
                page.drawText(text, {
                    x: 50 + idx * colWidth,
                    y: yPosition,
                    size: 9,
                    font,
                    color: rgb(0.3, 0.3, 0.3),
                })
            })
            yPosition -= 15
        })

        // Totals row
        if (totals) {
            yPosition -= 5
            page.drawLine({
                start: { x: 50, y: yPosition + 10 },
                end: { x: width - 50, y: yPosition + 10 },
                thickness: 1,
                color: rgb(0.6, 0.6, 0.6),
            })

            page.drawText('Total', {
                x: 50,
                y: yPosition,
                size: 10,
                font: boldFont,
                color: rgb(0.1, 0.1, 0.1),
            })

            Object.entries(totals).forEach(([key, value], idx) => {
                let displayValue: string
                if (typeof value === 'number') {
                    displayValue = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
                } else {
                    displayValue = String(value)
                }
                page.drawText(displayValue, {
                    x: 50 + (idx + 1) * colWidth,
                    y: yPosition,
                    size: 10,
                    font: boldFont,
                    color: rgb(0.1, 0.1, 0.1),
                })
            })
        }
    }

    return pdfDoc.save()
}

// DOCX Generation using docx package
async function generateDOCX(data: any, reportType: string, period: string): Promise<Buffer> {
    const { headers, rows, summary, totals, currency = 'USD' } = data

    const title = reportType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

    const sections: any[] = []

    // Title
    sections.push(
        new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
        })
    )

    // Period and date
    sections.push(
        new Paragraph({
            children: [
                new TextRun({ text: `Period: ${period || 'Current'}`, color: '666666' }),
                new TextRun({ text: '  |  ', color: '999999' }),
                new TextRun({ text: `Generated: ${new Date().toLocaleString()}`, color: '666666' }),
            ],
        })
    )

    sections.push(new Paragraph({ text: '' })) // Spacer

    // Summary section
    if (summary) {
        sections.push(
            new Paragraph({
                text: 'Summary',
                heading: HeadingLevel.HEADING_2,
            })
        )

        Object.entries(summary).forEach(([key, value]) => {
            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
            let displayValue: string
            if (typeof value === 'number') {
                if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('income') ||
                    key.toLowerCase().includes('expense') || key.toLowerCase().includes('revenue') ||
                    key.toLowerCase().includes('cost') || key.toLowerCase().includes('value')) {
                    displayValue = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
                } else {
                    displayValue = value.toLocaleString()
                }
            } else {
                displayValue = String(value)
            }

            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: `${formattedKey}: `, bold: true }),
                        new TextRun({ text: displayValue }),
                    ],
                })
            )
        })

        sections.push(new Paragraph({ text: '' })) // Spacer
    }

    // Data table
    if (headers && rows && rows.length > 0) {
        sections.push(
            new Paragraph({
                text: 'Details',
                heading: HeadingLevel.HEADING_2,
            })
        )

        // Create table rows
        const tableRows: TableRow[] = []

        // Header row
        tableRows.push(
            new TableRow({
                children: headers.map((header: string) =>
                    new TableCell({
                        children: [new Paragraph({
                            children: [new TextRun({ text: header, bold: true })],
                            alignment: AlignmentType.CENTER,
                        })],
                        shading: { fill: 'E8E8E8' },
                    })
                ),
            })
        )

        // Data rows
        rows.forEach((row: any) => {
            tableRows.push(
                new TableRow({
                    children: headers.map((header: string) => {
                        const key = header.toLowerCase().replace(/\s+/g, '_')
                        const altKey = header.toLowerCase().replace(/\s+/g, '')
                        let value = row[key] ?? row[altKey] ?? row[header] ?? ''

                        if (typeof value === 'number') {
                            if (header.toLowerCase().includes('amount') || header.toLowerCase().includes('value') ||
                                header.toLowerCase().includes('cost')) {
                                value = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
                            } else {
                                value = value.toLocaleString()
                            }
                        }

                        return new TableCell({
                            children: [new Paragraph({ text: String(value) })],
                        })
                    }),
                })
            )
        })

        // Totals row
        if (totals) {
            const totalCells = [new TableCell({
                children: [new Paragraph({
                    children: [new TextRun({ text: 'Total', bold: true })],
                })],
                shading: { fill: 'F0F0F0' },
            })]

            Object.values(totals).forEach((value) => {
                let displayValue: string
                if (typeof value === 'number') {
                    displayValue = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
                } else {
                    displayValue = String(value)
                }
                totalCells.push(new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({ text: displayValue, bold: true })],
                    })],
                    shading: { fill: 'F0F0F0' },
                }))
            })

            // Fill remaining cells if totals has fewer entries than headers
            while (totalCells.length < headers.length) {
                totalCells.push(new TableCell({
                    children: [new Paragraph({ text: '' })],
                    shading: { fill: 'F0F0F0' },
                }))
            }

            tableRows.push(new TableRow({ children: totalCells }))
        }

        sections.push(
            new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
            })
        )
    }

    // Footer
    sections.push(new Paragraph({ text: '' }))
    sections.push(
        new Paragraph({
            children: [
                new TextRun({ text: 'Generated by PrimeBalance', italics: true, color: '999999', size: 18 }),
            ],
            alignment: AlignmentType.CENTER,
        })
    )

    const doc = new Document({
        sections: [{
            children: sections,
        }],
    })

    return Packer.toBuffer(doc)
}