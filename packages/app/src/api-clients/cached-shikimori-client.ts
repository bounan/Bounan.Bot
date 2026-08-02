import { asyncMemoized } from '../../../../third-party/common/ts/runtime/memorized';
import * as orig from './shikimori-client';

export * from './shikimori-client';

export const getShikiAnimeInfo = asyncMemoized('getShikiAnimeInfo', orig.getShikiAnimeInfo);

export const getRelated = asyncMemoized('getRelated', orig.getRelated);

export const searchAnime = asyncMemoized('searchAnime', orig.searchAnime);
