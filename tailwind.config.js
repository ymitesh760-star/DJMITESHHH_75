/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#08090D',    // Obsidian Black base
          900: '#08090D',
          800: '#0E1017',
          700: '#151722',
        },
        midnight: {
          DEFAULT: '#111323',    // Midnight Navy
          deep: '#0B0D18',
          card: '#16192E',
        },
        silver: {
          DEFAULT: '#D9DDE8',    // Metallic Silver
          bright: '#F0F3F8',
          muted: '#9FA7B8',
        },
        pearl: {
          DEFAULT: '#F6F7FB',    // Pearl White
          100: '#FFFFFF',
          200: '#F6F7FB',
          300: '#E9ECF5',
        },
        violet: {
          DEFAULT: '#7857FF',    // Electric Violet
          glow: '#8E70FF',
          dark: '#5836DB',
        },
        icy: {
          DEFAULT: '#63D8FF',    // Icy Blue
          glow: '#8AE2FF',
          deep: '#23B9EC',
        },
        lavender: {
          DEFAULT: '#B9A7FF',    // Soft Lavender
          muted: '#9684E0',
        },
        magenta: {
          DEFAULT: '#EC4EAF',    // Signature Magenta
          glow: '#FF64C3',
          dark: '#C8298B',
        },
        dj: {
          void: '#08090D',
          obsidian: '#08090D',
          midnight: '#111323',
          silver: '#D9DDE8',
          pearl: '#F6F7FB',
          violet: '#7857FF',
          icy: '#63D8FF',
          lavender: '#B9A7FF',
          magenta: '#EC4EAF',
          surface: '#111323',
          card: 'rgba(17, 19, 35, 0.75)',
          glass: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(217, 221, 232, 0.12)',
          borderHover: 'rgba(120, 87, 255, 0.45)',
          laserGreen: '#10B981',
          amber: '#F59E0B',
        }
      },
      fontFamily: {
        display: ['Space Grotesk', 'Sora', 'sans-serif'],
        brand: ['Sora', 'Space Grotesk', 'sans-serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'spin-reverse': 'spin-rev 16s linear infinite',
        'pulse-glow': 'pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'spin-rev': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', filter: 'drop-shadow(0 0 15px rgba(120, 87, 255, 0.25))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 30px rgba(99, 216, 255, 0.45))' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      boxShadow: {
        'obsidian-elevated': '0 20px 50px -10px rgba(0, 0, 0, 0.85), 0 0 30px -5px rgba(120, 87, 255, 0.15)',
        'violet-glow': '0 0 30px -5px rgba(120, 87, 255, 0.35)',
        'icy-glow': '0 0 30px -5px rgba(99, 216, 255, 0.35)',
        'magenta-glow': '0 0 30px -5px rgba(236, 78, 175, 0.35)',
        'pearl-card': '0 10px 30px -5px rgba(0, 0, 0, 0.15), 0 1px 3px 0 rgba(0, 0, 0, 0.08)',
        'silver-bevel': 'inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 2px 10px rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
}
