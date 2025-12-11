// =============================================================================
// PRIMEBALANCE - OFFSHORE & TAX HAVEN JURISDICTIONS
// =============================================================================

import { TaxJurisdictionFull, JurisdictionType, FilingFrequency, TransferPricingMethod } from '@/types/tax';

// =============================================================================
// CARIBBEAN OFFSHORE JURISDICTIONS
// =============================================================================

const CAYMAN_ISLANDS: TaxJurisdictionFull = {
  code: 'KY',
  name: 'Cayman Islands',
  shortName: 'Cayman',
  flag: '🇰🇾',
  type: JurisdictionType.COUNTRY,
  currency: 'KYD',
  language: 'English',
  
  corporateTax: {
    standardRate: 0,
    effectiveDate: '1900-01-01',
    notes: 'No direct taxation. Zero corporate tax, income tax, capital gains tax, or withholding tax.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: true,
  territorialSystem: false,
  
  dtaPartners: [
    // Limited treaty network - primarily TIEAs (Tax Information Exchange Agreements)
    {
      partnerJurisdictionCode: 'GB',
      partnerJurisdictionName: 'United Kingdom',
      treatyYear: 2010,
      dividendsRate: 0,
      interestRate: 0,
      royaltiesRate: 0,
      isMLIBeneficiary: false,
    },
  ],
  
  transferPricingRules: {
    hasRules: false,
    documentationRequired: false,
    masterFileRequired: false,
    localFileRequired: false,
    cbcReportingRequired: false,
    preferredMethods: [],
    advancePricingAgreements: false,
    penaltyRate: 0,
    notes: 'No transfer pricing rules - no corporate income tax.',
  },
  
  filingRequirements: [
    {
      type: 'Annual Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'Within 12 months of year end',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'Tax Neutral Status',
      description: 'No direct taxes of any kind - corporate, income, capital gains, or withholding.',
      rateReduction: 100,
      eligibilityCriteria: ['Incorporated in Cayman Islands'],
    },
    {
      name: 'Exempted Company Status',
      description: 'Exempted companies can obtain a tax undertaking certificate guaranteeing no future taxation for 20 years.',
      rateReduction: 100,
      eligibilityCriteria: ['Exempted company registration', 'No local business operations'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: false,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'Premier offshore financial center. Leading jurisdiction for hedge funds, captive insurance, and SPVs. No direct taxation but subject to Economic Substance requirements since 2019.',
};

const BRITISH_VIRGIN_ISLANDS: TaxJurisdictionFull = {
  code: 'VG',
  name: 'British Virgin Islands',
  shortName: 'BVI',
  flag: '🇻🇬',
  type: JurisdictionType.COUNTRY,
  currency: 'USD',
  language: 'English',
  
  corporateTax: {
    standardRate: 0,
    effectiveDate: '1984-01-01',
    notes: 'No corporate income tax for BVI Business Companies. Payroll tax applies to local employees.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: true,
  territorialSystem: false,
  
  dtaPartners: [
    {
      partnerJurisdictionCode: 'CH',
      partnerJurisdictionName: 'Switzerland',
      treatyYear: 2015,
      dividendsRate: 0,
      interestRate: 0,
      royaltiesRate: 0,
      isMLIBeneficiary: false,
    },
  ],
  
  transferPricingRules: {
    hasRules: false,
    documentationRequired: false,
    masterFileRequired: false,
    localFileRequired: false,
    cbcReportingRequired: false,
    preferredMethods: [],
    advancePricingAgreements: false,
    penaltyRate: 0,
  },
  
  filingRequirements: [
    {
      type: 'Annual Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'By anniversary date',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'BVI Business Company',
      description: 'Zero taxation on worldwide income, capital gains, dividends, and inheritance.',
      rateReduction: 100,
      eligibilityCriteria: ['BVI BC registration'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: false,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'Most popular jurisdiction for offshore company formation. Over 400,000 active companies. Economic Substance requirements apply since 2019.',
};

const BAHAMAS: TaxJurisdictionFull = {
  code: 'BS',
  name: 'Bahamas',
  shortName: 'Bahamas',
  flag: '🇧🇸',
  type: JurisdictionType.COUNTRY,
  currency: 'BSD',
  language: 'English',
  
  corporateTax: {
    standardRate: 0,
    effectiveDate: '1900-01-01',
    notes: 'No corporate income tax, personal income tax, capital gains tax, or withholding taxes.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: true,
  territorialSystem: false,
  
  dtaPartners: [],
  
  transferPricingRules: {
    hasRules: false,
    documentationRequired: false,
    masterFileRequired: false,
    localFileRequired: false,
    cbcReportingRequired: false,
    preferredMethods: [],
    advancePricingAgreements: false,
    penaltyRate: 0,
  },
  
  filingRequirements: [
    {
      type: 'Annual Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'Within 30 days of anniversary',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'International Business Company (IBC)',
      description: 'Tax-exempt status with guaranteed exemption from any future taxes for 20 years.',
      rateReduction: 100,
      eligibilityCriteria: ['IBC registration'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: false,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'Major offshore banking center. VAT of 10% applies to goods and services. Revenue primarily from tourism and financial services.',
};

const BERMUDA: TaxJurisdictionFull = {
  code: 'BM',
  name: 'Bermuda',
  shortName: 'Bermuda',
  flag: '🇧🇲',
  type: JurisdictionType.COUNTRY,
  currency: 'BMD',
  language: 'English',
  
  corporateTax: {
    standardRate: 0,
    effectiveDate: '1900-01-01',
    notes: 'No corporate income tax. 15% minimum tax for Bermuda-based MNE groups with €750M+ revenue (Pillar 2 compliant from 2025).',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: true,
  territorialSystem: false,
  
  dtaPartners: [
    {
      partnerJurisdictionCode: 'US',
      partnerJurisdictionName: 'United States',
      treatyYear: 1988,
      dividendsRate: 0,
      interestRate: 0,
      royaltiesRate: 0,
      notes: 'TIEA - Tax Information Exchange Agreement',
      isMLIBeneficiary: false,
    },
  ],
  
  transferPricingRules: {
    hasRules: false,
    documentationRequired: false,
    masterFileRequired: false,
    localFileRequired: false,
    cbcReportingRequired: true,
    cbcThreshold: 750000000,
    preferredMethods: [],
    advancePricingAgreements: false,
    penaltyRate: 0,
    notes: 'CbC reporting required for groups with €750M+ revenue.',
  },
  
  filingRequirements: [
    {
      type: 'Annual Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'Within 30 days of AGM',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'Exempted Company',
      description: 'Tax assurance certificate guaranteeing no taxation until 2035.',
      rateReduction: 100,
      eligibilityCriteria: ['Exempted company status'],
    },
    {
      name: 'Captive Insurance',
      description: 'Premier jurisdiction for captive insurance companies with no premium taxes.',
      rateReduction: 100,
      eligibilityCriteria: ['Insurance license'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: false,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'World\'s leading captive insurance domicile. Major reinsurance hub. Implementing Pillar 2 from January 2025 for large MNEs.',
};

const TURKS_AND_CAICOS: TaxJurisdictionFull = {
  code: 'TC',
  name: 'Turks and Caicos Islands',
  shortName: 'TCI',
  flag: '🇹🇨',
  type: JurisdictionType.COUNTRY,
  currency: 'USD',
  language: 'English',
  
  corporateTax: {
    standardRate: 0,
    effectiveDate: '1900-01-01',
    notes: 'No direct taxation on income, profits, capital gains, or withholding.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: true,
  territorialSystem: false,
  dtaPartners: [],
  
  transferPricingRules: {
    hasRules: false,
    documentationRequired: false,
    masterFileRequired: false,
    localFileRequired: false,
    cbcReportingRequired: false,
    preferredMethods: [],
    advancePricingAgreements: false,
    penaltyRate: 0,
  },
  
  filingRequirements: [],
  
  taxIncentives: [
    {
      name: 'Exempt Company',
      description: 'Complete tax exemption with 20-year guarantee.',
      rateReduction: 100,
      eligibilityCriteria: ['Exempt company registration'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: false,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'British Overseas Territory with no direct taxation. Popular for trusts and estate planning.',
};

const ANGUILLA: TaxJurisdictionFull = {
  code: 'AI',
  name: 'Anguilla',
  shortName: 'Anguilla',
  flag: '🇦🇮',
  type: JurisdictionType.COUNTRY,
  currency: 'XCD',
  language: 'English',
  
  corporateTax: {
    standardRate: 0,
    effectiveDate: '1900-01-01',
    notes: 'No corporate income tax, capital gains tax, or withholding taxes.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: true,
  territorialSystem: false,
  dtaPartners: [],
  
  transferPricingRules: {
    hasRules: false,
    documentationRequired: false,
    masterFileRequired: false,
    localFileRequired: false,
    cbcReportingRequired: false,
    preferredMethods: [],
    advancePricingAgreements: false,
    penaltyRate: 0,
  },
  
  filingRequirements: [
    {
      type: 'Annual Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'By anniversary date',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'IBC',
      description: 'International Business Companies exempt from all taxes.',
      rateReduction: 100,
      eligibilityCriteria: ['IBC registration'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: false,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'British Overseas Territory. Smaller offshore center popular for domain registration (.ai TLD).',
};

const BARBADOS: TaxJurisdictionFull = {
  code: 'BB',
  name: 'Barbados',
  shortName: 'Barbados',
  flag: '🇧🇧',
  type: JurisdictionType.COUNTRY,
  currency: 'BBD',
  language: 'English',
  
  corporateTax: {
    standardRate: 5.5,
    effectiveDate: '2019-01-01',
    brackets: [
      { minIncome: 0, maxIncome: 1000000, rate: 5.5 },
      { minIncome: 1000000, maxIncome: 20000000, rate: 3 },
      { minIncome: 20000000, maxIncome: 30000000, rate: 2.5 },
      { minIncome: 30000000, rate: 1 },
    ],
    notes: 'Progressive corporate tax from 5.5% down to 1% for larger profits.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 15,
    royalties: 15,
    technicalServices: 15,
    managementFees: 15,
  },
  
  noIncomeTax: false,
  territorialSystem: false,
  
  dtaPartners: [
    {
      partnerJurisdictionCode: 'US',
      partnerJurisdictionName: 'United States',
      treatyYear: 1984,
      dividendsRate: 5,
      interestRate: 5,
      royaltiesRate: 5,
      participationThreshold: 10,
      dividendsParticipationRate: 5,
      isMLIBeneficiary: false,
    },
    {
      partnerJurisdictionCode: 'CA',
      partnerJurisdictionName: 'Canada',
      treatyYear: 1980,
      dividendsRate: 15,
      interestRate: 15,
      royaltiesRate: 10,
      isMLIBeneficiary: false,
    },
    {
      partnerJurisdictionCode: 'GB',
      partnerJurisdictionName: 'United Kingdom',
      treatyYear: 1970,
      dividendsRate: 15,
      interestRate: 15,
      royaltiesRate: 15,
      isMLIBeneficiary: true,
    },
  ],
  
  transferPricingRules: {
    hasRules: true,
    documentationRequired: true,
    masterFileRequired: false,
    localFileRequired: false,
    cbcReportingRequired: true,
    cbcThreshold: 750000000,
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.TNMM],
    advancePricingAgreements: false,
    penaltyRate: 25,
  },
  
  filingRequirements: [
    {
      type: 'Corporate Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: '15th day of 6th month after year end',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'International Business Company',
      description: 'Effective rate as low as 1% for IBCs meeting substance requirements.',
      rateReduction: 80,
      eligibilityCriteria: ['IBC license', 'Economic substance'],
    },
    {
      name: 'Special Entry Permit',
      description: 'High net worth individuals can become tax resident with favorable treatment.',
      rateReduction: 50,
      eligibilityCriteria: ['Net worth >$5M', 'Annual income >$200K'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: true,
    interestDeductionLimits: true,
    antiAvoidanceRules: true,
    gaarApplies: true,
    interestDeductionLimit: 30,
    interestDeductionBase: 'EBITDA',
  },
  
  effectiveDate: '2024-01-01',
  notes: 'Transition from pure tax haven to low-tax jurisdiction. Extensive treaty network. Popular for US-owned structures due to US-Barbados treaty.',
};

const CURACAO: TaxJurisdictionFull = {
  code: 'CW',
  name: 'Curaçao',
  shortName: 'Curaçao',
  flag: '🇨🇼',
  type: JurisdictionType.COUNTRY,
  currency: 'ANG',
  language: 'Dutch',
  
  corporateTax: {
    standardRate: 22,
    effectiveDate: '2020-01-01',
    notes: 'Standard rate 22%. Special 2% rate available for qualifying activities.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: false,
  territorialSystem: true,
  
  dtaPartners: [
    {
      partnerJurisdictionCode: 'NL',
      partnerJurisdictionName: 'Netherlands',
      treatyYear: 2013,
      dividendsRate: 0,
      interestRate: 0,
      royaltiesRate: 0,
      notes: 'Part of Kingdom of Netherlands - special tax arrangement',
      isMLIBeneficiary: false,
    },
  ],
  
  transferPricingRules: {
    hasRules: true,
    documentationRequired: true,
    masterFileRequired: false,
    localFileRequired: true,
    cbcReportingRequired: false,
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.CPM],
    advancePricingAgreements: false,
    penaltyRate: 50,
  },
  
  filingRequirements: [
    {
      type: 'Corporate Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: '6 months after fiscal year end',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'E-Zone Company',
      description: 'Companies in economic zone qualify for 2% corporate tax rate.',
      rateReduction: 90,
      eligibilityCriteria: ['E-Zone license', 'Export activities', 'Economic substance'],
    },
    {
      name: 'Investment Incentives',
      description: 'Tax holidays and accelerated depreciation for qualifying investments.',
      eligibilityCriteria: ['Minimum investment amount', 'Job creation requirements'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: true,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'Part of Kingdom of the Netherlands. E-Zone regime offers 2% rate for international services. No withholding taxes.',
};

const NEVIS: TaxJurisdictionFull = {
  code: 'KN',
  name: 'St. Kitts and Nevis',
  shortName: 'Nevis',
  flag: '🇰🇳',
  type: JurisdictionType.COUNTRY,
  currency: 'XCD',
  language: 'English',
  
  corporateTax: {
    standardRate: 33,
    effectiveDate: '2010-01-01',
    notes: 'Standard domestic rate 33%. Nevis LLCs and IBCs are exempt from all taxes.',
  },
  
  withholdingTax: {
    dividends: 15,
    interest: 15,
    royalties: 15,
    technicalServices: 15,
    managementFees: 15,
  },
  
  noIncomeTax: false,
  territorialSystem: false,
  
  dtaPartners: [],
  
  transferPricingRules: {
    hasRules: false,
    documentationRequired: false,
    masterFileRequired: false,
    localFileRequired: false,
    cbcReportingRequired: false,
    preferredMethods: [],
    advancePricingAgreements: false,
    penaltyRate: 0,
  },
  
  filingRequirements: [
    {
      type: 'Annual Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'By anniversary date',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'Nevis LLC',
      description: 'LLCs formed under Nevis law are exempt from all taxes with strong asset protection.',
      rateReduction: 100,
      eligibilityCriteria: ['Nevis LLC formation', 'No local operations'],
    },
    {
      name: 'Citizenship by Investment',
      description: 'Citizenship available through investment - no tax on worldwide income for non-residents.',
      eligibilityCriteria: ['Investment in real estate or donation'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: false,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'Strong asset protection laws - one of the best jurisdictions for protecting assets from creditors. Nevis LLCs extremely difficult to pierce.',
};

const ANTIGUA_AND_BARBUDA: TaxJurisdictionFull = {
  code: 'AG',
  name: 'Antigua and Barbuda',
  shortName: 'Antigua',
  flag: '🇦🇬',
  type: JurisdictionType.COUNTRY,
  currency: 'XCD',
  language: 'English',
  
  corporateTax: {
    standardRate: 25,
    effectiveDate: '2016-01-01',
    notes: 'Domestic companies 25%. IBCs exempt from all taxes.',
  },
  
  withholdingTax: {
    dividends: 25,
    interest: 25,
    royalties: 25,
    technicalServices: 25,
    managementFees: 25,
  },
  
  noIncomeTax: false,
  territorialSystem: false,
  
  dtaPartners: [],
  
  transferPricingRules: {
    hasRules: false,
    documentationRequired: false,
    masterFileRequired: false,
    localFileRequired: false,
    cbcReportingRequired: false,
    preferredMethods: [],
    advancePricingAgreements: false,
    penaltyRate: 0,
  },
  
  filingRequirements: [],
  
  taxIncentives: [
    {
      name: 'IBC Exemption',
      description: 'International Business Companies fully exempt from taxation.',
      rateReduction: 100,
      eligibilityCriteria: ['IBC registration'],
    },
    {
      name: 'Citizenship by Investment',
      description: 'CBI program - citizenship through investment in National Development Fund or real estate.',
      eligibilityCriteria: ['$100K+ contribution'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: false,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'Caribbean tax haven with CBI program. IBCs exempt from all taxes. Online gaming licenses available.',
};

// =============================================================================
// EUROPEAN OFFSHORE JURISDICTIONS
// =============================================================================

const JERSEY: TaxJurisdictionFull = {
  code: 'JE',
  name: 'Jersey',
  shortName: 'Jersey',
  flag: '🇯🇪',
  type: JurisdictionType.SPECIAL_ZONE,
  currency: 'GBP',
  language: 'English',
  
  corporateTax: {
    standardRate: 0,
    effectiveDate: '2009-01-01',
    brackets: [
      { minIncome: 0, rate: 0, description: 'Standard rate' },
    ],
    notes: '0% for most companies. 10% for regulated financial services. 20% for utilities and large corporate retailers.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: false,
  territorialSystem: false,
  
  dtaPartners: [
    {
      partnerJurisdictionCode: 'GB',
      partnerJurisdictionName: 'United Kingdom',
      treatyYear: 2018,
      dividendsRate: 0,
      interestRate: 0,
      royaltiesRate: 0,
      notes: 'Special arrangement with UK',
      isMLIBeneficiary: false,
    },
  ],
  
  transferPricingRules: {
    hasRules: true,
    documentationRequired: false,
    masterFileRequired: false,
    localFileRequired: false,
    cbcReportingRequired: true,
    cbcThreshold: 750000000,
    preferredMethods: [TransferPricingMethod.CUP],
    advancePricingAgreements: false,
    penaltyRate: 0,
  },
  
  filingRequirements: [
    {
      type: 'Company Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: '12 months after accounting period end',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'Zero/Ten Tax Regime',
      description: '0% corporate tax for most companies, 10% for financial services.',
      rateReduction: 100,
      eligibilityCriteria: ['Jersey company'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: true,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'Crown Dependency with 0% corporate tax. Major funds and private equity hub. Implementing Pillar 2 with 15% minimum tax for large MNEs from 2025.',
};

const GUERNSEY: TaxJurisdictionFull = {
  code: 'GG',
  name: 'Guernsey',
  shortName: 'Guernsey',
  flag: '🇬🇬',
  type: JurisdictionType.SPECIAL_ZONE,
  currency: 'GBP',
  language: 'English',
  
  corporateTax: {
    standardRate: 0,
    effectiveDate: '2008-01-01',
    notes: '0% for most companies. 10% for banking and regulated activities. 20% for some income streams.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: false,
  territorialSystem: false,
  
  dtaPartners: [
    {
      partnerJurisdictionCode: 'GB',
      partnerJurisdictionName: 'United Kingdom',
      treatyYear: 2018,
      dividendsRate: 0,
      interestRate: 0,
      royaltiesRate: 0,
      isMLIBeneficiary: false,
    },
  ],
  
  transferPricingRules: {
    hasRules: false,
    documentationRequired: false,
    masterFileRequired: false,
    localFileRequired: false,
    cbcReportingRequired: true,
    cbcThreshold: 750000000,
    preferredMethods: [],
    advancePricingAgreements: false,
    penaltyRate: 0,
  },
  
  filingRequirements: [
    {
      type: 'Company Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'Within 12 months of year end',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'Zero/Ten Regime',
      description: 'Similar to Jersey - 0% for most, 10% for financial services.',
      rateReduction: 100,
      eligibilityCriteria: ['Guernsey company'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: true,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'Crown Dependency. Similar to Jersey. Popular for captive insurance and investment funds.',
};

const ISLE_OF_MAN: TaxJurisdictionFull = {
  code: 'IM',
  name: 'Isle of Man',
  shortName: 'IoM',
  flag: '🇮🇲',
  type: JurisdictionType.SPECIAL_ZONE,
  currency: 'GBP',
  language: 'English',
  
  corporateTax: {
    standardRate: 0,
    effectiveDate: '2006-04-06',
    notes: '0% standard rate. 10% for banking business and retail income >£500K. 20% cap on income tax.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: false,
  territorialSystem: false,
  
  dtaPartners: [
    {
      partnerJurisdictionCode: 'GB',
      partnerJurisdictionName: 'United Kingdom',
      treatyYear: 1955,
      dividendsRate: 0,
      interestRate: 0,
      royaltiesRate: 0,
      isMLIBeneficiary: false,
    },
  ],
  
  transferPricingRules: {
    hasRules: false,
    documentationRequired: false,
    masterFileRequired: false,
    localFileRequired: false,
    cbcReportingRequired: true,
    cbcThreshold: 750000000,
    preferredMethods: [],
    advancePricingAgreements: false,
    penaltyRate: 0,
  },
  
  filingRequirements: [
    {
      type: 'Income Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: '12 months and 1 day after accounting period',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'Zero Corporate Tax',
      description: '0% corporate tax for most trading companies.',
      rateReduction: 100,
      eligibilityCriteria: ['IoM company'],
    },
    {
      name: '20% Income Tax Cap',
      description: 'Maximum individual income tax of £200,000 per year (capped at 20%).',
      eligibilityCriteria: ['IoM tax resident'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: true,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'Crown Dependency in Irish Sea. Popular for online gaming, aircraft registration, and e-business.',
};

const GIBRALTAR: TaxJurisdictionFull = {
  code: 'GI',
  name: 'Gibraltar',
  shortName: 'Gibraltar',
  flag: '🇬🇮',
  type: JurisdictionType.SPECIAL_ZONE,
  currency: 'GIP',
  language: 'English',
  
  corporateTax: {
    standardRate: 15,
    effectiveDate: '2021-08-01',
    notes: 'Increased from 12.5% to 15% (Pillar 2 aligned). Previously 10%.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: false,
  territorialSystem: true,
  
  dtaPartners: [
    {
      partnerJurisdictionCode: 'GB',
      partnerJurisdictionName: 'United Kingdom',
      treatyYear: 2019,
      dividendsRate: 0,
      interestRate: 0,
      royaltiesRate: 0,
      isMLIBeneficiary: false,
    },
  ],
  
  transferPricingRules: {
    hasRules: true,
    documentationRequired: true,
    masterFileRequired: false,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 750000000,
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.TNMM],
    advancePricingAgreements: false,
    penaltyRate: 100,
  },
  
  filingRequirements: [
    {
      type: 'Corporation Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: '9 months after accounting period end',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'No Withholding Tax',
      description: 'No withholding on dividends, interest, or royalties.',
      rateReduction: 100,
      eligibilityCriteria: ['Gibraltar company'],
    },
    {
      name: 'DLT/Blockchain Licensing',
      description: 'Progressive regulatory framework for cryptocurrency and blockchain businesses.',
      eligibilityCriteria: ['DLT license'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: true,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'British Overseas Territory. Territorial tax system - only Gibraltar-sourced income taxed. Major online gaming hub.',
};

const MALTA: TaxJurisdictionFull = {
  code: 'MT',
  name: 'Malta',
  shortName: 'Malta',
  flag: '🇲🇹',
  type: JurisdictionType.COUNTRY,
  currency: 'EUR',
  language: 'English',
  
  corporateTax: {
    standardRate: 35,
    effectiveDate: '2007-01-01',
    notes: 'Headline 35% but effective rate can be as low as 5% through refund system.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: false,
  territorialSystem: false,
  
  dtaPartners: [
    {
      partnerJurisdictionCode: 'US',
      partnerJurisdictionName: 'United States',
      treatyYear: 2008,
      dividendsRate: 15,
      interestRate: 10,
      royaltiesRate: 10,
      isMLIBeneficiary: true,
    },
    {
      partnerJurisdictionCode: 'GB',
      partnerJurisdictionName: 'United Kingdom',
      treatyYear: 1994,
      dividendsRate: 0,
      interestRate: 0,
      royaltiesRate: 10,
      isMLIBeneficiary: true,
    },
    {
      partnerJurisdictionCode: 'DE',
      partnerJurisdictionName: 'Germany',
      treatyYear: 2001,
      dividendsRate: 5,
      interestRate: 0,
      royaltiesRate: 5,
      participationThreshold: 10,
      dividendsParticipationRate: 5,
      isMLIBeneficiary: true,
    },
  ],
  
  transferPricingRules: {
    hasRules: true,
    documentationRequired: true,
    masterFileRequired: true,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 750000000,
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.TNMM],
    advancePricingAgreements: true,
    penaltyRate: 100,
  },
  
  filingRequirements: [
    {
      type: 'Corporation Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: '9 months after accounting period end',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'Imputation System',
      description: 'Shareholders receive 6/7ths refund on dividends, resulting in effective 5% rate.',
      rateReduction: 85,
      eligibilityCriteria: ['Non-resident shareholders', 'Trading company'],
    },
    {
      name: 'Participation Exemption',
      description: 'Dividends and capital gains from qualifying participations exempt.',
      rateReduction: 100,
      eligibilityCriteria: ['10%+ holding', 'EU company or subject to 15%+ tax'],
    },
    {
      name: 'Gaming License',
      description: 'Malta Gaming Authority licenses for online gaming operations.',
      eligibilityCriteria: ['MGA license approval'],
    },
  ],
  
  specialProvisions: {
    cfcRules: true,
    thinCapitalization: false,
    interestDeductionLimits: true,
    interestDeductionLimit: 30,
    interestDeductionBase: 'EBITDA',
    antiAvoidanceRules: true,
    gaarApplies: true,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'EU member state. Imputation system allows effective 5% rate. Major iGaming jurisdiction. Under scrutiny for tax practices.',
};

const CYPRUS: TaxJurisdictionFull = {
  code: 'CY',
  name: 'Cyprus',
  shortName: 'Cyprus',
  flag: '🇨🇾',
  type: JurisdictionType.COUNTRY,
  currency: 'EUR',
  language: 'Greek',
  
  corporateTax: {
    standardRate: 12.5,
    effectiveDate: '2013-01-01',
    notes: '12.5% standard rate. IP box available. Pillar 2 implementation from 2024 for large MNEs.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: false,
  territorialSystem: false,
  
  dtaPartners: [
    {
      partnerJurisdictionCode: 'US',
      partnerJurisdictionName: 'United States',
      treatyYear: 1984,
      dividendsRate: 15,
      interestRate: 10,
      royaltiesRate: 0,
      isMLIBeneficiary: false,
    },
    {
      partnerJurisdictionCode: 'RU',
      partnerJurisdictionName: 'Russia',
      treatyYear: 1998,
      dividendsRate: 5,
      interestRate: 0,
      royaltiesRate: 0,
      participationThreshold: 10,
      dividendsParticipationRate: 5,
      notes: 'Treaty suspended due to sanctions',
      isMLIBeneficiary: false,
    },
    {
      partnerJurisdictionCode: 'GB',
      partnerJurisdictionName: 'United Kingdom',
      treatyYear: 2018,
      dividendsRate: 0,
      interestRate: 0,
      royaltiesRate: 0,
      isMLIBeneficiary: true,
    },
  ],
  
  transferPricingRules: {
    hasRules: true,
    documentationRequired: true,
    masterFileRequired: true,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 750000000,
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.TNMM],
    advancePricingAgreements: true,
    penaltyRate: 100,
  },
  
  filingRequirements: [
    {
      type: 'Corporation Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: '15 months after year end',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'IP Box Regime',
      description: '80% exemption on qualifying IP income - effective 2.5% rate.',
      rateReduction: 80,
      eligibilityCriteria: ['Qualifying IP', 'R&D activities'],
    },
    {
      name: 'Notional Interest Deduction',
      description: 'Deduction on new equity capital (abolished for new arrangements from 2024).',
      eligibilityCriteria: ['New equity injection'],
    },
    {
      name: 'Non-Domicile Regime',
      description: 'Non-domiciled individuals exempt from Special Defence Contribution (dividends, interest, rent).',
      rateReduction: 100,
      eligibilityCriteria: ['Non-domiciled status', 'Cyprus tax resident'],
    },
  ],
  
  specialProvisions: {
    cfcRules: true,
    thinCapitalization: false,
    interestDeductionLimits: true,
    interestDeductionLimit: 30,
    interestDeductionBase: 'EBITDA',
    antiAvoidanceRules: true,
    gaarApplies: true,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'EU member state. Extensive treaty network (60+). No withholding taxes. Popular holding company location.',
};

const MONACO: TaxJurisdictionFull = {
  code: 'MC',
  name: 'Monaco',
  shortName: 'Monaco',
  flag: '🇲🇨',
  type: JurisdictionType.COUNTRY,
  currency: 'EUR',
  language: 'French',
  
  corporateTax: {
    standardRate: 25,
    effectiveDate: '2022-01-01',
    notes: '25% only on profits from activities >25% outside Monaco. No tax on Monaco-sourced profits.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: true, // For individuals
  territorialSystem: true,
  
  dtaPartners: [
    {
      partnerJurisdictionCode: 'FR',
      partnerJurisdictionName: 'France',
      treatyYear: 1963,
      dividendsRate: 0,
      interestRate: 0,
      royaltiesRate: 0,
      notes: 'Special arrangement - French nationals taxed as if in France',
      isMLIBeneficiary: false,
    },
  ],
  
  transferPricingRules: {
    hasRules: false,
    documentationRequired: false,
    masterFileRequired: false,
    localFileRequired: false,
    cbcReportingRequired: false,
    preferredMethods: [],
    advancePricingAgreements: false,
    penaltyRate: 0,
  },
  
  filingRequirements: [
    {
      type: 'Corporate Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: '31 March following year end',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'No Personal Income Tax',
      description: 'No personal income tax for residents (except French nationals).',
      rateReduction: 100,
      eligibilityCriteria: ['Monaco resident', 'Non-French national'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: false,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'No personal income tax (except for French nationals). Corporate tax only on companies with >25% foreign activity. Popular for HNWIs.',
};

const LIECHTENSTEIN: TaxJurisdictionFull = {
  code: 'LI',
  name: 'Liechtenstein',
  shortName: 'Liechtenstein',
  flag: '🇱🇮',
  type: JurisdictionType.COUNTRY,
  currency: 'CHF',
  language: 'German',
  
  corporateTax: {
    standardRate: 12.5,
    effectiveDate: '2011-01-01',
    notes: '12.5% flat rate. Minimum tax CHF 1,800/year. IP box available.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: false,
  territorialSystem: false,
  
  dtaPartners: [
    {
      partnerJurisdictionCode: 'DE',
      partnerJurisdictionName: 'Germany',
      treatyYear: 2011,
      dividendsRate: 0,
      interestRate: 0,
      royaltiesRate: 0,
      isMLIBeneficiary: true,
    },
    {
      partnerJurisdictionCode: 'CH',
      partnerJurisdictionName: 'Switzerland',
      treatyYear: 1995,
      dividendsRate: 0,
      interestRate: 0,
      royaltiesRate: 0,
      notes: 'Customs union and close ties',
      isMLIBeneficiary: false,
    },
    {
      partnerJurisdictionCode: 'GB',
      partnerJurisdictionName: 'United Kingdom',
      treatyYear: 2012,
      dividendsRate: 0,
      interestRate: 0,
      royaltiesRate: 0,
      isMLIBeneficiary: true,
    },
  ],
  
  transferPricingRules: {
    hasRules: true,
    documentationRequired: true,
    masterFileRequired: true,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 750000000,
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.TNMM],
    advancePricingAgreements: true,
    penaltyRate: 50,
  },
  
  filingRequirements: [
    {
      type: 'Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: '30 June following year end',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'IP Box',
      description: '80% exemption on IP income - effective 2.5% rate.',
      rateReduction: 80,
      eligibilityCriteria: ['Qualifying IP assets'],
    },
    {
      name: 'Private Asset Structure (PAS)',
      description: 'Special structure for private wealth management with favorable taxation.',
      rateReduction: 100,
      eligibilityCriteria: ['PAS setup', 'No commercial activity'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: true,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'EEA member. Strong private banking tradition. Foundations (Stiftung) popular for wealth planning.',
};

const ANDORRA: TaxJurisdictionFull = {
  code: 'AD',
  name: 'Andorra',
  shortName: 'Andorra',
  flag: '🇦🇩',
  type: JurisdictionType.COUNTRY,
  currency: 'EUR',
  language: 'Catalan',
  
  corporateTax: {
    standardRate: 10,
    effectiveDate: '2012-01-01',
    notes: '10% flat rate. New companies can benefit from 50% reduction for first 3 years.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: false,
  territorialSystem: false,
  
  dtaPartners: [
    {
      partnerJurisdictionCode: 'ES',
      partnerJurisdictionName: 'Spain',
      treatyYear: 2015,
      dividendsRate: 0,
      interestRate: 0,
      royaltiesRate: 5,
      isMLIBeneficiary: true,
    },
    {
      partnerJurisdictionCode: 'FR',
      partnerJurisdictionName: 'France',
      treatyYear: 2013,
      dividendsRate: 5,
      interestRate: 0,
      royaltiesRate: 0,
      isMLIBeneficiary: true,
    },
  ],
  
  transferPricingRules: {
    hasRules: true,
    documentationRequired: true,
    masterFileRequired: false,
    localFileRequired: true,
    cbcReportingRequired: false,
    preferredMethods: [TransferPricingMethod.CUP],
    advancePricingAgreements: false,
    penaltyRate: 150,
  },
  
  filingRequirements: [
    {
      type: 'Corporate Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: '7 months after year end',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'New Company Reduction',
      description: '50% corporate tax reduction for first 3 years for new companies.',
      rateReduction: 50,
      eligibilityCriteria: ['New company', 'First 3 years'],
    },
    {
      name: 'Holding Company Regime',
      description: '80% exemption on dividends and capital gains from qualifying holdings.',
      rateReduction: 80,
      eligibilityCriteria: ['5%+ participation', '12+ month holding'],
    },
  ],
  
  specialProvisions: {
    cfcRules: true,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: true,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'Principality between France and Spain. Low taxes combined with high quality of life. Personal income tax 0-10%.',
};

// =============================================================================
// PACIFIC OFFSHORE JURISDICTIONS
// =============================================================================

const VANUATU: TaxJurisdictionFull = {
  code: 'VU',
  name: 'Vanuatu',
  shortName: 'Vanuatu',
  flag: '🇻🇺',
  type: JurisdictionType.COUNTRY,
  currency: 'VUV',
  language: 'English',
  
  corporateTax: {
    standardRate: 0,
    effectiveDate: '1900-01-01',
    notes: 'No corporate income tax, personal income tax, or capital gains tax.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: true,
  territorialSystem: false,
  dtaPartners: [],
  
  transferPricingRules: {
    hasRules: false,
    documentationRequired: false,
    masterFileRequired: false,
    localFileRequired: false,
    cbcReportingRequired: false,
    preferredMethods: [],
    advancePricingAgreements: false,
    penaltyRate: 0,
  },
  
  filingRequirements: [
    {
      type: 'Annual License Fee',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'By anniversary date',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'International Company',
      description: 'Complete tax exemption for international companies.',
      rateReduction: 100,
      eligibilityCriteria: ['International company registration'],
    },
    {
      name: 'Citizenship by Investment',
      description: 'CBI program - citizenship through contribution.',
      eligibilityCriteria: ['$130K+ contribution'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: false,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'Pacific island nation. No direct taxation. Popular for forex and gaming licenses.',
};

const SAMOA: TaxJurisdictionFull = {
  code: 'WS',
  name: 'Samoa',
  shortName: 'Samoa',
  flag: '🇼🇸',
  type: JurisdictionType.COUNTRY,
  currency: 'WST',
  language: 'Samoan',
  
  corporateTax: {
    standardRate: 27,
    effectiveDate: '2012-01-01',
    notes: 'Domestic companies 27%. International companies exempt.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 15,
    royalties: 0,
    technicalServices: 15,
    managementFees: 15,
  },
  
  noIncomeTax: false,
  territorialSystem: false,
  dtaPartners: [],
  
  transferPricingRules: {
    hasRules: false,
    documentationRequired: false,
    masterFileRequired: false,
    localFileRequired: false,
    cbcReportingRequired: false,
    preferredMethods: [],
    advancePricingAgreements: false,
    penaltyRate: 0,
  },
  
  filingRequirements: [],
  
  taxIncentives: [
    {
      name: 'International Company',
      description: 'Tax exempt status for international companies.',
      rateReduction: 100,
      eligibilityCriteria: ['International company status'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: false,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'Pacific island nation. International companies exempt from all taxes.',
};

const MARSHALL_ISLANDS: TaxJurisdictionFull = {
  code: 'MH',
  name: 'Marshall Islands',
  shortName: 'Marshall Is.',
  flag: '🇲🇭',
  type: JurisdictionType.COUNTRY,
  currency: 'USD',
  language: 'English',
  
  corporateTax: {
    standardRate: 0,
    effectiveDate: '1990-01-01',
    notes: 'No corporate income tax for non-resident companies. Major ship registration jurisdiction.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: true,
  territorialSystem: false,
  dtaPartners: [],
  
  transferPricingRules: {
    hasRules: false,
    documentationRequired: false,
    masterFileRequired: false,
    localFileRequired: false,
    cbcReportingRequired: false,
    preferredMethods: [],
    advancePricingAgreements: false,
    penaltyRate: 0,
  },
  
  filingRequirements: [
    {
      type: 'Annual Report',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'By anniversary date',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'Non-Resident LLC',
      description: 'Zero taxation for non-resident LLCs.',
      rateReduction: 100,
      eligibilityCriteria: ['Non-resident LLC'],
    },
    {
      name: 'Ship Registration',
      description: 'Third largest ship registry in world. No tonnage tax.',
      rateReduction: 100,
      eligibilityCriteria: ['Ship registration'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: false,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'Third largest ship registry globally. Popular for LLC formations. Uses USD.',
};

const COOK_ISLANDS: TaxJurisdictionFull = {
  code: 'CK',
  name: 'Cook Islands',
  shortName: 'Cook Islands',
  flag: '🇨🇰',
  type: JurisdictionType.COUNTRY,
  currency: 'NZD',
  language: 'English',
  
  corporateTax: {
    standardRate: 0,
    effectiveDate: '1981-01-01',
    notes: 'No corporate tax for international companies. Domestic rate 20%.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: false,
  territorialSystem: false,
  dtaPartners: [],
  
  transferPricingRules: {
    hasRules: false,
    documentationRequired: false,
    masterFileRequired: false,
    localFileRequired: false,
    cbcReportingRequired: false,
    preferredMethods: [],
    advancePricingAgreements: false,
    penaltyRate: 0,
  },
  
  filingRequirements: [],
  
  taxIncentives: [
    {
      name: 'International Trust',
      description: 'Leading jurisdiction for asset protection trusts.',
      rateReduction: 100,
      eligibilityCriteria: ['International trust registration'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: false,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'Premier asset protection trust jurisdiction. 2-year statute of limitations on fraudulent transfer claims.',
};

// =============================================================================
// ASIAN & INDIAN OCEAN OFFSHORE JURISDICTIONS
// =============================================================================

const LABUAN: TaxJurisdictionFull = {
  code: 'MY-LB',
  name: 'Labuan (Malaysia)',
  shortName: 'Labuan',
  flag: '🇲🇾',
  type: JurisdictionType.SPECIAL_ZONE,
  currency: 'MYR',
  language: 'English',
  
  corporateTax: {
    standardRate: 3,
    effectiveDate: '2019-01-01',
    notes: '3% on net profit for trading activity. Alternative: RM 20,000 fixed tax.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: false,
  territorialSystem: false,
  
  dtaPartners: [
    {
      partnerJurisdictionCode: 'MY',
      partnerJurisdictionName: 'Malaysia',
      treatyYear: 1990,
      dividendsRate: 0,
      interestRate: 0,
      royaltiesRate: 0,
      notes: 'Special arrangement within Malaysia',
      isMLIBeneficiary: false,
    },
  ],
  
  transferPricingRules: {
    hasRules: true,
    documentationRequired: true,
    masterFileRequired: false,
    localFileRequired: true,
    cbcReportingRequired: false,
    preferredMethods: [TransferPricingMethod.CUP],
    advancePricingAgreements: true,
    penaltyRate: 35,
  },
  
  filingRequirements: [
    {
      type: 'Annual Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'Within 3 months of year end',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'Labuan Trading Company',
      description: '3% tax on net profit or RM 20,000 flat tax.',
      rateReduction: 85,
      eligibilityCriteria: ['Labuan trading license', 'Substance requirements'],
    },
    {
      name: 'Labuan Holding Company',
      description: 'Exempt from tax on dividend income and capital gains.',
      rateReduction: 100,
      eligibilityCriteria: ['Holding company activity'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: true,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'Malaysian offshore center. Must have substance (local directors, employees). Good for Islamic finance.',
};

const MAURITIUS: TaxJurisdictionFull = {
  code: 'MU',
  name: 'Mauritius',
  shortName: 'Mauritius',
  flag: '🇲🇺',
  type: JurisdictionType.COUNTRY,
  currency: 'MUR',
  language: 'English',
  
  corporateTax: {
    standardRate: 15,
    effectiveDate: '2018-01-01',
    notes: '15% standard. 80% partial exemption system results in 3% effective rate for GBC.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 15,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: false,
  territorialSystem: false,
  
  dtaPartners: [
    {
      partnerJurisdictionCode: 'IN',
      partnerJurisdictionName: 'India',
      treatyYear: 1983,
      dividendsRate: 5,
      interestRate: 7.5,
      royaltiesRate: 15,
      notes: 'Revised 2016 - capital gains taxable in India',
      isMLIBeneficiary: false,
    },
    {
      partnerJurisdictionCode: 'ZA',
      partnerJurisdictionName: 'South Africa',
      treatyYear: 1997,
      dividendsRate: 10,
      interestRate: 0,
      royaltiesRate: 0,
      isMLIBeneficiary: true,
    },
    {
      partnerJurisdictionCode: 'GB',
      partnerJurisdictionName: 'United Kingdom',
      treatyYear: 1981,
      dividendsRate: 10,
      interestRate: 0,
      royaltiesRate: 15,
      isMLIBeneficiary: true,
    },
  ],
  
  transferPricingRules: {
    hasRules: true,
    documentationRequired: true,
    masterFileRequired: true,
    localFileRequired: true,
    cbcReportingRequired: true,
    cbcThreshold: 750000000,
    preferredMethods: [TransferPricingMethod.CUP, TransferPricingMethod.TNMM],
    advancePricingAgreements: true,
    penaltyRate: 100,
  },
  
  filingRequirements: [
    {
      type: 'Corporate Tax Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: '6 months after year end',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'Global Business Company (GBC)',
      description: '80% partial exemption on foreign income - effective 3% rate.',
      rateReduction: 80,
      eligibilityCriteria: ['GBC license', 'Substance requirements'],
    },
    {
      name: 'Freeport Zone',
      description: 'Tax exemption for freeport activities.',
      rateReduction: 100,
      eligibilityCriteria: ['Freeport license'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: true,
    interestDeductionLimit: 25,
    interestDeductionBase: 'EBITDA',
    antiAvoidanceRules: true,
    gaarApplies: true,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'Gateway to India and Africa. 50+ DTAs. Effective 3% rate through partial exemption. Strong substance requirements since 2019.',
};

const SEYCHELLES: TaxJurisdictionFull = {
  code: 'SC',
  name: 'Seychelles',
  shortName: 'Seychelles',
  flag: '🇸🇨',
  type: JurisdictionType.COUNTRY,
  currency: 'SCR',
  language: 'English',
  
  corporateTax: {
    standardRate: 33,
    effectiveDate: '2013-01-01',
    notes: 'Domestic 33%. International Business Companies (IBCs) and Special License Companies (CSL) exempt or 1.5%.',
  },
  
  withholdingTax: {
    dividends: 15,
    interest: 15,
    royalties: 15,
    technicalServices: 15,
    managementFees: 15,
  },
  
  noIncomeTax: false,
  territorialSystem: false,
  dtaPartners: [],
  
  transferPricingRules: {
    hasRules: false,
    documentationRequired: false,
    masterFileRequired: false,
    localFileRequired: false,
    cbcReportingRequired: false,
    preferredMethods: [],
    advancePricingAgreements: false,
    penaltyRate: 0,
  },
  
  filingRequirements: [
    {
      type: 'Annual Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'By anniversary date',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'International Business Company',
      description: 'IBCs exempt from all taxes.',
      rateReduction: 100,
      eligibilityCriteria: ['IBC registration'],
    },
    {
      name: 'Special License Company (CSL)',
      description: '1.5% corporate tax with access to treaties.',
      rateReduction: 95,
      eligibilityCriteria: ['CSL license', 'Substance requirements'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: false,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'Indian Ocean island nation. Popular for IBCs. Removed from EU blacklist. Economic substance requirements apply.',
};

// =============================================================================
// MIDDLE EAST OFFSHORE JURISDICTIONS
// =============================================================================

const BAHRAIN: TaxJurisdictionFull = {
  code: 'BH',
  name: 'Bahrain',
  shortName: 'Bahrain',
  flag: '🇧🇭',
  type: JurisdictionType.COUNTRY,
  currency: 'BHD',
  language: 'Arabic',
  
  corporateTax: {
    standardRate: 0,
    effectiveDate: '1900-01-01',
    notes: 'No corporate income tax except on oil & gas companies (46%).',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: true,
  territorialSystem: false,
  
  dtaPartners: [
    {
      partnerJurisdictionCode: 'GB',
      partnerJurisdictionName: 'United Kingdom',
      treatyYear: 2010,
      dividendsRate: 0,
      interestRate: 0,
      royaltiesRate: 0,
      isMLIBeneficiary: true,
    },
    {
      partnerJurisdictionCode: 'FR',
      partnerJurisdictionName: 'France',
      treatyYear: 1993,
      dividendsRate: 0,
      interestRate: 0,
      royaltiesRate: 0,
      isMLIBeneficiary: true,
    },
  ],
  
  transferPricingRules: {
    hasRules: false,
    documentationRequired: false,
    masterFileRequired: false,
    localFileRequired: false,
    cbcReportingRequired: false,
    preferredMethods: [],
    advancePricingAgreements: false,
    penaltyRate: 0,
  },
  
  filingRequirements: [
    {
      type: 'Annual Return',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'Within 3 months of year end',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'No Corporate Tax',
      description: 'Zero corporate tax for all non-oil companies.',
      rateReduction: 100,
      eligibilityCriteria: ['Non-oil/gas company'],
    },
    {
      name: 'FinTech Sandbox',
      description: 'Regulatory sandbox for fintech innovation.',
      eligibilityCriteria: ['CBB approval'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: false,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'GCC financial hub. No corporate tax (except oil/gas). Islamic finance center. Implementing Pillar 2 from 2025.',
};

const RAK_FREE_ZONE: TaxJurisdictionFull = {
  code: 'AE-RAK',
  name: 'Ras Al Khaimah (RAK)',
  shortName: 'RAK',
  flag: '🇦🇪',
  type: JurisdictionType.SPECIAL_ZONE,
  currency: 'AED',
  language: 'English',
  
  corporateTax: {
    standardRate: 0,
    effectiveDate: '2000-01-01',
    notes: '0% corporate tax in free zone. UAE 9% CIT does not apply to qualifying free zone income.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: true,
  territorialSystem: false,
  
  dtaPartners: [], // Uses UAE treaties
  
  transferPricingRules: {
    hasRules: true,
    documentationRequired: true,
    masterFileRequired: false,
    localFileRequired: true,
    cbcReportingRequired: false,
    preferredMethods: [TransferPricingMethod.CUP],
    advancePricingAgreements: false,
    penaltyRate: 0,
  },
  
  filingRequirements: [
    {
      type: 'License Renewal',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'By anniversary date',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'Free Zone Company',
      description: '0% corporate tax, 100% foreign ownership, 100% profit repatriation.',
      rateReduction: 100,
      eligibilityCriteria: ['RAK free zone registration'],
    },
    {
      name: 'RAK ICC',
      description: 'RAK International Corporate Centre for offshore companies.',
      rateReduction: 100,
      eligibilityCriteria: ['RAK ICC registration'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: false,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'UAE free zone. Popular for low-cost company formation. 50+ year tax exemption guarantee.',
};

const AJMAN_FREE_ZONE: TaxJurisdictionFull = {
  code: 'AE-AJ',
  name: 'Ajman Free Zone',
  shortName: 'Ajman FZ',
  flag: '🇦🇪',
  type: JurisdictionType.SPECIAL_ZONE,
  currency: 'AED',
  language: 'English',
  
  corporateTax: {
    standardRate: 0,
    effectiveDate: '1988-01-01',
    notes: '0% corporate tax. Quick and affordable setup.',
  },
  
  withholdingTax: {
    dividends: 0,
    interest: 0,
    royalties: 0,
    technicalServices: 0,
    managementFees: 0,
  },
  
  noIncomeTax: true,
  territorialSystem: false,
  dtaPartners: [],
  
  transferPricingRules: {
    hasRules: false,
    documentationRequired: false,
    masterFileRequired: false,
    localFileRequired: false,
    cbcReportingRequired: false,
    preferredMethods: [],
    advancePricingAgreements: false,
    penaltyRate: 0,
  },
  
  filingRequirements: [
    {
      type: 'License Renewal',
      frequency: FilingFrequency.ANNUALLY,
      dueDate: 'By anniversary date',
      sinceDate: new Date().toISOString(),
      sinceAmount: 0,
      sinceTransactionCount: 0,
      sinceDocumentCount: 0,
      sinceNotes: '',
      sinceAttachments: [],
      sinceLinks: [],
      sinceTags: [],
    },
  ],
  
  taxIncentives: [
    {
      name: 'Free Zone Benefits',
      description: '0% corporate tax, 100% ownership, no currency restrictions.',
      rateReduction: 100,
      eligibilityCriteria: ['Ajman Free Zone license'],
    },
  ],
  
  specialProvisions: {
    cfcRules: false,
    thinCapitalization: false,
    interestDeductionLimits: false,
    antiAvoidanceRules: false,
  },
  
  effectiveDate: '2024-01-01',
  notes: 'Cost-effective UAE free zone. Good for trading and service companies.',
};

// =============================================================================
// EXPORTS
// =============================================================================

export const CARIBBEAN_JURISDICTIONS: TaxJurisdictionFull[] = [
  CAYMAN_ISLANDS,
  BRITISH_VIRGIN_ISLANDS,
  BAHAMAS,
  BERMUDA,
  TURKS_AND_CAICOS,
  ANGUILLA,
  BARBADOS,
  CURACAO,
  NEVIS,
  ANTIGUA_AND_BARBUDA,
];

export const EUROPEAN_OFFSHORE_JURISDICTIONS: TaxJurisdictionFull[] = [
  JERSEY,
  GUERNSEY,
  ISLE_OF_MAN,
  GIBRALTAR,
  MALTA,
  CYPRUS,
  MONACO,
  LIECHTENSTEIN,
  ANDORRA,
];

export const PACIFIC_JURISDICTIONS: TaxJurisdictionFull[] = [
  VANUATU,
  SAMOA,
  MARSHALL_ISLANDS,
  COOK_ISLANDS,
];

export const ASIAN_OFFSHORE_JURISDICTIONS: TaxJurisdictionFull[] = [
  LABUAN,
  MAURITIUS,
  SEYCHELLES,
];

export const MIDDLE_EAST_OFFSHORE_JURISDICTIONS: TaxJurisdictionFull[] = [
  BAHRAIN,
  RAK_FREE_ZONE,
  AJMAN_FREE_ZONE,
];

export const ALL_OFFSHORE_JURISDICTIONS: TaxJurisdictionFull[] = [
  ...CARIBBEAN_JURISDICTIONS,
  ...EUROPEAN_OFFSHORE_JURISDICTIONS,
  ...PACIFIC_JURISDICTIONS,
  ...ASIAN_OFFSHORE_JURISDICTIONS,
  ...MIDDLE_EAST_OFFSHORE_JURISDICTIONS,
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getOffshoreJurisdiction(code: string): TaxJurisdictionFull | undefined {
  return ALL_OFFSHORE_JURISDICTIONS.find(j => j.code === code);
}

export function getZeroTaxJurisdictions(): TaxJurisdictionFull[] {
  return ALL_OFFSHORE_JURISDICTIONS.filter(j => j.corporateTax.standardRate === 0);
}

export function getJurisdictionsWithCBI(): TaxJurisdictionFull[] {
  return ALL_OFFSHORE_JURISDICTIONS.filter(j => 
    j.taxIncentives?.some(i => 
      i.name.toLowerCase().includes('citizenship') || 
      i.description.toLowerCase().includes('citizenship')
    )
  );
}

export function getAssetProtectionJurisdictions(): TaxJurisdictionFull[] {
  return [NEVIS, COOK_ISLANDS, BRITISH_VIRGIN_ISLANDS];
}

export function getOffshoreJurisdictionsByRegion(region: 'caribbean' | 'europe' | 'pacific' | 'asia' | 'middle_east'): TaxJurisdictionFull[] {
  switch (region) {
    case 'caribbean': return CARIBBEAN_JURISDICTIONS;
    case 'europe': return EUROPEAN_OFFSHORE_JURISDICTIONS;
    case 'pacific': return PACIFIC_JURISDICTIONS;
    case 'asia': return ASIAN_OFFSHORE_JURISDICTIONS;
    case 'middle_east': return MIDDLE_EAST_OFFSHORE_JURISDICTIONS;
    default: return [];
  }
}
