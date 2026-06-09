import 'dotenv/config';

const parsePositiveInteger = (value: string | undefined, fallback: number): number => {
  const parsedValue = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

const chunkSize = parsePositiveInteger(process.env.CHUNK_SIZE, 30);

export const config = {
  port: parsePositiveInteger(process.env.PORT, 5000),
  chunkSize,
  getSongBpmApiKey: process.env.GETSONGBPM_API_KEY,
  rateLimits: {
    api: {
      windowMs: parsePositiveInteger(process.env.API_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
      max: parsePositiveInteger(process.env.API_RATE_LIMIT_MAX, 100_000)
    },
    providers: {
      windowMs: parsePositiveInteger(process.env.PROVIDER_RATE_LIMIT_WINDOW_MS, 60 * 1000),
      deezerSearchMax: parsePositiveInteger(process.env.DEEZER_SEARCH_RATE_LIMIT_MAX, 2000),
      bpmSearchMax: parsePositiveInteger(process.env.BPM_SEARCH_RATE_LIMIT_MAX, 30),
      audioProxyMax: parsePositiveInteger(
        process.env.AUDIO_PROXY_RATE_LIMIT_MAX,
        Math.max(chunkSize * 10, 2000)
      ),
      youtubeSearchMax: parsePositiveInteger(process.env.YOUTUBE_SEARCH_RATE_LIMIT_MAX, 300)
    }
  }
};

export const hasGetSongBpmApiKey = (): boolean =>
  Boolean(
    config.getSongBpmApiKey &&
    config.getSongBpmApiKey !== 'your_getsongbpm_api_key'
  );
