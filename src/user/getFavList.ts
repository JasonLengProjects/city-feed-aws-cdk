import {
  FEED_DYNAMODB_TABLE_NAME,
  USER_LIKED_DYNAMODB_TABLE_NAME,
  USER_LIKED_DYNAMODB_USER_LIKED_AT_INDEX_NAME,
  MEDIA_BUCKET_NAME,
  IMAGE_URL_EXP_SECONDS,
  FEED_LIKE_STATUS,
} from "../constants/constants";
import AWS = require("aws-sdk");
import { Context, APIGatewayEvent } from "aws-lambda";
import { DynamoDBQueryParams } from "../interfaces/feedInterfaces";
import { FeedResponseObj } from "../interfaces/feedInterfaces";

export interface GetFavListResponseBody {
  code: string;
  msg: string;
  feedList: FeedResponseObj[];
}

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

    // const queryParams: DynamoDBQueryParams = {
    //   TableName: FEED_DYNAMODB_TABLE_NAME,
    //   IndexName: FEED_DYNMODB_CREATED_AT_INDEX_NAME,
    //   KeyConditionExpression: "#status = :status",
    //   ExpressionAttributeNames: {
    //     "#status": "status",
    //   },
    //   ExpressionAttributeValues: {
    //     ":status": { S: "public" },
    //   },
    //   ScanIndexForward: false,
    //   Limit: 10,
    // };
    // query like history
    const ddbLikeQueryParams: DynamoDBQueryParams = {
      TableName: USER_LIKED_DYNAMODB_TABLE_NAME,
      IndexName: USER_LIKED_DYNAMODB_USER_LIKED_AT_INDEX_NAME,
      KeyConditionExpression: "userId = :ui",
      ExpressionAttributeValues: {
        ":ui": { S: userId },
      },
      ProjectionExpression: "userId, feedId, likedAt",
      ScanIndexForward: false,
      Limit: 10,
    };
    const likedItems = await ddb.query(ddbLikeQueryParams).promise();

    const likedItemList = likedItems.Items;

    console.log("Sorted list: ", likedItemList);

    const feedListPromises = likedItemList?.map(async (item) => {
      const feedId = item.feedId.S;
      const ddbFeedQueryParams: DynamoDBQueryParams = {
        TableName: FEED_DYNAMODB_TABLE_NAME,
        ExpressionAttributeValues: {
          ":fi": { S: feedId },
        },
        KeyConditionExpression: "id = :fi",
      };
      const feedItems = await ddb.query(ddbFeedQueryParams).promise();

      // check if feed exists
      const feedItem = feedItems.Items
        ? feedItems.Items.length !== 0
          ? feedItems.Items[0]
          : null
        : null;

      if (!feedItem) {
        return null;
      }

      // get temp url for feed image
      const imgUrl = s3.getSignedUrl("getObject", {
        Bucket: MEDIA_BUCKET_NAME,
        Key: feedItem?.media.M?.bucketKey.S,
        Expires: IMAGE_URL_EXP_SECONDS,
      });

      const feedItemObj: FeedResponseObj = {
        feedId: feedItem?.id.S!,
        userId: feedItem?.userId.S!,
        title: feedItem?.title.S!,
        avatar: "https://www.w3schools.com/howto/img_avatar.png",
        content: feedItem?.content.S!,
        timestamp: feedItem?.createdAt.N!,
        region: feedItem?.region.S!,
        media: [
          {
            type: feedItem?.media.M?.type.S!,
            imgUrl: imgUrl,
          },
        ],
        likes: feedItem?.likes.N!,
        liked: FEED_LIKE_STATUS.Liked.toString(),
        commentNum: feedItem?.commentNum.N!,
      };

      return feedItemObj;
    });

    const feedList = await Promise.all(feedListPromises ?? []);

    const feedlistFiltered = feedList.filter((item) => item !== null);

    console.log("FeedList: ", feedlistFiltered);

    let body: GetFavListResponseBody = {
      code: "0",
      msg: "Success",
      feedList: feedlistFiltered as FeedResponseObj[],
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
