import { AssetType } from '../types';

export interface MarketTickerInfo {
  ticker: string;
  name: string;
  assetType: AssetType;
  currency: 'ARS' | 'USD';
  exchange: string;
  underlying?: string;
  ratio?: string;
  referencePrice?: number;
}

export const MARKET_TICKERS: MarketTickerInfo[] = [
  // --- ACCIONES LOCALES (MERVAL / BYMA) ---
  { ticker: 'YPFD', name: 'YPF Sociedad Anónima', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'GGAL', name: 'Grupo Financiero Galicia S.A.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'PAMP', name: 'Pampa Energía S.A.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'BMA', name: 'Banco Macro S.A.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'CEPU', name: 'Central Puerto S.A.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'TXAR', name: 'Ternium Argentina S.A.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'ALUA', name: 'Aluar Aluminio Argentino S.A.I.C.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'TGSU2', name: 'Transportadora de Gas del Sur S.A.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'TGNO4', name: 'Transportadora de Gas del Norte S.A.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'TRAN', name: 'Compañía de Transporte de Energía Transener', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'EDN', name: 'Empresa Distribuidora y Comercializadora Edenor', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'CRES', name: 'Cresud S.A.C.I.F. y A.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'VALO', name: 'Banco de Valores S.A.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'BYMA', name: 'Bolsas y Mercados Argentinos S.A.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'MIRG', name: 'Mirgor S.A.C.I.F.I.A.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'COME', name: 'Sociedad Comercial del Plata S.A.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'SUPV', name: 'Grupo Supervielle S.A.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'TECO2', name: 'Telecom Argentina S.A.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'BBAR', name: 'BBVA Banco Francés S.A.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'LOMA', name: 'Loma Negra C.I.A.S.A.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'AGRO', name: 'Agrometal S.A.I.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'AUSO', name: 'Autopistas del Sol S.A.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'METR', name: 'MetroGAS S.A.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'HARG', name: 'Holcim Argentina S.A.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'MOLI', name: 'Molinos Río de la Plata S.A.', assetType: 'Acción Local', currency: 'ARS', exchange: 'BYMA' },

  // --- CEDEARS (CERTIFICADOS DE DEPÓSITO ARGENTINOS) ---
  { ticker: 'AAPL', name: 'Apple Inc. (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NASDAQ: AAPL', ratio: '10:1' },
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: SPY', ratio: '20:1' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NASDAQ: NVDA', ratio: '24:1' },
  { ticker: 'MSFT', name: 'Microsoft Corporation (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NASDAQ: MSFT', ratio: '10:1' },
  { ticker: 'AMZN', name: 'Amazon.com Inc. (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NASDAQ: AMZN', ratio: '144:1' },
  { ticker: 'GOOGL', name: 'Alphabet Inc. Class A (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NASDAQ: GOOGL', ratio: '58:1' },
  { ticker: 'TSLA', name: 'Tesla Inc. (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NASDAQ: TSLA', ratio: '15:1' },
  { ticker: 'META', name: 'Meta Platforms Inc. (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NASDAQ: META', ratio: '24:1' },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust ETF (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NASDAQ: QQQ', ratio: '20:1' },
  { ticker: 'DIA', name: 'SPDR Dow Jones Industrial Average (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: DIA', ratio: '20:1' },
  { ticker: 'VIST', name: 'Vista Energy S.A.B. (CEDEAR / NYSE)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: VIST', ratio: '1:1' },
  { ticker: 'MELI', name: 'MercadoLibre Inc. (CEDEAR / NASDAQ)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NASDAQ: MELI', ratio: '60:1' },
  { ticker: 'KO', name: 'The Coca-Cola Company (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: KO', ratio: '5:1' },
  { ticker: 'PEP', name: 'PepsiCo Inc. (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NASDAQ: PEP', ratio: '6:1' },
  { ticker: 'XOM', name: 'Exxon Mobil Corporation (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: XOM', ratio: '5:1' },
  { ticker: 'CVX', name: 'Chevron Corporation (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: CVX', ratio: '8:1' },
  { ticker: 'VALE', name: 'Vale S.A. (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: VALE', ratio: '2:1' },
  { ticker: 'PBR', name: 'Petróleo Brasileiro Petrobras (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: PBR', ratio: '1:1' },
  { ticker: 'BBD', name: 'Banco Bradesco S.A. (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: BBD', ratio: '1:1' },
  { ticker: 'EWZ', name: 'iShares MSCI Brazil ETF (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: EWZ', ratio: '2:1' },
  { ticker: 'IWM', name: 'iShares Russell 2000 ETF (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: IWM', ratio: '10:1' },
  { ticker: 'GLD', name: 'SPDR Gold Shares ETF (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: GLD', ratio: '24:1' },
  { ticker: 'SLV', name: 'iShares Silver Trust ETF (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: SLV', ratio: '2:1' },
  { ticker: 'ARKK', name: 'ARK Innovation ETF (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: ARKK', ratio: '10:1' },
  { ticker: 'BRKB', name: 'Berkshire Hathaway Inc. Class B (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: BRK.B', ratio: '22:1' },
  { ticker: 'DIS', name: 'The Walt Disney Company (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: DIS', ratio: '12:1' },
  { ticker: 'INTC', name: 'Intel Corporation (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NASDAQ: INTC', ratio: '5:1' },
  { ticker: 'AMD', name: 'Advanced Micro Devices Inc. (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NASDAQ: AMD', ratio: '10:1' },
  { ticker: 'NFLX', name: 'Netflix Inc. (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NASDAQ: NFLX', ratio: '48:1' },
  { ticker: 'WMT', name: 'Walmart Inc. (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: WMT', ratio: '6:1' },
  { ticker: 'JNJ', name: 'Johnson & Johnson (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: JNJ', ratio: '10:1' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co. (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: JPM', ratio: '10:1' },
  { ticker: 'BA', name: 'The Boeing Company (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: BA', ratio: '6:1' },
  { ticker: 'DESP', name: 'Despegar.com Corp. (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: DESP', ratio: '1:1' },
  { ticker: 'GLOB', name: 'Globant S.A. (CEDEAR)', assetType: 'CEDEAR', currency: 'ARS', exchange: 'BYMA', underlying: 'NYSE: GLOB', ratio: '18:1' },

  // --- BONOS SOBERANOS Y SUBSOBERANOS ---
  { ticker: 'AL30', name: 'Bono Rep. Argentina USD 2030 Ley Arg.', assetType: 'Bono Soberano', currency: 'ARS', exchange: 'BYMA', referencePrice: 940 },
  { ticker: 'GD30', name: 'Bono Rep. Argentina USD 2030 Ley NY', assetType: 'Bono Soberano', currency: 'ARS', exchange: 'BYMA', referencePrice: 995 },
  { ticker: 'AL35', name: 'Bono Rep. Argentina USD 2035 Ley Arg.', assetType: 'Bono Soberano', currency: 'ARS', exchange: 'BYMA', referencePrice: 810 },
  { ticker: 'GD35', name: 'Bono Rep. Argentina USD 2035 Ley NY', assetType: 'Bono Soberano', currency: 'ARS', exchange: 'BYMA', referencePrice: 845 },
  { ticker: 'AE38', name: 'Bono Rep. Argentina USD 2038 Ley Arg.', assetType: 'Bono Soberano', currency: 'ARS', exchange: 'BYMA', referencePrice: 860 },
  { ticker: 'GD38', name: 'Bono Rep. Argentina USD 2038 Ley NY', assetType: 'Bono Soberano', currency: 'ARS', exchange: 'BYMA', referencePrice: 910 },
  { ticker: 'AL41', name: 'Bono Rep. Argentina USD 2041 Ley Arg.', assetType: 'Bono Soberano', currency: 'ARS', exchange: 'BYMA', referencePrice: 770 },
  { ticker: 'GD41', name: 'Bono Rep. Argentina USD 2041 Ley NY', assetType: 'Bono Soberano', currency: 'ARS', exchange: 'BYMA', referencePrice: 805 },
  { ticker: 'T2X5', name: 'Bono del Tesoro en Pesos CER 2025', assetType: 'Bono Soberano', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'TX26', name: 'Bono del Tesoro en Pesos CER 2026', assetType: 'Bono Soberano', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'DICP', name: 'Bono Discount en Pesos CER', assetType: 'Bono Soberano', currency: 'ARS', exchange: 'BYMA' },

  // --- BPOREAL ---
  { ticker: 'BPJ25', name: 'BPOREAL Serie 1 Tramo A USD', assetType: 'Bono Soberano', currency: 'USD', exchange: 'BYMA' },
  { ticker: 'BPY26', name: 'BPOREAL Serie 2 USD', assetType: 'Bono Soberano', currency: 'USD', exchange: 'BYMA' },
  { ticker: 'BPO27', name: 'BPOREAL Serie 3 USD', assetType: 'Bono Soberano', currency: 'USD', exchange: 'BYMA' },

  // --- LETRAS DEL TESORO (LECAPS / BONCAPS) ---
  { ticker: 'S31O4', name: 'Letra del Tesoro Capitalizable Pesos Oct.', assetType: 'Letra', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'S11N4', name: 'Letra del Tesoro Capitalizable Pesos Nov.', assetType: 'Letra', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'S31M5', name: 'Letra del Tesoro Capitalizable Pesos Mar.', assetType: 'Letra', currency: 'ARS', exchange: 'BYMA' },
  { ticker: 'S30A5', name: 'Letra del Tesoro Capitalizable Pesos Abr.', assetType: 'Letra', currency: 'ARS', exchange: 'BYMA' },

  // --- OBLIGACIONES NEGOCIABLES ---
  { ticker: 'YCA6O', name: 'ON YPF Clase XVI USD', assetType: 'ON Corporativa', currency: 'USD', exchange: 'BYMA' },
  { ticker: 'YFC3O', name: 'ON YPF Clase XXI USD', assetType: 'ON Corporativa', currency: 'USD', exchange: 'BYMA' },
  { ticker: 'VSC3O', name: 'ON Vista Energy Clase III USD', assetType: 'ON Corporativa', currency: 'USD', exchange: 'BYMA' },
  { ticker: 'TLC1O', name: 'ON Telecom Clase I USD', assetType: 'ON Corporativa', currency: 'USD', exchange: 'BYMA' },
  { ticker: 'IRCFO', name: 'ON IRSA Clase XIV USD', assetType: 'ON Corporativa', currency: 'USD', exchange: 'BYMA' }
];

/**
 * Searches the catalog for matches by ticker or company name
 */
export function findMatchingTickers(query: string, limit = 8): MarketTickerInfo[] {
  const clean = query.trim().toUpperCase();
  if (!clean) return [];

  // Exact ticker matches first
  const exact = MARKET_TICKERS.filter(t => t.ticker === clean);
  // Starts with ticker
  const prefix = MARKET_TICKERS.filter(t => t.ticker !== clean && t.ticker.startsWith(clean));
  // Includes ticker
  const tickerIncludes = MARKET_TICKERS.filter(
    t => t.ticker !== clean && !t.ticker.startsWith(clean) && t.ticker.includes(clean)
  );
  // Name includes
  const nameIncludes = MARKET_TICKERS.filter(
    t => !t.ticker.includes(clean) && t.name.toUpperCase().includes(clean)
  );

  return [...exact, ...prefix, ...tickerIncludes, ...nameIncludes].slice(0, limit);
}

/**
 * Detects common typos using Levenshtein distance or soundex-like comparison
 */
export function getSuggestedTypo(query: string): MarketTickerInfo | null {
  const clean = query.trim().toUpperCase();
  if (clean.length < 2) return null;

  // If already an exact match, no typo
  if (MARKET_TICKERS.some(t => t.ticker === clean)) return null;

  // Simple common substitutions / typos
  const commonMap: Record<string, string> = {
    'YPF': 'YPFD',
    'GALICIA': 'GGAL',
    'GAL': 'GGAL',
    'PAMPA': 'PAMP',
    'MACRO': 'BMA',
    'APPLE': 'AAPL',
    'APLE': 'AAPL',
    'AAPLE': 'AAPL',
    'TESLA': 'TSLA',
    'VISTA': 'VIST',
    'MELI.BA': 'MELI',
    'MERCADOLIBRE': 'MELI',
    'GOOGLE': 'GOOGL',
    'AL3O': 'AL30',
    'GD3O': 'GD30',
    'SP500': 'SPY',
    'S&P500': 'SPY',
    'S&P': 'SPY',
    'NASDAQ': 'QQQ',
    'VALE.BA': 'VALE',
    'PETROBRAS': 'PBR'
  };

  if (commonMap[clean]) {
    const found = MARKET_TICKERS.find(t => t.ticker === commonMap[clean]);
    if (found) return found;
  }

  // Calculate Levenshtein distance for close typos (1 edit distance)
  let bestMatch: MarketTickerInfo | null = null;
  let minDistance = 2; // only suggest if distance is 1

  for (const item of MARKET_TICKERS) {
    const dist = levenshtein(clean, item.ticker);
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = item;
    }
  }

  return bestMatch;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
