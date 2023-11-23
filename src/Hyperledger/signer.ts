import {Signer, signers} from "@hyperledger/fabric-gateway";
import {promises as fs} from "fs";
import path from "path";
import crypto from "crypto";

export async function Signer(): Promise<Signer> {

  const keyDirectoryPath = process.env.KEY_DIRECTORY_PATH || "";

  const files = await fs.readdir(path.resolve(keyDirectoryPath));
  const keyPath = path.resolve(keyDirectoryPath, files[0]);
  const privateKeyPem = await fs.readFile(keyPath);
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  return signers.newPrivateKeySigner(privateKey);
}
