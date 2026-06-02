'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Quest } from '@/types';
import { INITIAL_QUESTS } from '@/data/quests';

interface QuestStore {
  quests: Quest[];
  claimedQuestIds: string[]; // 受け取り済みクエストID（永続）
  updateQuestProgress: (questId: string, amount: number) => Quest | null;
  claimQuest: (questId: string) => void;
  resetDailyQuests: () => void;
  initQuests: () => void;
}

export const useQuestStore = create<QuestStore>()(
  persist(
    (set, get) => ({
      quests: INITIAL_QUESTS,
      claimedQuestIds: [],

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

      resetDailyQuests: () =>
        set((state) => ({
          quests: state.quests.map((q) => {
            if (q.type !== 'daily') return q;
            const tomorrow = new Date();
            tomorrow.setHours(23, 59, 59, 999);
            return { ...q, current: 0, isCompleted: false, expiresAt: tomorrow.toISOString() };
          }),
          // デイリークエストのクレーム状態もリセット
          claimedQuestIds: state.claimedQuestIds.filter((id) => {
            const q = state.quests.find((qq) => qq.id === id);
            return q?.type !== 'daily';
          }),
        })),

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
