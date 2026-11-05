'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { setAudio } from '@/lib/audio';
import { currentTrack, usePlayer } from '@/stores/usePlayer';
import { artistLine } from '@/lib/format';

/** Um único <audio> global: a música continua ao navegar entre páginas. */
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const warmedRef = useRef<string | null>(null);

  const track = usePlayer(currentTrack);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const patch = usePlayer((s) => s.patch);
  const trackId = track?.videoId;

  useEffect(() => {
    setAudio(audioRef.current);
    return () => setAudio(null);
  }, []);

  // Troca de faixa
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    warmedRef.current = null;
    if (!trackId) {
      a.removeAttribute('src');
      return;
    }
    a.src = api.streamUrl(trackId);
    patch({ buffering: true, error: null });
    if (usePlayer.getState().isPlaying) a.play().catch(() => patch({ isPlaying: false, buffering: false }));
  }, [trackId, patch]);

  // Play / pause
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !a.getAttribute('src')) return;
    if (isPlaying) a.play().catch(() => patch({ isPlaying: false, buffering: false }));
    else a.pause();
  }, [isPlaying, patch]);

  // Volume
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;
    a.muted = muted;
  }, [volume, muted]);

  // Media Session (teclas multimédia e ecrã de bloqueio)
  useEffect(() => {
    if (!('mediaSession' in navigator) || !track) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: artistLine(track.artists),
      album: track.album ?? '',
      artwork: track.thumbnail ? [{ src: track.thumbnail, sizes: '544x544', type: 'image/jpeg' }] : [],
    });
  }, [track]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const s = usePlayer.getState;
    navigator.mediaSession.setActionHandler('play', () => s().patch({ isPlaying: true }));
    navigator.mediaSession.setActionHandler('pause', () => s().patch({ isPlaying: false }));
    navigator.mediaSession.setActionHandler('previoustrack', () => s().prev());
    navigator.mediaSession.setActionHandler('nexttrack', () => s().next());
    navigator.mediaSession.setActionHandler('seekto', (d) => {
      if (d.seekTime != null) s().seek(d.seekTime);
    });
  }, []);

  // Atalhos de teclado
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

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    patch({ currentTime: a.currentTime });
    // Prefetch: a meio da faixa, aquece o URL da seguinte.
    const nextTrack = usePlayer.getState().prepareNext();
    const nextId = nextTrack?.videoId;
    if (nextId && a.duration && a.currentTime / a.duration > 0.5 && warmedRef.current !== nextId) {
      warmedRef.current = nextId;
      void api.warm(nextId);
    }
  };

  return (
    <>
      {children}
      <audio
        ref={audioRef}
        preload="auto"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={(e) => patch({ duration: e.currentTarget.duration || 0 })}
        onDurationChange={(e) => patch({ duration: e.currentTarget.duration || 0 })}
        onWaiting={() => patch({ buffering: true })}
        onCanPlay={() => patch({ buffering: false })}
        onPlaying={() => patch({ buffering: false })}
        onEnded={() => usePlayer.getState().next(true)}
        onError={() => {
          const s = usePlayer.getState();
          if (!s.queue.length) return;
          s.patch({ error: 'Não foi possível reproduzir esta faixa.', buffering: false });
          if (s.index < s.queue.length - 1 || s.repeat === 'all' || s.shuffle) s.next();
          else s.patch({ isPlaying: false });
        }}
      />
    </>
  );
}
