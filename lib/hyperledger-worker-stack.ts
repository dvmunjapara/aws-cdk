import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import {ConfigProps} from "./config";
import {StackProps} from "aws-cdk-lib";
import * as ApiGW from 'aws-cdk-lib/aws-apigateway';
import {SQSApiGatewayRole} from './constructs/api/api-gateway-role.construct';
import {SQSIntegration} from "./constructs/sqs/integration.construct";
import {ApiMethodOptions} from './constructs/api/method-options.construct';
import {LambdaIntegration} from "./constructs/lambda/integration.construct";

type AwsEnvStackProps = StackProps & {
  config: Readonly<ConfigProps>;
};

export class HyperledgerWorkerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AwsEnvStackProps) {
    super(scope, id, props);

    const {config} = props;

    //Create the SQS Queue
    const queue = new sqs.Queue(this, 'HyperledgerWorkerQueue', {
      visibilityTimeout: cdk.Duration.minutes(5),
      fifo: true,
      deduplicationScope: sqs.DeduplicationScope.MESSAGE_GROUP,
      fifoThroughputLimit: sqs.FifoThroughputLimit.PER_MESSAGE_GROUP_ID,
      contentBasedDeduplication: true,
    });

    //Create a role assumed by the APIGW Principal with Allow send message to the SQS Queue
    const sqsApiGatewayRole = new SQSApiGatewayRole(
      this,
      "Api Gateway Role Construct",
      {
        messageQueue: queue,
      }
    );

    //Create an integration that allows the API to expose the SQS Queue
    const sqsIntegration = new SQSIntegration(
      this,
      "SQS Integration Construct",
      {
        messageQueue: queue,
        apiGatewayRole: sqsApiGatewayRole.role,
      }
    );

    //Create the API in ApiGateway
    const restApi = new ApiGW.RestApi(this, "API Endpoint", {
      deployOptions: {
        stageName: config.ENV,
      },
      restApiName: "HyperledgerWorkerApi",
      apiKeySourceType: ApiGW.ApiKeySourceType.HEADER,
    });

    const apiKey = new ApiGW.ApiKey(this, 'HyperledgerWorkerApiKey');

    const usagePlan = new ApiGW.UsagePlan(this, 'HyperledgerWorkerUsagePlan', {
      name: 'HyperledgerWorkerUsagePlan',
      apiStages: [
        {
          api: restApi,
          stage: restApi.deploymentStage,
        },
      ],
    });

    usagePlan.addApiKey(apiKey);

    //Create a method options object with validations and transformations
    const apiMethodOptions = new ApiMethodOptions(
      this,
      "API Method Options Construct",
      {
        restApi: restApi,
      }
    );

    //Create a Resource Method, that combines the sqs integration, message validation and transformation
    const storeResource = restApi.root.resourceForPath('/store-transaction');
    storeResource.addMethod(
      "POST",
      sqsIntegration.integration,
      apiMethodOptions.storeMethodOptions
    );

    //Added SQS Event Source to Lambda
    const lambdaIntegration = new LambdaIntegration(this, "Lambda Integration", {
      config,
    });

    const eventSource = new lambdaEventSources.SqsEventSource(queue);

    lambdaIntegration.store_transaction.addEventSource(eventSource);

    const getResource = restApi.root.resourceForPath("get-transaction");
    getResource.addResource("{id}")
      .addMethod("GET", new ApiGW.LambdaIntegration(lambdaIntegration.get_transaction));

    const searchResource = restApi.root.resourceForPath("search-transaction");
    getResource
      .addMethod("POST", new ApiGW.LambdaIntegration(lambdaIntegration.search_transaction));
  }
}
