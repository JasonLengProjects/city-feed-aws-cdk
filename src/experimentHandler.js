const { MEDIA_BUCKET_NAME } = require("./constants/constants");
const AWS = require("aws-sdk");
const { time } = require("console");

AWS.config.update({ region: "us-west-2" });

exports.handler = async function (event, context) {
  const requestBody = JSON.parse(event.body);
  console.log("Request body: ", requestBody);

  console.log("Header: ", event.headers);

  //   const jwt = event.requestContext.authorizer.claims;
  console.log("RequestContext: ", event.requestContext);
  console.log("Authorizer: ", event.requestContext.authorizer);
  console.log("JWT: ", event.requestContext.authorizer.claims);

  try {
    let body = {
      code: "0",
      msg: "Success",
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
  } catch (error) {
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
