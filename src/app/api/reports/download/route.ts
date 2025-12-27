// src/app/api/reports/download/route.ts
// NEW FILE: Generate downloadable report files

import { NextRequest, NextResponse } from 'next/server'
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
    const user = await getSessionWithOrg()
    if (!user?.organizationId) return unauthorized()

    const body = await req.json()
    const { reportData, format = 'csv', fileName = 'report' } = body

    if (!reportData) {
        return badRequest('Report data is required')
    }

    try {
        let content: string
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

            default:
                return badRequest(`Unsupported format: ${format}`)
        }

        return new NextResponse(content, {
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