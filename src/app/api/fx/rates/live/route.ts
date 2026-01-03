// src/app/api/fx/rates/live/route.ts
// Fetches live FX rates from free API (frankfurter.app)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized } from '@/lib/api-utils';

// Free APIs for FX rates (no API key required):
// - frankfurter.app (ECB rates, 1 day delay)
// - fawazahmed0 currency API (real-time, open source)

const FRANKFURTER_API = 'https://api.frankfurter.app/latest';
const FAWAZAHMED_API = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies';

interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const baseCurrency = searchParams.get('base') || 'EUR';
  const targetCurrencies = searchParams.get('currencies')?.split(',') || [
    'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'CNY', 'INR'
  ];

  try {
    // Try frankfurter.app first (ECB data, reliable)
    const url = `${FRANKFURTER_API}?from=${baseCurrency}&to=${targetCurrencies.join(',')}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Frankfurter API error: ${response.status}`);
    }

    const data: FrankfurterResponse = await response.json();

    const rates = Object.entries(data.rates).map(([currency, rate]) => ({
      baseCurrency: data.base,
      quoteCurrency: currency,
      rate: rate,
      inverseRate: 1 / rate,
      source: 'frankfurter',
      timestamp: new Date().toISOString(),
      spread: 0.001, // Estimated spread
    }));

    return NextResponse.json({
      success: true,
      base: data.base,
      date: data.date,
      source: 'frankfurter.app (ECB)',
      rates,
    });
  } catch (frankfurterError) {
    console.error('Frankfurter API failed:', frankfurterError);

    // Fallback to fawazahmed0 API
    try {
      const baseCode = baseCurrency.toLowerCase();
      const fallbackUrl = `${FAWAZAHMED_API}/${baseCode}.json`;
      const fallbackResponse = await fetch(fallbackUrl, {
        next: { revalidate: 300 },
      });

      if (!fallbackResponse.ok) {
        throw new Error(`Fallback API error: ${fallbackResponse.status}`);
      }

      const fallbackData = await fallbackResponse.json();
      const allRates = fallbackData[baseCode] || {};

      const rates = targetCurrencies
        .filter(currency => allRates[currency.toLowerCase()])
        .map(currency => ({
          baseCurrency: baseCurrency.toUpperCase(),
          quoteCurrency: currency.toUpperCase(),
          rate: allRates[currency.toLowerCase()],
          inverseRate: 1 / allRates[currency.toLowerCase()],
          source: 'fawazahmed0',
          timestamp: new Date().toISOString(),
          spread: 0.001,
        }));

      return NextResponse.json({
        success: true,
        base: baseCurrency.toUpperCase(),
        date: fallbackData.date || new Date().toISOString().split('T')[0],
        source: 'fawazahmed0 Currency API',
        rates,
      });
    } catch (fallbackError) {
      console.error('Fallback API also failed:', fallbackError);
      return NextResponse.json(
        { error: 'Failed to fetch live rates from all sources', success: false },
        { status: 503 }
      );
    }
  }
}

// POST - Fetch live rates and save to database
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const body = await req.json();
  const baseCurrency = body.baseCurrency || 'EUR';
  const targetCurrencies = body.currencies || ['USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'CNY', 'INR'];

  try {
    // Fetch live rates
    const url = `${FRANKFURTER_API}?from=${baseCurrency}&to=${targetCurrencies.join(',')}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: FrankfurterResponse = await response.json();
    const savedRates = [];

    // Save each rate to the database
    for (const [currency, rate] of Object.entries(data.rates)) {
      const savedRate = await prisma.fXRate.create({
        data: {
          baseCurrency: data.base,
          quoteCurrency: currency,
          rate: rate,
          inverseRate: 1 / rate,
          source: 'frankfurter',
          timestamp: new Date(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid for 24 hours
          spread: 0.001,
          organizationId: user.organizationId,
        },
      });
      savedRates.push(savedRate);
    }

    // Log the action
    await prisma.fXAuditLog.create({
      data: {
        action: 'rates_sync_live',
        category: 'rate',
        details: `Synced ${savedRates.length} live rates from frankfurter.app (base: ${baseCurrency})`,
        userId: user.id,
        userName: user.name || 'Unknown',
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Synced ${savedRates.length} rates`,
      base: data.base,
      date: data.date,
      ratesCount: savedRates.length,
      rates: savedRates.map(r => ({
        id: r.id,
        baseCurrency: r.baseCurrency,
        quoteCurrency: r.quoteCurrency,
        rate: Number(r.rate),
        source: r.source,
        timestamp: r.timestamp.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Failed to sync live rates:', error);
    return NextResponse.json(
      { error: 'Failed to sync live rates', success: false },
      { status: 500 }
    );
  }
}
