import type { HomeData, MoodKey, Playlist, PlaylistCard, SearchResults, YouTubeAccount } from '@/types';

async function get<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, { credentials: 'include', ...init });
  if (!res.ok) {
    let message = `Pedido falhou (${res.status})`;
    try {
      const body = await res.json();
      message = body?.detail?.message ?? body?.detail?.code ?? body?.message ?? message;
    } catch { /* response not JSON */ }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  home: () => get<HomeData>('/home'),
  mood: (key: MoodKey) => get<PlaylistCard[]>(`/moods/${key}`),
  playlist: (id: string) => get<Playlist>(`/playlist/${encodeURIComponent(id)}`),
  search: (q: string) => get<SearchResults>(`/search?q=${encodeURIComponent(q)}`),
  account: () => get<YouTubeAccount>('/auth/youtube/status'),
  disconnectAccount: () => get<{ connected: boolean }>('/auth/youtube/logout', { method: 'POST' }),
};
