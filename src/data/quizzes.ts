import { STUDY_LEVELS } from '@/data/levels';
import { EXAM_QUESTIONS } from '@/data/exam-questions';
import { EXAM_QUESTIONS_2 } from '@/data/exam-questions-2';
import type { QuizQuestion } from '@/types';

/** 全レベルのクイズをフラットに展開したもの（クイズチャレンジ画面で使用） */
export type QuizWithLevel = QuizQuestion & { levelId: number };

export const ALL_QUIZZES: QuizWithLevel[] = [
  ...STUDY_LEVELS.flatMap((level) =>
    level.quiz.map((q) => ({ ...q, levelId: level.levelNumber }))
  ),
  ...EXAM_QUESTIONS.map((q) => ({ ...q, levelId: 0 })),
  ...EXAM_QUESTIONS_2.map((q) => ({ ...q, levelId: 0 })),
];

/** 科目別に絞り込むユーティリティ */
export function getQuizzesBySubject(subject: string): QuizWithLevel[] {
  return ALL_QUIZZES.filter((q) => q.subject === subject);
}

/** 難易度別に絞り込むユーティリティ */
export function getQuizzesByDifficulty(difficulty: QuizQuestion['difficulty']): QuizWithLevel[] {
  return ALL_QUIZZES.filter((q) => q.difficulty === difficulty);
}

/** ランダムに n 問取得するユーティリティ */
export function getRandomQuizzes(n: number): QuizWithLevel[] {
  const shuffled = [...ALL_QUIZZES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

/** レベル範囲でクイズを取得するユーティリティ */
export function getQuizzesByLevelRange(from: number, to: number): QuizWithLevel[] {
  return ALL_QUIZZES.filter((q) => q.levelId >= from && q.levelId <= to);
}
