import type {
  CopyMessageData,
  InlineKeyboardMarkup,
  SendMessageData,
} from '@lightweight-clients/telegram-bot-api-lightweight-client';
import { copyMessage, sendMessage } from '@lightweight-clients/telegram-bot-api-lightweight-client';

import type { VideoDownloadedNotification } from '../../../../../third-party/common/ts/interfaces';
import { getShikiAnimeInfo } from '../../api-clients/cached-shikimori-client';
import { getEpisodes } from '../../api-clients/loan-api-client';
import { config } from '../../config/config';
import { logger } from '../../shared/logger';
import { getKeyboard } from '../../shared/telegram/get-keyboard';
import { getVideoDescription } from '../../shared/telegram/get-video-description';
import { Texts } from '../../shared/telegram/texts';
import { registerVideo } from '../library-repository';
import { getSubscriptions, removeOneTimeSubscribers } from '../subscriptions-repository';

const sendVideoMessages = async (
  videoMessageId: number,
  caption: string,
  keyboard: InlineKeyboardMarkup,
  chatIds: Set<number>,
): Promise<void> => {
  for (const chatId of chatIds) {
    const messageToSend: CopyMessageData = {
      chat_id: chatId,
      caption,
      message_id: videoMessageId,
      from_chat_id: config.value.telegram.videoChatId,
      reply_markup: keyboard,
      parse_mode: 'HTML',
    };

    const result = await copyMessage(messageToSend);
    if (!result.ok) {
      logger.error('Error copying message', result);
    }

    await new Promise(resolve => setTimeout(resolve, 100)); // to avoid rate limits
  }
}

const sendErrorMessages = async (caption: string, keyboard: InlineKeyboardMarkup, chatIds: Set<number>): Promise<void> => {
  logger.info('Sending error messages');

  for (const chatId of chatIds) {
    const messageToSend: SendMessageData = {
      chat_id: chatId,
      text: Texts.ErrorOnEpisode + '\n' + caption,
      reply_markup: keyboard,
      parse_mode: 'HTML',
    };

    const result = await sendMessage(messageToSend);
    if (!result.ok) {
      logger.error('Error sending error message', result);
    }

    await new Promise(resolve => setTimeout(resolve, 100)); // to avoid rate limits
  }
}

const notifySubscribers = async (
  videoDownloadedNotification: VideoDownloadedNotification,
): Promise<void> => {
  const { myAnimeListId, dub, episode } = videoDownloadedNotification.videoKey;

  const animeSubscriptions = await getSubscriptions(videoDownloadedNotification.videoKey);
  if (!animeSubscriptions) {
    logger.info('No subscriptions found for this video');
    return;
  }

  const oneTimeSubscribers = animeSubscriptions.oneTimeSubscribers?.[episode];
  if (!oneTimeSubscribers || !oneTimeSubscribers.size) {
    logger.info('No subscribers for this video');
    return;
  }

  const animeInfo = await getShikiAnimeInfo(myAnimeListId);

  const description = getVideoDescription(
    animeInfo,
    videoDownloadedNotification.videoKey,
    videoDownloadedNotification.scenes);
  const episodes = await getEpisodes(parseInt(animeInfo.id), dub);
  const keyboard = getKeyboard(
    videoDownloadedNotification.videoKey,
    episodes,
    videoDownloadedNotification.publishingDetails,
  );

  if (videoDownloadedNotification.messageId) {
    const { videoKey, messageId } = videoDownloadedNotification;
    await Promise.all([
      removeOneTimeSubscribers(videoKey),
      sendVideoMessages(messageId, description, keyboard, oneTimeSubscribers),
    ])
  } else {
    await sendErrorMessages(description, keyboard, oneTimeSubscribers);
  }
}

const registerInLibraryTable = async (videoDownloadedNotification: VideoDownloadedNotification): Promise<void> => {
  const { myAnimeListId, dub } = videoDownloadedNotification.videoKey;
  await registerVideo(myAnimeListId, dub);
}

export const process = async (videoDownloadedNotification: VideoDownloadedNotification): Promise<void> => {
  logger.info('Processing videos', videoDownloadedNotification);

  if (videoDownloadedNotification.messageId) {
    await Promise.all([
      notifySubscribers(videoDownloadedNotification),
      registerInLibraryTable(videoDownloadedNotification),
    ]);
  } else {
    await notifySubscribers(videoDownloadedNotification);
  }

  logger.info('Animes processed');
}
