import { Texts } from '../../../shared/telegram/texts';

export const KnownInlineAnswers = {
  NoResults: Texts.KnownInlineAnswers__NoResults,
  NoRelatedAnime: Texts.KnownInlineAnswers__NoRelatedAnime,
  AnimeUnavailable: Texts.KnownInlineAnswers__AnimeUnavailable,
} as const;

export type KnownInlineAnswer = (typeof KnownInlineAnswers)[keyof typeof KnownInlineAnswers];
