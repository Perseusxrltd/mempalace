import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#191919',
        sidebar: '#111111',
        surface: '#242424',
        raised: '#2e2e2e',
        border: 'rgba(255,255,255,0.08)',
        accent: '#7c6af7',
        'accent-light': '#9d8ff9',
        muted: '#888888',
        faint: '#444444',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Inter"', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
