import { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  Maximize2,
  Minimize2,
  Trash2,
  Plus,
  RefreshCw
} from 'lucide-react';
import { CalendarEvent } from '../types';
import AddCalendarEventModal from './AddCalendarEventModal';

interface CalendarSectionProps {
  events: CalendarEvent[];
  onAskAssistantAboutEvent: (event: CalendarEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
  onAddEvent?: (event: Omit<CalendarEvent, 'id'>) => void;
  onSyncOfficialCalendar?: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export default function CalendarSection({
  events,
  onAskAssistantAboutEvent,
  onDeleteEvent,
  onAddEvent,
  onSyncOfficialCalendar,
  isMaximized = false,
  onToggleMaximize
}: CalendarSectionProps) {
  // Current month state: September 2026
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 1));
  const [selectedDayStr, setSelectedDayStr] = useState<string>('2026-09-11');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  const daysOfWeek = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Day of week of the first day (0 = Sunday in JS, convert to 0 = Monday)
  let firstDayIndex = new Date(year, month, 1).getDay() - 1;
  if (firstDayIndex === -1) firstDayIndex = 6;

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get events grouped by date string YYYY-MM-DD
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  events.forEach(ev => {
    if (!eventsByDate[ev.date]) {
      eventsByDate[ev.date] = [];
    }
    eventsByDate[ev.date].push(ev);
  });

  const selectedDayEvents = eventsByDate[selectedDayStr] || [];

  return (
    <div className={`bg-[#121214] border border-[#27272a] rounded-xl flex flex-col shadow-xs transition-all ${
      isMaximized 
        ? 'p-4 sm:p-5 h-full overflow-y-auto' 
        : 'p-2 sm:p-2.5 h-full overflow-y-auto scrollbar-thin'
    }`}>
      
      {/* Top section: Header & Calendar Grid */}
      <div className="flex flex-col shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-1.5 border-b border-[#27272a] mb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded bg-[#f59e0b]/10 text-[#f59e0b]">
              <CalendarIcon className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight">
              Calendario & Balances
            </h2>
          </div>

          {/* Month Navigation & Maximize */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5 bg-[#18181b] border border-[#27272a] rounded p-0.5">
              <button
                type="button"
                onClick={prevMonth}
                className="p-0.5 text-[#a1a1aa] hover:text-white rounded transition-colors"
                title="Mes anterior"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-[10px] font-semibold text-white px-1 min-w-[65px] text-center">
                {monthNames[month]} {year}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-0.5 text-[#a1a1aa] hover:text-white rounded transition-colors"
                title="Mes siguiente"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {onAddEvent && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                title="Agregar nuevo evento al calendario"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-[#f59e0b] text-[9px] font-medium transition-colors"
              >
                <Plus className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">Evento</span>
              </button>
            )}

            {onSyncOfficialCalendar && (
              <button
                type="button"
                onClick={onSyncOfficialCalendar}
                title="Sincronizar fechas oficiales confirmadas con el Asistente"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-sky-400 text-[9px] font-medium transition-colors"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">Sincronizar</span>
              </button>
            )}

            {onToggleMaximize && (
              <button
                type="button"
                onClick={onToggleMaximize}
                title={isMaximized ? "Restaurar vista dividida" : "Desplegar Calendario a pantalla completa"}
                className="p-1 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-white transition-all ml-0.5"
              >
                {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        {/* Legend chips */}
        <div className="flex items-center gap-2 text-[8px] text-[#a1a1aa] mb-1.5">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
            <span>Balance</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>Macro</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Dividendo</span>
          </span>
        </div>

        {/* Calendar Grid */}
        <div className={`grid grid-cols-7 gap-0.5 sm:gap-1 text-center ${isMaximized ? 'mb-4' : 'mb-2'}`}>
          {/* Days of week */}
          {daysOfWeek.map((d, i) => (
            <div key={`${d}-${i}`} className="text-[8px] sm:text-[9px] uppercase font-bold text-[#71717a] py-0.5">
              {d}
            </div>
          ))}

          {/* Empty cells before month start */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className={isMaximized ? 'h-12' : 'h-5 sm:h-6'} />
          ))}

          {/* Month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNumber = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
            const dayEvents = eventsByDate[dateStr] || [];
            const hasEvents = dayEvents.length > 0;
            const isSelected = selectedDayStr === dateStr;
            const isToday = dateStr === '2026-09-09';
            
            const hasBalance = dayEvents.some(e => e.type === 'Balance');
            const hasMacro = dayEvents.some(e => e.type === 'Macro');
            const hasDividend = dayEvents.some(e => e.type === 'Cupón / Dividendo');

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDayStr(dateStr)}
                className={`rounded flex flex-col items-center justify-between transition-all ${
                  isMaximized 
                    ? 'h-14 sm:h-16 p-1 text-xs' 
                    : 'h-5 sm:h-6 p-0.5 text-[9px] min-h-[20px]'
                } ${
                  isSelected 
                    ? 'bg-[#f59e0b]/25 border border-[#f59e0b] text-white font-bold' 
                    : isToday
                    ? 'bg-[#27272a] border border-[#f59e0b]/60 text-white font-semibold'
                    : hasEvents
                    ? 'bg-[#18181b] border border-[#3f3f46] text-white hover:border-[#f59e0b]/50'
                    : 'bg-[#18181b]/40 hover:bg-[#18181b] text-[#a1a1aa] hover:text-white'
                }`}
              >
                <span className="leading-none">{dayNumber}</span>

                {hasEvents ? (
                  <div className="flex items-center gap-0.5 leading-none mt-0.5">
                    {hasBalance && <span className="w-1 h-1 rounded-full bg-[#f59e0b]" />}
                    {hasMacro && <span className="w-1 h-1 rounded-full bg-sky-400" />}
                    {hasDividend && <span className="w-1 h-1 rounded-full bg-emerald-400" />}
                  </div>
                ) : (
                  <span className="w-1 h-1 opacity-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda view */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-1.5 shrink-0 mt-auto">
        <div className="flex items-center justify-between pb-1 border-b border-[#27272a]/80 mb-1 text-[10px]">
          <div className="flex items-center gap-1 text-white font-semibold">
            <Clock className="w-2.5 h-2.5 text-[#f59e0b]" />
            <span>{selectedDayStr.split('-').reverse().join('/')}:</span>
          </div>
          <span className="text-[9px] text-[#a1a1aa]">
            {selectedDayEvents.length} evento(s)
          </span>
        </div>

        <div className={`space-y-1 overflow-y-auto pr-0.5 ${isMaximized ? 'max-h-[220px]' : 'max-h-[50px] xl:max-h-[60px]'}`}>
          {selectedDayEvents.length === 0 ? (
            <div className="text-center py-0.5 text-[#71717a] text-[9px]">
              Sin eventos para este día.
            </div>
          ) : (
            selectedDayEvents.map((ev, evIdx) => (
              <div 
                key={`${ev.id}-${evIdx}`} 
                className="p-1 rounded bg-[#121214] border border-[#27272a] flex items-center justify-between gap-1.5 text-xs"
              >
                <div className="flex items-center gap-1 min-w-0">
                  {ev.ticker && (
                    <span className="font-mono text-[8px] font-bold bg-[#f59e0b]/20 text-[#f59e0b] px-1 py-0.2 rounded shrink-0">
                      ${ev.ticker}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="text-[10px] font-medium text-white truncate">
                      {ev.title}
                    </div>
                    <div className="text-[9px] text-[#71717a] truncate">
                      {ev.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onAskAssistantAboutEvent(ev)}
                    title="Consultar al Asistente sobre este evento"
                    className="p-1 text-[#f59e0b] hover:bg-[#f59e0b]/20 rounded transition-colors"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                  </button>

                  {onDeleteEvent && (
                    <button
                      type="button"
                      onClick={() => onDeleteEvent(ev.id)}
                      title="Eliminar este evento del calendario"
                      className="p-1 text-[#71717a] hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isAddModalOpen && onAddEvent && (
        <AddCalendarEventModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddEvent={(newEv) => {
            onAddEvent(newEv);
            setIsAddModalOpen(false);
          }}
          defaultDate={selectedDayStr}
        />
      )}

    </div>
  );
}
