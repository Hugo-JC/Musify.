import type { HomeData, MoodKey, Playlist, PlaylistCard, SearchResults } from '@/types';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  home: () => get<HomeData>('/home'),
  mood: (key: MoodKey) => get<PlaylistCard[]>(`/moods/${key}`),
  playlist: (id: string) => get<Playlist>(`/playlist/${encodeURIComponent(id)}`),
  search: (q: string) => get<SearchResults>(`/search?q=${encodeURIComponent(q)}`),
  streamUrl: (videoId: string) => `/api/stream/${videoId}`,
  warm: (videoId: string) => fetch(`/api/stream/${videoId}/warm`, { method: 'POST' }).catch(() => undefined),
};
