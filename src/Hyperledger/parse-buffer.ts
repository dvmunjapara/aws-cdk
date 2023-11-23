import {TextDecoder} from "util";

const utf8Decoder = new TextDecoder();

export async function ParseBuffer(bytes: Uint8Array): Promise<any> {

  const resultJson = utf8Decoder.decode(bytes);

  console.log({resultJson})
  try {
    return JSON.parse(resultJson);
  } catch (e) {
    return resultJson;
  }
}
