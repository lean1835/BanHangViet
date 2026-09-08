import { baseApi } from "@/stores/baseApi";
import type { IApiResponse } from "@/types/api";
import { API_TAG_TYPES } from "@/constants/api";
import type {
  IUserProfileResponse,
  IUpdateProfileRequest,
  IChangePasswordRequest,
  IChangePasswordResponse,
  IUpdatePhoneSendOtpRequest,
  IUpdatePhoneSendOtpResponse,
  IUpdatePhoneVerifyOtpRequest,
} from "../types/IProfile";

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<IApiResponse<IUserProfileResponse>, void>({
      query: () => ({
        url: "/profile",
        method: "GET",
      }),
      providesTags: [API_TAG_TYPES.USER],
    }),

    updateProfile: builder.mutation<IApiResponse<IUserProfileResponse>, IUpdateProfileRequest>({
      query: (body) => ({
        url: "/profile",
        method: "PUT",
        body,
      }),
      invalidatesTags: [API_TAG_TYPES.USER],
    }),

    changePassword: builder.mutation<IApiResponse<IChangePasswordResponse>, IChangePasswordRequest>({
      query: (body) => ({
        url: "/profile/change-password",
        method: "POST",
        body,
      }),
      invalidatesTags: [API_TAG_TYPES.USER, API_TAG_TYPES.USER_SESSION],
    }),

    sendUpdatePhoneOtp: builder.mutation<IApiResponse<IUpdatePhoneSendOtpResponse>, IUpdatePhoneSendOtpRequest>({
      query: (body) => ({
        url: "/profile/phone/send-otp",
        method: "POST",
        body,
      }),
    }),

    verifyAndUpdatePhone: builder.mutation<IApiResponse<IUserProfileResponse>, IUpdatePhoneVerifyOtpRequest>({
      query: (body) => ({
        url: "/profile/phone/verify-otp",
        method: "POST",
        body,
      }),
      invalidatesTags: [API_TAG_TYPES.USER],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useSendUpdatePhoneOtpMutation,
  useVerifyAndUpdatePhoneMutation,
} = profileApi;
