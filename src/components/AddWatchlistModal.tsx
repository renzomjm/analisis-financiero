import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Globe2, 
  TrendingUp, 
  Loader2, 
  Sparkles,
  Eye,
  Plus
} from 'lucide-react';
import { AssetType, WatchlistItem } from '../types';
import { MARKET_TICKERS, MarketTickerInfo } from '../data/marketTickers';

interface AddWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWatchlist: (item: Omit<WatchlistItem, 'id' | 'addedAt'>) => void;
  existingTickers: string[];
  dollarMep: number;
}

interface LiveQuoteData {
  ticker: string;
  name?: string;
  price: number;
  change?: number;
  changePct: number;
  currency: 'ARS' | 'USD';
  market: string;
  isDelay?: boolean;
}

export default function AddWatchlistModal({
  isOpen,
  onClose,
  onAddWatchlist,
  existingTickers,
  dollarMep
}: AddWatchlistModalProps) {
  const [ticker, setTicker] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [assetType, setAssetType] = useState<AssetType>('Acción Local');
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [notes, setNotes] = useState<string>('');
  
  // Real-time quote state
  const [liveQuote, setLiveQuote] = useState<LiveQuoteData | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  
  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState<MarketTickerInfo[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isVerifiedInCatalog, setIsVerifiedInCatalog] = useState<boolean>(false);
  const [suggestedTypo, setSuggestedTypo] = useState<MarketTickerInfo | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch live market quote from stock exchange
  const fetchLiveQuote = async (targetTicker: string) => {
    const clean = targetTicker.trim().toUpperCase();
    if (!clean) return;

    setIsLoadingQuote(true);
    setQuoteError(null);

    try {
      const res = await fetch(`/api/quote/${encodeURIComponent(clean)}?mep=${dollarMep}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok' && data.found && data.quote) {
          const q: LiveQuoteData = data.quote;
          setLiveQuote(q);
          if (q.name && !name) {
            setName(q.name);
          }
          setCurrency(q.currency);
        } else {
          setLiveQuote(null);
          setQuoteError(data.message || 'No se encontró cotización en vivo');
        }
      } else {
        setLiveQuote(null);
      }
    } catch {
      setLiveQuote(null);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTicker('');
      setName('');
      setAssetType('Acción Local');
      setCurrency('ARS');
      setNotes('');
      setLiveQuote(null);
      setQuoteError(null);
      setSuggestions([]);
      setIsDropdownOpen(false);
      setIsVerifiedInCatalog(false);
      setSuggestedTypo(null);
    }
  }, [isOpen]);

  // Handle ticker typing & suggestions
  const handleTickerChange = (value: string) => {
    const uppercase = value.toUpperCase();
    setTicker(uppercase);
    setLiveQuote(null);
    setQuoteError(null);

    if (!uppercase.trim()) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      setSuggestedTypo(null);
      setIsVerifiedInCatalog(false);
      return;
    }

    const filtered = MARKET_TICKERS.filter(t => 
      t.ticker.toUpperCase().startsWith(uppercase) ||
      t.name.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 7);

    setSuggestions(filtered);
    setIsDropdownOpen(filtered.length > 0);

    const exactMatch = MARKET_TICKERS.find(t => t.ticker === uppercase);
    if (exactMatch) {
      setName(exactMatch.name);
      setAssetType(exactMatch.assetType);
      setCurrency(exactMatch.currency);
      setIsVerifiedInCatalog(true);
      setSuggestedTypo(null);
      fetchLiveQuote(uppercase);
    } else {
      setIsVerifiedInCatalog(false);
      if (uppercase.length >= 2 && filtered.length > 0) {
        setSuggestedTypo(filtered[0]);
      } else {
        setSuggestedTypo(null);
      }
    }
  };

  const handleSelectSuggestion = (item: MarketTickerInfo) => {
    setTicker(item.ticker);
    setName(item.name);
    setAssetType(item.assetType);
    setCurrency(item.currency);
    setIsVerifiedInCatalog(true);
    setSuggestedTypo(null);
    setIsDropdownOpen(false);
    fetchLiveQuote(item.ticker);
  };

  const handleManualBlur = () => {
    setTimeout(() => {
      if (ticker.trim()) {
        const exact = MARKET_TICKERS.find(t => t.ticker === ticker.trim().toUpperCase());
        if (exact) {
          setName(exact.name);
          setAssetType(exact.assetType);
          setCurrency(exact.currency);
          setIsVerifiedInCatalog(true);
        }
        fetchLiveQuote(ticker.trim());
      }
    }, 200);
  };

  const isAlreadyInWatchlist = existingTickers.map(t => t.toUpperCase()).includes(ticker.trim().toUpperCase());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTicker = ticker.trim().toUpperCase();
    if (!cleanTicker) return;
    if (isAlreadyInWatchlist) return;

    const currentPrice = liveQuote?.price || 0;
    const dailyChangePct = liveQuote?.changePct || 0;

    onAddWatchlist({
      ticker: cleanTicker,
      name: name.trim() || cleanTicker,
      assetType,
      currency,
      currentPrice,
      dailyChangePct,
      notes: notes.trim() ? notes.trim() : undefined
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Agregar a Lista de Seguimiento
              </h3>
              <p className="text-xs text-[#a1a1aa]">
                Monitorea precios, variaciones y noticias sin registrar compras
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#71717a] hover:text-white rounded-lg hover:bg-[#27272a] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          
          {/* Ticker Search Input */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5 flex items-center justify-between">
              <span>Símbolo / Ticker</span>
              {isVerifiedInCatalog && (
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verificado en Mercado Local / CEDEAR
                </span>
              )}
            </label>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71717a]">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={ticker}
                onChange={(e) => handleTickerChange(e.target.value)}
                onBlur={handleManualBlur}
                placeholder="Ej: YPFD, AAPL, AL30, MELI, VIST, GGAL..."
                className="w-full pl-9 pr-24 py-2.5 bg-[#18181b] border border-[#27272a] rounded-xl text-white font-mono text-sm uppercase placeholder:normal-case placeholder:font-sans placeholder:text-[#52525b] focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                autoFocus
              />
              
              {isLoadingQuote && (
                <div className="absolute inset-y-0 right-3 flex items-center gap-1.5 text-xs text-sky-400 font-sans">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-[11px]">Buscando...</span>
                </div>
              )}
            </div>

            {/* Warning if already in watchlist */}
            {isAlreadyInWatchlist && (
              <p className="text-[11px] text-amber-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Este ticker ya está en tu lista de seguimiento.</span>
              </p>
            )}

            {/* Typo Recommendation Pill */}
            {suggestedTypo && !isVerifiedInCatalog && !isAlreadyInWatchlist && (
              <div className="mt-1.5 flex items-center gap-2 p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="text-[#a1a1aa]">¿Te refieres a</span>
                <button
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestedTypo)}
                  className="font-bold font-mono text-sky-400 hover:underline cursor-pointer"
                >
                  {suggestedTypo.ticker}
                </button>
                <span className="text-[#71717a] text-[11px]">({suggestedTypo.name})?</span>
              </div>
            )}

            {/* Dropdown Suggestions */}
            {isDropdownOpen && suggestions.length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-[#1c1c1f] border border-[#3f3f46] rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-[#71717a] uppercase tracking-wider bg-[#141417] border-b border-[#27272a]">
                  Sugerencias Oficiales BYMA / CEDEARs / Bonos
                </div>
                {suggestions.map((item) => (
                  <button
                    key={item.ticker}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full px-3.5 py-2 text-left hover:bg-[#27272a] transition-colors flex items-center justify-between border-b border-[#27272a]/50 last:border-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono font-bold text-white text-xs bg-[#27272a] px-1.5 py-0.5 rounded">
                        {item.ticker}
                      </span>
                      <span className="text-xs text-[#d4d4d8] truncate max-w-[200px] sm:max-w-[260px]">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-[#a1a1aa] bg-[#09090b] px-2 py-0.5 rounded">
                        {item.assetType}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Real-time price badge if found */}
          {liveQuote && (
            <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <div className="text-[11px] text-[#a1a1aa]">Cotización Oficial en Vivo:</div>
                  <div className="text-sm font-mono font-bold text-white">
                    ${liveQuote.price.toLocaleString('es-AR', { minimumFractionDigits: 2 })} {liveQuote.currency}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-[#71717a]">{liveQuote.market}</div>
                <div className={`text-xs font-bold font-mono ${liveQuote.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {liveQuote.changePct >= 0 ? '+' : ''}{liveQuote.changePct.toFixed(2)}%
                </div>
              </div>
            </div>
          )}

          {quoteError && !liveQuote && ticker.trim().length >= 2 && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{quoteError}. Se sincronizará automáticamente al actualizar mercado.</span>
            </div>
          )}

          {/* Name & Asset Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
                Nombre de Empresa / Activo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: YPF Sociedad Anónima"
                className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-white text-xs placeholder:text-[#52525b] focus:outline-hidden focus:border-sky-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
                Tipo de Instrumento
              </label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as AssetType)}
                className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-white text-xs focus:outline-hidden focus:border-sky-500 transition-all cursor-pointer"
              >
                <option value="Acción Local">Acción Local (BYMA)</option>
                <option value="CEDEAR">CEDEAR (EE.UU. / Brasil)</option>
                <option value="Bono Soberano">Bono Soberano / Hard Dollar</option>
                <option value="Letra">Letra (LECAP / BONCAP)</option>
                <option value="ON Corporativa">Obligación Negociable (ON)</option>
              </select>
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
              Moneda de Referencia
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCurrency('ARS')}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  currency === 'ARS' 
                    ? 'bg-sky-500/15 border-sky-500 text-sky-300' 
                    : 'bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46]'
                }`}
              >
                🇦🇷 Pesos (ARS)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  currency === 'USD' 
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300' 
                    : 'bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46]'
                }`}
              >
                💵 Dólares (USD)
              </button>
            </div>
          </div>

          {/* Notes / Thesis */}
          <div>
            <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
              Tesis o Razón de Seguimiento (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Monitorear balance Q3, esperar compresión de paridad, dividend yield..."
              className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-white text-xs placeholder:text-[#52525b] focus:outline-hidden focus:border-sky-500 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#a1a1aa] hover:text-white hover:bg-[#27272a] rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!ticker.trim() || isAlreadyInWatchlist}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-xs rounded-xl shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar a Seguimiento</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
