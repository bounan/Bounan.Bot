import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { LlrtFunction } from 'cdk-lambda-llrt';
import type { Construct } from 'constructs';

import type { Config as RuntimeConfig } from '../../app/src/config/types';
import type { Config } from './config';
import { getConfig } from './config';

export class Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const config = getConfig(this, 'bounan:', '/bounan/bot/deploy-config/');

    const loanApiFunction = lambda.Function.fromFunctionAttributes(
      this, 'LoanApiFunction', {
        functionArn: config.loanApiFunctionArn,
        skipPermissions: true,
      });

    const logGroup = this.createLogGroup();
    const tables = this.createTables();
    const parameter = this.saveParameters(tables, config);
    const functions = this.createLambdas(logGroup, tables, parameter, loanApiFunction);
    this.setErrorAlarm(logGroup, config);

    const videoDownloadedTopic = sns.Topic.fromTopicArn(
      this, 'VideoDownloadedSnsTopic', config.videoDownloadedTopicArn);
    videoDownloadedTopic.addSubscription(
      new subs.LambdaSubscription(functions[LambdaHandler.OnVideoDownloaded]));

    const getAnimeLambda = lambda.Function.fromFunctionName(
      this, 'GetAnimeLambda', config.getAnimeFunctionName);
    getAnimeLambda.grantInvoke(functions[LambdaHandler.OnWebhook]);

    const apiGateway = new apigateway.RestApi(this, 'WebhookApi', {});
    apiGateway.root.addMethod('POST', new apigateway.LambdaIntegration(functions[LambdaHandler.OnWebhook]));

    this.out('Config', JSON.stringify(config));
    this.out(
      'SetWebhookUrl',
      `https://api.telegram.org/bot${config.telegramBotToken}/setWebhook?url=${apiGateway.url}`);
  }

  private get isStage(): boolean {
    return this.region === 'eu-central-1';
  }

  private createTables(): Record<Table, dynamodb.Table> {
    const capacity: Partial<dynamodb.TableProps> = {
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    };

    const usersTable = new dynamodb.Table(this, Table.Users, {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      deletionProtection: !this.isStage,
      ...capacity,
    });

    const subscriptionsTable = new dynamodb.Table(this, Table.Subscriptions, {
      partitionKey: { name: 'animeKey', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      deletionProtection: !this.isStage,
      ...capacity,
    });

    const libraryTable = new dynamodb.Table(this, Table.Library, {
      partitionKey: { name: 'myAnimeListId', type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      deletionProtection: !this.isStage,
      ...capacity,
    });

    return {
      [Table.Users]: usersTable,
      [Table.Subscriptions]: subscriptionsTable,
      [Table.Library]: libraryTable,
    }
  }

  private createLogGroup(): logs.LogGroup {
    return new logs.LogGroup(this, 'LogGroup', { retention: logs.RetentionDays.ONE_WEEK });
  }

  private setErrorAlarm(logGroup: logs.LogGroup, config: Config): void {
    const topic = new sns.Topic(this, 'LogGroupAlarmSnsTopic');
    topic.addSubscription(new subs.EmailSubscription(config.alertEmail));

    const metricFilter = logGroup.addMetricFilter('ErrorMetricFilter', {
      filterPattern: logs.FilterPattern.anyTerm('ERROR', 'Error', 'error', 'fail'),
      metricNamespace: this.stackName,
      metricName: 'ErrorCount',
      metricValue: '1',
    });

    const alarm = new cw.Alarm(this, 'LogGroupErrorAlarm', {
      metric: metricFilter.metric(),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });

    alarm.addAlarmAction(new cloudwatchActions.SnsAction(topic));
  }

  private createLambdas(
    logGroup: logs.LogGroup,
    tables: Record<Table, dynamodb.Table>,
    parameter: ssm.StringParameter,
    loanApiFunction: lambda.IFunction,
  ): Record<LambdaHandler, lambda.Function> {
    // @ts-expect-error - we know that the keys are the same
    const functions: Record<LambdaHandler, lambda.Function> = {};

    Object.entries(LambdaHandler).forEach(([lambdaName, handlerName]) => {
      const func = new LlrtFunction(this, lambdaName, {
        entry: `../app/src/handlers/${handlerName}/handler.ts`,
        handler: 'handler',
        logGroup,
        timeout: cdk.Duration.seconds(30),
      });

      tables[Table.Users].grantReadWriteData(func);
      tables[Table.Subscriptions].grantReadWriteData(func);
      tables[Table.Library].grantReadWriteData(func);
      parameter.grantRead(func);
      loanApiFunction.grantInvoke(func);

      functions[handlerName] = func;
    });

    return functions;
  }

  private saveParameters(
    tables: Record<Table, dynamodb.Table>,
    config: Config,
  ): ssm.StringParameter {
    const value = {
      animan: {
        getAnimeFunctionName: config.getAnimeFunctionName,
      },
      loanApi: {
        functionArn: config.loanApiFunctionArn,
      },
      database: {
        usersTableName: tables[Table.Users].tableName,
        subscriptionsTableName: tables[Table.Subscriptions].tableName,
        libraryTableName: tables[Table.Library].tableName,
      },
      telegram: {
        token: config.telegramBotToken,

        videoChatId: cdk.Token.asNumber(config.telegramBotVideoChatId),
        publisherGroupName: config.telegramBotPublisherGroupName,
      },
      retry: {
        maxAttempts: cdk.Token.asNumber(config.retriesMax),
        delayMs: cdk.Token.asNumber(config.retriesDelayMs),
      },
      assets: {
        studioLogosUrl: config.studioLogosUrl,
      },
    } as Required<RuntimeConfig>;

    return new ssm.StringParameter(this, '/bounan/bot/runtime-config', {
      parameterName: '/bounan/bot/runtime-config',
      stringValue: JSON.stringify(value, null, 2),
    });
  }

  private out(key: string, value: object | string): void {
    const output = typeof value === 'string' ? value : JSON.stringify(value);
    new cdk.CfnOutput(this, key, { value: output });
  }
}

enum Table {
  Users = 'users',
  Subscriptions = 'subscriptions',
  Library = 'library',
}

enum LambdaHandler {
  OnWebhook = 'on-webhook',
  OnVideoDownloaded = 'on-video-downloaded',
}
