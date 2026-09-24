import { baseApi } from "@/stores/baseApi";
import type { IApiResponse } from "@/types/api";
import type {
  IChatbotMessageRequest,
  IChatbotMessageResponse,
  IChatbotSuggestionCategory,
} from "../types/chatbot.types";

export const chatbotApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendChatbotMessage: builder.mutation<
      IApiResponse<IChatbotMessageResponse>,
      IChatbotMessageRequest
    >({
      query: (body) => ({
        url: "/chatbot/message",
        method: "POST",
        body,
      }),
    }),

    getChatbotQuickSuggestions: builder.query<
      IApiResponse<IChatbotSuggestionCategory[]>,
      string | void
    >({
      query: (screen) => {
        const url = screen
          ? `/chatbot/quick-suggestions?screen=${encodeURIComponent(screen)}`
          : "/chatbot/quick-suggestions";
        return url;
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useSendChatbotMessageMutation,
  useGetChatbotQuickSuggestionsQuery,
} = chatbotApi;
