import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

import { config } from '../config/config';
import type { UserEntity } from '../shared/database/entities/user-entity';
import { UserStatus } from '../shared/database/entities/user-status';
import { docClient } from '../shared/database/repository';
import { logger } from '../shared/logger';

export const registerNewUserIfNotExists = async (userId: number): Promise<void> => {
  const command = new PutCommand({
    TableName: config.value.database.usersTableName,
    Item: {
      userId,
      directRank: 0,
      indirectRank: 0,
      requestedEpisodes: [],
      status: UserStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as UserEntity,
    ConditionExpression: 'attribute_not_exists(userId)',
  });

  let result: string;
  try {
    const response = await docClient.send(command);
    result = JSON.stringify(response);
  } catch (error) {
    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      result = 'User already exists';
    } else {
      throw error;
    }
  }

  logger.info('Register user result', result);
}

export const getUserStatus = async (userId: number): Promise<UserStatus> => {
  const response = await docClient.send(new GetCommand({
    TableName: config.value.database.usersTableName,
    Key: { userId },
    ProjectionExpression: '#status',
    ExpressionAttributeNames: { '#status': 'status' },
  }));

  return (response.Item as UserEntity).status;
}
