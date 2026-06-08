import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import yts from 'yt-search';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

interface GsbSong {
  song_id?: string;
  id?: string | number;
  song_title?: string;
  title?: string | { name?: string; title?: string };
  name?: string;
  artist_name?: string;
  artist?: string | { name?: string; artist_name?: string; title?: string };
  artists?: string;
  key_of_track?: string;
  key?: string;
}

interface DeezerTrack {
  id: number;
  title: string;
  preview: string;
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

interface ResultTrack {
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

// Curated list of popular genres
const POPULAR_GENRES = [
  { id: 'pop', name: 'Pop' },
  { id: 'dance', name: 'Dance' },
  { id: 'electronic', name: 'Electronic' },
  { id: 'house', name: 'House' },
  { id: 'techno', name: 'Techno' },
  { id: 'hip-hop', name: 'Hip-Hop' },
  { id: 'rock', name: 'Rock' },
  { id: 'indie', name: 'Indie' },
  { id: 'r-n-b', name: 'R&B' },
  { id: 'latin', name: 'Latin' },
  { id: 'jazz', name: 'Jazz' },
  { id: 'classical', name: 'Classical' },
  { id: 'metal', name: 'Metal' },
  { id: 'acoustic', name: 'Acoustic' }
];

// Endpoint: Get curated list of genres
app.get('/api/genres', (_req: Request, res: Response) => {
  res.json(POPULAR_GENRES);
});

// Endpoint: Search Deezer tracks by keyword, OR search GetSongBPM by tempo
app.get('/api/search', async (req: Request, res: Response) => {
  const q = req.query.q as string | undefined;
  const genre = req.query.genre as string | undefined;
  const bpm = req.query.bpm as string | undefined;
  const minBpm = req.query.minBpm as string | undefined;
  const maxBpm = req.query.maxBpm as string | undefined;
  const limit = req.query.limit as string | undefined;
  const index = req.query.index as string | undefined;

  const defaultLimit = parseInt(process.env.CHUNK_SIZE || '30') || 30;
  const parsedLimit = Math.min(parseInt(limit || '') || defaultLimit, 50);
  const parsedIndex = parseInt(index || '') || 0;

  // Determine if it is a BPM-only search (no text query)
  const isBpmOnlySearch = !q && (bpm || (minBpm && maxBpm));

  if (isBpmOnlySearch) {
    const apiKey = process.env.GETSONGBPM_API_KEY;
    const hasApiKey = apiKey && apiKey !== 'your_getsongbpm_api_key';

    if (!hasApiKey) {
      return res.status(400).json({ error: 'La clé API GetSongBPM (GETSONGBPM_API_KEY) n\'est pas configurée sur le serveur.' });
    }

    // Direct search by tempo using GetSongBPM API
    try {
      const targetBpm = bpm ? parseInt(bpm) : null;
      const minB = minBpm ? parseInt(minBpm) : null;
      const maxB = maxBpm ? parseInt(maxBpm) : null;

      let bpmsToQuery: number[] = [];
      if (targetBpm) {
        bpmsToQuery = [targetBpm];
      } else if (minB !== null && maxB !== null) {
        // Limit range queries to 5 integer BPM values to avoid hitting rate limits (3000 req/hr)
        const start = Math.max(40, minB);
        const end = Math.min(220, maxB);
        for (let b = start; b <= end && bpmsToQuery.length < 5; b++) {
          bpmsToQuery.push(b);
        }
      }

      const queryPromises = bpmsToQuery.map(async (b) => {
        try {
          console.log(`Querying GetSongBPM API for tempo: ${b} BPM...`);
          const response = await axios.get('https://api.getsong.co/tempo/', {
            params: {
              bpm: b,
              api_key: apiKey
            }
          });

          let songs: GsbSong[] = [];
          if (Array.isArray(response.data)) {
            songs = response.data;
          } else if (response.data && Array.isArray(response.data.tempo)) {
            songs = response.data.tempo;
          } else if (response.data && Array.isArray(response.data.songs)) {
            songs = response.data.songs;
          }

          return songs.map((song: GsbSong): ResultTrack => {
            const trackName = typeof song.title === 'object' && song.title 
              ? (song.title.name || song.title.title || 'Unknown') 
              : (song.song_title || song.title || song.name || 'Unknown');

            let artistName = 'Unknown';
            if (song.artist && typeof song.artist === 'object') {
              artistName = song.artist.name || song.artist.artist_name || song.artist.title || 'Unknown';
            } else if (song.artist_name && typeof song.artist_name === 'object') {
              artistName = (song.artist_name as any).name || (song.artist_name as any).title || 'Unknown';
            } else {
              artistName = (song.artist_name as string) || (song.artist as string) || song.artists || 'Unknown';
            }

            return {
              id: `gsb-${song.song_id || song.id || Math.random()}`,
              name: String(trackName),
              artists: String(artistName),
              album: '',
              albumArt: null,
              durationMs: 200000, // standard fallback duration
              popularity: 80,
              bpm: b,
              keyText: song.key_of_track || song.key || ''
            };
          });
        } catch (err: any) {
          console.error(`Error querying GetSongBPM for BPM ${b}:`, err.message);
          return [];
        }
      });

      const resultsArray = await Promise.all(queryPromises);
      let mergedResults = resultsArray.flat();

      // De-duplicate items by lowercased title + artist
      const seen = new Set<string>();
      mergedResults = mergedResults.filter((item) => {
        const dupKey = `${String(item.name).toLowerCase()}-${String(item.artists).toLowerCase()}`;
        if (seen.has(dupKey)) return false;
        seen.add(dupKey);
        return true;
      });

      // Sort by alphabetical order
      mergedResults.sort((a, b) => a.name.localeCompare(b.name));

      const slicedResults = mergedResults.slice(parsedIndex, parsedIndex + parsedLimit);
      const hasMore = (parsedIndex + parsedLimit) < mergedResults.length;

      return res.json({
        tracks: slicedResults,
        hasMore,
        total: mergedResults.length,
        limit: parsedLimit
      });
    } catch (error: any) {
      console.error('GetSongBPM API search failed:', error.message);
      return res.status(500).json({ error: 'Erreur lors de la recherche sur GetSongBPM.' });
    }
  }

  // Text Search (via Deezer)
  try {
    const searchQuery = q || 'pop';

    console.log(`Searching Deezer for tracks matching: "${searchQuery}" (index: ${parsedIndex})...`);
    const searchResponse = await axios.get('https://api.deezer.com/search', {
      params: {
        q: searchQuery,
        limit: parsedLimit,
        index: parsedIndex,
      },
    });

    const tracks: DeezerTrack[] = searchResponse.data.data || [];
    const total = searchResponse.data.total || 0;
    const hasMore = !!searchResponse.data.next || (parsedIndex + tracks.length < total);

    const results: ResultTrack[] = tracks
      .filter((track) => track.preview !== null)
      .map((track) => {
        return {
          id: `deezer-${track.id}`,
          name: track.title,
          artists: track.artist.name,
          album: track.album.title,
          albumArt: track.album.cover_big || track.album.cover_medium || track.album.cover || null,
          durationMs: track.duration * 1000,
          popularity: track.rank || 50,
          previewUrl: track.preview,
          deezerUrl: track.link
        };
      });

    res.json({
      tracks: results,
      hasMore,
      total,
      limit: parsedLimit
    });
  } catch (error: any) {
    console.error('Search API error:', error.message);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// Endpoint: Audio Proxy to bypass browser CORS when downloading preview_urls for client-side BPM analysis
app.get('/api/audio-proxy', async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string | undefined;
    if (!url) {
      return res.status(400).send('Parameter "url" is required');
    }

    // SSRF prevention: validate that the URL points to Deezer's domains
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    const isAllowed = hostname.endsWith('.deezer.com') || hostname.endsWith('.dzcdn.net');
    
    if (!isAllowed) {
      return res.status(400).send('URL not allowed (must be from Deezer)');
    }

    console.log(`Proxying audio download from: ${url}`);
    const response = await axios.get(url, { responseType: 'arraybuffer' });

    res.set('Content-Type', 'audio/mpeg');
    res.set('Access-Control-Allow-Origin', '*');
    res.send(response.data);
  } catch (error: any) {
    console.error('Audio proxy error:', error.message);
    res.status(500).send('Failed to proxy audio preview');
  }
});

// Endpoint: Search track on YouTube
app.get('/api/youtube-music/search', async (req: Request, res: Response) => {
  try {
    const track = req.query.track as string | undefined;
    const artist = req.query.artist as string | undefined;

    if (!track || !artist) {
      return res.status(400).json({ error: 'Parameters "track" and "artist" are required' });
    }

    const searchQuery = `${track} ${artist}`;
    console.log(`Searching YouTube for: "${searchQuery}"...`);

    const r = await yts(searchQuery);
    const results = r.videos;

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'No match found on YouTube' });
    }

    const match = results[0];

    res.json({
      youtubeId: match.videoId,
      title: match.title,
      artists: match.author.name,
      album: '',
      thumbnail: match.thumbnail,
      duration: match.duration.toString(),
    });
  } catch (error: any) {
    console.error('YouTube search error:', error.message);
    res.status(500).json({ error: 'Failed to search YouTube' });
  }
});

app.listen(PORT, () => {
  console.log(`Beat Finder API server running on port ${PORT}`);
});
