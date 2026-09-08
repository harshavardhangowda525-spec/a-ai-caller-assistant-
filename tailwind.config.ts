import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base — deep espresso through warm cream
        espresso: {
          950: '#0b0705',
          900: '#140d09',
          800: '#1e1410',
          700: '#2a1d16',
          600: '#3a291f',
          500: '#4d382b',
        },
        coffee: {
          700: '#4a3527',
          500: '#6f4e37',
          400: '#8a6a52',
          300: '#a98a72',
        },
        // Accents — copper / caramel / cream
        copper: {
          600: '#a45a2a',
          500: '#c06b32',
          400: '#d98a4f',
          300: '#e8a877',
        },
        caramel: '#c69a6a',
        cream: {
          100: '#f7efe4',
          200: '#efe2cf',
          300: '#e3d2b9',
        },
        beige: '#d9c7ac',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '28px',
        '3xl': '44px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(11, 7, 5, 0.37), inset 0 1px 0 rgba(255,255,255,0.12)',
        'glass-lg': '0 24px 64px rgba(11, 7, 5, 0.5), inset 0 1px 0 rgba(255,255,255,0.14)',
        glow: '0 0 40px rgba(192, 107, 50, 0.28)',
      },
      keyframes: {
        'steam-rise': {
          '0%': { transform: 'translateY(0) scaleX(1)', opacity: '0' },
          '15%': { opacity: '0.5' },
          '50%': { opacity: '0.35' },
          '100%': { transform: 'translateY(-180px) scaleX(1.9)', opacity: '0' },
        },
        'sheen': {
          '0%': { transform: 'translateX(-120%) skewX(-18deg)' },
          '100%': { transform: 'translateX(220%) skewX(-18deg)' },
        },
        'float-slow': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'blob': {
          '0%,100%': { borderRadius: '42% 58% 63% 37% / 41% 44% 56% 59%' },
          '50%': { borderRadius: '58% 42% 37% 63% / 56% 59% 41% 44%' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'steam-rise': 'steam-rise 7s ease-in-out infinite',
        sheen: 'sheen 1.1s ease-out',
        'float-slow': 'float-slow 8s ease-in-out infinite',
        blob: 'blob 14s ease-in-out infinite',
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) forwards',
      },
    },
  },
  plugins: [],
};

export default config;
