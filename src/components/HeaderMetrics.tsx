import { DollarSign, TrendingUp, RefreshCw, PlusCircle, Edit3, ArrowUpRight, ArrowDownRight, Globe, LayoutGrid, Briefcase, Newspaper, Calendar, LogOut, User as UserIcon, Eye } from 'lucide-react';
import { MarketRates } from '../types';
import { User } from '../lib/firebase';

export type ViewMode = 'split' | 'cartera' | 'watchlist' | 'noticias' | 'calendario';

interface HeaderMetricsProps {
  totalArs: number;
  totalUsdMep: number;
  totalProfitArs: number;
  totalProfitPct: number;
  dailyChangeArs: number;
  dailyChangePct: number;
  marketRates: MarketRates;
  watchlistCount?: number;
  onOpenTransactionModal: () => void;
  onOpenEditMepModal: () => void;
  onRefreshMarketData: () => void;
  isRefreshing: boolean;
  useSearch: boolean;
  onToggleSearch: () => void;
  viewMode: ViewMode;
  onSelectViewMode: (mode: ViewMode) => void;
  currentUser?: User | null;
  onLogout?: () => void;
  onOpenAuthModal?: () => void;
}

export default function HeaderMetrics({
  totalArs,
  totalUsdMep,
  totalProfitArs,
  totalProfitPct,
  dailyChangeArs,
  dailyChangePct,
  marketRates,
  watchlistCount = 0,
  onOpenTransactionModal,
  onOpenEditMepModal,
  onRefreshMarketData,
  isRefreshing,
  useSearch,
  onToggleSearch,
  viewMode,
  onSelectViewMode,
  currentUser,
  onLogout,
  onOpenAuthModal
}: HeaderMetricsProps) {
  const formatArs = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatUsd = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const isProfitPositive = totalProfitArs >= 0;
  const isDailyPositive = dailyChangeArs >= 0;

  return (
    <header className="bg-[#121214] border-b border-[#27272a] px-3 lg:px-6 py-2.5 sticky top-0 z-30 shadow-xs">
      <div className="max-w-[1760px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
        
        {/* Left: Brand + View Switcher */}
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-[#f59e0b]/15 border border-[#f59e0b]/30 p-1.5 rounded-lg text-[#f59e0b]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-white font-mono">ARG-INTEL</span>
                <span className="text-[9px] font-bold bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 px-1.5 py-0.2 rounded uppercase">
                  16" Pro
                </span>
              </div>
            </div>
          </div>

          {/* Section View Switcher (Desplegar secciones) */}
          <div className="bg-[#18181b] border border-[#27272a] p-0.5 rounded-lg flex items-center text-xs">
            <button
              type="button"
              onClick={() => onSelectViewMode('split')}
              title="Vista Dividida: Cartera, Noticias y Calendario en una sola pantalla"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'split'
                  ? 'bg-[#f59e0b] text-[#09090b] shadow-xs'
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Vista Dividida</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectViewMode('cartera')}
              title="Desplegar solo Cartera en pantalla completa"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'cartera'
                  ? 'bg-[#27272a] text-white shadow-xs font-semibold'
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Cartera</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectViewMode('watchlist')}
              title="Desplegar Lista de Seguimiento de empresas de interés"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'watchlist'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs font-semibold'
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>Seguimiento</span>
              {watchlistCount > 0 && (
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded-full font-mono font-bold">
                  {watchlistCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectViewMode('noticias')}
              title="Desplegar solo Noticias de mercado"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'noticias'
                  ? 'bg-[#27272a] text-white shadow-xs font-semibold'
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>Noticias</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectViewMode('calendario')}
              title="Desplegar solo Calendario Financiero"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'calendario'
                  ? 'bg-[#27272a] text-white shadow-xs font-semibold'
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendario</span>
            </button>
          </div>
        </div>

        {/* Center: High-Density Ticker Metrics Chips */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          
          {/* Chip 1: Total ARS / USD MEP */}
          <div className="bg-[#18181b] border border-[#27272a] px-2.5 py-1 rounded-lg flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-[#71717a]">Total</span>
            <span className="font-bold text-white font-mono text-xs sm:text-sm">
              {formatArs(totalArs)}
            </span>
            <span className="text-[#52525b]">|</span>
            <span className="text-emerald-400 font-mono font-semibold text-xs">
              {formatUsd(totalUsdMep)}
            </span>
            <span className={`text-[10px] font-bold flex items-center ${isDailyPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isDailyPositive ? '+' : ''}{dailyChangePct.toFixed(1)}%
            </span>
          </div>

          {/* Chip 2: Rendimiento Histórico */}
          <div className="bg-[#18181b] border border-[#27272a] px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-[#71717a]">Rend. Total</span>
            <span className={`font-mono font-bold text-xs ${isProfitPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isProfitPositive ? '+' : ''}{totalProfitPct.toFixed(2)}%
            </span>
            <span className="text-[#71717a] text-[10px] hidden sm:inline">
              ({isProfitPositive ? '+' : ''}{formatArs(totalProfitArs)})
            </span>
          </div>

          {/* Chip 3: Cotización MEP & CCL */}
          <div 
            onClick={onOpenEditMepModal}
            title="Click para modificar cotización de Dólar MEP / CCL"
            className="bg-[#18181b] hover:bg-[#202024] border border-[#27272a] hover:border-[#f59e0b]/50 px-2.5 py-1 rounded-lg flex items-center gap-2 cursor-pointer transition-all"
          >
            <span className="text-[10px] uppercase font-bold text-[#f59e0b]">MEP</span>
            <span className="font-mono font-bold text-white text-xs">
              ${marketRates.dollarMep.toFixed(2)}
            </span>
            <span className="text-[#52525b]">|</span>
            <span className="text-[#a1a1aa] text-[10px]">CCL ${marketRates.dollarCcl.toFixed(2)}</span>
            <Edit3 className="w-3 h-3 text-[#71717a] hover:text-[#f59e0b]" />
          </div>

          {/* Chip 4: Riesgo País */}
          <div className="bg-[#18181b] border border-[#27272a] px-2.5 py-1 rounded-lg hidden md:flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-[#71717a]">Riesgo País</span>
            <span className="font-mono font-bold text-[#e2e8f0] text-xs">
              {marketRates.riesgoPais} <span className="text-[10px] font-normal text-[#71717a]">pts</span>
            </span>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 self-end xl:self-auto">
          <button
            type="button"
            onClick={onToggleSearch}
            title={useSearch ? "Web Search en vivo conectada" : "Web Search apagada"}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
              useSearch 
                ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b]' 
                : 'bg-[#18181b] border-[#27272a] text-[#71717a] hover:text-white'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span className="hidden sm:inline">Web Search</span>
            <span className={`w-1.5 h-1.5 rounded-full ${useSearch ? 'bg-[#f59e0b]' : 'bg-[#52525b]'}`} />
          </button>

          <button
            type="button"
            onClick={onRefreshMarketData}
            disabled={isRefreshing}
            className="p-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#e2e8f0] rounded-lg transition-all disabled:opacity-50"
            title="Refrescar datos en vivo"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#f59e0b] ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onOpenTransactionModal}
            className="flex items-center gap-1 px-3 py-1 bg-[#f59e0b] hover:bg-[#d97706] text-[#09090b] text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Operación</span>
          </button>

          {/* User Profile / Firebase Auth Status */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#27272a]">
              <div className="flex items-center gap-1.5" title={currentUser.email || currentUser.displayName || 'Usuario'}>
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || 'Usuario'} 
                    className="w-6 h-6 rounded-full border border-emerald-500/60 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold">
                    {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="hidden 2xl:flex flex-col text-left">
                  <span className="text-[11px] font-semibold text-white truncate max-w-[100px]">
                    {currentUser.displayName?.split(' ')[0] || 'Inversor'}
                  </span>
                  <span className="text-[9px] text-emerald-400 flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Cloud Sync
                  </span>
                </div>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 text-[#71717a] hover:text-rose-400 hover:bg-[#27272a] rounded-lg transition-colors cursor-pointer"
                  title="Cerrar sesión de Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            onOpenAuthModal && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-zinc-100 text-black text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Ingresar con Google</span>
              </button>
            )
          )}
        </div>

      </div>
    </header>
  );
}
