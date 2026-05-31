'use client';

import { motion } from 'framer-motion';
import { BarChart2, Flame, Star, BookOpen, HelpCircle, Clock } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useStudyStore } from '@/store/studyStore';

export default function ProgressPage() {
  const { progress } = useUserStore();
  const { getSessionsThisWeek } = useStudyStore();

  const xpPercent =
    progress.xpToNextLevel > 0
      ? Math.min(100, Math.floor((progress.currentXP / progress.xpToNextLevel) * 100))
      : 100;

  const accuracyPercent =
    progress.quizTotalCount > 0
      ? Math.floor((progress.quizCorrectCount / progress.quizTotalCount) * 100)
      : 0;

  const weekSessions = getSessionsThisWeek();
  const weekMinutes = weekSessions.reduce((s, sess) => s + sess.durationMinutes, 0);

  const STATS = [
    { label: 'レベル', value: `Lv.${progress.level}`, icon: Star, color: '#F59E0B' },
    { label: '連続学習', value: `${progress.streak}日`, icon: Flame, color: '#FB7185' },
    { label: 'クリア済み', value: `${progress.completedLevels.length}ステージ`, icon: BookOpen, color: '#10B981' },
    { label: 'クイズ正解', value: `${progress.quizCorrectCount}問`, icon: HelpCircle, color: '#818CF8' },
    { label: '正解率', value: `${accuracyPercent}%`, icon: HelpCircle, color: '#38BDF8' },
    { label: '総学習時間', value: `${progress.totalStudyMinutes}分`, icon: Clock, color: '#FCD34D' },
  ];

  return (
    <div className="px-4 pt-8 pb-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <BarChart2 size={22} style={{ color: '#38BDF8' }} />
        <h1 className="heading-serif text-2xl" style={{ color: '#38BDF8' }}>学習進捗</h1>
      </div>

      {/* XP Card */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 mb-6"
        style={{ border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 0 20px rgba(245,158,11,0.1)' }}>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {STATS.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
            className="glass-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color }}>{value}</div>
              <div className="text-xs text-ink-muted">{label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* This week */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="glass-card p-4">
        <h3 className="font-bold text-sm mb-3" style={{ color: '#38BDF8' }}>今週の学習</h3>
        <div className="flex justify-between text-sm">
          <div className="text-center">
            <div className="font-bold text-lg" style={{ color: '#F8FAFC' }}>{weekSessions.length}</div>
            <div className="text-xs text-ink-muted">セッション</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg" style={{ color: '#F8FAFC' }}>{weekMinutes}</div>
            <div className="text-xs text-ink-muted">分</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg" style={{ color: '#F59E0B' }}>
              {weekSessions.reduce((s, sess) => s + sess.xpEarned, 0)}
            </div>
            <div className="text-xs text-ink-muted">XP</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
