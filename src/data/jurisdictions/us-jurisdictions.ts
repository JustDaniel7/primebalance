// =============================================================================
// PRIMEBALANCE - US STATES & TERRITORIES TAX JURISDICTIONS
// =============================================================================

import { 
  TaxJurisdictionFull, 
  JurisdictionType, 
  FilingFrequency,
  TransferPricingMethod 
} from '@/types/tax';

// Default US state transfer pricing rules (follows federal)
const defaultUSTransferPricing = {
  documentationRequired: true,
  documentationThreshold: 0,
  masterFileRequired: false,
  localFileRequired: false,
  cbcReportingRequired: false,
  preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.CPM, TransferPricingMethod.TNMM],
  advancePricingAgreements: true,
  notes: 'Follows federal transfer pricing rules under IRC Section 482',
};

// Default US state filing requirements
const defaultUSStateFilingReqs = [
  {
    filingType: 'Corporate Income Tax Return',
    frequency: FilingFrequency.ANNUALLY,
    dueDate: '15th day of 4th month after fiscal year end',
    dueDaysAfterYearEnd: 105,
    extensionAvailable: true,
    extensionDays: 180,
    electronicFilingRequired: true,
    estimatedPaymentsRequired: true,
    estimatedPaymentSchedule: 'Quarterly: 15th of 4th, 6th, 9th, and 12th months',
  },
];

// =============================================================================
// ALL 50 US STATES + DC
// =============================================================================

export const US_STATES: TaxJurisdictionFull[] = [
  // ---------------------------------------------------------------------------
  // ALABAMA
  // ---------------------------------------------------------------------------
  {
    code: 'US-AL',
    name: 'Alabama',
    shortName: 'AL',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 6.5,
      effectiveDate: '2024-01-01',
      notes: 'Flat corporate income tax rate. Federal income tax is deductible.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    cfcRules: false,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // ALASKA
  // ---------------------------------------------------------------------------
  {
    code: 'US-AK',
    name: 'Alaska',
    shortName: 'AK',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 9.4,
      brackets: [
        { minIncome: 0, maxIncome: 25000, rate: 0 },
        { minIncome: 25000, maxIncome: 49000, rate: 2 },
        { minIncome: 49000, maxIncome: 74000, rate: 3 },
        { minIncome: 74000, maxIncome: 99000, rate: 4 },
        { minIncome: 99000, maxIncome: 124000, rate: 5 },
        { minIncome: 124000, maxIncome: 148000, rate: 6 },
        { minIncome: 148000, maxIncome: 173000, rate: 7 },
        { minIncome: 173000, maxIncome: 198000, rate: 8 },
        { minIncome: 198000, maxIncome: 222000, rate: 9 },
        { minIncome: 222000, maxIncome: null, rate: 9.4 },
      ],
      effectiveDate: '2024-01-01',
      notes: 'Graduated corporate income tax with 10 brackets.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // ARIZONA
  // ---------------------------------------------------------------------------
  {
    code: 'US-AZ',
    name: 'Arizona',
    shortName: 'AZ',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 4.9,
      smallBusinessRate: 4.9,
      effectiveDate: '2024-01-01',
      notes: 'Flat rate reduced from 6.968% to 4.9% effective 2023.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // ARKANSAS
  // ---------------------------------------------------------------------------
  {
    code: 'US-AR',
    name: 'Arkansas',
    shortName: 'AR',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 5.1,
      brackets: [
        { minIncome: 0, maxIncome: 3000, rate: 1 },
        { minIncome: 3000, maxIncome: 6000, rate: 2 },
        { minIncome: 6000, maxIncome: 11000, rate: 3 },
        { minIncome: 11000, maxIncome: 25000, rate: 5 },
        { minIncome: 25000, maxIncome: null, rate: 5.1 },
      ],
      effectiveDate: '2024-01-01',
      notes: 'Graduated rate structure being phased down.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // CALIFORNIA
  // ---------------------------------------------------------------------------
  {
    code: 'US-CA',
    name: 'California',
    shortName: 'CA',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 8.84,
      smallBusinessRate: 8.84,
      effectiveDate: '2024-01-01',
      notes: 'Minimum franchise tax of $800. S-Corps pay 1.5% with $800 minimum.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 7,
    },
    dtaPartners: [],
    transferPricingRules: {
      ...defaultUSTransferPricing,
      notes: 'California has specific combined reporting requirements for unitary businesses.',
    },
    filingRequirements: [
      {
        filingType: 'Form 100 - Corporation Franchise/Income Tax Return',
        frequency: FilingFrequency.ANNUALLY,
        dueDate: '15th day of 4th month after fiscal year end',
        dueDaysAfterYearEnd: 105,
        extensionAvailable: true,
        extensionDays: 210,
        electronicFilingRequired: true,
        estimatedPaymentsRequired: true,
        estimatedPaymentSchedule: 'Quarterly',
      },
    ],
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // COLORADO
  // ---------------------------------------------------------------------------
  {
    code: 'US-CO',
    name: 'Colorado',
    shortName: 'CO',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 4.4,
      effectiveDate: '2024-01-01',
      notes: 'Flat rate, reduced from 4.55% in 2024.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // CONNECTICUT
  // ---------------------------------------------------------------------------
  {
    code: 'US-CT',
    name: 'Connecticut',
    shortName: 'CT',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 7.5,
      effectiveDate: '2024-01-01',
      notes: 'Plus 10% surcharge on tax liability over $250 for certain companies.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // DELAWARE
  // ---------------------------------------------------------------------------
  {
    code: 'US-DE',
    name: 'Delaware',
    shortName: 'DE',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 8.7,
      effectiveDate: '2024-01-01',
      notes: 'No tax on out-of-state income. Holding company exemptions available.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    taxIncentives: [
      {
        name: 'Delaware Holding Company Exemption',
        description: 'Exemption for companies whose activities are limited to maintaining and managing intangible investments.',
        eligibilityCriteria: ['Limited to intangible investment activities', 'No physical presence beyond registered agent'],
      },
    ],
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // FLORIDA
  // ---------------------------------------------------------------------------
  {
    code: 'US-FL',
    name: 'Florida',
    shortName: 'FL',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 5.5,
      smallBusinessThreshold: 50000,
      effectiveDate: '2024-01-01',
      notes: 'First $50,000 of net income exempt. No personal income tax.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // GEORGIA
  // ---------------------------------------------------------------------------
  {
    code: 'US-GA',
    name: 'Georgia',
    shortName: 'GA',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 5.75,
      effectiveDate: '2024-01-01',
      notes: 'Flat rate. Film industry tax credits available.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 4,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    taxIncentives: [
      {
        name: 'Georgia Film Tax Credit',
        description: 'Up to 30% tax credit for film and TV production.',
        rateReduction: 30,
        eligibilityCriteria: ['Minimum $500,000 spend in Georgia'],
      },
    ],
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // HAWAII
  // ---------------------------------------------------------------------------
  {
    code: 'US-HI',
    name: 'Hawaii',
    shortName: 'HI',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 6.4,
      brackets: [
        { minIncome: 0, maxIncome: 25000, rate: 4.4 },
        { minIncome: 25000, maxIncome: 100000, rate: 5.4 },
        { minIncome: 100000, maxIncome: null, rate: 6.4 },
      ],
      effectiveDate: '2024-01-01',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // IDAHO
  // ---------------------------------------------------------------------------
  {
    code: 'US-ID',
    name: 'Idaho',
    shortName: 'ID',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 5.8,
      effectiveDate: '2024-01-01',
      notes: 'Flat rate. $20 minimum tax.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // ILLINOIS
  // ---------------------------------------------------------------------------
  {
    code: 'US-IL',
    name: 'Illinois',
    shortName: 'IL',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 9.5,
      effectiveDate: '2024-01-01',
      notes: '7% income tax + 2.5% replacement tax = 9.5% combined.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // INDIANA
  // ---------------------------------------------------------------------------
  {
    code: 'US-IN',
    name: 'Indiana',
    shortName: 'IN',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 4.9,
      effectiveDate: '2024-01-01',
      notes: 'Flat rate.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // IOWA
  // ---------------------------------------------------------------------------
  {
    code: 'US-IA',
    name: 'Iowa',
    shortName: 'IA',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 8.4,
      brackets: [
        { minIncome: 0, maxIncome: 100000, rate: 5.5 },
        { minIncome: 100000, maxIncome: null, rate: 8.4 },
      ],
      effectiveDate: '2024-01-01',
      notes: 'Being phased to flat 5.5% by 2026.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // KANSAS
  // ---------------------------------------------------------------------------
  {
    code: 'US-KS',
    name: 'Kansas',
    shortName: 'KS',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 7,
      brackets: [
        { minIncome: 0, maxIncome: 50000, rate: 4 },
        { minIncome: 50000, maxIncome: null, rate: 7 },
      ],
      effectiveDate: '2024-01-01',
      notes: '4% on first $50K, 7% on excess. Plus 3% surtax on taxable income over $50K.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // KENTUCKY
  // ---------------------------------------------------------------------------
  {
    code: 'US-KY',
    name: 'Kentucky',
    shortName: 'KY',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 5,
      effectiveDate: '2024-01-01',
      notes: 'Flat rate. Limited liability entity tax also applies.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // LOUISIANA
  // ---------------------------------------------------------------------------
  {
    code: 'US-LA',
    name: 'Louisiana',
    shortName: 'LA',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 7.5,
      brackets: [
        { minIncome: 0, maxIncome: 25000, rate: 3.5 },
        { minIncome: 25000, maxIncome: 50000, rate: 5.5 },
        { minIncome: 50000, maxIncome: 100000, rate: 7.5 },
        { minIncome: 100000, maxIncome: 200000, rate: 7.5 },
        { minIncome: 200000, maxIncome: null, rate: 7.5 },
      ],
      effectiveDate: '2024-01-01',
      notes: 'Federal income tax is deductible.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // MAINE
  // ---------------------------------------------------------------------------
  {
    code: 'US-ME',
    name: 'Maine',
    shortName: 'ME',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 8.93,
      brackets: [
        { minIncome: 0, maxIncome: 350000, rate: 3.5 },
        { minIncome: 350000, maxIncome: 1050000, rate: 7.93 },
        { minIncome: 1050000, maxIncome: 3500000, rate: 8.33 },
        { minIncome: 3500000, maxIncome: null, rate: 8.93 },
      ],
      effectiveDate: '2024-01-01',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // MARYLAND
  // ---------------------------------------------------------------------------
  {
    code: 'US-MD',
    name: 'Maryland',
    shortName: 'MD',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 8.25,
      effectiveDate: '2024-01-01',
      notes: 'Flat rate.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // MASSACHUSETTS
  // ---------------------------------------------------------------------------
  {
    code: 'US-MA',
    name: 'Massachusetts',
    shortName: 'MA',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 8,
      effectiveDate: '2024-01-01',
      notes: 'Minimum tax ranges from $456 to $150,000 based on sales/assets.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // MICHIGAN
  // ---------------------------------------------------------------------------
  {
    code: 'US-MI',
    name: 'Michigan',
    shortName: 'MI',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 6,
      effectiveDate: '2024-01-01',
      notes: 'Corporate Income Tax (CIT). Small businesses may elect flow-through.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // MINNESOTA
  // ---------------------------------------------------------------------------
  {
    code: 'US-MN',
    name: 'Minnesota',
    shortName: 'MN',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 9.8,
      effectiveDate: '2024-01-01',
      notes: 'One of the highest state rates. Minimum fee based on Minnesota property, payroll, and sales.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // MISSISSIPPI
  // ---------------------------------------------------------------------------
  {
    code: 'US-MS',
    name: 'Mississippi',
    shortName: 'MS',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 5,
      brackets: [
        { minIncome: 0, maxIncome: 5000, rate: 0 },
        { minIncome: 5000, maxIncome: 10000, rate: 4 },
        { minIncome: 10000, maxIncome: null, rate: 5 },
      ],
      effectiveDate: '2024-01-01',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // MISSOURI
  // ---------------------------------------------------------------------------
  {
    code: 'US-MO',
    name: 'Missouri',
    shortName: 'MO',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 4,
      effectiveDate: '2024-01-01',
      notes: 'Reduced from 6.25%. 50% federal income tax deduction allowed.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // MONTANA
  // ---------------------------------------------------------------------------
  {
    code: 'US-MT',
    name: 'Montana',
    shortName: 'MT',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 6.75,
      effectiveDate: '2024-01-01',
      notes: 'Minimum tax of $50.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // NEBRASKA
  // ---------------------------------------------------------------------------
  {
    code: 'US-NE',
    name: 'Nebraska',
    shortName: 'NE',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 7.25,
      brackets: [
        { minIncome: 0, maxIncome: 100000, rate: 5.58 },
        { minIncome: 100000, maxIncome: null, rate: 7.25 },
      ],
      effectiveDate: '2024-01-01',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // NEVADA (NO CORPORATE INCOME TAX)
  // ---------------------------------------------------------------------------
  {
    code: 'US-NV',
    name: 'Nevada',
    shortName: 'NV',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 0,
      effectiveDate: '2024-01-01',
      notes: 'No corporate income tax. Commerce Tax applies to businesses with Nevada gross revenue over $4M.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    noIncomeTax: true,
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: [
      {
        filingType: 'Commerce Tax Return',
        frequency: FilingFrequency.ANNUALLY,
        dueDate: 'August 14',
        extensionAvailable: true,
        extensionDays: 30,
        electronicFilingRequired: true,
        estimatedPaymentsRequired: false,
      },
    ],
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // NEW HAMPSHIRE
  // ---------------------------------------------------------------------------
  {
    code: 'US-NH',
    name: 'New Hampshire',
    shortName: 'NH',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 7.5,
      effectiveDate: '2024-01-01',
      notes: 'Business Profits Tax (BPT). Being phased down to 7.5% from 7.6%.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // NEW JERSEY
  // ---------------------------------------------------------------------------
  {
    code: 'US-NJ',
    name: 'New Jersey',
    shortName: 'NJ',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 11.5,
      brackets: [
        { minIncome: 0, maxIncome: 100000, rate: 6.5 },
        { minIncome: 100000, maxIncome: 1000000, rate: 7.5 },
        { minIncome: 1000000, maxIncome: null, rate: 11.5 },
      ],
      effectiveDate: '2024-01-01',
      notes: '2.5% surcharge on income over $1M through 2028.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // NEW MEXICO
  // ---------------------------------------------------------------------------
  {
    code: 'US-NM',
    name: 'New Mexico',
    shortName: 'NM',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 5.9,
      brackets: [
        { minIncome: 0, maxIncome: 500000, rate: 4.8 },
        { minIncome: 500000, maxIncome: null, rate: 5.9 },
      ],
      effectiveDate: '2024-01-01',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // NEW YORK
  // ---------------------------------------------------------------------------
  {
    code: 'US-NY',
    name: 'New York',
    shortName: 'NY',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 7.25,
      brackets: [
        { minIncome: 0, maxIncome: 5000000, rate: 6.5 },
        { minIncome: 5000000, maxIncome: null, rate: 7.25 },
      ],
      smallBusinessRate: 0,
      smallBusinessThreshold: 390000,
      effectiveDate: '2024-01-01',
      notes: 'Small businesses with income under $390K and NY receipts under $1M qualify for 0% rate.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // NORTH CAROLINA
  // ---------------------------------------------------------------------------
  {
    code: 'US-NC',
    name: 'North Carolina',
    shortName: 'NC',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 2.5,
      effectiveDate: '2024-01-01',
      notes: 'Lowest rate in country with corporate income tax. Being phased to 0% by 2030.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // NORTH DAKOTA
  // ---------------------------------------------------------------------------
  {
    code: 'US-ND',
    name: 'North Dakota',
    shortName: 'ND',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 4.31,
      brackets: [
        { minIncome: 0, maxIncome: 25000, rate: 1.41 },
        { minIncome: 25000, maxIncome: 50000, rate: 3.55 },
        { minIncome: 50000, maxIncome: null, rate: 4.31 },
      ],
      effectiveDate: '2024-01-01',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // OHIO (NO TRADITIONAL CORPORATE INCOME TAX)
  // ---------------------------------------------------------------------------
  {
    code: 'US-OH',
    name: 'Ohio',
    shortName: 'OH',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 0,
      effectiveDate: '2024-01-01',
      notes: 'No corporate income tax. Commercial Activity Tax (CAT) of 0.26% on gross receipts over $1M.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    noIncomeTax: true,
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: [
      {
        filingType: 'Commercial Activity Tax (CAT)',
        frequency: FilingFrequency.ANNUALLY,
        dueDate: 'May 10',
        extensionAvailable: false,
        extensionDays: 0,
        electronicFilingRequired: true,
        estimatedPaymentsRequired: true,
        estimatedPaymentSchedule: 'Quarterly for businesses with $1M+ taxable gross receipts',
      },
    ],
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // OKLAHOMA
  // ---------------------------------------------------------------------------
  {
    code: 'US-OK',
    name: 'Oklahoma',
    shortName: 'OK',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 4,
      effectiveDate: '2024-01-01',
      notes: 'Flat rate.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // OREGON
  // ---------------------------------------------------------------------------
  {
    code: 'US-OR',
    name: 'Oregon',
    shortName: 'OR',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 7.6,
      brackets: [
        { minIncome: 0, maxIncome: 1000000, rate: 6.6 },
        { minIncome: 1000000, maxIncome: null, rate: 7.6 },
      ],
      effectiveDate: '2024-01-01',
      notes: 'Minimum tax of $150. Corporate Activity Tax (CAT) also applies.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // PENNSYLVANIA
  // ---------------------------------------------------------------------------
  {
    code: 'US-PA',
    name: 'Pennsylvania',
    shortName: 'PA',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 8.99,
      effectiveDate: '2024-01-01',
      notes: 'Being reduced by 0.5% annually until reaching 4.99% in 2031.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // RHODE ISLAND
  // ---------------------------------------------------------------------------
  {
    code: 'US-RI',
    name: 'Rhode Island',
    shortName: 'RI',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 7,
      effectiveDate: '2024-01-01',
      notes: 'Flat rate. Minimum tax of $400.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // SOUTH CAROLINA
  // ---------------------------------------------------------------------------
  {
    code: 'US-SC',
    name: 'South Carolina',
    shortName: 'SC',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 5,
      effectiveDate: '2024-01-01',
      notes: 'Flat rate. License fee of 0.1% on capital and paid-in surplus also applies.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // SOUTH DAKOTA (NO CORPORATE INCOME TAX)
  // ---------------------------------------------------------------------------
  {
    code: 'US-SD',
    name: 'South Dakota',
    shortName: 'SD',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 0,
      effectiveDate: '2024-01-01',
      notes: 'No corporate income tax. No personal income tax.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    noIncomeTax: true,
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: [],
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // TENNESSEE
  // ---------------------------------------------------------------------------
  {
    code: 'US-TN',
    name: 'Tennessee',
    shortName: 'TN',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 6.5,
      effectiveDate: '2024-01-01',
      notes: 'Franchise tax of 0.25% on net worth or book value also applies. No personal income tax.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // TEXAS (NO CORPORATE INCOME TAX)
  // ---------------------------------------------------------------------------
  {
    code: 'US-TX',
    name: 'Texas',
    shortName: 'TX',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 0,
      effectiveDate: '2024-01-01',
      notes: 'No corporate income tax. Franchise (margin) tax of 0.375%-0.75% on taxable margin.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    noIncomeTax: true,
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: [
      {
        filingType: 'Texas Franchise Tax Report',
        frequency: FilingFrequency.ANNUALLY,
        dueDate: 'May 15',
        extensionAvailable: true,
        extensionDays: 180,
        electronicFilingRequired: true,
        estimatedPaymentsRequired: false,
      },
    ],
    taxIncentives: [
      {
        name: 'No State Income Tax',
        description: 'Texas does not impose a state corporate or personal income tax.',
        eligibilityCriteria: ['All businesses'],
      },
    ],
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // UTAH
  // ---------------------------------------------------------------------------
  {
    code: 'US-UT',
    name: 'Utah',
    shortName: 'UT',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 4.65,
      effectiveDate: '2024-01-01',
      notes: 'Flat rate. Reduced from 4.85%.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // VERMONT
  // ---------------------------------------------------------------------------
  {
    code: 'US-VT',
    name: 'Vermont',
    shortName: 'VT',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 8.5,
      brackets: [
        { minIncome: 0, maxIncome: 10000, rate: 6 },
        { minIncome: 10000, maxIncome: 25000, rate: 7 },
        { minIncome: 25000, maxIncome: null, rate: 8.5 },
      ],
      effectiveDate: '2024-01-01',
      notes: 'Minimum tax of $250.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // VIRGINIA
  // ---------------------------------------------------------------------------
  {
    code: 'US-VA',
    name: 'Virginia',
    shortName: 'VA',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 6,
      effectiveDate: '2024-01-01',
      notes: 'Flat rate.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // WASHINGTON (NO CORPORATE INCOME TAX)
  // ---------------------------------------------------------------------------
  {
    code: 'US-WA',
    name: 'Washington',
    shortName: 'WA',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 0,
      effectiveDate: '2024-01-01',
      notes: 'No corporate income tax. Business & Occupation (B&O) Tax on gross receipts (0.138%-3.3% depending on activity).',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    noIncomeTax: true,
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: [
      {
        filingType: 'Business & Occupation Tax Return',
        frequency: FilingFrequency.MONTHLY,
        dueDate: '25th of following month',
        extensionAvailable: false,
        extensionDays: 0,
        electronicFilingRequired: true,
        estimatedPaymentsRequired: false,
      },
    ],
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // WEST VIRGINIA
  // ---------------------------------------------------------------------------
  {
    code: 'US-WV',
    name: 'West Virginia',
    shortName: 'WV',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 6.5,
      effectiveDate: '2024-01-01',
      notes: 'Flat rate.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // WISCONSIN
  // ---------------------------------------------------------------------------
  {
    code: 'US-WI',
    name: 'Wisconsin',
    shortName: 'WI',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 7.9,
      effectiveDate: '2024-01-01',
      notes: 'Flat rate.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // WYOMING (NO CORPORATE INCOME TAX)
  // ---------------------------------------------------------------------------
  {
    code: 'US-WY',
    name: 'Wyoming',
    shortName: 'WY',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 0,
      effectiveDate: '2024-01-01',
      notes: 'No corporate income tax. No personal income tax.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    noIncomeTax: true,
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: [],
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // DISTRICT OF COLUMBIA
  // ---------------------------------------------------------------------------
  {
    code: 'US-DC',
    name: 'District of Columbia',
    shortName: 'DC',
    type: JurisdictionType.US_STATE,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇺🇸',
    corporateTax: {
      standardRate: 8.25,
      effectiveDate: '2024-01-01',
      notes: 'Minimum tax of $250.',
    },
    withholdingTax: {
      dividends: 0,
      interest: 0,
      royalties: 0,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },
];

// =============================================================================
// US TERRITORIES
// =============================================================================

export const US_TERRITORIES: TaxJurisdictionFull[] = [
  // ---------------------------------------------------------------------------
  // PUERTO RICO
  // ---------------------------------------------------------------------------
  {
    code: 'US-PR',
    name: 'Puerto Rico',
    shortName: 'PR',
    type: JurisdictionType.US_TERRITORY,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['es', 'en'],
    flag: '🇵🇷',
    corporateTax: {
      standardRate: 37.5,
      brackets: [
        { minIncome: 0, maxIncome: 75000, rate: 18.5 },
        { minIncome: 75000, maxIncome: 125000, rate: 29 },
        { minIncome: 125000, maxIncome: 175000, rate: 33 },
        { minIncome: 175000, maxIncome: 225000, rate: 35 },
        { minIncome: 225000, maxIncome: 275000, rate: 37 },
        { minIncome: 275000, maxIncome: null, rate: 37.5 },
      ],
      effectiveDate: '2024-01-01',
      notes: 'Plus alternative minimum tax. Act 60 incentives available.',
    },
    withholdingTax: {
      dividends: 15,
      interest: 29,
      royalties: 29,
    },
    dtaPartners: [],
    transferPricingRules: {
      ...defaultUSTransferPricing,
      notes: 'PR follows US transfer pricing rules with local modifications.',
    },
    filingRequirements: defaultUSStateFilingReqs,
    taxIncentives: [
      {
        name: 'Act 60 Export Services',
        description: '4% fixed income tax rate for qualifying export services.',
        rateReduction: 33.5,
        eligibilityCriteria: ['Export services to non-PR clients', 'Physical presence in PR'],
      },
      {
        name: 'Act 60 Individual Investors',
        description: '0% tax on dividends, interest, and capital gains for bona fide residents.',
        eligibilityCriteria: ['Become bona fide PR resident', '183+ days presence'],
      },
    ],
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // GUAM
  // ---------------------------------------------------------------------------
  {
    code: 'US-GU',
    name: 'Guam',
    shortName: 'GU',
    type: JurisdictionType.US_TERRITORY,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en', 'ch'],
    flag: '🇬🇺',
    corporateTax: {
      standardRate: 21,
      effectiveDate: '2024-01-01',
      notes: 'Mirrors US federal corporate tax rate.',
    },
    withholdingTax: {
      dividends: 30,
      interest: 30,
      royalties: 30,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // US VIRGIN ISLANDS
  // ---------------------------------------------------------------------------
  {
    code: 'US-VI',
    name: 'U.S. Virgin Islands',
    shortName: 'VI',
    type: JurisdictionType.US_TERRITORY,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en'],
    flag: '🇻🇮',
    corporateTax: {
      standardRate: 23.1,
      effectiveDate: '2024-01-01',
      notes: 'Based on mirror code system with US IRC. Economic Development Commission benefits available.',
    },
    withholdingTax: {
      dividends: 30,
      interest: 30,
      royalties: 30,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    taxIncentives: [
      {
        name: 'Economic Development Commission (EDC) Benefits',
        description: '90% reduction in corporate income tax for qualifying businesses.',
        rateReduction: 90,
        eligibilityCriteria: ['EDC certification', 'Job creation requirements', 'Local hiring'],
      },
    ],
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // AMERICAN SAMOA
  // ---------------------------------------------------------------------------
  {
    code: 'US-AS',
    name: 'American Samoa',
    shortName: 'AS',
    type: JurisdictionType.US_TERRITORY,
    currency: 'USD',
    language: ['en', 'sm'],
    flag: '🇦🇸',
    corporateTax: {
      standardRate: 34,
      brackets: [
        { minIncome: 0, maxIncome: 50000, rate: 15 },
        { minIncome: 50000, maxIncome: 75000, rate: 25 },
        { minIncome: 75000, maxIncome: 100000, rate: 34 },
        { minIncome: 100000, maxIncome: null, rate: 34 },
      ],
      effectiveDate: '2024-01-01',
      notes: 'Independent tax system, not mirror code.',
    },
    withholdingTax: {
      dividends: 30,
      interest: 30,
      royalties: 30,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },

  // ---------------------------------------------------------------------------
  // NORTHERN MARIANA ISLANDS
  // ---------------------------------------------------------------------------
  {
    code: 'US-MP',
    name: 'Northern Mariana Islands',
    shortName: 'MP',
    type: JurisdictionType.US_TERRITORY,
    parentJurisdiction: 'US-FED',
    currency: 'USD',
    language: ['en', 'ch'],
    flag: '🇲🇵',
    corporateTax: {
      standardRate: 21,
      effectiveDate: '2024-01-01',
      notes: 'Mirrors US federal corporate tax rate.',
    },
    withholdingTax: {
      dividends: 30,
      interest: 30,
      royalties: 30,
    },
    dtaPartners: [],
    transferPricingRules: defaultUSTransferPricing,
    filingRequirements: defaultUSStateFilingReqs,
    lastUpdated: '2024-01-01',
  },
];

// =============================================================================
// US FEDERAL
// =============================================================================

export const US_FEDERAL: TaxJurisdictionFull = {
  code: 'US-FED',
  name: 'United States (Federal)',
  shortName: 'US',
  type: JurisdictionType.US_FEDERAL,
  currency: 'USD',
  language: ['en'],
  flag: '🇺🇸',
  corporateTax: {
    standardRate: 21,
    effectiveDate: '2018-01-01',
    notes: 'Flat 21% corporate tax rate since Tax Cuts and Jobs Act of 2017.',
  },
  withholdingTax: {
    dividends: 30,
    interest: 30,
    royalties: 30,
    technicalServices: 0,
    managementFees: 0,
  },
  dtaPartners: [], // Will be populated separately with full DTA network
  transferPricingRules: {
    documentationRequired: true,
    documentationThreshold: 0,
    masterFileRequired: false,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 850000000, // $850M
    preferredMethods: [
      TransferPricingMethod.CUP,
      TransferPricingMethod.RPM,
      TransferPricingMethod.CPM,
      TransferPricingMethod.TNMM,
      TransferPricingMethod.PSM,
    ],
    advancePricingAgreements: true,
    penaltyRate: 40,
    notes: 'IRC Section 482 governs transfer pricing. Contemporaneous documentation required.',
  },
  filingRequirements: [
    {
      filingType: 'Form 1120 - U.S. Corporation Income Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: '15th day of 4th month after fiscal year end',
      dueDaysAfterYearEnd: 105,
      extensionAvailable: true,
      extensionDays: 180,
      electronicFilingRequired: true,
      estimatedPaymentsRequired: true,
      estimatedPaymentSchedule: 'Quarterly: 15th of 4th, 6th, 9th, and 12th months of tax year',
    },
    {
      filingType: 'Form 5472 - Information Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'With Form 1120',
      extensionAvailable: true,
      extensionDays: 180,
      electronicFilingRequired: true,
      estimatedPaymentsRequired: false,
    },
  ],
  cfcRules: true,
  thinCapitalizationRules: true,
  interestDeductionLimit: 30, // 30% of ATI (EBITDA through 2025, then EBIT)
  lastUpdated: '2024-01-01',
};

// =============================================================================
// COMBINED EXPORT
// =============================================================================

export const ALL_US_JURISDICTIONS: TaxJurisdictionFull[] = [
  US_FEDERAL,
  ...US_STATES,
  ...US_TERRITORIES,
];

// Helper to get jurisdiction by code
export function getUSJurisdiction(code: string): TaxJurisdictionFull | undefined {
  return ALL_US_JURISDICTIONS.find(j => j.code === code);
}

// Get all states with no income tax
export function getNoIncomeTaxStates(): TaxJurisdictionFull[] {
  return US_STATES.filter(s => s.noIncomeTax === true);
}

// Get states by tax rate range
export function getStatesByTaxRate(minRate: number, maxRate: number): TaxJurisdictionFull[] {
  return US_STATES.filter(s => 
    s.corporateTax.standardRate >= minRate && 
    s.corporateTax.standardRate <= maxRate
  );
}
