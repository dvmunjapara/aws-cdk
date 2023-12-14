//Create an IAM Role for API Gateway to assume
import {Construct} from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sns from "aws-cdk-lib/aws-sns";

/**
 * These are the properties expected by the SQSApiGatewayRole Construct
 */
export interface IApiGatewayRoleProps {
  snsTopic: sns.Topic;
}

/**
 * This Construct creates the Policy and Role that allows Api Gateway send Message access to SQS
 */
export class AmazonRekognitionRole extends Construct {
  role: iam.Role; // this will be used by the parent stack to combine with other Constructs

  constructor(scope: Construct, id: string, props: IApiGatewayRoleProps) {
    super(scope, id);

    /**
     * create a policy statement that allows sending messages to the message queue
     */
    const policyStatement = new iam.PolicyStatement({
      // you can find the full list of SQS actions here https://docs.aws.amazon.com/service-authorization/latest/reference/list_amazonsqs.html
      effect: iam.Effect.ALLOW,
      actions: ["sns:Publish"],
      resources: [props.snsTopic.topicArn],
    });

    /**
     * Create a policy to house policy statements statements. An example would be that we could also
     * add policy statements to allow sqs:ReceiveMessage, and sqs:DeleteMessage
     */
    const policy = new iam.Policy(this, "AmazonRekognitionSNSPolicy", {
      statements: [policyStatement],
    });

    /**
     * Create a role that can be assumed by API Gateway to integrate with the SQS Queue
     */
    const role = new iam.Role(this, `AmazonRekognitionSNS`, {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("rekognition.amazonaws.com"),
        new iam.ServicePrincipal("sns.amazonaws.com")
      ),
      roleName: `AmazonRekognitionSNS`,
    });

    /**
     * Attach the API Gateway Integration role to the declared ALLOW sqs:SendMessage policy
     */
    role.attachInlinePolicy(policy);

    this.role = role;
  }
}





