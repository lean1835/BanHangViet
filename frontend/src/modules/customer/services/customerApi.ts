import { baseApi } from "@/stores/baseApi";
import { API_TAG_TYPES } from "@/constants/api";
import type { ICustomer } from "../types/ICustomer";

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  creditLimit: number;
  dueDate?: string;
}

export interface UpdateCustomerRequest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  creditLimit: number;
  dueDate?: string;
}

export interface CustomerQueryParams {
  search?: string;
  debtStatus?: string;
  page?: number;
  limit?: number;
}

export const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<ICustomer[], CustomerQueryParams | void>({
      query: (params) => ({
        url: "/customers",
        method: "GET",
        params: params || undefined,
      }),
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

    getCustomerById: builder.query<ICustomer, string>({
      query: (id) => ({
        url: `/customers/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: API_TAG_TYPES.CUSTOMER, id }],
    }),

    createCustomer: builder.mutation<ICustomer, CreateCustomerRequest>({
      query: (body) => ({
        url: "/customers",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: API_TAG_TYPES.CUSTOMER, id: "LIST" }],
    }),

    updateCustomer: builder.mutation<ICustomer, UpdateCustomerRequest>({
      query: ({ id, ...body }) => ({
        url: `/customers/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAG_TYPES.CUSTOMER, id },
        { type: API_TAG_TYPES.CUSTOMER, id: "LIST" },
      ],
    }),

    deleteCustomer: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `/customers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: API_TAG_TYPES.CUSTOMER, id: "LIST" }],
    }),

    remindCustomerDebt: builder.mutation<
      { success: boolean; message: string },
      { customerId: string; messageContent: string }
    >({
      query: ({ customerId, messageContent }) => ({
        url: `/customers/${customerId}/remind`,
        method: "POST",
        body: { messageContent },
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: API_TAG_TYPES.CUSTOMER, id: customerId },
        { type: API_TAG_TYPES.CUSTOMER, id: "LIST" },
      ],
    }),

    payCustomerDebt: builder.mutation<
      ICustomer,
      { customerId: string; amount: number; paymentMethod?: string; notes?: string }
    >({
      query: ({ customerId, amount, paymentMethod, notes }) => ({
        url: `/customers/${customerId}/pay-debt`,
        method: "POST",
        body: { amount, paymentMethod, notes },
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: API_TAG_TYPES.CUSTOMER, id: customerId },
        { type: API_TAG_TYPES.CUSTOMER, id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useRemindCustomerDebtMutation,
  usePayCustomerDebtMutation,
} = customerApi;
