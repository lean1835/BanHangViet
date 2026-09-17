export type TFaqCategory = "INVOICE" | "SALES" | "ACCOUNT" | "DATA";

export type TSupportChannelType =
  | "HOTLINE"
  | "ZALO"
  | "EMAIL"
  | "WORKING_HOURS"
  | "PORTAL";

export interface IFaqItem {
  id: string;
  category: TFaqCategory;
  categoryDisplayName?: string;
  question: string;
  answer: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  keywords?: string | null;
  displayOrder?: number;
  viewCount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ISupportChannel {
  id: string;
  channelType: TSupportChannelType;
  channelTypeDisplayName?: string;
  channelName: string;
  contactValue: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface ISupportInfo {
  systemVersion: string;
  householdId: string;
  householdCode: string;
  householdName: string;
  taxCode: string;
  representativeName: string;
  phoneNumber: string;
  currentUsername: string;
  currentUserFullName: string;
  currentUserRole: string;
  quickSupportSummary: string;
  supportChannels: ISupportChannel[];
}

export interface IFaqCategoryGroup {
  category: TFaqCategory;
  categoryDisplayName: string;
  totalQuestions: number;
  questions: IFaqItem[];
}

export interface IGetFaqsParams {
  keyword?: string;
  category?: TFaqCategory;
  page?: number;
  size?: number;
}

export interface IApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export interface IPageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const FAQ_CATEGORY_LABELS: Record<TFaqCategory, string> = {
  INVOICE: "Hóa đơn",
  SALES: "Bán hàng",
  ACCOUNT: "Tài khoản",
  DATA: "Dữ liệu",
};
