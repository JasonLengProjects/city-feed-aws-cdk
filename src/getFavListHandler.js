const {
  FEED_DYNAMODB_TABLE_NAME,
  USER_LIKED_DYNAMODB_TABLE_NAME,
  MEDIA_BUCKET_NAME,
  IMAGE_URL_EXP_SECONDS,
  FEED_LIKE_STATUS,
} = require("./constants/constants");
const AWS = require("aws-sdk");

AWS.config.update({ region: "us-west-2" });

const s3 = new AWS.S3();
const ddb = new AWS.DynamoDB();

exports.handler = async function (event, context) {
  try {
    const method = event.httpMethod;
    console.log("event ", event);

    if (method === "GET") {
      const parameters = event.queryStringParameters;
      const userId =
        parameters && parameters.userId ? parameters.userId : "defaultId";

      // query like history
      const ddbLikeQueryParams = {
        TableName: USER_LIKED_DYNAMODB_TABLE_NAME,
        ExpressionAttributeValues: {
          ":ui": { S: userId },
        },
        KeyConditionExpression: "userId = :ui",
        ProjectionExpression: "userId, feedId, likedAt",
      };
      const likedItems = await ddb.query(ddbLikeQueryParams).promise();

      // show feeds in order from latest liked to earliest liked
      const likedItemList = likedItems.Items.sort(
        (a, b) => parseInt(b.likedAt.N, 10) - parseInt(a.likedAt.N, 10)
      );

      console.log("Sorted list: ", likedItemList);

      const feedListPromises = likedItemList.map(async (item) => {
        const feedId = item.feedId.S;
        const ddbFeedQueryParams = {
          TableName: FEED_DYNAMODB_TABLE_NAME,
          ExpressionAttributeValues: {
            ":fi": { S: feedId },
          },
          KeyConditionExpression: "id = :fi",
        };
        const feedItems = await ddb.query(ddbFeedQueryParams).promise();
        const feedItem = feedItems.Items[0];

        // get temp url for feed image
        const imgUrl = s3.getSignedUrl("getObject", {
          Bucket: MEDIA_BUCKET_NAME,
          Key: feedItem.media.M.bucketKey.S,
          Expires: IMAGE_URL_EXP_SECONDS,
        });

        return {
          feedId: feedItem.id.S,
          userId: feedItem.userId.S,
          title: feedItem.title.S,
          avatar: "https://www.w3schools.com/howto/img_avatar.png",
          content: feedItem.content.S,
          timestamp: feedItem.createdAt.N,
          region: feedItem.region.S,
          media: [
            {
              type: feedItem.media.M.type.S,
              imgUrl: imgUrl,
            },
          ],
          likes: feedItem.likes.N,
          liked: FEED_LIKE_STATUS.Liked,
          commentNum: feedItem.commentNum.N,
        };
      });

      const feedList = await Promise.all(feedListPromises);

      console.log("FeedList: ", feedList);

      let body = {
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
    }
  } catch (error) {
    let body = error.stack || JSON.stringify(error, null, 2);
    return {
      statusCode: 400,
      headers: {},
      body: JSON.stringify(body),
    };
  }
};
