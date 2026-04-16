import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Obsidian-matched palette (keep names for className compat)
        bg:            '#202020',
        sidebar:       '#161616',
        surface:       '#242424',
        raised:        '#2e2e2e',
        border:        '#333333',
        accent:        '#7f6df2',
        'accent-light':'#9d8ff9',
        muted:         '#999999',
        faint:         '#555555',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Inter"', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
