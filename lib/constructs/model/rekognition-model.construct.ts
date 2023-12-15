//Create an IAM Role for API Gateway to assume
import {Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import * as ApiGW from "aws-cdk-lib/aws-apigateway";

/**
 * These are the properties expected by the MediaModel Construct
 */
export interface IMediaModelProps {
  restApi: ApiGW.RestApi;
  env: string
}

/**
 * This Construct creates the validation schema for the Api Gateway Request
 */
export class ModerateContentModel extends Construct {
  readonly model: ApiGW.Model;

  constructor(scope: Construct, id: string, props: IMediaModelProps) {
    super(scope, id);

    /**
     *
     * https://json-schema.org/
     */
    this.model = new ApiGW.Model(this, 'moderateContentValidator', {
      restApi: props.restApi,
      contentType: 'application/json',
      description: 'Validates moderate content request body',
      modelName: `moderateContent-${props.env}`,
      schema: {
        type: ApiGW.JsonSchemaType.OBJECT,
        required: ['media_id', 'name'],
        properties: {
          media_id: {
            type: ApiGW.JsonSchemaType.STRING
          },
          name: {
            type: ApiGW.JsonSchemaType.STRING
          },
        }
      }
    });
  }
}
