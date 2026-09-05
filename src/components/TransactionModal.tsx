import { useState, useEffect } from 'react';
import { X, PlusCircle, CheckCircle, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { AssetType, Holding, Transaction } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>, assetDetails: { name: string; assetType: AssetType }) => void;
  holdings: Holding[];
  preselectedTicker?: string;
}

export default function TransactionModal({
  isOpen,
  onClose,
  onAddTransaction,
  holdings,
  preselectedTicker
}: TransactionModalProps) {
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('Acción Local');
  const [type, setType] = useState<'Compra' | 'Venta'>('Compra');
  const [nominales, setNominales] = useState<number>(100);
  const [price, setPrice] = useState<number>(0);
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // When opening with a preselected ticker
  useEffect(() => {
    if (preselectedTicker) {
      const match = holdings.find(h => h.ticker.toUpperCase() === preselectedTicker.toUpperCase());
      if (match) {
        setTicker(match.ticker);
        setName(match.name);
        setAssetType(match.assetType);
        setCurrency(match.currency);
        setPrice(match.currentPrice);
      } else {
        setTicker(preselectedTicker);
      }
    }
  }, [preselectedTicker, holdings]);

  // When ticker input changes, autofill if existing
  const handleTickerChange = (value: string) => {
    const uppercase = value.toUpperCase();
    setTicker(uppercase);
    const match = holdings.find(h => h.ticker.toUpperCase() === uppercase);
    if (match) {
      setName(match.name);
      setAssetType(match.assetType);
      setCurrency(match.currency);
      setPrice(match.currentPrice);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim() || nominales <= 0 || price <= 0) return;

    onAddTransaction(
      {
        date,
        ticker: ticker.trim().toUpperCase(),
        type,
        nominales: Number(nominales),
        price: Number(price),
        currency,
        notes: notes.trim()
      },
      {
        name: name.trim() || `${ticker.trim().toUpperCase()} S.A.`,
        assetType
      }
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#27272a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b]">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Registrar Operación</h3>
              <p className="text-xs text-[#a1a1aa]">Carga de compras y ventas para seguimiento de cartera</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#71717a] hover:text-white hover:bg-[#27272a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          
          {/* Operation type toggle (Compra vs Venta) */}
          <div>
            <label className="block text-xs font-semibold text-[#a1a1aa] uppercase mb-1.5">
              Tipo de Operación
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('Compra')}
                className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  type === 'Compra'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-[#18181b] border-[#27272a] text-[#71717a] hover:text-white'
                }`}
              >
                <ArrowUpCircle className="w-4 h-4" />
                <span>Compra (Ingreso de nominales)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('Venta')}
                className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  type === 'Venta'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                    : 'bg-[#18181b] border-[#27272a] text-[#71717a] hover:text-white'
                }`}
              >
                <ArrowDownCircle className="w-4 h-4" />
                <span>Venta (Egreso de nominales)</span>
              </button>
            </div>
          </div>

          {/* Ticker & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase mb-1">
                Ticker / Símbolo
              </label>
              <input
                type="text"
                required
                placeholder="ej. YPFD, VIST, AL30..."
                value={ticker}
                onChange={(e) => handleTickerChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-white font-mono text-sm font-bold focus:outline-none focus:border-[#f59e0b]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase mb-1">
                Nombre de la Empresa o Activo
              </label>
              <input
                type="text"
                placeholder="ej. YPF S.A."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-white text-sm focus:outline-none focus:border-[#f59e0b]"
              />
            </div>
          </div>

          {/* Asset Type & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase mb-1">
                Tipo de Instrumento
              </label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as AssetType)}
                className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-white text-xs focus:outline-none focus:border-[#f59e0b]"
              >
                <option value="Acción Local">Acción Local (BYMA)</option>
                <option value="CEDEAR">CEDEAR</option>
                <option value="Bono Soberano">Bono Soberano</option>
                <option value="Letra">Letra del Tesoro (LECAP/BONCAP)</option>
                <option value="ON Corporativa">Obligación Negociable (ON)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase mb-1">
                Moneda de Cotización
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'ARS' | 'USD')}
                className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-white text-xs focus:outline-none focus:border-[#f59e0b]"
              >
                <option value="ARS">Pesos Argentinos ($ ARS)</option>
                <option value="USD">Dólares Estadounidenses (USD)</option>
              </select>
            </div>
          </div>

          {/* Nominales & Unit Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase mb-1">
                Cantidad de Nominales
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={nominales}
                onChange={(e) => setNominales(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#f59e0b]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase mb-1">
                Precio Unitario ({currency})
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#f59e0b]"
              />
            </div>
          </div>

          {/* Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase mb-1">
                Fecha de Concertación
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-white text-xs focus:outline-none focus:border-[#f59e0b]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] uppercase mb-1">
                Notas / Estrategia (Opcional)
              </label>
              <input
                type="text"
                placeholder="ej. Rebalanceo mensual, cobro dividendos..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-white text-xs focus:outline-none focus:border-[#f59e0b]"
              />
            </div>
          </div>

          {/* Summary Preview */}
          <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-xl flex items-center justify-between text-xs">
            <span className="text-[#a1a1aa]">Total de la Operación:</span>
            <span className="font-mono font-bold text-white text-sm">
              {new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(nominales * price)}
            </span>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-medium rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#f59e0b] hover:bg-[#d97706] text-[#09090b] text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              Confirmar Operación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
