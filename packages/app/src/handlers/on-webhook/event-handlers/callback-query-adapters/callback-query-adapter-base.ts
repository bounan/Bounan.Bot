import type { AnswerCallbackQueryData, CallbackQuery } from '@lightweight-clients/telegram-bot-api-lightweight-client';

import { assert } from '../../../../shared/helpers/assert';
import { logger } from '../../../../shared/logger';
import type { MessageHandler } from '../query-handler';

export const processCallbackQuery = async (
  callbackQuery: CallbackQuery,
  handler: MessageHandler,
): Promise<Omit<AnswerCallbackQueryData, 'callback_query_id'>> => {
  const message = callbackQuery.message;
  assert(callbackQuery.id);
  assert(callbackQuery.data);
  assert(message?.chat);
  assert(message?.message_id);

  logger.info('Handling callback query');

  await handler({
    chat: message.chat,
    text: callbackQuery.data,
    message_id: message.message_id,
  });

  return {};
};
