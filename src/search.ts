import {Channel, ParseBuffer} from "./Hyperledger";
import * as nano from 'nano';

exports.handler = async (event: any) => {

  try {

    const body = JSON.parse(event.body);
    const nano = require('nano')(process.env.COUCHDB_HOST);
    const db = nano.use(process.env.COUCHDB_DATABASE);
    console.log(body.frames)

    const docs = await db.view("frames-doc", "frames-view", {
      keys: body.frames,
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
