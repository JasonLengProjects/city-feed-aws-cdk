import { StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Table, BillingMode, AttributeType } from "aws-cdk-lib/aws-dynamodb";

export interface DynamoDBProps extends StackProps {
  dynamoDBFeedTableName: string;
  dynamoDBUserTableName: string;
  dynamoDBUserLikedTableName: string;
}

export class DynamoDBConstruct extends Construct {
  private feedTable: Table;
  private userTable: Table;
  private userLikedTable: Table;

  constructor(scope: Construct, id: string, props: DynamoDBProps) {
    super(scope, id);

    this.feedTable = new Table(this, `${id}-feed-table`, {
      tableName: props.dynamoDBFeedTableName,
      billingMode: BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: { name: "id", type: AttributeType.STRING },
      sortKey: { name: "createdAt", type: AttributeType.NUMBER },
    });

    this.userTable = new Table(this, `${id}-user-table`, {
      tableName: props.dynamoDBUserTableName,
      billingMode: BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: { name: "id", type: AttributeType.STRING },
      sortKey: { name: "joinedAt", type: AttributeType.NUMBER },
    });

    this.userLikedTable = new Table(this, `${id}-user-liked-table`, {
      tableName: props.dynamoDBUserLikedTableName,
      billingMode: BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: { name: "id", type: AttributeType.STRING }, // id form: userId#feedId
      sortKey: { name: "likedAt", type: AttributeType.NUMBER },
    });
  }
}
