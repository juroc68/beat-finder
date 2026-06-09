export interface Track {
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

export interface SearchCriteria {
  query: string;
  bpm: number;
  margin: number;
}

export interface SearchResponse {
  tracks: Track[];
  hasMore: boolean;
  total: number;
  limit: number;
}

export interface YoutubeMatch {
  youtubeId: string;
  title: string;
  artists: string;
  thumbnail: string;
}
