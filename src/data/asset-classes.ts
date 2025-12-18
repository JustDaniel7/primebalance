// =============================================================================
// PRIMEBALANCE - ASSET CLASS CONFIGURATIONS
// =============================================================================

import {
    AssetCategory,
    AssetClassConfig,
    DepreciationMethod,
} from '@/types/asset';

// =============================================================================
// DEFAULT ASSET CLASS CONFIGURATIONS
// =============================================================================

export const ASSET_CLASS_CONFIGS: Record<AssetCategory, AssetClassConfig> = {
    [AssetCategory.BUILDINGS]: {
        category: AssetCategory.BUILDINGS,
        label: 'Buildings',
        icon: 'Building2',
        defaultDepreciationMethod: DepreciationMethod.STRAIGHT_LINE,
        defaultUsefulLifeMonths: 480, // 40 years
        defaultSalvageValuePercent: 10,
        capitalizationThreshold: 50000,
        taxTreatment: 'Section 179 eligible',
        allowComponents: true,
        allowRevaluation: true,
        isDepreciable: true,
    },

    [AssetCategory.MACHINERY]: {
        category: AssetCategory.MACHINERY,
        label: 'Machinery & Equipment',
        icon: 'Cog',
        defaultDepreciationMethod: DepreciationMethod.DECLINING_BALANCE,
        defaultUsefulLifeMonths: 120, // 10 years
        defaultSalvageValuePercent: 5,
        capitalizationThreshold: 5000,
        taxTreatment: 'MACRS 7-year',
        allowComponents: true,
        allowRevaluation: false,
        isDepreciable: true,
    },

    [AssetCategory.VEHICLES]: {
        category: AssetCategory.VEHICLES,
        label: 'Vehicles',
        icon: 'Car',
        defaultDepreciationMethod: DepreciationMethod.DECLINING_BALANCE,
        defaultUsefulLifeMonths: 60, // 5 years
        defaultSalvageValuePercent: 15,
        capitalizationThreshold: 2500,
        taxTreatment: 'MACRS 5-year, luxury auto limits apply',
        allowComponents: false,
        allowRevaluation: false,
        isDepreciable: true,
    },

    [AssetCategory.IT_EQUIPMENT]: {
        category: AssetCategory.IT_EQUIPMENT,
        label: 'IT Equipment',
        icon: 'Monitor',
        defaultDepreciationMethod: DepreciationMethod.STRAIGHT_LINE,
        defaultUsefulLifeMonths: 36, // 3 years
        defaultSalvageValuePercent: 0,
        capitalizationThreshold: 1000,
        taxTreatment: 'MACRS 5-year',
        allowComponents: false,
        allowRevaluation: false,
        isDepreciable: true,
    },

    [AssetCategory.FURNITURE]: {
        category: AssetCategory.FURNITURE,
        label: 'Furniture & Fixtures',
        icon: 'Armchair',
        defaultDepreciationMethod: DepreciationMethod.STRAIGHT_LINE,
        defaultUsefulLifeMonths: 84, // 7 years
        defaultSalvageValuePercent: 5,
        capitalizationThreshold: 500,
        taxTreatment: 'MACRS 7-year',
        allowComponents: false,
        allowRevaluation: false,
        isDepreciable: true,
    },

    [AssetCategory.INTANGIBLE_ASSETS]: {
        category: AssetCategory.INTANGIBLE_ASSETS,
        label: 'Intangible Assets',
        icon: 'FileKey',
        defaultDepreciationMethod: DepreciationMethod.STRAIGHT_LINE,
        defaultUsefulLifeMonths: 180, // 15 years
        defaultSalvageValuePercent: 0,
        capitalizationThreshold: 5000,
        taxTreatment: 'Section 197 intangible',
        allowComponents: false,
        allowRevaluation: false,
        isDepreciable: true,
    },

    [AssetCategory.CAPITALIZED_SOFTWARE]: {
        category: AssetCategory.CAPITALIZED_SOFTWARE,
        label: 'Capitalized Software',
        icon: 'Code',
        defaultDepreciationMethod: DepreciationMethod.STRAIGHT_LINE,
        defaultUsefulLifeMonths: 36, // 3 years
        defaultSalvageValuePercent: 0,
        capitalizationThreshold: 10000,
        taxTreatment: 'MACRS 3-year or Section 179',
        allowComponents: false,
        allowRevaluation: false,
        isDepreciable: true,
    },

    [AssetCategory.LEASEHOLD_IMPROVEMENTS]: {
        category: AssetCategory.LEASEHOLD_IMPROVEMENTS,
        label: 'Leasehold Improvements',
        icon: 'Hammer',
        defaultDepreciationMethod: DepreciationMethod.STRAIGHT_LINE,
        defaultUsefulLifeMonths: 180, // 15 years or lease term
        defaultSalvageValuePercent: 0,
        capitalizationThreshold: 2500,
        taxTreatment: 'MACRS 15-year qualified improvement property',
        allowComponents: true,
        allowRevaluation: false,
        isDepreciable: true,
    },

    [AssetCategory.LAND]: {
        category: AssetCategory.LAND,
        label: 'Land',
        icon: 'Map',
        defaultDepreciationMethod: DepreciationMethod.STRAIGHT_LINE,
        defaultUsefulLifeMonths: 0, // Not depreciable
        defaultSalvageValuePercent: 100,
        capitalizationThreshold: 0,
        taxTreatment: 'Not depreciable',
        allowComponents: false,
        allowRevaluation: true,
        isDepreciable: false,
    },

    [AssetCategory.CONSTRUCTION_IN_PROGRESS]: {
        category: AssetCategory.CONSTRUCTION_IN_PROGRESS,
        label: 'Construction in Progress',
        icon: 'HardHat',
        defaultDepreciationMethod: DepreciationMethod.STRAIGHT_LINE,
        defaultUsefulLifeMonths: 0, // Not depreciable until complete
        defaultSalvageValuePercent: 0,
        capitalizationThreshold: 0,
        taxTreatment: 'Capitalize until placed in service',
        allowComponents: false,
        allowRevaluation: false,
        isDepreciable: false,
    },

    [AssetCategory.RIGHT_OF_USE]: {
        category: AssetCategory.RIGHT_OF_USE,
        label: 'Right-of-Use Assets',
        icon: 'FileSignature',
        defaultDepreciationMethod: DepreciationMethod.STRAIGHT_LINE,
        defaultUsefulLifeMonths: 60, // Lease term
        defaultSalvageValuePercent: 0,
        capitalizationThreshold: 0,
        taxTreatment: 'IFRS 16 / ASC 842 lease accounting',
        allowComponents: false,
        allowRevaluation: false,
        isDepreciable: true,
    },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getAssetClassConfig(category: AssetCategory): AssetClassConfig {
    return ASSET_CLASS_CONFIGS[category];
}

export function getDefaultUsefulLife(category: AssetCategory): number {
    return ASSET_CLASS_CONFIGS[category].defaultUsefulLifeMonths;
}

export function getDefaultDepreciationMethod(category: AssetCategory): DepreciationMethod {
    return ASSET_CLASS_CONFIGS[category].defaultDepreciationMethod;
}

export function getCapitalizationThreshold(category: AssetCategory): number {
    return ASSET_CLASS_CONFIGS[category].capitalizationThreshold;
}

export function isDepreciableCategory(category: AssetCategory): boolean {
    return ASSET_CLASS_CONFIGS[category].isDepreciable;
}

export function getAllCategories(): AssetCategory[] {
    return Object.values(AssetCategory);
}

export function getCategoriesByType(type: 'TANGIBLE' | 'INTANGIBLE'): AssetCategory[] {
    const tangible = [
        AssetCategory.BUILDINGS,
        AssetCategory.MACHINERY,
        AssetCategory.VEHICLES,
        AssetCategory.IT_EQUIPMENT,
        AssetCategory.FURNITURE,
        AssetCategory.LEASEHOLD_IMPROVEMENTS,
        AssetCategory.LAND,
        AssetCategory.CONSTRUCTION_IN_PROGRESS,
    ];

    const intangible = [
        AssetCategory.INTANGIBLE_ASSETS,
        AssetCategory.CAPITALIZED_SOFTWARE,
        AssetCategory.RIGHT_OF_USE,
    ];

    return type === 'TANGIBLE' ? tangible : intangible;
}

// =============================================================================
// CAPEX VS OPEX CLASSIFICATION HELPER
// =============================================================================

export interface CapExClassification {
    classification: 'CAPEX' | 'OPEX' | 'BORDERLINE';
    reason: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function classifyCapExOpEx(
    amount: number,
    description: string,
    category?: AssetCategory
): CapExClassification {
    const lowerDesc = description.toLowerCase();

    // Clear OpEx indicators
    const opExKeywords = ['repair', 'maintenance', 'subscription', 'monthly', 'annual fee', 'service', 'cleaning'];
    if (opExKeywords.some(kw => lowerDesc.includes(kw))) {
        return { classification: 'OPEX', reason: 'Appears to be maintenance or recurring expense', confidence: 'HIGH' };
    }

    // Clear CapEx indicators
    const capExKeywords = ['purchase', 'acquisition', 'new equipment', 'install', 'construct', 'build'];
    if (capExKeywords.some(kw => lowerDesc.includes(kw))) {
        return { classification: 'CAPEX', reason: 'Appears to be asset acquisition', confidence: 'HIGH' };
    }

    // Check threshold
    if (category) {
        const threshold = getCapitalizationThreshold(category);
        if (amount < threshold) {
            return { classification: 'OPEX', reason: `Below ${category} capitalization threshold of ${threshold}`, confidence: 'HIGH' };
        }
    }

    // Default threshold check (common $5,000 threshold)
    if (amount < 5000) {
        return { classification: 'OPEX', reason: 'Below common capitalization threshold', confidence: 'MEDIUM' };
    }

    if (amount >= 5000 && amount < 10000) {
        return { classification: 'BORDERLINE', reason: 'Amount near capitalization threshold - review required', confidence: 'LOW' };
    }

    return { classification: 'CAPEX', reason: 'Significant expenditure likely qualifies for capitalization', confidence: 'MEDIUM' };
}