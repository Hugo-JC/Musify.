import type { Config } from 'tailwindcss';

// Tokens definidos em globals.css (variáveis CSS) para um único ponto de verdade.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        line: 'var(--line)',
        accent: 'var(--accent)',
        'accent-strong': 'var(--accent-strong)',
        'on-accent': 'var(--on-accent)',
        muted: 'var(--muted)',
        energy: 'var(--energy)',
      },
      fontFamily: { sans: ['Inter Variable', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '20px', panel: '28px' },
      gridTemplateColumns: { shell: '288px minmax(0, 1fr)' },
      gridTemplateRows: { shell: '80px minmax(0, 1fr) 112px' },
    },
  },
  plugins: [],
};

export default config;
