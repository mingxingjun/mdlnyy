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
          400: '#C8B89E',
        },
        ink: {
          900: '#2A1F14',
          800: '#3D2B1F',
          700: '#5C4033',
          600: '#7A6350',
          500: '#9C8B7A',
        },
        seal: {
          DEFAULT: '#8B2500',
          light: '#C4543A',
          dark: '#6B1C00',
        },
        gold: {
          DEFAULT: '#B8860B',
          light: '#DAA520',
        },
        'green-ink': '#2D5A27',
        worn: '#9C8B7A',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Songti SC"', 'SimSun', 'Georgia', 'Garamond', 'serif'],
        sans: ['Inter', 'Noto Sans SC', 'sans-serif'],
      },
      boxShadow: {
        'paper': '0 2px 8px rgba(92, 64, 51, 0.08), 0 1px 3px rgba(92, 64, 51, 0.06), inset 1px 1px 0 rgba(255,255,255,0.4)',
        'paper-hover': '0 8px 24px rgba(92, 64, 51, 0.15), 0 2px 8px rgba(92, 64, 51, 0.1), inset 1px 1px 0 rgba(255,255,255,0.3)',
        'stamp': '0 2px 8px rgba(139, 37, 0, 0.3), inset 0 0 20px rgba(139, 37, 0, 0.1)',
        'note': '3px 3px 0 rgba(92, 64, 51, 0.12), 0 4px 12px rgba(92, 64, 51, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-up': 'slideUp 0.5s ease forwards',
        'ink-spread': 'inkSpread 0.8s ease-out forwards',
        'paper-float': 'paperFloat 4s ease-in-out infinite',
        'stamp-press': 'stampPress 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'page-turn': 'pageTurn 0.6s ease-in-out forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        inkSpread: {
          '0%': { opacity: '0', transform: 'scale(0.8)', filter: 'blur(4px)' },
          '60%': { opacity: '0.8', filter: 'blur(1px)' },
          '100%': { opacity: '1', transform: 'scale(1)', filter: 'blur(0)' },
        },
        paperFloat: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-3px) rotate(0.3deg)' },
          '75%': { transform: 'translateY(2px) rotate(-0.2deg)' },
        },
        stampPress: {
          '0%': { opacity: '0', transform: 'scale(2) rotate(-15deg)' },
          '50%': { opacity: '1', transform: 'scale(0.95) rotate(-8deg)' },
          '70%': { transform: 'scale(1.02) rotate(-8deg)' },
          '100%': { opacity: '0.85', transform: 'scale(1) rotate(-8deg)' },
        },
        pageTurn: {
          '0%': { transform: 'rotateY(0deg)', opacity: '1' },
          '50%': { transform: 'rotateY(-90deg)', opacity: '0.5' },
          '100%': { transform: 'rotateY(0deg)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
