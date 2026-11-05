'use client';

import { Heart, Pause, Play } from 'lucide-react';
import clsx from 'clsx';
import { Cover } from '@/components/ui/Cover';
import { artistLine, formatTime } from '@/lib/format';
import { useLibrary } from '@/stores/useLibrary';
import { usePlayer } from '@/stores/usePlayer';
import type { Track } from '@/types';

interface Props {
  track: Track;
  index: number;
  onPlay: () => void;
  showAlbum?: boolean;
}

export function TrackRow({ track, index, onPlay, showAlbum = true }: Props) {
  const isCurrent = usePlayer((s) => s.queue[s.index]?.videoId === track.videoId);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const liked = useLibrary((s) => s.liked.some((t) => t.videoId === track.videoId));
  const toggleLike = useLibrary((s) => s.toggleLike);
  const toggle = usePlayer((s) => s.togglePlay);

  return (
    <li
      className={clsx(
        'group grid items-center gap-4 rounded-xl px-3 py-2 hover:bg-surface-2',
        showAlbum ? 'grid-cols-[32px_minmax(0,2fr)_minmax(0,1fr)_40px_48px]' : 'grid-cols-[32px_minmax(0,1fr)_40px_48px]',
      )}
    >
      <button
        type="button"
        aria-label={isCurrent && isPlaying ? `Pausar ${track.title}` : `Tocar ${track.title}`}
        onClick={isCurrent ? toggle : onPlay}
        className="flex h-8 w-8 items-center justify-center text-sm tabular-nums text-muted"
      >
        {isCurrent && isPlaying ? (
          <Pause className="h-4 w-4 fill-accent text-accent" />
        ) : (
          <>
            <span className={clsx('group-hover:hidden', isCurrent && 'text-accent')}>{index + 1}</span>
            <Play className="hidden h-4 w-4 fill-white text-white group-hover:block" />
          </>
        )}
      </button>

      <div className="flex min-w-0 items-center gap-3">
        <Cover src={track.thumbnail} alt={track.title} className="h-10 w-10 text-[10px]" />
        <div className="min-w-0">
          <p className={clsx('truncate text-sm font-medium', isCurrent && 'text-accent')}>{track.title}</p>
          <p className="truncate text-xs text-muted">{artistLine(track.artists)}</p>
        </div>
      </div>

      {showAlbum && <p className="truncate text-sm text-muted">{track.album ?? ''}</p>}

      <button
        type="button"
        aria-label={liked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        aria-pressed={liked}
        onClick={() => toggleLike(track)}
        className={clsx('flex h-8 w-8 items-center justify-center', liked ? 'text-accent' : 'text-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100')}
      >
        <Heart className={clsx('h-5 w-5', liked && 'fill-current')} />
      </button>

      <span className="text-right text-sm tabular-nums text-muted">{formatTime(track.durationSeconds)}</span>
    </li>
  );
}
