import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Runtime, Architecture } from 'aws-cdk-lib/aws-lambda';

export class HyperledgerWorkerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const queue = new sqs.Queue(this, 'HyperledgerWorkerQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
      fifo: true,
      deduplicationScope: sqs.DeduplicationScope.MESSAGE_GROUP,
      fifoThroughputLimit: sqs.FifoThroughputLimit.PER_MESSAGE_GROUP_ID
    });

    const lambdaFunction = new lambda.NodejsFunction(this, 'Function', {
      entry: './src/index.ts',
      handler: 'index.handler',
      functionName: 'SqsMessageHandler',
      runtime: Runtime.NODEJS_18_X,
      architecture: Architecture.ARM_64,
      bundling: {
        nodeModules: [
          '@hyperledger/fabric-gateway',
          'fs',
          'path',
          'crypto',
          'grpc'
        ],
        commandHooks: {
          beforeBundling(inputDir: string, outputDir: string): string[] {
            return [
              `cp -r ${inputDir}/certs ${outputDir}/certs`,
            ];
          },
          afterBundling(inputDir: string, outputDir: string): string[] {
            return [];
          },
          beforeInstall(inputDir: string, outputDir: string): string[] {
            return [];
          },
        }
      }
    });

    const eventSource = new lambdaEventSources.SqsEventSource(queue);

    lambdaFunction.addEventSource(eventSource);

  }
}
