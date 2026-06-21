import { createLogger } from '../../../../third-party/common/ts/runtime/logger';

const structuredLogger = createLogger('@app');

const fields = (values: unknown[]): Record<string, unknown> | undefined => {
  return values.length > 0 ? { values } : undefined;
}

export const logger = {
  info: (message: unknown, ...values: unknown[]) => structuredLogger.info(String(message), fields(values)),
  warn: (message: unknown, ...values: unknown[]) => structuredLogger.warn(String(message), fields(values)),
  error: (message: unknown, ...values: unknown[]) => structuredLogger.error(String(message), values[0], fields(values.slice(1))),
};
