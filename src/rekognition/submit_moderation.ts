import {
  RekognitionClient,
  StartContentModerationCommand
} from "@aws-sdk/client-rekognition";

exports.handler = async (event: any) => {

  const client = new RekognitionClient()

  const body = JSON.parse(event.body);

  const input = {
    MinConfidence: 20,
    JobTag: body.media_id,
    Video: {
      S3Object: {
        Bucket: process.env.BUCKET_NAME,
        Name: body.name
      }
    },
    NotificationChannel: {
      SNSTopicArn: process.env.SNS_TOPIC_ARN,
      RoleArn: process.env.ROLE_ARN
    }
  }

  // const body = JSON.parse(event.body);
  const command = new StartContentModerationCommand(input)

  try {
    const response = await client.send(command)

    return {
      statusCode: 200,
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({data: response}),
    }
  } catch (error) {

    throw error;
  }


};
