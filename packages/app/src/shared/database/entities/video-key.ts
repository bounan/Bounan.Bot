import type { AnimeKey } from './anime-key';

export interface VideoKey extends AnimeKey {
  episode: number;
}
