import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cityfeed_service from "../lib/cityfeed_service";

export const LAMBDA_FUNCTION_NAME = "MainHandler";

export class CityfeedCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new cityfeed_service.CityFeedService(this, "CityFeedService", {
      lambdaFunctionName: LAMBDA_FUNCTION_NAME,
    });
  }
}
