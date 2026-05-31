export type Subject =
  | '労働基準法'
  | '労働安全衛生法'
  | '労災保険法'
  | '雇用保険法'
  | '社会保険法'
  | '健康保険法'
  | '厚生年金保険法'
  | '国民年金法'
  | '労働保険徴収法'
  | '一般常識';

export type Difficulty = 'easy' | 'normal' | 'hard';

export type QuestType = 'daily' | 'weekly' | 'achievement';

export interface UserProgress {
  userId: string;
  level: number;
  totalXP: number;
  currentXP: number;
  xpToNextLevel: number;
  streak: number;
  lastStudyDate: string | null;
  completedLevels: string[];
  unlockedBadges: string[];
  totalStudyMinutes: number;
  quizCorrectCount: number;
  quizTotalCount: number;
  flashcardMasteredCount: number;
}

export interface StudyLevel {
  id: string;
  title: string;
  description: string;
  subject: Subject;
  difficulty: Difficulty;
  xpReward: number;
  content: string;
  quiz: QuizQuestion[];
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  target: number;
  current: number;
  xpReward: number;
  isCompleted: boolean;
  expiresAt: string | null;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: BadgeCondition;
  isUnlocked: boolean;
  unlockedAt: string | null;
}

export interface BadgeCondition {
  type: 'streak' | 'level' | 'quiz_correct' | 'study_minutes' | 'flashcard_master' | 'quest_complete';
  value: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  subject: Subject;
  difficulty: Difficulty;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: Subject;
  tags: string[];
  masteryLevel: number; // 0-5
}

export interface LevelDefinition {
  level: number;
  title: string;
  xpRequired: number;
  xpToNext: number;
  reward?: string;
}

export interface StudySession {
  date: string;
  durationMinutes: number;
  xpEarned: number;
  levelsCompleted: string[];
}

export interface QuizResult {
  questionId: string;
  isCorrect: boolean;
  answeredAt: string;
}
