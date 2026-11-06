import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RepeatMode, Track } from '@/types';

let externalSeekHandler: ((t: number) => void) | null = null;
export const setPlayerSeekHandler = (handler: ((t: number) => void) | null) => {
  externalSeekHandler = handler;
};

interface PlayerState {
  queue: Track[];
  index: number;
  nextIndex: number | null;
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
  prepareNext: () => Track | undefined;
  prev: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  patch: (p: Partial<PlayerState>) => void;
}

const history: number[] = [];
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
      index: -1,
      nextIndex: null,
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
          nextIndex: null,
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

      prepareNext: () => {
        const { queue, index, shuffle, nextIndex, repeat } = get();
        if (!queue.length || index < 0) return undefined;
        if (!shuffle) return queue[index + 1] ?? (repeat === 'all' ? queue[0] : undefined);
        if (nextIndex !== null && queue[nextIndex]) return queue[nextIndex];
        if (queue.length < 2) return repeat === 'all' ? queue[index] : undefined;
        let candidate = Math.floor(Math.random() * (queue.length - 1));
        if (candidate >= index) candidate += 1;
        set({ nextIndex: candidate });
        return queue[candidate];
      },

      next: (auto = false) => {
        const { queue, index, repeat, shuffle, nextIndex } = get();
        if (!queue.length) return;
        if (auto && repeat === 'one') {
          if (externalSeekHandler) externalSeekHandler(0);
          set({ currentTime: 0, isPlaying: true });
          return;
        }
        let n: number;
        if (shuffle && queue.length > 1) {
          if (nextIndex !== null && nextIndex !== index) n = nextIndex;
          else {
            n = Math.floor(Math.random() * (queue.length - 1));
            if (n >= index) n += 1;
          }
        } else {
          n = index + 1;
        }
        if (n >= queue.length) {
          if (repeat === 'all') n = 0;
          else {
            set({ isPlaying: false, currentTime: 0, nextIndex: null });
            return;
          }
        }
        if (n === index) {
          if (externalSeekHandler) externalSeekHandler(0);
          set({ currentTime: 0, isPlaying: true });
          return;
        }
        history.push(index);
        set({ index: n, nextIndex: null, currentTime: 0, duration: 0, error: null, isPlaying: true });
      },

      prev: () => {
        const { currentTime } = get();
        if (currentTime > 3) {
          if (externalSeekHandler) externalSeekHandler(0);
          set({ currentTime: 0 });
          return;
        }
        const back = history.pop();
        const target = back !== undefined ? back : get().index - 1;
        if (target >= 0) {
          set({ index: target, nextIndex: null, currentTime: 0, duration: 0, error: null, isPlaying: true });
        } else {
          if (externalSeekHandler) externalSeekHandler(0);
          set({ currentTime: 0 });
        }
      },

      seek: (t) => {
        if (externalSeekHandler) {
          externalSeekHandler(t);
        }
        set({ currentTime: t });
      },

      setVolume: (v) => set({ volume: clamp01(v), muted: false }),
      toggleMute: () => set((s) => ({ muted: !s.muted })),
      toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle, nextIndex: null })),
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
