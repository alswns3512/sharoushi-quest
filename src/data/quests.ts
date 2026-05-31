import type { Quest } from '@/types';

function tomorrowISO(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function nextWeekISO(): string {
  const d = new Date(Date.now() + 7 * 86400000);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'daily_study',
    title: '今日も学ぼう！',
    description: '今日の学習ステージを1つクリアする',
    type: 'daily',
    target: 1,
    current: 0,
    xpReward: 30,
    isCompleted: false,
    expiresAt: tomorrowISO(),
  },
  {
    id: 'daily_quiz',
    title: 'クイズチャレンジ',
    description: 'クイズを3問正解する',
    type: 'daily',
    target: 3,
    current: 0,
    xpReward: 50,
    isCompleted: false,
    expiresAt: tomorrowISO(),
  },
  {
    id: 'daily_flashcard',
    title: '単語の達人',
    description: 'フラッシュカードを5枚復習する',
    type: 'daily',
    target: 5,
    current: 0,
    xpReward: 30,
    isCompleted: false,
    expiresAt: tomorrowISO(),
  },
  {
    id: 'weekly_streak',
    title: '週間連続学習',
    description: '今週7日間連続で学習する',
    type: 'weekly',
    target: 7,
    current: 0,
    xpReward: 200,
    isCompleted: false,
    expiresAt: nextWeekISO(),
  },
  {
    id: 'weekly_quiz_master',
    title: 'クイズマスター',
    description: '今週20問のクイズに正解する',
    type: 'weekly',
    target: 20,
    current: 0,
    xpReward: 150,
    isCompleted: false,
    expiresAt: nextWeekISO(),
  },
  {
    id: 'achieve_first_level',
    title: 'はじめの一歩',
    description: '最初の学習ステージをクリアする',
    type: 'achievement',
    target: 1,
    current: 0,
    xpReward: 100,
    isCompleted: false,
    expiresAt: null,
  },
  {
    id: 'achieve_10_quiz',
    title: 'クイズ入門',
    description: 'クイズを合計10問正解する',
    type: 'achievement',
    target: 10,
    current: 0,
    xpReward: 100,
    isCompleted: false,
    expiresAt: null,
  },
  {
    id: 'achieve_level5',
    title: 'レベル5達成',
    description: 'レベル5に到達する',
    type: 'achievement',
    target: 5,
    current: 1,
    xpReward: 300,
    isCompleted: false,
    expiresAt: null,
  },
];
