import {
  REGION_MAPPING,
  FEED_DYNAMODB_TABLE_NAME,
  FEED_DYNMODB_CREATED_AT_INDEX_NAME,
  USER_LIKED_DYNAMODB_TABLE_NAME,
  MEDIA_BUCKET_NAME,
  IMAGE_URL_EXP_SECONDS,
  FEED_LIKE_STATUS,
} from "../constants/constants";
import AWS = require("aws-sdk");
import { Context, APIGatewayEvent } from "aws-lambda";
import {
  DynamoDBQueryParams,
  FeedResponseObj,
} from "../interfaces/feedInterfaces";

export interface GetFeedListResponseBody {
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
    const region = parameters?.region ?? "seattle";

    if (!REGION_MAPPING[region as keyof typeof REGION_MAPPING]) {
      return getBadResponse("We don't support this region yet.");
    }

    // query params for 10 lastest feeds
    const queryParams: DynamoDBQueryParams = {
      TableName: FEED_DYNAMODB_TABLE_NAME,
      IndexName: FEED_DYNMODB_CREATED_AT_INDEX_NAME,
      KeyConditionExpression: "#status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": { S: "public" },
      },
      ScanIndexForward: false,
      Limit: 10,
    };

    // query feeds
    const items = await ddb.query(queryParams).promise();

    console.log("Items: ", items.Items);

    // map items into response body
    const feedListPromises = items.Items?.map(async (item) => {
      // get temp url for feed image
      const imgUrl = s3.getSignedUrl("getObject", {
        Bucket: MEDIA_BUCKET_NAME,
        Key: item.media?.M?.bucketKey.S,
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

      const feedItemObj: FeedResponseObj = {
        feedId: item.id.S!,
        userId: item.userId.S!,
        title: item.title.S!,
        avatar: "https://www.w3schools.com/howto/img_avatar.png",
        content: item.content.S!,
        timestamp: item.createdAt.N!,
        region: item.region.S!,
        media: [
          {
            type: item.media?.M?.type.S!,
            imgUrl: imgUrl,
          },
        ],
        likes: item.likes.N!,
        liked: liked,
        commentNum: item.commentNum.N!,
        hashtags: item.hashtags.SS!,
        status: item.status.S!,
      };

      return feedItemObj;
    });

    const feedList = await Promise.all(feedListPromises ?? []);

    console.log("FeedList: ", feedList);

    const body: GetFeedListResponseBody = {
      code: "0",
      msg: "Success",
      feedList: feedList,
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
    const body = error.stack || JSON.stringify(error, null, 2);
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

const getBadResponse = (msg: string) => {
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
      msg: msg,
    }),
  };
};
