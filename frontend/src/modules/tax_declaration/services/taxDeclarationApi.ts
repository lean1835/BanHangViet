import { baseApi } from "@/stores/baseApi";
import { HTTP_METHODS, API_TAG_TYPES } from "@/constants/api";
import { STORAGE_KEYS } from "@/constants/app";
import type { IApiResponse, IPageResponse } from "@/types/api";
import type {
  ITaxDeclarationPeriodResponse,
  ITaxRevenueSummaryResponse,
  ITaxSalesRegisterItemResponse,
  IGenerateTaxRegisterRequest,
} from "../types/ITaxDeclaration";
import type { IUnlockTaxPeriodRequest } from "../types/ITaxPeriodLock";

export const taxDeclarationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllTaxPeriods: builder.query<
      IApiResponse<ITaxDeclarationPeriodResponse[]>,
      void
    >({
      query: () => ({
        url: "/tax-periods",
        method: HTTP_METHODS.GET,
      }),
      providesTags: [{ type: API_TAG_TYPES.REPORT, id: "TAX_PERIOD_LIST" }],
    }),

    getTaxPeriodDetail: builder.query<
      IApiResponse<ITaxDeclarationPeriodResponse>,
      string
    >({
      query: (periodId) => ({
        url: `/tax-periods/${periodId}`,
        method: HTTP_METHODS.GET,
      }),
      providesTags: (_result, _error, periodId) => [
        { type: API_TAG_TYPES.REPORT, id: `TAX_PERIOD_${periodId}` },
      ],
    }),

    generateSalesRegister: builder.mutation<
      IApiResponse<ITaxDeclarationPeriodResponse>,
      IGenerateTaxRegisterRequest
    >({
      query: (body) => ({
        url: "/tax-periods/generate-sales-register",
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.REPORT, id: "TAX_PERIOD_LIST" },
        { type: API_TAG_TYPES.REPORT, id: "LOGS" },
        { type: API_TAG_TYPES.REPORT, id: "ACTIVITY_LOGS" },
      ],
    }),

    getSalesRegisterItems: builder.query<
      IApiResponse<IPageResponse<ITaxSalesRegisterItemResponse>>,
      { periodId: string; page?: number; size?: number }
    >({
      query: ({ periodId, page = 0, size = 20 }) => ({
        url: `/tax-periods/${periodId}/sales-register`,
        method: HTTP_METHODS.GET,
        params: { page, size },
      }),
      providesTags: (_result, _error, { periodId }) => [
        { type: API_TAG_TYPES.REPORT, id: `SALES_REGISTER_${periodId}` },
      ],
    }),

    getTaxRevenueSummary: builder.query<
      IApiResponse<ITaxRevenueSummaryResponse>,
      string
    >({
      query: (periodId) => ({
        url: `/tax-periods/${periodId}/tax-summary`,
        method: HTTP_METHODS.GET,
      }),
      providesTags: (_result, _error, periodId) => [
        { type: API_TAG_TYPES.REPORT, id: `TAX_SUMMARY_${periodId}` },
      ],
    }),

    lockTaxPeriod: builder.mutation<
      IApiResponse<ITaxDeclarationPeriodResponse>,
      string
    >({
      query: (periodId) => ({
        url: `/tax-periods/${periodId}/lock`,
        method: HTTP_METHODS.POST,
      }),
      invalidatesTags: (_result, _error, periodId) => [
        { type: API_TAG_TYPES.REPORT, id: "TAX_PERIOD_LIST" },
        { type: API_TAG_TYPES.REPORT, id: `TAX_PERIOD_${periodId}` },
        { type: API_TAG_TYPES.REPORT, id: `TAX_SUMMARY_${periodId}` },
        { type: API_TAG_TYPES.REPORT, id: "LOGS" },
        { type: API_TAG_TYPES.REPORT, id: "ACTIVITY_LOGS" },
      ],
    }),

    unlockTaxPeriod: builder.mutation<
      IApiResponse<ITaxDeclarationPeriodResponse>,
      { periodId: string; reason: string }
    >({
      query: ({ periodId, reason }) => ({
        url: `/tax-periods/${periodId}/unlock`,
        method: HTTP_METHODS.POST,
        body: { reason } as IUnlockTaxPeriodRequest,
      }),
      invalidatesTags: (_result, _error, { periodId }) => [
        { type: API_TAG_TYPES.REPORT, id: "TAX_PERIOD_LIST" },
        { type: API_TAG_TYPES.REPORT, id: `TAX_PERIOD_${periodId}` },
        { type: API_TAG_TYPES.REPORT, id: `TAX_SUMMARY_${periodId}` },
        { type: API_TAG_TYPES.REPORT, id: "LOGS" },
        { type: API_TAG_TYPES.REPORT, id: "ACTIVITY_LOGS" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllTaxPeriodsQuery,
  useGetTaxPeriodDetailQuery,
  useGenerateSalesRegisterMutation,
  useGetSalesRegisterItemsQuery,
  useGetTaxRevenueSummaryQuery,
  useLockTaxPeriodMutation,
  useUnlockTaxPeriodMutation,
} = taxDeclarationApi;

/**
 * Tải tệp Excel tờ khai thuế chính thức từ Backend server-side generator
 */
export const downloadTaxDeclarationExcel = async (
  periodId: string,
  fileName?: string
): Promise<void> => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const baseUrl = import.meta.env.VITE_API_URL || "/api/v1";
  const url = `${baseUrl}/tax-periods/${periodId}/export-declaration`;

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    let errorMsg = "Không thể tải tệp tờ khai thuế từ máy chủ.";
    try {
      const errorJson = await response.json();
      if (errorJson?.message) {
        errorMsg = errorJson.message;
      }
    } catch {
      // Ignored if response is not JSON
    }
    throw new Error(errorMsg);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = fileName || `To_khai_thue_${periodId}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
  document.body.removeChild(a);
};
