'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Tv } from 'lucide-react';
import clsx from 'clsx';
import { currentTrack, setPlayerSeekHandler, usePlayer } from '@/stores/usePlayer';
import { artistLine } from '@/lib/format';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** Official embedded YouTube player: honors playback controls and YouTube content rules. */
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<any>(null);
  const [minimized, setMinimized] = useState(false);
  const track = usePlayer(currentTrack);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const patch = usePlayer((s) => s.patch);
  const trackId = track?.videoId;

  const createPlayer = useCallback(() => {
    if (!window.YT?.Player || !host.current || player.current) return;
    try {
      player.current = new window.YT.Player(host.current, {
        width: '480',
        height: '270',
        playerVars: {
          autoplay: 0,
          controls: 1,
          playsinline: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
          enablejsapi: 1,
          rel: 0,
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(Math.round(usePlayer.getState().volume * 100));
            if (usePlayer.getState().muted) event.target.mute();
            const id = currentTrack(usePlayer.getState())?.videoId;
            if (id) event.target.cueVideoById(id);
          },
          onStateChange: (event: any) => {
            const YT = window.YT;
            if (event.data === YT.PlayerState.PLAYING) {
              patch({ isPlaying: true, buffering: false, error: null });
            } else if (event.data === YT.PlayerState.BUFFERING) {
              patch({ buffering: true });
            } else if (event.data === YT.PlayerState.PAUSED) {
              patch({ isPlaying: false, buffering: false });
            } else if (event.data === YT.PlayerState.ENDED) {
              usePlayer.getState().next(true);
            }
          },
          onError: (event: any) => {
            const msg =
              event.data === 150 || event.data === 101
                ? 'O autor deste vídeo não permite a reprodução incorporada. Tenta outra faixa.'
                : `O YouTube não conseguiu reproduzir esta faixa (código ${event.data}).`;
            patch({ isPlaying: false, buffering: false, error: msg });
          },
        },
      });
    } catch {
      /* ignore player init errors in headless/testing */
    }
  }, [patch]);

  useEffect(() => {
    setPlayerSeekHandler((t) => {
      const p = player.current;
      if (p?.seekTo) {
        try {
          p.seekTo(t, true);
        } catch {
          /* ignore */
        }
      }
    });
    return () => setPlayerSeekHandler(null);
  }, []);

  useEffect(() => {
    if (window.YT?.Player) {
      createPlayer();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      createPlayer();
    };
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }
    return () => {
      window.onYouTubeIframeAPIReady = previousReady;
    };
  }, [createPlayer]);

  useEffect(() => {
    if (!player.current || !trackId) return;
    patch({ buffering: true, error: null, currentTime: 0, duration: track?.durationSeconds ?? 0 });
    try {
      player.current.loadVideoById(trackId);
    } catch {
      /* ignore */
    }
  }, [trackId, patch, track?.durationSeconds]);

  useEffect(() => {
    const p = player.current;
    if (!p?.playVideo || !p?.pauseVideo) return;
    try {
      if (isPlaying) p.playVideo();
      else p.pauseVideo();
    } catch {
      /* ignore */
    }
  }, [isPlaying, trackId]);

  useEffect(() => {
    const p = player.current;
    if (!p?.setVolume) return;
    try {
      p.setVolume(Math.round(volume * 100));
      if (muted) p.mute();
      else p.unMute();
    } catch {
      /* ignore */
    }
  }, [volume, muted]);

  useEffect(() => {
    if (!track || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: artistLine(track.artists),
        album: track.album ?? '',
        artwork: track.thumbnail ? [{ src: track.thumbnail, sizes: '544x544', type: 'image/jpeg' }] : [],
      });
    } catch {
      /* ignore */
    }
  }, [track]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const s = usePlayer.getState;
    try {
      navigator.mediaSession.setActionHandler('play', () => s().patch({ isPlaying: true }));
      navigator.mediaSession.setActionHandler('pause', () => s().patch({ isPlaying: false }));
      navigator.mediaSession.setActionHandler('previoustrack', () => s().prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => s().next());
      navigator.mediaSession.setActionHandler('seekto', (d) => {
        if (d.seekTime != null) s().seek(d.seekTime);
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const p = player.current;
      if (!p?.getCurrentTime || !p?.getDuration) return;
      try {
        const duration = p.getDuration() || 0;
        const current = p.getCurrentTime() || 0;
        const state = p.getPlayerState?.();
        patch({
          currentTime: current,
          duration,
          buffering: state === window.YT?.PlayerState?.BUFFERING,
        });
      } catch {
        /* ignore */
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [patch]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(el.tagName))) return;
      const s = usePlayer.getState();
      if (e.code === 'Space') {
        e.preventDefault();
        s.togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.shiftKey ? s.next() : s.seek(Math.min(s.duration, s.currentTime + 5));
      } else if (e.code === 'ArrowLeft') {
        e.shiftKey ? s.prev() : s.seek(Math.max(0, s.currentTime - 5));
      } else if (e.key.toLowerCase() === 'm') {
        s.toggleMute();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {children}
      <aside
        aria-label="Reprodutor de vídeo YouTube oficial"
        className={clsx(
          'youtube-player-shell fixed bottom-[124px] right-6 z-40 overflow-hidden rounded-2xl border border-line bg-black shadow-2xl transition-all duration-300',
          trackId ? 'opacity-100' : 'pointer-events-none opacity-0',
          minimized ? 'h-9 w-60' : 'h-[162px] w-[288px]',
        )}
      >
        <div className="flex h-8 w-full items-center justify-between border-b border-line/60 bg-surface px-3 text-[11px] font-medium text-white/90">
          <span className="flex items-center gap-1.5 truncate text-muted">
            <Tv className="h-3.5 w-3.5 text-accent" />
            <span className="truncate">{track ? track.title : 'YouTube Player'}</span>
          </span>
          <button
            type="button"
            onClick={() => setMinimized((v) => !v)}
            aria-label={minimized ? 'Expandir leitor de vídeo' : 'Minimizar leitor de vídeo'}
            className="rounded p-0.5 text-muted hover:text-white"
          >
            {minimized ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className={clsx('relative h-[130px] w-full bg-black', minimized && 'hidden')}>
          <div ref={host} className="h-full w-full" />
        </div>
      </aside>
    </>
  );
}
