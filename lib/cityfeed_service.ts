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
  lambdaFunctionNames: {
    getFeedListFunctionName: string;
  }; // lambda function names
  apiKeyName: string; // api key name
}

export class CityFeedService extends Construct {
  private restApi: RestApi;
  private getListFunction: Function;

  constructor(scope: Construct, id: string, props: CityfeedServiceProps) {
    super(scope, id);

    // create lambda function
    this.getListFunction = new Function(
      this,
      props.lambdaFunctionNames.getFeedListFunctionName,
      {
        functionName: props.lambdaFunctionNames.getFeedListFunctionName,
        runtime: Runtime.NODEJS_14_X,
        code: Code.fromAsset("src"),
        handler: "getFeedListHandler.handler",
        timeout: Duration.seconds(10),
        environment: {},
      }
    );

    // create rest api
    this.restApi = new RestApi(this, id + "RestApi", {
      restApiName: id + "RestApi",
      description: "This is the first test Api for CityFeed",
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
    const getRestApiIntegration = new LambdaIntegration(this.getListFunction, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' },
    });

    // source for getting feed list
    const getFeedListResource = this.restApi.root.addResource("getFeedList");
    getFeedListResource.addMethod("GET", getRestApiIntegration, {
      apiKeyRequired: true,
    });
  }
}
