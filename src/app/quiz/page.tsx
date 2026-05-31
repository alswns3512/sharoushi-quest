'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Star, RefreshCw } from 'lucide-react';
import { ALL_QUIZZES } from '@/data/quizzes';
import { useUserStore } from '@/store/userStore';
import { useXP } from '@/hooks/useXP';
import { useSound } from '@/hooks/useSound';
import type { QuizQuestion } from '@/types';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const XP_PER_CORRECT = 15;

export default function QuizPage() {
  const { recordQuizAnswer } = useUserStore();
  const { addXP } = useXP();
  const { play } = useSound();

  const [questions, setQuestions] = useState<QuizQuestion[]>(() => shuffle(ALL_QUIZZES).slice(0, 5));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [showExp, setShowExp] = useState(false);
  const [finished, setFinished] = useState(false);

  const current = questions[index];

  const handleAnswer = useCallback(
    (i: number) => {
      if (chosen !== null) return;
      const correct = i === current.correctIndex;
      setChosen(i);
      setShowExp(true);
      play(correct ? 'correct' : 'wrong');
      recordQuizAnswer(correct);
      if (correct) {
        setScore((s) => s + 1);
        addXP(XP_PER_CORRECT);
      }
    },
    [chosen, current, play, recordQuizAnswer, addXP]
  );

  const next = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      if (score + (chosen === current.correctIndex ? 1 : 0) === questions.length) play('complete');
      return;
    }
    setIndex((i) => i + 1);
    setChosen(null);
    setShowExp(false);
  };

  const restart = () => {
    setQuestions(shuffle(ALL_QUIZZES).slice(0, 5));
    setIndex(0);
    setScore(0);
    setChosen(null);
    setShowExp(false);
    setFinished(false);
  };


  return (
    <div className="px-4 pt-8 pb-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle size={22} style={{ color: '#FB7185' }} />
        <h1 className="heading-serif text-2xl" style={{ color: '#FB7185' }}>クイズチャレンジ</h1>
      </div>

      <AnimatePresence mode="wait">
        {!finished ? (
          <motion.div key={`q-${index}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-ink-muted text-sm">問題 {index + 1} / {questions.length}</span>
              <div className="flex gap-1">
                {questions.map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full"
                    style={{ background: i < index ? '#10B981' : i === index ? '#FB7185' : 'rgba(255,255,255,0.2)' }} />
                ))}
              </div>
            </div>

            {/* Question */}
            <div className="glass-card p-5 mb-5" style={{ border: '1px solid rgba(251,113,133,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="subject-badge">{current.subject}</span>
                <span className="text-xs" style={{ color: current.difficulty === 'easy' ? '#10B981' : current.difficulty === 'normal' ? '#F59E0B' : '#FB7185' }}>
                  {current.difficulty === 'easy' ? '★' : current.difficulty === 'normal' ? '★★' : '★★★'}
                </span>
              </div>
              <p className="font-medium leading-relaxed text-ink">{current.question}</p>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-3 mb-4">
              {current.options.map((opt, i) => {
                let bg = 'rgba(255,255,255,0.05)';
                let border = '1px solid rgba(255,255,255,0.08)';
                if (chosen !== null) {
                  if (i === current.correctIndex) { bg = 'rgba(16,185,129,0.15)'; border = '1px solid #10B981'; }
                  else if (i === chosen) { bg = 'rgba(251,113,133,0.15)'; border = '1px solid #FB7185'; }
                }
                return (
                  <button key={i} onClick={() => handleAnswer(i)} disabled={chosen !== null}
                    className="p-4 rounded-xl text-left text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                    style={{ background: bg, border, color: '#F8FAFC' }}>
                    <span className="font-bold mr-2" style={{ color: '#FB7185' }}>{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {showExp && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="glass-card p-4 mb-4" style={{ border: '1px solid rgba(245,158,11,0.3)' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: '#F59E0B' }}>解説</p>
                  <p className="text-sm text-ink-muted leading-relaxed">{current.explanation}</p>
                  {chosen === current.correctIndex && (
                    <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: '#F59E0B' }}>
                      <Star size={12} />
                      <span>+{XP_PER_CORRECT} XP 獲得！</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {chosen !== null && (
              <button className="btn-sakura w-full" onClick={next}>
                {index + 1 < questions.length ? '次の問題 →' : '結果を見る →'}
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div key="result" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center pt-8">
            <div className="text-7xl mb-4">{score >= questions.length * 0.8 ? '🎉' : score >= questions.length * 0.5 ? '😊' : '💪'}</div>
            <h2 className="heading-serif text-2xl mb-2" style={{ color: '#FB7185' }}>
              {score >= questions.length ? '全問正解！' : 'お疲れ様！'}
            </h2>
            <p className="text-ink-muted text-lg mb-2">{score} / {questions.length} 問正解</p>
            <p className="text-sm mb-8" style={{ color: '#F59E0B' }}>+{score * XP_PER_CORRECT} XP 獲得！</p>
            <button className="btn-sakura w-full flex items-center justify-center gap-2" onClick={restart}>
              <RefreshCw size={16} />
              もう一度チャレンジ
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
