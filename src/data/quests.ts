import type { Quest } from '@/types';

function endOfToday(): string {
  const d = new Date(); d.setHours(23, 59, 59, 999); return d.toISOString();
}
function endOfWeek(): string {
  const d = new Date();
  d.setDate(d.getDate() + (7 - d.getDay()));
  d.setHours(23, 59, 59, 999); return d.toISOString();
}

export const INITIAL_QUESTS: Quest[] = [
  // ── デイリー ──────────────────────────────────────────
  {
    id: 'daily_level',
    title: '今日も一歩前へ',
    description: '今日の学習ステージを1つクリアする',
    type: 'daily', target: 1, current: 0, xpReward: 50,
    isCompleted: false, expiresAt: endOfToday(),
  },
  {
    id: 'daily_quiz',
    title: '3問正解',
    description: 'クイズを3問正解する',
    type: 'daily', target: 3, current: 0, xpReward: 30,
    isCompleted: false, expiresAt: endOfToday(),
  },
  {
    id: 'daily_flashcard',
    title: 'フラッシュカード5枚',
    description: 'フラッシュカードを5枚復習する',
    type: 'daily', target: 5, current: 0, xpReward: 20,
    isCompleted: false, expiresAt: endOfToday(),
  },

  // ── ウィークリー ──────────────────────────────────────
  {
    id: 'weekly_login',
    title: '週5日出席',
    description: '今週5日間ログインして学習する',
    type: 'weekly', target: 5, current: 0, xpReward: 200,
    isCompleted: false, expiresAt: endOfWeek(),
  },
  {
    id: 'weekly_levels',
    title: '10レベル突破',
    description: '今週10レベル分の学習をクリアする',
    type: 'weekly', target: 10, current: 0, xpReward: 300,
    isCompleted: false, expiresAt: endOfWeek(),
  },
  {
    id: 'weekly_subjects',
    title: '全科目タッチ',
    description: '今週3科目以上の学習をする',
    type: 'weekly', target: 3, current: 0, xpReward: 150,
    isCompleted: false, expiresAt: endOfWeek(),
  },

  // ── ストーリー（一度きり） ────────────────────────────
  {
    id: 'story_first_step',
    title: '社労士への第一歩',
    description: 'Level 1をクリアする',
    type: 'story', target: 1, current: 0, xpReward: 100,
    badgeReward: 'badge_first_login',
    isCompleted: false, expiresAt: null,
  },
  {
    id: 'story_intro_complete',
    title: '社会人の教科書',
    description: 'Level 1〜10をすべてクリアする',
    type: 'story', target: 10, current: 0, xpReward: 500,
    badgeReward: 'badge_level10_clear',
    isCompleted: false, expiresAt: null,
  },
  {
    id: 'story_sharoushi_complete',
    title: '社労士を知った日',
    description: 'Level 11〜20をすべてクリアする',
    type: 'story', target: 20, current: 0, xpReward: 800,
    badgeReward: 'badge_level20_clear',
    isCompleted: false, expiresAt: null,
  },
];
