'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, BookOpen, PartyPopper } from 'lucide-react';
import { getTodayTrivia, type TriviaItem } from '@/data/trivia';

const STORAGE_KEY = 'sharoushi_trivia_seen';

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

interface TriviaModalProps {
  open: boolean;
  onClose: () => void;
}

export function TriviaModal({ open, onClose }: TriviaModalProps) {
  const [trivia, setTrivia] = useState<TriviaItem | null>(null);
  const [reaction, setReaction] = useState<'knew' | 'new' | null>(null);

  useEffect(() => {
    setTrivia(getTodayTrivia());
  }, []);

  function handleReaction(r: 'knew' | 'new') {
    setReaction(r);
    if (typeof window !== 'undefined') {
      const seen = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      seen[getTodayKey()] = r;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
    }
    setTimeout(onClose, 800);
  }

  return (
    <AnimatePresence>
      {open && trivia && (
        <motion.div
          key="trivia"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[180] flex items-end justify-center px-4 pb-8"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4"
            style={{
              background: 'rgba(15,23,42,0.98)',
              border: '1px solid rgba(245,158,11,0.3)',
              boxShadow: '0 0 40px rgba(245,158,11,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}
                >
                  <Lightbulb size={16} style={{ color: '#F59E0B' }} />
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-wider" style={{ color: '#F59E0B' }}>
                    TODAY&apos;S 豆知識
                  </p>
                  <p className="text-[9px] text-ink-subtle">{trivia.subject}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <X size={13} style={{ color: '#475569' }} />
              </button>
            </div>

            {/* Fact */}
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <p className="font-bold text-base leading-relaxed" style={{ color: '#FCD34D' }}>
                {trivia.fact}
              </p>
            </div>

            {/* Detail */}
            <p className="text-sm leading-relaxed text-ink-muted">{trivia.detail}</p>

            {/* Reaction buttons */}
            {reaction === null ? (
              <div className="flex gap-3 mt-1">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleReaction('knew')}
                  className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981' }}
                >
                  <PartyPopper size={15} />
                  知ってた！
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleReaction('new')}
                  className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5"
                  style={{ background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)', color: '#818CF8' }}
                >
                  <BookOpen size={15} />
                  初めて知った！
                </motion.button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-3 font-bold"
                style={{ color: reaction === 'knew' ? '#10B981' : '#818CF8' }}
              >
                {reaction === 'knew' ? '🎉 さすが！学習の成果ですね' : '📚 新しい知識をゲット！'}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to auto-show trivia once per day
export function useTriviaAutoShow() {
  const [showTrivia, setShowTrivia] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!seen[getTodayKey()]) {
      // slight delay so attendance bonus shows first
      const t = setTimeout(() => setShowTrivia(true), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  return { showTrivia, setShowTrivia };
}
