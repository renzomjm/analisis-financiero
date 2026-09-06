import { useState } from 'react';
import { 
  Eye, 
  Plus, 
  Trash2, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  TrendingUp,
  ExternalLink,
  Info,
  Building2,
  RefreshCw,
  Clock
} from 'lucide-react';
import { WatchlistItem } from '../types';

interface WatchlistSectionProps {
  watchlist: WatchlistItem[];
  onOpenAddWatchlistModal: () => void;
  onDeleteWatchlist: (id: string) => void;
  onAskAssistantAboutTicker: (ticker: string) => void;
  onRefreshQuotes?: () => void;
  isRefreshingQuotes?: boolean;
}

export default function WatchlistSection({
  watchlist,
  onOpenAddWatchlistModal,
  onDeleteWatchlist,
  onAskAssistantAboutTicker,
  onRefreshQuotes,
  isRefreshingQuotes = false
}: WatchlistSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'Todos' | 'Acción Local' | 'CEDEAR' | 'Renta Fija'>('Todos');

  const filteredItems = watchlist.filter(item => {
    const matchesSearch = 
      item.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterType === 'Todos') return true;
    if (filterType === 'Renta Fija') {
      return item.assetType !== 'Acción Local' && item.assetType !== 'CEDEAR';
    }
    return item.assetType === filterType;
  });

  return (
    <div className="bg-[#121214] border border-[#27272a] rounded-xl flex flex-col shadow-xs overflow-hidden h-full">
      
      {/* Top Header */}
      <div className="p-3 sm:p-4 border-b border-[#27272a] flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Lista de Seguimiento
              </h2>
              <span className="text-[10px] bg-[#27272a] text-[#a1a1aa] font-mono px-2 py-0.5 rounded-full font-semibold">
                {watchlist.length} {watchlist.length === 1 ? 'activo' : 'activos'}
              </span>
            </div>
            <p className="text-[11px] text-[#71717a] hidden sm:block">
              Monitoreo fundamental y cotizaciones de empresas de interés
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefreshQuotes && watchlist.length > 0 && (
            <button
              type="button"
              onClick={onRefreshQuotes}
              disabled={isRefreshingQuotes}
              title="Actualizar cotizaciones en vivo"
              className="p-1.5 text-[#a1a1aa] hover:text-white rounded-lg hover:bg-[#27272a] transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQuotes ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAddWatchlistModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Ticket</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      {watchlist.length > 0 && (
        <div className="px-3 sm:px-4 py-2 bg-[#141417] border-b border-[#27272a] flex items-center justify-between gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[140px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#71717a]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar ticker o nombre..."
              className="w-full pl-8 pr-2.5 py-1 bg-[#18181b] border border-[#27272a] rounded-lg text-white text-xs placeholder:text-[#52525b] focus:outline-hidden focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
            {(['Todos', 'Acción Local', 'CEDEAR', 'Renta Fija'] as const).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterType(cat)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  filterType === cat
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                    : 'text-[#a1a1aa] hover:text-white hover:bg-[#27272a]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Body */}
      <div className="p-3 sm:p-4 overflow-y-auto flex-1">
        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mb-1.5">
              Tu Lista de Seguimiento está vacía
            </h3>
            <p className="text-xs text-[#a1a1aa] max-w-md mb-4 leading-relaxed">
              Agrega empresas locales (Merval), CEDEARs o bonos que quieras vigilar de cerca. Monitorea su precio de mercado, variación del día, noticias relevantes y pide análisis fundamental al asistente en cualquier momento.
            </p>
            <button
              type="button"
              onClick={onOpenAddWatchlistModal}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Primer Ticket</span>
            </button>
            <div className="flex items-center gap-2 mt-4 text-[10px] text-[#71717a] flex-wrap justify-center">
              <span>Sugerencias populares:</span>
              <span className="bg-[#27272a] px-2 py-0.5 rounded text-white font-mono">$YPFD</span>
              <span className="bg-[#27272a] px-2 py-0.5 rounded text-white font-mono">$AAPL</span>
              <span className="bg-[#27272a] px-2 py-0.5 rounded text-white font-mono">$VIST</span>
              <span className="bg-[#27272a] px-2 py-0.5 rounded text-white font-mono">$MELI</span>
              <span className="bg-[#27272a] px-2 py-0.5 rounded text-white font-mono">$AL30</span>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#71717a]">
            No se encontraron tickets en la lista con los filtros seleccionados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredItems.map(item => {
              const isPositive = item.dailyChangePct >= 0;
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] transition-all flex flex-col justify-between group shadow-xs hover:shadow-md"
                >
                  <div>
                    {/* Top Row: Ticker badge, Asset Type, and Delete */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#27272a] text-white font-mono font-bold text-xs rounded border border-[#3f3f46]">
                          ${item.ticker}
                        </span>
                        <span className="text-[10px] text-[#a1a1aa] bg-[#09090b] px-2 py-0.5 rounded">
                          {item.assetType}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteWatchlist(item.id)}
                        className="p-1 text-[#52525b] hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                        title="Eliminar de la lista de seguimiento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Company Name */}
                    <div className="text-xs font-semibold text-white truncate mb-2.5" title={item.name}>
                      {item.name}
                    </div>

                    {/* Price and Daily Change */}
                    <div className="flex items-baseline justify-between pt-2 border-t border-[#27272a]/80 mb-2.5">
                      <div>
                        <div className="text-[10px] text-[#71717a]">Precio Actual</div>
                        <div className="text-sm font-mono font-bold text-white">
                          {item.currentPrice > 0 
                            ? `$${item.currentPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${item.currency}`
                            : 'Sin cotización'}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-[#71717a]">Variación Día</div>
                        <div className={`text-xs font-bold font-mono flex items-center justify-end gap-0.5 ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          <span>{isPositive ? '+' : ''}{item.dailyChangePct.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Optional Note */}
                    {item.notes && (
                      <div className="text-[11px] text-[#a1a1aa] bg-[#121214] p-2 rounded-lg border border-[#27272a] mb-3 italic">
                        "{item.notes}"
                      </div>
                    )}
                  </div>

                  {/* Actions: Consultar Análisis con el Asistente */}
                  <div className="pt-2 border-t border-[#27272a] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onAskAssistantAboutTicker(item.ticker)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-gradient-to-r from-amber-500/10 to-sky-500/10 hover:from-amber-500/20 hover:to-sky-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                      title="Consultar análisis fundamental con el Asistente"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Consultar Análisis</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
