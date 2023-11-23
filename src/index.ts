import {Client, Channel, ParseBuffer} from "./Hyperledger"

exports.handler = async (event: any) => {

  for (const record of event.Records) {

    const id: string = '536281324';

    const media = JSON.parse(record.body);

    try {
      console.log(JSON.stringify(media))

      const channel = await Channel();

      let responses = await channel.submit(
        "CreateMedia",
        {
          arguments: [
            media.id,
            JSON.stringify(media),
          ]
        }
      );


      console.log({ responses: `Media ${media.id} stored` })

    } catch (e: any) {
      const message = e.details && e.details[0] ? e.details[0].message.split(", ")[1] : e.message;

      console.log({ error: message })
    }
  }
};
