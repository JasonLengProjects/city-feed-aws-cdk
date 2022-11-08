import { Construct } from "constructs";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import {
  RestApi,
  LambdaIntegration,
  ApiKey,
  UsagePlanProps,
  Period,
} from "aws-cdk-lib/aws-apigateway";
import { PolicyStatement, AnyPrincipal } from "aws-cdk-lib/aws-iam";
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
    
    // policies for dynamodb-readonly
    this.getListFunction.addToRolePolicy(
      new PolicyStatement({
        actions: [
          "application-autoscaling:DescribeScalableTargets",
          "application-autoscaling:DescribeScalingActivities",
          "application-autoscaling:DescribeScalingPolicies",
          "cloudwatch:DescribeAlarmHistory",
          "cloudwatch:DescribeAlarms",
          "cloudwatch:DescribeAlarmsForMetric",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "cloudwatch:GetMetricData",
          "datapipeline:DescribeObjects",
          "datapipeline:DescribePipelines",
          "datapipeline:GetPipelineDefinition",
          "datapipeline:ListPipelines",
          "datapipeline:QueryObjects",
          "dynamodb:BatchGetItem",
          "dynamodb:Describe*",
          "dynamodb:List*",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:PartiQLSelect",
          "dax:Describe*",
          "dax:List*",
          "dax:GetItem",
          "dax:BatchGetItem",
          "dax:Query",
          "dax:Scan",
          "ec2:DescribeVpcs",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "iam:GetRole",
          "iam:ListRoles",
          "kms:DescribeKey",
          "kms:ListAliases",
          "sns:ListSubscriptionsByTopic",
          "sns:ListTopics",
          "lambda:ListFunctions",
          "lambda:ListEventSourceMappings",
          "lambda:GetFunctionConfiguration",
          "resource-groups:ListGroups",
          "resource-groups:ListGroupResources",
          "resource-groups:GetGroup",
          "resource-groups:GetGroupQuery",
          "tag:GetResources",
          "kinesis:ListStreams",
          "kinesis:DescribeStream",
          "kinesis:DescribeStreamSummary",
        ],
        resources: ["*"],
      })
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
