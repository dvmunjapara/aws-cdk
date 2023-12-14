//Create an IAM Role for API Gateway to assume

import {Construct} from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime} from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import {ConfigProps} from "../../config";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import {BundlingOptions} from "aws-cdk-lib/aws-lambda-nodejs/lib/types";

/**
 * These are the properties expected by the SQSIntegration Construct
 */
export interface IHyperledgerLambdaIntegrationProps {
  config: ConfigProps;
}

/**
 * This Construct creates the integration options needed to attach to a REST API Method
 */
export default class HyperledgerLambdaIntegration extends Construct {

  store_transaction: lambda.NodejsFunction;
  get_transaction: lambda.NodejsFunction;
  search_transaction: lambda.NodejsFunction;

  constructor(scope: Construct, id: string, props: IHyperledgerLambdaIntegrationProps) {
    super(scope, id);

    /**
     * Create the VPC that will be used by the Lambda function
     */
    const vpc = ec2.Vpc.fromLookup(this, 'HyperledgerVPC', {
      vpcId: props.config.VPC_ID,
    });

    /**
     * Hyperledger Fabric Gateway requires the following node modules to be bundled
     * */
    const building: BundlingOptions = {
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

    /**
     * Create the SQS Integration that allows POST method calls from Api Gateway to enqueue messages
     * in the message queue.
     */
    this.store_transaction = new lambda.NodejsFunction(this, 'StoreTransaction', {
      entry: './src/hyperledger/store.ts',
      handler: 'index.handler',
      functionName: 'storeTransaction',
      runtime: Runtime.NODEJS_18_X,
      timeout: cdk.Duration.minutes(5),
      vpc: vpc,
      environment: props.config,
      memorySize: 1024,
      bundling: building
    });

    /**
     * Create API Gateway for the Lambda Function to fetch the transaction
     */
    this.get_transaction = new lambda.NodejsFunction(this, 'GetTransaction', {
      entry: './src/hyperledger/show.ts',
      handler: 'index.handler',
      functionName: 'getTransaction',
      runtime: Runtime.NODEJS_18_X,
      timeout: cdk.Duration.minutes(5),
      vpc: vpc,
      environment: props.config,
      bundling: building
    });

    /**
     * Create API Gateway for the Lambda Function to search the transaction
     */
    this.search_transaction = new lambda.NodejsFunction(this, 'SearchTransaction', {
      entry: './src/hyperledger/search.ts',
      handler: 'index.handler',
      functionName: 'searchTransaction',
      runtime: Runtime.NODEJS_18_X,
      timeout: cdk.Duration.minutes(5),
      vpc: vpc,
      environment: {
        COUCHDB_HOST: props.config.COUCHDB_HOST,
        COUCHDB_DATABASE: props.config.COUCHDB_DATABASE,
      },
      memorySize: 1024,
      bundling: {
        nodeModules: [
          'nano'
        ],
      }
    });
  }
}
