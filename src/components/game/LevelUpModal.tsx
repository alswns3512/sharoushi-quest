'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { useSound } from '@/hooks/useSound';

function charIcon(level: number) {
  if (level <= 10) return '🌱';
  if (level <= 20) return '📖';
  if (level <= 30) return '⚖️';
  if (level <= 50) return '🎓';
  return '🏆';
}

// Confetti particle
function Particle({ style }: { style: React.CSSProperties }) {
  return <div className="absolute rounded-full pointer-events-none" style={style} />;
}

const PARTICLE_COLORS = ['#F59E0B', '#FCD34D', '#FB7185', '#818CF8', '#10B981', '#38BDF8'];

function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    size: 6 + Math.random() * 8,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1,
  }));
}

export function LevelUpModal() {
  const { pendingLevelUp, clearPendingLevelUp } = useUserStore();
  const { play } = useSound();
  const playedRef = useRef(false);

  useEffect(() => {
    if (pendingLevelUp && !playedRef.current) {
      playedRef.current = true;
      play('levelup');
    }
    if (!pendingLevelUp) playedRef.current = false;
  }, [pendingLevelUp, play]);

  const particles = pendingLevelUp ? generateParticles(24) : [];

  return (
    <AnimatePresence>
      {pendingLevelUp && (
        <motion.div
          key="levelup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={clearPendingLevelUp}
        >
          {/* Radial gold glow */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 2.5, 2], opacity: [0, 0.4, 0.15] }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 400,
              height: 400,
              background: 'radial-gradient(circle, #F59E0B, transparent)',
            }}
          />

          {/* Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: `${p.x}vw`, y: '-10vh', opacity: 1, rotate: 0 }}
                animate={{ y: '110vh', opacity: [1, 1, 0], rotate: 360 * (Math.random() > 0.5 ? 1 : -1) }}
                transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
                className="absolute"
              >
                <Particle
                  style={{
                    width: p.size,
                    height: p.size,
                    background: p.color,
                    boxShadow: `0 0 ${p.size}px ${p.color}`,
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* Main card */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
            className="relative flex flex-col items-center gap-5 px-10 py-12 rounded-3xl text-center"
            style={{
              background: 'rgba(15,23,42,0.95)',
              border: '2px solid rgba(245,158,11,0.6)',
              boxShadow: '0 0 60px rgba(245,158,11,0.4), 0 0 120px rgba(245,158,11,0.15)',
              maxWidth: 320,
              width: '90vw',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* LEVEL UP text */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm font-black tracking-[0.25em] uppercase"
              style={{ color: '#FB7185', textShadow: '0 0 12px rgba(251,113,133,0.8)' }}
            >
              ⚡ LEVEL UP ⚡
            </motion.div>

            {/* Character icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 0.4, duration: 0.6, type: 'spring' }}
              className="text-6xl"
            >
              {charIcon(pendingLevelUp)}
            </motion.div>

            {/* Level number */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
            >
              <div
                className="heading-serif font-black"
                style={{
                  fontSize: 72,
                  lineHeight: 1,
                  background: 'linear-gradient(135deg, #F59E0B, #FCD34D)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 16px rgba(245,158,11,0.8))',
                }}
              >
                {pendingLevelUp}
              </div>
              <div className="text-xs text-ink-muted mt-1">LEVEL</div>
            </motion.div>

            {/* Message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-sm"
              style={{ color: '#94A3B8' }}
            >
              レベルアップおめでとう！<br />
              新しいステージが解放されました
            </motion.p>

            {/* Tap to close */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              whileTap={{ scale: 0.93 }}
              onClick={clearPendingLevelUp}
              className="px-8 py-3 rounded-xl font-bold text-sm"
              style={{
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#0F172A',
                boxShadow: '0 0 20px rgba(245,158,11,0.5)',
              }}
            >
              続ける ✨
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
