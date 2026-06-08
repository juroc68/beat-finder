export interface Track {
  id: string;
  name: string;
  artists: string;
  album: string;
  albumArt: string | null;
  durationMs: number;
  popularity: number;
  deezerUrl?: string;
  bpm?: number;
  rawBpm?: number;
  key?: number;
  mode?: number;
  energy?: number;
  danceability?: number;
  previewUrl?: string;
  analyzing?: boolean;
  keyText?: string;
}

export interface YoutubeMatch {
  youtubeId: string;
  title: string;
  thumbnail: string;
}
