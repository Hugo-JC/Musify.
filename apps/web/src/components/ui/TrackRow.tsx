'use client';

import { Heart, Pause, Play, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { Cover } from '@/components/ui/Cover';
import { artistLine, formatTime } from '@/lib/format';
import { useLibrary } from '@/stores/useLibrary';
import { usePlayer } from '@/stores/usePlayer';
import { trackKey, type Track } from '@/types';

interface Props {
  track: Track;
  index: number;
  onPlay: () => void;
  showAlbum?: boolean;
  onRemove?: () => void;
}

export function TrackRow({ track, index, onPlay, showAlbum = true, onRemove }: Props) {
  const key = trackKey(track);
  const isCurrent = usePlayer((state) => {
    const current = state.queue[state.index];
    return current ? trackKey(current) === key : false;
  });
  const isPlaying = usePlayer((state) => state.isPlaying);
  const liked = useLibrary((state) => state.liked.some((item) => trackKey(item) === key));
  const toggleLike = useLibrary((state) => state.toggleLike);
  const toggle = usePlayer((state) => state.togglePlay);
  const canPlay = track.source !== 'audius' || (track.isStreamable !== false && !track.isStreamGated);

  const columns = showAlbum
    ? onRemove
      ? 'grid-cols-[36px_minmax(0,2fr)_minmax(0,1fr)_44px_52px_36px]'
      : 'grid-cols-[36px_minmax(0,2fr)_minmax(0,1fr)_44px_52px]'
    : onRemove
      ? 'grid-cols-[36px_minmax(0,1fr)_44px_52px_36px]'
      : 'grid-cols-[36px_minmax(0,1fr)_44px_52px]';

  return (
    <li
      className={clsx(
        'group grid items-center gap-4 rounded-2xl px-3.5 py-2.5 transition-colors duration-150 hover:bg-surface-2',
        isCurrent && 'bg-surface-2/60 ring-1 ring-accent/30',
        columns,
      )}
    >
      <button
        type="button"
        disabled={!canPlay}
        aria-label={
          !canPlay
            ? 'Esta faixa não está disponível para reprodução'
            : isCurrent && isPlaying
              ? `Pausar ${track.title}`
              : `Tocar ${track.title}`
        }
        onClick={() => {
          if (canPlay) {
            if (isCurrent) toggle();
            else onPlay();
          }
        }}
        className="flex h-9 w-9 items-center justify-center rounded-full text-sm tabular-nums text-muted transition hover:bg-accent/20 hover:text-accent disabled:cursor-not-allowed disabled:opacity-35"
      >
        {isCurrent && isPlaying ? (
          <Pause className="h-4 w-4 fill-accent text-accent" />
        ) : (
          <>
            <span className={clsx('group-hover:hidden font-medium', isCurrent && 'text-accent font-bold')}>{index + 1}</span>
            <Play className="hidden h-4 w-4 fill-white text-white group-hover:block" />
          </>
        )}
      </button>

      <div className="flex min-w-0 items-center gap-3.5">
        <Cover src={track.thumbnail} alt={track.title} className="h-11 w-11 rounded-lg text-[10px] shadow-sm" />
        <div className="min-w-0">
          <p className={clsx('truncate text-sm font-semibold', isCurrent ? 'text-accent' : 'text-white')}>{track.title}</p>
          <p className="truncate text-xs text-muted">{artistLine(track.artists)}</p>
        </div>
      </div>

      {showAlbum && <p className="truncate text-sm text-muted">{track.album ?? ''}</p>}

      <button
        type="button"
        aria-label={liked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        aria-pressed={liked}
        onClick={() => toggleLike(track)}
        className={clsx(
          'flex h-9 w-9 items-center justify-center rounded-full transition hover:scale-110 active:scale-95',
          liked ? 'text-accent' : 'text-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
        )}
      >
        <Heart className={clsx('h-5 w-5', liked ? 'fill-accent text-accent' : 'stroke-[2]')} />
      </button>

      <span className="text-right text-sm tabular-nums text-muted">{formatTime(track.durationSeconds)}</span>

      {onRemove && (
        <button
          type="button"
          aria-label={`Remover ${track.title} da biblioteca local`}
          onClick={onRemove}
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted opacity-0 transition hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      )}
    </li>
  );
}
