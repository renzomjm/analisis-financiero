import { Holding, Transaction } from '../types';

// In-memory client cache for historical MEP by date (YYYY-MM-DD)
const clientMepCache: Record<string, { mep: number; matchedDate: string; source: string }> = {};

/**
 * Fetches the historical USD MEP for a specific transaction date from Ámbito Financiero (via server proxy)
 */
export async function fetchHistoricalMep(dateStr: string): Promise<{ mep: number; matchedDate: string; source: string } | null> {
  const clean = dateStr ? dateStr.trim().split('T')[0] : '';
  if (!clean || !/^\d{4}-\d{2}-\d{2}$/.test(clean)) return null;

  if (clientMepCache[clean]) {
    return clientMepCache[clean];
  }

  try {
    const res = await fetch(`/api/mep/historical?date=${encodeURIComponent(clean)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok' && typeof data.mep === 'number' && data.mep > 0) {
        const item = {
          mep: data.mep,
          matchedDate: data.matchedDate || clean,
          source: data.source || 'Ámbito Financiero'
        };
        clientMepCache[clean] = item;
        return item;
      }
    }
  } catch (err) {
    console.warn('Error fetching historical MEP for', clean, err);
  }
  return null;
}

/**
 * Batch fetches historical MEP for multiple dates at once
 */
export async function fetchHistoricalMepBatch(dates: string[]): Promise<Record<string, { mep: number; matchedDate: string; source: string }>> {
  const missingDates = Array.from(
    new Set(dates.filter(d => d && !clientMepCache[d.split('T')[0]]))
  );

  if (missingDates.length === 0) {
    const cached: Record<string, { mep: number; matchedDate: string; source: string }> = {};
    for (const d of dates) {
      const c = d.split('T')[0];
      if (clientMepCache[c]) cached[c] = clientMepCache[c];
    }
    return cached;
  }

  try {
    const res = await fetch('/api/mep/historical-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dates: missingDates })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok' && data.rates) {
        Object.assign(clientMepCache, data.rates);
      }
    }
  } catch (err) {
    console.warn('Error in batch historical MEP fetch:', err);
  }

  const result: Record<string, { mep: number; matchedDate: string; source: string }> = {};
  for (const d of dates) {
    const c = d.split('T')[0];
    if (clientMepCache[c]) result[c] = clientMepCache[c];
  }
  return result;
}

export function getCachedMep(date: string): number | null {
  if (!date) return null;
  const clean = date.split('T')[0];
  if (clientMepCache[clean] && clientMepCache[clean].mep > 0) {
    return clientMepCache[clean].mep;
  }
  return null;
}

export interface HoldingValuation {
  id: string;
  ticker: string;
  name: string;
  assetType: Holding['assetType'];
  nominales: number;
  currentPrice: number;
  purchasePrice: number;
  currency: 'ARS' | 'USD';
  dailyChangePct: number;
  notes?: string;

  // ARS metrics
  valueArs: number;
  investedArs: number;
  profitArs: number;
  profitPctArs: number;
  isArsPositive: boolean;
  dailyChangeArs: number;
  dailyChangePctArs: number;

  // USD (MEP) metrics calculated with historical MEP at purchase date
  purchasePriceUsd: number; // Historical PPP in USD
  currentPriceUsd: number;  // Current price in USD
  valueUsd: number;         // Current value in USD
  investedUsd: number;      // Total invested in USD taking historical MEP
  profitUsd: number;        // Total profit in USD
  profitPctUsd: number;     // Historical profit % in USD
  isUsdPositive: boolean;
  dailyChangeUsd: number;   // Today's USD change (considering asset + MEP daily shift)
  dailyChangePctUsd: number;

  // Supporting metadata
  purchaseMepRateAvg: number; // Historical weighted average purchase MEP
  weightPct: number;
  hasHistoricalMep: boolean; // True if calculated with real historical MEP from Ámbito or transactions
  mepSource?: string;
  purchaseDate?: string;
}

/**
 * Calculates complete valuation and performance for a holding in both ARS and USD (MEP),
 * strictly respecting the historical MEP at the date of each purchase transaction.
 */
export function calculateHoldingValuation(
  holding: Holding,
  transactions: Transaction[] = [],
  currentDollarMep: number = 0,
  yesterdayDollarMep: number = 0,
  totalPortfolioArs: number = 0
): HoldingValuation {
  const mep = currentDollarMep > 0 ? currentDollarMep : 1525;
  const prevMep = yesterdayDollarMep > 0 ? yesterdayDollarMep : mep;

  const currentPriceArs = holding.currency === 'USD' ? holding.currentPrice * mep : holding.currentPrice;
  const currentPriceUsd = holding.currency === 'USD' ? holding.currentPrice : (holding.currentPrice / mep);

  const valueArs = holding.nominales * currentPriceArs;
  const valueUsd = holding.nominales * currentPriceUsd;

  // Historical buy transactions for this ticker
  const cleanTicker = holding.ticker.trim().toUpperCase();
  const buyTxs = transactions.filter(
    t => t.ticker.trim().toUpperCase() === cleanTicker && 
         (t.type === 'Compra' || t.type?.toLowerCase() === 'compra')
  );

  let investedArs = 0;
  let investedUsd = 0;
  let purchasePriceUsd = 0;
  let purchaseMepRateAvg = mep;
  let hasHistoricalMep = false;
  let mepSource = '';
  let earliestDate = holding.purchaseDate || '';

  if (buyTxs.length > 0) {
    let sumNominales = 0;
    let sumCostArs = 0;
    let sumCostUsd = 0;
    let countHistoricalRates = 0;

    for (const tx of buyTxs) {
      const txNom = tx.nominales;
      if (txNom <= 0) continue;

      if (!earliestDate || (tx.date && tx.date < earliestDate)) {
        earliestDate = tx.date;
      }

      // Check if tx has mepRate, or if in clientMepCache
      let txMep = 0;
      if (tx.mepRate && tx.mepRate > 0) {
        txMep = tx.mepRate;
        countHistoricalRates++;
        if (!mepSource) mepSource = tx.sourceMep || 'Ámbito Financiero';
      } else if (tx.date) {
        const cached = getCachedMep(tx.date);
        if (cached && cached > 0) {
          txMep = cached;
          countHistoricalRates++;
          if (!mepSource) mepSource = 'Ámbito Financiero (Caché)';
        }
      }

      // Fallback to holding's stored purchase MEP if tx has none
      if (txMep === 0 && holding.purchaseMepRate && holding.purchaseMepRate > 0) {
        txMep = holding.purchaseMepRate;
        countHistoricalRates++;
        if (!mepSource) mepSource = 'MEP de compra de tenencia';
      }

      // If still 0, fallback to current MEP (temporary until batch fetch completes)
      const effectiveTxMep = txMep > 0 ? txMep : mep;

      if (tx.currency === 'USD') {
        const costUsd = txNom * tx.price;
        const costArs = costUsd * effectiveTxMep;
        sumNominales += txNom;
        sumCostUsd += costUsd;
        sumCostArs += costArs;
      } else {
        // ARS buy transaction: convert using historical MEP of transaction date
        const costArs = txNom * tx.price;
        const costUsd = costArs / effectiveTxMep;
        sumNominales += txNom;
        sumCostArs += costArs;
        sumCostUsd += costUsd;
      }
    }

    if (sumNominales > 0) {
      const avgPriceArs = sumCostArs / sumNominales;
      purchasePriceUsd = sumCostUsd / sumNominales;
      investedArs = holding.nominales * avgPriceArs;
      investedUsd = holding.nominales * purchasePriceUsd;
      purchaseMepRateAvg = purchasePriceUsd > 0 ? (avgPriceArs / purchasePriceUsd) : mep;
      hasHistoricalMep = countHistoricalRates > 0;
    } else {
      investedArs = holding.currency === 'USD' ? holding.nominales * holding.purchasePrice * mep : holding.nominales * holding.purchasePrice;
      investedUsd = holding.currency === 'USD' ? holding.nominales * holding.purchasePrice : (investedArs / mep);
      purchasePriceUsd = holding.nominales > 0 ? investedUsd / holding.nominales : 0;
      purchaseMepRateAvg = mep;
      hasHistoricalMep = false;
    }
  } else {
    // If no buy transactions logged yet, check holding's stored fields
    if (holding.purchaseMepRate && holding.purchaseMepRate > 0) {
      hasHistoricalMep = true;
      purchaseMepRateAvg = holding.purchaseMepRate;
      mepSource = 'MEP de compra de tenencia';
      if (holding.currency === 'USD') {
        purchasePriceUsd = holding.purchasePrice;
        investedUsd = holding.nominales * purchasePriceUsd;
        investedArs = investedUsd * purchaseMepRateAvg;
      } else {
        purchasePriceUsd = holding.purchasePrice / purchaseMepRateAvg;
        investedUsd = holding.nominales * purchasePriceUsd;
        investedArs = holding.nominales * holding.purchasePrice;
      }
    } else if (holding.purchasePriceUsd && holding.purchasePriceUsd > 0) {
      hasHistoricalMep = true;
      purchasePriceUsd = holding.purchasePriceUsd;
      investedUsd = holding.nominales * purchasePriceUsd;
      investedArs = holding.currency === 'USD' ? holding.nominales * holding.purchasePrice * mep : holding.nominales * holding.purchasePrice;
      purchaseMepRateAvg = holding.purchasePrice / purchasePriceUsd;
      mepSource = 'Precio USD histórico';
    } else if (holding.purchaseDate) {
      const cached = getCachedMep(holding.purchaseDate);
      if (cached && cached > 0) {
        hasHistoricalMep = true;
        purchaseMepRateAvg = cached;
        mepSource = 'Ámbito Financiero (Fecha compra)';
        if (holding.currency === 'USD') {
          purchasePriceUsd = holding.purchasePrice;
          investedUsd = holding.nominales * purchasePriceUsd;
          investedArs = investedUsd * purchaseMepRateAvg;
        } else {
          purchasePriceUsd = holding.purchasePrice / purchaseMepRateAvg;
          investedUsd = holding.nominales * purchasePriceUsd;
          investedArs = holding.nominales * holding.purchasePrice;
        }
      } else {
        // Has date but waiting for cache
        hasHistoricalMep = false;
        purchaseMepRateAvg = mep;
        purchasePriceUsd = holding.currency === 'USD' ? holding.purchasePrice : holding.purchasePrice / mep;
        investedUsd = holding.nominales * purchasePriceUsd;
        investedArs = holding.nominales * holding.purchasePrice;
      }
    } else {
      // Neither transactions nor purchase date/mep rate exist
      hasHistoricalMep = false;
      purchaseMepRateAvg = mep;
      purchasePriceUsd = holding.currency === 'USD' ? holding.purchasePrice : holding.purchasePrice / mep;
      investedUsd = holding.nominales * purchasePriceUsd;
      investedArs = holding.nominales * holding.purchasePrice;
    }
  }

  // Historical profit calculations
  const profitArs = valueArs - investedArs;
  const profitPctArs = investedArs > 0 ? (profitArs / investedArs) * 100 : 0;

  const profitUsd = valueUsd - investedUsd;
  const profitPctUsd = investedUsd > 0 ? (profitUsd / investedUsd) * 100 : 0;

  // Daily performance calculations
  const dailyChangePct = typeof holding.dailyChangePct === 'number' ? holding.dailyChangePct : 0;
  const factor = 1 + (dailyChangePct / 100);
  const prevValArs = factor > 0.001 ? valueArs / factor : valueArs;
  const dailyChangeArs = valueArs - prevValArs;
  const dailyChangePctArs = dailyChangePct;

  // Yesterday's valuation in USD:
  // For ARS assets: yesterday's ARS value divided by yesterday's closing MEP
  // For USD assets: yesterday's USD value divided by factor
  const prevValUsd = holding.currency === 'USD'
    ? (factor > 0.001 ? valueUsd / factor : valueUsd)
    : (prevMep > 0 ? prevValArs / prevMep : valueUsd);

  const dailyChangeUsd = valueUsd - prevValUsd;
  const dailyChangePctUsd = prevValUsd > 0 ? (dailyChangeUsd / prevValUsd) * 100 : 0;

  const weightPct = totalPortfolioArs > 0 ? (valueArs / totalPortfolioArs) * 100 : 0;

  return {
    ...holding,
    valueArs,
    investedArs,
    profitArs,
    profitPctArs,
    isArsPositive: profitArs >= 0,
    dailyChangeArs,
    dailyChangePctArs,

    purchasePriceUsd,
    currentPriceUsd,
    valueUsd,
    investedUsd,
    profitUsd,
    profitPctUsd,
    isUsdPositive: profitUsd >= 0,
    dailyChangeUsd,
    dailyChangePctUsd,

    purchaseMepRateAvg,
    weightPct,
    hasHistoricalMep,
    mepSource,
    purchaseDate: earliestDate || holding.purchaseDate
  };
}
