import { X, Sparkles, Calendar, Building2, ExternalLink } from 'lucide-react';
import { NewsItem } from '../types';

interface NewsDetailModalProps {
  newsItem: NewsItem | null;
  onClose: () => void;
  onAskAssistant: (newsItem: NewsItem) => void;
}

export default function NewsDetailModal({
  newsItem,
  onClose,
  onAskAssistant
}: NewsDetailModalProps) {
  if (!newsItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-[#27272a] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                newsItem.category === 'Cartera'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : newsItem.category === 'Balances'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              }`}>
                {newsItem.category}
              </span>

              {newsItem.relatedTickers.map(ticker => (
                <span
                  key={ticker}
                  className="font-mono text-xs font-bold bg-[#27272a] text-white px-2 py-0.5 rounded border border-[#3f3f46]"
                >
                  ${ticker}
                </span>
              ))}

              <span className="text-xs text-[#71717a] flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {newsItem.date}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
              {newsItem.title}
            </h2>

            <div className="text-xs text-[#a1a1aa] mt-1">
              Fuente oficial: <strong className="text-white">{newsItem.source}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717a] hover:text-white hover:bg-[#27272a] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-sm text-[#d4d4d8] leading-relaxed">
          <div className="bg-[#18181b] border border-[#27272a] p-3.5 rounded-xl text-xs text-[#a1a1aa] font-medium leading-normal italic">
            "{newsItem.summary}"
          </div>

          <div className="whitespace-pre-line text-xs sm:text-sm text-[#e2e8f0] space-y-3">
            {newsItem.fullContent}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-[#18181b] border-t border-[#27272a] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-medium rounded-xl transition-colors"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={() => {
              onAskAssistant(newsItem);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#f59e0b] hover:bg-[#d97706] text-[#09090b] text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Consultar impacto con el Asistente</span>
          </button>
        </div>

      </div>
    </div>
  );
}
