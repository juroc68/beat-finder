import express from 'express';
import cors from 'cors';
import {
  apiLimiter,
  audioProxyLimiter,
  bpmSearchLimiter,
  deezerSearchLimiter,
  youtubeSearchLimiter
} from './middleware/rateLimiters.js';
import { audioProxyRouter } from './routes/audioProxy.js';
import { genresRouter } from './routes/genres.js';
import { searchRouter } from './routes/search.js';
import { youtubeRouter } from './routes/youtube.js';

export const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(cors());
  app.use(express.json());
  app.use('/api', apiLimiter);

  app.use('/api/genres', genresRouter);
  app.use('/api/search', deezerSearchLimiter, bpmSearchLimiter, searchRouter);
  app.use('/api/audio-proxy', audioProxyLimiter, audioProxyRouter);
  app.use('/api/youtube-music', youtubeSearchLimiter, youtubeRouter);

  return app;
};

export const app = createApp();
