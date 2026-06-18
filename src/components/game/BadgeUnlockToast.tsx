'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { ALL_BADGES } from '@/data/badges';

export function BadgeUnlockToast() {
  const { pendingBadge, clearPendingBadge } = useUserStore();

  const badge = pendingBadge
    ? ALL_BADGES.find((b) => b.id === pendingBadge)
    : null;

  useEffect(() => {
    if (!pendingBadge) return;
    const t = setTimeout(clearPendingBadge, 3500);
    return () => clearTimeout(t);
  }, [pendingBadge, clearPendingBadge]);

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          key={badge.id}
          initial={{ y: -80, opacity: 0, x: '-50%' }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="fixed top-14 left-1/2 z-[210] flex items-center gap-3 px-5 py-3 rounded-2xl"
          style={{
            background: 'rgba(15,23,42,0.97)',
            border: '1px solid rgba(252,211,77,0.5)',
            boxShadow: '0 0 30px rgba(252,211,77,0.25)',
            maxWidth: 320,
            width: 'calc(100vw - 32px)',
          }}
          onClick={clearPendingBadge}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(252,211,77,0.15)', border: '1px solid rgba(252,211,77,0.4)' }}
          >
            <span className="text-2xl">{badge.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold tracking-wider" style={{ color: '#FCD34D' }}>
              🏅 バッジ獲得！
            </p>
            <p className="font-bold text-sm text-ink truncate">{badge.name}</p>
            <p className="text-xs text-ink-muted truncate">{badge.description}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
