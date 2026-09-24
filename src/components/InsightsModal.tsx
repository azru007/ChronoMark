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
  const generateMarkdownSummary = (): string => {
    const lines: string[] = [
      `# ChronoMark Timeline Summary - ${date}`,
      `**Total Logged Time:** ${totalDurationStr}`,
      `**Checkpoints Recorded:** ${events.length}`,
      `**Average Block Interval:** ${avgIntervalStr}`,
      '',
      '### Focus Segments Breakdown'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Personalized Insights
                {user && (
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                    Cloud Synced
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Performance for {formatDateLabel(date)}
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

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 py-4 space-y-5 pr-1">
          {/* Philosophy / Purpose Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 border border-amber-500/20">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong className="text-slate-900 dark:text-white">Cognitive Rhythm:</strong> Every tap captures your natural workflow transitions. Reflect on block lengths to sustain deep focus without burnout.
              </p>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Focus</span>
              <span className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400 mt-1">
                {totalDurationStr}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Checkpoints</span>
              <span className="text-lg font-mono font-bold text-sky-600 dark:text-sky-400 mt-1">
                {events.length}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Avg Interval</span>
              <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {avgIntervalStr}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Days</span>
              <span className="text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {distinctDays}
              </span>
            </div>
          </div>

          {/* Category Distribution */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Time Distribution by Activity
            </h3>
            {spans.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No duration logs yet.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(categoryDurations).map(([catId, ms]) => {
                  const cat = CATEGORIES[catId as EventCategory] || CATEGORIES.deep_work;
                  const pct = totalDurationMs > 0 ? Math.round((ms / totalDurationMs) * 100) : 0;
                  return (
                    <div key={catId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                          <span>{cat.emoji}</span>
                          <span>{cat.label}</span>
                        </span>
                        <span className="font-mono text-slate-500 dark:text-slate-400">
                          {formatDuration(ms)} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${cat.gradient}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Export / Standup Sharing Buttons */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Copy Daily Standup Markdown</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
