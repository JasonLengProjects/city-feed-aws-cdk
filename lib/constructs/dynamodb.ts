import { StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Table,
  BillingMode,
  AttributeType,
  ProjectionType,
} from "aws-cdk-lib/aws-dynamodb";

export interface DynamoDBProps extends StackProps {
  dynamoDBFeedTableNames: {
    tableName: string;
    indexNames: {
      createdAtIndexName: string;
      userCreatedAtIndexName: string;
    };
  };
  dynamoDBUserTableName: string;
  dynamoDBUserLikedTableNames: {
    tableName: string;
    indexNames: {
      userLikedAtIndexName: string;
    };
  };
}

export class DynamoDBConstruct extends Construct {
  private feedTable: Table;
  private userTable: Table;
  private userLikedTable: Table;

  constructor(scope: Construct, id: string, props: DynamoDBProps) {
    super(scope, id);

    // create a table for feeds
    this.feedTable = new Table(this, `${id}-feed-table`, {
      tableName: props.dynamoDBFeedTableNames.tableName,
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: { name: "id", type: AttributeType.STRING },
      sortKey: { name: "createdAt", type: AttributeType.NUMBER },
    });

    // create a global secondary index on feed table for querying by timestamp (createdAt)
    this.feedTable.addGlobalSecondaryIndex({
      indexName: props.dynamoDBFeedTableNames.indexNames.createdAtIndexName,
      partitionKey: {
        name: "status",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "createdAt",
        type: AttributeType.NUMBER,
      },
      projectionType: ProjectionType.ALL,
    });

    // create a global secondary index on feed table for querying by userId and timestamp (createdAt)
    this.feedTable.addGlobalSecondaryIndex({
      indexName: props.dynamoDBFeedTableNames.indexNames.userCreatedAtIndexName,
      partitionKey: {
        name: "userId",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "createdAt",
        type: AttributeType.NUMBER,
      },
      projectionType: ProjectionType.ALL,
    });

    // create a table for users
    this.userTable = new Table(this, `${id}-user-table`, {
      tableName: props.dynamoDBUserTableName,
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: { name: "id", type: AttributeType.STRING },
      sortKey: { name: "joinedAt", type: AttributeType.NUMBER },
    });

    // create a table for users' like history
    this.userLikedTable = new Table(this, `${id}-user-liked-table`, {
      tableName: props.dynamoDBUserLikedTableNames.tableName,
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: { name: "userId", type: AttributeType.STRING },
      // sortKey: { name: "likedAt", type: AttributeType.NUMBER },
      sortKey: { name: "feedId", type: AttributeType.STRING },
    });

    // create a global secondary index on user-liked table for querying by userId and timestamp (createdAt)
    this.userLikedTable.addGlobalSecondaryIndex({
      indexName:
        props.dynamoDBUserLikedTableNames.indexNames.userLikedAtIndexName,
      partitionKey: {
        name: "userId",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "likedAt",
        type: AttributeType.NUMBER,
      },
      projectionType: ProjectionType.ALL,
    });
  }
}
