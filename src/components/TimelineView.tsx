import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Trash2, 
  Edit3, 
  Check, 
  Tag, 
  Sparkles, 
  Flame,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Sliders
} from 'lucide-react';
import type { TimelineEvent, TimelineSpan, EventCategory } from '../types';
import { CATEGORIES } from '../utils/categories';
import { formatTime, formatDuration, formatTimeShort } from '../utils/date';

interface TimeWheelProps {
  value: string;
  title: string;
  unit: 'hr' | 'min';
  onAdjust: (step: number) => void;
  className?: string;
}

const TimeWheelItem: React.FC<TimeWheelProps> = ({
  value,
  title,
  unit,
  onAdjust,
  className = ''
}) => {
  const elementRef = React.useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const resetTimerRef = React.useRef<number | null>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const onWheelHandler = (e: WheelEvent) => {
      // Prevent browser viewport scrolling completely
      e.preventDefault();
      e.stopPropagation();
      const step = e.deltaY < 0 ? 1 : -1;
      setScrollDirection(step > 0 ? 'up' : 'down');

      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = window.setTimeout(() => {
        setScrollDirection(null);
      }, 350);

      onAdjust(step);
    };

    el.addEventListener('wheel', onWheelHandler, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheelHandler);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [onAdjust]);

  return (
    <div
      ref={elementRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setScrollDirection(null);
      }}
      title={title}
      className={`relative inline-flex items-center justify-center cursor-ns-resize select-none touch-none transition-all duration-150 ${className}`}
    >
      {/* Visual Number */}
      <span className={`font-mono text-xs sm:text-sm font-bold tracking-wider transition-all duration-200 ${
        isHovered || scrollDirection 
          ? 'text-amber-500 dark:text-amber-300 font-extrabold scale-110' 
          : 'text-amber-600 dark:text-amber-300'
      }`}>
        {value}
      </span>

      {/* Floating Loupe / Magnifier Badge when mouse is hovering or scrolling */}
      {(isHovered || scrollDirection) && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center animate-in fade-in zoom-in-90 duration-150">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 text-white border-2 border-amber-400 shadow-2xl shadow-amber-500/50 backdrop-blur-md">
            {/* Direction Indicator arrows */}
            <div className="flex flex-col text-[8px] text-amber-400 leading-none">
              <span className={`transition-opacity ${scrollDirection === 'up' ? 'opacity-100 font-extrabold text-amber-300' : 'opacity-40'}`}>▲</span>
              <span className={`transition-opacity ${scrollDirection === 'down' ? 'opacity-100 font-extrabold text-amber-300' : 'opacity-40'}`}>▼</span>
            </div>
            
            <span className="font-mono text-base sm:text-lg font-black text-amber-400 tracking-wider">
              {value}
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
              {unit}
            </span>
          </div>
          {/* Arrow downward to the exact anchor */}
          <div className="w-2 h-2 bg-slate-950 border-r-2 border-b-2 border-amber-400 rotate-45 -mt-1 shadow-xs" />
        </div>
      )}
    </div>
  );
};

interface TimelineViewProps {
  events: TimelineEvent[];
  spans: TimelineSpan[];
  isToday: boolean;
  onUpdateEventNote: (eventId: string, note: string) => void;
  onUpdateEventTime?: (eventId: string, newTimestamp: number) => void;
  onDeleteEvent: (eventId: string) => void;
  onSaveSpanAnnotation: (spanKey: string, text: string, category: EventCategory) => void;
  timeFormat24h: boolean;
  onSeedDemoData?: () => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  spans,
  isToday,
  onUpdateEventNote,
  onUpdateEventTime,
  onDeleteEvent,
  onSaveSpanAnnotation,
  timeFormat24h,
  onSeedDemoData
}) => {
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventNoteText, setEventNoteText] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  
  // Time adjuster popup/tray state
  const [adjustingTimeEventId, setAdjustingTimeEventId] = useState<string | null>(null);

  // Local draft states for span annotations to ensure smooth typing
  const [spanDrafts, setSpanDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const drafts: Record<string, string> = {};
    spans.forEach((span) => {
      drafts[span.id] = span.annotation || '';
    });
    setSpanDrafts(drafts);
  }, [spans]);

  const handleSpanTextChange = (spanKey: string, text: string, category: EventCategory) => {
    setSpanDrafts((prev) => ({ ...prev, [spanKey]: text }));
    onSaveSpanAnnotation(spanKey, text, category);
  };

  const handleSpanCategoryChange = (span: TimelineSpan, newCat: EventCategory) => {
    const currentText = spanDrafts[span.id] ?? span.annotation;
    onSaveSpanAnnotation(span.id, currentText, newCat);
  };

  const handleStartEditEvent = (evt: TimelineEvent) => {
    setEditingEventId(evt.id);
    setEventNoteText(evt.note || '');
  };

  const handleSaveEventNote = (eventId: string) => {
    onUpdateEventNote(eventId, eventNoteText);
    setEditingEventId(null);
  };

  // Adjust hours or minutes via stepper / mouse scroll
  const handleAdjustEventOffset = (evt: TimelineEvent, deltaHours: number, deltaMinutes: number) => {
    if (!onUpdateEventTime) return;
    const dateObj = new Date(evt.timestamp);
    if (deltaHours !== 0) {
      dateObj.setHours(dateObj.getHours() + deltaHours);
    }
    if (deltaMinutes !== 0) {
      dateObj.setMinutes(dateObj.getMinutes() + deltaMinutes);
    }
    onUpdateEventTime(evt.id, dateObj.getTime());
  };

  if (events.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-xl shadow-amber-500/5 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 dark:text-amber-400">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[10px] font-mono border border-amber-500/30">
            Zero logs
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
          No Timeline Events Recorded
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
          Tap the big glowing button below to anchor your first time marker. Each tap captures the exact moment and creates an annotatable focus block.
        </p>

        {onSeedDemoData && (
          <button
            type="button"
            onClick={onSeedDemoData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            Load Sample Day Activity
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-4">
      {/* View Options & Quick Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Timeline Flow
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-mono font-medium border border-amber-500/20">
            {events.length} {events.length === 1 ? 'checkpoint' : 'checkpoints'}
          </span>
        </div>

        {/* Category Quick Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeCategoryFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
            }`}
          >
            All
          </button>
          {Object.values(CATEGORIES).slice(0, 5).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategoryFilter(cat.id === activeCategoryFilter ? 'all' : cat.id)}
              className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer whitespace-nowrap ${
                activeCategoryFilter === cat.id
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-400 dark:border-slate-500'
                  : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>{cat.emoji}</span>
              <span className="hidden sm:inline">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Vertical Connected Timeline Architecture */}
      <div className="relative pl-6 sm:pl-10">
        {/* Continuous Central Line Background */}
        <div className="absolute left-[27px] sm:left-[39px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800 pointer-events-none" />

        {events.map((evt, index) => {
          const associatedSpan = spans.find((s) => s.startEventId === evt.id);
          const isLatestEvent = index === events.length - 1;
          const isAdjustingTime = adjustingTimeEventId === evt.id;

          const dateObj = new Date(evt.timestamp);
          const rawHours = dateObj.getHours();
          const rawMinutes = dateObj.getMinutes();
          const displayHours = timeFormat24h 
            ? String(rawHours).padStart(2, '0') 
            : String((rawHours % 12) || 12).padStart(2, '0');
          const displayMinutes = String(rawMinutes).padStart(2, '0');
          const ampm = rawHours >= 12 ? 'PM' : 'AM';

          return (
            <div key={evt.id} className="relative mb-6">
              {/* Event Marker Node */}
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Visual Marker Dot */}
                <div className="relative z-10 flex-shrink-0 mt-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-amber-400 shadow-md shadow-amber-500/20 flex items-center justify-center group">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400 group-hover:scale-125 transition-transform" />
                  </div>
                  {isLatestEvent && isToday && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  )}
                </div>

                {/* Event Header Card */}
                <div className="flex-1 bg-white/90 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3 sm:p-3.5 backdrop-blur-sm hover:border-slate-300 dark:hover:border-slate-700 transition shadow-xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    
                    {/* Timestamp & Interactive Scroll Adjustment */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative flex items-center gap-1 bg-amber-500/10 border border-amber-500/25 rounded-xl px-2.5 py-1">
                        {/* Interactive Hour Segment with non-passive wheel prevention */}
                        <TimeWheelItem
                          value={displayHours}
                          unit="hr"
                          title="Scroll mouse wheel to adjust Hour without page scroll"
                          onAdjust={(step) => handleAdjustEventOffset(evt, step, 0)}
                          className="group relative flex items-center font-mono text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-300 px-1.5 py-0.5 rounded-lg hover:bg-amber-500/20 transition"
                        />

                        <span className="font-mono text-xs font-bold text-amber-500">:</span>

                        {/* Interactive Minute Segment with non-passive wheel prevention */}
                        <TimeWheelItem
                          value={displayMinutes}
                          unit="min"
                          title="Scroll mouse wheel to adjust Minute without page scroll"
                          onAdjust={(step) => handleAdjustEventOffset(evt, 0, step)}
                          className="group relative flex items-center font-mono text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-300 px-1.5 py-0.5 rounded-lg hover:bg-amber-500/20 transition"
                        />

                        {!timeFormat24h && (
                          <span className="text-[10px] font-mono font-semibold text-amber-500 ml-0.5">
                            {ampm}
                          </span>
                        )}

                        {/* Button to toggle quick stepper adjuster controls */}
                        <button
                          type="button"
                          onClick={() => setAdjustingTimeEventId(isAdjustingTime ? null : evt.id)}
                          title="Adjust time (scroll or +/- controls)"
                          className="ml-1 p-0.5 rounded text-amber-600 dark:text-amber-300 hover:bg-amber-500/20 transition cursor-pointer"
                        >
                          <Sliders className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        Checkpoint #{index + 1}
                      </span>
                      {isLatestEvent && isToday && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                          Latest Stamp
                        </span>
                      )}
                    </div>

                    {/* Right actions (memo edit, delete) */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEditEvent(evt)}
                        title="Add/Edit event memo"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteEvent(evt.id)}
                        title="Delete this marker"
                        className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Scroll & Stepper Adjuster Panel */}
                  {isAdjustingTime && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
                      <div className="flex items-center gap-4">
                        {/* Hour Stepper */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Hour:</span>
                          <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleAdjustEventOffset(evt, -1, 0)}
                              title="Decrease 1 hour"
                              className="px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                            >
                              -1h
                            </button>
                            <TimeWheelItem
                              value={displayHours}
                              unit="hr"
                              title="Scroll wheel to adjust hours without page scroll"
                              onAdjust={(step) => handleAdjustEventOffset(evt, step, 0)}
                              className="font-mono font-bold px-1.5 text-amber-600 dark:text-amber-400"
                            />
                            <button
                              type="button"
                              onClick={() => handleAdjustEventOffset(evt, 1, 0)}
                              title="Increase 1 hour"
                              className="px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                            >
                              +1h
                            </button>
                          </div>
                        </div>

                        {/* Minute Stepper */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Minute:</span>
                          <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleAdjustEventOffset(evt, 0, -5)}
                              title="Decrease 5 minutes"
                              className="px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                            >
                              -5m
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustEventOffset(evt, 0, -1)}
                              title="Decrease 1 minute"
                              className="px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                            >
                              -1m
                            </button>
                            <TimeWheelItem
                              value={displayMinutes}
                              unit="min"
                              title="Scroll wheel to adjust minutes without page scroll"
                              onAdjust={(step) => handleAdjustEventOffset(evt, 0, step)}
                              className="font-mono font-bold px-1.5 text-amber-600 dark:text-amber-400"
                            />
                            <button
                              type="button"
                              onClick={() => handleAdjustEventOffset(evt, 0, 1)}
                              title="Increase 1 minute"
                              className="px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                            >
                              +1m
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustEventOffset(evt, 0, 5)}
                              title="Increase 5 minutes"
                              className="px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                            >
                              +5m
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 italic">
                          💡 You can also scroll your mouse wheel over the time
                        </span>
                        <button
                          type="button"
                          onClick={() => setAdjustingTimeEventId(null)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-xs font-semibold hover:bg-amber-400 transition cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Memo on Event */}
                  {editingEventId === evt.id ? (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={eventNoteText}
                        onChange={(e) => setEventNoteText(e.target.value)}
                        placeholder="Tag or quick timestamp label (e.g. Started deep coding session)..."
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEventNote(evt.id);
                          if (e.key === 'Escape') setEditingEventId(null);
                        }}
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEventNote(evt.id)}
                        className="p-1.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 transition cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  ) : evt.note ? (
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {evt.note}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Between Event Markers: Graphical Connecting Line + Rich Annotation Block */}
              {associatedSpan && (
                <div className="relative pl-4 sm:pl-7 my-3">
                  {/* Left decorative connector line */}
                  <div className={`
                    absolute left-[13px] sm:left-[21px] top-0 bottom-0 w-1 rounded-full
                    ${associatedSpan.isOngoing 
                      ? 'bg-gradient-to-b from-amber-500 via-emerald-400 to-emerald-500 animate-pulse' 
                      : 'bg-gradient-to-b from-amber-500/60 to-indigo-500/60'
                    }
                  `} />

                  {/* The Annotation Container */}
                  <div className={`
                    ml-6 sm:ml-8 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200
                    ${associatedSpan.isOngoing 
                      ? 'bg-gradient-to-br from-white/95 to-slate-50/95 dark:from-slate-900/90 dark:to-slate-950/90 border-emerald-500/30 shadow-lg shadow-emerald-500/5' 
                      : 'bg-slate-50/80 hover:bg-white dark:bg-slate-900/50 dark:hover:bg-slate-900/80 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                    }
                  `}>
                    {/* Span Meta Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-mono font-medium text-slate-700 dark:text-slate-200">
                          <Clock className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                          <span>{formatDuration(associatedSpan.durationMs)}</span>
                        </span>

                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                          {formatTimeShort(associatedSpan.startTime, timeFormat24h)} →{' '}
                          {associatedSpan.isOngoing ? 'Active Now' : formatTimeShort(associatedSpan.endTime, timeFormat24h)}
                        </span>

                        {associatedSpan.isOngoing && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-pulse">
                            <Flame className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                            Ongoing Sprint
                          </span>
                        )}
                      </div>

                      {/* Category Selection Chips */}
                      <div className="flex items-center gap-1 overflow-x-auto max-w-full">
                        {Object.values(CATEGORIES).map((cat) => {
                          const isSelected = associatedSpan.category === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleSpanCategoryChange(associatedSpan, cat.id)}
                              title={cat.label}
                              className={`px-2 py-0.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1 ${
                                isSelected 
                                  ? `${cat.bgDark} ${cat.textDark} border ${cat.borderDark} font-semibold shadow-xs` 
                                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                              }`}
                            >
                              <span>{cat.emoji}</span>
                              <span className="text-[11px] hidden md:inline">{cat.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Direct In-Line Activity Annotation Text Field */}
                    <div className="relative">
                      <textarea
                        rows={2}
                        value={spanDrafts[associatedSpan.id] ?? ''}
                        onChange={(e) => handleSpanTextChange(associatedSpan.id, e.target.value, associatedSpan.category)}
                        placeholder={
                          associatedSpan.isOngoing
                            ? "Taking live notes on this ongoing session... (e.g. Refactoring auth module, reviewing PR #42)"
                            : "Annotate what you accomplished in this time block..."
                        }
                        className="w-full bg-white dark:bg-slate-950/70 hover:bg-slate-50 dark:hover:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-amber-400/80 rounded-xl p-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400/40 resize-y transition"
                      />
                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                        <span>Auto-syncs to cloud</span>
                        {spanDrafts[associatedSpan.id] ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Saved
                          </span>
                        ) : (
                          <span>Click to write annotation</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
