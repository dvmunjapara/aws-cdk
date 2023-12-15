//Create an IAM Role for API Gateway to assume
import {Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import * as apigw from "aws-cdk-lib/aws-apigateway";

/**
 * These are the properties expected by the MediaModel Construct
 */
export interface IMediaModelProps {
  restApi: apigw.RestApi;
  env: string;
}

/**
 * This Construct creates the validation schema for the Api Gateway Request
 */
export class MediaModel extends Construct {
  readonly model: apigw.Model;

  constructor(scope: Construct, id: string, props: IMediaModelProps) {
    super(scope, id);

    const IFrame = {
      properties: {
        algo: {
          type: apigw.JsonSchemaType.STRING
        },
        frame_count: {
          type: apigw.JsonSchemaType.NUMBER
        },
        frame_index: {
          type: apigw.JsonSchemaType.NUMBER
        },
        frames: {
          type: apigw.JsonSchemaType.ARRAY,
          items: {
            type: apigw.JsonSchemaType.STRING,
            additionalProperties: false
          }
        },
        hash: {
          type: apigw.JsonSchemaType.STRING
        },
        key: {
          type: apigw.JsonSchemaType.STRING
        }
      }
    }

    const IConfidenceInfo = {
      properties: {
        total: {
          type: apigw.JsonSchemaType.NUMBER
        },
        valid: {
          type: apigw.JsonSchemaType.NUMBER
        },
        score: {
          type: apigw.JsonSchemaType.NUMBER
        },
        weightage: {
          type: apigw.JsonSchemaType.NUMBER
        },
        percentage: {
          type: apigw.JsonSchemaType.NUMBER
        }
      }
    };

    const IFrameData = {
      properties: {
        confidence: {
          properties: {
            visual: IConfidenceInfo,
            audio: IConfidenceInfo,
            meta: IConfidenceInfo,
            gps: IConfidenceInfo,
            time: IConfidenceInfo,
          }
        },
        framesChanged: {
          properties: {
            visual: {
              type: apigw.JsonSchemaType.NUMBER
            },
            audio: {
              type: apigw.JsonSchemaType.NUMBER
            },
            meta: {
              type: apigw.JsonSchemaType.NUMBER
            }
          }
        },
        authenticatedFrames: {
          type: [
            apigw.JsonSchemaType.NUMBER,
            apigw.JsonSchemaType.NULL,
          ]
        },
        weakGps: {
          type: [
            apigw.JsonSchemaType.NUMBER,
            apigw.JsonSchemaType.NULL,
          ]
        },
        noData: {
          type: [
            apigw.JsonSchemaType.NUMBER,
            apigw.JsonSchemaType.NULL,
          ]
        },
        totalConfidence: {
          type: [
            apigw.JsonSchemaType.NUMBER,
            apigw.JsonSchemaType.NULL,
          ]
        },
        totalFrames: {
          type: [
            apigw.JsonSchemaType.NUMBER,
            apigw.JsonSchemaType.NULL,
          ]
        },
        signedWith: {
          type: apigw.JsonSchemaType.STRING
        },
      }
    };

    /**
     *
     * https://json-schema.org/
     */
    const mediaModel = new apigw.Model(this, 'media-model-validator', {
      restApi: props.restApi,
      contentType: 'application/json',
      description: 'Validates a set of coordinates',
      modelName: `mediaModel${props.env}`,
      schema: {
        type: apigw.JsonSchemaType.OBJECT,
        required: ['id'],
        properties: {
          id: {
            type: apigw.JsonSchemaType.STRING
          },
          mediaId: {
            type: apigw.JsonSchemaType.STRING
          },
          recorded: {
            type: apigw.JsonSchemaType.BOOLEAN
          },
          owner: {
            type: apigw.JsonSchemaType.STRING
          },
          payload: {
            type: apigw.JsonSchemaType.OBJECT,
            properties: {
              audio: {
                type: apigw.JsonSchemaType.ARRAY,
                items: IFrame,
              },
              frames: {
                type: apigw.JsonSchemaType.ARRAY,
                items: IFrame,
              },
              metadata: {
                type: apigw.JsonSchemaType.ARRAY,
                items: IFrame,
              },
              frameData: IFrameData
            },
          },
        }
      }
    });

    this.model = mediaModel;
  }
}
