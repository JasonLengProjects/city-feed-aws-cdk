import {
  FEED_DYNAMODB_TABLE_NAME,
  MEDIA_BUCKET_NAME,
} from "../constants/constants";
import AWS = require("aws-sdk");
import { Context, APIGatewayEvent } from "aws-lambda";
import {
  DynamoDBFeedTablePutParams,
  S3ImagePutParams,
} from "../interfaces/feedInterfaces";

AWS.config.update({ region: "us-west-2" });
const s3Bucket = new AWS.S3();
var ddb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

exports.handler = async function (event: APIGatewayEvent, context: Context) {
  try {
    const requestBody = JSON.parse(event.body ?? "");
    console.log(requestBody);
    const userId = requestBody.userId;
    const title = requestBody.title;
    const content = requestBody.content;
    const timestamp = Date.now().toString();
    const region = requestBody.region;
    const fileType = requestBody.media[0].type;
    const fileBase64 = requestBody.media[0].base64;

    // save image to S3 first
    const key = getNewKey(userId, timestamp, fileType);

    // convert to buffer
    const buf = Buffer.from(
      fileBase64.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
    // params for s3 put
    const s3Data: S3ImagePutParams = {
      Key: key,
      Body: buf,
      ContentEncoding: "base64",
      ContentType: "image/" + fileType,
      Bucket: MEDIA_BUCKET_NAME,
    };

    await s3Bucket
      .putObject(s3Data, function (err, data) {
        if (err) {
          console.log(err);
          console.log("Error uploading data: ", data);
        } else {
          console.log("Successfully uploaded the image!");
        }
      })
      .promise();

    // handle DynamoDB entry
    const entryId = getEntryId(userId, timestamp);

    const ddbParams: DynamoDBFeedTablePutParams = {
      TableName: FEED_DYNAMODB_TABLE_NAME,
      Item: {
        id: { S: entryId },
        createdAt: { N: timestamp },
        commentNum: { N: "0" },
        content: { S: content },
        likes: { N: "0" },
        media: { M: { type: { S: fileType }, bucketKey: { S: key } } },
        region: { S: region },
        title: { S: title },
        userId: { S: userId },
      },
    };

    await ddb
      .putItem(ddbParams, function (err, data) {
        if (err) {
          console.log("Error", err);
        } else {
          console.log("Success", data);
        }
      })
      .promise();

    let body = {
      code: "0",
      msg: "Success",
      feedId: entryId,
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

// entryId generation/hashing for dynamoDB id
const getEntryId = (userId: string, timestamp: string): string => {
  return userId + "#" + timestamp;
};

// key generation/hashing for s3 object
const getNewKey = (
  userId: string,
  timestamp: string,
  fileType: string
): string => {
  return userId + "#" + timestamp + "." + fileType;
};
