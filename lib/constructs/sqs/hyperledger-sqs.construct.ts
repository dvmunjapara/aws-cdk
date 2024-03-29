//Create an IAM Role for API Gateway to assume
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ApiGW from "aws-cdk-lib/aws-apigateway";
import { sqsResponseTemplate } from "./templates/hyperledger-sqs-response.template";

/**
 * These are the properties expected by the SQSIntegration Construct
 */
export interface ISQSIntegrationProps {
  messageQueue: sqs.IQueue;
  apiGatewayRole: iam.IRole;
}

/**
 * This Construct creates the integration options needed to attach to a REST API Method
 */
export default class HyperledgerSQSIntegration extends Construct {
  store_transaction: ApiGW.AwsIntegration; // this will be used by the parent stack to combine with other Constructs

  constructor(scope: Construct, id: string, props: ISQSIntegrationProps) {
    super(scope, id);

    /**
     * Create an intergration response for SQS that transforms the output
     * this is the handling of the response from SQS prior to REST endpoint handling.
     * When the response calls for application/json, use VTL to transform the output
     */
    const integrationResponse: ApiGW.IntegrationResponse = {
      statusCode: "200",
      responseTemplates: {
        "application/json": sqsResponseTemplate,
      },
    };

    /**
     * Create integration options for API Method, declaring the role APIGW should assume
     * Only mapped content types will pass through (x-www-form-urlencoded), on the receipt of
     * messages in the format of "application/json", transform the input to form url encoded
     */
    const integrationOptions: ApiGW.IntegrationOptions = {
      credentialsRole: props.apiGatewayRole,
      passthroughBehavior: ApiGW.PassthroughBehavior.NEVER,
      requestParameters: {
        "integration.request.header.Content-Type":
          "'application/x-www-form-urlencoded'",
      },
      requestTemplates: {
        "application/json": `Action=SendMessage&MessageBody=$util.parseJson($input.json('$.data'))&MessageGroupId=$input.json('$.id')`,
      },
      integrationResponses: [integrationResponse],
    };

    /**
     * Create the SQS Integration that allows POST method calls from Api Gateway to enqueue messages
     * in the message queue. *Note the use of "Stack.of" as Constructs do not have the "account" property
     * that you would find on the Stack object.
     */
    this.store_transaction = new ApiGW.AwsIntegration({
      service: "sqs",
      path: `${Stack.of(this).account}/${props.messageQueue.queueName}`,
      integrationHttpMethod: "POST",
      options: integrationOptions,
    });
  }
}
