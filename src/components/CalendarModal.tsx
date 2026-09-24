import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Clock, 
  Activity, 
  Flame,
  CheckCircle2
} from 'lucide-react';
import type { TimelineEvent } from '../types';
import { getTodayIso, formatDateLabel, formatDuration } from '../utils/date';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  allEvents: TimelineEvent[];
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  allEvents
}) => {
  const todayIso = getTodayIso();
  const [currentYear, setCurrentYear] = useState(() => {
    const [y] = selectedDate.split('-').map(Number);
    return y || new Date().getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const [, m] = selectedDate.split('-').map(Number);
    return (m || new Date().getMonth() + 1) - 1; // 0-indexed
  });

  if (!isOpen) return null;

  // Group all events by date to count checkpoints and calculate activity
  const dateEventMap: Record<string, TimelineEvent[]> = {};
  allEvents.forEach((evt) => {
    if (!dateEventMap[evt.isoDate]) {
      dateEventMap[evt.isoDate] = [];
    }
    dateEventMap[evt.isoDate].push(evt);
  });

  // Calculate calendar grid days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Distinct logged dates sorted desc
  const loggedDates = Object.keys(dateEventMap).sort((a, b) => b.localeCompare(a));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Activity Calendar
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Browse daily timeline history and focus logs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between my-4 px-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
            {monthNames[currentMonth]} {currentYear}
          </span>

          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-7 gap-1.5 mb-5">
          {/* Empty prefix slots */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10 sm:h-12 rounded-xl" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayIso;
            const dayEvents = dateEventMap[dateStr] || [];
            const hasActivity = dayEvents.length > 0;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => {
                  onSelectDate(dateStr);
                  onClose();
                }}
                className={`
                  relative h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center text-xs font-medium transition cursor-pointer
                  ${isSelected 
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20' 
                    : isToday 
                    ? 'border-2 border-amber-400/80 text-amber-600 dark:text-amber-300 bg-amber-500/10' 
                    : hasActivity
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700'
                    : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }
                `}
              >
                <span>{dayNum}</span>
                {hasActivity && (
                  <span className={`flex items-center gap-0.5 mt-0.5 ${isSelected ? 'text-slate-950' : 'text-amber-500 dark:text-amber-400'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {dayEvents.length > 1 && (
                      <span className="text-[9px] font-mono leading-none">{dayEvents.length}</span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Actions & Recent Logged Days */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Recent Logged Days
            </span>
            <button
              type="button"
              onClick={() => {
                onSelectDate(todayIso);
                onClose();
              }}
              className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 font-semibold cursor-pointer"
            >
              Jump to Today
            </button>
          </div>

          {loggedDates.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-3 text-center">
              No historical sessions found. Start by marking moments today!
            </p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {loggedDates.slice(0, 7).map((d) => {
                const count = dateEventMap[d]?.length || 0;
                const isCurrent = d === selectedDate;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      onSelectDate(d);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-50 dark:bg-slate-800 border border-amber-500/40 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium">{formatDateLabel(d)}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">({d})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                      {count} {count === 1 ? 'mark' : 'marks'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
