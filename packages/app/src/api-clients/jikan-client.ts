import { getAnimeById } from '@lightweight-clients/jikan-api-lightweight-client';

export const getJikanAnimePoster = async (myAnimeListId: number): Promise<string | undefined> => {
  const anime = await getAnimeById(myAnimeListId);

  return anime.data?.images?.jpg?.large_image_url
    ?? anime.data?.images?.jpg?.image_url
    ?? undefined;
}
