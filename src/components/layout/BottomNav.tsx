'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, HelpCircle, Sword, CreditCard, BarChart2, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { href: '/', label: 'ホーム', icon: Home },
  { href: '/study', label: '学習', icon: BookOpen },
  { href: '/quiz', label: 'クイズ', icon: HelpCircle },
  { href: '/flashcard', label: 'カード', icon: CreditCard },
  { href: '/quest', label: 'クエスト', icon: Sword },
  { href: '/progress', label: '進捗', icon: BarChart2 },
  { href: '/collection', label: '実績', icon: Trophy },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
      style={{
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center justify-around px-1 pt-2 pb-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5 min-w-[44px] py-1 relative">
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-gold-gradient-h"
                  style={{ background: 'linear-gradient(90deg, #F59E0B, #D97706)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon
                size={20}
                className="transition-colors"
                style={{ color: active ? '#F59E0B' : '#475569' }}
              />
              <span
                className="text-[9px] font-medium transition-colors"
                style={{ color: active ? '#F59E0B' : '#475569' }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
