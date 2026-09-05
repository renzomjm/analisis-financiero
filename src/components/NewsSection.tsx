import { useState } from 'react';
import { Newspaper, Sparkles, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { NewsItem } from '../types';

interface NewsSectionProps {
  news: NewsItem[];
  onSelectNews: (item: NewsItem) => void;
  onRefreshNews: () => void;
  isRefreshing: boolean;
  onAskAssistantAboutNews: (item: NewsItem) => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export default function NewsSection({
  news,
  onSelectNews,
  onRefreshNews,
  isRefreshing,
  onAskAssistantAboutNews,
  isMaximized = false,
  onToggleMaximize
}: NewsSectionProps) {
  const [filter, setFilter] = useState<'Todos' | 'Cartera' | 'Macro' | 'Balances'>('Todos');

  const filteredNews = news.filter(item => {
    if (filter === 'Todos') return true;
    return item.category === filter;
  });

  return (
    <div className={`bg-[#121214] border border-[#27272a] rounded-xl flex flex-col shadow-xs transition-all ${
      isMaximized ? 'p-4 sm:p-5 h-full' : 'p-3 sm:p-4 h-full'
    }`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#27272a] mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b]">
            <Newspaper className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-white tracking-tight">
              Noticias & Inteligencia
            </h2>
            <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-semibold">
              En Vivo
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Filter pills inline */}
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
            title="Actualizar noticias con Web Search"
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

      {/* News list */}
      <div className={`overflow-y-auto pr-1 space-y-2 flex-1 ${
        isMaximized 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 space-y-0 max-h-[calc(100vh-210px)]' 
          : 'max-h-[220px] xl:max-h-[calc(42vh-75px)]'
      }`}>
        {filteredNews.length === 0 ? (
          <div className="text-center py-6 text-[#71717a] text-xs">
            No hay noticias en esta categoría.
          </div>
        ) : (
          filteredNews.map(item => (
            <div
              key={item.id}
              onClick={() => onSelectNews(item)}
              className="bg-[#18181b]/80 hover:bg-[#1f1f23] border border-[#27272a] hover:border-[#3f3f46] rounded-lg p-2.5 transition-all cursor-pointer group flex flex-col justify-between gap-1.5"
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                      item.category === 'Cartera'
                        ? 'bg-amber-500/15 text-amber-400'
                        : item.category === 'Balances'
                        ? 'bg-purple-500/15 text-purple-400'
                        : 'bg-sky-500/15 text-sky-400'
                    }`}>
                      {item.category}
                    </span>

                    {item.relatedTickers.map(ticker => (
                      <span 
                        key={ticker}
                        className="text-[9px] font-bold bg-[#27272a] text-white px-1 py-0.2 rounded font-mono"
                      >
                        ${ticker}
                      </span>
                    ))}
                  </div>

                  <span className="text-[9px] text-[#71717a] font-mono">
                    {item.date}
                  </span>
                </div>

                <h3 className="text-xs font-semibold text-white group-hover:text-[#f59e0b] transition-colors line-clamp-1 leading-snug">
                  {item.title}
                </h3>

                <p className="text-[11px] text-[#a1a1aa] line-clamp-1 mt-0.5 leading-tight">
                  {item.summary}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-[#27272a]/60 text-[10px] text-[#71717a]">
                <span className="truncate max-w-[130px] font-medium">
                  {item.source}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAskAssistantAboutNews(item);
                    }}
                    title="Analizar esta noticia con el Asistente"
                    className="flex items-center gap-0.5 text-[10px] text-[#f59e0b] hover:text-amber-300 font-medium px-1 py-0.2 rounded bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 transition-all"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Analizar</span>
                  </button>

                  <span className="text-white/60 group-hover:text-white transition-colors text-[10px]">
                    Leer →
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
