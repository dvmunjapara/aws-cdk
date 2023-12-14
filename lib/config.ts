import * as dotenv from "dotenv";
import path = require("path");

// 1. Configure dotenv to read from our `.env` file
dotenv.config({path: path.resolve(__dirname, "../.env")});

// 2. Define a TS Type to type the returned envs from our function below.
export type ConfigProps = {
  REGION: string;
  ENV: string;
  TLS_PATH: string;
  PEER_ENDPOINT: string;
  PEER_HOST_ALIAS: string;
  CERT_PATH: string;
  MSP_ID: string;
  KEY_DIRECTORY_PATH: string;
  HYPERLEDGER_CHANNEL: string;
  HYPERLEDGER_CHAINCODE: string;
  VPC_ID: string;
  COUCHDB_HOST: string;
  COUCHDB_DATABASE: string;
  BUCKET_NAME: string;
  REKOGNITION_ENDPOINT: string;
};

// 3. Define a function to retrieve our env variables
export const getConfig = (): ConfigProps => ({
  REGION: process.env.REGION || "us-east-1",
  ENV: process.env.ENV || "",
  TLS_PATH: process.env.TLS_PATH || "",
  PEER_ENDPOINT: process.env.PEER_ENDPOINT || "",
  PEER_HOST_ALIAS: process.env.PEER_HOST_ALIAS || "",
  CERT_PATH: process.env.CERT_PATH || "",
  MSP_ID: process.env.MSP_ID || "",
  KEY_DIRECTORY_PATH: process.env.KEY_DIRECTORY_PATH || "",
  HYPERLEDGER_CHANNEL: process.env.HYPERLEDGER_CHANNEL || "",
  HYPERLEDGER_CHAINCODE: process.env.HYPERLEDGER_CHAINCODE || "",
  VPC_ID: process.env.VPC_ID || "",
  COUCHDB_HOST: process.env.COUCHDB_HOST || "",
  COUCHDB_DATABASE: process.env.COUCHDB_DATABASE || "",
  BUCKET_NAME: process.env.BUCKET_NAME || "",
  REKOGNITION_ENDPOINT: process.env.REKOGNITION_ENDPOINT || "",
});
