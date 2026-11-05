'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';
import { Cover } from '@/components/ui/Cover';
import { usePlayPlaylist } from '@/lib/hooks';
import { cardHref } from './QuickCard';
import type { PlaylistCard } from '@/types';

interface Props {
  card: PlaylistCard;
  /** Posição na secção (01, 02, 03) */
  position: number;
  badge?: string;
}

export function AlbumCard({ card, position, badge }: Props) {
  const play = usePlayPlaylist();
  const playable = !card.id.startsWith('mock-');
  return (
    <article className="group relative flex h-[356px] flex-col rounded-card bg-surface-2 px-6 pb-3 pt-4 transition-colors hover:bg-surface">
      <Link href={cardHref(card)} className="flex min-h-0 flex-1 flex-col" aria-label={card.title}>
        <div className="relative">
          <Cover src={card.thumbnail} alt={card.title} className="aspect-square w-full rounded-2xl text-5xl" />
          {badge && (
            <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase text-on-accent">
              {badge}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <h3 className="truncate text-base font-semibold">{card.title}</h3>
          <span className="text-xs tabular-nums text-muted">{String(position).padStart(2, '0')}</span>
        </div>
      </Link>
      {playable && (
        <button
          type="button"
          aria-label={`Tocar ${card.title}`}
          onClick={() => void play(card.id)}
          className="absolute bottom-16 right-9 hidden h-12 w-12 items-center justify-center rounded-full bg-accent text-on-accent shadow-xl group-focus-within:flex group-hover:flex"
        >
          <Play className="ml-0.5 h-6 w-6 fill-current" />
        </button>
      )}
    </article>
  );
}
