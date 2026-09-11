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
import AddWatchlistModal from './components/AddWatchlistModal';
import WatchlistSection from './components/WatchlistSection';
import { 
  auth, 
  logout, 
  onAuthStateChanged, 
  loadUserPortfolio, 
  saveUserHoldings, 
  saveUserTransactions, 
  saveUserWatchlist,
  saveUserCalendar,
  User 
} from './lib/firebase';
import { 
  Holding, 
  Transaction, 
  WatchlistItem,
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
import { calculateHoldingValuation, fetchHistoricalMepBatch } from './lib/mepService';

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
      if (saved) {
        const parsed: NewsItem[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          return parsed.map((item, idx) => {
            let uniqueId = item.id || `news-${idx}`;
            if (seen.has(uniqueId)) {
              uniqueId = `${uniqueId}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
            }
            seen.add(uniqueId);
            return { ...item, id: uniqueId };
          });
        }
      }
      return initialNews;
    } catch {
      return initialNews;
    }
  });

  const [tickersWithoutNews, setTickersWithoutNews] = useState<string[]>([]);

  // Helper to ensure false / unconfirmed YPF Sep-08 dates are never loaded
  const isInvalidCalendarEvent = (ev: CalendarEvent) => {
    const isYpf = ev.ticker?.toUpperCase() === 'YPFD' || ev.ticker?.toUpperCase() === 'YPF' || ev.title.toUpperCase().includes('YPF');
    const isSep08 = ev.date === '2026-09-08' || ev.date.endsWith('-09-08');
    const isQ3InSep = (ev.title.includes('Q3') || ev.title.includes('Trimestral') || ev.title.includes('EARNINGS')) && ev.date.includes('-09-');
    return isYpf && (isSep08 || isQ3InSep);
  };

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('arg_intel_calendar');
      if (saved) {
        const parsed: CalendarEvent[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          // Purge any invalid legacy event
          const cleaned = parsed.filter(ev => !isInvalidCalendarEvent(ev));
          return cleaned.map((ev, idx) => {
            let uniqueId = ev.id || `ev-${idx}`;
            if (seen.has(uniqueId)) {
              uniqueId = `${uniqueId}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
            }
            seen.add(uniqueId);
            return { ...ev, id: uniqueId };
          });
        }
      }
      return initialCalendarEvents.filter(ev => !isInvalidCalendarEvent(ev));
    } catch {
      return initialCalendarEvents;
    }
  });

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const saved = localStorage.getItem('arg_intel_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
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
          const { 
            holdings: remoteHoldings, 
            transactions: remoteTransactions, 
            watchlist: remoteWatchlist, 
            calendar: remoteCalendar, 
            isNewUser 
          } = await loadUserPortfolio(user.uid);
          
          if (!isNewUser) {
            setHoldings(remoteHoldings);
            setTransactions(remoteTransactions);
            setWatchlist(remoteWatchlist || []);
            if (Array.isArray(remoteCalendar) && remoteCalendar.length > 0) {
              const cleanedCalendar = remoteCalendar.filter(ev => !isInvalidCalendarEvent(ev));
              setCalendarEvents(cleanedCalendar);
            }
          } else {
            // If new user in cloud, check if they have local holdings to migrate
            const savedHoldings = localStorage.getItem('arg_intel_holdings');
            const parsedHoldings: Holding[] = savedHoldings ? JSON.parse(savedHoldings) : [];
            const savedTxs = localStorage.getItem('arg_intel_transactions');
            const parsedTxs: Transaction[] = savedTxs ? JSON.parse(savedTxs) : [];
            const savedWatchlist = localStorage.getItem('arg_intel_watchlist');
            const parsedWatchlist: WatchlistItem[] = savedWatchlist ? JSON.parse(savedWatchlist) : [];
            const savedCalendar = localStorage.getItem('arg_intel_calendar');
            const parsedCalendar: CalendarEvent[] = savedCalendar ? JSON.parse(savedCalendar) : [];

            if (parsedHoldings.length > 0 || parsedTxs.length > 0 || parsedWatchlist.length > 0 || parsedCalendar.length > 0) {
              await saveUserHoldings(user.uid, parsedHoldings);
              await saveUserTransactions(user.uid, parsedTxs);
              await saveUserWatchlist(user.uid, parsedWatchlist);
              if (parsedCalendar.length > 0) {
                const cleanedCalendar = parsedCalendar.filter(ev => !isInvalidCalendarEvent(ev));
                await saveUserCalendar(user.uid, cleanedCalendar);
                setCalendarEvents(cleanedCalendar);
              }
              setHoldings(parsedHoldings);
              setTransactions(parsedTxs);
              setWatchlist(parsedWatchlist);
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

  // --- Save to Firestore whenever holdings, transactions or watchlist change if logged in ---
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
    localStorage.setItem('arg_intel_watchlist', JSON.stringify(watchlist));

    if (currentUser && !isSyncingWithFirestore.current) {
      saveUserWatchlist(currentUser.uid, watchlist).catch(err => {
        console.warn('Error syncing watchlist to cloud:', err);
      });
    }
  }, [watchlist, currentUser]);

  useEffect(() => {
    localStorage.setItem('arg_intel_calendar', JSON.stringify(calendarEvents));

    if (currentUser && !isSyncingWithFirestore.current) {
      saveUserCalendar(currentUser.uid, calendarEvents).catch(err => {
        console.warn('Error syncing calendar to cloud:', err);
      });
    }
  }, [calendarEvents, currentUser]);

  useEffect(() => {
    localStorage.setItem('arg_intel_market_rates', JSON.stringify(marketRates));
  }, [marketRates]);

  useEffect(() => {
    localStorage.setItem('arg_intel_news', JSON.stringify(news));
  }, [news]);

  useEffect(() => {
    localStorage.setItem('arg_intel_calendar', JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  // --- Auto-Sync Historical Dólar MEP from Ámbito for all Transactions & Holdings ---
  useEffect(() => {
    const datesToFetch = new Set<string>();

    // 1. Collect dates from transactions that lack mepRate or have invalid/zero rate
    transactions.forEach(t => {
      const dateKey = t.date ? t.date.split('T')[0] : '';
      if (dateKey && (!t.mepRate || t.mepRate <= 0)) {
        datesToFetch.add(dateKey);
      }
    });

    // 2. Collect dates from holdings that have a purchaseDate but lack purchaseMepRate
    holdings.forEach(h => {
      const dateKey = h.purchaseDate ? h.purchaseDate.split('T')[0] : '';
      if (dateKey && (!h.purchaseMepRate || h.purchaseMepRate <= 0)) {
        datesToFetch.add(dateKey);
      }
    });

    if (datesToFetch.size === 0) return;

    let isMounted = true;
    const dateList = Array.from(datesToFetch);

    fetchHistoricalMepBatch(dateList).then(ratesMap => {
      if (!isMounted || !ratesMap || Object.keys(ratesMap).length === 0) return;

      // Update transactions with verified historical MEP
      setTransactions(prevTxs => {
        let hasChanges = false;
        const updated = prevTxs.map(t => {
          const dateKey = t.date ? t.date.split('T')[0] : '';
          const info = ratesMap[dateKey];
          if (info && info.mep > 0 && (!t.mepRate || t.mepRate <= 0)) {
            hasChanges = true;
            return {
              ...t,
              mepRate: info.mep,
              sourceMep: info.source || 'Ámbito Financiero (dolar-mep-historico)'
            };
          }
          return t;
        });
        return hasChanges ? updated : prevTxs;
      });

      // Update holdings with verified purchaseMepRate & purchasePriceUsd
      setHoldings(prevHoldings => {
        let hasChanges = false;
        const updated = prevHoldings.map(h => {
          const dateKey = h.purchaseDate ? h.purchaseDate.split('T')[0] : '';
          const info = dateKey ? ratesMap[dateKey] : null;
          if (info && info.mep > 0 && (!h.purchaseMepRate || h.purchaseMepRate <= 0)) {
            hasChanges = true;
            const pUsd = h.currency === 'USD' ? h.purchasePrice : (h.purchasePrice / info.mep);
            return {
              ...h,
              purchaseMepRate: info.mep,
              purchasePriceUsd: pUsd
            };
          }
          return h;
        });
        return hasChanges ? updated : prevHoldings;
      });
    }).catch(err => {
      console.warn('Error fetching historical MEP batch in App:', err);
    });

    return () => {
      isMounted = false;
    };
  }, [transactions, holdings]);

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
  const [currencyDisplay, setCurrencyDisplay] = useState<'ARS' | 'USD'>(() => {
    const saved = localStorage.getItem('arg_intel_currency_display');
    return saved === 'USD' ? 'USD' : 'ARS';
  });

  useEffect(() => {
    localStorage.setItem('arg_intel_currency_display', currencyDisplay);
  }, [currencyDisplay]);

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState<boolean>(false);
  const [isAddWatchlistModalOpen, setIsAddWatchlistModalOpen] = useState<boolean>(false);
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
            yesterdayDollarMep: data.yesterdayDollarMep || data.dollarMep,
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
    const allTickers = Array.from(new Set([
      ...holdings.map(h => h.ticker.toUpperCase()),
      ...watchlist.map(w => w.ticker.toUpperCase())
    ]));

    if (allTickers.length === 0) return;
    setIsRefreshingQuotes(true);

    try {
      const res = await fetch('/api/quotes/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tickers: allTickers,
          dollarMep: marketRates.dollarMep
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok' && data.quotes) {
          const quotesMap = data.quotes;
          
          // Update holdings prices
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

          // Update watchlist prices
          setWatchlist(prevWatchlist =>
            prevWatchlist.map(w => {
              const q = quotesMap[w.ticker.toUpperCase()];
              if (q && typeof q.price === 'number') {
                return {
                  ...w,
                  currentPrice: q.price,
                  dailyChangePct: typeof q.changePct === 'number' ? q.changePct : w.dailyChangePct
                };
              }
              return w;
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

  // Refresh holdings and watchlist quotes on mount if any tickers exist
  useEffect(() => {
    if (holdings.length > 0 || watchlist.length > 0) {
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
  // Se utiliza la función oficial calculateHoldingValuation que computa cada activo
  // con su Dólar MEP histórico a la fecha de compra registrada (fuente Ámbito)
  const holdingsValuations = holdings.map(h => 
    calculateHoldingValuation(h, transactions, marketRates.dollarMep, marketRates.yesterdayDollarMep)
  );

  const totalArs = holdingsValuations.reduce((acc, v) => acc + v.valueArs, 0);
  const totalUsdMep = holdingsValuations.reduce((acc, v) => acc + v.valueUsd, 0);
  const totalInvestedArs = holdingsValuations.reduce((acc, v) => acc + v.investedArs, 0);
  const totalInvestedUsd = holdingsValuations.reduce((acc, v) => acc + v.investedUsd, 0);

  const totalProfitArs = totalArs - totalInvestedArs;
  const totalProfitPct = totalInvestedArs > 0 ? (totalProfitArs / totalInvestedArs) * 100 : 0;

  const totalProfitUsd = totalUsdMep - totalInvestedUsd;
  const totalProfitPctUsd = totalInvestedUsd > 0 ? (totalProfitUsd / totalInvestedUsd) * 100 : 0;

  const dailyChangeArs = holdingsValuations.reduce((acc, v) => acc + v.dailyChangeArs, 0);
  const dailyChangeUsd = holdingsValuations.reduce((acc, v) => acc + v.dailyChangeUsd, 0);

  const previousTotalArs = totalArs - dailyChangeArs;
  const dailyChangePct = previousTotalArs > 0 ? (dailyChangeArs / previousTotalArs) * 100 : 0;

  const previousTotalUsd = totalUsdMep - dailyChangeUsd;
  const dailyChangePctUsd = previousTotalUsd > 0 ? (dailyChangeUsd / previousTotalUsd) * 100 : 0;

  // --- Calendar Management Handlers ---
  const executeCalendarAction = (action: {
    summary?: string;
    removeEventIds?: string[];
    removeFilters?: Array<{ ticker?: string; date?: string; keywords?: string[] }>;
    eventsToAdd?: CalendarEvent[];
  }) => {
    setCalendarEvents(prev => {
      let updated = [...prev];

      // 1. Remove by IDs
      if (Array.isArray(action.removeEventIds) && action.removeEventIds.length > 0) {
        const removeSet = new Set(action.removeEventIds);
        updated = updated.filter(ev => !removeSet.has(ev.id));
      }

      // 2. Remove by filters
      if (Array.isArray(action.removeFilters) && action.removeFilters.length > 0) {
        updated = updated.filter(ev => {
          for (const f of action.removeFilters!) {
            const matchTicker = !f.ticker || ev.ticker?.toUpperCase() === f.ticker.toUpperCase();
            const matchDate = !f.date || ev.date === f.date;
            let matchKeywords = true;
            if (f.keywords && f.keywords.length > 0) {
              matchKeywords = f.keywords.some(kw => 
                ev.title.toLowerCase().includes(kw.toLowerCase()) || 
                ev.description.toLowerCase().includes(kw.toLowerCase())
              );
            }
            if (matchTicker && matchDate && matchKeywords) {
              return false; // remove
            }
          }
          return true;
        });
      }

      // Always filter out any invalid / unconfirmed events
      updated = updated.filter(ev => !isInvalidCalendarEvent(ev));

      // 3. Add new events
      if (Array.isArray(action.eventsToAdd) && action.eventsToAdd.length > 0) {
        for (const newEv of action.eventsToAdd) {
          const exists = updated.some(
            e => e.id === newEv.id || (e.date === newEv.date && e.ticker === newEv.ticker && e.title === newEv.title)
          );
          if (!exists && !isInvalidCalendarEvent(newEv)) {
            updated.push({
              ...newEv,
              id: newEv.id || `ev-synced-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
            });
          }
        }
      }

      // Sort by date ascending
      updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      localStorage.setItem('arg_intel_calendar', JSON.stringify(updated));
      if (currentUser) {
        saveUserCalendar(currentUser.uid, updated).catch(console.error);
      }

      return updated;
    });
  };

  const handleDeleteCalendarEvent = (eventId: string) => {
    setCalendarEvents(prev => {
      const updated = prev.filter(e => e.id !== eventId);
      localStorage.setItem('arg_intel_calendar', JSON.stringify(updated));
      if (currentUser) {
        saveUserCalendar(currentUser.uid, updated).catch(console.error);
      }
      return updated;
    });
  };

  const handleAddCalendarEvent = (newEvent: Omit<CalendarEvent, 'id'>) => {
    const event: CalendarEvent = {
      ...newEvent,
      id: `ev-manual-${Date.now()}`
    };
    setCalendarEvents(prev => {
      const updated = [...prev, event].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      localStorage.setItem('arg_intel_calendar', JSON.stringify(updated));
      if (currentUser) {
        saveUserCalendar(currentUser.uid, updated).catch(console.error);
      }
      return updated;
    });
  };

  const handleSyncOfficialCalendar = () => {
    handleSendMessage("Por favor verifica y actualiza el calendario de inversiones con las fechas oficiales confirmadas del INDEC, BCRA, MECON y balances de mis activos. Si existe algún evento con fecha incorrecta o no confirmada (como el Q3 de YPF en septiembre), elimínalo de inmediato.");
  };

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

    // Prepare calendar summary
    const calendarSummary = calendarEvents
      .map(e => `[ID: ${e.id}] Fecha: ${e.date} | Ticker: ${e.ticker || 'Macro'} | Título: ${e.title} (${e.type})`)
      .join('\n');

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 35000);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          message: text,
          useSearch,
          portfolioContext: portfolioSummary,
          calendarContext: calendarSummary,
          userDate: new Date().toISOString()
        })
      });

      clearTimeout(timeoutId);

      let data: any = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        // If the server served an HTML document (such as during dev server reload or gateway fallback), reject it cleanly
        if (rawText.trim().startsWith('<!doctype') || rawText.trim().startsWith('<html') || contentType.includes('text/html')) {
          throw new Error("El servidor de la aplicación se estaba actualizando o la conexión se reinició. Por favor, reintenta enviar tu consulta.");
        }
        if (!res.ok) {
          throw new Error(`El servidor tardó en responder (${res.status}). Por favor reintenta la consulta.`);
        }
        data = { text: rawText };
      }

      if (typeof data?.text === 'string' && (data.text.trim().startsWith('<!doctype') || data.text.trim().startsWith('<html'))) {
        throw new Error("El servidor devolvió una página HTML en lugar de una respuesta analítica. Por favor reintenta tu consulta.");
      }

      if (!res.ok) {
        throw new Error(data?.error || `Error del servidor (${res.status}).`);
      }

      // Check if calendarAction was returned by the assistant
      if (data.calendarAction) {
        executeCalendarAction(data.calendarAction);
      } else if (data.text) {
        const actionMatch = data.text.match(/```(?:calendar-action|json)?\s*(\{[\s\S]*?"(?:removeEventIds|removeFilters|eventsToAdd)"[\s\S]*?\})\s*```/);
        if (actionMatch) {
          try {
            const parsed = JSON.parse(actionMatch[1]);
            executeCalendarAction(parsed);
          } catch (e) {
            console.warn("Could not parse calendarAction JSON:", e);
          }
        }
      }

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.text || 'Sin respuesta generada.'
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isAbort = err?.name === 'AbortError';
      const errorText = isAbort 
        ? 'La consulta demoró más de 35 segundos. El servidor sigue procesando; por favor reintenta tu mensaje ahora.'
        : `Error al procesar la consulta: ${err?.message || 'Error temporal de conexión'}. Por favor, vuelve a intentar.`;
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: errorText
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
        let updatedPurchasePriceUsd = current.purchasePriceUsd;
        let updatedPurchaseMepRate = current.purchaseMepRate;

        if (txData.type === 'Compra') {
          const totalCostBefore = current.nominales * current.purchasePrice;
          const newCost = txData.nominales * txData.price;
          updatedNominales = current.nominales + txData.nominales;
          updatedPurchasePrice = updatedNominales > 0 ? (totalCostBefore + newCost) / updatedNominales : txData.price;

          const txMep = (txData.mepRate && txData.mepRate > 0) ? txData.mepRate : marketRates.dollarMep;
          const prevMep = current.purchaseMepRate && current.purchaseMepRate > 0 ? current.purchaseMepRate : txMep;
          const prevCostUsd = (current.purchasePriceUsd && current.purchasePriceUsd > 0)
            ? current.nominales * current.purchasePriceUsd
            : (current.currency === 'USD' ? current.nominales * current.purchasePrice : (totalCostBefore / prevMep));
          const newCostUsd = txData.currency === 'USD' ? (txData.nominales * txData.price) : (newCost / txMep);

          updatedPurchasePriceUsd = updatedNominales > 0 ? (prevCostUsd + newCostUsd) / updatedNominales : (txData.currency === 'USD' ? txData.price : txData.price / txMep);
          updatedPurchaseMepRate = updatedPurchasePriceUsd > 0 ? (updatedPurchasePrice / updatedPurchasePriceUsd) : txMep;
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
          currentPrice: txData.price, // update with latest trade price
          purchaseDate: current.purchaseDate || txData.date,
          purchaseMepRate: updatedPurchaseMepRate,
          purchasePriceUsd: updatedPurchasePriceUsd
        };
        return updatedList;
      } else {
        // New holding
        if (txData.type === 'Compra') {
          const txMep = (txData.mepRate && txData.mepRate > 0) ? txData.mepRate : marketRates.dollarMep;
          const pUsd = txData.currency === 'USD' ? txData.price : (txData.price / txMep);
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
            purchaseDate: txData.date,
            purchaseMepRate: txMep,
            purchasePriceUsd: pUsd,
            ...(txData.notes ? { notes: txData.notes } : {})
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

  // --- Watchlist Handlers ---
  const handleAddToWatchlist = (itemData: Omit<WatchlistItem, 'id' | 'addedAt'>) => {
    const newItem: WatchlistItem = {
      ...itemData,
      id: `w-${Date.now()}`,
      addedAt: new Date().toISOString()
    };
    if (!newItem.notes) {
      delete newItem.notes;
    }
    setWatchlist(prev => {
      // If already exists, replace or ignore
      if (prev.some(w => w.ticker.toUpperCase() === newItem.ticker.toUpperCase())) {
        return prev.map(w => w.ticker.toUpperCase() === newItem.ticker.toUpperCase() ? { ...w, ...newItem } : w);
      }
      return [...prev, newItem];
    });

    // Trigger immediate quote fetch for newly added ticker if not present
    setTimeout(() => {
      handleRefreshQuotes();
    }, 100);
  };

  const handleDeleteWatchlist = (id: string) => {
    setWatchlist(prev => prev.filter(w => w.id !== id));
  };

  // --- Quick Ask Helpers ---
  const handleAskAboutTicker = (ticker: string) => {
    const holding = holdings.find(h => h.ticker.toUpperCase() === ticker.toUpperCase());
    const watchItem = watchlist.find(w => w.ticker.toUpperCase() === ticker.toUpperCase());
    
    let prompt = '';
    if (holding) {
      prompt = `Realiza un análisis fundamental actualizado de ${ticker} (${holding.name}). Tengo ${holding.nominales} nominales comprados a $${holding.purchasePrice} ${holding.currency}. ¿Cuáles son los próximos catalizadores y cómo ves el ratio de valuación actual?`;
    } else if (watchItem) {
      prompt = `Realiza un análisis fundamental y técnico sobre la empresa ${ticker} (${watchItem.name}). Cotiza a $${watchItem.currentPrice.toLocaleString('es-AR')} ${watchItem.currency} (${watchItem.dailyChangePct >= 0 ? '+' : ''}${watchItem.dailyChangePct}% hoy). ¿Qué catalizadores, riesgos y precio objetivo sugerido tiene?`;
    } else {
      prompt = `Realiza un análisis fundamental y macroeconómico sobre el ticker ${ticker}.`;
    }
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

      // 2. Refresh live stock exchange quotes for holdings & watchlist
      await handleRefreshQuotes();

      // 3. Refresh news and events based on actual user tickers (holdings + watchlist)
      const tickers = Array.from(new Set([
        ...holdings.map(h => h.ticker),
        ...watchlist.map(w => w.ticker)
      ]));

      const res = await fetch('/api/market-data/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers })
      });
      const result = await res.json();
      
      if (result?.refreshed && result.data) {
        if (result.data.tickersWithoutNews && Array.isArray(result.data.tickersWithoutNews)) {
          setTickersWithoutNews(result.data.tickersWithoutNews);
        }
        if (result.data.news && Array.isArray(result.data.news) && result.data.news.length > 0) {
          setNews(prev => {
            const combined = [...result.data.news, ...prev];
            const seenIds = new Set<string>();
            const seenTitles = new Set<string>();
            const uniqueList: NewsItem[] = [];

            for (let i = 0; i < combined.length; i++) {
              const item = combined[i];
              const titleKey = item.title ? item.title.trim().toLowerCase() : '';
              if (titleKey && seenTitles.has(titleKey)) {
                continue; // Skip duplicate news article
              }
              if (titleKey) seenTitles.add(titleKey);

              let uniqueId = item.id || `news-${Date.now()}-${i}`;
              if (seenIds.has(uniqueId)) {
                uniqueId = `${uniqueId}-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;
              }
              seenIds.add(uniqueId);
              uniqueList.push({ ...item, id: uniqueId });
            }
            return uniqueList.slice(0, 15);
          });
        }
        if (result.data.events && Array.isArray(result.data.events) && result.data.events.length > 0) {
          setCalendarEvents(prev => {
            const combined = [...result.data.events, ...prev].filter(ev => !isInvalidCalendarEvent(ev));
            const seenIds = new Set<string>();
            const uniqueList: CalendarEvent[] = [];

            for (let i = 0; i < combined.length; i++) {
              const ev = combined[i];
              let uniqueId = ev.id || `ev-${Date.now()}-${i}`;
              if (seenIds.has(uniqueId)) {
                uniqueId = `${uniqueId}-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;
              }
              seenIds.add(uniqueId);
              uniqueList.push({ ...ev, id: uniqueId });
            }
            return uniqueList;
          });
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
        totalProfitUsd={totalProfitUsd}
        totalProfitPctUsd={totalProfitPctUsd}
        dailyChangeArs={dailyChangeArs}
        dailyChangePct={dailyChangePct}
        dailyChangeUsd={dailyChangeUsd}
        dailyChangePctUsd={dailyChangePctUsd}
        currencyDisplay={currencyDisplay}
        onSelectCurrencyDisplay={setCurrencyDisplay}
        marketRates={marketRates}
        watchlistCount={watchlist.length}
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 h-auto lg:h-[calc(100vh-185px)] lg:min-h-[640px] min-h-0">
            
            {/* Columna Izquierda (7 de 12): Cartera Actual Valorizada */}
            <section id="cartera-section" className="lg:col-span-7 h-full flex flex-col min-h-0">
              <PortfolioSection
                holdings={holdings}
                transactions={transactions}
                watchlist={watchlist}
                dollarMep={marketRates.dollarMep}
                yesterdayDollarMep={marketRates.yesterdayDollarMep}
                currencyDisplay={currencyDisplay}
                onToggleCurrency={setCurrencyDisplay}
                onOpenTransactionModal={(ticker) => {
                  if (!currentUser) {
                    setIsAuthModalOpen(true);
                    return;
                  }
                  setPreselectedTicker(ticker);
                  setIsTransactionModalOpen(true);
                }}
                onOpenAddWatchlistModal={() => {
                  if (!currentUser) {
                    setIsAuthModalOpen(true);
                    return;
                  }
                  setIsAddWatchlistModalOpen(true);
                }}
                onUpdateHolding={handleUpdateHolding}
                onDeleteHolding={handleDeleteHolding}
                onDeleteTransaction={handleDeleteTransaction}
                onDeleteWatchlist={handleDeleteWatchlist}
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
              <div id="noticias-cuadrante" className="flex-[4.5] min-h-0">
                <NewsSection
                  news={news}
                  onSelectNews={(item) => setSelectedNewsForModal(item)}
                  onRefreshNews={handleRefreshMarketData}
                  isRefreshing={isRefreshingMarket}
                  onAskAssistantAboutNews={handleAskAboutNews}
                  isMaximized={false}
                  onToggleMaximize={() => setViewMode('noticias')}
                  portfolioTickers={holdings.map(h => h.ticker)}
                  tickersWithoutNews={tickersWithoutNews}
                />
              </div>

              {/* Cuadrante 2: Calendario Mensual y Agenda */}
              <div id="calendario-cuadrante" className="flex-[5.5] min-h-0">
                <CalendarSection
                  events={calendarEvents}
                  onAskAssistantAboutEvent={handleAskAboutEvent}
                  onDeleteEvent={handleDeleteCalendarEvent}
                  onAddEvent={handleAddCalendarEvent}
                  onSyncOfficialCalendar={handleSyncOfficialCalendar}
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
              watchlist={watchlist}
              dollarMep={marketRates.dollarMep}
              yesterdayDollarMep={marketRates.yesterdayDollarMep}
              currencyDisplay={currencyDisplay}
              onToggleCurrency={setCurrencyDisplay}
              onOpenTransactionModal={(ticker) => {
                if (!currentUser) {
                  setIsAuthModalOpen(true);
                  return;
                }
                setPreselectedTicker(ticker);
                setIsTransactionModalOpen(true);
              }}
              onOpenAddWatchlistModal={() => {
                if (!currentUser) {
                  setIsAuthModalOpen(true);
                  return;
                }
                setIsAddWatchlistModalOpen(true);
              }}
              onUpdateHolding={handleUpdateHolding}
              onDeleteHolding={handleDeleteHolding}
              onDeleteTransaction={handleDeleteTransaction}
              onDeleteWatchlist={handleDeleteWatchlist}
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

        {/* VIEW MODE: SOLO SEGUIMIENTO (Watchlist en pantalla completa) */}
        {viewMode === 'watchlist' && (
          <div className="h-auto lg:h-[calc(100vh-185px)] min-h-0 flex flex-col">
            <WatchlistSection
              watchlist={watchlist}
              onOpenAddWatchlistModal={() => {
                if (!currentUser) {
                  setIsAuthModalOpen(true);
                  return;
                }
                setIsAddWatchlistModalOpen(true);
              }}
              onDeleteWatchlist={handleDeleteWatchlist}
              onAskAssistantAboutTicker={handleAskAboutTicker}
              onRefreshQuotes={handleRefreshQuotes}
              isRefreshingQuotes={isRefreshingQuotes}
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
              portfolioTickers={holdings.map(h => h.ticker)}
              tickersWithoutNews={tickersWithoutNews}
            />
          </div>
        )}

        {/* VIEW MODE: SOLO CALENDARIO (Desplegado en pantalla completa) */}
        {viewMode === 'calendario' && (
          <div className="h-auto lg:h-[calc(100vh-185px)] min-h-0 flex flex-col">
            <CalendarSection
              events={calendarEvents}
              onAskAssistantAboutEvent={handleAskAboutEvent}
              onDeleteEvent={handleDeleteCalendarEvent}
              onAddEvent={handleAddCalendarEvent}
              onSyncOfficialCalendar={handleSyncOfficialCalendar}
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

      <AddWatchlistModal
        isOpen={isAddWatchlistModalOpen}
        onClose={() => setIsAddWatchlistModalOpen(false)}
        onAddWatchlist={handleAddToWatchlist}
        existingTickers={[
          ...holdings.map(h => h.ticker.toUpperCase()),
          ...watchlist.map(w => w.ticker.toUpperCase())
        ]}
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
