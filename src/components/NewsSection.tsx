import { useState, useMemo } from 'react';
import { Newspaper, Sparkles, RefreshCw, Maximize2, Minimize2, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { NewsItem } from '../types';

interface NewsSectionProps {
  news: NewsItem[];
  onSelectNews: (item: NewsItem) => void;
  onRefreshNews: () => void;
  isRefreshing: boolean;
  onAskAssistantAboutNews: (item: NewsItem) => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  portfolioTickers?: string[];
  tickersWithoutNews?: string[];
}

export default function NewsSection({
  news,
  onSelectNews,
  onRefreshNews,
  isRefreshing,
  onAskAssistantAboutNews,
  isMaximized = false,
  onToggleMaximize,
  portfolioTickers = [],
  tickersWithoutNews = []
}: NewsSectionProps) {
  const [filter, setFilter] = useState<string>('Todos');
  const [selectedTickerFilter, setSelectedTickerFilter] = useState<string | null>(null);

  // Available tickers for filtering
  const availableTickers = useMemo(() => {
    const fromNews = new Set<string>();
    news.forEach(item => {
      item.relatedTickers?.forEach(t => fromNews.add(t.toUpperCase()));
    });
    portfolioTickers.forEach(t => fromNews.add(t.toUpperCase()));
    return Array.from(fromNews);
  }, [news, portfolioTickers]);

  const filteredNews = useMemo(() => {
    return news.filter(item => {
      // Ticker filter
      if (selectedTickerFilter) {
        const matchesTicker = item.relatedTickers.some(t => t.toUpperCase() === selectedTickerFilter);
        if (!matchesTicker) return false;
      }
      // Category filter
      if (filter === 'Todos') return true;
      return item.category === filter;
    });
  }, [news, filter, selectedTickerFilter]);

  // Compute tickers in portfolio that truly have no news in the current list
  const absentTickers = useMemo(() => {
    if (tickersWithoutNews && tickersWithoutNews.length > 0) {
      return tickersWithoutNews;
    }
    const coveredTickers = new Set(
      news.flatMap(n => n.relatedTickers.map(t => t.toUpperCase()))
    );
    return portfolioTickers.filter(t => !coveredTickers.has(t.toUpperCase()));
  }, [news, portfolioTickers, tickersWithoutNews]);

  return (
    <div className={`bg-[#121214] border border-[#27272a] rounded-xl flex flex-col shadow-xs transition-all ${
      isMaximized ? 'p-4 sm:p-5 h-full' : 'p-3 sm:p-4 h-full'
    }`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#27272a] mb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b]">
            <Newspaper className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-white tracking-tight">
              Noticias & Inteligencia
            </h2>
            <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-semibold flex items-center gap-0.5">
              <ShieldCheck className="w-2.5 h-2.5" />
              <span>100% Oficial</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Category Filter pills */}
          <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
            {(['Todos', 'Cartera', 'Balances', 'Macro'] as const).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  filter === cat 
                    ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 font-semibold' 
                    : 'bg-[#18181b] text-[#a1a1aa] border border-[#27272a] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onRefreshNews}
            disabled={isRefreshing}
            title="Actualizar noticias con APIs oficiales (Yahoo Finance, SEC, CNV)"
            className="p-1 rounded-lg bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-[#f59e0b] hover:border-[#f59e0b]/50 transition-all disabled:opacity-50 ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#f59e0b]' : ''}`} />
          </button>

          {onToggleMaximize && (
            <button
              type="button"
              onClick={onToggleMaximize}
              title={isMaximized ? "Restaurar vista dividida" : "Desplegar Noticias a pantalla completa"}
              className="p-1 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-white transition-all ml-0.5"
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Sub-bar: Filter by portfolio ticker */}
      {availableTickers.length > 0 && (
        <div className="flex items-center gap-1.5 pb-2 overflow-x-auto text-[10px] scrollbar-none">
          <span className="text-[#71717a] text-[10px] font-medium shrink-0">Tickers:</span>
          <button
            type="button"
            onClick={() => setSelectedTickerFilter(null)}
            className={`px-1.5 py-0.5 rounded font-mono font-bold shrink-0 transition-all ${
              selectedTickerFilter === null
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-[#71717a] hover:text-[#d4d4d8]'
            }`}
          >
            Todos
          </button>
          {availableTickers.map(t => {
            const hasNews = news.some(n => n.relatedTickers.some(rt => rt.toUpperCase() === t));
            const isSelected = selectedTickerFilter === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTickerFilter(isSelected ? null : t)}
                className={`px-1.5 py-0.5 rounded font-mono font-bold shrink-0 transition-all border ${
                  isSelected
                    ? 'bg-[#f59e0b] text-[#09090b] border-[#f59e0b]'
                    : hasNews
                    ? 'bg-[#18181b] text-[#d4d4d8] border-[#27272a] hover:border-[#3f3f46]'
                    : 'bg-[#18181b]/50 text-[#71717a] border-dashed border-[#27272a] hover:text-[#a1a1aa]'
                }`}
                title={hasNews ? `Ver noticias verificadas de ${t}` : `Sin noticias recientes para ${t}`}
              >
                ${t}
                {!hasNews && <span className="text-[8px] ml-1 opacity-70">(0)</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Tickers without recent news banner (Mandatory transparency rule 6 & 8) */}
      {absentTickers.length > 0 && !selectedTickerFilter && (
        <div className="mb-2 p-2 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-between gap-2 text-[10px] text-[#a1a1aa]">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 text-[#71717a] shrink-0" />
            <span className="truncate">
              Sin noticias oficiales recientes (24-48h):{' '}
              <strong className="text-[#d4d4d8] font-mono">
                {absentTickers.map(t => `$${t}`).join(', ')}
              </strong>
            </span>
          </div>
          <span className="text-[9px] text-[#71717a] shrink-0 font-medium">
            Sin rumores
          </span>
        </div>
      )}

      {/* Selected ticker with no news notice */}
      {selectedTickerFilter && filteredNews.length === 0 && (
        <div className="p-4 my-auto text-center rounded-xl bg-[#18181b] border border-[#27272a]">
          <AlertCircle className="w-5 h-5 text-[#f59e0b] mx-auto mb-1.5 opacity-80" />
          <h4 className="text-xs font-bold text-white mb-0.5">
            Sin noticias oficiales recientes (últimas 24-48h) para ${selectedTickerFilter}
          </h4>
          <p className="text-[11px] text-[#71717a] max-w-sm mx-auto">
            No se detectaron publicaciones oficiales ni hechos relevantes confirmados ante SEC, CNV o agencias financieras autorizadas. No se genera información simulada o no verificada.
          </p>
          <button
            type="button"
            onClick={() => setSelectedTickerFilter(null)}
            className="mt-2.5 px-2.5 py-1 text-[11px] font-semibold text-white bg-[#27272a] hover:bg-[#3f3f46] rounded-lg transition-all"
          >
            Ver todos los tickers
          </button>
        </div>
      )}

      {/* News list */}
      {!(selectedTickerFilter && filteredNews.length === 0) && (
        <div className={`overflow-y-auto pr-1 space-y-2 flex-1 ${
          isMaximized 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 space-y-0 max-h-[calc(100vh-250px)]' 
            : 'max-h-[220px] xl:max-h-[calc(42vh-95px)]'
        }`}>
          {filteredNews.length === 0 ? (
            <div className="text-center py-6 text-[#71717a] text-xs">
              No hay noticias oficiales en esta categoría.
            </div>
          ) : (
            filteredNews.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                onClick={() => onSelectNews(item)}
                className="bg-[#18181b]/80 hover:bg-[#1f1f23] border border-[#27272a] hover:border-[#3f3f46] rounded-lg p-2.5 transition-all cursor-pointer group flex flex-col justify-between gap-1.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1 flex-wrap">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                        item.category === 'Cartera'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                          : item.category === 'Balances'
                          ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {item.category}
                      </span>

                      {item.relatedTickers.map((ticker, tIdx) => (
                        <span 
                          key={`${ticker}-${tIdx}`}
                          className="text-[9px] font-bold bg-[#27272a] text-white px-1.5 py-0.2 rounded font-mono border border-[#3f3f46]"
                        >
                          ${ticker}
                        </span>
                      ))}

                      {/* Official source badge */}
                      <span className="text-[9px] font-medium text-[#a1a1aa] bg-[#27272a]/60 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        <ShieldCheck className="w-2.5 h-2.5 text-[#f59e0b]" />
                        <span className="truncate max-w-[110px]">{item.source}</span>
                      </span>
                    </div>

                    <span className="text-[9px] text-[#71717a] font-mono">
                      {item.date}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-white group-hover:text-[#f59e0b] transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-[11px] text-[#a1a1aa] line-clamp-2 mt-1 leading-normal">
                    {item.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-[#27272a]/60 text-[10px] text-[#71717a]">
                  <div className="flex items-center gap-2">
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Abrir noticia original en fuente oficial"
                        className="flex items-center gap-1 text-[10px] text-[#71717a] hover:text-[#f59e0b] transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Fuente</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAskAssistantAboutNews(item);
                      }}
                      title="Analizar esta noticia con el Asistente"
                      className="flex items-center gap-0.5 text-[10px] text-[#f59e0b] hover:text-amber-300 font-medium px-1.5 py-0.5 rounded bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 transition-all"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Analizar</span>
                    </button>

                    <span className="text-white/60 group-hover:text-white transition-colors text-[10px]">
                      Detalle →
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
