import React from "react";
import { HelpCircle } from "lucide-react";
import type { ISupportChannel } from "../types/faqSupport.types";

interface FaqEmptyStateProps {
  keyword?: string;
  onClearKeyword?: () => void;
  onSelectSuggestion?: (suggestion: string) => void;
  supportChannels?: ISupportChannel[];
}

const COMMON_SUGGESTIONS = [
  "hóa đơn treo",
  "sửa hóa đơn",
  "quên mật khẩu",
  "trả hàng hoàn tiền",
  "sao lưu dữ liệu",
];

export const FaqEmptyState: React.FC<FaqEmptyStateProps> = ({
  keyword,
  onSelectSuggestion,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white p-8 sm:p-12 text-center shadow-xs min-h-[380px]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 mb-3.5">
        <HelpCircle className="h-6 w-6" />
      </div>

      <h3 className="text-base font-bold text-slate-800 mb-1.5">
        {keyword
          ? `Không tìm thấy câu hỏi phù hợp với "${keyword}"`
          : "Chưa có câu hỏi nào trong danh mục này"}
      </h3>

      <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 font-normal leading-relaxed">
        Hãy thử chọn danh mục khác, thay đổi từ khóa hoặc xem thông tin liên hệ trực tiếp ở cột bên cạnh để được hỗ trợ tức thì.
      </p>

      {/* Gợi ý các từ khóa phổ biến */}
      {onSelectSuggestion && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-md">
          <span className="text-xs text-slate-400 font-medium mr-1">Gợi ý từ khóa:</span>
          {COMMON_SUGGESTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onSelectSuggestion(item)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-normal text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
