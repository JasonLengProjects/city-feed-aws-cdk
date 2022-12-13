import { StackProps } from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export interface S3BucketProps extends StackProps {
  feedImageBucketName: string;
  userAvatarBucketName: string;
}

export class S3BucketConstruct extends Construct {
  private feedImageBucket: Bucket;
  private userAvatarBucket: Bucket;
  constructor(scope: Construct, id: string, props: S3BucketProps) {
    super(scope, id);

    this.feedImageBucket = new Bucket(this, props.feedImageBucketName, {
      bucketName: props.feedImageBucketName,
    });

    this.userAvatarBucket = new Bucket(this, props.userAvatarBucketName, {
      bucketName: props.userAvatarBucketName,
    });
  }
}
