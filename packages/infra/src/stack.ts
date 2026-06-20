import * as cfn from 'aws-cdk-lib';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import type * as lambda from 'aws-cdk-lib/aws-lambda';
import { LoggingFormat } from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { LlrtFunction } from 'cdk-lambda-llrt';
import type { Construct } from 'constructs';

import type { Config as RuntimeConfig } from '../../app/src/config/types';
import type { AnimeEntity } from '../../app/src/models/anime-entity';
import type { Config } from './config';
import { getConfig } from './config';

export class ToFillCdkStack extends cfn.Stack {
  constructor(scope: Construct, id: string, props?: cfn.StackProps) {
    super(scope, id, props);

    const config = getConfig('bounan:');

    const table = this.createTable();
    const logGroup = this.createLogGroup();
    const parameter = this.saveParameters(table);
    this.createLambdas(table, logGroup, parameter);
    this.setErrorAlarm(logGroup, config);

    this.out('Config', JSON.stringify(config));
  }

  private createTable(): dynamodb.Table {
    const keyProperty: keyof AnimeEntity = 'animeKey';

    return new dynamodb.Table(this, 'main', {
      partitionKey: { name: keyProperty, type: dynamodb.AttributeType.STRING },
      deletionProtection: true,
      removalPolicy: cfn.RemovalPolicy.RETAIN,
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    });
  }

  private createLogGroup(): logs.LogGroup {
    return new logs.LogGroup(this, 'LogGroup', {
      retention: logs.RetentionDays.ONE_WEEK,
    });
  }

  private setErrorAlarm(logGroup: logs.LogGroup, config: Config): void {
    const topic = new sns.Topic(this, 'LogGroupAlarmSnsTopic');
    topic.addSubscription(new subs.EmailSubscription(config.alertEmail));

    const metricFilter = logGroup.addMetricFilter('ErrorMetricFilter', {
      filterPattern: logs.FilterPattern.anyTerm('ERROR', 'error'),
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
    filesTable: dynamodb.Table,
    logGroup: logs.LogGroup,
    parameter: ssm.StringParameter,
  ): Record<LambdaHandler, lambda.Function> {
    // @ts-expect-error - we know that the keys are the same
    const functions: Record<LambdaHandler, lambda.Function> = {};

    Object.entries(LambdaHandler).forEach(([lambdaName, handlerName]) => {
      const func = new LlrtFunction(this, lambdaName, {
        entry: `../app/src/handlers/${handlerName}/handler.ts`,
        handler: 'handler',
        logGroup: logGroup,
        loggingFormat: LoggingFormat.JSON,
        timeout: cfn.Duration.seconds(30),
      });

      filesTable.grantReadWriteData(func);
      parameter.grantRead(func);

      functions[handlerName] = func;
    });

    return functions;
  }

  private saveParameters(filesTable: dynamodb.Table): ssm.StringParameter {
    const value = {
      database: {
        tableName: filesTable.tableName,
      },
    } as Required<RuntimeConfig>;

    return new ssm.StringParameter(this, '/bounan/tofill/runtime-config', {
      parameterName: '/bounan/tofill/runtime-config',
      stringValue: JSON.stringify(value, null, 2),
    });
  }

  private out(key: string, value: object | string): void {
    const output = typeof value === 'string' ? value : JSON.stringify(value);
    new cfn.CfnOutput(this, key, { value: output });
  }
}

enum LambdaHandler {
  OnVideoRegistered = 'on-video-registered',
  OnSchedule = 'on-schedule',
}
