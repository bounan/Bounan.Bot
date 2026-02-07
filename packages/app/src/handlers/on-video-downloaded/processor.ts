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
      console.error('Error copying message: ', JSON.stringify(result));
    }

    await new Promise(resolve => setTimeout(resolve, 100)); // to avoid rate limits
  }
}

const sendErrorMessages = async (caption: string, keyboard: InlineKeyboardMarkup, chatIds: Set<number>): Promise<void> => {
  console.log('Sending error messages');

  for (const chatId of chatIds) {
    const messageToSend: SendMessageData = {
      chat_id: chatId,
      text: Texts.ErrorOnEpisode + '\n' + caption,
      reply_markup: keyboard,
      parse_mode: 'HTML',
    };

    const result = await sendMessage(messageToSend);
    if (!result.ok) {
      console.error('Error sending error message: ', JSON.stringify(result));
    }

    await new Promise(resolve => setTimeout(resolve, 100)); // to avoid rate limits
  }
}

export const process = async (videoDownloadedNotification: VideoDownloadedNotification): Promise<void> => {
  console.log('Processing videos: ', JSON.stringify(videoDownloadedNotification));
  const { myAnimeListId, dub, episode } = videoDownloadedNotification.videoKey;

  const animeSubscriptions = await getSubscriptions(videoDownloadedNotification.videoKey);
  if (!animeSubscriptions) {
    console.log('No subscriptions found for this video');
    return;
  }

  const oneTimeSubscribers = animeSubscriptions.oneTimeSubscribers?.[episode];
  if (!oneTimeSubscribers || !oneTimeSubscribers.size) {
    console.log('No subscribers for this video');
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
      registerVideo(myAnimeListId, dub),
      removeOneTimeSubscribers(videoKey),
      sendVideoMessages(messageId, description, keyboard, oneTimeSubscribers),
    ])
  } else {
    await sendErrorMessages(description, keyboard, oneTimeSubscribers);
  }

  console.log('Animes processed');
}