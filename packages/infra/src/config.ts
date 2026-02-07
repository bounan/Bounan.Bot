import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';

import { ExportNames } from '../../../third-party/common/ts/cdk/export-names';
import configFile from './configuration.json';

export interface Config {
  alertEmail: string;
  loanApiFunctionArn: string;

  telegramBotToken: string;
  telegramBotVideoChatId: string;
  telegramBotPublisherGroupName: string;

  getAnimeFunctionName: string;
  videoDownloadedTopicArn: string;

  loanApiMaxConcurrentRequests: string;
  retriesMax: string;
  retriesDelayMs: string;
  studioLogosUrl: string;
}

const getCfnValue = (key: keyof Config, prefix: string, exportSuffix: ExportNames): string => {
  return configFile[key] || cdk.Fn.importValue(prefix + exportSuffix);
}

const getSsmValue = (stack: cdk.Stack, prefix: string, parameterSuffix: keyof Config): string => {
  return configFile[parameterSuffix] || ssm.StringParameter.valueForStringParameter(stack, prefix + parameterSuffix);
}

export const getConfig = (stack: cdk.Stack, cfnPrefix: string, ssmPrefix: string): Config => ({
  alertEmail: getCfnValue('alertEmail', cfnPrefix, ExportNames.AlertEmail),
  loanApiFunctionArn: configFile['loanApiFunctionArn'],

  telegramBotToken: getSsmValue(stack, ssmPrefix, 'telegramBotToken'),
  telegramBotVideoChatId: getSsmValue(stack, ssmPrefix, 'telegramBotVideoChatId'),
  telegramBotPublisherGroupName: getSsmValue(stack, ssmPrefix, 'telegramBotPublisherGroupName'),

  getAnimeFunctionName: getCfnValue('getAnimeFunctionName', cfnPrefix, ExportNames.GetAnimeFunctionName),
  videoDownloadedTopicArn: getCfnValue('videoDownloadedTopicArn', cfnPrefix, ExportNames.VideoDownloadedSnsTopicArn),

  loanApiMaxConcurrentRequests: configFile.loanApiMaxConcurrentRequests || '6',
  retriesMax: configFile.retriesMax || '1',
  retriesDelayMs: configFile.retriesDelayMs || '1000',
  studioLogosUrl: getSsmValue(stack, ssmPrefix, 'studioLogosUrl'),
});