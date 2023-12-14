import {Construct} from "constructs";
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";

interface IRekognitionSnsSubscriptionProps {
  endpoint: string;
  submit_moderation: lambda.NodejsFunction;
  moderation_processed_notification: sns.ITopic;
  moderation_result_notification: sns.ITopic;
}
export default class RekognitionSnsSubscription extends Construct {

  constructor(scope: Construct, id: string, props: IRekognitionSnsSubscriptionProps) {
    super(scope, id);

    const {submit_moderation, moderation_processed_notification, moderation_result_notification} = props;

    new sns.Subscription(this, `AmazonRekognition-Moderation-Subscription`, {
      endpoint: submit_moderation.functionArn,
      protocol: sns.SubscriptionProtocol.LAMBDA,
      topic: moderation_processed_notification,
    });

    new sns.Subscription(this, `AmazonRekognition-Moderation-Result-Subscription`, {
      endpoint: props.endpoint,
      protocol: sns.SubscriptionProtocol.HTTPS,
      topic: moderation_result_notification
    });

  }
}
