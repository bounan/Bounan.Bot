import {
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

export class DynamoDbTableFixture {
  private readonly client: DynamoDBClient;
  private readonly documentClient: DynamoDBDocumentClient;

  private constructor(public readonly tableName: string) {
    this.client = new DynamoDBClient({});
    this.documentClient = DynamoDBDocumentClient.from(this.client);
  }

  static async create(
    tableName: string,
    partitionKey: { name: string; type: 'N' | 'S' },
  ): Promise<DynamoDbTableFixture> {
    if (!tableName.startsWith('test-table-')) {
      throw new Error('Integration-test table names must start with "test-table-"');
    }

    const fixture = new DynamoDbTableFixture(tableName);
    await fixture.documentClient.send(new CreateTableCommand({
      TableName: tableName,
      AttributeDefinitions: [{ AttributeName: partitionKey.name, AttributeType: partitionKey.type }],
      KeySchema: [{ AttributeName: partitionKey.name, KeyType: 'HASH' }],
      BillingMode: 'PAY_PER_REQUEST',
    }));
    await waitUntilTableExists(
      { client: fixture.client, maxWaitTime: 30 },
      { TableName: tableName },
    );

    return fixture;
  }

  async put(record: Record<string, unknown>): Promise<void> {
    await this.documentClient.send(new PutCommand({ TableName: this.tableName, Item: record }));
  }

  async getAll(): Promise<Record<string, unknown>[]> {
    const result = await this.documentClient.send(new ScanCommand({ TableName: this.tableName }));
    return result.Items ?? [];
  }

  async drop(): Promise<void> {
    await this.documentClient.send(new DeleteTableCommand({ TableName: this.tableName }));
    this.client.destroy();
  }
}
