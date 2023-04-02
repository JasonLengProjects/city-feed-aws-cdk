import {
  REGION_MAPPING,
  FEED_DYNAMODB_TABLE_NAME,
  USER_LIKED_DYNAMODB_TABLE_NAME,
  MEDIA_BUCKET_NAME,
  IMAGE_URL_EXP_SECONDS,
  FEED_LIKE_STATUS,
} from "../constants/constants";
import AWS = require("aws-sdk");
import { Context, APIGatewayEvent } from "aws-lambda";
import {
  DynamoDBQueryParams,
  DynamoDBScanParams,
} from "../interfaces/feedInterfaces";

AWS.config.update({ region: "us-west-2" });
const s3 = new AWS.S3();
const ddb = new AWS.DynamoDB();

export const handler = async function (
  event: APIGatewayEvent,
  context: Context
) {
  try {
    console.log("Header: ", event.headers);
    const jwt = event.requestContext.authorizer?.claims;
    console.log("JWT: ", jwt);

    const parameters = event.queryStringParameters;
    const userId = jwt["cognito:username"] ?? "defaultId";
    const region = parameters?.region ?? "seattle";

    if (!REGION_MAPPING[region as keyof typeof REGION_MAPPING]) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "OPTIONS,POST",
          "X-Requested-With": "*",
          "Access-Control-Allow-Headers":
            "Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-requested-with",
        },
        body: JSON.stringify({
          code: "1",
          msg: "We don't support this region yet.",
        }),
      };
    }

    // query params (currently all)
    const queryParams: DynamoDBScanParams = {
      TableName: FEED_DYNAMODB_TABLE_NAME,
    };

    // query multiple with scan
    const items = await ddb.scan(queryParams).promise();

    console.log("Items: ", items.Items);

    // map items into response body
    const feedListPromises = items.Items?.map(async (item) => {
      // get temp url for feed image
      const imgUrl = s3.getSignedUrl("getObject", {
        Bucket: MEDIA_BUCKET_NAME,
        Key: item.media.M?.bucketKey.S,
        Expires: IMAGE_URL_EXP_SECONDS,
      });

      // query like history
      const ddbLikeQueryParams: DynamoDBQueryParams = {
        TableName: USER_LIKED_DYNAMODB_TABLE_NAME,
        ExpressionAttributeValues: {
          ":ui": { S: userId },
          ":fi": { S: item.id.S },
        },
        KeyConditionExpression: "userId = :ui and feedId = :fi",
        ProjectionExpression: "userId, likedAt",
      };
      const likeItems = await ddb.query(ddbLikeQueryParams).promise();

      // determine if feed already liked by user
      const liked = (
        likeItems.Items?.length == 0
          ? FEED_LIKE_STATUS.Unliked
          : FEED_LIKE_STATUS.Liked
      ).toString();

      return {
        feedId: item.id.S,
        userId: item.userId.S,
        title: item.title.S,
        avatar: "https://www.w3schools.com/howto/img_avatar.png",
        content: item.content.S,
        timestamp: item.createdAt.N,
        region: item.region.S,
        media: [
          {
            type: item.media.M?.type.S,
            imgUrl: imgUrl,
          },
        ],
        likes: item.likes.N,
        liked: liked,
        commentNum: item.commentNum.N,
      };
    });

    const feedList = await Promise.all(feedListPromises ?? []);

    console.log("FeedList: ", feedList);

    let body = {
      code: "0",
      msg: "Success",
      feedList: feedList.sort(
        (a, b) => parseInt(b.timestamp!, 10) - parseInt(a.timestamp!, 10)
      ), // show feeds in order from latest to earliest
    };

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,GET",
        "X-Requested-With": "*",
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-requested-with",
      },
      body: JSON.stringify(body),
    };
  } catch (error: any) {
    let body = error.stack || JSON.stringify(error, null, 2);
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST",
        "X-Requested-With": "*",
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-requested-with",
      },
      body: JSON.stringify(body),
    };
  }
};
