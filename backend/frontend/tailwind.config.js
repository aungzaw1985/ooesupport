/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          crimson: '#8A0505',
          gold: '#E6B239',
          signal: '#FF1F28',
          dark: '#0A0A0A',
          panel: '#141414',
          grid: '#1F1F1F'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        tight: ['"Inter Tight"', 'sans-serif'],
      },
      boxShadow: {
        'glow-crimson': '0 0 10px rgba(138, 5, 5, 0.5)',
        'glow-gold': '0 0 8px rgba(230, 178, 57, 0.4)',
        'glow-signal': '0 0 12px rgba(255, 31, 40, 0.6)',
      }
    },
  },
  plugins: [],
}