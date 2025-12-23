// src/lib/exchange-rates.ts
// Exchange rate service for crypto and fiat currencies

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

// Fetch crypto rates from CoinGecko
export async function fetchCryptoRates(vsCurrency: string = 'usd'): Promise<CryptoRate[]> {
    const ids = SUPPORTED_CRYPTO.map(c => c.id).join(',');
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vsCurrency}&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;

    const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    return data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        current_price: coin.current_price,
        price_change_24h: coin.price_change_24h || 0,
        price_change_percentage_24h: coin.price_change_percentage_24h || 0,
        market_cap: coin.market_cap,
        total_volume: coin.total_volume,
        last_updated: coin.last_updated,
    }));
}

// Fetch fiat rates from exchangerate-api (free tier)
export async function fetchFiatRates(baseCurrency: string = 'USD'): Promise<FiatRates> {
    const url = `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;

    const response = await fetch(url, {
        next: { revalidate: 3600 }, // Cache for 1 hour (fiat rates don't change as often)
    });

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