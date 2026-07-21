import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import {
  API_CONFIG,
  API_HEADERS,
  API_TAG_TYPE_VALUES,
  getBearerAuthorization,
  HTTP_STATUS,
} from "@/constants/api";
import { STORAGE_KEYS } from "@/constants/app";
import { logout } from "./authSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      headers.set(API_HEADERS.AUTHORIZATION, getBearerAuthorization(token));
    }
    headers.set(API_HEADERS.CONTENT_TYPE, API_HEADERS.JSON_CONTENT_TYPE);
    return headers;
  },
});

const baseQueryWithUnauthorizedCleanup: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === HTTP_STATUS.UNAUTHORIZED) {
    api.dispatch(baseApi.util.resetApiState());
    api.dispatch(logout());
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: API_CONFIG.REDUCER_PATH,
  baseQuery: baseQueryWithUnauthorizedCleanup,
  tagTypes: API_TAG_TYPE_VALUES,
  endpoints: () => ({}),
});
