export interface GsbSong {
  song_id?: string;
  id?: string | number;
  song_title?: string;
  title?: string | { name?: string; title?: string };
  name?: string;
  artist_name?: string | { name?: string; title?: string };
  artist?: string | { name?: string; artist_name?: string; title?: string };
  artists?: string;
  key_of_track?: string;
  key?: string;
}

export interface DeezerTrack {
  id: number;
  title: string;
  preview: string | null;
  rank?: number;
  link: string;
  duration: number;
  artist: {
    name: string;
  };
  album: {
    title: string;
    cover_big?: string;
    cover_medium?: string;
    cover?: string;
  };
}

export interface ResultTrack {
  id: string;
  name: string;
  artists: string;
  album: string;
  albumArt: string | null;
  durationMs: number;
  popularity: number;
  previewUrl?: string;
  deezerUrl?: string;
  bpm?: number;
  keyText?: string;
}

export interface PaginatedTracks {
  tracks: ResultTrack[];
  hasMore: boolean;
  total: number;
  limit: number;
}
