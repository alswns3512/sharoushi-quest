'use client';

import { useCallback, useState } from 'react';
import { useUserStore } from '@/store/userStore';

interface XPGainResult {
  gained: number;
  leveledUp: boolean;
  newLevel: number;
}

export function useXP() {
  const { progress, gainXP } = useUserStore();
  const [lastGain, setLastGain] = useState<XPGainResult | null>(null);

  const addXP = useCallback(
    (amount: number): XPGainResult => {
      const prevLevel = progress.level;
      gainXP(amount);
      const newProgress = useUserStore.getState().progress;
      const result: XPGainResult = {
        gained: amount,
        leveledUp: newProgress.level > prevLevel,
        newLevel: newProgress.level,
      };
      setLastGain(result);
      return result;
    },
    [progress.level, gainXP]
  );

  const xpPercent = progress.xpToNextLevel > 0
    ? Math.min(100, Math.floor((progress.currentXP / progress.xpToNextLevel) * 100))
    : 100;

  return {
    level: progress.level,
    currentXP: progress.currentXP,
    xpToNextLevel: progress.xpToNextLevel,
    totalXP: progress.totalXP,
    xpPercent,
    addXP,
    lastGain,
  };
}
