import type {
  Artist,
  HomeData,
  MoodKey,
  Playlist,
  PlaylistCard,
  SearchResults,
  Track,
  YouTubeAccount,
} from '@/types';

interface AudiusTrackResponse {
  id: string;
  source: 'audius';
  title: string;
  artist: string;
  artistId?: string | null;
  durationSeconds?: number | null;
  artwork?: string | null;
  permalink?: string | null;
  streamUrl: string;
  license?: string | null;
  isStreamable: boolean;
  isStreamGated: boolean;
}

function fromAudius(track: AudiusTrackResponse): Track {
  const artist: Artist = {
    id: track.artistId ?? null,
    name: track.artist || 'Artista desconhecido',
  };
  return {
    id: track.id,
    source: 'audius',
    title: track.title,
    artists: [artist],
    durationSeconds: track.durationSeconds ?? null,
    thumbnail: track.artwork ?? null,
    streamUrl: track.streamUrl,
    license: track.license ?? null,
    isStreamable: track.isStreamable,
    isStreamGated: track.isStreamGated,
  };
}

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
  search: async (q: string): Promise<SearchResults> => {
    const response = await get<{ provider: 'audius'; tracks: AudiusTrackResponse[] }>(
      `/music/search?q=${encodeURIComponent(q)}`,
    );
    return {
      songs: response.tracks.map(fromAudius),
      playlists: [],
      albums: [],
      artists: [],
    };
  },
  trending: async (): Promise<Track[]> => {
    const response = await get<{ provider: 'audius'; tracks: AudiusTrackResponse[] }>(
      '/music/trending',
    );
    return response.tracks.map(fromAudius);
  },
  account: () => get<YouTubeAccount>('/auth/youtube/status'),
  disconnectAccount: () => get<{ connected: boolean }>('/auth/youtube/logout', { method: 'POST' }),
};
