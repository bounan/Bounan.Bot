import type { CallbackQuery } from '@lightweight-clients/telegram-bot-api-lightweight-client';

import { InfoCommandDto } from '../../command-dtos';
import { infoMessageHandler } from '../message-handlers/info-message-handler';
import type { CallbackQueryHandler } from '../query-handler';
import { processCallbackQuery } from './callback-query-adapter-base';

const canHandle = (callbackQuery: CallbackQuery) => callbackQuery.data?.startsWith(InfoCommandDto.Command) || false;

const handler: CallbackQueryHandler = async (callbackQuery) =>
  await processCallbackQuery(callbackQuery, infoMessageHandler.handler);

export const infoCallbackQueryHandler = {
  canHandle,
  handler,
};
