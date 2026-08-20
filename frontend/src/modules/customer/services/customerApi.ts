import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import type { ICustomer } from "../types/ICustomer";
import type {
  ICustomerDebtResponse,
  ICollectDebtRequest,
  IDebtSummaryResponse,
} from "../types/ICustomerDebt";

export interface CreateCustomerPayload {
  name: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  creditLimit: number;
}

export interface UpdateCustomerPayload {
  id: string;
  name: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  creditLimit: number;
}

export interface CustomerQueryParams {
  search?: string;
  query?: string;
  debtStatus?: string;
  page?: number;
  limit?: number;
}

const getResponseResult = <T>(response: unknown): T => {
  if (response && typeof response === "object" && "result" in response) {
    return (response as { result: T }).result;
  }
  return response as T;
};

const mapCustomer = (raw: unknown): ICustomer => {
  if (!raw || typeof raw !== "object") {
    return raw as ICustomer;
  }
  const item = raw as Record<string, unknown>;
  const phoneVal = (item.phoneNumber || item.phone || "") as string;
  const debtVal = (
    typeof item.currentDebt === "number"
      ? item.currentDebt
      : typeof item.debt === "number"
        ? item.debt
        : Number(item.currentDebt || item.debt || 0)
  ) as number;
  const creditVal = (
    typeof item.creditLimit === "number"
      ? item.creditLimit
      : Number(item.creditLimit || 0)
  ) as number;

  return {
    id: String(item.id || ""),
    householdId: item.householdId ? String(item.householdId) : undefined,
    name: String(item.name || ""),
    phone: phoneVal,
    phoneNumber: phoneVal,
    email: String(item.email || ""),
    address: item.address ? String(item.address) : "",
    creditLimit: creditVal,
    debt: debtVal,
    currentDebt: debtVal,
    dueDate: item.dueDate ? String(item.dueDate) : undefined,
    createdAt: item.createdAt ? String(item.createdAt) : undefined,
    updatedAt: item.updatedAt ? String(item.updatedAt) : undefined,
  };
};

export const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<ICustomer[], CustomerQueryParams | void>({
      query: (params) => ({
        url: "/customers",
        method: HTTP_METHODS.GET,
        params: params || undefined,
      }),
      transformResponse: (response: unknown): ICustomer[] => {
        const result = getResponseResult<unknown[]>(response);
        return Array.isArray(result) ? result.map(mapCustomer) : [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: API_TAG_TYPES.CUSTOMER,
                id,
              })),
              { type: API_TAG_TYPES.CUSTOMER, id: "LIST" },
            ]
          : [{ type: API_TAG_TYPES.CUSTOMER, id: "LIST" }],
    }),

    searchCustomers: builder.query<ICustomer[], string>({
      query: (query) => ({
        url: "/customers/search",
        method: HTTP_METHODS.GET,
        params: { query },
      }),
      transformResponse: (response: unknown): ICustomer[] => {
        const result = getResponseResult<unknown[]>(response);
        return Array.isArray(result) ? result.map(mapCustomer) : [];
      },
      providesTags: [{ type: API_TAG_TYPES.CUSTOMER, id: "LIST" }],
    }),

    getCustomerById: builder.query<ICustomer, string>({
      query: (id) => ({
        url: `/customers/${id}`,
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown): ICustomer => {
        return mapCustomer(getResponseResult(response));
      },
      providesTags: (_result, _error, id) => [{ type: API_TAG_TYPES.CUSTOMER, id }],
    }),

    createCustomer: builder.mutation<ICustomer, CreateCustomerPayload>({
      query: (payload) => ({
        url: "/customers",
        method: HTTP_METHODS.POST,
        body: {
          name: payload.name,
          phoneNumber: payload.phoneNumber || payload.phone || "",
          email: payload.email || "",
          address: payload.address || "",
          creditLimit: payload.creditLimit,
        },
      }),
      transformResponse: (response: unknown): ICustomer => {
        return mapCustomer(getResponseResult(response));
      },
      invalidatesTags: [{ type: API_TAG_TYPES.CUSTOMER, id: "LIST" }],
    }),

    updateCustomer: builder.mutation<ICustomer, UpdateCustomerPayload>({
      query: ({ id, ...payload }) => ({
        url: `/customers/${id}`,
        method: HTTP_METHODS.PUT,
        body: {
          name: payload.name,
          phoneNumber: payload.phoneNumber || payload.phone || "",
          email: payload.email || "",
          address: payload.address || "",
          creditLimit: payload.creditLimit,
        },
      }),
      transformResponse: (response: unknown): ICustomer => {
        return mapCustomer(getResponseResult(response));
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAG_TYPES.CUSTOMER, id },
        { type: API_TAG_TYPES.CUSTOMER, id: "LIST" },
      ],
    }),

    deleteCustomer: builder.mutation<void, string>({
      query: (id) => ({
        url: `/customers/${id}`,
        method: HTTP_METHODS.DELETE,
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.CUSTOMER, id },
        { type: API_TAG_TYPES.CUSTOMER, id: "LIST" },
      ],
    }),

    // --- DEBT ENDPOINTS ---

    collectDebt: builder.mutation<ICustomerDebtResponse, ICollectDebtRequest>({
      query: (body) => ({
        url: "/debts/collect",
        method: HTTP_METHODS.POST,
        body,
      }),
      transformResponse: (response: unknown): ICustomerDebtResponse => {
        return getResponseResult<ICustomerDebtResponse>(response);
      },
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: API_TAG_TYPES.CUSTOMER, id: customerId },
        { type: API_TAG_TYPES.CUSTOMER, id: "LIST" },
        { type: API_TAG_TYPES.DEBT, id: "LIST" },
        { type: API_TAG_TYPES.DEBT, id: "SUMMARY" },
      ],
    }),

    getDebtHistory: builder.query<ICustomerDebtResponse[], string>({
      query: (customerId) => ({
        url: `/debts/history/${customerId}`,
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown): ICustomerDebtResponse[] => {
        const result = getResponseResult<ICustomerDebtResponse[]>(response);
        return Array.isArray(result) ? result : [];
      },
      providesTags: (_result, _error, customerId) => [
        { type: API_TAG_TYPES.DEBT, id: customerId },
      ],
    }),

    getDebtReminders: builder.query<ICustomerDebtResponse[], string | void>({
      query: (status) => ({
        url: "/debts/reminders",
        method: HTTP_METHODS.GET,
        params: status ? { status } : undefined,
      }),
      transformResponse: (response: unknown): ICustomerDebtResponse[] => {
        const result = getResponseResult<ICustomerDebtResponse[]>(response);
        return Array.isArray(result) ? result : [];
      },
      providesTags: [{ type: API_TAG_TYPES.DEBT, id: "REMINDERS" }],
    }),

    getDebtSummary: builder.query<IDebtSummaryResponse, void>({
      query: () => ({
        url: "/debts/summary",
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown): IDebtSummaryResponse => {
        return getResponseResult<IDebtSummaryResponse>(response);
      },
      providesTags: [{ type: API_TAG_TYPES.DEBT, id: "SUMMARY" }],
    }),

    remindCustomerDebt: builder.mutation<
      { success: boolean; message: string },
      { customerId: string; messageContent: string }
    >({
      query: ({ customerId, messageContent }) => ({
        url: "/debts/remind",
        method: HTTP_METHODS.POST,
        body: { customerId, messageContent },
      }),
      transformResponse: (response: unknown): { success: boolean; message: string } => {
        const result = getResponseResult<{ success?: boolean; message?: string }>(response);
        return {
          success: result?.success ?? true,
          message: result?.message ?? "Ghi nhận nhắc nợ thành công",
        };
      },
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: API_TAG_TYPES.CUSTOMER, id: customerId },
        { type: API_TAG_TYPES.DEBT, id: customerId },
        { type: API_TAG_TYPES.DEBT, id: "REMINDERS" },
      ],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useGetCustomersQuery,
  useSearchCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useCollectDebtMutation,
  useGetDebtHistoryQuery,
  useGetDebtRemindersQuery,
  useGetDebtSummaryQuery,
  useRemindCustomerDebtMutation,
} = customerApi;
