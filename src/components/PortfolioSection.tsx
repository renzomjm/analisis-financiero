import { useState } from 'react';
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
  ChevronUp
} from 'lucide-react';
import { Holding, Transaction } from '../types';

interface PortfolioSectionProps {
  holdings: Holding[];
  transactions: Transaction[];
  dollarMep: number;
  onOpenTransactionModal: (preselectedTicker?: string) => void;
  onUpdateHolding: (updated: Holding) => void;
  onDeleteHolding: (id: string) => void;
  onDeleteTransaction: (id: string) => void;
  onAskAssistantAboutTicker: (ticker: string) => void;
  onClearPortfolio?: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export default function PortfolioSection({
  holdings,
  transactions,
  dollarMep,
  onOpenTransactionModal,
  onUpdateHolding,
  onDeleteHolding,
  onDeleteTransaction,
  onAskAssistantAboutTicker,
  onClearPortfolio,
  isMaximized = false,
  onToggleMaximize
}: PortfolioSectionProps) {
  const [activeTab, setActiveTab] = useState<'tenencias' | 'operaciones'>('tenencias');
  const [editingHoldingId, setEditingHoldingId] = useState<string | null>(null);
  const [editNominales, setEditNominales] = useState<number>(0);
  const [editCurrentPrice, setEditCurrentPrice] = useState<number>(0);
  const [editPurchasePrice, setEditPurchasePrice] = useState<number>(0);

  // Calculate total portfolio value in ARS for weights
  const totalPortfolioArs = holdings.reduce((acc, h) => {
    const val = h.currency === 'USD' 
      ? h.nominales * h.currentPrice * dollarMep 
      : h.nominales * h.currentPrice;
    return acc + val;
  }, 0);

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

  const formatCurrency = (val: number, curr: 'ARS' | 'USD' = 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: curr === 'USD' ? 2 : 0
    }).format(val);
  };

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
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              Mi Cartera
              <span className="text-[11px] font-mono text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/30 px-1.5 rounded">
                {holdings.length} activos
              </span>
            </h2>
          </div>
        </div>

        {/* Tab selector and quick action */}
        <div className="flex items-center gap-1.5">
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
                Cartera limpia y lista para tus datos reales
              </h3>
              <p className="text-xs text-[#a1a1aa] max-w-md mb-4 leading-relaxed">
                Se han eliminado todos los datos aleatorios de prueba. Registra tus tenencias reales (acciones locales, CEDEARs, bonos o letras) para ver su valorización en pesos y en Dólar MEP oficial en tiempo real.
              </p>
              <button
                type="button"
                onClick={() => onOpenTransactionModal()}
                className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b] hover:bg-[#d97706] text-[#09090b] font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Mi Primera Tenencia / Operación</span>
              </button>
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
              {/* Compact visual allocation bar */}
              <div className="mb-2">
                <div className="flex justify-between items-center text-[10px] text-[#71717a] mb-1">
                  <span>Distribución y Ponderación</span>
                  <div className="flex items-center gap-2">
                    {holdings.slice(0, 4).map((h) => {
                      const val = h.currency === 'USD' 
                        ? h.nominales * h.currentPrice * dollarMep 
                        : h.nominales * h.currentPrice;
                      const weightPct = totalPortfolioArs > 0 ? (val / totalPortfolioArs) * 100 : 0;
                      return (
                        <span key={h.id} className="font-mono text-[#a1a1aa]">
                          <strong className="text-white">${h.ticker}</strong> {weightPct.toFixed(0)}%
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="h-1.5 w-full bg-[#18181b] rounded-full overflow-hidden flex border border-[#27272a]">
                  {holdings.map((h, i) => {
                    const val = h.currency === 'USD' 
                      ? h.nominales * h.currentPrice * dollarMep 
                      : h.nominales * h.currentPrice;
                    const weightPct = totalPortfolioArs > 0 ? (val / totalPortfolioArs) * 100 : 0;
                    const colors = [
                      'bg-[#f59e0b]', // YPF
                      'bg-emerald-500', // VIST
                      'bg-sky-500', // AL30
                      'bg-indigo-500', // AAPL
                      'bg-amber-300', // GGAL
                      'bg-rose-500',
                      'bg-teal-400'
                    ];
                    return (
                      <div
                        key={h.id}
                        style={{ width: `${weightPct}%` }}
                        className={`${colors[i % colors.length]} h-full transition-all`}
                        title={`${h.ticker}: ${weightPct.toFixed(1)}%`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Holdings table with inner vertical scroll and fixed header */}
              <div className={`overflow-x-auto rounded-lg border border-[#27272a] bg-[#18181b]/50 ${
                isMaximized ? 'flex-1 overflow-y-auto max-h-[calc(100vh-210px)]' : 'overflow-y-auto max-h-[360px] xl:max-h-[calc(100vh-250px)]'
              }`}>
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-[#18181b] border-b border-[#27272a]">
                    <tr className="text-[#71717a] uppercase text-[9px] tracking-wider font-semibold">
                      <th className="py-2 px-2.5">Activo</th>
                      <th className="py-2 px-2 text-right">Nominales</th>
                      <th className="py-2 px-2 text-right">P. Compra</th>
                      <th className="py-2 px-2 text-right">P. Actual</th>
                      <th className="py-2 px-2 text-right">Valuación (ARS)</th>
                      <th className="py-2 px-2 text-right">Val. (MEP)</th>
                      <th className="py-2 px-2 text-right">Rend.</th>
                      <th className="py-2 px-2 text-center">Peso</th>
                      <th className="py-2 px-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a]/60">
                    {holdings.map((h) => {
                    const isEditing = editingHoldingId === h.id;
                    const valueArs = h.currency === 'USD' 
                      ? h.nominales * h.currentPrice * dollarMep 
                      : h.nominales * h.currentPrice;
                    const valueUsd = valueArs / dollarMep;
                    const investedArs = h.currency === 'USD'
                      ? h.nominales * h.purchasePrice * dollarMep
                      : h.nominales * h.purchasePrice;
                    const profitArs = valueArs - investedArs;
                    const profitPct = investedArs > 0 ? (profitArs / investedArs) * 100 : 0;
                    const weightPct = totalPortfolioArs > 0 ? (valueArs / totalPortfolioArs) * 100 : 0;
                    const isPositive = profitArs >= 0;

                    return (
                      <tr 
                        key={h.id} 
                        className="hover:bg-[#27272a]/40 transition-colors group"
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
                              {h.assetType.split(' ')[0]}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#71717a] truncate max-w-[120px]">
                            {h.name}
                          </div>
                        </td>

                        {/* Nominales */}
                        <td className="py-2 px-2 text-right font-mono">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editNominales}
                              onChange={(e) => setEditNominales(parseFloat(e.target.value) || 0)}
                              className="w-16 px-1 py-0.5 bg-[#121214] border border-[#f59e0b] rounded text-white text-right text-xs"
                            />
                          ) : (
                            <span className="font-semibold text-[#e2e8f0]">
                              {h.nominales.toLocaleString('es-AR')}
                            </span>
                          )}
                        </td>

                        {/* Purchase Price */}
                        <td className="py-2 px-2 text-right font-mono text-[#a1a1aa] text-[11px]">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editPurchasePrice}
                              onChange={(e) => setEditPurchasePrice(parseFloat(e.target.value) || 0)}
                              className="w-20 px-1 py-0.5 bg-[#121214] border border-[#f59e0b] rounded text-white text-right text-xs"
                            />
                          ) : (
                            formatCurrency(h.purchasePrice, h.currency)
                          )}
                        </td>

                        {/* Current Price */}
                        <td className="py-2 px-2 text-right font-mono text-white font-semibold text-[11px]">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editCurrentPrice}
                              onChange={(e) => setEditCurrentPrice(parseFloat(e.target.value) || 0)}
                              className="w-20 px-1 py-0.5 bg-[#121214] border border-[#f59e0b] rounded text-white text-right text-xs"
                            />
                          ) : (
                            <div>
                              <div>{formatCurrency(h.currentPrice, h.currency)}</div>
                              <div className={`text-[9px] flex items-center justify-end ${h.dailyChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {h.dailyChangePct >= 0 ? '+' : ''}{h.dailyChangePct.toFixed(1)}%
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Value ARS */}
                        <td className="py-2 px-2 text-right font-mono font-semibold text-white text-xs">
                          {formatCurrency(valueArs, 'ARS')}
                        </td>

                        {/* Value USD MEP */}
                        <td className="py-2 px-2 text-right font-mono text-emerald-400 text-xs">
                          {formatCurrency(valueUsd, 'USD')}
                        </td>

                        {/* Profit / Loss */}
                        <td className="py-2 px-2 text-right font-mono">
                          <div className={`font-semibold text-xs ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? '+' : ''}{profitPct.toFixed(1)}%
                          </div>
                          <div className="text-[9px] text-[#71717a]">
                            {isPositive ? '+' : ''}{formatCurrency(profitArs, 'ARS')}
                          </div>
                        </td>

                        {/* Weight */}
                        <td className="py-2 px-2 text-center font-mono text-[#a1a1aa] text-[11px]">
                          {weightPct.toFixed(1)}%
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-2 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => saveEdit(h)}
                                className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                title="Guardar cambios"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="p-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                                title="Cancelar"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => onAskAssistantAboutTicker(h.ticker)}
                                title={`Consultar análisis de ${h.ticker} con el Asistente`}
                                className="p-1 text-[#f59e0b] hover:bg-[#f59e0b]/20 rounded transition-colors"
                              >
                                <Sparkles className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => startEdit(h)}
                                title="Editar nominales o precio"
                                className="p-1 text-[#71717a] hover:text-white hover:bg-[#27272a] rounded transition-colors"
                              >
                                <Edit className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onDeleteHolding(h.id)}
                                title="Eliminar tenencia"
                                className="p-1 text-[#71717a] hover:text-rose-400 hover:bg-[#27272a] rounded transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
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
                  <th className="py-2 px-2 text-right">Total</th>
                  <th className="py-2 px-2 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/60 font-mono">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#71717a] font-sans">
                      No hay transacciones registradas.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
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
                      <td className="py-2 px-2 text-right font-bold text-white">
                        {formatCurrency(tx.nominales * tx.price, tx.currency)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1 text-[#71717a] hover:text-rose-400 rounded"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
