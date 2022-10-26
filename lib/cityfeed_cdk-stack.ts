import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cityfeed_service from "../lib/cityfeed_service";
import {
  GET_FEED_LIST_FUNCTION_NAME,
  TEST_API_KEY_NAME,
} from "./constants/apiLambdaConst";

export class CityfeedCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new cityfeed_service.CityFeedService(this, "CityFeedService", {
      lambdaFunctionNames: {
        getFeedListFunctionName: GET_FEED_LIST_FUNCTION_NAME,
      },
      apiKeyName: TEST_API_KEY_NAME,
    });
  }
}
