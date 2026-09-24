import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  BarChart3, 
  Settings, 
  User as UserIcon, 
  Cloud, 
  Wifi, 
  WifiOff,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { formatDateLabel } from '../utils/date';
import type { User } from '../services/firebase';

interface HeaderProps {
  selectedDate: string;
  isToday: boolean;
  onPrevDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onOpenCalendar: () => void;
  onOpenInsights: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  isOnline: boolean;
  user: User | null;
  hasUnsyncedChanges: boolean;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedDate,
  isToday,
  onPrevDay,
  onNextDay,
  onToday,
  onOpenCalendar,
  onOpenInsights,
  onOpenSettings,
  onOpenAuth,
  isOnline,
  user,
  canInstallPwa,
  onInstallPwa,
  darkMode = true,
  onToggleDarkMode
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-3 sm:px-6 py-3 transition-colors shadow-xs">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Left: Brand Identity & Sync status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 p-[1.5px] flex items-center justify-center shadow-lg shadow-amber-500/20">
              <div className="w-full h-full rounded-[10px] bg-slate-900 dark:bg-slate-950 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base sm:text-lg">
                  ChronoMark
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">
                  Focus
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {isOnline ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Wifi className="w-3 h-3" />
                    <span className="hidden sm:inline">Online</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <WifiOff className="w-3 h-3" />
                    <span>Offline PWA</span>
                  </span>
                )}
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                  {user ? (user.isAnonymous ? 'Guest Sync' : 'Cloud Connected') : 'Local Storage'}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Right Action Icons */}
          <div className="flex md:hidden items-center gap-1">
            {onToggleDarkMode && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              </button>
            )}
            <button
              type="button"
              onClick={onOpenCalendar}
              title="Open Calendar"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenInsights}
              title="Productivity Insights"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              title="Settings"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenAuth}
              className="p-1 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-7 h-7 rounded-full border border-amber-400/60" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Center: Interactive Day Selector */}
        <div className="flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 self-center">
          <button
            type="button"
            onClick={onPrevDay}
            title="Previous Day"
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenCalendar}
            className="flex items-center gap-2 px-3 py-1 rounded-xl hover:bg-slate-200/80 dark:hover:bg-slate-800/80 transition cursor-pointer"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
              {formatDateLabel(selectedDate)}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
              ({selectedDate})
            </span>
          </button>

          <button
            type="button"
            onClick={onNextDay}
            title="Next Day"
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              type="button"
              onClick={onToday}
              className="ml-1 px-2.5 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[11px] font-semibold text-amber-600 dark:text-amber-300 transition cursor-pointer"
            >
              Today
            </button>
          )}
        </div>

        {/* Right: Desktop Controls (Insights, Settings, Auth, Theme) */}
        <div className="hidden md:flex items-center gap-2">
          {canInstallPwa && onInstallPwa && (
            <button
              type="button"
              onClick={onInstallPwa}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20 cursor-pointer animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          {/* Direct Dark/Light mode switch */}
          {onToggleDarkMode && (
            <button
              type="button"
              onClick={onToggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCalendar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Calendar</span>
          </button>

          <button
            type="button"
            onClick={onOpenInsights}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Insights</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            title="Preferences & Audio"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-6 h-6 rounded-full border border-amber-400" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
            )}
            <span>{user ? (user.displayName ? user.displayName.split(' ')[0] : 'Account') : 'Sign In'}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
