'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, RotateCcw, ThumbsUp, ThumbsDown, Star } from 'lucide-react';
import { FLASHCARDS } from '@/data/flashcards';
import { useUserStore } from '@/store/userStore';
import { useXP } from '@/hooks/useXP';
import { useSound } from '@/hooks/useSound';
import type { Flashcard } from '@/types';

export default function FlashcardPage() {
  const { incrementFlashcardMastered } = useUserStore();
  const { addXP } = useXP();
  const { play } = useSound();
  const [cards] = useState<Flashcard[]>(FLASHCARDS);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [, setDone] = useState(0);
  const [mastered, setMastered] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = cards[index];

  const next = (knew: boolean) => {
    if (knew) {
      setMastered((m) => m + 1);
      incrementFlashcardMastered();
      addXP(10);
      play('correct');
    } else {
      play('wrong');
    }
    setDone((d) => d + 1);
    if (index + 1 >= cards.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setFlipped(false);
  };

  const restart = () => {
    setIndex(0);
    setFlipped(false);
    setDone(0);
    setMastered(0);
    setFinished(false);
  };

  return (
    <div className="px-4 pt-8 pb-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard size={22} style={{ color: '#10B981' }} />
        <h1 className="heading-serif text-2xl" style={{ color: '#10B981' }}>フラッシュカード</h1>
      </div>

      {!finished ? (
        <>
          <div className="flex justify-between text-sm text-ink-muted mb-4">
            <span>{index + 1} / {cards.length}</span>
            <span className="flex items-center gap-1" style={{ color: '#10B981' }}>
              <Star size={14} />マスター済: {mastered}
            </span>
          </div>

          {/* Progress bar */}
          <div className="xp-bar-track mb-6">
            <motion.div className="xp-bar-fill" style={{ background: 'linear-gradient(90deg,#10B981,#34D399)' }}
              animate={{ width: `${((index) / cards.length) * 100}%` }} transition={{ duration: 0.4 }} />
          </div>

          {/* Card */}
          <div className="mb-6" style={{ perspective: 1000 }}>
            <motion.div
              className="relative w-full cursor-pointer"
              style={{ minHeight: 220, transformStyle: 'preserve-3d' }}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}
              onClick={() => setFlipped((f) => !f)}
            >
              {/* Front */}
              <div className="glass-card p-8 absolute inset-0 flex flex-col items-center justify-center text-center"
                style={{ backfaceVisibility: 'hidden', border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 0 20px rgba(16,185,129,0.15)' }}>
                <span className="subject-badge mb-3">{current.subject}</span>
                <p className="heading-serif text-xl font-bold" style={{ color: '#F8FAFC' }}>{current.front}</p>
                <p className="text-xs text-ink-muted mt-4">タップして答えを見る</p>
              </div>

              {/* Back */}
              <div className="glass-card p-6 absolute inset-0 flex flex-col items-center justify-center text-center"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}>
                <p className="text-sm leading-relaxed" style={{ color: '#F8FAFC', whiteSpace: 'pre-wrap' }}>{current.back}</p>
                <div className="flex gap-1 mt-3 flex-wrap justify-center">
                  {current.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#FCD34D' }}>#{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          <p className="text-center text-xs text-ink-muted mb-4">覚えていましたか？</p>

          <div className="flex gap-3">
            <button
              onClick={() => { if (flipped) next(false); }}
              disabled={!flipped}
              className="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30"
              style={{ background: 'rgba(251,113,133,0.15)', border: '1px solid rgba(251,113,133,0.4)', color: '#FB7185' }}>
              <ThumbsDown size={18} /> もう一度
            </button>
            <button
              onClick={() => { if (flipped) next(true); }}
              disabled={!flipped}
              className="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#10B981' }}>
              <ThumbsUp size={18} /> 覚えた！
            </button>
          </div>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center pt-8">
          <div className="text-7xl mb-4">🃏</div>
          <h2 className="heading-serif text-2xl mb-2" style={{ color: '#10B981' }}>完了！</h2>
          <p className="text-ink-muted mb-2">全 {cards.length} 枚完了</p>
          <p className="text-lg font-bold mb-8" style={{ color: '#F59E0B' }}>マスター: {mastered} 枚 (+{mastered * 10} XP)</p>
          <button className="w-full flex items-center justify-center gap-2 p-4 rounded-xl font-bold"
            style={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}
            onClick={restart}>
            <RotateCcw size={18} /> もう一度
          </button>
        </motion.div>
      )}
    </div>
  );
}
