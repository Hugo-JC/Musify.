import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track } from '@/types';
import { trackKey } from '@/types';

interface LibraryState {
  liked: Track[];
  toggleLike: (track: Track) => void;
  isLiked: (key: string) => boolean;
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      liked: [],
      toggleLike: (track) =>
        set((state) =>
          state.liked.some((item) => trackKey(item) === trackKey(track))
            ? { liked: state.liked.filter((item) => trackKey(item) !== trackKey(track)) }
            : { liked: [track, ...state.liked] },
        ),
      isLiked: (key) => get().liked.some((item) => trackKey(item) === key),
    }),
    { name: 'musify-library' },
  ),
);
