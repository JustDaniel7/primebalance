// =============================================================================
// ARCHIVE API - Main Route (TS Sections 16.1)
// src/app/api/archive/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// =============================================================================
// GET - List Archive Records with Filters & Pagination
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const skip = (page - 1) * limit;

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'archivedAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // Filters
    const objectType = searchParams.get('objectType');
    const objectTypes = searchParams.get('objectTypes')?.split(',').filter(Boolean);
    const category = searchParams.get('category');
    const categories = searchParams.get('categories')?.split(',').filter(Boolean);
    const status = searchParams.get('status');
    const fiscalYear = searchParams.get('fiscalYear');
    const fiscalPeriod = searchParams.get('fiscalPeriod');
    const accountingPeriod = searchParams.get('accountingPeriod');
    const legalEntityId = searchParams.get('legalEntityId');
    const partyId = searchParams.get('partyId');
    const counterpartyId = searchParams.get('counterpartyId');
    const counterpartyName = searchParams.get('counterpartyName');
    const retentionStatus = searchParams.get('retentionStatus');
    const legalHold = searchParams.get('legalHold');
    const triggerType = searchParams.get('triggerType');
    const sourceModule = searchParams.get('sourceModule');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const archivedFrom = searchParams.get('archivedFrom');
    const archivedTo = searchParams.get('archivedTo');
    const amountMin = searchParams.get('amountMin');
    const amountMax = searchParams.get('amountMax');
    const currency = searchParams.get('currency');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const search = searchParams.get('search');
    const includeSuperseded = searchParams.get('includeSuperseded') === 'true';

    // Build where clause
    const where: any = {
      organizationId: session.user.organizationId,
    };

    // Object type filters
    if (objectType) where.objectType = objectType;
    if (objectTypes?.length) where.objectType = { in: objectTypes };

    // Category filters
    if (category) where.category = category;
    if (categories?.length) where.category = { in: categories };

    // Status and retention
    if (status) where.status = status;
    if (retentionStatus) where.retentionStatus = retentionStatus;
    if (legalHold !== null && legalHold !== undefined) {
      where.legalHold = legalHold === 'true';
    }

    // Period filters
    if (fiscalYear) where.fiscalYear = parseInt(fiscalYear);
    if (fiscalPeriod) where.fiscalPeriod = fiscalPeriod;
    if (accountingPeriod) where.accountingPeriod = accountingPeriod;

    // Entity filters
    if (legalEntityId) where.legalEntityId = legalEntityId;
    if (partyId) where.partyId = partyId;
    if (counterpartyId) where.counterpartyId = counterpartyId;
    if (counterpartyName) {
      where.counterpartyName = { contains: counterpartyName, mode: 'insensitive' };
    }

    // Trigger & source
    if (triggerType) where.triggerType = triggerType;
    if (sourceModule) where.sourceModule = sourceModule;

    // Date filters
    if (dateFrom || dateTo) {
      where.effectiveDate = {};
      if (dateFrom) where.effectiveDate.gte = new Date(dateFrom);
      if (dateTo) where.effectiveDate.lte = new Date(dateTo);
    }

    if (archivedFrom || archivedTo) {
      where.archivedAt = {};
      if (archivedFrom) where.archivedAt.gte = new Date(archivedFrom);
      if (archivedTo) where.archivedAt.lte = new Date(archivedTo);
    }

    // Amount filters
    if (amountMin || amountMax) {
      where.amount = {};
      if (amountMin) where.amount.gte = parseFloat(amountMin);
      if (amountMax) where.amount.lte = parseFloat(amountMax);
    }
    if (currency) where.currency = currency;

    // Tags
    if (tags?.length) {
      where.tags = { hasSome: tags };
    }

    // Version filter - by default only show current versions
    if (!includeSuperseded) {
      where.isCurrentVersion = true;
    }

    // Search
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { archiveRecordId: { contains: search, mode: 'insensitive' } },
        { originalObjectId: { contains: search, mode: 'insensitive' } },
        { counterpartyName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Execute queries
    const [records, total] = await Promise.all([
      (prisma as any).archiveRecord.findMany({
        where,
        orderBy,
        take: limit,
        skip,
      }),
      (prisma as any).archiveRecord.count({ where }),
    ]);

    // Calculate statistics
    const statsWhere = { organizationId: session.user.organizationId };

    const [
      totalRecords,
      byObjectType,
      byCategory,
      byStatus,
      byRetentionStatus,
      recentArchived,
    ] = await Promise.all([
      (prisma as any).archiveRecord.count({ where: statsWhere }),
      (prisma as any).archiveRecord.groupBy({
        by: ['objectType'],
        where: statsWhere,
        _count: { id: true },
      }),
      (prisma as any).archiveRecord.groupBy({
        by: ['category'],
        where: statsWhere,
        _count: { id: true },
      }),
      (prisma as any).archiveRecord.groupBy({
        by: ['status'],
        where: statsWhere,
        _count: { id: true },
      }),
      (prisma as any).archiveRecord.groupBy({
        by: ['retentionStatus'],
        where: statsWhere,
        _count: { id: true },
      }),
      (prisma as any).archiveRecord.count({
        where: {
          ...statsWhere,
          archivedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const statistics = {
      totalRecords,
      byObjectType: byObjectType.reduce((acc: any, item: any) => {
        acc[item.objectType] = item._count.id;
        return acc;
      }, {}),
      byCategory: byCategory.reduce((acc: any, item: any) => {
        acc[item.category] = item._count.id;
        return acc;
      }, {}),
      byStatus: byStatus.reduce((acc: any, item: any) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {}),
      byRetentionStatus: byRetentionStatus.reduce((acc: any, item: any) => {
        acc[item.retentionStatus] = item._count.id;
        return acc;
      }, {}),
      recentActivity: {
        archivedLast24h: recentArchived,
      },
    };

    // Format records
    const formattedRecords = records.map((record: any) => ({
      ...record,
      amount: record.amount ? Number(record.amount) : null,
      fxRateAtArchive: record.fxRateAtArchive ? Number(record.fxRateAtArchive) : null,
      amountInReporting: record.amountInReporting ? Number(record.amountInReporting) : null,
      confidenceScore: Number(record.confidenceScore),
    }));

    return NextResponse.json({
      records: formattedRecords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
      statistics,
    });
  } catch (error) {
    console.error('Error fetching archive records:', error);
    return NextResponse.json(
        { error: 'Failed to fetch archive records' },
        { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create Archive Record (TS Section 3, 4, 17)
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields (TS Section 4)
    const requiredFields = ['originalObjectId', 'objectType', 'triggerType', 'title', 'content', 'category'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
            { error: `Missing required field: ${field}` },
            { status: 400 }
        );
      }
    }

    // Check for duplicate (same object, same version)
    const existingVersion = await (prisma as any).archiveRecord.findFirst({
      where: {
        organizationId: session.user.organizationId,
        originalObjectId: body.originalObjectId,
        objectType: body.objectType,
        objectVersion: body.objectVersion || 1,
      },
    });

    if (existingVersion) {
      return NextResponse.json(
          {
            error: 'Archive record already exists for this object version',
            existingRecordId: existingVersion.id,
            code: 'DUPLICATE_ARCHIVE',
          },
          { status: 409 }
      );
    }

    // Generate deterministic archive record ID
    const timestamp = new Date();
    const version = body.objectVersion || 1;
    const archiveRecordId = `arc_${session.user.organizationId.slice(-6)}_${body.objectType}_${body.originalObjectId}_v${version}_${timestamp.getTime()}`;

    // Generate content hash (TS Section 4.3 - Integrity)
    const contentString = JSON.stringify(body.content, Object.keys(body.content).sort());
    const contentHash = crypto.createHash('sha256').update(contentString).digest('hex');

    // Get predecessor hash if this is a new version
    let predecessorHash: string | null = null;
    let parentRecordId: string | null = body.parentRecordId || null;

    if (version > 1 || body.parentRecordId) {
      const predecessor = await (prisma as any).archiveRecord.findFirst({
        where: {
          organizationId: session.user.organizationId,
          originalObjectId: body.originalObjectId,
          objectType: body.objectType,
          isCurrentVersion: true,
        },
        orderBy: { objectVersion: 'desc' },
      });

      if (predecessor) {
        predecessorHash = predecessor.contentHash;
        parentRecordId = predecessor.id;

        // Mark predecessor as superseded
        await (prisma as any).archiveRecord.update({
          where: { id: predecessor.id },
          data: {
            isCurrentVersion: false,
            supersededBy: archiveRecordId,
          },
        });
      }
    }

    // Calculate retention dates (TS Section 7)
    const fiscalYear = body.fiscalYear || new Date().getFullYear();
    const retentionYears = 10; // Default, should come from policy
    const retentionStartDate = new Date(fiscalYear + 1, 0, 1); // Start of next fiscal year
    const retentionEndDate = new Date(retentionStartDate);
    retentionEndDate.setFullYear(retentionEndDate.getFullYear() + retentionYears);

    // Generate system tags
    const systemTags: string[] = [];
    if (body.amount && body.amount > 10000) systemTags.push('high_value');
    if (body.legalEntityId) systemTags.push('multi_entity');
    if (body.jurisdictionIds?.length > 1) systemTags.push('multi_jurisdiction');

    // Create archive record
    const archiveRecord = await (prisma as any).archiveRecord.create({
      data: {
        // Identity
        archiveRecordId,
        originalObjectId: body.originalObjectId,
        objectType: body.objectType,
        objectVersion: version,
        parentRecordId,
        legalEntityId: body.legalEntityId,
        partyId: body.partyId,

        // Temporal
        createdAt: body.createdAt ? new Date(body.createdAt) : timestamp,
        archivedAt: timestamp,
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
        accountingPeriod: body.accountingPeriod,
        fiscalYear,
        fiscalPeriod: body.fiscalPeriod,
        timezone: body.timezone || 'UTC',

        // Integrity
        contentHash,
        predecessorHash,
        signatureCount: 1,
        integrityVerified: true,
        lastVerifiedAt: timestamp,

        // Context
        triggerType: body.triggerType,
        triggerReason: body.triggerReason,
        triggerExplanation: body.triggerExplanation,
        initiatingActor: session.user.id,
        initiatingActorName: session.user.name || session.user.email,
        actorType: 'user',
        sourceModule: body.sourceModule,
        linkedEntityIds: body.linkedEntityIds || [],

        // Content
        title: body.title,
        description: body.description,
        content: body.content,
        contentType: 'json',
        contentSize: contentString.length,

        // Financial
        amount: body.amount,
        currency: body.currency || 'EUR',
        reportingCurrency: body.reportingCurrency,
        fxRateAtArchive: body.fxRateAtArchive,
        amountInReporting: body.amountInReporting,

        // Classification
        category: body.category,
        subcategory: body.subcategory,
        jurisdictionIds: body.jurisdictionIds || [],
        tags: body.tags || [],
        systemTags,
        confidenceScore: body.confidenceScore ?? 1.0,
        validationMode: body.validationMode || 'hard',

        // Localization
        locale: body.locale,
        language: body.language || 'en',
        displayFormats: body.displayFormats,

        // Counterparty
        counterpartyId: body.counterpartyId,
        counterpartyName: body.counterpartyName,
        counterpartyType: body.counterpartyType,

        // Versioning
        versionNumber: version,
        isCurrentVersion: true,
        supersedes: parentRecordId ? archiveRecordId : null,

        // Retention
        retentionPolicyId: body.retentionPolicyId,
        retentionStartDate,
        retentionEndDate,
        retentionStatus: 'active',

        // Status
        status: 'archived',

        // Attachments
        attachments: body.attachments,
        documentCount: body.attachments?.length || 0,

        // Automation
        ruleId: body.ruleId,
        explanation: body.explanation,

        // Organization
        organizationId: session.user.organizationId,
      },
    });

    // Create version record
    await (prisma as any).archiveVersion.create({
      data: {
        archiveRecordId: archiveRecord.id,
        versionNumber: version,
        versionHash: contentHash,
        previousVersionId: parentRecordId,
        contentSnapshot: body.content,
        changeDescription: body.versionReason || (version === 1 ? 'Initial archive' : 'Version update'),
        changedFields: body.changedFields || [],
        createdBy: session.user.id,
        createdByName: session.user.name || session.user.email,
      },
    });

    // Create links if provided (TS Section 5)
    if (body.links?.length) {
      for (const link of body.links) {
        await (prisma as any).archiveLink.create({
          data: {
            sourceArchiveId: archiveRecord.id,
            targetArchiveId: link.targetArchiveId,
            linkType: link.linkType,
            linkDirection: 'outbound',
            linkDescription: link.linkDescription,
            linkedBy: session.user.id,
          },
        });
      }
    }

    // Log access
    await (prisma as any).archiveAccessLog.create({
      data: {
        archiveRecordId: archiveRecord.id,
        accessType: 'view',
        accessReason: 'Archive creation',
        actorId: session.user.id,
        actorName: session.user.name || session.user.email,
        actorType: 'user',
        accessGranted: true,
      },
    });

    return NextResponse.json(
        {
          record: {
            ...archiveRecord,
            amount: archiveRecord.amount ? Number(archiveRecord.amount) : null,
            confidenceScore: Number(archiveRecord.confidenceScore),
          },
          message: 'Archive record created successfully',
        },
        { status: 201 }
    );
  } catch (error) {
    console.error('Error creating archive record:', error);
    return NextResponse.json(
        { error: 'Failed to create archive record' },
        { status: 500 }
    );
  }
}