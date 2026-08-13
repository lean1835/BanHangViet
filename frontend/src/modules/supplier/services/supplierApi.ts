import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import {
  SUPPLIER_API_ENDPOINTS,
  SUPPLIER_API_TAG_IDS,
  SUPPLIER_STATUS,
} from "@/constants/supplier";
import type {
  ISupplier,
  ISupplierCreatePayload,
  ISupplierGroup,
  ISupplierGroupPayload,
  ISupplierQueryParams,
  ISupplierUpdatePayload,
  TSupplierStatus,
} from "@/modules/supplier/types/ISupplier";
import { baseApi } from "@/stores/baseApi";
import { isRecord } from "@/utils/typeGuards";

const readString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const readNullableString = (value: unknown): string | null => {
  const parsedValue = readString(value);
  return parsedValue || null;
};

const readNumber = (value: unknown): number => {
  const parsedValue = Number(value ?? 0);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const readStatus = (value: unknown): TSupplierStatus =>
  value === SUPPLIER_STATUS.INACTIVE
    ? SUPPLIER_STATUS.INACTIVE
    : SUPPLIER_STATUS.ACTIVE;

const readResult = (response: unknown): unknown =>
  isRecord(response) ? response.result : undefined;

const toSupplier = (value: unknown): ISupplier => {
  const supplier = isRecord(value) ? value : {};

  return {
    id: readString(supplier.id),
    householdId: readString(supplier.householdId),
    supplierCode: readString(supplier.supplierCode),
    name: readString(supplier.name),
    phoneNumber: readString(supplier.phoneNumber),
    email: readString(supplier.email),
    address: readString(supplier.address),
    taxCode: readString(supplier.taxCode),
    note: readString(supplier.note),
    groupId: readNullableString(supplier.groupId),
    groupName: readString(supplier.groupName),
    status: readStatus(supplier.status),
    initialDebt: readNumber(supplier.initialDebt),
    currentDebt: readNumber(supplier.currentDebt),
    createdAt: readString(supplier.createdAt),
    updatedAt: readString(supplier.updatedAt),
  };
};

const toSupplierGroup = (value: unknown): ISupplierGroup => {
  const group = isRecord(value) ? value : {};

  return {
    id: readString(group.id),
    householdId: readString(group.householdId),
    name: readString(group.name),
    note: readString(group.note),
    createdAt: readString(group.createdAt),
    updatedAt: readString(group.updatedAt),
  };
};

export const supplierApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<ISupplier[], ISupplierQueryParams | void>({
      query: (params) => ({
        url: SUPPLIER_API_ENDPOINTS.SUPPLIERS,
        method: HTTP_METHODS.GET,
        params: params || undefined,
      }),
      transformResponse: (response: unknown): ISupplier[] => {
        const result = readResult(response);
        return Array.isArray(result) ? result.map(toSupplier) : [];
      },
      providesTags: (result) => [
        ...(result ?? []).map(({ id }) => ({
          type: API_TAG_TYPES.SUPPLIER,
          id,
        })),
        { type: API_TAG_TYPES.SUPPLIER, id: SUPPLIER_API_TAG_IDS.LIST },
      ],
    }),
    createSupplier: builder.mutation<ISupplier, ISupplierCreatePayload>({
      query: (body) => ({
        url: SUPPLIER_API_ENDPOINTS.SUPPLIERS,
        method: HTTP_METHODS.POST,
        body,
      }),
      transformResponse: (response: unknown): ISupplier =>
        toSupplier(readResult(response)),
      invalidatesTags: [
        { type: API_TAG_TYPES.SUPPLIER, id: SUPPLIER_API_TAG_IDS.LIST },
      ],
    }),
    updateSupplier: builder.mutation<
      ISupplier,
      { id: string; data: ISupplierUpdatePayload }
    >({
      query: ({ id, data }) => ({
        url: SUPPLIER_API_ENDPOINTS.SUPPLIER_BY_ID(id),
        method: HTTP_METHODS.PUT,
        body: data,
      }),
      transformResponse: (response: unknown): ISupplier =>
        toSupplier(readResult(response)),
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAG_TYPES.SUPPLIER, id: SUPPLIER_API_TAG_IDS.LIST },
        { type: API_TAG_TYPES.SUPPLIER, id },
      ],
    }),
    deleteSupplier: builder.mutation<void, string>({
      query: (id) => ({
        url: SUPPLIER_API_ENDPOINTS.SUPPLIER_BY_ID(id),
        method: HTTP_METHODS.DELETE,
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.SUPPLIER, id: SUPPLIER_API_TAG_IDS.LIST },
        { type: API_TAG_TYPES.SUPPLIER, id },
      ],
    }),
    getSupplierGroups: builder.query<ISupplierGroup[], void>({
      query: () => ({
        url: SUPPLIER_API_ENDPOINTS.GROUPS,
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown): ISupplierGroup[] => {
        const result = readResult(response);
        return Array.isArray(result) ? result.map(toSupplierGroup) : [];
      },
      providesTags: (result) => [
        ...(result ?? []).map(({ id }) => ({
          type: API_TAG_TYPES.SUPPLIER_GROUP,
          id,
        })),
        {
          type: API_TAG_TYPES.SUPPLIER_GROUP,
          id: SUPPLIER_API_TAG_IDS.LIST,
        },
      ],
    }),
    createSupplierGroup: builder.mutation<
      ISupplierGroup,
      ISupplierGroupPayload
    >({
      query: (body) => ({
        url: SUPPLIER_API_ENDPOINTS.GROUPS,
        method: HTTP_METHODS.POST,
        body,
      }),
      transformResponse: (response: unknown): ISupplierGroup =>
        toSupplierGroup(readResult(response)),
      invalidatesTags: [
        {
          type: API_TAG_TYPES.SUPPLIER_GROUP,
          id: SUPPLIER_API_TAG_IDS.LIST,
        },
      ],
    }),
    updateSupplierGroup: builder.mutation<
      ISupplierGroup,
      { id: string; data: ISupplierGroupPayload }
    >({
      query: ({ id, data }) => ({
        url: SUPPLIER_API_ENDPOINTS.GROUP_BY_ID(id),
        method: HTTP_METHODS.PUT,
        body: data,
      }),
      transformResponse: (response: unknown): ISupplierGroup =>
        toSupplierGroup(readResult(response)),
      invalidatesTags: (_result, _error, { id }) => [
        {
          type: API_TAG_TYPES.SUPPLIER_GROUP,
          id: SUPPLIER_API_TAG_IDS.LIST,
        },
        { type: API_TAG_TYPES.SUPPLIER_GROUP, id },
        { type: API_TAG_TYPES.SUPPLIER, id: SUPPLIER_API_TAG_IDS.LIST },
      ],
    }),
    deleteSupplierGroup: builder.mutation<void, string>({
      query: (id) => ({
        url: SUPPLIER_API_ENDPOINTS.GROUP_BY_ID(id),
        method: HTTP_METHODS.DELETE,
      }),
      invalidatesTags: (_result, _error, id) => [
        {
          type: API_TAG_TYPES.SUPPLIER_GROUP,
          id: SUPPLIER_API_TAG_IDS.LIST,
        },
        { type: API_TAG_TYPES.SUPPLIER_GROUP, id },
        { type: API_TAG_TYPES.SUPPLIER, id: SUPPLIER_API_TAG_IDS.LIST },
      ],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useGetSupplierGroupsQuery,
  useCreateSupplierGroupMutation,
  useUpdateSupplierGroupMutation,
  useDeleteSupplierGroupMutation,
} = supplierApi;
