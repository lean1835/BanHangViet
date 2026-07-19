import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, API_TAG_TYPES, HTTP_METHODS } from "@/constants/api";
import {
  EMPLOYEE_API_ENDPOINTS,
  EMPLOYEE_API_RESPONSE_FIELDS,
  EMPLOYEE_API_TAGS,
  EMPLOYEE_MESSAGES,
} from "@/constants/employee";
import type { IEmployee } from "../types/IEmployee";
import { isRecord } from "@/utils/typeGuards";

const getRequiredString = (
  record: Record<string, unknown>,
  field: string,
): string => {
  const value = record[field];

  if (typeof value !== "string") {
    throw new Error(EMPLOYEE_MESSAGES.missingResponseField(field));
  }

  return value;
};

const mapEmployee = (value: unknown): IEmployee => {
  if (!isRecord(value)) {
    throw new Error(EMPLOYEE_MESSAGES.INVALID_EMPLOYEE_DATA);
  }

  const phoneNumber = value[EMPLOYEE_API_RESPONSE_FIELDS.PHONE_NUMBER];

  return {
    id: getRequiredString(value, EMPLOYEE_API_RESPONSE_FIELDS.ID),
    username: getRequiredString(
      value,
      EMPLOYEE_API_RESPONSE_FIELDS.USERNAME,
    ),
    fullName: getRequiredString(
      value,
      EMPLOYEE_API_RESPONSE_FIELDS.FULL_NAME,
    ),
    phoneNumber: typeof phoneNumber === "string" ? phoneNumber : "",
    roleCode: getRequiredString(
      value,
      EMPLOYEE_API_RESPONSE_FIELDS.ROLE_CODE,
    ),
    isActive: value[EMPLOYEE_API_RESPONSE_FIELDS.IS_ACTIVE] !== false,
  };
};

const getResponseResult = (response: unknown): unknown => {
  if (!isRecord(response)) {
    throw new Error(EMPLOYEE_MESSAGES.INVALID_RESPONSE);
  }

  return response[EMPLOYEE_API_RESPONSE_FIELDS.RESULT];
};

export const employeeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllEmployees: builder.query<IEmployee[], void>({
      query: () => ({
        url: EMPLOYEE_API_ENDPOINTS.ROOT,
        method: HTTP_METHODS.GET,
      }),
      transformResponse: (response: unknown): IEmployee[] => {
        const result = getResponseResult(response);
        return Array.isArray(result) ? result.map(mapEmployee) : [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: API_TAG_TYPES.USER,
                id,
              })),
              {
                type: API_TAG_TYPES.USER,
                id: EMPLOYEE_API_TAGS.LIST,
              },
            ]
          : [
              {
                type: API_TAG_TYPES.USER,
                id: EMPLOYEE_API_TAGS.LIST,
              },
            ],
    }),
    createEmployee: builder.mutation<IEmployee, Partial<IEmployee> & { password?: string }>({
      query: (employeeData) => ({
        url: EMPLOYEE_API_ENDPOINTS.ROOT,
        method: HTTP_METHODS.POST,
        body: {
          username: employeeData.username,
          password: employeeData.password,
          fullName: employeeData.fullName,
          phoneNumber: employeeData.phoneNumber,
          roleCode: employeeData.roleCode,
        },
      }),
      transformResponse: (response: unknown): IEmployee =>
        mapEmployee(getResponseResult(response)),
      invalidatesTags: [
        {
          type: API_TAG_TYPES.USER,
          id: EMPLOYEE_API_TAGS.LIST,
        },
      ],
    }),
    updateEmployee: builder.mutation<IEmployee, { id: string; data: Partial<IEmployee> }>({
      query: ({ id, data }) => ({
        url: EMPLOYEE_API_ENDPOINTS.BY_ID(id),
        method: HTTP_METHODS.PUT,
        body: {
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          roleCode: data.roleCode,
          isActive: data.isActive,
        },
      }),
      transformResponse: (response: unknown): IEmployee =>
        mapEmployee(getResponseResult(response)),
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAG_TYPES.USER, id: EMPLOYEE_API_TAGS.LIST },
        { type: API_TAG_TYPES.USER, id },
      ],
    }),
    deleteEmployee: builder.mutation<void, string>({
      query: (id) => ({
        url: EMPLOYEE_API_ENDPOINTS.BY_ID(id),
        method: HTTP_METHODS.DELETE,
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAG_TYPES.USER, id: EMPLOYEE_API_TAGS.LIST },
        { type: API_TAG_TYPES.USER, id },
      ],
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const {
  useGetAllEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} = employeeApi;
