'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProgress } from '@/types';
import { applyXP, checkAndUpdateStreak } from '@/lib/gameLogic';

const DEFAULT_PROGRESS: UserProgress = {
  userId: 'local_user',
  level: 1,
  totalXP: 0,
  currentXP: 0,
  xpToNextLevel: 100,
  streak: 0,
  lastStudyDate: null,
  completedLevels: [],
  unlockedBadges: [],
  totalStudyMinutes: 0,
  quizCorrectCount: 0,
  quizTotalCount: 0,
  flashcardMasteredCount: 0,
};

interface UserStore {
  progress: UserProgress;
  gainXP: (amount: number) => void;
  completeLevel: (levelId: string) => void;
  unlockBadge: (badgeId: string) => void;
  addStudyMinutes: (minutes: number) => void;
  recordQuizAnswer: (isCorrect: boolean) => void;
  incrementFlashcardMastered: () => void;
  touchStreak: () => void;
  resetProgress: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      progress: DEFAULT_PROGRESS,

      gainXP: (amount) =>
        set((state) => {
          const updated = applyXP(state.progress, amount);
          return { progress: updated };
        }),

      completeLevel: (levelId) =>
        set((state) => {
          if (state.progress.completedLevels.includes(levelId)) return state;
          return {
            progress: {
              ...state.progress,
              completedLevels: [...state.progress.completedLevels, levelId],
            },
          };
        }),

      unlockBadge: (badgeId) =>
        set((state) => {
          if (state.progress.unlockedBadges.includes(badgeId)) return state;
          return {
            progress: {
              ...state.progress,
              unlockedBadges: [...state.progress.unlockedBadges, badgeId],
            },
          };
        }),

      addStudyMinutes: (minutes) =>
        set((state) => ({
          progress: {
            ...state.progress,
            totalStudyMinutes: state.progress.totalStudyMinutes + minutes,
          },
        })),

      recordQuizAnswer: (isCorrect) =>
        set((state) => ({
          progress: {
            ...state.progress,
            quizTotalCount: state.progress.quizTotalCount + 1,
            quizCorrectCount: state.progress.quizCorrectCount + (isCorrect ? 1 : 0),
          },
        })),

      incrementFlashcardMastered: () =>
        set((state) => ({
          progress: {
            ...state.progress,
            flashcardMasteredCount: state.progress.flashcardMasteredCount + 1,
          },
        })),

      touchStreak: () =>
        set((state) => ({
          progress: checkAndUpdateStreak(state.progress),
        })),

      resetProgress: () => set({ progress: DEFAULT_PROGRESS }),
    }),
    {
      name: 'sharoushi_quest_user',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return localStorage;
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
    }
  )
);
