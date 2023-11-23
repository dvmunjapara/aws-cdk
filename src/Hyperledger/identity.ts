import {Identity} from "@hyperledger/fabric-gateway";
import {promises as fs} from "fs";
import path from "path";

export async function Identity(): Promise<Identity> {

  const mspId = process.env.MSP_ID || "Org1MSP";
  const certPath = process.env.CERT_PATH || "";

  const credentials = await fs.readFile(path.resolve(certPath));
  return { mspId, credentials };
}
