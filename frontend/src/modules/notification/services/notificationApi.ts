import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse, IPageResponse } from "@/types/api";
import type { IAppNotificationResponse } from "../types/IAppNotification";

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      IApiResponse<IPageResponse<IAppNotificationResponse>>,
      { page?: number; size?: number } | void
    >({
      query: (params) => ({
        url: "/notifications",
        method: HTTP_METHODS.GET,
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 20,
        },
      }),
      providesTags: (result) =>
        result?.result?.content
          ? [
              ...result.result.content.map(({ id }) => ({
                type: API_TAG_TYPES.NOTIFICATION,
                id,
              })),
              { type: API_TAG_TYPES.NOTIFICATION, id: "LIST" },
            ]
          : [{ type: API_TAG_TYPES.NOTIFICATION, id: "LIST" }],
    }),

    getUnreadNotificationCount: builder.query<IApiResponse<number>, void>({
      query: () => ({
        url: "/notifications/unread-count",
        method: HTTP_METHODS.GET,
      }),
      providesTags: [{ type: API_TAG_TYPES.NOTIFICATION, id: "UNREAD_COUNT" }],
    }),

    markNotificationAsRead: builder.mutation<IApiResponse<void>, string>({
      query: (id) => ({
        url: `/notifications/${id}/mark-as-read`,
        method: HTTP_METHODS.PUT,
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.NOTIFICATION, id },
        { type: API_TAG_TYPES.NOTIFICATION, id: "LIST" },
        { type: API_TAG_TYPES.NOTIFICATION, id: "UNREAD_COUNT" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationAsReadMutation,
} = notificationApi;
