'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
import { useQuestStore } from '@/store/questStore';

export function useStreak() {
  const { progress, touchStreak } = useUserStore();
  const { updateQuestProgress, resetDailyQuests, lastQuestResetDate } = useQuestStore();

  useEffect(() => {
    const today = new Date().toDateString();

    // 日付が変わっていたらデイリークエストをリセット
    if (lastQuestResetDate !== today) {
      resetDailyQuests(today);
    }

    // ストリーク更新（初回訪問判定もここで行う）
    const prevLoginDate = progress.lastLoginDate;
    touchStreak();

    // 今日初めての訪問なら weekly_login を +1
    if (prevLoginDate !== today) {
      updateQuestProgress('weekly_login', 1);
    }
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
