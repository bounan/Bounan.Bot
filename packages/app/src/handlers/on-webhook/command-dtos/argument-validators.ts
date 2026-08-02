import { assert } from '../../../shared/helpers/assert';
import { dubToKey } from '../../../shared/helpers/dub-to-key';

export const validateMyAnimeListId = (myAnimeListId: number) => {
  assert(Number.isInteger(myAnimeListId), 'myAnimeListId is not an integer');
  assert(myAnimeListId > 0, 'Invalid myAnimeListId');
};

export const validateDub = (dub: string) => {
  // noinspection SuspiciousTypeOfGuard
  assert(typeof dub === 'string', 'Dub is not a string');
  assert(dub.trim().length > 0, 'Dub is empty');
  assert(dubToKey(dub) === dub, 'Dub is not valid');
};

export const validateEpisode = (episode: number) => {
  assert(Number.isInteger(episode), 'Episode is not an integer');
  assert(episode >= 0, 'Invalid episode');
};
