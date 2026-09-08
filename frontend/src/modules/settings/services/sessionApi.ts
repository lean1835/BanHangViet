import { baseApi } from "@/stores/baseApi";
import type {
  IUserSession,
  ISessionSettings,
  IUpdateSessionSettingsRequest,
} from "../types/IUserSession";

export interface IApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export const sessionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSessions: builder.query<IApiResponse<IUserSession[]>, void>({
      query: () => ({
        url: "/sessions",
        method: "GET",
      }),
      providesTags: (result) =>
        result?.result
          ? [
              ...result.result.map(({ id }) => ({
                type: "UserSession" as const,
                id,
              })),
              { type: "UserSession", id: "LIST" },
            ]
          : [{ type: "UserSession", id: "LIST" }],
    }),

    revokeSession: builder.mutation<
      IApiResponse<void>,
      { sessionId: string; reason?: string }
    >({
      query: ({ sessionId, reason }) => ({
        url: `/sessions/${sessionId}/revoke`,
        method: "POST",
        body: reason ? { reason } : {},
      }),
      invalidatesTags: [{ type: "UserSession", id: "LIST" }],
    }),

    revokeAllSessionsForUser: builder.mutation<
      IApiResponse<void>,
      { userId: string; reason?: string }
    >({
      query: ({ userId, reason }) => ({
        url: `/sessions/users/${userId}/revoke-all`,
        method: "POST",
        body: reason ? { reason } : {},
      }),
      invalidatesTags: [{ type: "UserSession", id: "LIST" }],
    }),

    getSessionSettings: builder.query<IApiResponse<ISessionSettings>, void>({
      query: () => ({
        url: "/sessions/settings",
        method: "GET",
      }),
      providesTags: [{ type: "SessionSettings", id: "SETTINGS" }],
    }),

    updateSessionSettings: builder.mutation<
      IApiResponse<ISessionSettings>,
      IUpdateSessionSettingsRequest
    >({
      query: (body) => ({
        url: "/sessions/settings",
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "SessionSettings", id: "SETTINGS" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useRevokeAllSessionsForUserMutation,
  useGetSessionSettingsQuery,
  useUpdateSessionSettingsMutation,
} = sessionApi;
