import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import type { IApiResponse, IPageResponse } from "@/types/api";
import type {
  ICreateSupplierReturnPayload,
  IGetSupplierReturnsQueryParams,
  IReceiptReturnableCheck,
  ISupplierReturn,
  ISupplierReturnDetail,
} from "../types/ISupplierReturn";

const getResponseResult = <T>(response: unknown): T => {
  if (response && typeof response === "object" && "result" in response) {
    return (response as IApiResponse<T>).result;
  }
  return response as T;
};

export const supplierReturnApi = baseApi.injectEndpoints({
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
  endpoints: (builder) => ({
    checkReceiptReturnable: builder.query<IReceiptReturnableCheck, string>({
      query: (receiptId) => ({
        url: `/supplier-returns/check-receipt/${receiptId}`,
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown) =>
        getResponseResult<IReceiptReturnableCheck>(response),
      providesTags: (_result, _error, receiptId) => [
        { type: API_TAG_TYPES.SUPPLIER_RETURN, id: `CHECK_${receiptId}` },
      ],
    }),

    createSupplierReturn: builder.mutation<
      ISupplierReturn,
      ICreateSupplierReturnPayload
    >({
      query: (body) => ({
        url: "/supplier-returns",
        method: HTTP_METHODS.POST,
        body,
      }),
      transformResponse: (response: unknown) =>
        getResponseResult<ISupplierReturn>(response),
      invalidatesTags: [
        { type: API_TAG_TYPES.SUPPLIER_RETURN, id: "LIST" },
        { type: API_TAG_TYPES.PRODUCT, id: "LIST" },
        { type: API_TAG_TYPES.SUPPLIER, id: "LIST" },
        { type: API_TAG_TYPES.DEBT, id: "LIST" },
        { type: API_TAG_TYPES.STOCK_CARD },
      ],
    }),

    getSupplierReturns: builder.query<
      IPageResponse<ISupplierReturn>,
      IGetSupplierReturnsQueryParams | void
    >({
      query: (params) => {
        const queryParams: Record<string, string | number> = {};
        if (params?.supplierId) queryParams.supplierId = params.supplierId;
        if (params?.fromDate) queryParams.fromDate = params.fromDate;
        if (params?.toDate) queryParams.toDate = params.toDate;
        if (params?.keyword) queryParams.keyword = params.keyword;
        if (params?.page !== undefined) queryParams.page = params.page;
        if (params?.size !== undefined) queryParams.size = params.size;

        return {
          url: "/supplier-returns",
          method: HTTP_METHODS.GET,
          params: queryParams,
        };
      },
      transformResponse: (response: unknown) =>
        getResponseResult<IPageResponse<ISupplierReturn>>(response),
      providesTags: (result) =>
        result?.content
          ? [
              ...result.content.map(({ id }) => ({
                type: API_TAG_TYPES.SUPPLIER_RETURN,
                id,
              })),
              { type: API_TAG_TYPES.SUPPLIER_RETURN, id: "LIST" },
            ]
          : [{ type: API_TAG_TYPES.SUPPLIER_RETURN, id: "LIST" }],
    }),

    getSupplierReturnById: builder.query<ISupplierReturnDetail, string>({
      query: (id) => ({
        url: `/supplier-returns/${id}`,
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown) =>
        getResponseResult<ISupplierReturnDetail>(response),
      providesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.SUPPLIER_RETURN, id },
      ],
    }),
  }),
});

export const {
  useCheckReceiptReturnableQuery,
  useLazyCheckReceiptReturnableQuery,
  useCreateSupplierReturnMutation,
  useGetSupplierReturnsQuery,
  useGetSupplierReturnByIdQuery,
  useLazyGetSupplierReturnByIdQuery,
} = supplierReturnApi;
