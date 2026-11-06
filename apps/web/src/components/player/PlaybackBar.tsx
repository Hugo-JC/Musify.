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

  const title = track?.title ?? 'Nenhuma música a tocar';
  const subtitle = error ?? (track ? artistLine(track.artists) : 'Escolhe uma playlist ou pesquisa para começar');

  return (
    <footer
      aria-label="Reprodutor"
      className="col-span-2 grid grid-cols-[1fr_minmax(420px,560px)_1fr] items-center border-t border-line/60 bg-bg/95 px-6 backdrop-blur-md"
    >
      {/* Faixa atual */}
      <div className="flex min-w-0 items-center gap-4">
        <Cover src={track?.thumbnail} alt={title} className="h-14 w-14 rounded-xl text-xs shadow-md" />
        <div className="min-w-0 max-w-[240px]">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className={clsx('truncate text-xs', error ? 'text-red-400 font-medium' : 'text-muted')}>{subtitle}</p>
        </div>
        <IconButton label="Visualizer" className="hidden h-10 w-10 bg-surface-2 text-muted xl:inline-flex">
          <AudioLines className={clsx('h-5 w-5', isPlaying && 'text-accent')} />
        </IconButton>
      </div>

      {/* Controlos + progresso */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-5">
          <IconButton
            label="Shuffle"
            active={shuffle}
            aria-pressed={shuffle}
            onClick={toggleShuffle}
            className={clsx('h-9 w-9 transition', shuffle && 'text-accent scale-105')}
          >
            <Shuffle className="h-5 w-5 stroke-[2.2]" />
          </IconButton>
          <IconButton label="Anterior" onClick={prev} className="h-9 w-9">
            <SkipBack className="h-5 w-5 fill-current" />
          </IconButton>
          <button
            type="button"
            aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
            onClick={togglePlay}
            disabled={!track}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-on-accent shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="ml-0.5 h-6 w-6 fill-current" />}
          </button>
          <IconButton label="Seguinte" onClick={() => next()} className="h-9 w-9">
            <SkipForward className="h-5 w-5 fill-current" />
          </IconButton>
          <IconButton
            label={`Repetir: ${repeat}`}
            active={repeat !== 'off'}
            aria-pressed={repeat !== 'off'}
            onClick={cycleRepeat}
            className={clsx('h-9 w-9 transition', repeat !== 'off' && 'text-accent scale-105')}
          >
            {repeat === 'one' ? <Repeat1 className="h-5 w-5 stroke-[2.2]" /> : <Repeat className="h-5 w-5 stroke-[2.2]" />}
          </IconButton>
        </div>

        <div className="flex w-full items-center gap-3 text-xs text-muted">
          <span className="w-9 text-right tabular-nums">{formatTime(currentTime)}</span>
          <Slider
            label="Progresso da faixa"
            value={currentTime}
            max={duration || track?.durationSeconds || 100}
            step={1}
            onCommit={seek}
            className={clsx(buffering && 'opacity-60')}
          />
          <span className="w-9 tabular-nums">{formatTime(duration || track?.durationSeconds)}</span>
        </div>
      </div>

      {/* Etiqueta + volume */}
      <div className="flex items-center justify-end gap-6">
        <span className="hidden text-[10px] font-bold uppercase tracking-wider text-accent/80 lg:block">
          Official Player
        </span>
        <div className="flex w-36 items-center gap-3">
          <IconButton label={muted ? 'Ativar som' : 'Silenciar'} onClick={toggleMute} className="h-8 w-8">
            {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </IconButton>
          <Slider label="Volume" value={muted ? 0 : volume} max={1} step={0.01} onCommit={setVolume} />
        </div>
      </div>
    </footer>
  );
}
