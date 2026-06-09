import { Router } from 'express';
import { config, hasGetSongBpmApiKey } from '../config.js';
import { searchDeezerTracks } from '../services/deezerService.js';
import { searchTracksByBpm } from '../services/getSongBpmService.js';
import { getErrorMessage } from '../utils/errors.js';

const MAX_PAGE_SIZE = 50;

const parseInteger = (value: unknown): number | undefined => {
  if (typeof value !== 'string') return undefined;
  const parsedValue = Number.parseInt(value, 10);
  return Number.isInteger(parsedValue) ? parsedValue : undefined;
};

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);

export const searchRouter = Router();

searchRouter.get('/', async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const targetBpm = parseInteger(req.query.bpm);
  const minBpm = parseInteger(req.query.minBpm);
  const maxBpm = parseInteger(req.query.maxBpm);
  const margin = clamp(parseInteger(req.query.margin) ?? 0, 0, 5);
  const limit = clamp(parseInteger(req.query.limit) ?? config.chunkSize, 1, MAX_PAGE_SIZE);
  const index = Math.max(parseInteger(req.query.index) ?? 0, 0);
  const isBpmOnlySearch = !query && (
    targetBpm !== undefined ||
    (minBpm !== undefined && maxBpm !== undefined)
  );

  try {
    if (isBpmOnlySearch) {
      if (!hasGetSongBpmApiKey() || !config.getSongBpmApiKey) {
        return res.status(400).json({
          error: 'La cle API GetSongBPM (GETSONGBPM_API_KEY) n\'est pas configuree sur le serveur.'
        });
      }

      const results = await searchTracksByBpm({
        targetBpm,
        margin,
        minBpm,
        maxBpm,
        index,
        limit,
        apiKey: config.getSongBpmApiKey
      });
      return res.json(results);
    }

    const results = await searchDeezerTracks(query || 'pop', limit, index);
    return res.json(results);
  } catch (error) {
    console.error('Search API error:', getErrorMessage(error));
    return res.status(500).json({ error: 'Erreur lors de la recherche musicale.' });
  }
});
