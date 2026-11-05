import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track } from '@/types';

// Biblioteca local (localStorage). A interface está isolada para migrar mais tarde para SQLite/Postgres.
interface LibraryState {
  liked: Track[];
  toggleLike: (track: Track) => void;
  isLiked: (videoId: string) => boolean;
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      liked: [],
      toggleLike: (track) =>
        set((s) =>
          s.liked.some((t) => t.videoId === track.videoId)
            ? { liked: s.liked.filter((t) => t.videoId !== track.videoId) }
            : { liked: [track, ...s.liked] },
        ),
      isLiked: (videoId) => get().liked.some((t) => t.videoId === videoId),
    }),
    { name: 'musify-library' },
  ),
);
