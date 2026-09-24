import confetti from 'canvas-confetti';

// Audio Context Singleton for low-latency Web Audio API
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export type SoundTheme = 'tactile-click' | 'zen-bell' | 'marimba' | 'cyber-drop';

/**
 * Play a high-fidelity synthetic sound effect with zero external network dependencies
 */
export function playSensorySound(theme: SoundTheme = 'tactile-click', pitchMod = 1.0) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (theme) {
      case 'tactile-click': {
        // High quality tactile mechanical switch click
        // 1. Initial click impulse
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(1400 * pitchMod, now);
        osc1.frequency.exponentialRampToValueAtTime(120 * pitchMod, now + 0.035);
        gain1.gain.setValueAtTime(0.7, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.05);

        // 2. Body resonance
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(320 * pitchMod, now);
        osc2.frequency.exponentialRampToValueAtTime(60, now + 0.06);
        gain2.gain.setValueAtTime(0.5, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.08);
        break;
      }

      case 'zen-bell': {
        // Singing bell / Tibetan singing bowl chime with harmonics
        const freqs = [528 * pitchMod, 1056 * pitchMod, 1584 * pitchMod];
        const decays = [1.2, 0.8, 0.5];
        const amps = [0.4, 0.2, 0.1];

        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(amps[idx], now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + decays[idx]);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + decays[idx]);
        });
        break;
      }

      case 'marimba': {
        // Warm organic marimba wood strike
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660 * pitchMod, now);
        osc.frequency.exponentialRampToValueAtTime(330 * pitchMod, now + 0.12);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }

      case 'cyber-drop': {
        // High-tech droplet confirmation
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440 * pitchMod, now);
        osc.frequency.exponentialRampToValueAtTime(1760 * pitchMod, now + 0.08);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.24);
        break;
      }
    }
  } catch {
    // Audio context may be restricted by browser policy before first user gesture
  }
}

/**
 * Trigger physical haptic vibration feedback on compatible mobile devices
 */
export function triggerHaptic(pattern: number[] = [25, 35, 30]) {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Silent fail if vibration permissions are disabled
  }
}

/**
 * Celebrate major focus achievements or event milestone
 */
export function triggerMilestoneCelebration() {
  try {
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#f59e0b', '#ec4899', '#6366f1', '#10b981'],
      disableForReducedMotion: true
    });
  } catch {
    // Ignore confetti errors
  }
}
