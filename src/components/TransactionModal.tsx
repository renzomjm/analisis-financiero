import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  PlusCircle, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  RefreshCw, 
  Search, 
  Sparkles,
  ExternalLink,
  Info
} from 'lucide-react';
import { AssetType, Holding, Transaction } from '../types';
import { fetchHistoricalMep } from '../lib/mepService';
import { 
  findMatchingTickers, 
  getSuggestedTypo, 
  MARKET_TICKERS, 
  MarketTickerInfo 
} from '../data/marketTickers';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (
    transaction: Omit<Transaction, 'id'>, 
    assetDetails: { name: string; assetType: AssetType }
  ) => void;
  holdings: Holding[];
  preselectedTicker?: string;
  dollarMep?: number;
}

interface LiveQuoteData {
  price: number;
  changePct: number;
  currency: 'ARS' | 'USD';
  source: string;
  name?: string;
  lastUpdated: string;
}

export default function TransactionModal({
  isOpen,
  onClose,
  onAddTransaction,
  holdings,
  preselectedTicker,
  dollarMep = 1525
}: TransactionModalProps) {
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('Acción Local');
  const [type, setType] = useState<'Compra' | 'Venta'>('Compra');
  const [nominales, setNominales] = useState<number>(100);
  const [price, setPrice] = useState<number>(0);
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Dropdown suggestions & validation state
  const [suggestions, setSuggestions] = useState<MarketTickerInfo[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [suggestedTypo, setSuggestedTypo] = useState<MarketTickerInfo | null>(null);
  const [isVerifiedInCatalog, setIsVerifiedInCatalog] = useState<boolean>(false);

  // Live stock exchange quote
  const [liveQuote, setLiveQuote] = useState<LiveQuoteData | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Historical MEP info for transaction date (Ámbito Financiero)
  const [historicalMepInfo, setHistoricalMepInfo] = useState<{ mep: number; matchedDate: string; source: string } | null>(null);
  const [isLoadingMep, setIsLoadingMep] = useState<boolean>(false);

  // Fetch historical MEP whenever concertation date changes
  useEffect(() => {
    if (!isOpen || !date) return;
    let isMounted = true;
    setIsLoadingMep(true);
    fetchHistoricalMep(date).then((res) => {
      if (isMounted) {
        setHistoricalMepInfo(res);
        setIsLoadingMep(false);
      }
    }).catch(() => {
      if (isMounted) setIsLoadingMep(false);
    });
    return () => { isMounted = false; };
  }, [isOpen, date]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
  const fetchLiveQuote = async (targetTicker: string, autoApplyPrice = false) => {
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
          if (autoApplyPrice) {
            setPrice(q.price);
            setCurrency(q.currency);
          }
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

  // When opening with a preselected ticker
  useEffect(() => {
    if (preselectedTicker) {
      const uppercase = preselectedTicker.toUpperCase();
      setTicker(uppercase);
      
      const holdingMatch = holdings.find(h => h.ticker.toUpperCase() === uppercase);
      const catalogMatch = MARKET_TICKERS.find(t => t.ticker === uppercase);

      if (holdingMatch) {
        setName(holdingMatch.name);
        setAssetType(holdingMatch.assetType);
        setCurrency(holdingMatch.currency);
        setPrice(holdingMatch.currentPrice);
        setIsVerifiedInCatalog(true);
      } else if (catalogMatch) {
        setName(catalogMatch.name);
        setAssetType(catalogMatch.assetType);
        setCurrency(catalogMatch.currency);
        setIsVerifiedInCatalog(true);
      }

      fetchLiveQuote(uppercase, false);
    }
  }, [preselectedTicker, holdings]);

  // Handle ticker typing & validation
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

    // 1. Search suggestions in catalog
    const matches = findMatchingTickers(uppercase);
    setSuggestions(matches);
    setIsDropdownOpen(matches.length > 0);

    // 2. Exact match check
    const exactCatalog = MARKET_TICKERS.find(t => t.ticker === uppercase);
    const exactHolding = holdings.find(h => h.ticker === uppercase);

    if (exactCatalog) {
      setIsVerifiedInCatalog(true);
      setSuggestedTypo(null);
      setName(exactCatalog.name);
      setAssetType(exactCatalog.assetType);
      setCurrency(exactCatalog.currency);
      // Auto fetch live quote from stock exchange
      fetchLiveQuote(uppercase, price === 0);
    } else if (exactHolding) {
      setIsVerifiedInCatalog(true);
      setSuggestedTypo(null);
      setName(exactHolding.name);
      setAssetType(exactHolding.assetType);
      setCurrency(exactHolding.currency);
      if (price === 0) setPrice(exactHolding.currentPrice);
      fetchLiveQuote(uppercase, false);
    } else {
      setIsVerifiedInCatalog(false);
      // 3. Typo detection
      const typo = getSuggestedTypo(uppercase);
      setSuggestedTypo(typo);
    }
  };

  // Selecting a ticker from suggestions
  const handleSelectSuggestion = (item: MarketTickerInfo) => {
    setTicker(item.ticker);
    setName(item.name);
    setAssetType(item.assetType);
    setCurrency(item.currency);
    setIsVerifiedInCatalog(true);
    setSuggestedTypo(null);
    setIsDropdownOpen(false);

    // Immediately connect with the stock exchange for this ticker
    fetchLiveQuote(item.ticker, true);
  };

  // Applying suggested typo correction
  const handleApplyTypoFix = (corrected: MarketTickerInfo) => {
    handleSelectSuggestion(corrected);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim() || nominales <= 0 || price <= 0) return;

    onAddTransaction(
      {
        date,
        ticker: ticker.trim().toUpperCase(),
        type,
        nominales: Number(nominales),
        price: Number(price),
        currency,
        mepRate: historicalMepInfo?.mep || dollarMep,
        sourceMep: historicalMepInfo?.source || 'Ámbito Financiero (dolar-mep-historico)',
        notes: notes.trim()
      },
      {
        name: name.trim() || `${ticker.trim().toUpperCase()} S.A.`,
        assetType
      }
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#27272a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b]">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Registrar Operación</h3>
              <p className="text-xs text-[#a1a1aa]">
                Detección y validación automática de tickers con conexión a la bolsa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#71717a] hover:text-white hover:bg-[#27272a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          
          {/* Operation type toggle (Compra vs Venta) */}
          <div>
            <label className="block text-xs font-semibold text-[#a1a1aa] uppercase mb-1.5">
              Tipo de Operación
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('Compra')}
                className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  type === 'Compra'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-[#18181b] border-[#27272a] text-[#71717a] hover:text-white'
                }`}
              >
                <ArrowUpCircle className="w-4 h-4 shrink-0" />
                <span>Compra (Ingreso)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('Venta')}
                className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  type === 'Venta'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                    : 'bg-[#18181b] border-[#27272a] text-[#71717a] hover:text-white'
                }`}
              >
                <ArrowDownCircle className="w-4 h-4 shrink-0" />
                <span>Venta (Egreso)</span>
              </button>
            </div>
          </div>

          {/* Ticker Input with Autocomplete & Typo Detection */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase">
                Ticker / Símbolo Bursátil
              </label>
              {isVerifiedInCatalog && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ticker verificado (BYMA / Mercado Oficial)
                </span>
              )}
            </div>

            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                required
                autoComplete="off"
                placeholder="Escribe ticker (ej. YPFD, AAPL, AL30, GGAL, VIST)..."
                value={ticker}
                onFocus={() => {
                  if (ticker.trim()) {
                    setSuggestions(findMatchingTickers(ticker));
                    setIsDropdownOpen(true);
                  }
                }}
                onChange={(e) => handleTickerChange(e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-[#18181b] border rounded-xl text-white font-mono text-sm font-bold uppercase transition-all focus:outline-none ${
                  isVerifiedInCatalog 
                    ? 'border-emerald-500/60 focus:border-emerald-500 bg-emerald-950/10'
                    : suggestedTypo
                      ? 'border-amber-500/60 focus:border-amber-500'
                      : 'border-[#27272a] focus:border-[#f59e0b]'
                }`}
              />
              <div className="absolute right-3 top-2.5 flex items-center gap-1.5 text-xs text-[#71717a]">
                {isLoadingQuote ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#f59e0b]" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </div>
            </div>

            {/* Typo Suggestion Alert Banner */}
            {suggestedTypo && (
              <div className="mt-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-300 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    ¿Quisiste decir <strong className="font-bold font-mono text-white underline">{suggestedTypo.ticker}</strong> ({suggestedTypo.name})?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyTypoFix(suggestedTypo)}
                  className="px-2.5 py-1 bg-amber-500 text-black text-[11px] font-bold rounded-lg hover:bg-amber-400 transition-colors shrink-0"
                >
                  Corregir Ticker
                </button>
              </div>
            )}

            {/* Dropdown Suggestions List */}
            {isDropdownOpen && suggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1.5 bg-[#18181b] border border-[#3f3f46] rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-[#27272a]">
                <div className="p-1.5 text-[10px] uppercase font-bold text-[#71717a] bg-[#121214] px-3">
                  Instrumentos sugeridos del mercado argentino
                </div>
                {suggestions.map((item) => (
                  <button
                    key={item.ticker}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left p-2.5 hover:bg-[#27272a] flex items-center justify-between gap-3 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-sm text-[#f59e0b] group-hover:text-amber-300">
                        {item.ticker}
                      </span>
                      <span className="text-xs text-[#d4d4d8] truncate font-medium">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        item.assetType === 'Acción Local' 
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                          : item.assetType === 'CEDEAR'
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                            : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                      }`}>
                        {item.assetType}
                      </span>
                      <span className="text-[10px] font-mono text-[#a1a1aa] bg-[#27272a] px-1.5 py-0.5 rounded">
                        {item.exchange}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Live Market Price Connector & Status */}
          {ticker.trim() && (
            <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-xl">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${liveQuote ? 'bg-emerald-500 animate-pulse' : 'bg-[#71717a]'}`} />
                  <span className="text-[#a1a1aa] font-medium">
                    Conexión con Bolsa de Valores:
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isLoadingQuote}
                  onClick={() => fetchLiveQuote(ticker, false)}
                  className="flex items-center gap-1 text-[11px] text-[#f59e0b] hover:underline cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingQuote ? 'animate-spin' : ''}`} />
                  <span>{isLoadingQuote ? 'Consultando bolsa...' : 'Actualizar precio'}</span>
                </button>
              </div>

              {liveQuote ? (
                <div className="mt-2 pt-2 border-t border-[#27272a] flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-mono font-bold text-sm sm:text-base">
                        {new Intl.NumberFormat('es-AR', {
                          style: 'currency',
                          currency: liveQuote.currency,
                          maximumFractionDigits: liveQuote.currency === 'USD' ? 2 : 2
                        }).format(liveQuote.price)}
                      </span>
                      <span className={`text-[11px] font-semibold font-mono ${
                        liveQuote.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {liveQuote.changePct >= 0 ? `+${liveQuote.changePct}%` : `${liveQuote.changePct}%`}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#a1a1aa]">
                      Fuente oficial: {liveQuote.source} • {liveQuote.lastUpdated}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPrice(liveQuote.price);
                      setCurrency(liveQuote.currency);
                    }}
                    className="px-3 py-1.5 bg-[#f59e0b]/15 hover:bg-[#f59e0b]/25 border border-[#f59e0b]/40 text-[#f59e0b] font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Usar este precio
                  </button>
                </div>
              ) : quoteError ? (
                <div className="mt-1.5 text-[11px] text-[#71717a]">
                  {quoteError}. Puedes ingresar el precio de tu boleto de compra/venta manualmente.
                </div>
              ) : (
                <div className="mt-1.5 text-[11px] text-[#71717a]">
                  Ingresa un ticker válido para consultar la cotización oficial en vivo.
                </div>
              )}
            </div>
          )}

          {/* Name & Asset Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase mb-1">
                Nombre de la Empresa o Activo
              </label>
              <input
                type="text"
                placeholder="ej. YPF Sociedad Anónima"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-white text-xs focus:outline-none focus:border-[#f59e0b]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase mb-1">
                Tipo de Instrumento
              </label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as AssetType)}
                className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-white text-xs focus:outline-none focus:border-[#f59e0b]"
              >
                <option value="Acción Local">Acción Local (BYMA / Merval)</option>
                <option value="CEDEAR">CEDEAR (Mercado Internacional)</option>
                <option value="Bono Soberano">Bono Soberano / Subsoberano</option>
                <option value="Letra">Letra del Tesoro (LECAP / BONCAP)</option>
                <option value="ON Corporativa">Obligación Negociable (ON)</option>
              </select>
            </div>
          </div>

          {/* Currency, Nominales & Unit Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase mb-1">
                Moneda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'ARS' | 'USD')}
                className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-white text-xs focus:outline-none focus:border-[#f59e0b]"
              >
                <option value="ARS">Pesos ($ ARS)</option>
                <option value="USD">Dólares (USD)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase mb-1">
                Nominales (Cantidad)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={nominales || ''}
                onChange={(e) => setNominales(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#f59e0b]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase mb-1">
                Precio Unitario ({currency})
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                value={price || ''}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#f59e0b]"
              />
            </div>
          </div>

          {/* Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase mb-1">
                Fecha de Concertación
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-white text-xs focus:outline-none focus:border-[#f59e0b]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase mb-1">
                Notas / Estrategia (Opcional)
              </label>
              <input
                type="text"
                placeholder="ej. Rebalanceo mensual, cobro dividendos..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-white text-xs focus:outline-none focus:border-[#f59e0b]"
              />
            </div>
          </div>

          {/* Historical Dólar MEP Card (Ámbito Financiero) */}
          <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[#a1a1aa] font-medium">Dólar MEP a la fecha de compra:</span>
                {isLoadingMep ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-[#f59e0b]" />
                ) : (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30 font-semibold">
                    {historicalMepInfo?.source?.includes('Ámbito') ? 'Ámbito Oficial' : 'Mercado'}
                  </span>
                )}
              </div>
              <span className="font-mono font-bold text-white text-sm">
                ${(historicalMepInfo?.mep || dollarMep).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#71717a] pt-1 border-t border-[#27272a]/60">
              <span>
                Cotización oficial tomada el {historicalMepInfo?.matchedDate || date}
              </span>
              <span className="font-mono font-semibold text-emerald-400">
                {currency === 'ARS' ? (
                  nominales * price > 0 ? (
                    `Equivalente: US$ ${((nominales * price) / (historicalMepInfo?.mep || dollarMep)).toFixed(2)} MEP`
                  ) : 'US$ 0.00'
                ) : (
                  nominales * price > 0 ? (
                    `Equivalente: $${((nominales * price) * (historicalMepInfo?.mep || dollarMep)).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS`
                  ) : '$0 ARS'
                )}
              </span>
            </div>
          </div>

          {/* Total Preview */}
          <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-xl flex items-center justify-between text-xs">
            <span className="text-[#a1a1aa]">Monto total de la operación:</span>
            <div className="text-right">
              <span className="font-mono font-bold text-white text-sm sm:text-base">
                {new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(nominales * price)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#f59e0b] hover:bg-[#d97706] text-[#09090b] text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              Confirmar Operación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
