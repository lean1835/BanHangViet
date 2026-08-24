import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse, IPageResponse } from "@/types/api";
import type {
  IBackupConfig,
  IUpdateBackupConfigRequest,
  IBackupHistory,
  IBackupStatusOverview,
} from "../types/IBackupRestore";

export const autoBackupApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBackupConfig: builder.query<IApiResponse<IBackupConfig>, void>({
      query: () => ({
        url: "/auto-backup/config",
        method: HTTP_METHODS.GET,
      }),
      providesTags: [{ type: API_TAG_TYPES.BACKUP, id: "CONFIG" }],
    }),

    updateBackupConfig: builder.mutation<
      IApiResponse<IBackupConfig>,
      IUpdateBackupConfigRequest
    >({
      query: (body) => ({
        url: "/auto-backup/config",
        method: HTTP_METHODS.PUT,
        body,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.BACKUP, id: "CONFIG" },
        { type: API_TAG_TYPES.BACKUP, id: "STATUS" },
      ],
    }),

    getBackupHistories: builder.query<
      IApiResponse<IPageResponse<IBackupHistory>>,
      { page?: number; size?: number } | void
    >({
      query: (params) => ({
        url: "/auto-backup/histories",
        method: HTTP_METHODS.GET,
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 10,
        },
      }),
      providesTags: (result) =>
        result?.result?.content
          ? [
              ...result.result.content.map(({ id }) => ({
                type: API_TAG_TYPES.BACKUP,
                id,
              })),
              { type: API_TAG_TYPES.BACKUP, id: "HISTORIES" },
            ]
          : [{ type: API_TAG_TYPES.BACKUP, id: "HISTORIES" }],
    }),

    triggerManualBackup: builder.mutation<IApiResponse<IBackupHistory>, void>({
      query: () => ({
        url: "/auto-backup/trigger",
        method: HTTP_METHODS.POST,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.BACKUP, id: "HISTORIES" },
        { type: API_TAG_TYPES.BACKUP, id: "STATUS" },
        { type: API_TAG_TYPES.RESTORE, id: "AVAILABLE" },
      ],
    }),

    getBackupStatusOverview: builder.query<
      IApiResponse<IBackupStatusOverview>,
      void
    >({
      query: () => ({
        url: "/auto-backup/status",
        method: HTTP_METHODS.GET,
      }),
      providesTags: [{ type: API_TAG_TYPES.BACKUP, id: "STATUS" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBackupConfigQuery,
  useUpdateBackupConfigMutation,
  useGetBackupHistoriesQuery,
  useTriggerManualBackupMutation,
  useGetBackupStatusOverviewQuery,
} = autoBackupApi;
