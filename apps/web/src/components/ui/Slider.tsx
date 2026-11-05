'use client';

import { useState } from 'react';
import clsx from 'clsx';

interface Props {
  value: number;
  max: number;
  label: string;
  step?: number;
  className?: string;
  /** Chamado ao largar o cursor (ou ao soltar uma tecla). */
  onCommit: (value: number) => void;
}

/** Slider que só confirma o valor ao largar, para não disparar um seek por cada movimento. */
export function Slider({ value, max, label, step = 1, className, onCommit }: Props) {
  const [drag, setDrag] = useState<number | null>(null);
  const shown = drag ?? value;
  const pct = max > 0 ? Math.min(100, (shown / max) * 100) : 0;

  const commit = () => {
    if (drag !== null) onCommit(drag);
    setDrag(null);
  };

  return (
    <input
      type="range"
      aria-label={label}
      min={0}
      max={max || 1}
      step={step}
      value={shown}
      onInput={(e) => setDrag(Number((e.target as HTMLInputElement).value))}
      onChange={() => undefined}
      onPointerUp={commit}
      onKeyUp={commit}
      className={clsx('slider w-full', className)}
      style={{ ['--p' as string]: `${pct}%` }}
    />
  );
}
