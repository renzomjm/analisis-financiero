import React, { useState } from 'react';
import { X, Calendar, AlertCircle, Plus, Check } from 'lucide-react';
import { CalendarEvent } from '../types';

interface AddCalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  defaultDate?: string;
}

export default function AddCalendarEventModal({
  isOpen,
  onClose,
  onAddEvent,
  defaultDate
}: AddCalendarEventModalProps) {
  const [date, setDate] = useState<string>(defaultDate || '2026-09-15');
  const [ticker, setTicker] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [type, setType] = useState<CalendarEvent['type']>('Balance');
  const [impactLevel, setImpactLevel] = useState<CalendarEvent['impactLevel']>('Medio');
  const [description, setDescription] = useState<string>('');
  const [isHoldingOrWatchlist, setIsHoldingOrWatchlist] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date.trim()) {
      setError('Por favor indica una fecha válida.');
      return;
    }
    if (!title.trim()) {
      setError('Por favor indica el título del evento.');
      return;
    }

    onAddEvent({
      date,
      ticker: ticker.trim().toUpperCase() || undefined,
      title: title.trim(),
      type,
      description: description.trim() || 'Evento registrado en el calendario financiero.',
      impactLevel,
      isHoldingOrWatchlist
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        className="bg-[#18181b] border border-[#27272a] rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-calendar-event-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 id="add-calendar-event-title" className="text-sm font-semibold text-white">
                Agregar Evento al Calendario
              </h3>
              <p className="text-xs text-[#a1a1aa]">
                Registra balances, dividendos o eventos macroeconómicos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#71717a] hover:text-white rounded-lg hover:bg-[#27272a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                Fecha (AAAA-MM-DD)
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#121214] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-[#f59e0b]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                Ticker / Emisor (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. YPFD, INDEC, AAPL"
                value={ticker}
                onChange={e => setTicker(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#121214] border border-[#27272a] rounded-lg text-white font-mono uppercase focus:outline-none focus:border-[#f59e0b]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
              Título del Evento
            </label>
            <input
              type="text"
              placeholder="Ej. Presentación Oficial Resultados Q3"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-[#121214] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-[#f59e0b]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                Tipo de Evento
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as CalendarEvent['type'])}
                className="w-full px-3 py-1.5 text-xs bg-[#121214] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-[#f59e0b]"
              >
                <option value="Balance">Balance (Earnings)</option>
                <option value="Macro">Macro (Inflación / BCRA)</option>
                <option value="Cupón / Dividendo">Cupón / Dividendo</option>
                <option value="Licitación">Licitación del Tesoro</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                Impacto Estimado
              </label>
              <select
                value={impactLevel}
                onChange={e => setImpactLevel(e.target.value as CalendarEvent['impactLevel'])}
                className="w-full px-3 py-1.5 text-xs bg-[#121214] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-[#f59e0b]"
              >
                <option value="Alto">Alto</option>
                <option value="Medio">Medio</option>
                <option value="Bajo">Bajo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
              Descripción / Fuente
            </label>
            <textarea
              rows={2}
              placeholder="Ej. Informe oficial publicado ante la CNV y SEC."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-[#121214] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-[#f59e0b] resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isHoldingCheckbox"
              checked={isHoldingOrWatchlist}
              onChange={e => setIsHoldingOrWatchlist(e.target.checked)}
              className="rounded border-[#27272a] bg-[#121214] text-[#f59e0b] focus:ring-0 focus:ring-offset-0"
            />
            <label htmlFor="isHoldingCheckbox" className="text-xs text-[#a1a1aa] cursor-pointer">
              Destacar como activo en Cartera / Seguimiento
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-[#a1a1aa] hover:text-white rounded-lg hover:bg-[#27272a] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-black bg-[#f59e0b] hover:bg-[#f59e0b]/90 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Guardar Evento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
