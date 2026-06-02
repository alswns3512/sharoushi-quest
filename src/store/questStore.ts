'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Quest } from '@/types';
import { INITIAL_QUESTS } from '@/data/quests';

interface QuestStore {
  quests: Quest[];
  claimedQuestIds: string[];
  lastQuestResetDate: string | null;
  updateQuestProgress: (questId: string, amount: number) => Quest | null;
  claimQuest: (questId: string) => void;
  resetDailyQuests: (today: string) => void;
  initQuests: () => void;
}

export const useQuestStore = create<QuestStore>()(
  persist(
    (set, get) => ({
      quests: INITIAL_QUESTS,
      claimedQuestIds: [],
      lastQuestResetDate: null,

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

      // 日付が変わった時に呼ばれる — デイリークエストのみリセット
      resetDailyQuests: (today: string) =>
        set((state) => {
          const endOfDay = new Date();
          endOfDay.setHours(23, 59, 59, 999);

          const quests = state.quests.map((q) => {
            if (q.type !== 'daily') return q;
            return { ...q, current: 0, isCompleted: false, expiresAt: endOfDay.toISOString() };
          });

          // デイリークエストのクレーム状態もリセット
          const claimedQuestIds = state.claimedQuestIds.filter((id) => {
            const q = state.quests.find((qq) => qq.id === id);
            return q?.type !== 'daily';
          });

          return { quests, claimedQuestIds, lastQuestResetDate: today };
        }),

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
