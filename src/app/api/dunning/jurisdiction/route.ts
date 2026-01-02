// =============================================================================
// DUNNING API - Jurisdiction Configuration (TS Section 10)
// src/app/api/dunning/jurisdictions/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// GET - List Jurisdiction Configurations
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const isActive = searchParams.get('isActive');
        const country = searchParams.get('country');

        const where: any = { organizationId: session.user.organizationId };
        if (isActive !== null) where.isActive = isActive === 'true';
        if (country) where.country = country;

        const jurisdictions = await (prisma as any).dunningJurisdictionConfig.findMany({
            where,
            orderBy: { jurisdictionId: 'asc' },
        });

        // Format decimals
        const formatted = jurisdictions.map((j: any) => ({
            ...j,
            statutoryInterestRateB2B: j.statutoryInterestRateB2B ? Number(j.statutoryInterestRateB2B) : null,
            statutoryInterestRateB2C: j.statutoryInterestRateB2C ? Number(j.statutoryInterestRateB2C) : null,
            flatFeeAmountB2B: j.flatFeeAmountB2B ? Number(j.flatFeeAmountB2B) : null,
            flatFeeAmountB2C: j.flatFeeAmountB2C ? Number(j.flatFeeAmountB2C) : null,
            maxFeePercentage: j.maxFeePercentage ? Number(j.maxFeePercentage) : null,
        }));

        return NextResponse.json({
            jurisdictions: formatted,
            total: jurisdictions.length,
        });
    } catch (error) {
        console.error('Error fetching jurisdictions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch jurisdictions' },
            { status: 500 }
        );
    }
}

// =============================================================================
// POST - Create/Update Jurisdiction Configuration
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            jurisdictionId,
            jurisdictionName,
            country,
            region,
            statutoryInterestRateB2B,
            statutoryInterestRateB2C,
            interestRateReference,
            flatFeeAllowedB2B = true,
            flatFeeAmountB2B,
            flatFeeAllowedB2C = false,
            flatFeeAmountB2C,
            maxFeePercentage,
            defaultGracePeriodDays = 0,
            reminderAfterDays = 3,
            level1AfterDays = 14,
            level2AfterDays = 30,
            level3MinDays = 45,
            requiresWrittenNotice = false,
            requiresRegisteredMail = false,
            formalRequirements,
            defaultLanguage = 'en',
            supportedLanguages = ['en'],
            defaultToneReminder = 'friendly',
            defaultToneLevel1 = 'formal',
            defaultToneLevel2 = 'firm',
            defaultToneLevel3 = 'final',
            consumerProtectionRules,
            isActive = true,
        } = body;

        if (!jurisdictionId?.trim()) {
            return NextResponse.json({ error: 'Jurisdiction ID is required' }, { status: 400 });
        }
        if (!jurisdictionName?.trim()) {
            return NextResponse.json({ error: 'Jurisdiction name is required' }, { status: 400 });
        }
        if (!country?.trim()) {
            return NextResponse.json({ error: 'Country is required' }, { status: 400 });
        }

        // Upsert jurisdiction config
        const existing = await (prisma as any).dunningJurisdictionConfig.findFirst({
            where: {
                organizationId: session.user.organizationId,
                jurisdictionId,
            },
        });

        const data = {
            jurisdictionId,
            jurisdictionName,
            country,
            region,
            statutoryInterestRateB2B,
            statutoryInterestRateB2C,
            interestRateReference,
            flatFeeAllowedB2B,
            flatFeeAmountB2B,
            flatFeeAllowedB2C,
            flatFeeAmountB2C,
            maxFeePercentage,
            defaultGracePeriodDays,
            reminderAfterDays,
            level1AfterDays,
            level2AfterDays,
            level3MinDays,
            requiresWrittenNotice,
            requiresRegisteredMail,
            formalRequirements,
            defaultLanguage,
            supportedLanguages,
            defaultToneReminder,
            defaultToneLevel1,
            defaultToneLevel2,
            defaultToneLevel3,
            consumerProtectionRules,
            isActive,
            organizationId: session.user.organizationId,
        };

        let jurisdiction;
        if (existing) {
            jurisdiction = await (prisma as any).dunningJurisdictionConfig.update({
                where: { id: existing.id },
                data,
            });
        } else {
            jurisdiction = await (prisma as any).dunningJurisdictionConfig.create({
                data,
            });
        }

        return NextResponse.json({
            jurisdiction: {
                ...jurisdiction,
                statutoryInterestRateB2B: jurisdiction.statutoryInterestRateB2B ? Number(jurisdiction.statutoryInterestRateB2B) : null,
                statutoryInterestRateB2C: jurisdiction.statutoryInterestRateB2C ? Number(jurisdiction.statutoryInterestRateB2C) : null,
                flatFeeAmountB2B: jurisdiction.flatFeeAmountB2B ? Number(jurisdiction.flatFeeAmountB2B) : null,
                flatFeeAmountB2C: jurisdiction.flatFeeAmountB2C ? Number(jurisdiction.flatFeeAmountB2C) : null,
                maxFeePercentage: jurisdiction.maxFeePercentage ? Number(jurisdiction.maxFeePercentage) : null,
            },
            message: existing
                ? `Jurisdiction '${jurisdictionName}' updated`
                : `Jurisdiction '${jurisdictionName}' created`,
        }, { status: existing ? 200 : 201 });
    } catch (error) {
        console.error('Error saving jurisdiction:', error);
        return NextResponse.json(
            { error: 'Failed to save jurisdiction configuration' },
            { status: 500 }
        );
    }
}