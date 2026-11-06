'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

import { usePlayer } from '@/stores/usePlayer';
import type { HomeData, MoodKey } from '@/types';

export function useHome() {
  return useQuery({
    queryKey: ['home'],
    staleTime: 5 * 60_000,
    queryFn: api.home,
    retry: 1,
  });
}

export function useMood(key: MoodKey | null) {
  return useQuery({
    queryKey: ['mood', key],
    enabled: key !== null,
    staleTime: 30 * 60_000,
    queryFn: () => api.mood(key as MoodKey),
    retry: 0,
  });
}

export function usePlaylist(id: string) {
  return useQuery({ queryKey: ['playlist', id], queryFn: () => api.playlist(id), staleTime: 10 * 60_000, retry: 1 });
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: ['search', q],
    enabled: q.trim().length > 0,
    queryFn: () => api.search(q),
    staleTime: 10 * 60_000,
    retry: 0,
  });
}

/** Carrega uma playlist e começa a tocá-la. */
export function usePlayPlaylist() {
  const playQueue = usePlayer((s) => s.playQueue);
  return async (id: string) => {
    
    const pl = await api.playlist(id);
    playQueue(pl.tracks, 0);
  };
}
