import { Construct } from "constructs";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import {
  RestApi,
  LambdaIntegration,
  Period,
  Cors,
  AuthorizationType,
  CfnAuthorizer,
} from "aws-cdk-lib/aws-apigateway";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Duration, StackProps } from "aws-cdk-lib";
import { UserPool } from "aws-cdk-lib/aws-cognito";

export enum RolePolicyLevel {
  All,
  DynamoReadOnly,
}

export interface CityfeedServiceProps extends StackProps {
  lambdaFunctionNames: {
    getFeedListFunctionName: string;
    getUserFeedListFunctionName: string;
    postFeedFuntionName: string;
    getUserDetailFunctionName: string;
    likeFeedFunctionName: string;
    getFavListFunctionName: string;
    experimentFunctionName: string;
  }; // lambda function names
  apiKeyName: string; // api key name
  authorizerProps: {
    expUserPool: UserPool;
    expAuthorizerName: string;
    mainUserPool: UserPool;
    mainAuthorizerName: string;
  };
}

export class CityFeedService extends Construct {
  private restApi: RestApi;
  private getListFunction: Function;
  private getUserFeedListFunction: Function;
  private postFeedFunction: Function;
  private getUserDetailFunction: Function;
  private likeFeedFunction: Function;
  private getFavListFunction: Function;

  private mainAuthorizer: CfnAuthorizer;

  // test only
  private experimentFunction: Function;
  private experimentAuthorizer: CfnAuthorizer;

  constructor(scope: Construct, id: string, props: CityfeedServiceProps) {
    super(scope, id);

    // test only
    this.experimentFunction = new NodejsFunction(
      this,
      props.lambdaFunctionNames.experimentFunctionName,
      {
        functionName: props.lambdaFunctionNames.experimentFunctionName,
        runtime: Runtime.NODEJS_18_X,
        entry: "src/experimentHandler.ts",
        handler: "handler",
        timeout: Duration.seconds(10),
        environment: {},
      }
    );
    addFuntionRolePolicy(this.experimentFunction, RolePolicyLevel.All);

    // create lambda function for getListFunction
    this.getListFunction = new NodejsFunction(
      this,
      props.lambdaFunctionNames.getFeedListFunctionName,
      {
        functionName: props.lambdaFunctionNames.getFeedListFunctionName,
        runtime: Runtime.NODEJS_18_X,
        entry: "src/feed/getFeedList.ts",
        handler: "handler",
        timeout: Duration.seconds(10),
        environment: {},
      }
    );
    addFuntionRolePolicy(this.getListFunction, RolePolicyLevel.DynamoReadOnly);

    // create lambda function for getUserFeedListFunction
    this.getUserFeedListFunction = new NodejsFunction(
      this,
      props.lambdaFunctionNames.getUserFeedListFunctionName,
      {
        functionName: props.lambdaFunctionNames.getUserFeedListFunctionName,
        runtime: Runtime.NODEJS_18_X,
        entry: "src/feed/getUserFeedList.ts",
        handler: "handler",
        timeout: Duration.seconds(10),
        environment: {},
      }
    );
    addFuntionRolePolicy(
      this.getUserFeedListFunction,
      RolePolicyLevel.DynamoReadOnly
    );

    this.postFeedFunction = new NodejsFunction(
      this,
      props.lambdaFunctionNames.postFeedFuntionName,
      {
        functionName: props.lambdaFunctionNames.postFeedFuntionName,
        runtime: Runtime.NODEJS_18_X,
        entry: "src/feed/postFeed.ts",
        handler: "handler",
        timeout: Duration.seconds(10),
        environment: {},
      }
    );
    addFuntionRolePolicy(this.postFeedFunction, RolePolicyLevel.All);

    // create lambda function for getUserDetailFunction
    this.getUserDetailFunction = new NodejsFunction(
      this,
      props.lambdaFunctionNames.getUserDetailFunctionName,
      {
        functionName: props.lambdaFunctionNames.getUserDetailFunctionName,
        runtime: Runtime.NODEJS_18_X,
        entry: "src/user/getUserDetail.ts",
        handler: "handler",
        timeout: Duration.seconds(10),
        environment: {},
      }
    );
    addFuntionRolePolicy(
      this.getUserDetailFunction,
      RolePolicyLevel.DynamoReadOnly
    );

    // create lambda function for likeFeedFunction
    this.likeFeedFunction = new NodejsFunction(
      this,
      props.lambdaFunctionNames.likeFeedFunctionName,
      {
        functionName: props.lambdaFunctionNames.likeFeedFunctionName,
        runtime: Runtime.NODEJS_18_X,
        entry: "src/feed/likeFeed.ts",
        handler: "handler",
        timeout: Duration.seconds(10),
        environment: {},
      }
    );
    addFuntionRolePolicy(this.likeFeedFunction, RolePolicyLevel.All);

    // create lambda function for getUserDetailFunction
    this.getFavListFunction = new NodejsFunction(
      this,
      props.lambdaFunctionNames.getFavListFunctionName,
      {
        functionName: props.lambdaFunctionNames.getFavListFunctionName,
        runtime: Runtime.NODEJS_18_X,
        entry: "src/user/getFavList.ts",
        handler: "handler",
        timeout: Duration.seconds(10),
        environment: {},
      }
    );
    addFuntionRolePolicy(
      this.getFavListFunction,
      RolePolicyLevel.DynamoReadOnly
    );

    // create rest api
    this.restApi = new RestApi(this, id + "RestApi", {
      restApiName: id + "RestApi",
      description: "This is the first test Api for CityFeed",
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS, // this is also the default
      },
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

    // create api gateway authorizers

    // test only
    // authorizer for experimental api
    this.experimentAuthorizer = new CfnAuthorizer(
      this,
      props.authorizerProps.expAuthorizerName,
      {
        name: props.authorizerProps.expAuthorizerName,
        type: "COGNITO_USER_POOLS",
        identitySource: "method.request.header.Authorization",
        providerArns: [props.authorizerProps.expUserPool.userPoolArn],
        restApiId: this.restApi.restApiId,
      }
    );

    // authorizer for token-required APIs
    this.mainAuthorizer = new CfnAuthorizer(
      this,
      props.authorizerProps.mainAuthorizerName,
      {
        name: props.authorizerProps.mainAuthorizerName,
        type: "COGNITO_USER_POOLS",
        identitySource: "method.request.header.Authorization",
        providerArns: [props.authorizerProps.mainUserPool.userPoolArn],
        restApiId: this.restApi.restApiId,
      }
    );

    // bind lambda to api
    const getRestApiIntegration = new LambdaIntegration(this.getListFunction, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' },
    });

    const getUserFeedListApiIntegration = new LambdaIntegration(
      this.getUserFeedListFunction,
      {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      }
    );

    const postFeedRestApiIntegration = new LambdaIntegration(
      this.postFeedFunction,
      {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      }
    );

    const getUserDetailApiIntegration = new LambdaIntegration(
      this.getUserDetailFunction,
      {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      }
    );

    const likeFeedRestApiIntegration = new LambdaIntegration(
      this.likeFeedFunction,
      {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      }
    );

    const getFavListRestApiIntegration = new LambdaIntegration(
      this.getFavListFunction,
      {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      }
    );

    // test only
    const experimentRestApiIntegration = new LambdaIntegration(
      this.experimentFunction,
      {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      }
    );

    // source for getting feed list
    const getFeedListResource = this.restApi.root.addResource("getFeedList");
    getFeedListResource.addMethod("GET", getRestApiIntegration, {
      apiKeyRequired: true,
    });

    // source for getting user specific feed list
    const getUserFeedListResource =
      this.restApi.root.addResource("getUserFeedList");
    getUserFeedListResource.addMethod("GET", getUserFeedListApiIntegration, {
      apiKeyRequired: true,
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: this.mainAuthorizer.ref,
      },
    });

    // source for posting feed
    const postFeedResource = this.restApi.root.addResource("postFeed");
    postFeedResource.addMethod("POST", postFeedRestApiIntegration, {
      apiKeyRequired: true,
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: this.mainAuthorizer.ref,
      },
    });

    // source for getting user detail
    const getUserDetailResource =
      this.restApi.root.addResource("getUserDetail");
    getUserDetailResource.addMethod("GET", getUserDetailApiIntegration, {
      apiKeyRequired: true,
    });

    // source for like feed
    const likeFeedResource = this.restApi.root.addResource("likeFeed");
    likeFeedResource.addMethod("POST", likeFeedRestApiIntegration, {
      apiKeyRequired: true,
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: this.mainAuthorizer.ref,
      },
    });

    // source for getting favorite list
    const getFavListResource = this.restApi.root.addResource("getFavList");
    getFavListResource.addMethod("GET", getFavListRestApiIntegration, {
      apiKeyRequired: true,
    });

    // test only
    // source for experimental api
    const experimentResource = this.restApi.root.addResource("experiment");
    experimentResource.addMethod("POST", experimentRestApiIntegration, {
      apiKeyRequired: true,
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: this.experimentAuthorizer.ref,
      },
    });
  }
}

const addFuntionRolePolicy = (
  targetFunction: Function,
  policyLevel: RolePolicyLevel
) => {
  if (policyLevel == RolePolicyLevel.All) {
    targetFunction.addToRolePolicy(
      new PolicyStatement({
        actions: [
          "s3:*",
          "s3-object-lambda:*",
          "dynamodb:*",
          "dax:*",
          "application-autoscaling:DeleteScalingPolicy",
          "application-autoscaling:DeregisterScalableTarget",
          "application-autoscaling:DescribeScalableTargets",
          "application-autoscaling:DescribeScalingActivities",
          "application-autoscaling:DescribeScalingPolicies",
          "application-autoscaling:PutScalingPolicy",
          "application-autoscaling:RegisterScalableTarget",
          "cloudwatch:DeleteAlarms",
          "cloudwatch:DescribeAlarmHistory",
          "cloudwatch:DescribeAlarms",
          "cloudwatch:DescribeAlarmsForMetric",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "cloudwatch:PutMetricAlarm",
          "cloudwatch:GetMetricData",
          "datapipeline:ActivatePipeline",
          "datapipeline:CreatePipeline",
          "datapipeline:DeletePipeline",
          "datapipeline:DescribeObjects",
          "datapipeline:DescribePipelines",
          "datapipeline:GetPipelineDefinition",
          "datapipeline:ListPipelines",
          "datapipeline:PutPipelineDefinition",
          "datapipeline:QueryObjects",
          "ec2:DescribeVpcs",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "iam:GetRole",
          "iam:ListRoles",
          "kms:DescribeKey",
          "kms:ListAliases",
          "sns:CreateTopic",
          "sns:DeleteTopic",
          "sns:ListSubscriptions",
          "sns:ListSubscriptionsByTopic",
          "sns:ListTopics",
          "sns:Subscribe",
          "sns:Unsubscribe",
          "sns:SetTopicAttributes",
          "lambda:CreateFunction",
          "lambda:ListFunctions",
          "lambda:ListEventSourceMappings",
          "lambda:CreateEventSourceMapping",
          "lambda:DeleteEventSourceMapping",
          "lambda:GetFunctionConfiguration",
          "lambda:DeleteFunction",
          "resource-groups:ListGroups",
          "resource-groups:ListGroupResources",
          "resource-groups:GetGroup",
          "resource-groups:GetGroupQuery",
          "resource-groups:DeleteGroup",
          "resource-groups:CreateGroup",
          "tag:GetResources",
          "kinesis:ListStreams",
          "kinesis:DescribeStream",
          "kinesis:DescribeStreamSummary",
        ],
        resources: ["*"],
      })
    );
  } else if (policyLevel == RolePolicyLevel.DynamoReadOnly) {
    targetFunction.addToRolePolicy(
      new PolicyStatement({
        actions: [
          "s3:Get*",
          "s3:List*",
          "s3-object-lambda:Get*",
          "s3-object-lambda:List*",
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
  }
};
