// src/app/api/exchange-rates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchCryptoRates, fetchFiatRates, fetchAllRates, SUPPORTED_CRYPTO, SUPPORTED_FIAT } from '@/lib/exchange-rates';
import { getSessionWithOrg, unauthorized } from '@/lib/api-utils';

// GET /api/exchange-rates
export async function GET(req: NextRequest) {
    try {
        const user = await getSessionWithOrg();
        if (!user?.organizationId) return unauthorized();
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || 'all'; // 'crypto', 'fiat', 'all'
        const base = searchParams.get('base') || 'USD';
        const symbols = searchParams.get('symbols'); // comma-separated

        if (type === 'crypto') {
            const rates = await fetchCryptoRates(base.toLowerCase());
            const filtered = symbols
                ? rates.filter(r => symbols.toUpperCase().split(',').includes(r.symbol))
                : rates;
            return NextResponse.json({
                type: 'crypto',
                base,
                rates: filtered,
                supported: SUPPORTED_CRYPTO.map(c => c.symbol),
                lastUpdated: new Date().toISOString(),
            });
        }

        if (type === 'fiat') {
            const rates = await fetchFiatRates(base.toUpperCase());
            return NextResponse.json({
                type: 'fiat',
                base: rates.base,
                rates: rates.rates,
                supported: SUPPORTED_FIAT,
                lastUpdated: new Date().toISOString(),
            });
        }

        // All rates
        const allRates = await fetchAllRates(base.toUpperCase());
        return NextResponse.json({
            type: 'all',
            base,
            crypto: allRates.crypto,
            fiat: allRates.fiat,
            supportedCrypto: SUPPORTED_CRYPTO.map(c => c.symbol),
            supportedFiat: SUPPORTED_FIAT,
            lastUpdated: allRates.lastUpdated,
        });
    } catch (error) {
        console.error('Exchange rates API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch exchange rates' },
            { status: 500 }
        );
    }
}