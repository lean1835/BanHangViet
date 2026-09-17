import React from "react";
import { Receipt, ShoppingBag, UserCheck, Database, Layers } from "lucide-react";
import type { TFaqCategory } from "../types/faqSupport.types";

export type TCategoryTabValue = "ALL" | TFaqCategory;

interface FaqCategoryTabsProps {
  activeTab: TCategoryTabValue;
  onTabChange: (tab: TCategoryTabValue) => void;
  categoryCounts?: Partial<Record<TCategoryTabValue, number>>;
}

interface ICategoryItem {
  id: TCategoryTabValue;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORIES: ICategoryItem[] = [
  { id: "ALL", label: "Tất cả", icon: Layers },
  { id: "INVOICE", label: "Hóa đơn & Thuế", icon: Receipt },
  { id: "SALES", label: "Bán hàng & Ca", icon: ShoppingBag },
  { id: "ACCOUNT", label: "Tài khoản & Quyền", icon: UserCheck },
  { id: "DATA", label: "Dữ liệu & Sao lưu", icon: Database },
];

export const FaqCategoryTabs: React.FC<FaqCategoryTabsProps> = ({
  activeTab,
  onTabChange,
  categoryCounts,
}) => {
  return (
    <div
      className="flex w-full items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Nhóm câu hỏi thường gặp"
    >
      {CATEGORIES.map((cat) => {
        const IconComponent = cat.icon;
        const isActive = activeTab === cat.id;
        const count = categoryCounts?.[cat.id];

        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(cat.id)}
            className={`flex min-h-[38px] shrink-0 items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer select-none ${
              isActive
                ? "bg-blue-600 text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <IconComponent
              className={`h-4 w-4 shrink-0 ${
                isActive ? "text-white" : "text-slate-400"
              }`}
            />
            <span className="whitespace-nowrap">{cat.label}</span>
            {count !== undefined && count > 0 && (
              <span
                className={`ml-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
