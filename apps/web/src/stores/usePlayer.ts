import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAudio } from '@/lib/audio';
import type { RepeatMode, Track } from '@/types';

interface PlayerState {
  queue: Track[];
  index: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  repeat: RepeatMode;
  shuffle: boolean;
  buffering: boolean;
  error: string | null;
  playQueue: (tracks: Track[], start?: number) => void;
  togglePlay: () => void;
  next: (auto?: boolean) => void;
  prev: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  patch: (p: Partial<PlayerState>) => void;
}

// Histórico de índices para o botão "anterior" (útil com shuffle).
const history: number[] = [];
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
      index: -1,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      muted: false,
      repeat: 'off',
      shuffle: false,
      buffering: false,
      error: null,

      playQueue: (tracks, start = 0) => {
        history.length = 0;
        set({
          queue: tracks,
          index: tracks.length ? Math.min(Math.max(start, 0), tracks.length - 1) : -1,
          isPlaying: tracks.length > 0,
          currentTime: 0,
          duration: 0,
          error: null,
        });
      },

      togglePlay: () => {
        if (get().index < 0) return;
        set((s) => ({ isPlaying: !s.isPlaying }));
      },

      next: (auto = false) => {
        const { queue, index, repeat, shuffle } = get();
        if (!queue.length) return;
        const audio = getAudio();
        if (auto && repeat === 'one') {
          if (audio) {
            audio.currentTime = 0;
            void audio.play();
          }
          return;
        }
        let n: number;
        if (shuffle && queue.length > 1) {
          do {
            n = Math.floor(Math.random() * queue.length);
          } while (n === index);
        } else {
          n = index + 1;
        }
        if (n >= queue.length) {
          if (repeat === 'all') n = 0;
          else {
            set({ isPlaying: false, currentTime: 0 });
            if (audio) audio.currentTime = 0;
            return;
          }
        }
        if (n === index) {
          if (audio) {
            audio.currentTime = 0;
            void audio.play();
          }
          return;
        }
        history.push(index);
        set({ index: n, currentTime: 0, duration: 0, error: null, isPlaying: true });
      },

      prev: () => {
        const audio = getAudio();
        if (audio && audio.currentTime > 3) {
          audio.currentTime = 0;
          return;
        }
        const back = history.pop();
        const target = back !== undefined ? back : get().index - 1;
        if (target >= 0) {
          set({ index: target, currentTime: 0, duration: 0, error: null, isPlaying: true });
        } else if (audio) {
          audio.currentTime = 0;
        }
      },

      seek: (t) => {
        const audio = getAudio();
        if (audio) audio.currentTime = t;
        set({ currentTime: t });
      },

      setVolume: (v) => set({ volume: clamp01(v), muted: false }),
      toggleMute: () => set((s) => ({ muted: !s.muted })),
      toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
      cycleRepeat: () =>
        set((s) => ({ repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off' })),
      patch: (p) => set(p),
    }),
    {
      name: 'musify-player',
      partialize: (s) => ({ volume: s.volume, muted: s.muted, repeat: s.repeat, shuffle: s.shuffle }),
    },
  ),
);

export const currentTrack = (s: Pick<PlayerState, 'queue' | 'index'>): Track | undefined =>
  s.queue[s.index];
