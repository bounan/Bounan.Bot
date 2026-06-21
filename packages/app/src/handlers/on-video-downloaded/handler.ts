import { client_setClientToken } from '@lightweight-clients/telegram-bot-api-lightweight-client';
import type { SNSEvent } from 'aws-lambda';

import { config, initConfig } from '../../config/config';
import { retry } from '../../shared/helpers/retry';
import { logger } from '../../shared/logger';
import { process } from './processor';

const processMessage = async (message: string): Promise<void> => {
  logger.info('Processing message', message);

  const videoDownloadedNotification = JSON.parse(message);
  await process(videoDownloadedNotification);

  logger.info('Message processed');
};

export const handler = async (event: SNSEvent): Promise<void> => {
  logger.info('Processing event', event);

  await initConfig();
  client_setClientToken(config.value.telegram.token);

  for (const record of event.Records) {
    logger.info('Processing record', record?.Sns?.MessageId);
    await retry(async () => await processMessage(record.Sns.Message), 3, () => true);
  }

  logger.info('Done');
};
