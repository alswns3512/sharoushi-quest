'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, CheckCircle, Clock, Zap, Star, Gift } from 'lucide-react';
import { useQuestStore } from '@/store/questStore';
import { useUserStore } from '@/store/userStore';
import type { Quest } from '@/types';

type TabType = 'daily' | 'weekly' | 'story';

const TAB_CONFIG: { type: TabType; label: string; color: string; icon: string }[] = [
  { type: 'daily',  label: '日課',         color: '#F59E0B', icon: '☀️' },
  { type: 'weekly', label: 'ウィークリー',  color: '#818CF8', icon: '📅' },
  { type: 'story',  label: 'ストーリー',    color: '#10B981', icon: '📖' },
];

// Floating +XP label
function XPFloat({ xp, onDone }: { xp: number; onDone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
      animate={{ opacity: 0, y: -80, scale: 1.3 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      onAnimationComplete={onDone}
      className="fixed left-1/2 bottom-36 z-[100] pointer-events-none font-black heading-serif"
      style={{
        fontSize: 32,
        background: 'linear-gradient(135deg,#F59E0B,#FCD34D)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.8))',
      }}
    >
      +{xp} XP
    </motion.div>
  );
}

export default function QuestPage() {
  const [tab, setTab] = useState<TabType>('daily');
  const [floatXP, setFloatXP] = useState<{ id: number; xp: number } | null>(null);
  const { quests } = useQuestStore();
  const { gainXP } = useUserStore();

  const tabQuests = quests.filter((q) =>
    tab === 'story' ? q.type === 'story' || q.type === 'achievement' : q.type === tab
  );

  const completedCount = tabQuests.filter((q) => q.isCompleted).length;

  function claimQuest(quest: Quest) {
    if (!quest.isCompleted) return;
    gainXP(quest.xpReward);
    setFloatXP({ id: Date.now(), xp: quest.xpReward });
  }

  return (
    <div className="px-4 pt-8 pb-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Sword size={22} style={{ color: '#818CF8' }} />
        <h1 className="heading-serif text-2xl" style={{ color: '#818CF8' }}>クエスト</h1>
      </div>
      <p className="text-xs text-ink-muted mb-5">
        {completedCount} / {tabQuests.length} 完了
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TAB_CONFIG.map(({ type, label, color, icon }) => (
          <motion.button
            key={type}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTab(type)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all"
            style={
              tab === type
                ? { background: `${color}20`, border: `1px solid ${color}60`, color }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }
            }
          >
            {icon} {label}
          </motion.button>
        ))}
      </div>

      {/* Quest list */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-3"
        >
          {tabQuests.length === 0 && (
            <div className="text-center py-16 text-ink-muted text-sm">クエストがありません</div>
          )}
          {tabQuests.map((quest, i) => (
            <QuestCard key={quest.id} quest={quest} index={i} onClaim={() => claimQuest(quest)} />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* XP float animation */}
      <AnimatePresence>
        {floatXP && (
          <XPFloat key={floatXP.id} xp={floatXP.xp} onDone={() => setFloatXP(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function QuestCard({ quest, index, onClaim }: { quest: Quest; index: number; onClaim: () => void }) {
  const [claimed, setClaimed] = useState(false);
  const progress = quest.target > 0 ? Math.min(100, Math.floor((quest.current / quest.target) * 100)) : 0;

  const TYPE_COLORS: Record<Quest['type'], string> = {
    daily: '#F59E0B',
    weekly: '#818CF8',
    story: '#10B981',
    achievement: '#FB7185',
  };
  const color = TYPE_COLORS[quest.type];
  const canClaim = quest.isCompleted && !claimed;

  function handleClaim() {
    if (!canClaim) return;
    setClaimed(true);
    onClaim();
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass-card p-4"
      style={claimed ? { opacity: 0.45 } : quest.isCompleted && !claimed ? { border: `1px solid ${color}50` } : {}}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: quest.isCompleted ? `${color}20` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${quest.isCompleted ? color : 'rgba(255,255,255,0.08)'}40`,
          }}
        >
          {quest.isCompleted ? (
            <CheckCircle size={20} style={{ color }} />
          ) : (
            <Zap size={20} style={{ color: '#475569' }} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <span className="font-bold text-sm leading-tight" style={{ color: quest.isCompleted ? color : '#F8FAFC' }}>
              {quest.title}
            </span>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Star size={11} style={{ color: '#F59E0B' }} />
              <span className="text-xs font-bold" style={{ color: '#F59E0B' }}>{quest.xpReward} XP</span>
            </div>
          </div>

          <p className="text-xs text-ink-muted mb-2 leading-relaxed">{quest.description}</p>

          {/* Progress */}
          {!quest.isCompleted && (
            <div>
              <div className="flex justify-between text-[10px] text-ink-subtle mb-1">
                <span>{quest.current} / {quest.target}</span>
                <span>{progress}%</span>
              </div>
              <div className="xp-bar-track" style={{ height: 5 }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${color}, ${color}99)`, boxShadow: `0 0 5px ${color}60` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                />
              </div>
            </div>
          )}

          {/* Expiry */}
          {quest.expiresAt && !quest.isCompleted && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-ink-subtle">
              <Clock size={10} />
              <span>期限: {new Date(quest.expiresAt).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}

          {/* Claim button */}
          {canClaim && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.93 }}
              onClick={handleClaim}
              className="mt-2.5 px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
              style={{
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                color: '#0F172A',
                boxShadow: `0 0 14px ${color}50`,
              }}
            >
              <Gift size={12} />
              受け取る
            </motion.button>
          )}
          {claimed && (
            <p className="mt-2 text-xs font-bold" style={{ color: '#10B981' }}>✓ 受け取り済み</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
