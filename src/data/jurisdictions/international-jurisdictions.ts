// =============================================================================
// PRIMEBALANCE - INTERNATIONAL TAX JURISDICTIONS
// =============================================================================

import { 
  TaxJurisdictionFull, 
  JurisdictionType, 
  FilingFrequency,
  TransferPricingMethod,
  DTAPartner
} from '@/types/tax';

// =============================================================================
// MAJOR US DTA PARTNERS - Used across jurisdictions
// =============================================================================

const createDTAWithUS = (overrides: Partial<DTAPartner> = {}): DTAPartner => ({
  partnerJurisdictionCode: 'US-FED',
  partnerJurisdictionName: 'United States',
  treatyYear: 1980,
  dividendsRate: 15,
  dividendsParticipationRate: 5,
  participationThreshold: 10,
  interestRate: 0,
  royaltiesRate: 0,
  capitalGainsExempt: true,
  limitationOnBenefits: true,
  mliBeneficiary: false,
  ...overrides,
});

// =============================================================================
// NORTH AMERICA
// =============================================================================

export const CANADA: TaxJurisdictionFull = {
  code: 'CA',
  name: 'Canada',
  shortName: 'CA',
  type: JurisdictionType.COUNTRY,
  currency: 'CAD',
  language: ['en', 'fr'],
  flag: '🇨🇦',
  corporateTax: {
    standardRate: 26.5,
    brackets: [
      { minIncome: 0, maxIncome: 500000, rate: 12.2, fixedAmount: 0 }, // Small business deduction (federal)
      { minIncome: 500000, maxIncome: null, rate: 26.5 },
    ],
    smallBusinessRate: 12.2,
    smallBusinessThreshold: 500000,
    effectiveDate: '2024-01-01',
    notes: 'Combined federal (15%) + average provincial rate (11.5%). Small business rate available for CCPCs.',
  },
  withholdingTax: {
    dividends: 25,
    interest: 25,
    royalties: 25,
    managementFees: 25,
  },
  dtaPartners: [
    {
      partnerJurisdictionCode: 'US-FED',
      partnerJurisdictionName: 'United States',
      treatyYear: 1980,
      dividendsRate: 15,
      dividendsParticipationRate: 5,
      participationThreshold: 10,
      interestRate: 0,
      royaltiesRate: 0,
      technicalServicesRate: 0,
      capitalGainsExempt: true,
      limitationOnBenefits: true,
      mliBeneficiary: true,
      notes: 'Fifth Protocol to Canada-US Treaty provides for 0% withholding on interest.',
    },
    {
      partnerJurisdictionCode: 'DE',
      partnerJurisdictionName: 'Germany',
      treatyYear: 2001,
      dividendsRate: 15,
      dividendsParticipationRate: 5,
      participationThreshold: 10,
      interestRate: 10,
      royaltiesRate: 10,
      capitalGainsExempt: true,
      limitationOnBenefits: false,
      mliBeneficiary: true,
    },
    {
      partnerJurisdictionCode: 'GB',
      partnerJurisdictionName: 'United Kingdom',
      treatyYear: 1978,
      dividendsRate: 15,
      dividendsParticipationRate: 5,
      participationThreshold: 10,
      interestRate: 10,
      royaltiesRate: 10,
      capitalGainsExempt: true,
      limitationOnBenefits: false,
      mliBeneficiary: true,
    },
  ],
  transferPricingRules: {
    documentationRequired: true,
    documentationThreshold: 0,
    masterFileRequired: true,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 750000000, // €750M equivalent
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.TNMM, TransferPricingMethod.PSM],
    advancePricingAgreements: true,
    penaltyRate: 10,
    notes: 'Section 247 of Income Tax Act. Transfer pricing penalty of 10% on adjustment.',
  },
  filingRequirements: [
    {
      filingType: 'T2 Corporation Income Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: '6 months after fiscal year end',
      dueDaysAfterYearEnd: 180,
      extensionAvailable: false,
      extensionDays: 0,
      electronicFilingRequired: true,
      estimatedPaymentsRequired: true,
      estimatedPaymentSchedule: 'Monthly installments for large corporations',
    },
  ],
  cfcRules: true,
  territorialSystem: false,
  thinCapitalizationRules: true,
  debtEquityRatio: 1.5,
  lastUpdated: '2024-01-01',
};

export const MEXICO: TaxJurisdictionFull = {
  code: 'MX',
  name: 'Mexico',
  shortName: 'MX',
  type: JurisdictionType.COUNTRY,
  currency: 'MXN',
  language: ['es'],
  flag: '🇲🇽',
  corporateTax: {
    standardRate: 30,
    effectiveDate: '2024-01-01',
    notes: 'Flat 30% corporate rate. Additional 10% on profit distributions to non-residents.',
  },
  withholdingTax: {
    dividends: 10,
    interest: 35,
    royalties: 35,
    technicalServices: 25,
  },
  dtaPartners: [
    {
      partnerJurisdictionCode: 'US-FED',
      partnerJurisdictionName: 'United States',
      treatyYear: 1992,
      dividendsRate: 10,
      dividendsParticipationRate: 5,
      participationThreshold: 10,
      interestRate: 15,
      royaltiesRate: 10,
      capitalGainsExempt: true,
      limitationOnBenefits: true,
      mliBeneficiary: true,
      notes: 'Protocol modifications in 2002 and 2013.',
    },
  ],
  transferPricingRules: {
    documentationRequired: true,
    documentationThreshold: 0,
    masterFileRequired: true,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 12000000000, // MXN ~$700M
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.CPM, TransferPricingMethod.TNMM],
    advancePricingAgreements: true,
    penaltyRate: 55,
    notes: 'Strict documentation requirements. Master file must be in Spanish.',
  },
  filingRequirements: [
    {
      filingType: 'Declaración Anual de ISR',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'March 31',
      dueDaysAfterYearEnd: 90,
      extensionAvailable: false,
      extensionDays: 0,
      electronicFilingRequired: true,
      estimatedPaymentsRequired: true,
      estimatedPaymentSchedule: 'Monthly provisional payments',
    },
  ],
  cfcRules: true,
  thinCapitalizationRules: true,
  debtEquityRatio: 3,
  lastUpdated: '2024-01-01',
};

// =============================================================================
// EUROPE
// =============================================================================

export const GERMANY: TaxJurisdictionFull = {
  code: 'DE',
  name: 'Germany',
  shortName: 'DE',
  type: JurisdictionType.COUNTRY,
  currency: 'EUR',
  language: ['de'],
  flag: '🇩🇪',
  corporateTax: {
    standardRate: 29.83,
    effectiveDate: '2024-01-01',
    notes: 'Corporate income tax 15% + solidarity surcharge 5.5% + trade tax ~14% (varies by municipality).',
  },
  withholdingTax: {
    dividends: 26.375,
    interest: 0,
    royalties: 15.825,
    managementFees: 0,
  },
  dtaPartners: [
    {
      partnerJurisdictionCode: 'US-FED',
      partnerJurisdictionName: 'United States',
      treatyYear: 1989,
      dividendsRate: 15,
      dividendsParticipationRate: 5,
      participationThreshold: 10,
      interestRate: 0,
      royaltiesRate: 0,
      capitalGainsExempt: true,
      limitationOnBenefits: true,
      mliBeneficiary: true,
      notes: 'Protocol 2006 provides reduced rates.',
    },
    {
      partnerJurisdictionCode: 'CH',
      partnerJurisdictionName: 'Switzerland',
      treatyYear: 1971,
      dividendsRate: 15,
      dividendsParticipationRate: 0,
      participationThreshold: 10,
      interestRate: 0,
      royaltiesRate: 0,
      capitalGainsExempt: true,
      limitationOnBenefits: false,
      mliBeneficiary: true,
    },
  ],
  transferPricingRules: {
    documentationRequired: true,
    documentationThreshold: 5000000,
    masterFileRequired: true,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 750000000,
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.TNMM, TransferPricingMethod.CPM],
    advancePricingAgreements: true,
    penaltyRate: 0,
    notes: 'Strict documentation deadlines. Documentation must be prepared within 30 days upon request.',
  },
  filingRequirements: [
    {
      filingType: 'Körperschaftsteuererklärung',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'July 31 of following year (with tax advisor: February 28/29 of second following year)',
      dueDaysAfterYearEnd: 212,
      extensionAvailable: true,
      extensionDays: 180,
      electronicFilingRequired: true,
      estimatedPaymentsRequired: true,
      estimatedPaymentSchedule: 'Quarterly: March 10, June 10, September 10, December 10',
    },
  ],
  cfcRules: true,
  thinCapitalizationRules: true,
  interestDeductionLimit: 30, // 30% of EBITDA
  lastUpdated: '2024-01-01',
};

export const SWITZERLAND: TaxJurisdictionFull = {
  code: 'CH',
  name: 'Switzerland',
  shortName: 'CH',
  type: JurisdictionType.COUNTRY,
  currency: 'CHF',
  language: ['de', 'fr', 'it'],
  flag: '🇨🇭',
  corporateTax: {
    standardRate: 14.6,
    brackets: [
      { minIncome: 0, maxIncome: null, rate: 14.6 }, // Average effective rate
    ],
    effectiveDate: '2024-01-01',
    notes: 'Federal rate 8.5% on profit after tax + cantonal/communal taxes vary (11-21%). Effective rates 11.9%-21.6%.',
  },
  withholdingTax: {
    dividends: 35,
    interest: 35,
    royalties: 0,
  },
  dtaPartners: [
    {
      partnerJurisdictionCode: 'US-FED',
      partnerJurisdictionName: 'United States',
      treatyYear: 1996,
      dividendsRate: 15,
      dividendsParticipationRate: 5,
      participationThreshold: 10,
      interestRate: 0,
      royaltiesRate: 0,
      capitalGainsExempt: true,
      limitationOnBenefits: true,
      mliBeneficiary: false,
      notes: 'Protocol 2009 added extensive LOB provisions.',
    },
  ],
  transferPricingRules: {
    documentationRequired: true,
    documentationThreshold: 0,
    masterFileRequired: true,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 900000000, // CHF
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.TNMM, TransferPricingMethod.CPM],
    advancePricingAgreements: true,
    notes: 'Documentation not legally required but strongly recommended. OECD Guidelines followed.',
  },
  filingRequirements: [
    {
      filingType: 'Corporate Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'Varies by canton, typically 6-9 months after year end',
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
  debtEquityRatio: 6, // Safe harbor debt-to-equity for holding companies
  taxIncentives: [
    {
      name: 'Participation Exemption',
      description: '100% exemption for qualifying dividends and capital gains from participations.',
      eligibilityCriteria: ['10% ownership or CHF 1M investment', 'Holding for minimum 1 year'],
    },
    {
      name: 'Patent Box',
      description: 'Up to 90% reduction on income from qualifying IP.',
      rateReduction: 90,
      eligibilityCriteria: ['Patents and similar rights', 'R&D nexus requirement'],
    },
    {
      name: 'R&D Super Deduction',
      description: 'Up to 150% deduction for qualifying R&D expenses.',
      eligibilityCriteria: ['Qualifying R&D activities in Switzerland'],
    },
  ],
  lastUpdated: '2024-01-01',
};

export const UNITED_KINGDOM: TaxJurisdictionFull = {
  code: 'GB',
  name: 'United Kingdom',
  shortName: 'UK',
  type: JurisdictionType.COUNTRY,
  currency: 'GBP',
  language: ['en'],
  flag: '🇬🇧',
  corporateTax: {
    standardRate: 25,
    brackets: [
      { minIncome: 0, maxIncome: 50000, rate: 19 },
      { minIncome: 50000, maxIncome: 250000, rate: 26.5 }, // Marginal relief
      { minIncome: 250000, maxIncome: null, rate: 25 },
    ],
    smallBusinessRate: 19,
    smallBusinessThreshold: 50000,
    effectiveDate: '2024-04-01',
    notes: 'Main rate 25% for profits over £250,000. Small profits rate 19% for profits up to £50,000.',
  },
  withholdingTax: {
    dividends: 0,
    interest: 20,
    royalties: 20,
  },
  dtaPartners: [
    {
      partnerJurisdictionCode: 'US-FED',
      partnerJurisdictionName: 'United States',
      treatyYear: 2001,
      dividendsRate: 15,
      dividendsParticipationRate: 0,
      participationThreshold: 10,
      interestRate: 0,
      royaltiesRate: 0,
      capitalGainsExempt: true,
      limitationOnBenefits: true,
      mliBeneficiary: true,
      notes: '2001 Treaty with 2002 Protocol.',
    },
  ],
  transferPricingRules: {
    documentationRequired: true,
    documentationThreshold: 0,
    masterFileRequired: true,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 750000000, // EUR equivalent
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.TNMM],
    advancePricingAgreements: true,
    notes: 'Schedule 7AA TIOPA 2010. Senior Accounting Officer regime for large companies.',
  },
  filingRequirements: [
    {
      filingType: 'CT600 Corporation Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: '12 months after accounting period end',
      dueDaysAfterYearEnd: 365,
      extensionAvailable: false,
      extensionDays: 0,
      electronicFilingRequired: true,
      estimatedPaymentsRequired: true,
      estimatedPaymentSchedule: 'Quarterly instalments for large companies',
    },
  ],
  cfcRules: true,
  thinCapitalizationRules: true,
  interestDeductionLimit: 30, // Corporate interest restriction
  taxIncentives: [
    {
      name: 'R&D Tax Relief',
      description: 'Enhanced deduction of 86% for qualifying R&D (merged scheme from April 2024).',
      eligibilityCriteria: ['Qualifying R&D activities', 'Staff costs, consumables, software'],
    },
    {
      name: 'Patent Box',
      description: '10% rate on profits from qualifying patents.',
      rateReduction: 15,
      eligibilityCriteria: ['Patents granted by qualifying IP office', 'Development condition'],
    },
  ],
  lastUpdated: '2024-01-01',
};

export const IRELAND: TaxJurisdictionFull = {
  code: 'IE',
  name: 'Ireland',
  shortName: 'IE',
  type: JurisdictionType.COUNTRY,
  currency: 'EUR',
  language: ['en', 'ga'],
  flag: '🇮🇪',
  corporateTax: {
    standardRate: 15,
    brackets: [
      { minIncome: 0, maxIncome: 750000, rate: 12.5 }, // Trading income
      { minIncome: 750000, maxIncome: null, rate: 15 }, // Above threshold (Pillar 2)
    ],
    effectiveDate: '2024-01-01',
    notes: '12.5% for trading income under €750k, 15% for large groups (Pillar 2). 25% for passive income.',
  },
  withholdingTax: {
    dividends: 25,
    interest: 20,
    royalties: 20,
  },
  dtaPartners: [
    createDTAWithUS({ treatyYear: 1997, interestRate: 0, royaltiesRate: 0 }),
  ],
  transferPricingRules: {
    documentationRequired: true,
    documentationThreshold: 0,
    masterFileRequired: true,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 750000000,
    preferredMethods: [TransferPricingMethod.TNMM, TransferPricingMethod.CUP],
    advancePricingAgreements: true,
    notes: 'Part 35A TCA 1997. OECD Guidelines apply.',
  },
  filingRequirements: [
    {
      filingType: 'CT1 Corporation Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: '9 months after accounting period end',
      dueDaysAfterYearEnd: 270,
      extensionAvailable: false,
      extensionDays: 0,
      electronicFilingRequired: true,
      estimatedPaymentsRequired: true,
      estimatedPaymentSchedule: 'Preliminary tax in month 6 and month 11',
    },
  ],
  cfcRules: true,
  taxIncentives: [
    {
      name: 'Knowledge Development Box (KDB)',
      description: '6.25% rate on qualifying IP income.',
      rateReduction: 6.25,
      eligibilityCriteria: ['Qualifying IP', 'R&D nexus'],
    },
    {
      name: 'R&D Tax Credit',
      description: '30% refundable tax credit for qualifying R&D.',
      eligibilityCriteria: ['Systematic, investigative activities', 'Scientific or technological advancement'],
    },
  ],
  lastUpdated: '2024-01-01',
};

export const NETHERLANDS: TaxJurisdictionFull = {
  code: 'NL',
  name: 'Netherlands',
  shortName: 'NL',
  type: JurisdictionType.COUNTRY,
  currency: 'EUR',
  language: ['nl'],
  flag: '🇳🇱',
  corporateTax: {
    standardRate: 25.8,
    brackets: [
      { minIncome: 0, maxIncome: 200000, rate: 19 },
      { minIncome: 200000, maxIncome: null, rate: 25.8 },
    ],
    effectiveDate: '2024-01-01',
    notes: '19% on first €200,000, 25.8% on excess.',
  },
  withholdingTax: {
    dividends: 15,
    interest: 0,
    royalties: 0,
  },
  dtaPartners: [
    createDTAWithUS({ treatyYear: 1992, dividendsParticipationRate: 0, interestRate: 0, royaltiesRate: 0 }),
  ],
  transferPricingRules: {
    documentationRequired: true,
    documentationThreshold: 0,
    masterFileRequired: true,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 750000000,
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.TNMM],
    advancePricingAgreements: true,
    notes: 'Article 8b Corporate Income Tax Act. Decree provides detailed guidance.',
  },
  filingRequirements: [
    {
      filingType: 'Vpb-aangifte',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: '5 months after fiscal year end',
      dueDaysAfterYearEnd: 150,
      extensionAvailable: true,
      extensionDays: 300,
      electronicFilingRequired: true,
      estimatedPaymentsRequired: true,
    },
  ],
  cfcRules: true,
  thinCapitalizationRules: true,
  interestDeductionLimit: 20, // 20% of EBITDA from 2025
  taxIncentives: [
    {
      name: 'Participation Exemption',
      description: '100% exemption for qualifying dividends and capital gains.',
      eligibilityCriteria: ['5% shareholding', 'Subject to tax test or asset test'],
    },
    {
      name: 'Innovation Box',
      description: '9% rate on qualifying IP income.',
      rateReduction: 16.8,
      eligibilityCriteria: ['Self-developed IP', 'R&D statement or patent'],
    },
  ],
  lastUpdated: '2024-01-01',
};

export const LUXEMBOURG: TaxJurisdictionFull = {
  code: 'LU',
  name: 'Luxembourg',
  shortName: 'LU',
  type: JurisdictionType.COUNTRY,
  currency: 'EUR',
  language: ['fr', 'de', 'lb'],
  flag: '🇱🇺',
  corporateTax: {
    standardRate: 24.94,
    effectiveDate: '2024-01-01',
    notes: 'Corporate income tax 17% + municipal business tax 6.75% (Luxembourg City) + solidarity surcharge = ~24.94%.',
  },
  withholdingTax: {
    dividends: 15,
    interest: 0,
    royalties: 0,
  },
  dtaPartners: [
    createDTAWithUS({ treatyYear: 1996, dividendsParticipationRate: 5, interestRate: 0, royaltiesRate: 0 }),
  ],
  transferPricingRules: {
    documentationRequired: true,
    documentationThreshold: 0,
    masterFileRequired: true,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 750000000,
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.TNMM],
    advancePricingAgreements: true,
    notes: 'Circular L.I.R. 56/1 - 56bis/1. OECD Guidelines followed.',
  },
  filingRequirements: [
    {
      filingType: 'Corporate Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'May 31 of following year',
      dueDaysAfterYearEnd: 150,
      extensionAvailable: true,
      extensionDays: 180,
      electronicFilingRequired: false,
      estimatedPaymentsRequired: true,
      estimatedPaymentSchedule: 'Quarterly advance payments',
    },
  ],
  cfcRules: false,
  thinCapitalizationRules: true,
  debtEquityRatio: 1,
  taxIncentives: [
    {
      name: 'Participation Exemption',
      description: '100% exemption for qualifying dividends and capital gains.',
      eligibilityCriteria: ['10% shareholding or €1.2M acquisition price', '12-month holding period'],
    },
    {
      name: 'IP Regime',
      description: '80% exemption for qualifying IP income (5.2% effective rate).',
      rateReduction: 80,
      eligibilityCriteria: ['Patents, copyrighted software, brands', 'Nexus approach'],
    },
  ],
  lastUpdated: '2024-01-01',
};

// =============================================================================
// ASIA-PACIFIC
// =============================================================================

export const SINGAPORE: TaxJurisdictionFull = {
  code: 'SG',
  name: 'Singapore',
  shortName: 'SG',
  type: JurisdictionType.COUNTRY,
  currency: 'SGD',
  language: ['en', 'zh', 'ms', 'ta'],
  flag: '🇸🇬',
  corporateTax: {
    standardRate: 17,
    effectiveDate: '2024-01-01',
    notes: 'Flat 17% rate. Partial tax exemption for first S$200,000. No capital gains tax.',
  },
  withholdingTax: {
    dividends: 0,
    interest: 15,
    royalties: 10,
    technicalServices: 17,
  },
  dtaPartners: [
    createDTAWithUS({ treatyYear: 1996, interestRate: 0, royaltiesRate: 0 }),
  ],
  transferPricingRules: {
    documentationRequired: true,
    documentationThreshold: 10000000, // S$10M related party transactions
    masterFileRequired: true,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 1125000000, // S$1.125B
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.TNMM, TransferPricingMethod.PSM],
    advancePricingAgreements: true,
    notes: 'Section 34D ITA. e-Tax Guide provides detailed guidance.',
  },
  filingRequirements: [
    {
      filingType: 'Form C-S/C',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'November 30',
      extensionAvailable: true,
      extensionDays: 15,
      electronicFilingRequired: true,
      estimatedPaymentsRequired: true,
      estimatedPaymentSchedule: 'Estimated Chargeable Income due 3 months after year end',
    },
  ],
  territorialSystem: true,
  cfcRules: false,
  taxIncentives: [
    {
      name: 'Pioneer Certificate Incentive',
      description: '5-15% concessionary tax rate for 5-15 years.',
      rateReduction: 12,
      eligibilityCriteria: ['Pioneer industry', 'Significant economic contributions'],
    },
    {
      name: 'Development & Expansion Incentive',
      description: '5% concessionary tax rate on incremental income.',
      rateReduction: 12,
      eligibilityCriteria: ['Expansion plans', 'Job creation'],
    },
    {
      name: 'Global/Regional Headquarters',
      description: '5-10% concessionary rate for qualifying HQ income.',
      rateReduction: 12,
      eligibilityCriteria: ['HQ activities', 'Employment requirements'],
    },
  ],
  lastUpdated: '2024-01-01',
};

export const HONG_KONG: TaxJurisdictionFull = {
  code: 'HK',
  name: 'Hong Kong',
  shortName: 'HK',
  type: JurisdictionType.SPECIAL_ZONE,
  currency: 'HKD',
  language: ['zh', 'en'],
  flag: '🇭🇰',
  corporateTax: {
    standardRate: 16.5,
    brackets: [
      { minIncome: 0, maxIncome: 2000000, rate: 8.25 },
      { minIncome: 2000000, maxIncome: null, rate: 16.5 },
    ],
    effectiveDate: '2024-01-01',
    notes: '8.25% on first HK$2M, 16.5% on excess. Territorial system - only HK-sourced income taxed.',
  },
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 4.95, // 30% of 16.5%
  },
  dtaPartners: [
    // No comprehensive treaty with US, but multiple other treaties
  ],
  transferPricingRules: {
    documentationRequired: true,
    documentationThreshold: 0,
    masterFileRequired: true,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 6800000000, // HK$6.8B
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.TNMM],
    advancePricingAgreements: true,
    notes: 'Inland Revenue (Amendment) (No. 6) Ordinance 2018. OECD Guidelines followed.',
  },
  filingRequirements: [
    {
      filingType: 'Profits Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: '1 month from issue date (typically April)',
      extensionAvailable: true,
      extensionDays: 90,
      electronicFilingRequired: false,
      estimatedPaymentsRequired: true,
    },
  ],
  territorialSystem: true,
  cfcRules: false,
  lastUpdated: '2024-01-01',
};

export const CHINA: TaxJurisdictionFull = {
  code: 'CN',
  name: 'China',
  shortName: 'CN',
  type: JurisdictionType.COUNTRY,
  currency: 'CNY',
  language: ['zh'],
  flag: '🇨🇳',
  corporateTax: {
    standardRate: 25,
    brackets: [
      { minIncome: 0, maxIncome: 3000000, rate: 5 }, // Small low-profit enterprises
      { minIncome: 3000000, maxIncome: null, rate: 25 },
    ],
    smallBusinessRate: 5,
    smallBusinessThreshold: 3000000,
    effectiveDate: '2024-01-01',
    notes: '25% standard rate. 15% for High-Tech enterprises. 5% effective rate for small enterprises.',
  },
  withholdingTax: {
    dividends: 10,
    interest: 10,
    royalties: 10,
    technicalServices: 10,
  },
  dtaPartners: [
    {
      partnerJurisdictionCode: 'US-FED',
      partnerJurisdictionName: 'United States',
      treatyYear: 1984,
      dividendsRate: 10,
      dividendsParticipationRate: 10,
      interestRate: 10,
      royaltiesRate: 10,
      capitalGainsExempt: true,
      limitationOnBenefits: false,
      mliBeneficiary: true,
      notes: 'Protocol amendments in 1986.',
    },
  ],
  transferPricingRules: {
    documentationRequired: true,
    documentationThreshold: 0,
    masterFileRequired: true,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 5500000000, // RMB 5.5B
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.TNMM, TransferPricingMethod.CPM],
    advancePricingAgreements: true,
    penaltyRate: 5,
    notes: 'Announcement 42 (2016). Contemporaneous documentation required annually.',
  },
  filingRequirements: [
    {
      filingType: 'Enterprise Income Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'May 31',
      dueDaysAfterYearEnd: 150,
      extensionAvailable: false,
      extensionDays: 0,
      electronicFilingRequired: true,
      estimatedPaymentsRequired: true,
      estimatedPaymentSchedule: 'Monthly or quarterly prepayments within 15 days',
    },
  ],
  cfcRules: true,
  thinCapitalizationRules: true,
  debtEquityRatio: 2, // 5:1 for financial enterprises
  taxIncentives: [
    {
      name: 'High and New Technology Enterprise',
      description: '15% reduced rate for qualifying high-tech companies.',
      rateReduction: 10,
      eligibilityCriteria: ['IP ownership', 'R&D percentage', 'Revenue from high-tech products'],
    },
    {
      name: 'R&D Super Deduction',
      description: '200% deduction for qualifying R&D expenses.',
      eligibilityCriteria: ['Qualifying R&D activities', 'Proper documentation'],
    },
  ],
  freeTradeZones: ['Shanghai FTZ', 'Shenzhen Special Economic Zone', 'Hainan FTP'],
  lastUpdated: '2024-01-01',
};

export const JAPAN: TaxJurisdictionFull = {
  code: 'JP',
  name: 'Japan',
  shortName: 'JP',
  type: JurisdictionType.COUNTRY,
  currency: 'JPY',
  language: ['ja'],
  flag: '🇯🇵',
  corporateTax: {
    standardRate: 29.74,
    effectiveDate: '2024-01-01',
    notes: 'National corporate tax 23.2% + local taxes. Effective rate ~29.74% in Tokyo.',
  },
  withholdingTax: {
    dividends: 20.42,
    interest: 20.42,
    royalties: 20.42,
  },
  dtaPartners: [
    createDTAWithUS({ treatyYear: 2003, dividendsParticipationRate: 0, interestRate: 0, royaltiesRate: 0 }),
  ],
  transferPricingRules: {
    documentationRequired: true,
    documentationThreshold: 0,
    masterFileRequired: true,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 100000000000, // ¥100B
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.RPM, TransferPricingMethod.CPM],
    advancePricingAgreements: true,
    notes: 'Special Taxation Measures Law Article 66-4. Contemporaneous documentation required.',
  },
  filingRequirements: [
    {
      filingType: 'Corporate Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: '2 months after fiscal year end',
      dueDaysAfterYearEnd: 60,
      extensionAvailable: true,
      extensionDays: 30,
      electronicFilingRequired: true,
      estimatedPaymentsRequired: true,
      estimatedPaymentSchedule: 'Interim return at 6 months',
    },
  ],
  cfcRules: true,
  thinCapitalizationRules: true,
  debtEquityRatio: 3,
  lastUpdated: '2024-01-01',
};

export const SOUTH_KOREA: TaxJurisdictionFull = {
  code: 'KR',
  name: 'South Korea',
  shortName: 'KR',
  type: JurisdictionType.COUNTRY,
  currency: 'KRW',
  language: ['ko'],
  flag: '🇰🇷',
  corporateTax: {
    standardRate: 24,
    brackets: [
      { minIncome: 0, maxIncome: 200000000, rate: 9 }, // KRW 200M
      { minIncome: 200000000, maxIncome: 20000000000, rate: 19 },
      { minIncome: 20000000000, maxIncome: 300000000000, rate: 21 },
      { minIncome: 300000000000, maxIncome: null, rate: 24 },
    ],
    effectiveDate: '2024-01-01',
    notes: 'Plus 10% local income tax surtax on corporate tax.',
  },
  withholdingTax: {
    dividends: 20,
    interest: 20,
    royalties: 20,
  },
  dtaPartners: [
    createDTAWithUS({ treatyYear: 1976, dividendsRate: 15, dividendsParticipationRate: 10, interestRate: 12, royaltiesRate: 15 }),
  ],
  transferPricingRules: {
    documentationRequired: true,
    documentationThreshold: 0,
    masterFileRequired: true,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 1000000000000, // KRW 1T
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.TNMM],
    advancePricingAgreements: true,
    notes: 'Law for Coordination of International Tax Affairs. Strict contemporaneous documentation.',
  },
  filingRequirements: [
    {
      filingType: 'Corporate Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: '3 months after fiscal year end',
      dueDaysAfterYearEnd: 90,
      extensionAvailable: true,
      extensionDays: 30,
      electronicFilingRequired: true,
      estimatedPaymentsRequired: true,
      estimatedPaymentSchedule: 'Interim prepayment within 2 months after mid-year',
    },
  ],
  cfcRules: true,
  thinCapitalizationRules: true,
  debtEquityRatio: 2, // 6:1 for financial institutions
  lastUpdated: '2024-01-01',
};

export const INDIA: TaxJurisdictionFull = {
  code: 'IN',
  name: 'India',
  shortName: 'IN',
  type: JurisdictionType.COUNTRY,
  currency: 'INR',
  language: ['hi', 'en'],
  flag: '🇮🇳',
  corporateTax: {
    standardRate: 25.17,
    brackets: [
      { minIncome: 0, maxIncome: null, rate: 25.17 }, // Domestic with turnover > 400 crore
    ],
    smallBusinessRate: 25.17,
    effectiveDate: '2024-01-01',
    notes: '22% + surcharge + cess for new manufacturing. 25% + surcharge + cess for others. 40% + surcharges for foreign companies.',
  },
  withholdingTax: {
    dividends: 20,
    interest: 40,
    royalties: 10,
    technicalServices: 10,
  },
  dtaPartners: [
    {
      partnerJurisdictionCode: 'US-FED',
      partnerJurisdictionName: 'United States',
      treatyYear: 1989,
      dividendsRate: 25,
      dividendsParticipationRate: 15,
      participationThreshold: 10,
      interestRate: 15,
      royaltiesRate: 15,
      technicalServicesRate: 15,
      capitalGainsExempt: false,
      limitationOnBenefits: true,
      mliBeneficiary: true,
      notes: 'Protocol 2005. General anti-avoidance rules (GAAR) apply.',
    },
  ],
  transferPricingRules: {
    documentationRequired: true,
    documentationThreshold: 10000000, // INR 1 crore
    masterFileRequired: true,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 55000000000, // INR 5,500 crore
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.TNMM, TransferPricingMethod.PSM],
    advancePricingAgreements: true,
    penaltyRate: 200, // 100-300% of tax on adjustment
    notes: 'Sections 92-92F of Income Tax Act. Accountant Report required. Safe harbour rules available.',
  },
  filingRequirements: [
    {
      filingType: 'ITR-6',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'October 31 (November 30 for transfer pricing cases)',
      dueDaysAfterYearEnd: 213,
      extensionAvailable: false,
      extensionDays: 0,
      electronicFilingRequired: true,
      estimatedPaymentsRequired: true,
      estimatedPaymentSchedule: 'Advance tax: June 15, September 15, December 15, March 15',
    },
  ],
  cfcRules: false, // POEM rules instead
  thinCapitalizationRules: true,
  interestDeductionLimit: 30,
  taxIncentives: [
    {
      name: 'Section 115BAB - New Manufacturing',
      description: '15% concessionary rate for new manufacturing companies.',
      rateReduction: 10,
      eligibilityCriteria: ['Incorporated after Oct 1, 2019', 'Commence manufacturing by Mar 31, 2024', 'No other incentives'],
    },
    {
      name: 'Special Economic Zones',
      description: '100% deduction for first 5 years, 50% for next 5 years.',
      exemptionYears: 10,
      eligibilityCriteria: ['Unit in SEZ', 'Export income'],
    },
  ],
  lastUpdated: '2024-01-01',
};

export const AUSTRALIA: TaxJurisdictionFull = {
  code: 'AU',
  name: 'Australia',
  shortName: 'AU',
  type: JurisdictionType.COUNTRY,
  currency: 'AUD',
  language: ['en'],
  flag: '🇦🇺',
  corporateTax: {
    standardRate: 30,
    smallBusinessRate: 25,
    smallBusinessThreshold: 50000000, // A$50M turnover
    effectiveDate: '2024-01-01',
    notes: '30% for large companies, 25% for base rate entities (turnover < A$50M).',
  },
  withholdingTax: {
    dividends: 30, // Franking credit system
    interest: 10,
    royalties: 30,
  },
  dtaPartners: [
    createDTAWithUS({ treatyYear: 1982, dividendsRate: 15, dividendsParticipationRate: 5, interestRate: 10, royaltiesRate: 5 }),
  ],
  transferPricingRules: {
    documentationRequired: true,
    documentationThreshold: 2000000, // A$2M international related party dealings
    masterFileRequired: true,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 1000000000, // A$1B
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.TNMM],
    advancePricingAgreements: true,
    notes: 'Division 815 ITAA 1997. Reconstruction powers available to ATO.',
  },
  filingRequirements: [
    {
      filingType: 'Company Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'February 28 (May 15 for tax agents)',
      dueDaysAfterYearEnd: 60,
      extensionAvailable: true,
      extensionDays: 75,
      electronicFilingRequired: true,
      estimatedPaymentsRequired: true,
      estimatedPaymentSchedule: 'PAYG instalments quarterly',
    },
  ],
  cfcRules: true,
  thinCapitalizationRules: true,
  debtEquityRatio: 1.5, // Safe harbour
  taxIncentives: [
    {
      name: 'R&D Tax Incentive',
      description: '43.5% refundable offset for SMEs, 38.5% non-refundable for large companies.',
      eligibilityCriteria: ['Eligible R&D activities', 'Registered with AusIndustry'],
    },
  ],
  lastUpdated: '2024-01-01',
};

// =============================================================================
// MIDDLE EAST
// =============================================================================

export const UAE: TaxJurisdictionFull = {
  code: 'AE',
  name: 'United Arab Emirates',
  shortName: 'UAE',
  type: JurisdictionType.COUNTRY,
  currency: 'AED',
  language: ['ar', 'en'],
  flag: '🇦🇪',
  corporateTax: {
    standardRate: 9,
    brackets: [
      { minIncome: 0, maxIncome: 375000, rate: 0 },
      { minIncome: 375000, maxIncome: null, rate: 9 },
    ],
    effectiveDate: '2023-06-01',
    notes: '0% on first AED 375,000, 9% on excess. Free zone companies may qualify for 0%.',
  },
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
  },
  dtaPartners: [], // No treaty with US
  transferPricingRules: {
    documentationRequired: true,
    documentationThreshold: 0,
    masterFileRequired: true,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 3150000000, // AED 3.15B
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.TNMM],
    advancePricingAgreements: false,
    notes: 'New transfer pricing rules effective with corporate tax. OECD Guidelines followed.',
  },
  filingRequirements: [
    {
      filingType: 'Corporate Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: '9 months after fiscal year end',
      dueDaysAfterYearEnd: 270,
      extensionAvailable: false,
      extensionDays: 0,
      electronicFilingRequired: true,
      estimatedPaymentsRequired: false,
    },
  ],
  territorialSystem: false,
  cfcRules: false,
  taxIncentives: [
    {
      name: 'Qualifying Free Zone Person',
      description: '0% tax rate for qualifying income from free zone activities.',
      rateReduction: 9,
      eligibilityCriteria: ['Free zone entity', 'Qualifying income', 'Substance requirements'],
    },
    {
      name: 'Small Business Relief',
      description: '0% tax for businesses with revenue under AED 3M.',
      eligibilityCriteria: ['Revenue below AED 3M', 'Election made'],
    },
  ],
  freeTradeZones: ['DIFC', 'ADGM', 'Jebel Ali', 'DMCC', 'Dubai Internet City'],
  lastUpdated: '2024-01-01',
};

// =============================================================================
// COMBINED EXPORT
// =============================================================================

export const INTERNATIONAL_JURISDICTIONS: TaxJurisdictionFull[] = [
  // North America
  CANADA,
  MEXICO,
  
  // Europe
  GERMANY,
  SWITZERLAND,
  UNITED_KINGDOM,
  IRELAND,
  NETHERLANDS,
  LUXEMBOURG,
  
  // Asia-Pacific
  SINGAPORE,
  HONG_KONG,
  CHINA,
  JAPAN,
  SOUTH_KOREA,
  INDIA,
  AUSTRALIA,
  
  // Middle East
  UAE,
];

// Helper functions
export function getInternationalJurisdiction(code: string): TaxJurisdictionFull | undefined {
  return INTERNATIONAL_JURISDICTIONS.find(j => j.code === code);
}

export function getJurisdictionsByRegion(region: 'NORTH_AMERICA' | 'EUROPE' | 'ASIA_PACIFIC' | 'MIDDLE_EAST'): TaxJurisdictionFull[] {
  const regionMap: Record<string, string[]> = {
    NORTH_AMERICA: ['CA', 'MX'],
    EUROPE: ['DE', 'CH', 'GB', 'IE', 'NL', 'LU'],
    ASIA_PACIFIC: ['SG', 'HK', 'CN', 'JP', 'KR', 'IN', 'AU'],
    MIDDLE_EAST: ['AE'],
  };
  
  return INTERNATIONAL_JURISDICTIONS.filter(j => regionMap[region]?.includes(j.code));
}

export function getJurisdictionsWithDTA(countryCode: string): TaxJurisdictionFull[] {
  return INTERNATIONAL_JURISDICTIONS.filter(j => 
    j.dtaPartners.some(dta => dta.partnerJurisdictionCode === countryCode)
  );
}

export function getLowTaxJurisdictions(maxRate: number = 15): TaxJurisdictionFull[] {
  return INTERNATIONAL_JURISDICTIONS.filter(j => j.corporateTax.standardRate <= maxRate);
}
