import { useState, useEffect, useRef } from 'react';
import HeaderMetrics, { ViewMode } from './components/HeaderMetrics';
import PortfolioSection from './components/PortfolioSection';
import NewsSection from './components/NewsSection';
import CalendarSection from './components/CalendarSection';
import DockedChat from './components/DockedChat';
import TransactionModal from './components/TransactionModal';
import NewsDetailModal from './components/NewsDetailModal';
import EditMepModal from './components/EditMepModal';
import AuthModal from './components/AuthModal';
import { 
  auth, 
  logout, 
  onAuthStateChanged, 
  loadUserPortfolio, 
  saveUserHoldings, 
  saveUserTransactions, 
  User 
} from './lib/firebase';
import { 
  Holding, 
  Transaction, 
  NewsItem, 
  CalendarEvent, 
  MarketRates, 
  Message, 
  AssetType 
} from './types';
import { 
  initialHoldings, 
  initialTransactions, 
  initialNews, 
  initialCalendarEvents, 
  initialMarketRates 
} from './data/initialData';

export default function App() {
  // --- User Authentication State (Firebase) ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const isSyncingWithFirestore = useRef<boolean>(false);

  // --- Persistent State in LocalStorage and Firestore ---
  const [holdings, setHoldings] = useState<Holding[]>(() => {
    try {
      const realPortfolioMigrated = localStorage.getItem('arg_intel_real_portfolio_v3');
      if (!realPortfolioMigrated) {
        localStorage.setItem('arg_intel_real_portfolio_v3', 'true');
        localStorage.removeItem('arg_intel_holdings');
        localStorage.removeItem('arg_intel_transactions');
        return [];
      }
      const saved = localStorage.getItem('arg_intel_holdings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const realPortfolioMigrated = localStorage.getItem('arg_intel_real_portfolio_v3');
      if (!realPortfolioMigrated) {
        return [];
      }
      const saved = localStorage.getItem('arg_intel_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [marketRates, setMarketRates] = useState<MarketRates>(() => {
    try {
      const saved = localStorage.getItem('arg_intel_market_rates');
      return saved ? JSON.parse(saved) : initialMarketRates;
    } catch {
      return initialMarketRates;
    }
  });

  const [news, setNews] = useState<NewsItem[]>(() => {
    try {
      const saved = localStorage.getItem('arg_intel_news');
      return saved ? JSON.parse(saved) : initialNews;
    } catch {
      return initialNews;
    }
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('arg_intel_calendar');
      return saved ? JSON.parse(saved) : initialCalendarEvents;
    } catch {
      return initialCalendarEvents;
    }
  });

  // --- Listen to Firebase Auth state change ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (user) {
        // User logged in: load user's private portfolio from Firestore
        isSyncingWithFirestore.current = true;
        try {
          const { holdings: remoteHoldings, transactions: remoteTransactions, isNewUser } = await loadUserPortfolio(user.uid);
          
          if (!isNewUser) {
            setHoldings(remoteHoldings);
            setTransactions(remoteTransactions);
          } else {
            // If new user in cloud, check if they have local holdings to migrate
            const savedHoldings = localStorage.getItem('arg_intel_holdings');
            const parsedHoldings: Holding[] = savedHoldings ? JSON.parse(savedHoldings) : [];
            const savedTxs = localStorage.getItem('arg_intel_transactions');
            const parsedTxs: Transaction[] = savedTxs ? JSON.parse(savedTxs) : [];

            if (parsedHoldings.length > 0 || parsedTxs.length > 0) {
              await saveUserHoldings(user.uid, parsedHoldings);
              await saveUserTransactions(user.uid, parsedTxs);
              setHoldings(parsedHoldings);
              setTransactions(parsedTxs);
            }
          }
        } catch (err) {
          console.error('Error loading portfolio from Firestore:', err);
        } finally {
          isSyncingWithFirestore.current = false;
        }
      } else {
        // User not logged in: show auth modal so they can log in
        setIsAuthModalOpen(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // --- Save to Firestore whenever holdings or transactions change if logged in ---
  useEffect(() => {
    localStorage.setItem('arg_intel_holdings', JSON.stringify(holdings));

    if (currentUser && !isSyncingWithFirestore.current) {
      saveUserHoldings(currentUser.uid, holdings).catch(err => {
        console.warn('Error syncing holdings to cloud:', err);
      });
    }
  }, [holdings, currentUser]);

  useEffect(() => {
    localStorage.setItem('arg_intel_transactions', JSON.stringify(transactions));

    if (currentUser && !isSyncingWithFirestore.current) {
      saveUserTransactions(currentUser.uid, transactions).catch(err => {
        console.warn('Error syncing transactions to cloud:', err);
      });
    }
  }, [transactions, currentUser]);

  useEffect(() => {
    localStorage.setItem('arg_intel_market_rates', JSON.stringify(marketRates));
  }, [marketRates]);

  useEffect(() => {
    localStorage.setItem('arg_intel_news', JSON.stringify(news));
  }, [news]);

  useEffect(() => {
    localStorage.setItem('arg_intel_calendar', JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  // --- Chat State ---
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: '¡Hola! Soy tu **Asistente de Inversiones**. Tu cartera está lista para tus tenencias reales y la cotización del **Dólar MEP se obtiene en tiempo real** de forma oficial. Puedes ingresar tus activos con el botón "+ Nueva" y consultarme sobre análisis de valor razonable, eventos de mercado o estrategias de cobertura.'
    }
  ]);
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);
  const [useSearch, setUseSearch] = useState<boolean>(true);
  const [externalPrompt, setExternalPrompt] = useState<string | null>(null);

  // --- Modals & View Mode State ---
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState<boolean>(false);
  const [preselectedTicker, setPreselectedTicker] = useState<string | undefined>(undefined);
  const [selectedNewsForModal, setSelectedNewsForModal] = useState<NewsItem | null>(null);
  const [isEditMepModalOpen, setIsEditMepModalOpen] = useState<boolean>(false);
  const [isRefreshingMarket, setIsRefreshingMarket] = useState<boolean>(false);
  const [isRefreshingQuotes, setIsRefreshingQuotes] = useState<boolean>(false);
  const [lastQuotesUpdate, setLastQuotesUpdate] = useState<string>(() => {
    return localStorage.getItem('arg_intel_last_quotes_update') || '';
  });

  // --- Live Market Rates Fetcher (Dólar MEP, CCL, Oficial, Riesgo País) ---
  const fetchLiveRates = async () => {
    setIsRefreshingMarket(true);
    try {
      const res = await fetch('/api/rates/live');
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok') {
          setMarketRates(prev => ({
            ...prev,
            dollarMep: data.dollarMep,
            dollarMepCompra: data.dollarMepCompra,
            dollarCcl: data.dollarCcl,
            dollarCclCompra: data.dollarCclCompra,
            dollarOficial: data.dollarOficial,
            dollarBlue: data.dollarBlue,
            riesgoPais: data.riesgoPais,
            source: data.source,
            isLive: data.isLive,
            lastUpdated: data.lastUpdated
          }));
        }
      }
    } catch (err) {
      console.warn('Error fetching live market rates:', err);
    } finally {
      setIsRefreshingMarket(false);
    }
  };

  // --- Live Stock Exchange Batch Quotes Fetcher (BYMA / NYSE / NASDAQ) ---
  const handleRefreshQuotes = async () => {
    if (holdings.length === 0) return;
    setIsRefreshingQuotes(true);

    try {
      const tickers = Array.from(new Set(holdings.map(h => h.ticker.toUpperCase())));
      const res = await fetch('/api/quotes/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tickers,
          dollarMep: marketRates.dollarMep
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok' && data.quotes) {
          const quotesMap = data.quotes;
          setHoldings(prevHoldings => 
            prevHoldings.map(h => {
              const q = quotesMap[h.ticker.toUpperCase()];
              if (q && typeof q.price === 'number') {
                return {
                  ...h,
                  currentPrice: q.price,
                  dailyChangePct: typeof q.changePct === 'number' ? q.changePct : h.dailyChangePct
                };
              }
              return h;
            })
          );
          const nowStr = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' ART';
          setLastQuotesUpdate(nowStr);
          localStorage.setItem('arg_intel_last_quotes_update', nowStr);
        }
      }
    } catch (err) {
      console.warn('Error fetching batch quotes:', err);
    } finally {
      setIsRefreshingQuotes(false);
    }
  };

  // Automatically fetch live rates on startup and every 60 seconds
  useEffect(() => {
    fetchLiveRates();
    const interval = setInterval(fetchLiveRates, 60000);
    return () => clearInterval(interval);
  }, []);

  // Refresh holdings quotes on mount if any holdings exist
  useEffect(() => {
    if (holdings.length > 0) {
      handleRefreshQuotes();
    }
  }, []);

  const handleClearPortfolio = () => {
    setHoldings([]);
    setTransactions([]);
    localStorage.removeItem('arg_intel_holdings');
    localStorage.removeItem('arg_intel_transactions');
    if (currentUser) {
      saveUserHoldings(currentUser.uid, []).catch(console.error);
      saveUserTransactions(currentUser.uid, []).catch(console.error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setHoldings([]);
      setTransactions([]);
      setIsAuthModalOpen(true);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  // --- Portfolio Calculations ---
  const totalArs = holdings.reduce((acc, h) => {
    const val = h.currency === 'USD' 
      ? h.nominales * h.currentPrice * marketRates.dollarMep 
      : h.nominales * h.currentPrice;
    return acc + val;
  }, 0);

  const totalUsdMep = marketRates.dollarMep > 0 ? totalArs / marketRates.dollarMep : 0;

  const totalInvestedArs = holdings.reduce((acc, h) => {
    const val = h.currency === 'USD' 
      ? h.nominales * h.purchasePrice * marketRates.dollarMep 
      : h.nominales * h.purchasePrice;
    return acc + val;
  }, 0);

  const totalProfitArs = totalArs - totalInvestedArs;
  const totalProfitPct = totalInvestedArs > 0 ? (totalProfitArs / totalInvestedArs) * 100 : 0;

  // Approximate daily change
  const dailyChangeArs = holdings.reduce((acc, h) => {
    const val = h.currency === 'USD' 
      ? h.nominales * h.currentPrice * marketRates.dollarMep 
      : h.nominales * h.currentPrice;
    return acc + (val * (h.dailyChangePct / 100));
  }, 0);
  const dailyChangePct = totalArs > 0 ? (dailyChangeArs / (totalArs - dailyChangeArs)) * 100 : 0;

  // --- Chat Communication Helper ---
  const handleSendMessage = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoadingChat(true);

    // Prepare portfolio context summary
    const portfolioSummary = `
- Total Cartera: $${totalArs.toLocaleString('es-AR')} ARS (USD ${totalUsdMep.toFixed(0)} a Dólar MEP $${marketRates.dollarMep})
- Rendimiento Histórico: ${totalProfitPct.toFixed(2)}% ($${totalProfitArs.toLocaleString('es-AR')} ARS)
- Activos en Cartera:
${holdings.map(h => `  * ${h.ticker} (${h.name} - ${h.assetType}): ${h.nominales} nominales | Costo: $${h.purchasePrice} ${h.currency} | Actual: $${h.currentPrice} ${h.currency} | Rend: ${h.currency === 'USD' ? ((h.currentPrice - h.purchasePrice) / h.purchasePrice * 100).toFixed(1) : ((h.currentPrice - h.purchasePrice) / h.purchasePrice * 100).toFixed(1)}%`).join('\n')}
- Tipo de Cambio MEP: $${marketRates.dollarMep} | CCL: $${marketRates.dollarCcl} | Riesgo País: ${marketRates.riesgoPais} pts
    `.trim();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          useSearch,
          portfolioContext: portfolioSummary
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Error al comunicarse con el servidor.');
      }

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.text || 'Sin respuesta generada.'
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (err: any) {
      console.log("Chat request notice:", err?.message || err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `Error al procesar la consulta: ${err?.message || 'Error temporal de conexión'}. Por favor, vuelve a intentar.`
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'model',
        text: 'Conversación reiniciada. ¿Qué activo, noticia o evento macroeconómico te gustaría analizar hoy?'
      }
    ]);
  };

  // --- Handlers for Holdings & Transactions ---
  const handleAddTransaction = (
    txData: Omit<Transaction, 'id'>, 
    assetDetails: { name: string; assetType: AssetType }
  ) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`
    };

    setTransactions(prev => [...prev, newTx]);

    // Update holdings state
    setHoldings(prevHoldings => {
      const existingIndex = prevHoldings.findIndex(
        h => h.ticker.toUpperCase() === txData.ticker.toUpperCase()
      );

      if (existingIndex >= 0) {
        const current = prevHoldings[existingIndex];
        let updatedNominales = current.nominales;
        let updatedPurchasePrice = current.purchasePrice;

        if (txData.type === 'Compra') {
          const totalCostBefore = current.nominales * current.purchasePrice;
          const newCost = txData.nominales * txData.price;
          updatedNominales = current.nominales + txData.nominales;
          updatedPurchasePrice = updatedNominales > 0 ? (totalCostBefore + newCost) / updatedNominales : txData.price;
        } else {
          // Venta
          updatedNominales = Math.max(0, current.nominales - txData.nominales);
        }

        if (updatedNominales === 0) {
          // Remove if completely liquidated
          return prevHoldings.filter((_, i) => i !== existingIndex);
        }

        const updatedList = [...prevHoldings];
        updatedList[existingIndex] = {
          ...current,
          nominales: updatedNominales,
          purchasePrice: updatedPurchasePrice,
          currentPrice: txData.price // update with latest trade price
        };
        return updatedList;
      } else {
        // New holding
        if (txData.type === 'Compra') {
          const newHolding: Holding = {
            id: `h-${Date.now()}`,
            ticker: txData.ticker.toUpperCase(),
            name: assetDetails.name,
            assetType: assetDetails.assetType,
            nominales: txData.nominales,
            purchasePrice: txData.price,
            currentPrice: txData.price,
            currency: txData.currency,
            dailyChangePct: 0,
            notes: txData.notes
          };
          return [...prevHoldings, newHolding];
        }
        return prevHoldings;
      }
    });
  };

  const handleUpdateHolding = (updated: Holding) => {
    setHoldings(prev => prev.map(h => h.id === updated.id ? updated : h));
  };

  const handleDeleteHolding = (id: string) => {
    setHoldings(prev => prev.filter(h => h.id !== id));
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // --- Quick Ask Helpers ---
  const handleAskAboutTicker = (ticker: string) => {
    const holding = holdings.find(h => h.ticker === ticker);
    const prompt = holding
      ? `Realiza un análisis fundamental actualizado de ${ticker} (${holding.name}). Tengo ${holding.nominales} nominales comprados a $${holding.purchasePrice} ${holding.currency}. ¿Cuáles son los próximos catalizadores y cómo ves el ratio de valuación actual?`
      : `Realiza un análisis fundamental y macroeconómico sobre el ticker ${ticker}.`;
    setExternalPrompt(prompt);
  };

  const handleAskAboutNews = (item: NewsItem) => {
    const prompt = `Analiza el impacto de la siguiente noticia en mi cartera: "${item.title}". Resumen: ${item.summary}. ¿Afecta la tesis fundamental de mis activos (${item.relatedTickers.join(', ')})?`;
    setExternalPrompt(prompt);
  };

  const handleAskAboutEvent = (event: CalendarEvent) => {
    const prompt = `¿Qué expectativas de mercado y métricas clave debo monitorear para el evento: "${event.title}" programado para el día ${event.date.split('-').reverse().join('/')}?`;
    setExternalPrompt(prompt);
  };

  // --- Refresh Market Data with Web Search and Live MEP ---
  const handleRefreshMarketData = async () => {
    setIsRefreshingMarket(true);
    try {
      // 1. Always refresh live Dólar MEP, CCL and Riesgo País from API
      await fetchLiveRates();

      // 2. Refresh live stock exchange quotes for holdings
      await handleRefreshQuotes();

      // 3. Refresh news and events based on actual user tickers
      const tickers = holdings.map(h => h.ticker);
      const res = await fetch('/api/market-data/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers })
      });
      const result = await res.json();
      
      if (result?.refreshed && result.data) {
        if (result.data.news && Array.isArray(result.data.news) && result.data.news.length > 0) {
          setNews(prev => [...result.data.news, ...prev].slice(0, 10));
        }
        if (result.data.events && Array.isArray(result.data.events) && result.data.events.length > 0) {
          setCalendarEvents(prev => [...result.data.events, ...prev]);
        }
      }
    } catch (e) {
      console.warn("Market data refresh notice:", e);
    } finally {
      setIsRefreshingMarket(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#e2e8f0] flex flex-col font-sans selection:bg-[#f59e0b]/30">
      
      {/* 1. Header with Top Metrics (Total ARS, Total USD MEP, Cotización MEP) & View Selector */}
      <HeaderMetrics
        totalArs={totalArs}
        totalUsdMep={totalUsdMep}
        totalProfitArs={totalProfitArs}
        totalProfitPct={totalProfitPct}
        dailyChangeArs={dailyChangeArs}
        dailyChangePct={dailyChangePct}
        marketRates={marketRates}
        onOpenTransactionModal={() => {
          if (!currentUser) {
            setIsAuthModalOpen(true);
            return;
          }
          setPreselectedTicker(undefined);
          setIsTransactionModalOpen(true);
        }}
        onOpenEditMepModal={() => setIsEditMepModalOpen(true)}
        onRefreshMarketData={handleRefreshMarketData}
        isRefreshing={isRefreshingMarket}
        useSearch={useSearch}
        onToggleSearch={() => setUseSearch(!useSearch)}
        viewMode={viewMode}
        onSelectViewMode={setViewMode}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* 2. Main Dashboard Container - Compact 16" Notebook Optimized */}
      <main className="flex-1 max-w-[1760px] w-full mx-auto p-2.5 sm:p-3 pb-20">
        
        {/* VIEW MODE: SPLIT (Vista Dividida - Cartera a la izquierda, Noticias y Calendario a la derecha) */}
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 h-auto lg:h-[calc(100vh-185px)] min-h-0">
            
            {/* Columna Izquierda (7 de 12): Cartera Actual Valorizada */}
            <section id="cartera-section" className="lg:col-span-7 h-full flex flex-col min-h-0">
              <PortfolioSection
                holdings={holdings}
                transactions={transactions}
                dollarMep={marketRates.dollarMep}
                onOpenTransactionModal={(ticker) => {
                  if (!currentUser) {
                    setIsAuthModalOpen(true);
                    return;
                  }
                  setPreselectedTicker(ticker);
                  setIsTransactionModalOpen(true);
                }}
                onUpdateHolding={handleUpdateHolding}
                onDeleteHolding={handleDeleteHolding}
                onDeleteTransaction={handleDeleteTransaction}
                onAskAssistantAboutTicker={handleAskAboutTicker}
                onClearPortfolio={handleClearPortfolio}
                onRefreshQuotes={handleRefreshQuotes}
                isRefreshingQuotes={isRefreshingQuotes}
                lastQuotesUpdated={lastQuotesUpdate}
                isMaximized={false}
                onToggleMaximize={() => setViewMode('cartera')}
                currentUser={currentUser}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
              />
            </section>

            {/* Columna Derecha (5 de 12): Noticias (Arriba) y Calendario (Abajo) */}
            <section className="lg:col-span-5 h-full flex flex-col gap-2.5 sm:gap-3 min-h-0">
              
              {/* Cuadrante 1: Noticias e Inteligencia */}
              <div id="noticias-cuadrante" className="flex-1 min-h-0">
                <NewsSection
                  news={news}
                  onSelectNews={(item) => setSelectedNewsForModal(item)}
                  onRefreshNews={handleRefreshMarketData}
                  isRefreshing={isRefreshingMarket}
                  onAskAssistantAboutNews={handleAskAboutNews}
                  isMaximized={false}
                  onToggleMaximize={() => setViewMode('noticias')}
                />
              </div>

              {/* Cuadrante 2: Calendario Mensual y Agenda */}
              <div id="calendario-cuadrante" className="flex-1 min-h-0">
                <CalendarSection
                  events={calendarEvents}
                  onAskAssistantAboutEvent={handleAskAboutEvent}
                  isMaximized={false}
                  onToggleMaximize={() => setViewMode('calendario')}
                />
              </div>

            </section>
          </div>
        )}

        {/* VIEW MODE: SOLO CARTERA (Desplegada en pantalla completa) */}
        {viewMode === 'cartera' && (
          <div className="h-auto lg:h-[calc(100vh-185px)] min-h-0 flex flex-col">
            <PortfolioSection
              holdings={holdings}
              transactions={transactions}
              dollarMep={marketRates.dollarMep}
              onOpenTransactionModal={(ticker) => {
                if (!currentUser) {
                  setIsAuthModalOpen(true);
                  return;
                }
                setPreselectedTicker(ticker);
                setIsTransactionModalOpen(true);
              }}
              onUpdateHolding={handleUpdateHolding}
              onDeleteHolding={handleDeleteHolding}
              onDeleteTransaction={handleDeleteTransaction}
              onAskAssistantAboutTicker={handleAskAboutTicker}
              onClearPortfolio={handleClearPortfolio}
              onRefreshQuotes={handleRefreshQuotes}
              isRefreshingQuotes={isRefreshingQuotes}
              lastQuotesUpdated={lastQuotesUpdate}
              isMaximized={true}
              onToggleMaximize={() => setViewMode('split')}
              currentUser={currentUser}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          </div>
        )}

        {/* VIEW MODE: SOLO NOTICIAS (Desplegadas en pantalla completa) */}
        {viewMode === 'noticias' && (
          <div className="h-auto lg:h-[calc(100vh-185px)] min-h-0 flex flex-col">
            <NewsSection
              news={news}
              onSelectNews={(item) => setSelectedNewsForModal(item)}
              onRefreshNews={handleRefreshMarketData}
              isRefreshing={isRefreshingMarket}
              onAskAssistantAboutNews={handleAskAboutNews}
              isMaximized={true}
              onToggleMaximize={() => setViewMode('split')}
            />
          </div>
        )}

        {/* VIEW MODE: SOLO CALENDARIO (Desplegado en pantalla completa) */}
        {viewMode === 'calendario' && (
          <div className="h-auto lg:h-[calc(100vh-185px)] min-h-0 flex flex-col">
            <CalendarSection
              events={calendarEvents}
              onAskAssistantAboutEvent={handleAskAboutEvent}
              isMaximized={true}
              onToggleMaximize={() => setViewMode('split')}
            />
          </div>
        )}

      </main>

      {/* 3. Docked Chat - Fixed Bottom, Never Obstructed */}
      <DockedChat
        messages={messages}
        isLoading={isLoadingChat}
        onSendMessage={handleSendMessage}
        onClearChat={handleClearChat}
        holdings={holdings}
        marketRates={marketRates}
        useSearch={useSearch}
        onToggleSearch={() => setUseSearch(!useSearch)}
        externalPrompt={externalPrompt}
        onClearExternalPrompt={() => setExternalPrompt(null)}
      />

      {/* --- Modals --- */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onAddTransaction={handleAddTransaction}
        holdings={holdings}
        preselectedTicker={preselectedTicker}
        dollarMep={marketRates.dollarMep}
      />

      <NewsDetailModal
        newsItem={selectedNewsForModal}
        onClose={() => setSelectedNewsForModal(null)}
        onAskAssistant={handleAskAboutNews}
      />

      <EditMepModal
        isOpen={isEditMepModalOpen}
        onClose={() => setIsEditMepModalOpen(false)}
        marketRates={marketRates}
        onSaveRates={(updated) => setMarketRates(updated)}
        onRefreshLiveRates={fetchLiveRates}
      />

      {/* Google Firebase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen && !currentUser}
        onSuccess={() => setIsAuthModalOpen(false)}
      />

    </div>
  );
}
