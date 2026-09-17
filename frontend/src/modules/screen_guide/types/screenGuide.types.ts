/**
 * Định nghĩa các kiểu dữ liệu cho chức năng Hướng dẫn ngắn tại chỗ theo từng màn hình (NCL-19-CN-003)
 * Khớp 100% với DTOs của Spring Boot Backend
 */

export interface IScreenGuideFaq {
  question: string;
  answer: string;
}

export interface IScreenGuideStep {
  id?: string;
  stepNumber: number;
  title: string;
  content: string;
  targetElementSelector?: string | null;
  buttonLabel?: string | null;
  imageUrl?: string | null;
  details?: string[];
  tips?: string;
  badge?: string;
}

export interface IScreenGuideResponse {
  id: string;
  screenCode: string;
  screenName: string;
  description?: string | null;
  actionUrl?: string | null;
  targetRole?: string | null;
  viewCount: number;
  isActive: boolean;
  totalSteps: number;
  steps: IScreenGuideStep[];
  faqs?: IScreenGuideFaq[];
  updatedAt?: string | null;
}

export interface ITrackScreenGuideViewRequest {
  durationSeconds: number;
  completed: boolean;
}

export interface IContextualGuideResponse {
  errorCode: number;
  actionUrl: string | null;
  guideScreenCode: string | null;
  guideScreenName: string | null;
  suggestedAction: string;
}

export interface IScreenGuideTopViewedResponse {
  screenCode: string;
  screenName: string;
  actionUrl?: string | null;
  targetRole?: string | null;
  totalViews: number;
  recent7DaysViews: number;
  averageDurationSeconds: number;
  completionRatePercentage: number;
}

export interface IScreenGuideSummaryResponse {
  id: string;
  screenCode: string;
  screenName: string;
  description?: string | null;
  actionUrl?: string | null;
  targetRole?: string | null;
  viewCount: number;
  isActive: boolean;
  stepCount: number;
  updatedAt?: string | null;
}

export interface IGetAllScreenGuidesParams {
  search?: string;
  targetRole?: string;
  page?: number;
  size?: number;
}
