import yts from 'yt-search';

export interface YoutubeMatch {
  youtubeId: string;
  title: string;
  artists: string;
  album: string;
  thumbnail: string;
  duration: string;
}

export const searchYoutubeTrack = async (
  track: string,
  artist: string
): Promise<YoutubeMatch | null> => {
  const searchQuery = `${track} ${artist}`;
  console.log(`Searching YouTube for: "${searchQuery}"...`);

  const searchResult = await yts(searchQuery);
  const match = searchResult.videos?.[0];
  if (!match) return null;

  return {
    youtubeId: match.videoId,
    title: match.title,
    artists: match.author.name,
    album: '',
    thumbnail: match.thumbnail,
    duration: match.duration.toString()
  };
};
