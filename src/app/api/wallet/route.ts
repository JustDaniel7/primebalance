// src/app/api/wallets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

// GET /api/wallets
export async function GET(req: NextRequest) {
    try {
        const user = await getSessionWithOrg();
        if (!user?.id) return unauthorized();

        const wallets = await prisma.wallet.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ wallets });
    } catch (error) {
        console.error('GET /api/wallets error:', error);
        return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 });
    }
}

// POST /api/wallets
export async function POST(req: NextRequest) {
    try {
        const user = await getSessionWithOrg();
        if (!user?.id) return unauthorized();

        const body = await req.json();
        const { name, address, network, provider } = body;

        if (!name) return badRequest('Wallet name is required');
        if (!address) return badRequest('Wallet address is required');
        if (!network) return badRequest('Network is required');

        // Check for duplicate address on the same network
        const existing = await prisma.wallet.findUnique({
            where: { userId_address_network: { userId: user.id, address, network } },
        });
        if (existing) return badRequest('Wallet address already exists on this network');

        // SECURITY: organizationId is required for wallet creation
        if (!user.organizationId) {
            return badRequest('User must belong to an organization');
        }

        const wallet = await prisma.wallet.create({
            data: {
                name,
                address,
                network,
                provider: provider || null,
                isActive: true,
                userId: user.id,
                organizationId: user.organizationId,
            },
        });

        return NextResponse.json(wallet, { status: 201 });
    } catch (error) {
        console.error('POST /api/wallets error:', error);
        return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
    }
}