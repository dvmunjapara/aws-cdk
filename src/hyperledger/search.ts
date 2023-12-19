import {json} from "node:stream/consumers";

exports.handler = async (event: any) => {

  try {

    const body = JSON.parse(event.body);

    console.log({
      keys: body.frames,
      db: process.env.COUCHDB_DATABASE,
      host: process.env.COUCHDB_HOST
    });


    let promiss = [];
    for (const frame of body.frames) {

      promiss.push(search(frame))

    }

    const docs = await Promise.all(promiss);

    if (docs) {

      return {
        statusCode: 200,
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({data: docs}),
      }
    }


    return {
      statusCode: 200,
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({data: []}),
    }

  } catch (e: any) {

    console.log({e: JSON.stringify(e)});
    return {
      statusCode: 404,
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({error: "No transaction found"}),
    };
  }

};
const search = async function (frame: string) {

  const nano = require('nano')(process.env.COUCHDB_HOST);

  const db = nano.use(process.env.COUCHDB_DATABASE);

  return  await db.view("frames-doc", "frames-view", {
    key: frame,
    include_docs: true,
  });

}
