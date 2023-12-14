import {Construct} from "constructs";
import RekognitionSns from "./sns/rekognition-sns.construct";
import {ConfigProps} from "../config";
import {AmazonRekognitionRole} from "./role/rekognition-role.construct";
import {RekognitionLambdaIntegration} from "./lambda/rekognition.construct";
import RekognitionSnsSubscription from "./sns/rekognition-sns-subscription.construct";
import * as ApiGW from 'aws-cdk-lib/aws-apigateway';
import RekognitionApi from "./api/rekognition-api.construct";

interface IRekognitionProps {
  config: ConfigProps;
  restApi: ApiGW.RestApi;
}
export default class Rekognition extends Construct {

    constructor(scope: Construct, id: string, props: IRekognitionProps) {
      super(scope, id);

      const {config, restApi} = props;

      const rekognitionSns = new RekognitionSns(this, "Rekognition SNS Construct")

      const rekognitionRole = new AmazonRekognitionRole(
        this,
        "Rekognition Role Construct",
        {
          snsTopic: rekognitionSns.moderationProcessedNotification
        }
      );

      //Added SQS Event Source to Lambda
      const rekognitionLambdaIntegration = new RekognitionLambdaIntegration(this, "Rekognition Lambda Integration", {
        notification: rekognitionSns.moderationProcessedNotification,
        resultNotification: rekognitionSns.moderationResultNotification,
        role: rekognitionRole.role,
        bucket: config.BUCKET_NAME,
      });

      //Create the SNS Subscription
      new RekognitionSnsSubscription(this, "Rekognition SNS Subscription Construct", {
        endpoint: config.REKOGNITION_ENDPOINT,
        moderation_processed_notification: rekognitionSns.moderationProcessedNotification,
        moderation_result_notification: rekognitionSns.moderationResultNotification,
        submit_moderation: rekognitionLambdaIntegration.submit_moderation
      })

      new RekognitionApi(this, "Rekognition API Construct", {
        restApi: restApi,
        submit_moderation: rekognitionLambdaIntegration.submit_moderation
      });
    }
}
