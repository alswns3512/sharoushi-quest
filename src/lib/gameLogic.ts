import type { LevelDefinition, UserProgress } from '@/types';

export const XP_BASE = 100;
export const XP_MULTIPLIER = 1.15;

export function calcXPForLevel(level: number): number {
  return Math.floor(XP_BASE * Math.pow(XP_MULTIPLIER, level - 1));
}

export function getLevelFromTotalXP(totalXP: number): { level: number; currentXP: number; xpToNextLevel: number } {
  let level = 1;
  let accumulated = 0;
  while (true) {
    const needed = calcXPForLevel(level);
    if (accumulated + needed > totalXP) {
      return { level, currentXP: totalXP - accumulated, xpToNextLevel: needed };
    }
    accumulated += needed;
    level++;
    if (level > 100) {
      return { level: 100, currentXP: 0, xpToNextLevel: 0 };
    }
  }
}

export function generateLevelDefinitions(): LevelDefinition[] {
  const defs: LevelDefinition[] = [];
  for (let i = 1; i <= 100; i++) {
    const xpToNext = calcXPForLevel(i);
    let xpRequired = 0;
    for (let j = 1; j < i; j++) xpRequired += calcXPForLevel(j);
    defs.push({ level: i, title: getLevelTitle(i), xpRequired, xpToNext });
  }
  return defs;
}

function getLevelTitle(level: number): string {
  if (level <= 5) return '見習い書生';
  if (level <= 10) return '書生';
  if (level <= 20) return '学習者';
  if (level <= 30) return '修行者';
  if (level <= 40) return '学徒';
  if (level <= 50) return '研究生';
  if (level <= 60) return '準有段者';
  if (level <= 70) return '有段者';
  if (level <= 80) return '上級者';
  if (level <= 90) return '達人';
  return '社労士の覚者';
}

export function calcStreakBonus(streak: number): number {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.5;
  if (streak >= 7) return 1.3;
  if (streak >= 3) return 1.1;
  return 1.0;
}

export function applyXP(progress: UserProgress, xpGained: number): UserProgress {
  const bonusMultiplier = calcStreakBonus(progress.streak);
  const finalXP = Math.floor(xpGained * bonusMultiplier);
  const newTotalXP = progress.totalXP + finalXP;
  const { level, currentXP, xpToNextLevel } = getLevelFromTotalXP(newTotalXP);
  return { ...progress, totalXP: newTotalXP, level, currentXP, xpToNextLevel };
}

export function checkAndUpdateStreak(progress: UserProgress): UserProgress {
  const today = new Date().toDateString();
  if (progress.lastStudyDate === today) return progress;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const newStreak = progress.lastStudyDate === yesterday ? progress.streak + 1 : 1;
  // 日付が変わったら1日のレベルクリア数をリセット
  return { ...progress, streak: newStreak, lastStudyDate: today, dailyLevelsClearedToday: 0 };
}

// ── バッジ解除チェック ────────────────────────────────────────
// レベルクリア・ログイン・クイズ正解後に呼ぶ
export function checkAndUnlockBadges(
  progress: UserProgress,
  unlockBadge: (id: string) => void,
): void {
  const unlocked = new Set(progress.unlockedBadges);
  const tryUnlock = (id: string) => { if (!unlocked.has(id)) unlockBadge(id); };

  const hour = new Date().getHours();
  const completedCount = progress.completedLevels.length;

  // 初回ログイン
  tryUnlock('badge_first_login');

  // ストリーク
  if (progress.streak >= 3)  tryUnlock('badge_streak_3');
  if (progress.streak >= 7)  tryUnlock('badge_streak_7');

  // クリアステージ数
  if (completedCount >= 10) tryUnlock('badge_level10_clear');
  if (completedCount >= 20) tryUnlock('badge_level20_clear');
  if (completedCount >= 30) tryUnlock('badge_level30_clear');

  // 時間帯
  if (hour >= 22) tryUnlock('badge_night_study');
  if (hour < 6)   tryUnlock('badge_morning_study');

  // クイズ連続正解
  if (progress.quizStreak >= 10) tryUnlock('badge_quiz_streak_10');

  // 1日に3レベルクリア
  if (progress.dailyLevelsClearedToday >= 3) tryUnlock('badge_speed_3');
}
