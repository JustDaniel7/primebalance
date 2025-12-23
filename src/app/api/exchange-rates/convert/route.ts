// src/app/api/exchange-rates/convert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchCryptoRates, fetchFiatRates, convertCurrency } from '@/lib/exchange-rates';

// GET /api/exchange-rates/convert?from=BTC&to=USD&amount=1
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const amountStr = searchParams.get('amount');

        if (!from || !to || !amountStr) {
            return NextResponse.json(
                { error: 'Missing required parameters: from, to, amount' },
                { status: 400 }
            );
        }

        const amount = parseFloat(amountStr);
        if (isNaN(amount)) {
            return NextResponse.json(
                { error: 'Invalid amount' },
                { status: 400 }
            );
        }

        const [cryptoRates, fiatRates] = await Promise.all([
            fetchCryptoRates('usd'),
            fetchFiatRates('USD'),
        ]);

        const result = convertCurrency(amount, from, to, cryptoRates, fiatRates);

        if (result === null) {
            return NextResponse.json(
                { error: `Unable to convert from ${from} to ${to}` },
                { status: 400 }
            );
        }

        return NextResponse.json({
            from: from.toUpperCase(),
            to: to.toUpperCase(),
            amount,
            result,
            rate: result / amount,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Conversion API error:', error);
        return NextResponse.json(
            { error: 'Failed to convert currency' },
            { status: 500 }
        );
    }
}