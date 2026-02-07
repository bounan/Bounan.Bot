interface AniManConfig {
  getAnimeFunctionName: string;
}

interface LoanApiConfig {
  functionArn: string;
}

interface TelegramConfig {
  token: string;

  videoChatId: number;
  publisherGroupName: string;
}

interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
}

interface AssetsConfig {
  studioLogosUrl: string;
}

interface DatabaseConfig {
  usersTableName: string;
  subscriptionsTableName: string;
  libraryTableName: string;
}

export interface Config {
  animan: AniManConfig;
  loanApi: LoanApiConfig;
  database: DatabaseConfig;
  telegram: TelegramConfig;
  retry: RetryConfig;
  assets: AssetsConfig;
}
