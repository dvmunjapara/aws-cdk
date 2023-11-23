import {Channel, ParseBuffer} from "./Hyperledger";

exports.handler = async (event: any) => {

  console.log("request:", JSON.stringify(event, undefined, 2));

  const id = event.pathParameters.id;

  try {
    const channel = await Channel();

    const resultBytes = await channel.evaluateTransaction("ReadMedia", id);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: ParseBuffer(resultBytes) }),
    };
  } catch (e: any) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "No transaction found" }),
    };
  }

};
