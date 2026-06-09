import axios from 'axios';
import type { GsbSong, PaginatedTracks, ResultTrack } from '../types/tracks.js';
import { getErrorMessage } from '../utils/errors.js';

interface GetSongBpmResponse {
  tempo?: GsbSong[];
  songs?: GsbSong[];
}

interface BpmSearchOptions {
  targetBpm?: number;
  margin: number;
  minBpm?: number;
  maxBpm?: number;
  index: number;
  limit: number;
  apiKey: string;
}

const extractSongs = (data: GetSongBpmResponse | GsbSong[]): GsbSong[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.tempo)) return data.tempo;
  if (Array.isArray(data.songs)) return data.songs;
  return [];
};

const getTrackName = (song: GsbSong): string => {
  if (song.title && typeof song.title === 'object') {
    return song.title.name ?? song.title.title ?? 'Unknown';
  }

  return song.song_title ?? song.title ?? song.name ?? 'Unknown';
};

const getArtistName = (song: GsbSong): string => {
  if (song.artist && typeof song.artist === 'object') {
    return song.artist.name ?? song.artist.artist_name ?? song.artist.title ?? 'Unknown';
  }

  if (song.artist_name && typeof song.artist_name === 'object') {
    return song.artist_name.name ?? song.artist_name.title ?? 'Unknown';
  }

  return song.artist_name ?? song.artist ?? song.artists ?? 'Unknown';
};

const buildBpmsToQuery = ({
  targetBpm,
  margin,
  minBpm,
  maxBpm
}: Pick<BpmSearchOptions, 'targetBpm' | 'margin' | 'minBpm' | 'maxBpm'>): number[] => {
  if (targetBpm !== undefined) {
    return Array.from({ length: margin + 1 }, (_, offset) => targetBpm + offset);
  }

  if (minBpm === undefined || maxBpm === undefined) return [];

  const start = Math.max(40, minBpm);
  const end = Math.min(220, maxBpm);
  const bpms: number[] = [];

  for (let bpm = start; bpm <= end && bpms.length < 5; bpm += 1) {
    bpms.push(bpm);
  }

  return bpms;
};

const fetchTracksAtBpm = async (bpm: number, apiKey: string): Promise<ResultTrack[]> => {
  try {
    console.log(`Querying GetSongBPM API for tempo: ${bpm} BPM...`);
    const response = await axios.get<GetSongBpmResponse | GsbSong[]>('https://api.getsong.co/tempo/', {
      params: { bpm, api_key: apiKey },
      timeout: 10_000
    });

    return extractSongs(response.data).map((song, songIndex) => ({
      id: `gsb-${song.song_id ?? song.id ?? `${bpm}-${songIndex}`}`,
      name: String(getTrackName(song)),
      artists: String(getArtistName(song)),
      album: '',
      albumArt: null,
      durationMs: 200_000,
      popularity: 80,
      bpm,
      keyText: song.key_of_track ?? song.key ?? ''
    }));
  } catch (error) {
    console.error(`Error querying GetSongBPM for BPM ${bpm}:`, getErrorMessage(error));
    return [];
  }
};

export const searchTracksByBpm = async (options: BpmSearchOptions): Promise<PaginatedTracks> => {
  const bpmsToQuery = buildBpmsToQuery(options);
  const tracksByBpm = await Promise.all(
    bpmsToQuery.map((bpm) => fetchTracksAtBpm(bpm, options.apiKey))
  );

  const seenTracks = new Set<string>();
  const tracks = tracksByBpm
    .flat()
    .filter((track) => {
      const key = `${track.name.toLowerCase()}-${track.artists.toLowerCase()}`;
      if (seenTracks.has(key)) return false;
      seenTracks.add(key);
      return true;
    })
    .sort((firstTrack, secondTrack) => firstTrack.name.localeCompare(secondTrack.name));

  return {
    tracks: tracks.slice(options.index, options.index + options.limit),
    hasMore: options.index + options.limit < tracks.length,
    total: tracks.length,
    limit: options.limit
  };
};
