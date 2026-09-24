import React, { useState } from 'react';
import { 
  X, 
  Flame, 
  BarChart3, 
  BrainCircuit, 
  Clock, 
  CheckCircle2, 
  Share2, 
  Download, 
  Sparkles, 
  ShieldCheck,
  Zap,
  Coffee
} from 'lucide-react';
import type { TimelineEvent, TimelineSpan, EventCategory } from '../types';
import { CATEGORIES } from '../utils/categories';
import { formatDuration, formatDateLabel } from '../utils/date';
import type { User } from '../services/firebase';

interface InsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  events: TimelineEvent[];
  spans: TimelineSpan[];
  user: User | null;
  allEvents: TimelineEvent[];
}

export const InsightsModal: React.FC<InsightsModalProps> = ({
  isOpen,
  onClose,
  date,
  events,
  spans,
  user,
  allEvents
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Calculate day metrics
  const totalDurationMs = spans.reduce((sum, s) => sum + s.durationMs, 0);
  const totalDurationStr = formatDuration(totalDurationMs);
  const avgIntervalMs = spans.length > 0 ? totalDurationMs / spans.length : 0;
  const avgIntervalStr = formatDuration(avgIntervalMs);

  // Category breakdown
  const categoryDurations: Record<string, number> = {};
  spans.forEach((span) => {
    categoryDurations[span.category] = (categoryDurations[span.category] || 0) + span.durationMs;
  });

  // Calculate distinct active days and total lifetime marks
  const distinctDays = new Set(allEvents.map((e) => e.isoDate)).size;
  const totalMarks = allEvents.length;

  // Generate markdown export
  const generateMarkdownSummary = () => {
    const lines = [
      `# ⏱ ChronoMark Activity Summary - ${formatDateLabel(date)} (${date})`,
      `Total Focused Time: ${totalDurationStr} across ${events.length} checkpoints.`,
      `Average Checkpoint Interval: ${avgIntervalStr}\n`,
      `## Timeline Spans:`
    ];

    spans.forEach((span, idx) => {
      const cat = CATEGORIES[span.category]?.label || span.category;
      const note = span.annotation ? ` - ${span.annotation}` : '';
      lines.push(`${idx + 1}. [${formatDuration(span.durationMs)}] [${cat}]${note}`);
    });

    return lines.join('\n');
  };

  const handleCopyMarkdown = () => {
    const text = generateMarkdownSummary();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const data = {
      date,
      events,
      spans,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronomark-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Personalized Insights
                {user && (
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    Cloud Synced
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Performance for {formatDateLabel(date)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 py-4 space-y-5 pr-1">
          {/* Philosophy / Purpose Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 border border-amber-500/20">
            <div className="flex items-start gap-2.5">
              <BrainCircuit className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Why ChronoMark Works
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                  Complex timesheets drain cognitive energy. ChronoMark separates recording from documentation: a single instant tap anchors your timeline, letting you stay immersed in deep work and annotate the intervals on your terms.
                </p>
              </div>
            </div>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Tracked Time
              </span>
              <p className="text-lg font-bold text-white font-mono mt-1">
                {totalDurationStr || '0m'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-orange-400" />
                Checkpoints
              </span>
              <p className="text-lg font-bold text-white font-mono mt-1">
                {events.length}
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                Avg Interval
              </span>
              <p className="text-lg font-bold text-white font-mono mt-1">
                {avgIntervalStr || '0m'}
              </p>
            </div>
          </div>

          {/* Category Distribution */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              Activity Distribution
            </h4>
            {spans.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                No spans recorded for this day yet.
              </p>
            ) : (
              <div className="space-y-2">
                {Object.entries(categoryDurations).map(([catKey, durMs]) => {
                  const cat = CATEGORIES[catKey as EventCategory] || CATEGORIES.deep_work;
                  const pct = totalDurationMs > 0 ? Math.round((durMs / totalDurationMs) * 100) : 0;
                  return (
                    <div key={catKey} className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="flex items-center gap-1.5 font-medium text-slate-200">
                          <span>{cat.emoji}</span>
                          <span>{cat.label}</span>
                        </span>
                        <span className="font-mono text-slate-400">
                          {formatDuration(durMs)} ({pct}%)
                        </span>
                      </div>
                      {/* Bar */}
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Account & Multi-Device Sync Info */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  {user ? (user.isAnonymous ? 'Guest Account Active' : `Logged in as ${user.displayName || user.email}`) : 'Offline Mode (Local Storage)'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {user ? 'Timelines auto-sync securely to Cloud Firestore' : 'Data stored locally on this device'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {distinctDays} active days logged
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions: Export & Standup Sharing */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20 cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                Copied Standup!
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                Copy Daily Standup
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
