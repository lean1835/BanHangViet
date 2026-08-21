import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import type {
  ISupplierDebt,
  ISupplierDebtSummary,
  IPaySupplierDebtRequest,
  ISupplierDebtQueryParams,
  TSupplierDebtType,
  TSupplierDebtStatus,
} from "../types/ISupplierDebt";

const getResponseResult = <T>(response: unknown): T => {
  if (response && typeof response === "object" && "result" in response) {
    return (response as { result: T }).result;
  }
  return response as T;
};

const mapSupplierDebt = (raw: unknown): ISupplierDebt => {
  if (!raw || typeof raw !== "object") {
    return raw as ISupplierDebt;
  }
  const item = raw as Record<string, unknown>;

  const amountVal =
    typeof item.amount === "number"
      ? item.amount
      : Number(item.amount || 0);

  const remainingVal =
    typeof item.remainingAmount === "number"
      ? item.remainingAmount
      : Number(item.remainingAmount || 0);

  const typeVal: TSupplierDebtType =
    item.type === "DEBT_PAID" ? "DEBT_PAID" : "DEBT_CREATED";

  const statusVal: TSupplierDebtStatus =
    item.status === "PAID"
      ? "PAID"
      : item.status === "OVERDUE"
        ? "OVERDUE"
        : "PENDING";

  return {
    id: String(item.id || ""),
    householdId: String(item.householdId || ""),
    supplierId: String(item.supplierId || ""),
    supplierName: item.supplierName ? String(item.supplierName) : null,
    goodsReceiptId: item.goodsReceiptId ? String(item.goodsReceiptId) : null,
    receiptNumber: item.receiptNumber ? String(item.receiptNumber) : null,
    amount: amountVal,
    remainingAmount: remainingVal,
    type: typeVal,
    status: statusVal,
    dueDate: item.dueDate ? String(item.dueDate) : null,
    paymentMethod: item.paymentMethod ? String(item.paymentMethod) : null,
    notes: item.notes ? String(item.notes) : null,
    createdByUserId: item.createdByUserId ? String(item.createdByUserId) : null,
    createdByUserName: item.createdByUserName
      ? String(item.createdByUserName)
      : null,
    createdAt: String(item.createdAt || ""),
    updatedAt: String(item.updatedAt || ""),
  };
};

const mapSupplierDebtSummary = (raw: unknown): ISupplierDebtSummary => {
  if (!raw || typeof raw !== "object") {
    return {
      totalOutstandingDebt: 0,
      totalSuppliersWithDebt: 0,
      totalOverdueDebt: 0,
    };
  }
  const item = raw as Record<string, unknown>;
  return {
    totalOutstandingDebt:
      typeof item.totalOutstandingDebt === "number"
        ? item.totalOutstandingDebt
        : Number(item.totalOutstandingDebt || 0),
    totalSuppliersWithDebt:
      typeof item.totalSuppliersWithDebt === "number"
        ? item.totalSuppliersWithDebt
        : Number(item.totalSuppliersWithDebt || 0),
    totalOverdueDebt:
      typeof item.totalOverdueDebt === "number"
        ? item.totalOverdueDebt
        : Number(item.totalOverdueDebt || 0),
  };
};

export const supplierDebtApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSupplierDebtSummary: builder.query<ISupplierDebtSummary, void>({
      query: () => ({
        url: "/supplier-debts/summary",
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown): ISupplierDebtSummary => {
        const result = getResponseResult<unknown>(response);
        return mapSupplierDebtSummary(result);
      },
      providesTags: [
        { type: API_TAG_TYPES.DEBT, id: "SUPPLIER_SUMMARY" },
        { type: API_TAG_TYPES.SUPPLIER, id: "SUMMARY" },
      ],
    }),

    getSupplierDebtHistory: builder.query<ISupplierDebt[], string>({
      query: (supplierId) => ({
        url: `/supplier-debts/history/${supplierId}`,
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown): ISupplierDebt[] => {
        const result = getResponseResult<unknown[]>(response);
        return Array.isArray(result) ? result.map(mapSupplierDebt) : [];
      },
      providesTags: (_result, _error, supplierId) => [
        { type: API_TAG_TYPES.DEBT, id: `SUPPLIER_${supplierId}` },
        { type: API_TAG_TYPES.SUPPLIER, id: supplierId },
      ],
    }),

    getSupplierDebts: builder.query<
      ISupplierDebt[],
      ISupplierDebtQueryParams | void
    >({
      query: (params) => ({
        url: "/supplier-debts",
        method: HTTP_METHODS.GET,
        params: params?.status ? { status: params.status } : undefined,
      }),
      transformResponse: (response: unknown): ISupplierDebt[] => {
        const result = getResponseResult<unknown[]>(response);
        return Array.isArray(result) ? result.map(mapSupplierDebt) : [];
      },
      providesTags: [{ type: API_TAG_TYPES.DEBT, id: "SUPPLIER_LIST" }],
    }),

    paySupplierDebt: builder.mutation<ISupplierDebt, IPaySupplierDebtRequest>({
      query: (body) => ({
        url: "/supplier-debts/pay",
        method: HTTP_METHODS.POST,
        body,
      }),
      transformResponse: (response: unknown): ISupplierDebt => {
        const result = getResponseResult<unknown>(response);
        return mapSupplierDebt(result);
      },
      invalidatesTags: (_result, _error, { supplierId }) => [
        { type: API_TAG_TYPES.SUPPLIER, id: "LIST" },
        { type: API_TAG_TYPES.SUPPLIER, id: supplierId },
        { type: API_TAG_TYPES.SUPPLIER, id: "SUMMARY" },
        { type: API_TAG_TYPES.DEBT, id: "SUPPLIER_SUMMARY" },
        { type: API_TAG_TYPES.DEBT, id: "SUPPLIER_LIST" },
        { type: API_TAG_TYPES.DEBT, id: `SUPPLIER_${supplierId}` },
      ],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useGetSupplierDebtSummaryQuery,
  useGetSupplierDebtHistoryQuery,
  useGetSupplierDebtsQuery,
  usePaySupplierDebtMutation,
} = supplierDebtApi;
