import type { Message } from '@lightweight-clients/telegram-bot-api-lightweight-client';
import { sendMessage } from '@lightweight-clients/telegram-bot-api-lightweight-client';

import { assert } from '../../../../shared/helpers/assert';
import { logger } from '../../../../shared/logger';
import { Texts } from '../../../../shared/telegram/texts';
import type { MessageHandler } from '../query-handler';

const canHandle = (message: Message): boolean => message.text?.startsWith('/start') || false;

const handler: MessageHandler = async (message) => {
  assert(!!message?.chat?.id);
  assert(!!message?.text);

  logger.info('Handling start message', message.text);

  const result = await sendMessage({
    chat_id: message.chat.id,
    text: Texts.Start,
    reply_markup: {
      inline_keyboard: [
        [
          { text: Texts.Button__Search, switch_inline_query_current_chat: '' },
        ],
      ],
    },
  });
  assert(result.ok, () => JSON.stringify(result));
};

export const startMessageHandler = {
  canHandle,
  handler,
};
