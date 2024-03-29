export const REGION_MAPPING = {
  losangeles: "Los Angeles",
  seattle: "Seattle",
};

export const FEED_DYNAMODB_TABLE_NAME = "city-feed-feed-table";

export const USER_DYNAMODB_TABLE_NAME = "city-feed-user-table";

export const USER_LIKED_DYNAMODB_TABLE_NAME = "city-feed-user-liked-table";

export const MEDIA_BUCKET_NAME = "city-feed-media-bucket";

export const USER_AVATAR_BUCKET_NAME = "city-feed-user-avatar-bucket";

export const IMAGE_URL_EXP_SECONDS = 300;

export enum FEED_LIKE_STATUS {
  Unliked,
  Liked,
}
