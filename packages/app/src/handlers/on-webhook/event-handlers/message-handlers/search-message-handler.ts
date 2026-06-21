import { sendMessage } from '@lightweight-clients/telegram-bot-api-lightweight-client';

import { searchAnime } from '../../../../api-clients/cached-shikimori-client';
import { assert } from '../../../../shared/helpers/assert';
import { eclipseText } from '../../../../shared/helpers/string-helpers';
import { logger } from '../../../../shared/logger';
import { Texts } from '../../../../shared/telegram/texts';
import { InfoCommandDto } from '../../command-dtos';
import type { MessageHandler } from '../query-handler';

const canHandle = (): boolean => {
  throw new Error('Not supported');
};

const handler: MessageHandler = async (message) => {
  assert(!!message?.chat?.id);
  if (!message?.text?.trim()) {
    logger.info('Empty search query; ignoring possible group message');
    return;
  }

  logger.info('Handling search query', message.text);

  const searchResults = await searchAnime(message.text!);
  if (!searchResults || searchResults.length === 0) {
    logger.info('No search results');
    await sendMessage({
      chat_id: message.chat.id,
      text: Texts.Search__NoResultsInShiki,
    });
    return;
  }

  logger.info('Found search results', { count: searchResults.length });

  const buttons = searchResults.map((result) => {
    const title = result.russian || result.name;
    const containsDuplicates = searchResults.filter((r) => r.russian === title || r.name === title).length > 1;
    const deduplicatedTitle = containsDuplicates && result.airedOn?.year
      ? `${title} (${result.airedOn?.year})`
      : title;
    const eclipsedText = eclipseText(deduplicatedTitle, 25, 10);

    return ({
      text: eclipsedText,
      callback_data: new InfoCommandDto(result.id).toString(),
    });
  });

  const result = await sendMessage({
    chat_id: message.chat.id,
    text: Texts.FullMessageSearch__BestResults,
    reply_markup: {
      inline_keyboard: buttons.map((b) => [b]),
    },
  });
  assert(result.ok, () => JSON.stringify(result));
};

export const searchMessageHandler = {
  canHandle,
  handler,
};
