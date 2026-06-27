/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        paper: {
          50: '#FBF7F0',
          100: '#F5EDE0',
          200: '#EDE4D3',
          300: '#E0D4C0',
          400: '#D4C5A9',
        },
        ink: {
          300: '#A89882',
          400: '#8B7355',
          500: '#6B5640',
          600: '#5C4033',
          700: '#4A3328',
          800: '#3D2A20',
          900: '#2A1B14',
        },
        seal: {
          DEFAULT: '#8B2500',
          dark: '#6B1D00',
          light: '#A03010',
        },
        gold: {
          DEFAULT: '#B8860B',
          light: '#D4A017',
          dark: '#8B6914',
        },
        sage: {
          DEFAULT: '#6B8E23',
          light: '#8FA84A',
          dark: '#4A6315',
        },
        terracotta: {
          DEFAULT: '#CD5C5C',
          dark: '#A0434A',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', '"Inter"', 'sans-serif'],
        handwritten: ['"Ma Shan Zheng"', '"Liu Jian Mao Cao"', 'cursive'],
      },
      boxShadow: {
        'paper': '0 1px 2px rgba(92,64,51,0.06), 0 2px 8px rgba(92,64,51,0.05), inset 0 1px 0 rgba(255,255,255,0.4)',
        'paper-hover': '0 2px 4px rgba(92,64,51,0.08), 0 8px 24px rgba(92,64,51,0.10), inset 0 1px 0 rgba(255,255,255,0.5)',
        'paper-active': '0 4px 8px rgba(92,64,51,0.10), 0 12px 32px rgba(92,64,51,0.14), inset 0 1px 0 rgba(255,255,255,0.5)',
        'stamp': '0 1px 2px rgba(139,37,0,0.3), inset 0 -1px 0 rgba(0,0,0,0.1)',
        'card': '0 1px 3px rgba(92,64,51,0.08)',
      },
      borderRadius: {
        'paper': '3px',
        'stamp': '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'completion-pulse': 'completionPulse 0.6s ease',
        'float': 'float 3s ease-in-out infinite',
        'paper-fall': 'paperFall 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'ink-spread': 'inkSpread 0.6s ease-out forwards',
        'stamp-press': 'stampPress 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        completionPulse: {
          '0%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.03)' },
          '50%': { transform: 'scale(1.005)' },
          '100%': { transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        paperFall: {
          '0%': { opacity: '0', transform: 'translateY(-40px) rotate(-8deg) scale(0.95)' },
          '60%': { opacity: '1', transform: 'translateY(4px) rotate(1deg) scale(1.01)' },
          '100%': { opacity: '1', transform: 'translateY(0) rotate(0deg) scale(1)' },
        },
        inkSpread: {
          '0%': { opacity: '0', transform: 'scale(0.8)', filter: 'blur(2px)' },
          '50%': { opacity: '0.6', filter: 'blur(1px)' },
          '100%': { opacity: '1', transform: 'scale(1)', filter: 'blur(0)' },
        },
        stampPress: {
          '0%': { opacity: '0', transform: 'scale(1.4) rotate(-12deg)' },
          '60%': { opacity: '1', transform: 'scale(0.92) rotate(2deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
      },
    },
  },
  plugins: [],
};
