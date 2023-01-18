exports.REGION_MAPPING = {
  losangeles: "Los Angeles",
  seattle: "Seattle",
};

exports.FEED_DYNAMODB_TABLE_NAME = "city-feed-feed-table";

exports.USER_DYNAMODB_TABLE_NAME = "city-feed-user-table";

exports.USER_LIKED_DYNAMODB_TABLE_NAME = "city-feed-user-liked-table";

exports.MEDIA_BUCKET_NAME = "city-feed-media-bucket";

exports.USER_AVATAR_BUCKET_NAME = "city-feed-user-avatar-bucket";

exports.IMAGE_URL_EXP_SECONDS = 300;

exports.FEED_LIKE_STATUS = {
  Liked: "1",
  Unliked: "0",
};
