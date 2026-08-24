import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import type { IApiResponse, IPageResponse } from "@/types/api";
import type {
  IBackupHistory,
  IRestorePreview,
  IRestoreDataRequest,
  IRestoreResult,
  IRestoreHistory,
} from "../types/IBackupRestore";

export const restoreApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAvailableBackupsForRestore: builder.query<
      IApiResponse<IBackupHistory[]>,
      void
    >({
      query: () => ({
        url: "/restore/backups",
        method: HTTP_METHODS.GET,
      }),
      providesTags: [{ type: API_TAG_TYPES.RESTORE, id: "AVAILABLE" }],
    }),

    previewBackupForRestore: builder.query<
      IApiResponse<IRestorePreview>,
      string
    >({
      query: (backupHistoryId) => ({
        url: `/restore/preview/${backupHistoryId}`,
        method: HTTP_METHODS.GET,
      }),
    }),

    executeRestore: builder.mutation<
      IApiResponse<IRestoreResult>,
      IRestoreDataRequest
    >({
      query: (body) => ({
        url: "/restore/execute",
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.RESTORE, id: "HISTORIES" },
        { type: API_TAG_TYPES.USER, id: "LIST" },
        { type: API_TAG_TYPES.PRODUCT, id: "LIST" },
        { type: API_TAG_TYPES.PRODUCT_GROUP, id: "LIST" },
        { type: API_TAG_TYPES.CUSTOMER, id: "LIST" },
        { type: API_TAG_TYPES.SUPPLIER, id: "LIST" },
        { type: API_TAG_TYPES.ORDER, id: "LIST" },
        { type: API_TAG_TYPES.INVOICE, id: "LIST" },
        { type: API_TAG_TYPES.AUDIT_LOG, id: "LIST" },
        { type: API_TAG_TYPES.DEBT, id: "LIST" },
        { type: API_TAG_TYPES.INVENTORY_WARNING, id: "LIST" },
      ],
    }),

    getRestoreHistories: builder.query<
      IApiResponse<IPageResponse<IRestoreHistory>>,
      { page?: number; size?: number } | void
    >({
      query: (params) => ({
        url: "/restore/histories",
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
                type: API_TAG_TYPES.RESTORE,
                id,
              })),
              { type: API_TAG_TYPES.RESTORE, id: "HISTORIES" },
            ]
          : [{ type: API_TAG_TYPES.RESTORE, id: "HISTORIES" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAvailableBackupsForRestoreQuery,
  useLazyPreviewBackupForRestoreQuery,
  useExecuteRestoreMutation,
  useGetRestoreHistoriesQuery,
} = restoreApi;
