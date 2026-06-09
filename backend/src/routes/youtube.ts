import { Router } from 'express';
import { searchYoutubeTrack } from '../services/youtubeService.js';
import { getErrorMessage } from '../utils/errors.js';

export const youtubeRouter = Router();

youtubeRouter.get('/search', async (req, res) => {
  const track = typeof req.query.track === 'string' ? req.query.track.trim() : '';
  const artist = typeof req.query.artist === 'string' ? req.query.artist.trim() : '';

  if (!track || !artist) {
    return res.status(400).json({ error: 'Parameters "track" and "artist" are required' });
  }

  try {
    const match = await searchYoutubeTrack(track, artist);
    if (!match) {
      return res.status(404).json({ error: 'No match found on YouTube' });
    }

    return res.json(match);
  } catch (error) {
    console.error('YouTube search error:', getErrorMessage(error));
    return res.status(500).json({ error: 'Failed to search YouTube' });
  }
});
