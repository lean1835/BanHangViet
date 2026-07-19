export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
} as const;

export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
} as const;

export const API_HEADERS = {
  AUTHORIZATION: "Authorization",
  CONTENT_TYPE: "Content-Type",
  JSON_CONTENT_TYPE: "application/json",
  BEARER_PREFIX: "Bearer",
} as const;

export const getBearerAuthorization = (token: string): string =>
  `${API_HEADERS.BEARER_PREFIX} ${token}`;

export const API_TAG_TYPES = {
  USER: "User",
  AUTH: "Auth",
  PRODUCT: "Product",
  PRODUCT_GROUP: "ProductGroup",
  SHIFT: "Shift",
  ACTIVE_SHIFT: "ActiveShift",
  ORDER: "Order",
} as const;

export const API_TAG_TYPE_VALUES = Object.values(API_TAG_TYPES);

export const API_CONFIG = {
  REDUCER_PATH: "api",
  OVERRIDE_EXISTING_ENDPOINTS: false,
} as const;
