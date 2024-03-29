//Create an IAM Role for API Gateway to assume
import {Construct} from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sqs from "aws-cdk-lib/aws-sqs";

/**
 * These are the properties expected by the SQSApiGatewayRole Construct
 */
export interface IApiGatewayRoleProps {
  messageQueue: sqs.Queue;
  env: string;
}

/**
 * This Construct creates the Policy and Role that allows Api Gateway send Message access to SQS
 */
export default class HyperledgerRole extends Construct {
  role: iam.Role; // this will be used by the parent stack to combine with other Constructs

  constructor(scope: Construct, id: string, props: IApiGatewayRoleProps) {
    super(scope, id);

    /**
     * create a policy statement that allows sending messages to the message queue
     */
    const policyStatement = new iam.PolicyStatement({
      // you can find the full list of SQS actions here https://docs.aws.amazon.com/service-authorization/latest/reference/list_amazonsqs.html
      effect: iam.Effect.ALLOW,
      actions: ["sqs:SendMessage"],
      resources: [props.messageQueue.queueArn],
    });

    /**
     * Create a policy to house policy statements statements. An example would be that we could also
     * add policy statements to allow sqs:ReceiveMessage, and sqs:DeleteMessage
     */
    const policy = new iam.Policy(this, `HyperledgerStackPolicy`, {
      policyName: `HyperledgerStackPolicy-${props.env}`,
      statements: [policyStatement],
    });

    /**
     * Create a role that can be assumed by API Gateway to integrate with the SQS Queue
     */
    const role = new iam.Role(this, `Hyperledger`, {
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      roleName: `Hyperledger-${props.env}`,
    });

    /**
     * Attach the API Gateway Integration role to the declared ALLOW sqs:SendMessage policy
     */
    role.attachInlinePolicy(policy);

    this.role = role;
  }
}





