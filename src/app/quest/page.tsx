'use client';

import { motion } from 'framer-motion';
import { Sword, CheckCircle, Clock, Zap } from 'lucide-react';
import { useQuestStore } from '@/store/questStore';
import type { Quest } from '@/types';

const TYPE_LABELS: Record<Quest['type'], string> = {
  daily: '日課',
  weekly: '週間',
  achievement: '実績',
};
const TYPE_COLORS: Record<Quest['type'], string> = {
  daily: '#F59E0B',
  weekly: '#818CF8',
  achievement: '#FB7185',
};

export default function QuestPage() {
  const { quests } = useQuestStore();

  const grouped = {
    daily: quests.filter((q) => q.type === 'daily'),
    weekly: quests.filter((q) => q.type === 'weekly'),
    achievement: quests.filter((q) => q.type === 'achievement'),
  };

  return (
    <div className="px-4 pt-8 pb-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Sword size={22} style={{ color: '#818CF8' }} />
        <h1 className="heading-serif text-2xl" style={{ color: '#818CF8' }}>クエスト</h1>
      </div>

      {(['daily', 'weekly', 'achievement'] as const).map((type, gi) => (
        <motion.div key={type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.1 }} className="mb-6">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: TYPE_COLORS[type] }}>
            <div className="w-1.5 h-4 rounded-full" style={{ background: TYPE_COLORS[type] }} />
            {TYPE_LABELS[type]}クエスト
          </h2>
          <div className="flex flex-col gap-3">
            {grouped[type].map((quest, i) => (
              <QuestCard key={quest.id} quest={quest} index={i} />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function QuestCard({ quest, index }: { quest: Quest; index: number }) {
  const progress = quest.target > 0 ? Math.min(100, Math.floor((quest.current / quest.target) * 100)) : 0;
  const color = TYPE_COLORS[quest.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card p-4"
      style={quest.isCompleted ? { border: '1px solid rgba(16,185,129,0.4)', opacity: 0.7 } : {}}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: quest.isCompleted ? 'rgba(16,185,129,0.2)' : `${color}20`, border: `1px solid ${quest.isCompleted ? '#10B981' : color}40` }}>
          {quest.isCompleted ? <CheckCircle size={18} style={{ color: '#10B981' }} /> : <Zap size={18} style={{ color }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="font-bold text-sm" style={{ color: quest.isCompleted ? '#10B981' : '#F8FAFC' }}>{quest.title}</span>
            <span className="text-xs font-bold flex-shrink-0" style={{ color: '#F59E0B' }}>+{quest.xpReward} XP</span>
          </div>
          <p className="text-xs text-ink-muted mb-2">{quest.description}</p>
          {!quest.isCompleted && (
            <div>
              <div className="flex justify-between text-xs text-ink-subtle mb-1">
                <span>{quest.current} / {quest.target}</span>
                <span>{progress}%</span>
              </div>
              <div className="xp-bar-track" style={{ height: 6 }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${color}, ${color}aa)`, boxShadow: `0 0 6px ${color}66` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>
          )}
          {quest.expiresAt && !quest.isCompleted && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-ink-subtle">
              <Clock size={11} />
              <span>期限: {new Date(quest.expiresAt).toLocaleDateString('ja-JP')}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
