import {Client, Channel, ParseBuffer} from "./Hyperledger"

exports.handler = async (event: any) => {

  for (const record of event.Records) {

    const id: string = '536281324';

    try {
      console.log({ id })

      const contract = await Channel();
      const resultBytes = await contract.evaluateTransaction("ReadMedia", id);
      console.log({ data: ParseBuffer(resultBytes) });
    } catch (e: any) {
      console.log({ message: e.message });
    }
  }
};
