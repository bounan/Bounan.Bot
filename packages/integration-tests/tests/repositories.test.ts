import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { DynamoDbTableFixture } from '../tools/dynamodb';

describe('Bounan DynamoDB records', () => {
  it('stores a library entry with its available dubs', async () => {
    const table = await DynamoDbTableFixture.create(
      `test-table-${randomUUID()}`,
      { name: 'myAnimeListId', type: 'N' },
    );

    try {
      const record = {
        myAnimeListId: 1,
        dubs: new Set(['AniLibria', 'AniDUB']),
      };

      await table.put(record);

      await expect(table.getAll()).resolves.toEqual([record]);
    }
    finally {
      await table.drop();
    }
  });

  it('stores one-time episode subscribers', async () => {
    const table = await DynamoDbTableFixture.create(
      `test-table-${randomUUID()}`,
      { name: 'animeKey', type: 'S' },
    );

    try {
      const record = {
        animeKey: '1#AniLibria',
        oneTimeSubscribers: {
          1: new Set([123, 456]),
        },
      };

      await table.put(record);

      await expect(table.getAll()).resolves.toEqual([record]);
    }
    finally {
      await table.drop();
    }
  });
});
