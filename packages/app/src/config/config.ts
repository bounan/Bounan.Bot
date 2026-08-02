import { fetchSsmValue } from '../../../../third-party/common/ts/runtime/ssm-client';
import type { Config } from './types';

let cachedConfig: Config | undefined;

export const initConfig = async (): Promise<void> => {
  cachedConfig = (await fetchSsmValue('/bounan/bot/runtime-config')) as Config;
};

export const config = {
  get value() {
    if (!cachedConfig) {
      throw new Error('Config not initialized');
    }

    return cachedConfig;
  },
};
