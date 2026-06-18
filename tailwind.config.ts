import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0F172A',
          secondary: '#1E293B',
        },
        gold: {
          light: '#FCD34D',
          DEFAULT: '#F59E0B',
          dark: '#D97706',
        },
        sakura: {
          light: '#FDA4AF',
          DEFAULT: '#FB7185',
          dark: '#F43F5E',
        },
        jade: {
          light: '#34D399',
          DEFAULT: '#10B981',
          dark: '#059669',
        },
        ink: {
          DEFAULT: '#F8FAFC',
          muted: '#94A3B8',
          subtle: '#475569',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif JP"', 'serif'],
        sans: ['"Noto Sans JP"', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #F59E0B, #D97706)',
        'gold-gradient-h': 'linear-gradient(90deg, #F59E0B, #D97706)',
        'sakura-gradient': 'linear-gradient(135deg, #FB7185, #F43F5E)',
        'jade-gradient': 'linear-gradient(135deg, #10B981, #059669)',
        'bg-gradient': 'linear-gradient(135deg, #0F172A, #1E293B)',
      },
      boxShadow: {
        gold: '0 0 20px rgba(245, 158, 11, 0.4)',
        'gold-lg': '0 0 40px rgba(245, 158, 11, 0.6)',
        sakura: '0 0 20px rgba(251, 113, 133, 0.4)',
        jade: '0 0 20px rgba(16, 185, 129, 0.4)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        'bounce-in': 'bounce-in 0.5s cubic-bezier(0.68,-0.55,0.265,1.55)',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(245,158,11,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(245,158,11,0.7)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
