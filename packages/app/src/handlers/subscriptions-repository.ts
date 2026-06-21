import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

import { config } from '../config/config';
import type { AnimeKey } from '../shared/database/entities/anime-key';
import type { SubscriptionEntity } from '../shared/database/entities/subscription-entity';
import type { VideoKey } from '../shared/database/entities/video-key';
import { docClient } from '../shared/database/repository';
import { logger } from '../shared/logger';

const getAnimeKey = (animeKey: AnimeKey): string => {
  return `${animeKey.myAnimeListId}#${animeKey.dub}`;
}

type GetSubscriptionsResult = Pick<SubscriptionEntity, 'oneTimeSubscribers'>;

export const getSubscriptions = async (animeKey: AnimeKey): Promise<GetSubscriptionsResult | undefined> => {
  const command = new GetCommand({
    TableName: config.value.database.subscriptionsTableName,
    Key: { animeKey: getAnimeKey(animeKey) },
    ProjectionExpression: 'oneTimeSubscribers',
  });

  const result = await docClient.send(command);
  logger.info('Subscriptions', result.Item);

  return result.Item as GetSubscriptionsResult;
}

export const subscribeOneTime = async (videoKey: VideoKey, chatId: number): Promise<void> => {
  const existingSubscriptions = await getSubscriptions(videoKey);

  if (existingSubscriptions?.oneTimeSubscribers?.[videoKey.episode]?.has(chatId)) {
    logger.info('User already subscribed to one-time notifications for this episode');
    return;
  }

  if (!existingSubscriptions || !existingSubscriptions.oneTimeSubscribers) {
    logger.info('Creating one-time subscribers map');
    const command = new UpdateCommand({
      TableName: config.value.database.subscriptionsTableName,
      Key: { animeKey: getAnimeKey(videoKey) },
      UpdateExpression: 'SET oneTimeSubscribers = :emptyMap',
      ExpressionAttributeValues: {
        ':emptyMap': {},
      },
      ConditionExpression: 'attribute_not_exists(oneTimeSubscribers)',
    });

    const result = await docClient.send(command);
    logger.info('Created one-time subscribers map', result);
  }

  const command = new UpdateCommand({
    TableName: config.value.database.subscriptionsTableName,
    Key: { animeKey: getAnimeKey(videoKey) },
    UpdateExpression: 'ADD oneTimeSubscribers.#episode :chatId SET updatedAt = :updatedAt, createdAt = if_not_exists(createdAt, :updatedAt)',
    ExpressionAttributeNames: {
      '#episode': videoKey.episode.toString(),
    },
    ExpressionAttributeValues: {
      ':chatId': new Set([chatId]),
      ':updatedAt': new Date().toISOString(),
    },
  });

  const result = await docClient.send(command);
  logger.info('Subscribed one-time', result);
}

export const removeOneTimeSubscribers = async (videoKey: VideoKey): Promise<void> => {
  const command = new UpdateCommand({
    TableName: config.value.database.subscriptionsTableName,
    Key: { animeKey: getAnimeKey(videoKey) },
    UpdateExpression: 'REMOVE oneTimeSubscribers.#episode SET updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#episode': videoKey.episode.toString(),
    },
    ExpressionAttributeValues: {
      ':updatedAt': new Date().toISOString(),
    },
    ConditionExpression: 'attribute_exists(animeKey)',
  });

  const result = await docClient.send(command);
  logger.info('Removed one-time subscribers', result);
}
