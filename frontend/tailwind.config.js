/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          50: '#fff4ed', 100: '#ffe6d5', 200: '#fccba9',
          300: '#f9a57a', 400: '#f5784a', 500: '#EA580C',
          600: '#c2410c', 700: '#9a3412', 800: '#7c2d12', 900: '#431407',
        },
        accent: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0',
          300: '#6ee7b7', 400: '#34d399', 500: '#10B981',
          600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b',
        },
        surface: {
          50:  '#fafbff',
          100: '#f0f4ff',
          200: '#e4ebf8',
          300: '#c9d6ee',
          400: '#8fa3c8',
          500: '#5c72a0',
          600: '#3d5278',
          700: '#263759',
          800: '#182440',
          900: '#0d1829',
          950: '#070e1a',
        },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0d1829 0%, #182440 40%, #1a2d3d 70%, #0f2318 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        'orange-glow': 'radial-gradient(ellipse at center, rgba(234,88,12,0.15) 0%, transparent 70%)',
        'green-glow': 'radial-gradient(ellipse at center, rgba(16,185,129,0.12) 0%, transparent 70%)',
        'surface-gradient': 'linear-gradient(180deg, #0d1829 0%, #182440 50%, #0f2318 100%)',
      },
      boxShadow: {
        'glow-orange': '0 0 20px rgba(234,88,12,0.3), 0 4px 15px rgba(234,88,12,0.2)',
        'glow-green':  '0 0 20px rgba(16,185,129,0.3), 0 4px 15px rgba(16,185,129,0.2)',
        'glow-blue':   '0 0 20px rgba(99,179,237,0.2)',
        'card':        '0 4px 24px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2)',
        'card-hover':  '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
        'inner-glow':  'inset 0 1px 0 rgba(255,255,255,0.08)',
        'soft':        '0 2px 8px rgba(0,0,0,0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
