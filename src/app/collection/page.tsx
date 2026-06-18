'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, BarChart2, X, Flame, Clock, Star, BookOpen, HelpCircle } from 'lucide-react';
import { ALL_BADGES } from '@/data/badges';
import { useUserStore } from '@/store/userStore';
import { useStudyStore } from '@/store/studyStore';
import type { Badge } from '@/types';

// ── SVG Radar Chart ──────────────────────────────────────────
const SUBJECTS = [
  { key: 'rodo',    label: '労基法',  color: '#F59E0B' },
  { key: 'anzen',   label: '安衛法',  color: '#FB7185' },
  { key: 'rousai',  label: '労災法',  color: '#818CF8' },
  { key: 'koyo',    label: '雇保法',  color: '#38BDF8' },
  { key: 'kenko',   label: '健保法',  color: '#10B981' },
  { key: 'nenkin',  label: '年金法',  color: '#FCD34D' },
];

function polarToXY(angle: number, r: number, cx: number, cy: number) {
  const a = (angle - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function RadarChart({ data }: { data: number[] }) {
  const cx = 110;
  const cy = 110;
  const maxR = 85;
  const n = SUBJECTS.length;
  const rings = [0.25, 0.5, 0.75, 1];

  const axisPoints = SUBJECTS.map((_, i) => polarToXY((360 / n) * i, maxR, cx, cy));

  const dataPoints = data.map((val, i) =>
    polarToXY((360 / n) * i, maxR * Math.max(0.04, Math.min(1, val / 100)), cx, cy)
  );
  const polygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={220} height={220} viewBox="0 0 220 220">
      {/* Ring grids */}
      {rings.map((r) => {
        const pts = SUBJECTS.map((_, i) => polarToXY((360 / n) * i, maxR * r, cx, cy));
        return (
          <polygon
            key={r}
            points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        );
      })}

      {/* Axis lines */}
      {axisPoints.map((pt, i) => (
        <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
      ))}

      {/* Data polygon */}
      <polygon
        points={polygon}
        fill="rgba(245,158,11,0.2)"
        stroke="#F59E0B"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={SUBJECTS[i].color} />
      ))}

      {/* Labels */}
      {axisPoints.map((pt, i) => {
        const dx = pt.x - cx;
        const dy = pt.y - cy;
        const lx = cx + (dx / maxR) * (maxR + 18);
        const ly = cy + (dy / maxR) * (maxR + 18);
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fill={SUBJECTS[i].color}
            fontWeight="bold"
          >
            {SUBJECTS[i].label}
          </text>
        );
      })}
    </svg>
  );
}

// ── SVG Bar Chart (weekly) ───────────────────────────────────
function WeeklyBarChart({ sessions }: { sessions: { date: string; durationMinutes: number }[] }) {
  const days = useMemo(() => {
    const result: { label: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toDateString();
      const mins = sessions
        .filter((s) => new Date(s.date).toDateString() === key)
        .reduce((sum, s) => sum + s.durationMinutes, 0);
      result.push({ label: ['日', '月', '火', '水', '木', '金', '土'][d.getDay()], minutes: mins });
    }
    return result;
  }, [sessions]);

  const maxMins = Math.max(...days.map((d) => d.minutes), 1);
  const chartH = 80;
  const barW = 26;
  const gap = 10;
  const totalW = days.length * (barW + gap) - gap;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={totalW + 8} height={chartH + 28} viewBox={`0 0 ${totalW + 8} ${chartH + 28}`}>
        {days.map((d, i) => {
          const barH = Math.max(4, Math.round((d.minutes / maxMins) * chartH));
          const x = 4 + i * (barW + gap);
          const y = chartH - barH;
          return (
            <g key={i}>
              <rect
                x={x}
                y={chartH}
                width={barW}
                height={0}
                rx={4}
                fill={d.minutes > 0 ? 'url(#barGrad)' : 'rgba(255,255,255,0.06)'}
              >
                <animate attributeName="height" from="0" to={barH} dur="0.6s" fill="freeze" begin={`${i * 0.07}s`} />
                <animate attributeName="y" from={chartH} to={y} dur="0.6s" fill="freeze" begin={`${i * 0.07}s`} />
              </rect>
              <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fontSize={9} fill="#475569">
                {d.label}
              </text>
              {d.minutes > 0 && (
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={8} fill="#F59E0B">
                  {d.minutes}m
                </text>
              )}
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
              </defs>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Badge detail popup ───────────────────────────────────────
function BadgePopup({ badge, onClose }: { badge: Badge & { isUnlocked: boolean }; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 24 }}
        className="glass-card p-8 flex flex-col items-center gap-4 text-center max-w-xs w-full"
        style={badge.isUnlocked ? { border: '1px solid rgba(252,211,77,0.4)', boxShadow: '0 0 30px rgba(252,211,77,0.2)' } : {}}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <X size={13} style={{ color: '#475569' }} />
        </button>
        <div className={`text-6xl ${badge.isUnlocked ? 'animate-float' : 'grayscale opacity-40'}`}>
          {badge.icon}
        </div>
        <div>
          <p className="font-bold text-lg" style={{ color: badge.isUnlocked ? '#FCD34D' : '#475569' }}>
            {badge.isUnlocked ? badge.name : '???'}
          </p>
          <p className="text-sm text-ink-muted mt-1">{badge.description}</p>
        </div>
        {badge.isUnlocked && badge.unlockedAt && (
          <p className="text-xs text-ink-subtle">
            {new Date(badge.unlockedAt).toLocaleDateString('ja-JP')} 獲得
          </p>
        )}
        {!badge.isUnlocked && (
          <div className="text-xs px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8' }}>
            獲得条件:{' '}
            {badge.condition.type === 'streak' && `${badge.condition.value}日連続学習`}
            {badge.condition.type === 'level_number' && `Level${badge.condition.value}クリア`}
            {badge.condition.type === 'quiz_correct' && `クイズ${badge.condition.value}問正解`}
            {badge.condition.type === 'study_minutes' && `${badge.condition.value}分学習`}
            {badge.condition.type === 'flashcard_master' && `カード${badge.condition.value}枚マスター`}
            {badge.condition.type === 'quest_complete' && `クエスト${badge.condition.value}個完了`}
            {badge.condition.type === 'first_login' && 'アプリを起動する'}
            {badge.condition.type === 'daily_levels' && `1日${badge.condition.value}レベルクリア`}
            {badge.condition.type === 'night_study' && '夜22時以降に学習'}
            {badge.condition.type === 'morning_study' && '朝6時前に学習'}
            {badge.condition.type === 'quiz_streak' && `クイズ${badge.condition.value}問連続正解`}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────
type TabType = 'badges' | 'stats';

export default function CollectionPage() {
  const { progress } = useUserStore();
  const { sessions } = useStudyStore();
  const [tab, setTab] = useState<TabType>('badges');
  const [selectedBadge, setSelectedBadge] = useState<(Badge & { isUnlocked: boolean }) | null>(null);

  const badges = useMemo(
    () => ALL_BADGES.map((b) => ({ ...b, isUnlocked: progress.unlockedBadges.includes(b.id) })),
    [progress.unlockedBadges]
  );

  const unlocked = badges.filter((b) => b.isUnlocked);
  const locked = badges.filter((b) => !b.isUnlocked);

  // Radar data: subject scores based on completed levels (placeholder 0-100)
  const radarData = SUBJECTS.map((s) => {
    const count = progress.completedLevels.filter((id) => id.startsWith(s.key)).length;
    return Math.min(100, count * 20);
  });

  const accuracyPct = progress.quizTotalCount > 0
    ? Math.floor((progress.quizCorrectCount / progress.quizTotalCount) * 100)
    : 0;

  return (
    <div className="px-4 pt-8 pb-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Trophy size={22} style={{ color: '#FCD34D' }} />
        <h1 className="heading-serif text-2xl" style={{ color: '#FCD34D' }}>実績・統計</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([
          { key: 'badges', label: 'バッジ実績', icon: <Trophy size={13} /> },
          { key: 'stats',  label: '学習統計',   icon: <BarChart2 size={13} /> },
        ] as const).map(({ key, label, icon }) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTab(key)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            style={
              tab === key
                ? { background: 'rgba(252,211,77,0.12)', border: '1px solid rgba(252,211,77,0.4)', color: '#FCD34D' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }
            }
          >
            {icon} {label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Badges tab ── */}
        {tab === 'badges' && (
          <motion.div key="badges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-xs text-ink-muted mb-4">{unlocked.length} / {badges.length} 個獲得済み</p>

            {unlocked.length > 0 && (
              <div className="mb-5">
                <h2 className="text-xs font-bold mb-3" style={{ color: '#FCD34D' }}>獲得済み</h2>
                <div className="grid grid-cols-3 gap-3">
                  {unlocked.map((badge, i) => (
                    <motion.button
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => setSelectedBadge(badge)}
                      className="glass-card p-4 flex flex-col items-center gap-2 text-center"
                      style={{ border: '1px solid rgba(252,211,77,0.35)', boxShadow: '0 0 12px rgba(252,211,77,0.15)' }}
                    >
                      <div className="text-3xl animate-float">{badge.icon}</div>
                      <div className="text-[10px] font-bold leading-tight" style={{ color: '#FCD34D' }}>{badge.name}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xs font-bold mb-3 text-ink-subtle">未獲得 ({locked.length})</h2>
              <div className="grid grid-cols-3 gap-3">
                {locked.map((badge, i) => (
                  <motion.button
                    key={badge.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setSelectedBadge(badge)}
                    className="glass-card p-4 flex flex-col items-center gap-2 text-center opacity-35"
                  >
                    <div className="text-3xl grayscale">{badge.icon}</div>
                    <div className="text-[10px] font-bold text-ink-subtle">???</div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Stats tab ── */}
        {tab === 'stats' && (
          <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">

            {/* Summary numbers */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '総学習時間', value: `${progress.totalStudyMinutes}分`, icon: Clock, color: '#FCD34D' },
                { label: '連続学習',   value: `${progress.streak}日`,           icon: Flame,    color: '#FB7185' },
                { label: 'クリア済み', value: `${progress.completedLevels.length}ステージ`, icon: BookOpen, color: '#10B981' },
                { label: 'クイズ正解率', value: `${accuracyPct}%`,             icon: HelpCircle, color: '#818CF8' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="glass-card p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                    <Icon size={17} style={{ color }} />
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color }}>{value}</div>
                    <div className="text-[10px] text-ink-muted">{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* XP summary */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star size={14} style={{ color: '#F59E0B' }} />
                <span className="text-xs font-bold" style={{ color: '#F59E0B' }}>総XP</span>
              </div>
              <div className="heading-serif text-3xl font-black" style={{
                background: 'linear-gradient(135deg,#F59E0B,#FCD34D)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {progress.totalXP.toLocaleString()}
              </div>
              <div className="text-xs text-ink-muted mt-0.5">Lv.{progress.level} · 次まで {progress.xpToNextLevel - progress.currentXP} XP</div>
            </div>

            {/* Weekly bar chart */}
            <div className="glass-card p-4">
              <h3 className="text-xs font-bold mb-4" style={{ color: '#38BDF8' }}>今週の学習時間（分）</h3>
              <div className="flex justify-center">
                <WeeklyBarChart sessions={sessions} />
              </div>
            </div>

            {/* Radar chart */}
            <div className="glass-card p-4">
              <h3 className="text-xs font-bold mb-2" style={{ color: '#F59E0B' }}>科目別 習熟度</h3>
              <p className="text-[10px] text-ink-subtle mb-3">クリア済みステージ数をもとに算出</p>
              <div className="flex justify-center">
                <RadarChart data={radarData} />
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {SUBJECTS.map((s, i) => (
                  <div key={s.key} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-[10px] text-ink-muted">{s.label}: {radarData[i]}%</span>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge popup */}
      <AnimatePresence>
        {selectedBadge && (
          <BadgePopup badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
