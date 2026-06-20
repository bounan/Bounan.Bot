import type { EventBridgeEvent } from 'aws-lambda';

import { createLogger } from '../../../../../third-party/common/ts/runtime/logger';
import { initConfig } from '../../config/config';

const logger = createLogger('@app/handlers/on-schedule/handler');

const process = async (): Promise<void> => {
  logger.info('Processing scheduled work');
  // TODO
}

export const handler = async (event: EventBridgeEvent<never, never>): Promise<void> => {
  logger.info('Processing event', { event });
  await initConfig();
  await process();
  logger.info('Done');
};
