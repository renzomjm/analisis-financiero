import { useState, Fragment } from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  History, 
  PieChart, 
  Sparkles, 
  Trash2, 
  Edit, 
  Check, 
  X,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  CornerDownLeft,
  RefreshCw,
  Radio,
  Eye
} from 'lucide-react';
import { Holding, Transaction, WatchlistItem, CurrencyDisplay } from '../types';
import { User } from '../lib/firebase';
import { calculateHoldingValuation, HoldingValuation } from '../lib/mepService';

interface PortfolioSectionProps {
  holdings: Holding[];
  transactions: Transaction[];
  watchlist?: WatchlistItem[];
  dollarMep: number;
  yesterdayDollarMep?: number;
  currencyDisplay?: CurrencyDisplay;
  onSelectCurrencyDisplay?: (currency: CurrencyDisplay) => void;
  onToggleCurrency?: (currency: CurrencyDisplay) => void;
  onOpenTransactionModal: (preselectedTicker?: string) => void;
  onOpenAddWatchlistModal?: () => void;
  onUpdateHolding: (updated: Holding) => void;
  onDeleteHolding: (id: string) => void;
  onDeleteTransaction: (id: string) => void;
  onDeleteWatchlist?: (id: string) => void;
  onAskAssistantAboutTicker: (ticker: string) => void;
  onClearPortfolio?: () => void;
  onRefreshQuotes?: () => void;
  isRefreshingQuotes?: boolean;
  lastQuotesUpdated?: string;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  currentUser?: User | null;
  onOpenAuthModal?: () => void;
}

export default function PortfolioSection({
  holdings,
  transactions,
  watchlist = [],
  dollarMep,
  yesterdayDollarMep,
  currencyDisplay = 'ARS',
  onSelectCurrencyDisplay,
  onToggleCurrency,
  onOpenTransactionModal,
  onOpenAddWatchlistModal,
  onUpdateHolding,
  onDeleteHolding,
  onDeleteTransaction,
  onDeleteWatchlist,
  onAskAssistantAboutTicker,
  onClearPortfolio,
  onRefreshQuotes,
  isRefreshingQuotes = false,
  lastQuotesUpdated,
  isMaximized = false,
  onToggleMaximize,
  currentUser,
  onOpenAuthModal
}: PortfolioSectionProps) {
  const [activeTab, setActiveTab] = useState<'tenencias' | 'watchlist' | 'operaciones'>('tenencias');
  const [editingHoldingId, setEditingHoldingId] = useState<string | null>(null);
  const [editNominales, setEditNominales] = useState<number>(0);
  const [editCurrentPrice, setEditCurrentPrice] = useState<number>(0);
  const [editPurchasePrice, setEditPurchasePrice] = useState<number>(0);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Internal currency display state synced with parent
  const [localCurrency, setLocalCurrency] = useState<CurrencyDisplay>(currencyDisplay);
  const effectiveCurrency = (onToggleCurrency || onSelectCurrencyDisplay) ? currencyDisplay : localCurrency;

  const handleToggleCurrency = (curr: CurrencyDisplay) => {
    setLocalCurrency(curr);
    if (onToggleCurrency) {
      onToggleCurrency(curr);
    } else if (onSelectCurrencyDisplay) {
      onSelectCurrencyDisplay(curr);
    }
  };

  // Calculate preliminary total portfolio value in ARS for weights
  const totalPortfolioArs = holdings.reduce((acc, h) => {
    const val = h.currency === 'USD' 
      ? h.nominales * h.currentPrice * dollarMep 
      : h.nominales * h.currentPrice;
    return acc + val;
  }, 0);

  // All holdings calculated with market metrics, strictly using historical MEP for USD returns
  const holdingValuations: HoldingValuation[] = holdings.map((h) => 
    calculateHoldingValuation(
      h, 
      transactions, 
      dollarMep, 
      yesterdayDollarMep || dollarMep, 
      totalPortfolioArs
    )
  );

  const holdingsSortedByWeight = [...holdingValuations].sort((a, b) => b.valueArs - a.valueArs);

  // Portfolio Totals in ARS
  const portfolioDailyChangeArs = holdingValuations.reduce((acc, h) => acc + h.dailyChangeArs, 0);
  const prevTotalPortfolioArs = totalPortfolioArs - portfolioDailyChangeArs;
  const portfolioDailyChangePct = prevTotalPortfolioArs > 0 ? (portfolioDailyChangeArs / prevTotalPortfolioArs) * 100 : 0;
  const isPortfolioDailyPositive = portfolioDailyChangeArs >= 0;

  // Portfolio Totals in USD (MEP)
  const totalPortfolioUsd = holdingValuations.reduce((acc, h) => acc + h.valueUsd, 0);
  const portfolioDailyChangeUsd = holdingValuations.reduce((acc, h) => acc + h.dailyChangeUsd, 0);
  const prevTotalPortfolioUsd = totalPortfolioUsd - portfolioDailyChangeUsd;
  const portfolioDailyChangePctUsd = prevTotalPortfolioUsd > 0 ? (portfolioDailyChangeUsd / prevTotalPortfolioUsd) * 100 : 0;
  const isPortfolioDailyUsdPositive = portfolioDailyChangeUsd >= 0;

  // Separate assets into distinct groups (Acciones Locales, CEDEARs, and Renta Fija / Otros),
  // each internally ordered by weight descending
  const accionesItems = holdingsSortedByWeight.filter(h => h.assetType === 'Acción Local');
  const cedearsItems = holdingsSortedByWeight.filter(h => h.assetType === 'CEDEAR');
  const rentaFijaItems = holdingsSortedByWeight.filter(h => 
    h.assetType !== 'Acción Local' && h.assetType !== 'CEDEAR'
  );

  interface HoldingCategoryGroup {
    id: string;
    title: string;
    subtitle: string;
    tagText: string;
    dotColor: string;
    tagBg: string;
    tagTextColor: string;
    items: HoldingValuation[];
    totalArs: number;
    totalUsd: number;
    totalWeightPct: number;
  }

  const assetGroups: HoldingCategoryGroup[] = [
    {
      id: 'acciones',
      title: 'Acciones Locales',
      subtitle: 'BYMA / Merval',
      tagText: 'Acción Local',
      dotColor: 'bg-amber-400',
      tagBg: 'bg-amber-500/15',
      tagTextColor: 'text-amber-400',
      items: accionesItems,
      totalArs: accionesItems.reduce((acc, h) => acc + h.valueArs, 0),
      totalUsd: accionesItems.reduce((acc, h) => acc + h.valueUsd, 0),
      totalWeightPct: accionesItems.reduce((acc, h) => acc + h.weightPct, 0)
    },
    {
      id: 'cedears',
      title: 'CEDEARs',
      subtitle: 'Mercado Internacional',
      tagText: 'CEDEAR',
      dotColor: 'bg-purple-400',
      tagBg: 'bg-purple-500/15',
      tagTextColor: 'text-purple-400',
      items: cedearsItems,
      totalArs: cedearsItems.reduce((acc, h) => acc + h.valueArs, 0),
      totalUsd: cedearsItems.reduce((acc, h) => acc + h.valueUsd, 0),
      totalWeightPct: cedearsItems.reduce((acc, h) => acc + h.weightPct, 0)
    },
    {
      id: 'renta-fija',
      title: 'Renta Fija / Bonos y Letras',
      subtitle: 'Soberanos, Subsoberanos y Letras',
      tagText: 'Renta Fija',
      dotColor: 'bg-sky-400',
      tagBg: 'bg-sky-500/15',
      tagTextColor: 'text-sky-400',
      items: rentaFijaItems,
      totalArs: rentaFijaItems.reduce((acc, h) => acc + h.valueArs, 0),
      totalUsd: rentaFijaItems.reduce((acc, h) => acc + h.valueUsd, 0),
      totalWeightPct: rentaFijaItems.reduce((acc, h) => acc + h.weightPct, 0)
    }
  ].filter(g => g.items.length > 0);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const startEdit = (h: Holding) => {
    setEditingHoldingId(h.id);
    setEditNominales(h.nominales);
    setEditCurrentPrice(h.currentPrice);
    setEditPurchasePrice(h.purchasePrice);
  };

  const cancelEdit = () => {
    setEditingHoldingId(null);
  };

  const saveEdit = (h: Holding) => {
    onUpdateHolding({
      ...h,
      nominales: Number(editNominales) || 0,
      currentPrice: Number(editCurrentPrice) || 0,
      purchasePrice: Number(editPurchasePrice) || 0
    });
    setEditingHoldingId(null);
  };

  // Keyboard handler: pressing Enter confirms the edit, Escape cancels
  const handleEditKeyDown = (e: React.KeyboardEvent, h: Holding) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit(h);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  const formatCurrency = (val: number, curr: 'ARS' | 'USD' = 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: curr === 'USD' ? 2 : 0
    }).format(val);
  };

  // Allocation bar colors assigned by rank (from highest to lowest weight)
  const barColors = [
    'bg-[#f59e0b]', // 1st (largest)
    'bg-sky-500',   // 2nd
    'bg-emerald-500', // 3rd
    'bg-purple-500', // 4th
    'bg-indigo-400', // 5th
    'bg-teal-400',   // 6th
    'bg-amber-300',  // 7th
    'bg-rose-500',   // 8th
    'bg-cyan-400',   // 9th
    'bg-blue-400'    // 10th
  ];

  return (
    <div className={`bg-[#121214] border border-[#27272a] rounded-xl flex flex-col shadow-xs transition-all ${
      isMaximized ? 'p-4 sm:p-5 h-full' : 'p-3 sm:p-4 h-full'
    }`}>
      
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#27272a]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b]">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5 flex-wrap">
              Mi Cartera
              <span className="text-[11px] font-mono text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/30 px-1.5 rounded">
                {holdings.length} activos
              </span>
              {holdings.length > 0 && (
                effectiveCurrency === 'USD' ? (
                  <span 
                    className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5 ${
                      isPortfolioDailyUsdPositive 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}
                    title={`Rendimiento diario en USD (MEP): ${isPortfolioDailyUsdPositive ? '+' : ''}${portfolioDailyChangePctUsd.toFixed(2)}% (${isPortfolioDailyUsdPositive ? '+' : ''}${formatCurrency(portfolioDailyChangeUsd, 'USD')})`}
                  >
                    {isPortfolioDailyUsdPositive ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {isPortfolioDailyUsdPositive ? '+' : ''}{portfolioDailyChangePctUsd.toFixed(2)}% hoy en USD
                  </span>
                ) : (
                  <span 
                    className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5 ${
                      isPortfolioDailyPositive 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}
                    title={`Rendimiento diario en ARS: ${isPortfolioDailyPositive ? '+' : ''}${portfolioDailyChangePct.toFixed(2)}% (${isPortfolioDailyPositive ? '+' : ''}${formatCurrency(portfolioDailyChangeArs, 'ARS')})`}
                  >
                    {isPortfolioDailyPositive ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {isPortfolioDailyPositive ? '+' : ''}{portfolioDailyChangePct.toFixed(2)}% hoy
                  </span>
                )
              )}
            </h2>
          </div>
        </div>

        {/* Tab selector, Currency toggle and quick action */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {/* Currency Toggle (ARS / USD MEP) */}
          <div className="bg-[#18181b] border border-[#27272a] p-0.5 rounded-lg flex items-center text-xs">
            <button
              type="button"
              onClick={() => handleToggleCurrency('ARS')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                effectiveCurrency === 'ARS'
                  ? 'bg-[#27272a] text-[#f59e0b] font-bold shadow-xs'
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
              title="Ver valuación y rendimientos en Pesos (ARS)"
            >
              ARS ($)
            </button>
            <button
              type="button"
              onClick={() => handleToggleCurrency('USD')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                effectiveCurrency === 'USD'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-xs'
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
              title="Ver valuación y rendimientos en Dólares MEP tomando la fecha histórica de cada compra"
            >
              USD (MEP)
            </button>
          </div>

          <div className="bg-[#18181b] border border-[#27272a] p-0.5 rounded-lg flex items-center text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('tenencias')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                activeTab === 'tenencias' 
                  ? 'bg-[#27272a] text-white shadow-xs font-semibold' 
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
            >
              Tenencias
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('watchlist')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                activeTab === 'watchlist' 
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs font-semibold' 
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3 text-sky-400" />
              <span>Seguimiento ({watchlist.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('operaciones')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                activeTab === 'operaciones' 
                  ? 'bg-[#27272a] text-white shadow-xs font-semibold' 
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
            >
              <History className="w-3 h-3" />
              <span>Operaciones ({transactions.length})</span>
            </button>
          </div>

          {onRefreshQuotes && holdings.length > 0 && (
            <button
              type="button"
              onClick={onRefreshQuotes}
              disabled={isRefreshingQuotes}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              title="Actualizar cotizaciones en vivo con BYMA y mercados internacionales"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQuotes ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshingQuotes ? 'Actualizando...' : 'Actualizar Precios'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenTransactionModal()}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#f59e0b]/15 hover:bg-[#f59e0b]/25 border border-[#f59e0b]/40 text-[#f59e0b] rounded-lg text-xs font-semibold transition-all cursor-pointer"
            title="Registrar nueva operación"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nueva</span>
          </button>

          {onClearPortfolio && holdings.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('¿Deseas vaciar la cartera para cargar tus valores reales desde cero?')) {
                  onClearPortfolio();
                }
              }}
              className="p-1 rounded-lg bg-[#18181b] hover:bg-rose-950/40 border border-[#27272a] hover:border-rose-500/40 text-[#71717a] hover:text-rose-400 text-xs transition-all"
              title="Vaciar cartera para empezar de cero"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onToggleMaximize && (
            <button
              type="button"
              onClick={onToggleMaximize}
              title={isMaximized ? "Restaurar vista dividida" : "Desplegar Cartera a pantalla completa"}
              className="p-1 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-white transition-all"
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Content depending on Active Tab */}
      {activeTab === 'tenencias' ? (
        <div className="mt-2.5 flex-1 flex flex-col min-h-0">
          {holdings.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-[#27272a] rounded-xl bg-[#18181b]/40 my-auto">
              <div className="w-12 h-12 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/25 flex items-center justify-center text-[#f59e0b] mb-3">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mb-1.5">
                {currentUser ? `Cartera sincronizada con Firebase (${currentUser.displayName || currentUser.email})` : 'Cartera protegida y sincronizada en la nube'}
              </h3>
              <p className="text-xs text-[#a1a1aa] max-w-md mb-4 leading-relaxed">
                {currentUser 
                  ? 'Tu cuenta de Google está conectada. Cualquier activo, compra o venta que agregues se guardará de forma persistente y automática en tu base de datos de Firebase.'
                  : 'Inicia sesión con tu cuenta de Google para guardar de forma persistente tus activos en Firebase y acceder a ellos desde cualquier lugar.'}
              </p>
              
              <div className="flex items-center gap-2.5 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => onOpenTransactionModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b] hover:bg-[#d97706] text-[#09090b] font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Mi Primera Operación</span>
                </button>

                {!currentUser && onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={onOpenAuthModal}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-100 text-black font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <span>Iniciar con Google</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4 text-[10px] text-[#71717a] flex-wrap justify-center">
                <span>Ingresa por ejemplo:</span>
                <span className="bg-[#27272a] px-2 py-0.5 rounded text-white font-mono">$YPFD</span>
                <span className="bg-[#27272a] px-2 py-0.5 rounded text-white font-mono">$AL30</span>
                <span className="bg-[#27272a] px-2 py-0.5 rounded text-white font-mono">$AAPL</span>
                <span className="bg-[#27272a] px-2 py-0.5 rounded text-white font-mono">$SPY</span>
                <span className="bg-[#27272a] px-2 py-0.5 rounded text-white font-mono">$GGAL</span>
              </div>
            </div>
          ) : (
            <>
              {/* Distribution and weighting bar ordered strictly from highest to lowest weight */}
              <div className="mb-2.5">
                <div className="flex justify-between items-center text-[10px] text-[#71717a] mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-[#a1a1aa]">Distribución y Ponderación</span>
                    <span className="text-[9px] text-[#71717a] bg-[#18181b] px-1.5 py-0.2 rounded border border-[#27272a]">
                      Mayor a menor peso
                    </span>
                  </div>
                  {/* Top weighted holdings badges ordered descending */}
                  <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                    {holdingsSortedByWeight.slice(0, 5).map((h, i) => (
                      <span key={h.id} className="font-mono text-[#a1a1aa] whitespace-nowrap text-[10px]">
                        <strong className="text-white">${h.ticker}</strong>{' '}
                        <span className="text-[#f59e0b] font-semibold">{h.weightPct.toFixed(1)}%</span>
                      </span>
                    ))}
                    {holdingsSortedByWeight.length > 5 && (
                      <span className="text-[9px] text-[#71717a] font-mono">
                        +{holdingsSortedByWeight.length - 5} más
                      </span>
                    )}
                  </div>
                </div>

                {/* Visual colored horizontal bar sorted from highest to lowest weight */}
                <div className="h-2 w-full bg-[#18181b] rounded-full overflow-hidden flex border border-[#27272a]">
                  {holdingsSortedByWeight.map((h, i) => (
                    <div
                      key={h.id}
                      style={{ width: `${Math.max(h.weightPct, 0.5)}%` }}
                      className={`${barColors[i % barColors.length]} h-full transition-all duration-200 hover:opacity-85`}
                      title={`${h.ticker} (${h.name}): ${h.weightPct.toFixed(1)}% de la cartera | ${formatCurrency(h.valueArs, 'ARS')}`}
                    />
                  ))}
                </div>
              </div>

              {/* Live stock exchange status banner */}
              <div className="flex items-center justify-between text-[10px] text-[#71717a] mb-1.5 px-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[#a1a1aa] font-medium">Bolsa de Valores (BYMA / NYSE) Conectada</span>
                  {lastQuotesUpdated && <span className="text-[#71717a]">• Precios actualizados: {lastQuotesUpdated}</span>}
                </div>
                <span className="hidden sm:inline text-[#71717a]">
                  Conexión oficial directa para cotizaciones y variaciones diarias
                </span>
              </div>

              {/* Holdings table separated by asset category (Acciones Locales, CEDEARs, etc.) */}
              <div className={`overflow-x-auto rounded-lg border border-[#27272a] bg-[#18181b]/50 ${
                isMaximized ? 'flex-1 overflow-y-auto max-h-[calc(100vh-210px)]' : 'overflow-y-auto max-h-[360px] xl:max-h-[calc(100vh-250px)]'
              }`}>
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-[#18181b] border-b border-[#27272a]">
                    <tr className="text-[#71717a] uppercase text-[9px] tracking-wider font-semibold">
                      <th className="py-2 px-2.5">Activo</th>
                      <th className="py-2 px-2 text-right">Nominales</th>
                      <th className="py-2 px-2 text-right">
                        {effectiveCurrency === 'USD' ? (
                          <div>
                            <span>P. Compra USD</span>
                            <span className="block text-[7px] text-[#f59e0b] font-normal lowercase tracking-normal">mep fecha</span>
                          </div>
                        ) : (
                          'P. Compra'
                        )}
                      </th>
                      <th className="py-2 px-2 text-right">
                        {effectiveCurrency === 'USD' ? 'P. Actual USD' : 'P. Actual'}
                      </th>
                      <th className="py-2 px-2 text-right">
                        {effectiveCurrency === 'USD' ? 'Valuación (USD)' : 'Valuación (ARS)'}
                      </th>
                      <th className="py-2 px-2 text-right">
                        {effectiveCurrency === 'USD' ? 'Val. (ARS)' : 'Val. (MEP)'}
                      </th>
                      <th className="py-2 px-2 text-right">
                        {effectiveCurrency === 'USD' ? (
                          <div>
                            <span>Rend. Histórico USD</span>
                            <span className="block text-[7px] text-emerald-400 font-normal lowercase tracking-normal">vs mep compra</span>
                          </div>
                        ) : (
                          'Rend. Histórico'
                        )}
                      </th>
                      <th className="py-2 px-2 text-right">
                        {effectiveCurrency === 'USD' ? 'Rend. Día USD' : 'Rend. Día'}
                      </th>
                      <th className="py-2 px-2 text-center">Peso</th>
                      <th className="py-2 px-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a]/60">
                    {assetGroups.map((group) => {
                      const isCollapsed = collapsedGroups[group.id] || false;
                      return (
                        <Fragment key={`group-${group.id}`}>
                          {/* Group header section */}
                          <tr className="border-t-2 border-[#27272a] bg-[#161618]">
                            <td colSpan={10} className="p-0">
                              <div 
                                onClick={() => toggleGroup(group.id)}
                                className="py-2 px-2.5 flex flex-wrap items-center justify-between gap-2 cursor-pointer hover:bg-[#202024] transition-colors select-none"
                              >
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    className="text-[#71717a] hover:text-white p-0.5"
                                    title={isCollapsed ? 'Desplegar grupo' : 'Colapsar grupo'}
                                  >
                                    {isCollapsed ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-[#a1a1aa]" />
                                    ) : (
                                      <ChevronUp className="w-3.5 h-3.5 text-[#a1a1aa]" />
                                    )}
                                  </button>
                                  <span className={`w-2 h-2 rounded-full ${group.dotColor}`} />
                                  <span className="font-bold text-xs text-white tracking-wide uppercase">
                                    {group.title}
                                  </span>
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${group.tagBg} ${group.tagTextColor}`}>
                                    {group.items.length} {group.items.length === 1 ? 'activo' : 'activos'}
                                  </span>
                                  <span className="hidden sm:inline text-[10px] text-[#71717a]">
                                    • {group.subtitle}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs font-mono">
                                  <span className="text-[#71717a] text-[10px] uppercase font-sans">Subtotal:</span>
                                  {effectiveCurrency === 'USD' ? (
                                    <>
                                      <span className="text-emerald-400 font-bold text-xs">
                                        {formatCurrency(group.totalUsd, 'USD')}
                                      </span>
                                      <span className="text-[#71717a] font-normal text-[10px]">
                                        ({formatCurrency(group.totalArs, 'ARS')})
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-white font-semibold">
                                        {formatCurrency(group.totalArs, 'ARS')}
                                      </span>
                                      <span className="text-emerald-400 font-medium text-[11px]">
                                        {formatCurrency(group.totalUsd, 'USD')}
                                      </span>
                                    </>
                                  )}
                                  <span className="bg-[#27272a] text-[#f59e0b] px-1.5 py-0.5 rounded text-[10px] font-bold border border-[#f59e0b]/20">
                                    {group.totalWeightPct.toFixed(1)}% cartera
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>

                          {/* Group asset rows (ordered from highest to lowest weight) */}
                          {!isCollapsed && group.items.map((h) => {
                            const isEditing = editingHoldingId === h.id;
                            return (
                              <tr 
                                key={h.id} 
                                className={`transition-colors group ${
                                  isEditing ? 'bg-[#27272a]/60 ring-1 ring-[#f59e0b]/40' : 'hover:bg-[#27272a]/40'
                                }`}
                              >
                                {/* Ticker & Name */}
                                <td className="py-2 px-2.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white font-mono text-xs">
                                      {h.ticker}
                                    </span>
                                    <span className={`text-[8px] px-1 py-0.2 rounded font-normal ${
                                      h.assetType === 'Bono Soberano' 
                                        ? 'bg-sky-500/15 text-sky-400' 
                                        : h.assetType === 'CEDEAR' 
                                        ? 'bg-purple-500/15 text-purple-400' 
                                        : 'bg-amber-500/15 text-amber-400'
                                    }`}>
                                      {h.assetType === 'Acción Local' ? 'Merval' : h.assetType}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-[#71717a] truncate max-w-[130px]">
                                    {h.name}
                                  </div>
                                </td>

                                {/* Nominales */}
                                <td className="py-2 px-2 text-right font-mono">
                                  {isEditing ? (
                                    <div className="flex flex-col items-end">
                                      <input
                                        type="number"
                                        step="any"
                                        autoFocus
                                        value={editNominales}
                                        onChange={(e) => setEditNominales(parseFloat(e.target.value) || 0)}
                                        onKeyDown={(e) => handleEditKeyDown(e, h)}
                                        className="w-20 px-1.5 py-0.5 bg-[#121214] border border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] rounded text-white text-right text-xs outline-hidden"
                                        title="Presiona Enter para confirmar o Esc para cancelar"
                                      />
                                      <span className="text-[8px] text-[#71717a] flex items-center gap-0.5 mt-0.5">
                                        <CornerDownLeft className="w-2 h-2 text-[#f59e0b]" /> Enter para guardar
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="font-semibold text-[#e2e8f0]">
                                      {h.nominales.toLocaleString('es-AR')}
                                    </span>
                                  )}
                                </td>

                                {/* Purchase Price */}
                                <td className="py-2 px-2 text-right font-mono text-[11px]">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="any"
                                      value={editPurchasePrice}
                                      onChange={(e) => setEditPurchasePrice(parseFloat(e.target.value) || 0)}
                                      onKeyDown={(e) => handleEditKeyDown(e, h)}
                                      className="w-22 px-1.5 py-0.5 bg-[#121214] border border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] rounded text-white text-right text-xs outline-hidden"
                                      title="Presiona Enter para confirmar o Esc para cancelar"
                                    />
                                  ) : effectiveCurrency === 'USD' ? (
                                    <div>
                                      <div className="font-semibold text-white">
                                        {formatCurrency(h.purchasePriceUsd, 'USD')}
                                      </div>
                                      <div className="text-[9px] text-[#71717a]" title={`Dólar MEP de fecha de compra: $${h.purchaseMepRateAvg.toFixed(2)} (Ámbito)`}>
                                        MEP: ${h.purchaseMepRateAvg.toFixed(0)}
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="text-[#a1a1aa]">{formatCurrency(h.purchasePrice, h.currency)}</div>
                                      <div className="text-[9px] text-[#71717a]">
                                        ≈ {formatCurrency(h.purchasePriceUsd, 'USD')}
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* Current Price */}
                                <td className="py-2 px-2 text-right font-mono font-semibold text-[11px]">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="any"
                                      value={editCurrentPrice}
                                      onChange={(e) => setEditCurrentPrice(parseFloat(e.target.value) || 0)}
                                      onKeyDown={(e) => handleEditKeyDown(e, h)}
                                      className="w-22 px-1.5 py-0.5 bg-[#121214] border border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] rounded text-white text-right text-xs outline-hidden"
                                      title="Presiona Enter para confirmar o Esc para cancelar"
                                    />
                                  ) : effectiveCurrency === 'USD' ? (
                                    <div>
                                      <div className="text-white">{formatCurrency(h.currentPriceUsd, 'USD')}</div>
                                      <div className="text-[9px] text-[#71717a] font-normal">
                                        {formatCurrency(h.currentPrice, h.currency)}
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="text-white">{formatCurrency(h.currentPrice, h.currency)}</div>
                                      <div className={`text-[9px] flex items-center justify-end ${h.dailyChangePctArs >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {h.dailyChangePctArs >= 0 ? '+' : ''}{h.dailyChangePctArs.toFixed(1)}%
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* Main Valuation */}
                                <td className="py-2 px-2 text-right font-mono font-bold text-xs">
                                  {effectiveCurrency === 'USD' ? (
                                    <span className="text-emerald-400">{formatCurrency(h.valueUsd, 'USD')}</span>
                                  ) : (
                                    <span className="text-white">{formatCurrency(h.valueArs, 'ARS')}</span>
                                  )}
                                </td>

                                {/* Secondary Valuation */}
                                <td className="py-2 px-2 text-right font-mono text-xs">
                                  {effectiveCurrency === 'USD' ? (
                                    <span className="text-[#a1a1aa]">{formatCurrency(h.valueArs, 'ARS')}</span>
                                  ) : (
                                    <span className="text-emerald-400">{formatCurrency(h.valueUsd, 'USD')}</span>
                                  )}
                                </td>

                                {/* Total Historical Profit / Loss */}
                                <td className="py-2 px-2 text-right font-mono">
                                  {effectiveCurrency === 'USD' ? (
                                    <div>
                                      <div className={`font-bold text-xs ${h.isUsdPositive ? 'text-emerald-400' : 'text-rose-400'}`} title="Rendimiento total histórico en USD considerando el Dólar MEP de Ámbito a la fecha de compra">
                                        {h.profitPctUsd >= 0 ? '+' : ''}{h.profitPctUsd.toFixed(1)}%
                                      </div>
                                      <div className="text-[9px] text-[#71717a]">
                                        {h.profitUsd >= 0 ? '+' : ''}{formatCurrency(h.profitUsd, 'USD')}
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className={`font-semibold text-xs ${h.isArsPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {h.profitPctArs >= 0 ? '+' : ''}{h.profitPctArs.toFixed(1)}%
                                      </div>
                                      <div className="text-[9px] text-[#71717a]">
                                        {h.profitArs >= 0 ? '+' : ''}{formatCurrency(h.profitArs, 'ARS')}
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* Daily Profit / Loss */}
                                <td className="py-2 px-2 text-right font-mono">
                                  {effectiveCurrency === 'USD' ? (
                                    <div>
                                      <div className={`font-semibold text-xs ${h.dailyChangeUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {h.dailyChangePctUsd >= 0 ? '+' : ''}{h.dailyChangePctUsd.toFixed(1)}%
                                      </div>
                                      <div className="text-[9px] text-[#71717a]">
                                        {h.dailyChangeUsd >= 0 ? '+' : ''}{formatCurrency(h.dailyChangeUsd, 'USD')}
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className={`font-semibold text-xs ${h.dailyChangeArs >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {h.dailyChangePctArs >= 0 ? '+' : ''}{h.dailyChangePctArs.toFixed(1)}%
                                      </div>
                                      <div className="text-[9px] text-[#71717a]">
                                        {h.dailyChangeArs >= 0 ? '+' : ''}{formatCurrency(h.dailyChangeArs, 'ARS')}
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* Weight */}
                                <td className="py-2 px-2 text-center font-mono text-[11px]">
                                  <span className="font-bold text-[#f59e0b] bg-[#f59e0b]/10 px-1.5 py-0.5 rounded border border-[#f59e0b]/20">
                                    {h.weightPct.toFixed(1)}%
                                  </span>
                                </td>

                                {/* Actions */}
                                <td className="py-2 px-2 text-center">
                                  {isEditing ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => saveEdit(h)}
                                        className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer"
                                        title="Confirmar cambios (Enter)"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="p-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 cursor-pointer"
                                        title="Cancelar edición (Esc)"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => onAskAssistantAboutTicker(h.ticker)}
                                        title={`Consultar análisis de ${h.ticker} con el Asistente`}
                                        className="p-1 text-[#f59e0b] hover:bg-[#f59e0b]/20 rounded transition-colors cursor-pointer"
                                      >
                                        <Sparkles className="w-3 h-3" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => startEdit(h)}
                                        title="Editar nominales o precio (Enter para guardar)"
                                        className="p-1 text-[#71717a] hover:text-white hover:bg-[#27272a] rounded transition-colors cursor-pointer"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => onDeleteHolding(h.id)}
                                        title="Eliminar tenencia"
                                        className="p-1 text-[#71717a] hover:text-rose-400 hover:bg-[#27272a] rounded transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ) : activeTab === 'watchlist' ? (
        /* Watchlist tab */
        <div className="mt-2.5 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#27272a]">
            <div className="text-xs text-[#a1a1aa]">
              Empresas y activos en seguimiento para análisis fundamental
            </div>
            {onOpenAddWatchlistModal && (
              <button
                type="button"
                onClick={onOpenAddWatchlistModal}
                className="flex items-center gap-1 px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar a Seguimiento</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#27272a] bg-[#18181b]/50 overflow-y-auto max-h-[360px] xl:max-h-[calc(100vh-250px)]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-[#18181b] border-b border-[#27272a]">
                <tr className="text-[#71717a] uppercase text-[9px] tracking-wider font-semibold">
                  <th className="py-2 px-2.5">Ticker</th>
                  <th className="py-2 px-2">Empresa / Activo</th>
                  <th className="py-2 px-2">Tipo</th>
                  <th className="py-2 px-2 text-right">Precio Actual</th>
                  <th className="py-2 px-2 text-right">Variación Día</th>
                  <th className="py-2 px-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/50">
                {watchlist.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-xs text-[#71717a]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Eye className="w-6 h-6 text-[#52525b]" />
                        <span>No tienes tickers en la lista de seguimiento.</span>
                        {onOpenAddWatchlistModal && (
                          <button
                            type="button"
                            onClick={onOpenAddWatchlistModal}
                            className="mt-1 text-xs text-sky-400 hover:underline cursor-pointer font-medium"
                          >
                            + Agregar tu primer ticket de seguimiento
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  watchlist.map((item) => {
                    const isPositive = item.dailyChangePct >= 0;
                    return (
                      <tr key={item.id} className="hover:bg-[#27272a]/40 text-xs">
                        <td className="py-2 px-2.5 font-bold font-mono text-white">
                          <span className="bg-[#27272a] px-1.5 py-0.5 rounded border border-[#3f3f46]">
                            ${item.ticker}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-white font-medium max-w-[200px] truncate" title={item.name}>
                          {item.name}
                        </td>
                        <td className="py-2 px-2">
                          <span className="text-[10px] text-[#a1a1aa] bg-[#09090b] px-1.5 py-0.5 rounded font-sans">
                            {item.assetType}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-white">
                          {item.currentPrice > 0 
                            ? `$${item.currentPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${item.currency}`
                            : 'Sin cotización'}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">
                          <span className={`font-semibold flex items-center justify-end gap-0.5 ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {isPositive ? '+' : ''}{item.dailyChangePct.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => onAskAssistantAboutTicker(item.ticker)}
                              title={`Consultar análisis fundamental de ${item.ticker} con el Asistente`}
                              className="p-1 text-amber-400 hover:bg-amber-500/20 rounded transition-colors cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            {onDeleteWatchlist && (
                              <button
                                type="button"
                                onClick={() => onDeleteWatchlist(item.id)}
                                title="Eliminar de la lista de seguimiento"
                                className="p-1 text-[#71717a] hover:text-rose-400 hover:bg-[#27272a] rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Transactions tab */
        <div className="mt-2.5 flex-1 flex flex-col min-h-0">
          <div className="overflow-x-auto rounded-lg border border-[#27272a] bg-[#18181b]/50 overflow-y-auto max-h-[360px] xl:max-h-[calc(100vh-250px)]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-[#18181b] border-b border-[#27272a]">
                <tr className="text-[#71717a] uppercase text-[9px] tracking-wider font-semibold">
                  <th className="py-2 px-2.5">Fecha</th>
                  <th className="py-2 px-2">Tipo</th>
                  <th className="py-2 px-2">Ticker</th>
                  <th className="py-2 px-2 text-right">Nominales</th>
                  <th className="py-2 px-2 text-right">Precio</th>
                  <th className="py-2 px-2 text-right">
                    <div>
                      <span>Dólar MEP Fecha</span>
                      <span className="block text-[7px] text-[#f59e0b] font-normal lowercase tracking-normal">Ámbito Histórico</span>
                    </div>
                  </th>
                  <th className="py-2 px-2 text-right">Total ARS</th>
                  <th className="py-2 px-2 text-right text-emerald-400">Total USD</th>
                  <th className="py-2 px-2 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/60 font-mono">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#71717a] font-sans">
                      No hay transacciones registradas.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const effectiveMep = tx.mepRate && tx.mepRate > 0 ? tx.mepRate : dollarMep;
                    const totalArs = tx.currency === 'USD' 
                      ? tx.nominales * tx.price * effectiveMep 
                      : tx.nominales * tx.price;
                    const totalUsd = tx.currency === 'USD' 
                      ? tx.nominales * tx.price 
                      : (effectiveMep > 0 ? totalArs / effectiveMep : 0);

                    return (
                      <tr key={tx.id} className="hover:bg-[#27272a]/40 text-xs">
                        <td className="py-2 px-2.5 text-[#a1a1aa] font-sans text-[11px]">{tx.date}</td>
                        <td className="py-2 px-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-sans ${
                            tx.type === 'Compra' 
                              ? 'bg-emerald-500/15 text-emerald-400' 
                              : 'bg-rose-500/15 text-rose-400'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-2 px-2 font-bold text-white">${tx.ticker}</td>
                        <td className="py-2 px-2 text-right text-white">{tx.nominales.toLocaleString('es-AR')}</td>
                        <td className="py-2 px-2 text-right text-[#a1a1aa]">{formatCurrency(tx.price, tx.currency)}</td>
                        <td className="py-2 px-2 text-right">
                          {tx.mepRate && tx.mepRate > 0 ? (
                            <div className="flex flex-col items-end">
                              <span className="text-white font-semibold">${tx.mepRate.toFixed(2)}</span>
                              <span className="text-[8px] text-[#f59e0b] bg-[#f59e0b]/10 px-1 rounded">
                                {tx.sourceMep || 'Ámbito'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#71717a] text-[10px]">-</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right font-semibold text-white">
                          {formatCurrency(totalArs, 'ARS')}
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-emerald-400">
                          {formatCurrency(totalUsd, 'USD')}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="p-1 text-[#71717a] hover:text-rose-400 rounded cursor-pointer"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
