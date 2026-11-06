'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';
import { Cover } from '@/components/ui/Cover';
import { usePlayPlaylist } from '@/lib/hooks';
import type { PlaylistCard } from '@/types';

export function cardHref(c: PlaylistCard) {
  return `/playlist/${encodeURIComponent(c.id)}`;
}

export function QuickCard({ card }: { card: PlaylistCard }) {
  const play = usePlayPlaylist();
  return (
    <div className="group relative">
      <Link
        href={cardHref(card)}
        className="flex h-[76px] items-center gap-4 rounded-card bg-surface-2 pr-4 transition-all duration-200 hover:bg-surface hover:shadow-lg"
      >
        <Cover src={card.thumbnail} alt={card.title} className="ml-1.5 h-[60px] w-[60px] rounded-xl text-sm shadow-md" />
        <span className="line-clamp-2 text-sm font-semibold leading-snug">{card.title}</span>
      </Link>
      <button
        type="button"
        aria-label={`Tocar ${card.title}`}
        onClick={() => void play(card.id)}
        className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-on-accent shadow-xl transition hover:scale-105 active:scale-95 group-focus-within:flex group-hover:flex"
      >
        <Play className="ml-0.5 h-5 w-5 fill-current" />
      </button>
    </div>
  );
}
