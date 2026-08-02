import type {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
} from '@lightweight-clients/telegram-bot-api-lightweight-client';

import type { PublishingDetails, VideoKey } from '../../../../../third-party/common/ts/interfaces';
import { config } from '../../config/config';
import { InfoCommandDto, WatchCommandDto } from '../../handlers/on-webhook/command-dtos';
import { dubToKey } from '../helpers/dub-to-key';
import { Texts } from './texts';

const COLUMNS = 7;
const ROWS = 3;

const getEpisodeRows = (
  currentVideo: VideoKey,
  episodesPerPage: number[][],
  currentPageIndex: number,
): InlineKeyboardButton[][] => {
  if (episodesPerPage.length === 1 && episodesPerPage[0].length === 1) {
    return [];
  }

  const buttonsToDisplay = episodesPerPage[currentPageIndex];

  return buttonsToDisplay
    .map((ep) =>
      ep === currentVideo.episode
        ? { text: `[${ep}]`, url: 'tg://placeholder' }
        : {
            text: ep.toString(),
            callback_data: new WatchCommandDto(currentVideo.myAnimeListId, dubToKey(currentVideo.dub), ep).toString(),
          },
    )
    .map((btn, index) => ({ btn, index }))
    .reduce((acc, { btn, index }) => {
      const groupIndex = Math.floor(index / COLUMNS);
      acc[groupIndex] = [...(acc[groupIndex] || []), btn];
      return acc;
    }, [] as InlineKeyboardButton[][]);
};

const getControlRow = (
  currentVideo: VideoKey,
  publishingDetails: PublishingDetails | undefined,
  currentPageIndex: number,
  episodesPerPage: number[][],
): InlineKeyboardButton[] => {
  const controlRow: InlineKeyboardButton[] = [
    { text: Texts.Button__AboutTitle, callback_data: new InfoCommandDto(currentVideo.myAnimeListId).toString() },
  ];

  if (publishingDetails) {
    controlRow.push({
      text: Texts.Button__AllEpisodes,
      url: `https://t.me/${config.value.telegram.publisherGroupName}/${publishingDetails.threadId}/${publishingDetails.messageId}`,
    });
  }

  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === episodesPerPage.length - 1;

  if (!isFirstPage) {
    const previousEpisode = episodesPerPage[currentPageIndex - 1].at(-1);
    if (previousEpisode === undefined) {
      throw new Error('Previous episode page is empty');
    }

    controlRow.unshift({
      text: Texts.Button__PreviousEpisode,
      callback_data: new WatchCommandDto(
        currentVideo.myAnimeListId,
        dubToKey(currentVideo.dub),
        previousEpisode,
      ).toString(),
    });
  }

  if (!isLastPage) {
    controlRow.push({
      text: Texts.Button__NextEpisode,
      callback_data: new WatchCommandDto(
        currentVideo.myAnimeListId,
        dubToKey(currentVideo.dub),
        episodesPerPage[currentPageIndex + 1][0],
      ).toString(),
    });
  }

  return controlRow;
};

export const getKeyboard = (
  currentVideo: VideoKey,
  allEpisodes: number[],
  publishingDetails: PublishingDetails | undefined,
): InlineKeyboardMarkup => {
  const episodesPerPage = allEpisodes
    .filter((ep, i, arr) => arr.indexOf(ep) === i) // distinct
    .sort((a, b) => a - b)
    .reduce((acc, ep, i) => {
      const pageIndex = Math.floor(i / (COLUMNS * ROWS));
      acc[pageIndex] = [...(acc[pageIndex] || []), ep];
      return acc;
    }, [] as number[][]);

  const currentPageIndex = episodesPerPage.findIndex((page) => page.includes(currentVideo.episode));

  const episodeRows = getEpisodeRows(currentVideo, episodesPerPage, currentPageIndex);
  const controlRow = getControlRow(currentVideo, publishingDetails, currentPageIndex, episodesPerPage);

  return {
    inline_keyboard: [...episodeRows, controlRow],
  };
};
