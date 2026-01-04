// =============================================================================
// POSTAL CODE LOOKUP - Auto-fill city/state/country from postal code
// =============================================================================

export interface PostalCodeResult {
  postalCode: string;
  city: string;
  state: string;
  stateCode?: string;
  country: string;
  countryCode: string;
  latitude?: number;
  longitude?: number;
}

export interface PostalCodeLookupError {
  code: 'NOT_FOUND' | 'INVALID_FORMAT' | 'API_ERROR' | 'RATE_LIMIT';
  message: string;
}

// Static lookup table for common postal codes (fallback when API unavailable)
const POSTAL_CODE_CACHE: Record<string, PostalCodeResult> = {
  // Germany
  '10115': { postalCode: '10115', city: 'Berlin', state: 'Berlin', countryCode: 'DE', country: 'Germany' },
  '80331': { postalCode: '80331', city: 'München', state: 'Bayern', countryCode: 'DE', country: 'Germany' },
  '20095': { postalCode: '20095', city: 'Hamburg', state: 'Hamburg', countryCode: 'DE', country: 'Germany' },
  '60311': { postalCode: '60311', city: 'Frankfurt am Main', state: 'Hessen', countryCode: 'DE', country: 'Germany' },
  '50667': { postalCode: '50667', city: 'Köln', state: 'Nordrhein-Westfalen', countryCode: 'DE', country: 'Germany' },

  // Austria
  '1010': { postalCode: '1010', city: 'Wien', state: 'Wien', countryCode: 'AT', country: 'Austria' },
  '5020': { postalCode: '5020', city: 'Salzburg', state: 'Salzburg', countryCode: 'AT', country: 'Austria' },
  '6020': { postalCode: '6020', city: 'Innsbruck', state: 'Tirol', countryCode: 'AT', country: 'Austria' },

  // Switzerland
  '8001': { postalCode: '8001', city: 'Zürich', state: 'Zürich', countryCode: 'CH', country: 'Switzerland' },
  '3011': { postalCode: '3011', city: 'Bern', state: 'Bern', countryCode: 'CH', country: 'Switzerland' },
  '1201': { postalCode: '1201', city: 'Genève', state: 'Genève', countryCode: 'CH', country: 'Switzerland' },

  // USA (common)
  '10001': { postalCode: '10001', city: 'New York', state: 'New York', stateCode: 'NY', countryCode: 'US', country: 'United States' },
  '90210': { postalCode: '90210', city: 'Beverly Hills', state: 'California', stateCode: 'CA', countryCode: 'US', country: 'United States' },
  '94102': { postalCode: '94102', city: 'San Francisco', state: 'California', stateCode: 'CA', countryCode: 'US', country: 'United States' },
  '60601': { postalCode: '60601', city: 'Chicago', state: 'Illinois', stateCode: 'IL', countryCode: 'US', country: 'United States' },

  // UK
  'EC1A': { postalCode: 'EC1A', city: 'London', state: 'Greater London', countryCode: 'GB', country: 'United Kingdom' },
  'SW1A': { postalCode: 'SW1A', city: 'London', state: 'Greater London', countryCode: 'GB', country: 'United Kingdom' },
  'M1': { postalCode: 'M1', city: 'Manchester', state: 'Greater Manchester', countryCode: 'GB', country: 'United Kingdom' },

  // France
  '75001': { postalCode: '75001', city: 'Paris', state: 'Île-de-France', countryCode: 'FR', country: 'France' },
  '69001': { postalCode: '69001', city: 'Lyon', state: 'Auvergne-Rhône-Alpes', countryCode: 'FR', country: 'France' },
  '13001': { postalCode: '13001', city: 'Marseille', state: "Provence-Alpes-Côte d'Azur", countryCode: 'FR', country: 'France' },
};

/**
 * Detect country from postal code format
 */
function detectCountryFromFormat(postalCode: string): string | null {
  const cleaned = postalCode.trim().toUpperCase();

  // German postal codes: 5 digits
  if (/^\d{5}$/.test(cleaned)) {
    const prefix = parseInt(cleaned.substring(0, 2));
    if (prefix >= 1 && prefix <= 99) return 'DE';
  }

  // Austrian postal codes: 4 digits
  if (/^\d{4}$/.test(cleaned)) {
    const prefix = parseInt(cleaned.charAt(0));
    if (prefix >= 1 && prefix <= 9) return 'AT';
  }

  // Swiss postal codes: 4 digits (1000-9999)
  if (/^\d{4}$/.test(cleaned)) {
    const num = parseInt(cleaned);
    if (num >= 1000 && num <= 9999) return 'CH';
  }

  // US postal codes: 5 digits or 5+4
  if (/^\d{5}(-\d{4})?$/.test(cleaned)) return 'US';

  // UK postal codes: complex format
  if (/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(cleaned) || /^[A-Z]{1,2}\d[A-Z\d]?$/i.test(cleaned)) return 'GB';

  // French postal codes: 5 digits
  if (/^\d{5}$/.test(cleaned)) {
    const prefix = parseInt(cleaned.substring(0, 2));
    if (prefix >= 1 && prefix <= 95) return 'FR';
  }

  return null;
}

/**
 * Lookup postal code using external API (Zippopotam.us - free, no API key)
 */
async function lookupPostalCodeAPI(postalCode: string, countryCode?: string): Promise<PostalCodeResult | null> {
  const country = countryCode || detectCountryFromFormat(postalCode) || 'DE';
  const cleanedPostal = postalCode.trim().replace(/\s+/g, '');

  try {
    // Using Zippopotam.us API - free and no API key required
    const response = await fetch(`https://api.zippopotam.us/${country.toLowerCase()}/${cleanedPostal}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.places && data.places.length > 0) {
      const place = data.places[0];
      return {
        postalCode: data['post code'],
        city: place['place name'],
        state: place.state,
        stateCode: place['state abbreviation'],
        country: data.country,
        countryCode: data['country abbreviation'],
        latitude: parseFloat(place.latitude),
        longitude: parseFloat(place.longitude),
      };
    }

    return null;
  } catch (error) {
    console.error('Postal code API lookup failed:', error);
    return null;
  }
}

/**
 * Main lookup function - tries cache first, then API
 */
export async function lookupPostalCode(
  postalCode: string,
  countryCode?: string
): Promise<{ result: PostalCodeResult | null; error: PostalCodeLookupError | null }> {
  if (!postalCode || postalCode.trim().length < 3) {
    return {
      result: null,
      error: { code: 'INVALID_FORMAT', message: 'Postal code too short' },
    };
  }

  const cleaned = postalCode.trim().toUpperCase();

  // Check static cache first
  if (POSTAL_CODE_CACHE[cleaned]) {
    return { result: POSTAL_CODE_CACHE[cleaned], error: null };
  }

  // For UK, also check first part (outward code)
  const ukOutward = cleaned.split(' ')[0];
  if (POSTAL_CODE_CACHE[ukOutward]) {
    return { result: POSTAL_CODE_CACHE[ukOutward], error: null };
  }

  // Try API lookup
  const apiResult = await lookupPostalCodeAPI(postalCode, countryCode);

  if (apiResult) {
    // Cache result for future lookups
    POSTAL_CODE_CACHE[cleaned] = apiResult;
    return { result: apiResult, error: null };
  }

  return {
    result: null,
    error: { code: 'NOT_FOUND', message: 'Postal code not found' },
  };
}

/**
 * Hook-friendly function for React components
 */
export function usePostalCodeLookup() {
  const lookup = async (postalCode: string, countryCode?: string) => {
    return lookupPostalCode(postalCode, countryCode);
  };

  return { lookup };
}

/**
 * Debounced lookup for input fields
 */
export function createDebouncedLookup(delayMs: number = 500) {
  let timeoutId: NodeJS.Timeout | null = null;

  return (
    postalCode: string,
    countryCode: string | undefined,
    callback: (result: PostalCodeResult | null, error: PostalCodeLookupError | null) => void
  ) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(async () => {
      const { result, error } = await lookupPostalCode(postalCode, countryCode);
      callback(result, error);
    }, delayMs);
  };
}
