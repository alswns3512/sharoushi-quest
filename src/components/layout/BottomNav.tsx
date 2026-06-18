'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, CreditCard, BarChart2, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSound } from '@/hooks/useSound';

const TABS = [
  { href: '/',          label: 'ホーム',   icon: Home         },
  { href: '/study',     label: '学習',     icon: BookOpen     },
  { href: '/exam',      label: '試験',     icon: ClipboardList },
  { href: '/flashcard', label: 'カード',   icon: CreditCard   },
  { href: '/progress',  label: '進捗',     icon: BarChart2    },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { play } = useSound();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(15,23,42,0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1 max-w-lg mx-auto">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => { if (!active) play('navigate'); }}
              className="flex flex-col items-center gap-0.5 relative"
              style={{ minWidth: 52, padding: '6px 4px' }}
            >
              {active && (
                <motion.div
                  layoutId="nav-bar"
                  className="absolute -top-2 rounded-full"
                  style={{ width: 28, height: 3, background: 'linear-gradient(90deg,#F59E0B,#D97706)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <motion.div
                animate={active ? { scale: 1.15 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                style={{
                  color: active ? '#F59E0B' : '#475569',
                  filter: active ? 'drop-shadow(0 0 6px rgba(245,158,11,0.7))' : 'none',
                }}
              >
                <Icon size={21} />
              </motion.div>
              <span className="text-[9px] font-medium leading-none" style={{ color: active ? '#F59E0B' : '#475569' }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
