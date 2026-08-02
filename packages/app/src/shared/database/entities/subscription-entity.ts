import type { AnimeKey } from './anime-key';

export interface SubscriptionEntity extends AnimeKey {
  animeKey: string;

  // chatIds: Set<number>;

  // Episode-ChatId pairs
  oneTimeSubscribers?: {
    [key: number]: Set<number>;
  };

  createdAt: string;
  updatedAt: string;
}
