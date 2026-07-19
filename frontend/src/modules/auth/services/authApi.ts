import { baseApi } from "@/stores/baseApi";
import { API_CONFIG, HTTP_METHODS } from "@/constants/api";
import {
  AUTH_API_ENDPOINTS,
  AUTH_API_RESPONSE_FIELDS,
  AUTH_MESSAGES,
} from "@/constants/auth";
import type {
  IAuthResponse,
  ILoginRequest,
  IRegisterRequest,
} from "../types/IAuth";
import { isRecord } from "@/utils/typeGuards";

const getRequiredString = (
  record: Record<string, unknown>,
  field: string,
): string => {
  const value = record[field];

  if (typeof value !== "string") {
    throw new Error(AUTH_MESSAGES.missingResponseField(field));
  }

  return value;
};

const getOptionalString = (
  record: Record<string, unknown>,
  field: string,
): string => {
  const value = record[field];
  return typeof value === "string" ? value : "";
};

const transformAuthResponse = (response: unknown): IAuthResponse => {
  if (!isRecord(response)) {
    throw new Error(AUTH_MESSAGES.INVALID_RESPONSE);
  }

  const result = response[AUTH_API_RESPONSE_FIELDS.RESULT];
  if (!isRecord(result)) {
    throw new Error(AUTH_MESSAGES.INVALID_RESPONSE);
  }

  const data = result;
  const householdId = getOptionalString(
    data,
    AUTH_API_RESPONSE_FIELDS.HOUSEHOLD_ID,
  );

  return {
    token: getOptionalString(data, AUTH_API_RESPONSE_FIELDS.TOKEN),
    user: {
      id: getRequiredString(data, AUTH_API_RESPONSE_FIELDS.USER_ID),
      username: getRequiredString(
        data,
        AUTH_API_RESPONSE_FIELDS.USERNAME,
      ),
      fullName: getRequiredString(
        data,
        AUTH_API_RESPONSE_FIELDS.FULL_NAME,
      ),
      roleId: getRequiredString(data, AUTH_API_RESPONSE_FIELDS.ROLE_CODE),
      household: householdId
        ? {
            id: householdId,
            name: getOptionalString(
              data,
              AUTH_API_RESPONSE_FIELDS.HOUSEHOLD_NAME,
            ),
            taxCode: getOptionalString(
              data,
              AUTH_API_RESPONSE_FIELDS.TAX_CODE,
            ),
            phoneNumber: getOptionalString(
              data,
              AUTH_API_RESPONSE_FIELDS.HOUSEHOLD_PHONE,
            ),
            address: getOptionalString(
              data,
              AUTH_API_RESPONSE_FIELDS.HOUSEHOLD_ADDRESS,
            ),
          }
        : null,
    },
  };
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<IAuthResponse, ILoginRequest>({
      query: (credentials) => ({
        url: AUTH_API_ENDPOINTS.LOGIN,
        method: HTTP_METHODS.POST,
        body: credentials,
      }),
      transformResponse: transformAuthResponse,
    }),
    register: builder.mutation<IAuthResponse, IRegisterRequest>({
      query: (userData) => ({
        url: AUTH_API_ENDPOINTS.REGISTER,
        method: HTTP_METHODS.POST,
        body: userData,
      }),
      transformResponse: transformAuthResponse,
    }),
  }),
  overrideExisting: API_CONFIG.OVERRIDE_EXISTING_ENDPOINTS,
});

export const { useLoginMutation, useRegisterMutation } = authApi;
