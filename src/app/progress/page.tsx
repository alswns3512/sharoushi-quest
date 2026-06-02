'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Flame, Star, BookOpen, HelpCircle, Clock, TrendingUp } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useStudyStore } from '@/store/studyStore';

// ── 8-week heatmap ───────────────────────────────────────────
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
                boxShadow: cell.minutes > 0 ? '0 0 3px rgba(245,158,11,0.3)' : 'none',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Accuracy timeline (last 10 sessions) ─────────────────────
function AccuracyLine({ sessions }: { sessions: { xpEarned: number; levelsCompleted: string[] }[] }) {
  const recent = sessions.slice(-10);
  if (recent.length < 2) {
    return <div className="text-xs text-ink-subtle text-center py-4">データが足りません（2セッション以上必要）</div>;
  }

  const w = 260;
  const h = 60;
  const pts = recent.map((s, i) => {
    const pct = Math.min(100, s.levelsCompleted.length > 0 ? Math.round((s.xpEarned / (s.levelsCompleted.length * 100)) * 100) : 0);
    return { x: (i / (recent.length - 1)) * w, y: h - (pct / 100) * h };
  });
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg width={w} height={h + 16} viewBox={`0 0 ${w} ${h + 16}`}>
      <defs>
        <linearGradient id="lineArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818CF8" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#818CF8" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#lineArea)" />
      <path d={pathD} fill="none" stroke="#818CF8" strokeWidth={2} strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#818CF8" />
      ))}
      <text x={0} y={h + 13} fontSize={8} fill="#475569">古い</text>
      <text x={w} y={h + 13} fontSize={8} fill="#475569" textAnchor="end">最新</text>
    </svg>
  );
}

export default function ProgressPage() {
  const { progress } = useUserStore();
  const { sessions, getSessionsThisWeek } = useStudyStore();

  const xpPercent = progress.xpToNextLevel > 0
    ? Math.min(100, Math.floor((progress.currentXP / progress.xpToNextLevel) * 100))
    : 100;

  const accuracyPct = progress.quizTotalCount > 0
    ? Math.floor((progress.quizCorrectCount / progress.quizTotalCount) * 100)
    : 0;

  const weekSessions = getSessionsThisWeek();
  const weekMinutes = weekSessions.reduce((s, ss) => s + ss.durationMinutes, 0);
  const weekXP = weekSessions.reduce((s, ss) => s + ss.xpEarned, 0);

  const STATS = [
    { label: 'レベル',     value: `Lv.${progress.level}`,                    icon: Star,       color: '#F59E0B' },
    { label: '連続学習',   value: `${progress.streak}日`,                     icon: Flame,      color: '#FB7185' },
    { label: 'クリア済み', value: `${progress.completedLevels.length}ステージ`,icon: BookOpen,   color: '#10B981' },
    { label: 'クイズ正解', value: `${progress.quizCorrectCount}問`,           icon: HelpCircle, color: '#818CF8' },
    { label: '正解率',     value: `${accuracyPct}%`,                          icon: TrendingUp, color: '#38BDF8' },
    { label: '総学習時間', value: `${progress.totalStudyMinutes}分`,          icon: Clock,      color: '#FCD34D' },
  ];

  return (
    <div className="px-4 pt-8 pb-8 max-w-lg mx-auto flex flex-col gap-5">
      {/* Title */}
      <div className="flex items-center gap-2">
        <BarChart2 size={22} style={{ color: '#38BDF8' }} />
        <h1 className="heading-serif text-2xl" style={{ color: '#38BDF8' }}>学習進捗</h1>
      </div>

      {/* XP card */}
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
            <div className="text-sm font-bold" style={{ color: '#F8FAFC' }}>
              {progress.currentXP} / {progress.xpToNextLevel} XP
            </div>
            <div className="text-xs text-ink-muted">次のレベルまで</div>
          </div>
        </div>
        <div className="xp-bar-track">
          <motion.div className="xp-bar-fill" initial={{ width: 0 }} animate={{ width: `${xpPercent}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
        </div>
        <div className="text-xs text-right mt-1" style={{ color: '#F59E0B' }}>{xpPercent}%</div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {STATS.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
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

      {/* This week */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-4"
      >
        <h3 className="font-bold text-xs mb-3" style={{ color: '#38BDF8' }}>今週のサマリー</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="font-bold text-xl" style={{ color: '#F8FAFC' }}>{weekSessions.length}</div>
            <div className="text-[10px] text-ink-muted">セッション</div>
          </div>
          <div>
            <div className="font-bold text-xl" style={{ color: '#F8FAFC' }}>{weekMinutes}</div>
            <div className="text-[10px] text-ink-muted">分</div>
          </div>
          <div>
            <div className="font-bold text-xl" style={{ color: '#F59E0B' }}>{weekXP}</div>
            <div className="text-[10px] text-ink-muted">XP</div>
          </div>
        </div>
      </motion.div>

      {/* Heatmap */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
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

      {/* Accuracy timeline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-4"
      >
        <h3 className="font-bold text-xs mb-3" style={{ color: '#818CF8' }}>セッション別XP推移</h3>
        <div className="flex justify-center overflow-x-auto">
          <AccuracyLine sessions={sessions} />
        </div>
      </motion.div>
    </div>
  );
}
