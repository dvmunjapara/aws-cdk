import {
  connect,
  Gateway,
  Identity,
  Signer,
  signers,
} from "@hyperledger/fabric-gateway";
import {promises as fs} from "fs";
import path from "path";
import crypto from "crypto";
import * as grpc from "@grpc/grpc-js";
import { TextDecoder } from "util";

const utf8Decoder = new TextDecoder();


exports.handler = async (event: any) => {

  for (const record of event.Records) {

    const id: string = '536281324';

    console.log({ record })

    try {
      console.log({ id })

      const contract = await buildChannel();
      console.log({ contract })
      const resultBytes = await contract.evaluateTransaction("ReadMedia", id);
      console.log({ data: parseBuffer(resultBytes) });
    } catch (e: any) {
      console.log({ message: e.message });
    }
  }
};

const newSigner = async function (): Promise<Signer> {

  const keyDirectoryPath = process.env.KEY_DIRECTORY_PATH || "";

  const files = await fs.readdir(path.resolve(keyDirectoryPath));
  const keyPath = path.resolve(keyDirectoryPath, files[0]);
  const privateKeyPem = await fs.readFile(keyPath);
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  return signers.newPrivateKeySigner(privateKey);
}

const buildClient = async function (): Promise<Gateway> {


  const client = await newGrpcConnection();

  return connect({
    // @ts-ignore
    client,
    identity: await newIdentity(),
    signer: await newSigner(),
    // Default timeouts for different gRPC calls
    evaluateOptions: () => {
      return {deadline: Date.now() + 5000}; // 5 seconds
    },
    endorseOptions: () => {
      return {deadline: Date.now() + 15000}; // 15 seconds
    },
    submitOptions: () => {
      return {deadline: Date.now() + 5000}; // 5 seconds
    },
    commitStatusOptions: () => {
      return {deadline: Date.now() + 60000}; // 1 minute
    },
  });
}

const newGrpcConnection = async function (): Promise<grpc.Client> {

  const tlsPath = process.env.TLS_PATH || '';
  const peerEndpoint = process.env.PEER_ENDPOINT || '';
  const peerHostAlias = process.env.PEER_HOST_ALIAS || '';

  const tlsRootCert = await fs.readFile(tlsPath);
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
  return new grpc.Client(peerEndpoint, tlsCredentials, {
    "grpc.ssl_target_name_override": peerHostAlias,
  });
}

const newIdentity = async function (): Promise<Identity> {

  const mspId = process.env.MSP_ID || "Org1MSP";
  const certPath = process.env.CERT_PATH || "";

  const credentials = await fs.readFile(path.resolve(certPath));
  return { mspId, credentials };
}

const buildChannel = async function (): Promise<any> {


  const channel_name = process.env.HYPERLEDGER_CHANNEL || '';
  const chaincode = process.env.HYPERLEDGER_CHAINCODE || '';

  const gateway = await buildClient();
  const network = gateway.getNetwork(channel_name);

  // Get the smart contract from the network.
  return network.getContract(chaincode);
}

const parseBuffer = function (bytes: Uint8Array): any {

  const resultJson = utf8Decoder.decode(bytes);

  try {
    return JSON.parse(resultJson);
  } catch (e) {
    return resultJson;
  }
}
