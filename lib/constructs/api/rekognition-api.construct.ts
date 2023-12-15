import {Construct} from "constructs";
import * as ApiGW from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import RekognitionApiMethodOptions from "./method/rekognition-method-options.construct";

interface IRekognitionApiProps {
  restApi: ApiGW.RestApi;
  submit_moderation: lambda.IFunction;
  env: string
}
export default class RekognitionApi extends Construct {

    constructor(scope: Construct, id: string, props: IRekognitionApiProps) {
      super(scope, id);

      const {restApi, submit_moderation} = props;

      const apiMethodOptions = new RekognitionApiMethodOptions(
        this,
        "Rekognition API Method Options Construct",
        {
          restApi: restApi,
          env: props.env
        }
      );

      //Create the API in ApiGateway
      const moderateContent = restApi.root.resourceForPath("moderate-content");

      moderateContent
        .addMethod("POST",
          new ApiGW.LambdaIntegration(submit_moderation), apiMethodOptions.submitMethodOptions);
    }
}
