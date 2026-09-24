import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse, IPageResponse } from "@/types/api";
import type {
  IBackupVerificationStatus,
  IBackupVerificationHistory,
  ITriggerVerificationRequest,
} from "../types/IBackupRestore";

export const backupVerificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVerificationStatus: builder.query<
      IApiResponse<IBackupVerificationStatus>,
      void
    >({
      query: () => ({
        url: "/backup-verification/status",
        method: HTTP_METHODS.GET,
      }),
      providesTags: [
        { type: API_TAG_TYPES.BACKUP_VERIFICATION, id: "STATUS" },
      ],
    }),

    getVerificationHistories: builder.query<
      IApiResponse<IPageResponse<IBackupVerificationHistory>>,
      { page?: number; size?: number } | void
    >({
      query: (params) => ({
        url: "/backup-verification/histories",
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
                type: API_TAG_TYPES.BACKUP_VERIFICATION,
                id,
              })),
              { type: API_TAG_TYPES.BACKUP_VERIFICATION, id: "HISTORIES" },
            ]
          : [{ type: API_TAG_TYPES.BACKUP_VERIFICATION, id: "HISTORIES" }],
    }),

    triggerVerification: builder.mutation<
      IApiResponse<IBackupVerificationHistory>,
      ITriggerVerificationRequest | void
    >({
      query: (body) => ({
        url: "/backup-verification/trigger",
        method: HTTP_METHODS.POST,
        body: body || {},
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.BACKUP_VERIFICATION, id: "STATUS" },
        { type: API_TAG_TYPES.BACKUP_VERIFICATION, id: "HISTORIES" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetVerificationStatusQuery,
  useGetVerificationHistoriesQuery,
  useTriggerVerificationMutation,
} = backupVerificationApi;
