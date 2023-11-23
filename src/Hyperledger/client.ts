import {connect, Gateway} from "@hyperledger/fabric-gateway";
import {Identity} from "./identity";
import {Signer} from "./signer";
import * as grpc from "@grpc/grpc-js";
import {promises as fs} from "fs";

const grpcConnection = async function (): Promise<grpc.Client> {

  const tlsPath = process.env.TLS_PATH || '';
  const peerEndpoint = process.env.PEER_ENDPOINT || '';
  const peerHostAlias = process.env.PEER_HOST_ALIAS || '';

  const tlsRootCert = await fs.readFile(tlsPath);
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
  return new grpc.Client(peerEndpoint, tlsCredentials, {
    "grpc.ssl_target_name_override": peerHostAlias,
  });
}

export async function Client(): Promise<Gateway> {

  const client = await grpcConnection();

  return connect({
    // @ts-ignore
    client,
    identity: await Identity(),
    signer: await Signer(),
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
