import {json} from "node:stream/consumers";

exports.handler = async (event: any) => {

  try {

    const body = JSON.parse(event.body);

    console.log({
      keys: body.frames,
      db: process.env.COUCHDB_DATABASE,
      host: process.env.COUCHDB_HOST
    });

    let data: any = []

    let count = 0;

    let found = false;

    await (async () => {
      for await (const res of body.frames.map((frame: any) => {
        return searchFromCouchDB(frame);
      })) {

        if (res.rows.length) {

          data.push(res.rows);
          found = true;
        }

        if (found) {
          count++;

          if (count > 10) {
            break;
          }
        }
      }
    })()

    return {
      statusCode: 200,
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({data}),
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
const searchFromCouchDB = async function (frame: string) {

  const nano = require('nano')(process.env.COUCHDB_HOST);

  const db = nano.use(process.env.COUCHDB_DATABASE);

  return await db.view("frames-doc", "frames-view", {
    key: frame,
    include_docs: true,
  });

}
