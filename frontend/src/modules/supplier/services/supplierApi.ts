import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import type {
  ISupplier,
  SupplierStatus,
  ICreateSupplierRequest,
  IUpdateSupplierRequest,
  ISupplierQueryParams,
} from "../types/ISupplier";

const getResponseResult = <T>(response: unknown): T => {
  if (response && typeof response === "object" && "result" in response) {
    return (response as { result: T }).result;
  }
  return response as T;
};

const mapSupplier = (raw: unknown): ISupplier => {
  if (!raw || typeof raw !== "object") {
    return raw as ISupplier;
  }
  const item = raw as Record<string, unknown>;
  const debtVal =
    typeof item.currentDebt === "number"
      ? item.currentDebt
      : Number(item.currentDebt || 0);

  const statusVal: SupplierStatus =
    item.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";

  return {
    id: String(item.id || ""),
    householdId: String(item.householdId || ""),
    name: String(item.name || ""),
    phoneNumber: String(item.phoneNumber || ""),
    email: item.email ? String(item.email) : null,
    address: item.address ? String(item.address) : null,
    taxCode: item.taxCode ? String(item.taxCode) : null,
    note: item.note ? String(item.note) : null,
    status: statusVal,
    currentDebt: debtVal,
    createdAt: String(item.createdAt || ""),
    updatedAt: String(item.updatedAt || ""),
  };
};

export const supplierApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<ISupplier[], ISupplierQueryParams | void>({
      query: (params) => {
        if (params?.query && params.query.trim()) {
          return {
            url: "/suppliers/search",
            method: HTTP_METHODS.GET,
            params: { query: params.query.trim() },
          };
        }
        return {
          url: "/suppliers",
          method: HTTP_METHODS.GET,
        };
      },
      transformResponse: (response: unknown): ISupplier[] => {
        const result = getResponseResult<unknown[]>(response);
        return Array.isArray(result) ? result.map(mapSupplier) : [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: API_TAG_TYPES.SUPPLIER,
                id,
              })),
              { type: API_TAG_TYPES.SUPPLIER, id: "LIST" },
            ]
          : [{ type: API_TAG_TYPES.SUPPLIER, id: "LIST" }],
    }),

    getSupplierById: builder.query<ISupplier, string>({
      query: (id) => ({
        url: `/suppliers/${id}`,
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown): ISupplier => {
        const result = getResponseResult<unknown>(response);
        return mapSupplier(result);
      },
      providesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.SUPPLIER, id },
      ],
    }),

    searchSuppliers: builder.query<ISupplier[], string>({
      query: (query) => ({
        url: "/suppliers/search",
        method: HTTP_METHODS.GET,
        params: query?.trim() ? { query: query.trim() } : undefined,
      }),
      transformResponse: (response: unknown): ISupplier[] => {
        const result = getResponseResult<unknown[]>(response);
        return Array.isArray(result) ? result.map(mapSupplier) : [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: API_TAG_TYPES.SUPPLIER,
                id,
              })),
              { type: API_TAG_TYPES.SUPPLIER, id: "LIST" },
            ]
          : [{ type: API_TAG_TYPES.SUPPLIER, id: "LIST" }],
    }),

    createSupplier: builder.mutation<ISupplier, ICreateSupplierRequest>({
      query: (payload) => ({
        url: "/suppliers",
        method: HTTP_METHODS.POST,
        body: payload,
      }),
      transformResponse: (response: unknown): ISupplier => {
        const result = getResponseResult<unknown>(response);
        return mapSupplier(result);
      },
      invalidatesTags: [{ type: API_TAG_TYPES.SUPPLIER, id: "LIST" }],
    }),

    updateSupplier: builder.mutation<
      ISupplier,
      { id: string; data: IUpdateSupplierRequest }
    >({
      query: ({ id, data }) => ({
        url: `/suppliers/${id}`,
        method: HTTP_METHODS.PUT,
        body: data,
      }),
      transformResponse: (response: unknown): ISupplier => {
        const result = getResponseResult<unknown>(response);
        return mapSupplier(result);
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAG_TYPES.SUPPLIER, id: "LIST" },
        { type: API_TAG_TYPES.SUPPLIER, id },
      ],
    }),

    updateSupplierStatus: builder.mutation<
      ISupplier,
      { id: string; status: SupplierStatus }
    >({
      query: ({ id, status }) => ({
        url: `/suppliers/${id}/status?status=${status}`,
        method: HTTP_METHODS.PATCH,
      }),
      transformResponse: (response: unknown): ISupplier => {
        const result = getResponseResult<unknown>(response);
        return mapSupplier(result);
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAG_TYPES.SUPPLIER, id: "LIST" },
        { type: API_TAG_TYPES.SUPPLIER, id },
      ],
    }),

    deleteSupplier: builder.mutation<void, string>({
      query: (id) => ({
        url: `/suppliers/${id}`,
        method: HTTP_METHODS.DELETE,
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.SUPPLIER, id: "LIST" },
        { type: API_TAG_TYPES.SUPPLIER, id },
      ],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useGetSuppliersQuery,
  useGetSupplierByIdQuery,
  useSearchSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useUpdateSupplierStatusMutation,
  useDeleteSupplierMutation,
} = supplierApi;
