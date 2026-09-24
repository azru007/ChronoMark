import type { EventCategory } from '../types';

export interface CategoryInfo {
  id: EventCategory;
  label: string;
  emoji: string;
  bgDark: string;
  borderDark: string;
  textDark: string;
  dotColor: string;
  gradient: string;
}

export const CATEGORIES: Record<EventCategory, CategoryInfo> = {
  deep_work: {
    id: 'deep_work',
    label: 'Deep Work',
    emoji: '⚡',
    bgDark: 'bg-amber-500/10',
    borderDark: 'border-amber-500/30',
    textDark: 'text-amber-400',
    dotColor: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600'
  },
  planning: {
    id: 'planning',
    label: 'Planning',
    emoji: '🎯',
    bgDark: 'bg-indigo-500/10',
    borderDark: 'border-indigo-500/30',
    textDark: 'text-indigo-400',
    dotColor: '#6366f1',
    gradient: 'from-indigo-500 to-purple-600'
  },
  meeting: {
    id: 'meeting',
    label: 'Meeting',
    emoji: '💬',
    bgDark: 'bg-sky-500/10',
    borderDark: 'border-sky-500/30',
    textDark: 'text-sky-400',
    dotColor: '#0ea5e9',
    gradient: 'from-sky-500 to-blue-600'
  },
  debugging: {
    id: 'debugging',
    label: 'Debugging',
    emoji: '🐛',
    bgDark: 'bg-rose-500/10',
    borderDark: 'border-rose-500/30',
    textDark: 'text-rose-400',
    dotColor: '#f43f5e',
    gradient: 'from-rose-500 to-red-600'
  },
  review: {
    id: 'review',
    label: 'Review',
    emoji: '🔍',
    bgDark: 'bg-fuchsia-500/10',
    borderDark: 'border-fuchsia-500/30',
    textDark: 'text-fuchsia-400',
    dotColor: '#d946ef',
    gradient: 'from-fuchsia-500 to-pink-600'
  },
  learning: {
    id: 'learning',
    label: 'Learning',
    emoji: '📚',
    bgDark: 'bg-violet-500/10',
    borderDark: 'border-violet-500/30',
    textDark: 'text-violet-400',
    dotColor: '#8b5cf6',
    gradient: 'from-violet-500 to-indigo-600'
  },
  break: {
    id: 'break',
    label: 'Break & Rest',
    emoji: '☕',
    bgDark: 'bg-emerald-500/10',
    borderDark: 'border-emerald-500/30',
    textDark: 'text-emerald-400',
    dotColor: '#10b981',
    gradient: 'from-emerald-500 to-teal-600'
  },
  personal: {
    id: 'personal',
    label: 'Personal',
    emoji: '🌱',
    bgDark: 'bg-slate-500/10',
    borderDark: 'border-slate-500/30',
    textDark: 'text-slate-400',
    dotColor: '#64748b',
    gradient: 'from-slate-500 to-zinc-600'
  }
};
