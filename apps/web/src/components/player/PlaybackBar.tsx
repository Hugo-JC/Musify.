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

  const title = track?.title ?? 'Nada a tocar';
  const subtitle = error ?? (track ? artistLine(track.artists) : 'Escolhe uma faixa para começar');

  return (
    <footer className="playback-bar" aria-label="Controlos de reprodução">
      <div className="playback-track">
        <Cover src={track?.thumbnail} alt={title} className="h-12 w-12 rounded-xl text-xs shadow-md" />
        <div className="playback-track-copy">
          <p className="playback-track-title">{title}</p>
          <p className={clsx('playback-track-artist', error && 'text-red-300')}>{subtitle}</p>
        </div>
        <AudioLines className={clsx('ml-1 hidden h-5 w-5 shrink-0 text-accent sm:block', isPlaying && 'animate-pulse')} aria-hidden />
      </div>

      <div className="playback-center">
        <div className="playback-controls">
          <IconButton label="Aleatório" active={shuffle} aria-pressed={shuffle} onClick={toggleShuffle} className={clsx('h-9 w-9 desktop-only', shuffle && 'is-active')}>
            <Shuffle className="h-5 w-5" strokeWidth={2.4} />
          </IconButton>
          <IconButton label="Anterior" onClick={prev} className="h-9 w-9">
            <SkipBack className="h-5 w-5" fill="currentColor" strokeWidth={1.8} />
          </IconButton>
          <button
            type="button"
            aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
            onClick={togglePlay}
            disabled={!track}
            className="primary-play flex h-11 w-11 items-center justify-center rounded-full bg-accent text-on-accent shadow-lg shadow-accent/20 transition hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isPlaying ? <Pause className="h-5 w-5" fill="currentColor" strokeWidth={1.8} /> : <Play className="ml-0.5 h-5 w-5" fill="currentColor" strokeWidth={1.8} />}
          </button>
          <IconButton label="Seguinte" onClick={() => next()} className="h-9 w-9">
            <SkipForward className="h-5 w-5" fill="currentColor" strokeWidth={1.8} />
          </IconButton>
          <IconButton label={'Repetir: ' + repeat} active={repeat !== 'off'} aria-pressed={repeat !== 'off'} onClick={cycleRepeat} className={clsx('h-9 w-9 desktop-only', repeat !== 'off' && 'is-active')}>
            {repeat === 'one' ? <Repeat1 className="h-5 w-5" strokeWidth={2.4} /> : <Repeat className="h-5 w-5" strokeWidth={2.4} />}
          </IconButton>
        </div>

        <div className="playback-progress">
          <span className="w-9 shrink-0 text-right tabular-nums">{formatTime(currentTime)}</span>
          <Slider
            label="Progresso da faixa"
            value={currentTime}
            max={duration || track?.durationSeconds || 100}
            step={1}
            onCommit={seek}
            className={clsx(buffering && 'opacity-60')}
          />
          <span className="w-9 shrink-0 tabular-nums">{formatTime(duration || track?.durationSeconds)}</span>
        </div>
      </div>

      <div className="playback-volume">
        <span className="playback-volume-label">Now playing</span>
        <IconButton label={muted || volume === 0 ? 'Ativar som' : 'Silenciar'} onClick={toggleMute} className="h-9 w-9">
          {muted || volume === 0 ? <VolumeX className="h-5 w-5" fill="currentColor" /> : <Volume2 className="h-5 w-5" fill="currentColor" />}
        </IconButton>
        <div className="w-32">
          <Slider label="Volume" value={muted ? 0 : volume} max={1} step={0.01} onCommit={setVolume} />
        </div>
      </div>
    </footer>
  );
}
