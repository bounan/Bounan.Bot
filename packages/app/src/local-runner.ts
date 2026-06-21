/* eslint @typescript-eslint/no-explicit-any: 0 */
/* eslint @typescript-eslint/no-unused-vars: 0 */
/* eslint no-constant-condition: 0 */

import type { Update } from '@lightweight-clients/telegram-bot-api-lightweight-client';

import type { VideoDownloadedNotification } from '../../../third-party/common/ts/interfaces';
import { config, initConfig } from './config/config';
import { handler as onVideoDownloadedHandler } from './handlers/on-video-downloaded/handler';
import { handler as onWebhookHandler } from './handlers/on-webhook/handler';
import { logger } from './shared/logger';

const onDownloaded = async (message: VideoDownloadedNotification) => {
  logger.info('Processing message', message);

  // @ts-expect-error - we don't need to provide all the event properties
  await onVideoDownloadedHandler({ Records: [{ Sns: { Message: JSON.stringify(message) } }] });

  logger.info('Message processed');
}

const onWebhook = async (message: Update) => {
  // @ts-expect-error - we don't need to provide all the event properties
  await onWebhookHandler({ body: JSON.stringify(message) });
}

const main = async () => {
  // await onDownloaded({
  //     videoKey: {
  //         myAnimeListId: 1165,
  //         dub: 'Субтитры',
  //         episode: 1,
  //     },
  //     messageId: 121,
  //     scenes: {
  //         opening: {
  //             start: 0,
  //             end: 100,
  //         },
  //     },
  //     publishingDetails: {
  //         messageId: 4329,
  //         threadId: 4241,
  //     },
  // });

  await onWebhook({
    update_id: 1,
    inline_query: {
      id: '1',
      from: {
        id: 14,
        is_bot: false,
        first_name: 'Test',
      },
      query: ':озв 37430',
      offset: '',
    },
  });
}

const pooling = async () => {
  await initConfig();
  let offset = 0;
  while (true) {
    const result = await fetch(`https://api.telegram.org/bot${config.value.telegram.token}/getUpdates?offset=${offset}&timeout=60&allowed_updates=["callback_query","inline_query","message"]`);
    const updates = await result.json();
    offset = updates.result[updates.result?.length - 1]?.update_id + 1 || offset;

    for (const update of updates.result) {
      await onWebhook(update);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

process.env.AWS_PROFILE = 'hra';
main();
// pooling();
