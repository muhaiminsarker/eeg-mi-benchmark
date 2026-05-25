import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#09090f',
        surface: '#100f1a',
        raised: '#141226',
        border: '#1e1a30',
        accent: '#a78bfa',
        'accent-muted': '#c4b5fd',
        'text-primary': '#e2e8f0',
        'text-muted': '#64748b',
        'text-dim': '#3a3650',
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
        sans: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        load: '0 0 12px rgba(167, 139, 250, 0.4)',
      },
    },
  },
  plugins: [],
}

export default config
