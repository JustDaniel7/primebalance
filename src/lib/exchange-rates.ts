// src/lib/exchange-rates.ts
// Exchange rate service for crypto and fiat currencies
// Includes retry logic with exponential backoff for resilience

import { logger } from './logger';

// =============================================================================
// RETRY CONFIGURATION
// =============================================================================

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  timeoutMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  timeoutMs: 10000,
};

/**
 * Fetch with retry logic and exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: Partial<RetryConfig> = {}
): Promise<Response> {
  const { maxRetries, baseDelayMs, maxDelayMs, timeoutMs } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // If successful or client error (4xx), return immediately
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Server error (5xx) - will retry
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      logger.warn(`Fetch attempt ${attempt + 1} failed`, { url, status: response.status });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on abort/timeout for the last attempt
      if (lastError.name === 'AbortError') {
        logger.warn(`Request timeout on attempt ${attempt + 1}`, { url, timeoutMs });
      } else {
        logger.warn(`Fetch attempt ${attempt + 1} error`, { url }, lastError);
      }
    }

    // Don't wait after the last attempt
    if (attempt < maxRetries) {
      // Exponential backoff with jitter
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
      const jitter = delay * 0.1 * Math.random();
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries + 1} attempts`);
}

// =============================================================================
// TYPES
// =============================================================================

export interface CryptoRate {
    id: string;
    symbol: string;
    name: string;
    current_price: number;
    price_change_24h: number;
    price_change_percentage_24h: number;
    market_cap: number;
    total_volume: number;
    last_updated: string;
}

export interface FiatRates {
    base: string;
    rates: Record<string, number>;
    timestamp: number;
}

export interface ExchangeRates {
    crypto: CryptoRate[];
    fiat: FiatRates | null;
    lastUpdated: string;
}

// Supported crypto IDs for CoinGecko
export const SUPPORTED_CRYPTO = [
    { id: 'bitcoin', symbol: 'BTC' },
    { id: 'ethereum', symbol: 'ETH' },
    { id: 'solana', symbol: 'SOL' },
    { id: 'usd-coin', symbol: 'USDC' },
    { id: 'tether', symbol: 'USDT' },
    { id: 'matic-network', symbol: 'MATIC' },
    { id: 'binancecoin', symbol: 'BNB' },
    { id: 'cardano', symbol: 'ADA' },
    { id: 'ripple', symbol: 'XRP' },
    { id: 'dogecoin', symbol: 'DOGE' },
    { id: 'polkadot', symbol: 'DOT' },
    { id: 'avalanche-2', symbol: 'AVAX' },
    { id: 'chainlink', symbol: 'LINK' },
    { id: 'uniswap', symbol: 'UNI' },
    { id: 'litecoin', symbol: 'LTC' },
];

export const SUPPORTED_FIAT = [
    'USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CNY', 'AUD', 'CAD', 'INR', 'BRL', 'MXN', 'KRW', 'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'NZD', 'ZAR', 'RUB'
];

// Fetch crypto rates from CoinGecko with retry logic
export async function fetchCryptoRates(vsCurrency: string = 'usd'): Promise<CryptoRate[]> {
    const ids = SUPPORTED_CRYPTO.map(c => c.id).join(',');
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vsCurrency}&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;

    try {
        const response = await fetchWithRetry(
            url,
            {
                headers: { 'Accept': 'application/json' },
                next: { revalidate: 60 }, // Cache for 60 seconds
            } as RequestInit,
            { maxRetries: 3, timeoutMs: 10000 }
        );

        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }

        const data = await response.json();

        return data.map((coin: Record<string, unknown>) => ({
            id: coin.id as string,
            symbol: (coin.symbol as string).toUpperCase(),
            name: coin.name as string,
            current_price: coin.current_price as number,
            price_change_24h: (coin.price_change_24h as number) || 0,
            price_change_percentage_24h: (coin.price_change_percentage_24h as number) || 0,
            market_cap: coin.market_cap as number,
            total_volume: coin.total_volume as number,
            last_updated: coin.last_updated as string,
        }));
    } catch (error) {
        logger.error('Failed to fetch crypto rates', { url }, error as Error);
        throw error;
    }
}

// Fetch fiat rates from exchangerate-api with retry logic
export async function fetchFiatRates(baseCurrency: string = 'USD'): Promise<FiatRates> {
    const url = `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;

    try {
        const response = await fetchWithRetry(
            url,
            {
                next: { revalidate: 3600 }, // Cache for 1 hour (fiat rates don't change as often)
            } as RequestInit,
            { maxRetries: 3, timeoutMs: 10000 }
        );

        if (!response.ok) {
            throw new Error(`Exchange rate API error: ${response.status}`);
        }

        const data = await response.json();

        // Filter to only supported currencies
        const filteredRates: Record<string, number> = {};
        for (const currency of SUPPORTED_FIAT) {
            if (data.rates[currency]) {
                filteredRates[currency] = data.rates[currency];
            }
        }

        return {
            base: data.base,
            rates: filteredRates,
            timestamp: data.time_last_updated || Date.now(),
        };
    } catch (error) {
        logger.error('Failed to fetch fiat rates', { url, baseCurrency }, error as Error);
        throw error;
    }
}

// Fetch all rates
export async function fetchAllRates(fiatBase: string = 'USD'): Promise<ExchangeRates> {
    const [crypto, fiat] = await Promise.allSettled([
        fetchCryptoRates(fiatBase.toLowerCase()),
        fetchFiatRates(fiatBase),
    ]);

    return {
        crypto: crypto.status === 'fulfilled' ? crypto.value : [],
        fiat: fiat.status === 'fulfilled' ? fiat.value : null,
        lastUpdated: new Date().toISOString(),
    };
}

// Convert between currencies
export function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    cryptoRates: CryptoRate[],
    fiatRates: FiatRates | null
): number | null {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    if (from === to) return amount;

    // Get USD values
    let fromUsdValue: number | null = null;
    let toUsdValue: number | null = null;

    // Check if from is crypto
    const fromCrypto = cryptoRates.find(c => c.symbol === from);
    if (fromCrypto) {
        fromUsdValue = fromCrypto.current_price;
    } else if (fiatRates && from === fiatRates.base) {
        fromUsdValue = 1;
    } else if (fiatRates && fiatRates.rates[from]) {
        fromUsdValue = 1 / fiatRates.rates[from];
    }

    // Check if to is crypto
    const toCrypto = cryptoRates.find(c => c.symbol === to);
    if (toCrypto) {
        toUsdValue = toCrypto.current_price;
    } else if (fiatRates && to === fiatRates.base) {
        toUsdValue = 1;
    } else if (fiatRates && fiatRates.rates[to]) {
        toUsdValue = 1 / fiatRates.rates[to];
    }

    if (fromUsdValue === null || toUsdValue === null) {
        return null;
    }

    const usdAmount = amount * fromUsdValue;
    return usdAmount / toUsdValue;
}