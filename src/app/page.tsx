'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { BookOpen, HelpCircle, Sword, CreditCard, BarChart2, Trophy, Flame, Star } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useStreak } from '@/hooks/useStreak';
import { useEffect } from 'react';

const QUICK_ACTIONS = [
  { href: '/study', label: '今日の学習', icon: BookOpen, color: '#F59E0B', glow: 'rgba(245,158,11,0.3)' },
  { href: '/quiz', label: 'クイズ', icon: HelpCircle, color: '#FB7185', glow: 'rgba(251,113,133,0.3)' },
  { href: '/flashcard', label: 'フラッシュカード', icon: CreditCard, color: '#10B981', glow: 'rgba(16,185,129,0.3)' },
  { href: '/quest', label: 'クエスト', icon: Sword, color: '#818CF8', glow: 'rgba(129,140,248,0.3)' },
  { href: '/progress', label: '学習進捗', icon: BarChart2, color: '#38BDF8', glow: 'rgba(56,189,248,0.3)' },
  { href: '/collection', label: '実績', icon: Trophy, color: '#FCD34D', glow: 'rgba(252,211,77,0.3)' },
];

export default function HomePage() {
  const { progress, touchStreak } = useUserStore();
  const { streak, streakMessage } = useStreak();

  useEffect(() => {
    touchStreak();
  }, [touchStreak]);

  const xpPercent =
    progress.xpToNextLevel > 0
      ? Math.min(100, Math.floor((progress.currentXP / progress.xpToNextLevel) * 100))
      : 100;

  return (
    <div className="px-4 pt-8 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1
          className="heading-serif text-3xl mb-1"
          style={{ color: '#F59E0B', textShadow: '0 0 20px rgba(245,158,11,0.5)' }}
        >
          社労士クエスト
        </h1>
        <p className="text-ink-muted text-sm">目指せ！社労士合格</p>
      </motion.div>

      {/* Level & XP Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="glass-card p-5 mb-4"
        style={{ boxShadow: '0 0 30px rgba(245,158,11,0.15)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                boxShadow: '0 0 20px rgba(245,158,11,0.5)',
              }}
            >
              <Star size={22} className="text-bg-primary" style={{ color: '#0F172A' }} />
            </div>
            <div>
              <div className="heading-serif text-2xl font-bold" style={{ color: '#F59E0B' }}>
                Lv.{progress.level}
              </div>
              <div className="text-ink-muted text-xs">
                {progress.totalXP.toLocaleString()} XP 獲得済み
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-orange-400">
              <Flame size={16} />
              <span className="font-bold text-sm">{streak}日</span>
            </div>
            <div className="text-ink-subtle text-xs">連続学習</div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="mb-1">
          <div className="flex justify-between text-xs text-ink-muted mb-1">
            <span>次のレベルまで</span>
            <span>{progress.currentXP} / {progress.xpToNextLevel} XP</span>
          </div>
          <div className="xp-bar-track">
            <motion.div
              className="xp-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>

      {/* Streak message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-card px-4 py-3 mb-6 text-center"
      >
        <p className="text-sm" style={{ color: '#FCD34D' }}>{streakMessage}</p>
      </motion.div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-3 gap-3">
        {QUICK_ACTIONS.map(({ href, label, icon: Icon, color, glow }, i) => (
          <motion.div
            key={href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06, duration: 0.4 }}
          >
            <Link href={href}>
              <div
                className="glass-card p-4 flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ boxShadow: `0 0 15px ${glow}` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                >
                  <Icon size={20} style={{ color }} />
                </div>
                <span className="text-xs text-center font-medium leading-tight" style={{ color: '#F8FAFC' }}>
                  {label}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-4 mt-4 grid grid-cols-3 gap-2 text-center"
      >
        <div>
          <div className="font-bold text-lg" style={{ color: '#10B981' }}>
            {progress.completedLevels.length}
          </div>
          <div className="text-xs text-ink-muted">クリア済み</div>
        </div>
        <div>
          <div className="font-bold text-lg" style={{ color: '#FB7185' }}>
            {progress.quizCorrectCount}
          </div>
          <div className="text-xs text-ink-muted">正解数</div>
        </div>
        <div>
          <div className="font-bold text-lg" style={{ color: '#F59E0B' }}>
            {progress.unlockedBadges.length}
          </div>
          <div className="text-xs text-ink-muted">バッジ獲得</div>
        </div>
      </motion.div>
    </div>
  );
}
