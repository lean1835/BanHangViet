import React from "react";
import { ChevronDown, Eye, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { IFaqItem } from "../types/faqSupport.types";
import { FAQ_CATEGORY_LABELS } from "../types/faqSupport.types";

interface FaqAccordionItemProps {
  item: IFaqItem;
  isOpen: boolean;
  onToggle: () => void;
}

export const FaqAccordionItem: React.FC<FaqAccordionItemProps> = ({
  item,
  isOpen,
  onToggle,
}) => {
  const navigate = useNavigate();

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.actionUrl) {
      navigate(item.actionUrl);
    }
  };

  const categoryLabel =
    item.categoryDisplayName || FAQ_CATEGORY_LABELS[item.category] || item.category;

  return (
    <div
      className={`rounded-xl border transition-all duration-150 overflow-hidden ${
        isOpen
          ? "border-blue-200 bg-white shadow-xs"
          : "border-slate-200/80 bg-white hover:border-slate-300"
      }`}
    >
      {/* Header câu hỏi - Bấm để đóng/mở */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-start justify-between gap-3.5 p-4 text-left cursor-pointer transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="rounded bg-slate-100 border border-slate-200/70 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {categoryLabel}
            </span>
            {item.viewCount !== undefined && item.viewCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-normal text-slate-400">
                <Eye className="h-3 w-3" />
                <span>{item.viewCount} lượt xem</span>
              </span>
            )}
          </div>
          <h3
            className={`text-sm font-semibold transition-colors leading-snug ${
              isOpen ? "text-blue-700" : "text-slate-800"
            }`}
          >
            {item.question}
          </h3>
        </div>

        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 ${
            isOpen
              ? "bg-blue-50 text-blue-600 rotate-180"
              : "bg-slate-50 text-slate-400 hover:bg-slate-100"
          }`}
        >
          <ChevronDown className="h-4 w-4" />
        </div>
      </button>

      {/* Nội dung câu trả lời */}
      {isOpen && (
        <div className="border-t border-slate-100 bg-slate-50/40 p-4">
          <div className="text-xs sm:text-sm leading-relaxed text-slate-600 whitespace-pre-line font-normal">
            {item.answer}
          </div>

          {/* Nút điều hướng mở màn hình xử lý liên quan */}
          {item.actionUrl && (
            <div className="mt-3.5 pt-3 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-normal text-slate-400">
                Cần thao tác ngay trên hệ thống?
              </span>
              <button
                type="button"
                onClick={handleActionClick}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-98 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs transition-colors cursor-pointer"
              >
                <span>{item.actionLabel || "Mở màn hình xử lý"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
