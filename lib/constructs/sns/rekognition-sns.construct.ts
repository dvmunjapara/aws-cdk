import {Construct} from "constructs";
import {ConfigProps} from "../../config";
import * as sns from 'aws-cdk-lib/aws-sns';

interface IRekognitionSnsProps {
  env: string
}

export default class RekognitionSns extends Construct {

  moderationProcessedNotification: sns.Topic;

  moderationResultNotification: sns.Topic;

  constructor(scope: Construct, id: string, props: IRekognitionSnsProps) {
    super(scope, id);

    this.moderationProcessedNotification = new sns.Topic(this, `AmazonRekognition-Moderation`, {
      topicName: `AmazonRekognition-Moderation-${props.env}`
    });

    this.moderationResultNotification = new sns.Topic(this, `AmazonRekognition-Moderation-Result`, {
      topicName: `AmazonRekognition-Moderation-Result-${props.env}`
    });
  }
}
