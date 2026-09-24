import React from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  Moon, 
  Sun, 
  Clock, 
  Smartphone,
  Sparkles,
  Download
} from 'lucide-react';
import type { AppSettings } from '../types';
import { playSensorySound, triggerHaptic, type SoundTheme } from '../utils/sensory';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  canInstallPwa,
  onInstallPwa
}) => {
  if (!isOpen) return null;

  const handleTestSound = (theme: SoundTheme) => {
    playSensorySound(theme);
    if (settings.hapticEnabled) {
      triggerHaptic([25, 40]);
    }
  };

  const soundOptions: { id: SoundTheme; label: string; desc: string }[] = [
    { id: 'tactile-click', label: 'Tactile Switch', desc: 'Mechanical micro-click with crisp snap' },
    { id: 'zen-bell', label: 'Zen Bell', desc: 'Tibetan singing bowl with warm harmonics' },
    { id: 'marimba', label: 'Marimba Wood', desc: 'Organic resonant acoustic strike' },
    { id: 'cyber-drop', label: 'Cyber Drop', desc: 'Futuristic confirmation droplet' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Sensory & Preferences
              </h2>
              <p className="text-xs text-slate-400">
                Audio haptics, theme, and display preferences
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

        {/* Options List */}
        <div className="overflow-y-auto flex-1 py-4 space-y-4">
          {/* Theme Mode */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2.5">
              {settings.darkMode ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
              <div>
                <p className="text-xs font-semibold text-white">Dark Mode</p>
                <p className="text-[11px] text-slate-400">Nighttime focus palette</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ darkMode: !settings.darkMode })}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                settings.darkMode ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-slate-950 shadow-md" />
            </button>
          </div>

          {/* Sound Feedback Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-amber-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <div>
                  <p className="text-xs font-semibold text-white">Acoustic Feedback</p>
                  <p className="text-[11px] text-slate-400">Offline synthesized audio triggers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !settings.soundEnabled;
                  onUpdateSettings({ soundEnabled: nextVal });
                  if (nextVal) handleTestSound(settings.soundTheme);
                }}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.soundEnabled ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-slate-950 shadow-md" />
              </button>
            </div>

            {settings.soundEnabled && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Sound Tone
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {soundOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onUpdateSettings({ soundTheme: opt.id });
                        handleTestSound(opt.id);
                      }}
                      className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                        settings.soundTheme === opt.id
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <p className="text-xs font-semibold">{opt.label}</p>
                      <p className="text-[10px] text-slate-400 truncate">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Haptic Vibration */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Vibrate className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-semibold text-white">Haptic Vibration</p>
                <p className="text-[11px] text-slate-400">Tactile motor impulses on touch</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !settings.hapticEnabled;
                onUpdateSettings({ hapticEnabled: nextVal });
                if (nextVal) triggerHaptic([30, 40]);
              }}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                settings.hapticEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-slate-950 shadow-md" />
            </button>
          </div>

          {/* 24-hour clock display */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-sky-400" />
              <div>
                <p className="text-xs font-semibold text-white">24-Hour Time Format</p>
                <p className="text-[11px] text-slate-400">e.g. 14:30 vs 02:30 PM</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ timeFormat24h: !settings.timeFormat24h })}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                settings.timeFormat24h ? 'bg-sky-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-slate-950 shadow-md" />
            </button>
          </div>

          {/* PWA Offline Installation */}
          {canInstallPwa && onInstallPwa && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-xs font-bold text-white">Install App (PWA)</p>
                  <p className="text-[11px] text-slate-300">Run as native offline desktop/mobile app</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onInstallPwa}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Install
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
