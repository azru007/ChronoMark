import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Plus, Zap } from 'lucide-react';
import { playSensorySound, triggerHaptic, triggerMilestoneCelebration, type SoundTheme } from '../utils/sensory';
import { formatDuration } from '../utils/date';

interface BigMarkButtonProps {
  onMarkTime: (note?: string) => void;
  lastEventTimestamp?: number;
  soundEnabled: boolean;
  soundTheme: SoundTheme;
  hapticEnabled: boolean;
  totalEventsToday: number;
}

export const BigMarkButton: React.FC<BigMarkButtonProps> = ({
  onMarkTime,
  lastEventTimestamp,
  soundEnabled,
  soundTheme,
  hapticEnabled,
  totalEventsToday
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [showRipples, setShowRipples] = useState<number[]>([]);

  // Update real-time clock and elapsed time since last mark
  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const date = new Date(now);
      setCurrentTimeStr(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      if (lastEventTimestamp) {
        const diffMs = Math.max(0, now - lastEventTimestamp);
        setElapsedSeconds(Math.floor(diffMs / 1000));
        setElapsedTime(formatDuration(diffMs));
      } else {
        setElapsedSeconds(0);
        setElapsedTime('Ready');
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lastEventTimestamp]);

  // Handle keyboard shortcut (Spacebar or Enter when not typing in an input/textarea)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable ||
        e.repeat
      ) {
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [soundEnabled, soundTheme, hapticEnabled, totalEventsToday, onMarkTime]);

  const handleClick = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 240);

    // Ripple effect
    const rippleId = Date.now();
    setShowRipples((prev) => [...prev.slice(-3), rippleId]);
    setTimeout(() => {
      setShowRipples((prev) => prev.filter((id) => id !== rippleId));
    }, 1000);

    // Sensory Audio & Haptic triggers
    if (soundEnabled) {
      playSensorySound(soundTheme, 1.0);
    }
    if (hapticEnabled) {
      triggerHaptic([30, 40, 20]);
    }

    // Check for milestone celebration (e.g. 5th, 10th, or 15th mark)
    if ((totalEventsToday + 1) % 5 === 0) {
      setTimeout(triggerMilestoneCelebration, 150);
    }

    onMarkTime();
  };

  return (
    <div className="relative flex flex-col items-center justify-center pt-2 pb-6 px-4">
      {/* Background radial glow */}
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-amber-500/20 via-orange-500/15 to-indigo-500/15 blur-3xl pointer-events-none -z-10 animate-pulse" />

      {/* Outer subtle concentric radar rings */}
      <div className="relative flex items-center justify-center">
        <div className="absolute -inset-4 rounded-full border border-amber-500/15 animate-ping opacity-25 pointer-events-none" style={{ animationDuration: '3.5s' }} />
        <div className="absolute -inset-8 rounded-full border border-orange-500/10 pointer-events-none" />

        {/* Ripples triggered by clicks */}
        {showRipples.map((id) => (
          <span
            key={id}
            className="absolute rounded-full border-2 border-amber-400/60 animate-ping pointer-events-none inset-0"
            style={{ animationDuration: '0.8s' }}
          />
        ))}

        {/* The Main Tactile Button */}
        <button
          type="button"
          onClick={handleClick}
          aria-label="Mark timeline at this moment"
          className={`
            relative group flex flex-col items-center justify-center
            w-48 h-48 sm:w-56 sm:h-56 rounded-full
            transition-all duration-300 ease-out select-none
            cursor-pointer focus:outline-none focus:ring-4 focus:ring-amber-500/30
            ${isPressed ? 'scale-95 shadow-inner' : 'hover:scale-[1.03] active:scale-95'}
          `}
          style={{
            background: 'radial-gradient(130% 130% at 30% 20%, #1e293b 0%, #0f172a 45%, #020617 100%)',
            boxShadow: isPressed 
              ? 'inset 0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(245, 158, 11, 0.4)' 
              : '0 20px 40px -10px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.1), 0 0 35px rgba(245, 158, 11, 0.25)'
          }}
        >
          {/* Glowing gradient rim */}
          <div className="absolute inset-0 rounded-full p-[2px] bg-gradient-to-b from-amber-400 via-orange-500 to-indigo-600 opacity-80 group-hover:opacity-100 transition-opacity">
            <div className="w-full h-full rounded-full bg-slate-950/80 backdrop-blur-sm" />
          </div>

          {/* Inner metallic chamber */}
          <div className="absolute inset-3 rounded-full bg-gradient-to-b from-slate-800/80 to-slate-950/90 border border-slate-700/50 flex flex-col items-center justify-center p-4 text-center shadow-inner overflow-hidden">
            
            {/* Ambient shimmer light */}
            <div className="absolute -top-10 left-1/4 w-32 h-16 bg-white/10 rounded-full blur-lg pointer-events-none transform -rotate-12" />

            {/* Core Icon & Micro Badge */}
            <div className="relative mb-1 flex items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-300">
                <Plus className="w-7 h-7 text-slate-950 stroke-[3]" />
              </div>
              <span className="absolute -top-1 -right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </div>

            {/* Magnetic Action Title */}
            <span className="font-extrabold tracking-wider text-base sm:text-lg text-white group-hover:text-amber-300 transition-colors uppercase">
              MARK TIME
            </span>

            {/* Live Clock / Subtext */}
            <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-200/80 font-mono font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '12s' }} />
              <span>{currentTimeStr || '--:--:--'}</span>
            </div>

            {/* Quick Helper Badge */}
            <div className="mt-2 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[10px] text-slate-400 font-medium">
              Spacebar to tap
            </div>
          </div>
        </button>
      </div>

      {/* Running interval pill */}
      <div className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 shadow-sm text-xs text-slate-300 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${lastEventTimestamp ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-slate-400 font-medium">Current interval:</span>
        </div>
        <span className="font-mono font-semibold text-amber-400">
          {elapsedTime}
        </span>
        {lastEventTimestamp && (
          <span className="text-[10px] text-slate-500 border-l border-slate-800 pl-2">
            active block
          </span>
        )}
      </div>
    </div>
  );
};
