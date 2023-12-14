import {Client} from "./client";
import {Contract} from "@hyperledger/fabric-gateway";

export async function Channel(): Promise<Contract> {


  const channel_name = process.env.HYPERLEDGER_CHANNEL || '';
  const chaincode = process.env.HYPERLEDGER_CHAINCODE || '';

  const gateway = await Client();
  const network = gateway.getNetwork(channel_name);

  // Get the smart contract from the network.
  return network.getContract(chaincode);
}
