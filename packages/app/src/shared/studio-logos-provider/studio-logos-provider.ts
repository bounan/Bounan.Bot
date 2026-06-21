import { config } from '../../config/config';
import { logger } from '../logger';
import { studioLogosList } from './studio-logos-list';

const subsTokens = [
  'subtitles',
  'subs',
  'sub',
  'субтитры',
]

export const getStudioLogoUrl = (studioName: string): string | undefined => {
  const isSubs = subsTokens.some(token => studioName.toLowerCase().includes(token));
  const trimmedStudioName = subsTokens
    .reduce((acc, token) => acc.replace(token, ''), studioName.toLowerCase())
    .replaceAll('/', '')
    .replace(/\.$/, '')
    .replace(/\.tv$/, '')
    .replace(/\.tv old$/, '');
  const expectedImageKey = trimmedStudioName + (isSubs ? '-s' : '');

  let imageKey = studioLogosList.find(item => item.toLowerCase() === expectedImageKey);

  if (!imageKey && isSubs) {
    logger.warn('Failed to find logo; using default icon for subs', { studioName });
    imageKey = '!Subs';
  }

  if (!imageKey) {
    logger.warn('Failed to find logo', { studioName });
    return undefined;
  }

  return config.value.assets.studioLogosUrl.replace('{image-key}', encodeURIComponent(imageKey));
}
