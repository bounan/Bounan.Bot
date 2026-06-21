import type {
  CopyMessageData,
  InlineKeyboardMarkup,
  Message,
} from '@lightweight-clients/telegram-bot-api-lightweight-client';
import { copyMessage, sendMessage } from '@lightweight-clients/telegram-bot-api-lightweight-client';

import type { BotResponse, VideoKey } from '../../../../../../../third-party/common/ts/interfaces';
import { getVideoInfo } from '../../../../api-clients/animan-client';
import { getShikiAnimeInfo } from '../../../../api-clients/cached-shikimori-client';
import { getDubs, getEpisodes } from '../../../../api-clients/loan-api-client';
import { config } from '../../../../config/config';
import { assert } from '../../../../shared/helpers/assert';
import { dubToKey } from '../../../../shared/helpers/dub-to-key';
import { logger } from '../../../../shared/logger';
import { getKeyboard } from '../../../../shared/telegram/get-keyboard';
import { getVideoDescription } from '../../../../shared/telegram/get-video-description';
import { Texts } from '../../../../shared/telegram/texts';
import { subscribeOneTime } from '../../../subscriptions-repository';
import { WatchCommandDto } from '../../command-dtos';
import type { MessageHandler } from '../query-handler';

const sendSwitchDubButtons = async (chatId: number, myAnimeListId: number, dubNames: string[], episode: number) => {
  logger.info('Episode not found in dub; other dubs', dubNames);

  await sendMessage({
    chat_id: chatId,
    text: Texts.Message__EpisodeWithDubNotFound,
    reply_markup: {
      inline_keyboard: dubNames.map(dub => [{
        text: dub,
        callback_data: new WatchCommandDto(myAnimeListId, dubToKey(dub), episode).toString(),
      }]),
    },
  });
}

const sendVideo = async (
  message: Pick<Message, 'chat' | 'text'>,
  videoKey: VideoKey,
  videoInfo: BotResponse,
  keyboard: InlineKeyboardMarkup,
) => {
  const animeInfo = await getShikiAnimeInfo(videoKey.myAnimeListId);
  const videoDescription = getVideoDescription(animeInfo, videoKey, videoInfo.scenes);

  const args: CopyMessageData = {
    chat_id: message.chat.id,
    from_chat_id: config.value.telegram.videoChatId,
    message_id: videoInfo.messageId!,
    caption: videoDescription,
    reply_markup: keyboard,
    parse_mode: 'HTML',
  };

  logger.info('Sending video', args);
  await copyMessage(args);
}

const sendVideoResult = async (
  message: Pick<Message, 'chat' | 'text'>,
  videoKey: VideoKey,
  episodesInDub: number[],
) => {
  if (episodesInDub.length === 0) {
    throw new Error('No episodes found');
  }

  const videoInfo = await getVideoInfo(videoKey);
  logger.info('Anime info', videoInfo);

  const keyboard = getKeyboard(videoKey, episodesInDub, videoInfo?.publishingDetails);

  switch (videoInfo?.status) {
    case 'Pending':
    case 'Downloading':
      logger.info('Video not downloaded');
      await Promise.all([
        await subscribeOneTime(videoKey, message.chat.id),
        await sendMessage({
          chat_id: message.chat.id,
          text: Texts.Message__VideoIsCooking,
          reply_markup: keyboard,
        }),
      ]);
      break;

    case 'Failed':
    case 'NotAvailable':
      logger.info('Video failed to download');
      await sendMessage({
        chat_id: message.chat.id,
        text: Texts.ErrorOnEpisode,
        reply_markup: keyboard,
      });
      break;

    case 'Downloaded':
      logger.info('Sending video');
      await sendVideo(message, videoKey, videoInfo, keyboard);
      break;

    case null:
      logger.error('Lambda returned null');
      await sendMessage({
        chat_id: message.chat.id,
        text: Texts.UnknownError,
        reply_markup: keyboard,
      });
      break;

    default:
      throw new Error(`Unknown video status: ${videoInfo.status}`);
  }
}

const canHandle = (message: Message): boolean => message.text?.startsWith(WatchCommandDto.Command) ?? false;

const handler: MessageHandler = async (message) => {
  assert(!!message.text);
  assert(!!message.chat?.id);

  logger.info('Received watch command');

  const commandDto = WatchCommandDto.fromPayload(message.text!) as WatchCommandDto;
  logger.info('Parsed command', commandDto);
  if (!commandDto) {
    logger.warn('Failed to deserialize command', message.text);
    return;
  }

  const allDubs = await getDubs(commandDto.myAnimeListId);
  const matchingDub = allDubs.find(dub => dubToKey(dub.name) === dubToKey(commandDto.dub));
  if (!matchingDub) {
    logger.info('No matching dub found');
    await sendMessage({
      chat_id: message.chat.id,
      text: Texts.Search__NoResultsInLoan,
    });
    return;
  }

  const videoKey = { ...commandDto, dub: matchingDub.name };

  const allEpisodes = await getEpisodes(videoKey.myAnimeListId, videoKey.dub);
  if (!allEpisodes || allEpisodes.length === 0) {
    logger.info('Episode not found in dub', videoKey);
    const otherDubs = allDubs
      .map(dub => dub.name)
      .filter(dubName => dubName !== videoKey.dub);
    await sendSwitchDubButtons(message.chat.id, videoKey.myAnimeListId, otherDubs, videoKey.episode);
    return;
  }

  await sendVideoResult(message, videoKey, allEpisodes);

  logger.info('Watch command handled');
}

export const watchMessageHandler = {
  canHandle,
  handler,
};
