'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, RefreshCw, ChevronRight, Star, Pencil, CheckCircle, X, AlertCircle, BookOpen, Shuffle, Target, Zap } from 'lucide-react';
import Link from 'next/link';
import { ALL_QUIZZES, getRandomQuizzes, getQuizzesBySubject, type QuizWithLevel } from '@/data/quizzes';
import { useUserStore } from '@/store/userStore';
import { useQuestStore } from '@/store/questStore';
import { useXP } from '@/hooks/useXP';
import { useSound } from '@/hooks/useSound';
import { checkAndUnlockBadges } from '@/lib/gameLogic';
import { storageGet, storageSet } from '@/lib/storage';

// ── 定数 ─────────────────────────────────────────────────────────────────
const XP_CORRECT = 15;
const TIMER_SEC = 30;

const SUBJECT_LIST = ['超入門', '社労士入門', '労働基準法'] as const;
type SubjectOption = typeof SUBJECT_LIST[number];

type Phase = 'select' | 'subject_pick' | 'quiz' | 'result';
type QuizMode = 'random' | 'daily' | 'subject' | 'weak';

interface QuizAnswer { qid: string; correct: boolean }

// ── localStorage helpers ──────────────────────────────────────────────────
const loadWrong  = ()  => storageGet<Record<string, number>>('wrong_q', {});
const saveWrong  = (v: Record<string, number>) => storageSet('wrong_q', v);
const loadMemos  = ()  => storageGet<Record<string, string>>('quiz_memos', {});
const saveMemos  = (v: Record<string, string>) => storageSet('quiz_memos', v);

// ── Timer hook ────────────────────────────────────────────────────────────
function useTimer(enabled: boolean, initial: number, onExpire: () => void) {
  const [sec, setSec] = useState(initial);
  useEffect(() => {
    setSec(initial);
    if (!enabled) return;
    const id = setInterval(() => setSec((s) => { if (s <= 1) { clearInterval(id); onExpire(); return 0; } return s - 1; }), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, initial]);
  return { sec, reset: () => setSec(initial) };
}

// ── 問題選択ロジック ────────────────────────────────────────────────────
function buildQuestions(mode: QuizMode, subject: SubjectOption | null, completedLevels: string[]): QuizWithLevel[] {
  const wrong = loadWrong();

  if (mode === 'weak') {
    const weakIds = Object.entries(wrong).filter(([, c]) => c > 0).sort(([, a], [, b]) => b - a).map(([id]) => id);
    const weakQs = ALL_QUIZZES.filter((q) => weakIds.includes(q.id));
    return weakQs.length > 0 ? weakQs.slice(0, 10) : getRandomQuizzes(10);
  }
  if (mode === 'subject' && subject) return getQuizzesBySubject(subject).sort(() => Math.random() - 0.5).slice(0, 10);
  if (mode === 'daily') {
    const completedNums = completedLevels.map((id) => parseInt(id.replace('level_', ''), 10)).filter(Boolean);
    const recent = completedNums.sort((a, b) => b - a).slice(0, 5);
    const recentQs = ALL_QUIZZES.filter((q) => recent.includes(q.levelId));
    return recentQs.length >= 5 ? recentQs.sort(() => Math.random() - 0.5).slice(0, 10) : getRandomQuizzes(10);
  }
  return getRandomQuizzes(10);
}

// ── Mode card ────────────────────────────────────────────────────────────
function ModeCard({ icon, title, desc, color, onClick }: { icon: React.ReactNode; title: string; desc: string; color: string; onClick: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick}
      className="w-full glass-card p-4 flex items-center gap-4 text-left"
      style={{ border: `1px solid ${color}30` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="font-bold text-sm" style={{ color: '#F8FAFC' }}>{title}</p>
        <p className="text-xs text-ink-muted">{desc}</p>
      </div>
      <ChevronRight size={16} className="ml-auto" style={{ color: '#475569' }} />
    </motion.button>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────
export default function QuizPage() {
  const { progress, recordQuizAnswer, unlockBadge } = useUserStore();
  const { updateQuestProgress } = useQuestStore();
  const { addXP } = useXP();
  const { play } = useSound();

  const [phase, setPhase]       = useState<Phase>('select');
  const [mode, setMode]         = useState<QuizMode>('random');
  const [subject, setSubject]   = useState<SubjectOption | null>(null);
  const [questions, setQuestions] = useState<QuizWithLevel[]>([]);
  const [qIdx, setQIdx]         = useState(0);
  const [chosen, setChosen]     = useState<number | null>(null);
  const [timerOn, setTimerOn]   = useState(true);
  const [answers, setAnswers]   = useState<QuizAnswer[]>([]);
  const [memos, setMemos]       = useState<Record<string, string>>(loadMemos);
  const [draftMemo, setDraftMemo] = useState('');
  const [showMemo, setShowMemo] = useState(false);

  const q = questions[qIdx];

  // Timer
  const handleExpire = useCallback(() => {
    if (chosen !== null) return;
    setChosen(-1); // -1 = time up (no answer)
    play('wrong');
    recordQuizAnswer(false);
    setAnswers((a) => [...a, { qid: q.id, correct: false }]);
    const w = loadWrong(); w[q.id] = (w[q.id] ?? 0) + 1; saveWrong(w);
  }, [chosen, q, play, recordQuizAnswer]);

  const { sec } = useTimer(timerOn && phase === 'quiz' && chosen === null, TIMER_SEC, handleExpire);

  const startQuiz = useCallback((m: QuizMode, sub?: SubjectOption) => {
    const qs = buildQuestions(m, sub ?? null, progress.completedLevels);
    setQuestions(qs); setQIdx(0); setChosen(null); setAnswers([]);
    setDraftMemo(''); setShowMemo(false);
    setMode(m); if (sub) setSubject(sub);
    setPhase('quiz');
  }, [progress.completedLevels]);

  const pick = (i: number) => {
    if (chosen !== null) return;
    const ok = i === q.correctIndex;
    setChosen(i); play(ok ? 'correct' : 'wrong');
    recordQuizAnswer(ok);
    setAnswers((a) => [...a, { qid: q.id, correct: ok }]);
    if (ok) {
      addXP(XP_CORRECT);
      updateQuestProgress('daily_quiz', 1);
    } else {
      const w = loadWrong(); w[q.id] = (w[q.id] ?? 0) + 1; saveWrong(w);
    }
    // recordQuizAnswer後に最新状態でバッジチェック
    const latestProgress = useUserStore.getState().progress;
    checkAndUnlockBadges(latestProgress, unlockBadge);
  };

  const saveMemo = () => {
    if (!draftMemo.trim() || !q) return;
    const updated = { ...memos, [q.id]: draftMemo.trim() };
    setMemos(updated); saveMemos(updated); setShowMemo(false);
  };

  const next = () => {
    setDraftMemo(''); setShowMemo(false);
    if (qIdx + 1 < questions.length) { setQIdx((n) => n + 1); setChosen(null); }
    else setPhase('result');
  };

  const totalCorrect = answers.filter((a) => a.correct).length;
  const earnedXP = totalCorrect * XP_CORRECT;
  const wrongAnswers = answers.filter((a) => !a.correct).map((a) => questions.find((qq) => qq.id === a.qid)).filter(Boolean) as QuizWithLevel[];

  // ── SELECT ────────────────────────────────────────────────────────────
  if (phase === 'select') return (
    <div className="px-4 pt-10 pb-24 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-serif text-2xl" style={{ color: '#FB7185' }}>クイズ</h1>
          <p className="text-xs text-ink-muted">モードを選んで挑戦！</p>
        </div>
        <button onClick={() => setTimerOn((t) => !t)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium"
          style={{ background: timerOn ? 'rgba(251,113,133,0.15)' : 'rgba(255,255,255,0.07)', border: timerOn ? '1px solid #FB7185' : '1px solid rgba(255,255,255,0.1)', color: timerOn ? '#FB7185' : '#475569' }}>
          <Clock size={12} />{timerOn ? 'タイマーON' : 'タイマーOFF'}
        </button>
      </div>
      <div className="flex flex-col gap-3">
        <ModeCard icon={<BookOpen size={20} />}  title="今日の復習"   desc="直近の学習レベルから出題" color="#F59E0B" onClick={() => startQuiz('daily')} />
        <ModeCard icon={<Shuffle size={20} />}   title="ランダム出題" desc="全範囲からランダム10問"   color="#818CF8" onClick={() => startQuiz('random')} />
        <ModeCard icon={<Target size={20} />}    title="科目別"       desc="科目を選んで集中特訓"     color="#38BDF8" onClick={() => setPhase('subject_pick')} />
        <ModeCard icon={<Zap size={20} />}       title="苦手克服"     desc="間違えた問題を優先出題"   color="#FB7185" onClick={() => startQuiz('weak')} />
      </div>
    </div>
  );

  // ── SUBJECT PICK ─────────────────────────────────────────────────────
  if (phase === 'subject_pick') return (
    <div className="px-4 pt-10 pb-24 max-w-lg mx-auto">
      <button onClick={() => setPhase('select')} className="text-ink-muted text-sm mb-5 flex items-center gap-1">← 戻る</button>
      <h2 className="heading-serif text-xl mb-4" style={{ color: '#38BDF8' }}>科目を選ぶ</h2>
      <div className="flex flex-col gap-3">
        {SUBJECT_LIST.map((s) => (
          <motion.button key={s} whileTap={{ scale: 0.97 }} onClick={() => startQuiz('subject', s)}
            className="glass-card p-4 flex items-center justify-between"
            style={{ border: '1px solid rgba(56,189,248,0.2)' }}>
            <span className="font-medium text-sm" style={{ color: '#F8FAFC' }}>{s}</span>
            <span className="text-xs text-ink-muted">{getQuizzesBySubject(s).length}問</span>
          </motion.button>
        ))}
      </div>
    </div>
  );

  // ── QUIZ ─────────────────────────────────────────────────────────────
  if (phase === 'quiz' && q) {
    const timerPct = (sec / TIMER_SEC) * 100;
    const timerColor = sec > 10 ? '#10B981' : sec > 5 ? '#F59E0B' : '#FB7185';
    const savedMemo = memos[q.id];

    return (
      <div className="px-4 pt-10 pb-24 max-w-lg mx-auto">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setPhase('select')} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <X size={14} style={{ color: '#94A3B8' }} />
          </button>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-ink-muted mb-1">
              <span>{qIdx + 1} / {questions.length}問</span>
              <span style={{ color: '#F59E0B' }}>+{qIdx * XP_CORRECT} XP</span>
            </div>
            <div className="xp-bar-track" style={{ height: 4 }}>
              <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#FB7185,#F43F5E)' }}
                animate={{ width: `${((qIdx) / questions.length) * 100}%` }} transition={{ duration: 0.4 }} />
            </div>
          </div>
          {timerOn && (
            <div className="flex-shrink-0 relative w-9 h-9">
              <svg className="absolute inset-0" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                <motion.circle cx="18" cy="18" r="16" fill="none" stroke={timerColor} strokeWidth="3"
                  strokeDasharray={`${100.53 * timerPct / 100} 100.53`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: timerColor }}>{sec}</span>
            </div>
          )}
        </div>

        {/* Saved memo */}
        {savedMemo && (
          <div className="mb-3 px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)', color: '#818CF8' }}>
            📝 マイメモ: {savedMemo}
          </div>
        )}

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div key={q.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="glass-card p-4 mb-4" style={{ border: '1px solid rgba(251,113,133,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="subject-badge">{q.subject}</span>
                {q.difficulty === 'hard' && <span className="text-xs" style={{ color: '#FB7185' }}>★★★</span>}
              </div>
              <p className="font-medium text-sm leading-relaxed" style={{ color: '#F8FAFC' }}>{q.question}</p>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-2 mb-4">
              {q.options.map((opt, i) => {
                let bg = 'rgba(255,255,255,0.04)', border = '1px solid rgba(255,255,255,0.08)', textColor = '#E2E8F0';
                if (chosen !== null) {
                  if (i === q.correctIndex)      { bg = 'rgba(16,185,129,0.18)'; border = '1px solid #10B981'; textColor = '#34D399'; }
                  else if (i === chosen)          { bg = 'rgba(251,113,133,0.18)'; border = '1px solid #FB7185'; textColor = '#FDA4AF'; }
                }
                return (
                  <motion.button key={i} whileTap={chosen === null ? { scale: 0.98 } : {}}
                    onClick={() => pick(i)} disabled={chosen !== null}
                    className="p-3 rounded-xl text-left text-sm transition-all duration-200"
                    style={{ background: bg, border, color: textColor }}>
                    <span className="font-bold mr-2" style={{ color: chosen !== null && i === q.correctIndex ? '#10B981' : '#FB7185' }}>
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {opt}
                    {chosen !== null && i === q.correctIndex && <CheckCircle size={14} className="inline ml-2" style={{ color: '#10B981' }} />}
                    {chosen !== null && i === chosen && i !== q.correctIndex && <X size={14} className="inline ml-2" style={{ color: '#FB7185' }} />}
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {chosen !== null && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4">
                  <div className="glass-card p-4 mb-3" style={{ border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.04)' }}>
                    <p className="text-xs font-bold mb-1.5" style={{ color: '#F59E0B' }}>
                      {chosen === q.correctIndex ? '✅ 正解！' : chosen === -1 ? '⏰ 時間切れ！' : '❌ 不正解'}
                    </p>
                    <p className="text-xs text-ink-muted leading-relaxed">{q.explanation}</p>
                  </div>

                  {/* Memo */}
                  <div>
                    <button onClick={() => setShowMemo((s) => !s)}
                      className="flex items-center gap-1.5 text-xs mb-2"
                      style={{ color: showMemo ? '#818CF8' : '#475569' }}>
                      <Pencil size={12} />
                      {savedMemo ? 'メモを編集' : 'なるほど！メモを追加'}
                    </button>
                    {showMemo && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex gap-2">
                        <input
                          value={draftMemo || savedMemo || ''}
                          onChange={(e) => setDraftMemo(e.target.value)}
                          placeholder="ここに覚えたことをメモ…"
                          className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(129,140,248,0.4)', color: '#F8FAFC' }}
                        />
                        <button onClick={saveMemo} className="px-3 py-2 rounded-xl text-xs font-bold"
                          style={{ background: 'rgba(129,140,248,0.2)', color: '#818CF8', border: '1px solid rgba(129,140,248,0.4)' }}>
                          保存
                        </button>
                      </motion.div>
                    )}
                  </div>

                  <button onClick={next} className="btn-sakura w-full mt-3">
                    {qIdx + 1 < questions.length ? '次の問題 →' : '結果を見る →'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── RESULT ─────────────────────────────────────────────────────────────
  if (phase === 'result') return (
    <div className="px-4 pt-10 pb-24 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-6">
        <div className="text-6xl mb-3">{totalCorrect >= questions.length * 0.8 ? '🎉' : totalCorrect >= questions.length * 0.5 ? '😊' : '💪'}</div>
        <h2 className="heading-serif text-2xl mb-1" style={{ color: '#FB7185' }}>
          {totalCorrect >= questions.length ? '全問正解！' : 'お疲れ様！'}
        </h2>
        <p className="text-ink-muted">{totalCorrect} / {questions.length} 問正解</p>
        <div className="inline-flex items-center gap-2 mt-3 px-5 py-2 rounded-2xl" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)' }}>
          <Star size={18} style={{ color: '#F59E0B' }} />
          <span className="font-bold" style={{ color: '#F59E0B' }}>+{earnedXP} XP</span>
        </div>
      </motion.div>

      {wrongAnswers.length > 0 && (
        <div className="mb-5">
          <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#FB7185' }}>
            <AlertCircle size={15} /> 間違えた問題
          </p>
          <div className="flex flex-col gap-2">
            {wrongAnswers.map((wq) => (
              <div key={wq.id} className="glass-card p-3" style={{ border: '1px solid rgba(251,113,133,0.2)' }}>
                <p className="text-xs font-medium mb-1" style={{ color: '#F8FAFC' }}>{wq.question}</p>
                <p className="text-xs text-ink-muted leading-snug">{wq.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => startQuiz(mode, subject ?? undefined)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
          style={{ background: 'rgba(251,113,133,0.15)', border: '1px solid rgba(251,113,133,0.4)', color: '#FB7185' }}>
          <RefreshCw size={15} /> もう一度
        </button>
        <Link href="/" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
          style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#F59E0B' }}>
          ホームへ
        </Link>
      </div>
    </div>
  );

  return null;
}
