import type * as cdk from 'aws-cdk-lib';

import { ExportNames } from '../../../third-party/common/ts/cdk/export-names';
import { getCfnValue, getSsmValue } from '../../../third-party/common/ts/cdk/helpers';
import configFile from './configuration.json';

export interface Config {
  alertEmail: string;
  loanApiFunctionArn: string;

  telegramBotToken: string;
  telegramBotVideoChatId: string;
  telegramBotPublisherGroupName: string;

  getAnimeFunctionName: string;
  videoDownloadedTopicArn: string;

  retriesMax: string;
  retriesDelayMs: string;
  studioLogosUrl: string;
}

export const getConfig = (stack: cdk.Stack, cfnPrefix: string, ssmPrefix: string): Config => ({
  alertEmail: getCfnValue('alertEmail', cfnPrefix, ExportNames.AlertEmail, configFile),
  loanApiFunctionArn: getCfnValue('loanApiFunctionArn', cfnPrefix, ExportNames.LoanApiFunctionArn, configFile),

  telegramBotToken: getSsmValue(stack, ssmPrefix, 'telegramBotToken', configFile),
  telegramBotVideoChatId: getSsmValue(stack, ssmPrefix, 'telegramBotVideoChatId', configFile),
  telegramBotPublisherGroupName: getSsmValue(stack, ssmPrefix, 'telegramBotPublisherGroupName', configFile),

  getAnimeFunctionName: getCfnValue('getAnimeFunctionName', cfnPrefix, ExportNames.GetAnimeFunctionName, configFile),
  videoDownloadedTopicArn: getCfnValue('videoDownloadedTopicArn', cfnPrefix, ExportNames.VideoDownloadedSnsTopicArn, configFile),

  retriesMax: configFile.retriesMax || '1',
  retriesDelayMs: configFile.retriesDelayMs || '1000',
  studioLogosUrl: getSsmValue(stack, ssmPrefix, 'studioLogosUrl', configFile),
});