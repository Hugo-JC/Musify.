'use client';

import { AudioLines, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import clsx from 'clsx';
import { Cover } from '@/components/ui/Cover';
import { IconButton } from '@/components/ui/IconButton';
import { Slider } from '@/components/ui/Slider';
import { artistLine, formatTime } from '@/lib/format';
import { currentTrack, usePlayer } from '@/stores/usePlayer';

export function PlaybackBar() {
  const track = usePlayer(currentTrack);
  const { isPlaying, currentTime, duration, volume, muted, repeat, shuffle, buffering, error } = usePlayer();
  const { togglePlay, next, prev, seek, setVolume, toggleMute, toggleShuffle, cycleRepeat } = usePlayer.getState();

  const title = track?.title ?? 'Nothing playing';
  const subtitle = error ?? (track ? artistLine(track.artists) : 'Choose a playlist to start');

  return (
    <footer
      aria-label="Reprodutor"
      className="col-span-2 grid grid-cols-[1fr_minmax(420px,560px)_1fr] items-center border-t border-line px-6"
    >
      {/* Faixa atual */}
      <div className="flex min-w-0 items-center gap-6">
        <Cover src={track?.thumbnail} alt={title} className="h-14 w-14 text-xs" />
        <div className="min-w-0 max-w-[220px]">
          <p className="truncate text-base font-medium">{title}</p>
          <p className={clsx('truncate text-sm', error ? 'text-red-300' : 'text-muted')}>{subtitle}</p>
        </div>
        <IconButton label="Visualizer" className="hidden h-10 w-10 bg-surface-2 text-muted xl:inline-flex">
          <AudioLines className={clsx('h-5 w-5', isPlaying && 'text-accent')} />
        </IconButton>
      </div>

      {/* Controlos + progresso */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-6">
          <IconButton label="Shuffle" active={shuffle} aria-pressed={shuffle} onClick={toggleShuffle} className="h-9 w-9">
            <Shuffle className="h-6 w-6" />
          </IconButton>
          <IconButton label="Previous" onClick={prev} className="h-9 w-9">
            <SkipBack className="h-6 w-6 fill-current" />
          </IconButton>
          <button
            type="button"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={togglePlay}
            disabled={!track}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-on-accent transition-transform hover:scale-105 disabled:opacity-50"
          >
            {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="ml-0.5 h-6 w-6 fill-current" />}
          </button>
          <IconButton label="Next" onClick={() => next()} className="h-9 w-9">
            <SkipForward className="h-6 w-6 fill-current" />
          </IconButton>
          <IconButton
            label={`Repeat: ${repeat}`}
            active={repeat !== 'off'}
            aria-pressed={repeat !== 'off'}
            onClick={cycleRepeat}
            className="h-9 w-9"
          >
            {repeat === 'one' ? <Repeat1 className="h-6 w-6" /> : <Repeat className="h-6 w-6" />}
          </IconButton>
        </div>

        <div className="flex w-full items-center gap-3 text-xs text-muted">
          <span className="w-9 text-right tabular-nums">{formatTime(currentTime)}</span>
          <Slider
            label="Progresso da faixa"
            value={currentTime}
            max={duration}
            step={1}
            onCommit={seek}
            className={clsx(buffering && 'opacity-60')}
          />
          <span className="w-9 tabular-nums">{formatTime(duration || track?.durationSeconds)}</span>
        </div>
      </div>

      {/* Etiqueta + volume */}
      <div className="flex items-center justify-end gap-8">
        <span className="hidden text-[10px] font-semibold uppercase tracking-wide text-muted lg:block">In the groove</span>
        <div className="flex w-36 items-center gap-3">
          <IconButton label={muted ? 'Unmute' : 'Mute'} onClick={toggleMute} className="h-8 w-8">
            {muted || volume === 0 ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
          </IconButton>
          <Slider label="Volume" value={muted ? 0 : volume} max={1} step={0.01} onCommit={setVolume} />
        </div>
      </div>
    </footer>
  );
}
