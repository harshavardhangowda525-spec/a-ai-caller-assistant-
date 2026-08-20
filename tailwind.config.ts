import type { Config } from 'tailwindcss';

/**
 * Infinity Web & Apps brand palette.
 * Dark blue / royal blue / white / light gray, rounded cards, subtle shadows.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // Dark blue
          navy: '#0b1e3f',
          navy2: '#0f2650',
          // Royal blue
          royal: '#1e50e5',
          royalLight: '#3b6ef0',
          // Neutrals
          ink: '#0b1220',
          gray: '#f4f6fb',
          grayMid: '#e4e9f2',
          grayText: '#5b6b86',
        },
        status: {
          success: '#1aa66b',
          warn: '#e0a300',
          danger: '#e04848',
          info: '#2b8de0',
        },
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(11, 30, 63, 0.06), 0 8px 24px rgba(11, 30, 63, 0.06)',
        cardHover: '0 2px 6px rgba(11, 30, 63, 0.10), 0 16px 40px rgba(11, 30, 63, 0.10)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        pulseDot: 'pulseDot 1.4s ease-in-out infinite',
        fadeIn: 'fadeIn 0.25s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
