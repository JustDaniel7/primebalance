// =============================================================================
// DUNNING API - Templates (TS Section 12.3)
// src/app/api/dunning/templates/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// GET - List Templates
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const dunningLevel = searchParams.get('dunningLevel');
        const language = searchParams.get('language');
        const jurisdictionId = searchParams.get('jurisdictionId');
        const templateType = searchParams.get('templateType');
        const isActive = searchParams.get('isActive');

        const where: any = { organizationId: session.user.organizationId };
        if (dunningLevel) where.dunningLevel = parseInt(dunningLevel);
        if (language) where.language = language;
        if (jurisdictionId) where.jurisdictionId = jurisdictionId;
        if (templateType) where.templateType = templateType;
        if (isActive !== null) where.isActive = isActive === 'true';

        const templates = await (prisma as any).dunningTemplate.findMany({
            where,
            orderBy: [
                { dunningLevel: 'asc' },
                { language: 'asc' },
                { version: 'desc' },
            ],
        });

        return NextResponse.json({
            templates,
            total: templates.length,
        });
    } catch (error) {
        console.error('Error fetching templates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch templates' },
            { status: 500 }
        );
    }
}

// =============================================================================
// POST - Create Template
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            code,
            name,
            description,
            dunningLevel,
            templateType = 'email',
            jurisdictionId,
            language = 'en',
            customerType,
            subject,
            bodyHtml,
            bodyText,
            headerHtml,
            footerHtml,
            tone = 'formal',
            availableVariables = [],
            requiredVariables = [],
            legalDisclaimer,
            includesInterest = true,
            includesFees = true,
            includesLegalWarning = false,
        } = body;

        // Validate required fields
        if (!code?.trim()) {
            return NextResponse.json({ error: 'Template code is required' }, { status: 400 });
        }
        if (!name?.trim()) {
            return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
        }
        if (dunningLevel === undefined) {
            return NextResponse.json({ error: 'Dunning level is required' }, { status: 400 });
        }

        // Get current version
        const existingTemplate = await (prisma as any).dunningTemplate.findFirst({
            where: {
                organizationId: session.user.organizationId,
                code,
                jurisdictionId: jurisdictionId || null,
                language,
            },
            orderBy: { version: 'desc' },
        });

        const version = existingTemplate ? existingTemplate.version + 1 : 1;

        // Deactivate previous version
        if (existingTemplate) {
            await (prisma as any).dunningTemplate.update({
                where: { id: existingTemplate.id },
                data: { isActive: false },
            });
        }

        const template = await (prisma as any).dunningTemplate.create({
            data: {
                code,
                name,
                description,
                dunningLevel,
                templateType,
                jurisdictionId,
                language,
                customerType,
                subject,
                bodyHtml,
                bodyText,
                headerHtml,
                footerHtml,
                tone,
                availableVariables,
                requiredVariables,
                legalDisclaimer,
                includesInterest,
                includesFees,
                includesLegalWarning,
                version,
                isActive: true,
                previousVersionId: existingTemplate?.id,
                createdBy: session.user.id,
                organizationId: session.user.organizationId,
            },
        });

        return NextResponse.json({
            template,
            message: `Template '${name}' created (v${version})`,
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating template:', error);
        return NextResponse.json(
            { error: 'Failed to create template' },
            { status: 500 }
        );
    }
}