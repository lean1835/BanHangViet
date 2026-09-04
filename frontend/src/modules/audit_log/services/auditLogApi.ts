import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import { STORAGE_KEYS } from "@/constants/app";
import type { IApiResponse, IPageResponse } from "@/types/api";
import type {
  IActivityLog,
  IAuditIntegrityResponse,
  IActivityLogFilterParams,
} from "../types/IAuditLog";

export const auditLogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query<
      IApiResponse<IPageResponse<IActivityLog>>,
      IActivityLogFilterParams | void
    >({
      query: (params) => ({
        url: "/audit-logs",
        method: HTTP_METHODS.GET,
        params: params || undefined,
      }),
      providesTags: (result) =>
        result?.result?.content
          ? [
              ...result.result.content.map(({ id }) => ({
                type: API_TAG_TYPES.AUDIT_LOG,
                id,
              })),
              { type: API_TAG_TYPES.AUDIT_LOG, id: "LIST" },
            ]
          : [{ type: API_TAG_TYPES.AUDIT_LOG, id: "LIST" }],
    }),

    verifyAuditIntegrity: builder.query<
      IApiResponse<IAuditIntegrityResponse>,
      void
    >({
      query: () => ({
        url: "/audit-logs/verify-integrity",
        method: HTTP_METHODS.GET,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAuditLogsQuery,
  useLazyVerifyAuditIntegrityQuery,
} = auditLogApi;

/**
 * Tải file Excel báo cáo Nhật ký kiểm toán từ Backend API
 */
export const downloadAuditLogsExcel = async (
  params?: IActivityLogFilterParams
): Promise<void> => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const baseUrl = import.meta.env.VITE_API_URL || "/api/v1";

  const searchParams = new URLSearchParams();
  if (params?.username) searchParams.append("username", params.username);
  if (params?.action) searchParams.append("action", params.action);
  if (params?.targetTable) searchParams.append("targetTable", params.targetTable);
  if (params?.startDate) searchParams.append("startDate", params.startDate);
  if (params?.endDate) searchParams.append("endDate", params.endDate);

  const url = `${baseUrl}/audit-logs/export?${searchParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Không thể xuất file Excel nhật ký kiểm toán");
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "nhat_ky_kiem_toan.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};
