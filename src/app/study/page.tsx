'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CheckCircle, Lock, Star, Clock } from 'lucide-react';
import { STUDY_LEVELS } from '@/data/levels';
import { useUserStore } from '@/store/userStore';
import { useXP } from '@/hooks/useXP';
import { useSound } from '@/hooks/useSound';
import type { StudyLevel, QuizQuestion } from '@/types';

type Phase = 'list' | 'content' | 'quiz' | 'result';

const SUBJECT_LABELS: Record<string, string> = {
  intro: '超入門', sharoushi: '社労士入門', rodo: '労働基準法',
  anzen: '安全衛生法', rousai: '労災保険', koyo: '雇用保険',
  kenko: '健康保険', nenkin: '年金法',
};

export default function StudyPage() {
  const { progress, completeLevel } = useUserStore();
  const { addXP } = useXP();
  const { play } = useSound();
  const [phase, setPhase] = useState<Phase>('list');
  const [selected, setSelected] = useState<StudyLevel | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  const isCompleted = (id: string) => progress.completedLevels.includes(id);

  const startLevel = (level: StudyLevel) => { setSelected(level); setPhase('content'); };

  const startQuiz = () => {
    setQuizIndex(0); setAnswers([]); setChosenIndex(null); setShowExplanation(false); setPhase('quiz');
  };

  const handleAnswer = (idx: number) => {
    if (chosenIndex !== null) return;
    const correct = idx === selected!.quiz[quizIndex].correctIndex;
    setChosenIndex(idx); setShowExplanation(true);
    play(correct ? 'correct' : 'wrong');
    setAnswers((prev) => [...prev, correct]);
  };

  const nextQuestion = () => {
    if (quizIndex + 1 < selected!.quiz.length) {
      setQuizIndex((i) => i + 1); setChosenIndex(null); setShowExplanation(false);
    } else { finishLevel(); }
  };

  const finishLevel = () => {
    const lastCorrect = chosenIndex === selected!.quiz[quizIndex].correctIndex;
    const allAnswers = [...answers, lastCorrect];
    const ratio = allAnswers.filter(Boolean).length / selected!.quiz.length;
    const xp = Math.floor(selected!.xpReward * (0.5 + ratio * 0.5));
    addXP(xp); setEarnedXP(xp);
    if (ratio >= 0.5) completeLevel(selected!.id);
    play('complete'); setPhase('result');
  };

  const currentQuestion: QuizQuestion | undefined = selected?.quiz[quizIndex];

  return (
    <div className="px-4 pt-8 pb-4 max-w-lg mx-auto">
      <AnimatePresence mode="wait">
        {phase === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h1 className="heading-serif text-2xl mb-1" style={{ color: '#F59E0B' }}>学習ステージ</h1>
            <p className="text-ink-muted text-sm mb-6">各ステージをクリアしてXPを獲得しよう！</p>
            <div className="flex flex-col gap-3">
              {STUDY_LEVELS.map((level, i) => {
                const done = isCompleted(level.id);
                const locked = i > 0 && !isCompleted(STUDY_LEVELS[i - 1].id);
                return (
                  <motion.div key={level.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.04, 0.5) }}>
                    <button
                      className="w-full glass-card p-4 flex items-center gap-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
                      disabled={locked}
                      onClick={() => !locked && startLevel(level)}
                      style={done ? { border: '1px solid rgba(16,185,129,0.4)', boxShadow: '0 0 12px rgba(16,185,129,0.2)' } : {}}
                    >
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                        style={{ background: done ? 'linear-gradient(135deg,#10B981,#059669)' : locked ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#F59E0B,#D97706)', color: locked ? '#475569' : '#0F172A' }}>
                        {done ? <CheckCircle size={20} color="#fff" /> : locked ? <Lock size={18} color="#475569" /> : level.levelNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-sm truncate" style={{ color: done ? '#10B981' : '#F8FAFC' }}>{level.title}</span>
                          <span className="subject-badge flex-shrink-0">{SUBJECT_LABELS[level.subject] ?? level.subject}</span>
                        </div>
                        <p className="text-xs text-ink-muted truncate">{level.content.introduction}</p>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0 gap-1">
                        <div className="flex items-center gap-1 text-xs" style={{ color: '#F59E0B' }}>
                          <Star size={12} /><span>{level.xpReward}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-ink-subtle">
                          <Clock size={10} /><span>{level.estimatedMinutes}分</span>
                        </div>
                        {!locked && !done && <ChevronRight size={16} className="text-ink-subtle" />}
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {phase === 'content' && selected && (
          <motion.div key="content" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <button onClick={() => setPhase('list')} className="text-ink-muted text-sm mb-4 flex items-center gap-1">← 戻る</button>
            <div className="glass-card p-5 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="subject-badge">{SUBJECT_LABELS[selected.subject]}</span>
                <span className="text-xs text-ink-muted flex items-center gap-1"><Clock size={11} />{selected.estimatedMinutes}分</span>
              </div>
              <h2 className="heading-serif text-xl mb-4" style={{ color: '#F59E0B' }}>{selected.title}</h2>

              <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <p className="text-sm font-medium" style={{ color: '#FCD34D' }}>📖 {selected.content.introduction}</p>
              </div>

              <div className="text-sm leading-relaxed mb-4" style={{ color: '#E2E8F0' }}>
                <p>{selected.content.explanation}</p>
              </div>

              <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p className="text-xs font-bold mb-1" style={{ color: '#10B981' }}>💡 身近な例</p>
                <p className="text-sm" style={{ color: '#E2E8F0' }}>{selected.content.example}</p>
              </div>

              <div className="mb-4">
                <p className="text-xs font-bold mb-2" style={{ color: '#818CF8' }}>📌 重要ポイント</p>
                <ul className="flex flex-col gap-1">
                  {selected.content.keyPoints.map((kp, i) => (
                    <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#E2E8F0' }}>
                      <span style={{ color: '#F59E0B', flexShrink: 0 }}>✓</span>{kp}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg" style={{ background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.2)' }}>
                <p className="text-xs font-bold mb-1" style={{ color: '#FB7185' }}>🧠 覚え方のコツ</p>
                <p className="text-sm" style={{ color: '#E2E8F0' }}>{selected.content.memoryTip}</p>
              </div>
            </div>
            <button className="btn-gold w-full" onClick={startQuiz}>理解できた！クイズに挑戦 →</button>
          </motion.div>
        )}

        {phase === 'quiz' && selected && currentQuestion && (
          <motion.div key={`quiz-${quizIndex}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <span className="text-ink-muted text-sm">問題 {quizIndex + 1} / {selected.quiz.length}</span>
              <div className="flex gap-1">
                {selected.quiz.map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full"
                    style={{ background: i < answers.length ? (answers[i] ? '#10B981' : '#FB7185') : i === quizIndex ? '#F59E0B' : 'rgba(255,255,255,0.2)' }} />
                ))}
              </div>
            </div>
            <div className="glass-card p-5 mb-5">
              <p className="font-medium leading-relaxed" style={{ color: '#F8FAFC' }}>{currentQuestion.question}</p>
            </div>
            <div className="flex flex-col gap-3 mb-4">
              {currentQuestion.options.map((opt, i) => {
                let bg = 'rgba(255,255,255,0.05)', border = '1px solid rgba(255,255,255,0.08)';
                if (chosenIndex !== null) {
                  if (i === currentQuestion.correctIndex) { bg = 'rgba(16,185,129,0.15)'; border = '1px solid #10B981'; }
                  else if (i === chosenIndex) { bg = 'rgba(251,113,133,0.15)'; border = '1px solid #FB7185'; }
                }
                return (
                  <button key={i} onClick={() => handleAnswer(i)} disabled={chosenIndex !== null}
                    className="p-4 rounded-xl text-left text-sm transition-all duration-200 hover:scale-[1.01]"
                    style={{ background: bg, border, color: '#F8FAFC' }}>
                    <span className="font-bold mr-2" style={{ color: '#F59E0B' }}>{String.fromCharCode(65 + i)}.</span>{opt}
                  </button>
                );
              })}
            </div>
            <AnimatePresence>
              {showExplanation && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="glass-card p-4 mb-4" style={{ border: '1px solid rgba(245,158,11,0.3)' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: '#F59E0B' }}>解説</p>
                  <p className="text-sm text-ink-muted leading-relaxed">{currentQuestion.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>
            {chosenIndex !== null && (
              <button className="btn-gold w-full" onClick={nextQuestion}>
                {quizIndex + 1 < selected.quiz.length ? '次の問題 →' : '結果を見る →'}
              </button>
            )}
          </motion.div>
        )}

        {phase === 'result' && selected && (
          <motion.div key="result" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center pt-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }} className="text-7xl mb-4">
              {answers.filter(Boolean).length === selected.quiz.length ? '🏆' : '✨'}
            </motion.div>
            <h2 className="heading-serif text-2xl mb-2" style={{ color: '#F59E0B' }}>
              {answers.filter(Boolean).length >= selected.quiz.length ? '完璧！' : 'よく頑張りました！'}
            </h2>
            <p className="text-ink-muted mb-2">{answers.filter(Boolean).length} / {selected.quiz.length} 問正解</p>
            <div className="glass-card p-4 mb-6 flex items-center justify-center gap-2" style={{ border: '1px solid rgba(245,158,11,0.3)' }}>
              <Star size={20} style={{ color: '#F59E0B' }} />
              <span className="font-bold" style={{ color: '#F59E0B' }}>+{earnedXP} XP 獲得！</span>
            </div>
            <button className="btn-gold w-full" onClick={() => setPhase('list')}>ステージ一覧に戻る</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
