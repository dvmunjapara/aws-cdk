//Create an IAM Role for API Gateway to assume

import {Construct} from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime} from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as lambdaDestinations from 'aws-cdk-lib/aws-lambda-destinations';

/**
 * These are the properties expected by the SQSIntegration Construct
 */
interface IRekognitionLambdaIntegrationProps {

  notification: sns.ITopic;

  resultNotification: sns.ITopic;

  role: iam.IRole;

  bucket: string;
}

/**
 * This Construct creates the integration options needed to attach to a REST API Method
 */
export class RekognitionLambdaIntegration extends Construct {

  submit_moderation: lambda.NodejsFunction;

  process_moderation: lambda.NodejsFunction;

  constructor(scope: Construct, id: string, props: IRekognitionLambdaIntegrationProps) {
    super(scope, id);

    /**
     * Create API Gateway for the Lambda Function to search the transaction
     */
    this.submit_moderation = new lambda.NodejsFunction(this, 'submitModeration', {
      entry: './src/rekognition/submit_moderation.ts',
      handler: 'index.handler',
      functionName: 'submitModeration',
      runtime: Runtime.NODEJS_18_X,
      timeout: cdk.Duration.minutes(5),
      environment: {
        SNS_TOPIC_ARN: props.notification.topicArn,
        ROLE_ARN: props.role.roleArn,
        BUCKET_NAME: props.bucket
      },
      memorySize: 1024,
      bundling: {
        nodeModules: [
          '@aws-sdk/client-rekognition'
        ],
      }
    });

    const submitRekognitionJobPolicyStatement = new iam.PolicyStatement({
      actions: [
        "rekognition:*"
      ],
      resources: ['*']
    })

    const passRolePolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "iam:PassRole"
      ],
      resources: [props.role.roleArn]
    })

    const submitRekognitionJobPolicy = new iam.Policy(this, 'RekognitionJobPolicy', {
      statements: [
        passRolePolicyStatement,
        submitRekognitionJobPolicyStatement
      ]
    })

    this.submit_moderation.role?.attachInlinePolicy(submitRekognitionJobPolicy);

    const bucket = s3.Bucket.fromBucketName(this, 'Bucket', props.bucket);

    bucket.grantRead(this.submit_moderation);

    /**
     * Create API Gateway for the Lambda Function to search the transaction
     */
    this.process_moderation = new lambda.NodejsFunction(this, 'processModeration', {
      entry: './src/rekognition/process_moderation.ts',
      handler: 'index.handler',
      functionName: 'processModeration',
      runtime: Runtime.NODEJS_18_X,
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      onSuccess: new lambdaDestinations.SnsDestination(props.resultNotification),
      onFailure: new lambdaDestinations.SnsDestination(props.resultNotification),
    });

    this.process_moderation.addEventSource(new lambdaEventSources.SnsEventSource(props.notification));

    this.process_moderation.role?.attachInlinePolicy(submitRekognitionJobPolicy);
  }
}
