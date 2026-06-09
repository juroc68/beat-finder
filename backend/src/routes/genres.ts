import { Router } from 'express';
import { POPULAR_GENRES } from '../constants/genres.js';

export const genresRouter = Router();

genresRouter.get('/', (_req, res) => {
  res.json(POPULAR_GENRES);
});
