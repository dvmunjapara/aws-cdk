import {Channel, ParseBuffer} from "./Hyperledger";

exports.handler = async (event: any) => {

  console.log("request:", JSON.stringify(event, undefined, 2));

  const id = event.pathParameters.id;

  try {
    const channel = await Channel();

    const resultBytes = await channel.evaluateTransaction("ReadMedia", id);
    const data = await ParseBuffer(resultBytes);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    };
  } catch (e: any) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "No transaction found" }),
    };
  }

};
