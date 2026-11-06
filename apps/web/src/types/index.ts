export interface Artist {
  id?: string | null;
  name: string;
}

export type TrackSource = 'audius' | 'local' | 'youtube';

/** Shared player model. videoId remains optional for legacy YouTube playlists. */
export interface Track {
  id?: string;
  source?: TrackSource;
  videoId?: string;
  localId?: string;
  streamUrl?: string;
  title: string;
  artists: Artist[];
  album?: string | null;
  durationSeconds?: number | null;
  thumbnail?: string | null;
  license?: string | null;
  isStreamable?: boolean;
  isStreamGated?: boolean;
}

export function trackKey(track: Track): string {
  if (track.source === 'local') return 'local:' + (track.localId ?? track.id ?? track.title);
  if (track.source === 'audius') return 'audius:' + (track.id ?? track.title);
  if (track.videoId) return 'youtube:' + track.videoId;
  return (track.source ?? 'legacy') + ':' + (track.id ?? track.title);
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

export interface YouTubeAccount {
  connected: boolean;
  channel: { id: string; title: string; thumbnail?: string } | null;
}
