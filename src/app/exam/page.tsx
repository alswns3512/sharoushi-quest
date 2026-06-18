'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, BookOpen, Trophy, ChevronRight, Clock,
  CheckCircle, X, AlertCircle, BarChart2, RotateCcw, Home,
  ChevronLeft, ChevronDown, ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { ALL_QUIZZES } from '@/data/quizzes';
import type { QuizQuestion, Subject } from '@/types';
import { storageGet, storageSet } from '@/lib/storage';

// ── Types ──────────────────────────────────────────────────────────────────
type ExamMode = 'quick' | 'subject' | 'full';
type Phase = 'select' | 'subject_pick' | 'exam' | 'result';

interface ExamRecord {
  id: string;
  mode: ExamMode;
  subject?: string;
  score: number;
  total: number;
  date: string;
  durationSeconds: number;
}

interface SubjectStat { subject: string; correct: number; total: number }

const MODE_CONFIG: Record<ExamMode, { label: string; questions: number; minutes: number; color: string; icon: React.ReactNode; desc: string }> = {
  quick:   { label: 'かんたん模擬',   questions: 10, minutes: 5,  color: '#34D399', icon: <Zap size={22} />,         desc: '10問・5分 — サクッと実力チェック！' },
  subject: { label: '科目別テスト',   questions: 20, minutes: 15, color: '#60A5FA', icon: <BookOpen size={22} />,    desc: '20問・15分 — 科目を絞って集中対策' },
  full:    { label: '実戦模擬試験',   questions: 30, minutes: 30, color: '#F59E0B', icon: <Trophy size={22} />,      desc: '30問・30分 — 本番さながらの実力測定' },
};

const EXAM_SUBJECTS: Subject[] = [
  '労働基準法', '雇用保険法', '健康保険法', '厚生年金保険法', '国民年金法',
  '労働安全衛生法', '労災保険法', '超入門',
];

const HISTORY_KEY = 'exam_history';
const loadHistory = () => storageGet<ExamRecord[]>(HISTORY_KEY, []);
const saveHistory = (h: ExamRecord[]) => storageSet(HISTORY_KEY, h);

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildExamQuestions(mode: ExamMode, subject?: string): QuizQuestion[] {
  const pool = subject
    ? ALL_QUIZZES.filter((q) => q.subject === subject)
    : ALL_QUIZZES;
  const count = MODE_CONFIG[mode].questions;
  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

// ── Sub-components ─────────────────────────────────────────────────────────
function ProgressDots({
  total, current, answers,
  onJump,
}: {
  total: number; current: number; answers: (number | null)[]; onJump: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 justify-center">
      {Array.from({ length: total }).map((_, i) => {
        const answered = answers[i] !== null && answers[i] !== undefined;
        const isCur = i === current;
        return (
          <button
            key={i}
            onClick={() => onJump(i)}
            className="w-7 h-7 rounded-lg text-xs font-bold transition-all"
            style={{
              background: isCur ? '#F59E0B' : answered ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.07)',
              border: isCur ? '2px solid #F59E0B' : answered ? '1px solid #60A5FA' : '1px solid rgba(255,255,255,0.12)',
              color: isCur ? '#000' : answered ? '#60A5FA' : '#475569',
            }}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

function SubjectBar({ subject, correct, total }: SubjectStat) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const color = pct >= 70 ? '#34D399' : pct >= 50 ? '#F59E0B' : '#FB7185';
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: '#CBD5E1' }}>{subject}</span>
        <span style={{ color }}>{correct}/{total} ({pct}%)</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <motion.div
          className="h-2 rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: 0.1 }}
        />
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function ExamPage() {
  const [phase, setPhase]     = useState<Phase>('select');
  const [mode, setMode]       = useState<ExamMode>('quick');
  const [selSubject, setSelSubject] = useState<string | undefined>(undefined);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [history, setHistory] = useState<ExamRecord[]>(() => loadHistory());
  const [showNav, setShowNav] = useState(false);
  const [showWrong, setShowWrong] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Refs so timer callbacks always see latest values without resetting the interval
  const questionsRef = useRef<QuizQuestion[]>([]);
  const answersRef   = useRef<(number | null)[]>([]);
  const startTimeRef = useRef(0);
  const modeRef      = useRef<ExamMode>('quick');
  const subjectRef   = useRef<string | undefined>(undefined);

  const doSubmit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const qs  = questionsRef.current;
    const ans = answersRef.current;
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const sc = qs.reduce((acc, q, i) => acc + (ans[i] === q.correctIndex ? 1 : 0), 0);
    const record: ExamRecord = {
      id: Date.now().toString(),
      mode: modeRef.current,
      subject: subjectRef.current,
      score: sc,
      total: qs.length,
      date: new Date().toLocaleString('ja-JP'),
      durationSeconds: elapsed,
    };
    const updated = [record, ...loadHistory()].slice(0, 10);
    setHistory(updated);
    saveHistory(updated);
    setPhase('result');
  }, []);

  // Keep refs in sync
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { answersRef.current = answers; },     [answers]);
  useEffect(() => { startTimeRef.current = startTime; }, [startTime]);
  useEffect(() => { modeRef.current = mode; subjectRef.current = selSubject; }, [mode, selSubject]);

  // Timer — only restarts when exam phase begins (not on every answer)
  useEffect(() => {
    if (phase !== 'exam') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); doSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Start exam ────────────────────────────────────────────────────────────
  const startExam = (m: ExamMode, sub?: string) => {
    const qs = buildExamQuestions(m, sub);
    const secs = MODE_CONFIG[m].minutes * 60;
    const now = Date.now();
    // Sync refs immediately before the interval fires
    modeRef.current    = m;
    subjectRef.current = sub;
    questionsRef.current = qs;
    answersRef.current   = new Array(qs.length).fill(null);
    startTimeRef.current = now;
    setMode(m);
    setSelSubject(sub);
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(null));
    setCurrent(0);
    setTimeLeft(secs);
    setStartTime(now);
    setShowNav(false);
    setShowWrong(false);
    setPhase('exam');
  };

  const pickAnswer = (optIdx: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = optIdx;
      return next;
    });
  };

  const handleSubmit = () => { doSubmit(); };

  // ── Computed result values ─────────────────────────────────────────────
  const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0);
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const bySubject: SubjectStat[] = Object.values(
    questions.reduce<Record<string, SubjectStat>>((acc, q, i) => {
      const s = q.subject;
      if (!acc[s]) acc[s] = { subject: s, correct: 0, total: 0 };
      acc[s].total++;
      if (answers[i] === q.correctIndex) acc[s].correct++;
      return acc;
    }, {})
  ).sort((a, b) => (a.correct / a.total) - (b.correct / b.total));

  const wrongList = questions.map((q, i) => ({ q, userAnswer: answers[i], idx: i })).filter((x) => x.userAnswer !== x.q.correctIndex);

  const minLeft = Math.floor(timeLeft / 60);
  const secLeft = timeLeft % 60;
  const timerColor = timeLeft > 120 ? '#34D399' : timeLeft > 60 ? '#F59E0B' : '#FB7185';
  const answeredCount = answers.filter((a) => a !== null).length;

  // ── PHASE: SELECT ─────────────────────────────────────────────────────────
  if (phase === 'select') return (
    <div className="px-4 pt-10 pb-28 max-w-lg mx-auto">
      <div className="mb-7">
        <h1 className="heading-serif text-2xl mb-1" style={{ color: '#F59E0B' }}>模擬テスト</h1>
        <p className="text-xs" style={{ color: '#64748B' }}>本番さながらの試験形式で実力を確かめよう</p>
      </div>

      <div className="flex flex-col gap-3 mb-8">
        {(Object.entries(MODE_CONFIG) as [ExamMode, typeof MODE_CONFIG[ExamMode]][]).map(([key, cfg]) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.97 }}
            onClick={() => key === 'subject' ? setPhase('subject_pick') : startExam(key)}
            className="glass-card p-4 flex items-center gap-4 text-left"
            style={{ border: `1px solid ${cfg.color}25` }}
          >
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${cfg.color}18` }}>
              <span style={{ color: cfg.color }}>{cfg.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm mb-0.5" style={{ color: '#F8FAFC' }}>{cfg.label}</p>
              <p className="text-xs leading-tight" style={{ color: '#64748B' }}>{cfg.desc}</p>
            </div>
            <ChevronRight size={16} style={{ color: '#334155' }} />
          </motion.button>
        ))}
      </div>

      {history.length > 0 && (
        <div>
          <p className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: '#94A3B8' }}>
            <BarChart2 size={13} /> 直近の受験履歴
          </p>
          <div className="flex flex-col gap-2">
            {history.slice(0, 5).map((h) => {
              const p = Math.round((h.score / h.total) * 100);
              const c = p >= 70 ? '#34D399' : p >= 50 ? '#F59E0B' : '#FB7185';
              return (
                <div key={h.id} className="glass-card px-4 py-2.5 flex items-center justify-between"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <span className="text-xs font-medium" style={{ color: '#CBD5E1' }}>
                      {MODE_CONFIG[h.mode].label}{h.subject ? ` (${h.subject})` : ''}
                    </span>
                    <p className="text-[10px]" style={{ color: '#475569' }}>{h.date}</p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: c }}>{h.score}/{h.total} ({p}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // ── PHASE: SUBJECT PICK ───────────────────────────────────────────────────
  if (phase === 'subject_pick') return (
    <div className="px-4 pt-10 pb-28 max-w-lg mx-auto">
      <button onClick={() => setPhase('select')} className="flex items-center gap-1 text-sm mb-5" style={{ color: '#64748B' }}>
        <ChevronLeft size={15} /> 戻る
      </button>
      <h2 className="heading-serif text-xl mb-5" style={{ color: '#60A5FA' }}>科目を選択</h2>
      <div className="flex flex-col gap-2">
        {EXAM_SUBJECTS.map((s) => {
          const cnt = ALL_QUIZZES.filter((q) => q.subject === s).length;
          return (
            <motion.button key={s} whileTap={{ scale: 0.97 }}
              onClick={() => startExam('subject', s)}
              className="glass-card p-4 flex items-center justify-between"
              style={{ border: '1px solid rgba(96,165,250,0.18)' }}>
              <span className="font-medium text-sm" style={{ color: '#F8FAFC' }}>{s}</span>
              <span className="text-xs" style={{ color: '#475569' }}>{cnt}問</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  // ── PHASE: EXAM ───────────────────────────────────────────────────────────
  if (phase === 'exam' && questions.length > 0) {
    const q = questions[current];
    const chosen = answers[current];

    return (
      <div className="px-4 pt-8 pb-28 max-w-lg mx-auto">
        {/* Header bar */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setPhase('select'); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <X size={14} style={{ color: '#94A3B8' }} />
          </button>

          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1" style={{ color: '#475569' }}>
              <span>{current + 1} / {questions.length}問</span>
              <span style={{ color: '#60A5FA' }}>{answeredCount}/{questions.length} 回答済</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <motion.div className="h-1.5 rounded-full"
                style={{ background: 'linear-gradient(90deg,#F59E0B,#D97706)' }}
                animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
                transition={{ duration: 0.3 }} />
            </div>
          </div>

          {/* Timer */}
          <div className="flex-shrink-0 px-3 py-1 rounded-xl flex items-center gap-1.5"
            style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${timerColor}40` }}>
            <Clock size={11} style={{ color: timerColor }} />
            <span className="text-xs font-bold tabular-nums" style={{ color: timerColor }}>
              {minLeft}:{String(secLeft).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Question number grid toggle */}
        <button onClick={() => setShowNav((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl mb-3 text-xs"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#64748B' }}>
          <span>問題一覧を表示</span>
          {showNav ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        <AnimatePresence>
          {showNav && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-3">
              <div className="py-2 px-1">
                <ProgressDots total={questions.length} current={current} answers={answers}
                  onJump={(i) => { setCurrent(i); setShowNav(false); }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <div className="glass-card p-4 mb-4" style={{ border: '1px solid rgba(245,158,11,0.18)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="subject-badge">{q.subject}</span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{
                  background: q.difficulty === 'hard' ? 'rgba(251,113,133,0.15)' : q.difficulty === 'normal' ? 'rgba(245,158,11,0.12)' : 'rgba(52,211,153,0.12)',
                  color: q.difficulty === 'hard' ? '#FB7185' : q.difficulty === 'normal' ? '#F59E0B' : '#34D399',
                }}>
                  {q.difficulty === 'hard' ? '難' : q.difficulty === 'normal' ? '中' : '易'}
                </span>
              </div>
              <p className="text-sm font-medium leading-relaxed" style={{ color: '#F1F5F9' }}>{q.question}</p>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-2 mb-5">
              {q.options.map((opt, i) => {
                const isSelected = chosen === i;
                return (
                  <motion.button key={i} whileTap={{ scale: 0.98 }}
                    onClick={() => pickAnswer(i)}
                    className="p-3.5 rounded-xl text-left text-sm transition-all duration-150"
                    style={{
                      background: isSelected ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                      border: isSelected ? '1.5px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',
                      color: isSelected ? '#FDE68A' : '#CBD5E1',
                    }}>
                    <span className="font-bold mr-2" style={{ color: isSelected ? '#F59E0B' : '#475569' }}>
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {opt}
                    {isSelected && <CheckCircle size={13} className="inline ml-2 mb-0.5" style={{ color: '#F59E0B' }} />}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-2">
          <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}
            className="flex-shrink-0 px-4 py-3 rounded-xl font-bold text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', color: current === 0 ? '#334155' : '#94A3B8', border: '1px solid rgba(255,255,255,0.06)' }}>
            <ChevronLeft size={16} />
          </button>

          {current < questions.length - 1 ? (
            <button onClick={() => setCurrent((c) => c + 1)}
              className="flex-1 py-3 rounded-xl font-bold text-sm"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
              次の問題 →
            </button>
          ) : (
            <button onClick={handleSubmit}
              className="flex-1 py-3 rounded-xl font-bold text-sm"
              style={{ background: answeredCount === questions.length ? '#F59E0B' : 'rgba(245,158,11,0.15)', color: answeredCount === questions.length ? '#000' : '#F59E0B', border: '1px solid rgba(245,158,11,0.4)' }}>
              {answeredCount < questions.length ? `答え合わせ (未回答 ${questions.length - answeredCount}問)` : '採点する →'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── PHASE: RESULT ─────────────────────────────────────────────────────────
  if (phase === 'result') {
    const passed = pct >= 60;
    const elapsed = history[0]?.durationSeconds ?? 0;
    const elMin = Math.floor(elapsed / 60);
    const elSec = elapsed % 60;
    const scoreColor = pct >= 70 ? '#34D399' : pct >= 50 ? '#F59E0B' : '#FB7185';

    return (
      <div className="px-4 pt-10 pb-28 max-w-lg mx-auto">
        {/* Score card */}
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 text-center mb-5" style={{ border: `1px solid ${scoreColor}30` }}>
          <div className="text-5xl mb-3">{pct >= 80 ? '🏆' : pct >= 60 ? '🎯' : pct >= 40 ? '💪' : '📚'}</div>
          <p className="text-xs mb-1" style={{ color: '#64748B' }}>{MODE_CONFIG[mode].label}{selSubject ? ` — ${selSubject}` : ''}</p>
          <div className="text-5xl font-black mb-1" style={{ color: scoreColor }}>{pct}%</div>
          <p className="text-lg font-bold mb-2" style={{ color: '#94A3B8' }}>{score} / {questions.length} 問正解</p>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: passed ? 'rgba(52,211,153,0.15)' : 'rgba(251,113,133,0.15)', color: passed ? '#34D399' : '#FB7185', border: `1px solid ${passed ? '#34D39940' : '#FB718540'}` }}>
            {passed ? '✅ 合格ライン（60%以上）' : '❌ もう一息！'}
          </span>
          <p className="text-xs mt-2" style={{ color: '#475569' }}>解答時間 {elMin}分{elSec}秒</p>
        </motion.div>

        {/* Subject breakdown */}
        {bySubject.length > 0 && (
          <div className="glass-card p-4 mb-4" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: '#94A3B8' }}>
              <BarChart2 size={13} /> 科目別正答率
            </p>
            {bySubject.map((s) => <SubjectBar key={s.subject} {...s} />)}
          </div>
        )}

        {/* Wrong answers */}
        {wrongList.length > 0 && (
          <div className="mb-4">
            <button onClick={() => setShowWrong((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl mb-2 font-bold text-sm"
              style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.25)', color: '#FB7185' }}>
              <span className="flex items-center gap-2">
                <AlertCircle size={14} /> 間違えた問題 ({wrongList.length}問)
              </span>
              {showWrong ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
              {showWrong && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="flex flex-col gap-3 pt-1">
                    {wrongList.map(({ q, userAnswer, idx }) => (
                      <div key={q.id} className="glass-card p-4" style={{ border: '1px solid rgba(251,113,133,0.15)' }}>
                        <p className="text-xs font-bold mb-1" style={{ color: '#94A3B8' }}>問 {idx + 1}</p>
                        <p className="text-sm font-medium mb-3" style={{ color: '#F1F5F9' }}>{q.question}</p>
                        {userAnswer !== null && userAnswer !== undefined && (
                          <p className="text-xs mb-1 flex items-center gap-1" style={{ color: '#FB7185' }}>
                            <X size={11} /> あなたの回答: {q.options[userAnswer]}
                          </p>
                        )}
                        {userAnswer === null && (
                          <p className="text-xs mb-1" style={{ color: '#64748B' }}>（未回答）</p>
                        )}
                        <p className="text-xs mb-2 flex items-center gap-1" style={{ color: '#34D399' }}>
                          <CheckCircle size={11} /> 正解: {q.options[q.correctIndex]}
                        </p>
                        <div className="p-3 rounded-lg text-xs leading-relaxed" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: '#94A3B8' }}>
                          {q.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={() => startExam(mode, selSubject)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', color: '#F59E0B' }}>
            <RotateCcw size={14} /> もう一度
          </button>
          <Link href="/" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8' }}>
            <Home size={14} /> ホームへ
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
