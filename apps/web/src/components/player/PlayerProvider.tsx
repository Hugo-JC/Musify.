'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Tv } from 'lucide-react';
import clsx from 'clsx';
import { getLocalAudio } from '@/lib/localLibrary';
import { setAudio } from '@/lib/audio';
import { artistLine } from '@/lib/format';
import { currentTrack, setPlayerSeekHandler, usePlayer } from '@/stores/usePlayer';
import { trackKey, type Track } from '@/types';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type PlayerMode = 'none' | 'audio' | 'youtube';

function getPlayerMode(track?: Track): PlayerMode {
  if (!track) return 'none';
  if (track.source === 'audius' || track.source === 'local') return 'audio';
  return track.videoId ? 'youtube' : 'none';
}

function playErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'O browser bloqueou a reprodução automática. Carrega novamente em Reproduzir.';
  }
  return 'Não foi possível iniciar esta faixa. Verifica a ligação e tenta novamente.';
}

/** Audius and local files use HTMLAudioElement. The official YouTube iframe remains
 *  available only for old YouTube playlists already saved in the user's library.
 */
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const youtubeHost = useRef<HTMLDivElement>(null);
  const youtubePlayer = useRef<any>(null);
  const objectUrl = useRef<string | null>(null);
  const sourceRequest = useRef(0);
  const modeRef = useRef<PlayerMode>('none');
  const [minimized, setMinimized] = useState(false);

  const track = usePlayer(currentTrack);
  const isPlaying = usePlayer((state) => state.isPlaying);
  const volume = usePlayer((state) => state.volume);
  const muted = usePlayer((state) => state.muted);
  const patch = usePlayer((state) => state.patch);

  const mode = getPlayerMode(track);
  const activeTrackKey = track ? trackKey(track) : null;
  const videoId = track?.videoId;
  modeRef.current = mode;

  const releaseObjectUrl = useCallback(() => {
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    }
  }, []);

  const createYouTubePlayer = useCallback(() => {
    if (!window.YT?.Player || !youtubeHost.current || youtubePlayer.current) return;

    try {
      youtubePlayer.current = new window.YT.Player(youtubeHost.current, {
        width: '480',
        height: '270',
        playerVars: {
          autoplay: 0,
          controls: 1,
          playsinline: 1,
          origin: window.location.origin,
          enablejsapi: 1,
          rel: 0,
        },
        events: {
          onReady: (event: any) => {
            const state = usePlayer.getState();
            event.target.setVolume(Math.round(state.volume * 100));
            if (state.muted) event.target.mute();

            const current = currentTrack(state);
            if (current?.videoId) {
              if (state.isPlaying) event.target.loadVideoById(current.videoId);
              else event.target.cueVideoById(current.videoId);
            }
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
            const message =
              event.data === 150 || event.data === 101
                ? 'O autor deste vídeo não permite a reprodução incorporada. Tenta outra faixa.'
                : `O YouTube não conseguiu reproduzir esta faixa (código ${event.data}).`;
            patch({ isPlaying: false, buffering: false, error: message });
          },
        },
      });
    } catch {
      patch({
        isPlaying: false,
        buffering: false,
        error: 'Não foi possível iniciar o leitor legado do YouTube.',
      });
    }
  }, [patch]);

  useEffect(() => {
    const audio = audioRef.current;
    setAudio(audio);
    return () => {
      setAudio(null);
      audio?.pause();
      releaseObjectUrl();
    };
  }, [releaseObjectUrl]);

  useEffect(() => {
    setPlayerSeekHandler((time) => {
      if (modeRef.current === 'youtube') {
        try {
          youtubePlayer.current?.seekTo?.(time, true);
        } catch {
          /* Ignore seek errors while the iframe is loading. */
        }
      } else if (modeRef.current === 'audio' && audioRef.current) {
        const audio = audioRef.current;
        const duration = Number.isFinite(audio.duration) ? audio.duration : time;
        audio.currentTime = Math.max(0, Math.min(time, duration));
        if (usePlayer.getState().isPlaying) {
          void audio.play().catch((error: unknown) => {
            patch({ isPlaying: false, buffering: false, error: playErrorMessage(error) });
          });
        }
      }
    });
    return () => setPlayerSeekHandler(null);
  }, [patch]);

  useEffect(() => {
    if (mode !== 'youtube') {
      if (youtubePlayer.current) {
        try {
          youtubePlayer.current.destroy?.();
        } catch {
          /* Ignore cleanup errors from the embedded player. */
        }
        youtubePlayer.current = null;
      }
      return;
    }

    let active = true;
    if (window.YT?.Player) {
      createYouTubePlayer();
      return () => {
        active = false;
      };
    }

    const script = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    const previousReady = window.onYouTubeIframeAPIReady;
    const handleReady = () => {
      previousReady?.();
      if (active) createYouTubePlayer();
    };
    window.onYouTubeIframeAPIReady = handleReady;

    if (!script) {
      const nextScript = document.createElement('script');
      nextScript.src = 'https://www.youtube.com/iframe_api';
      nextScript.async = true;
      document.head.appendChild(nextScript);
    }

    return () => {
      active = false;
      if (window.onYouTubeIframeAPIReady === handleReady) {
        window.onYouTubeIframeAPIReady = previousReady;
      }
    };
  }, [mode, createYouTubePlayer]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const requestId = ++sourceRequest.current;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    releaseObjectUrl();

    if (mode !== 'audio' || !track) {
      if (mode === 'none') patch({ buffering: false });
      return;
    }

    patch({
      buffering: true,
      error: null,
      currentTime: 0,
      duration: track.durationSeconds ?? 0,
    });

    const loadSource = async () => {
      if (track.source === 'local') {
        const localId =
          track.localId ??
          (track.id?.startsWith('local:') ? track.id.slice('local:'.length) : '');
        if (!localId) throw new Error('Não foi encontrado o identificador deste ficheiro local.');

        const blob = await getLocalAudio(localId);
        if (!blob) throw new Error('Este ficheiro já não está guardado na biblioteca local.');

        const url = URL.createObjectURL(blob);
        if (requestId !== sourceRequest.current) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl.current = url;
        audio.src = url;
        audio.load();

        if (usePlayer.getState().isPlaying) {
          try {
            await audio.play();
          } catch (error) {
            if (requestId === sourceRequest.current) {
              patch({ isPlaying: false, buffering: false, error: playErrorMessage(error) });
            }
          }
        }
        return;
      }

      const source =
        track.streamUrl ??
        (track.id ? `/api/music/tracks/${encodeURIComponent(track.id)}/stream` : '');
      if (!source) throw new Error('A faixa Audius não contém um endereço de reprodução.');

      audio.src = new URL(source, window.location.origin).toString();
      audio.load();
    };

    void loadSource().catch((error: unknown) => {
      if (requestId === sourceRequest.current) {
        patch({
          isPlaying: false,
          buffering: false,
          error: error instanceof Error ? error.message : 'Não foi possível carregar esta faixa.',
        });
      }
    });

    return () => {
      sourceRequest.current += 1;
    };
  }, [
    activeTrackKey,
    mode,
    patch,
    releaseObjectUrl,
    track?.durationSeconds,
    track?.id,
    track?.localId,
    track?.source,
    track?.streamUrl,
  ]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || mode !== 'audio' || !audio.src) return;

    if (!isPlaying) {
      audio.pause();
      return;
    }

    void audio.play().catch((error: unknown) => {
      patch({ isPlaying: false, buffering: false, error: playErrorMessage(error) });
    });
  }, [isPlaying, activeTrackKey, mode, patch]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = Math.min(1, Math.max(0, volume));
      audio.muted = muted;
    }

    const player = youtubePlayer.current;
    if (player?.setVolume) {
      try {
        player.setVolume(Math.round(volume * 100));
        if (muted) player.mute();
        else player.unMute();
      } catch {
        /* Ignore volume updates while the iframe is initializing. */
      }
    }
  }, [volume, muted]);

  useEffect(() => {
    if (mode !== 'youtube' || !videoId || !youtubePlayer.current) return;
    patch({
      buffering: true,
      error: null,
      currentTime: 0,
      duration: track?.durationSeconds ?? 0,
    });
    try {
      youtubePlayer.current.loadVideoById(videoId);
    } catch {
      patch({ buffering: false, error: 'Não foi possível carregar esta faixa do YouTube.' });
    }
  }, [activeTrackKey, mode, videoId, patch, track?.durationSeconds]);

  useEffect(() => {
    if (mode !== 'youtube' || !youtubePlayer.current) return;
    const player = youtubePlayer.current;
    try {
      if (isPlaying) player.playVideo();
      else player.pauseVideo();
    } catch {
      /* Ignore commands while the iframe is initializing. */
    }
  }, [isPlaying, activeTrackKey, mode]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      patch({
        currentTime: audio.currentTime || 0,
        duration: Number.isFinite(audio.duration) ? audio.duration : 0,
      });
    };
    const onLoaded = () => {
      patch({
        duration: Number.isFinite(audio.duration) ? audio.duration : 0,
        buffering: false,
        error: null,
      });
    };
    const onWaiting = () => patch({ buffering: true });
    const onPlaying = () => patch({ buffering: false, isPlaying: true, error: null });
    const onEnded = () => usePlayer.getState().next(true);
    const onError = () => {
      if (modeRef.current === 'audio') {
        patch({
          isPlaying: false,
          buffering: false,
          error: 'O provider não conseguiu disponibilizar esta faixa. Tenta outra.',
        });
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('durationchange', onLoaded);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('durationchange', onLoaded);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [patch]);

  useEffect(() => {
    if (mode !== 'youtube') return;

    const timer = window.setInterval(() => {
      const player = youtubePlayer.current;
      if (!player?.getCurrentTime || !player?.getDuration) return;
      try {
        patch({
          currentTime: player.getCurrentTime() || 0,
          duration: player.getDuration() || 0,
          buffering: player.getPlayerState?.() === window.YT?.PlayerState?.BUFFERING,
        });
      } catch {
        /* Ignore polling while the iframe is initializing. */
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [mode, patch]);

  useEffect(() => {
    if (!track || !('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: artistLine(track.artists),
        album: track.album ?? '',
        artwork: track.thumbnail
          ? [{ src: track.thumbnail, sizes: '544x544', type: 'image/jpeg' }]
          : [],
      });
    } catch {
      /* Ignore unsupported media metadata formats. */
    }
  }, [track]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const state = usePlayer.getState;
    try {
      navigator.mediaSession.setActionHandler('play', () => state().patch({ isPlaying: true }));
      navigator.mediaSession.setActionHandler('pause', () => state().patch({ isPlaying: false }));
      navigator.mediaSession.setActionHandler('previoustrack', () => state().prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => state().next());
      navigator.mediaSession.setActionHandler('seekto', (event) => {
        if (event.seekTime != null) state().seek(event.seekTime);
      });
    } catch {
      /* Ignore unsupported Media Session actions. */
    }
    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      } catch {
        /* Ignore unsupported Media Session actions. */
      }
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement | null;
      if (
        element &&
        (element.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(element.tagName))
      ) {
        return;
      }

      const state = usePlayer.getState();
      if (event.code === 'Space') {
        event.preventDefault();
        state.togglePlay();
      } else if (event.code === 'ArrowRight') {
        event.shiftKey
          ? state.next()
          : state.seek(Math.min(state.duration, state.currentTime + 5));
      } else if (event.code === 'ArrowLeft') {
        event.shiftKey
          ? state.prev()
          : state.seek(Math.max(0, state.currentTime - 5));
      } else if (event.key.toLowerCase() === 'm') {
        state.toggleMute();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {children}
      <audio ref={audioRef} preload="metadata" className="hidden" aria-hidden="true" />
      {mode === 'youtube' && (
        <aside
          aria-label="Reprodutor de vídeo YouTube legado"
          className={clsx(
            'youtube-player-shell fixed bottom-[124px] right-6 z-40 overflow-hidden rounded-2xl border border-line bg-black shadow-2xl transition-all duration-300',
            minimized ? 'h-9 w-60' : 'h-[162px] w-[288px]',
          )}
        >
          <div className="flex h-8 w-full items-center justify-between border-b border-line/60 bg-surface px-3 text-[11px] font-medium text-white/90">
            <span className="flex items-center gap-1.5 truncate text-muted">
              <Tv className="h-3.5 w-3.5 text-accent" />
              <span className="truncate">{track?.title ?? 'YouTube Player'}</span>
            </span>
            <button
              type="button"
              onClick={() => setMinimized((value) => !value)}
              aria-label={minimized ? 'Expandir leitor de vídeo' : 'Minimizar leitor de vídeo'}
              className="rounded p-0.5 text-muted hover:text-white"
            >
              {minimized ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div className={clsx('relative h-[130px] w-full bg-black', minimized && 'hidden')}>
            <div ref={youtubeHost} className="h-full w-full" />
          </div>
        </aside>
      )}
    </>
  );
}
