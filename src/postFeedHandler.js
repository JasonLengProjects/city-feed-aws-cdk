const {
  REGION_MAPPING,
  FEED_DYNAMODB_TABLE_NAME,
  MEDIA_BUCKET_NAME,
} = require("./constants/constants");
const AWS = require("aws-sdk");
const { time } = require("console");

AWS.config.update({ region: "us-west-2" });
const s3Bucket = new AWS.S3({ params: { Bucket: MEDIA_BUCKET_NAME } });
var ddb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

exports.handler = async function (event, context) {
  const requestBody = JSON.parse(event.body);
  console.log(requestBody);

  try {
    const userId = requestBody.userId;
    const title = requestBody.title;
    const content = requestBody.content;
    // const timestamp = requestBody.timestamp;
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
    const s3Data = {
      Key: key,
      Body: buf,
      ContentEncoding: "base64",
      ContentType: "image/" + fileType,
    };

    await s3Bucket
      .putObject(s3Data, function (err, data) {
        if (err) {
          console.log(err);
          console.log("Error uploading data: ", data);
          key = "INVALID_KEY";
        } else {
          console.log("Successfully uploaded the image!");
        }
      })
      .promise();

    // handle DynamoDB entry
    const entryId = getEntryId(userId, timestamp);

    const ddbParams = {
      TableName: FEED_DYNAMODB_TABLE_NAME,
      Item: {
        id: { S: entryId },
        createdAt: { N: timestamp },
        commentNum: { N: "0" },
        content: { S: content },
        liked: { S: "0" },
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
      headers: {},
      body: JSON.stringify(body),
    };
  } catch (error) {
    let body = error.stack || JSON.stringify(error, null, 2);
    return {
      statusCode: 400,
      headers: {},
      body: JSON.stringify(body),
    };
  }
};

// entryId generation/hashing for dynamoDB id
const getEntryId = (userId, timestamp) => {
  return userId + timestamp;
};

// key generation/hashing for s3 object
const getNewKey = (userId, timestamp, fileType) => {
  return userId + timestamp + "." + fileType;
};
