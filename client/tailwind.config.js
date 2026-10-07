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
          dark: '#070b16',
          panel: '#0a0e1a',
          glass: 'rgba(17, 26, 46, 0.7)',
          border: '#1f2b47'
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
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glowCyan: '0 0 20px rgba(34, 211, 238, 0.3)',
        glowRose: '0 0 20px rgba(244, 63, 94, 0.3)',
        glowAmber: '0 0 20px rgba(245, 158, 11, 0.3)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'dash-flow': 'dash 20s linear infinite'
      },
      keyframes: {
        dash: {
          to: { 'stroke-dashoffset': '-1000' }
        }
      }
    },
  },
  plugins: [],
}
