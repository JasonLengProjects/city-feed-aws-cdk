import { Construct } from "constructs";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { StackProps, Duration, CfnOutput } from "aws-cdk-lib";

export interface CityfeedCognitoProps extends StackProps {
  expUserPoolProps: {
    expUserPoolName: string;
    expUserPoolClientName: string;
  };
  userPoolProps: {
    userPoolName: string;
    userPoolClientName: string;
  };
}

export class CityFeedCognito extends Construct {
  // test user pool for future research
  public readonly expUserPool: UserPool;
  public readonly expUserPoolClient: UserPoolClient;

  // main user pool for city feed user accounts
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;

  constructor(scope: Construct, id: string, props: CityfeedCognitoProps) {
    super(scope, id);

    // create test user pool and app client
    this.expUserPool = new UserPool(
      this,
      props.expUserPoolProps.expUserPoolName,
      {
        selfSignUpEnabled: false,
        signInAliases: { email: true, username: true },
      }
    );

    this.expUserPoolClient = new UserPoolClient(
      this,
      props.expUserPoolProps.expUserPoolClientName,
      {
        userPool: this.expUserPool,
        accessTokenValidity: Duration.minutes(60),
        idTokenValidity: Duration.minutes(30),
        refreshTokenValidity: Duration.days(1),
      }
    );

    // create main user pool and app client
    this.userPool = new UserPool(this, props.userPoolProps.userPoolName, {
      selfSignUpEnabled: false,
      signInAliases: { email: true, username: true },
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireLowercase: true,
        requireUppercase: true,
        requireSymbols: true,
      },
    });

    this.userPoolClient = new UserPoolClient(
      this,
      props.userPoolProps.userPoolClientName,
      {
        userPool: this.userPool,
        accessTokenValidity: Duration.minutes(60),
        idTokenValidity: Duration.minutes(30),
        refreshTokenValidity: Duration.days(1),
      }
    );

    // output main user pool id and client id to cfn output
    new CfnOutput(this, "userPoolId", {
      value: this.userPool.userPoolId,
    });

    new CfnOutput(this, "userPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
    });
  }
}
