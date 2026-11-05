'use client';

import { Heart, Play } from 'lucide-react';
import { Message } from '@/components/ui/States';
import { TrackRow } from '@/components/ui/TrackRow';
import { useLibrary } from '@/stores/useLibrary';
import { usePlayer } from '@/stores/usePlayer';

export default function LibraryPage() {
  const liked = useLibrary((s) => s.liked);
  const playQueue = usePlayer((s) => s.playQueue);

  return (
    <div>
      <header className="mb-8 flex items-end gap-6">
        <span className="flex h-[200px] w-[200px] items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-600 to-blue-500">
          <Heart className="h-20 w-20 fill-white text-white" aria-hidden />
        </span>
        <div>
          <p className="text-sm text-muted">Playlist</p>
          <h1 className="my-2 text-[40px] font-bold leading-tight">Liked Songs</h1>
          <p className="text-sm text-muted">{liked.length} {liked.length === 1 ? 'song' : 'songs'} · guardadas neste browser</p>
        </div>
      </header>

      {liked.length ? (
        <>
          <button
            type="button"
            aria-label="Tocar favoritos"
            onClick={() => playQueue(liked, 0)}
            className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-on-accent transition-transform hover:scale-105"
          >
            <Play className="ml-0.5 h-7 w-7 fill-current" />
          </button>
          <ul>
            {liked.map((t, i) => (
              <TrackRow key={t.videoId} track={t} index={i} onPlay={() => playQueue(liked, i)} />
            ))}
          </ul>
        </>
      ) : (
        <Message title="Ainda não tens favoritos" hint="Toca no coração de qualquer faixa para a guardar aqui." />
      )}
    </div>
  );
}
