export const LAMBDA_FUNCTION_NAMES = {
  GET_FEED_LIST_FUNCTION_NAME: "GetFeedListHandler",

  GET_USER_FEED_LIST_FUNCTION_NAME: "GetUserFeedListHandler",

  POST_FEED_FUNCTION_NAME: "PostFeedHandler",

  GET_USER_DETAIL_FUNCTION_NAME: "GetUserDetailHandler",

  LIKE_FEED_FUNCTION_NAME: "LikeFeedHandler",

  GET_FAVORITE_LIST_FUNCTION_NAME: "GetFavListHandler",

  EXP_FUNCTION_NAME: "ExperimentHandler",
};

export const TEST_API_KEY_NAME = "test-api-key";

export const S3_BUCKET_NAMES = {
  MEDIA_BUCKET_NAME: "city-feed-media-bucket",

  USER_AVATAR_BUCKET_NAME: "city-feed-user-avatar-bucket",
};

export const DYNAMODB_TABLE_NAMES = {
  FEED_DYNAMODB_TABLE_NAME: "city-feed-feed-table",

  FEED_DYNMODB_CREATED_AT_INDEX_NAME: "city-feed-feed-table-created-at-index",

  FEED_DYNMODB_USER_CREATED_AT_INDEX_NAME:
    "city-feed-feed-table-user-created-at-index",

  USER_DYNAMODB_TABLE_NAME: "city-feed-user-table",

  USER_LIKED_DYNAMODB_TABLE_NAME: "city-feed-user-liked-table",

  USER_LIKED_DYNAMODB_USER_LIKED_AT_INDEX_NAME: "city-feed-user-liked-table-user-liked-at-index",
};

export const COGNITO_NAMES = {
  COGNITO_EXP_USER_POOL_NAME: "city-feed-exp-userpool",

  COGNITO_EXP_USER_POOL_CLIENT_NAME: "exp-app-client",

  COGNITO_MAIN_USER_POOL_NAME: "city-feed-main-userpool",

  COGNITO_MAIN_USER_POOL_CLIENT_NAME: "city-feed-main-app-client",

  COGNITO_EXP_AUTHORIZER_NAME: "ExpCognitoAuthorizer",

  COGNITO_MAIN_AUTHORIZER_NAME: "MainCognitoAuthorizer",
};
