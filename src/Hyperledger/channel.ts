import {Client} from "./client";

export async function Channel(): Promise<any> {


  const channel_name = process.env.HYPERLEDGER_CHANNEL || '';
  const chaincode = process.env.HYPERLEDGER_CHAINCODE || '';

  const gateway = await Client();
  const network = gateway.getNetwork(channel_name);

  // Get the smart contract from the network.
  return network.getContract(chaincode);
}
