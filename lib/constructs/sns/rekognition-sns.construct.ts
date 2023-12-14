import {Construct} from "constructs";
import {ConfigProps} from "../../config";
import * as sns from 'aws-cdk-lib/aws-sns';

export default class RekognitionSns extends Construct {

  moderationProcessedNotification: sns.Topic;

  moderationResultNotification: sns.Topic;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.moderationProcessedNotification = new sns.Topic(this, `AmazonRekognition-Moderation`, {
      topicName: `AmazonRekognition-Moderation`
    });

    this.moderationResultNotification = new sns.Topic(this, `AmazonRekognition-Moderation-Result`, {
      topicName: `AmazonRekognition-Moderation-Result`
    });
  }
}
