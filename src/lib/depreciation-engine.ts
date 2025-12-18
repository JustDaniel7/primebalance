// =============================================================================
// PRIMEBALANCE - DEPRECIATION CALCULATION ENGINE
// =============================================================================

import {
    Asset,
    AssetBook,
    DepreciationMethod,
    DepreciationSchedule,
    DepreciationScheduleEntry,
    BookType,
    AssetStatus,
} from '@/types/asset';

// -----------------------------------------------------------------------------
// CORE CALCULATION FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Calculate depreciation for a single period based on method
 */
export function calculatePeriodDepreciation(
    method: DepreciationMethod,
    acquisitionCost: number,
    salvageValue: number,
    usefulLifeMonths: number,
    currentPeriod: number,
    openingBookValue: number,
    options?: {
        totalUnits?: number;
        unitsThisPeriod?: number;
        customFormula?: string;
        decliningRate?: number;
    }
): number {
    const depreciableBase = acquisitionCost - salvageValue;

    // Don't depreciate below salvage value
    if (openingBookValue <= salvageValue) {
        return 0;
    }

    let depreciation = 0;

    switch (method) {
        case DepreciationMethod.STRAIGHT_LINE:
            depreciation = depreciableBase / usefulLifeMonths;
            break;

        case DepreciationMethod.DECLINING_BALANCE:
            const dbRate = options?.decliningRate ?? (1 / (usefulLifeMonths / 12));
            depreciation = openingBookValue * (dbRate / 12);
            break;

        case DepreciationMethod.DOUBLE_DECLINING_BALANCE:
            const ddbRate = (2 / (usefulLifeMonths / 12)) / 12;
            depreciation = openingBookValue * ddbRate;
            break;

        case DepreciationMethod.SUM_OF_YEARS_DIGITS:
            const years = usefulLifeMonths / 12;
            const sumOfYears = (years * (years + 1)) / 2;
            const currentYear = Math.ceil(currentPeriod / 12);
            const remainingYears = years - currentYear + 1;
            const yearlyDepreciation = (remainingYears / sumOfYears) * depreciableBase;
            depreciation = yearlyDepreciation / 12;
            break;

        case DepreciationMethod.UNITS_OF_PRODUCTION:
            if (options?.totalUnits && options?.unitsThisPeriod) {
                const perUnitDepreciation = depreciableBase / options.totalUnits;
                depreciation = perUnitDepreciation * options.unitsThisPeriod;
            }
            break;

        case DepreciationMethod.CUSTOM:
            if (options?.customFormula) {
                depreciation = evaluateCustomFormula(
                    options.customFormula,
                    acquisitionCost,
                    salvageValue,
                    usefulLifeMonths,
                    currentPeriod,
                    openingBookValue
                );
            }
            break;
    }

    // Ensure we don't depreciate below salvage value
    const maxDepreciation = openingBookValue - salvageValue;
    return Math.min(Math.max(0, depreciation), maxDepreciation);
}

/**
 * Evaluate a custom depreciation formula
 * Supported variables: cost, salvage, life, period, bookValue
 */
function evaluateCustomFormula(
    formula: string,
    acquisitionCost: number,
    salvageValue: number,
    usefulLifeMonths: number,
    currentPeriod: number,
    openingBookValue: number
): number {
    try {
        const context = {
            cost: acquisitionCost,
            salvage: salvageValue,
            life: usefulLifeMonths,
            period: currentPeriod,
            bookValue: openingBookValue,
            base: acquisitionCost - salvageValue,
        };

        // Simple formula evaluation (in production, use a proper expression parser)
        let evaluated = formula;
        Object.entries(context).forEach(([key, value]) => {
            evaluated = evaluated.replace(new RegExp(key, 'g'), String(value));
        });

        // eslint-disable-next-line no-eval
        return Math.max(0, eval(evaluated));
    } catch {
        console.error('Failed to evaluate custom formula:', formula);
        return 0;
    }
}

// -----------------------------------------------------------------------------
// SCHEDULE GENERATION
// -----------------------------------------------------------------------------

/**
 * Generate complete depreciation schedule for an asset
 */
export function generateDepreciationSchedule(
    asset: Asset,
    book: AssetBook,
    startDate?: string
): DepreciationSchedule {
    const entries: DepreciationScheduleEntry[] = [];
    const scheduleStart = startDate || asset.depreciationStartDate || asset.acquisitionDate;

    if (!scheduleStart) {
        return {
            assetId: asset.id,
            bookType: book.bookType,
            entries: [],
            totalDepreciation: 0,
            totalPeriods: 0,
            generatedAt: new Date().toISOString(),
        };
    }

    let currentDate = new Date(scheduleStart);
    let openingBookValue = book.acquisitionCost;
    let accumulatedDepreciation = 0;
    let periodNumber = 1;

    while (openingBookValue > book.salvageValue && periodNumber <= book.usefulLifeMonths) {
        const periodStart = new Date(currentDate);
        const periodEnd = new Date(currentDate);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(periodEnd.getDate() - 1);

        const depreciationAmount = calculatePeriodDepreciation(
            book.depreciationMethod,
            book.acquisitionCost,
            book.salvageValue,
            book.usefulLifeMonths,
            periodNumber,
            openingBookValue,
            {
                totalUnits: asset.totalUnits,
                customFormula: asset.customFormula,
            }
        );

        accumulatedDepreciation += depreciationAmount;
        const closingBookValue = openingBookValue - depreciationAmount;

        entries.push({
            id: `dep-${asset.id}-${book.bookType}-${periodNumber}`,
            assetId: asset.id,
            bookType: book.bookType,
            periodNumber,
            periodStartDate: periodStart.toISOString().split('T')[0],
            periodEndDate: periodEnd.toISOString().split('T')[0],
            openingBookValue,
            depreciationAmount,
            accumulatedDepreciation,
            closingBookValue,
            isPosted: false,
        });

        openingBookValue = closingBookValue;
        currentDate.setMonth(currentDate.getMonth() + 1);
        periodNumber++;
    }

    return {
        assetId: asset.id,
        bookType: book.bookType,
        entries,
        totalDepreciation: accumulatedDepreciation,
        totalPeriods: entries.length,
        generatedAt: new Date().toISOString(),
    };
}

/**
 * Calculate partial period depreciation (for mid-month acquisitions/disposals)
 */
export function calculatePartialPeriodDepreciation(
    fullPeriodDepreciation: number,
    startDate: string,
    endDate: string,
    isStartPartial: boolean,
    isEndPartial: boolean
): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();

    if (isStartPartial) {
        const remainingDays = daysInMonth - start.getDate() + 1;
        return (fullPeriodDepreciation / daysInMonth) * remainingDays;
    }

    if (isEndPartial) {
        const usedDays = end.getDate();
        return (fullPeriodDepreciation / daysInMonth) * usedDays;
    }

    return fullPeriodDepreciation;
}

// -----------------------------------------------------------------------------
// VALUATION CALCULATIONS
// -----------------------------------------------------------------------------

/**
 * Calculate current book value
 */
export function calculateBookValue(book: AssetBook): number {
    return book.acquisitionCost - book.accumulatedDepreciation - book.impairmentLosses + book.revaluationSurplus;
}

/**
 * Calculate gain/loss on disposal
 */
export function calculateDisposalGainLoss(
    carryingAmount: number,
    salePrice: number
): { amount: number; isGain: boolean } {
    const amount = salePrice - carryingAmount;
    return {
        amount: Math.abs(amount),
        isGain: amount >= 0,
    };
}

/**
 * Calculate impairment loss
 */
export function calculateImpairmentLoss(
    carryingAmount: number,
    recoverableAmount: number
): number {
    if (recoverableAmount >= carryingAmount) {
        return 0;
    }
    return carryingAmount - recoverableAmount;
}

// -----------------------------------------------------------------------------
// SCHEDULE ADJUSTMENTS
// -----------------------------------------------------------------------------

/**
 * Recalculate schedule after impairment
 */
export function recalculateScheduleAfterImpairment(
    schedule: DepreciationSchedule,
    impairmentDate: string,
    impairmentLoss: number,
    remainingUsefulLifeMonths: number
): DepreciationSchedule {
    const impairmentDateObj = new Date(impairmentDate);

    // Find the period where impairment occurred
    const impairmentPeriodIndex = schedule.entries.findIndex(entry => {
        const periodEnd = new Date(entry.periodEndDate);
        return periodEnd >= impairmentDateObj;
    });

    if (impairmentPeriodIndex === -1) {
        return schedule;
    }

    // Keep entries before impairment, recalculate after
    const keptEntries = schedule.entries.slice(0, impairmentPeriodIndex);
    const lastKeptEntry = keptEntries[keptEntries.length - 1];

    const newOpeningValue = (lastKeptEntry?.closingBookValue || schedule.entries[0].openingBookValue) - impairmentLoss;
    const newMonthlyDepreciation = newOpeningValue / remainingUsefulLifeMonths;

    let currentBookValue = newOpeningValue;
    let accumulatedDepreciation = lastKeptEntry?.accumulatedDepreciation || 0;

    const newEntries: DepreciationScheduleEntry[] = [];

    for (let i = 0; i < remainingUsefulLifeMonths; i++) {
        const periodNumber = (lastKeptEntry?.periodNumber || 0) + i + 1;
        const periodStart = new Date(impairmentDate);
        periodStart.setMonth(periodStart.getMonth() + i);
        const periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(periodEnd.getDate() - 1);

        accumulatedDepreciation += newMonthlyDepreciation;
        currentBookValue -= newMonthlyDepreciation;

        newEntries.push({
            id: `dep-${schedule.assetId}-${schedule.bookType}-${periodNumber}`,
            assetId: schedule.assetId,
            bookType: schedule.bookType,
            periodNumber,
            periodStartDate: periodStart.toISOString().split('T')[0],
            periodEndDate: periodEnd.toISOString().split('T')[0],
            openingBookValue: currentBookValue + newMonthlyDepreciation,
            depreciationAmount: newMonthlyDepreciation,
            accumulatedDepreciation,
            closingBookValue: Math.max(0, currentBookValue),
            isPosted: false,
        });
    }

    return {
        ...schedule,
        entries: [...keptEntries, ...newEntries],
        totalDepreciation: accumulatedDepreciation,
        totalPeriods: keptEntries.length + newEntries.length,
        generatedAt: new Date().toISOString(),
    };
}

// -----------------------------------------------------------------------------
// CATCH-UP DEPRECIATION
// -----------------------------------------------------------------------------

/**
 * Calculate catch-up depreciation for missed periods
 */
export function calculateCatchUpDepreciation(
    schedule: DepreciationSchedule,
    currentDate: string
): { missedPeriods: DepreciationScheduleEntry[]; totalMissed: number } {
    const current = new Date(currentDate);

    const missedPeriods = schedule.entries.filter(entry => {
        const periodEnd = new Date(entry.periodEndDate);
        return periodEnd < current && !entry.isPosted;
    });

    const totalMissed = missedPeriods.reduce((sum, entry) => sum + entry.depreciationAmount, 0);

    return { missedPeriods, totalMissed };
}

// -----------------------------------------------------------------------------
// TAX VS BOOK VARIANCE
// -----------------------------------------------------------------------------

/**
 * Calculate deferred tax difference between books
 */
export function calculateDeferredTaxDifference(
    statutoryBook: AssetBook,
    taxBook: AssetBook,
    taxRate: number
): { temporaryDifference: number; deferredTaxAsset: number; deferredTaxLiability: number } {
    const statutoryNBV = calculateBookValue(statutoryBook);
    const taxNBV = calculateBookValue(taxBook);

    const temporaryDifference = statutoryNBV - taxNBV;

    return {
        temporaryDifference,
        deferredTaxAsset: temporaryDifference < 0 ? Math.abs(temporaryDifference) * taxRate : 0,
        deferredTaxLiability: temporaryDifference > 0 ? temporaryDifference * taxRate : 0,
    };
}

// -----------------------------------------------------------------------------
// FORECASTING
// -----------------------------------------------------------------------------

/**
 * Generate depreciation forecast for future periods
 */
export function generateDepreciationForecast(
    asset: Asset,
    book: AssetBook,
    periodsAhead: number
): { period: string; amount: number; closingValue: number }[] {
    const forecast: { period: string; amount: number; closingValue: number }[] = [];

    let currentBookValue = calculateBookValue(book);
    const lastDepreciationDate = book.lastDepreciationDate || new Date().toISOString();
    let currentDate = new Date(lastDepreciationDate);

    const remainingPeriods = Math.min(
        periodsAhead,
        book.usefulLifeMonths - Math.floor(book.accumulatedDepreciation / (book.acquisitionCost / book.usefulLifeMonths))
    );

    for (let i = 0; i < remainingPeriods; i++) {
        currentDate.setMonth(currentDate.getMonth() + 1);

        const depreciation = calculatePeriodDepreciation(
            book.depreciationMethod,
            book.acquisitionCost,
            book.salvageValue,
            book.usefulLifeMonths,
            i + 1,
            currentBookValue,
            { totalUnits: asset.totalUnits }
        );

        currentBookValue -= depreciation;

        forecast.push({
            period: currentDate.toISOString().split('T')[0].substring(0, 7),
            amount: depreciation,
            closingValue: Math.max(book.salvageValue, currentBookValue),
        });

        if (currentBookValue <= book.salvageValue) break;
    }

    return forecast;
}

// -----------------------------------------------------------------------------
// VALIDATION
// -----------------------------------------------------------------------------

/**
 * Validate depreciation parameters
 */
export function validateDepreciationParams(
    acquisitionCost: number,
    salvageValue: number,
    usefulLifeMonths: number,
    method: DepreciationMethod
): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (acquisitionCost <= 0) {
        errors.push('Acquisition cost must be greater than zero');
    }

    if (salvageValue < 0) {
        errors.push('Salvage value cannot be negative');
    }

    if (salvageValue >= acquisitionCost) {
        errors.push('Salvage value must be less than acquisition cost');
    }

    if (usefulLifeMonths <= 0) {
        errors.push('Useful life must be greater than zero');
    }

    if (method === DepreciationMethod.UNITS_OF_PRODUCTION) {
        errors.push('Units of production method requires total units to be specified');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Get depreciation method display name
 */
export function getDepreciationMethodLabel(method: DepreciationMethod): string {
    const labels: Record<DepreciationMethod, string> = {
        [DepreciationMethod.STRAIGHT_LINE]: 'Straight Line',
        [DepreciationMethod.DECLINING_BALANCE]: 'Declining Balance',
        [DepreciationMethod.DOUBLE_DECLINING_BALANCE]: 'Double Declining Balance',
        [DepreciationMethod.UNITS_OF_PRODUCTION]: 'Units of Production',
        [DepreciationMethod.SUM_OF_YEARS_DIGITS]: 'Sum of Years\' Digits',
        [DepreciationMethod.CUSTOM]: 'Custom Formula',
    };
    return labels[method];
}

/**
 * Check if asset can be depreciated
 */
export function canDepreciate(asset: Asset): boolean {
    const nonDepreciableStatuses: AssetStatus[] = [
        AssetStatus.PLANNED,
        AssetStatus.DISPOSED,
        AssetStatus.SOLD,
        AssetStatus.WRITTEN_OFF,
        AssetStatus.FULLY_DEPRECIATED,
    ];

    return !nonDepreciableStatuses.includes(asset.status) && !asset.isCIP;
}

/**
 * Calculate remaining useful life in months
 */
export function calculateRemainingLife(
    usefulLifeMonths: number,
    accumulatedDepreciation: number,
    depreciableBase: number
): number {
    const percentDepreciated = accumulatedDepreciation / depreciableBase;
    return Math.max(0, Math.round(usefulLifeMonths * (1 - percentDepreciated)));
}