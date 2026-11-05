'use client';

import { AudioLines } from 'lucide-react';
import clsx from 'clsx';
import type { MoodKey } from '@/types';

const MOODS: { key: MoodKey; label: string }[] = [
  { key: 'focus', label: 'Focus' },
  { key: 'unwind', label: 'Unwind' },
  { key: 'energy', label: 'Energy' },
];

interface Props {
  value: MoodKey | null;
  onChange: (m: MoodKey | null) => void;
}

export function MoodSelector({ value, onChange }: Props) {
  return (
    <section aria-label="Tune your mood" className="flex flex-col items-end gap-3">
      <div className="flex items-center gap-4">
        <h2 className="text-xs font-medium tracking-wide text-white/80">TUNE YOUR MOOD</h2>
        <AudioLines className="h-6 w-6 text-accent" aria-hidden />
      </div>
      <div className="flex gap-3">
        {MOODS.map((m) => {
          const active = value === m.key;
          return (
            <button
              key={m.key}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : m.key)}
              className={clsx(
                'h-9 w-[112px] rounded-full text-sm font-medium transition-colors',
                active ? 'bg-accent text-on-accent' : m.key === 'energy' ? 'bg-energy hover:brightness-125' : 'bg-surface hover:bg-line',
              )}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
