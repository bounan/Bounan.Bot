import type { InlineQuery, InlineQueryResultArticle } from '@lightweight-clients/telegram-bot-api-lightweight-client';

import { getDubs } from '../../../../api-clients/loan-api-client';
import { dubToKey } from '../../../../shared/helpers/dub-to-key';
import { getStudioLogoUrl } from '../../../../shared/studio-logos-provider/studio-logos-provider';
import { Texts } from '../../../../shared/telegram/texts';
import { getRegisteredDubs } from '../../../library-repository';
import { DubsCommandDto, WatchCommandDto } from '../../command-dtos';
import { KnownInlineAnswers } from '../../constants/known-inline-answers';
import type { InlineQueryHandler } from '../query-handler';

const getDescription = (
  dub: Awaited<ReturnType<typeof getDubs>>[0],
  registeredDubs: Set<string>,
): string => {
  const prefix = dub.firstEpisode === 0 && dub.lastEpisode === undefined
    ? Texts.Dubs__Description__Type__Movie
    : `${Texts.Dubs__Description__Type__Series} ${dub.firstEpisode} - ${dub.lastEpisode ?? '?'}`;

  const registeredSuffix = registeredDubs.has(dub.name)
    ? Texts.Dubs__Description__AvailableNow
    : Texts.Dubs__Description__NotAvailableNow;

  return `${prefix} | ${registeredSuffix}`;
};

const canHandle = (inlineQuery: InlineQuery): boolean => inlineQuery.query?.startsWith(DubsCommandDto.Command) ?? false;

const handler: InlineQueryHandler = async (inlineQuery) => {
  console.log('Handling dubs inline query {Query}', inlineQuery.query);

  const commandDto = DubsCommandDto.fromPayload(inlineQuery.query) as DubsCommandDto;
  if (!commandDto) {
    console.warn('Failed to deserialize command', inlineQuery.query);
    return [];
  }

  const registeredDubsTask = getRegisteredDubs(commandDto.myAnimeListId);

  const uniqueDubs = await getDubs(commandDto.myAnimeListId);
  console.log('Got dubs for {MyAnimeListId}: {Dubs}', commandDto.myAnimeListId, uniqueDubs);
  if (uniqueDubs.length === 0) {
    return [{
      type: 'article',
      id: KnownInlineAnswers.AnimeUnavailable,
      title: KnownInlineAnswers.AnimeUnavailable,
      input_message_content: {
        message_text: KnownInlineAnswers.AnimeUnavailable,
      },
    }];
  }

  const registeredDubs = await registeredDubsTask;

  const sortedDubs = [...uniqueDubs].sort((a, b) => {
    const aSortPriority = registeredDubs.has(a.name) ? 0 : 1;
    const bSortPriority = registeredDubs.has(b.name) ? 0 : 1;
    return aSortPriority !== bSortPriority
      ? aSortPriority - bSortPriority
      : a.name.localeCompare(b.name);
  });

  const results: InlineQueryResultArticle[] = sortedDubs.map(item => ({
    type: 'article',
    id: item.name,
    title: item.name,
    description: getDescription(item, registeredDubs),
    thumbnail_url: getStudioLogoUrl(item.name),
    input_message_content: {
      message_text: new WatchCommandDto(
        commandDto.myAnimeListId,
        dubToKey(item.name),
        item.firstEpisode,
      ).toString(),
    },
  }));

  console.log('Returning {Count} dubs for {MyAnimeListId}', results.length, commandDto.myAnimeListId);
  return results;
}

export const dubsInlineQueryHandler = {
  canHandle,
  handler,
};
