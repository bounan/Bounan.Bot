import { client_setClientToken } from '@lightweight-clients/telegram-bot-api-lightweight-client';
import type { SNSEvent } from 'aws-lambda';

import { config, initConfig } from '../../config/config';
import { retry } from '../../shared/helpers/retry';
import { process } from './processor';

const processMessage = async (message: string): Promise<void> => {
  console.log('Processing message: ', message);

  const videoDownloadedNotification = JSON.parse(message);
  await process(videoDownloadedNotification);

  console.log('Message processed');
};

export const handler = async (event: SNSEvent): Promise<void> => {
  console.log('Processing event: ', JSON.stringify(event));

  await initConfig();
  client_setClientToken(config.value.telegram.token);

  for (const record of event.Records) {
    console.log('Processing record: ', record?.Sns?.MessageId);
    await retry(async () => await processMessage(record.Sns.Message), 3, () => true);
  }

  console.info('done');
};
