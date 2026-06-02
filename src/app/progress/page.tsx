'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2, Flame, Star, BookOpen, HelpCircle, Clock,
  TrendingUp, Target, Calendar, Zap,
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useStudyStore } from '@/store/studyStore';
import { STUDY_LEVELS } from '@/data/levels';

// ── 科目定義 ──────────────────────────────────────────────────
const SUBJECTS = [
  { key: 'intro',     label: '超入門',         icon: '📘', color: '#38BDF8', difficulty: 1, totalLevels: 10 },
  { key: 'sharoushi', label: '社労士基礎',      icon: '⚖️', color: '#F59E0B', difficulty: 2, totalLevels: 10 },
  { key: 'rodo',      label: '労働基準法',       icon: '📋', color: '#10B981', difficulty: 3, totalLevels: 15 },
  { key: 'anzen',     label: '労働安全衛生法',   icon: '🦺', color: '#FB7185', difficulty: 3, totalLevels: 10 },
  { key: 'rousai',    label: '労災保険法',       icon: '🏥', color: '#818CF8', difficulty: 4, totalLevels: 12 },
  { key: 'koyo',      label: '雇用保険法',       icon: '🏢', color: '#FCD34D', difficulty: 4, totalLevels: 12 },
  { key: 'kenko',     label: '健康保険法',       icon: '💊', color: '#34D399', difficulty: 4, totalLevels: 11 },
  { key: 'nenkin',    label: '年金法',           icon: '🏦', color: '#F472B6', difficulty: 5, totalLevels: 10 },
] as const;

const TOTAL_LEVELS = 100;
const IMPLEMENTED_LEVELS = 30;
// 1レベルあたりの総合学習時間（アプリ内+自主復習含む）
// 社労士試験の推奨学習時間 約300〜500時間 → 100レベルで割ると1レベル≒60分
const AVG_MINS_PER_LEVEL = 60;

// ── 次の社労士試験日を自動計算（毎年8月第4日曜日）──────────────
function getNextExamDate(): Date {
  const now = new Date();
  for (let year = now.getFullYear(); year <= now.getFullYear() + 1; year++) {
    // 8月の第4日曜日を求める
    let sunCount = 0;
    for (let d = 1; d <= 31; d++) {
      const date = new Date(year, 7, d); // 8月
      if (date.getMonth() !== 7) break;
      if (date.getDay() === 0) { // 日曜日
        sunCount++;
        if (sunCount === 4) {
          // 今日より後なら採用
          if (date > now) return date;
          break;
        }
      }
    }
  }
  return new Date(now.getFullYear() + 1, 7, 1);
}

// ── 難易度 ★ 表示 ────────────────────────────────────────────
function DifficultyStars({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ fontSize: 9, color: i <= level ? '#F59E0B' : '#1E293B' }}>★</span>
      ))}
    </div>
  );
}

// ── 8週ヒートマップ ───────────────────────────────────────────
function Heatmap({ sessions }: { sessions: { date: string; durationMinutes: number }[] }) {
  const cells = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((s) => {
      const key = new Date(s.date).toDateString();
      map.set(key, (map.get(key) ?? 0) + s.durationMinutes);
    });
    const result: { key: string; label: string; minutes: number }[] = [];
    for (let i = 55; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      result.push({ key: d.toDateString(), label: `${d.getMonth() + 1}/${d.getDate()}`, minutes: map.get(d.toDateString()) ?? 0 });
    }
    return result;
  }, [sessions]);

  const weeks: typeof cells[] = [];
  for (let w = 0; w < 8; w++) weeks.push(cells.slice(w * 7, w * 7 + 7));

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1 flex-shrink-0">
          {week.map((cell) => (
            <div
              key={cell.key}
              title={`${cell.label}: ${cell.minutes}分`}
              className="rounded-sm"
              style={{
                width: 11, height: 11,
                background: cell.minutes >= 30
                  ? 'rgba(245,158,11,0.9)'
                  : cell.minutes > 0
                    ? 'rgba(245,158,11,0.4)'
                    : 'rgba(255,255,255,0.06)',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── 合格タイムライン計算 ─────────────────────────────────────
interface Scenario {
  label: string;
  icon: string;
  color: string;
  minsPerDay: number;
  daysPerWeek: number;
  description: string;
}

const SCENARIOS: Scenario[] = [
  { label: '楽観シナリオ',   icon: '🚀', color: '#10B981', minsPerDay: 40, daysPerWeek: 7, description: '毎日40分学習' },
  { label: '標準シナリオ',   icon: '📚', color: '#F59E0B', minsPerDay: 25, daysPerWeek: 5, description: '毎日25分・週5日' },
  { label: '忙しいシナリオ', icon: '⏱️', color: '#818CF8', minsPerDay: 15, daysPerWeek: 4, description: '15分・週4日' },
];

function calcDaysToGoal(completedLevels: number, scenario: Scenario): number {
  const remainingLevels = Math.max(0, TOTAL_LEVELS - completedLevels);
  const remainingMins = remainingLevels * AVG_MINS_PER_LEVEL;
  const minsPerWeek = scenario.minsPerDay * scenario.daysPerWeek;
  const weeks = remainingMins / minsPerWeek;
  return Math.ceil(weeks * 7);
}

function formatDays(days: number): string {
  if (days <= 0) return '合格レベル達成！🎉';
  if (days < 30) return `約${days}日`;
  if (days < 365) return `約${Math.round(days / 30)}か月`;
  return `約${(days / 365).toFixed(1)}年`;
}

function formatTargetDate(days: number): string {
  if (days <= 0) return '';
  const d = new Date(Date.now() + days * 86400000);
  return `${d.getFullYear()}年${d.getMonth() + 1}月頃`;
}

// ── Main Page ─────────────────────────────────────────────────
export default function ProgressPage() {
  const { progress } = useUserStore();
  const { sessions, getSessionsThisWeek } = useStudyStore();
  const nextExam = getNextExamDate();
  const daysToExam = Math.ceil((nextExam.getTime() - Date.now()) / 86400000);

  const completedCount = progress.completedLevels.length;
  const overallPct = Math.min(100, Math.floor((completedCount / TOTAL_LEVELS) * 100));
  const implPct = Math.min(100, Math.floor((completedCount / IMPLEMENTED_LEVELS) * 100));

  const xpPercent = progress.xpToNextLevel > 0
    ? Math.min(100, Math.floor((progress.currentXP / progress.xpToNextLevel) * 100))
    : 100;

  const accuracyPct = progress.quizTotalCount > 0
    ? Math.floor((progress.quizCorrectCount / progress.quizTotalCount) * 100)
    : 0;

  const weekSessions = getSessionsThisWeek();
  const weekMinutes = weekSessions.reduce((s, ss) => s + ss.durationMinutes, 0);

  // 推定残り時間
  const remainingLevels = Math.max(0, TOTAL_LEVELS - completedCount);
  const estimatedRemainingMins = remainingLevels * AVG_MINS_PER_LEVEL;

  // 科目別進捗
  const subjectStats = useMemo(() => {
    return SUBJECTS.map((sub) => {
      const subLevels = STUDY_LEVELS.filter((l) => l.subject === sub.key);
      const cleared = subLevels.filter((l) => progress.completedLevels.includes(l.id)).length;
      const pct = subLevels.length > 0 ? Math.floor((cleared / subLevels.length) * 100) : 0;
      return { ...sub, cleared, total: subLevels.length, pct };
    });
  }, [progress.completedLevels]);

  return (
    <div className="px-4 pt-8 pb-8 max-w-lg mx-auto flex flex-col gap-5">

      {/* ── Title ── */}
      <div className="flex items-center gap-2">
        <BarChart2 size={22} style={{ color: '#38BDF8' }} />
        <h1 className="heading-serif text-2xl" style={{ color: '#38BDF8' }}>学習進捗</h1>
      </div>

      {/* ── XP Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5"
        style={{ border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 0 20px rgba(245,158,11,0.08)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="heading-serif text-3xl font-bold" style={{ color: '#F59E0B' }}>Lv.{progress.level}</div>
            <div className="text-xs text-ink-muted">総XP: {progress.totalXP.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold" style={{ color: '#F8FAFC' }}>{progress.currentXP} / {progress.xpToNextLevel} XP</div>
            <div className="text-xs text-ink-muted">次のレベルまで</div>
          </div>
        </div>
        <div className="xp-bar-track">
          <motion.div className="xp-bar-fill" initial={{ width: 0 }} animate={{ width: `${xpPercent}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
        </div>
        <div className="text-xs text-right mt-1" style={{ color: '#F59E0B' }}>{xpPercent}%</div>
      </motion.div>

      {/* ── 全体進捗サマリー ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-5"
        style={{ border: '1px solid rgba(56,189,248,0.25)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} style={{ color: '#38BDF8' }} />
          <h2 className="text-xs font-bold" style={{ color: '#38BDF8' }}>全体進捗サマリー</h2>
        </div>

        <div className="flex items-end gap-3 mb-3">
          <span className="heading-serif font-black" style={{ fontSize: 48, lineHeight: 1, color: '#F8FAFC' }}>
            {completedCount}
          </span>
          <span className="text-ink-muted text-sm mb-1">/ {TOTAL_LEVELS} レベルクリア</span>
          <span className="ml-auto text-xl font-bold" style={{ color: '#38BDF8' }}>{overallPct}%</span>
        </div>

        {/* 全体バー */}
        <div className="xp-bar-track mb-1" style={{ height: 10 }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #38BDF8, #818CF8)',
              boxShadow: '0 0 8px rgba(56,189,248,0.5)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-ink-subtle mb-3">
          <span>スタート</span>
          <span>合格レベル（{TOTAL_LEVELS}レベル完走）</span>
        </div>

        {/* 実装済みの進捗 */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <BookOpen size={13} style={{ color: '#10B981', flexShrink: 0 }} />
          <div className="flex-1">
            <div className="text-[10px] text-ink-muted mb-0.5">現在実装済みコンテンツ</div>
            <div className="xp-bar-track" style={{ height: 4 }}>
              <div className="h-full rounded-full" style={{ width: `${implPct}%`, background: '#10B981' }} />
            </div>
          </div>
          <span className="text-xs font-bold flex-shrink-0" style={{ color: '#10B981' }}>
            {completedCount}/{IMPLEMENTED_LEVELS}
          </span>
        </div>

        {/* 推定残り時間 */}
        <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <Clock size={13} style={{ color: '#F59E0B', flexShrink: 0 }} />
          <span className="text-[10px] text-ink-muted">推定残り学習時間</span>
          <span className="ml-auto text-xs font-bold" style={{ color: '#F59E0B' }}>
            約{estimatedRemainingMins >= 60 ? `${Math.floor(estimatedRemainingMins / 60)}時間${estimatedRemainingMins % 60}分` : `${estimatedRemainingMins}分`}
          </span>
        </div>
      </motion.div>

      {/* ── 科目別進捗 ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={14} style={{ color: '#10B981' }} />
          <h2 className="text-xs font-bold" style={{ color: '#10B981' }}>科目別進捗</h2>
        </div>

        <div className="flex flex-col gap-3">
          {subjectStats.map((sub, i) => (
            <motion.div
              key={sub.key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base flex-shrink-0">{sub.icon}</span>
                <span className="text-xs font-bold flex-1" style={{ color: '#F8FAFC' }}>{sub.label}</span>
                <DifficultyStars level={sub.difficulty} />
                <span className="text-[10px] font-bold flex-shrink-0" style={{ color: sub.color }}>
                  {sub.total > 0 ? `${sub.cleared}/${sub.total}` : '準備中'}
                </span>
              </div>
              <div className="xp-bar-track" style={{ height: 6 }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${sub.color}, ${sub.color}99)`,
                    boxShadow: sub.pct > 0 ? `0 0 6px ${sub.color}60` : 'none',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${sub.total > 0 ? sub.pct : 0}%` }}
                  transition={{ duration: 0.8, delay: 0.25 + i * 0.05 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── 合格までの道のり ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card p-4"
        style={{ border: '1px solid rgba(245,158,11,0.2)', boxShadow: '0 0 20px rgba(245,158,11,0.06)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={14} style={{ color: '#FCD34D' }} />
          <h2 className="text-xs font-bold" style={{ color: '#FCD34D' }}>合格までの道のり</h2>
          <span className="text-[9px] text-ink-subtle ml-auto">推定 300〜500時間学習基準</span>
        </div>

        {/* 次の試験日カウントダウン */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl mb-4"
          style={{ background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.25)' }}>
          <div>
            <p className="text-[10px] font-bold" style={{ color: '#FB7185' }}>📅 次回 社労士試験</p>
            <p className="text-xs text-ink-muted">
              {nextExam.getFullYear()}年{nextExam.getMonth() + 1}月{nextExam.getDate()}日（8月第4日曜）
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black" style={{ color: '#FB7185' }}>あと{daysToExam}日</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {SCENARIOS.map((sc, i) => {
            const days = calcDaysToGoal(completedCount, sc);
            const targetDate = formatTargetDate(days);
            const isAchieved = days <= 0;
            return (
              <motion.div
                key={sc.label}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.07 }}
                className="rounded-xl p-3"
                style={{ background: `${sc.color}10`, border: `1px solid ${sc.color}30` }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base">{sc.icon}</span>
                  <div className="flex-1">
                    <div className="text-xs font-bold" style={{ color: sc.color }}>{sc.label}</div>
                    <div className="text-[9px] text-ink-subtle">{sc.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black" style={{ color: isAchieved ? '#10B981' : sc.color }}>
                      {formatDays(days)}
                    </div>
                    {targetDate && (
                      <div className="text-[9px] text-ink-subtle">{targetDate}</div>
                    )}
                  </div>
                </div>
                {/* Progress bar showing how far along */}
                <div className="xp-bar-track" style={{ height: 4 }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${overallPct}%`,
                      background: `linear-gradient(90deg, ${sc.color}, ${sc.color}aa)`,
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="text-[9px] text-ink-subtle mt-3 text-center">
          ※ 社労士試験の推奨学習300〜500時間をもとに試算。試験日は毎年自動更新。
        </p>
      </motion.div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: '連続学習',   value: `${progress.streak}日`,                    icon: Flame,      color: '#FB7185' },
          { label: 'クイズ正解', value: `${progress.quizCorrectCount}問`,           icon: HelpCircle, color: '#818CF8' },
          { label: '正解率',     value: `${accuracyPct}%`,                          icon: TrendingUp, color: '#38BDF8' },
          { label: '総学習時間', value: `${progress.totalStudyMinutes}分`,          icon: Clock,      color: '#FCD34D' },
          { label: '今週の学習', value: `${weekMinutes}分`,                         icon: Zap,        color: '#10B981' },
          { label: 'バッジ獲得', value: `${progress.unlockedBadges.length}個`,      icon: Star,       color: '#F59E0B' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.05 }}
            className="glass-card p-4 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
              <Icon size={17} style={{ color }} />
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color }}>{value}</div>
              <div className="text-[10px] text-ink-muted">{label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── ヒートマップ ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="glass-card p-4"
      >
        <h3 className="font-bold text-xs mb-3" style={{ color: '#F59E0B' }}>学習ヒートマップ（8週間）</h3>
        <Heatmap sessions={sessions} />
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-[10px] text-ink-subtle">少</span>
          {[0.06, 0.3, 0.6, 0.9].map((op) => (
            <div key={op} className="rounded-sm" style={{ width: 9, height: 9, background: op < 0.1 ? 'rgba(255,255,255,0.06)' : `rgba(245,158,11,${op})` }} />
          ))}
          <span className="text-[10px] text-ink-subtle">多</span>
        </div>
      </motion.div>

    </div>
  );
}
