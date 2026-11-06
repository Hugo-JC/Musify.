import Link from 'next/link';
import { Play } from 'lucide-react';
import { Cover } from '@/components/ui/Cover';
import { usePlayPlaylist } from '@/lib/hooks';
import { cardHref } from './QuickCard';
import type { PlaylistCard } from '@/types';

interface Props {
  card: PlaylistCard;
  position: number;
  badge?: string;
}

export function AlbumCard({ card, position, badge }: Props) {
  const play = usePlayPlaylist();

  return (
    <article className="featured-card group relative flex flex-col transition-all duration-200 hover:shadow-xl">
      <Link href={cardHref(card)} className="flex min-h-0 flex-1 flex-col" aria-label={card.title}>
        <div className="relative">
          <Cover src={card.thumbnail} alt={card.title} className="featured-cover text-5xl shadow-lg" />
          {badge && (
            <span className="absolute left-3 top-3 rounded-full bg-[#ffe1e6] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7f1427] shadow-md">
              {badge}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <h3 className="truncate text-base font-semibold">{card.title}</h3>
          <span className="text-xs tabular-nums text-muted">{String(position).padStart(2, '0')}</span>
        </div>
      </Link>
      <button
        type="button"
        aria-label={'Tocar ' + card.title}
        onClick={() => void play(card.id)}
        className="absolute bottom-16 right-7 hidden h-12 w-12 items-center justify-center rounded-full bg-accent text-on-accent shadow-2xl transition hover:scale-105 active:scale-95 group-focus-within:flex group-hover:flex"
      >
        <Play className="ml-0.5 h-6 w-6" fill="currentColor" strokeWidth={1.8} />
      </button>
    </article>
  );
}
