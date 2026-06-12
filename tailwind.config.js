/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        accent: {
          DEFAULT: '#6C7CFF',
          light: 'rgba(108,124,255,0.12)',
          hover: '#5a6aff',
          secondary: '#7C5CFF',
          cyan: '#4FD1C5',
        },
        surface: {
          DEFAULT: '#12131f',
          hover: '#1a1b2e',
        },
        dark: {
          900: '#0a0b14',
          800: '#0e0f1a',
          700: '#12131f',
          600: '#1a1b2e',
          500: '#252640',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.3)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.4)',
        'modal': '0 8px 24px rgba(0,0,0,0.5)',
        'glow': '0 0 20px rgba(108,124,255,0.15)',
        'glow-lg': '0 0 40px rgba(108,124,255,0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'completion-pulse': 'completionPulse 0.6s ease',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'orbital-spin': 'orbitalSpin 60s linear infinite',
        'float': 'float 3s ease-in-out infinite',
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
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(108,124,255,0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(108,124,255,0.4)' },
        },
        orbitalSpin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
