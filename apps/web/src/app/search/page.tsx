'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Cover } from '@/components/ui/Cover';
import { Message, Skeleton } from '@/components/ui/States';
import { TrackRow } from '@/components/ui/TrackRow';
import { useSearch } from '@/lib/hooks';
import { usePlayer } from '@/stores/usePlayer';
import { trackKey, type PlaylistCard } from '@/types';

function CardGrid({ title, cards }: { title: string; cards: PlaylistCard[] }) {
  if (!cards.length) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.slice(0, 6).map((card) => (
          <article key={card.id} className="rounded-2xl border border-white/[0.035] bg-surface-2 p-4">
            <Cover src={card.thumbnail} alt={card.title} round={card.kind === 'artist'} className="aspect-square w-full text-3xl" />
            <p className="mt-3 truncate text-sm font-semibold">{card.title}</p>
            <p className="truncate text-xs text-muted">{card.subtitle}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Results() {
  const query = useSearchParams().get('q')?.trim() ?? '';
  const { data, isLoading, isError, error } = useSearch(query);
  const playQueue = usePlayer((state) => state.playQueue);

  if (!query) return <Message title="Procura músicas ou artistas" hint="Escreve na barra de pesquisa para começar." />;
  if (isLoading) return <Skeleton className="h-64" />;
  if (isError || !data) {
    return <Message title="Não foi possível pesquisar" hint={(error as Error)?.message ?? 'Confirma a ligação à API e tenta novamente.'} />;
  }

  const empty = !data.songs.length && !data.playlists.length && !data.albums.length && !data.artists.length;
  if (empty) return <Message title={'Sem resultados para «' + query + '»'} hint="Experimenta outro termo." />;

  return (
    <>
      {data.songs.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold">Faixas</h2>
          <ul>
            {data.songs.map((track, index) => (
              <TrackRow
                key={trackKey(track)}
                track={track}
                index={index}
                onPlay={() => playQueue(data.songs, index)}
              />
            ))}
          </ul>
        </section>
      )}
      <CardGrid title="Playlists" cards={data.playlists} />
      <CardGrid title="Álbuns" cards={data.albums} />
      <CardGrid title="Artistas" cards={data.artists} />
    </>
  );
}

export default function SearchPage() {
  return (
    <div>
      <h1 className="mb-6 text-[32px] font-bold tracking-tight">Pesquisar</h1>
      <Suspense fallback={<Skeleton className="h-64" />}>
        <Results />
      </Suspense>
    </div>
  );
}
