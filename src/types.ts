export type AssetType = 'Acción Local' | 'CEDEAR' | 'Bono Soberano' | 'Letra' | 'ON Corporativa';

export type CurrencyDisplay = 'ARS' | 'USD';

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
  purchaseDate?: string;
  purchaseMepRate?: number; // Dólar MEP histórico promedio de compra
  purchasePriceUsd?: number; // Precio promedio de compra en USD histórico
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
  mepRate?: number; // Dólar MEP vigente en la fecha de la operación (Ámbito)
  sourceMep?: string;
  notes?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  fullContent: string;
  source: string;
  date: string;
  category: 'Cartera' | 'Seguimiento' | 'Macro' | 'Balances' | 'Mercado';
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
  yesterdayDollarMep?: number;
  isLive?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export interface WatchlistItem {
  id: string;
  ticker: string;
  name: string;
  assetType: AssetType;
  currency: 'ARS' | 'USD';
  currentPrice: number;
  dailyChangePct: number;
  notes?: string;
  addedAt: string;
}
