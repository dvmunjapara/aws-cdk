import {Construct} from "constructs";
import SQSApiGatewayQueue from "./sqs/queue";
import HyperledgerRole from "./role/hyperledger-role.construct";
import {ConfigProps} from "../config";
import HyperledgerSQSIntegration from "./sqs/hyperledger-sqs.construct";
import * as ApiGW from 'aws-cdk-lib/aws-apigateway';
import HyperledgerLambdaIntegration from "./lambda/hyperledger.construct";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import HyperledgerApi from "./api/hyperledger-api.construct";

interface IHyperledgerProps {
  config: ConfigProps;
  restApi: ApiGW.RestApi;
}

class Hyperledger extends Construct {

  constructor(scope: Construct, id: string, props: IHyperledgerProps) {
    super(scope, id);

    const {config, restApi} = props;

    //Create the SQS Queue
    const HyperledgerWorkerQueue = new SQSApiGatewayQueue(this, `HyperledgerWorkerQueue`, {
      env: config.ENV
    });

    //Create a role assumed by the ApiGW Principal with Allow to send message to the SQS Queue
    const hyperledgerRole = new HyperledgerRole(
      this,
      "Hyperledger Role Construct",
      {
        messageQueue: HyperledgerWorkerQueue.queue,
        env: config.ENV,
      }
    );

    //Create an integration that allows the API to expose the SQS Queue
    const hyperLedgerSqsIntegration = new HyperledgerSQSIntegration(
      this,
      `HyperLedger SQS Integration Construct`,
      {
        messageQueue: HyperledgerWorkerQueue.queue,
        apiGatewayRole: hyperledgerRole.role,
      }
    );

    //Create the Lambda Functions
    const lambda = new HyperledgerLambdaIntegration(this, "Hyperledger Lambda Integration", {
      config
    });

    //Added SQS Event Source to Lambda
    const eventSource = new lambdaEventSources.SqsEventSource(HyperledgerWorkerQueue.queue);
    lambda.store_transaction.addEventSource(eventSource);

    //Create the API in ApiGateway
    new HyperledgerApi(this, "Hyperledger API Construct", {
      searchTransaction: lambda.search_transaction,
      getTransaction: lambda.get_transaction,
      storeTransaction: hyperLedgerSqsIntegration.store_transaction,
      config,
      restApi
    })
  }
}

export default Hyperledger;
