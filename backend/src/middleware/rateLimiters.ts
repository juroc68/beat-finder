import { rateLimit } from 'express-rate-limit';
import type { Request } from 'express';
import { config } from '../config.js';

const commonOptions = {
  standardHeaders: 'draft-7' as const,
  legacyHeaders: false
};

const isBpmSearchRequest = (req: Request): boolean => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const hasExactBpm = typeof req.query.bpm === 'string';
  const hasBpmRange = (
    typeof req.query.minBpm === 'string' &&
    typeof req.query.maxBpm === 'string'
  );

  return !query && (hasExactBpm || hasBpmRange);
};

export const apiLimiter = rateLimit({
  ...commonOptions,
  windowMs: config.rateLimits.api.windowMs,
  limit: config.rateLimits.api.max,
  message: {
    error: 'Trop de requetes depuis cette adresse IP. Veuillez reessayer plus tard.'
  }
});

export const deezerSearchLimiter = rateLimit({
  ...commonOptions,
  windowMs: config.rateLimits.providers.windowMs,
  limit: config.rateLimits.providers.deezerSearchMax,
  skip: isBpmSearchRequest,
  message: {
    error: 'Trop de recherches Deezer rapides. Veuillez reessayer plus tard.'
  }
});

export const bpmSearchLimiter = rateLimit({
  ...commonOptions,
  windowMs: config.rateLimits.providers.windowMs,
  limit: config.rateLimits.providers.bpmSearchMax,
  skip: (req) => !isBpmSearchRequest(req),
  message: {
    error: 'Trop de recherches BPM rapides. Veuillez reessayer plus tard.'
  }
});

export const audioProxyLimiter = rateLimit({
  ...commonOptions,
  windowMs: config.rateLimits.providers.windowMs,
  limit: config.rateLimits.providers.audioProxyMax,
  message: {
    error: 'Trop de demandes d\'analyse audio. Veuillez reessayer plus tard.'
  }
});

export const youtubeSearchLimiter = rateLimit({
  ...commonOptions,
  windowMs: config.rateLimits.providers.windowMs,
  limit: config.rateLimits.providers.youtubeSearchMax,
  message: {
    error: 'Trop de recherches YouTube rapides. Veuillez reessayer plus tard.'
  }
});
