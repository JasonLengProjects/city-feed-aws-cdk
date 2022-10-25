import { Construct } from "constructs";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import {
  RestApi,
  LambdaIntegration,
  ApiKey,
  UsagePlanProps,
  Period,
} from "aws-cdk-lib/aws-apigateway";
import { Duration, StackProps } from "aws-cdk-lib";

export interface CityfeedServiceProps extends StackProps {
  lambdaFunctionName: string; // lambda function name
  apiKeyName: string; // api key name
}

export class CityFeedService extends Construct {
  private restApi: RestApi;
  private lambdaFunction: Function;

  constructor(scope: Construct, id: string, props: CityfeedServiceProps) {
    super(scope, id);

    // create lambda function
    this.lambdaFunction = new Function(this, props.lambdaFunctionName, {
      functionName: props.lambdaFunctionName,
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset("src"),
      handler: "handler.handler",
      timeout: Duration.seconds(10),
      environment: {},
    });

    // create rest api
    this.restApi = new RestApi(this, id + "RestApi", {
      restApiName: id + "RestApi",
      description: "This is the first test API for CityFeed",
    });

    // create usage plan
    const usagePlan = this.restApi.addUsagePlan(id + "UsagePlan", {
      name: id + "UsagePlan",
      throttle: {
        rateLimit: 10,
        burstLimit: 2,
      },
      quota: {
        limit: 100000,
        period: Period.MONTH,
      },
      apiStages: [
        {
          stage: this.restApi.deploymentStage,
        },
      ],
    });

    // create api key
    const apiKey = this.restApi.addApiKey(id + "ApiKey", {
      apiKeyName: props.apiKeyName,
      description: "API Key used by " + id,
    });
    usagePlan.addApiKey(apiKey);

    // bind lambda to api
    const getRestApiIntegration = new LambdaIntegration(this.lambdaFunction, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' },
    });

    this.restApi.root.addMethod("GET", getRestApiIntegration, {
      apiKeyRequired: true,
    });
    this.restApi.root.addResource;
  }
}
