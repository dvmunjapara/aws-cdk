import {Channel, ParseBuffer} from "./Hyperledger";
import * as nano from 'nano';

exports.handler = async (event: any) => {

  console.log("request:", JSON.stringify(event.body));
  console.log("request:", JSON.stringify(event.body.payload));

  try {

    const nano = require('nano')(process.env.COUCHDB_HOST);
    const db = nano.use(process.env.COUCHDB_DATABASE);

    const docs = await db.view("frames-doc", "frames-view", {
      keys: JSON.parse(event.body.payload),
      include_docs: true,
    });

    return {
      statusCode: 200,
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({data: docs.rows}),
    }
  } catch (e: any) {
    return {
      statusCode: 404,
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({error: "No transaction found"}),
    };
  }

};
