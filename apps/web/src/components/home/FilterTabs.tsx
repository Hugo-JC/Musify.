'use client';

import clsx from 'clsx';

const TABS = ['All', 'Music', 'Podcasts'] as const;
export type Tab = (typeof TABS)[number];

export function FilterTabs({ value, onChange }: { value: Tab; onChange: (t: Tab) => void }) {
  return (
    <div role="tablist" aria-label="Filtro de conteúdo" className="flex gap-3">
      {TABS.map((t) => {
        const disabled = t === 'Podcasts'; // fora de âmbito (sem fonte de dados)
        return (
          <button
            key={t}
            role="tab"
            aria-selected={value === t}
            disabled={disabled}
            title={disabled ? 'Em breve' : undefined}
            onClick={() => onChange(t)}
            className={clsx(
              'h-9 rounded-full px-5 text-sm font-medium transition-colors',
              value === t ? 'bg-accent text-on-accent' : 'bg-surface-2 text-white hover:bg-surface',
              disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}
