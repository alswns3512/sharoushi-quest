'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Flame, Star, ChevronRight, BookOpen, CheckCircle2, Lightbulb } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useQuestStore } from '@/store/questStore';
import { useStudyStore } from '@/store/studyStore';
import { useStreak } from '@/hooks/useStreak';
import { ALL_BADGES } from '@/data/badges';
import { TriviaModal, useTriviaAutoShow } from '@/components/game/TriviaModal';
import { useSound } from '@/hooks/useSound';

// ── レベルに応じたキャラアイコン ────────────────────────
function charIcon(level: number) {
  if (level <= 10) return '🌱';
  if (level <= 20) return '📖';
  if (level <= 30) return '⚖️';
  if (level <= 50) return '🎓';
  return '🏆';
}

// ── 8週間ヒートマップ ────────────────────────────────────
function Heatmap() {
  const { sessions } = useStudyStore();
  const [tip, setTip] = useState<{ date: string; minutes: number } | null>(null);

  const cells = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((s) => {
      const key = new Date(s.date).toDateString();
      map.set(key, (map.get(key) ?? 0) + s.durationMinutes);
    });

    const result: { key: string; label: string; minutes: number }[] = [];
    for (let i = 55; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toDateString();
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      result.push({ key, label, minutes: map.get(key) ?? 0 });
    }
    return result;
  }, [sessions]);

  const weeks: typeof cells[] = [];
  for (let w = 0; w < 8; w++) weeks.push(cells.slice(w * 7, w * 7 + 7));

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1 flex-shrink-0">
            {week.map((cell) => (
              <button
                key={cell.key}
                onClick={() => setTip(tip?.date === cell.key ? null : { date: cell.label, minutes: cell.minutes })}
                className="rounded-sm transition-transform hover:scale-110"
                style={{
                  width: 12, height: 12,
                  background: cell.minutes > 0
                    ? cell.minutes >= 30
                      ? 'rgba(245,158,11,0.9)'
                      : 'rgba(245,158,11,0.45)'
                    : 'rgba(255,255,255,0.07)',
                  boxShadow: cell.minutes > 0 ? '0 0 4px rgba(245,158,11,0.4)' : 'none',
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {tip && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(245,158,11,0.12)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.3)' }}
          >
            {tip.date}：{tip.minutes > 0 ? `${tip.minutes}分学習` : '学習なし'}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-xs text-ink-subtle">少</span>
        {[0.07, 0.3, 0.6, 0.9].map((op) => (
          <div key={op} className="rounded-sm" style={{ width: 10, height: 10, background: op < 0.15 ? 'rgba(255,255,255,0.07)' : `rgba(245,158,11,${op})` }} />
        ))}
        <span className="text-xs text-ink-subtle">多</span>
      </div>
    </div>
  );
}

// ── メインページ ──────────────────────────────────────────
export default function HomePage() {
  const { progress } = useUserStore();
  const { quests } = useQuestStore();
  const { streak, streakMessage } = useStreak();
  const { showTrivia, setShowTrivia } = useTriviaAutoShow();
  const { play } = useSound();

  const xpPct = progress.xpToNextLevel > 0
    ? Math.min(100, Math.floor((progress.currentXP / progress.xpToNextLevel) * 100))
    : 100;

  const dailyQuests = quests.filter((q) => q.type === 'daily');

  const recentBadges = useMemo(() => {
    return ALL_BADGES.map((b) => ({
      ...b,
      isUnlocked: progress.unlockedBadges.includes(b.id),
    })).slice(0, 6);
  }, [progress.unlockedBadges]);

  return (
    <div className="pb-32 max-w-lg mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <h1
          className="heading-serif text-2xl font-black"
          style={{ background: 'linear-gradient(135deg,#F59E0B,#FCD34D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.4))' }}
        >
          社労士クエスト
        </h1>
        <Link href="/collection" className="w-10 h-10 flex items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <Settings size={18} style={{ color: '#94A3B8' }} />
        </Link>
      </div>

      {/* ── User Status Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-4 mb-4 glass-card p-5"
        style={{ border: '1px solid rgba(245,158,11,0.2)', boxShadow: '0 0 30px rgba(245,158,11,0.1)' }}
      >
        <div className="flex items-center gap-4 mb-4">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="text-4xl flex-shrink-0"
          >
            {charIcon(progress.level)}
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex items-end gap-2">
              <span className="heading-serif text-3xl font-black" style={{ color: '#F59E0B', textShadow: '0 0 12px rgba(245,158,11,0.5)' }}>
                Lv.{progress.level}
              </span>
              <span className="text-sm text-ink-muted mb-0.5">{progress.totalXP.toLocaleString()} XP</span>
            </div>
            <p className="text-xs text-ink-muted">{streakMessage}</p>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(251,113,133,0.15)', border: '1px solid rgba(251,113,133,0.3)' }}>
              <Flame size={14} style={{ color: '#FB7185' }} />
              <span className="text-sm font-bold" style={{ color: '#FB7185' }}>{streak}</span>
            </div>
            <span className="text-[10px] text-ink-subtle">{progress.totalStudyMinutes}分学習</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-ink-muted mb-1">
            <span>次のレベルまで</span>
            <span>{progress.currentXP} / {progress.xpToNextLevel} XP</span>
          </div>
          <div className="xp-bar-track">
            <motion.div
              className="xp-bar-fill"
              initial={{ width: '0%' }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        </div>
      </motion.div>

      {/* ── Trivia button ── */}
      <div className="px-4 mb-4">
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => { setShowTrivia(true); play('tap'); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.25)',
          }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.15)' }}
          >
            <Lightbulb size={16} style={{ color: '#F59E0B' }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-bold" style={{ color: '#FCD34D' }}>今日の社労士豆知識</p>
            <p className="text-[10px] text-ink-muted">タップして確認する</p>
          </div>
          <ChevronRight size={14} style={{ color: '#F59E0B' }} />
        </motion.button>
      </div>

      {/* ── Today's Quests ── */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm" style={{ color: '#F8FAFC' }}>今日のクエスト</h2>
          <Link href="/quest" className="text-xs flex items-center gap-0.5" style={{ color: '#F59E0B' }}>
            すべて見る <ChevronRight size={12} />
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {dailyQuests.map((q, i) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="glass-card px-4 py-3 flex items-center gap-3"
              style={q.isCompleted ? { opacity: 0.5 } : {}}
            >
              {q.isCompleted ? (
                <CheckCircle2 size={20} style={{ color: '#10B981', flexShrink: 0 }} />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 flex-shrink-0" style={{ borderColor: '#F59E0B' }} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: q.isCompleted ? '#94A3B8' : '#F8FAFC' }}>{q.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 xp-bar-track" style={{ height: 4 }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${q.target > 0 ? Math.min(100, (q.current / q.target) * 100) : 0}%`,
                        background: q.isCompleted ? '#10B981' : 'linear-gradient(90deg,#F59E0B,#FCD34D)',
                        boxShadow: q.isCompleted ? 'none' : '0 0 4px rgba(245,158,11,0.6)',
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-ink-subtle flex-shrink-0">{q.current}/{q.target}</span>
                </div>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Star size={11} style={{ color: '#F59E0B' }} />
                <span className="text-xs font-bold" style={{ color: '#F59E0B' }}>{q.xpReward}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Recent Badges ── */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm" style={{ color: '#F8FAFC' }}>バッジ実績</h2>
          <Link href="/collection" className="text-xs flex items-center gap-0.5" style={{ color: '#F59E0B' }}>
            すべて見る <ChevronRight size={12} />
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {recentBadges.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i }}
              className="flex-shrink-0 flex flex-col items-center gap-1 glass-card p-3"
              style={{
                width: 72,
                border: b.isUnlocked ? '1px solid rgba(252,211,77,0.4)' : '1px solid rgba(255,255,255,0.05)',
                opacity: b.isUnlocked ? 1 : 0.4,
              }}
            >
              <span className="text-2xl" style={{ filter: b.isUnlocked ? 'none' : 'grayscale(1)' }}>{b.icon}</span>
              <span className="text-[9px] text-center leading-tight font-medium" style={{ color: b.isUnlocked ? '#FCD34D' : '#475569' }}>
                {b.isUnlocked ? b.name : '???'}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Heatmap ── */}
      <div className="px-4 mb-5">
        <h2 className="font-bold text-sm mb-3" style={{ color: '#F8FAFC' }}>学習ヒートマップ</h2>
        <div className="glass-card p-4">
          <Heatmap />
        </div>
      </div>

      {/* ── Stats row ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mx-4 mb-6 glass-card p-4 grid grid-cols-3 gap-2 text-center"
      >
        <div>
          <div className="font-bold text-xl" style={{ color: '#10B981' }}>{progress.completedLevels.length}</div>
          <div className="text-xs text-ink-muted">クリア済み</div>
        </div>
        <div>
          <div className="font-bold text-xl" style={{ color: '#FB7185' }}>{progress.quizCorrectCount}</div>
          <div className="text-xs text-ink-muted">クイズ正解</div>
        </div>
        <div>
          <div className="font-bold text-xl" style={{ color: '#F59E0B' }}>{progress.unlockedBadges.length}</div>
          <div className="text-xs text-ink-muted">バッジ獲得</div>
        </div>
      </motion.div>

      {/* ── CTA Button ── */}
      <div className="fixed bottom-16 left-0 right-0 px-4 z-40 max-w-lg mx-auto" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 64px)' }}>
        <motion.div
          animate={{ boxShadow: ['0 0 20px rgba(245,158,11,0.4)', '0 0 40px rgba(245,158,11,0.7)', '0 0 20px rgba(245,158,11,0.4)'] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="rounded-2xl"
        >
          <Link href="/study">
            <motion.button
              whileTap={{ scale: 0.93 }}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-base"
              style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#0F172A' }}
            >
              <BookOpen size={20} />
              今日の学習を始める
              <ChevronRight size={18} />
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* ── Trivia Modal ── */}
      <TriviaModal open={showTrivia} onClose={() => setShowTrivia(false)} />
    </div>
  );
}
