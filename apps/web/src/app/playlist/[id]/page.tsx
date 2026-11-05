'use client';

import { Play } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Cover } from '@/components/ui/Cover';
import { Message, Skeleton } from '@/components/ui/States';
import { TrackRow } from '@/components/ui/TrackRow';
import { usePlaylist } from '@/lib/hooks';
import { usePlayer } from '@/stores/usePlayer';

export default function PlaylistPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const { data, isLoading, isError } = usePlaylist(id);
  const playQueue = usePlayer((s) => s.playQueue);

  if (isLoading) return <Skeleton className="h-72" />;
  if (isError || !data) return <Message title="Playlist indisponível" hint="Não foi possível carregar esta playlist. Confirma que a API está a correr." />;

  return (
    <div>
      <header className="mb-8 flex items-end gap-6">
        <Cover src={data.thumbnail} alt={data.title} className="h-[200px] w-[200px] rounded-2xl text-5xl" />
        <div className="min-w-0">
          <p className="text-sm text-muted">Playlist</p>
          <h1 className="my-2 line-clamp-2 text-[40px] font-bold leading-tight">{data.title}</h1>
          <p className="text-sm text-muted">
            {[data.author, `${data.trackCount} faixas`].filter(Boolean).join(' · ')}
          </p>
        </div>
      </header>

      <button
        type="button"
        onClick={() => playQueue(data.tracks, 0)}
        disabled={!data.tracks.length}
        className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-on-accent transition-transform hover:scale-105 disabled:opacity-50"
        aria-label="Tocar playlist"
      >
        <Play className="ml-0.5 h-7 w-7 fill-current" />
      </button>

      {data.tracks.length ? (
        <ul>
          {data.tracks.map((t, i) => (
            <TrackRow key={`${t.videoId}-${i}`} track={t} index={i} onPlay={() => playQueue(data.tracks, i)} />
          ))}
        </ul>
      ) : (
        <Message title="Esta playlist não tem faixas reproduzíveis" />
      )}
    </div>
  );
}
