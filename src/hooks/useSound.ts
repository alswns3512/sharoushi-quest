'use client';

import { useCallback, useRef } from 'react';

type SoundType = 'correct' | 'wrong' | 'levelup' | 'complete' | 'click';

const FREQUENCIES: Record<SoundType, number[]> = {
  correct: [523, 659, 784],
  wrong: [300, 250],
  levelup: [523, 659, 784, 1047],
  complete: [784, 880, 988, 1047],
  click: [800],
};

export function useSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new AudioContext();
      } catch {
        return null;
      }
    }
    return audioCtxRef.current;
  }, []);

  const play = useCallback(
    (type: SoundType) => {
      const ctx = getCtx();
      if (!ctx) return;
      const freqs = FREQUENCIES[type];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type === 'wrong' ? 'sawtooth' : 'sine';
        osc.frequency.value = freq;
        const startTime = ctx.currentTime + i * 0.1;
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    },
    [getCtx]
  );

  return { play };
}
