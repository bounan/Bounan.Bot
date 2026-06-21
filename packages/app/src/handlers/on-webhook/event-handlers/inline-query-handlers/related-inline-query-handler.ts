import type { Related } from '@lightweight-clients/shikimori-graphql-api-lightweight-client';
import type { InlineQuery, InlineQueryResultArticle } from '@lightweight-clients/telegram-bot-api-lightweight-client';

import { getRelated } from '../../../../api-clients/cached-shikimori-client';
import { logger } from '../../../../shared/logger';
import { InfoCommandDto, RelatedCommandDto } from '../../command-dtos';
import { KnownInlineAnswers } from '../../constants/known-inline-answers';
import type { InlineQueryHandler } from '../query-handler';

const canHandle = (inlineQuery: InlineQuery): boolean =>
  inlineQuery.query?.startsWith(RelatedCommandDto.Command) ?? false;

const handler: InlineQueryHandler = async (inlineQuery) => {
  logger.info('Handling related inline query', inlineQuery.query);

  const commandDto = RelatedCommandDto.fromPayload(inlineQuery.query) as RelatedCommandDto;
  if (!commandDto) {
    logger.warn('Failed to deserialize command', inlineQuery.query);
    return [];
  }

  const relatedRes = await getRelated(commandDto.myAnimeListId);
  const relatedAnimes = relatedRes.flatMap(x => x.related).filter(x => x?.anime) as Related[];
  const items: InlineQueryResultArticle[] = relatedAnimes.length === 0
    ? [
      {
        type: 'article',
        id: KnownInlineAnswers.NoRelatedAnime,
        title: KnownInlineAnswers.NoRelatedAnime,
        input_message_content: {
          message_text: KnownInlineAnswers.NoRelatedAnime,
        },
      },
    ]
    : relatedAnimes.map(item => ({
      type: 'article',
      id: item!.anime!.id.toString(),
      title: item.anime!.russian || item.anime!.name,
      description: [item.relationText, item!.anime!.airedOn?.year].filter(x => !!x).join(', '),
      thumbnail_url: item.anime?.poster?.originalUrl,
      input_message_content: {
        message_text: new InfoCommandDto(item.anime!.id).toString(),
      },
    }));

  logger.info('Returning related animes', { count: items.length, myAnimeListId: commandDto.myAnimeListId });
  return items;
}

export const relatedInlineQueryHandler = {
  canHandle,
  handler,
};
