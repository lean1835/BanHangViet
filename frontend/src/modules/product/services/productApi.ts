import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import {
  PRODUCT_API_ENDPOINTS,
  PRODUCT_API_RESPONSE_DEFAULTS,
  PRODUCT_API_TAG_IDS,
  PRODUCT_QUERY_CONFIG,
  PRODUCT_STATUS,
} from "@/constants/product";
import type {
  IProduct,
  IGetProductsParams,
  IVoiceSearchParams,
  TProductPayload,
} from "@/modules/product/types/IProduct";
import type { IProductGroup } from "@/modules/product/types/IProductGroup";
import type {
  IGoodsReceipt,
  IGoodsReceiptDetail,
  IGoodsReceiptDetailInfo,
  ICreateGoodsReceiptPayload,
} from "@/modules/product/types/IGoodsReceipt";
import type {
  ILowStockWarning,
  ILowStockWarningListResponse,
  IPurchaseSuggestion,
  ILowStockWarningParams,
  IPurchaseSuggestionParams,
} from "@/modules/product/types/IInventoryWarning";
import { isRecord } from "@/utils/typeGuards";
import type { IPageResponse } from "@/types/api";

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
    barcode: readNullableString(product.barcode),
    name: readString(product.name),
    unit: readString(product.unit),
    price: readNumber(product.price),
    costPrice:
      product.costPrice !== undefined && product.costPrice !== null
        ? readNumber(product.costPrice)
        : undefined,
    stockQuantity: readNumber(product.stockQuantity),
    minStockQuantity: readNumber(product.minStockQuantity),
    status:
      product.status === PRODUCT_STATUS.INACTIVE
        ? PRODUCT_STATUS.INACTIVE
        : PRODUCT_STATUS.ACTIVE,
    groupId: readNullableString(product.groupId),
    groupName: readNullableString(product.groupName),
    taxRateId: readString(product.taxRateId),
    taxRateName: readString(product.taxRateName),
    taxRatePercentage: readNumber(product.taxRatePercentage),
    warehouseStock:
      product.warehouseStock !== undefined && product.warehouseStock !== null
        ? readNumber(product.warehouseStock)
        : undefined,
    allocatedStock:
      product.allocatedStock !== undefined && product.allocatedStock !== null
        ? readNumber(product.allocatedStock)
        : undefined,
    posStocks: Array.isArray(product.posStocks)
      ? product.posStocks.map((ps: unknown) => {
          const item = isRecord(ps) ? ps : {};
          return {
            posId: readString(item.posId),
            posCode: readString(item.posCode),
            posName: readString(item.posName),
            stockQuantity: readNumber(item.stockQuantity),
            minStockQuantity: readNumber(item.minStockQuantity),
          };
        })
      : undefined,
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

const toGoodsReceipt = (value: unknown): IGoodsReceipt => {
  const receipt = isRecord(value) ? value : {};
  return {
    id: readString(receipt.id),
    receiptNumber: readString(receipt.receiptNumber),
    supplierId: readString(receipt.supplierId) || undefined,
    supplierName: readString(receipt.supplierName) || undefined,
    totalAmount: readNumber(receipt.totalAmount) || undefined,
    receivedAt: readString(receipt.receivedAt),
    notes: readString(receipt.notes),
    createdByUserId: readString(receipt.createdByUserId),
    createdByUserName: readString(receipt.createdByUserName),
    createdAt: readString(receipt.createdAt),
    updatedAt: readString(receipt.updatedAt),
  };
};

const toGoodsReceiptDetail = (value: unknown): IGoodsReceiptDetail => {
  const detail = isRecord(value) ? value : {};
  const quantity = readNumber(detail.quantity);
  const purchasePrice = readNumber(detail.purchasePrice);
  return {
    id: readString(detail.id),
    productId: readString(detail.productId),
    productName: readString(detail.productName),
    productSku: readString(detail.productSku),
    quantity,
    purchasePrice,
    subtotal: readNumber(detail.subtotal) || quantity * purchasePrice,
  };
};

const toGoodsReceiptDetailInfo = (value: unknown): IGoodsReceiptDetailInfo => {
  const info = isRecord(value) ? value : {};
  const details = Array.isArray(info.details) ? info.details : [];
  return {
    id: readString(info.id),
    receiptNumber: readString(info.receiptNumber),
    supplierId: readString(info.supplierId) || undefined,
    supplierName: readString(info.supplierName) || undefined,
    totalAmount: readNumber(info.totalAmount) || undefined,
    receivedAt: readString(info.receivedAt),
    notes: readString(info.notes),
    createdByUserId: readString(info.createdByUserId),
    createdByUserName: readString(info.createdByUserName),
    details: details.map(toGoodsReceiptDetail),
    createdAt: readString(info.createdAt),
    updatedAt: readString(info.updatedAt),
  };
};

const toGoodsReceiptPage = (response: unknown): IPageResponse<IGoodsReceipt> => {
  const rawResult = readResult(response);
  const result = isRecord(rawResult) ? rawResult : {};
  const content = Array.isArray(result.content) ? result.content : [];

  return {
    content: content.map(toGoodsReceipt),
    pageNumber: readNumber(result.pageNumber),
    pageSize:
      readNumber(result.pageSize) || PRODUCT_QUERY_CONFIG.API_FALLBACK_PAGE_SIZE,
    totalElements: readNumber(result.totalElements),
    totalPages: readNumber(result.totalPages),
    last: result.last !== false,
  };
};

const toLowStockWarning = (value: unknown): ILowStockWarning => {
  const item = isRecord(value) ? value : {};
  return {
    productId: readString(item.productId),
    sku: readString(item.sku),
    productName: readString(item.productName),
    unit: readString(item.unit),
    price: readNumber(item.price),
    costPrice:
      item.costPrice !== undefined && item.costPrice !== null
        ? readNumber(item.costPrice)
        : undefined,
    stockQuantity: readNumber(item.stockQuantity),
    minStockQuantity: readNumber(item.minStockQuantity),
    shortageQuantity: readNumber(item.shortageQuantity),
    groupId: readNullableString(item.groupId),
    groupName: readNullableString(item.groupName),
    lastSupplierId: readNullableString(item.lastSupplierId),
    lastSupplierName: readNullableString(item.lastSupplierName),
    lastSupplierPhone: readNullableString(item.lastSupplierPhone),
  };
};

const toLowStockWarningListResponse = (
  response: unknown
): ILowStockWarningListResponse => {
  const rawResult = readResult(response);
  const result = isRecord(rawResult) ? rawResult : {};
  const rawPage = isRecord(result.page) ? result.page : {};
  const content = Array.isArray(rawPage.content) ? rawPage.content : [];

  return {
    page: {
      content: content.map(toLowStockWarning),
      pageNumber: readNumber(rawPage.pageNumber),
      pageSize:
        readNumber(rawPage.pageSize) ||
        PRODUCT_QUERY_CONFIG.API_FALLBACK_PAGE_SIZE,
      totalElements: readNumber(rawPage.totalElements),
      totalPages: readNumber(rawPage.totalPages),
      last: rawPage.last !== false,
    },
    isStockAdequate: Boolean(result.isStockAdequate),
    message:
      readString(result.message) ||
      (result.isStockAdequate ? "Tồn kho đang đầy đủ" : ""),
  };
};

const toPurchaseSuggestion = (value: unknown): IPurchaseSuggestion => {
  const item = isRecord(value) ? value : {};
  return {
    productId: readString(item.productId),
    sku: readString(item.sku),
    productName: readString(item.productName),
    unit: readString(item.unit),
    costPrice:
      item.costPrice !== undefined && item.costPrice !== null
        ? readNumber(item.costPrice)
        : undefined,
    stockQuantity: readNumber(item.stockQuantity),
    minStockQuantity: readNumber(item.minStockQuantity),
    averageWeeklySales: readNumber(item.averageWeeklySales),
    totalSoldInPeriod: readNumber(item.totalSoldInPeriod),
    suggestedQuantity: readNumber(item.suggestedQuantity),
    calculationRationale: readString(item.calculationRationale),
    hasPromotion: Boolean(item.hasPromotion),
    promotionWarning: readNullableString(item.promotionWarning),
    groupId: readNullableString(item.groupId),
    groupName: readNullableString(item.groupName),
    lastSupplierId: readNullableString(item.lastSupplierId),
    lastSupplierName: readNullableString(item.lastSupplierName),
    lastSupplierPhone: readNullableString(item.lastSupplierPhone),
  };
};

const toPurchaseSuggestionPage = (
  response: unknown
): IPageResponse<IPurchaseSuggestion> => {
  const rawResult = readResult(response);
  const result = isRecord(rawResult) ? rawResult : {};
  const content = Array.isArray(result.content) ? result.content : [];

  return {
    content: content.map(toPurchaseSuggestion),
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
          barcode: productData.barcode || undefined,
          name: productData.name,
          unit: productData.unit,
          price: productData.price,
          stockQuantity: productData.stockQuantity,
          minStockQuantity: productData.minStockQuantity,
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
        {
          type: API_TAG_TYPES.PRODUCT_GROUP,
          id: PRODUCT_API_TAG_IDS.LIST,
        },
        {
          type: API_TAG_TYPES.INVENTORY_WARNING,
          id: PRODUCT_API_TAG_IDS.LIST,
        },
        {
          type: API_TAG_TYPES.INVENTORY_WARNING,
          id: PRODUCT_API_TAG_IDS.SUGGESTIONS,
        },
        {
          type: API_TAG_TYPES.POS_INVENTORY,
          id: "LIST",
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
          barcode: data.barcode || undefined,
          name: data.name,
          unit: data.unit,
          price: data.price,
          stockQuantity: data.stockQuantity,
          minStockQuantity: data.minStockQuantity,
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
        { type: API_TAG_TYPES.PRODUCT_GROUP, id: PRODUCT_API_TAG_IDS.LIST },
        { type: API_TAG_TYPES.INVENTORY_WARNING, id: PRODUCT_API_TAG_IDS.LIST },
        {
          type: API_TAG_TYPES.INVENTORY_WARNING,
          id: PRODUCT_API_TAG_IDS.SUGGESTIONS,
        },
        { type: API_TAG_TYPES.POS_INVENTORY, id: "LIST" },
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
        { type: API_TAG_TYPES.INVENTORY_WARNING, id: PRODUCT_API_TAG_IDS.LIST },
        {
          type: API_TAG_TYPES.INVENTORY_WARNING,
          id: PRODUCT_API_TAG_IDS.SUGGESTIONS,
        },
        { type: API_TAG_TYPES.POS_INVENTORY, id: "LIST" },
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
    getGoodsReceipts: builder.query<
      IPageResponse<IGoodsReceipt>,
      { page?: number; size?: number } | void
    >({
      query: (params) => ({
        url: PRODUCT_API_ENDPOINTS.GOODS_RECEIPTS,
        method: HTTP_METHODS.GET,
        params: params || {},
      }),
      transformResponse: toGoodsReceiptPage,
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
    createGoodsReceipt: builder.mutation<
      IGoodsReceipt,
      ICreateGoodsReceiptPayload
    >({
      query: (body) => ({
        url: PRODUCT_API_ENDPOINTS.GOODS_RECEIPTS,
        method: HTTP_METHODS.POST,
        body,
      }),
      transformResponse: (response: unknown): IGoodsReceipt =>
        toGoodsReceipt(readResult(response)),
      invalidatesTags: [
        {
          type: API_TAG_TYPES.PRODUCT,
          id: PRODUCT_API_TAG_IDS.LIST,
        },
        {
          type: API_TAG_TYPES.SUPPLIER,
          id: "LIST",
        },
        {
          type: API_TAG_TYPES.INVENTORY_WARNING,
          id: PRODUCT_API_TAG_IDS.LIST,
        },
        {
          type: API_TAG_TYPES.INVENTORY_WARNING,
          id: PRODUCT_API_TAG_IDS.SUGGESTIONS,
        },
        {
          type: API_TAG_TYPES.POS_INVENTORY,
          id: "LIST",
        },
      ],
    }),
    getGoodsReceiptById: builder.query<IGoodsReceiptDetailInfo, string>({
      query: (id) => ({
        url: PRODUCT_API_ENDPOINTS.GOODS_RECEIPT_BY_ID(id),
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown): IGoodsReceiptDetailInfo =>
        toGoodsReceiptDetailInfo(readResult(response)),
      providesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.PRODUCT, id },
      ],
    }),
    importProducts: builder.mutation<
      {
        totalRows: number;
        successCount: number;
        errorCount: number;
        errors: Array<{
          rowNumber: number;
          productName: string;
          errorMessage: string;
        }>;
      },
      File
    >({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: "/products/import",
          method: HTTP_METHODS.POST,
          body: formData,
        };
      },
      transformResponse: (response: unknown) => {
        const result = readResult(response) as any;
        return {
          totalRows: result?.totalRows || 0,
          successCount: result?.successCount || 0,
          errorCount: result?.errorCount || 0,
          errors: Array.isArray(result?.errors) ? result.errors : [],
        };
      },
      invalidatesTags: [
        { type: API_TAG_TYPES.PRODUCT, id: PRODUCT_API_TAG_IDS.LIST },
        { type: API_TAG_TYPES.PRODUCT_GROUP, id: PRODUCT_API_TAG_IDS.LIST },
        {
          type: API_TAG_TYPES.INVENTORY_WARNING,
          id: PRODUCT_API_TAG_IDS.LIST,
        },
        {
          type: API_TAG_TYPES.INVENTORY_WARNING,
          id: PRODUCT_API_TAG_IDS.SUGGESTIONS,
        },
        {
          type: API_TAG_TYPES.POS_INVENTORY,
          id: "LIST",
        },
      ],
    }),
    downloadProductImportTemplate: builder.query<Blob, void>({
      query: () => ({
        url: "/products/import-template",
        method: HTTP_METHODS.GET,
        responseHandler: (response) => response.blob(),
      }),
    }),
    getLowStockWarnings: builder.query<
      ILowStockWarningListResponse,
      ILowStockWarningParams | void
    >({
      query: (params) => ({
        url: PRODUCT_API_ENDPOINTS.LOW_STOCK_WARNINGS,
        method: HTTP_METHODS.GET,
        params: params || {},
      }),
      transformResponse: toLowStockWarningListResponse,
      providesTags: [
        {
          type: API_TAG_TYPES.INVENTORY_WARNING,
          id: PRODUCT_API_TAG_IDS.LIST,
        },
      ],
    }),
    getPurchaseSuggestions: builder.query<
      IPageResponse<IPurchaseSuggestion>,
      IPurchaseSuggestionParams | void
    >({
      query: (params) => ({
        url: PRODUCT_API_ENDPOINTS.PURCHASE_SUGGESTIONS,
        method: HTTP_METHODS.GET,
        params: params || {},
      }),
      transformResponse: toPurchaseSuggestionPage,
      providesTags: [
        {
          type: API_TAG_TYPES.INVENTORY_WARNING,
          id: PRODUCT_API_TAG_IDS.SUGGESTIONS,
        },
      ],
    }),
    updateMinStock: builder.mutation<
      IProduct,
      { id: string; minStockQuantity: number }
    >({
      query: ({ id, minStockQuantity }) => ({
        url: PRODUCT_API_ENDPOINTS.PRODUCT_MIN_STOCK(id),
        method: HTTP_METHODS.PUT,
        body: {
          minStockQuantity,
        },
      }),
      transformResponse: (response: unknown): IProduct =>
        toProduct(readResult(response)),
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAG_TYPES.PRODUCT, id: PRODUCT_API_TAG_IDS.LIST },
        { type: API_TAG_TYPES.PRODUCT, id },
        {
          type: API_TAG_TYPES.INVENTORY_WARNING,
          id: PRODUCT_API_TAG_IDS.LIST,
        },
        {
          type: API_TAG_TYPES.INVENTORY_WARNING,
          id: PRODUCT_API_TAG_IDS.SUGGESTIONS,
        },
      ],
    }),
    voiceSearchProducts: builder.query<IProduct[], IVoiceSearchParams | void>({
      query: (params) => ({
        url: PRODUCT_API_ENDPOINTS.VOICE_SEARCH,
        method: HTTP_METHODS.GET,
        params: params || {},
      }),
      transformResponse: (response: unknown): IProduct[] => {
        const result = readResult(response);
        return Array.isArray(result) ? result.map(toProduct) : [];
      },
      providesTags: (result) =>
        result && result.length > 0
          ? [
              ...result.map(({ id }) => ({
                type: API_TAG_TYPES.PRODUCT,
                id,
              })),
              { type: API_TAG_TYPES.PRODUCT, id: PRODUCT_API_TAG_IDS.LIST },
            ]
          : [{ type: API_TAG_TYPES.PRODUCT, id: PRODUCT_API_TAG_IDS.LIST }],
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
  useGetGoodsReceiptsQuery,
  useCreateGoodsReceiptMutation,
  useGetGoodsReceiptByIdQuery,
  useImportProductsMutation,
  useLazyDownloadProductImportTemplateQuery,
  useGetLowStockWarningsQuery,
  useGetPurchaseSuggestionsQuery,
  useUpdateMinStockMutation,
  useVoiceSearchProductsQuery,
  useLazyVoiceSearchProductsQuery,
} = productApi;
