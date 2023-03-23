import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cityfeed_service from "./constructs/apigateway";
import * as cityfeed_s3 from "./constructs/s3";
import * as cityfeed_dynamodb from "./constructs/dynamodb";
import * as cityfeed_cognito from "./constructs/cognito";
import {
  LAMBDA_FUNCTION_NAMES,
  TEST_API_KEY_NAME,
  S3_BUCKET_NAMES,
  DYNAMODB_TABLE_NAMES,
  COGNITO_NAMES,
} from "./constants/apiLambdaConst";

export class CityfeedCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cityFeedCognito = new cityfeed_cognito.CityFeedCognito(
      this,
      "CityFeedCognito",
      {
        expUserPoolProps: {
          expUserPoolName: COGNITO_NAMES.COGNITO_EXP_USER_POOL_NAME,
          expUserPoolClientName:
            COGNITO_NAMES.COGNITO_EXP_USER_POOL_CLIENT_NAME,
        },
        userPoolProps: {
          userPoolName: COGNITO_NAMES.COGNITO_MAIN_USER_POOL_NAME,
          userPoolClientName: COGNITO_NAMES.COGNITO_MAIN_USER_POOL_CLIENT_NAME,
        },
      }
    );

    new cityfeed_service.CityFeedService(this, "CityFeedService", {
      lambdaFunctionNames: {
        getFeedListFunctionName:
          LAMBDA_FUNCTION_NAMES.GET_FEED_LIST_FUNCTION_NAME,
        getUserFeedListFunctionName:
          LAMBDA_FUNCTION_NAMES.GET_USER_FEED_LIST_FUNCTION_NAME,
        postFeedFuntionName: LAMBDA_FUNCTION_NAMES.POST_FEED_FUNCTION_NAME,
        getUserDetailFunctionName:
          LAMBDA_FUNCTION_NAMES.GET_USER_DETAIL_FUNCTION_NAME,
        likeFeedFunctionName: LAMBDA_FUNCTION_NAMES.LIKE_FEED_FUNCTION_NAME,
        getFavListFunctionName:
          LAMBDA_FUNCTION_NAMES.GET_FAVORITE_LIST_FUNCTION_NAME,
        experimentFunctionName: LAMBDA_FUNCTION_NAMES.EXP_FUNCTION_NAME,
      },
      apiKeyName: TEST_API_KEY_NAME,
      authorizerProps: {
        expUserPool: cityFeedCognito.expUserPool,
        expAuthorizerName: COGNITO_NAMES.COGNITO_EXP_AUTHORIZER_NAME,
        mainUserPool: cityFeedCognito.userPool,
        mainAuthorizerName: COGNITO_NAMES.COGNITO_MAIN_AUTHORIZER_NAME,
      },
    });

    new cityfeed_s3.S3BucketConstruct(this, "CityFeedS3Bucket", {
      feedImageBucketName: S3_BUCKET_NAMES.MEDIA_BUCKET_NAME,
      userAvatarBucketName: S3_BUCKET_NAMES.USER_AVATAR_BUCKET_NAME,
    });

    new cityfeed_dynamodb.DynamoDBConstruct(this, "CityFeedDynamoDB", {
      dynamoDBFeedTableName: DYNAMODB_TABLE_NAMES.FEED_DYNAMODB_TABLE_NAME,
      dynamoDBUserTableName: DYNAMODB_TABLE_NAMES.USER_DYNAMODB_TABLE_NAME,
      dynamoDBUserLikedTableName:
        DYNAMODB_TABLE_NAMES.USER_LIKED_DYNAMODB_TABLE_NAME,
    });
  }
}
