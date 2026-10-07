/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: '#030712',
          dark: '#060b18',
          panel: '#0a1128',
          card: '#0e1738',
          glass: 'rgba(10, 17, 40, 0.75)',
          glassHover: 'rgba(15, 26, 56, 0.85)',
          border: 'rgba(56, 189, 248, 0.15)',
          borderHover: 'rgba(56, 189, 248, 0.4)'
        },
        cyber: {
          cyan: '#06b6d4',
          cyanBright: '#22d3ee',
          blue: '#3b82f6',
          blueBright: '#60a5fa',
          indigo: '#6366f1',
          violet: '#8b5cf6',
          purple: '#a855f7',
          emerald: '#10b981',
          emeraldBright: '#34d399',
          amber: '#f59e0b',
          amberBright: '#fbbf24',
          rose: '#f43f5e',
          roseBright: '#fb7185'
        },
        net: {
          cyan: '#22d3ee',
          blue: '#3b82f6',
          violet: '#8b5cf6',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        glowCyan: '0 0 25px rgba(6, 182, 212, 0.35)',
        glowBlue: '0 0 25px rgba(59, 130, 246, 0.35)',
        glowViolet: '0 0 25px rgba(139, 92, 246, 0.35)',
        glowEmerald: '0 0 25px rgba(16, 185, 129, 0.35)',
        glowRose: '0 0 25px rgba(244, 63, 94, 0.35)',
        glowAmber: '0 0 25px rgba(245, 158, 11, 0.35)',
        cyberCard: '0 4px 20px -2px rgba(0, 0, 0, 0.6), 0 0 15px 0 rgba(6, 182, 212, 0.1)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'dash-flow': 'dash 20s linear infinite',
        'radar-sweep': 'radar 4s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow 2s ease-in-out infinite alternate',
        'scanline': 'scanline 8s linear infinite',
        'shimmer': 'shimmer 2.5s infinite linear'
      },
      keyframes: {
        dash: {
          to: { 'stroke-dashoffset': '-1000' }
        },
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        glow: {
          '0%': { filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.4))' },
          '100%': { filter: 'drop-shadow(0 0 16px rgba(6, 182, 212, 0.8))' }
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    },
  },
  plugins: [],
}
