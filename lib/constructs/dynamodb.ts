import { StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Table, BillingMode, AttributeType } from "aws-cdk-lib/aws-dynamodb";

export interface DynamoDBProps extends StackProps {
  dynamoDBTableName: string;
}

export class DynamoDBConstruct extends Construct {
  private table: Table;
  constructor(scope: Construct, id: string, props: DynamoDBProps) {
    super(scope, id);

    this.table = new Table(this, id, {
      tableName: props.dynamoDBTableName,
      billingMode: BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: { name: "id", type: AttributeType.STRING },
      sortKey: { name: "createdAt", type: AttributeType.NUMBER },
    });
  }
}
