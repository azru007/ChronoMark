import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Trash2, 
  Edit3, 
  Check, 
  Tag, 
  Sparkles, 
  ArrowDown, 
  MoreVertical,
  Activity,
  Flame
} from 'lucide-react';
import type { TimelineEvent, TimelineSpan, EventCategory } from '../types';
import { CATEGORIES } from '../utils/categories';
import { formatTime, formatDuration, formatTimeShort } from '../utils/date';

interface TimelineViewProps {
  events: TimelineEvent[];
  spans: TimelineSpan[];
  isToday: boolean;
  onUpdateEventNote: (eventId: string, note: string) => void;
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
  onDeleteEvent,
  onSaveSpanAnnotation,
  timeFormat24h,
  onSeedDemoData
}) => {
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventNoteText, setEventNoteText] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [viewDensity, setViewDensity] = useState<'comfortable' | 'compact'>('comfortable');

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
    // Auto-save debounced or on blur, but let's also immediately notify parent
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

  // Filter spans if category filter is applied
  const filteredSpans = activeCategoryFilter === 'all' 
    ? spans 
    : spans.filter(s => s.category === activeCategoryFilter);

  if (events.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-center justify-center shadow-xl shadow-amber-500/5 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
            Zero logs
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-100 mb-2">
          No Timeline Events Recorded
        </h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
          Tap the big glowing button below to anchor your first time marker. Each tap captures the exact moment and creates an annotatable focus block.
        </p>

        {onSeedDemoData && (
          <button
            type="button"
            onClick={onSeedDemoData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-300 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Load Sample Day Activity
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-4">
      {/* View Options & Quick Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Timeline Flow
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-mono font-medium border border-amber-500/20">
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
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
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
                  ? 'bg-slate-700 text-white border border-slate-500'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
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
        <div className="absolute left-[29px] sm:left-[45px] top-4 bottom-8 w-0.5 bg-gradient-to-b from-amber-500/40 via-indigo-500/40 to-slate-800 pointer-events-none" />

        {events.map((evt, index) => {
          // Corresponding span that begins with this event
          const associatedSpan = spans.find((s) => s.startEventId === evt.id);
          const isLatestEvent = index === events.length - 1;

          return (
            <div key={evt.id} className="relative mb-6">
              {/* Event Marker Node */}
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Visual Marker Dot */}
                <div className="relative z-10 flex-shrink-0 mt-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900 border-2 border-amber-400 shadow-md shadow-amber-500/20 flex items-center justify-center group">
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
                <div className="flex-1 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3 sm:p-3.5 backdrop-blur-sm hover:border-slate-700 transition">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs sm:text-sm font-bold text-amber-300">
                        {formatTime(evt.timestamp, timeFormat24h)}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Checkpoint #{index + 1}
                      </span>
                      {isLatestEvent && isToday && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                          Latest Stamp
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEditEvent(evt)}
                        title="Add/Edit event memo"
                        className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteEvent(evt.id)}
                        title="Delete this marker"
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

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
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
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
                    <p className="mt-1.5 text-xs text-slate-300 font-medium">
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
                      ? 'bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-emerald-500/30 shadow-lg shadow-emerald-500/5' 
                      : 'bg-slate-900/50 hover:bg-slate-900/80 border-slate-800/80 hover:border-slate-700 shadow-sm'
                    }
                  `}>
                    {/* Span Meta Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-mono font-medium text-slate-200">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{formatDuration(associatedSpan.durationMs)}</span>
                        </span>

                        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                          {formatTimeShort(associatedSpan.startTime, timeFormat24h)} →{' '}
                          {associatedSpan.isOngoing ? 'Active Now' : formatTimeShort(associatedSpan.endTime, timeFormat24h)}
                        </span>

                        {associatedSpan.isOngoing && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-pulse">
                            <Flame className="w-3 h-3 text-emerald-400" />
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
                                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
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
                        className="w-full bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-amber-400/80 rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400/40 resize-y transition"
                      />
                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                        <span>Auto-syncs to cloud</span>
                        {spanDrafts[associatedSpan.id] ? (
                          <span className="text-emerald-400 flex items-center gap-1">
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
