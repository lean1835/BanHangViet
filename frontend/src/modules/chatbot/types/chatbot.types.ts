export interface IChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  actionType?: string;
  actionLabel?: string;
  actionUrl?: string;
  geminiPowered?: boolean;
  activeModel?: string;
  dataPayload?: Record<string, unknown>;
  suggestedQuestions?: string[];
  isError?: boolean;
}

export interface IChatHistoryItem {
  role: string;
  text: string;
}

export interface IChatbotMessageRequest {
  message: string;
  currentScreen?: string;
  history?: IChatHistoryItem[];
}

export interface IChatbotMessageResponse {
  reply: string;
  actionType?: string;
  actionLabel?: string;
  actionUrl?: string;
  geminiPowered: boolean;
  activeModel?: string;
  dataPayload?: Record<string, unknown>;
  suggestedQuestions?: string[];
}

export interface IChatbotSuggestionItem {
  prompt: string;
  icon?: string;
  actionUrl?: string;
}

export interface IChatbotSuggestionCategory {
  category: string;
  description?: string;
  suggestions?: string[];
  items?: IChatbotSuggestionItem[];
}
