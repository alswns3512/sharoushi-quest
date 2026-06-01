'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ChevronRight, RotateCcw, CheckCircle, X, Clock, Lamp, CreditCard } from 'lucide-react';
import { FLASHCARDS, type FlashcardWithTip } from '@/data/flashcards';
import { useUserStore } from '@/store/userStore';
import { useSound } from '@/hooks/useSound';
import { storageGet, storageSet } from '@/lib/storage';

// ── Types ────────────────────────────────────────────────────────────────
type CardResult = 'know' | 'not_yet' | 'review';
type Phase = 'select' | 'study' | 'done';
type SetType = 'all' | 'new' | 'weak' | string; // string = subject

// ── localStorage ─────────────────────────────────────────────────────────
const loadCardStates = () => storageGet<Record<string, CardResult | null>>('card_states', {});
const saveCardStates = (v: Record<string, CardResult | null>) => storageSet('card_states', v);

// ── Subject list ─────────────────────────────────────────────────────────
const SUBJECTS = ['超入門', '社労士入門', '労働基準法'];

// ── Build deck ───────────────────────────────────────────────────────────
function buildDeck(setType: SetType): FlashcardWithTip[] {
  const states = loadCardStates();
  if (setType === 'all') return [...FLASHCARDS].sort(() => Math.random() - 0.5);
  if (setType === 'new') return FLASHCARDS.filter((c) => !states[c.id]).sort(() => Math.random() - 0.5);
  if (setType === 'weak') {
    const weak = FLASHCARDS.filter((c) => states[c.id] === 'not_yet' || states[c.id] === 'review');
    return weak.length > 0 ? weak.sort(() => Math.random() - 0.5) : [...FLASHCARDS].sort(() => Math.random() - 0.5);
  }
  return FLASHCARDS.filter((c) => c.subject === setType).sort(() => Math.random() - 0.5);
}

// ── Swipe Card ───────────────────────────────────────────────────────────
function SwipeCard({
  card, onSwipe, isTop,
}: {
  card: FlashcardWithTip;
  onSwipe: (result: CardResult) => void;
  isTop: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const [showTip, setShowTip] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-150, 0, 150], [-18, 0, 18]);
  const knowOpacity  = useTransform(x, [20, 80],  [0, 1]);
  const notYetOpacity = useTransform(x, [-80, -20], [1, 0]);
  const reviewOpacity = useTransform(y, [-80, -20], [1, 0]);

  const handleDragEnd = useCallback((_: unknown, info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) => {
    const { offset, velocity } = info;
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);

    if (absX > 80 || Math.abs(velocity.x) > 300) {
      onSwipe(offset.x > 0 ? 'know' : 'not_yet');
    } else if (absY > 60 || velocity.y < -300) {
      if (offset.y < 0) onSwipe('review');
    } else {
      // snap back — no action
      x.set(0); y.set(0);
    }
  }, [onSwipe, x, y]);

  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ pointerEvents: isTop ? 'auto' : 'none' }}>
      {/* Hint labels */}
      {isTop && (
        <>
          <motion.div style={{ opacity: knowOpacity, borderColor: '#10B981', color: '#10B981', background: 'rgba(16,185,129,0.15)' }}
            className="absolute left-4 top-6 z-10 px-3 py-1 rounded-full font-bold text-sm border-2">
            覚えた！✓
          </motion.div>
          <motion.div style={{ opacity: notYetOpacity, borderColor: '#FB7185', color: '#FB7185', background: 'rgba(251,113,133,0.15)' }}
            className="absolute right-4 top-6 z-10 px-3 py-1 rounded-full font-bold text-sm border-2">
            まだ ✗
          </motion.div>
          <motion.div style={{ opacity: reviewOpacity, borderColor: '#F59E0B', color: '#F59E0B', background: 'rgba(245,158,11,0.15)' }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full font-bold text-sm border-2">
            後で復習
          </motion.div>
        </>
      )}

      <motion.div
        drag={isTop}
        dragConstraints={{ left: -200, right: 200, top: -200, bottom: 50 }}
        dragElastic={0.6}
        style={{ x, y, rotate, touchAction: 'none' }}
        onDragEnd={handleDragEnd}
        className="relative w-full"
        animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 12, opacity: isTop ? 1 : 0.6 }}
      >
        {/* 3D Flip container */}
        <div style={{ perspective: 1000 }} onClick={() => isTop && setFlipped((f) => !f)}>
          <motion.div
            style={{ transformStyle: 'preserve-3d', minHeight: 260 }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 120, damping: 18 }}
            className="relative w-full"
          >
            {/* FRONT */}
            <div className="glass-card p-6 absolute inset-0 flex flex-col items-center justify-center text-center"
              style={{ backfaceVisibility: 'hidden', border: '1px solid rgba(245,158,11,0.25)', boxShadow: '0 0 20px rgba(245,158,11,0.08)', minHeight: 260 }}>
              <span className="subject-badge mb-4">{card.subject}</span>
              <p className="heading-serif text-xl font-bold mb-3" style={{ color: '#F8FAFC' }}>{card.front}</p>
              <p className="text-xs text-ink-subtle">タップしてめくる</p>
            </div>

            {/* BACK */}
            <div className="glass-card p-5 absolute inset-0 flex flex-col justify-between"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.04)', minHeight: 260 }}>
              <div>
                <p className="text-sm leading-relaxed" style={{ color: '#E2E8F0', whiteSpace: 'pre-line' }}>{card.back}</p>
              </div>

              {/* Memory Tip button */}
              <div className="mt-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowTip((s) => !s); }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(251,113,133,0.12)', border: '1px solid rgba(251,113,133,0.3)', color: '#FB7185' }}>
                  <Lamp size={12} /> 語呂合わせを見る
                </button>
                <AnimatePresence>
                  {showTip && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="mt-2 px-3 py-2 rounded-lg text-xs"
                      style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.25)', color: '#FDA4AF' }}>
                      🧠 {card.memoryTip}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────
export default function FlashcardPage() {
  const { incrementFlashcardMastered } = useUserStore();
  const { play } = useSound();

  const [phase, setPhase]       = useState<Phase>('select');
  const [deck, setDeck]         = useState<FlashcardWithTip[]>([]);
  const [deckIdx, setDeckIdx]   = useState(0);
  const [results, setResults]   = useState<{ id: string; result: CardResult }[]>([]);
  const [setType, setSetType]   = useState<SetType>('all');

  const startDeck = (type: SetType) => {
    const d = buildDeck(type);
    if (d.length === 0) return;
    setDeck(d); setDeckIdx(0); setResults([]); setSetType(type); setPhase('study');
  };

  const handleSwipe = useCallback((result: CardResult) => {
    const card = deck[deckIdx];
    if (!card) return;

    // Update card state in localStorage
    const states = loadCardStates();
    states[card.id] = result;
    saveCardStates(states);

    if (result === 'know') { play('correct'); incrementFlashcardMastered(); }
    else { play('wrong'); }

    setResults((r) => [...r, { id: card.id, result }]);

    if (deckIdx + 1 >= deck.length) setPhase('done');
    else setDeckIdx((n) => n + 1);
  }, [deck, deckIdx, play, incrementFlashcardMastered]);

  const knewCount   = results.filter((r) => r.result === 'know').length;
  const notYetCount = results.filter((r) => r.result === 'not_yet').length;
  const reviewCount = results.filter((r) => r.result === 'review').length;

  // ── SELECT ─────────────────────────────────────────────────────────────
  if (phase === 'select') return (
    <div className="px-4 pt-10 pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard size={22} style={{ color: '#10B981' }} />
        <div>
          <h1 className="heading-serif text-2xl" style={{ color: '#10B981' }}>フラッシュカード</h1>
          <p className="text-xs text-ink-muted">スワイプで覚えよう！</p>
        </div>
      </div>

      <div className="glass-card p-4 mb-4" style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
        <p className="text-xs text-ink-muted leading-relaxed">
          <span style={{ color: '#10B981' }}>右スワイプ</span>: 覚えた！
          <span style={{ color: '#FB7185' }}>左スワイプ</span>: まだ
          <span style={{ color: '#F59E0B' }}>上スワイプ</span>: 後で復習
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {[
          { type: 'all',    label: '全カード',       desc: `全${FLASHCARDS.length}枚`, color: '#10B981' },
          { type: 'new',    label: '今日の新単語',   desc: '未学習のカードのみ',        color: '#F59E0B' },
          { type: 'weak',   label: '苦手カード',     desc: '「まだ」「後で」のカード',  color: '#FB7185' },
        ].map(({ type, label, desc, color }) => (
          <motion.button key={type} whileTap={{ scale: 0.97 }} onClick={() => startDeck(type)}
            className="glass-card p-4 flex items-center justify-between"
            style={{ border: `1px solid ${color}25` }}>
            <div>
              <p className="font-bold text-sm text-left" style={{ color: '#F8FAFC' }}>{label}</p>
              <p className="text-xs text-ink-muted text-left">{desc}</p>
            </div>
            <ChevronRight size={16} style={{ color }} />
          </motion.button>
        ))}

        <div className="mt-1">
          <p className="text-xs text-ink-muted mb-2 px-1">科目別</p>
          <div className="flex flex-col gap-2">
            {SUBJECTS.map((s) => (
              <motion.button key={s} whileTap={{ scale: 0.97 }} onClick={() => startDeck(s)}
                className="glass-card px-4 py-3 flex items-center justify-between"
                style={{ border: '1px solid rgba(56,189,248,0.15)' }}>
                <span className="text-sm" style={{ color: '#F8FAFC' }}>{s}</span>
                <span className="text-xs text-ink-muted">{FLASHCARDS.filter((c) => c.subject === s).length}枚</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── STUDY ──────────────────────────────────────────────────────────────
  if (phase === 'study') {
    const remaining = deck.length - deckIdx;
    return (
      <div className="px-4 pt-10 pb-24 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setPhase('select')} className="text-ink-muted text-sm flex items-center gap-1">← 中断</button>
          <span className="text-xs text-ink-muted">{deckIdx + 1} / {deck.length}</span>
          <div className="flex items-center gap-1 text-xs" style={{ color: '#10B981' }}>
            <CheckCircle size={12} /> {knewCount}
          </div>
        </div>

        {/* Progress */}
        <div className="xp-bar-track mb-5">
          <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#10B981,#34D399)', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }}
            animate={{ width: `${(deckIdx / deck.length) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>

        {/* Card stack */}
        <div className="relative" style={{ height: 300 }}>
          {/* Next card (background) */}
          {deck[deckIdx + 1] && (
            <SwipeCard card={deck[deckIdx + 1]} onSwipe={() => {}} isTop={false} />
          )}
          {/* Current card */}
          {deck[deckIdx] && (
            <SwipeCard key={deck[deckIdx].id} card={deck[deckIdx]} onSwipe={handleSwipe} isTop />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-5">
          <button onClick={() => handleSwipe('not_yet')}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm"
            style={{ background: 'rgba(251,113,133,0.12)', border: '1px solid rgba(251,113,133,0.35)', color: '#FB7185' }}>
            <X size={16} /> まだ
          </button>
          <button onClick={() => handleSwipe('review')}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', color: '#F59E0B' }}>
            <Clock size={16} /> 後で
          </button>
          <button onClick={() => handleSwipe('know')}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: '#10B981' }}>
            <CheckCircle size={16} /> 覚えた
          </button>
        </div>

        <p className="text-center text-xs text-ink-subtle mt-3">残り {remaining} 枚</p>
      </div>
    );
  }

  // ── DONE ──────────────────────────────────────────────────────────────
  if (phase === 'done') return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="px-4 pt-12 pb-24 max-w-lg mx-auto text-center">
      <div className="text-6xl mb-4">🃏</div>
      <h2 className="heading-serif text-2xl mb-2" style={{ color: '#10B981' }}>セッション完了！</h2>
      <p className="text-ink-muted mb-6">全 {deck.length} 枚完了</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: '覚えた',   count: knewCount,   color: '#10B981', icon: '✓' },
          { label: '後で復習', count: reviewCount,  color: '#F59E0B', icon: '⏰' },
          { label: 'まだ',     count: notYetCount,  color: '#FB7185', icon: '✗' },
        ].map(({ label, count, color, icon }) => (
          <div key={label} className="glass-card p-4 flex flex-col items-center gap-1"
            style={{ border: `1px solid ${color}25` }}>
            <span className="text-2xl font-black" style={{ color }}>{count}</span>
            <span className="text-[10px] text-ink-muted">{icon} {label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={() => startDeck(setType)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#10B981' }}>
          <RotateCcw size={15} /> もう一度
        </button>
        {notYetCount + reviewCount > 0 && (
          <button onClick={() => startDeck('weak')}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
            style={{ background: 'rgba(251,113,133,0.15)', border: '1px solid rgba(251,113,133,0.4)', color: '#FB7185' }}>
            苦手を復習
          </button>
        )}
      </div>
    </motion.div>
  );

  return null;
}
