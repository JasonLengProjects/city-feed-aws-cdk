exports.handler = async function (event, context) {
  try {
    let method = event.httpMethod;

    if (method === "GET") {
      if (event.path === "/") {
        let body = [
          {
            feedId: "feedId1",
            userId: "testUser1",
            title: "Test Title 1",
            avatar: "https://www.w3schools.com/howto/img_avatar.png",
            content:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
            timestamp: Date.parse("19 Oct 2022 00:00:00 GMT").toString(),
            region: "Los Angeles",
            media: [
              {
                type: "png",
                imgUrl:
                  "https://www.pngall.com/wp-content/uploads/8/Sample-PNG-Image.png",
              },
            ],
            likes: 20,
            commentNum: 5,
          },
          {
            feedId: "feedId2",
            userId: "testUser2",
            title: "Test Title 2",
            avatar: "https://www.w3schools.com/howto/img_avatar.png",
            content:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
            timestamp: Date.parse("18 Oct 2022 00:00:00 GMT").toString(),
            region: "Seattle",
            media: [
              {
                type: "png",
                imgUrl:
                  "https://www.pngall.com/wp-content/uploads/8/Sample-PNG-Image.png",
              },
            ],
            likes: 21,
            commentNum: 10,
          },
        ];
        return {
          statusCode: 200,
          headers: {},
          body: JSON.stringify(body),
        };
      }
    }
    // We only accept GET for now
    return {
      statusCode: 400,
      headers: {},
      body: "We only accept GET /",
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
