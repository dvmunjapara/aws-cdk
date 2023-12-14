import {
  RekognitionClient,
  GetContentModerationCommand
} from "@aws-sdk/client-rekognition";

exports.handler = async (event: any) => {

  console.log(JSON.stringify({event: event}));

  const client = new RekognitionClient()
  let responses = [];

  for (const record of event.Records) {

    const job = JSON.parse(record.Sns.Message);

    const command = new GetContentModerationCommand({
      JobId: job.JobId
    });

    const response = await client.send(command)

    let highestConfidence;
    let flagged = false;

    if (response.ModerationLabels && response.ModerationLabels.length > 0) {
      highestConfidence = response.ModerationLabels.reduce((a: any, b:any) => {
        return a?.ModerationLabel?.Confidence > b.ModerationLabel.Confidence ? a : b;
      }, []);

      flagged = true;
    }

    responses.push({
      media_id: response.JobTag,
      flagged,
      moderation_labels: highestConfidence ? highestConfidence.ModerationLabel.Name : null
    });
  }

  return responses;
};
