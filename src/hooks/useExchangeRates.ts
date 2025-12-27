// src/hooks/useExchangeRates.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CryptoRate, FiatRates } from '@/lib/exchange-rates';

interface UseExchangeRatesOptions {
    type?: 'crypto' | 'fiat' | 'all';
    base?: string;
    symbols?: string[];
    refreshInterval?: number; // in milliseconds
    enabled?: boolean;
}

interface UseExchangeRatesReturn {
    cryptoRates: CryptoRate[];
    fiatRates: FiatRates | null;
    isLoading: boolean;
    error: string | null;
    lastUpdated: string | null;
    refresh: () => Promise<void>;
    convert: (amount: number, from: string, to: string) => number | null;
    getRate: (symbol: string) => CryptoRate | undefined;
    getFiatRate: (currency: string) => number | undefined;
}

export function useExchangeRates(options: UseExchangeRatesOptions = {}): UseExchangeRatesReturn {
    const {
        type = 'all',
        base = 'USD',
        symbols,
        refreshInterval = 60000, // 1 minute default
        enabled = true,
    } = options;

    const [cryptoRates, setCryptoRates] = useState<CryptoRate[]>([]);
    const [fiatRates, setFiatRates] = useState<FiatRates | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    const fetchRates = useCallback(async () => {
        if (!enabled) return;

        try {
            setIsLoading(true);
            setError(null);

            const params = new URLSearchParams({ type, base });
            if (symbols && symbols.length > 0) {
                params.set('symbols', symbols.join(','));
            }

            const response = await fetch(`/api/exchange-rates?${params}`);
            if (!response.ok) {
                throw new Error('Failed to fetch exchange rates');
            }

            const data = await response.json();

            if (type === 'crypto' || type === 'all') {
                setCryptoRates(data.crypto || data.rates || []);
            }
            if (type === 'fiat' || type === 'all') {
                setFiatRates(data.fiat || { base: data.base, rates: data.rates, timestamp: Date.now() });
            }

            setLastUpdated(data.lastUpdated || new Date().toISOString());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, [type, base, symbols, enabled]);

    useEffect(() => {
        fetchRates();

        if (refreshInterval > 0 && enabled) {
            const interval = setInterval(fetchRates, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [fetchRates, refreshInterval, enabled]);

    const convert = useCallback((amount: number, from: string, to: string): number | null => {
        const fromUpper = from.toUpperCase();
        const toUpper = to.toUpperCase();

        if (fromUpper === toUpper) return amount;

        let fromUsdValue: number | null = null;
        let toUsdValue: number | null = null;

        // Check crypto
        const fromCrypto = cryptoRates.find(c => c.symbol === fromUpper);
        if (fromCrypto) {
            fromUsdValue = fromCrypto.current_price;
        } else if (fiatRates) {
            if (fromUpper === fiatRates.base) {
                fromUsdValue = 1;
            } else if (fiatRates.rates[fromUpper]) {
                fromUsdValue = 1 / fiatRates.rates[fromUpper];
            }
        }

        const toCrypto = cryptoRates.find(c => c.symbol === toUpper);
        if (toCrypto) {
            toUsdValue = toCrypto.current_price;
        } else if (fiatRates) {
            if (toUpper === fiatRates.base) {
                toUsdValue = 1;
            } else if (fiatRates.rates[toUpper]) {
                toUsdValue = 1 / fiatRates.rates[toUpper];
            }
        }

        if (fromUsdValue === null || toUsdValue === null) return null;

        return (amount * fromUsdValue) / toUsdValue;
    }, [cryptoRates, fiatRates]);

    const getRate = useCallback((symbol: string): CryptoRate | undefined => {
        return cryptoRates.find(c => c.symbol === symbol.toUpperCase());
    }, [cryptoRates]);

    const getFiatRate = useCallback((currency: string): number | undefined => {
        if (!fiatRates) return undefined;
        if (currency.toUpperCase() === fiatRates.base) return 1;
        return fiatRates.rates[currency.toUpperCase()];
    }, [fiatRates]);

    return {
        cryptoRates,
        fiatRates,
        isLoading,
        error,
        lastUpdated,
        refresh: fetchRates,
        convert,
        getRate,
        getFiatRate,
    };
}