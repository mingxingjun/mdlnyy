/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        dark: {
          900: '#0a0a0f',
          800: '#0e0e16',
          700: '#12121a',
          600: '#1a1a26',
          500: '#22222e',
          400: '#2a2a3a',
        },
        neon: {
          blue: '#00d4ff',
          green: '#00ff88',
          purple: '#8b5cf6',
          pink: '#ff0080',
          yellow: '#ffd600',
        },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Noto Sans SC', 'sans-serif'],
      },
      boxShadow: {
        'neon-blue': '0 0 15px rgba(0, 212, 255, 0.3), 0 0 45px rgba(0, 212, 255, 0.1)',
        'neon-green': '0 0 15px rgba(0, 255, 136, 0.3), 0 0 45px rgba(0, 255, 136, 0.1)',
        'neon-purple': '0 0 15px rgba(139, 92, 246, 0.3), 0 0 45px rgba(139, 92, 246, 0.1)',
        'neon-pink': '0 0 15px rgba(255, 0, 128, 0.3), 0 0 45px rgba(255, 0, 128, 0.1)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'neon-flow': 'linear-gradient(135deg, #00d4ff 0%, #8b5cf6 50%, #ff0080 100%)',
        'neon-flow-2': 'linear-gradient(135deg, #00ff88 0%, #00d4ff 50%, #8b5cf6 100%)',
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'completion-pulse': 'completionPulse 2s ease-out forwards',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.2), 0 0 15px rgba(0, 212, 255, 0.1)' },
          '100%': { boxShadow: '0 0 15px rgba(0, 212, 255, 0.4), 0 0 45px rgba(0, 212, 255, 0.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        completionPulse: {
          '0%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '25%': { transform: 'scale(1.08)', filter: 'brightness(1.5)' },
          '50%': { transform: 'scale(1.04)', filter: 'brightness(1.3)' },
          '75%': { transform: 'scale(1.06)', filter: 'brightness(1.4)' },
          '100%': { transform: 'scale(1)', filter: 'brightness(1)' },
        },
      },
    },
  },
  plugins: [],
};
