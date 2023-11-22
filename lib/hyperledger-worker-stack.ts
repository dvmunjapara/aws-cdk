import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Runtime, Architecture } from 'aws-cdk-lib/aws-lambda';
import * as ec2 from "aws-cdk-lib/aws-ec2"
import {ConfigProps} from "./config";
import {StackProps} from "aws-cdk-lib";
import * as ApiGW from 'aws-cdk-lib/aws-apigateway';
import * as IAM from 'aws-cdk-lib/aws-iam';
import {sqsResponseTemplate} from "./templates/sqs-response.template";

type AwsEnvStackProps = StackProps & {
  config: Readonly<ConfigProps>;
};

export class HyperledgerWorkerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AwsEnvStackProps, ) {
    super(scope, id, props);

    const { config } = props;

    const apigatewayRole = new IAM.Role(this, 'apigateway-role', {
      assumedBy: new IAM.ServicePrincipal('apigateway.amazonaws.com'),
    });

    const queue = new sqs.Queue(this, 'HyperledgerWorkerQueue', {
      visibilityTimeout: cdk.Duration.minutes(5),
      fifo: true,
      deduplicationScope: sqs.DeduplicationScope.MESSAGE_GROUP,
      fifoThroughputLimit: sqs.FifoThroughputLimit.PER_MESSAGE_GROUP_ID
    });

    queue.grantSendMessages(apigatewayRole);

    /*
    const sendMessageIntegration = new ApiGW.AwsIntegration({
      service: 'sqs',
      path: `${process.env.CDK_DEFAULT_ACCOUNT}/${queue.queueName}`,
      integrationHttpMethod: 'POST',
      options: {
        credentialsRole: apigatewayRole,
        requestParameters: {
          'integration.request.header.Content-Type': `'application/json'`,
        },
        requestTemplates: {
          'application/json': 'Action=SendMessage&MessageBody=$input.body',
        },
        integrationResponses: [
          {
            statusCode: '200',
          },
          {
            statusCode: '400',
          },
          {
            statusCode: '500',
          }
        ]
      },
    });

    const api = new ApiGW.RestApi(this, 'api', {});

    api.root.addMethod('POST', sendMessageIntegration, {
      operationName: 'store-transaction',
      authorizationType: ApiGW.AuthorizationType.NONE,
      methodResponses: [
        {
          statusCode: '400',
        },
        {
          statusCode: '200',
        },
        {
          statusCode: '500',
        }
      ]
    });*/


    const integrationResponse: ApiGW.IntegrationResponse = {
      statusCode: "200",
      responseTemplates: {
        "application/json": sqsResponseTemplate,
      },
    };

    const restApi = new ApiGW.RestApi(this, "API Endpoint", {
      deployOptions: {
        stageName: "sandbox",
      },
      restApiName: "APIGWtoSQSApi",
    });

    const integration = new ApiGW.AwsIntegration({
      service: "sqs",
      path: `${process.env.CDK_DEFAULT_ACCOUNT}/${queue.queueName}`,
      integrationHttpMethod: "POST",
      options: {
        credentialsRole: apigatewayRole,
        requestParameters: {
          'integration.request.header.Content-Type': `'application/json'`,
        },
        requestTemplates: {
          "application/json": `Action=SendMessage&MessageBody=$input.body`,
        },
        integrationResponses: [integrationResponse]
      },
    });

    const methodResponse: ApiGW.MethodResponse = {
      statusCode: "200",
      responseModels: { "application/json": ApiGW.Model.EMPTY_MODEL },
    };

    const methodOptions: ApiGW.MethodOptions = {
      methodResponses: [methodResponse],
      operationName: 'store-transaction',
      authorizationType: ApiGW.AuthorizationType.NONE,
    }

    const resource = restApi.root.resourceForPath('/store-transaction');

    resource.addMethod(
      "POST",
      integration,
      methodOptions
    );

    const vpc = ec2.Vpc.fromLookup(this, 'myVPC', {
      vpcId: 'vpc-05093ee4e6f5e5259',
    });

    const lambdaFunction = new lambda.NodejsFunction(this, 'Function', {
      entry: './src/index.ts',
      handler: 'index.handler',
      functionName: 'SqsMessageHandler',
      runtime: Runtime.NODEJS_18_X,
      timeout: cdk.Duration.minutes(5),
      vpc: vpc,
      environment: config,
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
