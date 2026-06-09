import { Router } from 'express';
import {
  downloadAudioPreview,
  validateDeezerAudioUrl
} from '../services/audioProxyService.js';
import { getErrorMessage } from '../utils/errors.js';

export const audioProxyRouter = Router();

audioProxyRouter.get('/', async (req, res) => {
  const url = typeof req.query.url === 'string' ? req.query.url : undefined;
  if (!url) {
    return res.status(400).send('Parameter "url" is required');
  }

  try {
    validateDeezerAudioUrl(url);
  } catch {
    return res.status(400).send('URL not allowed (must be an HTTPS Deezer URL)');
  }

  try {
    const audio = await downloadAudioPreview(url);
    res.set('Content-Type', 'audio/mpeg');
    res.set('Access-Control-Allow-Origin', '*');
    return res.send(audio);
  } catch (error) {
    console.error('Audio proxy error:', getErrorMessage(error));
    return res.status(502).send('Failed to proxy audio preview');
  }
});
