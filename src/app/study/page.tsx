'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Lock, Star, Clock, X, Zap, BookOpen, RotateCcw } from 'lucide-react';
import { STUDY_LEVELS } from '@/data/levels';
import { useUserStore } from '@/store/userStore';
import { useQuestStore } from '@/store/questStore';
import { useXP } from '@/hooks/useXP';
import { useSound } from '@/hooks/useSound';
import type { StudyLevel, QuizQuestion } from '@/types';

// ── 定数 ────────────────────────────────────────────────────────────────
const CHAPTERS = [
  { range: [1, 10],  title: '第1章：社会人の基礎知識', color: '#94A3B8' },
  { range: [11, 20], title: '第2章：社労士入門',       color: '#FB7185' },
  { range: [21, 30], title: '第3章：労働基準法の入口', color: '#60A5FA' },
];

const SUBJECT_META: Record<string, { label: string; color: string }> = {
  intro:     { label: '超入門',    color: '#94A3B8' },
  sharoushi: { label: '社労士',    color: '#FB7185' },
  rodo:      { label: '労基法',    color: '#60A5FA' },
  anzen:     { label: '安全衛生',  color: '#FBBF24' },
  rousai:    { label: '労災',      color: '#F87171' },
  koyo:      { label: '雇用保険',  color: '#34D399' },
  kenko:     { label: '健康保険',  color: '#38BDF8' },
  nenkin:    { label: '年金',      color: '#A78BFA' },
};

type LearningStep = 'intro' | 'explanation' | 'example' | 'keypoints' | 'quiz' | 'clear';
type StudyMode = 'normal' | 'speed' | 'review';
type UnderstandingLevel = 'perfect' | 'so_so' | 'confused';

// ── 紙吹雪 ────────────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    color: ['#F59E0B','#FB7185','#34D399','#60A5FA','#A78BFA','#FCD34D'][i % 6],
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    dur: 1 + Math.random(),
  }));
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-2 rounded-sm"
          style={{ left: `${p.x}%`, top: -8, background: p.color }}
          initial={{ y: -8, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', opacity: [1, 1, 0], rotate: 360 * 3 }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

// ── クイズコンポーネント ────────────────────────────────────────────────
function QuizPanel({
  questions, onComplete,
}: {
  questions: QuizQuestion[];
  onComplete: (correct: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const { play } = useSound();
  const { recordQuizAnswer } = useUserStore();

  const q = questions[idx];

  const pick = (i: number) => {
    if (chosen !== null) return;
    const ok = i === q.correctIndex;
    setChosen(i); play(ok ? 'correct' : 'wrong');
    recordQuizAnswer(ok);
    setAnswers((a) => [...a, ok]);
  };

  const next = () => {
    if (idx + 1 < questions.length) { setIdx((n) => n + 1); setChosen(null); }
    else {
      const finalAnswers = [...answers];
      onComplete(finalAnswers.filter(Boolean).length);
    }
  };

  return (
    <div>
      {/* Progress dots */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-ink-muted">問題 {idx + 1}/{questions.length}</span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full"
              style={{ background: i < answers.length ? (answers[i] ? '#10B981' : '#FB7185') : i === idx ? '#F59E0B' : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>
      </div>

      <div className="glass-card p-4 mb-4" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="text-sm font-medium leading-relaxed" style={{ color: '#F8FAFC' }}>{q.question}</p>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {q.options.map((opt, i) => {
          let bg = 'rgba(255,255,255,0.04)'; let border = '1px solid rgba(255,255,255,0.08)';
          if (chosen !== null) {
            if (i === q.correctIndex) { bg = 'rgba(16,185,129,0.15)'; border = '1px solid #10B981'; }
            else if (i === chosen) { bg = 'rgba(251,113,133,0.15)'; border = '1px solid #FB7185'; }
          }
          return (
            <button key={i} onClick={() => pick(i)} disabled={chosen !== null}
              className="p-3 rounded-xl text-left text-sm transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: bg, border, color: '#F8FAFC' }}>
              <span className="font-bold mr-2" style={{ color: '#F59E0B' }}>{String.fromCharCode(65 + i)}.</span>{opt}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {chosen !== null && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }}
            className="glass-card p-3 mb-4" style={{ border: '1px solid rgba(245,158,11,0.25)' }}>
            <p className="text-xs font-bold mb-1" style={{ color: '#F59E0B' }}>解説</p>
            <p className="text-xs text-ink-muted leading-relaxed">{q.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {chosen !== null && (
        <button onClick={next} className="btn-gold w-full">
          {idx + 1 < questions.length ? '次の問題 →' : '結果へ →'}
        </button>
      )}
    </div>
  );
}

// ── 学習フロー（フルスクリーン） ────────────────────────────────────────
function LearningFlow({
  level, mode, onClose, onComplete,
}: {
  level: StudyLevel;
  mode: StudyMode;
  onClose: () => void;
  onComplete: (xp: number) => void;
}) {
  const steps: LearningStep[] = mode === 'speed'
    ? ['keypoints', 'quiz', 'clear']
    : mode === 'review'
    ? ['quiz', 'clear']
    : ['intro', 'explanation', 'example', 'keypoints', 'quiz', 'clear'];

  const [stepIdx, setStepIdx] = useState(0);
  const [checkedPoints, setCheckedPoints] = useState<boolean[]>(level.content.keyPoints.map(() => false));
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [understanding, setUnderstanding] = useState<UnderstandingLevel | null>(null);
  const [earnedXP, setEarnedXP] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const { completeLevel, progress } = useUserStore();
  const { updateQuestProgress } = useQuestStore();
  const { addXP } = useXP();
  const { play } = useSound();

  const step = steps[stepIdx];

  const advance = () => {
    if (stepIdx + 1 < steps.length) setStepIdx((n) => n + 1);
  };

  const handleQuizComplete = (correct: number) => {
    setQuizCorrect(correct);
    const ratio = correct / level.quiz.length;
    const xp = Math.floor(level.xpReward * (0.5 + ratio * 0.5));
    setEarnedXP(xp);
    addXP(xp);
    if (ratio >= 0.5) {
      completeLevel(level.id);
      // クエスト進捗を更新
      updateQuestProgress('daily_level', 1);
      updateQuestProgress('weekly_levels', 1);
      // ストーリークエスト
      const newCount = progress.completedLevels.length + 1;
      if (level.id === 'level_001') updateQuestProgress('story_first_step', 1);
      if (newCount >= 10) updateQuestProgress('story_intro_complete', 10);
      if (newCount >= 20) updateQuestProgress('story_sharoushi_complete', 20);
    }
    play('complete');
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
    advance();
  };

  const meta = SUBJECT_META[level.subject] ?? { label: level.subject, color: '#94A3B8' };

  const STEP_LABEL: Record<LearningStep, string> = {
    intro: '導入',
    explanation: '解説',
    example: '例え話',
    keypoints: 'ポイント確認',
    quiz: 'ミニクイズ',
    clear: 'クリア！',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#0F172A' }}
    >
      {showConfetti && <Confetti />}

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 flex-shrink-0">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <X size={16} style={{ color: '#94A3B8' }} />
        </button>
        <div className="flex-1">
          <p className="text-xs text-ink-muted">{meta.label} / Lv.{level.levelNumber}</p>
          <p className="text-sm font-bold truncate" style={{ color: '#F8FAFC' }}>{level.title}</p>
        </div>
        <div className="flex items-center gap-1" style={{ color: '#F59E0B' }}>
          <Star size={13} /><span className="text-xs font-bold">{level.xpReward} XP</span>
        </div>
      </div>

      {/* Step progress */}
      <div className="px-4 pb-3 flex-shrink-0">
        <div className="flex gap-1">
          {steps.map((s, i) => (
            <div key={s} className="h-1 flex-1 rounded-full transition-all duration-500"
              style={{ background: i <= stepIdx ? '#F59E0B' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>
        <p className="text-xs text-ink-muted mt-1">{STEP_LABEL[step]}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* ─ INTRO ─ */}
            {step === 'intro' && (
              <div>
                <div className="text-5xl text-center my-6">{meta.label === '超入門' ? '🌱' : '📖'}</div>
                <div className="glass-card p-5 mb-5" style={{ border: `1px solid ${meta.color}30` }}>
                  <p className="text-base font-medium leading-relaxed" style={{ color: '#FCD34D' }}>
                    {level.content.introduction}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm text-ink-muted">
                  <Clock size={14} /><span>目安：{level.estimatedMinutes}分</span>
                  <Star size={14} style={{ color: '#F59E0B' }} /><span style={{ color: '#F59E0B' }}>{level.xpReward} XP</span>
                </div>
                <button className="btn-gold w-full mt-6" onClick={advance}>学習を始める →</button>
              </div>
            )}

            {/* ─ EXPLANATION ─ */}
            {step === 'explanation' && (
              <div>
                <h3 className="heading-serif text-lg mb-4" style={{ color: '#F59E0B' }}>{level.title}</h3>
                <div className="glass-card p-4 mb-4">
                  <p className="text-sm leading-loose" style={{ color: '#E2E8F0', whiteSpace: 'pre-line' }}>{level.content.explanation}</p>
                </div>
                <button className="btn-gold w-full" onClick={advance}>次へ（例え話）→</button>
              </div>
            )}

            {/* ─ EXAMPLE ─ */}
            {step === 'example' && (
              <div>
                <div className="glass-card p-4 mb-4" style={{ border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.05)' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#10B981' }}>💡 身近な例えで理解しよう</p>
                  <p className="text-sm leading-relaxed" style={{ color: '#E2E8F0' }}>{level.content.example}</p>
                </div>
                <div className="glass-card p-4" style={{ border: '1px solid rgba(251,113,133,0.25)', background: 'rgba(251,113,133,0.05)' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#FB7185' }}>🧠 覚え方のコツ</p>
                  <p className="text-sm" style={{ color: '#E2E8F0' }}>{level.content.memoryTip}</p>
                </div>
                <button className="btn-gold w-full mt-4" onClick={advance}>重要ポイントを確認 →</button>
              </div>
            )}

            {/* ─ KEY POINTS ─ */}
            {step === 'keypoints' && (
              <div>
                <p className="text-sm font-bold mb-3" style={{ color: '#818CF8' }}>📌 重要ポイントを確認しよう</p>
                <div className="flex flex-col gap-2 mb-5">
                  {level.content.keyPoints.map((kp, i) => (
                    <button
                      key={i}
                      onClick={() => setCheckedPoints((p) => { const n = [...p]; n[i] = !n[i]; return n; })}
                      className="flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200"
                      style={{
                        background: checkedPoints[i] ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                        border: checkedPoints[i] ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: checkedPoints[i] ? '#10B981' : 'rgba(255,255,255,0.1)' }}>
                        {checkedPoints[i] && <CheckCircle size={12} color="#fff" />}
                      </div>
                      <span className="text-sm leading-snug" style={{ color: checkedPoints[i] ? '#34D399' : '#E2E8F0' }}>{kp}</span>
                    </button>
                  ))}
                </div>

                {/* わからない度 */}
                <p className="text-xs font-bold mb-2 text-ink-muted">理解度を教えてね</p>
                <div className="flex gap-2 mb-5">
                  {([['perfect','完璧💯'], ['so_so','なんとなく🤔'], ['confused','わからない😰']] as [UnderstandingLevel, string][]).map(([lvl, lbl]) => (
                    <button key={lvl} onClick={() => setUnderstanding(lvl)}
                      className="flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-200"
                      style={{
                        background: understanding === lvl ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
                        border: understanding === lvl ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',
                        color: understanding === lvl ? '#F59E0B' : '#94A3B8',
                      }}>
                      {lbl}
                    </button>
                  ))}
                </div>

                <button className="btn-gold w-full" onClick={advance}>ミニクイズへ →</button>
              </div>
            )}

            {/* ─ QUIZ ─ */}
            {step === 'quiz' && (
              <div>
                <p className="text-sm font-bold mb-4" style={{ color: '#FB7185' }}>🎯 理解度チェック！</p>
                <QuizPanel questions={level.quiz} onComplete={handleQuizComplete} />
              </div>
            )}

            {/* ─ CLEAR ─ */}
            {step === 'clear' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center pt-6"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-7xl mb-4"
                >
                  {quizCorrect === level.quiz.length ? '🏆' : '✨'}
                </motion.div>
                <h2 className="heading-serif text-2xl font-bold mb-2" style={{ color: '#F59E0B' }}>
                  {quizCorrect === level.quiz.length ? 'パーフェクト！' : 'クリア！'}
                </h2>
                <p className="text-ink-muted mb-1">クイズ {quizCorrect}/{level.quiz.length} 問正解</p>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl mb-6 mt-3"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)' }}
                >
                  <Star size={22} style={{ color: '#F59E0B' }} />
                  <span className="text-xl font-black" style={{ color: '#F59E0B' }}>+{earnedXP} XP</span>
                </motion.div>
                <button className="btn-gold w-full" onClick={() => onComplete(earnedXP)}>
                  マップに戻る
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── メインページ ─────────────────────────────────────────────────────────
export default function StudyPage() {
  const { progress } = useUserStore();
  const [activeLevel, setActiveLevel] = useState<StudyLevel | null>(null);
  const [mode, setMode] = useState<StudyMode>('normal');
  const [lastXP, setLastXP] = useState<number | null>(null);

  const isCompleted = useCallback((id: string) => progress.completedLevels.includes(id), [progress.completedLevels]);

  const getChapterProgress = (from: number, to: number) => {
    const total = to - from + 1;
    const done = STUDY_LEVELS.filter((l) => l.levelNumber >= from && l.levelNumber <= to && isCompleted(l.id)).length;
    return { done, total, pct: Math.floor((done / total) * 100) };
  };

  const MODE_META: Record<StudyMode, { label: string; color: string; icon: React.ReactNode }> = {
    normal: { label: 'フル解説', color: '#F59E0B', icon: <BookOpen size={13} /> },
    speed:  { label: '速習',    color: '#10B981', icon: <Zap size={13} /> },
    review: { label: '復習',    color: '#818CF8', icon: <RotateCcw size={13} /> },
  };

  return (
    <div className="pb-28 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <h1 className="heading-serif text-2xl" style={{ color: '#F59E0B' }}>学習マップ</h1>
        {/* Mode switcher */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {(Object.entries(MODE_META) as [StudyMode, typeof MODE_META.normal][]).map(([m, meta]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                background: mode === m ? meta.color + '25' : 'transparent',
                border: mode === m ? `1px solid ${meta.color}60` : '1px solid transparent',
                color: mode === m ? meta.color : '#475569',
              }}
            >
              {meta.icon}{meta.label}
            </button>
          ))}
        </div>
      </div>

      {/* XP notification */}
      <AnimatePresence>
        {lastXP !== null && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            onAnimationComplete={() => setTimeout(() => setLastXP(null), 2000)}
            className="mx-4 mb-3 text-center py-2 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B' }}
          >
            <span className="text-sm font-bold">+{lastXP} XP 獲得！</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapters */}
      {CHAPTERS.map((ch) => {
        const [from, to] = ch.range;
        const { done, total, pct } = getChapterProgress(from, to);
        const levels = STUDY_LEVELS.filter((l) => l.levelNumber >= from && l.levelNumber <= to);

        return (
          <div key={ch.title} className="mb-6">
            {/* Chapter header */}
            <div className="px-4 mb-3">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold" style={{ color: ch.color }}>{ch.title}</h2>
                <span className="text-xs text-ink-muted">{done}/{total}</span>
              </div>
              <div className="xp-bar-track" style={{ height: 4 }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: ch.color, boxShadow: `0 0 6px ${ch.color}80` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Level cards */}
            <div className="flex flex-col gap-2 px-4">
              {levels.map((level, i) => {
                const prevLevel = i > 0 ? levels[i - 1] : null;
                const done = isCompleted(level.id);
                const locked = !done && !!prevLevel && !isCompleted(prevLevel.id);
                const meta = SUBJECT_META[level.subject] ?? { label: level.subject, color: '#94A3B8' };

                return (
                  <motion.button
                    key={level.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.4) }}
                    whileTap={locked ? {} : { scale: 0.97 }}
                    disabled={locked}
                    onClick={() => !locked && setActiveLevel(level)}
                    className="w-full glass-card p-3 flex items-center gap-3 text-left disabled:opacity-35"
                    style={
                      done
                        ? { border: `1px solid ${meta.color}50`, boxShadow: `0 0 10px ${meta.color}20` }
                        : !locked
                        ? { border: '1px solid rgba(255,255,255,0.09)' }
                        : {}
                    }
                  >
                    {/* Level number badge */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black"
                      style={{
                        background: done
                          ? `linear-gradient(135deg, ${meta.color}, ${meta.color}99)`
                          : locked
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(255,255,255,0.08)',
                        color: done ? '#fff' : locked ? '#334155' : '#F8FAFC',
                        boxShadow: done ? `0 0 12px ${meta.color}40` : 'none',
                      }}
                    >
                      {done ? '✓' : locked ? <Lock size={14} /> : level.levelNumber}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm font-bold truncate" style={{ color: done ? meta.color : '#F8FAFC' }}>
                          {level.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}30` }}
                        >
                          {meta.label}
                        </span>
                        {/* Difficulty stars */}
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }, (_, si) => (
                            <div key={si} className="w-1.5 h-1.5 rounded-full"
                              style={{ background: si < level.difficulty ? '#F59E0B' : 'rgba(255,255,255,0.1)' }} />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right meta */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="flex items-center gap-0.5" style={{ color: '#F59E0B' }}>
                        <Star size={11} /><span className="text-xs">{level.xpReward}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-ink-subtle">
                        <Clock size={10} /><span className="text-[10px]">{level.estimatedMinutes}分</span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Learning flow overlay */}
      <AnimatePresence>
        {activeLevel && (
          <LearningFlow
            key={activeLevel.id}
            level={activeLevel}
            mode={mode}
            onClose={() => setActiveLevel(null)}
            onComplete={(xp) => {
              setLastXP(xp);
              setActiveLevel(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
