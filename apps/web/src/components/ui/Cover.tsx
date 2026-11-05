'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { hueFrom, initials } from '@/lib/format';

interface Props {
  src?: string | null;
  alt: string;
  className?: string;
  round?: boolean;
}

/** Capa com fallback em gradiente (quando não há imagem ou falha o carregamento). */
export function Cover({ src, alt, className, round }: Props) {
  const [failed, setFailed] = useState(false);
  const radius = round ? 'rounded-full' : 'rounded-xl';

  if (!src || failed) {
    const hue = hueFrom(alt);
    return (
      <div
        role="img"
        aria-label={alt}
        className={clsx('flex shrink-0 items-center justify-center font-semibold text-white/90', radius, className)}
        style={{ background: `linear-gradient(135deg, hsl(${hue} 55% 42%), hsl(${(hue + 60) % 360} 60% 28%))` }}
      >
        {initials(alt)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={clsx('shrink-0 object-cover', radius, className)}
    />
  );
}
