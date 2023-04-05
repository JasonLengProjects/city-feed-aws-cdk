import {
  FEED_DYNAMODB_TABLE_NAME,
  USER_LIKED_DYNAMODB_TABLE_NAME,
  FEED_LIKE_STATUS,
} from "../constants/constants";
import AWS = require("aws-sdk");
import { Context, APIGatewayEvent } from "aws-lambda";
import {
  DynamoDBFeedTableUpdateParams,
  DynamoDBQueryParams,
  DynamoDBUserLikedTableDeleteParams,
} from "../interfaces/feedInterfaces";
import { DynamoDBUserLikedTablePutParams } from "../interfaces/feedInterfaces";

export interface LikeFeedResponseBody {
  code: string;
  msg: string;
  liked: string;
  likes: string;
}

AWS.config.update({ region: "us-west-2" });
var ddb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

export const handler = async function (
  event: APIGatewayEvent,
  context: Context
) {
  try {
    const jwt = event.requestContext.authorizer?.claims;
    console.log("JWT: ", jwt);

    const requestBody = JSON.parse(event.body ?? "{}");
    console.log("Request body: ", requestBody);

    const userId = jwt["cognito:username"] ?? "defaultId";
    const feedId = requestBody.feedId;
    const like = requestBody.like;
    const timestamp = Date.now().toString();

    // query feed
    const ddbFeedQueryParams: DynamoDBQueryParams = {
      TableName: FEED_DYNAMODB_TABLE_NAME,
      ExpressionAttributeValues: {
        ":i": { S: feedId },
      },
      KeyConditionExpression: "id = :i",
      ProjectionExpression: "id, likes, createdAt",
    };
    const feedItems = await ddb.query(ddbFeedQueryParams).promise();
    console.log("Feed items: ", feedItems.Items);
    if (feedItems.Items != null && feedItems.Items.length == 0) {
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
          msg: "Feed not found.",
        }),
      };
    }

    // query like history
    const ddbLikeQueryParams: DynamoDBQueryParams = {
      TableName: USER_LIKED_DYNAMODB_TABLE_NAME,
      ExpressionAttributeValues: {
        ":ui": { S: userId },
        ":fi": { S: feedId },
      },
      KeyConditionExpression: "userId = :ui and feedId = :fi",
      ProjectionExpression: "id, likedAt",
    };

    const likeItems = await ddb.query(ddbLikeQueryParams).promise();
    console.log("Like items: ", likeItems.Items);

    // return variables
    let liked =
      likeItems.Items?.length == 0
        ? FEED_LIKE_STATUS.Unliked
        : FEED_LIKE_STATUS.Liked;
    let likes =
      parseInt(feedItems.Items ? feedItems.Items[0].likes.N! : "0") || 0;

    if (likeItems.Items?.length == 0 && like == FEED_LIKE_STATUS.Liked) {
      // no like history && user likes the feed
      const newLikeParams: DynamoDBUserLikedTablePutParams = {
        TableName: USER_LIKED_DYNAMODB_TABLE_NAME,
        Item: {
          userId: { S: userId },
          feedId: { S: feedId },
          likedAt: { N: timestamp },
        },
      };
      await ddb
        .putItem(newLikeParams, function (err, data) {
          if (err) {
            console.log("New like error: ", err);
          } else {
            liked = FEED_LIKE_STATUS.Liked;
            console.log("New like: ", data);
          }
        })
        .promise();
      // increment return likes
      likes += 1;
      // update feed table item
      const ddbFeedUpdateParams: DynamoDBFeedTableUpdateParams = {
        TableName: FEED_DYNAMODB_TABLE_NAME,
        Key: {
          id: { S: feedId },
          createdAt: {
            N: feedItems.Items ? feedItems.Items[0].createdAt.N! : "0",
          },
        },
        ExpressionAttributeNames: {
          "#L": "likes",
        },
        ExpressionAttributeValues: {
          ":l": { N: likes.toString() },
        },
        UpdateExpression: "SET #L = :l",
      };
      await ddb
        .updateItem(ddbFeedUpdateParams, function (err, data) {
          if (err) console.log("Update likes error: ", err, err.stack);
          // an error occurred
          else console.log("Update likes: ", data); // successful response
        })
        .promise();
    } else if (
      likeItems.Items?.length != 0 &&
      like == FEED_LIKE_STATUS.Unliked
    ) {
      // liked before && user unlikes the feed
      const deleteLikeParams: DynamoDBUserLikedTableDeleteParams = {
        TableName: USER_LIKED_DYNAMODB_TABLE_NAME,
        Key: {
          userId: { S: userId },
          feedId: { S: feedId },
        },
      };
      await ddb
        .deleteItem(deleteLikeParams, function (err, data) {
          if (err) {
            console.log("Delete like error: ", err);
          } else {
            liked = FEED_LIKE_STATUS.Unliked;
            console.log("Delete like: ", data);
          }
        })
        .promise();

      likes = likes - 1 < 0 ? 0 : likes - 1;

      const ddbFeedUpdateParams: DynamoDBFeedTableUpdateParams = {
        TableName: FEED_DYNAMODB_TABLE_NAME,
        Key: {
          id: { S: feedId },
          createdAt: {
            N: feedItems.Items ? feedItems.Items[0].createdAt.N! : "0",
          },
        },
        ExpressionAttributeNames: {
          "#L": "likes",
        },
        ExpressionAttributeValues: {
          ":l": { N: likes.toString() },
        },
        UpdateExpression: "SET #L = :l",
      };
      await ddb
        .updateItem(ddbFeedUpdateParams, function (err, data) {
          if (err) console.log("Update likes error: ", err, err.stack);
          // an error occurred
          else console.log("Update likes: ", data); // successful response
        })
        .promise();
    }

    let body: LikeFeedResponseBody = {
      code: "0",
      msg: "Success",
      liked: liked.toString(),
      likes: likes.toString(),
    };

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST",
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
