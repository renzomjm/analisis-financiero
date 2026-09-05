export type AssetType = 'Acción Local' | 'CEDEAR' | 'Bono Soberano' | 'Letra' | 'ON Corporativa';

export interface Holding {
  id: string;
  ticker: string;
  name: string;
  assetType: AssetType;
  nominales: number;
  purchasePrice: number; // Precio promedio de compra en moneda local o USD
  currentPrice: number;  // Precio actual de mercado
  currency: 'ARS' | 'USD';
  dailyChangePct: number;
  notes?: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  ticker: string;
  type: 'Compra' | 'Venta';
  nominales: number;
  price: number;
  currency: 'ARS' | 'USD';
  notes?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  fullContent: string;
  source: string;
  date: string;
  category: 'Cartera' | 'Macro' | 'Balances' | 'Mercado';
  relatedTickers: string[];
  url?: string;
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  ticker?: string;
  title: string;
  type: 'Balance' | 'Macro' | 'Cupón / Dividendo' | 'Licitación' | 'Otro';
  description: string;
  impactLevel: 'Alto' | 'Medio' | 'Bajo';
  isHoldingOrWatchlist?: boolean;
}

export interface MarketRates {
  dollarMep: number;
  dollarCcl: number;
  dollarOficial: number;
  mervalIndex: number;
  riesgoPais: number;
  lastUpdated: string;
  source?: string;
  dollarMepCompra?: number;
  dollarCclCompra?: number;
  dollarBlue?: number;
  isLive?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}
