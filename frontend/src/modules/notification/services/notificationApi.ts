import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse, IPageResponse } from "@/types/api";
import type {
  IAppNotificationResponse,
  INotificationBadgeCountResponse,
  INotificationSettingItemResponse,
  INotificationFilterParams,
  IBatchUpdateNotificationSettingsRequest,
  IUpdateNotificationSettingRequest,
} from "../types/IAppNotification";

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      IApiResponse<IPageResponse<IAppNotificationResponse>>,
      INotificationFilterParams | void
    >({
      query: (params) => {
        const queryParams: Record<string, string | number | boolean> = {
          page: params?.page ?? 0,
          size: params?.size ?? 20,
        };
        if (params?.severity) queryParams.severity = params.severity;
        if (params?.notificationType)
          queryParams.notificationType = params.notificationType;
        if (params?.isRead !== undefined) queryParams.isRead = params.isRead;
        if (params?.isClosed !== undefined)
          queryParams.isClosed = params.isClosed;
        if (params?.search) queryParams.search = params.search;

        return {
          url: "/notifications",
          method: HTTP_METHODS.GET,
          params: queryParams,
        };
      },
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

    getBadgeCount: builder.query<
      IApiResponse<INotificationBadgeCountResponse>,
      void
    >({
      query: () => ({
        url: "/notifications/badge-count",
        method: HTTP_METHODS.GET,
      }),
      providesTags: [
        { type: API_TAG_TYPES.NOTIFICATION, id: "BADGE_COUNT" },
        { type: API_TAG_TYPES.NOTIFICATION, id: "UNREAD_COUNT" },
      ],
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
        { type: API_TAG_TYPES.NOTIFICATION, id: "BADGE_COUNT" },
        { type: API_TAG_TYPES.NOTIFICATION, id: "UNREAD_COUNT" },
      ],
    }),

    markAllAsRead: builder.mutation<
      IApiResponse<{ updatedCount: number }>,
      void
    >({
      query: () => ({
        url: "/notifications/mark-all-as-read",
        method: HTTP_METHODS.PUT,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.NOTIFICATION, id: "LIST" },
        { type: API_TAG_TYPES.NOTIFICATION, id: "BADGE_COUNT" },
        { type: API_TAG_TYPES.NOTIFICATION, id: "UNREAD_COUNT" },
      ],
    }),

    getNotificationSettings: builder.query<
      IApiResponse<INotificationSettingItemResponse[]>,
      void
    >({
      query: () => ({
        url: "/notifications/settings",
        method: HTTP_METHODS.GET,
      }),
      providesTags: [{ type: API_TAG_TYPES.NOTIFICATION, id: "SETTINGS" }],
    }),

    updateNotificationSettingsBatch: builder.mutation<
      IApiResponse<void>,
      IBatchUpdateNotificationSettingsRequest
    >({
      query: (body) => ({
        url: "/notifications/settings",
        method: HTTP_METHODS.PUT,
        body,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.NOTIFICATION, id: "SETTINGS" },
        { type: API_TAG_TYPES.NOTIFICATION, id: "LIST" },
        { type: API_TAG_TYPES.NOTIFICATION, id: "BADGE_COUNT" },
      ],
    }),

    updateSingleNotificationSetting: builder.mutation<
      IApiResponse<void>,
      IUpdateNotificationSettingRequest
    >({
      query: (body) => ({
        url: "/notifications/settings/single",
        method: HTTP_METHODS.PUT,
        body,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.NOTIFICATION, id: "SETTINGS" },
        { type: API_TAG_TYPES.NOTIFICATION, id: "LIST" },
        { type: API_TAG_TYPES.NOTIFICATION, id: "BADGE_COUNT" },
      ],
    }),

    syncReminders: builder.mutation<
      IApiResponse<{ syncedCount: number }>,
      void
    >({
      query: () => ({
        url: "/notifications/sync-reminders",
        method: HTTP_METHODS.POST,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.NOTIFICATION, id: "LIST" },
        { type: API_TAG_TYPES.NOTIFICATION, id: "BADGE_COUNT" },
        { type: API_TAG_TYPES.NOTIFICATION, id: "UNREAD_COUNT" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNotificationsQuery,
  useLazyGetNotificationsQuery,
  useGetBadgeCountQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllAsReadMutation,
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsBatchMutation,
  useUpdateSingleNotificationSettingMutation,
  useSyncRemindersMutation,
} = notificationApi;
