import { baseApi } from "../../../stores/baseApi";
import { AuthResponse, RegisterRequest, LoginRequest } from "../types/auth";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: any) => {
        const data = response.result;
        return {
          token: data.token,
          user: {
            id: data.userId,
            username: data.username,
            fullName: data.fullName,
            roleId: data.roleCode,
            household: data.householdId
              ? {
                  id: data.householdId,
                  name: data.householdName || "",
                  taxCode: data.taxCode || "",
                  phoneNumber: data.householdPhone || "",
                  address: data.householdAddress || "",
                }
              : null,
          },
        };
      },
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
      transformResponse: (response: any) => {
        const data = response.result;
        return {
          token: data.token,
          user: {
            id: data.userId,
            username: data.username,
            fullName: data.fullName,
            roleId: data.roleCode,
            household: data.householdId
              ? {
                  id: data.householdId,
                  name: data.householdName || "",
                  taxCode: data.taxCode || "",
                  phoneNumber: data.householdPhone || "",
                  address: data.householdAddress || "",
                }
              : null,
          },
        };
      },
    }),
  }),
  overrideExisting: false,
});

export const { useLoginMutation, useRegisterMutation } = authApi;
