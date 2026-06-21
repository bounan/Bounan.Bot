import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

import { config } from '../config/config';
import type { LibraryEntity } from '../shared/database/entities/library-entity';
import { docClient } from '../shared/database/repository';
import { logger } from '../shared/logger';


export const registerVideo = async (myAnimeListId: number, dub: string): Promise<void> => {
  const command = new UpdateCommand({
    TableName: config.value.database.libraryTableName,
    Key: { myAnimeListId },
    UpdateExpression: 'ADD dubs :dub SET updatedAt = :date, createdAt = if_not_exists(createdAt, :date)',
    ExpressionAttributeValues: {
      ':dub': new Set([dub]),
      ':date': new Date().toISOString(),
    },
  });

  const result = await docClient.send(command);
  logger.info('Registered video', result);
}

export const getRegisteredDubs = async (myAnimeListId: number): Promise<Set<string>> => {
  const command = new GetCommand({
    TableName: config.value.database.libraryTableName,
    Key: { myAnimeListId },
    ProjectionExpression: 'dubs',
  });

  const result = await docClient.send(command);
  logger.info('Library entity', result.Item);

  return (result.Item as LibraryEntity)?.dubs || new Set<string>();
}
