'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Quest } from '@/types';
import { INITIAL_QUESTS } from '@/data/quests';

// 週番号を返す（日曜始まり）
function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // 直前の日曜に移動
  return d.toDateString();
}

interface QuestStore {
  quests: Quest[];
  claimedQuestIds: string[];
  lastQuestResetDate: string | null;
  lastWeeklyResetKey: string | null;
  touchedSubjectsThisWeek: string[]; // weekly_subjects 追跡
  updateQuestProgress: (questId: string, amount: number) => Quest | null;
  claimQuest: (questId: string) => void;
  resetDailyQuests: (today: string) => void;
  touchSubjectThisWeek: (subject: string) => boolean; // 新科目ならtrue
  initQuests: () => void;
}

export const useQuestStore = create<QuestStore>()(
  persist(
    (set, get) => ({
      quests: INITIAL_QUESTS,
      claimedQuestIds: [],
      lastQuestResetDate: null,
      lastWeeklyResetKey: null,
      touchedSubjectsThisWeek: [],

      updateQuestProgress: (questId, amount) => {
        let completedQuest: Quest | null = null;
        set((state) => {
          const quests = state.quests.map((q) => {
            if (q.id !== questId || q.isCompleted) return q;
            const newCurrent = Math.min(q.current + amount, q.target);
            const isCompleted = newCurrent >= q.target;
            const updated = { ...q, current: newCurrent, isCompleted };
            if (isCompleted) completedQuest = updated;
            return updated;
          });
          return { quests };
        });
        return completedQuest;
      },

      claimQuest: (questId) =>
        set((state) => {
          if (state.claimedQuestIds.includes(questId)) return state;
          return { claimedQuestIds: [...state.claimedQuestIds, questId] };
        }),

      resetDailyQuests: (today: string) =>
        set((state) => {
          const endOfDay = new Date();
          endOfDay.setHours(23, 59, 59, 999);
          const endOfWeekDate = new Date();
          endOfWeekDate.setDate(endOfWeekDate.getDate() + (7 - endOfWeekDate.getDay()));
          endOfWeekDate.setHours(23, 59, 59, 999);

          const thisWeekKey = getWeekKey(new Date(today));
          const isNewWeek = state.lastWeeklyResetKey !== thisWeekKey;

          const quests = state.quests.map((q) => {
            if (q.type === 'daily') {
              return { ...q, current: 0, isCompleted: false, expiresAt: endOfDay.toISOString() };
            }
            if (q.type === 'weekly' && isNewWeek) {
              return { ...q, current: 0, isCompleted: false, expiresAt: endOfWeekDate.toISOString() };
            }
            return q;
          });

          // デイリーと（新週なら）ウィークリーのクレーム状態もリセット
          const claimedQuestIds = state.claimedQuestIds.filter((id) => {
            const q = state.quests.find((qq) => qq.id === id);
            if (q?.type === 'daily') return false;
            if (q?.type === 'weekly' && isNewWeek) return false;
            return true;
          });

          return {
            quests,
            claimedQuestIds,
            lastQuestResetDate: today,
            lastWeeklyResetKey: isNewWeek ? thisWeekKey : state.lastWeeklyResetKey,
            touchedSubjectsThisWeek: isNewWeek ? [] : state.touchedSubjectsThisWeek,
          };
        }),

      // 今週初めて触った科目なら true を返し、weekly_subjects を +1
      touchSubjectThisWeek: (subject: string) => {
        const { touchedSubjectsThisWeek } = get();
        if (touchedSubjectsThisWeek.includes(subject)) return false;
        set((state) => ({
          touchedSubjectsThisWeek: [...state.touchedSubjectsThisWeek, subject],
        }));
        return true;
      },

      initQuests: () => {
        const { quests } = get();
        if (quests.length === 0) set({ quests: INITIAL_QUESTS });
      },
    }),
    {
      name: 'sharoushi_quest_quests',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return localStorage;
        return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
      }),
    }
  )
);
