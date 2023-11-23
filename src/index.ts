import {Client, Channel, ParseBuffer} from "./Hyperledger"

exports.handler = async (event: any) => {

  for (const record of event.Records) {

    const media = JSON.parse(record.body);

    try {
      console.log({ media })

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
      console.log({ message: e.message });
    }
  }
};
