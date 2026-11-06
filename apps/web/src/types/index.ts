export interface Artist {
  id?: string | null;
  name: string;
}

export interface Track {
  videoId: string;
  title: string;
  artists: Artist[];
  album?: string | null;
  durationSeconds?: number | null;
  thumbnail?: string | null;
}

export interface PlaylistCard {
  id: string;
  title: string;
  subtitle?: string | null;
  thumbnail?: string | null;
  kind: 'playlist' | 'album' | 'artist';
}

export interface Playlist {
  id: string;
  title: string;
  description?: string | null;
  author?: string | null;
  thumbnail?: string | null;
  trackCount: number;
  tracks: Track[];
}

export interface HomeData {
  quick: PlaylistCard[];
  madeForYou: PlaylistCard[];
}

export interface SearchResults {
  songs: Track[];
  playlists: PlaylistCard[];
  albums: PlaylistCard[];
  artists: PlaylistCard[];
}

export type MoodKey = 'focus' | 'unwind' | 'energy';
export type RepeatMode = 'off' | 'all' | 'one';

export interface YouTubeAccount { connected: boolean; channel: { id: string; title: string; thumbnail?: string } | null }
