/**
 * Free Live Exchange Rate Service
 * Uses open.er-api.com as primary free public endpoint with fallback to exchangerate-api.com
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache
const ratesCache = new Map();

/**
 * Fetches live exchange rate between baseCurrency and targetCurrency.
 * Returns the conversion multiplier (1 baseCurrency = X targetCurrency).
 *
 * @param {string} baseCurrency e.g. 'USD'
 * @param {string} targetCurrency e.g. 'PHP'
 * @param {boolean} bypassCache whether to force fresh network request
 * @returns {Promise<{ rate: number, timestamp: string, source: string }>}
 */
export async function fetchLiveExchangeRate(baseCurrency = 'USD', targetCurrency = 'PHP', bypassCache = false) {
  const base = (baseCurrency || 'USD').toUpperCase();
  const target = (targetCurrency || 'PHP').toUpperCase();

  if (base === target) {
    return {
      rate: 1.0,
      timestamp: new Date().toISOString(),
      source: 'identity',
    };
  }

  const cacheKey = `${base}_${target}`;
  const cached = ratesCache.get(cacheKey);
  const now = Date.now();

  if (!bypassCache && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return {
      rate: cached.rate,
      timestamp: cached.timestamp,
      source: 'cache',
    };
  }

  // 1. Try primary free public API (open.er-api.com)
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    if (res.ok) {
      const data = await res.json();
      if (data.rates && typeof data.rates[target] === 'number') {
        const rate = data.rates[target];
        const timestamp = data.time_last_update_utc || new Date().toISOString();
        ratesCache.set(cacheKey, { rate, timestamp, fetchedAt: now });
        return { rate, timestamp, source: 'open.er-api.com' };
      }
    }
  } catch (err) {
    console.warn('Primary exchange rate fetch failed, trying fallback API:', err);
  }

  // 2. Fallback to exchangerate-api.com free open endpoint
  try {
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
    if (res.ok) {
      const data = await res.json();
      if (data.rates && typeof data.rates[target] === 'number') {
        const rate = data.rates[target];
        const timestamp = new Date(data.date || now).toISOString();
        ratesCache.set(cacheKey, { rate, timestamp, fetchedAt: now });
        return { rate, timestamp, source: 'exchangerate-api.com' };
      }
    }
  } catch (err) {
    console.error('Fallback exchange rate fetch also failed:', err);
  }

  // If both failed and we have a stale cache, return it
  if (cached) {
    return {
      rate: cached.rate,
      timestamp: cached.timestamp,
      source: 'stale-cache',
    };
  }

  // Default fallback estimation if offline / completely unreachable
  const defaultRate = getDefaultFallbackRate(base, target);
  return {
    rate: defaultRate,
    timestamp: new Date().toISOString(),
    source: 'default-fallback',
  };
}

/**
 * Sensible offline fallback rates for common currency pairs if network is unavailable
 */
function getDefaultFallbackRate(base, target) {
  const usdRates = {
    USD: 1,
    PHP: 58.5,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 155.0,
    CAD: 1.38,
    AUD: 1.52,
    SGD: 1.34,
    INR: 85.0,
    AED: 3.67,
    CHF: 0.9,
    CNY: 7.25,
    HKD: 7.8,
    KRW: 1380.0,
    MXN: 18.5,
    BRL: 5.6,
    NZD: 1.65,
    THB: 36.5,
    MYR: 4.7,
    IDR: 16200.0,
    VND: 25400.0,
    SEK: 10.6,
    NOK: 10.8,
    SAR: 3.75,
    TRY: 33.0,
    ZAR: 18.2,
  };

  const baseRateToUSD = usdRates[base] || 1;
  const targetRateToUSD = usdRates[target] || 1;

  return targetRateToUSD / baseRateToUSD;
}
