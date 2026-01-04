// =============================================================================
// MONTE CARLO SIMULATION FOR FX SCENARIOS
// src/lib/monte-carlo.ts
// =============================================================================

/**
 * Geometric Brownian Motion (GBM) parameters
 */
export interface GBMParams {
  currentRate: number;
  annualVolatility: number; // Historical volatility (e.g., 0.15 for 15%)
  annualDrift: number; // Expected annual return/drift (e.g., 0.02 for 2%)
  timeHorizonDays: number;
  numSimulations: number;
  numSteps?: number; // Steps per simulation (defaults to timeHorizonDays)
}

/**
 * Monte Carlo simulation result
 */
export interface MonteCarloResult {
  paths: number[][]; // Each path is an array of rates over time
  finalRates: number[];
  statistics: {
    mean: number;
    median: number;
    min: number;
    max: number;
    percentile5: number;
    percentile25: number;
    percentile75: number;
    percentile95: number;
    standardDeviation: number;
    valueAtRisk95: number; // 95% VaR (worst 5% of outcomes)
    expectedShortfall: number; // Average of worst 5% outcomes
  };
  confidenceIntervals: {
    ci90: [number, number];
    ci95: [number, number];
    ci99: [number, number];
  };
}

/**
 * Generate a random number from standard normal distribution
 * Using Box-Muller transform
 */
function randomNormal(): number {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Calculate percentile of an array
 */
function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower]);
}

/**
 * Calculate standard deviation
 */
function stdDev(arr: number[], mean: number): number {
  const squareDiffs = arr.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / arr.length;
  return Math.sqrt(avgSquareDiff);
}

/**
 * Run Monte Carlo simulation using Geometric Brownian Motion
 *
 * GBM formula: dS = μ*S*dt + σ*S*dW
 * Where:
 * - S = asset price (exchange rate)
 * - μ = drift (expected return)
 * - σ = volatility
 * - dt = time step
 * - dW = Wiener process increment (random walk)
 */
export function runMonteCarloGBM(params: GBMParams): MonteCarloResult {
  const {
    currentRate,
    annualVolatility,
    annualDrift,
    timeHorizonDays,
    numSimulations,
    numSteps = timeHorizonDays,
  } = params;

  // Convert annual parameters to daily
  const dt = timeHorizonDays / 252 / numSteps; // 252 trading days per year
  const drift = annualDrift * dt;
  const volatility = annualVolatility * Math.sqrt(dt);

  const paths: number[][] = [];
  const finalRates: number[] = [];

  // Run simulations
  for (let sim = 0; sim < numSimulations; sim++) {
    const path: number[] = [currentRate];
    let rate = currentRate;

    for (let step = 0; step < numSteps; step++) {
      const shock = randomNormal();
      // GBM: S(t+dt) = S(t) * exp((μ - σ²/2)*dt + σ*√dt*Z)
      rate = rate * Math.exp(
        (annualDrift - 0.5 * annualVolatility * annualVolatility) * dt +
        annualVolatility * Math.sqrt(dt) * shock
      );
      path.push(rate);
    }

    paths.push(path);
    finalRates.push(rate);
  }

  // Calculate statistics
  const sortedFinal = [...finalRates].sort((a, b) => a - b);
  const mean = finalRates.reduce((sum, r) => sum + r, 0) / finalRates.length;
  const median = percentile(finalRates, 50);

  const p5 = percentile(finalRates, 5);
  const p25 = percentile(finalRates, 25);
  const p75 = percentile(finalRates, 75);
  const p95 = percentile(finalRates, 95);

  // Value at Risk (VaR) - worst 5% loss from current rate
  const var95 = currentRate - p5;

  // Expected Shortfall (CVaR) - average of worst 5%
  const worstCount = Math.ceil(finalRates.length * 0.05);
  const expectedShortfall = sortedFinal.slice(0, worstCount).reduce((sum, r) => sum + r, 0) / worstCount;

  return {
    paths,
    finalRates,
    statistics: {
      mean,
      median,
      min: sortedFinal[0],
      max: sortedFinal[sortedFinal.length - 1],
      percentile5: p5,
      percentile25: p25,
      percentile75: p75,
      percentile95: p95,
      standardDeviation: stdDev(finalRates, mean),
      valueAtRisk95: var95,
      expectedShortfall,
    },
    confidenceIntervals: {
      ci90: [percentile(finalRates, 5), percentile(finalRates, 95)],
      ci95: [percentile(finalRates, 2.5), percentile(finalRates, 97.5)],
      ci99: [percentile(finalRates, 0.5), percentile(finalRates, 99.5)],
    },
  };
}

/**
 * Estimate historical volatility from price data
 */
export function estimateVolatility(prices: number[], annualize: boolean = true): number {
  if (prices.length < 2) return 0;

  // Calculate log returns
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]));
  }

  // Calculate standard deviation of returns
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1);
  const dailyVol = Math.sqrt(variance);

  // Annualize if requested (assuming daily data, 252 trading days)
  return annualize ? dailyVol * Math.sqrt(252) : dailyVol;
}

/**
 * Currency pair volatility estimates (approximate annual volatility)
 */
export const CURRENCY_VOLATILITIES: Record<string, number> = {
  'EUR/USD': 0.08,
  'USD/EUR': 0.08,
  'GBP/USD': 0.10,
  'USD/GBP': 0.10,
  'USD/JPY': 0.09,
  'JPY/USD': 0.09,
  'USD/CHF': 0.08,
  'CHF/USD': 0.08,
  'AUD/USD': 0.12,
  'USD/AUD': 0.12,
  'USD/CAD': 0.08,
  'CAD/USD': 0.08,
  'NZD/USD': 0.12,
  'USD/NZD': 0.12,
  'EUR/GBP': 0.07,
  'GBP/EUR': 0.07,
  'EUR/JPY': 0.10,
  'JPY/EUR': 0.10,
  // Emerging market currencies (higher volatility)
  'USD/BRL': 0.18,
  'BRL/USD': 0.18,
  'USD/ZAR': 0.16,
  'ZAR/USD': 0.16,
  'USD/TRY': 0.25,
  'TRY/USD': 0.25,
  'USD/MXN': 0.14,
  'MXN/USD': 0.14,
  'USD/INR': 0.08,
  'INR/USD': 0.08,
  'USD/CNY': 0.05,
  'CNY/USD': 0.05,
};

/**
 * Get default volatility for a currency pair
 */
export function getDefaultVolatility(baseCurrency: string, quoteCurrency: string): number {
  const pair = `${baseCurrency}/${quoteCurrency}`;
  const reversePair = `${quoteCurrency}/${baseCurrency}`;

  if (CURRENCY_VOLATILITIES[pair]) return CURRENCY_VOLATILITIES[pair];
  if (CURRENCY_VOLATILITIES[reversePair]) return CURRENCY_VOLATILITIES[reversePair];

  // Default volatility for unknown pairs
  return 0.10;
}

/**
 * Scenario analysis based on Monte Carlo results
 */
export interface ScenarioAnalysis {
  baseCurrency: string;
  quoteCurrency: string;
  currentRate: number;
  timeHorizon: string;
  scenarios: {
    name: string;
    probability: string;
    rate: number;
    change: number;
    changePercent: number;
  }[];
  riskMetrics: {
    var95: number;
    var99: number;
    expectedShortfall: number;
    maxDrawdown: number;
  };
}

/**
 * Generate scenario analysis from Monte Carlo results
 */
export function generateScenarioAnalysis(
  result: MonteCarloResult,
  baseCurrency: string,
  quoteCurrency: string,
  currentRate: number,
  timeHorizonDays: number
): ScenarioAnalysis {
  const { statistics, confidenceIntervals } = result;

  const timeHorizon = timeHorizonDays <= 7 ? '1 Week' :
                      timeHorizonDays <= 30 ? '1 Month' :
                      timeHorizonDays <= 90 ? '3 Months' :
                      timeHorizonDays <= 180 ? '6 Months' : '1 Year';

  return {
    baseCurrency,
    quoteCurrency,
    currentRate,
    timeHorizon,
    scenarios: [
      {
        name: 'Best Case (95th percentile)',
        probability: '5%',
        rate: statistics.percentile95,
        change: statistics.percentile95 - currentRate,
        changePercent: ((statistics.percentile95 - currentRate) / currentRate) * 100,
      },
      {
        name: 'Optimistic (75th percentile)',
        probability: '25%',
        rate: statistics.percentile75,
        change: statistics.percentile75 - currentRate,
        changePercent: ((statistics.percentile75 - currentRate) / currentRate) * 100,
      },
      {
        name: 'Expected (Mean)',
        probability: '50%',
        rate: statistics.mean,
        change: statistics.mean - currentRate,
        changePercent: ((statistics.mean - currentRate) / currentRate) * 100,
      },
      {
        name: 'Pessimistic (25th percentile)',
        probability: '25%',
        rate: statistics.percentile25,
        change: statistics.percentile25 - currentRate,
        changePercent: ((statistics.percentile25 - currentRate) / currentRate) * 100,
      },
      {
        name: 'Worst Case (5th percentile)',
        probability: '5%',
        rate: statistics.percentile5,
        change: statistics.percentile5 - currentRate,
        changePercent: ((statistics.percentile5 - currentRate) / currentRate) * 100,
      },
    ],
    riskMetrics: {
      var95: statistics.valueAtRisk95,
      var99: currentRate - confidenceIntervals.ci99[0],
      expectedShortfall: statistics.expectedShortfall,
      maxDrawdown: currentRate - statistics.min,
    },
  };
}
