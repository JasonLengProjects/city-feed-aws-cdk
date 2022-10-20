import { Construct } from "constructs";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { RestApi, LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { Duration, StackProps } from "aws-cdk-lib";

export interface CityfeedServiceProps extends StackProps {
  lambdaFunctionName: string; // lambda function name
}

export class CityFeedService extends Construct {
  private restApi: RestApi;
  private lambdaFunction: Function;

  constructor(scope: Construct, id: string, props: CityfeedServiceProps) {
    super(scope, id);

    this.lambdaFunction = new Function(this, props.lambdaFunctionName, {
      functionName: props.lambdaFunctionName,
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset("src"),
      handler: "handler.hanlder",
      timeout: Duration.seconds(10),
      environment: {},
    });

    this.restApi = new RestApi(this, id + "RestApi", {
      restApiName: id + "RestApi",
      description: "This is the first test API for CityFeed",
    });

    const getRestApiIntegration = new LambdaIntegration(this.lambdaFunction, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' },
    });

    this.restApi.root.addMethod("GET", getRestApiIntegration);
  }
}
