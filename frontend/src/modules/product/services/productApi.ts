import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import {
  PRODUCT_API_ENDPOINTS,
  PRODUCT_API_RESPONSE_DEFAULTS,
  PRODUCT_API_TAG_IDS,
  PRODUCT_QUERY_CONFIG,
  PRODUCT_STATUS,
} from "@/constants/product";
import type { IProduct } from "@/modules/product/types/IProduct";
import type { IProductGroup } from "@/modules/product/types/IProductGroup";
import type { TProductStatus } from "@/modules/product/types/TProductStatus";
import type { TStockFilter } from "@/modules/product/types/TStockFilter";
import { isRecord } from "@/utils/typeGuards";

interface IPageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

interface IGetProductsParams {
  search?: string;
  groupId?: string;
  status?: TProductStatus;
  stockFilter?: TStockFilter;
  page?: number;
  size?: number;
}

type TProductPayload = Partial<IProduct> & { taxRateId: string };

const readString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const readNullableString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const readNumber = (value: unknown): number => {
  const parsedValue = Number(value ?? PRODUCT_API_RESPONSE_DEFAULTS.NUMBER);
  return Number.isFinite(parsedValue)
    ? parsedValue
    : PRODUCT_API_RESPONSE_DEFAULTS.NUMBER;
};

const readResult = (response: unknown): unknown =>
  isRecord(response) ? response.result : undefined;

const toProduct = (value: unknown): IProduct => {
  const product = isRecord(value) ? value : {};

  return {
    id: readString(product.id),
    sku: readString(product.sku),
    name: readString(product.name),
    unit: readString(product.unit),
    price: readNumber(product.price),
    stockQuantity: readNumber(product.stockQuantity),
    status:
      product.status === PRODUCT_STATUS.INACTIVE
        ? PRODUCT_STATUS.INACTIVE
        : PRODUCT_STATUS.ACTIVE,
    groupId: readNullableString(product.groupId),
    groupName: readNullableString(product.groupName),
    taxRateId: readString(product.taxRateId),
    taxRateName: readString(product.taxRateName),
    taxRatePercentage: readNumber(product.taxRatePercentage),
    createdAt: readString(product.createdAt),
    updatedAt: readString(product.updatedAt),
  };
};

const toProductGroup = (value: unknown): IProductGroup => {
  const productGroup = isRecord(value) ? value : {};

  return {
    id: readString(productGroup.id),
    name: readString(productGroup.name),
    householdId: readString(productGroup.householdId),
    createdAt: readString(productGroup.createdAt),
    updatedAt: readString(productGroup.updatedAt),
  };
};

const toProductPage = (response: unknown): IPageResponse<IProduct> => {
  const rawResult = readResult(response);
  const result = isRecord(rawResult) ? rawResult : {};
  const content = Array.isArray(result.content) ? result.content : [];

  return {
    content: content.map(toProduct),
    pageNumber: readNumber(result.pageNumber),
    pageSize:
      readNumber(result.pageSize) || PRODUCT_QUERY_CONFIG.API_FALLBACK_PAGE_SIZE,
    totalElements: readNumber(result.totalElements),
    totalPages: readNumber(result.totalPages),
    last: result.last !== false,
  };
};

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<
      IPageResponse<IProduct>,
      IGetProductsParams | void
    >({
      query: (params) => ({
        url: PRODUCT_API_ENDPOINTS.PRODUCTS,
        method: HTTP_METHODS.GET,
        params: params || {},
      }),
      transformResponse: toProductPage,
      providesTags: (result) =>
        result?.content
          ? [
              ...result.content.map(({ id }) => ({
                type: API_TAG_TYPES.PRODUCT,
                id,
              })),
              {
                type: API_TAG_TYPES.PRODUCT,
                id: PRODUCT_API_TAG_IDS.LIST,
              },
            ]
          : [
              {
                type: API_TAG_TYPES.PRODUCT,
                id: PRODUCT_API_TAG_IDS.LIST,
              },
            ],
    }),
    createProduct: builder.mutation<IProduct, TProductPayload>({
      query: (productData) => ({
        url: PRODUCT_API_ENDPOINTS.PRODUCTS,
        method: HTTP_METHODS.POST,
        body: {
          sku: productData.sku,
          name: productData.name,
          unit: productData.unit,
          price: productData.price,
          stockQuantity: productData.stockQuantity,
          status: productData.status || PRODUCT_STATUS.ACTIVE,
          groupId: productData.groupId || undefined,
          taxRateId: productData.taxRateId,
        },
      }),
      transformResponse: (response: unknown): IProduct =>
        toProduct(readResult(response)),
      invalidatesTags: [
        {
          type: API_TAG_TYPES.PRODUCT,
          id: PRODUCT_API_TAG_IDS.LIST,
        },
      ],
    }),
    updateProduct: builder.mutation<
      IProduct,
      { id: string; data: TProductPayload }
    >({
      query: ({ id, data }) => ({
        url: PRODUCT_API_ENDPOINTS.PRODUCT_BY_ID(id),
        method: HTTP_METHODS.PUT,
        body: {
          sku: data.sku,
          name: data.name,
          unit: data.unit,
          price: data.price,
          stockQuantity: data.stockQuantity,
          status: data.status || PRODUCT_STATUS.ACTIVE,
          groupId: data.groupId || undefined,
          taxRateId: data.taxRateId,
        },
      }),
      transformResponse: (response: unknown): IProduct =>
        toProduct(readResult(response)),
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAG_TYPES.PRODUCT, id: PRODUCT_API_TAG_IDS.LIST },
        { type: API_TAG_TYPES.PRODUCT, id },
      ],
    }),
    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({
        url: PRODUCT_API_ENDPOINTS.PRODUCT_BY_ID(id),
        method: HTTP_METHODS.DELETE,
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.PRODUCT, id: PRODUCT_API_TAG_IDS.LIST },
        { type: API_TAG_TYPES.PRODUCT, id },
      ],
    }),
    getProductGroups: builder.query<IProductGroup[], void>({
      query: () => ({
        url: PRODUCT_API_ENDPOINTS.PRODUCT_GROUPS,
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown): IProductGroup[] => {
        const result = readResult(response);
        return Array.isArray(result) ? result.map(toProductGroup) : [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: API_TAG_TYPES.PRODUCT_GROUP,
                id,
              })),
              {
                type: API_TAG_TYPES.PRODUCT_GROUP,
                id: PRODUCT_API_TAG_IDS.LIST,
              },
            ]
          : [
              {
                type: API_TAG_TYPES.PRODUCT_GROUP,
                id: PRODUCT_API_TAG_IDS.LIST,
              },
            ],
    }),
    createProductGroup: builder.mutation<IProductGroup, { name: string }>({
      query: (data) => ({
        url: PRODUCT_API_ENDPOINTS.PRODUCT_GROUPS,
        method: HTTP_METHODS.POST,
        body: {
          name: data.name,
        },
      }),
      transformResponse: (response: unknown): IProductGroup =>
        toProductGroup(readResult(response)),
      invalidatesTags: [
        {
          type: API_TAG_TYPES.PRODUCT_GROUP,
          id: PRODUCT_API_TAG_IDS.LIST,
        },
      ],
    }),
    updateProductGroup: builder.mutation<
      IProductGroup,
      { id: string; name: string }
    >({
      query: ({ id, name }) => ({
        url: PRODUCT_API_ENDPOINTS.PRODUCT_GROUP_BY_ID(id),
        method: HTTP_METHODS.PUT,
        body: {
          name,
        },
      }),
      transformResponse: (response: unknown): IProductGroup =>
        toProductGroup(readResult(response)),
      invalidatesTags: (_result, _error, { id }) => [
        {
          type: API_TAG_TYPES.PRODUCT_GROUP,
          id: PRODUCT_API_TAG_IDS.LIST,
        },
        { type: API_TAG_TYPES.PRODUCT_GROUP, id },
        { type: API_TAG_TYPES.PRODUCT, id: PRODUCT_API_TAG_IDS.LIST },
      ],
    }),
    deleteProductGroup: builder.mutation<void, string>({
      query: (id) => ({
        url: PRODUCT_API_ENDPOINTS.PRODUCT_GROUP_BY_ID(id),
        method: HTTP_METHODS.DELETE,
      }),
      invalidatesTags: (_result, _error, id) => [
        {
          type: API_TAG_TYPES.PRODUCT_GROUP,
          id: PRODUCT_API_TAG_IDS.LIST,
        },
        { type: API_TAG_TYPES.PRODUCT_GROUP, id },
        { type: API_TAG_TYPES.PRODUCT, id: PRODUCT_API_TAG_IDS.LIST },
      ],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetProductGroupsQuery,
  useCreateProductGroupMutation,
  useUpdateProductGroupMutation,
  useDeleteProductGroupMutation,
} = productApi;
