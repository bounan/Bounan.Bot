export const retry = async <T>(fn: () => Promise<T>, retries: number, doRetry: (e: unknown) => boolean): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && doRetry(error)) {
      logger.warn(`Retrying; ${retries} retries left`, error);
      return await retry(fn, retries - 1, doRetry);
    }

    logger.error(`Failed to execute function after ${retries} retries`);
    throw error;
  }
}
import { logger } from '../logger';
