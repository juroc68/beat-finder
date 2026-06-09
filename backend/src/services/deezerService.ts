import axios from 'axios';
import type { DeezerTrack, PaginatedTracks, ResultTrack } from '../types/tracks.js';

interface DeezerSearchResponse {
  data?: DeezerTrack[];
  total?: number;
  next?: string;
}

export const searchDeezerTracks = async (
  query: string,
  limit: number,
  index: number
): Promise<PaginatedTracks> => {
  console.log(`Searching Deezer for tracks matching: "${query}" (index: ${index})...`);

  const response = await axios.get<DeezerSearchResponse>('https://api.deezer.com/search', {
    params: { q: query, limit, index },
    timeout: 10_000
  });

  const deezerTracks = response.data.data ?? [];
  const total = response.data.total ?? 0;
  const tracks: ResultTrack[] = deezerTracks
    .filter((track) => Boolean(track.preview))
    .map((track) => ({
      id: `deezer-${track.id}`,
      name: track.title,
      artists: track.artist.name,
      album: track.album.title,
      albumArt: track.album.cover_big ?? track.album.cover_medium ?? track.album.cover ?? null,
      durationMs: track.duration * 1000,
      popularity: track.rank ?? 50,
      previewUrl: track.preview ?? undefined,
      deezerUrl: track.link
    }));

  return {
    tracks,
    hasMore: Boolean(response.data.next) || index + deezerTracks.length < total,
    total,
    limit
  };
};
