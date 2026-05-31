'use client';

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { ALL_BADGES } from '@/data/badges';
import { useUserStore } from '@/store/userStore';

export default function CollectionPage() {
  const { progress } = useUserStore();

  const badges = ALL_BADGES.map((b) => ({
    ...b,
    isUnlocked: progress.unlockedBadges.includes(b.id),
  }));

  const unlocked = badges.filter((b) => b.isUnlocked);
  const locked = badges.filter((b) => !b.isUnlocked);

  return (
    <div className="px-4 pt-8 pb-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <Trophy size={22} style={{ color: '#FCD34D' }} />
        <h1 className="heading-serif text-2xl" style={{ color: '#FCD34D' }}>バッジ実績</h1>
      </div>
      <p className="text-ink-muted text-sm mb-6">{unlocked.length} / {badges.length} 個獲得済み</p>

      {unlocked.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold mb-3" style={{ color: '#FCD34D' }}>獲得済み</h2>
          <div className="grid grid-cols-3 gap-3">
            {unlocked.map((badge, i) => (
              <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className="glass-card p-4 flex flex-col items-center gap-2 text-center"
                style={{ border: '1px solid rgba(252,211,77,0.4)', boxShadow: '0 0 12px rgba(252,211,77,0.2)' }}>
                <div className="text-3xl animate-float">{badge.icon}</div>
                <div className="text-xs font-bold" style={{ color: '#FCD34D' }}>{badge.name}</div>
                <div className="text-xs text-ink-muted leading-tight">{badge.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-bold mb-3 text-ink-subtle">未獲得</h2>
        <div className="grid grid-cols-3 gap-3">
          {locked.map((badge, i) => (
            <motion.div key={badge.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              className="glass-card p-4 flex flex-col items-center gap-2 text-center opacity-40">
              <div className="text-3xl grayscale">{badge.icon}</div>
              <div className="text-xs font-bold text-ink-muted">???</div>
              <div className="text-xs text-ink-subtle leading-tight">
                {badge.condition.type === 'streak' && `${badge.condition.value}日連続学習`}
                {badge.condition.type === 'level' && `Lv.${badge.condition.value}に到達`}
                {badge.condition.type === 'quiz_correct' && `クイズ${badge.condition.value}問正解`}
                {badge.condition.type === 'study_minutes' && `${badge.condition.value}分学習`}
                {badge.condition.type === 'flashcard_master' && `カード${badge.condition.value}枚マスター`}
                {badge.condition.type === 'quest_complete' && `クエスト${badge.condition.value}個完了`}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
