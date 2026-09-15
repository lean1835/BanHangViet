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
import type {
  ITaxPurchaseRegisterItemResponse,
  ITaxPurchaseRegisterSummaryResponse,
  IGenerateTaxPurchaseRegisterRequest,
} from "../types/ITaxPurchaseRegister";
import type {
  ITaxReminderSettingsResponse,
  IUpdateTaxReminderSettingsRequest,
  ITaxPeriodReminderResponse,
  ITaxReminderScanResultResponse,
} from "../types/ITaxReminder";

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
        { type: API_TAG_TYPES.REPORT, id: "TAX_REMINDERS" },
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
        { type: API_TAG_TYPES.REPORT, id: "TAX_REMINDERS" },
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
        { type: API_TAG_TYPES.REPORT, id: "TAX_REMINDERS" },
        { type: API_TAG_TYPES.REPORT, id: "LOGS" },
        { type: API_TAG_TYPES.REPORT, id: "ACTIVITY_LOGS" },
      ],
    }),

    // NCL-12-CN-006: Lập / Cập nhật bảng kê mua vào theo kỳ
    generatePurchaseRegister: builder.mutation<
      IApiResponse<ITaxPurchaseRegisterSummaryResponse>,
      IGenerateTaxPurchaseRegisterRequest
    >({
      query: (body) => ({
        url: "/tax-periods/generate-purchase-register",
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.REPORT, id: "TAX_PERIOD_LIST" },
        { type: API_TAG_TYPES.REPORT, id: "TAX_REMINDERS" },
        { type: API_TAG_TYPES.REPORT, id: "LOGS" },
        { type: API_TAG_TYPES.REPORT, id: "ACTIVITY_LOGS" },
      ],
    }),

    // NCL-12-CN-006: Lấy dữ liệu tổng hợp bảng kê mua vào của kỳ
    getPurchaseRegisterSummary: builder.query<
      IApiResponse<ITaxPurchaseRegisterSummaryResponse>,
      string
    >({
      query: (periodId) => ({
        url: `/tax-periods/${periodId}/purchase-register-summary`,
        method: HTTP_METHODS.GET,
      }),
      providesTags: (_result, _error, periodId) => [
        { type: API_TAG_TYPES.REPORT, id: `PURCHASE_SUMMARY_${periodId}` },
      ],
    }),

    // NCL-12-CN-006: Lấy danh sách phân trang các dòng chi tiết hàng hóa mua vào
    getPurchaseRegisterItems: builder.query<
      IApiResponse<IPageResponse<ITaxPurchaseRegisterItemResponse>>,
      { periodId: string; page?: number; size?: number; search?: string }
    >({
      query: ({ periodId, page = 0, size = 8, search }) => ({
        url: `/tax-periods/${periodId}/purchase-register-items`,
        method: HTTP_METHODS.GET,
        params: { page, size, search },
      }),
      providesTags: (_result, _error, { periodId }) => [
        { type: API_TAG_TYPES.REPORT, id: `PURCHASE_ITEMS_${periodId}` },
      ],
    }),

    // NCL-12-CN-007: Lấy cấu hình nhắc lịch nộp tờ khai của hộ kinh doanh
    getReminderSettings: builder.query<
      IApiResponse<ITaxReminderSettingsResponse>,
      void
    >({
      query: () => ({
        url: "/tax-periods/reminder-settings",
        method: HTTP_METHODS.GET,
      }),
      providesTags: [{ type: API_TAG_TYPES.REPORT, id: "TAX_REMINDER_SETTINGS" }],
    }),

    // NCL-12-CN-007: Cập nhật cấu hình nhắc lịch nộp tờ khai (Chỉ chủ hộ VT-01)
    updateReminderSettings: builder.mutation<
      IApiResponse<ITaxReminderSettingsResponse>,
      IUpdateTaxReminderSettingsRequest
    >({
      query: (body) => ({
        url: "/tax-periods/reminder-settings",
        method: HTTP_METHODS.PUT,
        body,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.REPORT, id: "TAX_REMINDER_SETTINGS" },
        { type: API_TAG_TYPES.REPORT, id: "TAX_REMINDERS" },
      ],
    }),

    // NCL-12-CN-007: Lấy danh sách các kỳ cần nhắc nộp tờ khai kèm checklist
    getActiveReminders: builder.query<
      IApiResponse<ITaxPeriodReminderResponse[]>,
      void
    >({
      query: () => ({
        url: "/tax-periods/reminders",
        method: HTTP_METHODS.GET,
      }),
      providesTags: [{ type: API_TAG_TYPES.REPORT, id: "TAX_REMINDERS" }],
    }),

    // NCL-12-CN-007: Kích hoạt quét nhắc nhở theo thời gian thực
    triggerScanReminders: builder.mutation<
      IApiResponse<ITaxReminderScanResultResponse>,
      void
    >({
      query: () => ({
        url: "/tax-periods/reminders/trigger-scan",
        method: HTTP_METHODS.POST,
      }),
      invalidatesTags: [{ type: API_TAG_TYPES.REPORT, id: "TAX_REMINDERS" }],
    }),

    // NCL-12-CN-007: Đánh dấu đã xuất tờ khai thuế cho kỳ
    markDeclarationAsExported: builder.mutation<
      IApiResponse<void>,
      string
    >({
      query: (periodId) => ({
        url: `/tax-periods/${periodId}/mark-exported`,
        method: HTTP_METHODS.POST,
      }),
      invalidatesTags: (_result, _error, periodId) => [
        { type: API_TAG_TYPES.REPORT, id: "TAX_REMINDERS" },
        { type: API_TAG_TYPES.REPORT, id: "TAX_PERIOD_LIST" },
        { type: API_TAG_TYPES.REPORT, id: `TAX_PERIOD_${periodId}` },
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
  useGeneratePurchaseRegisterMutation,
  useGetPurchaseRegisterSummaryQuery,
  useGetPurchaseRegisterItemsQuery,
  useGetReminderSettingsQuery,
  useUpdateReminderSettingsMutation,
  useGetActiveRemindersQuery,
  useTriggerScanRemindersMutation,
  useMarkDeclarationAsExportedMutation,
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

/**
 * NCL-12-CN-006: Tải tệp Excel bảng kê mua vào từ Backend server-side POI generator
 */
export const downloadPurchaseRegisterExcel = async (
  periodId: string,
  fileName?: string
): Promise<void> => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const baseUrl = import.meta.env.VITE_API_URL || "/api/v1";
  const url = `${baseUrl}/tax-periods/${periodId}/export-purchase-register`;

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    let errorMsg = "Không thể tải tệp bảng kê mua vào từ máy chủ.";
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
  a.download = fileName || `Bang_ke_mua_vao_${periodId}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
  document.body.removeChild(a);
};
