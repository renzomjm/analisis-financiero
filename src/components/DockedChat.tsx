import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, 
  User, 
  Briefcase, 
  Loader2, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  Trash2,
  Globe,
  Minus,
  MessageSquare
} from 'lucide-react';
import { Message, Holding, MarketRates } from '../types';

interface DockedChatProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  holdings: Holding[];
  marketRates: MarketRates;
  useSearch: boolean;
  onToggleSearch: () => void;
  externalPrompt?: string | null;
  onClearExternalPrompt?: () => void;
}

export default function DockedChat({
  messages,
  isLoading,
  onSendMessage,
  onClearChat,
  holdings,
  marketRates,
  useSearch,
  onToggleSearch,
  externalPrompt,
  onClearExternalPrompt
}: DockedChatProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isBarMinimized, setIsBarMinimized] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // If an external prompt was triggered (e.g. from clicking "Analizar" on a news item or holding)
  useEffect(() => {
    if (externalPrompt) {
      setInput(externalPrompt);
      setIsBarMinimized(false);
      setIsExpanded(true);
      if (onClearExternalPrompt) onClearExternalPrompt();
    }
  }, [externalPrompt, onClearExternalPrompt]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isExpanded) {
      scrollToBottom();
    }
  }, [messages, isExpanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const textToSend = input.trim();
    setInput('');
    setIsExpanded(true);
    onSendMessage(textToSend);
  };

  const quickPrompts = [
    "¿Qué impacto tiene el próximo balance de YPF en mi cartera?",
    "¿Cómo evalúas la diversificación actual entre acciones y bonos?",
    "Analiza la cotización del Dólar MEP vs Inflación proyectada"
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 pointer-events-auto pb-1 sm:pb-1.5">
        
        {/* STATE 1: Minimized Floating Pill */}
        {isBarMinimized ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setIsBarMinimized(false)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[#121214]/95 hover:bg-[#18181b] border border-[#27272a] hover:border-[#f59e0b]/50 text-white rounded-full shadow-xl transition-all cursor-pointer group"
              title="Mostrar barra del Asistente Analítico"
            >
              <div className="bg-[#f59e0b]/15 text-[#f59e0b] p-1 rounded-full border border-[#f59e0b]/30 group-hover:scale-105 transition-transform">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold">Asistente Central</span>
              <span className="text-[10px] text-[#71717a] font-mono">({holdings.length} activos)</span>
              <ChevronUp className="w-3.5 h-3.5 text-[#a1a1aa] group-hover:text-white transition-colors ml-0.5" />
            </button>
          </div>
        ) : (
          /* STATE 2 & 3: Standard Bar or Expanded Panel */
          <div className="bg-[#121214]/95 backdrop-blur-md border border-[#27272a] shadow-2xl rounded-xl overflow-hidden transition-all duration-200">
            
            {/* Standard Collapsed Mini-Console Bar */}
            {!isExpanded ? (
              <div className="px-3 py-1.5 flex items-center justify-between gap-2 text-xs">
                <div 
                  onClick={() => setIsExpanded(true)}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                >
                  <div className="bg-[#f59e0b]/15 text-[#f59e0b] p-1 rounded-md border border-[#f59e0b]/30">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <div className="hidden sm:block">
                    <span className="font-bold text-white text-xs">Asistente Central</span>
                    <span className="text-[10px] text-[#71717a] ml-1.5 font-mono">({holdings.length} activos)</span>
                  </div>
                </div>

                {/* Inline quick input directly in collapsed bar */}
                <form onSubmit={handleSubmit} className="flex-1 max-w-lg relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Preguntar al Asistente (ej. ¿Impacto balance YPF en cartera?)..."
                    disabled={isLoading}
                    className="w-full pl-3 pr-8 py-1 bg-[#18181b] border border-[#27272a] rounded-lg focus:outline-none focus:border-[#f59e0b] text-white text-xs placeholder-[#71717a] transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-1 p-1 text-[#f59e0b] hover:text-amber-300 disabled:opacity-30"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </form>

                {/* Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={onToggleSearch}
                    title={useSearch ? "Web Search activa" : "Web Search inactiva"}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                      useSearch 
                        ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b]' 
                        : 'bg-[#27272a] border-[#3f3f46] text-[#71717a]'
                    }`}
                  >
                    <Globe className="w-2.5 h-2.5" />
                    <span className="hidden md:inline">Web Search</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#27272a] hover:bg-[#3f3f46] text-white text-[11px] font-medium transition-colors"
                    title="Ver historial de chat"
                  >
                    <span>Historial</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsBarMinimized(true)}
                    className="p-1 rounded text-[#71717a] hover:text-white hover:bg-[#27272a] transition-colors"
                    title="Minimizar barra a botón flotante para no tapar nada"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Expanded Full Console Panel */
              <div>
                {/* Header Bar */}
                <div 
                  onClick={() => setIsExpanded(false)}
                  className="px-3.5 py-2 bg-[#18181b] border-b border-[#27272a] flex items-center justify-between cursor-pointer hover:bg-[#202024] transition-colors select-none"
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-[#f59e0b]/15 text-[#f59e0b] p-1.5 rounded-lg border border-[#f59e0b]/30">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white tracking-wide">
                          Asistente Analítico Central
                        </span>
                        <span className="text-[9px] bg-[#27272a] text-[#f59e0b] px-1.5 py-0.2 rounded font-mono">
                          Gemini 3.7 Flash
                        </span>
                      </div>
                      <div className="text-[10px] text-[#a1a1aa] flex items-center gap-1">
                        <span>Cartera Sincronizada ({holdings.length} activos)</span>
                        <span>•</span>
                        <span>Dólar MEP: ${marketRates.dollarMep.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Header controls */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={onToggleSearch}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                        useSearch 
                          ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b]' 
                          : 'bg-[#27272a] border-[#3f3f46] text-[#71717a]'
                      }`}
                    >
                      <Globe className="w-3 h-3" />
                      <span>Web Search</span>
                    </button>

                    {messages.length > 1 && (
                      <button
                        type="button"
                        onClick={onClearChat}
                        title="Limpiar conversación"
                        className="p-1 rounded text-[#71717a] hover:text-rose-400 hover:bg-[#27272a] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsExpanded(false)}
                      className="p-1 rounded bg-[#27272a] text-[#a1a1aa] hover:text-white transition-colors"
                      title="Cerrar panel de chat"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Conversation History */}
                <div className="h-64 sm:h-72 overflow-y-auto p-3 space-y-3 bg-[#09090b]/80 border-b border-[#27272a]">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex max-w-[90%] sm:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
                        <div className="shrink-0 mt-0.5">
                          {msg.role === 'user' ? (
                            <div className="bg-[#27272a] w-6 h-6 rounded-full flex items-center justify-center text-[#a1a1aa] text-xs">
                              <User className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="bg-[#f59e0b]/15 border border-[#f59e0b]/30 w-6 h-6 rounded-full flex items-center justify-center text-[#f59e0b] text-xs">
                              <Briefcase className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>

                        <div
                          className={`px-3 py-2 rounded-xl text-xs ${
                            msg.role === 'user'
                              ? 'bg-[#18181b] border border-[#27272a] text-white rounded-tr-none'
                              : 'bg-[#121214] border border-[#27272a] text-[#e2e8f0] rounded-tl-none shadow-xs'
                          }`}
                        >
                          {msg.role === 'user' ? (
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          ) : (
                            <div className="markdown-body prose prose-xs prose-invert max-w-none prose-headings:text-white prose-a:text-[#f59e0b] prose-strong:text-white prose-table:text-[11px]">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.text}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex max-w-[85%] gap-2">
                        <div className="bg-[#f59e0b]/15 border border-[#f59e0b]/30 w-6 h-6 rounded-full flex items-center justify-center text-[#f59e0b] text-xs shrink-0">
                          <Briefcase className="w-3.5 h-3.5" />
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-[#121214] border border-[#27272a] rounded-tl-none flex items-center space-x-2 text-xs text-[#a1a1aa]">
                          <Loader2 className="w-3.5 h-3.5 text-[#f59e0b] animate-spin" />
                          <span>Analizando cartera y fundamentos...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Suggestions Chips */}
                <div className="px-3 py-1.5 bg-[#121214] flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[10px]">
                  <span className="text-[#71717a] flex items-center gap-1 uppercase font-bold shrink-0">
                    <Sparkles className="w-2.5 h-2.5 text-[#f59e0b]" />
                    Sugerencias:
                  </span>
                  {quickPrompts.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInput(q);
                      }}
                      className="px-2 py-0.5 rounded bg-[#18181b] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white border border-[#27272a] whitespace-nowrap text-[10px] transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Bottom input form in expanded mode */}
                <div className="p-2 bg-[#121214]">
                  <form onSubmit={handleSubmit} className="relative flex items-center">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Pregúntale al Asistente sobre tu cartera, noticias o balances..."
                      disabled={isLoading}
                      className="w-full pl-3 pr-10 py-2 bg-[#18181b] border border-[#27272a] rounded-lg focus:outline-none focus:border-[#f59e0b] text-white text-xs placeholder-[#71717a] transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="absolute right-1 p-1.5 bg-[#f59e0b] hover:bg-[#d97706] text-[#09090b] rounded-md transition-colors disabled:opacity-40 flex items-center justify-center"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
