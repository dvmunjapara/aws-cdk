import {Channel} from "./Hyperledger"

exports.handler = async (event: any) => {

  for (const record of event.Records) {

    console.log(record.body);

    const media = JSON.parse(record.body);

    console.log(media)
    try {

      const channel = await Channel();

      let responses = await channel.submit(
        "CreateMedia",
        {
          arguments: [
            (media.id).toString(),
            JSON.stringify(media),
          ]
        }
      );

    } catch (e: any) {
      const message = e.details && e.details[0] ? e.details[0].message.split(", ")[1] : e.message;

      if (!message.includes("Media already exists")) {

        throw new Error(message);
      }
    }
  }
};
