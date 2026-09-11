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
import type {
  IStockCardResponse,
  IGetStockCardParams,
} from "@/modules/product/types/IStockCard";
import type {
  IProductUnitConversion,
  ICreateUnitConversionRequest,
  IUpdateUnitConversionRequest,
} from "@/modules/product/types/IProductUnitConversion";
import type {
  IProductPriceTier,
  ICreatePriceTierRequest,
  IUpdatePriceTierRequest,
  IBatchSavePriceTiersRequest,
  IResolveTierPriceRequest,
  IResolveTierPriceResponse,
} from "@/modules/product/types/IProductPriceTier";
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

export const toProductUnitConversion = (value: unknown): IProductUnitConversion => {
  const item = isRecord(value) ? value : {};
  return {
    id: readString(item.id),
    productId: readString(item.productId),
    productName: readString(item.productName),
    baseUnit: readString(item.baseUnit),
    unitName: readString(item.unitName),
    conversionFactor: readNumber(item.conversionFactor),
    price:
      item.price !== undefined && item.price !== null
        ? readNumber(item.price)
        : null,
    barcode: readNullableString(item.barcode),
    isDefaultImport: Boolean(item.isDefaultImport),
    isDefaultSale: Boolean(item.isDefaultSale),
    hasStockMovement: Boolean(item.hasStockMovement),
    createdAt: readString(item.createdAt),
    updatedAt: readString(item.updatedAt),
  };
};

export const toProductPriceTier = (value: unknown): IProductPriceTier => {
  const item = isRecord(value) ? value : {};
  return {
    id: readString(item.id),
    productId: readString(item.productId),
    productName: readString(item.productName),
    unitConversionId: readNullableString(item.unitConversionId),
    unitName: readString(item.unitName),
    tierName: readString(item.tierName),
    minQuantity: readNumber(item.minQuantity),
    maxQuantity:
      item.maxQuantity !== undefined && item.maxQuantity !== null
        ? readNumber(item.maxQuantity)
        : null,
    price: readNumber(item.price),
    isActive: Boolean(item.isActive ?? true),
    costPrice:
      item.costPrice !== undefined && item.costPrice !== null
        ? readNumber(item.costPrice)
        : undefined,
    isBelowCost: Boolean(item.isBelowCost),
    createdAt: readString(item.createdAt),
    updatedAt: readString(item.updatedAt),
  };
};

export const toResolveTierPriceResponse = (value: unknown): IResolveTierPriceResponse => {
  const item = isRecord(value) ? value : {};
  return {
    productId: readString(item.productId),
    productName: readString(item.productName),
    quantity: readNumber(item.quantity),
    baseRetailPrice: readNumber(item.baseRetailPrice),
    matchedTierId: readNullableString(item.matchedTierId),
    matchedTierName: readNullableString(item.matchedTierName),
    appliedUnitPrice: readNumber(item.appliedUnitPrice),
    costPrice: readNumber(item.costPrice),
    isBelowCost: Boolean(item.isBelowCost),
    savingAmountPerUnit: readNumber(item.savingAmountPerUnit),
    totalSavingAmount: readNumber(item.totalSavingAmount),
  };
};

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
    unitConversions: Array.isArray(product.unitConversions)
      ? product.unitConversions.map(toProductUnitConversion)
      : undefined,
    priceTiers: Array.isArray(product.priceTiers)
      ? product.priceTiers.map(toProductPriceTier)
      : undefined,
    isSoldByWeight: Boolean(product.isSoldByWeight),
    decimalPlaces:
      product.decimalPlaces !== undefined && product.decimalPlaces !== null
        ? readNumber(product.decimalPlaces)
        : undefined,
    minWeightStep:
      product.minWeightStep !== undefined && product.minWeightStep !== null
        ? readNumber(product.minWeightStep)
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
    unitConversionId: readNullableString(detail.unitConversionId),
    unitName: readNullableString(detail.unitName),
    conversionFactor:
      detail.conversionFactor !== undefined && detail.conversionFactor !== null
        ? readNumber(detail.conversionFactor)
        : null,
    baseQuantity:
      detail.baseQuantity !== undefined && detail.baseQuantity !== null
        ? readNumber(detail.baseQuantity)
        : null,
    basePurchasePrice:
      detail.basePurchasePrice !== undefined && detail.basePurchasePrice !== null
        ? readNumber(detail.basePurchasePrice)
        : null,
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

const toStockCardResponse = (response: unknown): IStockCardResponse => {
  const result = readResult(response);
  const data = isRecord(result) ? result : isRecord(response) ? response : {};
  const movementsObj = isRecord(data.movements) ? data.movements : {};
  const content = Array.isArray(movementsObj.content)
    ? movementsObj.content.map((m: unknown) => {
        const item = isRecord(m) ? m : {};
        return {
          id: readString(item.id),
          documentId: readString(item.documentId),
          documentType: readString(item.documentType),
          documentTypeName: readString(item.documentTypeName),
          documentNumber: readString(item.documentNumber),
          documentUrl: readString(item.documentUrl),
          timestamp: readString(item.timestamp),
          changeType: readString(item.changeType),
          quantityIn: readNumber(item.quantityIn),
          quantityOut: readNumber(item.quantityOut),
          quantityChange: readNumber(item.quantityChange),
          balanceAfter: readNumber(item.balanceAfter),
          performedBy: readString(item.performedBy),
          notes: readNullableString(item.notes),
        };
      })
    : [];

  return {
    productId: readString(data.productId),
    productSku: readString(data.productSku),
    productName: readString(data.productName),
    unit: readString(data.unit),
    fromDate: readString(data.fromDate),
    toDate: readString(data.toDate),
    openingStock: readNumber(data.openingStock),
    totalQuantityIn: readNumber(data.totalQuantityIn),
    totalQuantityOut: readNumber(data.totalQuantityOut),
    closingStock: readNumber(data.closingStock),
    currentStock: readNumber(data.currentStock),
    isDiscrepancy: Boolean(data.isDiscrepancy),
    warning: readNullableString(data.warning),
    movements: {
      content,
      pageNumber: readNumber(movementsObj.pageNumber),
      pageSize: readNumber(movementsObj.pageSize),
      totalPages: readNumber(movementsObj.totalPages),
      totalElements: readNumber(movementsObj.totalElements),
      last: movementsObj.last !== false,
    },
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
    getProductById: builder.query<IProduct, string>({
      query: (id) => ({
        url: PRODUCT_API_ENDPOINTS.PRODUCT_BY_ID(id),
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown): IProduct =>
        toProduct(readResult(response)),
      providesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.PRODUCT, id },
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
          isSoldByWeight: Boolean(productData.isSoldByWeight),
          decimalPlaces: productData.decimalPlaces,
          minWeightStep: productData.minWeightStep,
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
          isSoldByWeight: Boolean(data.isSoldByWeight),
          decimalPlaces: data.decimalPlaces,
          minWeightStep: data.minWeightStep,
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
          type: API_TAG_TYPES.PRODUCT,
        },
        {
          type: API_TAG_TYPES.STOCK_CARD,
        },
        {
          type: API_TAG_TYPES.STOCK_CARD,
          id: "LIST",
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
        { type: API_TAG_TYPES.PRODUCT },
        { type: API_TAG_TYPES.STOCK_CARD },
        { type: API_TAG_TYPES.STOCK_CARD, id: "LIST" },
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
    getStockCard: builder.query<IStockCardResponse, IGetStockCardParams>({
      query: ({ productId, fromDate, toDate, page, size }) => ({
        url: PRODUCT_API_ENDPOINTS.STOCK_CARD(productId),
        method: HTTP_METHODS.GET,
        params: {
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
          ...(page !== undefined ? { page } : {}),
          ...(size !== undefined ? { size } : {}),
        },
      }),
      transformResponse: toStockCardResponse,
      providesTags: (_result, _error, { productId }) => [
        { type: API_TAG_TYPES.STOCK_CARD, id: productId },
        { type: API_TAG_TYPES.STOCK_CARD, id: "LIST" },
      ],
    }),
    getUnitConversions: builder.query<IProductUnitConversion[], string>({
      query: (productId) => ({
        url: `/products/${productId}/unit-conversions`,
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown) => {
        const raw = readResult(response);
        return Array.isArray(raw) ? raw.map(toProductUnitConversion) : [];
      },
      providesTags: (_result, _error, productId) => [
        { type: API_TAG_TYPES.PRODUCT_UNIT_CONVERSION, id: productId },
        { type: API_TAG_TYPES.PRODUCT_UNIT_CONVERSION, id: "LIST" },
      ],
    }),
    createUnitConversion: builder.mutation<
      IProductUnitConversion,
      { productId: string; data: ICreateUnitConversionRequest }
    >({
      query: ({ productId, data }) => ({
        url: `/products/${productId}/unit-conversions`,
        method: HTTP_METHODS.POST,
        body: data,
      }),
      transformResponse: (response: unknown) =>
        toProductUnitConversion(readResult(response)),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: API_TAG_TYPES.PRODUCT_UNIT_CONVERSION, id: productId },
        { type: API_TAG_TYPES.PRODUCT_UNIT_CONVERSION, id: "LIST" },
        { type: API_TAG_TYPES.PRODUCT, id: productId },
        { type: API_TAG_TYPES.PRODUCT, id: PRODUCT_API_TAG_IDS.LIST },
      ],
    }),
    updateUnitConversion: builder.mutation<
      IProductUnitConversion,
      { productId: string; conversionId: string; data: IUpdateUnitConversionRequest }
    >({
      query: ({ productId, conversionId, data }) => ({
        url: `/products/${productId}/unit-conversions/${conversionId}`,
        method: HTTP_METHODS.PUT,
        body: data,
      }),
      transformResponse: (response: unknown) =>
        toProductUnitConversion(readResult(response)),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: API_TAG_TYPES.PRODUCT_UNIT_CONVERSION, id: productId },
        { type: API_TAG_TYPES.PRODUCT_UNIT_CONVERSION, id: "LIST" },
        { type: API_TAG_TYPES.PRODUCT, id: productId },
        { type: API_TAG_TYPES.PRODUCT, id: PRODUCT_API_TAG_IDS.LIST },
      ],
    }),
    deleteUnitConversion: builder.mutation<
      void,
      { productId: string; conversionId: string }
    >({
      query: ({ productId, conversionId }) => ({
        url: `/products/${productId}/unit-conversions/${conversionId}`,
        method: HTTP_METHODS.DELETE,
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: API_TAG_TYPES.PRODUCT_UNIT_CONVERSION, id: productId },
        { type: API_TAG_TYPES.PRODUCT_UNIT_CONVERSION, id: "LIST" },
        { type: API_TAG_TYPES.PRODUCT, id: productId },
        { type: API_TAG_TYPES.PRODUCT, id: PRODUCT_API_TAG_IDS.LIST },
      ],
    }),
    getPriceTiers: builder.query<IProductPriceTier[], string>({
      query: (productId) => ({
        url: `/products/${productId}/price-tiers`,
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown) => {
        const raw = readResult(response);
        return Array.isArray(raw) ? raw.map(toProductPriceTier) : [];
      },
      providesTags: (_result, _error, productId) => [
        { type: API_TAG_TYPES.PRODUCT_PRICE_TIER, id: productId },
        { type: API_TAG_TYPES.PRODUCT_PRICE_TIER, id: "LIST" },
      ],
    }),
    createPriceTier: builder.mutation<
      IProductPriceTier,
      { productId: string; data: ICreatePriceTierRequest }
    >({
      query: ({ productId, data }) => ({
        url: `/products/${productId}/price-tiers`,
        method: HTTP_METHODS.POST,
        body: data,
      }),
      transformResponse: (response: unknown) =>
        toProductPriceTier(readResult(response)),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: API_TAG_TYPES.PRODUCT_PRICE_TIER, id: productId },
        { type: API_TAG_TYPES.PRODUCT_PRICE_TIER, id: "LIST" },
        { type: API_TAG_TYPES.PRODUCT, id: productId },
      ],
    }),
    updatePriceTier: builder.mutation<
      IProductPriceTier,
      { productId: string; tierId: string; data: IUpdatePriceTierRequest }
    >({
      query: ({ productId, tierId, data }) => ({
        url: `/products/${productId}/price-tiers/${tierId}`,
        method: HTTP_METHODS.PUT,
        body: data,
      }),
      transformResponse: (response: unknown) =>
        toProductPriceTier(readResult(response)),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: API_TAG_TYPES.PRODUCT_PRICE_TIER, id: productId },
        { type: API_TAG_TYPES.PRODUCT_PRICE_TIER, id: "LIST" },
        { type: API_TAG_TYPES.PRODUCT, id: productId },
      ],
    }),
    deletePriceTier: builder.mutation<
      void,
      { productId: string; tierId: string }
    >({
      query: ({ productId, tierId }) => ({
        url: `/products/${productId}/price-tiers/${tierId}`,
        method: HTTP_METHODS.DELETE,
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: API_TAG_TYPES.PRODUCT_PRICE_TIER, id: productId },
        { type: API_TAG_TYPES.PRODUCT_PRICE_TIER, id: "LIST" },
        { type: API_TAG_TYPES.PRODUCT, id: productId },
      ],
    }),
    batchSavePriceTiers: builder.mutation<
      IProductPriceTier[],
      { productId: string; data: IBatchSavePriceTiersRequest }
    >({
      query: ({ productId, data }) => ({
        url: `/products/${productId}/price-tiers/batch`,
        method: HTTP_METHODS.PUT,
        body: data,
      }),
      transformResponse: (response: unknown) => {
        const raw = readResult(response);
        return Array.isArray(raw) ? raw.map(toProductPriceTier) : [];
      },
      invalidatesTags: (_result, _error, { productId }) => [
        { type: API_TAG_TYPES.PRODUCT_PRICE_TIER, id: productId },
        { type: API_TAG_TYPES.PRODUCT_PRICE_TIER, id: "LIST" },
        { type: API_TAG_TYPES.PRODUCT, id: productId },
      ],
    }),
    resolveTierPrice: builder.mutation<
      IResolveTierPriceResponse,
      { productId: string; data: IResolveTierPriceRequest }
    >({
      query: ({ productId, data }) => ({
        url: `/products/${productId}/price-tiers/resolve`,
        method: HTTP_METHODS.POST,
        body: data,
      }),
      transformResponse: (response: unknown) =>
        toResolveTierPriceResponse(readResult(response)),
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
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
  useGetStockCardQuery,
  useLazyGetStockCardQuery,
  useGetUnitConversionsQuery,
  useLazyGetUnitConversionsQuery,
  useCreateUnitConversionMutation,
  useUpdateUnitConversionMutation,
  useDeleteUnitConversionMutation,
  useGetPriceTiersQuery,
  useLazyGetPriceTiersQuery,
  useCreatePriceTierMutation,
  useUpdatePriceTierMutation,
  useDeletePriceTierMutation,
  useBatchSavePriceTiersMutation,
  useResolveTierPriceMutation,
} = productApi;
