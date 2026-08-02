import type { Maybe } from '@lightweight-clients/shikimori-graphql-api-lightweight-client';
import { animes } from '@lightweight-clients/shikimori-graphql-api-lightweight-client';

export type ShikiAnimeInfo = {
  id: string;
  url: string;

  episodes: Maybe<number>;
  episodesAired: Maybe<number>;

  name: string;
  russian?: Maybe<string>;
  english?: Maybe<string>;
  licenseNameRu?: Maybe<string>;
  franchise?: Maybe<string>;
  synonyms?: Maybe<string[]>;
  genres?: Maybe<{ russian: Maybe<string> }[]>;
  airedOn?: Maybe<{ year?: Maybe<number> }>;

  poster?: Maybe<{ originalUrl: string }>;
};

export const getShikiAnimeInfo = async (myAnimeListId: number): Promise<ShikiAnimeInfo> => {
  return (
    await animes(
      {
        ids: myAnimeListId.toString(),
      },
      {
        id: 1,
        url: 1,
        episodes: 1,
        episodesAired: 1,
        name: 1,
        russian: 1,
        english: 1,
        licenseNameRu: 1,
        franchise: 1,
        synonyms: 1,
        genres: { russian: 1 },
        airedOn: { year: 1 },
        poster: { originalUrl: 1 },
      },
    )
  )[0];
};

export const getRelated = async (myAnimeListId: number) => {
  return await animes(
    {
      ids: myAnimeListId.toString(),
    },
    {
      related: {
        relationText: 1,
        anime: {
          id: 1,
          name: 1,
          russian: 1,
          airedOn: { year: 1 },
          poster: { originalUrl: 1 },
        },
      },
    },
  );
};

export const searchAnime = async (query: string) => {
  return await animes(
    {
      search: query,
      limit: 10,
      censored: false,
    },
    {
      id: 1,
      name: 1,
      russian: 1,
      airedOn: { year: 1 },
    },
  );
};
