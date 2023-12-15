//Create an IAM Role for API Gateway to assume
import {Construct} from "constructs";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import {ModerateContentModel} from "../../model/rekognition-model.construct";

/**
 * These are the properties expected by the ApiMethodOptions Construct
 */
export interface IApiMethodOptionsProps {
  restApi: apigw.RestApi;
  env: string
}

/**
 * This Construct creates the Api Gateway endpoint Request and Response that affronts the SQS integration.
 */
export default class RekognitionApiMethodOptions extends Construct {

  readonly submitMethodOptions: apigw.MethodOptions;

  constructor(scope: Construct, id: string, props: IApiMethodOptionsProps) {
    super(scope, id);

    /**
     * Create the GeoModel to attach to the Request
     */
    const model = new ModerateContentModel(this, "Moderation Model Construct", {
      restApi: props.restApi,
      env: props.env,
    });

    /**
     * Create a method response for API Gateway using the empty model, which will
     * return the response from the integration unmapped
     */
    const methodResponse: apigw.MethodResponse = {
      statusCode: "200",
      responseModels: { "application/json": apigw.Model.EMPTY_MODEL },
    };

    /**
     * Create a validator for the API, apply that validation to the Request for the ContentType
     * of "application/json", and add the "passthrough" Response as Method Options for the API
     */
    this.submitMethodOptions = {
      methodResponses: [methodResponse],
      operationName: "submit-moderation",
      requestValidator: new apigw.RequestValidator(this, `submit-moderation-validator`, {
        requestValidatorName: `submit-moderation-validator-${props.env}`,
        restApi: props.restApi,
        validateRequestBody: true,
      }),
      requestModels: {
        "application/json": model.model,
      },
      apiKeyRequired: true,
    };
  }
}
