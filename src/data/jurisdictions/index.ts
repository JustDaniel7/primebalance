// =============================================================================
// PRIMEBALANCE - ALL TAX JURISDICTIONS INDEX
// =============================================================================

import { TaxJurisdictionFull, JurisdictionType } from '@/types/tax';
import { ALL_US_JURISDICTIONS, US_FEDERAL, US_STATES, US_TERRITORIES, getUSJurisdiction, getNoIncomeTaxStates } from './us-jurisdictions';
import { INTERNATIONAL_JURISDICTIONS, getInternationalJurisdiction, getJurisdictionsByRegion, getLowTaxJurisdictions } from './international-jurisdictions';
import {
  ALL_OFFSHORE_JURISDICTIONS,
  CARIBBEAN_JURISDICTIONS,
  EUROPEAN_OFFSHORE_JURISDICTIONS,
  PACIFIC_JURISDICTIONS,
  ASIAN_OFFSHORE_JURISDICTIONS,
  MIDDLE_EAST_OFFSHORE_JURISDICTIONS,
  getOffshoreJurisdiction,
  getZeroTaxJurisdictions,
  getJurisdictionsWithCBI,
  getAssetProtectionJurisdictions,
  getOffshoreJurisdictionsByRegion,
} from './offshore-jurisdictions';
import {
  SWISS_CANTONS,
  getCantonByCode,
  getCantonsByLanguage,
  getLowestTaxCantons,
  getCantonTaxComparison,
} from './swiss-cantons';

// =============================================================================
// COMBINED ALL JURISDICTIONS
// =============================================================================

export const ALL_JURISDICTIONS: TaxJurisdictionFull[] = [
  ...ALL_US_JURISDICTIONS,
  ...INTERNATIONAL_JURISDICTIONS,
  ...ALL_OFFSHORE_JURISDICTIONS,
  ...SWISS_CANTONS,
];

// =============================================================================
// LOOKUP FUNCTIONS
// =============================================================================

/**
 * Get any jurisdiction by its code
 */
export function getJurisdiction(code: string): TaxJurisdictionFull | undefined {
  return ALL_JURISDICTIONS.find(j => j.code === code);
}

/**
 * Get multiple jurisdictions by their codes
 */
export function getJurisdictions(codes: string[]): TaxJurisdictionFull[] {
  return codes.map(code => getJurisdiction(code)).filter(Boolean) as TaxJurisdictionFull[];
}

/**
 * Search jurisdictions by name (partial match)
 */
export function searchJurisdictions(query: string): TaxJurisdictionFull[] {
  const lowerQuery = query.toLowerCase();
  return ALL_JURISDICTIONS.filter(j => 
    j.name.toLowerCase().includes(lowerQuery) ||
    j.code.toLowerCase().includes(lowerQuery) ||
    j.shortName?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get jurisdictions by type
 */
export function getJurisdictionsByType(type: JurisdictionType): TaxJurisdictionFull[] {
  return ALL_JURISDICTIONS.filter(j => j.type === type);
}

/**
 * Get all countries (excluding US states/territories)
 */
export function getAllCountries(): TaxJurisdictionFull[] {
  return ALL_JURISDICTIONS.filter(j => 
    j.type === JurisdictionType.COUNTRY || 
    j.type === JurisdictionType.US_FEDERAL ||
    j.type === JurisdictionType.SPECIAL_ZONE
  );
}

/**
 * Get jurisdictions sorted by tax rate
 */
export function getJurisdictionsSortedByTaxRate(ascending: boolean = true): TaxJurisdictionFull[] {
  return [...ALL_JURISDICTIONS].sort((a, b) => {
    const diff = a.corporateTax.standardRate - b.corporateTax.standardRate;
    return ascending ? diff : -diff;
  });
}

/**
 * Get jurisdictions within a tax rate range
 */
export function getJurisdictionsByTaxRange(minRate: number, maxRate: number): TaxJurisdictionFull[] {
  return ALL_JURISDICTIONS.filter(j => 
    j.corporateTax.standardRate >= minRate && 
    j.corporateTax.standardRate <= maxRate
  );
}

/**
 * Get jurisdictions with specific features
 */
export function getJurisdictionsWithFeatures(features: {
  noIncomeTax?: boolean;
  territorialSystem?: boolean;
  hasDTAWith?: string;
  hasParticipationExemption?: boolean;
  maxTaxRate?: number;
}): TaxJurisdictionFull[] {
  return ALL_JURISDICTIONS.filter(j => {
    if (features.noIncomeTax !== undefined && j.noIncomeTax !== features.noIncomeTax) return false;
    if (features.territorialSystem !== undefined && j.territorialSystem !== features.territorialSystem) return false;
    if (features.hasDTAWith && !j.dtaPartners.some(d => d.partnerJurisdictionCode === features.hasDTAWith)) return false;
    if (features.hasParticipationExemption && !j.taxIncentives?.some(i => 
      i.name.toLowerCase().includes('participation') || 
      i.description.toLowerCase().includes('participation exemption')
    )) return false;
    if (features.maxTaxRate !== undefined && j.corporateTax.standardRate > features.maxTaxRate) return false;
    return true;
  });
}

// =============================================================================
// DTA FUNCTIONS
// =============================================================================

/**
 * Get DTA rate between two jurisdictions
 */
export function getDTARate(
  sourceCode: string, 
  targetCode: string, 
  incomeType: 'dividends' | 'interest' | 'royalties'
): { rate: number; hasDTA: boolean; participationRate?: number } {
  const source = getJurisdiction(sourceCode);
  if (!source) return { rate: 0, hasDTA: false };
  
  const dta = source.dtaPartners.find(d => d.partnerJurisdictionCode === targetCode);
  
  if (!dta) {
    // Return domestic withholding rate
    return { 
      rate: source.withholdingTax[incomeType] || 0, 
      hasDTA: false 
    };
  }
  
  return {
    rate: dta[`${incomeType}Rate`] || 0,
    hasDTA: true,
    participationRate: incomeType === 'dividends' ? dta.dividendsParticipationRate : undefined,
  };
}

/**
 * Find optimal DTA route between two jurisdictions
 */
export function findOptimalDTARoute(
  sourceCode: string,
  targetCode: string,
  incomeType: 'dividends' | 'interest' | 'royalties'
): {
  route: string[];
  totalRate: number;
  savings: number;
  intermediary?: string;
} {
  const directRate = getDTARate(sourceCode, targetCode, incomeType);
  
  // Check potential intermediary jurisdictions
  const holdingJurisdictions = ['NL', 'LU', 'IE', 'CH', 'SG', 'HK'];
  let bestRoute: {
    route: string[];
    totalRate: number;
    savings: number;
    intermediary?: string;
  } = {
    route: [sourceCode, targetCode],
    totalRate: directRate.rate,
    savings: 0,
    intermediary: undefined,
  };
  
  for (const intermediary of holdingJurisdictions) {
    if (intermediary === sourceCode || intermediary === targetCode) continue;
    
    const rate1 = getDTARate(sourceCode, intermediary, incomeType);
    const rate2 = getDTARate(intermediary, targetCode, incomeType);
    
    // Use participation rate if available for dividends
    const effectiveRate1 = incomeType === 'dividends' && rate1.participationRate !== undefined 
      ? rate1.participationRate 
      : rate1.rate;
    const effectiveRate2 = incomeType === 'dividends' && rate2.participationRate !== undefined 
      ? rate2.participationRate 
      : rate2.rate;
    
    const totalRate = effectiveRate1 + effectiveRate2;
    
    if (totalRate < bestRoute.totalRate) {
      bestRoute = {
        route: [sourceCode, intermediary, targetCode],
        totalRate,
        savings: directRate.rate - totalRate,
        intermediary,
      };
    }
  }
  
  return bestRoute;
}

// =============================================================================
// TAX CALCULATION HELPERS
// =============================================================================

/**
 * Calculate corporate tax for a given income amount
 */
export function calculateCorporateTax(
  jurisdictionCode: string,
  taxableIncome: number
): {
  taxAmount: number;
  effectiveRate: number;
  breakdown: { bracket: string; income: number; rate: number; tax: number }[];
} {
  const jurisdiction = getJurisdiction(jurisdictionCode);
  if (!jurisdiction) {
    return { taxAmount: 0, effectiveRate: 0, breakdown: [] };
  }
  
  const { corporateTax } = jurisdiction;
  const breakdown: { bracket: string; income: number; rate: number; tax: number }[] = [];
  
  if (!corporateTax.brackets || corporateTax.brackets.length === 0) {
    // Flat rate
    const taxAmount = taxableIncome * (corporateTax.standardRate / 100);
    return {
      taxAmount,
      effectiveRate: corporateTax.standardRate,
      breakdown: [{
        bracket: 'Flat Rate',
        income: taxableIncome,
        rate: corporateTax.standardRate,
        tax: taxAmount,
      }],
    };
  }
  
  // Graduated brackets
  let remainingIncome = taxableIncome;
  let totalTax = 0;
  
  for (const bracket of corporateTax.brackets) {
    if (remainingIncome <= 0) break;
    
    const bracketMax = bracket.maxIncome ?? Infinity;
    const bracketWidth = bracketMax - bracket.minIncome;
    const incomeInBracket = Math.min(remainingIncome, bracketWidth);
    const taxInBracket = incomeInBracket * (bracket.rate / 100) + (bracket.fixedAmount || 0);
    
    breakdown.push({
      bracket: bracket.maxIncome 
        ? `${formatCurrency(bracket.minIncome)} - ${formatCurrency(bracket.maxIncome)}`
        : `Over ${formatCurrency(bracket.minIncome)}`,
      income: incomeInBracket,
      rate: bracket.rate,
      tax: taxInBracket,
    });
    
    totalTax += taxInBracket;
    remainingIncome -= incomeInBracket;
  }
  
  return {
    taxAmount: totalTax,
    effectiveRate: taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0,
    breakdown,
  };
}

/**
 * Calculate withholding tax
 */
export function calculateWithholdingTax(
  sourceJurisdiction: string,
  targetJurisdiction: string,
  amount: number,
  incomeType: 'dividends' | 'interest' | 'royalties',
  ownershipPercentage?: number
): {
  grossAmount: number;
  withholdingRate: number;
  withholdingAmount: number;
  netAmount: number;
  dtaApplied: boolean;
  dtaBenefit: number;
} {
  const source = getJurisdiction(sourceJurisdiction);
  if (!source) {
    return {
      grossAmount: amount,
      withholdingRate: 0,
      withholdingAmount: 0,
      netAmount: amount,
      dtaApplied: false,
      dtaBenefit: 0,
    };
  }
  
  const domesticRate = source.withholdingTax[incomeType] || 0;
  const dta = source.dtaPartners.find(d => d.partnerJurisdictionCode === targetJurisdiction);
  
  let applicableRate = domesticRate;
  let dtaApplied = false;
  
  if (dta) {
    dtaApplied = true;
    applicableRate = dta[`${incomeType}Rate`] || 0;
    
    // Check for participation exemption rate
    if (incomeType === 'dividends' && 
        dta.dividendsParticipationRate !== undefined && 
        ownershipPercentage !== undefined &&
        dta.participationThreshold !== undefined &&
        ownershipPercentage >= dta.participationThreshold) {
      applicableRate = dta.dividendsParticipationRate;
    }
  }
  
  const withholdingAmount = amount * (applicableRate / 100);
  const domesticWithholding = amount * (domesticRate / 100);
  
  return {
    grossAmount: amount,
    withholdingRate: applicableRate,
    withholdingAmount,
    netAmount: amount - withholdingAmount,
    dtaApplied,
    dtaBenefit: dtaApplied ? domesticWithholding - withholdingAmount : 0,
  };
}

// =============================================================================
// COMPARISON FUNCTIONS
// =============================================================================

/**
 * Compare tax burden across jurisdictions
 */
export function compareJurisdictions(
  jurisdictionCodes: string[],
  taxableIncome: number
): {
  code: string;
  name: string;
  standardRate: number;
  effectiveRate: number;
  taxAmount: number;
  ranking: number;
}[] {
  const results = jurisdictionCodes.map(code => {
    const jurisdiction = getJurisdiction(code);
    if (!jurisdiction) return null;
    
    const calc = calculateCorporateTax(code, taxableIncome);
    
    return {
      code,
      name: jurisdiction.name,
      standardRate: jurisdiction.corporateTax.standardRate,
      effectiveRate: calc.effectiveRate,
      taxAmount: calc.taxAmount,
      ranking: 0,
    };
  }).filter(Boolean) as {
    code: string;
    name: string;
    standardRate: number;
    effectiveRate: number;
    taxAmount: number;
    ranking: number;
  }[];
  
  // Sort by effective rate and assign rankings
  results.sort((a, b) => a.effectiveRate - b.effectiveRate);
  results.forEach((r, i) => r.ranking = i + 1);
  
  return results;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get jurisdiction display info for UI
 */
export function getJurisdictionDisplayInfo(code: string): {
  code: string;
  name: string;
  shortName: string;
  flag: string;
  rate: number;
  type: string;
} | null {
  const j = getJurisdiction(code);
  if (!j) return null;
  
  return {
    code: j.code,
    name: j.name,
    shortName: j.shortName || j.code,
    flag: j.flag || '🏳️',
    rate: j.corporateTax.standardRate,
    type: j.type,
  };
}

/**
 * Group jurisdictions by type for UI selection
 */
export function getGroupedJurisdictions(): {
  label: string;
  options: { value: string; label: string; flag: string; rate: number }[];
}[] {
  return [
    {
      label: 'United States Federal',
      options: [US_FEDERAL].map(j => ({
        value: j.code,
        label: j.name,
        flag: j.flag || '🇺🇸',
        rate: j.corporateTax.standardRate,
      })),
    },
    {
      label: 'US States (No Income Tax)',
      options: getNoIncomeTaxStates().map(j => ({
        value: j.code,
        label: j.name,
        flag: '🇺🇸',
        rate: j.corporateTax.standardRate,
      })),
    },
    {
      label: 'US States (A-M)',
      options: US_STATES
        .filter(j => !j.noIncomeTax && j.name[0] <= 'M')
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(j => ({
          value: j.code,
          label: j.name,
          flag: '🇺🇸',
          rate: j.corporateTax.standardRate,
        })),
    },
    {
      label: 'US States (N-Z)',
      options: US_STATES
        .filter(j => !j.noIncomeTax && j.name[0] > 'M')
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(j => ({
          value: j.code,
          label: j.name,
          flag: '🇺🇸',
          rate: j.corporateTax.standardRate,
        })),
    },
    {
      label: 'US Territories',
      options: US_TERRITORIES.map(j => ({
        value: j.code,
        label: j.name,
        flag: j.flag || '🇺🇸',
        rate: j.corporateTax.standardRate,
      })),
    },
    {
      label: 'North America',
      options: INTERNATIONAL_JURISDICTIONS
        .filter(j => ['CA', 'MX'].includes(j.code))
        .map(j => ({
          value: j.code,
          label: j.name,
          flag: j.flag || '🏳️',
          rate: j.corporateTax.standardRate,
        })),
    },
    {
      label: 'Europe',
      options: INTERNATIONAL_JURISDICTIONS
        .filter(j => ['DE', 'CH', 'GB', 'IE', 'NL', 'LU'].includes(j.code))
        .map(j => ({
          value: j.code,
          label: j.name,
          flag: j.flag || '🏳️',
          rate: j.corporateTax.standardRate,
        })),
    },
    {
      label: 'Asia-Pacific',
      options: INTERNATIONAL_JURISDICTIONS
        .filter(j => ['SG', 'HK', 'CN', 'JP', 'KR', 'IN', 'AU'].includes(j.code))
        .map(j => ({
          value: j.code,
          label: j.name,
          flag: j.flag || '🏳️',
          rate: j.corporateTax.standardRate,
        })),
    },
    {
      label: 'Middle East',
      options: INTERNATIONAL_JURISDICTIONS
        .filter(j => ['AE'].includes(j.code))
        .map(j => ({
          value: j.code,
          label: j.name,
          flag: j.flag || '🏳️',
          rate: j.corporateTax.standardRate,
        })),
    },
    {
      label: 'Caribbean Offshore',
      options: CARIBBEAN_JURISDICTIONS.map(j => ({
        value: j.code,
        label: j.name,
        flag: j.flag || '🏳️',
        rate: j.corporateTax.standardRate,
      })),
    },
    {
      label: 'European Offshore',
      options: EUROPEAN_OFFSHORE_JURISDICTIONS.map(j => ({
        value: j.code,
        label: j.name,
        flag: j.flag || '🏳️',
        rate: j.corporateTax.standardRate,
      })),
    },
    {
      label: 'Pacific Offshore',
      options: PACIFIC_JURISDICTIONS.map(j => ({
        value: j.code,
        label: j.name,
        flag: j.flag || '🏳️',
        rate: j.corporateTax.standardRate,
      })),
    },
    {
      label: 'Asian Offshore',
      options: ASIAN_OFFSHORE_JURISDICTIONS.map(j => ({
        value: j.code,
        label: j.name,
        flag: j.flag || '🏳️',
        rate: j.corporateTax.standardRate,
      })),
    },
    {
      label: 'Middle East Offshore & Free Zones',
      options: MIDDLE_EAST_OFFSHORE_JURISDICTIONS.map(j => ({
        value: j.code,
        label: j.name,
        flag: j.flag || '🏳️',
        rate: j.corporateTax.standardRate,
      })),
    },
    {
      label: 'Swiss Cantons',
      options: SWISS_CANTONS.map(j => ({
        value: j.code,
        label: j.name,
        flag: j.flag || '🇨🇭',
        rate: j.corporateTax.standardRate,
      })),
    },
  ];
}

// =============================================================================
// ADDITIONAL FUNCTIONS FOR CORPORATE STRUCTURE
// =============================================================================

/**
 * Get withholding tax rate between two jurisdictions for a specific income type
 */
export function getWithholdingRate(
  sourceJurisdiction: TaxJurisdictionFull,
  targetCountry: string,
  incomeType: 'dividends' | 'interest' | 'royalties'
): number {
  // First check if there's a treaty
  const treaty = sourceJurisdiction.dtaPartners.find(
    dta => dta.partnerJurisdictionCode === targetCountry
  );
  
  if (treaty) {
    return treaty[`${incomeType}Rate`] || sourceJurisdiction.withholdingTax[incomeType];
  }
  
  // Return domestic rate if no treaty
  return sourceJurisdiction.withholdingTax[incomeType];
}

/**
 * Get treaty information between two jurisdictions
 */
export function getTreaty(
  sourceCountry: string,
  targetCountry: string
): { dividendsRate: number; interestRate: number; royaltiesRate: number } | null {
  const sourceJurisdiction = getJurisdiction(sourceCountry);
  if (!sourceJurisdiction) return null;
  
  const treaty = sourceJurisdiction.dtaPartners.find(
    dta => dta.partnerJurisdictionCode === targetCountry
  );
  
  if (!treaty) return null;
  
  return {
    dividendsRate: treaty.dividendsRate,
    interestRate: treaty.interestRate,
    royaltiesRate: treaty.royaltiesRate,
  };
}

/**
 * Get jurisdictions suitable for holding company structures
 */
export function getLowTaxHoldingJurisdictions(): TaxJurisdictionFull[] {
  return ALL_JURISDICTIONS.filter(j => {
    // Good holding jurisdictions typically have:
    // - Participation exemption or low dividend tax
    // - Extensive treaty network
    // - No or low tax on capital gains from shares
    const hasLowRate = j.corporateTax.standardRate <= 20;
    const hasManyTreaties = j.dtaPartners.length >= 10;
    const hasTerritorialOrExemptions = j.territorialSystem || 
      j.taxIncentives?.some(i => 
        i.name.toLowerCase().includes('participation') ||
        i.name.toLowerCase().includes('holding')
      );
    
    return (hasLowRate || hasTerritorialOrExemptions) && hasManyTreaties;
  }).sort((a, b) => a.corporateTax.standardRate - b.corporateTax.standardRate);
}

/**
 * Get jurisdictions with IP Box regimes
 */
export function getIPBoxJurisdictions(): TaxJurisdictionFull[] {
  return ALL_JURISDICTIONS.filter(j => 
    j.taxIncentives?.some(i => 
      i.name.toLowerCase().includes('ip box') ||
      i.name.toLowerCase().includes('patent box') ||
      i.name.toLowerCase().includes('innovation box') ||
      i.name.toLowerCase().includes('knowledge development') ||
      i.name.toLowerCase().includes('intellectual property')
    )
  );
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

export {
  // US Jurisdictions
  ALL_US_JURISDICTIONS,
  US_FEDERAL,
  US_STATES,
  US_TERRITORIES,
  getUSJurisdiction,
  getNoIncomeTaxStates,
  // International Jurisdictions
  INTERNATIONAL_JURISDICTIONS,
  getInternationalJurisdiction,
  getJurisdictionsByRegion,
  getLowTaxJurisdictions,
  // Offshore Jurisdictions
  ALL_OFFSHORE_JURISDICTIONS,
  CARIBBEAN_JURISDICTIONS,
  EUROPEAN_OFFSHORE_JURISDICTIONS,
  PACIFIC_JURISDICTIONS,
  ASIAN_OFFSHORE_JURISDICTIONS,
  MIDDLE_EAST_OFFSHORE_JURISDICTIONS,
  getOffshoreJurisdiction,
  getZeroTaxJurisdictions,
  getJurisdictionsWithCBI,
  getAssetProtectionJurisdictions,
  getOffshoreJurisdictionsByRegion,
  // Swiss Cantons
  SWISS_CANTONS,
  getCantonByCode,
  getCantonsByLanguage,
  getLowestTaxCantons,
  getCantonTaxComparison,
};
