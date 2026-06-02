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
  quizStreak: 0,
  lastLoginDate: null,
  weeklyLevelsCleared: 0,
  weeklySubjectsTouched: [],
  dailyLevelsClearedToday: 0,
  questsCompleted: 0,
};

interface UserStore {
  progress: UserProgress;
  // game events
  pendingLevelUp: number | null; // new level number, null = no pending
  pendingBadge: string | null;   // badge id
  attendanceBonusPending: boolean;
  attendanceBonusXP: number;
  // actions
  gainXP: (amount: number) => void;
  completeLevel: (levelId: string) => void;
  unlockBadge: (badgeId: string) => void;
  addStudyMinutes: (minutes: number) => void;
  recordQuizAnswer: (isCorrect: boolean) => void;
  incrementFlashcardMastered: () => void;
  touchStreak: () => void;
  resetProgress: () => void;
  // modal controls
  clearPendingLevelUp: () => void;
  clearPendingBadge: () => void;
  claimAttendanceBonus: () => void;
  dismissAttendanceBonus: () => void;
}

function calcAttendanceBonusXP(streak: number): number {
  if (streak >= 30) return 500;
  if (streak >= 14) return 200;
  if (streak >= 7)  return 100;
  if (streak >= 3)  return 30;
  return 10;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      progress: DEFAULT_PROGRESS,
      pendingLevelUp: null,
      pendingBadge: null,
      attendanceBonusPending: false,
      attendanceBonusXP: 10,

      gainXP: (amount) =>
        set((state) => {
          const prevLevel = state.progress.level;
          const updated = applyXP(state.progress, amount);
          const leveledUp = updated.level > prevLevel;
          return {
            progress: updated,
            pendingLevelUp: leveledUp ? updated.level : state.pendingLevelUp,
          };
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
            pendingBadge: badgeId,
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
        set((state) => {
          const today = new Date().toDateString();
          const lastLogin = state.progress.lastLoginDate;
          const isFirstVisitToday = lastLogin !== today;

          const updated = checkAndUpdateStreak(state.progress);
          const bonusXP = calcAttendanceBonusXP(updated.streak);

          return {
            progress: { ...updated, lastLoginDate: today },
            attendanceBonusPending: isFirstVisitToday,
            attendanceBonusXP: bonusXP,
          };
        }),

      claimAttendanceBonus: () => {
        const { attendanceBonusXP, gainXP } = get();
        gainXP(attendanceBonusXP);
        set({ attendanceBonusPending: false });
      },

      dismissAttendanceBonus: () => set({ attendanceBonusPending: false }),

      resetProgress: () =>
        set({
          progress: DEFAULT_PROGRESS,
          pendingLevelUp: null,
          pendingBadge: null,
          attendanceBonusPending: false,
          attendanceBonusXP: 10,
        }),

      clearPendingLevelUp: () => set({ pendingLevelUp: null }),
      clearPendingBadge: () => set({ pendingBadge: null }),
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
      // do not persist transient UI state
      partialize: (state) => ({ progress: state.progress }),
    }
  )
);
