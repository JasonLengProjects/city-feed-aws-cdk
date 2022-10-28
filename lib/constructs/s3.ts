import { StackProps } from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export interface S3BucketProps extends StackProps {
  bucketName: string;
}

export class S3BucketConstruct extends Construct {
  private bucket: Bucket;
  constructor(scope: Construct, id: string, props: S3BucketProps) {
    super(scope, id);

    this.bucket = new Bucket(this, props.bucketName, {
      bucketName: props.bucketName,
    });
  }
}
