import {Construct} from "constructs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as cdk from "aws-cdk-lib";

interface ISQSApiGatewayQueueProps {
  env: string;
}

export default class SQSApiGatewayQueue extends Construct {

  queue: sqs.Queue;

  constructor(scope: Construct, id: string, props: ISQSApiGatewayQueueProps) {
    super(scope, id);

    this.queue = new sqs.Queue(this, `HyperledgerWorkerQueue-${props.env}`, {
      visibilityTimeout: cdk.Duration.minutes(5),
      fifo: true,
      deduplicationScope: sqs.DeduplicationScope.MESSAGE_GROUP,
      fifoThroughputLimit: sqs.FifoThroughputLimit.PER_MESSAGE_GROUP_ID,
      contentBasedDeduplication: true,
    });
  }
}
