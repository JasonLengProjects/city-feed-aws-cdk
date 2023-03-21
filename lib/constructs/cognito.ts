import { Construct } from "constructs";
import {
  UserPool,
  SignInAliases,
  UserPoolClient,
} from "aws-cdk-lib/aws-cognito";
import { StackProps, Duration } from "aws-cdk-lib";

export interface CityfeedCognitoProps extends StackProps {
  expUserPoolProps: {
    expUserPoolName: string;
    expUserPoolClientName: string;
  };
}

export class CityFeedCognito extends Construct {
  public readonly expUserPool: UserPool;
  public readonly expUserPoolClient: UserPoolClient;

  constructor(scope: Construct, id: string, props: CityfeedCognitoProps) {
    super(scope, id);

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
  }
}
