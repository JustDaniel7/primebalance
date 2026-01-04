// =============================================================================
// SWISS CANTONS TAX JURISDICTIONS
// All 26 Swiss cantons with their specific corporate tax rates
// =============================================================================

import type { TaxJurisdictionFull } from '@/types/tax';
import { JurisdictionType, FilingFrequency, TransferPricingMethod } from '@/types/tax';

// Helper function to create canton jurisdiction
function createCanton(
    code: string,
    name: string,
    germanName: string,
    effectiveRate: number,
    cantonalRate: number,
    communalRate: number,
    language: string[],
    capital: string,
    notes?: string
): TaxJurisdictionFull {
    return {
        code: `CH-${code}`,
        name: `${name} (${germanName})`,
        shortName: code,
        type: JurisdictionType.SWISS_CANTON,
        currency: 'CHF',
        language,
        flag: '🇨🇭',
        corporateTax: {
            standardRate: effectiveRate,
            brackets: [
                { minIncome: 0, maxIncome: null, rate: effectiveRate },
            ],
            effectiveDate: '2024-01-01',
            notes: notes || `Federal 8.5% + Cantonal ${cantonalRate}% + Communal ${communalRate}% (${capital}). Total effective rate: ${effectiveRate}%`,
        },
        withholdingTax: {
            dividends: 35, // Federal rate applies
            interest: 35,
            royalties: 0,
        },
        dtaPartners: [], // Use Switzerland's DTAs
        transferPricingRules: {
            documentationRequired: true,
            documentationThreshold: 0,
            masterFileRequired: true,
            localFileRequired: true,
            cbcReportingRequired: true,
            cbcThreshold: 900000000,
            preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.TNMM, TransferPricingMethod.CPM],
            advancePricingAgreements: true,
            notes: 'Follows Swiss federal guidelines. OECD Guidelines applied.',
        },
        filingRequirements: [
            {
                filingType: 'Cantonal Corporate Tax Return',
                frequency: FilingFrequency.ANNUALLY,
                dueDate: 'Varies, typically 6-9 months after year end',
                dueDaysAfterYearEnd: 270,
                extensionAvailable: true,
                extensionDays: 180,
                electronicFilingRequired: false,
                estimatedPaymentsRequired: true,
                estimatedPaymentSchedule: 'Provisional payments during tax year',
            },
        ],
        cfcRules: false,
        thinCapitalizationRules: true,
        debtEquityRatio: 6,
        taxIncentives: [
            {
                name: 'Participation Exemption',
                description: '100% exemption for qualifying dividends and capital gains.',
                eligibilityCriteria: ['10% ownership or CHF 1M investment', 'Minimum 1 year holding'],
            },
            {
                name: 'Cantonal Patent Box',
                description: 'Up to 90% reduction on qualifying IP income.',
                rateReduction: 90,
                eligibilityCriteria: ['Patents and similar rights', 'R&D nexus requirement'],
            },
        ],
        lastUpdated: '2024-01-01',
    };
}

// =============================================================================
// GERMAN-SPEAKING CANTONS
// =============================================================================

export const ZURICH = createCanton(
    'ZH', 'Zurich', 'Zürich', 19.7, 8.0, 3.2, ['de'], 'Zürich',
    'Financial and economic center. Major city communes have higher rates.'
);

export const BERN = createCanton(
    'BE', 'Bern', 'Bern', 21.0, 7.8, 4.7, ['de', 'fr'], 'Bern',
    'Federal capital. Bilingual canton (German/French).'
);

export const LUCERNE = createCanton(
    'LU', 'Lucerne', 'Luzern', 12.3, 1.5, 2.3, ['de'], 'Luzern',
    'One of the lowest corporate tax rates in Switzerland.'
);

export const URI = createCanton(
    'UR', 'Uri', 'Uri', 14.9, 3.0, 3.4, ['de'], 'Altdorf'
);

export const SCHWYZ = createCanton(
    'SZ', 'Schwyz', 'Schwyz', 14.4, 2.5, 3.4, ['de'], 'Schwyz',
    'Low-tax canton popular with holding companies.'
);

export const OBWALDEN = createCanton(
    'OW', 'Obwalden', 'Obwalden', 12.7, 1.8, 2.4, ['de'], 'Sarnen',
    'Among the lowest corporate tax rates. Attractive for multinationals.'
);

export const NIDWALDEN = createCanton(
    'NW', 'Nidwalden', 'Nidwalden', 11.9, 1.2, 2.2, ['de'], 'Stans',
    'Lowest corporate tax rate in Switzerland. Very business-friendly.'
);

export const GLARUS = createCanton(
    'GL', 'Glarus', 'Glarus', 15.7, 3.5, 3.7, ['de'], 'Glarus'
);

export const ZUG = createCanton(
    'ZG', 'Zug', 'Zug', 11.9, 1.5, 1.9, ['de'], 'Zug',
    'Major crypto and fintech hub. Very low taxes and business-friendly.'
);

export const SOLOTHURN = createCanton(
    'SO', 'Solothurn', 'Solothurn', 16.0, 4.0, 3.5, ['de'], 'Solothurn'
);

export const BASEL_STADT = createCanton(
    'BS', 'Basel-Stadt', 'Basel-Stadt', 13.0, 2.0, 2.5, ['de'], 'Basel',
    'Pharma and chemical industry hub. Competitive rates.'
);

export const BASEL_LANDSCHAFT = createCanton(
    'BL', 'Basel-Landschaft', 'Basel-Landschaft', 14.4, 2.5, 3.4, ['de'], 'Liestal'
);

export const SCHAFFHAUSEN = createCanton(
    'SH', 'Schaffhausen', 'Schaffhausen', 16.0, 4.0, 3.5, ['de'], 'Schaffhausen'
);

export const APPENZELL_AUSSERRHODEN = createCanton(
    'AR', 'Appenzell Ausserrhoden', 'Appenzell Ausserrhoden', 13.0, 2.0, 2.5, ['de'], 'Herisau'
);

export const APPENZELL_INNERRHODEN = createCanton(
    'AI', 'Appenzell Innerrhoden', 'Appenzell Innerrhoden', 14.2, 2.2, 3.5, ['de'], 'Appenzell'
);

export const ST_GALLEN = createCanton(
    'SG', 'St. Gallen', 'St. Gallen', 14.5, 2.5, 3.5, ['de'], 'St. Gallen'
);

export const GRAUBUNDEN = createCanton(
    'GR', 'Graubünden', 'Graubünden', 14.0, 2.5, 3.0, ['de', 'rm', 'it'], 'Chur',
    'Trilingual canton (German, Romansh, Italian).'
);

export const AARGAU = createCanton(
    'AG', 'Aargau', 'Aargau', 16.0, 4.0, 3.5, ['de'], 'Aarau'
);

export const THURGAU = createCanton(
    'TG', 'Thurgau', 'Thurgau', 13.4, 2.0, 2.9, ['de'], 'Frauenfeld'
);

// =============================================================================
// FRENCH-SPEAKING CANTONS
// =============================================================================

export const FRIBOURG = createCanton(
    'FR', 'Fribourg', 'Freiburg', 14.0, 2.5, 3.0, ['fr', 'de'], 'Fribourg',
    'Bilingual canton (French/German).'
);

export const VAUD = createCanton(
    'VD', 'Vaud', 'Waadt', 14.0, 2.5, 3.0, ['fr'], 'Lausanne',
    'Home to many multinationals. Competitive rates after reform.'
);

export const VALAIS = createCanton(
    'VS', 'Valais', 'Wallis', 14.3, 2.5, 3.3, ['fr', 'de'], 'Sion',
    'Bilingual canton (French/German).'
);

export const NEUCHATEL = createCanton(
    'NE', 'Neuchâtel', 'Neuenburg', 14.8, 3.0, 3.3, ['fr'], 'Neuchâtel',
    'Watchmaking industry center.'
);

export const GENEVA = createCanton(
    'GE', 'Geneva', 'Genf', 14.0, 2.5, 3.0, ['fr'], 'Geneva',
    'Major international hub. Home to many international organizations and multinationals.'
);

export const JURA = createCanton(
    'JU', 'Jura', 'Jura', 17.0, 4.5, 4.0, ['fr'], 'Delémont'
);

// =============================================================================
// ITALIAN-SPEAKING CANTON
// =============================================================================

export const TICINO = createCanton(
    'TI', 'Ticino', 'Tessin', 15.5, 3.5, 3.5, ['it'], 'Bellinzona',
    'Italian-speaking canton. Gateway to Italy.'
);

// =============================================================================
// EXPORT ALL CANTONS
// =============================================================================

export const SWISS_CANTONS: TaxJurisdictionFull[] = [
    // German-speaking
    ZURICH,
    BERN,
    LUCERNE,
    URI,
    SCHWYZ,
    OBWALDEN,
    NIDWALDEN,
    GLARUS,
    ZUG,
    SOLOTHURN,
    BASEL_STADT,
    BASEL_LANDSCHAFT,
    SCHAFFHAUSEN,
    APPENZELL_AUSSERRHODEN,
    APPENZELL_INNERRHODEN,
    ST_GALLEN,
    GRAUBUNDEN,
    AARGAU,
    THURGAU,
    // French-speaking
    FRIBOURG,
    VAUD,
    VALAIS,
    NEUCHATEL,
    GENEVA,
    JURA,
    // Italian-speaking
    TICINO,
];

// Helper functions
export function getCantonByCode(code: string): TaxJurisdictionFull | undefined {
    return SWISS_CANTONS.find(c => c.code === code || c.shortName === code);
}

export function getCantonsByLanguage(language: string): TaxJurisdictionFull[] {
    return SWISS_CANTONS.filter(c => c.language.includes(language));
}

export function getLowestTaxCantons(limit: number = 5): TaxJurisdictionFull[] {
    return [...SWISS_CANTONS]
        .sort((a, b) => a.corporateTax.standardRate - b.corporateTax.standardRate)
        .slice(0, limit);
}

export function getCantonTaxComparison(): Array<{ name: string; code: string; rate: number }> {
    return SWISS_CANTONS
        .map(c => ({
            name: c.name,
            code: c.shortName || c.code || '',
            rate: c.corporateTax.standardRate,
        }))
        .sort((a, b) => a.rate - b.rate);
}
