import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {ConfigProps} from "./config";
import {StackProps} from "aws-cdk-lib";
import * as ApiGW from 'aws-cdk-lib/aws-apigateway';
import Hyperledger from './constructs/hyperledger';
import Rekognition from "./constructs/rekognition";

type AwsEnvStackProps = StackProps & {
  config: Readonly<ConfigProps>;
};

export class SwearWorkerStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: AwsEnvStackProps) {
    super(scope, id, props);

    const {config} = props;

    //Create the API in ApiGateway
    const restApi = new ApiGW.RestApi(this, "API Endpoint", {
      deployOptions: {
        stageName: config.ENV,
      },
      restApiName: `SwearApi-${config.ENV}`,
      apiKeySourceType: ApiGW.ApiKeySourceType.HEADER,
    });

    const apiKey = new ApiGW.ApiKey(this, 'ApiKey');

    const usagePlan = new ApiGW.UsagePlan(this, 'ApiUsagePlan', {
      name: `ApiUsagePlan-${config.ENV}`,
      apiStages: [
        {
          api: restApi,
          stage: restApi.deploymentStage,
        },
      ],
    });

    usagePlan.addApiKey(apiKey);

    new Hyperledger(this, `Hyperledger`, {
      config: config,
      restApi: restApi,
    });

    new Rekognition(this, `Rekognition`, {
      config, restApi
    })
  }
}
