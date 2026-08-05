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
        // Dark Orange theme
        // Background #121212 · Surface #1E1E1E · Primary #FF6B35 · Accent #FFD166 · Text #F8F8F8
        primary: {
          50: '#fff3ee', 100: '#ffe1d2', 200: '#ffbfa1',
          300: '#ff9868', 400: '#ff8752', 500: '#FF6B35',
          600: '#e2521e', 700: '#b93f16', 800: '#933316', 900: '#762c16',
        },
        accent: {
          50: '#fffbeb', 100: '#fff3c4', 200: '#ffe58a',
          300: '#ffdb5c', 400: '#ffd674', 500: '#FFD166',
          600: '#e0a92f', 700: '#b8841f', 800: '#93671c', 900: '#78541c',
        },
        surface: {
          50:  '#F8F8F8',
          100: '#E4E4E4',
          200: '#C9C9C9',
          300: '#A6A6A6',
          400: '#8A8A8A',
          500: '#6E6E6E',
          600: '#4A4A4A',
          700: '#333333',
          800: '#242424',
          900: '#1E1E1E',
          950: '#121212',
        },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #121212 0%, #1E1E1E 45%, #241a14 75%, #121212 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        'orange-glow': 'radial-gradient(ellipse at center, rgba(255,107,53,0.18) 0%, transparent 70%)',
        'green-glow': 'radial-gradient(ellipse at center, rgba(255,209,102,0.14) 0%, transparent 70%)',
        'surface-gradient': 'linear-gradient(180deg, #121212 0%, #1E1E1E 55%, #1a1512 100%)',
      },
      boxShadow: {
        'glow-orange': '0 0 20px rgba(255,107,53,0.35), 0 4px 15px rgba(255,107,53,0.2)',
        'glow-green':  '0 0 20px rgba(255,209,102,0.3), 0 4px 15px rgba(255,209,102,0.2)',
        'glow-blue':   '0 0 20px rgba(99,179,237,0.2)',
        'card':        '0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)',
        'card-hover':  '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.35)',
        'inner-glow':  'inset 0 1px 0 rgba(255,255,255,0.08)',
        'soft':        '0 2px 8px rgba(0,0,0,0.2)',
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
