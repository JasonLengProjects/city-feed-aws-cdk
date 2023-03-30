import {
  REGION_MAPPING,
  FEED_DYNAMODB_TABLE_NAME,
  USER_DYNAMODB_TABLE_NAME,
  MEDIA_BUCKET_NAME,
  USER_AVATAR_BUCKET_NAME,
  USER_LIKED_DYNAMODB_TABLE_NAME,
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
    const parameters = event.queryStringParameters;
    const userId = parameters?.userId ?? "defaultId";

    // query params
    const queryParams: DynamoDBScanParams = {
      TableName: USER_DYNAMODB_TABLE_NAME,
      FilterExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": { S: userId },
      },
    };

    let body;

    // query user with scan
    const userItems = await ddb.scan(queryParams).promise();

    if (userItems?.Items?.length == 0) {
      body = {
        code: "1",
        msg: "User Id does not exist.",
      };
    } else {
      const userItem = userItems.Items ? userItems.Items[0] : null;
      const feedQueryParams: DynamoDBScanParams = {
        TableName: FEED_DYNAMODB_TABLE_NAME,
        FilterExpression: "userId = :uid",
        ExpressionAttributeValues: {
          ":uid": { S: userId },
        },
      };

      // query user feeds with scan
      const feedItems = await ddb.scan(feedQueryParams).promise();

      // map items into response body
      const feedListPromises = feedItems.Items?.map(async (item) => {
        // get temp url for feed image
        const imgUrl = s3.getSignedUrl("getObject", {
          Bucket: MEDIA_BUCKET_NAME,
          Key: item?.media.M?.bucketKey.S,
          Expires: IMAGE_URL_EXP_SECONDS,
        });

        // get id for user-liked table
        // const entryId = getUserLikedEntryId(userId, item.id.S);

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

      const avatarUrl = s3.getSignedUrl("getObject", {
        Bucket: USER_AVATAR_BUCKET_NAME,
        Key: userItem?.avatarBucketKey.S,
        Expires: IMAGE_URL_EXP_SECONDS,
      });

      const userDetails = {
        avatar: avatarUrl,
        email: userItem?.email.S,
        feedList: feedList.sort(
          (a, b) => parseInt(b.timestamp!, 10) - parseInt(a.timestamp!, 10)
        ), // show feeds in order from latest to earliest
      };

      body = {
        code: "0",
        msg: "Success",
        userDetails: userDetails,
      };
    }
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
        "Access-Control-Allow-Methods": "OPTIONS,GET",
        "X-Requested-With": "*",
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-requested-with",
      },
      body: JSON.stringify(body),
    };
  }
};
