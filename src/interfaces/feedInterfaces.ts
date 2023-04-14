import { S3 } from "aws-sdk";

export interface FeedResponseObj {
  feedId: string;
  userId: string;
  title: string;
  avatar: string;
  content: string;
  timestamp: string;
  region: string;
  media: [
    {
      type: string;
      imgUrl: string;
    }
  ];
  likes: string;
  liked: string;
  commentNum: string;
}

export interface DynamoDBFeedTablePutParams {
  TableName: string;
  Item: {
    id: { S: string };
    createdAt: { N: string };
    commentNum: { N: string };
    content: { S: string };
    likes: { N: string };
    media: {
      M: {
        type: { S: string };
        bucketKey: { S: string };
      };
    };
    region: { S: string };
    title: { S: string };
    userId: { S: string };
    status: { S: string };
    hashtags: { SS: string[] };
  };
}

export interface DynamoDBScanParams {
  TableName: string;
  FilterExpression?: string;
  ExpressionAttributeValues?: {};
  ProjectionExpression?: string;
}

export interface DynamoDBQueryParams {
  TableName: string;
  ExpressionAttributeValues?: {};
  KeyConditionExpression?: string;
  ProjectionExpression?: string;
}

export interface DynamoDBUserLikedTablePutParams {
  TableName: string;
  Item: {
    userId: { S: string };
    feedId: { S: string };
    likedAt: { N: string };
  };
}

export interface DynamoDBFeedTableUpdateParams {
  TableName: string;
  Key: {
    id: { S: string };
    createdAt: { N: string };
  };
  ExpressionAttributeNames?: {};
  ExpressionAttributeValues?: {};
  UpdateExpression?: string;
}

export interface DynamoDBUserLikedTableDeleteParams {
  TableName: string;
  Key: {
    userId: { S: string };
    feedId: { S: string };
  };
}

export interface S3ImagePutParams extends S3.PutObjectRequest {
  Key: string;
  Body: Buffer;
  ContentEncoding: string;
  ContentType: string;
}
