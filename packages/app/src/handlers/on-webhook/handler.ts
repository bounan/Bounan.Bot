import type { CallbackQuery } from '@lightweight-clients/telegram-bot-api-lightweight-client';
import { client_setClientToken } from '@lightweight-clients/telegram-bot-api-lightweight-client';
import type { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';

import { config, initConfig } from '../../config/config';
import { retry } from '../../shared/helpers/retry';
import { Texts } from '../../shared/telegram/texts';
import type { BotSettings } from '../../telegram-bot-handler/update-handler';
import { handleUpdate } from '../../telegram-bot-handler/update-handler';
import { infoCallbackQueryHandler } from './event-handlers/callback-query-adapters/info-callback-query-handler';
import { watchCallbackQueryHandler } from './event-handlers/callback-query-adapters/watch-callback-query-handler';
import { dubsInlineQueryHandler } from './event-handlers/inline-query-handlers/dubs-inline-query-handler';
import { relatedInlineQueryHandler } from './event-handlers/inline-query-handlers/related-inline-query-handler';
import { searchInlineQueryHandler } from './event-handlers/inline-query-handlers/search-inline-query';
import { infoMessageHandler } from './event-handlers/message-handlers/info-message-handler';
import { knownInlineAnswerMessageHandler } from './event-handlers/message-handlers/known-inline-answer-message-handler';
import { searchMessageHandler } from './event-handlers/message-handlers/search-message-handler';
import { startMessageHandler } from './event-handlers/message-handlers/start-message-handler';
import { watchMessageHandler } from './event-handlers/message-handlers/watch-message-handler';

const settings: BotSettings = {
  onMessage: [
    startMessageHandler,
    knownInlineAnswerMessageHandler,
    infoMessageHandler,
    watchMessageHandler,
  ],
  onMessageDefault: searchMessageHandler.handler,

  onInlineQuery: [
    dubsInlineQueryHandler,
    relatedInlineQueryHandler,
  ],
  onInlineQueryDefault: searchInlineQueryHandler.handler,

  onCallbackQuery: [
    infoCallbackQueryHandler,
    watchCallbackQueryHandler,
  ],
  onCallbackQueryDefault: async (callbackQuery: CallbackQuery) => {
    console.error('Received unknown callback query', callbackQuery);
    return {
      callback_query_id: callbackQuery.id,
      show_alert: true,
      text: Texts.UnknownError,
    };
  },
};

const SUCCESS_RESPONSE = { statusCode: 202 };

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
  console.log('Processing event: ', JSON.stringify(event));

  await initConfig();
  client_setClientToken(config.value.telegram.token);

  try {
    if (!event.body) {
      console.log('No body');
      return SUCCESS_RESPONSE;
    }

    const update = JSON.parse(event.body);
    await retry(async () => await handleUpdate(update, settings), 3, () => true);
  } catch (error: unknown) {
    console.error('Failed to process update', error);
  }

  return SUCCESS_RESPONSE;
};
