'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Gift, X } from 'lucide-react';
import { useUserStore } from '@/store/userStore';

const STREAK_MILESTONES = [
  { days: 1,  label: '初日ボーナス',       color: '#F59E0B' },
  { days: 3,  label: '3日連続ボーナス',    color: '#FB7185' },
  { days: 7,  label: '1週間ボーナス',      color: '#818CF8' },
  { days: 14, label: '2週間ボーナス',      color: '#38BDF8' },
  { days: 30, label: '1か月継続ボーナス!', color: '#10B981' },
];

function getMilestoneLabel(streak: number): { label: string; color: string } {
  let result = STREAK_MILESTONES[0];
  for (const m of STREAK_MILESTONES) {
    if (streak >= m.days) result = m;
  }
  return result;
}

export function AttendanceBonusModal() {
  const {
    progress,
    attendanceBonusPending,
    attendanceBonusXP,
    claimAttendanceBonus,
    dismissAttendanceBonus,
  } = useUserStore();

  const { label, color } = getMilestoneLabel(progress.streak);

  return (
    <AnimatePresence>
      {attendanceBonusPending && (
        <motion.div
          key="attendance"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[190] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.75)' }}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="relative w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-5 text-center"
            style={{
              background: 'rgba(15,23,42,0.97)',
              border: `2px solid ${color}60`,
              boxShadow: `0 0 40px ${color}30`,
            }}
          >
            {/* Close */}
            <button
              onClick={dismissAttendanceBonus}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <X size={14} style={{ color: '#475569' }} />
            </button>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.15, type: 'spring' }}
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: `${color}20`, border: `2px solid ${color}60` }}
            >
              <Gift size={40} style={{ color }} />
            </motion.div>

            {/* Title */}
            <div>
              <p className="text-xs font-bold mb-1" style={{ color, letterSpacing: '0.1em' }}>
                {label}
              </p>
              <h2 className="heading-serif text-2xl font-black" style={{ color: '#F8FAFC' }}>
                ログインボーナス
              </h2>
            </div>

            {/* Streak */}
            <div
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl"
              style={{ background: 'rgba(251,113,133,0.12)', border: '1px solid rgba(251,113,133,0.3)' }}
            >
              <Flame size={18} style={{ color: '#FB7185' }} />
              <span className="font-bold" style={{ color: '#FB7185' }}>
                {progress.streak}日連続ログイン！
              </span>
            </div>

            {/* XP reward */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center"
            >
              <span className="text-5xl font-black heading-serif" style={{
                background: 'linear-gradient(135deg,#F59E0B,#FCD34D)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.5))',
              }}>
                +{attendanceBonusXP}
              </span>
              <span className="text-xs text-ink-muted">XP ボーナス</span>
            </motion.div>

            {/* Claim button */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={claimAttendanceBonus}
              className="w-full py-4 rounded-2xl font-bold text-base"
              style={{
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                color: '#0F172A',
                boxShadow: `0 0 20px ${color}50`,
              }}
            >
              受け取る 🎁
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
