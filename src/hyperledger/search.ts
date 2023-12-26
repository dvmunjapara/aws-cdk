import {json} from "node:stream/consumers";
import {DocumentScope} from "nano";

exports.handler = async (event: any) => {

  try {

    const body = JSON.parse(event.body);

    const nano = require('nano')(process.env.COUCHDB_HOST);

    const db = nano.use(process.env.COUCHDB_DATABASE);

    let data: any = []

    const frameChunks = body.frames.reduce((resultArray: string[][], item: string, index: number) => {
      const chunkIndex = Math.floor(index / 1000)

      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = [] // start a new chunk
      }

      resultArray[chunkIndex].push(item)

      return resultArray
    }, []);

    await (async () => {
      for await (const result of frameChunks.map((frame: any) => {
        return searchFromCouchDB(db, frame);
      })) {

        if (result.rows.length) {
          data = [...data, ...result.rows]
        }
      }
    })()

    const ids = data.map((item: any) => item.id).filter((value: any, index: any, self: any) => self.indexOf(value) === index);

    let result: any = [];

    if (ids.length) {

      result = await getMediaById(db, ids);
    }

    return {
      statusCode: 200,
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({data: result?.rows || []}),
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

const searchFromCouchDB = async function (db: any, frame: string) {

  return await db.view("frames-doc", "frames-view", {
    keys: frame,
    include_docs: false,
  });

}

const getMediaById = async function (db: any, ids: string[]) {

  return  await db.fetch({keys: ids});
}
