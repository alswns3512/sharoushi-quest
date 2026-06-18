export type LevelSubject =
  | 'intro'
  | 'sharoushi'
  | 'rodo'
  | 'anzen'
  | 'rousai'
  | 'koyo'
  | 'kenko'
  | 'nenkin';

// Legacy alias kept for quizzes / flashcards
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
  | '一般常識'
  | '超入門'
  | '社労士入門';

export type Difficulty = 'easy' | 'normal' | 'hard';

export type QuestType = 'daily' | 'weekly' | 'story' | 'achievement';

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
  quizStreak: number;
  lastLoginDate: string | null;
  weeklyLevelsCleared: number;
  weeklySubjectsTouched: string[];
  dailyLevelsClearedToday: number;
  questsCompleted: number;
}

export interface StudyContent {
  introduction: string;
  explanation: string;
  example: string;
  keyPoints: string[];
  memoryTip: string;
}

export interface StudyLevel {
  id: string;
  levelNumber: number;
  title: string;
  subject: LevelSubject;
  difficulty: number; // 1-5
  estimatedMinutes: number;
  xpReward: number;
  content: StudyContent;
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
  badgeReward?: string;
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
  type:
    | 'streak'
    | 'level_number'
    | 'quiz_correct'
    | 'study_minutes'
    | 'flashcard_master'
    | 'quest_complete'
    | 'first_login'
    | 'daily_levels'
    | 'night_study'
    | 'morning_study'
    | 'quiz_streak';
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
