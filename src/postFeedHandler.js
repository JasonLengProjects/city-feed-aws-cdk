const AWS = require("aws-sdk");

AWS.config.update({ region: "us-west-2" });

exports.handler = async function (event, context) {
  const requestBody = JSON.parse(event.body);
  console.log(requestBody);

  try {
    const userId = requestBody.userId;
    const title = requestBody.title;
    const content = requestBody.content;
    const timestamp = requestBody.timestamp;
    const region = requestBody.region;
    const fileType = requestBody.media[0].type;
    const fileBase64 = requestBody.media[0].base64;

    let body = {
      code: "0",
      msg: "Success",
      feedId: "testId",
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
