import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Clock, Plus, Zap, Check } from 'lucide-react';
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
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100%
  const [isTriggered, setIsTriggered] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00');
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [showRipples, setShowRipples] = useState<number[]>([]);

  // Refs for tracking state synchronously without stale closures
  const isHoldingRef = useRef(false);
  const holdProgressRef = useRef(0);
  const isTriggeredRef = useRef(false);
  const holdStartTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Keep props in refs for synchronous callback inside animation loops
  const propsRef = useRef({
    onMarkTime,
    soundEnabled,
    soundTheme,
    hapticEnabled,
    totalEventsToday
  });

  useEffect(() => {
    propsRef.current = {
      onMarkTime,
      soundEnabled,
      soundTheme,
      hapticEnabled,
      totalEventsToday
    };
  }, [onMarkTime, soundEnabled, soundTheme, hapticEnabled, totalEventsToday]);

  const HOLD_DURATION_MS = 1000; // 1-second hold requirement

  // Update real-time clock and elapsed time since last mark
  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const date = new Date(now);
      setCurrentTimeStr(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      if (lastEventTimestamp) {
        const diffMs = Math.max(0, now - lastEventTimestamp);
        setElapsedTime(formatDuration(diffMs));
      } else {
        setElapsedTime('Ready');
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lastEventTimestamp]);

  // Execute actual stamp completion when 1s hold completes
  const executeMark = () => {
    isTriggeredRef.current = true;
    isHoldingRef.current = false;
    holdProgressRef.current = 100;

    setIsTriggered(true);
    setIsHolding(false);
    setHoldProgress(100);

    // Ripple effect
    const rippleId = Date.now();
    setShowRipples((prev) => [...prev.slice(-3), rippleId]);
    setTimeout(() => {
      setShowRipples((prev) => prev.filter((id) => id !== rippleId));
    }, 1000);

    // Sensory Audio & Haptic triggers from latest props
    const { onMarkTime: triggerMark, soundEnabled: sound, soundTheme: theme, hapticEnabled: haptic, totalEventsToday: count } = propsRef.current;
    if (sound) {
      playSensorySound(theme, 1.0);
    }
    if (haptic) {
      triggerHaptic([50, 70, 50]);
    }

    // Check for milestone celebration
    if ((count + 1) % 5 === 0) {
      setTimeout(triggerMilestoneCelebration, 150);
    }

    triggerMark();

    setTimeout(() => {
      isTriggeredRef.current = false;
      holdProgressRef.current = 0;
      setIsTriggered(false);
      setHoldProgress(0);
    }, 600);
  };

  const startHold = () => {
    if (isTriggeredRef.current || isHoldingRef.current) return;

    isHoldingRef.current = true;
    holdProgressRef.current = 0;
    holdStartTimeRef.current = Date.now();

    setIsHolding(true);
    setHoldProgress(0);

    if (propsRef.current.hapticEnabled) {
      triggerHaptic([20]);
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const step = () => {
      if (!isHoldingRef.current || !holdStartTimeRef.current) return;

      const elapsed = Date.now() - holdStartTimeRef.current;
      const progress = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);

      holdProgressRef.current = progress;
      setHoldProgress(progress);

      if (elapsed >= HOLD_DURATION_MS) {
        holdStartTimeRef.current = null;
        executeMark();
      } else {
        animationFrameRef.current = requestAnimationFrame(step);
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);
  };

  const cancelHold = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (isTriggeredRef.current) return;

    isHoldingRef.current = false;
    holdStartTimeRef.current = null;
    holdProgressRef.current = 0;

    setIsHolding(false);
    setHoldProgress(0);
  };

  // Keyboard accessibility: hold spacebar
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
        startHold();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        cancelHold();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Set up pointer capture so holding never loses focus even if finger/mouse moves slightly
  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return; // only left click
      try {
        btn.setPointerCapture(e.pointerId);
      } catch {}
      startHold();
    };

    const onPointerUp = (e: PointerEvent) => {
      try {
        if (btn.hasPointerCapture(e.pointerId)) {
          btn.releasePointerCapture(e.pointerId);
        }
      } catch {}
      cancelHold();
    };

    const onPointerCancel = (e: PointerEvent) => {
      try {
        if (btn.hasPointerCapture(e.pointerId)) {
          btn.releasePointerCapture(e.pointerId);
        }
      } catch {}
      cancelHold();
    };

    btn.addEventListener('pointerdown', onPointerDown);
    btn.addEventListener('pointerup', onPointerUp);
    btn.addEventListener('pointercancel', onPointerCancel);

    return () => {
      btn.removeEventListener('pointerdown', onPointerDown);
      btn.removeEventListener('pointerup', onPointerUp);
      btn.removeEventListener('pointercancel', onPointerCancel);
    };
  }, []);

  // Circular gauge calculations (circumference for radius = 96)
  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  // Offset decreases from circumference to 0 as progress goes from 0 to 100
  const strokeDashoffset = circumference - (holdProgress / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center pt-2 pb-6 px-4">
      {/* Background radial glow */}
      <div className={`
        absolute w-72 h-72 rounded-full blur-3xl pointer-events-none -z-10 transition-all duration-300
        ${isHolding ? 'bg-amber-500/40 scale-125' : 'bg-gradient-to-tr from-amber-500/20 via-orange-500/15 to-indigo-500/15'}
      `} />

      {/* Outer container */}
      <div className="relative flex items-center justify-center">
        {/* Subtle background radar ring */}
        <div className="absolute -inset-4 rounded-full border border-amber-500/15 animate-ping opacity-25 pointer-events-none" style={{ animationDuration: '3.5s' }} />
        
        {/* Ripples triggered by marks */}
        {showRipples.map((id) => (
          <span
            key={id}
            className="absolute rounded-full border-2 border-amber-400/80 animate-ping pointer-events-none inset-0"
            style={{ animationDuration: '0.8s' }}
          />
        ))}

        {/* Circular SVG 1-Second Hold Progress Gauge */}
        <svg 
          className="absolute w-[214px] h-[214px] sm:w-[246px] sm:h-[246px] -rotate-90 pointer-events-none z-20"
          viewBox="0 0 208 208"
        >
          {/* Track ring */}
          <circle
            cx="104"
            cy="104"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-amber-500/20 dark:text-amber-500/25"
          />
          {/* Animated 1-second filling stroke */}
          <circle
            cx="104"
            cy="104"
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: isHolding ? 'none' : 'stroke-dashoffset 200ms ease-out'
            }}
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="60%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>

        {/* The Main Tactile Hold Button */}
        <button
          ref={buttonRef}
          type="button"
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Hold 1 second to mark timeline"
          className={`
            relative group flex flex-col items-center justify-center
            w-48 h-48 sm:w-56 sm:h-56 rounded-full
            transition-all duration-150 select-none touch-none
            cursor-pointer focus:outline-none
            ${isTriggered ? 'scale-95 ring-4 ring-emerald-400/80' : isHolding ? 'scale-[0.98] ring-2 ring-amber-400' : 'hover:scale-[1.02]'}
          `}
          style={{
            background: 'radial-gradient(130% 130% at 30% 20%, #1e293b 0%, #0f172a 45%, #020617 100%)',
            boxShadow: isHolding || isTriggered
              ? 'inset 0 4px 14px rgba(0,0,0,0.9), 0 0 35px rgba(245, 158, 11, 0.6)' 
              : '0 20px 40px -10px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.1), 0 0 35px rgba(245, 158, 11, 0.25)'
          }}
        >
          {/* Glowing gradient rim */}
          <div className={`
            absolute inset-0 rounded-full p-[2px] bg-gradient-to-b from-amber-400 via-orange-500 to-indigo-600 transition-opacity duration-200
            ${isHolding ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}
          `}>
            <div className="w-full h-full rounded-full bg-slate-950/80 backdrop-blur-sm" />
          </div>

          {/* Inner metallic chamber */}
          <div className="absolute inset-3 rounded-full bg-gradient-to-b from-slate-800/80 to-slate-950/90 border border-slate-700/50 flex flex-col items-center justify-center p-4 text-center shadow-inner overflow-hidden">
            
            {/* Ambient shimmer light */}
            <div className="absolute -top-10 left-1/4 w-32 h-16 bg-white/10 rounded-full blur-lg pointer-events-none transform -rotate-12" />

            {/* Core Icon & Animation */}
            <div className="relative mb-1 flex items-center justify-center">
              <div className={`
                w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200
                ${isTriggered 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/50 scale-125' 
                  : isHolding
                  ? 'bg-gradient-to-tr from-amber-500 to-orange-500 scale-110 shadow-amber-500/50'
                  : 'bg-gradient-to-tr from-amber-500 to-orange-500 shadow-amber-500/30'
                }
              `}>
                {isTriggered ? (
                  <Check className="w-7 h-7 stroke-[3]" />
                ) : (
                  <Plus className="w-7 h-7 text-slate-950 stroke-[3]" />
                )}
              </div>
              
              {!isTriggered && (
                <span className="absolute -top-1 -right-2 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
              )}
            </div>

            {/* Hold Status / Title */}
            <span className={`
              font-extrabold tracking-wider text-base sm:text-lg uppercase transition-colors
              ${isTriggered ? 'text-emerald-400' : isHolding ? 'text-amber-300' : 'text-white'}
            `}>
              {isTriggered ? 'MARKED!' : isHolding ? 'HOLDING...' : 'MARK TIME'}
            </span>

            {/* Live Clock */}
            <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-200/80 font-mono font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '12s' }} />
              <span>{currentTimeStr || '--:--:--'}</span>
            </div>

            {/* 1-second hold prompt badge with live percentage / cue */}
            <div className="mt-2 px-2.5 py-0.5 rounded-full bg-slate-800/90 border border-slate-700/60 text-[10px] font-medium transition-colors">
              {isHolding ? (
                <span className="text-amber-300 font-mono font-bold">
                  {Math.round(holdProgress)}% (Hold 1s)
                </span>
              ) : (
                <span className="text-slate-300">
                  Hold 1 sec to mark
                </span>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Running interval pill */}
      <div className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm text-xs text-slate-700 dark:text-slate-300 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${lastEventTimestamp ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-500'}`} />
          <span className="text-slate-500 dark:text-slate-400 font-medium">Current interval:</span>
        </div>
        <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
          {elapsedTime}
        </span>
        {lastEventTimestamp && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 border-l border-slate-200 dark:border-slate-800 pl-2">
            active block
          </span>
        )}
      </div>
    </div>
  );
};
