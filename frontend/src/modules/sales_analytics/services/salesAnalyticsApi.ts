import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import type { IPageResponse } from "@/types/api";
import type {
  IPeakHoursAndDaysResponse,
  IPeakHoursAndDaysParams,
  IPurchaseSuggestion,
  IPurchaseForecastParams,
  ISlowMovingProductListResponse,
  ISlowMovingParams,
  ISlowMovingProduct,
  ISlowMovingSummary,
} from "../types/ISalesAnalytics";
import { isRecord } from "@/utils/typeGuards";

const readString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const readNullableString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const readNumber = (value: unknown): number => {
  const parsedValue = Number(value ?? 0);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const readResult = (response: unknown): unknown =>
  isRecord(response) ? response.result : undefined;

const toSlowMovingProduct = (value: unknown): ISlowMovingProduct => {
  const item = isRecord(value) ? value : {};
  return {
    productId: readString(item.productId),
    sku: readString(item.sku),
    productName: readString(item.productName),
    unit: readString(item.unit),
    groupId: readNullableString(item.groupId),
    groupName: readNullableString(item.groupName),
    stockQuantity: readNumber(item.stockQuantity),
    costPrice:
      item.costPrice !== undefined && item.costPrice !== null
        ? readNumber(item.costPrice)
        : undefined,
    price: readNumber(item.price),
    stagnantCapital: readNumber(item.stagnantCapital),
    retailInventoryValue: readNumber(item.retailInventoryValue),
    lastSaleDate: readNullableString(item.lastSaleDate),
    daysWithoutSale: readNumber(item.daysWithoutSale),
  };
};

const toSlowMovingSummary = (value: unknown): ISlowMovingSummary => {
  const item = isRecord(value) ? value : {};
  return {
    thresholdDays: readNumber(item.thresholdDays) || 60,
    totalStagnantProducts: readNumber(item.totalStagnantProducts),
    totalStagnantStockQuantity: readNumber(item.totalStagnantStockQuantity),
    totalStagnantCapital: readNumber(item.totalStagnantCapital),
    totalRetailValue: readNumber(item.totalRetailValue),
  };
};

const toSlowMovingProductListResponse = (
  response: unknown
): ISlowMovingProductListResponse => {
  const rawResult = readResult(response);
  const result = isRecord(rawResult) ? rawResult : {};
  const rawPage = isRecord(result.pageData) ? result.pageData : {};
  const content = Array.isArray(rawPage.content) ? rawPage.content : [];

  return {
    summary: toSlowMovingSummary(result.summary),
    pageData: {
      content: content.map(toSlowMovingProduct),
      pageNumber: readNumber(rawPage.pageNumber),
      pageSize: readNumber(rawPage.pageSize) || 10,
      totalElements: readNumber(rawPage.totalElements),
      totalPages: readNumber(rawPage.totalPages),
      last: rawPage.last !== false,
    },
  };
};

const toPeakHoursAndDaysResponse = (
  response: unknown
): IPeakHoursAndDaysResponse => {
  const rawResult = readResult(response);
  const result = isRecord(rawResult) ? rawResult : {};
  const rawFilter = isRecord(result.filterInfo) ? result.filterInfo : {};
  const rawInsights = isRecord(result.insights) ? result.insights : {};

  const hourlyStats = Array.isArray(result.hourlyStats)
    ? result.hourlyStats.map((h: unknown) => {
        const item = isRecord(h) ? h : {};
        return {
          hour: readNumber(item.hour),
          label: readString(item.label),
          orderCount: readNumber(item.orderCount),
          totalRevenue: readNumber(item.totalRevenue),
          averageOrderValue: readNumber(item.averageOrderValue),
          revenuePercentage: readNumber(item.revenuePercentage),
        };
      })
    : [];

  const dayOfWeekStats = Array.isArray(result.dayOfWeekStats)
    ? result.dayOfWeekStats.map((d: unknown) => {
        const item = isRecord(d) ? d : {};
        return {
          dayOfWeek: readNumber(item.dayOfWeek),
          dayName: readString(item.dayName),
          orderCount: readNumber(item.orderCount),
          totalRevenue: readNumber(item.totalRevenue),
          averageOrderValue: readNumber(item.averageOrderValue),
          revenuePercentage: readNumber(item.revenuePercentage),
        };
      })
    : [];

  const heatmap = Array.isArray(result.heatmap)
    ? result.heatmap.map((cell: unknown) => {
        const item = isRecord(cell) ? cell : {};
        return {
          dayOfWeek: readNumber(item.dayOfWeek),
          dayName: readString(item.dayName),
          hourOfDay: readNumber(item.hourOfDay),
          hourLabel: readString(item.hourLabel),
          orderCount: readNumber(item.orderCount),
          totalRevenue: readNumber(item.totalRevenue),
          intensity: readNumber(item.intensity),
        };
      })
    : [];

  const topPeakSlots = Array.isArray(rawInsights.topPeakSlots)
    ? rawInsights.topPeakSlots.map((slot: unknown) => {
        const item = isRecord(slot) ? slot : {};
        return {
          dayName: readString(item.dayName),
          hourLabel: readString(item.hourLabel),
          orderCount: readNumber(item.orderCount),
          totalRevenue: readNumber(item.totalRevenue),
        };
      })
    : [];

  const recommendations = Array.isArray(rawInsights.recommendations)
    ? rawInsights.recommendations.map((r: unknown) => String(r || ""))
    : [];

  return {
    filterInfo: {
      fromDate: readString(rawFilter.fromDate),
      toDate: readString(rawFilter.toDate),
      posId: readNullableString(rawFilter.posId),
      posName: readString(rawFilter.posName) || "Tất cả điểm bán",
      totalOrders: readNumber(rawFilter.totalOrders),
      totalRevenue: readNumber(rawFilter.totalRevenue),
      averageOrderValue: readNumber(rawFilter.averageOrderValue),
    },
    hourlyStats,
    dayOfWeekStats,
    heatmap,
    insights: {
      peakHour: readNumber(rawInsights.peakHour),
      peakHourLabel: readString(rawInsights.peakHourLabel),
      peakHourRevenue: readNumber(rawInsights.peakHourRevenue),
      peakHourOrderCount: readNumber(rawInsights.peakHourOrderCount),
      lowestHour: readNumber(rawInsights.lowestHour),
      lowestHourLabel: readString(rawInsights.lowestHourLabel),
      lowestHourRevenue: readNumber(rawInsights.lowestHourRevenue),
      lowestHourOrderCount: readNumber(rawInsights.lowestHourOrderCount),
      busiestDayOfWeek: readNumber(rawInsights.busiestDayOfWeek),
      busiestDayName: readString(rawInsights.busiestDayName),
      busiestDayRevenue: readNumber(rawInsights.busiestDayRevenue),
      busiestDayOrderCount: readNumber(rawInsights.busiestDayOrderCount),
      quietestDayOfWeek: readNumber(rawInsights.quietestDayOfWeek),
      quietestDayName: readString(rawInsights.quietestDayName),
      quietestDayRevenue: readNumber(rawInsights.quietestDayRevenue),
      quietestDayOrderCount: readNumber(rawInsights.quietestDayOrderCount),
      topPeakSlots,
      recommendations,
    },
  };
};

export const salesAnalyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // NCL-18-CN-001: Phân tích giờ cao điểm và ngày bán chạy
    getPeakHoursAndDaysAnalysis: builder.query<
      IPeakHoursAndDaysResponse,
      IPeakHoursAndDaysParams | void
    >({
      query: (params) => ({
        url: "/sales-analytics/peak-hours-and-days",
        method: HTTP_METHODS.GET,
        params: {
          fromDate: params?.fromDate || undefined,
          toDate: params?.toDate || undefined,
          posId: params?.posId || undefined,
        },
      }),
      transformResponse: toPeakHoursAndDaysResponse,
      providesTags: [
        { type: API_TAG_TYPES.SALES_ANALYTICS, id: "PEAK_HOURS" },
      ],
    }),

    // NCL-18-CN-002: Dự báo lượng hàng cần nhập (alias trên sales-analytics)
    getPurchaseForecast: builder.query<
      IPageResponse<IPurchaseSuggestion>,
      IPurchaseForecastParams | void
    >({
      query: (params) => ({
        url: "/sales-analytics/purchase-forecast",
        method: HTTP_METHODS.GET,
        params: {
          periodDays: params?.periodDays ?? 28,
          groupId: params?.groupId || undefined,
          page: params?.page ?? 0,
          size: params?.size ?? 10,
        },
      }),
      transformResponse: (response: unknown): IPageResponse<IPurchaseSuggestion> => {
        const rawResult = readResult(response);
        const result = isRecord(rawResult) ? rawResult : {};
        const content = Array.isArray(result.content) ? result.content : [];

        return {
          content: content.map((item: any) => ({
            productId: readString(item?.productId),
            sku: readString(item?.sku),
            productName: readString(item?.productName),
            unit: readString(item?.unit),
            costPrice:
              item?.costPrice !== undefined && item?.costPrice !== null
                ? readNumber(item?.costPrice)
                : undefined,
            stockQuantity: readNumber(item?.stockQuantity),
            minStockQuantity: readNumber(item?.minStockQuantity),
            averageWeeklySales: readNumber(item?.averageWeeklySales),
            totalSoldInPeriod: readNumber(item?.totalSoldInPeriod),
            suggestedQuantity: readNumber(item?.suggestedQuantity),
            calculationRationale: readString(item?.calculationRationale),
            hasPromotion: Boolean(item?.hasPromotion),
            promotionWarning: readNullableString(item?.promotionWarning),
            groupId: readNullableString(item?.groupId),
            groupName: readNullableString(item?.groupName),
            lastSupplierId: readNullableString(item?.lastSupplierId),
            lastSupplierName: readNullableString(item?.lastSupplierName),
            lastSupplierPhone: readNullableString(item?.lastSupplierPhone),
          })),
          pageNumber: readNumber(result.pageNumber),
          pageSize: readNumber(result.pageSize) || 10,
          totalElements: readNumber(result.totalElements),
          totalPages: readNumber(result.totalPages),
          last: result.last !== false,
        };
      },
      providesTags: [
        { type: API_TAG_TYPES.INVENTORY_WARNING, id: "SUGGESTIONS" },
        { type: API_TAG_TYPES.SALES_ANALYTICS, id: "PURCHASE_FORECAST" },
      ],
    }),

    // NCL-18-CN-003: Cảnh báo hàng bán chậm và tồn lâu
    getSlowMovingProducts: builder.query<
      ISlowMovingProductListResponse,
      ISlowMovingParams | void
    >({
      query: (params) => ({
        url: "/sales-analytics/slow-moving-products",
        method: HTTP_METHODS.GET,
        params: {
          thresholdDays: params?.thresholdDays ?? 60,
          groupId: params?.groupId || undefined,
          search: params?.search || undefined,
          page: params?.page ?? 0,
          size: params?.size ?? 10,
        },
      }),
      transformResponse: toSlowMovingProductListResponse,
      providesTags: [
        { type: API_TAG_TYPES.SALES_ANALYTICS, id: "SLOW_MOVING" },
        { type: API_TAG_TYPES.INVENTORY_WARNING, id: "SLOW_MOVING" },
      ],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useGetPeakHoursAndDaysAnalysisQuery,
  useLazyGetPeakHoursAndDaysAnalysisQuery,
  useGetPurchaseForecastQuery,
  useLazyGetPurchaseForecastQuery,
  useGetSlowMovingProductsQuery,
  useLazyGetSlowMovingProductsQuery,
} = salesAnalyticsApi;
