const {
  REGION_MAPPING,
  FEED_DYNAMODB_TABLE_NAME,
  USER_DYNAMODB_TABLE_NAME,
  MEDIA_BUCKET_NAME,
  USER_AVATAR_BUCKET_NAME,
  IMAGE_URL_EXP_SECONDS,
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
      const userId = parameters ? parameters.userId : "defaultId";

      // query params
      const queryParams = {
        TableName: USER_DYNAMODB_TABLE_NAME,
        FilterExpression: "id = :id",
        ExpressionAttributeValues: {
          ":id": { S: userId },
        },
      };

      let body;

      // query user with scan
      const userItems = await ddb.scan(queryParams).promise();

      if (userItems.Items.length == 0) {
        body = {
          code: "1",
          msg: "User Id does not exist.",
        };
      } else {
        const userItem = userItems.Items[0];
        const feedQueryParams = {
          TableName: FEED_DYNAMODB_TABLE_NAME,
          FilterExpression: "userId = :uid",
          ExpressionAttributeValues: {
            ":uid": { S: userId },
          },
        };

        // query user feeds with scan
        const feedItems = await ddb.scan(feedQueryParams).promise();

        // map items into response body
        let feedList = feedItems.Items.map((item) => {
          const imgUrl = s3.getSignedUrl("getObject", {
            Bucket: MEDIA_BUCKET_NAME,
            Key: item.media.M.bucketKey.S,
            Expires: IMAGE_URL_EXP_SECONDS,
          });
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
                type: item.media.M.type.S,
                imgUrl: imgUrl,
              },
            ],
            likes: item.likes.N,
            liked: item.liked.S,
            commentNum: item.commentNum.N,
          };
        });

        const avatarUrl = s3.getSignedUrl("getObject", {
          Bucket: USER_AVATAR_BUCKET_NAME,
          Key: userItem.avatarBucketKey.S,
          Expires: IMAGE_URL_EXP_SECONDS,
        });

        const userDetails = {
          avatar: avatarUrl,
          email: userItem.email.S,
          feedList: feedList.reverse(), // show feeds in order from latest to earliest
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
    }
  } catch (error) {
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
