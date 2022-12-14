import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cityfeed_service from "./constructs/apigateway";
import * as cityfeed_s3 from "./constructs/s3";
import * as cityfeed_dynamodb from "./constructs/dynamodb";
import {
  GET_FEED_LIST_FUNCTION_NAME,
  POST_FEED_FUNCTION_NAME,
  GET_USER_DETAIL_FUNCTION_NAME,
  TEST_API_KEY_NAME,
  MEDIA_BUCKET_NAME,
  USER_AVATAR_BUCKET_NAME,
  FEED_DYNAMODB_TABLE_NAME,
  USER_DYNAMODB_TABLE_NAME,
  USER_LIKED_DYNAMODB_TABLE_NAME,
} from "./constants/apiLambdaConst";

export class CityfeedCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new cityfeed_service.CityFeedService(this, "CityFeedService", {
      lambdaFunctionNames: {
        getFeedListFunctionName: GET_FEED_LIST_FUNCTION_NAME,
        postFeedFuntionName: POST_FEED_FUNCTION_NAME,
        getUserDetailFunctionName: GET_USER_DETAIL_FUNCTION_NAME,
      },
      apiKeyName: TEST_API_KEY_NAME,
    });

    new cityfeed_s3.S3BucketConstruct(this, "CityFeedS3Bucket", {
      feedImageBucketName: MEDIA_BUCKET_NAME,
      userAvatarBucketName: USER_AVATAR_BUCKET_NAME,
    });

    new cityfeed_dynamodb.DynamoDBConstruct(this, "CityFeedDynamoDB", {
      dynamoDBFeedTableName: FEED_DYNAMODB_TABLE_NAME,
      dynamoDBUserTableName: USER_DYNAMODB_TABLE_NAME,
      dynamoDBUserLikedTableName: USER_LIKED_DYNAMODB_TABLE_NAME,
    });
  }
}
