import {Construct} from "constructs";
import * as ApiGW from "aws-cdk-lib/aws-apigateway";
import {ConfigProps} from "../../config";
import {AwsIntegration, MethodOptions} from "aws-cdk-lib/aws-apigateway";
import {HyperledgerApiMethodOptions} from "./method/hyperledger-method-options.construct";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";


export interface IHyperledgerApiProps {
  config: ConfigProps;
  restApi: ApiGW.RestApi;
  storeTransaction: AwsIntegration
  getTransaction: lambda.NodejsFunction,
  searchTransaction: lambda.NodejsFunction,
}

export default class HyperledgerApi extends Construct {

  constructor(scope: Construct, id: string, props: IHyperledgerApiProps) {
    super(scope, id);

    const {restApi, storeTransaction, getTransaction, searchTransaction} = props;


    //Create a method options object with validations and transformations
    const apiMethodOptions = new HyperledgerApiMethodOptions(
      this,
      "Hyperledger API Method Options Construct",
      {
        restApi: restApi,
        env: props.config.ENV,
      }
    );

    const storeResource = restApi.root.resourceForPath('/store-transaction');
    storeResource.addMethod(
      "POST",
      storeTransaction,
      apiMethodOptions.storeMethodOptions
    );

    //Create a Resource Method, that fetches a transaction from the ledger
    const getResource = restApi.root.resourceForPath("get-transaction");
    getResource.addResource("{id}")
      .addMethod("GET", new ApiGW.LambdaIntegration(getTransaction));

    //Create a Resource Method, that searches for a transaction in the ledger
    const searchResource = restApi.root.resourceForPath("search-transaction");
    searchResource
      .addMethod("POST", new ApiGW.LambdaIntegration(searchTransaction));
  }
}
