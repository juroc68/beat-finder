import 'dotenv/config';

const parsePositiveInteger = (value: string | undefined, fallback: number): number => {
  const parsedValue = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

export const config = {
  port: parsePositiveInteger(process.env.PORT, 5000),
  chunkSize: parsePositiveInteger(process.env.CHUNK_SIZE, 30),
  getSongBpmApiKey: process.env.GETSONGBPM_API_KEY
};

export const hasGetSongBpmApiKey = (): boolean =>
  Boolean(
    config.getSongBpmApiKey &&
    config.getSongBpmApiKey !== 'your_getsongbpm_api_key'
  );
