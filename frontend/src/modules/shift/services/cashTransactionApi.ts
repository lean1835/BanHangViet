import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import type { IApiResponse } from "@/types/api";
import type {
  ICashTransactionResponse,
  ICreateCashTransactionRequest,
  IShiftCashSummaryResponse,
  ICashTransactionCategoryResponse,
  ICreateCashCategoryRequest,
  IUpdateCashCategoryRequest,
  IRejectCashExpenseRequest,
  IUpdateExpenseThresholdRequest,
  CashTransactionType,
} from "../types/ICashTransaction";

export const CASH_TRANSACTION_ENDPOINTS = {
  BASE: "/cash-transactions",
  CURRENT_SHIFT: "/cash-transactions/current-shift",
  SHIFT: (shiftId: string) => `/cash-transactions/shift/${shiftId}`,
  SHIFT_SUMMARY: (shiftId: string) => `/cash-transactions/shift/${shiftId}/summary`,
  DETAIL: (id: string) => `/cash-transactions/${id}`,
  APPROVE: (id: string) => `/cash-transactions/${id}/approve`,
  REJECT: (id: string) => `/cash-transactions/${id}/reject`,
  THRESHOLD: "/cash-transactions/threshold",
  CATEGORIES: "/cash-categories",
  CATEGORY_DETAIL: (id: string) => `/cash-categories/${id}`,
} as const;

export const cashTransactionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Lập phiếu thu hoặc chi tiền mặt trong ca mở
    createCashTransaction: builder.mutation<
      IApiResponse<ICashTransactionResponse>,
      ICreateCashTransactionRequest
    >({
      query: (body) => ({
        url: CASH_TRANSACTION_ENDPOINTS.BASE,
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.CASH_TRANSACTION, id: "LIST" },
        { type: API_TAG_TYPES.CASH_TRANSACTION, id: "CURRENT_SHIFT" },
        { type: API_TAG_TYPES.ACTIVE_SHIFT },
        { type: API_TAG_TYPES.SHIFT },
      ],
    }),

    // 2. Lấy danh sách phiếu thu chi trong ca đang mở của nhân viên
    getCurrentShiftCashTransactions: builder.query<
      IApiResponse<ICashTransactionResponse[]>,
      void
    >({
      query: () => ({
        url: CASH_TRANSACTION_ENDPOINTS.CURRENT_SHIFT,
        method: HTTP_METHODS.GET,
      }),
      providesTags: [
        { type: API_TAG_TYPES.CASH_TRANSACTION, id: "CURRENT_SHIFT" },
        { type: API_TAG_TYPES.CASH_TRANSACTION, id: "LIST" },
      ],
    }),

    // 3. Lấy danh sách phiếu thu chi của một ca cụ thể
    getShiftCashTransactions: builder.query<
      IApiResponse<ICashTransactionResponse[]>,
      string
    >({
      query: (shiftId) => ({
        url: CASH_TRANSACTION_ENDPOINTS.SHIFT(shiftId),
        method: HTTP_METHODS.GET,
      }),
      providesTags: (result, _error, shiftId) =>
        result?.result
          ? [
              ...result.result.map(({ id }) => ({
                type: API_TAG_TYPES.CASH_TRANSACTION,
                id,
              })),
              { type: API_TAG_TYPES.CASH_TRANSACTION, id: `SHIFT_${shiftId}` },
              { type: API_TAG_TYPES.CASH_TRANSACTION, id: "LIST" },
            ]
          : [
              { type: API_TAG_TYPES.CASH_TRANSACTION, id: `SHIFT_${shiftId}` },
              { type: API_TAG_TYPES.CASH_TRANSACTION, id: "LIST" },
            ],
    }),

    // 4. Lấy báo cáo tổng hợp dòng tiền mặt ngoài bán hàng trong ca
    getShiftCashSummary: builder.query<
      IApiResponse<IShiftCashSummaryResponse>,
      string
    >({
      query: (shiftId) => ({
        url: CASH_TRANSACTION_ENDPOINTS.SHIFT_SUMMARY(shiftId),
        method: HTTP_METHODS.GET,
      }),
      providesTags: (_result, _error, shiftId) => [
        { type: API_TAG_TYPES.CASH_TRANSACTION, id: `SUMMARY_${shiftId}` },
      ],
    }),

    // 5. Xem chi tiết phiếu theo ID
    getCashTransactionById: builder.query<
      IApiResponse<ICashTransactionResponse>,
      string
    >({
      query: (id) => ({
        url: CASH_TRANSACTION_ENDPOINTS.DETAIL(id),
        method: HTTP_METHODS.GET,
      }),
      providesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.CASH_TRANSACTION, id },
      ],
    }),

    // 6. Chủ hộ duyệt phiếu chi vượt hạn mức
    approveCashExpense: builder.mutation<
      IApiResponse<ICashTransactionResponse>,
      string
    >({
      query: (id) => ({
        url: CASH_TRANSACTION_ENDPOINTS.APPROVE(id),
        method: HTTP_METHODS.POST,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.CASH_TRANSACTION, id: "LIST" },
        { type: API_TAG_TYPES.CASH_TRANSACTION, id: "CURRENT_SHIFT" },
        { type: API_TAG_TYPES.ACTIVE_SHIFT },
        { type: API_TAG_TYPES.SHIFT },
      ],
    }),

    // 7. Chủ hộ từ chối phiếu chi
    rejectCashExpense: builder.mutation<
      IApiResponse<ICashTransactionResponse>,
      { id: string; body: IRejectCashExpenseRequest }
    >({
      query: ({ id, body }) => ({
        url: CASH_TRANSACTION_ENDPOINTS.REJECT(id),
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: [
        { type: API_TAG_TYPES.CASH_TRANSACTION, id: "LIST" },
        { type: API_TAG_TYPES.CASH_TRANSACTION, id: "CURRENT_SHIFT" },
        { type: API_TAG_TYPES.ACTIVE_SHIFT },
        { type: API_TAG_TYPES.SHIFT },
      ],
    }),

    // 8. Cập nhật hạn mức chi tiền mặt tự duyệt
    updateExpenseThreshold: builder.mutation<
      IApiResponse<void>,
      IUpdateExpenseThresholdRequest
    >({
      query: (body) => ({
        url: CASH_TRANSACTION_ENDPOINTS.THRESHOLD,
        method: HTTP_METHODS.PUT,
        body,
      }),
      invalidatesTags: [{ type: API_TAG_TYPES.SETTINGS }],
    }),

    // 9. Lấy danh mục loại thu/chi tiền mặt
    getCashCategories: builder.query<
      IApiResponse<ICashTransactionCategoryResponse[]>,
      { type?: CashTransactionType } | void
    >({
      query: (params) => ({
        url: CASH_TRANSACTION_ENDPOINTS.CATEGORIES,
        method: HTTP_METHODS.GET,
        params: params?.type ? { type: params.type } : undefined,
      }),
      providesTags: [{ type: API_TAG_TYPES.CASH_CATEGORY, id: "LIST" }],
    }),

    // 10. Tạo mới loại thu/chi
    createCashCategory: builder.mutation<
      IApiResponse<ICashTransactionCategoryResponse>,
      ICreateCashCategoryRequest
    >({
      query: (body) => ({
        url: CASH_TRANSACTION_ENDPOINTS.CATEGORIES,
        method: HTTP_METHODS.POST,
        body,
      }),
      invalidatesTags: [{ type: API_TAG_TYPES.CASH_CATEGORY, id: "LIST" }],
    }),

    // 11. Cập nhật loại thu/chi
    updateCashCategory: builder.mutation<
      IApiResponse<ICashTransactionCategoryResponse>,
      { id: string; body: IUpdateCashCategoryRequest }
    >({
      query: ({ id, body }) => ({
        url: CASH_TRANSACTION_ENDPOINTS.CATEGORY_DETAIL(id),
        method: HTTP_METHODS.PUT,
        body,
      }),
      invalidatesTags: [{ type: API_TAG_TYPES.CASH_CATEGORY, id: "LIST" }],
    }),

    // 12. Xóa loại thu/chi
    deleteCashCategory: builder.mutation<IApiResponse<void>, string>({
      query: (id) => ({
        url: CASH_TRANSACTION_ENDPOINTS.CATEGORY_DETAIL(id),
        method: HTTP_METHODS.DELETE,
      }),
      invalidatesTags: [{ type: API_TAG_TYPES.CASH_CATEGORY, id: "LIST" }],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useCreateCashTransactionMutation,
  useGetCurrentShiftCashTransactionsQuery,
  useGetShiftCashTransactionsQuery,
  useGetShiftCashSummaryQuery,
  useGetCashTransactionByIdQuery,
  useApproveCashExpenseMutation,
  useRejectCashExpenseMutation,
  useUpdateExpenseThresholdMutation,
  useGetCashCategoriesQuery,
  useCreateCashCategoryMutation,
  useUpdateCashCategoryMutation,
  useDeleteCashCategoryMutation,
} = cashTransactionApi;
