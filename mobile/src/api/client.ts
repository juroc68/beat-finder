import { Platform } from 'react-native';
import type { SearchCriteria, SearchResponse, YoutubeMatch } from '../types';

const fallbackApiUrl = Platform.select({
  android: 'http://10.0.2.2:5000',
  ios: 'http://localhost:5000',
  default: 'http://localhost:5000'
});

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || fallbackApiUrl).replace(/\/$/, '');

const parseError = async (response: Response, fallback: string): Promise<Error> => {
  const body = await response.json().catch(() => null) as { error?: string } | null;
  return new Error(body?.error || fallback);
};

export const searchTracks = async (
  criteria: SearchCriteria,
  index = 0,
  limit = 30
): Promise<SearchResponse> => {
  const params = new URLSearchParams({
    bpm: String(criteria.bpm),
    margin: String(criteria.margin),
    index: String(index),
    limit: String(limit)
  });

  if (criteria.query.trim()) {
    params.set('q', criteria.query.trim());
  }

  const response = await fetch(`${API_URL}/api/search?${params.toString()}`);
  if (!response.ok) {
    throw await parseError(response, 'Impossible de rechercher des morceaux.');
  }

  return response.json() as Promise<SearchResponse>;
};

export const resolveYoutubeTrack = async (track: string, artist: string): Promise<YoutubeMatch> => {
  const params = new URLSearchParams({ track, artist });
  const response = await fetch(`${API_URL}/api/youtube-music/search?${params.toString()}`);
  if (!response.ok) {
    throw await parseError(response, 'Aucun résultat YouTube trouvé.');
  }

  return response.json() as Promise<YoutubeMatch>;
};
