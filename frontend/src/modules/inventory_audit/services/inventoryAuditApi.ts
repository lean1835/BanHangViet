import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import { INVENTORY_AUDIT_API_ENDPOINTS } from "@/constants/inventoryAudit";
import type {
  IInventoryAudit,
  IInventoryAuditDetail,
  IInventoryAuditDetailInfo,
  ICreateInventoryAuditPayload,
  IPendingOrderCheck,
} from "../types/IInventoryAudit";
import type { IPageResponse } from "@/types/api";
import { isRecord } from "@/utils/typeGuards";

const readString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const readNullableString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const readNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const readResult = (response: unknown): unknown =>
  isRecord(response) ? response.result : undefined;

const toInventoryAudit = (value: unknown): IInventoryAudit => {
  const item = isRecord(value) ? value : {};
  return {
    id: readString(item.id),
    auditNumber: readString(item.auditNumber),
    auditDate: readString(item.auditDate),
    status: readString(item.status) || "COMPLETED",
    totalItems: readNumber(item.totalItems),
    totalDifferenceQty: readNumber(item.totalDifferenceQty),
    createdByUserId: readNullableString(item.createdByUserId),
    createdByUserName: readNullableString(item.createdByUserName),
    notes: readNullableString(item.notes),
    createdAt: readString(item.createdAt),
  };
};

const toInventoryAuditDetail = (value: unknown): IInventoryAuditDetail => {
  const item = isRecord(value) ? value : {};
  return {
    id: readString(item.id),
    productId: readString(item.productId),
    productSku: readString(item.productSku),
    productName: readString(item.productName),
    unit: readString(item.unit) || "Cái",
    systemQuantity: readNumber(item.systemQuantity),
    actualQuantity: readNumber(item.actualQuantity),
    differenceQuantity: readNumber(item.differenceQuantity),
    reason: readNullableString(item.reason),
  };
};

const toInventoryAuditDetailInfo = (
  value: unknown,
): IInventoryAuditDetailInfo => {
  const item = isRecord(value) ? value : {};
  const details = Array.isArray(item.details) ? item.details : [];
  return {
    id: readString(item.id),
    auditNumber: readString(item.auditNumber),
    auditDate: readString(item.auditDate),
    status: readString(item.status) || "COMPLETED",
    totalItems: readNumber(item.totalItems),
    totalDifferenceQty: readNumber(item.totalDifferenceQty),
    createdByUserId: readNullableString(item.createdByUserId),
    createdByUserName: readNullableString(item.createdByUserName),
    notes: readNullableString(item.notes),
    createdAt: readString(item.createdAt),
    details: details.map(toInventoryAuditDetail),
  };
};

const toInventoryAuditPage = (
  response: unknown,
): IPageResponse<IInventoryAudit> => {
  const rawResult = readResult(response);
  const result = isRecord(rawResult) ? rawResult : {};
  const content = Array.isArray(result.content) ? result.content : [];

  return {
    content: content.map(toInventoryAudit),
    pageNumber: readNumber(result.pageNumber),
    pageSize: readNumber(result.pageSize) || 10,
    totalElements: readNumber(result.totalElements),
    totalPages: readNumber(result.totalPages) || 1,
    last: result.last !== false,
  };
};

const toPendingOrderCheck = (value: unknown): IPendingOrderCheck => {
  const item = isRecord(value) ? value : {};
  const numbers = Array.isArray(item.pendingOrderNumbers)
    ? item.pendingOrderNumbers.map((n) => String(n))
    : [];
  return {
    hasPendingOrders: Boolean(item.hasPendingOrders),
    pendingOrderCount: readNumber(item.pendingOrderCount),
    pendingOrderNumbers: numbers,
    warningMessage: readString(item.warningMessage),
  };
};

export const inventoryAuditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInventoryAudits: builder.query<
      IPageResponse<IInventoryAudit>,
      { page?: number; size?: number } | void
    >({
      query: (params) => ({
        url: INVENTORY_AUDIT_API_ENDPOINTS.AUDITS,
        method: HTTP_METHODS.GET,
        params: params || {},
      }),
      transformResponse: toInventoryAuditPage,
      providesTags: (result) =>
        result?.content
          ? [
              ...result.content.map(({ id }) => ({
                type: API_TAG_TYPES.INVENTORY_AUDIT,
                id,
              })),
              { type: API_TAG_TYPES.INVENTORY_AUDIT, id: "LIST" },
            ]
          : [{ type: API_TAG_TYPES.INVENTORY_AUDIT, id: "LIST" }],
    }),

    getInventoryAuditById: builder.query<IInventoryAuditDetailInfo, string>({
      query: (id) => ({
        url: INVENTORY_AUDIT_API_ENDPOINTS.AUDIT_BY_ID(id),
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown): IInventoryAuditDetailInfo =>
        toInventoryAuditDetailInfo(readResult(response)),
      providesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.INVENTORY_AUDIT, id },
      ],
    }),

    createInventoryAudit: builder.mutation<
      IInventoryAudit,
      ICreateInventoryAuditPayload
    >({
      query: (body) => ({
        url: INVENTORY_AUDIT_API_ENDPOINTS.AUDITS,
        method: HTTP_METHODS.POST,
        body,
      }),
      transformResponse: (response: unknown): IInventoryAudit =>
        toInventoryAudit(readResult(response)),
      invalidatesTags: [
        { type: API_TAG_TYPES.INVENTORY_AUDIT, id: "LIST" },
        { type: API_TAG_TYPES.PRODUCT, id: "LIST" },
      ],
    }),

    checkPendingOrders: builder.query<IPendingOrderCheck, void>({
      query: () => ({
        url: INVENTORY_AUDIT_API_ENDPOINTS.CHECK_PENDING_ORDERS,
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown): IPendingOrderCheck =>
        toPendingOrderCheck(readResult(response)),
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useGetInventoryAuditsQuery,
  useGetInventoryAuditByIdQuery,
  useCreateInventoryAuditMutation,
  useCheckPendingOrdersQuery,
  useLazyCheckPendingOrdersQuery,
} = inventoryAuditApi;
