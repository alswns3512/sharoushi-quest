'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StudySession, QuizResult } from '@/types';

interface StudyStore {
  sessions: StudySession[];
  quizHistory: QuizResult[];
  currentSessionStart: number | null;
  startSession: () => void;
  endSession: (xpEarned: number, levelsCompleted: string[]) => StudySession;
  addQuizResult: (result: QuizResult) => void;
  getSessionsThisWeek: () => StudySession[];
  getTodayMinutes: () => number;
}

export const useStudyStore = create<StudyStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      quizHistory: [],
      currentSessionStart: null,

      startSession: () => set({ currentSessionStart: Date.now() }),

      endSession: (xpEarned, levelsCompleted) => {
        const { currentSessionStart, sessions } = get();
        const start = currentSessionStart ?? Date.now();
        const durationMinutes = Math.max(1, Math.floor((Date.now() - start) / 60000));
        const session: StudySession = {
          date: new Date().toISOString(),
          durationMinutes,
          xpEarned,
          levelsCompleted,
        };
        set({ sessions: [...sessions, session], currentSessionStart: null });
        return session;
      },

      addQuizResult: (result) =>
        set((state) => ({ quizHistory: [...state.quizHistory, result] })),

      getSessionsThisWeek: () => {
        const { sessions } = get();
        const weekAgo = new Date(Date.now() - 7 * 86400000);
        return sessions.filter((s) => new Date(s.date) >= weekAgo);
      },

      getTodayMinutes: () => {
        const { sessions } = get();
        const today = new Date().toDateString();
        return sessions
          .filter((s) => new Date(s.date).toDateString() === today)
          .reduce((sum, s) => sum + s.durationMinutes, 0);
      },
    }),
    {
      name: 'sharoushi_quest_study',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return localStorage;
        return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
      }),
    }
  )
);
