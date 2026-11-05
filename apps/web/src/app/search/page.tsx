'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Cover } from '@/components/ui/Cover';
import { Message, Skeleton } from '@/components/ui/States';
import { TrackRow } from '@/components/ui/TrackRow';
import { useSearch } from '@/lib/hooks';
import { usePlayer } from '@/stores/usePlayer';
import type { PlaylistCard } from '@/types';

function CardGrid({ title, cards }: { title: string; cards: PlaylistCard[] }) {
  if (!cards.length) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xl font-bold">{title}</h2>
      <div className="grid grid-cols-4 gap-4">
        {cards.slice(0, 4).map((c) => (
          <Link
            key={c.id}
            href={c.kind === 'artist' ? `/search?q=${encodeURIComponent(c.title)}` : `/playlist/${encodeURIComponent(c.id)}`}
            className="rounded-card bg-surface-2 p-4 transition-colors hover:bg-surface"
          >
            <Cover src={c.thumbnail} alt={c.title} round={c.kind === 'artist'} className="aspect-square w-full text-3xl" />
            <p className="mt-3 truncate text-sm font-semibold">{c.title}</p>
            <p className="truncate text-xs text-muted">{c.subtitle}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Results() {
  const q = useSearchParams().get('q')?.trim() ?? '';
  const { data, isLoading, isError } = useSearch(q);
  const playQueue = usePlayer((s) => s.playQueue);

  if (!q) return <Message title="Search for songs, albums and playlists" hint="Usa a barra de pesquisa no topo." />;
  if (isLoading) return <Skeleton className="h-64" />;
  if (isError || !data) return <Message title="Não foi possível pesquisar" hint="Confirma que a API está a correr e tenta novamente." />;

  const empty = !data.songs.length && !data.playlists.length && !data.albums.length && !data.artists.length;
  if (empty) return <Message title={`Sem resultados para «${q}»`} hint="Experimenta outro termo." />;

  return (
    <>
      {data.songs.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold">Songs</h2>
          <ul>
            {data.songs.map((t, i) => (
              <TrackRow key={t.videoId} track={t} index={i} onPlay={() => playQueue(data.songs, i)} />
            ))}
          </ul>
        </section>
      )}
      <CardGrid title="Playlists" cards={data.playlists} />
      <CardGrid title="Albums" cards={data.albums} />
      <CardGrid title="Artists" cards={data.artists} />
    </>
  );
}

export default function SearchPage() {
  return (
    <div>
      <h1 className="mb-6 text-[32px] font-bold">Search</h1>
      <Suspense fallback={<Skeleton className="h-64" />}>
        <Results />
      </Suspense>
    </div>
  );
}
