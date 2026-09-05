import { useState } from 'react';
import { X, DollarSign, RefreshCw, Radio } from 'lucide-react';
import { MarketRates } from '../types';

interface EditMepModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketRates: MarketRates;
  onSaveRates: (rates: MarketRates) => void;
  onRefreshLiveRates?: () => Promise<void>;
}

export default function EditMepModal({
  isOpen,
  onClose,
  marketRates,
  onSaveRates,
  onRefreshLiveRates
}: EditMepModalProps) {
  const [mep, setMep] = useState<number>(marketRates.dollarMep);
  const [ccl, setCcl] = useState<number>(marketRates.dollarCcl);
  const [riesgoPais, setRiesgoPais] = useState<number>(marketRates.riesgoPais);
  const [isFetchingLive, setIsFetchingLive] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSyncLive = async () => {
    setIsFetchingLive(true);
    try {
      if (onRefreshLiveRates) {
        await onRefreshLiveRates();
      } else {
        const res = await fetch('/api/rates/live');
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'ok') {
            setMep(data.dollarMep);
            setCcl(data.dollarCcl);
            setRiesgoPais(data.riesgoPais);
            onSaveRates({
              ...marketRates,
              dollarMep: data.dollarMep,
              dollarMepCompra: data.dollarMepCompra,
              dollarCcl: data.dollarCcl,
              dollarCclCompra: data.dollarCclCompra,
              dollarOficial: data.dollarOficial,
              dollarBlue: data.dollarBlue,
              riesgoPais: data.riesgoPais,
              source: data.source,
              lastUpdated: data.lastUpdated,
              isLive: data.isLive
            });
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching live rates:', e);
    } finally {
      setIsFetchingLive(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRates({
      ...marketRates,
      dollarMep: Number(mep),
      dollarCcl: Number(ccl),
      riesgoPais: Number(riesgoPais),
      lastUpdated: 'Personalizado manualmente'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b]">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Cotizaciones de Mercado</h3>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                {marketRates.source || 'DolarApi (BYMA / MAE)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#71717a] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-3 text-xs">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#a1a1aa] block">Última captura en tiempo real</span>
              <span className="text-xs font-mono text-white">{marketRates.lastUpdated}</span>
            </div>
            <button
              type="button"
              onClick={handleSyncLive}
              disabled={isFetchingLive}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f59e0b]/15 hover:bg-[#f59e0b]/25 border border-[#f59e0b]/30 rounded-lg text-[#f59e0b] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isFetchingLive ? 'animate-spin' : ''}`} />
              <span>{isFetchingLive ? 'Sincronizando...' : 'Recargar en Vivo'}</span>
            </button>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[#a1a1aa] font-medium">
                Dólar MEP (ARS / USD)
              </label>
              {marketRates.dollarMepCompra && (
                <span className="text-[10px] text-[#71717a] font-mono">
                  Compra: ${marketRates.dollarMepCompra.toFixed(2)}
                </span>
              )}
            </div>
            <input
              type="number"
              step="0.01"
              required
              value={mep}
              onChange={(e) => setMep(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-white font-mono font-bold focus:outline-none focus:border-[#f59e0b]"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[#a1a1aa] font-medium">
                Dólar CCL (Contado con Liquidación)
              </label>
              {marketRates.dollarCclCompra && (
                <span className="text-[10px] text-[#71717a] font-mono">
                  Compra: ${marketRates.dollarCclCompra.toFixed(2)}
                </span>
              )}
            </div>
            <input
              type="number"
              step="0.01"
              required
              value={ccl}
              onChange={(e) => setCcl(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-white font-mono font-bold focus:outline-none focus:border-[#f59e0b]"
            />
          </div>

          <div>
            <label className="block text-[#a1a1aa] font-medium mb-1">
              Riesgo País (Puntos Básicos - ArgentinaDatos EMBI+)
            </label>
            <input
              type="number"
              step="1"
              required
              value={riesgoPais}
              onChange={(e) => setRiesgoPais(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-xl text-white font-mono font-bold focus:outline-none focus:border-[#f59e0b]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#27272a] text-white rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#f59e0b] text-[#09090b] font-bold rounded-lg cursor-pointer hover:bg-[#d97706]"
            >
              Guardar Valor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
