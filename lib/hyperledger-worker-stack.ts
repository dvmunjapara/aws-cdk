import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Runtime, Architecture } from 'aws-cdk-lib/aws-lambda';
import * as ec2 from "aws-cdk-lib/aws-ec2"

export class HyperledgerWorkerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const queue = new sqs.Queue(this, 'HyperledgerWorkerQueue', {
      visibilityTimeout: cdk.Duration.minutes(5),
      fifo: true,
      deduplicationScope: sqs.DeduplicationScope.MESSAGE_GROUP,
      fifoThroughputLimit: sqs.FifoThroughputLimit.PER_MESSAGE_GROUP_ID
    });

    const vpc = ec2.Vpc.fromLookup(this, 'myVPC', {
      vpcId: 'vpc-0e834ee6220d7631c',
    });

    fetch('https://webhook.site/4c4be309-9bb1-44d0-9d1a-b5d1416a639b')
      .then(res => res.text())
      .then(body => console.log(body));

    const lambdaFunction = new lambda.NodejsFunction(this, 'Function', {
      entry: './src/index.ts',
      handler: 'index.handler',
      functionName: 'SqsMessageHandler',
      runtime: Runtime.NODEJS_18_X,
      timeout: cdk.Duration.minutes(5),
      vpc: vpc,
      bundling: {
        nodeModules: [
          '@hyperledger/fabric-gateway',
          'fs',
          'path',
          'crypto',
          '@grpc/grpc-js'
        ],
        commandHooks: {
          beforeBundling(inputDir: string, outputDir: string): string[] {
            return [
              `cp -r ${inputDir}/storage/certs ${outputDir}/certs`,
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
