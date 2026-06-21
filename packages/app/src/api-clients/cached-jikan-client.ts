import { asyncMemoized } from '../../../../third-party/common/ts/runtime/memorized';
import * as orig from './jikan-client';

export * from './jikan-client';

export const getJikanAnimePoster = asyncMemoized('getJikanAnimePoster', orig.getJikanAnimePoster);
