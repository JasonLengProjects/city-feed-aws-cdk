const { REGION_MAPPING } = require("./constants/constants");

exports.handler = async function (event, context) {
  try {
    const method = event.httpMethod;
    console.log("event ", event);

    if (method === "GET") {
      const parameters = event.queryStringParameters;
      const userId = parameters ? parameters.userId : "defaultId";
      const region = parameters ? parameters.region : "seattle";
      if (!REGION_MAPPING[region]) {
        return {
          statusCode: 400,
          headers: {},
          body: "We don't support this region yet.",
        };
      }
      let body = {
        code: "0",
        msg: "Success",
        feedList: [
          {
            feedId: "feedId1",
            userId: "testUser1",
            title: "Test Title 1",
            avatar: "https://www.w3schools.com/howto/img_avatar.png",
            content:
              "These impressive and pretty sweets were sold in XXXXX store, this place is perfect to hang out with your friend, these impressive and pretty sweets were sold in XXXXX store, this place is perfect to hang out with your friend, these impressive and pretty sweets were sold in XXXXX store, this place is perfect to hang out with your friend, these impressive and pretty sweets were sold in XXXXX store.",
            timestamp: Date.parse("19 Oct 2022 00:00:00 GMT").toString(),
            region: REGION_MAPPING[region],
            media: [
              {
                type: "jpg",
                imgUrl:
                  "https://s3-media1.fl.yelpcdn.com/bphoto/Ths0O6Y-_vvS_NtPE7nmsg/o.jpg",
              },
            ],
            likes: 20,
            liked: "0",
            commentNum: 5,
          },
          {
            feedId: "feedId2",
            userId: "testUser2",
            title: "Test Title 2",
            avatar: "https://www.w3schools.com/howto/img_avatar.png",
            content:
              "These impressive and pretty sweets were sold in XXXXX store, this place is perfect to hang out with your friend, these impressive and pretty sweets were sold in XXXXX store, this place is perfect to hang out with your friend, these impressive and pretty sweets were sold in XXXXX store, this place is perfect to hang out with your friend, these impressive and pretty sweets were sold in XXXXX store.",
            timestamp: Date.parse("18 Oct 2022 00:00:00 GMT").toString(),
            region: REGION_MAPPING[region],
            media: [
              {
                type: "jpg",
                imgUrl:
                  "https://media-cdn.tripadvisor.com/media/photo-p/17/8f/11/e5/1558094276338-largejpg.jpg",
              },
            ],
            likes: 21,
            liked: "1",
            commentNum: 10,
          },
        ],
      };
      return {
        statusCode: 200,
        headers: {},
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
