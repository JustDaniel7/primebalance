// src/app/api/wallets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

// GET /api/wallets/[id]
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const user = await getSessionWithOrg();
        if (!user?.id) return unauthorized();

        const { id } = await params;
        const wallet = await prisma.wallet.findFirst({
            where: { id, userId: user.id },
        });

        if (!wallet) return notFound('Wallet');
        return NextResponse.json(wallet);
    } catch (error) {
        console.error('GET /api/wallets/[id] error:', error);
        return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
    }
}

// PATCH /api/wallets/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const user = await getSessionWithOrg();
        if (!user?.id) return unauthorized();

        const { id } = await params;
        const body = await req.json();

        const existing = await prisma.wallet.findFirst({
            where: { id, userId: user.id },
        });
        if (!existing) return notFound('Wallet');

        const wallet = await prisma.wallet.update({
            where: { id },
            data: body,
        });

        return NextResponse.json(wallet);
    } catch (error) {
        console.error('PATCH /api/wallets/[id] error:', error);
        return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 });
    }
}

// DELETE /api/wallets/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const user = await getSessionWithOrg();
        if (!user?.id) return unauthorized();

        const { id } = await params;

        const result = await prisma.wallet.deleteMany({
            where: { id, userId: user.id },
        });

        if (result.count === 0) return notFound('Wallet');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/wallets/[id] error:', error);
        return NextResponse.json({ error: 'Failed to delete wallet' }, { status: 500 });
    }
}