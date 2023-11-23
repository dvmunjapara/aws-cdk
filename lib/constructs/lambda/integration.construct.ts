//Create an IAM Role for API Gateway to assume

import {Construct} from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime} from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import {ConfigProps} from "../../config";
import * as ec2 from "aws-cdk-lib/aws-ec2";

/**
 * These are the properties expected by the SQSIntegration Construct
 */
export interface ILambdaIntegrationProps {
  config: ConfigProps;
}

/**
 * This Construct creates the integration options needed to attach to a REST API Method
 */
export class LambdaIntegration extends Construct {
  store_media: lambda.NodejsFunction; // this will be used by the parent stack to combine with other Constructs

  constructor(scope: Construct, id: string, props: ILambdaIntegrationProps) {
    super(scope, id);


    /**
     * Create the VPC that will be used by the Lambda function
     */
    const vpc = ec2.Vpc.fromLookup(this, 'myVPC', {
      vpcId: props.config.VPC_ID,
    });

    /**
     * Create the SQS Integration that allows POST method calls from Api Gateway to enqueue messages
     * in the message queue. *Note the use of "Stack.of" as Constructs do not have the "account" property
     * that you would find on the Stack object.
     */
    this.store_media = new lambda.NodejsFunction(this, 'Function', {
      entry: './src/index.ts',
      handler: 'index.handler',
      functionName: 'storeMedia',
      runtime: Runtime.NODEJS_18_X,
      timeout: cdk.Duration.minutes(5),
      vpc: vpc,
      environment: props.config,
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
  }
}