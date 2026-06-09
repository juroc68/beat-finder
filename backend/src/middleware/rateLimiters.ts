import { rateLimit } from 'express-rate-limit';
import type { Request } from 'express';

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
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  message: {
    error: 'Trop de requetes depuis cette adresse IP, veuillez reessayer apres 15 minutes.'
  }
});

export const deezerSearchLimiter = rateLimit({
  ...commonOptions,
  windowMs: 60 * 1000,
  limit: 120,
  skip: isBpmSearchRequest,
  message: {
    error: 'Trop de recherches Deezer rapides. Veuillez reessayer dans une minute.'
  }
});

export const bpmSearchLimiter = rateLimit({
  ...commonOptions,
  windowMs: 60 * 1000,
  limit: 15,
  skip: (req) => !isBpmSearchRequest(req),
  message: {
    error: 'Trop de recherches BPM rapides. Veuillez reessayer dans une minute.'
  }
});

export const audioProxyLimiter = rateLimit({
  ...commonOptions,
  windowMs: 60 * 1000,
  limit: 120,
  message: {
    error: 'Trop de demandes d\'analyse audio. Veuillez reessayer dans une minute.'
  }
});

export const youtubeSearchLimiter = rateLimit({
  ...commonOptions,
  windowMs: 60 * 1000,
  limit: 30,
  message: {
    error: 'Trop de recherches YouTube rapides. Veuillez reessayer dans une minute.'
  }
});
