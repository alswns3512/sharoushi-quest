'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store/userStore';

export function useStreak() {
  const { progress, touchStreak } = useUserStore();

  useEffect(() => {
    touchStreak();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const streakMessage = (): string => {
    if (progress.streak === 0) return 'さあ、今日から始めよう！';
    if (progress.streak < 3) return `${progress.streak}日連続学習中！`;
    if (progress.streak < 7) return `🔥 ${progress.streak}日連続！調子が上がってきた！`;
    if (progress.streak < 30) return `⚡ ${progress.streak}日連続！素晴らしい継続力！`;
    return `👑 ${progress.streak}日連続！まさに勉強の鬼！`;
  };

  return {
    streak: progress.streak,
    lastStudyDate: progress.lastStudyDate,
    streakMessage: streakMessage(),
  };
}
