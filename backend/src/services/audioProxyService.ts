import axios from 'axios';

const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_HOST_SUFFIXES = ['.deezer.com', '.dzcdn.net'];

export const validateDeezerAudioUrl = (rawUrl: string): URL => {
  const parsedUrl = new URL(rawUrl);
  const isAllowed = ALLOWED_HOST_SUFFIXES.some((suffix) =>
    parsedUrl.hostname.endsWith(suffix)
  );

  if (parsedUrl.protocol !== 'https:' || !isAllowed) {
    throw new Error('URL not allowed (must be an HTTPS Deezer URL)');
  }

  return parsedUrl;
};

export const downloadAudioPreview = async (rawUrl: string): Promise<Buffer> => {
  const audioUrl = validateDeezerAudioUrl(rawUrl);
  console.log(`Proxying audio download from: ${audioUrl.toString()}`);

  const response = await axios.get<ArrayBuffer>(audioUrl.toString(), {
    responseType: 'arraybuffer',
    timeout: 15_000,
    maxContentLength: MAX_AUDIO_SIZE_BYTES,
    maxBodyLength: MAX_AUDIO_SIZE_BYTES
  });

  return Buffer.from(response.data);
};
